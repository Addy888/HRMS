# EMPLOYEE ID MANAGEMENT - TESTING GUIDE

## 🧪 MANUAL TESTING STEPS

### Prerequisites
- Backend running on: http://localhost:4000/api/v1
- Frontend running on: http://localhost:3000
- Logged in as HR user

---

## TEST 1: Check Next Available Employee ID (API)

### Using Browser/Postman:
```
GET http://localhost:4000/api/v1/employees/next-employee-id
Authorization: Bearer <your-jwt-token>
```

**Expected Response**:
```json
{
  "nextEmployeeId": "FCS0160"
}
```

*(Or next sequential number if FCS0160+ already exist)*

---

## TEST 2: Auto-Generate Mode (Frontend)

### Steps:
1. Navigate to: http://localhost:3000/hr/employees
2. Click "Create Employee" button
3. **Verify**: "Auto Generate" button is selected (blue background)
4. **Verify**: You see a preview box showing:
   ```
   ℹ️ Next Employee ID
   FCS0160
   Employee ID will be automatically assigned upon creation.
   ```
5. Fill in required fields:
   - First Name: `Test`
   - Last Name: `Employee`
   - Email: `test.auto@fcs.com`
   - Monthly Salary: `50000`
6. Click "Create Employee"

**Expected Result**:
- Success message: "Employee created successfully! Employee ID: FCS0160"
- Employee appears in list with ID FCS0160

---

## TEST 3: Manual Mode - Valid ID

### Steps:
1. Click "Create Employee" button
2. Click "Enter Manually" button
3. **Verify**: Employee ID input field appears
4. Enter Employee ID: `FCS0155`
5. Fill in required fields:
   - First Name: `Legacy`
   - Last Name: `Employee`
   - Email: `legacy@fcs.com`
   - Monthly Salary: `45000`
6. Click "Create Employee"

**Expected Result**:
- Success message: "Employee created successfully! Employee ID: FCS0155"
- Employee appears in list with ID FCS0155

---

## TEST 4: Manual Mode - Duplicate ID

### Steps:
1. Click "Create Employee" button
2. Click "Enter Manually"
3. Enter Employee ID: `FCS0151` (existing employee)
4. Fill in other required fields
5. Click "Create Employee"

**Expected Result**:
- Error alert: "Employee ID FCS0151 already exists. Please use a different Employee ID."
- Employee is NOT created

---

## TEST 5: Manual Mode - Invalid Format (No Prefix)

### Steps:
1. Click "Create Employee" button
2. Click "Enter Manually"
3. Enter Employee ID: `ABC123`
4. Fill in other fields
5. Click "Create Employee"

**Expected Result**:
- Error alert: "Employee ID must follow format FCS#### (e.g., FCS0151, FCS0160)"
- Employee is NOT created

---

## TEST 6: Manual Mode - Invalid Format (With Dash)

### Steps:
1. Click "Create Employee" button
2. Click "Enter Manually"
3. Enter Employee ID: `FCS-0160`
4. Fill in other fields
5. Click "Create Employee"

**Expected Result**:
- Error alert: "Employee ID must follow format FCS#### (e.g., FCS0151, FCS0160)"
- Employee is NOT created

---

## TEST 7: Manual Mode - Empty ID

### Steps:
1. Click "Create Employee" button
2. Click "Enter Manually"
3. Leave Employee ID field empty
4. Fill in other fields
5. Click "Create Employee"

**Expected Result**:
- Frontend validation error: "Please enter an Employee ID"
- Employee is NOT created

---

## TEST 8: Switch Between Modes

### Steps:
1. Click "Create Employee" button
2. **Verify**: Auto Generate is selected, preview shows next ID
3. Click "Enter Manually"
4. **Verify**: Preview disappears, input field appears
5. Click "Auto Generate"
6. **Verify**: Input field disappears, preview reappears

**Expected Result**:
- UI switches correctly between modes
- No errors or console warnings

---

## TEST 9: Sequential Auto-Generation

### Steps:
1. Create employee with Auto-Generate → Get FCS0160
2. Create another employee with Auto-Generate → Should get FCS0161
3. Create another employee with Auto-Generate → Should get FCS0162

**Expected Result**:
- Each employee gets sequential ID
- No duplicate IDs
- No gaps in sequence

---

## TEST 10: Mixed Mode Creation

### Steps:
1. Create employee with Auto-Generate → FCS0160
2. Create employee with Manual: FCS0200
3. Create employee with Auto-Generate → Should get FCS0201 (not FCS0161)

**Expected Result**:
- Auto-generate always uses highest existing ID + 1
- Manual ID FCS0200 becomes the new highest
- Next auto-generated is FCS0201

---

## 🔍 VERIFICATION CHECKLIST

After completing tests, verify:

- [ ] Auto-generate mode shows preview correctly
- [ ] Manual mode shows input field correctly
- [ ] Mode switching works without errors
- [ ] Auto-generated IDs are sequential
- [ ] Auto-generation never goes below FCS0160
- [ ] Manual IDs can be any valid FCS#### format
- [ ] Duplicate manual IDs are rejected
- [ ] Invalid formats are rejected with clear errors
- [ ] Success messages show the actual assigned Employee ID
- [ ] Employee list displays all created employees correctly
- [ ] No console errors during any operation

---

## 🐛 TROUBLESHOOTING

### Issue: Preview shows FCS0151 instead of FCS0160
**Cause**: Existing employees with IDs below 0160  
**Expected**: System should still generate FCS0160 as minimum  
**Check**: Backend `generateProductionEmployeeId` uses `Math.max(lastSequence + 1, 160)`

### Issue: Duplicate ID error not shown
**Cause**: Backend validation not working  
**Check**: Prisma unique constraint on `employeeId` field

### Issue: Invalid format accepted
**Cause**: Frontend validation bypassed  
**Check**: Both frontend and backend validation should reject

### Issue: Next ID preview doesn't update after creation
**Cause**: Query not invalidated  
**Fix**: Check `queryClient.invalidateQueries({ queryKey: ['next-employee-id'] })`

---

## 📊 EXPECTED DATABASE STATE

After running all tests, your Employee table should have records like:

```
FCS0151  |  Aditya Shastri    (existing)
FCS0152  |  Previous Employee (existing)
FCS0155  |  Legacy Employee   (TEST 3 - manual)
FCS0160  |  Test Employee     (TEST 2 - auto)
FCS0161  |  Sequential Test   (TEST 9 - auto)
FCS0162  |  Sequential Test   (TEST 9 - auto)
FCS0200  |  Manual High ID    (TEST 10 - manual)
FCS0201  |  After Manual      (TEST 10 - auto)
```

---

## ✅ SUCCESS CRITERIA

All tests pass if:

1. ✅ Auto-generate creates sequential IDs starting from FCS0160
2. ✅ Manual entry accepts valid custom IDs
3. ✅ Duplicate IDs are rejected with clear error
4. ✅ Invalid formats are rejected with clear error
5. ✅ UI switches between modes correctly
6. ✅ Success messages show actual assigned IDs
7. ✅ No duplicate IDs created under any circumstance
8. ✅ Existing employee IDs remain unchanged

