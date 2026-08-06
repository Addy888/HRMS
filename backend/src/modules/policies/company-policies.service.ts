import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { UploadCompanyPolicyDto } from './dto/company-policy.dto.js';
import { unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CompanyPoliciesService {
  constructor(private prisma: PrismaService) {}

  async uploadPolicy(
    userId: string,
    uploaderName: string,
    file: Express.Multer.File,
    dto: UploadCompanyPolicyDto,
  ) {
    console.log('\n=== Uploading Company Policy ===');
    console.log('File details:', {
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    });
    
    // Validate file is actually a PDF by reading header
    const fs = await import('fs');
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(file.path, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    
    const header = buffer.toString('utf-8');
    console.log('File header:', header);
    
    if (header !== '%PDF-') {
      console.error('❌ Invalid PDF file! Header:', header);
      // Delete the invalid file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete invalid file:', err);
      }
      throw new BadRequestException('Uploaded file is not a valid PDF. PDF files must begin with %PDF-');
    }
    
    console.log('✅ Valid PDF file confirmed');
    console.log('DTO:', dto);
    
    // CRITICAL FIX: Create new policy WITHOUT archiving previous ones
    // Every upload creates a NEW version/record
    // Previous policies remain ACTIVE to maintain complete history
    const result = await this.prisma.$transaction(async (tx) => {
      // Create new policy as ACTIVE (do NOT archive previous policies)
      const newPolicy = await tx.companyPolicy.create({
        data: {
          policyName: dto.policyName,
          fileName: file.originalname,
          fileUrl: file.path,
          fileSize: file.size,
          version: dto.version || '1.0',
          status: 'ACTIVE',
          uploadedBy: userId,
          uploadedByName: uploaderName,
        },
      });
      
      console.log('Created policy in DB:', {
        id: newPolicy.id,
        fileUrl: newPolicy.fileUrl,
        fileSize: newPolicy.fileSize,
      });

      // Auto-assign to ALL ACTIVE employees
      const activeEmployees = await tx.employee.findMany({
        where: {
          user: {
            isActive: true,
            role: { name: 'EMPLOYEE' },
          },
        },
        select: { id: true },
      });

      // Create company policy acceptances for all active employees
      if (activeEmployees.length > 0) {
        await tx.companyPolicyAcceptance.createMany({
          data: activeEmployees.map((emp) => ({
            companyPolicyId: newPolicy.id,
            employeeId: emp.id,
            status: 'PENDING',
          })),
          skipDuplicates: true,
        });
      }

      console.log('✅ Auto-assigned to', activeEmployees.length, 'employees');

      return {
        policy: newPolicy,
        assignedCount: activeEmployees.length,
      };
    });

    return {
      success: true,
      message:
        'Company policy uploaded successfully and assigned to all active employees.',
      data: {
        id: result.policy.id,
        policyName: result.policy.policyName,
        fileName: result.policy.fileName,
        version: result.policy.version,
        status: result.policy.status,
        uploadedAt: result.policy.createdAt,
        uploadedBy: result.policy.uploadedByName,
        assignedEmployees: result.assignedCount,
      },
    };
  }

  async listPolicies() {
    const policies = await this.prisma.companyPolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: policies,
      total: policies.length,
    };
  }

  async getActivePolicy() {
    const policy = await this.prisma.companyPolicy.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!policy) {
      throw new NotFoundException('No active company policy found');
    }

    return policy;
  }

  async getActivePolicyForEmployee(employeeId: string) {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  getActivePolicyForEmployee CALLED                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('employeeId:', employeeId);
    console.log('employeeId type:', typeof employeeId);
    console.log('employeeId is null/undefined:', employeeId == null);

    if (!employeeId) {
      console.log('⚠️  No employeeId provided, returning empty array');
      return [];
    }

    try {
      console.log('🔍 Querying CompanyPolicy with findMany...');
      
      // CRITICAL FIX: Return ALL assigned policies for this employee
      // NOT just one active policy - maintain complete history
      const policies = await this.prisma.companyPolicy.findMany({
        where: { 
          status: 'ACTIVE',
          acceptances: {
            some: {
              employeeId: employeeId,
            },
          },
        },
        orderBy: { createdAt: 'desc' }, // Newest first
        include: {
          acceptances: {
            where: { employeeId },
          },
        },
      });

      console.log('✅ Query completed successfully');
      console.log('📊 Policies found:', policies.length);

      if (!policies || policies.length === 0) {
        console.log('ℹ️  No policies found, returning empty array');
        return [];
      }

      // Map to include acceptance status for each policy
      const result = policies.map(policy => {
        const acceptance = policy.acceptances[0];
        return {
          id: policy.id,
          policyName: policy.policyName,
          fileName: policy.fileName,
          version: policy.version,
          uploadedBy: policy.uploadedByName,
          uploadedAt: policy.createdAt,
          status: acceptance?.status || 'PENDING',
          accepted: acceptance?.status === 'ACCEPTED',
          acceptedAt: acceptance?.acceptedAt || null,
        };
      });

      console.log('✅ Returning', result.length, 'policies');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  getActivePolicyForEmployee COMPLETED                     ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      return result;
    } catch (error) {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  ❌ ERROR in getActivePolicyForEmployee                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.error('Error name:', error?.name);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
      
      // Return empty array instead of throwing
      // This prevents HTTP 500 errors
      console.log('⚠️  Returning empty array due to error');
      return [];
    }
  }

  async acceptCompanyPolicy(
    employeeId: string,
    policyId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException('Company policy not found');
    }

    // Update or create acceptance
    const acceptance = await this.prisma.companyPolicyAcceptance.upsert({
      where: {
        companyPolicyId_employeeId: {
          companyPolicyId: policyId,
          employeeId,
        },
      },
      create: {
        companyPolicyId: policyId,
        employeeId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
      },
      update: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return {
      success: true,
      message: 'Company policy accepted successfully',
      acceptance,
    };
  }

  async getPolicyById(id: string) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Company policy not found');
    }

    return policy;
  }

  async deletePolicy(id: string) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Company policy not found');
    }

    // Delete physical file
    try {
      const filePath = join(process.cwd(), policy.fileUrl);
      unlinkSync(filePath);
    } catch (error) {
      // File might already be deleted, continue
    }

    // Delete from database
    await this.prisma.companyPolicy.delete({
      where: { id },
    });

    return {
      message: 'Company policy deleted successfully',
    };
  }

  async getVersionHistory() {
    return this.prisma.companyPolicy.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAcceptanceTracking() {
    const activePolicy = await this.prisma.companyPolicy.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        acceptances: {
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!activePolicy) {
      return {
        policy: null,
        totalEmployees: 0,
        pending: 0,
        completed: 0,
        percentage: 0,
        employees: [],
      };
    }

    const totalEmployees = activePolicy.acceptances.length;
    const completed = activePolicy.acceptances.filter(
      (a) => a.status === 'ACCEPTED',
    ).length;
    const pending = totalEmployees - completed;
    const percentage =
      totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0;

    return {
      policy: {
        id: activePolicy.id,
        policyName: activePolicy.policyName,
        version: activePolicy.version,
        uploadedAt: activePolicy.createdAt,
        uploadedBy: activePolicy.uploadedByName,
      },
      totalEmployees,
      pending,
      completed,
      percentage,
      employees: activePolicy.acceptances.map((acceptance) => ({
        id: acceptance.employee.id,
        employeeId: acceptance.employee.employeeId,
        name: `${acceptance.employee.firstName} ${acceptance.employee.lastName}`,
        department: acceptance.employee.department?.name || 'N/A',
        status: acceptance.status,
        acceptedAt: acceptance.acceptedAt,
      })),
    };
  }
}
