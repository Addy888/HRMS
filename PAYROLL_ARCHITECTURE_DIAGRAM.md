# Payroll Module - Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FCS HRMS SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐    ┌─────────────────────────────┐
│        HR PORTAL            │    │     EMPLOYEE PORTAL         │
│  (/hr/*)                    │    │  (/employee/*)              │
├─────────────────────────────┤    ├─────────────────────────────┤
│                             │    │                             │
│  Sidebar Menu:              │    │  Sidebar Menu:              │
│  ├─ Dashboard               │    │  ├─ Dashboard               │
│  ├─ Employees               │    │  ├─ My Profile              │
│  ├─ Departments             │    │  ├─ 💰 My Salary ← NEW     │
│  ├─ Designations            │    │  ├─ Documents               │
│  ├─ Documents               │    │  ├─ Policies                │
│  ├─ Policies                │    │  ├─ Acknowledgement         │
│  ├─ Helpdesk                │    │  ├─ Helpdesk                │
│  └─ 💰 Payroll ← NEW        │    │  └─ Settings                │
│      ├─ Dashboard           │    │                             │
│      ├─ Employee Salary     │    │  /employee/my-salary        │
│      ├─ Salary Structure    │    │  ┌───────────────────────┐ │
│      ├─ Payroll Processing  │    │  │ Current Month Status  │ │
│      ├─ Salary Slip Gen.    │    │  ├───────────────────────┤ │
│      ├─ Salary History      │    │  │ Earnings Card         │ │
│      └─ Payroll Reports     │    │  │ - Basic Salary        │ │
│                             │    │  │ - HRA                 │ │
│  Full Access:               │    │  │ - Allowances          │ │
│  ✅ Create Salary           │    │  │ - Gross Salary        │ │
│  ✅ Update Salary           │    │  ├───────────────────────┤ │
│  ✅ Delete Salary           │    │  │ Deductions Card       │ │
│  ✅ Generate Payroll        │    │  │ - PF, ESI, TDS        │ │
│  ✅ Generate Salary Slips   │    │  │ - Total Deductions    │ │
│  ✅ Download/Print/Email    │    │  ├───────────────────────┤ │
│  ✅ Bulk Operations         │    │  │ Net Salary (Highlight)│ │
│  ✅ Reports                 │    │  ├───────────────────────┤ │
│                             │    │  │ CTC Display           │ │
│                             │    │  ├───────────────────────┤ │
│                             │    │  │ Recent History (6mo)  │ │
│                             │    │  └───────────────────────┘ │
│                             │    │                             │
│                             │    │  Read-Only Access:          │
│                             │    │  ✅ View Own Salary         │
│                             │    │  ✅ View Own History        │
│                             │    │  ❌ Edit Salary             │
│                             │    │  ❌ Download Slips          │
│                             │    │  ❌ View Others' Salary     │
└─────────────────────────────┘    └─────────────────────────────┘
           │                                    │
           └────────────────┬───────────────────┘
                           │ HTTP Requests (JWT)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / BACKEND                      │
│                        (NestJS + Express)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  JwtAuthGuard                                                   │
│  ├─ Verify JWT Token                                            │
│  ├─ Extract User Info (userId, employeeId, role)                │
│  └─ Attach to Request Object                                    │
│                                                                 │
│  RolesGuard                                                     │
│  ├─ Check Required Roles (@Roles decorator)                     │
│  ├─ Compare with User Role from JWT                             │
│  └─ Allow/Deny Access                                           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PAYROLL MODULE LAYER                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐  ┌─────────────────────────────┐
│     HR CONTROLLERS           │  │  EMPLOYEE CONTROLLER        │
│  (Full Access)               │  │  (Read-Only Access)         │
├──────────────────────────────┤  ├─────────────────────────────┤
│                              │  │                             │
│  PayrollController           │  │  EmployeeSalaryController   │
│  @Roles(HR, SUPER_ADMIN)     │  │  @Roles(EMPLOYEE)           │
│  ├─ POST /generate           │  │  ├─ GET /my-salary          │
│  ├─ GET /history             │  │  ├─ GET /my-salary-history  │
│  ├─ PATCH /approve           │  │  ├─ GET /my-payroll-status  │
│  ├─ PATCH /pay               │  │  └─ GET /payslip/:id        │
│  └─ DELETE /:id              │  │      └─ Ownership Check ✓   │
│                              │  │                             │
│  SalaryStructureController   │  │  Ownership Verification:    │
│  @Roles(HR, SUPER_ADMIN)     │  │  - Extract employeeId       │
│  ├─ POST /create             │  │  - Compare with JWT         │
│  ├─ PATCH /update            │  │  - Block if mismatch        │
│  ├─ DELETE /delete           │  │                             │
│  └─ GET /all                 │  │  Security:                  │
│                              │  │  - No PUT/POST/DELETE       │
│  SalarySlipController        │  │  - No Cross-Employee Access │
│  @Roles(HR, SUPER_ADMIN)     │  │  - JWT Required             │
│  ├─ POST /generate           │  │  - Role Verified            │
│  ├─ POST /download           │  │                             │
│  ├─ POST /email              │  │                             │
│  └─ POST /bulk               │  │                             │
│                              │  │                             │
│  PayrollProcessingController │  │                             │
│  @Roles(HR, SUPER_ADMIN)     │  │                             │
│  ├─ POST /process-month      │  │                             │
│  └─ GET /stats               │  │                             │
└──────────────────────────────┘  └─────────────────────────────┘
           │                                 │
           └────────────┬────────────────────┘
                        │ Uses
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER (Reused)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PayrollService                                                 │
│  ├─ generateForEmployee()                                       │
│  ├─ generateForAllEmployees()                                   │
│  ├─ getPayrollHistory()                                         │
│  ├─ approvePayroll()                                            │
│  ├─ markAsPaid()                                                │
│  └─ getPayrollSummary()                                         │
│                                                                 │
│  SalaryStructureService                                         │
│  ├─ create()                                                    │
│  ├─ update()                                                    │
│  ├─ findAll()                                                   │
│  ├─ getActiveSalaryStructure() ← Used by Employee Controller   │
│  └─ getSalaryHistory()         ← Used by Employee Controller   │
│                                                                 │
│  SalarySlipService                                              │
│  ├─ generateSalarySlipData()   ← Used by Employee Controller   │
│  ├─ getEmployeeSalarySlips()   ← Used by Employee Controller   │
│  ├─ markAsDownloaded()                                          │
│  └─ getPayrollStatus()         ← Used by Employee Controller   │
│                                                                 │
│  PayrollProcessingService                                       │
│  ├─ processMonthlyPayroll()                                     │
│  └─ getDashboardStats()                                         │
└─────────────────────────────────────────────────────────────────┘
                        │ Uses
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
│                     (Prisma + PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tables:                                                        │
│  ├─ Employee                                                    │
│  ├─ SalaryStructure                                             │
│  ├─ PayrollRun                                                  │
│  ├─ Payslip                                                     │
│  └─ Company                                                     │
│                                                                 │
│  Relationships:                                                 │
│  Employee 1:N SalaryStructure                                   │
│  Employee 1:N PayrollRun                                        │
│  PayrollRun 1:1 Payslip                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
┌─────────────────────────┐
│ 1. JWT Authentication   │
│    - Extract Token      │
│    - Verify Signature   │
│    - Check Expiration   │
└─────────────────────────┘
     │
     ├─── ❌ Invalid Token → 401 Unauthorized
     │
     ▼
┌─────────────────────────┐
│ 2. Role Verification    │
│    - Extract User Role  │
│    - Check @Roles()     │
│    - Compare Allowed    │
└─────────────────────────┘
     │
     ├─── ❌ Wrong Role → 403 Forbidden
     │
     ▼
┌─────────────────────────┐
│ 3. Ownership Check      │  (Employee endpoints only)
│    - Extract employeeId │
│    - Compare with JWT   │
│    - Verify Match       │
└─────────────────────────┘
     │
     ├─── ❌ Not Owner → 403 Forbidden
     │
     ▼
┌─────────────────────────┐
│ 4. Execute Controller   │
│    - Process Request    │
│    - Call Services      │
│    - Return Data        │
└─────────────────────────┘
     │
     ▼
✅ 200 OK with Data
```

---

## 📊 Data Flow Diagram

### HR Generating Payroll

```
HR Portal                  Backend                     Database
    │                         │                           │
    │ POST /payroll/generate  │                           │
    ├────────────────────────>│                           │
    │   { month, year }       │                           │
    │                         │ 1. Verify JWT + Role      │
    │                         │    (HR/SUPER_ADMIN)       │
    │                         │                           │
    │                         │ 2. Get Active Salary      │
    │                         │    Structure              │
    │                         ├──────────────────────────>│
    │                         │                           │
    │                         │<──────────────────────────┤
    │                         │   SalaryStructure Data    │
    │                         │                           │
    │                         │ 3. Calculate Payroll      │
    │                         │    - Gross Salary         │
    │                         │    - Deductions           │
    │                         │    - Net Salary           │
    │                         │                           │
    │                         │ 4. Create PayrollRun      │
    │                         ├──────────────────────────>│
    │                         │                           │
    │                         │<──────────────────────────┤
    │                         │   PayrollRun Created      │
    │<────────────────────────┤                           │
    │   Success Response      │                           │
    │                         │                           │
```

### Employee Viewing Salary

```
Employee Portal            Backend                     Database
    │                         │                           │
    │ GET /employee-salary/   │                           │
    │     my-salary           │                           │
    ├────────────────────────>│                           │
    │   JWT: {employeeId:123} │                           │
    │                         │                           │
    │                         │ 1. Verify JWT             │
    │                         │    Extract employeeId=123 │
    │                         │                           │
    │                         │ 2. Verify Role=EMPLOYEE   │
    │                         │                           │
    │                         │ 3. Get Active Salary      │
    │                         │    Structure for emp 123  │
    │                         ├──────────────────────────>│
    │                         │   WHERE employeeId=123    │
    │                         │                           │
    │                         │<──────────────────────────┤
    │                         │   SalaryStructure Data    │
    │                         │   (Only for emp 123)      │
    │<────────────────────────┤                           │
    │   Salary Data           │                           │
    │   (Read-Only)           │                           │
    │                         │                           │
```

### Blocked Access - Employee Trying HR Endpoint

```
Employee Portal            Backend
    │                         │
    │ POST /payroll/generate  │
    ├────────────────────────>│
    │   JWT: {role:EMPLOYEE}  │
    │                         │
    │                         │ 1. Verify JWT ✓
    │                         │
    │                         │ 2. Verify Role
    │                         │    Required: HR
    │                         │    Actual: EMPLOYEE
    │                         │    ❌ MISMATCH
    │<────────────────────────┤
    │   403 Forbidden         │
    │   "Insufficient         │
    │    permissions"         │
    │                         │
```

---

## 🎯 Component Interaction

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENTS                        │
└────────────────────────────────────────────────────────────────┘

HRLayout Component
├── Navigation Sidebar
│   ├── SidebarLink (regular menu items)
│   └── SidebarMenu (expandable Payroll menu) ← NEW
│       ├── Payroll Dashboard
│       ├── Employee Salary
│       ├── Salary Structure
│       ├── Payroll Processing
│       ├── Salary Slip Generator
│       ├── Salary History
│       └── Payroll Reports
│
└── Main Content Area
    └── {children} (route pages)

EmployeeLayout Component
├── Navigation Sidebar
│   ├── SidebarLink (regular menu items)
│   └── My Salary ← NEW
│
└── Main Content Area
    └── {children} (route pages)

My Salary Page (/employee/my-salary)
├── Current Month Status Card
│   ├── Month/Year Display
│   ├── Status Badge
│   └── Net Salary (if generated)
│
├── Salary Structure Cards
│   ├── Earnings Card
│   │   ├── Basic Salary
│   │   ├── HRA
│   │   ├── Allowances
│   │   └── Gross Salary Total
│   │
│   └── Deductions Card
│       ├── PF, ESI
│       ├── Professional Tax, TDS
│       └── Total Deductions
│
├── Net Salary Highlight Card
│   └── Take-home salary (gradient)
│
├── CTC Display Card
│   └── Cost to Company
│
├── Recent Payroll History
│   └── Last 6 months (cards)
│
└── Info Notice
    └── Read-only access explanation

```

---

## 🔄 Request/Response Flow

### Successful Employee Request

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ 1. GET /employee/my-salary
       │    Cookie: jwt=xxx
       ▼
┌──────────────┐
│   Next.js    │
│   Frontend   │
└──────┬───────┘
       │ 2. Fetch API Call
       │    /employee-salary/my-salary
       │    Authorization: Bearer xxx
       ▼
┌──────────────┐
│   NestJS     │
│   Backend    │
└──────┬───────┘
       │ 3. JwtAuthGuard
       │    ✓ Token Valid
       ▼
       │ 4. RolesGuard
       │    ✓ Role = EMPLOYEE
       ▼
       │ 5. EmployeeSalaryController
       │    ✓ Extract employeeId from JWT
       ▼
       │ 6. SalaryStructureService
       │    getActiveSalaryStructure(employeeId)
       ▼
┌──────────────┐
│   Database   │
│  PostgreSQL  │
└──────┬───────┘
       │ 7. Query SalaryStructure
       │    WHERE employeeId = xxx
       ▼
       │ 8. Return Data
       ▼
┌──────────────┐
│   NestJS     │
│   Response   │
└──────┬───────┘
       │ 9. JSON Response
       │    { success: true, data: {...} }
       ▼
┌──────────────┐
│   React      │
│   Query      │
└──────┬───────┘
       │ 10. Update State
       │     Cache Data
       ▼
┌──────────────┐
│   UI Update  │
│   Display    │
└──────────────┘
```

---

## 📦 Module Dependencies

```
PayrollModule
├── Controllers
│   ├── PayrollController (existing)
│   ├── SalaryStructureController (existing)
│   ├── SalarySlipController (existing)
│   ├── PayrollProcessingController (existing)
│   └── EmployeeSalaryController ← NEW
│
├── Providers (Services)
│   ├── PrismaService (injected)
│   ├── PayrollService (reused)
│   ├── SalaryStructureService (reused)
│   ├── SalarySlipService (reused)
│   └── PayrollProcessingService (reused)
│
└── Exports
    ├── PayrollService
    ├── SalaryStructureService
    ├── SalarySlipService
    └── PayrollProcessingService
```

---

## 🎨 UI Component Tree

```
App
├── Providers
│   └── QueryClientProvider (React Query)
│
├── Routes
│   ├── /hr/*
│   │   └── HRLayout
│   │       ├── Sidebar
│   │       │   ├── Logo
│   │       │   ├── User Card
│   │       │   ├── Navigation Links
│   │       │   ├── Payroll Menu ← NEW
│   │       │   │   ├── Dashboard
│   │       │   │   ├── Employee Salary
│   │       │   │   ├── Salary Structure
│   │       │   │   ├── Processing
│   │       │   │   ├── Payslips
│   │       │   │   ├── History
│   │       │   │   └── Reports
│   │       │   └── Logout Button
│   │       │
│   │       └── Main Content
│   │           └── Page Component
│   │
│   └── /employee/*
│       └── EmployeeLayout
│           ├── Sidebar
│           │   ├── Logo
│           │   ├── Navigation Links
│           │   ├── My Salary ← NEW
│           │   ├── User Profile
│           │   └── Logout Button
│           │
│           └── Main Content
│               └── Page Component
│                   └── My Salary Page
│                       ├── Header
│                       ├── Current Status Card
│                       ├── Earnings/Deductions Grid
│                       ├── Net Salary Highlight
│                       ├── CTC Card
│                       ├── History List
│                       └── Info Notice
│
└── NotificationToastProvider
```

---

This architecture ensures:
- ✅ Clear separation of concerns
- ✅ Role-based access control at multiple layers
- ✅ No code duplication
- ✅ Secure data access
- ✅ Scalable structure
- ✅ Easy to maintain and extend
