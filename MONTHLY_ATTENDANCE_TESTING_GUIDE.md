# Monthly Attendance Feature - Testing Guide

## 🎯 Quick Start Testing

### Prerequisites
1. Backend server running on `http://localhost:4000`
2. Frontend server running on `http://localhost:3000`
3. Database with employee and attendance records
4. HR user account with credentials

---

## 📋 Test Scenarios

### Test 1: Basic Navigation Flow
**Objective**: Verify the employee row is clickable and navigates correctly

**Steps**:
1. Login as HR Admin at `http://localhost:3000/login`
2. Navigate to **HR → Attendance** from sidebar
3. You should see the attendance table with employee records
4. **Hover** over any employee row
   - ✅ Check: Employee name turns blue
   - ✅ Check: Cursor changes to pointer
5. **Click** on employee row (e.g., "Aditya Addy")
6. **Expected**: Navigate to `/hr/attendance/employee/{employeeId}`
7. **Expected**: Page loads with employee monthly attendance

**Success Criteria**:
- [x] Employee name is clickable
- [x] Hover state shows blue color
- [x] Click navigates to correct URL
- [x] New page loads without errors

---

### Test 2: Employee Information Display
**Objective**: Verify employee details are fetched and displayed correctly

**Steps**:
1. From Test 1, you should be on `/hr/attendance/employee/{employeeId}`
2. Look at the **Employee Information Card** (top section)
3. Verify the following fields are displayed:
   - Employee Name
   - Employee ID (e.g., FCS0161)
   - Department
   - Designation

**Success Criteria**:
- [x] All fields show real data (not "Unknown" or "—")
- [x] Employee name matches the clicked employee
- [x] Employee ID is correct
- [x] Department and Designation are displayed

**If fields show "—"**:
- Check if employee has department/designation assigned in database
- This is expected if employee has NULL values

---

### Test 3: Month & Year Selection
**Objective**: Verify month/year dropdowns work and data refetches

**Steps**:
1. On the monthly attendance page
2. Find the **Month** and **Year** dropdowns (below employee info card)
3. **Current selection**: Should default to current month and year
4. **Change month**: Select "August" from dropdown
5. **Expected**: 
   - Loading spinner appears briefly
   - Attendance data updates for August
   - All 31 days of August are shown in the table
6. **Change year**: Select "2025" or previous year
7. **Expected**:
   - Loading spinner appears briefly
   - Attendance data updates for that year
   - Table shows days for selected month in selected year

**Success Criteria**:
- [x] Dropdowns are functional
- [x] Changing month triggers data refetch
- [x] Changing year triggers data refetch
- [x] Loading state shows during fetch
- [x] Page does NOT reload entirely
- [x] URL does NOT change

---

### Test 4: Summary Cards Validation
**Objective**: Verify summary cards show correct calculated values

**Steps**:
1. On the monthly attendance page
2. Note the **8 summary cards** at the top:
   - Total Working Days
   - Present
   - Late
   - Half Day
   - Absent
   - Week Off
   - Leave
   - Attendance %

3. **Manual Verification**:
   - Count the number of days with status "PRESENT" or "LATE" in the table
   - Compare with "Present" card value
   - Count the number of days with status "LATE" in the table
   - Compare with "Late" card value
   - Verify "Attendance %" calculation makes sense

**Success Criteria**:
- [x] All 8 cards display values (not blank)
- [x] Values are numbers (not "undefined" or "null")
- [x] Present count matches table rows
- [x] Late count matches table rows
- [x] Attendance % is between 0% and 100%

**Expected Behavior**:
- If no attendance records for the month: All values should be 0
- If partial attendance: Values should match actual records
- Attendance % = (Present + Leave) / Total Working Days * 100

---

### Test 5: Working Hours Display
**Objective**: Verify working hours are calculated and formatted correctly

**Steps**:
1. On the monthly attendance page
2. Find the **2 working hours cards** (below summary cards):
   - Total Working Hours
   - Average Working Hours

3. Check the format:
   - Should be "XXh XXm" (e.g., "08h 30m")
   - NOT "8.5" or "8:30"

4. Verify values:
   - Total should be sum of all working hours in the month
   - Average should be Total / Working Days

**Success Criteria**:
- [x] Format is "XXh XXm"
- [x] Both cards show values (not "—" or "undefined")
- [x] Values are reasonable (e.g., 150h for 20 working days)
- [x] Average is less than Total

**Edge Case**:
- If no attendance records: Should show "00h 00m"

---

### Test 6: Monthly Table - Complete Calendar
**Objective**: Verify all days of the month are shown

