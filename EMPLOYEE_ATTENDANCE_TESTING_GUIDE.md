# 🧪 EMPLOYEE ATTENDANCE VIEW - TESTING GUIDE

**Purpose:** Step-by-step testing procedure to verify employee attendance view functionality

---

## 📋 PRE-REQUISITES

Before testing, ensure you have:
- ✅ Backend server running (`npm run start:dev` in backend/)
- ✅ Frontend server running (`npm run dev` in frontend/)
- ✅ At least 2 test employees in the system:
  - Employee A (e.g., FCS-2026-0001)
  - Employee B (e.g., FCS-2026-0002)
- ✅ HR user account
- ✅ Database connected and migrations applied

---

## 🧪 TEST SUITE

### TEST 1: HR Excel Upload Functionality
**Objective:** Verify HR can upload attendance Excel

**Steps:**
1. Login as HR user
   - Email: `hr@company.com` (or your HR account)
   - Password: `your-password`

2. Navigate to HR Panel
   - Click "Attendance" in sidebar
   - Click "Upload Excel" or "Import Attendance"

3. Download Template
   - Click "Download Template" button
   - Verify Excel file downloads
   - Open Excel and verify headers:
     - Employee ID
     - Date
     - Check In
     - Check Out
     - Status

4. Fill Template with Test Data
   ```
   Employee ID | Date       | Check In | Check Out | Status
   FCS-2026-0001 | 2026-09-01 | 09:00    | 18:00     | PRESENT
   FCS-2026-0001 | 2026-09-02 | 10:15    | 19:00     | LATE
   FCS-2026-0001 | 2026-09-03 | 09:30    | 16:00     | HALF_DAY
   FCS-2026-0002 | 2026-09-01 | 09:00    | 18:00     | PRESENT
   FCS-2026-0002 | 2026-09-02 | —        | —         | ABSENT
   ```

5. Upload Excel
   - Select the filled Excel file
   - Click "Upload" or "Preview"
   - Verify preview shows:
     - Total rows: 5
     - Valid rows: 5
     - Invalid rows: 0
     - Employees found: 2

6. Confirm Import
   - Click "Confirm Import"
   - Wait for success message
   - Verify import completed successfully

**Expected Result:** ✅ PASS
- Excel uploaded without errors
- All rows imported successfully
- Success notification shown

**Actual Result:** _________________

---

### TEST 2: HR View Imported Attendance
**Objective:** Verify HR can view all imported attendance

**Steps:**
1. Stay logged in as HR
2. Navigate to Attendance section
3. View attendance list or calendar
4. Filter by date range (September 2026)
5. Verify all imported records are visible

**Expected Result:** ✅ PASS
- All 5 attendance records visible
- Check-in/check-out times match Excel
- Status values match Excel

**Actual Result:** _________________

---

### TEST 3: Employee A Views Own Attendance
**Objective:** Verify Employee A can ONLY see their own data

**Steps:**
1. Logout from HR account
2. Login as Employee A
   - Email: `employee.a@company.com` (or Employee A email)
   - Password: `password`

3. Navigate to Employee Panel → Attendance

4. Verify Today's Status Section
   - Shows current date
   - Shows attendance status for today
   - Has check-in/check-out buttons (for today only)

5. Select Month = September, Year = 2026

6. Verify Calendar Display
   - September 1st shows:
     - Status: PRESENT
     - Check In: 09:00 AM
     - Check Out: 06:00 PM
     - Working Hours: 9h 0m
   
   - September 2nd shows:
     - Status: LATE
     - Check In: 10:15 AM
     - Check Out: 07:00 PM
     - Working Hours: 8h 45m
   
   - September 3rd shows:
     - Status: HALF DAY
     - Check In: 09:30 AM
     - Check Out: 04:00 PM
     - Working Hours: 6h 30m

7. Verify Monthly Summary
   - Total Present: 1
   - Total Late: 1
   - Total Absent: 0
   - (Numbers may vary based on other dates)

8. Verify NO Employee B Data
   - Employee B attendance NOT visible
   - Only Employee A records shown

**Expected Result:** ✅ PASS
- Employee A sees only their own 3 records
- No Employee B data visible
- All values match Excel upload
- UI is READ ONLY (no edit buttons)

**Actual Result:** _________________

---

### TEST 4: Employee B Views Own Attendance
**Objective:** Verify Employee B can ONLY see their own data

**Steps:**
1. Logout from Employee A account
2. Login as Employee B
   - Email: `employee.b@company.com`
   - Password: `password`

3. Navigate to Employee Panel → Attendance

4. Select Month = September, Year = 2026

