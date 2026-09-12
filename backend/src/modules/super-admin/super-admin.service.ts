import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboardStats(userId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const [
      totalOrganizations,
      totalEmployees,
      totalAdmins,
      totalProcesses,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.employee.count(),
      this.prisma.user.count({
        where: {
          role: {
            name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
          },
          isActive: true,
        },
      }),
      this.prisma.department.count({ where: { isActive: true } }),
    ]);

    return {
      totalOrganizations,
      totalEmployees,
      totalAdmins,
      totalProcesses,
    };
  }

  async getProcessOverview(userId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const processes = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
        organization: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return processes.map((process) => ({
      id: process.id,
      name: process.name,
      code: process.code,
      description: process.description,
      employeeCount: process._count.employees,
      organization: process.organization,
      isActive: process.isActive,
      createdAt: process.createdAt,
    }));
  }

  // ==========================================
  // ADMIN MANAGEMENT
  // ==========================================
  async getAllAdmins(userId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
        },
      },
      include: {
        role: true,
        organization: true,
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  }

  async getAdminDetails(userId: string, adminId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: {
        role: true,
        organization: true,
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        employeesCreated: {
          include: {
            department: true,
            designation: true,
          },
        },
        departmentsCreated: {
          include: {
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async createAdmin(userId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async updateAdmin(userId: string, adminId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async deleteAdmin(userId: string, adminId: string) {
    throw new BadRequestException('Not implemented yet');
  }

  async resetAdminPassword(userId: string, adminId: string) {
    throw new BadRequestException('Not implemented yet');
  }

  // ==========================================
  // EMPLOYEE MANAGEMENT
  // ==========================================
  async getAllEmployees(userId: string, filters: any) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { employeeId: { contains: filters.search } },
      ];
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        user: {
          include: {
            role: true,
          },
        },
        department: true,
        designation: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return employees;
  }

  async getEmployeeDetails(userId: string, employeeId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        department: true,
        designation: true,
        organization: true,
        education: true,
        experience: true,
        documents: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async createEmployee(userId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async updateEmployee(userId: string, employeeId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async deleteEmployee(userId: string, employeeId: string) {
    throw new BadRequestException('Not implemented yet');
  }

  async setEmployeeActivation(userId: string, employeeId: string, isActive: boolean) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { isActive },
    });

    return {
      success: true,
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  async resetEmployeePassword(userId: string, employeeId: string) {
    throw new BadRequestException('Not implemented yet');
  }

  // ==========================================
  // PROCESS MANAGEMENT
  // ==========================================
  async getAllProcesses(userId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const processes = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        organization: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return processes;
  }

  async getProcessDetails(userId: string, processId: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    const process = await this.prisma.department.findUnique({
      where: { id: processId },
      include: {
        organization: true,
        employees: {
          include: {
            user: {
              include: {
                role: true,
              },
            },
            designation: true,
          },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return process;
  }

  async createProcess(userId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async updateProcess(userId: string, processId: string, dto: any) {
    throw new BadRequestException('Not implemented yet');
  }

  async deleteProcess(userId: string, processId: string) {
    throw new BadRequestException('Not implemented yet');
  }

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================
  async globalSearch(userId: string, searchTerm: string) {
    // Verify user is super admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      throw new BadRequestException('Access denied');
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        employees: [],
        processes: [],
        admins: [],
      };
    }

    const [employees, processes, admins] = await Promise.all([
      this.prisma.employee.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { employeeId: { contains: searchTerm } },
          ],
        },
        include: {
          department: true,
          designation: true,
          organization: true,
        },
        take: 10,
      }),
      this.prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { code: { contains: searchTerm } },
          ],
          isActive: true,
        },
        include: {
          organization: true,
        },
        take: 10,
      }),
      this.prisma.user.findMany({
        where: {
          role: {
            name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
          },
          OR: [
            { email: { contains: searchTerm } },
            {
              employee: {
                OR: [
                  { firstName: { contains: searchTerm } },
                  { lastName: { contains: searchTerm } },
                ],
              },
            },
          ],
        },
        include: {
          role: true,
          employee: true,
          organization: true,
        },
        take: 10,
      }),
    ]);

    return {
      employees,
      processes,
      admins,
    };
  }
}
