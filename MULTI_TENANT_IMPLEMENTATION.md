# MULTI-TENANT SUPER ADMIN SYSTEM - IMPLEMENTATION PLAN

## Current State Analysis

### ✅ Already Implemented (Excellent Foundation)
1. **Organization Model** - Complete multi-tenant schema
2. **OrganizationId on All Models** - Proper data isolation structure
3. **User.organizationId** - Users belong to organizations
4. **JWT includes organizationId** - Auth payload has organization context
5. **SUPER_ADMIN role exists** - Current company Super Admin

### ❌ Missing Components
1. **PLATFORM_SUPER_ADMIN role** - System-level admin for managing multiple companies
2. **Organization/Company Management APIs** - Create, edit, activate/deactivate companies
3. **Consistent Organization Filtering** - Not all services enforce organizationId
4. **IDOR Protection** - Some endpoints trust IDs without verifying ownership
5. **Company Super Admin Creation Flow** - No API to create company-specific Super Admins

## Architecture Design

```
PLATFORM (SaaS Owner)
├── PLATFORM_SUPER_ADMIN (System Level)
│   ├── Can create/manage organizations
│   ├── Can create company Super Admins
│   ├── Can view all companies
│   └── Has NO access to company data directly
│
├── Company A (organizationId: ORG-A)
│   ├── SUPER_ADMIN (Company Level)
│   ├── HR_ADMIN/HR_USER
│   ├── EMPLOYEES
│   ├── All company data (isolated)
│   └── Cannot access Company B
│
└── Company B (organizationId: ORG-B)
    ├── SUPER_ADMIN (Company Level)
    ├── HR_ADMIN/HR_USER
    ├── EMPLOYEES
    ├── All company data (isolated)
    └── Cannot access Company A
```

## Implementation Steps

### 1. Schema Changes

#### Add PLATFORM_SUPER_ADMIN Role
```sql
-- Create platform super admin role
INSERT INTO Role (id, name, displayName, description, level, isSystem, isActive)
VALUES (uuid(), 'PLATFORM_SUPER_ADMIN', 'Platform Super Admin', 
        'System-level administrator who can manage multiple companies', 
        200, true, true);
```

#### No Schema Migration Needed
- Organization model already exists
- All models already have organizationId
- User already has organizationId

### 2. Role Hierarchy
```
PLATFORM_SUPER_ADMIN (level 200) - Platform owner
    ↓
SUPER_ADMIN (level 100) - Company owner
    ↓
HR_ADMIN (level 80) - HR administrator
    ↓
HR_USER (level 60) - HR operations
    ↓
EMPLOYEE (level 0) - Standard user
```

### 3. Security Rules

#### Rule 1: Organization Context Resolution
```typescript
// CORRECT
const organizationId = req.user.organizationId; // From JWT
query.where = { ...query.where, organizationId };

// WRONG - Never trust frontend
const organizationId = req.body.organizationId; // ❌ Insecure
```

#### Rule 2: IDOR Protection Pattern
```typescript
// Before (Vulnerable)
const employee = await prisma.employee.findUnique({
  where: { id: employeeId }
});

// After (Secure)
const employee = await prisma.employee.findFirst({
  where: { 
    id: employeeId,
    organizationId: req.user.organizationId 
  }
});
```

#### Rule 3: Nested Resource Protection
```typescript
// When accessing payroll via employee relationship
const payroll = await prisma.payrollRun.findFirst({
  where: { 
    id: payrollId,
    employee: {
      organizationId: req.user.organizationId
    }
  }
});
```

### 4. API Endpoints to Create

#### Platform Super Admin - Organization Management
```
POST   /platform/organizations          - Create company
GET    /platform/organizations          - List all companies
GET    /platform/organizations/:id      - Get company details
PATCH  /platform/organizations/:id      - Update company
DELETE /platform/organizations/:id      - Deactivate company
POST   /platform/organizations/:id/admin - Create company Super Admin
```

#### Company Super Admin - Company-Scoped Access
```
All existing /super-admin/* endpoints automatically scoped by organizationId
```

### 5. Services to Secure

#### High Priority (Direct Data Access)
- [x] EmployeesService - Already has organizationId filtering
- [ ] SuperAdminService - Needs organization filtering audit
- [ ] PayrollService - Needs organizationId verification
- [ ] AttendanceService - Needs organizationId verification
- [ ] ComplaintsService - Needs organizationId verification
- [ ] DocumentsService - Needs organizationId verification

#### Medium Priority (Nested Access)
- [ ] HRActionService
- [ ] PolicyService
- [ ] NotificationService

### 6. Guards Enhancement

#### OrganizationGuard (New)
```typescript
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Platform Super Admin can access across organizations
    if (user.role === 'PLATFORM_SUPER_ADMIN') {
      return true;
    }
    
    // All others must have organizationId
    if (!user.organizationId) {
      throw new ForbiddenException('No organization context');
    }
    
    return true;
  }
}
```

