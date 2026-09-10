# Employee Create/Edit Testing Guide

## Prerequisites
- Backend server running on http://localhost:4000
- Frontend server running on http://localhost:3000
- MySQL database `fcs_hrms` accessible
- At least one HR user account configured
- At least one SUPER_ADMIN user account configured

## Test Scenario 1: HR Create Employee (400 Fix)

### Setup
1. Login as HR user
2. Navigate to: HR Panel → Employee Management
3. Click "Add Employee" button

### Test Case 1.1: Create Employee WITHOUT Salary (Main Fix)
**Steps:**
1. Fill in the form:
   - Employee ID Mode: Auto Generate (or Manual with valid ID like FCS0200)
   - First Name: Test
   - Last Name: Employee
   - Corporate Email: test.employee@company.com
   - Mobile Number: 9876543210
   - Date of Birth: (any valid date)
   - Joining Date: (today or any valid date)
   - Gender: Select any
   - Process: Type "Engineering" or select from dropdown
   - Designation: Select from dropdown (optional)
   - Monthly Salary: **LEAVE EMPTY** or enter 0

2. Click "Create Employee"

**Expected Result:**
- ✅ Form submits successfully
- ✅ Employee is created (you see success message)
- ✅ Employee appears in the employee list
- ✅ NO 400 Bad Request error
- ✅ Console shows successful API call: `POST /api/v1/employees → 201`

**Failure Indicators:**
- ❌ Form validation prevents submission
- ❌ Alert: "Please enter a valid monthly salary greater than zero"
- ❌ API returns 400 Bad Request

### Test Case 1.2: Create Employee WITH Salary (Regression Test)
**Steps:**
1. Same as above but:
   - Monthly Salary: 50000

2. Click "Create Employee"

**Expected Result:**
- ✅ Form submits successfully
- ✅ Employee is created with salary of ₹50,000
- ✅ NO errors

### Test Case 1.3: Create Employee with Zero Salary
**Steps:**
1. Same as above but:
   - Monthly Salary: 0

2. Click "Create Employee"

**Expected Result:**
- ✅ Form accepts 0 as valid value
- ✅ Employee is created with salary of ₹0
- ✅ NO errors

### Test Case 1.4: Create Employee with Free-text Department
**Steps:**
1. Fill form as before
2. Process: Type "VTP" (not selecting from dropdown)
3. Monthly Salary: Leave empty
4. Click "Create Employee"

**Expected Result:**
- ✅ Department "VTP" is created automatically if it doesn't exist
- ✅ Employee is assigned to "VTP" department
- ✅ NO errors

---

## Test Scenario 2: SUPER_ADMIN Edit Employee (500 Fix)

### Setup
1. Login as SUPER_ADMIN user
2. Navigate to: SUPER_ADMIN Panel → Employee Management
3. Click on any existing employee to view details
4. Click "Edit" button (or directly access edit page)

### Test Case 2.1: Edit Employee Basic Info (Main Fix)
**Steps:**
1. In the edit form, change:
   - First Name: Update to "Updated"
   - Last Name: Keep or change
   - Phone: Update to new number
   - Department: Select a DIFFERENT department from dropdown
   - Designation: Select a DIFFERENT designation from dropdown

2. Click "Save Changes"

**Expected Result:**
- ✅ Employee updates successfully
- ✅ Success message appears
- ✅ Changes are reflected in employee details
- ✅ NO 500 Internal Server Error
- ✅ Console shows: `PUT /api/v1/super-admin/employees/{id} → 200`

**Failure Indicators:**
- ❌ API returns 500 Internal Server Error
- ❌ Error message about database constraints
- ❌ Changes are not saved

### Test Case 2.2: Edit Employee - Clear Department
**Steps:**
1. In the edit form:
   - Department: Select "Select Department" (empty option)

2. Click "Save Changes"

**Expected Result:**
- ✅ Employee updates successfully
- ✅ Department is removed/cleared
- ✅ NO errors

### Test Case 2.3: Edit Employee - Invalid Department (Should Fail Gracefully)
**Steps:**
1. Open browser developer tools → Network tab
2. Edit employee
3. Before clicking "Save Changes", open browser console and run:
   ```javascript
   // This simulates sending invalid UUID
   // You would need to intercept the request
   ```
   (This is advanced testing - skip if complex)

**Expected Result:**
- ✅ API returns 400 Bad Request (not 500)
- ✅ Error message: "Selected department does not exist in your organization"

### Test Case 2.4: Edit Multiple Fields (Regression Test)
**Steps:**
1. Edit employee and change:
   - First Name: "MultiTest"
   - Last Name: "Employee"
   - Phone: "1234567890"
   - Date of Birth: Different date
   - Gender: Different option
   - Department: Different department
   - Designation: Different designation
   - Joining Date: Different date
   - Monthly Salary: 75000

2. Click "Save Changes"

**Expected Result:**
- ✅ ALL fields update successfully
- ✅ NO errors
- ✅ All changes visible in employee details

### Test Case 2.5: Edit Bank Details
**Steps:**
1. Scroll down in edit form to bank details section
2. Update:
   - Bank Name: "Test Bank"
   - Account Number: "123456789012"
   - IFSC Code: "TEST0001234"
   - PAN Number: "ABCDE1234F"
   - Aadhaar Number: "123412341234"

