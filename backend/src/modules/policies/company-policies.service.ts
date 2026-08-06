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
    // When uploading a new policy, automatically make it ACTIVE
    // and archive all previous ACTIVE policies
    await this.prisma.$transaction(async (tx) => {
      // Archive all currently active policies
      await tx.companyPolicy.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      // Create new policy as ACTIVE
      await tx.companyPolicy.create({
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
    });

    return {
      message: 'Company policy uploaded successfully. Previous policies archived.',
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
}
