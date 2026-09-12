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
      activeEmployees,
      inactiveEmployees,
      totalHRAdmins,
      totalProcesses,
      activeSalaryStructures,
      employeesWithMonthlySalary,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.employee.count(),
      this.prisma.employee.count({
        where: {
          user: {
            isActive: true,
          },
        },
      }),
      this.prisma.employee.count({
        where: {
          user: {
            isActive: false,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: {
            name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
          },
          isActive: true,
        },
      }),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.salaryStructure.findMany({
        where: {
          isActive: true,
        },
        select: {
          basicSalary: true,
          grossSalary: true,
          hra: true,
          conveyance: true,
          medicalAllowance: true,
          specialAllowance: true,
          otherAllowances: true,
        },
      }),
      this.prisma.employee.findMany({
        where: {
          monthlySalary: { not: null },
        },
        select: {
          monthlySalary: true,
        },
      }),
    ]);

    // Calculate total payroll from salary structures
    let totalMonthlyPayroll = 0;
    let totalPayrollCost = 0;

    activeSalaryStructures.forEach((salary) => {
      totalMonthlyPayroll += salary.grossSalary || 0;
      totalPayrollCost += salary.basicSalary || 0;
    });

    // Add employees with simple monthlySalary
    employeesWithMonthlySalary.forEach((emp) => {
      totalMonthlyPayroll += emp.monthlySalary || 0;
      totalPayrollCost += emp.monthlySalary || 0;
    });

    return {
      totalOrganizations,
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalHRAdmins,
      totalProcesses,
      totalMonthlyPayroll,
      totalPayrollCost,
      presentToday: 0, // TODO: Implement attendance aggregation
      lateToday: 0, // TODO: Implement attendance aggregation
      absentToday: 0, // TODO: Implement attendance aggregation
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
        employees: {
          select: {
            monthlySalary: true, // ← Direct salary field
            user: {
              select: {
                isActive: true,
              },
            },
            salaryStructures: {
              where: {
                isActive: true,
              },
              orderBy: {
                effectiveFrom: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return processes.map((process) => {
      const totalEmployees = process.employees.length;
      const activeEmployees = process.employees.filter(
        (emp) => emp.user?.isActive === true,
      ).length;
      const inactiveEmployees = totalEmployees - activeEmployees;

      // Calculate payroll aggregates
      let totalBasicSalary = 0;
      let totalGrossSalary = 0;
      let totalOtherAllowances = 0; // This will be used as "incentive"
      let employeesWithSalary = 0;

      process.employees.forEach((employee) => {
        const activeSalary = employee.salaryStructures[0];
        
        // Use salaryStructure if exists, otherwise use monthlySalary
        if (activeSalary) {
          totalBasicSalary += activeSalary.basicSalary || 0;
          totalGrossSalary += activeSalary.grossSalary || 0;
          // Calculate total allowances (excluding basic) as "incentive"
          const allowances =
            (activeSalary.hra || 0) +
            (activeSalary.conveyance || 0) +
            (activeSalary.medicalAllowance || 0) +
            (activeSalary.specialAllowance || 0) +
            (activeSalary.otherAllowances || 0);
          totalOtherAllowances += allowances;
          employeesWithSalary++;
        } else if (employee.monthlySalary) {
          // Fallback to simple monthly salary
          totalBasicSalary += employee.monthlySalary;
          totalGrossSalary += employee.monthlySalary;
          employeesWithSalary++;
        }
      });

      const avgSalary =
        employeesWithSalary > 0 ? totalGrossSalary / employeesWithSalary : 0;

      return {
        id: process.id,
        name: process.name,
        code: process.code,
        description: process.description,
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        monthlyBasicSalary: totalBasicSalary,
        monthlyIncentive: totalOtherAllowances,
        totalMonthlyPayroll: totalGrossSalary,
        avgSalary: avgSalary,
        organization: process.organization,
        isActive: process.isActive,
        createdAt: process.createdAt,
      };
    });
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
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
        {
          user: {
            email: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.isActive !== undefined && filters.isActive !== '') {
      where.user = {
        ...where.user,
        isActive: filters.isActive === 'true',
      };
    }

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        phone: true,
        monthlySalary: true, // ← Direct salary field on employee
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        salaryStructures: {
          where: {
            isActive: true,
          },
          orderBy: {
            effectiveFrom: 'desc',
          },
          take: 1,
          select: {
            basicSalary: true,
            grossSalary: true,
            netSalary: true,
            ctc: true,
            hra: true,
            conveyance: true,
            medicalAllowance: true,
            specialAllowance: true,
            otherAllowances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend expectations
    return employees.map((emp) => {
      const activeSalary = emp.salaryStructures?.[0];
      
      // Use salaryStructure if exists, otherwise fall back to monthlySalary field
      const totalSalary = activeSalary?.grossSalary || emp.monthlySalary || 0;
      const basicSalary = activeSalary?.basicSalary || emp.monthlySalary || 0;
      
      return {
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.user?.email || '',
        phone: emp.phone || '',
        departmentId: emp.department?.id || null,
        departmentName: emp.department?.name || null,
        designationId: emp.designation?.id || null,
        designationTitle: emp.designation?.name || null,
        organizationId: emp.organization?.id || null,
        organizationName: emp.organization?.name || null,
        isActive: emp.user?.isActive || false,
        totalSalary,
        basicSalary,
        netSalary: activeSalary?.netSalary || totalSalary,
        ctc: activeSalary?.ctc || totalSalary,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
      };
    });
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