**Steps**:
1. Select **August 2026** from dropdowns
2. Count the number of rows in the table
3. **Expected**: 31 rows (August has 31 days)

4. Check the **Date** column:
   - Should start with "01 Aug"
   - Should end with "31 Aug"
   - All dates in between should be present

5. Check the **Day** column:
   - Should show day names (Monday, Tuesday, etc.)
   - Verify a few dates match actual calendar (e.g., August 14, 2026 is Friday)

**Success Criteria**:
- [x] All days of the month are present
- [x] No missing dates
- [x] No duplicate dates
- [x] Date order is correct (1st to last day)
- [x] Day names are correct

**Try Different Months**:
- February 2024 (leap year): Should show 29 days
- February 2025 (non-leap): Should show 28 days
- September 2026: Should show 30 days

---

### Test 7: Attendance Data Display
**Objective**: Verify attendance records are displayed correctly

**Steps**:
1. Find a date that has an attendance record (check-in/check-out exists)
2. Verify the row shows:
   - **Check In**: Time in "HH:mm AM/PM" format (e.g., "09:30 AM")
   - **Check Out**: Time in "HH:mm AM/PM" format (e.g., "06:00 PM")
   - **Working Hours**: In "XXh XXm" format (e.g., "08h 30m")
   - **Status**: Badge with color (e.g., "PRESENT" in green)
   - **Late By**: Minutes if late (e.g., "15m") or "—"

3. Find a date with **NO** attendance record
4. Verify the row shows:
   - **Check In**: "—"
   - **Check Out**: "—"
   - **Working Hours**: "00h 00m" (NOT "—")
   - **Status**: "NOT_MARKED" badge
   - **Late By**: "—"

**Success Criteria**:
- [x] Times are in IST (Asia/Kolkata)
- [x] Times are readable (not UTC timestamps)
- [x] Working hours format is correct
- [x] Status badges have colors
- [x] Missing data shows "—" correctly
- [x] Working hours never shows "—" (always "00h 00m" minimum)

---

### Test 8: Status Color Coding
**Objective**: Verify different statuses have different colors

**Steps**:
1. Look at the **Status** column in the table
2. Check if different statuses have different colors:
   - **PRESENT**: Emerald green background
   - **LATE**: Amber/yellow background
   - **ABSENT**: Red background
   - **HALF_DAY**: Blue background
   - **WEEK_OFF**: Gray background
   - **LEAVE**: Purple background
   - **NOT_MARKED**: Gray background

**Success Criteria**:
- [x] Each status has a unique color
- [x] Colors are visible and readable
- [x] Badge has border and padding
- [x] Text is uppercase and bold

---

### Test 9: Timezone Handling (Critical)
**Objective**: Verify dates are correctly normalized to India timezone

**Steps**:
1. On the monthly attendance page
2. Check if any date appears **twice** in the table
3. **Expected**: No duplicates

4. Find a date near month boundary (e.g., August 31 at 11:59 PM)
5. Verify it appears in the correct month (August, not September)

6. Check if dates are missing or appear in wrong month
7. **Expected**: All dates in correct month

**Success Criteria**:
- [x] No duplicate dates
- [x] All dates in correct month
- [x] Dates at month boundaries are correct
- [x] Check-in/check-out times match IST

**Common Issue**:
- If dates are duplicated: Timezone normalization failed
- If dates are in wrong month: UTC vs IST conversion issue

**This feature specifically addresses this issue with proper timezone handling**

---

### Test 10: Print Functionality
**Objective**: Verify print layout works correctly

**Steps**:
1. On the monthly attendance page
2. Click the **Print** button (top right)
3. Browser print dialog should open
4. Check the **print preview**:
   - Sidebar should be hidden
   - Header/navigation should be hidden
   - Export/Print buttons should be hidden
   - Content should be full-width
   - Tables should be readable

5. Check the print content includes:
   - Company name/header
   - Employee information
   - Selected month/year
   - Summary cards
   - Complete attendance table

**Success Criteria**:
- [x] Print dialog opens
- [x] Print preview looks clean
- [x] No sidebar/navigation visible
- [x] Content is readable
- [x] All data is included
- [x] No cut-off content

**Note**: You can use Print Preview (Ctrl+P) to test without actually printing

---

### Test 11: Export Buttons (Placeholder)
**Objective**: Verify export buttons are present (functionality is placeholder)

**Steps**:
1. On the monthly attendance page
2. Find the **Export Excel** button (top right, green)
3. Click it
4. **Expected**: Alert saying "Excel export functionality coming soon!"

5. Find the **Export PDF** button (top right, red)
6. Click it
7. **Expected**: Alert saying "PDF export functionality coming soon!"

