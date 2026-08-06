import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { PayrollProcessingService } from '../services/payroll-processing.service';
import { ProcessPayrollDto } from '../dto/process-payroll.dto';

@Controller('payroll-processing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollProcessingController {
  constructor(
    private readonly payrollProcessingService: PayrollProcessingService,
  ) {}

  @Post('bulk')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async processBulk(@Body() dto: ProcessPayrollDto, @Request() req: any) {
    dto.processedBy = req.user.userId;
    return this.payrollProcessingService.processBulkPayroll(dto);
  }

  @Post('employee/:employeeId')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async processForEmployee(
    @Param('employeeId') employeeId: string,
    @Body() dto: { month: number; year: number },
    @Request() req: any,
  ) {
    return this.payrollProcessingService.processForEmployee(
      employeeId,
      dto.month,
      dto.year,
      req.user.userId,
    );
  }

  @Get('history')
  async getHistory(@Query() filters: any) {
    return this.payrollProcessingService.getPayrollHistory(filters);
  }

  @Get('dashboard/stats')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async getDashboardStats(@Query() query: { month?: string; year?: string }) {
    return this.payrollProcessingService.getDashboardStats(
      query.month ? parseInt(query.month) : undefined,
      query.year ? parseInt(query.year) : undefined,
    );
  }

  @Put(':id/approve')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async approve(@Param('id') id: string) {
    return this.payrollProcessingService.approvePayroll(id);
  }

  @Put(':id/mark-paid')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async markPaid(
    @Param('id') id: string,
    @Body() dto: { paymentDate?: string },
  ) {
    return this.payrollProcessingService.markAsPaid(
      id,
      dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    );
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.payrollProcessingService.deletePendingPayroll(id);
  }
}
