# ⚡ QUICK TEST GUIDE - Employee Creation Fix

## 🚀 FASTEST WAY TO TEST

### Option 1: API Test (Fastest)
```bash
# From project root, test with existing frontend payload
curl -X POST http://localhost:4000/api/v1/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"email\":\"test@fcs.com\",\"firstName\":\"Test\",\"lastName\":\"User\",\"departmentId\":\"SALES\",\"designationId\":\"SALES_EXECUTIVE\",\"monthlySalary\":50000}"
```

**✅ SUCCESS:** HTTP 201, employee created  
**❌ FAILURE:** HTTP 400, "Department does not exist" → Database missing "Sales" department

---

### Option 2: Frontend Test (Full Flow)
1. **Hard refresh:** `Ctrl + Shift + R` (clears cache)
2. **Open:** http://localhost:3000/hr/employees
3. **DevTools:** Press F12, open Console tab
4. **Click:** "Create Employee" button
5. **Look for:** Console logs showing API calls
   ```
   🔍 Fetching departments from API...
   📊 Departments loaded: X items
   ```
6. **Fill form** and submit
7. **Check:** Network tab for POST request payload

**✅ SUCCESS:** Payload has UUIDs, employee created  
**❌ FAILURE:** Payload still has "SALES" → Hard refresh again

---

## 🔍 WHAT TO CHECK

### Backend Console (Terminal)
Look for these logs:
```
✅ Department resolved: SALES → Sales ( c5a8b9d2-... )
✅ Designation resolved: SALES_EXECUTIVE → Sales Executive ( d6b9c0e3-... )
```

**If missing:** Backend didn't resolve (check code)  
**If "not found":** Database missing records (run SQL below)

### Browser Console (F12 → Console)
Look for these logs:
```
🏢 Department selected: { value: 'c5a8b9d2-...', option: {...} }
💼 Designation selected: { value: 'd6b9c0e3-...', option: {...} }
```

**If missing:** Frontend didn't load API data (hard refresh)  
**If shows "SALES":** Old cached code (clear cache)

### Browser Network Tab (F12 → Network)
Look at POST /api/v1/employees payload:
```json
{
  "departmentId": "c5a8b9d2-e3f4-...",  ← UUID = ✅ GOOD
  "designationId": "d6b9c0e3-f4a5-..."  ← UUID = ✅ GOOD
}
```

**If shows strings:** Frontend using cached code (hard refresh)

---

## 🗄️ VERIFY DATABASE HAS DATA

```sql
-- Quick check
SELECT COUNT(*) as Departments FROM Department;
SELECT COUNT(*) as Designations FROM Designation;

-- Check specific names (case-insensitive)
SELECT id, name FROM Department WHERE LOWER(name) IN ('sales', 'it', 'hr');
SELECT id, name FROM Designation WHERE LOWER(name) LIKE '%sales%';
```

**Expected:**
- At least 1 department
- At least 1 designation
- Names match what frontend sends

**If empty:** Run `create-default-departments.sql` (if exists) or create manually

---

## 🚨 QUICK FIXES

### Fix 1: Frontend Cache Issue
```bash
# Windows/Linux
Ctrl + Shift + R

# Mac
Cmd + Shift + R

# Or: Test in Incognito window
```

### Fix 2: Database Missing Data
```sql
-- Create test department
INSERT INTO Department (id, name, description)
VALUES (UUID(), 'Sales', 'Sales Department');

-- Create test designation
INSERT INTO Designation (id, name, description)
VALUES (UUID(), 'Sales Executive', 'Sales Executive Position');
```

### Fix 3: Backend Not Running
```bash
cd backend
npm run start:dev
```

### Fix 4: Frontend Not Running
```bash
cd frontend
npm run dev
```

---

## ✅ SUCCESS LOOKS LIKE

### Backend Response (201 Created)
```json
{
  "employee": {
    "id": "f1e2d3c4-...",
    "employeeId": "FCS-2026-0001",
    "email": "test@fcs.com",
    "departmentId": "c5a8b9d2-...",     ← UUID ✅
    "designationId": "d6b9c0e3-...",    ← UUID ✅
    "firstName": "Test",
    "lastName": "User"
  },
  "defaultCredentials": {
    "email": "test@fcs.com",
    "temporaryPassword": "1234"
  }
}
```

### Database Record
```sql
SELECT 
  employeeId, 
  email, 
  departmentId,        -- Should be UUID, not "SALES"
  designationId        -- Should be UUID, not "SALES_EXECUTIVE"
FROM Employee 
WHERE email = 'test@fcs.com';
```

---

## ❌ FAILURE LOOKS LIKE

### Backend Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "Selected department \"SALES\" does not exist. Please select a valid department."
}
```
**Fix:** Database missing department with name "Sales" (case-insensitive)

### Prisma Error (P2003)
```
Foreign key constraint failed on the field: `departmentId`
```
**Fix:** Backend not resolving names (check code was updated)

### Frontend Payload Wrong
```json
{
  "departmentId": "SALES",        ← String ❌ Should be UUID
  "designationId": "SALES_EXECUTIVE"  ← String ❌ Should be UUID
}
```
**Fix:** Hard refresh frontend (Ctrl+Shift+R)

---

## 🎯 5-MINUTE TEST CHECKLIST

- [ ] Backend running (`npm run start:dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Database has departments
- [ ] Database has designations
- [ ] Frontend hard refreshed (Ctrl+Shift+R)
- [ ] Browser DevTools open (F12)
- [ ] Create employee form opened
- [ ] Console shows API calls
- [ ] Department dropdown populated
- [ ] Designation dropdown populated
- [ ] Form submitted
- [ ] Network tab shows UUID payload
- [ ] Backend console shows resolution logs
- [ ] Response is 201 Created
- [ ] Database has new employee with UUIDs

**All checked?** ✅ Employee creation is working!

---

## 📞 IF STILL FAILING

Share these 4 things:

1. **Backend console output** (copy full log)
2. **Browser console output** (F12 → Console, copy all)
3. **Network request payload** (F12 → Network → POST request → Payload tab)
4. **Database verification**:
   ```sql
   SELECT name FROM Department;
   SELECT name FROM Designation;
   ```

This will help diagnose the exact issue.

---

**Quick Links:**
- Full documentation: `EMPLOYEE_CREATION_VERIFIED_FIX.md`
- SQL verification: `verify-departments-designations.sql`
- Context summary: `CONTEXT_TRANSFER_SUMMARY.md`

**Status:** Ready for testing  
**Time to test:** ~5 minutes  
**Expected result:** Employee created successfully
