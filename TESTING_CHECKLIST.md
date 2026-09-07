# HRMS SECURITY TESTING CHECKLIST
**Generated:** September 7, 2026  
**Purpose:** Manual validation of security fixes and multi-tenant isolation

---

## 🔴 CRITICAL - DESIGNATIONS MODULE TESTING (MUST COMPLETE BEFORE DEPLOYMENT)

### Test Case 1: Cross-Tenant Access Prevention
**Priority:** CRITICAL

**Setup:**
1. Create/identify Company A (Organization 1)
2. Create/identify Company B (Organization 2)
3. Create designation "Manager" in Company A
4. Note the designation ID from Company A

**Test Steps:**
```
1. Login as Company A user (HR/Super Admin)
   POST /api/auth/login
   { "email": "companyA@example.com", "password": "..." }
   
2. List designations (should only show Company A)
   GET /api/designations
   Authorization: Bearer {token_company_a}
   Expected: ✅ Only Company A designations returned
   
3. Get specific Company A designation
   GET /api/designations/{company_a_designation_id}
   Authorization: Bearer {token_company_a}
   Expected: ✅ Designation details returned

4. Logout and login as Company B user
   POST /api/auth/login
   { "email": "companyB@example.com", "password": "..." }

5. **CRITICAL TEST:** Try to access Company A designation
   GET /api/designations/{company_a_designation_id}
   Authorization: Bearer {token_company_b}
   Expected: ❌ 404 Not Found (NOT 403)
   
6. **CRITICAL TEST:** Try to update Company A designation
   PUT /api/designations/{company_a_designation_id}
   Authorization: Bearer {token_company_b}
   Body: { "name": "Hacked Designation" }
   Expected: ❌ 404 Not Found
   
7. **CRITICAL TEST:** Try to delete Company A designation
   DELETE /api/designations/{company_a_designation_id}
   Authorization: Bearer {token_company_b}
   Expected: ❌ 404 Not Found
```

**Pass Criteria:**
- ✅ Company B user CANNOT see Company A designations in list
- ✅ Company B user gets 404 when accessing Company A designation by ID
- ✅ Company B user CANNOT update Company A designation
- ✅ Company B user CANNOT delete Company A designation
- ✅ No error logs or stack traces exposed to user

---

## ⚠️ HIGH PRIORITY - MULTI-TENANT ISOLATION TESTING

### Test Case 2: Employee Data Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A HR Admin
2. Get list of employees
   GET /api/employees
   Expected: ✅ Only Company A employees
   
3. Note an employee ID from Company A
4. Login as Company B HR Admin
5. Try to access Company A employee by ID
   GET /api/employees/{company_a_employee_id}
   Expected: ❌ 403 Forbidden or 404 Not Found
   
6. Try to update Company A employee
   PUT /api/employees/{company_a_employee_id}
   Expected: ❌ 403 Forbidden
```

---

### Test Case 3: Process/Department Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A HR Admin
2. Get list of processes
   GET /api/departments
   Expected: ✅ Only Company A processes
   
3. Note a process ID from Company A
4. Login as Company B HR Admin
5. Try to access Company A process by ID
   GET /api/departments/{company_a_process_id}
   Expected: ❌ 403 Forbidden or 404 Not Found
   
6. Try to assign Company B employee to Company A process
   POST /api/departments/{company_a_process_id}/employees
   Body: { "employeeIds": ["{company_b_employee_id}"] }
   Expected: ❌ 403 Forbidden
```

---

### Test Case 4: Attendance Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A employee
2. Check-in
   POST /api/attendance/check-in
   Expected: ✅ Success
   
3. Note attendance ID from response
4. Login as Company B employee
5. Try to view Company A employee attendance
   GET /api/attendance/my-attendance?employeeId={company_a_employee_id}
   Expected: ❌ Only own attendance visible (no Company A data)
```

---

### Test Case 5: Payroll Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A HR Admin
2. Generate payroll for Company A employees
   POST /api/payroll/generate
   Body: { "month": 9, "year": 2026 }
   Expected: ✅ Success
   
3. Login as Company B HR Admin
4. View payroll history
   GET /api/payroll/history
   Expected: ✅ Only Company B payroll visible
   
5. Try to access Company A payroll run
   GET /api/payroll/{company_a_payroll_run_id}
   Expected: ❌ 404 Not Found or 403 Forbidden
```

---

### Test Case 6: Complaints Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A employee
2. Create complaint
   POST /api/complaints
   Body: { "title": "Test Complaint", "description": "...", "category": "HR_ISSUE" }
   Expected: ✅ Success
   
3. Note complaint ID
4. Login as Company B HR Admin
5. Try to view Company A complaints
   GET /api/complaints/hr-queue
   Expected: ✅ Only Company B complaints visible
   
