# 🏢 Complete Enterprise Payroll Implementation Guide

## ✅ COMPLETED FILES

### Backend - DTOs
- ✅ `create-salary-structure.dto.ts`
- ✅ `update-salary-structure.dto.ts`
- ✅ `process-payroll.dto.ts`
- ✅ `payroll-filter.dto.ts`

### Backend - Services
- ✅ `salary-structure.service.ts` - Complete CRUD + calculations
- ✅ `payroll-processing.service.ts` - With attendance/leave integration
- ✅ `payroll.service.ts` - Existing (fixed)
- ✅ `salary-slip-new.service.ts` - Existing (fixed)

## 📋 REMAINING IMPLEMENTATION

### Phase 1: Complete Backend Services (Priority 1)

#### 1. PDF Generation Service
**File**: `backend/src/modules/payroll/services/pdf-generation.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGenerationService {
  constructor(private readonly database: PrismaService) {}

  async generatePayslipPDF(payrollRunId: string): Promise<string> {
    const payrollRun = await this.database.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!payrollRun) {
      throw new Error('Payroll run not found');
    }

    // Generate PDF logic here
    const doc = new PDFDocument();
    const fileName = `payslip-${payrollRun.employee.employeeId}-${payrollRun.year}-${payrollRun.month}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'payslips', fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add PDF content
    doc.fontSize(20).text('SALARY SLIP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${payrollRun.employee.firstName} ${payrollRun.employee.lastName}`);
    doc.text(`Employee ID: ${payrollRun.employee.employeeId}`);
    doc.text(`Department: ${payrollRun.employee.department?.name || 'N/A'}`);
    doc.text(`Month: ${payrollRun.month}/${payrollRun.year}`);
    doc.moveDown();
    doc.text(`Gross Salary: ₹${payrollRun.grossSalary.toFixed(2)}`);
    doc.text(`Deductions: ₹${payrollRun.deductions.toFixed(2)}`);
    doc.text(`Net Salary: ₹${payrollRun.netSalary.toFixed(2)}`);

    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));

    return `/uploads/payslips/${fileName}`;
  }
}
```

#### 2. Update Services Index
**File**: `backend/src/modules/payroll/services/index.ts`

```typescript
export { PayrollService } from './payroll.service';
export { SalarySlipService } from './salary-slip-new.service';
export { SalaryStructureService } from './salary-structure.service';
export { PayrollProcessingService } from './payroll-processing.service';
export { PdfGenerationService } from './pdf-generation.service';
```

### Phase 2: Controllers (Priority 2)

#### 1. Salary Structure Controller
**File**: `backend/src/modules/payroll/controllers/salary-structure.controller.ts`

```typescript
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { SalaryStructureService } from '../services/salary-structure.service';
import { CreateSalaryStructureDto } from '../dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from '../dto/update-salary-structure.dto';

