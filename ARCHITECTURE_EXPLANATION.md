# 🏗️ HRMS ARCHITECTURE - ROLE VS DESIGNATION

## 📊 CORRECT ARCHITECTURE (AFTER FIX)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                ┌──────────────────────┐
│    ROLE TABLE        │                │  DESIGNATION TABLE   │
│  (Authentication)    │                │   (Job Titles)       │
├──────────────────────┤                ├──────────────────────┤
│ • SUPER_ADMIN        │                │ • Agent              │
│ • HR_ADMIN           │                │ • Manager            │
│ • HR_USER            │                │ • Developer          │
│ • EMPLOYEE           │                │ • Team Leader        │
│                      │                │ • Senior Developer   │
│ Used for:            │                │ • IT Engineer        │
│ - Access Control     │                │ - HR Executive       │
│ - Permissions        │                │ • Accountant         │
│ - Authentication     │                │ • Sales Executive    │
│                      │                │                      │
│ ✅ System-wide       │                │ ✅ Organization-     │
│    Fixed list        │                │    specific          │
└──────────────────────┘                └──────────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌──────────────────────┐                ┌──────────────────────┐
│    USER TABLE        │                │  EMPLOYEE TABLE      │
├──────────────────────┤                ├──────────────────────┤
│ • email              │                │ • employeeId         │
│ • password           │                │ • firstName          │
│ • roleId ──────────► │                │ • lastName           │
│ • organizationId     │                │ • userId             │
│                      │                │ • designationId ────►│
└──────────────────────┘                └──────────────────────┘

         ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EMPLOYEE RECORD EXAMPLE                        │
├─────────────────────────────────────────────────────────────────┤
│  Name: Rahul Sharma                                             │
│  Email: rahul@fcs.com                                           │
│                                                                 │
│  User.role:        EMPLOYEE       ← Authentication/Access       │
│  Employee.designation: Developer  ← Job Title/Position          │
│                                                                 │
│  Access Rights (from Role):                                     │
│    ✅ Can access: /employee dashboard                           │
│    ❌ Cannot access: /super-admin, /hr, /platform-admin         │
│                                                                 │
│  Job Info (from Designation):                                   │
│    - Reports to: Team Leader                                    │
│    - Department: IT                                             │
│    - Job Title: Developer                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ❌ WRONG ARCHITECTURE (BEFORE FIX)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEM: ROLE CONFUSION                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                ┌──────────────────────┐
│    ROLE TABLE        │                │  DESIGNATION TABLE   │
│  (Authentication)    │                │   (Job Titles)       │
├──────────────────────┤                ├──────────────────────┤
│ • SUPER_ADMIN        │    ❌ LEAK     │ • Super Admin   ⚠️   │
│ • HR_ADMIN           │    ────────►   │ • Agent              │
│ • HR_USER            │                │ • Manager            │
│ • EMPLOYEE           │                │ • Developer          │
└──────────────────────┘                └──────────────────────┘
                                                 │
                                                 │
                                                 ▼
                                        ┌─────────────────────┐
                                        │  EMPLOYEE CREATION  │
                                        │  DROPDOWN           │
                                        ├─────────────────────┤
                                        │ ⚠️  Super Admin     │← WRONG!
                                        │ ✅ Agent            │
                                        │ ✅ Manager          │
                                        │ ✅ Developer        │
                                        └─────────────────────┘
```

---

## 🔧 THE FIX

### Problem Location
**File:** `backend/setup-initial-organization.ts` (Line 178-195)

**Before:**
```typescript
// ❌ WRONG - Creating system role as designation
await prisma.designation.create({
  data: {
    organizationId: defaultOrg.id,
    name: 'Super Admin',  // ❌ This is a ROLE, not a job title!
  },
});
```

**After:**
```typescript
// ✅ CORRECT - Creating proper employee designations
const employeeDesignations = [
  { name: 'Manager', description: 'Department Manager' },
  { name: 'Team Leader', description: 'Team Leader' },
  { name: 'Senior Executive', description: 'Senior Executive' },
  { name: 'Executive', description: 'Executive' },
];
```

### Backend Filter Added
**File:** `backend/src/modules/designations/designations.service.ts`

```typescript
async findAll(requestUserId: string) {
  // ✅ System roles that should NEVER be designations
  const systemRoleNames = [
    'SUPER_ADMIN', 'Super Admin',
    'HR_ADMIN', 'HR Admin',
    'HR_USER', 'HR User',
    'EMPLOYEE', 'Employee',
    'ADMIN', 'Admin',
  ];

  return this.prisma.designation.findMany({
    where: {
      organizationId: requestingUser.organizationId,
      name: {
        notIn: systemRoleNames,  // ✅ Block system roles
      },
    },
  });
}
```

---

## 🎯 EMPLOYEE CREATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    HR CREATES NEW EMPLOYEE                      │
└─────────────────────────────────────────────────────────────────┘

Step 1: HR fills form
┌───────────────────────────────┐
│ Name: Rahul Sharma            │
│ Email: rahul@fcs.com          │
│ Process: IT                   │
│ Designation: [Dropdown ▼]     │← HR selects from dropdown
│   • Agent                     │
│   • Manager                   │
│   • Developer        ✓        │← Selected
│   • Team Leader               │
│ Salary: ₹25,000               │
└───────────────────────────────┘

Step 2: Backend processes
┌───────────────────────────────┐
│ CREATE USER:                  │
│   roleId: <EMPLOYEE_ROLE_ID>  │← Automatic
│   email: rahul@fcs.com        │
│                               │
│ CREATE EMPLOYEE:              │
│   designationId: <DEVELOPER>  │← From dropdown
│   departmentId: <IT>          │
│   monthlySalary: 25000        │
└───────────────────────────────┘

Step 3: Result
┌───────────────────────────────┐
│ User Created:                 │
│   • Role: EMPLOYEE            │← For access control
│   • Email: rahul@fcs.com      │
│   • Password: 1234 (temp)     │
│                               │
│ Employee Profile Created:     │
│   • Designation: Developer    │← Job title
│   • Department: IT            │
│   • Salary: ₹25,000           │
└───────────────────────────────┘

Step 4: Access Rights
┌───────────────────────────────┐
│ Rahul can:                    │
│   ✅ Login to system          │
│   ✅ Access /employee panel   │
│   ✅ View own profile         │
│   ✅ Submit complaints        │
│                               │
│ Rahul CANNOT:                 │
│   ❌ Access /super-admin      │
│   ❌ Access /hr panel         │
│   ❌ Manage other employees   │
│   ❌ View salary reports      │
└───────────────────────────────┘
```