5. Verify Calendar Display
   - September 1st shows:
     - Status: PRESENT
     - Check In: 09:00 AM
     - Check Out: 06:00 PM
   
   - September 2nd shows:
     - Status: ABSENT
     - Check In: — (no time)
     - Check Out: — (no time)

6. Verify NO Employee A Data
   - Employee A attendance NOT visible
   - Only Employee B records shown

**Expected Result:** ✅ PASS
- Employee B sees only their own 2 records
- No Employee A data visible
- All values match Excel upload

**Actual Result:** _________________

---

### TEST 5: Security - API Request Manipulation
**Objective:** Verify Employee A cannot access Employee B data via API manipulation

**Steps:**
1. Login as Employee A
2. Open Browser Developer Tools (F12)
3. Go to Network tab
4. Navigate to Employee → Attendance
5. Find the API request: `GET /api/v1/attendance/my/monthly?month=9&year=2026`
6. Right-click request → "Copy as cURL" or "Copy as Fetch"
7. Modify the request to try accessing Employee B data:
   - Try adding: `&employeeId=EMPLOYEE_B_ID`
   - Try adding: `&userId=EMPLOYEE_B_USER_ID`
8. Execute modified request
9. Inspect response data

**Expected Result:** ✅ PASS
- Backend IGNORES additional parameters
- Response contains ONLY Employee A data
- Employee B data NOT accessible
- No error thrown (secure by default)

**Actual Result:** _________________

---

### TEST 6: Read-Only UI Verification
**Objective:** Verify employee cannot edit/delete attendance

**Steps:**
1. Login as any Employee
2. Navigate to Attendance page
3. Inspect UI elements on calendar dates with attendance
4. Look for:
   - Edit buttons ❌ (should NOT exist)
   - Delete buttons ❌ (should NOT exist)
   - Modify buttons ❌ (should NOT exist)
   - Download buttons ❌ (should NOT exist)
   - Export buttons ❌ (should NOT exist)

5. Right-click on attendance record
6. Verify no context menu with edit/delete options

7. Try to click on attendance values
8. Verify no input fields appear

**Expected Result:** ✅ PASS
- NO edit buttons anywhere
- NO delete buttons anywhere
- NO download/export functionality
- Calendar cells are pure display (no interaction)
- Check-in/check-out buttons are ONLY for TODAY (separate feature)

**Actual Result:** _________________

---

### TEST 7: Month Filtering
**Objective:** Verify month selector works correctly

**Steps:**
1. Login as any Employee
2. Navigate to Attendance page
3. Verify current month is selected by default
4. Change month selector to different months:
   - August 2026
   - September 2026
   - October 2026
5. Verify calendar updates with each selection
6. Verify only selected month's data is displayed
7. Change year selector (2025, 2026, 2027)
8. Verify data updates correctly

**Expected Result:** ✅ PASS
- Month selector changes displayed data
- Year selector changes displayed data
- Only selected month/year attendance shown
- No data leakage between months

**Actual Result:** _________________

---

### TEST 8: Empty Month Handling
**Objective:** Verify behavior when no attendance exists for selected month

**Steps:**
1. Login as any Employee
2. Navigate to Attendance page
3. Select a future month (e.g., December 2026) with no attendance data
4. Verify calendar displays
5. Verify empty cells shown (no fake data)

**Expected Result:** ✅ PASS
- Calendar renders with empty cells
- No "No data" error message (graceful handling)
- Monthly summary shows zeros
- No fake attendance data generated

**Actual Result:** _________________

---

### TEST 9: Monday Week-Off Display
**Objective:** Verify Monday is correctly shown as WEEK OFF

**Steps:**
1. Login as any Employee
2. Navigate to Attendance page
3. Select September 2026
4. Locate Mondays in the calendar (1st, 8th, 15th, 22nd, 29th)
5. Verify each Monday shows:
   - Status: WEEK OFF
   - Gray background
   - No check-in/check-out times (unless HR manually uploaded data)

**Expected Result:** ✅ PASS
- All Mondays labeled as WEEK OFF
- Visual styling different from working days
- Business rule correctly enforced

**Actual Result:** _________________

---

### TEST 10: Data Accuracy Verification
**Objective:** Verify attendance values exactly match HR upload

**Steps:**
1. Take note of EXACT values uploaded by HR:
   ```
   Employee: FCS-2026-0001
   Date: 2026-09-01
   Check In: 09:00
   Check Out: 18:00
   Status: PRESENT
   Working Hours: 9h 0m (calculated)
   ```

