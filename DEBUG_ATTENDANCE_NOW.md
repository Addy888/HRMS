# DEBUG ATTENDANCE ISSUE - EXECUTE NOW

## The implementation has comprehensive logging. Now we need to SEE the actual data flow.

---

## STEP 1: CHECK DATABASE DIRECTLY

Open your database client (Prisma Studio or SQL client) and run:

```sql
-- Find today's attendance for your employee
SELECT 
  a."id",
  a."organizationId",
  a."employeeId",
  a."date",
  a."checkInTime",
  a."checkOutTime",
  a."status",
  a."workingHours",
  a."lateBy",
  a."createdAt",
  a."updatedAt",
  e."firstName",
  e."lastName",
  e."employeeId" as "employeeCode"
FROM "Attendance" a
JOIN "Employee" e ON a."employeeId" = e."id"
WHERE a."date" >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY a."date" DESC, a."createdAt" DESC
LIMIT 10;
```

**Record the results here:**
- Does a record exist for today (2026-08-14)?
- What is the `checkInTime` value?
- What is the `checkOutTime` value?
- What is the `status`?
- What is the exact `date` value?

---

## STEP 2: FIND YOUR EMPLOYEE ID

```sql
-- Find the employee record for the logged-in user
SELECT 
  e."id" as "employeeId",
  e."userId",
  e."employeeId" as "employeeCode",
  e."firstName",
  e."lastName",
  e."organizationId",
  u."email"
FROM "Employee" e
JOIN "User" u ON e."userId" = u."id"
WHERE u."email" = 'YOUR_LOGIN_EMAIL_HERE';  -- Replace with your actual email
```

**Record:**
- Employee ID (UUID):
- Organization ID:
- User ID:

---

## STEP 3: CHECK IF ATTENDANCE EXISTS FOR YOUR EMPLOYEE

```sql
-- Use the employee ID from Step 2
SELECT *
FROM "Attendance"
WHERE "employeeId" = 'PASTE_EMPLOYEE_ID_HERE'  -- From Step 2
  AND "date" >= '2026-08-13'
ORDER BY "date" DESC;
```

**If NO ROWS:** Attendance was never created
**If ROWS EXIST:** Copy the complete row data

---

## STEP 4: START BACKEND AND CHECK LOGS

Terminal 1:
```cmd
cd backend
npm run start:dev
```

Watch for startup logs. Once started, look for any attendance-related logs.

---

## STEP 5: START FRONTEND

Terminal 2:
```cmd
cd frontend
npm run dev
```

---

## STEP 6: OPEN BROWSER AND LOGIN

1. Navigate to `http://localhost:3000`
2. Login as the employee
3. Navigate to **My Attendance** page
4. Open Developer Tools (F12)
5. Go to Console tab
6. Clear console
7. Reload page (F5)

---

## STEP 7: COLLECT LOGS

### A. Backend Terminal Logs

Look for these specific logs and copy them:

```
[ATTENDANCE-API] Today's attendance fetched: { ... }
[ATTENDANCE-API] Returning response: { ... }
```

**Copy the complete output here:**

### B. Browser Console Logs

Look for these specific logs and copy them:

```
[ATTENDANCE-UI] Today's attendance response: { ... }
[ATTENDANCE-UI] ===== BUTTON STATE DEBUG =====
[ATTENDANCE-UI] todayData raw: { ... }
[ATTENDANCE-UI] attendance object: { ... }
[ATTENDANCE-UI] canCheckIn from backend: ...
[ATTENDANCE-UI] canCheckOut from backend: ...
```

**Copy the complete output here:**

---

## STEP 8: CHECK NETWORK TAB

In Browser Developer Tools:
1. Go to **Network** tab
2. Clear network log
3. Reload page (F5)
4. Find the request to `/attendance/my/today`
5. Click on it
6. Go to **Response** tab

**Copy the EXACT JSON response:**

```json
{
  // Paste actual response here
}
```

---

## STEP 9: ANALYZE THE DATA

Compare these three sources:

| Source | Has Attendance? | checkInTime | status | canCheckOut |
|--------|----------------|-------------|--------|-------------|
| Database (Step 1) | | | | N/A |
| Backend API Log | | | | |
| Network Response | | | | |
| Frontend State | | | | |

---

## STEP 10: IDENTIFY THE BREAK POINT

The data is lost at one of these points:

### Scenario A: No Database Record
**Database:** No attendance record exists
**Fix:** Check why check-in didn't create the record

### Scenario B: Backend Can't Find It
**Database:** Record exists
**Backend Log:** `found: false`
**Fix:** Date normalization mismatch - backend is querying wrong date

### Scenario C: Backend Finds But Returns Null
**Backend Log:** `found: true, attendance: {...}`
**Network Response:** `attendance: null`
**Fix:** Serialization issue in controller

