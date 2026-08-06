/**
 * EMPLOYEE SALARY CONTROLLER
 * READ-ONLY access for employees to view their own salary information
 * Employees can only access their own salary data
 */

import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { SalaryStructureService } from '../services/salary-structure.service';
import { SalarySlipService } from '../services/salary-slip-new.service';

@Controller('employee-salary')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE)
export class EmployeeSalaryController {
  constructor(
    private readonly salaryStructureService: SalaryStructureService,
    private readonly salarySlipService: SalarySlipService,
  ) {}

  /**
   * GET EMPLOYEE'S CURRENT SALARY STRUCTURE (READ-ONLY)
   * Employee can only view their own salary
   */
  @Get('my-salary')
  async getMySalary(@Request() req: any) {
    // Get employee ID from authenticated user
    const employeeId = req.user.employeeId;
    
    if (!employeeId) {
      throw new ForbiddenException('Employee ID not found');
    }

    // Get active salary structure
    const salaryStructure = await this.salaryStructureService.getActiveSalaryStructure(employeeId);

    return {
      success: true,
      data: salaryStructure,
    };
  }

  /**
   * GET EMPLOYEE'S SALARY HISTORY (READ-ONLY)
   * Employee can only view their own salary history
   */
  @Get('my-salary-history')
  async getMySalaryHistory(@Request() req: any) {
    const employeeId = req.user.employeeId;
    
    if (!employeeId) {
      throw new ForbiddenException('Employee ID not found');
    }

    const salarySlips = await this.salarySlipService.getEmployeeSalarySlips(employeeId, 12);

    return {
      success: true,
      data: salarySlips,
    };
  }

  /**
   * GET EMPLOYEE'S PAYROLL STATUS (READ-ONLY)
   * Shows current month status and recent payrolls
   */
  @Get('my-payroll-status')
  async getMyPayrollStatus(@Request() req: any) {
    const employeeId = req.user.employeeId;
    
    if (!employeeId) {
      throw new ForbiddenException('Employee ID not found');
    }

    const status = await this.salarySlipService.getPayrollStatus(employeeId);

    return {
      success: true,
      data: status,
    };
  }

  /**
   * GET SPECIFIC SALARY SLIP DATA (READ-ONLY)
   * Employee can only view their own payslip
   */
  @Get('payslip/:payrollRunId')
  async getMyPayslip(@Request() req: any, @Param('payrollRunId') payrollRunId: string) {
    const employeeId = req.user.employeeId;
    
    if (!employeeId) {
      throw new ForbiddenException('Employee ID not found');
    }

    const payslipData = await this.salarySlipService.generateSalarySlipData(payrollRunId);

    // Verify the payslip belongs to the requesting employee
    if (payslipData.employee.employeeId !== req.user.employee?.employeeId) {
      throw new ForbiddenException('You can only view your own salary slip');
    }

    return {
      success: true,
      data: payslipData,
    };
  }
}
