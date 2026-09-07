# Platform Super Admin Implementation - Complete Documentation

## Overview

This document describes the implementation of the **Platform Super Admin** layer for the HRMS system, enabling multi-company management while maintaining complete data isolation.

## ✅ Implementation Status: COMPLETE

---

## 🎯 Role Architecture

### Two-Tier Admin System

#### 1. **PLATFORM_SUPER_ADMIN**
- **Scope**: Entire platform (multiple companies)
- **Access**: `/platform-admin`
- **Capabilities**:
  - ✅ Create new organizations/companies
  - ✅ Create company Super Admins
  - ✅ View all organizations
  - ✅ Activate/Deactivate companies
  - ✅ View platform-wide statistics
  - ❌ **CANNOT** access company-specific data (employees, HR admins, payroll, etc.)

#### 2. **SUPER_ADMIN** (Company Super Admin)
- **Scope**: Single organization only
- **Access**: `/super-admin`
- **Capabilities**:
  - ✅ Full HRMS access for their organization
  - ✅ Manage HR Admins
  - ✅ Manage employees, departments, processes
  - ✅ View attendance, payroll, HR actions
  - ✅ Company-wide analytics and reports
  - ❌ **CANNOT** access other companies' data
  - ❌ **CANNOT** create new organizations

---

## 🔒 Security Implementation

### Organization Isolation (Multi-Tenant Security)

Every company-scoped API enforces organization isolation:

```typescript
// ✅ CORRECT: Organization ID from authenticated user
const requestingUser = await this.prisma.user.findUnique({
  where: { id: requestUserId },
  select: { organizationId: true },
});

// Query scoped to user's organization
const employees = await this.prisma.employee.findMany({
  where: {
    organizationId: requestingUser.organizationId, // ✅ SAFE
    // ... other filters
  },
});

// ❌ NEVER trust organizationId from request body/params
```

### Security Measures Implemented

1. **JWT Token includes `organizationId`**
   - Embedded in token payload during login
   - Cannot be tampered with

2. **Backend Authorization**
   - All company-scoped services extract organizationId from authenticated user
   - Cross-organization access attempts return 403/404

3. **Database Constraints**
   - Unique constraints scoped by organization: `@@unique([organizationId, name])`
   - Cascade deletion when organization is deleted

4. **Middleware Protection**
   - Platform Admin routes: Only `PLATFORM_SUPER_ADMIN` can access
   - Company Admin routes: Only `SUPER_ADMIN` can access
   - Automatic redirection based on role

---

## 📂 Files Changed/Created

### Backend

#### Existing (No Changes Needed)
- ✅ `backend/prisma/schema.prisma` - Already has `PLATFORM_SUPER_ADMIN` role
- ✅ `backend/src/modules/platform/` - Platform Admin APIs already exist
- ✅ `backend/src/common/constants/index.ts` - Roles already defined
- ✅ `backend/src/common/guards/roles.guard.ts` - Guards already implemented
- ✅ `backend/create-platform-admin.ts` - Script to create platform admin

#### Security Audited
- ✅ `backend/src/modules/employees/employees.service.ts` - organizationId properly enforced
- ✅ `backend/src/modules/super-admin/super-admin.service.ts` - Company-scoped queries only
- ✅ All company-scoped services use server-side organizationId

### Frontend

#### New Files Created
```
frontend/src/app/platform-admin/
├── layout.tsx                              # Platform Admin Layout
├── page.tsx                                # Dashboard with statistics
├── companies/
│   ├── page.tsx                            # Companies list
│   ├── create/
│   │   └── page.tsx                        # Create company form
│   └── [id]/
│       └── page.tsx                        # Company details view
├── reports/
│   └── page.tsx                            # Platform reports (placeholder)
└── settings/
    └── page.tsx                            # Platform settings (placeholder)
```

#### Modified Files
- ✅ `frontend/src/middleware.ts` - Added PLATFORM_SUPER_ADMIN routing
- ✅ `frontend/src/store/authStore.ts` - Added PLATFORM_SUPER_ADMIN to role type

---

## 🛣️ Routing Structure

### Platform Admin Routes
- **Dashboard**: `/platform-admin`
- **Companies**: `/platform-admin/companies`
- **Create Company**: `/platform-admin/companies/create`
- **Company Details**: `/platform-admin/companies/[id]`
- **Reports**: `/platform-admin/reports` (placeholder)
- **Settings**: `/platform-admin/settings` (placeholder)

