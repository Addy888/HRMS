# ATTENDANCE UI TEST SCRIPT

## Test Date: August 14, 2026

---

## PRE-TEST SETUP

### 1. Open Browser Developer Tools
- Press `F12` to open DevTools
- Navigate to **Console** tab
- Clear console: Right-click → "Clear console"
- Keep console open during testing

### 2. Check Backend is Running
```cmd
# Terminal 1 - Backend
cd backend
npm run start:dev
```

Look for:
```
[Nest] INFO [NestApplication] Nest application successfully started
```

### 3. Check Frontend is Running
```cmd
# Terminal 2 - Frontend
cd frontend
npm run dev
```

Look for:
```
- ready started server on 0.0.0.0:3000
```

### 4. Login as Employee
- Navigate to: `http://localhost:3000`
- Login with employee credentials
- Navigate to: **My Attendance** page

---

## TEST SEQUENCE

### TEST 1: INITIAL PAGE LOAD ✓

**Expected Console Logs:**
```
[ATTENDANCE-UI] Today's attendance response: { date: "...", attendance: null, canCheckIn: true, canCheckOut: false }
[ATTENDANCE-UI] Monthly attendance response: { month: 8, year: 2026, attendances: [...], summary: {...} }
[ATTENDANCE-UI] Processing attendances for calendar: X
```

**Expected UI:**
- Status: `NOT MARKED` (gray badge)
- Check In: `--:--`
- Check Out: `--:--`
- Working Hours: `--h --m`
- "Check In" button: **Enabled** (green)
- "Check Out" button: **Disabled** (gray)

**Backend Console (Optional):**
```
[ATTENDANCE-API] Today's attendance fetched: { employeeId: "...", date: "...", found: false, attendance: null }
```

**Checklist:**
- [ ] Console shows all expected logs
- [ ] UI shows "NOT MARKED" status
- [ ] All time fields show "--:--" or "--h --m"
- [ ] Check In button is enabled
- [ ] Check Out button is disabled

---

### TEST 2: CLICK CHECK-IN ✓

**Action:** Click the green "Check In" button

**Expected Console Logs (in order):**
```
[ATTENDANCE-UI] Check-in response: { success: true, message: "Checked in successfully", attendance: { id: "...", checkInTime: "...", status: "PRESENT" or "LATE", ... } }
[ATTENDANCE-UI] Check-in success, refetching data...
[ATTENDANCE-API] Check-in successful for employee: ...
[ATTENDANCE-API] Attendance record: { id: "...", date: "...", status: "...", checkInTime: "...", checkOutTime: null, workingHours: 0 }
[ATTENDANCE-API] Today's attendance fetched: { employeeId: "...", date: "...", found: true, attendance: {...} }
[ATTENDANCE-UI] Today's attendance response: { date: "...", attendance: { checkInTime: "...", status: "...", ... }, canCheckIn: false, canCheckOut: true }
[ATTENDANCE-UI] Data refetch complete
[ATTENDANCE-UI] Today's attendance state: { status: "PRESENT", checkInTime: "...", checkOutTime: null, workingHours: 0, formattedCheckIn: "09:30 AM", formattedCheckOut: "--:--", formattedWorkingHours: "--h --m" }
```

**Expected UI Changes:**
- Status: Changes to `PRESENT` (green) or `LATE` (amber)
  - If check-in time > 10:10 AM: Status = `LATE` with "Late by X minutes"
  - If check-in time ≤ 10:10 AM: Status = `PRESENT`
- Check In: Shows actual time (e.g., `09:30 AM`)
- Check Out: Still `--:--`
- Working Hours: Still `--h --m`
- "Check In" button: **Disabled** (gray) - text changes to "Checked In"
- "Check Out" button: **Enabled** (blue)
- Success message: Green box with ✓ "Checked in successfully!"

