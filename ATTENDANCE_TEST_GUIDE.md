# ATTENDANCE FIX - QUICK TEST GUIDE

## 🚀 Quick Start

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

Wait for: `Nest application successfully started`

---

## 🧪 Test Scenarios

### Test 1: First Check-in Today
**Expected:** Should create new attendance record

```bash
# Using curl (Windows CMD)
curl -X POST http://localhost:3000/api/v1/attendance/check-in ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{}"
```

```bash
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/attendance/check-in" `
  -Method POST `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN";"Content-Type"="application/json"} `
  -Body "{}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Checked in successfully",
  "attendance": {
    "id": "...",
    "date": "2026-08-13T18:30:00.000Z",
    "checkInTime": "2026-08-14T10:30:44.599Z",
    ...
  }
}
```

**Expected Logs:**
```
[ATTENDANCE-DATE] Current server timestamp: 2026-08-14T10:30:44.599Z
[ATTENDANCE-DATE] Asia/Kolkata calendar date: 2026-08-14 (Friday)
[ATTENDANCE-DATE] Canonical DB date: 2026-08-13T18:30:00.000Z (IST: 14/08/2026, 00:00:00)

[ATTENDANCE-CHECKIN] START
[ATTENDANCE-CHECKIN] organizationId: 3245af42-a1a7-423c-b7d0-05e7f7046a20
[ATTENDANCE-CHECKIN] employeeId: ac1b903e-c399-4294-a790-c500bbbb2578
[ATTENDANCE-CHECKIN] businessDate: 2026-08-13T18:30:00.000Z

[ATTENDANCE-CHECKIN] Finding existing record...
[ATTENDANCE-CHECKIN] NO existing record found
[ATTENDANCE-CHECKIN] DB OPERATION: CREATE
[ATTENDANCE-CHECKIN] SUCCESS - Created record abc-123-def
```

---

### Test 2: Duplicate Check-in (Same Day)
**Expected:** Should return 400 error with message

```bash
# Run the same command again immediately
curl -X POST http://localhost:3000/api/v1/attendance/check-in ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{}"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "You have already checked in today",
  "error": "Bad Request"
}
```

**Expected Logs:**
```
[ATTENDANCE-CHECKIN] START
[ATTENDANCE-CHECKIN] businessDate: 2026-08-13T18:30:00.000Z
[ATTENDANCE-CHECKIN] Finding existing record...
[ATTENDANCE-CHECKIN] FOUND existing record
[ATTENDANCE-CHECKIN] existingId: abc-123-def
[ATTENDANCE-CHECKIN] existingCheckIn: 2026-08-14T10:30:44.599Z
[ATTENDANCE-CHECKIN] DUPLICATE - Already checked in
```

---

### Test 3: Today's Status
**Expected:** Should show attendance status for today

```bash
# Using curl (Windows CMD)
curl -X GET http://localhost:3000/api/v1/attendance/my/today ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

```bash
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/attendance/my/today" `
  -Method GET `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"}
```

**Expected Response:**
```json
{
  "date": "2026-08-13T18:30:00.000Z",
  "attendance": {
    "id": "...",
    "date": "2026-08-13T18:30:00.000Z",
    "checkInTime": "2026-08-14T10:30:44.599Z",
    "checkOutTime": null,
    ...
  },
  "canCheckIn": false,
  "canCheckOut": true
}
```

**Key Checks:**
- ✅ `date` field matches canonical date: `2026-08-13T18:30:00.000Z` for Aug 14 IST
- ✅ `canCheckIn` is `false` (already checked in)
- ✅ `canCheckOut` is `true` (can check out)

---

### Test 4: Check-out
**Expected:** Should update attendance with check-out time

```bash
# Using curl (Windows CMD)
curl -X POST http://localhost:3000/api/v1/attendance/check-out ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Checked out successfully",
  "attendance": {
    "id": "...",
    "date": "2026-08-13T18:30:00.000Z",
    "checkInTime": "2026-08-14T10:30:44.599Z",
    "checkOutTime": "2026-08-14T12:45:30.123Z",
    "workingHours": 2.25,
    ...
  }
}
```

---

### Test 5: Database Verification
**Expected:** Verify date format in database

```bash
# Connect to PostgreSQL
psql -U postgres -d hrms

# Check today's attendance records
SELECT id, "employeeId", date, "checkInTime", "checkOutTime"
FROM "Attendance"
WHERE date = '2026-08-13T18:30:00.000Z'
ORDER BY "checkInTime" DESC
LIMIT 10;
```

