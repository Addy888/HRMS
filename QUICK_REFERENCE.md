# ATTENDANCE STATUS RULES - QUICK REFERENCE

## 📌 CHECKOUT TIME RULE (Asia/Kolkata)

```
╔══════════════════════════════════════════════════════════╗
║  Checkout Time  │  Status Logic                         ║
╠══════════════════════════════════════════════════════════╣
║  < 7:00 PM      │  HALF_DAY (overrides PRESENT/LATE)   ║
║  = 7:00 PM      │  Keep original (PRESENT or LATE)     ║
║  > 7:00 PM      │  Keep original (PRESENT or LATE)     ║
╚══════════════════════════════════════════════════════════╝
```

## ✅ TEST CASES

| Check-in | Check-out | Result | Rule Applied |
|----------|-----------|--------|--------------|
| 09:30 AM | 05:30 PM | **HALF_DAY** | Early checkout |
| 09:30 AM | 06:59 PM | **HALF_DAY** | Early checkout (1 min before cutoff) |
| 09:30 AM | 07:00 PM | **PRESENT** | Exact cutoff time |
| 09:30 AM | 07:01 PM | **PRESENT** | After cutoff |
| 10:30 AM | 07:00 PM | **LATE** | Late + on-time checkout |
| 10:30 AM | 06:30 PM | **HALF_DAY** | Late + early checkout = HALF_DAY |
| 04:38 PM | 05:26 PM | **HALF_DAY** | Early checkout (47 mins worked) |
| Monday | -- | **WEEK_OFF** | No attendance allowed |

## 🎯 STATUS PRIORITY (Highest → Lowest)

```
1. WEEK_OFF    (Monday - cannot be overridden)
2. HOLIDAY     (Company holidays)
3. LEAVE       (Approved leave)
4. HALF_DAY    (Early checkout before 7 PM)
5. LATE        (Check-in after grace period)
6. PRESENT     (Normal attendance)
```

## 🔧 BACKEND LOGIC

### File: `attendance.service.ts`

**Method:** `updateCheckOut()`

```typescript
// Step 1: Convert to IST
const zonedCheckOutTime = toZonedTime(checkOutTime, 'Asia/Kolkata');

// Step 2: Extract hour and minute
const checkoutHour = zonedCheckOutTime.getHours();
const checkoutMinute = zonedCheckOutTime.getMinutes();

// Step 3: Convert to total minutes
const checkoutMinutes = checkoutHour * 60 + checkoutMinute;
const officeCheckoutMinutes = 19 * 60; // 7:00 PM = 1140 minutes

// Step 4: Apply rule
if (checkoutMinutes < officeCheckoutMinutes) {
  if (['PRESENT', 'LATE'].includes(status)) {
    status = AttendanceStatus.HALF_DAY;
  }
}
```

## 📊 MONTHLY SUMMARY CALCULATION

### OLD (WRONG):
```typescript
totalPresent = PRESENT + LATE + HALF_DAY  ❌
```

### NEW (CORRECT):
```typescript
totalPresent = PRESENT only
totalLate = LATE only
totalHalfDay = HALF_DAY only

// Attendance percentage
fullAttendance = PRESENT + LATE + WFH + ON_DUTY
partialAttendance = HALF_DAY × 0.5
totalAttendance = fullAttendance + partialAttendance
percentage = (totalAttendance / workingDays) × 100
```

### Example:
```
Working Days: 20
Present: 15
Late: 2
Half Day: 3

OLD CALCULATION (WRONG):
Present count = 15 + 2 + 3 = 20
Percentage = 20/20 × 100 = 100% ❌

NEW CALCULATION (CORRECT):
Full attendance = 15 + 2 = 17
Partial attendance = 3 × 0.5 = 1.5
Total attendance = 17 + 1.5 = 18.5
Percentage = 18.5/20 × 100 = 92.5% ✅
```

## 🛠️ DEBUGGING

### Check Backend Logs:
```bash
# Look for these log patterns:
[ATTENDANCE-CHECKOUT] Processing checkout
[ATTENDANCE-CHECKOUT] ⚠️ EARLY CHECKOUT
[ATTENDANCE-CHECKOUT] ✓ ON-TIME CHECKOUT
[ATTENDANCE-CHECKOUT] Updating DB
```

### Example Success Log:
```
[ATTENDANCE-CHECKOUT] Processing checkout - 
  Employee: emp123 | 
  Current Status: PRESENT | 
  Checkout Time: 17:26 IST | 
  Minutes: 1046 | 
  Threshold: 1140

[ATTENDANCE-CHECKOUT] ⚠️ EARLY CHECKOUT - 
  Time: 17:26 IST (1046 minutes < 1140 minutes) - 
  Changing status from PRESENT to HALF_DAY

[ATTENDANCE-CHECKOUT] Updating DB - 
  Status: HALF_DAY | 
  Working Hours: 0.78h | 
  Early Exit: 94 mins
```

## 🚨 COMMON ISSUES

### Issue 1: Status shows PRESENT after early checkout
**Cause:** Frontend cache or not refreshing after checkout  
**Fix:** Refresh today's attendance after checkout API call

### Issue 2: Wrong status on Monday
**Cause:** Monday is always WEEK_OFF  
**Fix:** No checkout allowed on Monday

### Issue 3: Status not updating in monthly summary
**Cause:** Using cached/old summary data  
**Fix:** Backend recalculates summary, ensure frontend calls API

## 📱 FRONTEND IMPACT

### Employee Attendance Page
```typescript
// After checkout, immediately fetch updated status
await api.post('/attendance/check-out', data);
// Refresh today's attendance
await refetch(); // React Query refetch
```

### Monthly Calendar
```typescript
// Use backend status as source of truth
attendanceData.map(day => ({
  date: day.date,
  status: day.status, // From backend, not calculated
  checkIn: day.checkInTime,
  checkOut: day.checkOutTime,
  workingHours: day.workingHours
}))
```

## 🔐 SECURITY NOTES

- ✅ Status calculated in backend only
- ✅ Frontend displays backend status (no local calculation)
- ✅ Database is source of truth
- ✅ Timezone handling server-side (Asia/Kolkata)
- ✅ No client-side status manipulation

## 📞 QUICK SUPPORT

### Verify Checkout Rule:
1. Check database `Attendance` table → `status` column
2. Check API response `/attendance/my/today`
3. Check backend logs for checkout processing
4. Verify timezone conversion (must be Asia/Kolkata)

### Test Manually:
```bash
# Check-in
POST /attendance/check-in
{
  "timestamp": "2026-08-14T09:30:00.000Z"
}

# Check-out (before 7 PM)
POST /attendance/check-out
{
  "timestamp": "2026-08-14T11:56:00.000Z"  # 5:26 PM IST
}

# Expected: status = HALF_DAY
```

---

**Last Updated:** 2026-08-14  
**Version:** 1.0  
**Status:** ✅ Production Ready