**Backend Console:**
```
[ATTENDANCE-CHECKIN] START
[ATTENDANCE-CHECKIN] organizationId: xxx-xxx-xxx
[ATTENDANCE-CHECKIN] employeeId: xxx-xxx-xxx
[ATTENDANCE-CHECKIN] businessDate: 2026-08-14T00:00:00.000Z
[ATTENDANCE-CHECKIN] NO existing record found
[ATTENDANCE-CHECKIN] DB OPERATION: CREATE
[ATTENDANCE-CHECKIN] SUCCESS - Created record xxx-xxx-xxx
[ATTENDANCE-API] Check-in successful for employee: xxx-xxx-xxx
[ATTENDANCE-API] Attendance record: {"id":"...","date":"2026-08-14T00:00:00.000Z","status":"PRESENT","checkInTime":"2026-08-14T04:00:00.000Z","checkOutTime":null,"workingHours":0}
[ATTENDANCE-API] Today's attendance fetched: {"employeeId":"...","date":"2026-08-14T00:00:00.000Z","found":true,"attendance":{...}}
```

**Checklist:**
- [ ] Console shows check-in response with attendance object
- [ ] Console shows refetch logs
- [ ] Console shows today's attendance state with formatted times
- [ ] Status badge changes to PRESENT or LATE
- [ ] Check In time displays (not "--:--")
- [ ] Check Out still "--:--"
- [ ] Working Hours still "--h --m"
- [ ] Check In button disabled
- [ ] Check Out button enabled
- [ ] Success message appears

**If Status is LATE:**
- [ ] Badge shows "LATE" in amber
- [ ] Shows "Late by X minutes" below badge

---

### TEST 3: VERIFY CALENDAR UPDATE ✓

**Action:** Scroll down to "Monthly Calendar" section

**Expected Console Logs:**
```
[ATTENDANCE-UI] Monthly attendance response: { month: 8, year: 2026, attendances: [...], summary: {...} }
[ATTENDANCE-UI] Processing attendances for calendar: X
[ATTENDANCE-UI] Calendar mapping: { dbDate: "2026-08-14T00:00:00.000Z", calendarDate: "2026-08-14", status: "PRESENT", checkInTime: "...", checkOutTime: null, workingHours: 0 }
[ATTENDANCE-UI] Attendance map size: X
```

**Expected Calendar Cell (14 August):**
```
┌─────────────────────┐
│ 14                  │  ← Date number (larger font)
│ PRESENT             │  ← Status in GREEN (or LATE in AMBER)
│ IN: 09:30 AM        │  ← Check-in time in small gray text
│                     │
└─────────────────────┘
```
- Cell has **blue border** (indicates today)
- Cell background has **status color tint** (green for PRESENT, amber for LATE)
- Date number is at top
- Status badge below date
- Check-in time below status
- No check-out time (not checked out yet)
- No working hours (not checked out yet)

**Checklist:**
- [ ] Calendar cell for today (14) has blue border
- [ ] Cell shows date number "14"
- [ ] Cell shows status "PRESENT" or "LATE"
- [ ] Cell shows "IN: 09:30 AM" (or actual time)
- [ ] Cell does NOT show check-out time yet
- [ ] Cell does NOT show working hours yet
- [ ] Cell has colored background matching status

---

### TEST 4: BROWSER REFRESH ✓

**Action:** Press `F5` to refresh the browser page

**Expected Console Logs:**
```
[ATTENDANCE-UI] Today's attendance response: { date: "...", attendance: { checkInTime: "...", status: "PRESENT", ... }, canCheckIn: false, canCheckOut: true }
[ATTENDANCE-UI] Monthly attendance response: { month: 8, year: 2026, attendances: [...], summary: {...} }
[ATTENDANCE-UI] Today's attendance state: { status: "PRESENT", checkInTime: "...", formattedCheckIn: "09:30 AM", ... }
```

**Expected UI:**
- Everything persists after refresh
- Status: Still `PRESENT` or `LATE`
- Check In: Still shows time (e.g., `09:30 AM`)
- Check Out: Still `--:--`
- Working Hours: Still `--h --m`
- Buttons: Same state (Check In disabled, Check Out enabled)
- Calendar: Still shows attendance data