3. Click "Save Changes"

**Expected Result:**
- ✅ Bank details update successfully
- ✅ NO errors
- ✅ Sensitive fields are properly validated

---

## Test Scenario 3: Cross-Functionality Tests

### Test Case 3.1: HR Edit Employee (Using Regular Edit Modal)
**Steps:**
1. Login as HR user
2. Navigate to: HR Panel → Employee Management
3. Click the Edit icon (pencil) on any employee
4. Update First Name, Department, Designation
5. Click "Save Changes"

**Expected Result:**
- ✅ Employee updates successfully
- ✅ NO errors
- ✅ This uses the regular employee update endpoint, not super-admin endpoint

### Test Case 3.2: View Employee Details After Edit
**Steps:**
1. After editing an employee (HR or SUPER_ADMIN)
2. Click the View icon (eye) to see employee details
3. Verify all updated information is displayed

**Expected Result:**
- ✅ Updated information is visible
- ✅ Department name is shown correctly
- ✅ Designation is shown correctly

---

## Verification Checklist

### Backend Console Logs
Monitor the backend console for:
- ✅ No Prisma errors
- ✅ No "P2022: column does not exist" errors
- ✅ No foreign key constraint violations
- ✅ Successful log messages for create/update operations

### Database Verification
Run these SQL queries to verify data:

```sql
-- Check newly created employee
SELECT e.id, e.employeeId, e.firstName, e.lastName, e.monthlySalary, e.departmentId, d.name as departmentName
FROM employee e
LEFT JOIN department d ON e.departmentId = d.id
ORDER BY e.createdAt DESC
LIMIT 5;

-- Check updated employee
SELECT e.id, e.employeeId, e.firstName, e.lastName, e.departmentId, e.designationId, e.updatedAt
FROM employee e
WHERE e.id = 'YOUR_EMPLOYEE_ID_HERE';

-- Verify organization isolation
SELECT e.id, e.employeeId, e.organizationId, d.organizationId as deptOrgId
FROM employee e
LEFT JOIN department d ON e.departmentId = d.id
WHERE e.departmentId IS NOT NULL
AND e.organizationId != d.organizationId;
-- Should return NO rows (no cross-org assignments)
```

### Network Tab Verification
In browser developer tools → Network tab:

**For HR Create Employee:**
- Request: `POST http://localhost:4000/api/v1/employees`
- Status: **201 Created** (not 400)
- Response body should contain employee data

**For SUPER_ADMIN Edit Employee:**
- Request: `PUT http://localhost:4000/api/v1/super-admin/employees/{id}`
- Status: **200 OK** (not 500)
- Response body should contain updated employee data

---

## Common Issues & Troubleshooting

### Issue: "monthlySalary is required" error
**Cause:** Frontend code not updated or browser cache
**Solution:** 
1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Verify frontend changes are deployed
4. Check `CreateEmployeeModal.tsx` has latest changes

### Issue: Still getting 500 on SUPER_ADMIN edit
**Cause:** Backend code not updated or server not restarted
**Solution:**
1. Stop backend server
2. Run `npm run build` in backend directory
3. Restart backend server
4. Verify `super-admin.service.ts` has latest changes

### Issue: Department doesn't appear in dropdown
**Cause:** Frontend not fetching departments correctly
**Solution:**
1. Check API call: `GET /api/v1/super-admin/processes`
2. Verify departments exist in database
3. Check console for errors

### Issue: "Department does not exist in your organization" error
**Cause:** Trying to assign department from different organization (working as intended)
**Solution:**
1. This is correct security behavior
2. Only assign departments that belong to the same organization
3. Contact admin to create the department if needed

---

## Success Criteria

All tests pass when:
- ✅ HR can create employees without salary (no 400 error)
- ✅ HR can create employees with salary (regression)
- ✅ HR can create employees with free-text departments
- ✅ SUPER_ADMIN can edit employees (no 500 error)
- ✅ SUPER_ADMIN can change departments and designations
- ✅ SUPER_ADMIN cannot assign cross-organization departments (proper 400 error)
- ✅ All fields update correctly
- ✅ Database maintains referential integrity
- ✅ Multi-tenant isolation is preserved
- ✅ No Prisma errors in console
- ✅ No breaking changes to existing functionality

---

## Post-Testing

After successful testing:
1. Document any additional issues found
2. Test with production-like data volumes
3. Verify audit logs are created (if applicable)
4. Test role-based access (verify EMPLOYEE role cannot edit)
5. Test on different browsers (Chrome, Firefox, Safari)
6. Review application logs for any warnings

---

## Emergency Rollback

If critical issues are found:

1. **Backend Rollback:**
   ```bash
   cd backend
   git checkout HEAD -- src/modules/super-admin/super-admin.service.ts
   npm run build
   # Restart server
   ```

2. **Frontend Rollback:**
   ```bash
   cd frontend
   git checkout HEAD -- src/components/CreateEmployeeModal.tsx
   # Rebuild and restart
   ```

3. Document the issue and investigation results
4. Contact development team with error logs and reproduction steps

---

## Contact

For issues during testing:
- Backend logs: `backend/logs/`
- Frontend console: Browser Developer Tools → Console
- Database: Use provided SQL queries above
- Error tracking: Document with screenshots and network logs
