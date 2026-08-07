# DEBUG INSTRUCTIONS - Follow These Steps EXACTLY

## I've added comprehensive logging at every step. Follow these instructions to find where the data breaks.

---

## STEP 1: Start Backend (if not running)

```bash
cd backend
npm run start:dev
```

**Wait for:** `Nest application successfully started`

---

## STEP 2: Start Frontend (if not running)

```bash
cd frontend
npm run dev
```

**Wait for:** `ready - started server on 0.0.0.0:3000`

---

## STEP 3: Open Browser with DevTools

1. Open Chrome/Edge
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Clear console (click 🚫 icon)

---

## STEP 4: Login as HR

1. Navigate to `http://localhost:3000/login`
2. Login with HR credentials
3. You should reach HR Dashboard

---

## STEP 5: Go to Employees Page

1. Click on "Employees" in sidebar
2. You should see list of employees

---

## STEP 6: Click "View" on ANY Employee

1. Find any employee in the list
2. Click the "Eye" icon (View button)
3. **DO NOT CLOSE DEVTOOLS**

---

## STEP 7: Check Backend Console Logs

Go to your **backend terminal** and you should see logs starting with:

```
╔══════════════════════════════════════════════════════════╗
║  findOne() called for Employee Details                   ║
╚══════════════════════════════════════════════════════════╝
📋 BACKEND STEP 1: Employee ID received: ...
📋 BACKEND STEP 2: Employee ID type: string
📋 BACKEND STEP 3: Employee ID length: 36

🔍 BACKEND STEP 4: Executing Prisma Query...
📊 BACKEND STEP 5: Prisma Query Completed
📊 BACKEND STEP 6: Employee object exists? true/false
```

### ⚠️ CHECKPOINT 1: Is employee found?

**If you see:** `Employee object exists? false`
→ **Problem:** Wrong employee ID or employee doesn't exist in database
→ **Action:** Copy the employee ID from STEP 1 and check if it exists in database

**If you see:** `Employee object exists? true`
→ **Good!** Continue to next logs...

---

## STEP 8: Check Backend Data from Prisma

Backend logs should continue:

```
✅ BACKEND STEP 8: Employee FOUND in database
📊 BACKEND STEP 9: Raw Employee Object Keys: [...]
📊 BACKEND STEP 10: Employee Data from Prisma:
   - id: employee-uuid
   - employeeId: FCS-2026-0001
   - firstName: Aditya
   - lastName: Shastri
   - phone: 1234567890
   - email from user: aditya@example.com
   - department object: { id: '...', name: 'Engineering' }
   - department name: Engineering
   - designation object: { id: '...', name: 'Developer' }
   - designation name: Developer
   - profile object: { id: '...', profileCompletion: 85 }
   - profile completion: 85
   - documents array exists? true/false
   - documents array length: 5
   - isActive: true
```

### ⚠️ CHECKPOINT 2: Does Prisma return data?

**Copy ALL values from this section and paste them here:**

```
firstName: _________________
lastName: _________________
email from user: _________________
department name: _________________
designation name: _________________
documents array length: _________________
```

**If ANY of these are null/undefined:**
→ **Problem:** Data doesn't exist in database OR Prisma relations are broken
→ **Action:** Check database tables directly

**If ALL values show correctly:**
→ **Good!** Prisma is working. Continue...

---

## STEP 9: Check Backend Flattened Response

Backend logs should continue:

```
🔧 BACKEND STEP 12: Creating flattened response object...
📊 BACKEND STEP 13: Flattened Response Created
   - fullName: Aditya Shastri
   - email: aditya@example.com
   - departmentName: Engineering
   - designationTitle: Developer
   - profileCompletion: 85
   - documentsCount: 5

✅ BACKEND STEP 14: Returning response to frontend
```

### ⚠️ CHECKPOINT 3: Are flattened fields created?

**Copy these values:**

```
fullName: _________________
email: _________________
departmentName: _________________
documentsCount: _________________
```

**If any show "undefined undefined" or null:**
→ **Problem:** Flattening logic is broken
→ **Action:** Check if firstName/lastName exist in STEP 8

**If ALL values show correctly:**
→ **Good!** Backend is returning correct data. Problem is in frontend.

---

