# Payroll Role-Based Access - Testing Guide

## 🧪 Testing Checklist

### Prerequisites
1. Ensure backend is running: `npm run start:dev` in `/backend`
2. Ensure frontend is running: `npm run dev` in `/frontend`
3. Have test credentials for both HR and Employee roles

---

## 🔐 Test 1: HR Portal - Full Access

### Login as HR
1. Navigate to `/login`
2. Login with HR credentials
3. Should redirect to `/hr`

### Verify Payroll Menu
1. Check sidebar for **💰 Payroll** menu item
2. Click on Payroll menu
3. Verify submenu expands with 7 items:
   - ✅ Payroll Dashboard
   - ✅ Employee Salary
   - ✅ Salary Structure
   - ✅ Payroll Processing
   - ✅ Salary Slip Generator
   - ✅ Salary History
   - ✅ Payroll Reports

### Test Each Payroll Page
1. **Payroll Dashboard** (`/hr/payroll`)
   - Should show payroll statistics
   - Should display quick action cards
   - Should load without errors

2. **Employee Salary** (`/hr/payroll/employees`)
   - Should display employee search
   - Should show "Employee salary list will be displayed here"
   - Page loads successfully

3. **Salary Structure** (`/hr/payroll/salary-structure`)
   - Should display page with proper header
   - Page loads successfully

4. **Payroll Processing** (`/hr/payroll/processing`)
   - Should display page with proper header
   - Page loads successfully

5. **Salary Slip Generator** (`/hr/payroll/payslips`)
   - Should display page with proper header
   - Page loads successfully

6. **Salary History** (`/hr/payroll/history`)
   - Should display page with proper header
   - Page loads successfully

7. **Payroll Reports** (`/hr/payroll/reports`)
   - Should display page with proper header
   - Page loads successfully

### Verify Active State
1. Click on any payroll submenu item
2. Verify the Payroll menu remains open
3. Verify the selected submenu item is highlighted
4. Verify the URL matches the selected page

---

## 👤 Test 2: Employee Portal - Read-Only Access

### Login as Employee
1. Navigate to `/login`
2. Login with Employee credentials
3. Should redirect to `/employee`

### Verify My Salary Menu
1. Check sidebar for **💰 My Salary** menu item
2. Verify it's a single menu item (not expandable)
3. Verify Payroll menu is NOT visible

### Test My Salary Page (`/employee/my-salary`)
1. Click on "My Salary" in sidebar
2. Should navigate to `/employee/my-salary`
3. Verify page loads without errors

### Verify Page Sections
1. **Header Section**
   - ✅ Shows "My Salary" title
   - ✅ Shows wallet icon
   - ✅ Shows description

2. **Current Month Status**
   - ✅ Shows current month and year
   - ✅ Shows payroll status badge (PAID/PROCESSED/PENDING/NOT_GENERATED)
   - ✅ Shows net salary (if payroll generated)
   - ✅ Shows info message (if not generated)

3. **Salary Structure - Earnings Card**
   - ✅ Shows Basic Salary
   - ✅ Shows HRA
   - ✅ Shows Conveyance
   - ✅ Shows Medical Allowance
   - ✅ Shows Special Allowance
   - ✅ Shows Other Allowances (if any)
   - ✅ Shows Gross Salary total

4. **Salary Structure - Deductions Card**
   - ✅ Shows PF
   - ✅ Shows ESI
   - ✅ Shows Professional Tax
   - ✅ Shows TDS
   - ✅ Shows Other Deductions (if any)
   - ✅ Shows Total Deductions

5. **Net Salary Card**
   - ✅ Displayed prominently with emerald gradient
   - ✅ Shows take-home salary
   - ✅ Shows "per month" label

6. **CTC Card**
   - ✅ Shows Cost to Company
   - ✅ Shows annual package info

