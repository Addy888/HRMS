/**
 * SALARY SLIP CONTROLLER
 */

import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { SalarySlipService } from '../services/salary-slip-new.service';

@Controller('salary-slip')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalarySlipController {
  constructor(private readonly salarySlipService: SalarySlipService) {}

  @Get('payroll/:payrollRunId')
  async generateSalarySlipData(@Param('payrollRunId') payrollRunId: string) {
    return this.salarySlipService.generateSalarySlipData(payrollRunId);
  }

  @Get('employee/:employeeId')
  async getEmployeeSalarySlips(
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.salarySlipService.getEmployeeSalarySlips(
      employeeId,
      limit ? parseInt(limit) : 12,
    );
  }

  @Get('employee/:employeeId/status')
  async getPayrollStatus(@Param('employeeId') employeeId: string) {
    return this.salarySlipService.getPayrollStatus(employeeId);
  }

  @Post(':payslipId/download')
  async markAsDownloaded(@Param('payslipId') payslipId: string) {
    await this.salarySlipService.markAsDownloaded(payslipId);
    return { success: true };
  }
}
