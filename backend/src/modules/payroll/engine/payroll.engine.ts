/**
 * PAYROLL ENGINE
 * 
 * The CORE of the Payroll system.
 * 
 * CRITICAL ARCHITECTURE PRINCIPLE:
 * This engine does NOT directly depend on:
 * - Attendance tables
 * - Leave tables
 * - Tax calculation logic
 * - Accounting systems
 * 
 * Instead, it depends ONLY on interfaces:
 * - IAttendanceProvider
 * - ILeaveProvider
 * - ITaxProvider
 * - IAccountingProvider
 * 
 * This allows:
 * - Switching from internal Attendance to external Biometric systems
 * - Integrating with Tally, Zoho Books, QuickBooks, SAP WITHOUT changing this code
 * - Different tax rules for different countries
 * - Multiple data sources
 * 
 * This is DEPENDENCY INVERSION PRINCIPLE in action.
 */

import { Injectable, Logger } from '@nestjs/common';
import type { IAttendanceProvider } from '../providers/base/attendance-provider.interface.js';
import type { ILeaveProvider } from '../providers/base/leave-provider.interface.js';
import type { ITaxProvider } from '../providers/base/tax-provider.interface.js';
import {
  IPayrollCalculationInput,
  IPayrollCalculationOutput,
  ISalaryComponents,
} from '../interfaces/payroll-data.interface.js';

@Injectable()
export class PayrollEngine {
  private readonly logger = new Logger(PayrollEngine.name);

  constructor(
    private readonly attendanceProvider: IAttendanceProvider,
    private readonly leaveProvider: ILeaveProvider,
    private readonly taxProvider: ITaxProvider,
  ) {
    this.logger.log('Payroll Engine initialized');
    this.logger.log(`Using Attendance Provider: ${attendanceProvider.getName()}`);
    this.logger.log(`Using Leave Provider: ${leaveProvider.getName()}`);
    this.logger.log(`Using Tax Provider: ${taxProvider.getName()}`);
  }

  /**
   * CALCULATE PAYROLL
   * Main method to calculate salary for an employee
   */
  async calculatePayroll(input: IPayrollCalculationInput): Promise<IPayrollCalculationOutput> {
    this.logger.log(`Calculating payroll for employee ${input.employeeId}, ${input.month}/${input.year}`);

    const { employeeId, month, year, salaryStructure } = input;

    // Step 1: Get attendance data from Attendance Provider
    const attendanceData = await this.attendanceProvider.getAttendanceData(
      employeeId,
      month,
      year,
    );

    // Step 2: Get leave data from Leave Provider
    const leaveData = await this.leaveProvider.getLeaveData(
      employeeId,
      month,
      year,
    );

    // Step 3: Calculate salary components based on attendance and leaves
    const salaryComponents = await this.calculateSalaryComponents(
      salaryStructure,
      attendanceData,
      leaveData,
      input,
    );

    // Step 4: Calculate taxes using Tax Provider
    const taxData = await this.taxProvider.calculateTax(
      employeeId,
      salaryComponents.totalEarnings,
      month,
      year,
    );

    // Step 5: Apply tax deductions
    salaryComponents.employeePF = taxData.employeePF;
    salaryComponents.employeeESI = taxData.employeeESI;
    salaryComponents.professionalTax = taxData.professionalTax;
    salaryComponents.tds = taxData.tds;

    // Step 6: Calculate deductions
    salaryComponents.totalDeductions = this.calculateTotalDeductions(salaryComponents, input);

    // Step 7: Calculate net salary
    salaryComponents.netSalary = salaryComponents.totalEarnings - salaryComponents.totalDeductions;

    // Step 8: Employer contributions (not part of net, but tracked for CTC)
    salaryComponents.employerPF = taxData.employerPF;
    salaryComponents.employerESI = taxData.employerESI;

    // Step 9: Build calculation breakdown
    const calculationBreakdown = this.buildCalculationBreakdown(salaryComponents, attendanceData, leaveData);

    return {
      employeeId,
      month,
      year,
      attendanceData,
      leaveData,
      salaryComponents,
      calculationBreakdown,
    };
  }