2. Login as that employee
3. Navigate to Attendance → September 2026
4. Locate September 1st
5. Compare displayed values with uploaded values:
   - Status matches ✅
   - Check In time matches ✅
   - Check Out time matches ✅
   - Working hours match ✅

6. Repeat for all uploaded dates

**Expected Result:** ✅ PASS
- All values EXACTLY match Excel upload
- No data loss
- No incorrect calculations
- Timezone handling correct (times in IST)

**Actual Result:** _________________

---

### TEST 11: Organization Isolation
**Objective:** Verify employees from different organizations cannot see each other's data

**Steps:**
_Note: This test requires multiple organizations in the system_

1. Login as Employee from Organization A
2. Navigate to Attendance
3. Note displayed data

4. Logout and login as Employee from Organization B
5. Navigate to Attendance
6. Verify ONLY Organization B data visible

7. Verify no Organization A data appears

**Expected Result:** ✅ PASS
- Organization A employee sees ONLY Org A data
- Organization B employee sees ONLY Org B data
- No cross-organization data leakage

**Actual Result:** _________________

---

### TEST 12: Backend Endpoint Security
**Objective:** Verify backend rejects unauthorized modifications

**Steps:**
1. Login as Employee (non-HR)
2. Open Browser Developer Tools
3. Try to call HR-only endpoints using fetch or cURL:
   ```javascript
   // Try to update attendance
   fetch('/api/v1/attendance/SOME_ID', {
     method: 'PATCH',
     headers: {
       'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       status: 'PRESENT',
       checkInTime: '2026-09-01T08:00:00Z'
     })
   });
   ```

4. Verify response

**Expected Result:** ✅ PASS
- Backend returns 403 Forbidden
- Error message: "Insufficient permissions" or similar
- No data modification occurs
- Role-based access control working

**Actual Result:** _________________

---

### TEST 13: Performance Check
**Objective:** Verify page loads quickly with attendance data

**Steps:**
1. HR uploads Excel with 30 days of attendance for 10 employees (300 records)
2. Login as any Employee
3. Navigate to Attendance
4. Measure page load time
5. Select different months
6. Measure response time

**Expected Result:** ✅ PASS
- Initial page load < 2 seconds
- Month change response < 1 second
- Calendar renders smoothly
- No lag or freezing

**Actual Result:** _________________

---

## 📊 TEST RESULTS SUMMARY

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | HR Excel Upload | ☐ PASS ☐ FAIL | |
| 2 | HR View Imported | ☐ PASS ☐ FAIL | |
| 3 | Employee A View Own | ☐ PASS ☐ FAIL | |
| 4 | Employee B View Own | ☐ PASS ☐ FAIL | |
| 5 | API Security | ☐ PASS ☐ FAIL | |
| 6 | Read-Only UI | ☐ PASS ☐ FAIL | |
| 7 | Month Filtering | ☐ PASS ☐ FAIL | |
| 8 | Empty Month | ☐ PASS ☐ FAIL | |
| 9 | Monday Week-Off | ☐ PASS ☐ FAIL | |
| 10 | Data Accuracy | ☐ PASS ☐ FAIL | |
| 11 | Org Isolation | ☐ PASS ☐ FAIL | |
| 12 | Backend Security | ☐ PASS ☐ FAIL | |
| 13 | Performance | ☐ PASS ☐ FAIL | |

**Overall Result:** ☐ PASS ☐ FAIL

---

## 🐛 ISSUE TRACKING

If any test fails, document the issue here:

### Issue 1
- **Test:** _______
- **Description:** _______
- **Steps to Reproduce:** _______
- **Expected:** _______
- **Actual:** _______
- **Screenshot/Logs:** _______

### Issue 2
- **Test:** _______
- **Description:** _______
- **Steps to Reproduce:** _______
- **Expected:** _______
- **Actual:** _______

---

## ✅ SIGN-OFF

**Tested By:** _________________  
**Date:** _________________  
**Environment:** ☐ Development ☐ Staging ☐ Production  
**Backend Version:** _________________  
**Frontend Version:** _________________  
**Database:** ☐ PostgreSQL ☐ MySQL ☐ SQLite  

**Final Status:** ☐ APPROVED ☐ REJECTED  
**Notes:** _________________

---

## 📞 SUPPORT

If you encounter issues during testing:
1. Check backend logs: `backend/` server console
2. Check frontend logs: Browser console (F12)
3. Check database: Verify `Attendance` table has records
4. Check authentication: Verify JWT token is valid
5. Review implementation doc: `EMPLOYEE_ATTENDANCE_VIEW_IMPLEMENTATION.md`

**End of Testing Guide**
