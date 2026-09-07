# DEBUG GUIDE: Employee HR Action Details Page

## 🔍 Step-by-Step Debugging Process

### STEP 1: Check Browser Console Logs

I've added extensive logging to the employee HR action detail page. 

**Action Required:**
1. Open the Employee Portal
2. Navigate to an HR Action: `/employee/hr-actions/{id}`
3. Open Browser DevTools (F12)
4. Go to **Console** tab
5. Look for these logs:

```
[EMPLOYEE HR ACTION DETAIL] Fetching action: {id}
[EMPLOYEE HR ACTION DETAIL] API Response: {...}
[EMPLOYEE HR ACTION DETAIL] Response data: {...}
[EMPLOYEE HR ACTION DETAIL] Action Type: ...
[EMPLOYEE HR ACTION DETAIL] Subject: ...
[EMPLOYEE HR ACTION DETAIL] Reason: ...
[EMPLOYEE HR ACTION DETAIL] Rendering with action: {...}
[EMPLOYEE HR ACTION DETAIL] Action keys: [...]
[EMPLOYEE HR ACTION DETAIL] Full action object: {...}
```

**What to check:**
- Is `Response data` an object or is it wrapped?
- Does `Action Type` show the actual type or `undefined`?
- Does `Subject` show the actual subject or `undefined`?
- What are the `Action keys`? Do they include: `actionType`, `subject`, `reason`, `incidentDate`?

### STEP 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Filter by **XHR** or **Fetch**
3. Find the request to: `hr-actions/{id}`
4. Click on it
5. Go to **Response** sub-tab

**Copy the EXACT JSON response and check:**

```json
{
  "id": "...",
  "actionNumber": "...",
  "actionType": "...",  // ← Is this present?
  "subject": "...",      // ← Is this present?
  "reason": "...",       // ← Is this present?
  ...
}
```

### STEP 3: Check Backend Logs

Look at the backend console for these logs:

```
[HR ACTIONS SERVICE] getMyActions called for userId: ...
[HR ACTIONS SERVICE] User found: {...}
[HR ACTIONS SERVICE] ALL actions (including DRAFT): ...
[HR ACTIONS SERVICE] Filtered actions (excluding DRAFT): ...
```

### STEP 4: Check Database Directly

Run this SQL query in your database:

```sql
SELECT 
  id,
  "actionNumber",
  "employeeId",
  "actionType",
  severity,
  subject,
  reason,
  "incidentDate",
  status,
  "issuedAt",
  "createdAt"
FROM "HRAction"
WHERE id = '782e564a-a61b-4aaf-9f5a-0b72f5fa4f90';  -- Use actual ID
```

**Check:**
- Are ALL fields populated with real data?
- Is `actionType` a valid enum value?
- Is `subject` and `reason` filled?
- Are dates valid ISO strings?

---

## 🐛 Common Issues & Solutions

### Issue 1: Empty Response Data

**If console shows:**
```
Response data: {}
```

**Problem:** Backend is returning empty object
**Solution:** Check backend `findOne` service method

### Issue 2: Wrapped Response

**If console shows:**
```
Response data: { data: { actionType: "...", subject: "..." } }
```

**Problem:** Response is wrapped in `data` property
**Solution:** Change frontend to use `res.data.data`

### Issue 3: Different Field Names

**If console shows keys like:**
```
Action keys: ["id", "type", "title", "description", ...]
```

**Problem:** Backend uses different field names
**Solution:** Map frontend to match backend field names

### Issue 4: Action is undefined

**If console shows:**
```
[EMPLOYEE HR ACTION DETAIL] Rendering with action: undefined
```

**Problem:** Query returned undefined/null
**Check:**
- Network tab - did API return 404 or 403?
- Is employee authorized to view this action?
- Does the action belong to this employee?

---

## 📝 Report Template

After checking the console and network tab, provide this information:

### Console Logs
```
[EMPLOYEE HR ACTION DETAIL] Response data: 
[paste the logged object]

[EMPLOYEE HR ACTION DETAIL] Action Type: 
[paste the value]

[EMPLOYEE HR ACTION DETAIL] Action keys: 
[paste the array]
```

### Network Response
```json
[paste the EXACT JSON from Network tab Response]
```

### Database Record
```sql
[paste the SQL query result]
```

---

## 🔧 Quick Fixes Based on Findings

### If response is wrapped:

**Current:**
```typescript
return res.data;
```

**Change to:**
```typescript
return res.data.data;  // or whatever the wrapper is
```

### If field names are different:

**Check what backend actually returns vs. what frontend expects**

Example mismatch:
- Backend: `actionType`
- Frontend expects: `type`

Solution: Use correct field name from backend

### If dates are strings but showing as "—":

The `formatDate` utility should handle this. Check if the string is actually valid:
```javascript
console.log('Date value:', action.incidentDate);
console.log('Date type:', typeof action.incidentDate);
console.log('Is valid:', !isNaN(new Date(action.incidentDate).getTime()));
```

---

## ✅ Verification Test

After fixing, create a NEW test HR Action:

1. Login as HR
2. Go to Employees page
3. Click AlertTriangle icon on an employee
4. Fill form:
   - Action Type: **ATTENDANCE_WARNING**
   - Severity: **MEDIUM**
   - Subject: **Test HR Action Debug**
   - Reason: **Testing data flow from HR to Employee Portal.**
   - Incident Date: **Today**
   - Corrective Action: **Please follow attendance policy.**
   - Response Required: **Yes**
5. Click **Issue & Send**
6. Note the Action Number (e.g., FCS-HRA-0005)
7. Logout
8. Login as the Employee
9. Go to Employee Portal → HR Actions
10. Click on the test action

**Expected Result:**
- Action Type: **Attendance Warning**
- Subject: **Test HR Action Debug**
- Reason: **Testing data flow from HR to Employee Portal.**
- All fields populated correctly
- NO "—" or "N/A" for fields that have data

---

## 🚨 IMPORTANT

**DO NOT PROCEED TO FIX** until you have:
1. ✅ Console logs showing actual response structure
2. ✅ Network tab showing actual JSON response
3. ✅ Database query showing actual record values

**Only then can we determine:**
- Where the data is being lost
- What needs to be fixed
- Whether it's backend, frontend, or mapping issue

---

**Next Step:** Run through STEP 1-4 above and provide the console logs and network response.
