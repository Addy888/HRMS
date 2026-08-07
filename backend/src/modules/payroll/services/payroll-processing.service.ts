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

@Injectable()
export class PayrollProcessingService {
  private readonly logger = new Logger(PayrollProcessingService.name);

  constructor(private readonly database: PrismaService) {}

  /**
   * PROCESS PAYROLL FOR SINGLE EMPLOYEE
   */
  async processForEmployee(
    employeeId: string,
    month: number,
    year: number,
    processedBy?: string,
  ) {
    // Check if already processed
    const existing = await this.database.payrollRun.findFirst({
      where: { employeeId, month, year },
    });

    if (existing && existing.status === 'PAID') {
      throw new BadRequestException('Payroll already paid for this period');
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
      throw new NotFoundException(
        `No active salary structure found for employee`,
      );
    }

    // Get attendance data for the month
    const attendanceData = await this.getAttendanceImpact(
      employeeId,
      month,
      year,
    );

    // Get leave impact
    const leaveImpact = await this.getLeaveImpact(employeeId, month, year);

    // Calculate components
    const workingDays = attendanceData.totalWorkingDays;
    const presentDays =
      attendanceData.presentDays + attendanceData.paidLeaveDays;
    const absentDays = attendanceData.absentDays + attendanceData.lwpDays;
    const halfDays = attendanceData.halfDays;

    // Per day salary
    const perDaySalary = salaryStructure.grossSalary / workingDays;

    // Calculate deductions
    let absentDeduction = 0;
    let halfDayDeduction = 0;
    let lateDeduction = 0;

    if (absentDays > 0) {
      absentDeduction = perDaySalary * absentDays;
    }

    if (halfDays > 0) {
      halfDayDeduction = (perDaySalary * halfDays) / 2;
    }

    if (attendanceData.lateDays > 0) {
      // Late mark deduction (example: 200 per late mark)
      lateDeduction = attendanceData.lateDays * 200;
    }

    // Calculate overtime
    const overtimeAmount = attendanceData.overtimeHours * 100; // 100 per hour

    // Final calculations
    const basicSalary = salaryStructure.basicSalary;
    const allowances =
      salaryStructure.hra +
      salaryStructure.conveyance +
      salaryStructure.medicalAllowance +
      salaryStructure.specialAllowance +
      salaryStructure.otherAllowances;

    const grossSalary = basicSalary + allowances + overtimeAmount;

    const totalDeductions =
      salaryStructure.pf +
      salaryStructure.esi +
      salaryStructure.professionalTax +
      salaryStructure.tds +
      salaryStructure.otherDeductions +
      absentDeduction +
      halfDayDeduction +
      lateDeduction +
      leaveImpact.deductionAmount;

    const netSalary = grossSalary - totalDeductions;

    const payrollData = {
      employeeId,
      month,
      year,
      basicSalary,
      allowances: allowances + overtimeAmount,
      deductions: totalDeductions,
      grossSalary,
      netSalary,
      status: 'PENDING',
      processedBy,
      processedAt: new Date(),
    };

    if (existing) {
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
   */
  async processBulkPayroll(dto: ProcessPayrollDto) {
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

    const results: Array<{
      employeeId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const employee of employees) {
      try {
        await this.processForEmployee(
          employee.id,
          dto.month,
          dto.year,
          dto.processedBy,
        );
        results.push({ employeeId: employee.employeeId, success: true });
      } catch (error: any) {
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
   * GET ATTENDANCE IMPACT
   */
  private async getAttendanceImpact(
    employeeId: string,
    month: number,
    year: number,
  ) {
    // Get total working days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month - 1, daysInMonth);

    // Get attendance summary if exists
    const summary = await this.database.attendanceSummary.findFirst({
      where: { employeeId, month, year },
    });

    if (summary) {
      return {
        totalWorkingDays: summary.totalWorkingDays,
        presentDays: summary.presentDays,
        absentDays: summary.absentDays,
        lateDays: summary.lateDays,
        halfDays: summary.halfDays,
        paidLeaveDays: summary.leaveDays,
        lwpDays: 0, // Calculate separately if needed
        overtimeHours: summary.overtimeHours,
      };
    }

    // Fallback: Calculate from attendance records
    const attendances = await this.database.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    const presentDays = attendances.filter(
      (a) => a.status === 'PRESENT',
    ).length;
    const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;
    const lateDays = attendances.filter((a) => a.status === 'LATE').length;
    const halfDays = attendances.filter((a) => a.status === 'HALF_DAY').length;
    const leaveDays = attendances.filter((a) => a.status === 'LEAVE').length;
    const overtimeHours = attendances.reduce(
      (sum, a) => sum + (a.overtime || 0),
      0,
    );

    return {
      totalWorkingDays: daysInMonth,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      paidLeaveDays: leaveDays,
      lwpDays: 0,
      overtimeHours,
    };
  }

  /**
   * GET LEAVE IMPACT
   */
  private async getLeaveImpact(
    employeeId: string,
    month: number,
    year: number,
  ) {
    // This would integrate with Leave module when available
    // For now, returning zero impact
    return {
      deductionAmount: 0,
      lwpDays: 0,
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
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  PAYROLL DASHBOARD STATS - SERVICE                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('📥 Service Input:');
    console.log('   month (parameter):', month);
    console.log('   year (parameter):', year);
    
    const currentDate = new Date();
    const currentMonth = month || currentDate.getMonth() + 1;
    const currentYear = year || currentDate.getFullYear();
    
    console.log('📅 Calculated Values:');
    console.log('   currentMonth:', currentMonth);
    console.log('   currentYear:', currentYear);

    const where = { month: currentMonth, year: currentYear };
    console.log('🔍 Prisma where clause:', where);

    try {
      console.log('\n🔄 Starting Prisma queries...\n');

      // Query 1: Total Employees
      console.log('1️⃣  QUERY: database.employee.count()');
      let totalEmployees = 0;
      try {
        totalEmployees = await this.database.employee.count();
        console.log('   ✅ Result:', totalEmployees);
      } catch (err) {
        console.error('   ❌ ERROR in employee.count():');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      // Query 2: Pending Payroll
      console.log('\n2️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PENDING } })');
      console.log('   Where:', { ...where, status: 'PENDING' });
      let pendingPayroll = 0;
      try {
        pendingPayroll = await this.database.payrollRun.count({
          where: { ...where, status: 'PENDING' },
        });
        console.log('   ✅ Result:', pendingPayroll);
      } catch (err) {
        console.error('   ❌ ERROR in payrollRun.count(PENDING):');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      // Query 3: Processed Payroll
      console.log('\n3️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PROCESSED } })');
      console.log('   Where:', { ...where, status: 'PROCESSED' });
      let processedPayroll = 0;
      try {
        processedPayroll = await this.database.payrollRun.count({
          where: { ...where, status: 'PROCESSED' },
        });
        console.log('   ✅ Result:', processedPayroll);
      } catch (err) {
        console.error('   ❌ ERROR in payrollRun.count(PROCESSED):');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      // Query 4: Paid Payroll
      console.log('\n4️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PAID } })');
      console.log('   Where:', { ...where, status: 'PAID' });
      let paidPayroll = 0;
      try {
        paidPayroll = await this.database.payrollRun.count({
          where: { ...where, status: 'PAID' },
        });
        console.log('   ✅ Result:', paidPayroll);
      } catch (err) {
        console.error('   ❌ ERROR in payrollRun.count(PAID):');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      // Query 5: Monthly Salary Sum
      console.log('\n5️⃣  QUERY: database.payrollRun.aggregate({ where, _sum: { netSalary: true } })');
      console.log('   Where:', where);
      let monthlySalary: any = { _sum: { netSalary: 0 } };
      try {
        monthlySalary = await this.database.payrollRun.aggregate({
          where,
          _sum: { netSalary: true },
        });
        console.log('   ✅ Result:', monthlySalary);
      } catch (err) {
        console.error('   ❌ ERROR in payrollRun.aggregate(_sum):');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      // Query 6: Average Salary
      console.log('\n6️⃣  QUERY: database.payrollRun.aggregate({ where, _avg: { netSalary: true } })');
      console.log('   Where:', where);
      let avgSalary: any = { _avg: { netSalary: 0 } };
      try {
        avgSalary = await this.database.payrollRun.aggregate({
          where,
          _avg: { netSalary: true },
        });
        console.log('   ✅ Result:', avgSalary);
      } catch (err) {
        console.error('   ❌ ERROR in payrollRun.aggregate(_avg):');
        console.error('      Error:', err);
        console.error('      Message:', err instanceof Error ? err.message : 'Unknown');
        console.error('      Stack:', err instanceof Error ? err.stack : 'No stack');
        throw err;
      }

      console.log('\n✅ ALL QUERIES COMPLETED SUCCESSFULLY\n');

      const result = {
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

      console.log('📊 Final Result Object:');
      console.log(result);
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      return result;
    } catch (error) {
      console.error('\n❌ FATAL ERROR IN getDashboardStats():');
      console.error('   Error:', error);
      console.error('   Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('   Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('╚════════════════════════════════════════════════════════════╝\n');
      throw error;
    }
  }
}
