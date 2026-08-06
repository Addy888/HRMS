import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SalarySlipService {
  constructor(private readonly database: PrismaService) {}

  async generateSalarySlipData(payrollRunId: string) {
    const payrollRun = await this.database.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: { employee: { include: { user: { select: { email: true } }, department: true, designation: true } } },
    });

    if (!payrollRun) throw new NotFoundException('Payroll run not found');

    let payslip = await this.database.payslip.findUnique({ where: { payrollRunId } });
    if (!payslip) payslip = await this.database.payslip.create({ data: { payrollRunId, employeeId: payrollRun.employeeId, year: payrollRun.year, month: payrollRun.month, payslipNumber: `PAY-${payrollRun.year}-${String(payrollRun.month).padStart(2, '0')}-${payrollRun.employee.employeeId}` } });

    const company = await this.database.company.findFirst({ where: { isActive: true } });
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      payslipId: payslip.id,
      payslipNumber: payslip.payslipNumber,
      generatedAt: payslip.createdAt,
      company: { name: company?.name || 'Company', logoUrl: company?.logoUrl || '', address: company?.address || '' },
      employee: {
        employeeId: payrollRun.employee.employeeId,
        name: `${payrollRun.employee.firstName} ${payrollRun.employee.lastName}`,
        email: payrollRun.employee.user.email,
        department: payrollRun.employee.department?.name || 'N/A',
        designation: payrollRun.employee.designation?.name || 'N/A',
      },
      period: { month: payrollRun.month, year: payrollRun.year, monthName: monthNames[payrollRun.month - 1] },
      earnings: { basicSalary: payrollRun.basicSalary, allowances: payrollRun.allowances, grossSalary: payrollRun.grossSalary },
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

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return payrollRuns.map(run => ({
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
    await this.database.payslip.update({ where: { id: payslipId }, data: { downloadedAt: new Date() } });
  }

  async getPayrollStatus(employeeId: string) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentPayroll = await this.database.payrollRun.findFirst({ where: { employeeId, month: currentMonth, year: currentYear } });
    const recentPayrolls = await this.database.payrollRun.findMany({
      where: { employeeId, status: { in: ['PROCESSED', 'PAID'] } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3,
    });

    return {
      currentMonth: { month: currentMonth, year: currentYear, status: currentPayroll?.status || 'NOT_GENERATED', netSalary: currentPayroll?.netSalary || 0 },
      recentPayrolls: recentPayrolls.map(p => ({ month: p.month, year: p.year, netSalary: p.netSalary, status: p.status })),
    };
  }
}
