# Payroll Dashboard Debug Logs - Complete Trace

## Overview
Added comprehensive logging to trace the "Failed to load dashboard" error in the Payroll Dashboard.

---

## Changes Made

### 1. Frontend Logging
**File:** `frontend/src/app/hr/payroll/page.tsx`

**Added:**
- ✅ Log before API call (URL and params)
- ✅ Log after successful API call (response data)
- ✅ Log on API error (complete error object)
- ✅ Log React Query state (isLoading, isError, error, stats)

**Console Output Format:**
```
========== PAYROLL DASHBOARD API CALL ==========
Payroll API URL: /payroll-processing/dashboard/stats
Payroll API Params: { month: 1, year: 2026 }
✅ Payroll Response Received:
   Status: 200
   Response: {...}
   Response.data: {...}
   Response.data.data: {...}
================================================

========== PAYROLL QUERY STATE ==========
isLoading: false
isError: false
error: null
stats: {...}
==========================================
```

**On Error:**
```
❌ PAYROLL API ERROR:
   Error: {...}
   Error Message: "..."
   Error Response: {...}
   Error Response Data: {...}
================================================
```

---

### 2. Backend Controller Logging
**File:** `backend/src/modules/payroll/controllers/payroll-processing.controller.ts`

**Added to `getDashboardStats()` method:**
- ✅ Log input parameters (month, year)
- ✅ Log parsed parameters
- ✅ Log before calling service
- ✅ Log result from service
- ✅ Complete error handling with stack trace

**Console Output Format:**
```
╔════════════════════════════════════════════════════════════╗
║  PAYROLL DASHBOARD STATS - CONTROLLER                      ║
╚════════════════════════════════════════════════════════════╝
📥 Controller Input:
   month: "1"
   year: "2026"
   month (parsed): 1
   year (parsed): 2026
🔄 Calling payrollProcessingService.getDashboardStats()...
✅ Controller received result from service:
   result: {...}
╚════════════════════════════════════════════════════════════╝
```

**On Error:**
```
❌ CONTROLLER ERROR:
   Error: {...}
   Error message: "..."
   Error stack: "..."
╚════════════════════════════════════════════════════════════╝
```

---

### 3. Backend Service Logging
**File:** `backend/src/modules/payroll/services/payroll-processing.service.ts`

**Added to `getDashboardStats()` method:**
- ✅ Log all input parameters
- ✅ Log calculated month/year
- ✅ Log Prisma where clause
- ✅ **Individual try/catch for EACH Prisma query**
- ✅ Log before each query
- ✅ Log after each query with result
- ✅ Complete error handling with full stack trace
- ✅ Log final result object

**Console Output Format:**
```
╔════════════════════════════════════════════════════════════╗
║  PAYROLL DASHBOARD STATS - SERVICE                         ║
╚════════════════════════════════════════════════════════════╝
📥 Service Input:
   month (parameter): 1
   year (parameter): 2026
📅 Calculated Values:
   currentMonth: 1
   currentYear: 2026
🔍 Prisma where clause: { month: 1, year: 2026 }

🔄 Starting Prisma queries...

1️⃣  QUERY: database.employee.count()
   ✅ Result: 5

2️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PENDING } })
   Where: { month: 1, year: 2026, status: 'PENDING' }
   ✅ Result: 2

3️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PROCESSED } })
   Where: { month: 1, year: 2026, status: 'PROCESSED' }
   ✅ Result: 1

4️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PAID } })
   Where: { month: 1, year: 2026, status: 'PAID' }
   ✅ Result: 2

5️⃣  QUERY: database.payrollRun.aggregate({ where, _sum: { netSalary: true } })
   Where: { month: 1, year: 2026 }
   ✅ Result: { _sum: { netSalary: 150000 } }

6️⃣  QUERY: database.payrollRun.aggregate({ where, _avg: { netSalary: true } })
   Where: { month: 1, year: 2026 }
   ✅ Result: { _avg: { netSalary: 30000 } }

✅ ALL QUERIES COMPLETED SUCCESSFULLY

📊 Final Result Object:
{
  totalEmployees: 5,
  pendingPayroll: 2,
  processedPayroll: 1,
  paidEmployees: 2,
  pendingPayments: 1,
  monthlySalaryExpense: 150000,
  averageSalary: 30000,
  month: 1,
  year: 2026
}
╚════════════════════════════════════════════════════════════╝
```