**Checklist:**
- [ ] Console shows data refetch on page load
- [ ] All attendance data persists
- [ ] Status badge unchanged
- [ ] Check-in time unchanged
- [ ] Button states preserved
- [ ] Calendar cell unchanged
- [ ] NO "NOT MARKED" displayed

---

### TEST 5: CLICK CHECK-OUT ✓

**Action:** Click the blue "Check Out" button

**Expected Console Logs:**
```
[ATTENDANCE-UI] Check-out response: { success: true, message: "Checked out successfully", attendance: { checkInTime: "...", checkOutTime: "...", workingHours: 9.5, status: "PRESENT" or "HALF_DAY", ... } }
[ATTENDANCE-UI] Check-out success, refetching data...
[ATTENDANCE-API] Today's attendance fetched: { ..., attendance: { checkInTime: "...", checkOutTime: "...", workingHours: 9.5, ... } }
[ATTENDANCE-UI] Today's attendance response: { ..., canCheckIn: false, canCheckOut: false }
[ATTENDANCE-UI] Data refetch complete
[ATTENDANCE-UI] Today's attendance state: { ..., formattedCheckIn: "09:30 AM", formattedCheckOut: "07:00 PM", formattedWorkingHours: "09h 30m" }
```

**Expected UI Changes:**
- Status: 
  - If checkout time ≥ 7:00 PM: Remains `PRESENT` (green)
  - If checkout time < 7:00 PM: Changes to `HALF_DAY` (blue)
- Check In: Unchanged (e.g., `09:30 AM`)
- Check Out: Shows actual time (e.g., `07:00 PM`)
- Working Hours: Shows calculated hours (e.g., `09h 30m`)
- "Check In" button: **Disabled** (gray)
- "Check Out" button: **Disabled** (gray) - text changes to "Checked Out"
- Success message: Blue box with ✓ "Checked out successfully!"

**Backend Console:**
```
[ATTENDANCE-CHECKOUT] ... (if logging added)
```

**Checklist:**
- [ ] Console shows check-out response
- [ ] Console shows updated attendance with workingHours
- [ ] Status remains PRESENT (if checkout ≥ 7 PM) or changes to HALF_DAY (if < 7 PM)
- [ ] Check Out time displays (not "--:--")
- [ ] Working Hours displays (not "--h --m")
- [ ] Both buttons disabled
- [ ] Success message appears

---

### TEST 6: VERIFY CALENDAR AFTER CHECK-OUT ✓

**Action:** Scroll to "Monthly Calendar" section

**Expected Console Logs:**
```
[ATTENDANCE-UI] Monthly attendance response: { ..., attendances: [ { date: "2026-08-14...", checkInTime: "...", checkOutTime: "...", workingHours: 9.5, ... } ] }
[ATTENDANCE-UI] Calendar mapping: { dbDate: "...", calendarDate: "2026-08-14", status: "PRESENT", checkInTime: "...", checkOutTime: "...", workingHours: 9.5 }
```

**Expected Calendar Cell (14 August):**
```
┌─────────────────────┐
│ 14                  │  ← Date number
│ PRESENT             │  ← Status badge (or HALF_DAY)
│ IN: 09:30 AM        │  ← Check-in time
│ OUT: 07:00 PM       │  ← Check-out time (NEW)
│ 09h 30m             │  ← Working hours (NEW)
└─────────────────────┘
```

**Checklist:**
- [ ] Calendar cell shows status
- [ ] Cell shows "IN: 09:30 AM"
- [ ] Cell shows "OUT: 07:00 PM" (NEW)
- [ ] Cell shows "09h 30m" (NEW)
- [ ] Cell still has blue border (today)
- [ ] All data visible in small font

---

### TEST 7: FINAL BROWSER REFRESH ✓

**Action:** Press `F5` one more time

