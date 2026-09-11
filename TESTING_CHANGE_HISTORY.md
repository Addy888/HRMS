# Employee Change History Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:4000`
2. Frontend server running on `http://localhost:3000`
3. Database connection active
4. At least one HR or Super Admin user account
5. At least one employee record in the system

---

## Test Scenarios

### TEST 1: Edit Employee with Valid Reason ✅

**Objective**: Verify that employee updates with a reason create audit records.

**Steps**:
1. Login as HR or Super Admin
2. Navigate to: `/hr/employees`
3. Click on any employee card to view details
4. Click "Edit Profile" button
5. Change the phone number (e.g., from 9876543210 to 9988776655)
6. Scroll down to "Reason for Update" field
7. Enter reason: "Employee requested phone number update"
8. Click "Save Changes"

**Expected Result**:
- ✅ Employee updated successfully
- ✅ Modal closes
- ✅ Employee detail page refreshes with new phone number
- ✅ Success message displayed (if implemented)

**Verification**:
1. Click "View History" in the Change History section
2. You should see:
   - One new record at the top
   - Your name as updater
   - Your role (HR or SUPER_ADMIN)
   - Current date and time
   - Reason: "Employee requested phone number update"
   - Changed field: Phone: 9876543210 → 9988776655

---

### TEST 2: Edit Without Reason ❌

**Objective**: Verify that updates without a reason are blocked.

**Steps**:
1. Click "Edit Profile" on employee detail page
2. Change the email address
3. Leave the "Reason for Update" field EMPTY
4. Click "Save Changes"

**Expected Result**:
- ❌ Alert appears: "Please provide a reason for updating the employee information"
- ❌ Form NOT submitted
- ❌ Employee NOT updated
- ❌ NO audit record created

**Verification**:
- Employee email remains unchanged
- No new record in Change History

---

### TEST 3: Edit Multiple Fields ✅

**Objective**: Verify that multiple field changes are tracked in one audit record.

**Steps**:
1. Click "Edit Profile"
2. Make the following changes:
   - First Name: "Amit" → "Amit Kumar"
   - Phone: "9988776655" → "9999888877"
   - Department: Select a different department
3. Enter reason: "Employee information correction and department transfer"
4. Click "Save Changes"

**Expected Result**:
- ✅ Employee updated successfully
- ✅ All three fields updated

**Verification**:
1. Click "View History"
2. Latest record should show:
   - Reason: "Employee information correction and department transfer"
   - Three changed fields:
     - First Name: Amit → Amit Kumar
     - Phone: 9988776655 → 9999888877
     - Department: [Old Dept] → [New Dept]

---

### TEST 4: Edit Without Making Changes ❌

**Objective**: Verify that no audit record is created when no changes are made.

**Steps**:
1. Click "Edit Profile"
2. DON'T change any field values
3. Enter reason: "Testing no changes"
4. Click "Save Changes"

**Expected Result**:
- ❌ Error message: "No changes detected. Please modify at least one field to update."
- ❌ Employee NOT updated
- ❌ NO audit record created

**Verification**:
- No new record appears in Change History

---

### TEST 5: Edit Department and Designation ✅

**Objective**: Verify department and designation changes are recorded with names (not IDs).

**Steps**:
1. Click "Edit Profile"
2. Change Department from "IT" to "Engineering"
3. Change Designation from "Developer" to "Senior Developer"
4. Enter reason: "Promotion to Senior Developer"
5. Click "Save Changes"

**Expected Result**:
- ✅ Employee updated successfully

**Verification**:
1. Click "View History"
2. Latest record should show:
   - Reason: "Promotion to Senior Developer"
   - Changed fields with NAMES (not UUID IDs):
     - Department: IT → Engineering
     - Designation: Developer → Senior Developer

---

### TEST 6: Edit Date Fields ✅

**Objective**: Verify date fields are formatted correctly in audit records.

**Steps**:
1. Click "Edit Profile"
2. Change Date of Birth
3. Change Joining Date
4. Enter reason: "Date corrections as per official documents"
5. Click "Save Changes"

**Expected Result**:
- ✅ Dates updated successfully

**Verification**:
1. Click "View History"
2. Latest record should show dates in YYYY-MM-DD format:
   - dob: 1995-01-15 → 1995-01-20
   - joiningDate: 2024-01-01 → 2024-02-01

---

### TEST 7: View Change History (Chronological Order) ✅

**Objective**: Verify change history is displayed in correct order.

**Steps**:
1. Perform 3 separate edits (Tests 1, 3, and 5 above)
2. Navigate to employee detail page
3. Click "View History"

**Expected Result**:
- ✅ All 3 records displayed
- ✅ Newest record at the TOP
- ✅ Oldest record at the BOTTOM
- ✅ Each record shows:
  - Date and time
  - Updater name
  - Updater role badge
  - Reason
  - Changed fields with old → new values

