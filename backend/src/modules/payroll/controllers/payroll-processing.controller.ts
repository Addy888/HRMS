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
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async processBulk(@Body() dto: ProcessPayrollDto, @Request() req: any) {
    dto.processedBy = req.user.userId;
    return this.payrollProcessingService.processBulkPayroll(dto);
  }

  @Post('employee/:employeeId')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async getHistory(@Query() filters: any) {
    return this.payrollProcessingService.getPayrollHistory(filters);
  }

  @Get('dashboard/stats')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async getDashboardStats(@Query() query: { month?: string; year?: string }) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  PAYROLL DASHBOARD STATS - CONTROLLER                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('📥 Controller Input:');
    console.log('   month:', query.month);
    console.log('   year:', query.year);
    console.log('   month (parsed):', query.month ? parseInt(query.month) : undefined);
    console.log('   year (parsed):', query.year ? parseInt(query.year) : undefined);
    
    try {
      console.log('🔄 Calling payrollProcessingService.getDashboardStats()...');
      const result = await this.payrollProcessingService.getDashboardStats(
        query.month ? parseInt(query.month) : undefined,
        query.year ? parseInt(query.year) : undefined,
      );
      
      console.log('✅ Controller received result from service:');
      console.log('   result:', result);
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      
      return result;
    } catch (error) {
      console.error('❌ CONTROLLER ERROR:');
      console.error('   Error:', error);
      console.error('   Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('╚════════════════════════════════════════════════════════════╝\n');
      throw error;
    }
  }

  @Put(':id/approve')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async approve(@Param('id') id: string) {
    return this.payrollProcessingService.approvePayroll(id);
  }

  @Put(':id/mark-paid')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.payrollProcessingService.deletePendingPayroll(id);
  }
}
