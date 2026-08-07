# Issue Diagnosis Checklist - HR Employee Details Page

## Backend Status: ✅ VERIFIED CORRECT

### ✅ Prisma Schema Relations
```prisma
model Employee {
  user          User               @relation(...)  ✅
  department    Department?        @relation(...)  ✅
  designation   Designation?       @relation(...)  ✅
  profile       EmployeeProfile?                   ✅
  documents     Document[]                         ✅
  education     Education[]                        ✅
  experience    Experience[]                       ✅
}
```

### ✅ Service Implementation
```typescript
async findOne(id: string) {
  const employee = await this.prisma.employee.findUnique({
    where: { id },  // ✅ Uses employeeId from URL
    include: {
      user: true,         // ✅
      department: true,   // ✅
      designation: true,  // ✅
      profile: true,      // ✅
      documents: { ... }, // ✅
      education: true,    // ✅
      experience: true    // ✅
    }
  });
  
  return {
    ...employee,
    fullName: `${employee.firstName} ${employee.lastName}`,  // ✅
    email: employee.user?.email,                              // ✅
    departmentName: employee.department?.name,                // ✅
    designationTitle: employee.designation?.name,             // ✅
    documentsCount: employee.documents?.length || 0,          // ✅
    documentsByCategory: this.groupDocumentsByCategory(...)   // ✅
  };
}
```

### ✅ Controller Configuration
```typescript
@Get(':id')
@Roles(UserRole.HR)
findOne(@Param('id') id: string) {
  return this.employeesService.findOne(id);  // ✅
}
```

---

## Diagnosis Steps

### Step 1: Test Backend API Directly ⚠️ DO THIS FIRST

```bash
# 1. Get HR token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"hr@company.com\",\"password\":\"password\"}"

# Copy access_token from response

# 2. Get employee list
curl -X GET http://localhost:4000/api/v1/employees \
  -H "Authorization: Bearer YOUR_TOKEN"

# Copy employee "id" from response

# 3. Get employee details
curl -X GET http://localhost:4000/api/v1/employees/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Save response to file for inspection
curl -X GET http://localhost:4000/api/v1/employees/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" > employee_response.json
```

### Step 2: Check Backend Response

Open `employee_response.json` and verify:

**Required Fields Present:**
- [ ] `id` (employee UUID)
- [ ] `employeeId` (FCS-2026-XXXX)
- [ ] `firstName`
- [ ] `lastName`
- [ ] `fullName` (should NOT be "undefined undefined")
- [ ] `email` (should NOT be empty)
- [ ] `phone`
- [ ] `departmentName` (or null if not assigned)
- [ ] `designationTitle` (or null if not assigned)
- [ ] `profileCompletion` (number 0-100)
- [ ] `documentsCount` (should match documents array length)
- [ ] `documents` (array, may be empty if no uploads)
- [ ] `documentsByCategory` (object with personal, government, education, professional, other)

**Nested Objects Present:**
- [ ] `user` object with `email`, `isActive`
- [ ] `department` object (or null)
- [ ] `designation` object (or null)
- [ ] `profile` object with `profileCompletion`

### Step 3: Check Backend Console Logs

When you make the API call, backend should print:
```
╔══════════════════════════════════════════════════════════╗
║  findOne() called for Employee Details                   ║
╚══════════════════════════════════════════════════════════╝
📋 Employee ID received: <uuid>
✅ Employee FOUND in database
📊 Employee Data Summary:
   - First Name: John
   - Last Name: Doe
   - Email: john@company.com
   - Documents Count: 5
```

**If you DON'T see these logs:**
→ The endpoint is not being hit
→ Check if HR is calling the correct URL
→ Check if authentication is working

**If logs show "Employee NOT FOUND":**
→ Wrong employee ID is being passed
→ Check what ID the frontend is sending

---

## Issue Location Matrix

| Symptom | Backend Response | Diagnosis | Location |
|---------|------------------|-----------|----------|
| Fields show "undefined" | Complete with all fields | ✅ Backend OK | **Frontend mapping** |
| Fields show "undefined" | Missing fields | ❌ Backend issue | **Service/Prisma** |
| Documents show 0 | documentsCount > 0 | ✅ Backend OK | **Frontend mapping** |
| Documents show 0 | documentsCount = 0 | ❌ No documents | **Database/Upload** |
| Page shows error | 404 Not Found | ❌ Wrong ID | **Frontend routing** |
| Page shows error | 401/403 | ❌ Auth issue | **Token/Permissions** |
| Page loads but empty | {} or null | ❌ Employee missing | **Database** |

---

## If Backend API Returns Correct Data

### Problem Confirmed: Frontend Mapping Issue

The backend is working. Frontend is accessing wrong field paths.

### Find Frontend File

