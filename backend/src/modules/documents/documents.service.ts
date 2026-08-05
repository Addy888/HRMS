import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { LocalStorageService } from './storage/local-storage.service.js';
import { VerifyDocumentDto, QueryDocumentDto, DocumentVerificationAction } from './dto/document.dto.js';
import { OnboardingStatus } from '../../common/constants/index.js';
import { NotificationService } from '../notifications/notification.service.js';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: LocalStorageService,
    private notificationService: NotificationService,
  ) {}

  // Helper to map document types to category names
  private getCategoryNameForType(type: string): string {
    const uppercaseType = type.toUpperCase();
    
    const categories: Record<string, string[]> = {
      PERSONAL: ['PHOTO', 'RESUME', 'CV'],
      GOVERNMENT: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'],
      EDUCATIONAL: ['10TH_MARKSHEET', '12TH_MARKSHEET', 'DIPLOMA_CERTIFICATE', 'GRADUATION_DEGREE', 'POST_GRADUATION_DEGREE', 'PROFESSIONAL_CERTIFICATIONS'],
      PROFESSIONAL: ['OFFER_LETTER', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER', 'SALARY_SLIP', 'INTERNSHIP_CERTIFICATE'],
    };

    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(uppercaseType)) return category;
    }
    return 'OTHER';
  }

  async getOrCreateCategory(name: string, tx: any) {
    let cat = await tx.documentCategory.findUnique({ where: { name } });
    if (!cat) {
      cat = await tx.documentCategory.create({ data: { name } });
    }
    return cat;
  }

  async uploadDocument(
    userId: string,
    type: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    fileSize: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Validate File Size (10MB Limit)
    if (fileSize > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 10 MB limit');
    }

    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const catName = this.getCategoryNameForType(type);

    return this.prisma.$transaction(async (tx) => {
      const category = await this.getOrCreateCategory(catName, tx);

      // Check for duplicate uploads (if active document already exists for this type)
      const existingDoc = await tx.document.findFirst({
        where: { employeeId: employee.id, type: type.toUpperCase() },
      });

      if (existingDoc) {
        throw new BadRequestException(`Document of type ${type} already exists. Please use the replace endpoint instead.`);
      }

      // Upload file physically
      const uploadResult = await this.storageService.uploadFile(
        fileBuffer,
        originalName,
        mimeType,
        'documents',
      );

      // Create new document record
      const doc = await tx.document.create({
        data: {
          employeeId: employee.id,
          type: type.toUpperCase(),
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          status: 'PENDING',
          categoryId: category.id,
        },
      });

      // Save initial version
      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          version: 1,
        },
      });

      // Log Audit
      await tx.documentAuditLog.create({
        data: {
          documentId: doc.id,
          userId,
          action: 'UPLOAD',
          details: `Uploaded new ${type} document (v1)`,
          ipAddress,
          userAgent,
        },
      });

      // Create Notification (fire-and-forget)
      this.notificationService.createNotification([userId], {
        title: 'Document Uploaded',
        description: `Your ${type.replace(/_/g, ' ')} has been uploaded and is pending HR verification.`,
        type: 'document.uploaded',
        module: 'DOCUMENT',
        priority: 'LOW',
        icon: 'upload',
        actionUrl: '/employee/documents',
      }).catch(() => {});

      return doc;
    });
  }

  async replaceDocument(
    userId: string,
    documentId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    fileSize: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (fileSize > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 10 MB limit');
    }

    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: true },
    });

    if (!doc) throw new NotFoundException('Document not found');
    if (doc.employeeId !== employee.id) {
      throw new BadRequestException('Unauthorized access to this document');
    }

    // Replace is only allowed if PENDING or RE_UPLOAD_REQUIRED
    if (doc.status === 'APPROVED') {
      throw new BadRequestException('Approved documents cannot be modified or replaced.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete old file
      await this.storageService.deleteFile(doc.fileUrl);

      // Upload new file
      const uploadResult = await this.storageService.uploadFile(
        fileBuffer,
        originalName,
        mimeType,
        'documents',
      );

      const nextVersionNumber = doc.versions.length + 1;

      // Update document details & reset status to PENDING
      const updatedDoc = await tx.document.update({
        where: { id: documentId },
        data: {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          status: 'PENDING',
        },
      });

      // Save version
      await tx.documentVersion.create({
        data: {
          documentId,
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          version: nextVersionNumber,
        },
      });

      // Log Audit
      await tx.documentAuditLog.create({
        data: {
          documentId,
          userId,
          action: 'REPLACE',
          details: `Replaced document with version ${nextVersionNumber}`,
          ipAddress,
          userAgent,
        },
      });

      return updatedDoc;
    });
  }

  async deleteDocument(
    userId: string,
    documentId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.employeeId !== employee.id) {
      throw new BadRequestException('Unauthorized access to this document');
    }

    // Delete allowed ONLY if PENDING or RE_UPLOAD_REQUIRED
    if (doc.status === 'APPROVED') {
      throw new BadRequestException('Cannot delete an approved document.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.storageService.deleteFile(doc.fileUrl);

      await tx.documentAuditLog.create({
        data: {
          documentId,
          userId,
          action: 'DELETE',
          details: `Deleted document type ${doc.type}`,
          ipAddress,
          userAgent,
        },
      });

      // Audit logs cascade or we delete it
      await tx.document.delete({ where: { id: documentId } });
    });

    return { message: 'Document deleted successfully' };
  }

  async getEmployeeDocuments(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.document.findMany({
      where: { employeeId: employee.id },
      include: {
        category: true,
        verification: true,
        versions: { orderBy: { version: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentQueue(query: QueryDocumentDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.type) {
      whereClause.type = query.type.toUpperCase();
    }

    if (query.search || query.departmentId) {
      whereClause.employee = {};

      if (query.departmentId) {
        whereClause.employee.departmentId = query.departmentId;
      }

      if (query.search) {
        whereClause.employee.OR = [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { employeeId: { contains: query.search } },
        ];
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where: whereClause,
        include: {
          employee: {
            include: { department: true, designation: true },
          },
          category: true,
          verification: true,
          versions: { orderBy: { version: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyDocument(
    hrUserId: string,
    documentId: string,
    dto: VerifyDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { employee: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const mappedStatus =
      dto.action === DocumentVerificationAction.APPROVE
        ? 'APPROVED'
        : dto.action === DocumentVerificationAction.REJECT
        ? 'REJECTED'
        : 'RE_UPLOAD_REQUIRED';

    const hrUser = await this.prisma.user.findUnique({
      where: { id: hrUserId },
      include: { employee: true },
    });

    const verifierName = hrUser?.employee
      ? `${hrUser.employee.firstName} ${hrUser.employee.lastName}`
      : 'HR Administrator';

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Document status
      await tx.document.update({
        where: { id: documentId },
        data: { status: mappedStatus },
      });

      // 2. Upsert verification details
      await tx.documentVerification.upsert({
        where: { documentId },
        create: {
          documentId,
          verifiedBy: verifierName,
          comment: dto.comment || null,
          verifiedAt: new Date(),
        },
        update: {
          verifiedBy: verifierName,
          comment: dto.comment || null,
          verifiedAt: new Date(),
        },
      });

      // 3. Document Audit Log
      await tx.documentAuditLog.create({
        data: {
          documentId,
          userId: hrUserId,
          action: dto.action,
          details: `HR set verification status to ${mappedStatus}. Comment: ${dto.comment || 'None'}`,
          ipAddress,
          userAgent,
        },
      });

      // 4. Send alert notification to the employee (fire-and-forget via NotificationService)
      const notifType = mappedStatus === 'APPROVED'
        ? 'document.approved'
        : mappedStatus === 'REJECTED'
        ? 'document.rejected'
        : 'document.re_upload_requested';

      const notifPriority = mappedStatus === 'APPROVED' ? 'MEDIUM' : 'HIGH';

      const docLabel = doc.type.replace(/_/g, ' ');

      this.notificationService.createNotification([doc.employee.userId], {
        title: `Document ${mappedStatus.replace(/_/g, ' ')}`,
        description: `Your ${docLabel} document has been ${mappedStatus.toLowerCase().replace(/_/g, ' ')}.${dto.comment ? ` Reason: "${dto.comment}"` : ''}`,
        type: notifType,
        module: 'DOCUMENT',
        priority: notifPriority as any,
        icon: mappedStatus === 'APPROVED' ? 'check-circle' : 'x-circle',
        actionUrl: '/employee/documents',
      }).catch(() => {});

      // 5. If all mandatory docs (Resume, Photo, Aadhaar, PAN) are approved, update onboardingStatus to DOCUMENTS_UPLOADED
      const mandatoryTypes = ['PHOTO', 'RESUME', 'AADHAAR', 'PAN'];
      const docs = await tx.document.findMany({
        where: { employeeId: doc.employeeId },
      });

      const approvedMandatory = docs.filter(
        (d: any) => mandatoryTypes.includes(d.type) && d.status === 'APPROVED'
      );

      if (approvedMandatory.length === mandatoryTypes.length && doc.employee.onboardingStatus === 'PROFILE_COMPLETED') {
        await tx.employee.update({
          where: { id: doc.employeeId },
          data: { onboardingStatus: 'DOCUMENTS_UPLOADED' },
        });
      }

      return { status: mappedStatus };
    });
  }
}