**Success Criteria**:
- [x] Both buttons are visible
- [x] Buttons have correct icons
- [x] Buttons have correct colors (Excel=green, PDF=red)
- [x] Clicking shows alert message
- [x] No errors in console

**Note**: Full export functionality is out of scope for this implementation

---

### Test 12: Responsive Design
**Objective**: Verify page works on mobile devices

**Steps**:
1. Open the monthly attendance page
2. Open browser DevTools (F12)
3. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
4. Select mobile device (e.g., iPhone 12 Pro)
5. Test the page:
   - Summary cards should stack vertically
   - Table should be scrollable horizontally
   - Dropdowns should be usable
   - Back button should work

**Success Criteria**:
- [x] Page is usable on mobile
- [x] No horizontal overflow
- [x] Table is scrollable
- [x] Buttons are tappable
- [x] Text is readable

---

### Test 13: Loading States
**Objective**: Verify loading states display correctly

**Steps**:
1. Navigate to monthly attendance page
2. **On initial load**:
   - Should show loading spinner
   - Then data appears

3. **Change month/year**:
   - Should show loading spinner briefly
   - Then data updates

4. **Slow network simulation**:
   - Open DevTools → Network tab
   - Set throttling to "Slow 3G"
   - Change month
   - **Expected**: Loading spinner visible for longer

**Success Criteria**:
- [x] Loading spinner appears
- [x] Spinner is centered
- [x] Spinner is blue color
- [x] Content appears after loading
- [x] No "undefined" or "null" text during loading

---

### Test 14: Error Handling
**Objective**: Verify error states are handled gracefully

**Steps**:
1. **Invalid Employee ID**:
   - Navigate to `/hr/attendance/employee/invalid-id`
   - **Expected**: "Employee not found" message
   - Red X icon displayed

2. **Backend Down**:
   - Stop the backend server
   - Try to access monthly attendance page
   - **Expected**: Error message or loading spinner

**Success Criteria**:
- [x] Error messages are user-friendly
- [x] No raw error text displayed
- [x] Page doesn't crash
- [x] User can navigate back

---

### Test 15: Back Navigation
**Objective**: Verify back button works correctly

**Steps**:
1. On the monthly attendance page
2. Find the **Back to Attendance** button (top left)
3. Click it
4. **Expected**: Navigate back to `/hr/attendance`
5. **Expected**: Main attendance list is displayed

**Success Criteria**:
- [x] Back button is visible
- [x] Back button has left arrow icon
- [x] Clicking navigates to correct page
- [x] No errors occur

---

### Test 16: Security & Permissions
**Objective**: Verify only HR users can access the page

**Steps**:
1. **HR User Access**:
   - Login as HR_ADMIN or HR_USER
   - Navigate to monthly attendance page
   - **Expected**: Page loads successfully

2. **Employee Access** (should be blocked):
   - Logout HR user
   - Login as EMPLOYEE role
   - Try to access `/hr/attendance/employee/{employeeId}` directly
   - **Expected**: Redirect to `/employee` dashboard
   - OR: "Unauthorized" message

3. **Unauthenticated Access** (should be blocked):
   - Logout completely
   - Try to access monthly attendance page
   - **Expected**: Redirect to `/login`

**Success Criteria**:
- [x] HR users can access page
- [x] Employee users are blocked/redirected
- [x] Unauthenticated users are redirected to login
- [x] No sensitive data exposed to unauthorized users

---

### Test 17: Performance
**Objective**: Verify page loads and performs well

**Steps**:
1. Navigate to monthly attendance page
2. Check browser console for errors
3. Check network tab:
   - Only 2 API calls should be made:
     - GET /employees/{employeeId}
     - GET /attendance/employee/{employeeId}/monthly

4. Change month:
   - Should only make 1 new API call (monthly attendance)
   - Should NOT refetch employee data

5. Page should feel responsive:
   - No lag when clicking dropdowns
   - Table rows render quickly
   - Smooth scrolling

**Success Criteria**:
- [x] No console errors
- [x] Minimal API calls
- [x] Fast page load (<2 seconds)
- [x] Smooth interactions
- [x] No memory leaks

---

### Test 18: Data Accuracy
**Objective**: Verify calculated values match actual data

**Steps**:
1. Select a month with known attendance data (e.g., current month)
2. **Manual Calculation**:
   - Count PRESENT rows in table
   - Count LATE rows in table
   - Count ABSENT rows in table
   - Sum up working hours manually

3. **Compare with Summary Cards**:
   - Present card value = Manual count
   - Late card value = Manual count
   - Total Working Hours = Manual sum

