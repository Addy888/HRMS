/**
 * PAYROLL CONTROLLER
 * Simplified implementation matching actual schema
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/guards/roles.guard';
import { PayrollService } from '../services/payroll.service';
import { UserRole } from '../../../common/constants';
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate/employee/:employeeId')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async generateForEmployee(
    @Param('employeeId') employeeId: string,
    @Body() body: { month: number; year: number },
    @Request() req: any,
  ) {
    return this.payrollService.generateForEmployee(
      employeeId,
      body.month,
      body.year,
      req.user.userId,
    );
  }

  @Post('generate/bulk')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async generateForAllEmployees(
    @Body() body: { month: number; year: number },
    @Request() req: any,
  ) {
    return this.payrollService.generateForAllEmployees(
      body.month,
      body.year,
      req.user.userId,
    );
  }

  @Get('history')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async getPayrollHistory(
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.payrollService.getPayrollHistory({
      employeeId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get(':id')
  async getPayrollRun(@Param('id') id: string) {
    return this.payrollService.getPayrollRun(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async approvePayroll(@Param('id') id: string) {
    return this.payrollService.approvePayroll(id);
  }

  @Patch(':id/pay')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async markAsPaid(@Param('id') id: string, @Body() body: { paymentDate: string }) {
    return this.payrollService.markAsPaid(id, new Date(body.paymentDate));
  }

  @Get('summary/:month/:year')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async getPayrollSummary(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.payrollService.getPayrollSummary(parseInt(month), parseInt(year));
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async deletePendingPayroll(@Param('id') id: string) {
    return this.payrollService.deletePendingPayroll(id);
  }
}
