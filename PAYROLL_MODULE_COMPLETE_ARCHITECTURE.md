# 🏢 Enterprise Payroll Management Module - Complete Architecture

## 📋 Overview
This document provides the complete architecture for implementing an Enterprise-grade Payroll Management Module similar to Zoho People, Keka HR, Darwinbox, BambooHR, and Oracle HCM.

## 🎯 Module Structure

### Sidebar Navigation Structure
```
Payroll
├── Dashboard                    ✅ Core
├── Salary Structure            ✅ Core
├── Salary Components           ✅ Core
├── Employee Salary             ✅ Core
├── Payroll Processing          ✅ Core
├── Payslips                    ✅ Core
├── Bonuses                     ⚙️ Advanced
├── Incentives                  ⚙️ Advanced
├── Deductions                  ⚙️ Advanced
├── Reimbursements              ⚙️ Advanced
├── Loans & Advances            ⚙️ Advanced
├── Overtime                    ⚙️ Advanced
├── Attendance Sync             🔗 Integration
├── Leave Deduction             🔗 Integration
├── Tax Management              📊 Compliance
├── PF                          📊 Compliance
├── ESI                         📊 Compliance
├── Professional Tax            📊 Compliance
├── Payroll Reports             📈 Analytics
├── Bank Transfer               💳 Financial
└── Payroll Settings            ⚙️ Configuration
```

## 🗄️ Database Schema Enhancement

### Enhanced Prisma Schema
The existing schema already contains:
- ✅ SalaryStructure
- ✅ PayrollRun
- ✅ Payslip
- ✅ Loan
- ✅ AdvanceSalary

### Additional Models Needed

#### 1. Salary Components
```prisma
model SalaryComponent {
  id                    String              @id @default(uuid())
  name                  String              @unique
  displayName           String
  type                  String              // EARNING, DEDUCTION
  calculationType       String              // FIXED, PERCENTAGE, FORMULA
  baseAmount            Float?              @default(0)
  percentage            Float?              @default(0)
  formula               String?             @db.Text
  isTaxable             Boolean             @default(true)
  isRecurring           Boolean             @default(true)
  isSystemDefined       Boolean             @default(false)
  order                 Int                 @default(0)
  isActive              Boolean             @default(true)
  description           String?             @db.Text
  
  structureComponents   SalaryStructureComponent[]
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
}

model SalaryStructureComponent {
  id                    String              @id @default(uuid())
  salaryStructureId     String
  salaryStructure       SalaryStructure     @relation(fields: [salaryStructureId], references: [id], onDelete: Cascade)
  componentId           String
  component             SalaryComponent     @relation(fields: [componentId], references: [id], onDelete: Cascade)
  amount                Float
  calculatedAmount      Float?
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@unique([salaryStructureId, componentId])
}
```

#### 2. Bonus Management
```prisma
model Bonus {
  id                    String              @id @default(uuid())
  employeeId            String
  employee              Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  bonusType             String              // FESTIVAL, PERFORMANCE, REFERRAL, MANUAL, ANNUAL
  amount                Float
  month                 Int
  year                  Int
  reason                String?             @db.Text
  status                String              @default("PENDING") // PENDING, APPROVED, PAID, REJECTED
  approvedBy            String?
  approvedAt            DateTime?
  paidAt                DateTime?
  remarks               String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([employeeId, month, year])
}
```

#### 3. Deductions
```prisma
model Deduction {
  id                    String              @id @default(uuid())
  employeeId            String
  employee              Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  deductionType         String              // LATE_DEDUCTION, LEAVE_WITHOUT_PAY, ADVANCE_RECOVERY, LOAN_EMI, OTHER
  amount                Float
  month                 Int
  year                  Int
  reason                String              @db.Text
  status                String              @default("PENDING") // PENDING, APPROVED, DEDUCTED
  approvedBy            String?
  approvedAt            DateTime?
  remarks               String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([employeeId, month, year])
}
```

#### 4. Reimbursement
```prisma
model Reimbursement {
  id                    String              @id @default(uuid())
  employeeId            String
  employee              Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  reimbursementType     String              // TRAVEL, MEDICAL, FOOD, INTERNET, MOBILE, OTHER
  amount                Float
  requestedAmount       Float
  approvedAmount        Float?
  description           String              @db.Text
  receipts              String?             @db.Text // JSON array of file URLs
  status                String              @default("PENDING") // PENDING, APPROVED, REJECTED, PAID
  month                 Int
  year                  Int
  requestedAt           DateTime            @default(now())
  approvedBy            String?
  approvedAt            DateTime?
  paidAt                DateTime?
  rejectionReason       String?             @db.Text
  remarks               String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([employeeId, status])
}
```

#### 5. Overtime
```prisma
model Overtime {
  id                    String              @id @default(uuid())
  employeeId            String
  employee              Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date                  DateTime            @db.Date
  hours                 Float
  rate                  Float               // Per hour rate
  amount                Float               // Calculated amount
  reason                String?             @db.Text
  status                String              @default("PENDING") // PENDING, APPROVED, PAID, REJECTED
  approvedBy            String?
  approvedAt            DateTime?
  remarks               String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([employeeId, date])
}
```