**Expected UI:**
- Everything persists after refresh
- Status: `PRESENT` or `HALF_DAY`
- Check In: Shows time
- Check Out: Shows time
- Working Hours: Shows hours
- Both buttons: Disabled
- Calendar: Shows complete attendance data

**Checklist:**
- [ ] All data persists after refresh
- [ ] Status badge correct
- [ ] Check-in time visible
- [ ] Check-out time visible
- [ ] Working hours visible
- [ ] Both buttons disabled
- [ ] Calendar cell complete

---

### TEST 8: DATABASE VERIFICATION ✓

**Action:** Query the database directly

**Method 1: Using Database GUI (e.g., Prisma Studio)**
```bash
cd backend
npx prisma studio
```
- Navigate to "Attendance" table
- Filter by today's date (2026-08-14)
- Find your employee record

**Method 2: Using Database Client**
```sql
SELECT 
  "id",
  "employeeId",
  "date",
  "status",
  "checkInTime",
  "checkOutTime",
  "workingHours",
  "lateBy",
  "createdAt",
  "updatedAt"
FROM "Attendance"
WHERE "date" = '2026-08-14'
  AND "employeeId" = 'YOUR_EMPLOYEE_ID'
ORDER BY "createdAt" DESC;
```

**Expected Result:**
- **Exactly 1 row** returned (not 2, not 0)
- `date`: `2026-08-14T00:00:00.000Z`
- `status`: `PRESENT` or `LATE` or `HALF_DAY`
- `checkInTime`: NOT NULL (e.g., `2026-08-14T04:00:00.000Z`)
- `checkOutTime`: NOT NULL (e.g., `2026-08-14T13:30:00.000Z`)
- `workingHours`: Number > 0 (e.g., `9.5`)
- `lateBy`: 0 if on time, > 0 if late
- `createdAt` ≈ `updatedAt` (if checked in and out same session)

**Checklist:**
- [ ] Exactly 1 attendance record exists
- [ ] Date is correct (2026-08-14)
- [ ] Status is correct
- [ ] checkInTime is NOT NULL
- [ ] checkOutTime is NOT NULL
- [ ] workingHours is calculated correctly
- [ ] No duplicate records

---

## TROUBLESHOOTING GUIDE

### Issue 1: UI Shows "NOT MARKED" After Check-In

**Symptoms:**
- Click "Check In" button
- Success message appears
- But UI still shows "NOT MARKED", "--:--", "--:--", "--h --m"

**Check Console for:**
```
[ATTENDANCE-UI] Check-in response: { ... }
```
- Does it contain `attendance` object?
- Does `attendance.checkInTime` exist?

```
[ATTENDANCE-UI] Today's attendance response: { ... }
```
- Is `attendance` null or populated?
- Does it contain `checkInTime`?

```
[ATTENDANCE-UI] Today's attendance state: { ... }
```
- What is `formattedCheckIn`?
- Is it "--:--" or actual time?

**Possible Causes:**
1. **Backend didn't save:** Check backend logs for errors
2. **Wrong business date:** Check date normalization
3. **Refetch failed:** Check network tab for failed requests
4. **Timezone issue:** Check if times are being formatted correctly

**Fix:**
- Check backend logs for `[ATTENDANCE-CHECKIN]` errors
- Verify database has the record
- Ensure refetch completes before checking UI

---

### Issue 2: Calendar Shows Date Only, No Status/Times

**Symptoms:**
- Calendar cells show date number "14"
- But no status badge
- No check-in/check-out times
- No working hours

**Check Console for:**
```
[ATTENDANCE-UI] Monthly attendance response: { attendances: [...] }
```
- Is `attendances` array empty?
- Do records have `checkInTime`, `checkOutTime`, `workingHours`?

```
[ATTENDANCE-UI] Calendar mapping: { ... }
```
- Is `calendarDate` correct (should be "2026-08-14")?
- Do mapped records have all fields?

**Possible Causes:**
1. **Monthly API returns empty:** No attendance records for the month
2. **Date mapping issue:** `getAttendanceCalendarDate()` returns wrong date
3. **Field names mismatch:** Frontend expects different field names

