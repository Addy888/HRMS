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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { SalarySlipService } from '../services/salary-slip-new.service';

@Controller('salary-slip')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalarySlipController {
  constructor(private readonly salarySlipService: SalarySlipService) {}

  @Get('list')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
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

  @Get('stats')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async getSalarySlipStats(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.salarySlipService.getSalarySlipStats(
      parseInt(month),
      parseInt(year),
    );
  }

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

  @Get(':payslipId/download')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  async downloadSalarySlip(@Param('payslipId') payslipId: string) {
    // This would generate and return PDF
    // For now, mark as downloaded
    await this.salarySlipService.markAsDownloaded(payslipId);
    return { success: true, message: 'Download initiated' };
  }

  @Post(':payslipId/download')
  async markAsDownloaded(@Param('payslipId') payslipId: string) {
    await this.salarySlipService.markAsDownloaded(payslipId);
    return { success: true };
  }

  @Post(':payslipId/email')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async emailSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.emailSalarySlip(payslipId);
  }

  @Post(':payslipId/whatsapp')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async whatsappSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.whatsappSalarySlip(payslipId);
  }

  @Post('bulk-download')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async bulkDownload(@Query('payslipIds') payslipIds: string[]) {
    return this.salarySlipService.bulkDownload(payslipIds);
  }

  @Delete(':payslipId')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async deleteSalarySlip(@Param('payslipId') payslipId: string) {
    return this.salarySlipService.deleteSalarySlip(payslipId);
  }
}