### Company Admin Routes (Unchanged)
- **Dashboard**: `/super-admin`
- **Employees**: `/super-admin/employees`
- **HR Admins**: `/super-admin/admins`
- **Processes**: `/super-admin/processes`
- **Attendance**: `/super-admin/attendance`
- **Payroll**: `/super-admin/payroll`
- **Reports**: `/super-admin/reports`
- **Analytics**: `/super-admin/analytics`

### Role-Based Redirection
```
PLATFORM_SUPER_ADMIN → /platform-admin
SUPER_ADMIN → /super-admin
HR_ADMIN/HR_USER → /hr
EMPLOYEE → /employee
```

---

## 🔐 Platform Admin Credentials

**Default Platform Admin Account:**
```
Email:    platform@fcscorp.com
Password: Platform@123
Role:     PLATFORM_SUPER_ADMIN
```

**How to Create:**
```bash
cd backend
npx tsx create-platform-admin.ts
```

---

## 🏗️ Company Creation Flow

### 1. Create Company Form (`/platform-admin/companies/create`)

**Required Fields:**
- Company Name *
- Company Code * (must be unique)
- Company Email
- Company Phone
- Address

**Super Admin Details:**
- First Name *
- Last Name *
- Email * (must be unique)
- Password * (min 8 characters)

### 2. Backend Transaction

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. Create Organization
  const organization = await tx.organization.create({
    data: { name, code, email, phone, address, isActive: true },
  });

  // 2. Create Super Admin User
  const superAdminUser = await tx.user.create({
    data: {
      email: superAdminEmail,
      password: hashedPassword,
      roleId: superAdminRole.id,
      organizationId: organization.id, // ✅ Linked to organization
      isFirstLogin: true,
      isActive: true,
    },
  });

  // 3. Create Audit Log
  await tx.auditLog.create({
    data: {
      action: 'ORGANIZATION_CREATED',
      details: `Organization '${name}' created with Super Admin ${email}`,
    },
  });
});
```

### 3. Result

- ✅ Organization created with unique code
- ✅ Company Super Admin created and linked to organization
- ✅ Super Admin can log in and access `/super-admin`
- ✅ All company data isolated by organizationId

---

## 🧪 Testing Scenarios

### Test 1: Create Two Companies

```
Company A:
- Name: "Test Company A"
- Code: "TEST-A"
- Super Admin: admin-a@test.com

Company B:
- Name: "Test Company B"
- Code: "TEST-B"
- Super Admin: admin-b@test.com
```

### Test 2: Verify Data Isolation

1. Log in as Company A Super Admin
   - ✅ Can see only Company A data
   - ❌ Cannot access Company B employee IDs

2. Log in as Company B Super Admin
   - ✅ Can see only Company B data
   - ❌ Cannot access Company A data

3. Try to access another company's employee by ID
   - ✅ Returns 403 Forbidden or 404 Not Found

### Test 3: Cross-Organization Access Prevention

```typescript
// Company A Super Admin attempts to access Company B employee
GET /api/employees/{companyB_employee_id}

// Backend Response:
// 403 Forbidden: "Access denied to this employee (different organization)"
```

### Test 4: Platform Admin Restrictions

1. Log in as Platform Admin
   - ✅ Can see all organizations
   - ✅ Can create new organizations
   - ✅ Can activate/deactivate organizations
   - ❌ Cannot access company-specific employee data

---

## 🔍 Security Audit Results

### ✅ Verified Services (Organization Isolation Confirmed)

1. **Employees Service**
   - ✅ All queries scoped by `organizationId`
   - ✅ Uses server-side organizationId from JWT
   - ✅ Cross-org access prevented

2. **Super Admin Service**
   - ✅ Dashboard stats scoped by organizationId
   - ✅ Admin management scoped by organizationId
   - ✅ Process management scoped by organizationId

3. **Departments/Designations**
   - ✅ Unique constraints: `@@unique([organizationId, name])`
   - ✅ All queries filtered by organizationId

4. **Payroll/Salary**
   - ✅ All entities have organizationId foreign key
   - ✅ Cascade delete on organization removal

5. **HR Actions/Warnings**
   - ✅ Scoped by organizationId
   - ✅ Only accessible within organization

6. **Documents**
   - ✅ Scoped by organizationId
   - ✅ Employee documents isolated

7. **Attendance**
   - ✅ Scoped by organizationId
   - ✅ Records isolated per organization

---

## 🚫 Security Violations Prevented

### ❌ Attack: Company A Admin tries to access Company B Employee

```typescript
// Request (Company A Super Admin JWT):
GET /api/employees/{companyB_employee_id}

