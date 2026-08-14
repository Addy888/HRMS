# ATTENDANCE TESTING GUIDE

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm run start:dev
```

Wait for: `Nest application successfully started`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

Open: `http://localhost:3000`

---

## 🧪 TEST SEQUENCE

### TEST 1: First Check-In (09:30 AM)

**Steps:**
1. Login as employee
2. Navigate to `/employee/attendance`
3. Click "Check In" button

**Expected Results:**
- ✅ Status shows: "PRESENT"
- ✅ Check In time shows: "09:30 AM" (or current IST time)
- ✅ Check Out shows: "--:--"
- ✅ Working Hours shows: "--h --m"
- ✅ Check In button disabled, shows "Checked In"
- ✅ Check Out button enabled

**Backend Logs to Check:**
```
[ATTENDANCE-DATE] Current server timestamp: ...
[ATTENDANCE-DATE] Asia/Kolkata calendar date: 2026-08-14
[ATTENDANCE-DATE] Canonical DB date: 2026-08-13T18:30:00.000Z
[ATTENDANCE-CHECKIN] START
[ATTENDANCE-CHECKIN] businessDate: 2026-08-13T18:30:00.000Z
[ATTENDANCE-CHECKIN] NO existing record found
[ATTENDANCE-CHECKIN] DB OPERATION: CREATE
[ATTENDANCE-CHECKIN] SUCCESS - Created record
```

---

### TEST 2: Duplicate Check-In

**Steps:**
1. Click "Check In" button again (should be disabled)
2. Or try via API: `POST /attendance/check-in`

**Expected Results:**
- ✅ Button is disabled (cannot click)
- ✅ If forced via API: 400 error
- ✅ Error message: "You have already checked in today"
- ✅ No duplicate attendance row created

**Backend Logs:**
```
[ATTENDANCE-CHECKIN] FOUND existing record
[ATTENDANCE-CHECKIN] existingCheckIn: 2026-08-14T04:00:00.000Z
[ATTENDANCE-CHECKIN] DUPLICATE - Already checked in
```

---

### TEST 3: Page Reload

**Steps:**
1. Refresh the page (F5 or Ctrl+R)
2. Wait for page to load

**Expected Results:**
- ✅ Status still shows: "PRESENT"
- ✅ Check In time preserved: "09:30 AM"
- ✅ Check In button still disabled
- ✅ Check Out button still enabled
- ✅ Data fetched from backend (not local state)

---

### TEST 4: Calendar Display

**Steps:**
1. Scroll down to "Monthly Calendar"
2. Check today's date cell

**Expected Results:**
- ✅ Today's date has blue border
- ✅ Cell shows status: "PRESENT"
- ✅ Cell has green background (emerald)
- ✅ Correct date marked (e.g., if today is 14 August, cell "14" is marked)

**Common Issue:**
- If DB date is `2026-08-13T18:30:00.000Z` (represents 14 Aug IST)
- Calendar should mark **14 August**, not 13 August
- Verify with console: `console.log(getAttendanceCalendarDate('2026-08-13T18:30:00.000Z'))` → Should be `"2026-08-14"`

---

### TEST 5: Check-Out Early (Half Day)

**Steps:**
1. Wait a few minutes (or manually set time to afternoon)
2. Click "Check Out" button
3. Confirm time is BEFORE 7 PM

**Expected Results:**
- ✅ Status changes to: "HALF DAY"
- ✅ Check Out time shows: Current IST time (e.g., "02:30 PM")
- ✅ Working Hours calculated: e.g., "05h 00m"
- ✅ Check Out button disabled, shows "Checked Out"
- ✅ Calendar cell updates to blue (HALF_DAY color)

**Backend Logs:**
```
[ATTENDANCE-CHECKOUT] Early checkout detected - Status: HALF_DAY
```

---

### TEST 6: Check-Out at 7 PM (Full Day)

**Setup:**
- Need to test at exactly 7 PM or later
- Or modify office hours in shift config

**Steps:**
1. Check in (if not already)
2. Wait until 7:00 PM IST or later
3. Click "Check Out"