---

## 🔐 SECURITY IMPLICATIONS

### Role-Based Access Control (RBAC)
```
SUPER_ADMIN Role:
  ✅ Access: All panels (/super-admin, /hr, /employee)
  ✅ Can: Manage organization, create HR users, configure system
  ❌ Created through: Employee form? NO! Only admin flows.

HR_ADMIN Role:
  ✅ Access: HR panel (/hr), Employee panel
  ✅ Can: Manage employees, approve documents, handle complaints
  ❌ Access: Super Admin panel

EMPLOYEE Role:
  ✅ Access: Employee panel (/employee)
  ✅ Can: View own profile, submit complaints, view policies
  ❌ Access: HR panel, Super Admin panel
```

### Multi-Tenant Isolation
```
Organization A:
  Users: HR_A, Employee_A1, Employee_A2
  Designations: Agent, Manager, Developer
  
Organization B:
  Users: HR_B, Employee_B1, Employee_B2
  Designations: Executive, Analyst, Engineer

Rules:
  ❌ HR_A cannot see Organization B's designations
  ❌ Employee_A cannot see Organization B's data
  ✅ Complete data isolation
```

---

## 📊 DATA FLOW DIAGRAM

```
Frontend                   Backend                    Database
────────                   ────────                   ─────────

[Create Employee Form]
        │
        │ GET /designations
        ├──────────────────► [DesignationsController]
        │                            │
        │                            │ getUserOrg()
        │                            │ filterSystemRoles()
        │                            ├──────────────► [Designation Table]
        │                            │                      │
        │                            │ ◄────────────────────┤
        │                            │ WHERE org = userOrg
        │                            │ AND name NOT IN [system_roles]
        │                            │
        │ ◄──────────────────────────┤
        │ [Agent, Manager, Developer]
        │
[User selects "Developer"]
        │
        │ POST /employees
        │ { designation: "Developer" }
        ├──────────────────► [EmployeesController]
        │                            │
        │                            │ getEmployeeRole()
        │                            ├──────────────► [Role Table]
        │                            │ ◄──────────────┤ EMPLOYEE role
        │                            │
        │                            │ createUser(roleId: EMPLOYEE)
        │                            ├──────────────► [User Table]
        │                            │ ◄──────────────┤ User created
        │                            │
        │                            │ createEmployee(designationId: Developer)
        │                            ├──────────────► [Employee Table]
        │                            │ ◄──────────────┤ Employee created
        │                            │
        │ ◄──────────────────────────┤
        │ { success: true, employee }
        │
[Employee Created ✅]
```

---

## ✅ VALIDATION CHECKLIST

### Database Level ✅
- [x] No system roles in Designation table
- [x] All system roles in Role table
- [x] Designations scoped to organizationId
- [x] Proper indexes for performance

### API Level ✅
- [x] GET /designations filters system roles
- [x] Organization isolation enforced
- [x] Returns only valid employee titles
- [x] Proper error handling

### Frontend Level ✅
- [x] Dropdown fetches from /designations
- [x] Displays only employee titles
- [x] No system roles visible
- [x] Proper loading states

### Security Level ✅
- [x] Cannot create SUPER_ADMIN via employee form
- [x] Role assignment automatic (EMPLOYEE)
- [x] Designation assignment user-selected
- [x] Organization boundaries enforced

### User Experience ✅
- [x] Clear designation names
- [x] No confusing system terms
- [x] Intuitive dropdown
- [x] Proper form validation

---

## 🎓 KEY CONCEPTS

### Role = What you CAN DO
- **Authentication & Authorization**
- Determines access rights
- System-wide, fixed list
- Examples: SUPER_ADMIN, HR_ADMIN, EMPLOYEE

### Designation = What you ARE
- **Job Title & Organizational Position**
- Describes job function
- Organization-specific, customizable
- Examples: Manager, Developer, Agent

### Why Separate?
1. **Security:** Access control stays centralized
2. **Flexibility:** Organizations create custom job titles
3. **Clarity:** No confusion between access and position
4. **Scalability:** Easy to add new designations without affecting security

---

## 🚀 PRODUCTION DEPLOYMENT

### Pre-Deployment Checklist
- [x] Backend code updated
- [x] Database cleaned
- [x] Proper designations seeded
- [x] Tests passing
- [x] Documentation complete

### Deployment Steps
1. Deploy backend code changes
2. Run cleanup script (one-time)
3. Run seed script (one-time)
4. Verify API responses
5. Test employee creation flow

### Post-Deployment Verification
1. Login as HR
2. Open employee creation form
3. Check designation dropdown
4. Confirm system roles NOT present
5. Create test employee
6. Verify correct role and designation

---

**Architecture Status:** ✅ CORRECT AND VERIFIED  
**Security Status:** ✅ ROLE/DESIGNATION SEPARATION ENFORCED  
**Production Ready:** ✅ YES
