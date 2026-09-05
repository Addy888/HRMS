import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/constants/index.js';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD - Company-Wide Statistics
  // ==========================================
  async getDashboardStats(requestUserId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const orgId = user.organizationId;

    // Get counts
    const [
      totalEmployees,
      totalHRAdmins,
      activeEmployees,
      inactiveEmployees,
      totalProcesses,
      presentToday,
      absentToday,
      lateToday,
    ] = await Promise.all([
      // Total employees (exclude HR roles)
      this.prisma.employee.count({
        where: {
          organizationId: orgId,
          user: {
            role: { name: UserRole.EMPLOYEE },
          },
        },
      }),
      // Total HR Admins
      this.prisma.user.count({
        where: {
          organizationId: orgId,
          role: {
            name: { in: [UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.HR] },
          },
        },
      }),
      // Active employees
      this.prisma.employee.count({
        where: {
          organizationId: orgId,
          user: {
            role: { name: UserRole.EMPLOYEE },
            isActive: true,
          },
        },
      }),
      // Inactive employees
      this.prisma.employee.count({
        where: {
          organizationId: orgId,
          user: {
            role: { name: UserRole.EMPLOYEE },
            isActive: false,
          },
        },
      }),
      // Total processes (departments)
      this.prisma.department.count({
        where: { organizationId: orgId },
      }),
      // Present today
      this.prisma.attendance.count({
        where: {
          organizationId: orgId,
          date: new Date(),
          status: 'PRESENT',
        },
      }),
      // Absent today
      this.prisma.attendance.count({
        where: {
          organizationId: orgId,
          date: new Date(),
          status: 'ABSENT',
        },
      }),
      // Late today
      this.prisma.attendance.count({
        where: {
          organizationId: orgId,
          date: new Date(),
          status: 'LATE',
        },
      }),
    ]);

    // Calculate payroll totals
    const employeesWithSalary = await this.prisma.employee.findMany({
      where: {
        organizationId: orgId,
        user: {
          role: { name: UserRole.EMPLOYEE },
          isActive: true,
        },
        monthlySalary: { not: null },
      },
      select: {
        monthlySalary: true,
      },
    });

    let totalBasicSalary = 0;

    employeesWithSalary.forEach((emp) => {
      totalBasicSalary += emp.monthlySalary || 0;
    });

    const totalMonthlyPayroll = totalBasicSalary;

    return {
      totalEmployees,
      totalHRAdmins,
      activeEmployees,
      inactiveEmployees,
      totalProcesses,
      totalPayrollCost: totalBasicSalary,
      totalIncentives: 0, // No separate incentive tracking
      totalMonthlyPayroll,
      presentToday,
      absentToday,
      lateToday,
    };
  }

  // ==========================================
  // PROCESS OVERVIEW - Process-wise statistics
  // ==========================================
  async getProcessOverview(requestUserId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const processes = await this.prisma.department.findMany({
      where: { organizationId: user.organizationId },
      include: {
        employees: {
          where: {
            user: {
              role: { name: UserRole.EMPLOYEE },
            },
          },
          include: {
            user: {
              select: { isActive: true },
            },
          },
        },
      },
    });

    const processStats = processes.map((process) => {
      const employees = process.employees;
      const activeEmployees = employees.filter((e) => e.user.isActive);
      const inactiveEmployees = employees.filter((e) => !e.user.isActive);

      let totalBasicSalary = 0;

      employees.forEach((emp) => {
        totalBasicSalary += emp.monthlySalary || 0;
      });

      const totalPayroll = totalBasicSalary;
      const avgSalary =
        employees.length > 0 ? totalPayroll / employees.length : 0;

      return {
        id: process.id,
        name: process.name,
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: inactiveEmployees.length,
        monthlyBasicSalary: totalBasicSalary,
        monthlyIncentive: 0,
        totalMonthlyPayroll: totalPayroll,
        avgSalary: Math.round(avgSalary),
      };
    });

    return processStats;
  }

  // ==========================================
  // ADMIN MANAGEMENT - CRUD Operations
  // ==========================================
  async getAllAdmins(requestUserId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const admins = await this.prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: {
          name: { in: [UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.HR] },
        },
      },
      include: {
        role: {
          select: { name: true, displayName: true },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        employeesCreated: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      role: admin.role.name,
      roleDisplay: admin.role.displayName || admin.role.name,
      isActive: admin.isActive,
      isFirstLogin: admin.isFirstLogin,
      firstName: admin.employee?.firstName || 'N/A',
      lastName: admin.employee?.lastName || '',
      phone: admin.employee?.phone || 'N/A',
      employeesManaged: admin.employeesCreated.length,
      createdAt: admin.createdAt,
    }));
  }

  async createAdmin(requestUserId: string, dto: any) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Get HR_ADMIN role
    const hrAdminRole = await this.prisma.role.findUnique({
      where: { name: UserRole.HR_ADMIN },
    });

    if (!hrAdminRole) {
      throw new BadRequestException('HR_ADMIN role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password || '123456', 10);

    // Create user and employee profile
    const newAdmin = await this.prisma.$transaction(async (tx) => {
      const adminUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          roleId: hrAdminRole.id,
          organizationId: user.organizationId,
          isFirstLogin: true,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      // Create employee profile for the admin
      const employeeProfile = await tx.employee.create({
        data: {
          employeeId: `HR-${Date.now()}`,
          userId: adminUser.id,
          organizationId: user.organizationId,
          firstName: dto.firstName || 'HR',
          lastName: dto.lastName || 'Admin',
          phone: dto.phone || null,
          joiningDate: new Date(),
        },
      });

      return { adminUser, employeeProfile };
    });

    return {
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.adminUser.id,
        email: newAdmin.adminUser.email,
        firstName: newAdmin.employeeProfile.firstName,
        lastName: newAdmin.employeeProfile.lastName,
      },
    };
  }

  async updateAdmin(requestUserId: string, adminId: string, dto: any) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    // Get admin to update
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { employee: true },
    });

    if (!admin || admin.organizationId !== user.organizationId) {
      throw new NotFoundException('Admin not found');
    }

    // Update user and employee
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: adminId },
        data: {
          isActive: dto.isActive,
        },
      });

      if (admin.employee) {
        await tx.employee.update({
          where: { id: admin.employee.id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        });
      }
    });

    return { message: 'Admin updated successfully' };
  }

  async deleteAdmin(requestUserId: string, adminId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.organizationId !== user.organizationId) {
      throw new NotFoundException('Admin not found');
    }

    // Don't allow deleting SUPER_ADMIN
    const adminRole = await this.prisma.role.findUnique({
      where: { id: admin.roleId },
    });

    if (adminRole?.name === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete Super Admin');
    }

    await this.prisma.user.delete({
      where: { id: adminId },
    });

    return { message: 'Admin deleted successfully' };
  }

  async resetAdminPassword(requestUserId: string, adminId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.organizationId !== user.organizationId) {
      throw new NotFoundException('Admin not found');
    }

    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id: adminId },
      data: {
        password: hashedPassword,
        isFirstLogin: true,
      },
    });

    return {
      message: 'Password reset successfully',
      defaultPassword,
    };
  }

  // ==========================================
  // EMPLOYEE MANAGEMENT - Company-wide
  // ==========================================
  async getAllEmployees(requestUserId: string, filters: any = {}) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const whereClause: any = {
      organizationId: user.organizationId,
      user: {
        role: { name: UserRole.EMPLOYEE },
      },
    };

    if (filters.search) {
      whereClause.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }

    if (filters.createdByUserId) {
      whereClause.createdByUserId = filters.createdByUserId;
    }

    if (filters.isActive !== undefined) {
      whereClause.user = {
        ...whereClause.user,
        isActive: filters.isActive === 'true',
      };
    }

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { joiningDate: 'desc' },
    });

    return employees.map((emp) => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.user?.email,
      isActive: emp.user?.isActive,
      departmentName: emp.department?.name || null,
      designationTitle: emp.designation?.name || null,
      incentive: 0,
      totalSalary: emp.monthlySalary || 0,
      createdByName: emp.createdByUser?.employee
        ? `${emp.createdByUser.employee.firstName} ${emp.createdByUser.employee.lastName}`
        : 'N/A',
    }));
  }

  // ==========================================
  // PROCESS MANAGEMENT
  // ==========================================
  async getAllProcesses(requestUserId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const processes = await this.prisma.department.findMany({
      where: { organizationId: user.organizationId },
      include: {
        employees: {
          where: {
            user: {
              role: { name: UserRole.EMPLOYEE },
            },
          },
          select: {
            id: true,
            monthlySalary: true,
            user: { select: { isActive: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return processes.map((process) => {
      const activeEmployees = process.employees.filter(
        (e) => e.user.isActive,
      ).length;
      let totalBasic = 0;

      process.employees.forEach((emp) => {
        totalBasic += emp.monthlySalary || 0;
      });

      return {
        id: process.id,
        name: process.name,
        description: process.description,
        totalEmployees: process.employees.length,
        activeEmployees,
        monthlyBasicSalary: totalBasic,
        monthlyIncentive: 0,
        totalMonthlyPayroll: totalBasic,
        createdAt: process.createdAt,
      };
    });
  }

  async getProcessDetails(requestUserId: string, processId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const process = await this.prisma.department.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
      include: {
        employees: {
          where: {
            user: {
              role: { name: UserRole.EMPLOYEE },
            },
          },
          include: {
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
            designation: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return {
      ...process,
      employees: process.employees.map((emp) => ({
        ...emp,
        fullName: `${emp.firstName} ${emp.lastName}`,
        incentive: 0,
        totalSalary: emp.monthlySalary || 0,
      })),
    };
  }

  async createProcess(requestUserId: string, dto: any) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const process = await this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        organizationId: user.organizationId,
      },
    });

    return process;
  }

  async updateProcess(requestUserId: string, processId: string, dto: any) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const process = await this.prisma.department.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    const updated = await this.prisma.department.update({
      where: { id: processId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return updated;
  }

  async deleteProcess(requestUserId: string, processId: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const process = await this.prisma.department.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
      include: {
        employees: {
          select: { id: true },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete process with assigned employees',
      );
    }

    await this.prisma.department.delete({
      where: { id: processId },
    });

    return { message: 'Process deleted successfully' };
  }

  // ==========================================
  // COMPANY-WIDE SEARCH
  // ==========================================
  async globalSearch(requestUserId: string, searchTerm: string) {
    await this.verifySuperAdmin(requestUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new BadRequestException('User not associated with organization');
    }

    const [employees, processes, admins] = await Promise.all([
      this.prisma.employee.findMany({
        where: {
          organizationId: user.organizationId,
          user: { role: { name: UserRole.EMPLOYEE } },
          OR: [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { employeeId: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
            { user: { email: { contains: searchTerm } } },
          ],
        },
        include: {
          user: { select: { email: true } },
          department: { select: { name: true } },
        },
        take: 10,
      }),
      this.prisma.department.findMany({
        where: {
          organizationId: user.organizationId,
          name: { contains: searchTerm },
        },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
          role: {
            name: { in: [UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.HR] },
          },
          email: { contains: searchTerm },
        },
        include: {
          employee: {
            select: { firstName: true, lastName: true },
          },
        },
        take: 5,
      }),
    ]);

    return {
      employees: employees.map((e) => ({
        type: 'employee',
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        employeeId: e.employeeId,
        email: e.user?.email,
        department: e.department?.name,
      })),
      processes: processes.map((p) => ({
        type: 'process',
        id: p.id,
        name: p.name,
      })),
      admins: admins.map((a) => ({
        type: 'admin',
        id: a.id,
        email: a.email,
        name: a.employee
          ? `${a.employee.firstName} ${a.employee.lastName}`
          : 'N/A',
      })),
    };
  }

  // ==========================================
  // UTILITY - Verify Super Admin
  // ==========================================
  private async verifySuperAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role.name !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Access denied: Super Admin privileges required',
      );
    }

    return user;
  }
}