**Expected Results:**
- ✅ Status remains: "PRESENT" (not HALF_DAY)
- ✅ Check Out time: "07:00 PM" or later
- ✅ Working Hours: e.g., "09h 30m" if checked in at 9:30 AM
- ✅ Calendar cell remains green (PRESENT)

---

### TEST 7: Late Check-In

**Setup:**
- Need to check in after 10:10 AM
- Office hours: 09:00 AM + 10 min grace = 10:10 AM

**Steps:**
1. Ensure time is after 10:10 AM IST
2. Click "Check In"

**Expected Results:**
- ✅ Status shows: "LATE"
- ✅ Badge color: Amber/Orange
- ✅ Shows: "Late by X minutes"
- ✅ Calendar cell shows: "LATE" with amber background

**Test Times:**
- 10:05 AM → PRESENT ✅
- 10:10 AM → PRESENT ✅
- 10:11 AM → LATE ✅
- 11:30 AM → LATE ✅

---

### TEST 8: Automatic 7 PM Checkout

**Setup:**
- Check in during the day
- Do NOT check out manually
- Wait until after 7 PM IST
- Wait for next hour (scheduler runs every hour)

**Expected Results:**
- ✅ Attendance automatically updated
- ✅ Check Out time set to: "07:00 PM"
- ✅ Working Hours calculated
- ✅ Status: PRESENT (full day)

**Backend Logs:**
```
[AUTO-CHECKOUT] Running at IST: 14/08/2026, 20:00:00
[AUTO-CHECKOUT] Found X pending checkouts
[AUTO-CHECKOUT] ✅ Checked out employee EMP001 - Working hours: 9.50h
[AUTO-CHECKOUT] Completed - Success: X, Errors: 0
```

**Manual Trigger (for testing):**
Can create a test endpoint:
```typescript
@Get('test/auto-checkout')
async testAutoCheckout() {
  return await this.schedulerService.triggerAutoCheckoutManually();
}
```

---

### TEST 9: Month Navigation

**Steps:**
1. Change month selector to previous month
2. Change year selector
3. Verify calendar updates

**Expected Results:**
- ✅ Calendar shows correct month
- ✅ Attendance data fetches for selected month
- ✅ Historical attendance displayed correctly
- ✅ Status colors correct

---

### TEST 10: Database Verification

**PostgreSQL Query:**
```sql
-- Check today's attendance
SELECT 
  id, 
  "employeeId", 
  date,
  status,
  "checkInTime", 
  "checkOutTime",
  "workingHours",
  "lateBy"
FROM "Attendance"
WHERE date = '2026-08-13T18:30:00.000Z'  -- Adjust to current date
ORDER BY "checkInTime" DESC;
```

**Expected:**
- ✅ One row per employee per date
- ✅ No duplicate rows (unique constraint works)
- ✅ `date` field has canonical value
- ✅ `checkInTime` and `checkOutTime` have actual timestamps
- ✅ `workingHours` is decimal (e.g., 9.5)
- ✅ `status` is correct (PRESENT, LATE, HALF_DAY)

---

## 🔍 DEBUGGING

### Issue: Calendar Not Showing Attendance

**Check:**
1. Open browser console
2. Look for API call: `/attendance/my/monthly?month=8&year=2026`
3. Check response has `attendances` array
4. Check each attendance has `date` field
5. Verify `getAttendanceCalendarDate()` function exists

**Console Test:**
```javascript
import { getAttendanceCalendarDate } from '@/lib/timezone-utils';
console.log(getAttendanceCalendarDate('2026-08-13T18:30:00.000Z'));
// Should output: "2026-08-14" (for 14 Aug IST)
```

---

### Issue: Wrong Calendar Date Marked

**Problem:**
- DB has `2026-08-13T18:30:00.000Z`
- But calendar marks 13 August instead of 14 August

**Solution:**
- Check `date-fns-tz` is installed
- Verify import: `import { getAttendanceCalendarDate } from '@/lib/timezone-utils'`
- Check usage in calendar render: `getAttendanceCalendarDate(a.date)`

---

