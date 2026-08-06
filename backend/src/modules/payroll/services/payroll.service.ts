/**
 * PAYROLL SERVICE (Simplified)
 *
 * Works with existing Prisma schema
 * Generates payroll based on SalaryStructure
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly database: PrismaService) {}

  /**
   * GENERATE PAYROLL FOR SINGLE EMPLOYEE
   */
  async generateForEmployee(
    employeeId: string,
    month: number,
    year: number,
    processedBy?: string,
  ) {
    // Check if payroll already exists
    const existing = await this.database.payrollRun.findFirst({
      where: { employeeId, month, year },
    });

    if (existing && existing.status === 'PAID') {
      throw new BadRequestException('Payroll for this period is already paid');
    }

    // Get active salary structure
    const salaryStructure = await this.database.salaryStructure.findFirst({
      where: {
        employeeId,
        isActive: true,
        effectiveFrom: { lte: new Date(year, month - 1, 1) },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!salaryStructure) {
      throw new NotFoundException('No active salary structure found');
    }

    const payrollData = {
      employeeId,
      month,
      year,
      basicSalary: salaryStructure.basicSalary,
      allowances:
        salaryStructure.hra +
        salaryStructure.conveyance +
        salaryStructure.medicalAllowance +
        salaryStructure.specialAllowance +
        salaryStructure.otherAllowances,
      deductions:
        salaryStructure.pf +
        salaryStructure.esi +
        salaryStructure.professionalTax +
        salaryStructure.tds +
        salaryStructure.otherDeductions,
      grossSalary: salaryStructure.grossSalary,
      netSalary: salaryStructure.netSalary,
      status: 'PENDING',
      processedBy,
    };

    if (existing) {
      return await this.database.payrollRun.update({
        where: { id: existing.id },
        data: payrollData,
      });
    }

    return await this.database.payrollRun.create({ data: payrollData });
  }

  /**
   * GENERATE FOR ALL EMPLOYEES
   */
  async generateForAllEmployees(
    month: number,
    year: number,
    processedBy?: string,
  ) {
    const employees = await this.database.employee.findMany({
      select: { id: true, firstName: true, lastName: true, employeeId: true },
    });

    const results: Array<{
      employeeId: string;
      success: boolean;
      error?: string;
    }> = [];
    for (const employee of employees) {
      try {
        await this.generateForEmployee(employee.id, month, year, processedBy);
        results.push({ employeeId: employee.employeeId, success: true });
      } catch (error) {
        results.push({
          employeeId: employee.employeeId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      totalEmployees: employees.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * GET PAYROLL HISTORY
   */
  async getPayrollHistory(filters: {
    employeeId?: string;
    month?: number;
    year?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;

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
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.database.payrollRun.count({ where }),
    ]);

    return { payrollRuns, total };
  }

  /**
   * APPROVE PAYROLL
   */
  async approvePayroll(payrollRunId: string) {
    return await this.database.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  }

  /**
   * MARK AS PAID
   */
  async markAsPaid(payrollRunId: string, paymentDate: Date) {
    return await this.database.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'PAID', paymentDate },
    });
  }

  /**
   * GET SINGLE PAYROLL RUN
   */
  async getPayrollRun(payrollRunId: string) {
    const payrollRun = await this.database.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    return payrollRun;
  }

  /**
   * GET PAYROLL SUMMARY
   */
  async getPayrollSummary(month: number, year: number) {
    const payrollRuns = await this.database.payrollRun.findMany({
      where: { month, year },
    });

    const summary = {
      totalEmployees: payrollRuns.length,
      totalGrossSalary: payrollRuns.reduce(
        (sum, run) => sum + run.grossSalary,
        0,
      ),
      totalDeductions: payrollRuns.reduce(
        (sum, run) => sum + run.deductions,
        0,
      ),
      totalNetSalary: payrollRuns.reduce((sum, run) => sum + run.netSalary, 0),
      byStatus: {
        PENDING: payrollRuns.filter((r) => r.status === 'PENDING').length,
        PROCESSED: payrollRuns.filter((r) => r.status === 'PROCESSED').length,
        PAID: payrollRuns.filter((r) => r.status === 'PAID').length,
        FAILED: payrollRuns.filter((r) => r.status === 'FAILED').length,
      },
    };

    return summary;
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
}