7. **Recent Payroll History**
   - ✅ Shows last 6 months (if available)
   - ✅ Shows month/year for each record
   - ✅ Shows status badge for each record
   - ✅ Shows gross and net salary

8. **Info Notice**
   - ✅ Blue info box at bottom
   - ✅ Explains read-only access
   - ✅ Directs to contact HR for changes

### Verify Data Loading States
1. **Loading State**
   - Should show loading indicators while fetching data
   
2. **Error State**
   - If API fails, should show error message
   - Should display AlertCircle icon
   - Should show "Failed to load salary information"

3. **No Data State**
   - If employee has no salary structure, handle gracefully

---

## 🔒 Test 3: Security & Permissions

### Backend API Tests

#### Test Employee Endpoints (as Employee)
Use tools like Postman or curl with Employee JWT token:

1. **Get My Salary** ✅ Should succeed
   ```
   GET /employee-salary/my-salary
   Authorization: Bearer <employee_token>
   ```
   Expected: 200 OK with salary data

2. **Get My Salary History** ✅ Should succeed
   ```
   GET /employee-salary/my-salary-history
   Authorization: Bearer <employee_token>
   ```
   Expected: 200 OK with history data

3. **Get My Payroll Status** ✅ Should succeed
   ```
   GET /employee-salary/my-payroll-status
   Authorization: Bearer <employee_token>
   ```
   Expected: 200 OK with status data

4. **Get My Payslip** ✅ Should succeed
   ```
   GET /employee-salary/payslip/:payrollRunId
   Authorization: Bearer <employee_token>
   ```
   Expected: 200 OK if payslip belongs to employee
   Expected: 403 Forbidden if payslip belongs to another employee

#### Test HR Endpoints (as Employee)
With Employee JWT token, test HR-only endpoints:

1. **Generate Payroll** ❌ Should fail
   ```
   POST /payroll/generate/employee/:employeeId
   Authorization: Bearer <employee_token>
   ```
   Expected: 403 Forbidden

2. **Get Payroll History (All)** ❌ Should fail
   ```
   GET /payroll/history
   Authorization: Bearer <employee_token>
   ```
   Expected: 403 Forbidden

3. **Create Salary Structure** ❌ Should fail
   ```
   POST /salary-structure
   Authorization: Bearer <employee_token>
   ```
   Expected: 403 Forbidden

#### Test Employee Endpoints (as HR)
With HR JWT token:

1. **Get My Salary** ❌ Should fail (route requires EMPLOYEE role)
   ```
   GET /employee-salary/my-salary
   Authorization: Bearer <hr_token>
   ```
   Expected: 403 Forbidden

#### Test Without Authentication
Without JWT token:

1. **Any Payroll Endpoint** ❌ Should fail
   ```
   GET /employee-salary/my-salary
   ```
   Expected: 401 Unauthorized

---

## 🖥️ Test 4: Frontend Route Protection

### Test Unauthorized Access

1. **Employee accessing HR Payroll**
   - Login as Employee
   - Manually navigate to `/hr/payroll`
   - Expected: Redirect to `/employee` (automatic)

2. **HR accessing Employee My Salary**
   - Login as HR
   - Manually navigate to `/employee/my-salary`
   - Expected: Redirect to `/hr` (automatic)

3. **Unauthenticated User**
   - Logout or open incognito
   - Navigate to `/hr/payroll` or `/employee/my-salary`
   - Expected: Redirect to `/login`

---

## 🎨 Test 5: UI/UX Testing

### Desktop View
1. **HR Sidebar**
   - ✅ Payroll menu properly positioned
   - ✅ Submenu items indented
   - ✅ Active state highlighting works
   - ✅ Expand/collapse animation smooth

2. **Employee Sidebar**
   - ✅ My Salary menu item visible
   - ✅ Icon displays correctly
   - ✅ Active state works

3. **Page Layouts**
   - ✅ All pages follow FCS HRMS theme
   - ✅ Cards have proper spacing
   - ✅ Text is readable
   - ✅ Colors match design system