---

### TEST 8: Authorization Check (Regular Employee) ❌

**Objective**: Verify regular employees cannot edit other employees.

**Steps**:
1. Logout from HR/Super Admin account
2. Login as a regular EMPLOYEE
3. Try to navigate to: `/hr/employees`

**Expected Result**:
- ❌ Access denied (based on existing auth system)
- ❌ Cannot view employee list
- ❌ Cannot edit any employee

---

### TEST 9: API Direct Test (Using Postman/Curl) ✅

**Objective**: Test the change history API endpoint directly.

**Setup**:
```bash
# Get JWT token by logging in first
POST http://localhost:4000/api/v1/auth/login
{
  "email": "hr@company.com",
  "password": "yourpassword"
}
# Copy the accessToken from response
```

**Test**:
```bash
# Replace {employeeId} with actual employee ID
GET http://localhost:4000/api/v1/employees/{employeeId}/change-history
Headers:
  Authorization: Bearer {accessToken}
```

**Expected Response**:
```json
[
  {
    "id": "uuid",
    "employeeId": "employee-uuid",
    "updatedByUserId": "user-uuid",
    "updatedByName": "Rahul Sharma",
    "updatedByRole": "HR",
    "reason": "Employee information correction",
    "changes": {
      "phone": {
        "old": "9876543210",
        "new": "9988776655"
      }
    },
    "createdAt": "2026-09-11T15:15:00.000Z"
  }
]
```

---

### TEST 10: Backend Validation Test ✅

**Objective**: Test backend validation directly.

**Test Case A: Update WITHOUT reason field**
```bash
PUT http://localhost:4000/api/v1/employees/{employeeId}
Headers:
  Authorization: Bearer {accessToken}
Body:
{
  "firstName": "Updated Name",
  "phone": "1234567890"
}
```

**Expected Response**:
```json
{
  "statusCode": 400,
  "message": "Update reason is required",
  "error": "Bad Request"
}
```

**Test Case B: Update WITH empty reason**
```bash
PUT http://localhost:4000/api/v1/employees/{employeeId}
Headers:
  Authorization: Bearer {accessToken}
Body:
{
  "firstName": "Updated Name",
  "phone": "1234567890",
  "reason": "   "
}
```

**Expected Response**:
```json
{
  "statusCode": 400,
  "message": "Update reason is required",
  "error": "Bad Request"
}
```

**Test Case C: Update WITH NO changes**
```bash
PUT http://localhost:4000/api/v1/employees/{employeeId}
Headers:
  Authorization: Bearer {accessToken}
Body:
{
  "firstName": "Amit",
  "lastName": "Kumar",
  "reason": "Testing"
}
```

**Expected Response**:
```json
{
  "statusCode": 400,
  "message": "No changes detected. Please modify at least one field to update.",
  "error": "Bad Request"
}
```

---

## Database Verification

### Check Change History Table

```sql
-- View all change history records
SELECT * FROM EmployeeChangeHistory ORDER BY createdAt DESC;

-- View change history for specific employee
SELECT * FROM EmployeeChangeHistory 
WHERE employeeId = 'employee-uuid-here' 
ORDER BY createdAt DESC;

-- View who made the most changes
SELECT updatedByName, updatedByRole, COUNT(*) as changeCount 
FROM EmployeeChangeHistory 
GROUP BY updatedByName, updatedByRole 
ORDER BY changeCount DESC;

-- View most recently changed fields
SELECT * FROM EmployeeChangeHistory 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY createdAt DESC;
```

### Verify JSON Structure

```sql
-- View the changes JSON for a specific record
SELECT 
  id,
  employeeId,
  updatedByName,
  reason,
  changes,
  createdAt
FROM EmployeeChangeHistory
WHERE id = 'record-id-here';
```

Example `changes` JSON:
```json
{
  "phone": {
    "old": "9876543210",
    "new": "9988776655"
  },
  "department": {
    "old": "IT",
    "new": "Engineering"
  }
}
```

---

## Browser Console Verification

### Frontend Logs to Check

Open browser developer console (F12) while testing:

**When Editing Employee:**
```
[EMPLOYEE-EDIT] Process value: uuid-here
[EMPLOYEE-EDIT] Full form state: {firstName: "...", reason: "..."}
[EMPLOYEE-EDIT] Update payload: {...}
```

**When Viewing Change History:**
```
Query is executing with ID: employee-uuid
Change history API response: [...]
```

### Backend Logs to Check

Check backend console output:

**During Update:**
```
[EMPLOYEE-UPDATE] Service received: { employeeId: '...', reason: '...' }
[EMPLOYEE-UPDATE] Current employee data: {...}
[EMPLOYEE-UPDATE] Detected changes: {...}
[EMPLOYEE-UPDATE] Change history record created
```

