import {
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { getDaysInMonth } from 'date-fns';
import * as _PDFDocument from 'pdfkit';
const PDFDocument: any = (_PDFDocument as any)?.default || _PDFDocument;
import { PayrollCalculationEngine, TRAINING_RATE_PER_DAY, TRAINING_PERIOD_DAYS } from '../engine/payroll-calculation.engine';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class SalarySlipService {
  constructor(
    private readonly database: PrismaService,
    private readonly calculationEngine: PayrollCalculationEngine,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // CORE: Generate/fetch salary slip data for a payroll run
  // ─────────────────────────────────────────────────────────────────

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

    // Create payslip record if it doesn't exist yet
    let payslip = await this.database.payslip.findUnique({
      where: { payrollRunId },
    });
    if (!payslip) {
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
    }

    const company = await this.database.company.findFirst({
      where: { isActive: true },
    });

    // 1. Fetch previous payroll run for this employee (strictly prior to current month/year)
    const prevRun = await this.database.payrollRun.findFirst({
      where: {
        employeeId: payrollRun.employeeId,
        OR: [
          { year: { lt: payrollRun.year } },
          { year: payrollRun.year, month: { lt: payrollRun.month } },
        ],
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
    const previousSalary = prevRun ? prevRun.netSalary : null;

    // 2. Fetch active salary structure for CTC / LPA
    const salaryStructure = await this.database.salaryStructure.findFirst({
      where: { employeeId: payrollRun.employeeId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    const monthlySalary = payrollRun.employee.monthlySalary || salaryStructure?.grossSalary || payrollRun.basicSalary || 0;
    const annualCtc = salaryStructure?.ctc || (monthlySalary * 12);
    const annualCtcLpa = annualCtc > 0 ? `₹${(annualCtc / 100000).toFixed(2)} LPA` : 'N/A';

    // 3. Pay Period & Dates
    const daysInMonth = getDaysInMonth(new Date(payrollRun.year, payrollRun.month - 1));
    const monthName = MONTH_NAMES[payrollRun.month - 1];

    const empEndDate = (payrollRun.employee as any).endDate ? new Date((payrollRun.employee as any).endDate) : null;
    const isFullAndFinal = !!empEndDate && (
      empEndDate.getFullYear() < payrollRun.year ||
      (empEndDate.getFullYear() === payrollRun.year && empEndDate.getMonth() + 1 <= payrollRun.month)
    );

    const periodStart = `01 ${monthName} ${payrollRun.year}`;
    let periodEnd = `${String(daysInMonth).padStart(2, '0')} ${monthName} ${payrollRun.year}`;
    if (isFullAndFinal && empEndDate && empEndDate.getFullYear() === payrollRun.year && empEndDate.getMonth() + 1 === payrollRun.month) {
      periodEnd = `${String(empEndDate.getDate()).padStart(2, '0')} ${monthName} ${payrollRun.year}`;
    }
    const payPeriod = `${periodStart} – ${periodEnd}`;

    const joiningDateFormatted = payrollRun.employee.joiningDate
      ? new Date(payrollRun.employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';
    const endDateFormatted = empEndDate
      ? empEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';

    const paymentDateFormatted = payrollRun.paymentDate
      ? new Date(payrollRun.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : (payrollRun.status === 'PAID' && payrollRun.processedAt ? new Date(payrollRun.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null);

    return {
      payslipId: payslip.id,
      payrollRunId: payrollRun.id,
      payslipNumber: payslip.payslipNumber,
      generatedAt: payslip.createdAt,
      employeeDbId: payrollRun.employeeId,   // DB UUID for ownership checks
      company: {
        name: 'FCS Firstclose Solution',
        logoUrl: company?.logoUrl || '',
        address: company?.address || '',
      },
      employee: {
        employeeId: payrollRun.employee.employeeId,
        name: `${payrollRun.employee.firstName} ${payrollRun.employee.lastName}`,
        email: payrollRun.employee.user.email,
        department: payrollRun.employee.department?.name || 'N/A',
        designation: payrollRun.employee.designation?.name || 'N/A',
        joiningDate: payrollRun.employee.joiningDate,
        joiningDateFormatted,
        endDate: empEndDate,
        endDateFormatted,
      },
      period: {
        month: payrollRun.month,
        year: payrollRun.year,
        monthName,
        payPeriod,
      },
      salary: {
        monthlySalary,
        annualCtcLpa,
        previousSalary, // number | null (null if first salary)
        currentMonthSalary: payrollRun.grossSalary, // Current applicable salary
        netSalary: payrollRun.netSalary,
        deductions: payrollRun.deductions,
      },
      payment: {
        status: payrollRun.status === 'PAID' ? 'Paid' : (payrollRun.status === 'PROCESSED' ? 'Processed' : 'Pending'),
        rawStatus: payrollRun.status,
        paymentDate: paymentDateFormatted,
      },
      isFullAndFinal,
      title: isFullAndFinal ? 'FULL & FINAL SETTLEMENT' : 'SALARY SLIP',
      // Legacy compatibility
      grossSalary: payrollRun.grossSalary,
      netSalary: payrollRun.netSalary,
      status: payrollRun.status,
      earnings: {
        basicSalary: payrollRun.basicSalary,
        allowances: payrollRun.allowances,
        grossSalary: payrollRun.grossSalary,
      },
      deductions: {
        total: payrollRun.deductions,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HR: Search employees with their payroll status for a month/year
  // Returns employees even if no PayrollRun exists
  // ─────────────────────────────────────────────────────────────────

  async searchEmployeesWithPayrollStatus(
    month: number,
    year: number,
    search?: string,
    departmentId?: string,
  ) {
    // Build employee filter
    const empWhere: any = {};

    if (departmentId) {
      empWhere.departmentId = departmentId;
    }

    if (search && search.trim()) {
      const s = search.trim();
      // MySQL is case-insensitive by default — no mode needed
      empWhere.OR = [
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { employeeId: { contains: s } },
      ];
    }

    // Fetch matching employees
    const employees = await this.database.employee.findMany({
      where: empWhere,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        payrollRuns: {
          where: { month, year },
          include: { payslip: true },
          take: 1,
        },
      },
      orderBy: { employeeId: 'asc' },
      take: 50,
    });

    return employees.map((emp) => {
      const run = emp.payrollRuns[0] ?? null;
      return {
        employeeDbId: emp.id,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'N/A',
        designation: emp.designation?.name || 'N/A',
        joiningDate: emp.joiningDate,
        endDate: (emp as any).endDate || null,
        monthlySalary: emp.monthlySalary ?? 0,
        month,
        year,
        payrollRunId: run?.id ?? null,
        payrollStatus: run ? run.status : 'NOT_GENERATED',
        grossSalary: run?.grossSalary ?? 0,
        netSalary: run?.netSalary ?? 0,
        deductions: run?.deductions ?? 0,
        basicSalary: run?.basicSalary ?? 0,
        allowances: run?.allowances ?? 0,
        payslipId: run?.payslip?.id ?? null,
        payslipNumber: run?.payslip?.payslipNumber ?? null,
        downloadedAt: run?.payslip?.downloadedAt ?? null,
        generatedAt: run?.payslip?.createdAt ?? run?.processedAt ?? null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // HR: Get salary slip list (only payrolls that have been run)
  // ─────────────────────────────────────────────────────────────────

  async getSalarySlipList(
    month: number,
    year: number,
    search?: string,
    departmentId?: string,
  ) {
    const whereClause: any = { month, year };

    if (search || departmentId) {
      whereClause.employee = {};
      if (departmentId) whereClause.employee.departmentId = departmentId;
      if (search && search.trim()) {
        const s = search.trim();
        whereClause.employee.OR = [
          { firstName: { contains: s } },
          { lastName: { contains: s } },
          { employeeId: { contains: s } },
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
      hra: 0,
      allowances: run.allowances,
      deductions: run.deductions,
      grossSalary: run.grossSalary,
      netSalary: run.netSalary,
      payrollStatus: run.status,
      status: run.payslip?.downloadedAt
        ? 'DOWNLOADED'
        : run.payslip
          ? 'GENERATED'
          : 'PAYROLL_ONLY',
      hasPayslip: !!run.payslip,
      downloadedAt: run.payslip?.downloadedAt?.toISOString(),
      emailedAt: null,
    }));

    return {
      data,
      meta: { total: data.length, page: 1, limit: data.length },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HR: Dashboard stats — based on all payroll runs (not just payslips)
  // ─────────────────────────────────────────────────────────────────

  async getSalarySlipStats(month: number, year: number) {
    const payrollRuns = await this.database.payrollRun.findMany({
      where: { month, year },
      include: { payslip: true },
    });

    const totalSlips = payrollRuns.length;
    const generatedSlips = payrollRuns.filter((r) => r.payslip).length;
    const downloadedSlips = payrollRuns.filter((r) => r.payslip?.downloadedAt).length;
    const emailedSlips = 0;
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

  // ─────────────────────────────────────────────────────────────────
  // EMPLOYEE: Get their own salary slips
  // ─────────────────────────────────────────────────────────────────

  async getEmployeeSalarySlips(employeeId: string, limit: number = 12) {
    const payrollRuns = await this.database.payrollRun.findMany({
      where: { employeeId },
      include: { payslip: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
    });

    return payrollRuns.map((run) => ({
      payrollRunId: run.id,
      payslipId: run.payslip?.id || null,
      month: run.month,
      year: run.year,
      period: `${MONTH_NAMES[run.month - 1]} ${run.year}`,
      grossSalary: run.grossSalary,
      deductions: run.deductions,
      netSalary: run.netSalary,
      status: run.status,
      hasPayslip: !!run.payslip,
    }));
  }

  // ─────────────────────────────────────────────────────────────────
  // MARK AS DOWNLOADED
  // ─────────────────────────────────────────────────────────────────

  async markAsDownloaded(payslipId: string) {
    await this.database.payslip.update({
      where: { id: payslipId },
      data: { downloadedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PAYROLL STATUS (employee dashboard)
  // ─────────────────────────────────────────────────────────────────

  async getPayrollStatus(employeeId: string) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentPayroll = await this.database.payrollRun.findFirst({
      where: { employeeId, month: currentMonth, year: currentYear },
    });
    const recentPayrolls = await this.database.payrollRun.findMany({
      where: { employeeId },
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

  // ─────────────────────────────────────────────────────────────────
  // PDF GENERATION — pdfkit
  // ─────────────────────────────────────────────────────────────────

  async generateSalarySlipPdf(payrollRunId: string): Promise<Buffer> {
    const slipData = await this.generateSalarySlipData(payrollRunId);

    return new Promise<Buffer>((resolve, reject) => {
      const PDFDoc = (PDFDocument as any)?.default || PDFDocument;
      const doc = new PDFDoc({ margin: 45, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const {
        company,
        employee,
        period,
        salary,
        payment,
        isFullAndFinal,
        title,
        payslipNumber,
      } = slipData;

      const W = 505; // usable width on A4 with 45pt margins
      const startX = 45;
      let y = 45;

      // ── Header: Company Name & Subtitle ──────────────────────────
      doc.fillColor('#0f2942')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(company.name, startX, y);
      y += 26;

      doc.fillColor('#64748b')
         .fontSize(9.5)
         .font('Helvetica')
         .text('Human Resources & Payroll Department', startX, y);
      y += 18;

      // Top divider line
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(startX, y).lineTo(startX + W, y).stroke();
      y += 12;

      // ── Document Title Banner ────────────────────────────────────
      doc.rect(startX, y, W, 34).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.5).fillAndStroke();

      doc.fillColor('#0f2942')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text(title, startX + 12, y + 6);

      doc.fillColor('#64748b')
         .fontSize(9)
         .font('Helvetica')
         .text(`${period.monthName} ${period.year}`, startX + 12, y + 21);

      doc.fillColor('#475569')
         .fontSize(8.5)
         .font('Helvetica')
         .text(`Slip No: ${payslipNumber}`, startX + W - 180, y + 6, { width: 170, align: 'right' })
         .text(`Generated: ${new Date(slipData.generatedAt).toLocaleDateString('en-GB')}`, startX + W - 180, y + 20, { width: 170, align: 'right' });

      y += 46;

      // ── Section 1: EMPLOYEE INFORMATION ──────────────────────────
      doc.rect(startX, y, W, 18).fillColor('#0f2942').fill();
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('EMPLOYEE INFORMATION', startX + 10, y + 5);
      y += 18;

      const colW = W / 2;
      const empRows: [string, string, string, string][] = [
        ['Employee Name:', employee.name, 'Joining Date:', employee.joiningDateFormatted],
        ['Employee ID:', employee.employeeId, 'End Date:', employee.endDateFormatted],
        ['Designation:', employee.designation, 'Pay Period:', period.payPeriod],
        ['Department:', employee.department, '', ''],
      ];

      empRows.forEach((row, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(startX, y, W, 20).fillColor(rowBg).strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();

        // Left column
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text(row[0], startX + 10, y + 5, { width: 95 });
        doc.fillColor('#0f172a').font('Helvetica').text(row[1], startX + 105, y + 5, { width: colW - 110 });

        // Right column
        if (row[2]) {
          doc.fillColor('#64748b').font('Helvetica-Bold').text(row[2], startX + colW + 10, y + 5, { width: 85 });
          doc.fillColor('#0f172a').font('Helvetica').text(row[3], startX + colW + 95, y + 5, { width: colW - 105 });
        }

        y += 20;
      });

      y += 14;

      // ── Section 2: SALARY DETAILS ────────────────────────────────
      doc.rect(startX, y, W, 18).fillColor('#0f2942').fill();
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('SALARY DETAILS', startX + 10, y + 5);
      y += 18;

      const prevSalaryText = salary.previousSalary !== null
        ? `₹${salary.previousSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : 'N/A';

      const salaryRows: [string, string, string, string][] = [
        [
          'Monthly Salary:',
          `₹${salary.monthlySalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Annual CTC / LPA:',
          salary.annualCtcLpa,
        ],
        [
          'Previous / Last Salary:',
          prevSalaryText,
          isFullAndFinal ? 'Final Applicable Salary:' : 'Current Month Salary:',
          `₹${salary.currentMonthSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ],
      ];

      salaryRows.forEach((row, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(startX, y, W, 20).fillColor(rowBg).strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();

        // Left pair
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text(row[0], startX + 10, y + 5, { width: 120 });
        doc.fillColor('#0f172a').font('Helvetica').text(row[1], startX + 130, y + 5, { width: colW - 135 });

        // Right pair
        doc.fillColor('#64748b').font('Helvetica-Bold').text(row[2], startX + colW + 10, y + 5, { width: 130 });
        doc.fillColor('#0f172a').font('Helvetica').text(row[3], startX + colW + 140, y + 5, { width: colW - 145 });

        y += 20;
      });

      y += 14;

      // ── Section 3: PAYMENT DETAILS ───────────────────────────────
      doc.rect(startX, y, W, 18).fillColor('#0f2942').fill();
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('PAYMENT DETAILS', startX + 10, y + 5);
      y += 18;

      const payStatusText = payment.status;
      const payDateText = payment.paymentDate || 'N/A';

      doc.rect(startX, y, W, 20).fillColor('#ffffff').strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Payment Status:', startX + 10, y + 5, { width: 100 });
      doc.fillColor('#0f172a').font('Helvetica').text(payStatusText, startX + 110, y + 5, { width: colW - 115 });
      doc.fillColor('#64748b').font('Helvetica-Bold').text('Payment Date:', startX + colW + 10, y + 5, { width: 85 });
      doc.fillColor('#0f172a').font('Helvetica').text(payDateText, startX + colW + 95, y + 5, { width: colW - 100 });

      y += 32;

      // ── Section 4: NET PAYABLE SALARY (Highlight Box) ────────────
      doc.rect(startX, y, W, 40).fillColor('#f8fafc').strokeColor('#0f2942').lineWidth(1.5).fillAndStroke();

      const netTitle = isFullAndFinal ? 'FINAL NET PAYABLE SALARY' : 'NET PAYABLE SALARY / IN-HAND';
      doc.fillColor('#0f2942').fontSize(11).font('Helvetica-Bold').text(netTitle, startX + 16, y + 14);
      doc.fillColor('#0f2942').fontSize(17).font('Helvetica-Bold')
         .text(`₹${salary.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, startX + W - 220, y + 11, { width: 205, align: 'right' });

      y += 56;

      // ── Section 5: AUTHORIZED SIGN-OFF ───────────────────────────
      doc.rect(startX, y, W, 70).fillColor('#ffffff').strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();

      // Left column: Authorized By
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Authorized By:', startX + 16, y + 12);
      doc.fillColor('#0f2942').fontSize(11).font('Helvetica-Bold').text('FCS Firstclose Solution', startX + 16, y + 26);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('HR Department', startX + 16, y + 42);

      // Right column: Signature Placeholder
      doc.strokeColor('#94a3b8').lineWidth(0.8).moveTo(startX + W - 170, y + 42).lineTo(startX + W - 20, y + 42).stroke();
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Authorized Signatory', startX + W - 170, y + 48, { width: 150, align: 'center' });

      y += 85;

      // ── Footer ───────────────────────────────────────────────────
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
         .text('This is a computer-generated salary slip and does not require a physical signature.', startX, y, { width: W, align: 'center' });

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // EMAIL SALARY SLIP (stub)
  // ─────────────────────────────────────────────────────────────────

  async emailSalarySlip(payslipId: string) {
    await this.database.payslip.update({
      where: { id: payslipId },
      data: { downloadedAt: new Date() },
    });
    return { success: true, message: 'Salary slip sent via email successfully' };
  }

  // ─────────────────────────────────────────────────────────────────
  // WHATSAPP (stub)
  // ─────────────────────────────────────────────────────────────────

  async whatsappSalarySlip(payslipId: string) {
    return { success: true, message: 'Salary slip sent via WhatsApp successfully' };
  }

  // ─────────────────────────────────────────────────────────────────
  // BULK DOWNLOAD (stub)
  // ─────────────────────────────────────────────────────────────────

  async bulkDownload(payslipIds: string[]) {
    return { success: true, message: 'Bulk download initiated', count: payslipIds.length };
  }

  // ─────────────────────────────────────────────────────────────────
  // GET PAYSLIP BY ID
  // ─────────────────────────────────────────────────────────────────

  async getPayslipById(payslipId: string) {
    return this.database.payslip.findUnique({
      where: { id: payslipId },
      include: {
        payrollRun: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE SALARY SLIP
  // ─────────────────────────────────────────────────────────────────

  async deleteSalarySlip(payslipId: string) {
    await this.database.payslip.delete({ where: { id: payslipId } });
    return { success: true, message: 'Salary slip deleted successfully' };
  }
}