**Fix:**
- Verify monthly API returns data
- Check date conversion is correct
- Verify field names match between backend and frontend

---

### Issue 3: Check-Out Time Shows "--:--" After Check-Out

**Symptoms:**
- Click "Check Out" button
- Success message appears
- But Check Out field still shows "--:--"
- Working Hours still shows "--h --m"

**Check Console for:**
```
[ATTENDANCE-UI] Check-out response: { attendance: { checkOutTime: "...", workingHours: ... } }
```
- Does response contain `checkOutTime`?
- Does response contain `workingHours`?

```
[ATTENDANCE-UI] Today's attendance state: { formattedCheckOut: "...", formattedWorkingHours: "..." }
```
- What are the formatted values?

**Possible Causes:**
1. **Backend didn't update:** Check-out not saved to database
2. **Refetch failed:** Today's data not refreshed
3. **Formatting issue:** Time/hours not formatted correctly

**Fix:**
- Check database for `checkOutTime` value
- Ensure refetch completes
- Verify `formatAttendanceTime()` and `formatWorkingHours()` work correctly

---

### Issue 4: Multiple Attendance Records Created

**Symptoms:**
- Database query returns 2 or more records for same date
- UI might show duplicate data or errors

**Check Database:**
```sql
SELECT * FROM "Attendance"
WHERE "date" = '2026-08-14'
  AND "employeeId" = 'YOUR_ID'
ORDER BY "createdAt";
```

**Check Backend Logs for:**
```
[ATTENDANCE-CHECKIN] P2002 race detected
```

**Possible Causes:**
1. **Unique constraint missing:** Should not happen (constraint exists)
2. **Race condition:** Multiple simultaneous check-in requests
3. **Date normalization issue:** Different date values used

**Fix:**
- Should be handled by P2002 recovery logic
- If persists, check unique constraint exists
- Check all date calculations use same utility

---

## SUCCESS CRITERIA ✅

The implementation is **COMPLETE** when:

### Today's Attendance Card
- [ ] Status shows: `PRESENT` or `LATE` (not "NOT MARKED")
- [ ] Check In shows: `09:30 AM` (actual time, not "--:--")
- [ ] Check Out shows: `07:00 PM` after checkout (not "--:--")
- [ ] Working Hours shows: `09h 30m` after checkout (not "--h --m")
- [ ] Buttons are in correct state (disabled after use)

### Monthly Calendar
- [ ] Today's cell (14) has blue border
- [ ] Cell shows status badge
- [ ] Cell shows "IN: 09:30 AM"
- [ ] Cell shows "OUT: 07:00 PM" after checkout
- [ ] Cell shows "09h 30m" after checkout

### Console Logs
- [ ] All `[ATTENDANCE-UI]` logs appear
- [ ] All `[ATTENDANCE-API]` logs appear (backend)
- [ ] No errors in console
- [ ] Data flow is traceable

### Database
- [ ] Exactly 1 record per day
- [ ] All fields populated correctly
- [ ] No duplicate records

### After Browser Refresh
- [ ] All data persists
- [ ] No data loss
- [ ] UI remains correct

---

## REPORTING RESULTS

After completing all tests, report:

1. **Which tests passed** (✓)
2. **Which tests failed** (✗)
3. **Console logs** (screenshots or copy/paste)
4. **Screenshots** of UI
5. **Database query results**
6. **Any errors** encountered

**Format:**
```
TEST RESULTS - August 14, 2026

✓ Test 1: Initial Page Load - PASSED
✓ Test 2: Click Check-In - PASSED
✗ Test 3: Calendar Update - FAILED (no times showing)

Console Logs:
[paste relevant logs]

Screenshots:
[attach screenshots]

Database:
[paste query results]

Issues:
- Calendar cells show status but not times
- Console shows: [describe what you see]
```

---

## DONE! 🎉

You now have a complete test script to verify the attendance UI implementation!
