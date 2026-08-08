# HR DATA ISOLATION - TESTING INSTRUCTIONS

## Current Database State

Based on the analysis, here's what exists in the database:

### Total Employee Records: 6
1. **HR Profiles (4)** - These should be EXCLUDED from employee counts:
   - `test1@gmail.com` (HR_USER)
   - `test1233@gmail.com` (HR_USER) 
   - `adityashastri76@gmail.com` (Super Admin)
   - `sumaiyyatamboli50@gmail.com` (HR_ADMIN)

2. **Actual Employees (2)** - These should be INCLUDED:
   - `test12@gmail.com` (EMPLOYEE) - Created by HR_ADMIN
   - `test12356@gmail.com` (EMPLOYEE) - Created by HR_ADMIN

### Employee Ownership:
- All 6 records were created by `sumaiyyatamboli50@gmail.com` (HR_ADMIN)
- `test1@gmail.com` (HR_USER) has created **0 employees**

## Expected Dashboard Results

### For `test1@gmail.com` (HR_USER):
```json
{
  "totalEmployees": 0,
  "activeEmployees": 0,
  "inactiveEmployees": 0,
  "pendingOnboarding": 0,
  "completedOnboarding": 0
}
```
**Reason**: HR_USER should only see employees THEY created. They created 0.

### For `sumaiyyatamboli50@gmail.com` (HR_ADMIN):
```json
{
  "totalEmployees": 2,
  "activeEmployees": 2,
  "inactiveEmployees": 0,
  "pendingOnboarding": 2,
  "completedOnboarding": 0
}
```
**Reason**: HR_ADMIN sees ALL organization employees (only those with EMPLOYEE role, excluding HR profiles).

## If You're Seeing "5 Employees"

If both users are seeing "5 employees", this means:
- The system is **incorrectly** counting some HR profiles as employees
- Or there are 3 more EMPLOYEE role users we didn't see in the query

## Testing Steps

### Step 1: Clear Browser Cache
```
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Click "Clear site data"
4. Hard reload: Ctrl+Shift+R
```

### Step 2: Test HR_USER Dashboard
```bash
# Login as test1@gmail.com
# Navigate to dashboard
# Expected: 0 employees
```

### Step 3: Test HR_ADMIN Dashboard
```bash
# Login as sumaiyyatamboli50@gmail.com  
# Navigate to dashboard
# Expected: 2 employees
```

### Step 4: Have HR_USER Create an Employee
```bash
# Login as test1@gmail.com
# Create a new employee: newemployee@test.com
# Check dashboard again
# Expected: 1 employee (the one they just created)
```

### Step 5: Verify HR_USER Can't See HR_ADMIN's Employees
```bash
# Still logged in as test1@gmail.com
# Navigate to employee list
# Expected: Only see the 1 employee they created
# Should NOT see test12@gmail.com or test12356@gmail.com
```

### Step 6: Test API Directly
```bash
# Get JWT token from browser (localStorage or cookies)
# Test dashboard API

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/dashboard/hr

# Check response
```

## Debug Commands

Run these from the backend directory to see live counts:

```bash
# Check role-based counts
npx ts-node scripts/check-user-roles.ts

# Check all employee details
npx ts-node scripts/check-employee-details.ts
```

## Common Issues

### Issue: "Both users see 5 employees"

**Possible Causes**:
1. **Frontend cache** - Old data cached in browser
2. **Backend not restarted** - Changes not loaded
3. **HR profiles being counted** - Filter not working
4. **Additional employees exist** - More than 2 actual employees

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Restart backend: `npm run start:dev`
3. Check backend console logs for filter queries
4. Run the check scripts to verify database state

### Issue: "HR_USER sees 0 but should see some"

**This is CORRECT if**:
- The HR_USER hasn't created any employees themselves
- All existing employees were created by other HR users

**To fix**:
- Have the HR_USER create a new employee
- Or reassign ownership of existing employees (not recommended)

### Issue: "403 Forbidden when accessing employee"

**This is CORRECT**:
- HR_USER trying to access employee they didn't create
- This is the security working as designed

## Backend Logs to Check

Look for these console logs in the backend:

```
[HR DASHBOARD] getHRStats called
userId: <user-id>
userRole: HR_USER or HR_ADMIN
organizationId: <org-id>
isHRUser: true/false
isHRAdmin: true/false
scope: HR_USER - filtering by createdByUserId = <user-id>
  OR
scope: HR_ADMIN - organization-wide access
```

## Success Criteria

✅ HR_USER (`test1@gmail.com`) sees **0 employees** (they created none)
✅ HR_ADMIN (`sumaiyyatamboli50@gmail.com`) sees **2 employees** (org-wide, EMPLOYEE role only)  
✅ When HR_USER creates employee, their count increases to 1
✅ HR_USER gets 403 when trying to access HR_ADMIN's employees
✅ Backend logs show correct scope determination
✅ No frontend errors in browser console

## If Still Seeing Issues

1. Check if backend is actually running the new code:
   ```bash
   # Restart backend
   cd backend
   npm run start:dev
   ```

2. Verify the build completed:
   ```bash
   npm run build
   ```

3. Check for TypeScript errors:
   ```bash
   npm run build 2>&1 | grep error
   ```

4. Tail the backend logs:
   ```bash
   # Watch live logs
   tail -f <path-to-log-file>
   ```

## Contact for Support

If the issue persists after following all steps:
1. Take screenshots of both dashboards
2. Copy backend console logs
3. Run both check scripts and save output
4. Provide all three pieces of information for further diagnosis