### Issue: Times Showing Wrong

**Problem:**
- Check-in at 9:30 AM IST
- UI shows different time

**Solution:**
- Check `formatAttendanceTime()` function
- Verify `date-fns-tz` import
- Check timezone: Should be `'Asia/Kolkata'`
- Browser timezone should NOT be used

---

### Issue: Buttons Not Updating

**Problem:**
- Check in successful
- Button still shows "Check In" (not disabled)

**Solution:**
- Check `refetchToday()` is called after mutation
- Verify mutation `onSuccess` callback
- Check `canCheckIn` and `canCheckOut` from API response
- Force refetch: Open DevTools → React Query → Invalidate `attendance-today`

---

### Issue: Late Status Wrong

**Problem:**
- Check in at 10:11 AM
- Shows PRESENT instead of LATE

**Solution:**
- Check shift configuration in database:
  ```sql
  SELECT * FROM "Shift" WHERE id = 'shift-id';
  ```
- Verify:
  - `startTime = "09:00"`
  - `graceTime = 10`
  - `lateMarkAfter = 15`
- Check backend logs for `[ATTENDANCE-DATE]` - verify IST conversion

---

### Issue: Automatic Checkout Not Working

**Problem:**
- Past 7 PM but not checked out automatically

**Checks:**
1. Verify `ScheduleModule` in `app.module.ts`
2. Check `@nestjs/schedule` installed
3. Check backend logs for `[AUTO-CHECKOUT]`
4. Verify current server time is past 7 PM IST:
   ```javascript
   console.log(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
   ```
5. Check cron expression: `"0 * * * *"` (every hour)

**Manual Test:**
- Add test endpoint to trigger manually
- Call endpoint after 7 PM
- Check logs

---

## 📊 SUCCESS CRITERIA

### All Tests Must Pass:

- ✅ Check-in creates attendance record
- ✅ Check-in time displays correctly in IST
- ✅ Duplicate check-in blocked
- ✅ Page reload preserves data
- ✅ Calendar shows attendance on correct date
- ✅ Calendar date mapping correct (DB date → IST calendar date)
- ✅ Check-out updates attendance
- ✅ Check-out time displays correctly
- ✅ Working hours calculated correctly
- ✅ Half-day rule works (checkout before 7 PM)
- ✅ Late rule works (after 10:10 AM)
- ✅ Automatic 7 PM checkout works
- ✅ No duplicate rows in database
- ✅ Buttons update correctly
- ✅ Month navigation works
- ✅ Summary statistics correct

---

## 🎯 PERFORMANCE CHECKS

### Load Times:
- Today's attendance: < 500ms
- Monthly calendar: < 1s
- Check-in/out API: < 300ms

### Browser Console:
- No errors
- No warnings about timezone
- React Query cache working

### Backend Logs:
- No P2002 errors
- No date normalization errors
- Scheduler runs successfully

---

## 📝 TEST REPORT TEMPLATE

```markdown
## Attendance Testing Report

**Date:** August 14, 2026
**Tester:** [Your Name]
**Environment:** Local Development

### Test Results:

| Test Case | Status | Notes |
|-----------|--------|-------|
| Check-in (9:30 AM) | ✅ PASS | Status: PRESENT |
| Duplicate Check-in | ✅ PASS | Error displayed |
| Page Reload | ✅ PASS | Data preserved |
| Calendar Display | ✅ PASS | Correct date marked |
| Check-out Early | ✅ PASS | Status: HALF_DAY |
| Check-out at 7 PM | ✅ PASS | Status: PRESENT |
| Late Check-in | ✅ PASS | Status: LATE |
| Auto Checkout | ⚠️ PENDING | Need to wait until 7 PM |
| Month Navigation | ✅ PASS | Data loads correctly |
| Database Check | ✅ PASS | No duplicates |

### Issues Found:
[List any issues]

### Overall Status:
- ✅ READY FOR PRODUCTION
- ⚠️ NEEDS FIXES
- ❌ CRITICAL ISSUES

### Recommendations:
[Any suggestions]
```

---

**Happy Testing!** 🚀
