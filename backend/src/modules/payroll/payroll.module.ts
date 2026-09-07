/**
 * PAYROLL MODULE
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PayrollService } from './services/payroll.service';
import { SalarySlipService } from './services/salary-slip-new.service';
import { SalaryStructureService } from './services/salary-structure.service';
import { PayrollProcessingService } from './services/payroll-processing.service';
import { PayrollCalculationEngine } from './engine/payroll-calculation.engine';
import { PayrollController } from './controllers/payroll.controller';
import { SalarySlipController } from './controllers/salary-slip.controller';
import { SalaryStructureController } from './controllers/salary-structure.controller';
import { PayrollProcessingController } from './controllers/payroll-processing.controller';
import { EmployeeSalaryController } from './controllers/employee-salary.controller';
import { EmployeePayrollController } from './controllers/employee-payroll.controller';

@Module({
  controllers: [
    PayrollController,
    SalarySlipController,
    SalaryStructureController,
    PayrollProcessingController,
    EmployeeSalaryController,
    EmployeePayrollController, // ✅ Add employee payroll controller
  ],
  providers: [
    PrismaService,
    PayrollCalculationEngine, // ✅ Add calculation engine
    PayrollService,
    SalarySlipService,
    SalaryStructureService,
    PayrollProcessingService,
  ],
  exports: [
    PayrollService,
    SalarySlipService,
    SalaryStructureService,
    PayrollProcessingService,
    PayrollCalculationEngine,
  ],
})
export class PayrollModule {}