### Scenario D: Frontend Receives Null
**Network Response:** `attendance: {...}`
**Frontend State:** `attendance: null`
**Fix:** Response parsing issue

### Scenario E: Frontend Has Data But UI Shows Wrong
**Frontend State:** `attendance: {...}`
**UI:** Shows "NOT MARKED"
**Fix:** UI rendering logic

---

## STEP 11: BASED ON SCENARIO, APPLY FIX

### Fix for Scenario B (Date Mismatch)

**Check backend log for date being queried:**
```
[ATTENDANCE-API] date: "2026-08-13T18:30:00.000Z"
```

**But database has:**
```
date: "2026-08-14T00:00:00.000Z"
```

**This is a date normalization mismatch!**

The backend `getAttendanceBusinessDate()` might be returning the wrong date.

**Verify the date util:**

```typescript
// backend/src/modules/attendance/utils/attendance-date.util.ts
export function getAttendanceBusinessDate(timestamp?: Date): Date {
  const tz = 'Asia/Kolkata';
  const now = timestamp || new Date();
  
  // Convert to IST
  const istDate = toZonedTime(now, tz);
  
  // Get the calendar date (year, month, day)
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  
  // Create a Date object at midnight UTC for this IST calendar date
  // This represents the "business date" for attendance
  const businessDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  return businessDate;
}
```

**The function MUST return the same date value for:**
- Check-in creation
- Check-out update
- Today's attendance query
- Monthly attendance query

### Fix for Scenario C (Backend Returns Null)

Check the controller:

```typescript
const attendance = await this.prisma.attendance.findFirst({
  where: {
    employeeId: employee.id,
    date: businessDate,
  },
  include: {
    shift: true,
  },
});

return {
  date: businessDate,
  attendance,  // Make sure this is not being transformed
  canCheckIn: !attendance || !attendance.checkInTime,
  canCheckOut: attendance && attendance.checkInTime && !attendance.checkOutTime,
};
```

### Fix for Scenario D (Frontend Parsing Issue)

Check if there's an API interceptor transforming the response:

```typescript
// frontend/src/lib/api.ts or similar
// Look for response interceptors that might be changing the structure
```

---

## STEP 12: EMERGENCY QUICK TEST

If you can't find the issue, try this direct database check:

```sql
-- Get today's business date
SELECT 
  CURRENT_DATE as today_utc,
  (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date as today_ist,
  DATE(TIMEZONE('Asia/Kolkata', CURRENT_TIMESTAMP)) as today_ist_alt;

-- Check what date format the Attendance table is using
SELECT DISTINCT
  "date",
  "date"::text as date_text,
  EXTRACT(EPOCH FROM "date") as epoch
FROM "Attendance"
WHERE "date" >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY "date" DESC;
```

---

## STEP 13: TEST CREATING NEW ATTENDANCE

If the issue is date-related, test creating a new attendance record manually:

```sql
-- ONLY USE THIS FOR TESTING - DO NOT USE IN PRODUCTION
INSERT INTO "Attendance" (
  "id",
  "organizationId",
  "employeeId",
  "date",
  "checkInTime",
  "status",
  "source",
  "isManualEntry",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'YOUR_ORG_ID',  -- From Step 2
  'YOUR_EMPLOYEE_ID',  -- From Step 2
  '2026-08-14'::date,  -- Today's date
  '2026-08-14 10:00:00+05:30'::timestamptz,  -- 10 AM IST
  'PRESENT',
  'MANUAL',
  true,
  NOW(),
  NOW()
);
```

Then reload the page and see if it appears.

---

## STEP 14: COLLECT ALL DATA AND REPORT

After running Steps 1-13, you should have:

1. ✓ Database query results
2. ✓ Employee ID
3. ✓ Backend logs
4. ✓ Browser console logs
5. ✓ Network response
6. ✓ Identified break point

**Report this complete information so we can identify the exact issue.**

---

## MOST LIKELY ISSUES

Based on the symptoms, the most likely issues are:

### Issue 1: Date Normalization Mismatch (80% likely)
- Backend queries for `2026-08-13T18:30:00.000Z`
- But database has `2026-08-14T00:00:00.000Z`
- These don't match because of timezone conversion
- Fix: Ensure all date normalization uses the same function

### Issue 2: Wrong Employee ID (15% likely)
- Backend is querying for a different employee
- Check if `req.user.id` maps to the correct employee record
- Fix: Log the employee ID being used in the query

### Issue 3: Missing Include (3% likely)
- Query succeeds but response is incomplete
- Frontend expects certain fields that aren't included
- Fix: Ensure `include: { shift: true }` is present

### Issue 4: Response Serialization (2% likely)
- Prisma returns the record correctly
- But JSON serialization drops it
- Fix: Check Date serialization in NestJS

---

**Execute the steps above and collect the logs. That will show us exactly where the bug is!**