@Controller('salary-structure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryStructureController {
  constructor(private readonly salaryStructureService: SalaryStructureService) {}

  @Post()
  @Roles('HR', 'SUPER_ADMIN')
  async create(@Body() createDto: CreateSalaryStructureDto) {
    return this.salaryStructureService.create(createDto);
  }

  @Get()
  @Roles('HR', 'SUPER_ADMIN')
  async findAll(@Query() query: any) {
    return this.salaryStructureService.findAll(query);
  }

  @Get(':id')
  @Roles('HR', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.salaryStructureService.findOne(id);
  }

  @Get('employee/:employeeId/active')
  async getActiveSalary(@Param('employeeId') employeeId: string) {
    return this.salaryStructureService.getActiveSalaryStructure(employeeId);
  }

  @Get('employee/:employeeId/history')
  async getSalaryHistory(@Param('employeeId') employeeId: string) {
    return this.salaryStructureService.getSalaryHistory(employeeId);
  }

  @Put(':id')
  @Roles('HR', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSalaryStructureDto) {
    return this.salaryStructureService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('HR', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.salaryStructureService.delete(id);
  }

  @Put(':id/deactivate')
  @Roles('HR', 'SUPER_ADMIN')
  async deactivate(@Param('id') id: string) {
    return this.salaryStructureService.deactivate(id);
  }

  @Get('dashboard/stats')
  @Roles('HR', 'SUPER_ADMIN')
  async getDashboardStats() {
    return this.salaryStructureService.getDashboardStats();
  }
}
```

#### 2. Payroll Processing Controller
**File**: `backend/src/modules/payroll/controllers/payroll-processing.controller.ts`

```typescript
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { PayrollProcessingService } from '../services/payroll-processing.service';
import { ProcessPayrollDto } from '../dto/process-payroll.dto';

@Controller('payroll-processing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollProcessingController {
  constructor(private readonly payrollProcessingService: PayrollProcessingService) {}

  @Post('bulk')
  @Roles('HR', 'SUPER_ADMIN')
  async processBulk(@Body() dto: ProcessPayrollDto) {
    return this.payrollProcessingService.processBulkPayroll(dto);
  }

  @Post('employee/:employeeId')
  @Roles('HR', 'SUPER_ADMIN')
  async processForEmployee(
    @Param('employeeId') employeeId: string,
    @Body() dto: { month: number; year: number; processedBy?: string },
  ) {
    return this.payrollProcessingService.processForEmployee(
      employeeId,
      dto.month,
      dto.year,
      dto.processedBy,
    );
  }

  @Get('history')
  async getHistory(@Query() filters: any) {
    return this.payrollProcessingService.getPayrollHistory(filters);
  }

  @Put(':id/approve')
  @Roles('HR', 'SUPER_ADMIN')
  async approve(@Param('id') id: string) {
    return this.payrollProcessingService.approvePayroll(id);
  }

  @Put(':id/mark-paid')
  @Roles('HR', 'SUPER_ADMIN')
  async markPaid(@Param('id') id: string, @Body() dto: { paymentDate?: string }) {
    return this.payrollProcessingService.markAsPaid(
      id,
      dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    );
  }

  @Delete(':id')
  @Roles('HR', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.payrollProcessingService.deletePendingPayroll(id);
  }

  @Get('dashboard/stats')
  @Roles('HR', 'SUPER_ADMIN')
  async getDashboardStats(@Query() query: { month?: number; year?: number }) {
    return this.payrollProcessingService.getDashboardStats(
      query.month ? parseInt(query.month.toString()) : undefined,
      query.year ? parseInt(query.year.toString()) : undefined,
    );
  }
}
```

### Phase 3: Update Payroll Module (Priority 3)

**File**: `backend/src/modules/payroll/payroll.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Services
import { PayrollService } from './services/payroll.service';
import { SalarySlipService } from './services/salary-slip-new.service';
import { SalaryStructureService } from './services/salary-structure.service';
import { PayrollProcessingService } from './services/payroll-processing.service';
import { PdfGenerationService } from './services/pdf-generation.service';

// Controllers
import { PayrollController } from './controllers/payroll.controller';
import { SalarySlipController } from './controllers/salary-slip.controller';
import { SalaryStructureController } from './controllers/salary-structure.controller';
import { PayrollProcessingController } from './controllers/payroll-processing.controller';

@Module({
  controllers: [
    PayrollController,
    SalarySlipController,
    SalaryStructureController,
    PayrollProcessingController,
  ],
  providers: [
    PrismaService,
    PayrollService,
    SalarySlipService,
    SalaryStructureService,
    PayrollProcessingService,
    PdfGenerationService,
  ],
  exports: [
    PayrollService,
    SalarySlipService,
    SalaryStructureService,
    PayrollProcessingService,
    PdfGenerationService,
  ],
})
export class PayrollModule {}
```

### Phase 4: Frontend Setup (Priority 4)

#### 1. Create Payroll Navigation
**File**: `frontend/src/layouts/HRLayout.tsx` (Add to navigation)

```typescript
// Add to navigation items
{
  name: 'Payroll',
  icon: <DollarSign />,
  subItems: [
    { name: 'Dashboard', path: '/hr/payroll' },
    { name: 'Salary Structure', path: '/hr/payroll/salary-structure' },
    { name: 'Employee Salary', path: '/hr/payroll/employee-salary' },
    { name: 'Payroll Processing', path: '/hr/payroll/processing' },
    { name: 'Salary Slips', path: '/hr/payroll/payslips' },
    { name: 'Salary History', path: '/hr/payroll/history' },
    { name: 'Reports', path: '/hr/payroll/reports' },
  ],
}
```

#### 2. Payroll Dashboard
**File**: `frontend/src/app/hr/payroll/page.tsx`

```typescript
'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { MetricCard } from '@/components/MetricCard';
import { Users, DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PayrollDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['payroll-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/payroll-processing/dashboard/stats');
      return response.data?.data ?? response.data;
    },
  });

  const cardsData = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <Users className="w-5 h-5" />,
      desc: 'Total employees in system',
    },
    {
      title: 'Pending Payroll',
      value: stats?.pendingPayroll || 0,
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      desc: 'Payroll runs pending',
    },
    {
      title: 'Processed Payroll',
      value: stats?.processedPayroll || 0,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      desc: 'Payroll runs processed',
    },
    {
      title: 'Paid Employees',
      value: stats?.paidEmployees || 0,
      icon: <CheckCircle className="w-5 h-5 text-blue-400" />,
      desc: 'Employees paid this month',
    },
    {
      title: 'Monthly Salary Expense',
      value: `₹${(stats?.monthlySalaryExpense || 0).toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      desc: 'Total salary this month',
    },
    {
      title: 'Average Salary',
      value: `₹${(stats?.averageSalary || 0).toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
      desc: 'Average employee salary',
    },
  ];

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
            Payroll Dashboard
          </h1>
          <p className="text-sm text-neutral-400">
            Month: {stats?.month}/{stats?.year}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsData.map((card, i) => (
            <MetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.desc}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Add Recent Payroll Table, Charts, etc. here */}
      </div>
    </HRLayout>
  );
}
```

### Phase 5: API Integration (Priority 5)

**File**: `frontend/src/lib/api/payroll.ts`

```typescript
import api from '../api';

