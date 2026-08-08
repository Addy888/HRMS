import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateHRAccountDto,
  UpdateHRAccountDto,
  UpdateHRStatusDto,
  ResetHRPasswordDto,
} from './dto/admin-hr.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminHRService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all HR accounts
   */
  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get HR role
    const hrRole = await this.prisma.role.findUnique({ where: { name: 'HR' } });
    if (!hrRole) {
      throw new NotFoundException('HR role not found');
    }

    const where: any = { roleId: hrRole.id };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { employee: { firstName: { contains: query.search } } },
        { employee: { lastName: { contains: query.search } } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employee: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const hrAccounts = data.map((user) => ({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: null, // Can be enhanced with lastLoginAt field
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            phone: user.employee.phone,
          }
        : null,
    }));

    return {
      data: hrAccounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single HR account by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('HR account not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR account');
    }

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            phone: user.employee.phone,
          }
        : null,
    };
  }

  /**
   * Create new HR account (Super Admin only)
   */
  async create(dto: CreateHRAccountDto, requestUserId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      include: { organization: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('Requesting user organization not found');
    }

    // Get HR role
    const hrRole = await this.prisma.role.findUnique({ where: { name: 'HR' } });
    if (!hrRole) {
      throw new NotFoundException('HR role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate Employee ID
    const employeeId = await this.generateEmployeeId();

    return this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          roleId: hrRole.id,
          organizationId: requestingUser.organizationId,
          isFirstLogin: false, // Admin sets the password, not temporary
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      // Create employee profile (minimal for HR account)
      const employee = await tx.employee.create({
        data: {
          employeeId,
          userId: user.id,
          organizationId: requestingUser.organizationId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone || null,
          onboardingStatus: 'VERIFIED', // HR accounts are pre-verified
        },
      });

      // Create notification preferences
      await tx.notificationPreference.create({
        data: { userId: user.id },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUPER_ADMIN_CREATED_HR_ACCOUNT',
          details: `Super Admin created HR account: ${dto.email} (${dto.firstName} ${dto.lastName})`,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
        },
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
        },
      };
    });
  }

  /**
   * Update HR account
   */
  async update(id: string, dto: UpdateHRAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, employee: true },
    });

    if (!user) {
      throw new NotFoundException('HR account not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR account');
    }

    if (!user.employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Store employee reference for TypeScript null safety
    const existingEmployee = user.employee;

    return this.prisma.$transaction(async (tx) => {
      // Update employee profile
      const employee = await tx.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName: dto.firstName || existingEmployee.firstName,
          lastName: dto.lastName || existingEmployee.lastName,
          phone: dto.phone !== undefined ? dto.phone : existingEmployee.phone,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: id,
          action: 'SUPER_ADMIN_UPDATED_HR_ACCOUNT',
          details: `Super Admin updated HR account: ${user.email}`,
        },
      });

      return {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
        },
      };
    });
  }

  /**
   * Update HR account status (activate/deactivate)
   */
  async updateStatus(id: string, dto: UpdateHRStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('HR account not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR account');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { isActive: dto.isActive },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: id,
          action: dto.isActive
            ? 'SUPER_ADMIN_ACTIVATED_HR_ACCOUNT'
            : 'SUPER_ADMIN_DEACTIVATED_HR_ACCOUNT',
          details: `Super Admin ${dto.isActive ? 'activated' : 'deactivated'} HR account: ${user.email}`,
        },
      });

      return {
        id: updated.id,
        email: updated.email,
        isActive: updated.isActive,
      };
    });
  }

  /**
   * Reset HR account password
   */
  async resetPassword(id: string, dto: ResetHRPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('HR account not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR account');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: id,
          action: 'SUPER_ADMIN_RESET_HR_PASSWORD',
          details: `Super Admin reset password for HR account: ${user.email}`,
        },
      });

      return {
        email: user.email,
        message: 'Password has been reset successfully.',
      };
    });
  }

  /**
   * Helper: Generate Employee ID for HR
   */
  private async generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FCS-HR-${year}`;

    const lastEmployee = await this.prisma.employee.findFirst({
      where: { employeeId: { startsWith: prefix } },
      orderBy: { employeeId: 'desc' },
    });

    if (!lastEmployee) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(
      lastEmployee.employeeId.split('-').pop() || '0',
      10,
    );
    const nextNumber = lastNumber + 1;
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }
}