  /**
   * CALCULATE SALARY COMPONENTS
   * Calculate earnings based on attendance and leaves
   */
  private async calculateSalaryComponents(
    structure: IPayrollCalculationInput['salaryStructure'],
    attendance: any,
    leave: any,
    input: IPayrollCalculationInput,
  ): Promise<ISalaryComponents> {
    const { totalWorkingDays, daysPresent, daysHalfDay, overtimeHours } = attendance;
    const { unpaidLeaveDays } = leave;

    // Calculate per-day salary
    const perDaySalary = structure.basicSalary / 30; // Assuming 30 days in a month

    // Calculate effective days (accounting for half days and unpaid leaves)
    const effectiveDays = daysPresent + (daysHalfDay * 0.5);
    const lwpDays = unpaidLeaveDays; // Loss of Pay days

    // Calculate proportionate salary based on attendance
    const attendanceFactor = totalWorkingDays > 0 
      ? (effectiveDays / totalWorkingDays) 
      : 1;

    // Earnings
    const basicSalary = structure.basicSalary * attendanceFactor;
    const hra = structure.hra * attendanceFactor;
    const da = structure.da * attendanceFactor;
    const specialAllowance = structure.specialAllowance * attendanceFactor;
    const medicalAllowance = structure.medicalAllowance * attendanceFactor;
    const travelAllowance = structure.travelAllowance * attendanceFactor;
    const foodAllowance = structure.foodAllowance * attendanceFactor;
    const performanceBonus = structure.performanceBonus * attendanceFactor;
    const incentive = structure.incentive * attendanceFactor;

    // Overtime calculation (assuming hourly rate = basic salary / 208 hours per month)
    const hourlyRate = structure.basicSalary / 208;
    const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime

    // Reimbursement (set to 0 for now, can be added later)
    const reimbursement = 0;

    // Total earnings
    const totalEarnings = 
      basicSalary +
      hra +
      da +
      specialAllowance +
      medicalAllowance +
      travelAllowance +
      foodAllowance +
      performanceBonus +
      incentive +
      overtimePay +
      reimbursement;

    // Deductions (will be calculated later by tax provider and loan/advance logic)
    const loanDeduction = input.loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    const advanceDeduction = input.advances.reduce((sum, adv) => sum + adv.recoveryAmount, 0);
    const lateDeduction = 0; // Can be configured based on policy
    const lwpDeduction = lwpDays * perDaySalary;
    const otherDeductions = 0;

    return {
      basicSalary: Math.round(basicSalary * 100) / 100,
      hra: Math.round(hra * 100) / 100,
      da: Math.round(da * 100) / 100,
      specialAllowance: Math.round(specialAllowance * 100) / 100,
      medicalAllowance: Math.round(medicalAllowance * 100) / 100,
      travelAllowance: Math.round(travelAllowance * 100) / 100,
      foodAllowance: Math.round(foodAllowance * 100) / 100,
      performanceBonus: Math.round(performanceBonus * 100) / 100,
      incentive: Math.round(incentive * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      reimbursement: Math.round(reimbursement * 100) / 100,
      
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      
      employeePF: 0, // Will be set by tax provider
      employeeESI: 0,
      professionalTax: 0,
      tds: 0,
      loanDeduction: Math.round(loanDeduction * 100) / 100,
      advanceDeduction: Math.round(advanceDeduction * 100) / 100,
      lateDeduction: Math.round(lateDeduction * 100) / 100,
      lwpDeduction: Math.round(lwpDeduction * 100) / 100,
      otherDeductions: Math.round(otherDeductions * 100) / 100,
      
      totalDeductions: 0, // Will be calculated later
      
      netSalary: 0, // Will be calculated later
      
      employerPF: 0, // Will be set by tax provider
      employerESI: 0,
    };
  }

  /**
   * CALCULATE TOTAL DEDUCTIONS
   */
  private calculateTotalDeductions(
    components: ISalaryComponents,
    input: IPayrollCalculationInput,
  ): number {
    return (
      components.employeePF +
      components.employeeESI +
      components.professionalTax +
      components.tds +
      components.loanDeduction +
      components.advanceDeduction +
      components.lateDeduction +
      components.lwpDeduction +
      components.otherDeductions
    );
  }

  /**
   * BUILD CALCULATION BREAKDOWN
   * Detailed line-by-line breakdown for transparency
   */
  private buildCalculationBreakdown(
    components: ISalaryComponents,
    attendance: any,
    leave: any,
  ): any[] {
    const breakdown: Array<{
      component: string;
      type: string;
      amount: number;
      calculationMethod: string;
      remarks?: string;
    }> = [];

    // Earnings
    if (components.basicSalary > 0) {
      breakdown.push({
        component: 'Basic Salary',
        type: 'EARNING',
        amount: components.basicSalary,
        calculationMethod: 'DAYS_BASED',
        remarks: `Based on ${attendance.daysPresent} days present`,
      });
    }

    if (components.hra > 0) {
      breakdown.push({
        component: 'HRA',
        type: 'EARNING',
        amount: components.hra,
        calculationMethod: 'DAYS_BASED',
      });
    }

    if (components.da > 0) {
      breakdown.push({
        component: 'DA',
        type: 'EARNING',
        amount: components.da,
        calculationMethod: 'DAYS_BASED',
      });
    }

    if (components.specialAllowance > 0) {
      breakdown.push({
        component: 'Special Allowance',
        type: 'EARNING',
        amount: components.specialAllowance,
        calculationMethod: 'DAYS_BASED',
      });
    }

    if (components.overtimePay > 0) {
      breakdown.push({
        component: 'Overtime Pay',
        type: 'EARNING',
        amount: components.overtimePay,
        calculationMethod: 'HOURS_BASED',
        remarks: `${attendance.overtimeHours} hours @ 1.5x`,
      });
    }

    // Deductions
    if (components.employeePF > 0) {
      breakdown.push({
        component: 'Employee PF',
        type: 'DEDUCTION',
        amount: components.employeePF,
        calculationMethod: 'PERCENTAGE',
      });
    }

    if (components.employeeESI > 0) {
      breakdown.push({
        component: 'Employee ESI',
        type: 'DEDUCTION',
        amount: components.employeeESI,
        calculationMethod: 'PERCENTAGE',
      });
    }

    if (components.professionalTax > 0) {
      breakdown.push({
        component: 'Professional Tax',
        type: 'DEDUCTION',
        amount: components.professionalTax,
        calculationMethod: 'FIXED',
      });
    }

    if (components.tds > 0) {
      breakdown.push({
        component: 'TDS',
        type: 'DEDUCTION',
        amount: components.tds,
        calculationMethod: 'PERCENTAGE',
      });
    }

    if (components.loanDeduction > 0) {
      breakdown.push({
        component: 'Loan EMI',
        type: 'DEDUCTION',
        amount: components.loanDeduction,
        calculationMethod: 'FIXED',
      });
    }

    if (components.lwpDeduction > 0) {
      breakdown.push({
        component: 'Loss of Pay',
        type: 'DEDUCTION',
        amount: components.lwpDeduction,
        calculationMethod: 'DAYS_BASED',
        remarks: `${leave.unpaidLeaveDays} unpaid leave days`,
      });
    }

    // Employer Contributions
    if (components.employerPF > 0) {
      breakdown.push({
        component: 'Employer PF',
        type: 'EMPLOYER_CONTRIBUTION',
        amount: components.employerPF,
        calculationMethod: 'PERCENTAGE',
      });
    }

    if (components.employerESI > 0) {
      breakdown.push({
        component: 'Employer ESI',
        type: 'EMPLOYER_CONTRIBUTION',
        amount: components.employerESI,
        calculationMethod: 'PERCENTAGE',
      });
    }

    return breakdown;
  }

  /**
   * HEALTH CHECK
   * Verify all providers are healthy
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    providers: {
      attendance: { healthy: boolean; message?: string };
      leave: { healthy: boolean; message?: string };
      tax: { healthy: boolean; message?: string };
    };
  }> {
    const [attendance, leave, tax] = await Promise.all([
      this.attendanceProvider.healthCheck(),
      this.leaveProvider.healthCheck(),
      this.taxProvider.healthCheck(),
    ]);

    const healthy = attendance.healthy && leave.healthy && tax.healthy;

    return {
      healthy,
      providers: {
        attendance,
        leave,
        tax,
      },
    };
  }
}