**During History Fetch:**
```
[CHANGE-HISTORY] Fetching change history for employee: employee-id
[CHANGE-HISTORY] Found X history records
```

---

## Performance Testing

### Load Test: Multiple Edits

**Objective**: Verify system handles multiple concurrent edits.

**Steps**:
1. Open 3 browser tabs
2. Login as 3 different HR users
3. Simultaneously edit 3 different employees
4. Each with different changes and reasons
5. Submit all at the same time

**Expected Result**:
- ✅ All 3 edits succeed
- ✅ All 3 audit records created correctly
- ✅ No race conditions or duplicate records
- ✅ Each record has correct updater information

---

## Edge Cases Testing

### EDGE CASE 1: Very Long Reason
**Test**: Enter a reason with 1000+ characters
**Expected**: Should be accepted (TEXT field in database)

### EDGE CASE 2: Special Characters in Reason
**Test**: Enter reason with special characters: `"Promotion (effective immediately) - per HR policy #123"`
**Expected**: Should be stored and displayed correctly

### EDGE CASE 3: Multiple Rapid Edits
**Test**: Edit same employee 5 times in quick succession
**Expected**: 5 separate audit records created

### EDGE CASE 4: Null to Value Change
**Test**: Change an empty optional field (e.g., bloodGroup) from null to "O+"
**Expected**: Shows: bloodGroup: — → O+

### EDGE CASE 5: Value to Null Change
**Test**: Clear an optional field (e.g., set bloodGroup to empty)
**Expected**: Shows: bloodGroup: O+ → —

---

## Regression Testing

Verify existing functionality still works:

### ✅ Employee Creation
- Create new employee → Should work normally
- No reason required for creation (only for updates)

### ✅ Employee Listing
- View employee list → Should work normally
- All employees visible (based on existing permissions)

### ✅ Employee Details View
- View employee details → Should work normally
- All sections displayed correctly

### ✅ Document Upload
- Upload employee document → Should work normally
- Document verification → Should work normally

### ✅ Other Employee Operations
- Activate/Deactivate employee → Should work normally
- Reset password → Should work normally
- Delete employee → Should work normally (if permission exists)

---

## Test Results Checklist

After completing all tests, verify:

- [ ] TEST 1: Edit with reason - PASSED
- [ ] TEST 2: Edit without reason - BLOCKED (as expected)
- [ ] TEST 3: Edit multiple fields - PASSED
- [ ] TEST 4: Edit without changes - BLOCKED (as expected)
- [ ] TEST 5: Department/Designation changes - PASSED
- [ ] TEST 6: Date field changes - PASSED
- [ ] TEST 7: History chronological order - PASSED
- [ ] TEST 8: Authorization check - PASSED
- [ ] TEST 9: API direct test - PASSED
- [ ] TEST 10: Backend validation - PASSED
- [ ] Database records verified - PASSED
- [ ] Performance test - PASSED
- [ ] Edge cases - PASSED
- [ ] Regression tests - PASSED

---

## Known Issues / Limitations

### Current Limitations:
1. **Prisma Client Generation**: May need manual regeneration on first deployment
   - Solution: Restart backend server after deployment

2. **No Pagination**: Change history loads all records at once
   - Impact: May be slow for employees with 100+ changes
   - Future: Implement pagination if needed

3. **No Export Feature**: Cannot export history to PDF/Excel
   - Future: Add export functionality if needed

---

## Troubleshooting

### Issue: "Update reason is required" even though reason was entered

**Possible Causes**:
- Reason field has only whitespace
- Form not submitting correctly

**Solution**:
- Enter a non-empty reason with actual text
- Check browser console for JavaScript errors

### Issue: Change history not loading

**Possible Causes**:
- User not authorized (not HR/Super Admin)
- Backend API endpoint not accessible
- Network error

**Solution**:
- Verify user role in JWT token
- Check backend server is running
- Check browser network tab for API errors

### Issue: Changes not showing correct values

**Possible Causes**:
- JSON parsing issue
- Database encoding issue

**Solution**:
- Check database charset (should be utf8mb4)
- Verify JSON structure in database

---

## Success Criteria

The feature is considered successfully implemented when:

✅ All 10 test scenarios pass  
✅ No existing functionality broken  
✅ Database has no corrupted records  
✅ UI displays correctly on all screen sizes  
✅ API returns correct data format  
✅ Authorization properly enforced  
✅ Audit records are immutable  
✅ No security vulnerabilities introduced  

---

## Final Sign-Off

**Tested By**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Overall Status**: ✅ PASS / ❌ FAIL  

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

**Next Steps After Testing**:
1. Document any issues found
2. Fix critical bugs before deployment
3. Get stakeholder approval
4. Deploy to staging environment
5. Perform final production testing
6. Deploy to production