**Expected Result:**
```
id         | employeeId  | date                     | checkInTime              | checkOutTime
-----------+-------------+--------------------------+--------------------------+-------------------------
abc-123... | ac1b903e... | 2026-08-13T18:30:00.000Z | 2026-08-14T10:30:44.599Z | 2026-08-14T12:45:30.123Z
```

**Key Checks:**
- ✅ `date` column has same value for all records of Aug 14 IST
- ✅ `date` value is `2026-08-13T18:30:00.000Z` (midnight IST in UTC)
- ✅ No duplicate records for same employee/organization/date

---

## 🔍 Log Monitoring

### What to Look For

**✅ GOOD - Successful Check-in:**
```
[ATTENDANCE-DATE] Canonical DB date: 2026-08-13T18:30:00.000Z
[ATTENDANCE-CHECKIN] businessDate: 2026-08-13T18:30:00.000Z
[ATTENDANCE-CHECKIN] NO existing record found
[ATTENDANCE-CHECKIN] DB OPERATION: CREATE
[ATTENDANCE-CHECKIN] SUCCESS - Created record
```

**✅ GOOD - Duplicate Detected:**
```
[ATTENDANCE-CHECKIN] FOUND existing record
[ATTENDANCE-CHECKIN] existingCheckIn: 2026-08-14T10:30:44.599Z
[ATTENDANCE-CHECKIN] DUPLICATE - Already checked in
```

**✅ GOOD - Race Condition Handled:**
```
[ATTENDANCE-CHECKIN] P2002 race detected - another request created record
[ATTENDANCE-CHECKIN] Re-fetching with SAME keys
[ATTENDANCE-CHECKIN] Found record after race
[ATTENDANCE-CHECKIN] SUCCESS - Updated after race
```

**❌ BAD - Critical Error (Should NOT appear):**
```
[ATTENDANCE-CHECKIN] CRITICAL - P2002 but findUnique returned null
```

If you see the CRITICAL error, the fix has not been applied correctly.

---

## 🎯 Success Criteria

### All Tests Must Pass:
1. ✅ First check-in creates new record
2. ✅ Duplicate check-in returns 400 error
3. ✅ Today's status returns correct date
4. ✅ Check-out updates existing record
5. ✅ Database shows consistent date values

### Logs Must Show:
1. ✅ `[ATTENDANCE-DATE]` entries with correct IST calendar date
2. ✅ `[ATTENDANCE-CHECKIN]` entries with canonical business date
3. ✅ No "CRITICAL - P2002 but findUnique returned null" errors
4. ✅ Duplicate detection working correctly

---

## 🐛 Troubleshooting

### Issue: Still getting P2002 errors
**Solution:**
1. Verify backend was restarted after code changes
2. Check Prisma client was regenerated: `npx prisma generate`
3. Check imports in controller: `getAttendanceBusinessDate` should be imported

### Issue: Wrong date in response
**Solution:**
1. Verify server timezone settings
2. Check `TZ` environment variable should be `Asia/Kolkata`
3. Verify date-fns-tz package is installed: `npm list date-fns-tz`

### Issue: Logs not appearing
**Solution:**
1. Check log level in `.env`: `LOG_LEVEL=debug`
2. Verify NestJS logger is configured
3. Check console output in terminal where backend is running

---

## 📝 Test Checklist

- [ ] Backend restarted successfully
- [ ] First check-in works (200 OK)
- [ ] Duplicate check-in fails correctly (400 Bad Request)
- [ ] Today's status shows correct date
- [ ] Check-out updates record (200 OK)
- [ ] Database shows consistent dates
- [ ] Logs show `[ATTENDANCE-DATE]` entries
- [ ] Logs show `[ATTENDANCE-CHECKIN]` entries
- [ ] No "CRITICAL" errors in logs
- [ ] Duplicate detection working

---

## 🎉 If All Tests Pass

**Congratulations!** The attendance date normalization fix is working correctly.

### Next Steps:
1. Monitor production logs for the first few days
2. Watch for any edge cases or unusual patterns
3. Document any new issues that arise
4. Consider adding automated tests for date handling

---

## 📞 Need Help?

### Check These First:
1. Backend logs (look for ERROR, CRITICAL, or WARNING)
2. Database connection (verify PostgreSQL is running)
3. Environment variables (especially `DATABASE_URL` and `TZ`)
4. Prisma client (run `npx prisma generate` if in doubt)

### Still Having Issues?
1. Share the exact error message from logs
2. Share the request you're making (curl command or equivalent)
3. Share the current server date/time: `date` (CMD) or `Get-Date` (PowerShell)
4. Share database query results from Test 5

---

**Good luck with testing!** 🚀
