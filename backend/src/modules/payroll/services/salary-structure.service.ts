import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateSalaryStructureDto } from '../dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from '../dto/update-salary-structure.dto';

@Injectable()
export class SalaryStructureService {
  private readonly logger = new Logger(SalaryStructureService.name);

  constructor(private readonly database: PrismaService) {}

  /**
   * CREATE SALARY STRUCTURE
   */
  async create(createDto: CreateSalaryStructureDto) {
    // Check if employee exists
    const employee = await this.database.employee.findUnique({
      where: { id: createDto.employeeId },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Deactivate previous active salary structures
    await this.database.salaryStructure.updateMany({
      where: {
        employeeId: createDto.employeeId,
        isActive: true,
      },
      data: { isActive: false, effectiveTo: new Date() },
    });

    // Calculate totals
    const grossSalary = this.calculateGrossSalary(createDto);
    const totalDeductions = this.calculateTotalDeductions(createDto);
    const netSalary = grossSalary - totalDeductions;
    const ctc = grossSalary + (createDto.pf || 0); // Employer PF contribution

    return await this.database.salaryStructure.create({
      data: {
        ...createDto,
        organizationId: employee.organizationId,
        hra: createDto.hra || 0,
        conveyance: createDto.conveyance || 0,
        medicalAllowance: createDto.medicalAllowance || 0,
        specialAllowance: createDto.specialAllowance || 0,
        otherAllowances: createDto.otherAllowances || 0,
        pf: createDto.pf || 0,
        esi: createDto.esi || 0,
        professionalTax: createDto.professionalTax || 0,
        tds: createDto.tds || 0,
        otherDeductions: createDto.otherDeductions || 0,
        grossSalary,
        netSalary,
        ctc,
        effectiveFrom: new Date(createDto.effectiveFrom),
        effectiveTo: createDto.effectiveTo
          ? new Date(createDto.effectiveTo)
          : null,
      },
      include: {
        employee: {
          include: {
            user: { select: { email: true } },
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  /**
   * UPDATE SALARY STRUCTURE
   */
  async update(id: string, updateDto: UpdateSalaryStructureDto) {
    const existing = await this.database.salaryStructure.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Salary structure not found');
    }

    // Recalculate if any salary component is updated
    const updatedData: any = { ...updateDto };

    if (
      Object.keys(updateDto).some((key) =>
        [
          'basicSalary',
          'hra',
          'conveyance',
          'medicalAllowance',
          'specialAllowance',
          'otherAllowances',
          'pf',
          'esi',
          'professionalTax',
          'tds',
          'otherDeductions',
        ].includes(key),
      )
    ) {
      const mergedData = { ...existing, ...updateDto };
      updatedData.grossSalary = this.calculateGrossSalary(mergedData as any);
      updatedData.netSalary =
        updatedData.grossSalary -
        this.calculateTotalDeductions(mergedData as any);
      updatedData.ctc = updatedData.grossSalary + (mergedData.pf || 0);
    }

    if (updateDto.effectiveFrom) {
      updatedData.effectiveFrom = new Date(updateDto.effectiveFrom);
    }

    if (updateDto.effectiveTo) {
      updatedData.effectiveTo = new Date(updateDto.effectiveTo);
    }

    return await this.database.salaryStructure.update({
      where: { id },
      data: updatedData,
      include: {
        employee: {
          include: {
            user: { select: { email: true } },
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  /**
   * GET ALL SALARY STRUCTURES
   */
  async findAll(filters: {
    employeeId?: string;
    departmentId?: string;
    designationId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.departmentId || filters.designationId) {
      where.employee = {};
      if (filters.departmentId)
        where.employee.departmentId = filters.departmentId;
      if (filters.designationId)
        where.employee.designationId = filters.designationId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [salaryStructures, total] = await Promise.all([
      this.database.salaryStructure.findMany({
        where,
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.database.salaryStructure.count({ where }),
    ]);

    return {
      data: salaryStructures,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET SINGLE SALARY STRUCTURE
   */
  async findOne(id: string) {
    const salaryStructure = await this.database.salaryStructure.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { email: true } },
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!salaryStructure) {
      throw new NotFoundException('Salary structure not found');
    }

    return salaryStructure;
  }

  /**
   * GET ACTIVE SALARY STRUCTURE FOR EMPLOYEE
   */
  async getActiveSalaryStructure(employeeId: string) {
    return await this.database.salaryStructure.findFirst({
      where: {
        employeeId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      include: {
        employee: {
          include: {
            user: { select: { email: true } },
            department: true,
            designation: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * GET SALARY HISTORY FOR EMPLOYEE
   */
  async getSalaryHistory(employeeId: string) {
    return await this.database.salaryStructure.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * DELETE SALARY STRUCTURE
   */
  async delete(id: string) {
    const salaryStructure = await this.database.salaryStructure.findUnique({
      where: { id },
    });

    if (!salaryStructure) {
      throw new NotFoundException('Salary structure not found');
    }

    // Check if used in payroll runs
    const payrollCount = await this.database.payrollRun.count({
      where: { employeeId: salaryStructure.employeeId },
    });

    if (payrollCount > 0) {
      throw new BadRequestException(
        'Cannot delete salary structure with associated payroll runs. Consider deactivating instead.',
      );
    }

    await this.database.salaryStructure.delete({ where: { id } });
    return { success: true, message: 'Salary structure deleted successfully' };
  }

  /**
   * DEACTIVATE SALARY STRUCTURE
   */
  async deactivate(id: string) {
    return await this.database.salaryStructure.update({
      where: { id },
      data: { isActive: false, effectiveTo: new Date() },
    });
  }

  /**
   * HELPER: CALCULATE GROSS SALARY
   */
  private calculateGrossSalary(data: CreateSalaryStructureDto | any): number {
    return (
      (data.basicSalary || 0) +
      (data.hra || 0) +
      (data.conveyance || 0) +
      (data.medicalAllowance || 0) +
      (data.specialAllowance || 0) +
      (data.otherAllowances || 0)
    );
  }

  /**
   * HELPER: CALCULATE TOTAL DEDUCTIONS
   */
  private calculateTotalDeductions(
    data: CreateSalaryStructureDto | any,
  ): number {
    return (
      (data.pf || 0) +
      (data.esi || 0) +
      (data.professionalTax || 0) +
      (data.tds || 0) +
      (data.otherDeductions || 0)
    );
  }

  /**
   * GET DASHBOARD STATS
   */
  async getDashboardStats() {
    const [
      totalEmployeesWithSalary,
      totalActive,
      avgSalary,
      totalGross,
      totalNet,
    ] = await Promise.all([
      this.database.salaryStructure.count(),
      this.database.salaryStructure.count({ where: { isActive: true } }),
      this.database.salaryStructure.aggregate({
        where: { isActive: true },
        _avg: { netSalary: true },
      }),
      this.database.salaryStructure.aggregate({
        where: { isActive: true },
        _sum: { grossSalary: true },
      }),
      this.database.salaryStructure.aggregate({
        where: { isActive: true },
        _sum: { netSalary: true },
      }),
    ]);

    return {
      totalEmployeesWithSalary,
      totalActive,
      averageSalary: avgSalary._avg.netSalary || 0,
      totalGrossSalary: totalGross._sum.grossSalary || 0,
      totalNetSalary: totalNet._sum.netSalary || 0,
    };
  }

  /**
   * GET EMPLOYEE SALARY LIST (WITH JOINS)
   */
  async getEmployeeSalaryList(filters: {
    search?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    // Fetch employees with salary structures
    const [employees, total] = await Promise.all([
      this.database.employee.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true },
          },
          designation: {
            select: { id: true, name: true },
          },
          salaryStructures: {
            where: { isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
        orderBy: { employeeId: 'asc' },
        skip,
        take: limit,
      }),
      this.database.employee.count({ where }),
    ]);

    // Map data for frontend
    const data = employees.map((emp) => {
      const activeSalary = emp.salaryStructures[0];
      return {
        id: emp.id,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'N/A',
        departmentId: emp.department?.id || null,
        designation: emp.designation?.name || 'N/A',
        designationId: emp.designation?.id || null,
        monthlySalary: activeSalary?.netSalary || 0,
        basicSalary: activeSalary?.basicSalary || 0,
        hra: activeSalary?.hra || 0,
        specialAllowance: activeSalary?.specialAllowance || 0,
        grossSalary: activeSalary?.grossSalary || 0,
        netSalary: activeSalary?.netSalary || 0,
        status: activeSalary ? 'ACTIVE' : 'NOT_CONFIGURED',
        salaryStructureId: activeSalary?.id || null,
        effectiveFrom: activeSalary?.effectiveFrom?.toISOString() || null,
        ctc: activeSalary?.ctc || 0,
      };
    });

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
