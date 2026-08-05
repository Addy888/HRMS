/**
 * PAYROLL DATA INTERFACES
 * 
 * These interfaces define the data contracts between Payroll Engine
 * and external providers (Attendance, Leave, Tax, Accounting, etc.)
 */

/**
 * Attendance Data from Attendance Provider
 */
export interface IAttendanceData {
  employeeId: string;
  month: number;
  year: number;
  
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysHalfDay: number;
  
  totalWorkingHours: number;
  overtimeHours: number;
  
  lateMinutes: number;
  earlyExitMinutes: number;
}

/**
 * Leave Data from Leave Provider
 */
export interface ILeaveData {
  employeeId: string;
  month: number;
  year: number;
  
  totalLeaveDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  
  leaveBalance: {
    casualLeave: number;
    sickLeave: number;
    paidLeave: number;
    compOff: number;
  };
}

/**
 * Holiday Data
 */
export interface IHolidayData {
  month: number;
  year: number;
  holidays: number;
  weekOffs: number;
}

/**
 * Tax Calculation Data from Tax Provider
 */
export interface ITaxData {
  employeeId: string;
  month: number;
  year: number;
  
  tds: number;               // Tax Deducted at Source
  professionalTax: number;   // State-specific
  employeePF: number;        // Provident Fund
  employeeESI: number;       // Employee State Insurance
  employerPF: number;        // Employer PF contribution
  employerESI: number;       // Employer ESI contribution
}

/**
 * Salary Components
 */
export interface ISalaryComponents {
  // Earnings
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  foodAllowance: number;
  performanceBonus: number;
  incentive: number;
  overtimePay: number;
  reimbursement: number;
  
  totalEarnings: number;
  
  // Deductions
  employeePF: number;
  employeeESI: number;
  professionalTax: number;
  tds: number;
  loanDeduction: number;
  advanceDeduction: number;
  lateDeduction: number;
  lwpDeduction: number;      // Loss of Pay
  otherDeductions: number;
  
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Employer Contributions (not part of net, but tracked)
  employerPF: number;
  employerESI: number;
}

/**
 * Payroll Calculation Input
 */
export interface IPayrollCalculationInput {
  employeeId: string;
  month: number;
  year: number;
  
  salaryStructure: {
    basicSalary: number;
    hra: number;
    da: number;
    specialAllowance: number;
    medicalAllowance: number;
    travelAllowance: number;
    foodAllowance: number;
    performanceBonus: number;
    incentive: number;
    
    employerPF: number;        // Percentage
    employerESI: number;       // Percentage
    employeePF: number;        // Percentage
    employeeESI: number;       // Percentage
    professionalTax: number;
  };
  
  attendanceData: IAttendanceData;
  leaveData: ILeaveData;
  holidayData: IHolidayData;
  taxData: ITaxData;
  
  loans: Array<{
    id: string;
    emiAmount: number;
  }>;
  
  advances: Array<{
    id: string;
    recoveryAmount: number;
  }>;
}

/**
 * Payroll Calculation Output
 */
export interface IPayrollCalculationOutput {
  employeeId: string;
  month: number;
  year: number;
  
  attendanceData: IAttendanceData;
  leaveData: ILeaveData;
  
  salaryComponents: ISalaryComponents;
  
  calculationBreakdown: {
    component: string;
    type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
    amount: number;
    calculationMethod: string;
    remarks?: string;
  }[];
}

/**
 * Bank Transfer Data for Accounting Provider
 */
export interface IBankTransferData {
  employeeId: string;
  employeeName: string;
  bankAccountNumber: string;
  ifscCode: string;
  amount: number;
  month: number;
  year: number;
  referenceNumber: string;
}

/**
 * Accounting Entry for ERP Integration
 */
export interface IAccountingEntry {
  date: Date;
  voucherType: string;         // PAYMENT, JOURNAL
  voucherNumber: string;
  
  debits: Array<{
    ledger: string;
    amount: number;
  }>;
  
  credits: Array<{
    ledger: string;
    amount: number;
  }>;
  
  narration: string;
}