#### 6. Tax Settings
```prisma
model TaxSlab {
  id                    String              @id @default(uuid())
  financialYear         String              // 2026-2027
  regime                String              // OLD, NEW
  minIncome             Float
  maxIncome             Float?              // null means unlimited
  taxRate               Float               // Percentage
  isActive              Boolean             @default(true)
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([financialYear, regime])
}

model TaxDeclaration {
  id                    String              @id @default(uuid())
  employeeId            String
  employee              Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  financialYear         String
  regime                String              // OLD, NEW
  section80C            Float               @default(0)
  section80D            Float               @default(0)
  section80E            Float               @default(0)
  section80G            Float               @default(0)
  hra                   Float               @default(0)
  homeLoanInterest      Float               @default(0)
  otherDeductions       Float               @default(0)
  status                String              @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, REJECTED
  documents             String?             @db.Text // JSON array
  submittedAt           DateTime?
  approvedBy            String?
  approvedAt            DateTime?
  remarks               String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@unique([employeeId, financialYear])
}
```

#### 7. Payroll Settings
```prisma
model PayrollSetting {
  id                    String              @id @default(uuid())
  key                   String              @unique
  value                 String              @db.Text
  dataType              String              // STRING, NUMBER, BOOLEAN, JSON
  category              String              // GENERAL, TAX, PF, ESI, OVERTIME, ROUNDING
  description           String?             @db.Text
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
}
```

## 🎨 Frontend Architecture

### Directory Structure
```
frontend/src/
├── app/
│   └── hr/
│       └── payroll/
│           ├── page.tsx                          # Dashboard
│           ├── salary-structure/
│           │   ├── page.tsx                      # List
│           │   ├── create/page.tsx               # Create
│           │   └── [id]/
│           │       ├── page.tsx                  # View/Edit
│           │       └── assign/page.tsx           # Assign to employees
│           ├── salary-components/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── employee-salary/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       ├── page.tsx
│           │       └── history/page.tsx
│           ├── payroll-processing/
│           │   ├── page.tsx
│           │   ├── bulk/page.tsx
│           │   └── [id]/page.tsx
│           ├── payslips/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── bonuses/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── incentives/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── deductions/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── reimbursements/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── loans/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── overtime/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── attendance-sync/
│           │   └── page.tsx
│           ├── leave-deduction/
│           │   └── page.tsx
│           ├── tax-management/
│           │   ├── page.tsx
│           │   ├── slabs/page.tsx
│           │   └── declarations/page.tsx
│           ├── pf/
│           │   └── page.tsx
│           ├── esi/
│           │   └── page.tsx
│           ├── professional-tax/
│           │   └── page.tsx
│           ├── reports/
│           │   ├── page.tsx
│           │   ├── payroll-register/page.tsx
│           │   ├── salary-register/page.tsx
│           │   ├── cost-report/page.tsx
│           │   └── export/page.tsx
│           ├── bank-transfer/
│           │   └── page.tsx
│           └── settings/
│               └── page.tsx
├── components/
│   └── payroll/
│       ├── PayrollDashboard.tsx
│       ├── SalaryStructureForm.tsx
│       ├── SalaryStructureCard.tsx
│       ├── ComponentForm.tsx
│       ├── EmployeeSalaryCard.tsx
│       ├── PayrollProcessingTable.tsx
│       ├── PayslipGenerator.tsx
│       ├── PayslipPDF.tsx
│       ├── BonusForm.tsx
│       ├── DeductionForm.tsx
│       ├── ReimbursementForm.tsx
│       ├── LoanForm.tsx
│       ├── OvertimeForm.tsx
│       ├── TaxCalculator.tsx
│       ├── PayrollCalendar.tsx
│       ├── SalaryTrendChart.tsx
│       ├── DepartmentCostChart.tsx
│       ├── PayrollMetrics.tsx
│       └── BankTransferTable.tsx
└── lib/
    └── payroll/
        ├── calculations.ts
        ├── tax-calculator.ts
        ├── pf-calculator.ts
        ├── esi-calculator.ts
        └── pdf-generator.ts
```

## 🔧 Backend Architecture