### 7. Testing Strategy

#### Security Tests
```typescript
describe('Multi-Tenant Security', () => {
  it('Company A Super Admin cannot access Company B employees');
  it('Company A Super Admin cannot access Company B payroll');
  it('Company A Super Admin cannot access Company B attendance');
  it('Company A HR cannot create employees in Company B');
  it('Direct ID manipulation returns 403/404');
  it('Organization filter bypassed via URL returns 403');
  it('Platform Super Admin can view all companies');
  it('Platform Super Admin cannot access company data directly');
});
```

### 8. Migration Plan

#### Phase 1: Add Platform Super Admin Role
- Create PLATFORM_SUPER_ADMIN role
- Create platform endpoints module
- Add organization management APIs

#### Phase 2: Audit Existing Services
- Review all services for organizationId filtering
- Add missing organizationId checks
- Implement IDOR protection

#### Phase 3: Update Controllers
- Add OrganizationGuard where needed
- Verify all endpoints enforce organization context
- Update Swagger documentation

#### Phase 4: Frontend Updates
- Add Platform Super Admin dashboard
- Add organization management UI
- Update existing dashboards to show organization context

### 9. Backward Compatibility

#### Existing Data Preservation
- All existing data already has organizationId
- No migration needed
- Existing Super Admin users remain functional
- Their role = SUPER_ADMIN (company level)

#### Default Organization
- Existing data belongs to default organization
- Code: 'ORG-DEFAULT'
- Existing users continue working normally

### 10. File Changes Required

#### New Files
1. `backend/src/modules/platform/platform.module.ts`
2. `backend/src/modules/platform/platform.controller.ts`
3. `backend/src/modules/platform/platform.service.ts`
4. `backend/src/modules/platform/dto/create-organization.dto.ts`
5. `backend/src/common/guards/organization.guard.ts`

#### Modified Files
1. `backend/src/modules/auth/auth.service.ts` - Add role check
2. `backend/src/modules/super-admin/super-admin.service.ts` - Add organizationId filtering
3. `backend/src/modules/employees/employees.service.ts` - Verify IDOR protection
4. `backend/src/modules/payroll/services/*.ts` - Add organizationId verification
5. `backend/src/modules/attendance/services/*.ts` - Add organizationId verification
6. `backend/src/modules/complaints/complaints.service.ts` - Add organizationId verification

### 11. Environment Variables

No new environment variables needed. Everything uses existing database structure.

### 12. Rollback Plan

If issues arise:
1. Platform APIs are additive (safe to disable)
2. Existing services continue working
3. organizationId filtering is defensive (won't break existing)
4. Can revert individual service changes independently

### 13. Success Criteria

#### Security
- [ ] Company A cannot access Company B data
- [ ] IDOR attempts return 403/404
- [ ] Platform Super Admin can manage companies
- [ ] Platform Super Admin cannot access company data

#### Functionality
- [ ] Platform Super Admin can create companies
- [ ] Platform Super Admin can create company Super Admins
- [ ] Company Super Admins have full access to their company
- [ ] Existing functionality continues working
- [ ] No data loss or corruption

#### Performance
- [ ] Organization filtering adds minimal overhead
- [ ] No N+1 query problems
- [ ] Existing queries maintain performance

## Implementation Priority

### Phase 1 (Critical - Security)
1. Create PLATFORM_SUPER_ADMIN role
2. Audit and secure all Super Admin APIs
3. Add organizationId filtering to all services
4. Implement IDOR protection

### Phase 2 (Important - Features)
1. Create Platform module and APIs
2. Organization management endpoints
3. Company Super Admin creation flow

### Phase 3 (Nice to Have - UI)
1. Platform Super Admin dashboard
2. Organization management UI
3. Company switcher (platform only)

## Security Checklist

- [ ] PLATFORM_SUPER_ADMIN role created
- [ ] OrganizationGuard implemented
- [ ] All services filter by organizationId
- [ ] No findUnique without organizationId check
- [ ] No direct ID trust from frontend
- [ ] JWT organizationId verified against user record
- [ ] Nested resources protected
- [ ] Documents verify organization ownership
- [ ] Payroll verifies organization ownership
- [ ] Attendance verifies organization ownership
- [ ] HR Actions verify organization ownership
- [ ] Complaints verify organization ownership
- [ ] Notifications respect organization boundaries
- [ ] Socket.IO respects organization boundaries
- [ ] Audit logs respect organization boundaries

## Notes

- This implementation uses EXISTING schema
- NO database migrations required
- NO existing data affected
- Changes are ADDITIVE and DEFENSIVE
- Backward compatible with current system
- Can be deployed incrementally
