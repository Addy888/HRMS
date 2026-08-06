# Modified Files - Company Policy Synchronization Fix

## Total Files Modified: 5

---

## 1. Database Schema
**File:** `backend/prisma/schema.prisma`

### Changes:
- Added `CompanyPolicyAcceptance` model
- Added `acceptances` relation to `CompanyPolicy` model  
- Added `companyPolicyAcceptances` relation to `Employee` model

### New Model:
```prisma
model CompanyPolicyAcceptance {
  id               String   @id @default(uuid())
  companyPolicyId  String
  companyPolicy    CompanyPolicy @relation(fields: [companyPolicyId], references: [id], onDelete: Cascade)
  employeeId       String
  employee         Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  status           String   @default("PENDING")
  acceptedAt       DateTime?
  ipAddress        String?
  userAgent        String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([companyPolicyId, employeeId])
  @@index([employeeId])
  @@index([status])
}
```

**Migration Status:** ✅ Applied with `npx prisma db push`

---

## 2. Backend Service
**File:** `backend/src/modules/policies/company-policies.service.ts`

### Changes:

#### uploadPolicy() - Added Auto-Assignment
```typescript
// Added automatic assignment to all active employees
const activeEmployees = await tx.employee.findMany({
  where: {
    user: {
      isActive: true,
      role: { name: 'EMPLOYEE' },
    },
  },
  select: { id: true },
});

if (activeEmployees.length > 0) {
  await tx.companyPolicyAcceptance.createMany({
    data: activeEmployees.map((emp) => ({
      companyPolicyId: newPolicy.id,
      employeeId: emp.id,
      status: 'PENDING',
    })),
    skipDuplicates: true,
  });
}
```

#### getActivePolicyForEmployee() - NEW METHOD
```typescript
async getActivePolicyForEmployee(employeeId: string) {
  const policy = await this.prisma.companyPolicy.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      acceptances: {
        where: { employeeId },
      },
    },
  });

  if (!policy) {
    return null;
  }

  const acceptance = policy.acceptances[0];

  return {
    id: policy.id,
    policyName: policy.policyName,
    fileName: policy.fileName,
    version: policy.version,
    uploadedBy: policy.uploadedByName,
    uploadedAt: policy.createdAt,
    status: acceptance?.status || 'PENDING',
    accepted: acceptance?.status === 'ACCEPTED',
    acceptedAt: acceptance?.acceptedAt || null,
  };
}
```

#### acceptCompanyPolicy() - NEW METHOD
```typescript
async acceptCompanyPolicy(
  employeeId: string,
  policyId: string,
  ipAddress: string,
  userAgent: string,
) {
  const policy = await this.prisma.companyPolicy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    throw new NotFoundException('Company policy not found');
  }

  const acceptance = await this.prisma.companyPolicyAcceptance.upsert({
    where: {
      companyPolicyId_employeeId: {
        companyPolicyId: policyId,
        employeeId,
      },
    },
    create: {
      companyPolicyId: policyId,
      employeeId,
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      ipAddress,
      userAgent,
    },
    update: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });

  return {
    success: true,
    message: 'Company policy accepted successfully',
    acceptance,
  };
}
```

#### getAcceptanceTracking() - NEW METHOD
```typescript
async getAcceptanceTracking() {
  const activePolicy = await this.prisma.companyPolicy.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      acceptances: {
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!activePolicy) {
    return {
      policy: null,
      totalEmployees: 0,
      pending: 0,
      completed: 0,
      percentage: 0,
      employees: [],
    };
  }

  const totalEmployees = activePolicy.acceptances.length;
  const completed = activePolicy.acceptances.filter(
    (a) => a.status === 'ACCEPTED',
  ).length;
  const pending = totalEmployees - completed;
  const percentage =
    totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0;

  return {
    policy: {
      id: activePolicy.id,
      policyName: activePolicy.policyName,
      version: activePolicy.version,
      uploadedAt: activePolicy.createdAt,
      uploadedBy: activePolicy.uploadedByName,
    },
    totalEmployees,
    pending,
    completed,
    percentage,
    employees: activePolicy.acceptances.map((acceptance) => ({
      id: acceptance.employee.id,
      employeeId: acceptance.employee.employeeId,
      name: `${acceptance.employee.firstName} ${acceptance.employee.lastName}`,
      department: acceptance.employee.department?.name || 'N/A',
      status: acceptance.status,
      acceptedAt: acceptance.acceptedAt,
    })),
  };
}
```

---

## 3. Backend Controller
**File:** `backend/src/modules/policies/company-policies.controller.ts`

### Changes:

#### Added Import:
```typescript
import { ..., Req } from '@nestjs/common';
```

#### getActivePolicyForEmployee() - NEW ENDPOINT
```typescript
@Get('employee/active')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.EMPLOYEE)
@ApiOperation({
  summary: 'Get active company policy for employee with acceptance status',
})
async getActivePolicyForEmployee(@GetUser('employeeId') employeeId: string) {
  return this.companyPoliciesService.getActivePolicyForEmployee(employeeId);
}
```

#### acceptCompanyPolicy() - NEW ENDPOINT
```typescript
@Post(':id/accept')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.EMPLOYEE)
@ApiOperation({ summary: 'Accept company policy (Employee only)' })
async acceptCompanyPolicy(
  @Param('id') id: string,
  @GetUser('employeeId') employeeId: string,
  @Req() req: any,
) {
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return this.companyPoliciesService.acceptCompanyPolicy(
    employeeId,
    id,
    ipAddress,
    userAgent,
  );
}
```