6. Try to access Company A complaint directly
   GET /api/complaints/{company_a_complaint_id}
   Expected: ❌ 404 Not Found or 403 Forbidden
```

---

### Test Case 7: HR Actions Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A HR Admin
2. Create HR action for Company A employee
   POST /api/hr-actions
   Body: { "employeeId": "{company_a_employee_id}", "actionType": "WARNING", ... }
   Expected: ✅ Success
   
3. Note HR action ID
4. Login as Company B HR Admin
5. Try to view HR actions
   GET /api/hr-actions
   Expected: ✅ Only Company B HR actions visible
   
6. Try to access Company A HR action directly
   GET /api/hr-actions/{company_a_hr_action_id}
   Expected: ❌ 404 Not Found or 403 Forbidden
```

---

### Test Case 8: Documents Isolation
**Priority:** HIGH

**Test Steps:**
```
1. Login as Company A employee
2. Upload document
   POST /api/documents/upload
   Expected: ✅ Success
   
3. Note document ID
4. Login as Company B HR Admin
5. Try to access document queue
   GET /api/documents/queue
   Expected: ✅ Only Company B documents visible
   
6. Try to access Company A document directly
   GET /api/documents/{company_a_document_id}
   Expected: ❌ 404 Not Found or 403 Forbidden
   
7. Try to download Company A document file
   GET /api/documents/{company_a_document_id}/download
   Expected: ❌ 404 Not Found or 403 Forbidden
```

---

## 🔵 MEDIUM PRIORITY - ROLE-BASED ACCESS CONTROL

### Test Case 9: Super Admin vs HR Admin Access
**Priority:** MEDIUM

**Test Steps:**
```
1. Login as SUPER_ADMIN
2. Try to access /super-admin routes
   GET /api/super-admin/dashboard/stats
   Expected: ✅ Success
   
3. Logout and login as HR_ADMIN
4. Try to access Super Admin routes
   GET /api/super-admin/dashboard/stats
   Expected: ❌ 403 Forbidden (backend) or redirect to /hr (frontend)
   
5. Try to access HR routes
   GET /api/employees
   Expected: ✅ Success
```

---

### Test Case 10: HR_USER vs HR_ADMIN Ownership
**Priority:** MEDIUM

**Test Steps:**
```
1. Login as HR_USER (user who created some employees)
2. List employees
   GET /api/employees
   Expected: ✅ Only employees created by this HR_USER
   
3. Login as HR_ADMIN
4. List employees
   GET /api/employees
   Expected: ✅ ALL employees in organization
   
5. Login back as HR_USER
6. Try to access employee created by different HR
   GET /api/employees/{other_hr_employee_id}
   Expected: ❌ 403 Forbidden
```

---

### Test Case 11: Employee Self-Access Restrictions
**Priority:** MEDIUM

**Test Steps:**
```
1. Login as Employee A
2. View own profile
   GET /api/employees/profile
   Expected: ✅ Success
   
3. View own attendance
   GET /api/attendance/my-attendance
   Expected: ✅ Success
   
4. Try to access another employee's profile
   GET /api/employees/{employee_b_id}
   Expected: ❌ 403 Forbidden
   
5. Try to access HR routes
   GET /api/employees (list all)
   Expected: ❌ 403 Forbidden or 404
   
6. Try to access Super Admin routes
   GET /api/super-admin/dashboard/stats
   Expected: ❌ 403 Forbidden or redirect
```

---

## 🟢 LOW PRIORITY - FUNCTIONAL TESTING

### Test Case 12: Super Admin Create New Company
**Priority:** LOW

**Test Steps:**
```
1. Login as existing SUPER_ADMIN of Company A
2. Create new Super Admin for Company B
   POST /api/super-admin/admins
   Body: {
     "email": "newcompany@example.com",
     "password": "SecurePass123",
     "firstName": "Company",
     "lastName": "B Admin",
     "role": "SUPER_ADMIN",
     "createNewOrganization": true,
     "companyName": "Company B Corp"
   }
   Expected: ✅ Success + new organization created
   
3. Logout and login as new Company B Super Admin
4. List employees
   GET /api/employees
   Expected: ✅ Empty list (new company)
   
5. List designations
   GET /api/designations
   Expected: ✅ Empty or default designations only
   
6. Try to access Company A data
   GET /api/employees?organizationId={company_a_org_id}
   Expected: ❌ Query param ignored, only Company B data shown
```

---

### Test Case 13: Attendance Business Rules
**Priority:** LOW