## STEP 10: Check Browser Console Logs

Go to **Browser DevTools Console** tab. You should see:

```
🔍 STEP 1: Fetching employee with ID: employee-uuid
📦 STEP 2: Raw API Response: { data: {...}, status: 200, ... }
📦 STEP 3: Response Data: { id: '...', firstName: 'Aditya', ... }
📦 STEP 4: Response Data Keys: ['id', 'employeeId', 'firstName', ...]
📦 STEP 5: First Name: Aditya
📦 STEP 6: Last Name: Shastri
📦 STEP 7: Full Name: Aditya Shastri
📦 STEP 8: Email: aditya@example.com
📦 STEP 9: Email from user: aditya@example.com
📦 STEP 10: Department Name: Engineering
📦 STEP 11: Department from nested: Engineering
📦 STEP 12: Documents Count: 5
📦 STEP 13: Documents Array: [{...}, {...}, ...]
📦 STEP 14: Documents Array Length: 5
```

### ⚠️ CHECKPOINT 4: What does frontend receive?

**Copy these values from browser console:**

```
STEP 5 - First Name: _________________
STEP 6 - Last Name: _________________
STEP 7 - Full Name: _________________
STEP 8 - Email: _________________
STEP 10 - Department Name: _________________
STEP 12 - Documents Count: _________________
```

**If all values show correctly in console:**
→ **Problem:** Frontend is receiving data but not rendering it
→ **Action:** Check STEP 11 below

**If values show undefined:**
→ **Problem:** API response format is different than expected
→ **Action:** Compare STEP 4 (Response Data Keys) with what we expect

---

## STEP 11: Check Frontend After Assignment

Browser console should also show:

```
🎯 STEP 15: Employee Object after assignment: { id: '...', firstName: 'Aditya', ... }
🎯 STEP 16: emp.firstName: Aditya
🎯 STEP 17: emp.lastName: Shastri
🎯 STEP 18: emp.fullName: Aditya Shastri
🎯 STEP 19: emp.email: aditya@example.com
🎯 STEP 20: emp.departmentName: Engineering
🎯 STEP 21: emp.documentsCount: 5
```

### ⚠️ CHECKPOINT 5: After assignment, do values exist?

**Copy these values:**

```
emp.firstName: _________________
emp.fullName: _________________
emp.email: _________________
emp.departmentName: _________________
emp.documentsCount: _________________
```

**If values are undefined HERE but were correct in STEP 10:**
→ **Problem:** Something is wrong with the assignment `emp = empResponse`
→ **Action:** This shouldn't happen - report this

**If values are correct here but page shows "undefined undefined":**
→ **Problem:** React rendering is using wrong field paths
→ **Action:** Check the JSX code in page.tsx

---

## STEP 12: Check Network Tab

1. In DevTools, click **Network** tab
2. Find the request to `/employees/...` (should be there)
3. Click on it
4. Click **Response** sub-tab
5. Copy the ENTIRE JSON response

**Paste it here or save to a file:**

```json
{
  // PASTE FULL RESPONSE HERE
}
```

---

## STEP 13: Report Results

Based on where the data breaks, report back:

### Scenario A: Backend doesn't find employee
**Logs show:** `Employee object exists? false`
**Problem:** Employee ID mismatch or employee doesn't exist
**Need:** The employee ID from URL and from database

### Scenario B: Backend finds employee but fields are null
**Logs show:** `firstName: null` or `email from user: null`
**Problem:** Database records are incomplete
**Need:** Check employee table in database

### Scenario C: Backend returns correct data but frontend receives undefined
**Logs show:** Backend correct, but browser STEP 5-8 show undefined
**Problem:** API response format issue
**Need:** Full network response from STEP 12

### Scenario D: Frontend receives correct data but displays undefined
**Logs show:** Browser console shows correct values but page shows undefined
**Problem:** JSX is accessing wrong properties
**Need:** Screenshot of page and console

---

## What to Send Me

1. **Backend console logs** from STEP 7-9
2. **Browser console logs** from STEP 10-11
3. **Network response** from STEP 12
4. **Which scenario** (A, B, C, or D) matches your situation
5. **Screenshot** of the page showing "undefined undefined"

With this information, I can pinpoint EXACTLY where the data is breaking and fix it.
