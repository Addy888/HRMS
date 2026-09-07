/**
 * EMPLOYEE PAYROLL CONTROLLER
 * 
 * Endpoints for employees to view their own payroll information
 * 
 * SECURITY: All endpoints verify that employees can ONLY access their own data
 */

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { PrismaService } from '../../../database/prisma.service';
import { PayrollCalculationEngine, PayrollCalculationResult } from '../engine/payroll-calculation.engine';

@Controller('employee/payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE)
export class EmployeePayrollController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationEngine: PayrollCalculationEngine,
  ) {}

  /**
   * Get employee's own payroll history
   * Employee can ONLY see their own data
   */
  @Get('history')
  async getMyPayrollHistory(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;

    // Get employee record from userId
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true, employeeId: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Build query
    const where: any = { employeeId: employee.id };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    const [payrollRuns, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        include: {
          payslip: {
            select: {
              id: true,
              payslipNumber: true,
              pdfUrl: true,
              sentToEmployee: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: limitNum,
      }),
      this.prisma.payrollRun.count({ where }),
    ]);

    return {
      success: true,
      data: payrollRuns,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get current month payroll summary for dashboard
   */
  @Get('current-month')
  async getCurrentMonthPayroll(@Request() req: any) {
    const userId = req.user.userId;

    // Get employee record
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { 
        id: true, 
        employeeId: true, 
        firstName: true, 
        lastName: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month payroll
    const payroll = await this.prisma.payrollRun.findFirst({
      where: {
        employeeId: employee.id,
        month: currentMonth,
        year: currentYear,
      },
      include: {
        payslip: true,
      },
    });

    if (!payroll) {
      return {
        success: true,
        message: 'Payroll not processed for this month',
        data: null,
      };
    }

    // Get detailed calculation if processed
    let calculationDetails: PayrollCalculationResult | null = null;
    try {
      calculationDetails = await this.calculationEngine.calculateEmployeePayroll(
        employee.id,
        currentMonth,
        currentYear,
      );
    } catch (error) {
      // If calculation fails, just return basic payroll data
      console.error('Failed to get calculation details:', error);
    }

    return {
      success: true,
      data: {
        ...payroll,
        employee: {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          department: employee.department?.name,
          designation: employee.designation?.name,
        },
        calculationDetails,
      },
    };
  }

  /**
   * Get detailed payroll breakdown for a specific month
   */
  @Get('details')
  async getPayrollDetails(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    if (!month || !year) {
      throw new NotFoundException('Month and year are required');
    }

    const userId = req.user.userId;

    // Get employee record
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { 
        id: true, 
        employeeId: true, 
        firstName: true, 
        lastName: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Get payroll run
    const payroll = await this.prisma.payrollRun.findFirst({
      where: {
        employeeId: employee.id,
        month: monthNum,
        year: yearNum,
      },
      include: {
        payslip: true,
      },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found for this period');
    }

    // Get detailed calculation
    const calculation = await this.calculationEngine.calculateEmployeePayroll(
      employee.id,
      monthNum,
      yearNum,
    );

    return {
      success: true,
      data: {
        payroll,
        employee: {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          department: employee.department?.name,
          designation: employee.designation?.name,
        },
        breakdown: calculation,
      },
    };
  }

  /**
   * Get salary slip for a specific payroll
   */
  @Get('payslip/:payrollRunId')
  async getPayslip(@Request() req: any, @Param('payrollRunId') payrollRunId: string) {
    const userId = req.user.userId;

    // Get employee record
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Get payroll run and verify ownership
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        payslip: true,
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
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Security check: Employee can only access their own payslip
    if (payrollRun.employeeId !== employee.id) {
      throw new ForbiddenException('You can only access your own payslips');
    }

    return {
      success: true,
      data: payrollRun,
    };
  }

  /**
   * Get annual salary summary
   */
  @Get('annual-summary')
  async getAnnualSummary(
    @Request() req: any,
    @Query('year') year?: string,
  ) {
    const userId = req.user.userId;

    // Get employee record
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true, employeeId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const yearNum = year ? parseInt(year) : new Date().getFullYear();

    // Get all payroll runs for the year
    const payrollRuns = await this.prisma.payrollRun.findMany({
      where: {
        employeeId: employee.id,
        year: yearNum,
      },
      orderBy: { month: 'asc' },
    });

    // Calculate totals
    const totalGrossSalary = payrollRuns.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalDeductions = payrollRuns.reduce((sum, p) => sum + p.deductions, 0);
    const totalNetSalary = payrollRuns.reduce((sum, p) => sum + p.netSalary, 0);
    const totalMonthsPaid = payrollRuns.filter(p => p.status === 'PAID').length;

    return {
      success: true,
      data: {
        year: yearNum,
        totalGrossSalary,
        totalDeductions,
        totalNetSalary,
        totalMonthsPaid,
        averageMonthlyNet: totalMonthsPaid > 0 ? totalNetSalary / totalMonthsPaid : 0,
        monthlyBreakdown: payrollRuns,
      },
    };
  }
}
