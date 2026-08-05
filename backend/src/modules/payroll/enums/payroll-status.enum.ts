/**
 * Payroll Status Enums
 */

export enum PayrollCycleStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PayrollRunStatus {
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  HOLD = 'HOLD',
  CANCELLED = 'CANCELLED',
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFAULTED = 'DEFAULTED',
}

export enum AdvanceSalaryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  RECOVERED = 'RECOVERED',
}

export enum PaymentMode {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
}

export enum PayrollCycleType {
  MONTHLY = 'MONTHLY',
  BI_WEEKLY = 'BI_WEEKLY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

export enum ComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION',
}

export enum CalculationMethod {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  DAYS_BASED = 'DAYS_BASED',
  HOURS_BASED = 'HOURS_BASED',
}