#### getAcceptanceTracking() - NEW ENDPOINT
```typescript
@Get('tracking/acceptance')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.HR)
@ApiOperation({
  summary: 'Get company policy acceptance tracking (HR Only)',
})
async getAcceptanceTracking() {
  return this.companyPoliciesService.getAcceptanceTracking();
}
```

---

## 4. Employee Service
**File:** `backend/src/modules/employees/employees.service.ts`

### Changes:

#### create() - Added Auto-Assignment for New Employees
```typescript
// After creating EmployeeProfile, before audit log
// Auto-assign current ACTIVE company policy if exists
const activeCompanyPolicy = await tx.companyPolicy.findFirst({
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
});

if (activeCompanyPolicy) {
  await tx.companyPolicyAcceptance.create({
    data: {
      companyPolicyId: activeCompanyPolicy.id,
      employeeId: employee.id,
      status: 'PENDING',
    },
  });
}
```

---

## 5. Frontend Employee Policies Page
**File:** `frontend/src/app/employee/policies/page.tsx`

### Changes:

#### Updated API Call:
```typescript
// BEFORE:
const { data: companyPolicy } = useQuery({
  queryKey: ['active-company-policy'],
  queryFn: async () => {
    try {
      const res = await api.get('/company-policies/active');
      return res.data;
    } catch {
      return null;
    }
  },
});

// AFTER:
const { data: companyPolicy } = useQuery({
  queryKey: ['active-company-policy-employee'],
  queryFn: async () => {
    try {
      const res = await api.get('/company-policies/employee/active');
      return res.data;
    } catch {
      return null;
    }
  },
});
```

#### Updated UI Component:
```tsx
{companyPolicy && (
  <div className="block bg-gradient-to-br from-purple-950 to-pink-950 border border-purple-800 rounded-2xl p-6 relative">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <FileText className="w-6 h-6 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm font-bold text-white">{companyPolicy.policyName}</h3>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-bold">
            COMPANY POLICY
          </span>
          {companyPolicy.accepted && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-bold">
              ✓ ACCEPTED
            </span>
          )}
          {!companyPolicy.accepted && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold">
              PENDING
            </span>
          )}
        </div>
        <p className="text-xs text-purple-300/80 mb-3">
          Official company policy document. Please review and accept.
        </p>
        <div className="flex items-center gap-3 text-xs text-purple-400 flex-wrap">
          <span>Version {companyPolicy.version}</span>
          <span>•</span>
          <span>Uploaded: {new Date(companyPolicy.uploadedAt).toLocaleDateString()}</span>
          {companyPolicy.accepted && companyPolicy.acceptedAt && (
            <>
              <span>•</span>
              <span className="text-emerald-400">Accepted: {new Date(companyPolicy.acceptedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Link href={`/company-policies/${companyPolicy.id}/view`} target="_blank" className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition-colors">
            View Policy
          </Link>
          {!companyPolicy.accepted && (
            <button
              onClick={async () => {
                try {
                  await api.post(`/company-policies/${companyPolicy.id}/accept`);
                  alert('Company policy accepted successfully!');
                  window.location.reload();
                } catch (err: any) {
                  alert(err.response?.data?.message || 'Failed to accept policy');
                }
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Accept Policy
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
```

---

## Build & Compilation Status

### Backend:
```bash
$ npm run build
✅ Build successful - Zero TypeScript errors
```

### Database:
```bash
$ npx prisma db push
✅ Database schema updated successfully
✅ CompanyPolicyAcceptance table created
✅ Relations established
```

### Frontend:
```bash
$ TypeScript diagnostics check
✅ Zero errors in page.tsx
```

---

## API Endpoints Added

### Employee Endpoints:
1. `GET /company-policies/employee/active`
   - Returns active policy with employee's acceptance status
   - Includes: policyName, version, uploadedAt, status, accepted, acceptedAt

2. `POST /company-policies/:id/accept`
   - Accepts a company policy
   - Records: timestamp, IP address, user agent
   - Updates status to ACCEPTED

### HR Endpoints:
3. `GET /company-policies/tracking/acceptance`
   - Returns acceptance tracking data
   - Includes: totalEmployees, pending, completed, percentage
   - Lists all employees with their acceptance status

---

## Database Changes

### New Table: CompanyPolicyAcceptance
- `id` (uuid, primary key)
- `companyPolicyId` (foreign key to CompanyPolicy)
- `employeeId` (foreign key to Employee)
- `status` (PENDING or ACCEPTED)
- `acceptedAt` (timestamp, nullable)
- `ipAddress` (string, nullable)
- `userAgent` (string, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- Unique constraint on (companyPolicyId, employeeId)

### Modified Tables:
- **CompanyPolicy**: Added `acceptances` relation
- **Employee**: Added `companyPolicyAcceptances` relation

---

## Summary

All changes are focused on:
1. ✅ Auto-assigning policies to employees when uploaded
2. ✅ Auto-assigning policies to new employees when created
3. ✅ Tracking acceptance status per employee
4. ✅ Providing employee-specific API endpoints
5. ✅ Fixing date display issues
6. ✅ Adding acceptance functionality with audit trail
7. ✅ Providing HR with tracking capabilities

**No UI redesign, no authentication changes, no duplicate code.**

All modifications work with existing models and extend functionality cleanly.
