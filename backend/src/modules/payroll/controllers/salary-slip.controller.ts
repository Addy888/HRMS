/**
 * SALARY SLIP CONTROLLER
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Delete,
  Res,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { SalarySlipService } from '../services/salary-slip-new.service';

@Controller('salary-slip')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalarySlipController {
  constructor(private readonly salarySlipService: SalarySlipService) {}

  // ─────────────────────────────────────────────────────────────────
  // HR: Search employees with their payroll status
  // Returns employees even if no payroll has been generated yet
  // ─────────────────────────────────────────────────────────────────

  @Get('employees')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async searchEmployees(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
  ) {
    return this.salarySlipService.searchEmployeesWithPayrollStatus(
      parseInt(month),
      parseInt(year),
      search,
      department,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // HR: List salary slips (only payrolls that have been processed)
  // ─────────────────────────────────────────────────────────────────

  @Get('list')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async getSalarySlipList(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
  ) {
    return this.salarySlipService.getSalarySlipList(
      parseInt(month),
      parseInt(year),
      search,
      department,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // HR: Dashboard statistics
  // ─────────────────────────────────────────────────────────────────

  @Get('stats')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async getSalarySlipStats(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.salarySlipService.getSalarySlipStats(
      parseInt(month),
      parseInt(year),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // HR/Employee: Get salary slip data for a payroll run (also creates payslip record)
  // ─────────────────────────────────────────────────────────────────

  @Get('payroll/:payrollRunId')
  async generateSalarySlipData(
    @Param('payrollRunId') payrollRunId: string,
    @Request() req: any,
  ) {
    const slipData = await this.salarySlipService.generateSalarySlipData(payrollRunId);
    if (req.user?.role === UserRole.EMPLOYEE) {
      if (slipData.employeeDbId !== req.user.employeeId) {
        throw new ForbiddenException('You can only view your own salary slip');
      }
    }
    return slipData;
  }

  // ─────────────────────────────────────────────────────────────────
  // HR & Employee: Download salary slip as PDF for a payroll run
  // ─────────────────────────────────────────────────────────────────

  @Get('payroll/:payrollRunId/pdf')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.EMPLOYEE)
  async downloadPayrollPdf(
    @Param('payrollRunId') payrollRunId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const slipData = await this.salarySlipService.generateSalarySlipData(payrollRunId);

    // Enforce ownership: employee can only download their own payslip
    if (req.user?.role === UserRole.EMPLOYEE) {
      if (slipData.employeeDbId !== req.user.employeeId) {
        throw new ForbiddenException('You can only download your own salary slip');
      }
    }

    const pdfBuffer = await this.salarySlipService.generateSalarySlipPdf(payrollRunId);
    const filename = `salary-slip-${slipData.employee.employeeId}-${slipData.period.monthName}-${slipData.period.year}.pdf`;

    // Mark as downloaded
    if (slipData.payslipId) {
      await this.salarySlipService.markAsDownloaded(slipData.payslipId);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  // ─────────────────────────────────────────────────────────────────
  // Employee: Get own salary slips
  // ─────────────────────────────────────────────────────────────────

  @Get('employee/:employeeId')
  async getEmployeeSalarySlips(
    @Param('employeeId') employeeId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    if (req.user?.role === UserRole.EMPLOYEE && employeeId !== req.user.employeeId) {
      throw new ForbiddenException('You can only view your own salary slips');
    }
    return this.salarySlipService.getEmployeeSalarySlips(
      employeeId,
      limit ? parseInt(limit) : 12,
    );
  }

  @Get('employee/:employeeId/status')
  async getPayrollStatus(
    @Param('employeeId') employeeId: string,
    @Request() req: any,
  ) {
    if (req.user?.role === UserRole.EMPLOYEE && employeeId !== req.user.employeeId) {
      throw new ForbiddenException('You can only view your own payroll status');
    }
    return this.salarySlipService.getPayrollStatus(employeeId);
  }

  // ─────────────────────────────────────────────────────────────────
  // Download payslip by payslip ID (streams real PDF)
  // ─────────────────────────────────────────────────────────────────

  @Get(':payslipId/download')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.EMPLOYEE)
  async downloadSalarySlip(
    @Param('payslipId') payslipId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const payslip = await this.salarySlipService.getPayslipById(payslipId);
    if (!payslip) {
      throw new NotFoundException('Salary slip not found');
    }

    // Ownership check for employees
    if (req.user?.role === UserRole.EMPLOYEE && payslip.employeeId !== req.user.employeeId) {
      throw new ForbiddenException('You can only download your own salary slip');
    }

    const pdfBuffer = await this.salarySlipService.generateSalarySlipPdf(payslip.payrollRunId);
    const slipData = await this.salarySlipService.generateSalarySlipData(payslip.payrollRunId);
    const filename = `salary-slip-${slipData.employee.employeeId}-${slipData.period.monthName}-${slipData.period.year}.pdf`;

    await this.salarySlipService.markAsDownloaded(payslipId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':payslipId/download')
  async markAsDownloaded(@Param('payslipId') payslipId: string) {
    await this.salarySlipService.markAsDownloaded(payslipId);
    return { success: true };
  }

  @Post(':payslipId/email')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async emailSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.emailSalarySlip(payslipId);
  }

  @Post(':payslipId/whatsapp')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async whatsappSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.whatsappSalarySlip(payslipId);
  }

  @Post('bulk-download')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async bulkDownload(@Query('payslipIds') payslipIds: string[]) {
    return this.salarySlipService.bulkDownload(payslipIds);
  }

  @Delete(':payslipId')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
  async deleteSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.deleteSalarySlip(payslipId);
  }
}