4. If values don't match:
   - Check backend API response
   - Check if timezone is causing issues
   - Check if statuses are mapped correctly

**Success Criteria**:
- [x] Summary values match table data
- [x] Calculations are accurate
- [x] No off-by-one errors
- [x] Percentages are correct

---

## 🐛 Common Issues & Solutions

### Issue 1: Employee row not clickable
**Symptom**: Clicking employee row does nothing

**Solutions**:
1. Check if `onClick` handler is attached to `<tr>` element
2. Check browser console for JavaScript errors
3. Verify Next.js router is imported correctly
4. Try refreshing the page

### Issue 2: "Employee not found" error
**Symptom**: Monthly page shows error after navigation

**Solutions**:
1. Verify employee ID in URL is correct
2. Check if employee exists in database
3. Check backend API response for `/employees/{employeeId}`
4. Verify API token is valid

### Issue 3: Dates appearing twice
**Symptom**: Same date shows multiple times in table

**Solutions**:
1. This is a timezone issue
2. Check if `toZonedTime` is used correctly
3. Verify date comparison logic
4. Check backend date format

### Issue 4: Summary cards show 0 or undefined
**Symptom**: All summary cards are empty or show 0

**Solutions**:
1. Check if backend returns `summary` object
2. Check API response structure (envelope vs direct)
3. Verify `unwrapResponse` is called
4. Check if `monthlyData?.summary` exists

### Issue 5: Times show as UTC timestamps
**Symptom**: Check-in/out times show "2026-08-14T04:38:00.000Z" instead of "04:38 AM"

**Solutions**:
1. Check if `formatTime` function is called
2. Verify `toZonedTime` is used in `formatTime`
3. Check if timestamp is valid Date object

### Issue 6: Print button does nothing
**Symptom**: Clicking Print button has no effect

**Solutions**:
1. Check if `window.print()` is called
2. Check browser console for errors
3. Try using Ctrl+P manually
4. Check if print styles are loaded

---

## ✅ Final Checklist

Before marking the feature as complete, verify:

- [ ] Employee rows are clickable on `/hr/attendance`
- [ ] Monthly page loads at `/hr/attendance/employee/{id}`
- [ ] Employee information is displayed correctly
- [ ] Month/year dropdowns work and refetch data
- [ ] All 8 summary cards show values
- [ ] Working hours cards show formatted values
- [ ] Complete month calendar is displayed (all days)
- [ ] Attendance records display correctly with times
- [ ] Status badges have correct colors
- [ ] No duplicate dates (timezone handling works)
- [ ] Print button opens print dialog
- [ ] Export buttons show alerts (placeholders)
- [ ] Page is responsive on mobile
- [ ] Loading states appear during data fetch
- [ ] Error handling works (invalid ID, etc.)
- [ ] Back button navigates to attendance list
- [ ] Only HR users can access the page
- [ ] No console errors
- [ ] Data accuracy matches calculations

---

## 📊 Expected Data Format

### Employee API Response:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "employeeId": "FCS0161",
    "firstName": "Aditya",
    "lastName": "Addy",
    "department": {
      "name": "Agent"
    },
    "designation": {
      "name": "Software Engineer"
    }
  }
}
```

### Monthly Attendance API Response:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "month": 8,
    "year": 2026,
    "attendances": [
      {
        "id": "uuid",
        "date": "2026-08-14T00:00:00.000Z",
        "checkInTime": "2026-08-14T04:38:00.000Z",
        "checkOutTime": "2026-08-14T12:26:00.000Z",
        "workingHours": 7.8,
        "status": "PRESENT",
        "lateBy": 0
      }
    ],
    "summary": {
      "totalWorkingDays": 22,
      "totalPresent": 20,
      "totalLate": 3,
      "totalHalfDay": 1,
      "totalAbsent": 1,
      "totalWeekOffs": 8,
      "totalHolidays": 0,
      "totalWFH": 0,
      "totalOnDuty": 0,
      "totalWorkingHours": 156.5,
      "totalOvertime": 0,
      "averageWorkingHours": 7.8,
      "attendancePercentage": 90.91
    }
  }
}
```

---

## 🚀 Ready to Test!

Follow the test scenarios above in order for comprehensive coverage.

**Estimated Testing Time**: 30-45 minutes for complete testing

**Priority Tests** (if time is limited):
1. Test 1: Basic Navigation
2. Test 3: Month/Year Selection
3. Test 4: Summary Cards
4. Test 6: Monthly Table
5. Test 9: Timezone Handling
6. Test 16: Security

**Good luck with testing! 🎉**
