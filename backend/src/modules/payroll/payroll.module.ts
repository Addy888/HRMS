/**
 * PAYROLL MODULE
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PayrollService } from './services/payroll.service';
import { SalarySlipService } from './services/salary-slip-new.service';
import { PayrollController } from './controllers/payroll.controller';
import { SalarySlipController } from './controllers/salary-slip.controller';

@Module({
  controllers: [PayrollController, SalarySlipController],
  providers: [PrismaService, PayrollService, SalarySlipService],
  exports: [PayrollService, SalarySlipService],
})
export class PayrollModule {}