**Test Steps:**
```
1. Login as employee
2. Check if today is Monday
   - If yes, try to check-in
     POST /api/attendance/check-in
     Expected: ❌ 400 Bad Request "Today is a weekly off"
     
3. If not Monday, check-in at 10:15 AM IST
   POST /api/attendance/check-in
   Expected: ✅ Success, status = LATE
   
4. Check-out at 6:30 PM IST
   POST /api/attendance/check-out
   Expected: ✅ Success, status changed to HALF_DAY
   
5. Check-out at 7:05 PM IST (different day)
   POST /api/attendance/check-out
   Expected: ✅ Success, status remains LATE (not HALF_DAY)
```

---

### Test Case 14: Payroll Calculation from Real Data
**Priority:** LOW

**Test Steps:**
```
1. Login as HR Admin
2. Verify employee has salary structure
   GET /api/payroll/salary-structures
   
3. Check employee attendance for current month
   GET /api/attendance/monthly?employeeId={id}&month=9&year=2026
   
4. Generate payroll
   POST /api/payroll/generate
   Body: { "month": 9, "year": 2026 }
   Expected: ✅ Payroll calculated from:
   - Basic salary from SalaryStructure
   - Present days from Attendance records
   - NOT hardcoded values
   
5. Verify payroll details
   GET /api/payroll/history
   Expected: ✅ Correct calculation visible
```

---

## 🔧 TECHNICAL VALIDATION

### Test Case 15: Database Constraints
**Priority:** MEDIUM

**Test Steps:**
```
1. Attempt to create duplicate attendance for same date
   POST /api/attendance/check-in
   (twice for same employee, same date)
   Expected: ❌ Unique constraint violation or application logic prevents it
   
2. Attempt to create employee without organizationId
   (Direct database INSERT - not API)
   Expected: ❌ Database constraint violation
   
3. Attempt to delete organization with employees
   (Direct database DELETE - not API)
   Expected: ❌ Cascade or FK constraint protects data
```

---

### Test Case 16: JWT Token Validation
**Priority:** MEDIUM

**Test Steps:**
```
1. Login and get valid token
2. Decode JWT and verify payload contains:
   - sub (user ID)
   - email
   - role
   - organizationId ✅ CRITICAL
   
3. Attempt to use expired token
   Expected: ❌ 401 Unauthorized
   
4. Attempt to use tampered token (modified organizationId)
   Expected: ❌ 401 Unauthorized (signature invalid)
   
5. Attempt to use token from inactive user
   Expected: ❌ 401 Unauthorized
```

---

## 📋 TESTING SUMMARY TEMPLATE

```
Test Run Date: _____________
Tested By: _____________
Environment: [ ] Staging [ ] Production

CRITICAL TESTS (Must Pass):
[ ] Test Case 1: Cross-Tenant Access Prevention - DESIGNATIONS
[ ] Test Case 2: Employee Data Isolation
[ ] Test Case 3: Process/Department Isolation
[ ] Test Case 4: Attendance Isolation
[ ] Test Case 5: Payroll Isolation
[ ] Test Case 6: Complaints Isolation
[ ] Test Case 7: HR Actions Isolation
[ ] Test Case 8: Documents Isolation

HIGH PRIORITY TESTS:
[ ] Test Case 9: Super Admin vs HR Admin Access
[ ] Test Case 10: HR_USER vs HR_ADMIN Ownership
[ ] Test Case 11: Employee Self-Access Restrictions

MEDIUM PRIORITY TESTS:
[ ] Test Case 12: Super Admin Create New Company
[ ] Test Case 13: Attendance Business Rules
[ ] Test Case 15: Database Constraints
[ ] Test Case 16: JWT Token Validation

LOW PRIORITY TESTS:
[ ] Test Case 14: Payroll Calculation from Real Data

Overall Result: [ ] PASS [ ] FAIL
Notes: _____________________________________________
______________________________________________________

Sign-off: _______________ Date: _______________
```

---

## 🚨 FAILURE RESPONSE PROTOCOL

**IF ANY CRITICAL TEST FAILS:**
1. ❌ **DO NOT DEPLOY TO PRODUCTION**
2. 🔴 Document exact failure scenario
3. 🔧 Roll back to previous stable version
4. 🔍 Investigate root cause
5. ✅ Apply fix
6. 🔄 Re-run ALL tests
7. ✅ Get approval from Security Team

**IF MEDIUM/LOW TEST FAILS:**
1. ⚠️ Document failure
2. 📊 Assess risk level
3. 🤝 Discuss with Product Owner
4. 🎯 Decide: Fix before deploy vs. add to backlog
5. 📝 Update known issues list

---

## 📞 ESCALATION CONTACTS

**Security Issues:**
- Security Team Lead: ____________
- Email: security@company.com

**Technical Issues:**
- Backend Lead: ____________
- DevOps Lead: ____________

**Approval Required:**
- QA Manager: ____________
- Product Owner: ____________

---

**Document Version:** 1.0  
**Last Updated:** September 7, 2026  
**Classification:** INTERNAL - TESTING PROCEDURES
