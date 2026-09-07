import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ProcessPayrollDto,
  BulkProcessPayrollDto,
} from '../dto/process-payroll.dto';
import { PayrollCalculationEngine } from '../engine/payroll-calculation.engine';

@Injectable()
export class PayrollProcessingService {
  private readonly logger = new Logger(PayrollProcessingService.name);

  constructor(
    private readonly database: PrismaService,
    private readonly calculationEngine: PayrollCalculationEngine,
  ) {}

  /**
   * PROCESS PAYROLL FOR SINGLE EMPLOYEE
   * Uses PayrollCalculationEngine for accurate calculations based on real data
   */
  async processForEmployee(
    employeeId: string,
    month: number,
    year: number,
    processedBy?: string,
  ) {
    this.logger.log(`Processing payroll for employee ${employeeId} - ${year}-${month}`);
    
    // Get employee with organization
    const employee = await this.database.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, organizationId: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if already processed and paid
    const existing = await this.database.payrollRun.findFirst({
      where: { employeeId, month, year, organizationId: employee.organizationId },
    });

    if (existing && existing.status === 'PAID') {
      throw new BadRequestException('Payroll already paid for this period. Cannot reprocess.');
    }

    // Use calculation engine to calculate payroll
    const calculation = await this.calculationEngine.calculateEmployeePayroll(
      employeeId,
      month,
      year,
    );

    if (!calculation.hasActiveSalaryStructure) {
      this.logger.warn(`No active salary structure for employee ${employeeId}`);
      // Optionally throw error or continue with zero salary
      // For now, we continue to allow processing
    }

    // Prepare payroll data with detailed breakdown
    const payrollData = {
      employeeId,
      organizationId: employee.organizationId,
      month,
      year,
      basicSalary: calculation.basicSalary,
      allowances: calculation.hra + calculation.conveyance + calculation.medicalAllowance + 
                  calculation.specialAllowance + calculation.otherAllowances + calculation.overtimeAmount,
      deductions: calculation.totalDeductions,
      grossSalary: calculation.grossSalary,
      netSalary: calculation.netSalary,
      status: 'PENDING' as const,
      processedBy,
      processedAt: new Date(),
      remarks: calculation.calculationNotes.length > 0 
        ? calculation.calculationNotes.join('; ') 
        : null,
    };

    this.logger.log(`Payroll calculated for ${employee.firstName} ${employee.lastName}: Net Salary = ₹${calculation.netSalary}`);

    // Create or update payroll run
    if (existing) {
      this.logger.log(`Updating existing payroll run ${existing.id}`);
      return await this.database.payrollRun.update({
        where: { id: existing.id },
        data: payrollData,
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

    this.logger.log(`Creating new payroll run`);
    return await this.database.payrollRun.create({
      data: payrollData,
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
   * PROCESS BULK PAYROLL
   * Processes payroll for multiple employees based on filters
   */
  async processBulkPayroll(dto: ProcessPayrollDto) {
    this.logger.log(`Processing bulk payroll for ${dto.month}/${dto.year}`);
    
    let employees: any[] = [];

    // Build filter
    const where: any = {};
    if (dto.departmentId) where.departmentId = dto.departmentId;
    if (dto.designationId) where.designationId = dto.designationId;
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      where.id = { in: dto.employeeIds };
    }

    employees = await this.database.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
      },
    });

    this.logger.log(`Found ${employees.length} employees to process`);

    const results: Array<{
      employeeId: string;
      success: boolean;
      netSalary?: number;
      error?: string;
    }> = [];

    for (const employee of employees) {
      try {
        const payrollRun = await this.processForEmployee(
          employee.id,
          dto.month,
          dto.year,
          dto.processedBy,
        );
        results.push({ 
          employeeId: employee.employeeId, 
          success: true,
          netSalary: payrollRun.netSalary,
        });
        this.logger.log(`✓ Processed ${employee.employeeId}: ₹${payrollRun.netSalary}`);
      } catch (error: any) {
        results.push({
          employeeId: employee.employeeId,
          success: false,
          error: error.message,
        });
        this.logger.error(`✗ Failed ${employee.employeeId}: ${error.message}`);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    
    this.logger.log(`Bulk processing complete: ${successCount} succeeded, ${failureCount} failed`);

    return {
      totalEmployees: employees.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * APPROVE PAYROLL
   */
  async approvePayroll(payrollRunId: string) {
    return await this.database.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'PROCESSED' },
    });
  }

  /**
   * MARK AS PAID
   */
  async markAsPaid(payrollRunId: string, paymentDate?: Date) {
    return await this.database.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: 'PAID',
        paymentDate: paymentDate || new Date(),
      },
    });
  }

  /**
   * GET PAYROLL HISTORY
   */
  async getPayrollHistory(filters: {
    employeeId?: string;
    month?: number;
    year?: number;
    status?: string;
    departmentId?: string;
    designationId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;

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

    const [payrollRuns, total] = await Promise.all([
      this.database.payrollRun.findMany({
        where,
        include: {
          employee: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
          payslip: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: limit,
      }),
      this.database.payrollRun.count({ where }),
    ]);

    return {
      data: payrollRuns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * DELETE PENDING PAYROLL
   */
  async deletePendingPayroll(payrollRunId: string) {
    const payrollRun = await this.database.payrollRun.findUnique({
      where: { id: payrollRunId },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== 'PENDING') {
      throw new BadRequestException('Only pending payroll can be deleted');
    }

    await this.database.payrollRun.delete({ where: { id: payrollRunId } });
    return { success: true };
  }

  /**
   * GET PAYROLL DASHBOARD STATS
   */
  async getDashboardStats(month?: number, year?: number) {
    const currentDate = new Date();
    const currentMonth = month || currentDate.getMonth() + 1;
    const currentYear = year || currentDate.getFullYear();

    const where = { month: currentMonth, year: currentYear };

    const [
      totalEmployees,
      pendingPayroll,
      processedPayroll,
      paidPayroll,
      monthlySalary,
      avgSalary,
    ] = await Promise.all([
      this.database.employee.count(),
      this.database.payrollRun.count({
        where: { ...where, status: 'PENDING' },
      }),
      this.database.payrollRun.count({
        where: { ...where, status: 'PROCESSED' },
      }),
      this.database.payrollRun.count({
        where: { ...where, status: 'PAID' },
      }),
      this.database.payrollRun.aggregate({
        where,
        _sum: { netSalary: true },
      }),
      this.database.payrollRun.aggregate({
        where,
        _avg: { netSalary: true },
      }),
    ]);

    return {
      totalEmployees,
      pendingPayroll,
      processedPayroll,
      paidEmployees: paidPayroll,
      pendingPayments: processedPayroll,
      monthlySalaryExpense: monthlySalary._sum.netSalary || 0,
      averageSalary: avgSalary._avg.netSalary || 0,
      month: currentMonth,
      year: currentYear,
    };
  }
}