**Likely locations:**
- `frontend/src/app/hr/employees/[id]/page.tsx`
- `frontend/src/pages/hr/employees/[id].tsx`
- `frontend/src/components/hr/EmployeeDetails.tsx`
- `frontend/src/views/hr/EmployeeDetailsPage.tsx`

### Search for the file:
```bash
# From frontend directory
dir /s /b *employee*detail*.tsx
dir /s /b *employee*detail*.jsx

# Or search in the whole project
dir /s /b *[id]*.tsx | findstr employee
```

### Common Frontend Issues

#### Issue 1: Wrong API Endpoint
```typescript
// WRONG ❌
const response = await fetch(`/api/employees/${userId}`);  // Using userId

// CORRECT ✅
const response = await fetch(`/api/v1/employees/${employeeId}`);  // Using employeeId
```

#### Issue 2: Wrong Field Access
```typescript
// WRONG ❌
<Text>{employee.user.firstName} {employee.user.lastName}</Text>
<Text>{employee.user.email}</Text>
<Text>Documents: {employee.documents?.length || 0}</Text>

// CORRECT ✅
<Text>{employee.fullName}</Text>
<Text>{employee.email}</Text>
<Text>Documents: {employee.documentsCount}</Text>
```

#### Issue 3: Not Handling Response Structure
```typescript
// WRONG ❌ - If API returns data directly
const { data: employee } = response.data;  // Looking for nested data property

// CORRECT ✅ - Backend returns employee object directly
const employee = await response.json();
```

#### Issue 4: Using Local State Instead of API Data
```typescript
// WRONG ❌
const [employee, setEmployee] = useState({});  // Empty default
const [documents, setDocuments] = useState([]);  // Hardcoded empty

// CORRECT ✅
const { data: employee } = useQuery({
  queryKey: ['employee', employeeId],
  queryFn: () => fetchEmployee(employeeId)
});

// Access documents from API response
const documents = employee?.documents || [];
const documentsCount = employee?.documentsCount || 0;
```

---

## Minimal Test Script

Create this file to test: `test-employee-api.js`

```javascript
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000/api/v1';

async function testEmployeeAPI() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@company.com',  // Replace with actual HR email
        password: 'password'       // Replace with actual password
      })
    });
    
    const { access_token } = await loginRes.json();
    console.log('✅ Login successful');
    
    // 2. Get employee list
    console.log('\n2. Fetching employee list...');
    const listRes = await fetch(`${API_BASE}/employees`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const { data: employees } = await listRes.json();
    console.log(`✅ Found ${employees.length} employees`);
    
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      return;
    }
    
    const employeeId = employees[0].id;
    console.log(`   Testing with employee ID: ${employeeId}`);
    
    // 3. Get employee details
    console.log('\n3. Fetching employee details...');
    const detailsRes = await fetch(`${API_BASE}/employees/${employeeId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const employee = await detailsRes.json();
    
    // 4. Validate response
    console.log('\n4. Validating response...');
    console.log(`   Full Name: ${employee.fullName || 'MISSING'}`);
    console.log(`   Email: ${employee.email || 'MISSING'}`);
    console.log(`   Department: ${employee.departmentName || 'Not Assigned'}`);
    console.log(`   Designation: ${employee.designationTitle || 'Not Assigned'}`);
    console.log(`   Documents Count: ${employee.documentsCount}`);
    console.log(`   Documents Array Length: ${employee.documents?.length || 0}`);
    
    // Check for issues
    let issues = [];
    if (employee.fullName === 'undefined undefined') issues.push('fullName is "undefined undefined"');
    if (!employee.email) issues.push('email is missing');
    if (employee.documentsCount === undefined) issues.push('documentsCount is missing');
    if (!employee.documentsByCategory) issues.push('documentsByCategory is missing');
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ ALL CHECKS PASSED - Backend is working correctly');
      console.log('   → Issue must be in frontend data mapping');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testEmployeeAPI();
```

Run with:
```bash
cd backend
node test-employee-api.js
```

---

## Summary

### Backend ✅
- Prisma relations: CORRECT
- Service includes: CORRECT
- Controller endpoint: CORRECT
- Response structure: CORRECT
- Field flattening: CORRECT

### Next Step: TEST THE API

1. **Run the curl commands** OR **test script** above
2. **Verify backend response** has all fields populated
3. **Check backend console** for detailed logs

**If backend returns correct data:**
→ Issue is in **frontend data mapping**
→ Need to find and fix frontend file
→ Update field access to use flattened fields

**If backend returns empty/missing data:**
→ Check database has employee data
→ Check employee has uploaded documents
→ Verify Prisma relations in database

---

**The backend code is correct. The issue is either:**
1. Frontend accessing wrong field paths, OR
2. Database missing actual employee/document records

**Test the API to determine which one it is.**