### Directory Structure
```
backend/src/modules/payroll/
├── controllers/
│   ├── payroll.controller.ts                     ✅ Exists
│   ├── salary-slip.controller.ts                 ✅ Exists (fixed)
│   ├── salary-structure.controller.ts
│   ├── salary-component.controller.ts
│   ├── employee-salary.controller.ts
│   ├── bonus.controller.ts
│   ├── deduction.controller.ts
│   ├── reimbursement.controller.ts
│   ├── loan.controller.ts
│   ├── overtime.controller.ts
│   ├── tax.controller.ts
│   ├── pf.controller.ts
│   ├── esi.controller.ts
│   ├── reports.controller.ts
│   ├── bank-transfer.controller.ts
│   └── settings.controller.ts
├── services/
│   ├── payroll.service.ts                        ✅ Exists
│   ├── salary-slip-new.service.ts                ✅ Exists (fixed)
│   ├── salary-structure.service.ts
│   ├── salary-component.service.ts
│   ├── employee-salary.service.ts
│   ├── payroll-calculation.service.ts
│   ├── bonus.service.ts
│   ├── deduction.service.ts
│   ├── reimbursement.service.ts
│   ├── loan.service.ts
│   ├── overtime.service.ts
│   ├── tax-calculation.service.ts
│   ├── pf-calculation.service.ts
│   ├── esi-calculation.service.ts
│   ├── attendance-integration.service.ts
│   ├── leave-integration.service.ts
│   ├── pdf-generation.service.ts
│   ├── email.service.ts
│   ├── reports.service.ts
│   ├── bank-transfer.service.ts
│   └── index.ts                                  ✅ Fixed
├── dto/
│   ├── create-salary-structure.dto.ts
│   ├── update-salary-structure.dto.ts
│   ├── create-component.dto.ts
│   ├── assign-salary.dto.ts
│   ├── process-payroll.dto.ts
│   ├── create-bonus.dto.ts
│   ├── create-deduction.dto.ts
│   ├── create-reimbursement.dto.ts
│   ├── create-loan.dto.ts
│   ├── create-overtime.dto.ts
│   ├── tax-declaration.dto.ts
│   └── payroll-filter.dto.ts
├── engine/
│   ├── payroll.engine.ts                         ✅ Exists
│   ├── salary-calculator.ts
│   ├── tax-calculator.ts
│   ├── pf-calculator.ts
│   └── esi-calculator.ts
├── interfaces/
│   ├── payroll-data.interface.ts                 ✅ Exists
│   ├── salary-component.interface.ts
│   ├── tax-calculation.interface.ts
│   └── payroll-report.interface.ts
├── enums/
│   ├── payroll-status.enum.ts                    ✅ Exists
│   ├── component-type.enum.ts
│   ├── bonus-type.enum.ts
│   ├── deduction-type.enum.ts
│   └── reimbursement-type.enum.ts
└── payroll.module.ts                             ✅ Exists (needs update)
```

## 📊 Dashboard Metrics

### Key Metrics
1. **Total Employees** - Active employees count
2. **Payroll This Month** - Total payroll for current month
3. **Gross Salary** - Total gross salary
4. **Net Salary** - Total net salary after deductions
5. **Pending Payroll** - Count of pending payroll runs
6. **Paid Payroll** - Count of completed payroll runs
7. **Upcoming Payroll** - Next payroll schedule
8. **Total Bonuses** - Sum of all bonuses this month
9. **Total Deductions** - Sum of all deductions this month
10. **Total Loans** - Outstanding loan amount

### Charts & Visualizations
1. **Salary Trend Chart** - Line chart showing salary trends over months
2. **Department Salary Chart** - Bar chart showing department-wise salary distribution
3. **Payroll Calendar** - Calendar view of payroll schedules
4. **Recent Payroll Table** - Latest payroll runs with status

## 🔄 Implementation Phases

### Phase 1: Foundation (Priority 1) ✅
- [x] Fix existing Payroll module compilation
- [ ] Enhanced Prisma schema
- [ ] Base controllers and services
- [ ] Payroll Dashboard
- [ ] Salary Structure CRUD
- [ ] Salary Components CRUD

### Phase 2: Core Features (Priority 2)
- [ ] Employee Salary Assignment
- [ ] Payroll Processing Engine
- [ ] Attendance Integration
- [ ] Leave Integration
- [ ] Payslip Generation
- [ ] PDF Generation

### Phase 3: Advanced Features (Priority 3)
- [ ] Bonuses Management
- [ ] Deductions Management
- [ ] Reimbursements
- [ ] Loans & Advances
- [ ] Overtime Management

### Phase 4: Compliance (Priority 4)
- [ ] Tax Calculator
- [ ] Tax Declarations
- [ ] PF Calculations
- [ ] ESI Calculations
- [ ] Professional Tax

### Phase 5: Reporting & Analytics (Priority 5)
- [ ] Payroll Reports
- [ ] Cost Reports
- [ ] Excel Export
- [ ] PDF Export
- [ ] Analytics Dashboard

### Phase 6: Financial Integration (Priority 6)
- [ ] Bank Transfer Integration
- [ ] Payment Gateway
- [ ] Bulk Payments

## 🎯 Next Steps

### Immediate Actions Required:
1. ✅ Fix TypeScript compilation errors
2. ⏳ Run Prisma migration to add new models
3. ⏳ Create Salary Structure module (Complete CRUD)
4. ⏳ Create Salary Components module
5. ⏳ Build Payroll Dashboard with metrics
6. ⏳ Implement Payroll Processing Engine

### Command to Generate Prisma Client
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_payroll_enhancements
```

## 📝 Notes
- Use existing authentication and authorization
- Follow existing naming conventions
- Maintain dark theme consistency
- Use existing UI components
- Implement proper error handling
- Add comprehensive logging
- Include audit trails
- Implement role-based permissions
- Add notification triggers
- Integrate with existing modules

---

**Status**: Architecture document complete. Ready for phase-by-phase implementation.
**Last Updated**: 2026-08-06
**Version**: 1.0.0