**On Error (Example):**
```
2️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PENDING } })
   Where: { month: 1, year: 2026, status: 'PENDING' }
   ❌ ERROR in payrollRun.count(PENDING):
      Error: PrismaClientKnownRequestError: Table 'hrms.PayrollRun' doesn't exist
      Message: Table 'hrms.PayrollRun' doesn't exist
      Stack: 
         at PrismaClient.payrollRun.count (...)
         at PayrollProcessingService.getDashboardStats (...)
         ...

❌ FATAL ERROR IN getDashboardStats():
   Error: PrismaClientKnownRequestError
   Error name: PrismaClientKnownRequestError
   Error message: Table 'hrms.PayrollRun' doesn't exist
   Error stack: ...
╚════════════════════════════════════════════════════════════╝
```

---

## Execution Flow with Logs

### Complete Request Trace:

```
1. FRONTEND (page.tsx)
   ↓
   ========== PAYROLL DASHBOARD API CALL ==========
   Payroll API URL: /payroll-processing/dashboard/stats
   Payroll API Params: { month: 1, year: 2026 }
   
2. HTTP REQUEST
   ↓
   GET /api/v1/payroll-processing/dashboard/stats?month=1&year=2026
   
3. BACKEND CONTROLLER (payroll-processing.controller.ts)
   ↓
   ╔════════════════════════════════════════════════════════════╗
   ║  PAYROLL DASHBOARD STATS - CONTROLLER                      ║
   ╚════════════════════════════════════════════════════════════╝
   📥 Controller Input:
      month: "1"
      year: "2026"
   
4. BACKEND SERVICE (payroll-processing.service.ts)
   ↓
   ╔════════════════════════════════════════════════════════════╗
   ║  PAYROLL DASHBOARD STATS - SERVICE                         ║
   ╚════════════════════════════════════════════════════════════╝
   📅 Calculated Values:
      currentMonth: 1
      currentYear: 2026
   
5. PRISMA QUERIES (Sequential with individual error handling)
   ↓
   1️⃣  database.employee.count()
   2️⃣  database.payrollRun.count({ status: 'PENDING' })
   3️⃣  database.payrollRun.count({ status: 'PROCESSED' })
   4️⃣  database.payrollRun.count({ status: 'PAID' })
   5️⃣  database.payrollRun.aggregate({ _sum: { netSalary } })
   6️⃣  database.payrollRun.aggregate({ _avg: { netSalary } })
   
6. IF ERROR OCCURS - EXACT QUERY IS IDENTIFIED
   ↓
   ❌ ERROR in payrollRun.count(PENDING):
      Model: PayrollRun
      Method: count
      Arguments: { where: { month: 1, year: 2026, status: 'PENDING' } }
      Error: [Full stack trace]
   
7. RESPONSE BACK TO FRONTEND
   ↓
   ✅ Payroll Response Received OR ❌ PAYROLL API ERROR
   
8. REACT QUERY STATE UPDATE
   ↓
   ========== PAYROLL QUERY STATE ==========
   isLoading: false
   isError: true/false
   error: {...}
   stats: {...}
```

---

## What to Look For in Console

### Success Case:
1. ✅ All 6 Prisma queries complete
2. ✅ `ALL QUERIES COMPLETED SUCCESSFULLY` appears
3. ✅ Final result object has valid data
4. ✅ Frontend receives data
5. ✅ `isError: false` in React Query state

### Failure Case - Identify:

#### 1. **Which Query Failed?**
Look for the query number that shows `❌ ERROR`:
- `1️⃣` → `employee.count()` failed
- `2️⃣` → `payrollRun.count(PENDING)` failed
- `3️⃣` → `payrollRun.count(PROCESSED)` failed
- `4️⃣` → `payrollRun.count(PAID)` failed
- `5️⃣` → `payrollRun.aggregate(_sum)` failed
- `6️⃣` → `payrollRun.aggregate(_avg)` failed

#### 2. **What is the Error?**
Common errors:
- **Table doesn't exist:** `Table 'hrms.PayrollRun' doesn't exist`
- **Column doesn't exist:** `Unknown column 'netSalary' in field list`
- **Invalid relation:** `Relation 'employee' not found`
- **Type mismatch:** `Invalid value provided for field 'month'`
- **Connection error:** `Can't reach database server`