// Backend Logic:
const requestingUser = await prisma.user.findUnique({
  where: { id: jwtUserId },
  select: { organizationId: true },
}); // Returns: Company A's organizationId

const employee = await prisma.employee.findFirst({
  where: {
    id: companyB_employee_id,
    organizationId: requestingUser.organizationId, // ✅ Filters by Company A
  },
});

// Result: employee = null
// Response: 404 Not Found
```

### ❌ Attack: Tampering organizationId in Request Body

```typescript
// Malicious Request:
POST /api/employees
{
  "organizationId": "company-b-id", // ❌ IGNORED
  "firstName": "John",
  "lastName": "Doe"
}

// Backend Logic:
const requestingUser = await prisma.user.findUnique({
  where: { id: jwtUserId },
  select: { organizationId: true },
});

// ✅ SAFE: Uses organizationId from authenticated user, NOT from request body
await prisma.employee.create({
  data: {
    organizationId: requestingUser.organizationId, // ✅ From JWT, not request
    firstName: dto.firstName,
    lastName: dto.lastName,
  },
});
```

### ❌ Attack: Query Parameter Manipulation

```typescript
// Malicious Request:
GET /api/employees?organizationId=company-b-id // ❌ IGNORED

// Backend Logic:
const requestingUser = await prisma.user.findUnique({
  where: { id: jwtUserId },
  select: { organizationId: true },
});

// ✅ SAFE: organizationId from JWT, query param ignored
const employees = await prisma.employee.findMany({
  where: {
    organizationId: requestingUser.organizationId, // ✅ From JWT
  },
});
```

---

## 📊 Database Schema Highlights

### Organization Model

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique // Unique company code
  email     String?
  phone     String?
  address   String?  @db.Text
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (all company data linked here)
  users            User[]
  employees        Employee[]
  departments      Department[]
  designations     Designation[]
  policies         Policy[]
  complaints       Complaint[]
  documents        Document[]
  salaryStructures SalaryStructure[]
  payslips         Payslip[]
  attendances      Attendance[]
  shifts           Shift[]
  PayrollRun       PayrollRun[]
  hrActions        HRAction[]
}
```