export const payrollApi = {
  // Salary Structure
  createSalaryStructure: (data: any) => api.post('/salary-structure', data),
  getSalaryStructures: (params?: any) => api.get('/salary-structure', { params }),
  getSalaryStructure: (id: string) => api.get(`/salary-structure/${id}`),
  updateSalaryStructure: (id: string, data: any) => api.put(`/salary-structure/${id}`, data),
  deleteSalaryStructure: (id: string) => api.delete(`/salary-structure/${id}`),
  getActiveSalary: (employeeId: string) => api.get(`/salary-structure/employee/${employeeId}/active`),
  getSalaryHistory: (employeeId: string) => api.get(`/salary-structure/employee/${employeeId}/history`),

  // Payroll Processing
  processBulkPayroll: (data: any) => api.post('/payroll-processing/bulk', data),
  processEmployeePayroll: (employeeId: string, data: any) =>
    api.post(`/payroll-processing/employee/${employeeId}`, data),
  getPayrollHistory: (params?: any) => api.get('/payroll-processing/history', { params }),
  approvePayroll: (id: string) => api.put(`/payroll-processing/${id}/approve`),
  markAsPaid: (id: string, data?: any) => api.put(`/payroll-processing/${id}/mark-paid`, data),
  deletePayroll: (id: string) => api.delete(`/payroll-processing/${id}`),
  getPayrollStats: (params?: any) => api.get('/payroll-processing/dashboard/stats', { params }),
};
```

## 📝 Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install pdfkit @types/pdfkit
npm install class-validator class-transformer
```

### 2. Run Prisma Generate

```bash
cd backend
npx prisma generate
```

### 3. Verify Compilation

```bash
cd backend
npm run build
```

### 4. Start Development Server

```bash
cd backend
npm run start:dev
```

## 🎯 Implementation Checklist

### Backend
- [x] DTOs created
- [x] Salary Structure Service
- [x] Payroll Processing Service
- [ ] PDF Generation Service
- [ ] Email Service
- [ ] Controllers
- [ ] Module updated
- [ ] Compilation verified

### Frontend
- [ ] Payroll Dashboard
- [ ] Salary Structure CRUD
- [ ] Employee Salary Pages
- [ ] Payroll Processing UI
- [ ] Payslip Generator
- [ ] Reports
- [ ] Employee Portal

### Integration
- [x] Attendance Integration (in service)
- [ ] Leave Integration (placeholder)
- [ ] Email Notifications
- [ ] PDF Downloads

## 🚀 Next Steps

1. Complete the PDF Generation Service
2. Create remaining controllers
3. Update Payroll Module
4. Build Frontend Dashboard
5. Create CRUD pages
6. Add Employee Portal
7. Implement Reports

## 📌 Notes

- All services use existing PrismaService
- Attendance integration is ready
- Leave integration needs Leave module
- PDF generation uses pdfkit
- Frontend uses existing components
- Dark theme maintained
- RBAC enforced

---

**Status**: Foundation Complete - Ready for Phase 2
**Last Updated**: 2026-08-06
**Version**: 2.0.0
