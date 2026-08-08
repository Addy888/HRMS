import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateHRUserDto, UpdateHRUserDto, UpdateHRStatusDto } from './dto/hr-user.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HRUsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all HR users
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
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const hrUsers = data.map((user) => ({
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
            department: user.employee.department,
            designation: user.employee.designation,
          }
        : null,
    }));

    return {
      data: hrUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single HR user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('HR user not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR');
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
            department: user.employee.department,
            designation: user.employee.designation,
          }
        : null,
    };
  }

  /**
   * Create new HR user
   */
  async create(dto: CreateHRUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Get HR role
    const hrRole = await this.prisma.role.findUnique({ where: { name: 'HR' } });
    if (!hrRole) {
      throw new NotFoundException('HR role not found');
    }

    // Hash the provided password
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
          isFirstLogin: false, // Password is set by admin, no need to change
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      // Create employee profile
      const employee = await tx.employee.create({
        data: {
          employeeId,
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone || null,
          departmentId: dto.departmentId || null,
          designationId: dto.designationId || null,
          onboardingStatus: 'VERIFIED', // HR users are pre-verified
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
          action: 'HR_USER_CREATED',
          details: `HR user created: ${dto.email} (${dto.firstName} ${dto.lastName})`,
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
   * Update HR user
   */
  async update(id: string, dto: UpdateHRUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, employee: true },
    });

    if (!user) {
      throw new NotFoundException('HR user not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR');
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
          departmentId: dto.departmentId !== undefined ? dto.departmentId : existingEmployee.departmentId,
          designationId: dto.designationId !== undefined ? dto.designationId : existingEmployee.designationId,
        },
        include: {
          department: true,
          designation: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: id,
          action: 'HR_USER_UPDATED',
          details: `HR user updated: ${user.email}`,
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
          department: employee.department,
          designation: employee.designation,
        },
      };
    });
  }

  /**
   * Update HR user status (activate/deactivate)
   */
  async updateStatus(id: string, dto: UpdateHRStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, employee: true },
    });

    if (!user) {
      throw new NotFoundException('HR user not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR');
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
          action: dto.isActive ? 'HR_USER_ACTIVATED' : 'HR_USER_DEACTIVATED',
          details: `HR user ${dto.isActive ? 'activated' : 'deactivated'}: ${user.email}`,
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
   * Reset HR user password
   */
  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, employee: true },
    });

    if (!user) {
      throw new NotFoundException('HR user not found');
    }

    if (user.role.name !== 'HR') {
      throw new BadRequestException('User is not an HR');
    }

    // Generate new temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          isFirstLogin: true, // Force password change
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: id,
          action: 'HR_USER_PASSWORD_RESET',
          details: `HR user password reset: ${user.email}`,
        },
      });

      return {
        email: user.email,
        tempPassword,
        message: 'Password has been reset successfully. User must change password on next login.',
      };
    });
  }

  /**
   * Helper: Generate Employee ID
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

    const lastNumber = parseInt(lastEmployee.employeeId.split('-').pop() || '0', 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Helper: Generate temporary password
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