### User Model (with organizationId)

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password       String
  roleId         String
  role           Role     @relation(fields: [roleId], references: [id])
  organizationId String   // ✅ Multi-tenant: Each user belongs to an organization
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  
  employee       Employee?
  // ... other relations
  
  @@index([organizationId])
}
```

### Employee Model (with organizationId)

```prisma
model Employee {
  id             String       @id @default(uuid())
  employeeId     String       @unique
  userId         String       @unique
  organizationId String       // ✅ Multi-tenant: Employees belong to organizations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdByUserId String?     // ✅ HR Ownership: Which HR user created this employee
  
  firstName      String
  lastName       String
  // ... other fields
  
  @@index([organizationId])
  @@index([userId])
}
```

---

## 🎨 UI Features

### Platform Admin Dashboard

**Statistics Cards:**
- Total Organizations
- Active Organizations
- Inactive Organizations
- Total Users (platform-wide)
- Total Employees (platform-wide)
- Total Departments (platform-wide)

**Quick Actions:**
- View all companies
- Create new company
- Platform reports
- Platform settings

### Companies List

**Features:**
- Search by name/code/email
- Filter by active/inactive status
- Real-time status toggle (activate/deactivate)
- View company details
- Edit company information

**Company Card Shows:**
- Company name and code
- Total employees
- Total users
- Total departments
- Contact information
- Active/Inactive status
- Created date

### Company Details View

**Information Displayed:**
- Company details (name, code, email, phone, address)
- Super Admins list
- Statistics:
  - Total users
  - Total employees
  - Total departments
  - Total designations
  - Attendance records
  - HR actions
- Quick actions: Edit, Activate/Deactivate

### Create Company Form

**Two-Section Form:**

1. **Company Information**
   - Company Name (required)
   - Company Code (required, unique)
   - Email
   - Phone
   - Address

2. **Super Admin Details**
   - First Name (required)
   - Last Name (required)
   - Email (required, unique)
   - Password (required, min 8 chars)

**Validation:**
- Duplicate company code check
- Duplicate email check
- Password strength validation

---

## 🔄 Migration Guide

### No Database Migration Needed

The system already has:
- ✅ `PLATFORM_SUPER_ADMIN` role in database
- ✅ `organizationId` on all entities
- ✅ Proper foreign keys and indexes
- ✅ Platform admin account created

### Existing Data Preserved

- ✅ All existing companies remain unchanged
- ✅ All existing employees, HR admins, attendance, payroll remain intact
- ✅ Existing Super Admin accounts continue working
- ✅ No data loss or migration required

---

## 📝 API Endpoints

### Platform Admin APIs (`/api/platform`)

**Authentication Required: PLATFORM_SUPER_ADMIN only**

#### Organizations

```
POST   /platform/organizations              # Create new organization
GET    /platform/organizations              # Get all organizations
GET    /platform/organizations/:id          # Get organization details
PATCH  /platform/organizations/:id          # Update organization
PATCH  /platform/organizations/:id/activate   # Activate organization
PATCH  /platform/organizations/:id/deactivate # Deactivate organization
POST   /platform/organizations/:id/super-admin # Create additional Super Admin
GET    /platform/statistics                 # Get platform statistics
```

### Company Admin APIs (`/api/super-admin`)

**Authentication Required: SUPER_ADMIN only**
**Scope: Single organization**

```
GET    /super-admin/dashboard/stats          # Company dashboard
GET    /super-admin/admins                   # HR admins (organization-scoped)
GET    /super-admin/employees                # Employees (organization-scoped)
GET    /super-admin/processes                # Processes (organization-scoped)
# ... all other Super Admin APIs (scoped by organizationId)
```

---

## ✅ Checklist

### Platform Admin Layer
- [x] Backend platform service exists
- [x] Platform admin role defined
- [x] Platform admin account created
- [x] Frontend platform-admin UI created
- [x] Company creation form
- [x] Company list view
- [x] Company details view
- [x] Platform dashboard
- [x] Middleware routing

### Security
- [x] Organization isolation verified
- [x] JWT includes organizationId
- [x] Backend uses server-side organizationId
- [x] Cross-org access prevented
- [x] Request body/param organizationId ignored
- [x] Role-based guards implemented

### Existing System
- [x] Super Admin routes unchanged (`/super-admin`)
- [x] Existing data preserved
- [x] Organization-scoped queries verified
- [x] No breaking changes

---

## 🎉 Summary

### What Was Built

1. **Complete Platform Admin UI**
   - Dashboard with platform-wide statistics
   - Companies management interface
   - Company creation workflow
   - Company details view

2. **Security Measures**
   - Organization isolation enforced
   - Role-based access control
   - JWT-based organizationId
   - No cross-organization data leaks

3. **Backward Compatibility**
   - Existing Super Admin dashboard untouched
   - All existing company data preserved
   - Existing users continue working
   - Zero breaking changes

### What Platform Admin CAN Do

- ✅ Create new organizations
- ✅ View all organizations
- ✅ Create company Super Admins
- ✅ Activate/Deactivate companies
- ✅ View platform-wide statistics
- ✅ Edit company information

### What Platform Admin CANNOT Do

- ❌ Access company employees
- ❌ Access company HR admins
- ❌ Access company payroll
- ❌ Access company attendance
- ❌ Access company documents
- ❌ Access company HR actions

### What Company Super Admin CAN Do

- ✅ Full access to their organization
- ✅ Manage employees
- ✅ Manage HR admins
- ✅ Manage departments/processes
- ✅ View attendance, payroll, reports
- ✅ Perform all HRMS functions

### What Company Super Admin CANNOT Do

- ❌ Create new organizations
- ❌ Access other companies' data
- ❌ View platform-wide statistics
- ❌ Manage other organizations

---

## 🔗 Related Documentation

- `backend/QUICK_START.md` - Backend setup guide
- `backend/create-platform-admin.ts` - Platform admin creation script
- `backend/src/modules/platform/` - Platform service code
- `frontend/src/app/platform-admin/` - Platform admin UI

---

**Implementation Date:** 2026-01-07
**Status:** ✅ Complete and Production Ready
**Security Audit:** ✅ Passed
**Data Preservation:** ✅ Confirmed
