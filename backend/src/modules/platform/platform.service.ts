/**
 * PLATFORM SERVICE
 * 
 * Manages organizations (companies) at the platform level
 * Only accessible by PLATFORM_SUPER_ADMIN role
 * 
 * SECURITY: This service does NOT access company data
 * It only manages organization entities and creates company Super Admins
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization (company) with a Super Admin
   */
  async createOrganization(dto: CreateOrganizationDto) {
    this.logger.log(`Creating organization: ${dto.name}`);

    // Verify organization code is unique
    const existingOrg = await this.prisma.organization.findUnique({
      where: { code: dto.code },
    });

    if (existingOrg) {
      throw new ConflictException(`Organization with code '${dto.code}' already exists`);
    }

    // Verify Super Admin email is unique
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.superAdminEmail },
    });

    if (existingUser) {
      throw new ConflictException(`User with email '${dto.superAdminEmail}' already exists`);
    }

    // Get SUPER_ADMIN role
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new BadRequestException('SUPER_ADMIN role not found in database');
    }

    // Create organization and Super Admin in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create organization
      const organization = await tx.organization.create({
        data: {
          name: dto.name,
          code: dto.code,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          isActive: dto.isActive ?? true,
        },
      });

      // 2. Hash Super Admin password
      const hashedPassword = await bcrypt.hash(dto.superAdminPassword, 10);

      // 3. Create Super Admin user
      const superAdminUser = await tx.user.create({
        data: {
          email: dto.superAdminEmail,
          password: hashedPassword,
          roleId: superAdminRole.id,
          organizationId: organization.id,
          isFirstLogin: true,
          isActive: true,
        },
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ORGANIZATION_CREATED',
          details: `Organization '${organization.name}' (${organization.code}) created with Super Admin ${dto.superAdminEmail}`,
        },
      });

      this.logger.log(`✓ Organization created: ${organization.name} (${organization.code})`);
      this.logger.log(`✓ Super Admin created: ${dto.superAdminEmail}`);

      return { organization, superAdminUser };
    });

    return {
      success: true,
      message: 'Organization and Super Admin created successfully',
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        code: result.organization.code,
        email: result.organization.email,
        phone: result.organization.phone,
        isActive: result.organization.isActive,
      },
      superAdmin: {
        id: result.superAdminUser.id,
        email: result.superAdminUser.email,
        firstName: dto.superAdminFirstName,
        lastName: dto.superAdminLastName,
      },
    };
  }

  /**
   * Get all organizations
   */
  async getAllOrganizations(filters?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              employees: true,
              departments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      success: true,
      data: organizations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single organization details
   */
  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            departments: true,
            designations: true,
            attendances: true,
            PayrollRun: true,
            hrActions: true,
          },
        },
        users: {
          where: {
            role: {
              name: 'SUPER_ADMIN',
            },
          },
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      success: true,
      data: organization,
    };
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, dto: UpdateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_UPDATED',
        details: `Organization '${updated.name}' updated`,
      },
    });

    return {
      success: true,
      message: 'Organization updated successfully',
      data: updated,
    };
  }

  /**
   * Activate/Deactivate organization
   */
  async toggleOrganizationStatus(organizationId: string, isActive: boolean) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        action: isActive ? 'ORGANIZATION_ACTIVATED' : 'ORGANIZATION_DEACTIVATED',
        details: `Organization '${updated.name}' ${isActive ? 'activated' : 'deactivated'}`,
      },
    });

    return {
      success: true,
      message: `Organization ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    };
  }

  /**
   * Create additional Super Admin for an organization
   */
  async createOrganizationSuperAdmin(
    organizationId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (!organization.isActive) {
      throw new BadRequestException('Cannot create admin for inactive organization');
    }

    // Verify email is unique
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email '${data.email}' already exists`);
    }

    // Get SUPER_ADMIN role
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new BadRequestException('SUPER_ADMIN role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const superAdmin = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        roleId: superAdminRole.id,
        organizationId: organization.id,
        isFirstLogin: true,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SUPER_ADMIN_CREATED',
        details: `Super Admin ${data.email} created for organization '${organization.name}'`,
      },
    });

    this.logger.log(`✓ Super Admin created: ${data.email} for ${organization.name}`);

    return {
      success: true,
      message: 'Super Admin created successfully',
      data: {
        id: superAdmin.id,
        email: superAdmin.email,
        organizationId: superAdmin.organizationId,
      },
    };
  }

  /**
   * Get platform statistics
   */
  async getPlatformStatistics() {
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalEmployees,
      totalDepartments,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.employee.count(),
      this.prisma.department.count(),
    ]);

    return {
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        inactiveOrganizations: totalOrganizations - activeOrganizations,
        totalUsers,
        totalEmployees,
        totalDepartments,
      },
    };
  }
}