#### 3. **Exact Location**
The log will show:
- **File:** `payroll-processing.service.ts`
- **Method:** `getDashboardStats()`
- **Query:** Exact Prisma query with arguments
- **Line:** Stack trace shows line number

---

## Database Tables Checked

The dashboard queries these tables:

1. ✅ **Employee** - `database.employee.count()`
2. ✅ **PayrollRun** - Multiple queries:
   - `count({ where: { status: 'PENDING' } })`
   - `count({ where: { status: 'PROCESSED' } })`
   - `count({ where: { status: 'PAID' } })`
   - `aggregate({ _sum: { netSalary } })`
   - `aggregate({ _avg: { netSalary } })`

**Note:** Other tables mentioned (salaryStructure, salaryTemplate, attendanceSummary, loan, advanceSalary) are NOT queried by the dashboard stats endpoint.

---

## Testing Instructions

### Step 1: Open Browser Console
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L)

### Step 2: Access Payroll Dashboard
1. Login as HR
2. Navigate to `/hr/payroll`
3. Watch console output in real-time

### Step 3: Analyze Output

#### If Dashboard Loads Successfully:
You should see all these logs in order:
```
FRONTEND → CONTROLLER → SERVICE → Query 1 → Query 2 → ... → Query 6 → SUCCESS
```

#### If Dashboard Fails:
You will see exactly where it stops:
```
FRONTEND → CONTROLLER → SERVICE → Query 1 → Query 2 → ❌ ERROR
```

### Step 4: Copy Error Output
If error occurs, copy:
1. The complete `❌ ERROR` block
2. The query number that failed
3. The Prisma query arguments
4. The full error stack

---

## Example Error Output to Look For

### Case 1: Table Missing
```
2️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PENDING } })
   ❌ ERROR in payrollRun.count(PENDING):
      Error: PrismaClientKnownRequestError
      Message: Table 'fcs_hrms.PayrollRun' doesn't exist
      Code: P2021
```
**FIX:** Run `npx prisma db push` or migrations

### Case 2: Column Missing
```
5️⃣  QUERY: database.payrollRun.aggregate({ where, _sum: { netSalary: true } })
   ❌ ERROR in payrollRun.aggregate(_sum):
      Error: PrismaClientValidationError
      Message: Unknown field `netSalary` for select statement on model PayrollRun
```
**FIX:** Check schema - field might be named differently

### Case 3: Incorrect Field Type
```
2️⃣  QUERY: database.payrollRun.count({ where: { ...where, status: PENDING } })
   ❌ ERROR in payrollRun.count(PENDING):
      Error: PrismaClientValidationError
      Message: Invalid value for argument `where`: expected object, got string
```
**FIX:** Check month/year data types in schema

---

## Files Modified

1. ✅ `frontend/src/app/hr/payroll/page.tsx`
   - Added frontend API call logging
   - Added error handling with detailed logs
   - Added React Query state logging

2. ✅ `backend/src/modules/payroll/controllers/payroll-processing.controller.ts`
   - Added controller input logging
   - Added service call logging
   - Added error handling with stack trace

3. ✅ `backend/src/modules/payroll/services/payroll-processing.service.ts`
   - Added service input logging
   - **Wrapped each Prisma query in try/catch**
   - Added detailed query logging (before/after each query)
   - Added complete error stack traces
   - Added final result logging

---

## Next Steps

### After Reviewing Console Output:

1. **Copy the exact error message**
2. **Note which query failed (1-6)**
3. **Check the Prisma query arguments**
4. **Verify database schema**
5. **Fix the identified issue**

### Common Fixes:
- Missing table → Run migrations
- Missing column → Update schema
- Wrong data type → Fix schema field type
- Missing relation → Add relation in schema
- Empty result → Check if data exists in database

---

## Important Notes

⚠️ **DO NOT REMOVE THESE LOGS** until the issue is identified and fixed.

✅ **Each Prisma query has individual error handling** - if one fails, you'll know exactly which one.

✅ **Full stack traces are captured** - you'll see the complete error chain.

✅ **Query arguments are logged** - you'll see exactly what was sent to Prisma.

✅ **Sequential execution** - changed from `Promise.all()` to sequential for better error isolation.

---

## Conclusion

Complete diagnostic logging is now in place to trace the Payroll Dashboard failure from frontend → controller → service → Prisma queries → database.

**Run the dashboard now and check the console output to identify the exact failing query.**