### Mobile View (Responsive)
1. Open browser DevTools
2. Switch to mobile view (e.g., iPhone 12 Pro)
3. Test sidebar:
   - ✅ Mobile menu button appears
   - ✅ Sidebar slides in from left
   - ✅ Payroll menu works in mobile
   - ✅ Clicking menu item closes sidebar

---

## 🐛 Test 6: Error Handling

### Test API Errors
1. **Stop Backend Server**
   - Navigate to employee My Salary page
   - Expected: Error message displayed
   - Expected: "Failed to load salary information"

2. **Invalid Employee ID**
   - Mock API to return 404
   - Expected: Error handling displayed

3. **No Salary Structure**
   - Employee with no salary assigned
   - Expected: Graceful handling (empty state or message)

---

## 📊 Test 7: Data Verification

### Verify Correct Data Display
1. **Check Salary Calculations**
   - Gross Salary = Basic + HRA + Conveyance + Medical + Special + Other Allowances
   - Total Deductions = PF + ESI + Professional Tax + TDS + Other Deductions
   - Net Salary = Gross Salary - Total Deductions

2. **Check Status Badges**
   - PAID: Green with checkmark
   - PROCESSED: Amber with clock
   - PENDING: Blue with clock
   - NOT_GENERATED: Gray with info icon

3. **Check Date Formatting**
   - Months displayed as names (January, February, etc.)
   - Year displayed correctly

---

## ✅ Success Criteria

All tests should pass with the following results:

- [x] HR can access all 7 payroll pages
- [x] HR payroll menu expands/collapses properly
- [x] Employee can access My Salary page
- [x] Employee cannot access HR payroll pages
- [x] Employee data is read-only (no edit/delete buttons)
- [x] API returns 403 for unauthorized access
- [x] API returns 401 for unauthenticated access
- [x] Ownership verification prevents cross-employee access
- [x] All pages load without console errors
- [x] Responsive design works on mobile
- [x] Error states display properly
- [x] Data calculations are correct
- [x] Status badges display correctly
- [x] Theme consistency maintained

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot read property 'employeeId' of undefined"
**Solution**: Ensure JWT token includes employeeId in payload

### Issue: 403 Forbidden on employee endpoints
**Solution**: Verify user role is EMPLOYEE, not HR

### Issue: Sidebar menu not expanding
**Solution**: Check React state for `isOpen` in SidebarMenu component

### Issue: Page shows old data after update
**Solution**: Invalidate React Query cache or hard refresh

### Issue: Mobile menu not closing after navigation
**Solution**: Verify `onClick` handlers on mobile menu items

---

## 📝 Testing Report Template

```
# Payroll Role-Based Access Testing Report
Date: __________
Tester: __________
Environment: Development / Staging / Production

## Test Results

### HR Portal Tests
- [ ] Payroll menu visible
- [ ] All 7 submenu items accessible
- [ ] Pages load without errors
- [ ] Active state highlighting works
- [ ] Mobile responsive

### Employee Portal Tests
- [ ] My Salary menu visible
- [ ] Page loads without errors
- [ ] All sections display correctly
- [ ] Read-only notice present
- [ ] Mobile responsive

### Security Tests
- [ ] Employee can access own data
- [ ] Employee cannot access other employee data
- [ ] Employee cannot access HR endpoints
- [ ] HR cannot access employee endpoints
- [ ] Unauthenticated users redirected

### UI/UX Tests
- [ ] Theme consistency maintained
- [ ] Icons display correctly
- [ ] Layout responsive
- [ ] Error states handled
- [ ] Loading states shown

## Issues Found
1. ____________________________________
2. ____________________________________

## Overall Result: PASS / FAIL
```

---

## 🎉 Testing Complete!

Once all tests pass, the payroll role-based access implementation is verified and ready for production deployment.
