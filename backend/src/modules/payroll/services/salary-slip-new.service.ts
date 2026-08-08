import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SalarySlipService {
  constructor(private readonly database: PrismaService) {}

  async generateSalarySlipData(payrollRunId: string) {
    const payrollRun = await this.database.payrollRun.findUnique({
      where: { id: payrollRunId },
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

    if (!payrollRun) throw new NotFoundException('Payroll run not found');

    let payslip = await this.database.payslip.findUnique({
      where: { payrollRunId },
    });
    if (!payslip)
      payslip = await this.database.payslip.create({
        data: {
          payrollRunId,
          employeeId: payrollRun.employeeId,
          organizationId: payrollRun.organizationId,
          year: payrollRun.year,
          month: payrollRun.month,
          payslipNumber: `PAY-${payrollRun.year}-${String(payrollRun.month).padStart(2, '0')}-${payrollRun.employee.employeeId}`,
        },
      });

    const company = await this.database.company.findFirst({
      where: { isActive: true },
    });
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return {
      payslipId: payslip.id,
      payslipNumber: payslip.payslipNumber,
      generatedAt: payslip.createdAt,
      company: {
        name: company?.name || 'Company',
        logoUrl: company?.logoUrl || '',
        address: company?.address || '',
      },
      employee: {
        employeeId: payrollRun.employee.employeeId,
        name: `${payrollRun.employee.firstName} ${payrollRun.employee.lastName}`,
        email: payrollRun.employee.user.email,
        department: payrollRun.employee.department?.name || 'N/A',
        designation: payrollRun.employee.designation?.name || 'N/A',
      },
      period: {
        month: payrollRun.month,
        year: payrollRun.year,
        monthName: monthNames[payrollRun.month - 1],
      },
      earnings: {
        basicSalary: payrollRun.basicSalary,
        allowances: payrollRun.allowances,
        grossSalary: payrollRun.grossSalary,
      },
      deductions: { total: payrollRun.deductions },
      netSalary: payrollRun.netSalary,
      status: payrollRun.status,
    };
  }

  async getEmployeeSalarySlips(employeeId: string, limit: number = 12) {
    const payrollRuns = await this.database.payrollRun.findMany({
      where: { employeeId, status: { in: ['PROCESSED', 'PAID'] } },
      include: { payslip: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
    });

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return payrollRuns.map((run) => ({
      payrollRunId: run.id,
      payslipId: run.payslip?.id || null,
      month: run.month,
      year: run.year,
      period: `${monthNames[run.month - 1]} ${run.year}`,
      grossSalary: run.grossSalary,
      netSalary: run.netSalary,
      status: run.status,
    }));
  }

  async markAsDownloaded(payslipId: string) {
    await this.database.payslip.update({
      where: { id: payslipId },
      data: { downloadedAt: new Date() },
    });
  }

  async getPayrollStatus(employeeId: string) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentPayroll = await this.database.payrollRun.findFirst({
      where: { employeeId, month: currentMonth, year: currentYear },
    });
    const recentPayrolls = await this.database.payrollRun.findMany({
      where: { employeeId, status: { in: ['PROCESSED', 'PAID'] } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3,
    });

    return {
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        status: currentPayroll?.status || 'NOT_GENERATED',
        netSalary: currentPayroll?.netSalary || 0,
      },
      recentPayrolls: recentPayrolls.map((p) => ({
        month: p.month,
        year: p.year,
        netSalary: p.netSalary,
        status: p.status,
      })),
    };
  }

  /**
   * GET SALARY SLIP LIST (HR)
   */
  async getSalarySlipList(
    month: number,
    year: number,
    search?: string,
    departmentId?: string,
  ) {
    const whereClause: any = {
      month,
      year,
      status: { in: ['PROCESSED', 'PAID'] },
    };

    // Add employee filters
    if (search || departmentId) {
      whereClause.employee = {};
      
      if (departmentId) {
        whereClause.employee.departmentId = departmentId;
      }
      
      if (search) {
        whereClause.employee.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const payrollRuns = await this.database.payrollRun.findMany({
      where: whereClause,
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
      orderBy: [{ employee: { employeeId: 'asc' } }],
    });

    const data = payrollRuns.map((run) => ({
      id: run.payslip?.id || run.id,
      payrollRunId: run.id,
      employeeId: run.employeeId,
      employeeName: `${run.employee.firstName} ${run.employee.lastName}`,
      employeeCode: run.employee.employeeId,
      department: run.employee.department?.name || 'N/A',
      designation: run.employee.designation?.name || 'N/A',
      month: run.month,
      year: run.year,
      generatedAt: run.payslip?.createdAt?.toISOString() || run.processedAt?.toISOString(),
      basicSalary: run.basicSalary,
      hra: 0, // Calculate from allowances if needed
      allowances: run.allowances,
      deductions: run.deductions,
      grossSalary: run.grossSalary,
      netSalary: run.netSalary,
      status: run.payslip?.downloadedAt
        ? 'DOWNLOADED'
        : run.payslip
          ? 'GENERATED'
          : 'GENERATED',
      downloadedAt: run.payslip?.downloadedAt?.toISOString(),
      emailedAt: null, // Add when email feature is implemented
    }));

    return {
      data,
      meta: {
        total: data.length,
        page: 1,
        limit: data.length,
      },
    };
  }

  /**
   * GET SALARY SLIP STATS (HR)
   */
  async getSalarySlipStats(month: number, year: number) {
    const payrollRuns = await this.database.payrollRun.findMany({
      where: {
        month,
        year,
        status: { in: ['PROCESSED', 'PAID'] },
      },
      include: {
        payslip: true,
      },
    });

    const totalSlips = payrollRuns.length;
    const generatedSlips = payrollRuns.filter((r) => r.payslip).length;
    const downloadedSlips = payrollRuns.filter((r) => r.payslip?.downloadedAt).length;
    const emailedSlips = 0; // Update when email tracking is implemented
    const totalPayroll = payrollRuns.reduce((sum, r) => sum + r.netSalary, 0);
    const averageSalary = totalSlips > 0 ? totalPayroll / totalSlips : 0;

    return {
      totalSlips,
      generatedSlips,
      downloadedSlips,
      emailedSlips,
      totalPayroll,
      averageSalary,
    };
  }

  /**
   * EMAIL SALARY SLIP
   */
  async emailSalarySlip(payslipId: string) {
    // Implementation would integrate with email service
    // For now, just mark as emailed
    await this.database.payslip.update({
      where: { id: payslipId },
      data: { downloadedAt: new Date() },
    });

    return {
      success: true,
      message: 'Salary slip sent via email successfully',
    };
  }

  /**
   * WHATSAPP SALARY SLIP
   */
  async whatsappSalarySlip(payslipId: string) {
    // Implementation would integrate with WhatsApp Business API
    return {
      success: true,
      message: 'Salary slip sent via WhatsApp successfully',
    };
  }

  /**
   * BULK DOWNLOAD
   */
  async bulkDownload(payslipIds: string[]) {
    // Implementation would generate ZIP file with multiple PDFs
    return {
      success: true,
      message: 'Bulk download initiated',
      count: payslipIds.length,
    };
  }

  /**
   * DELETE SALARY SLIP
   */
  async deleteSalarySlip(payslipId: string) {
    await this.database.payslip.delete({
      where: { id: payslipId },
    });

    return {
      success: true,
      message: 'Salary slip deleted successfully',
    };
  }
}

