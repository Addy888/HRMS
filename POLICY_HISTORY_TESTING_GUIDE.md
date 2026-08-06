# Policy History - Testing Guide

## 🧪 How to Test the Fix

### Prerequisites
- Backend server running
- Frontend server running
- At least one HR user account
- At least one Employee user account

---

## Test Scenario 1: Upload Multiple Policies

### Steps:
1. **Login as HR**
2. **Navigate to:** Company Policies section
3. **Upload First Policy:**
   - Name: "Leave Policy"
   - Version: "1.0"
   - Upload PDF file
   - ✅ **Expected:** Policy created successfully

4. **Upload Second Policy (Same Name, Different Version):**
   - Name: "Leave Policy"
   - Version: "2.0"
   - Upload PDF file
   - ✅ **Expected:** New policy created (doesn't replace v1.0)

5. **Upload Third Policy (Different Name):**
   - Name: "WFH Policy"
   - Version: "1.0"
   - Upload PDF file
   - ✅ **Expected:** New policy created

### Verify in Database:
```sql
SELECT id, policyName, version, status, createdAt 
FROM "CompanyPolicy" 
ORDER BY createdAt DESC;
```

**Expected Result:**
```
id   | policyName   | version | status  | createdAt
-----|--------------|---------|---------|------------------
003  | WFH Policy   | 1.0     | ACTIVE  | 2024-XX-XX XX:XX
002  | Leave Policy | 2.0     | ACTIVE  | 2024-XX-XX XX:XX
001  | Leave Policy | 1.0     | ACTIVE  | 2024-XX-XX XX:XX
```

✅ **All policies have status = 'ACTIVE'**
✅ **Nothing was archived**

---

## Test Scenario 2: Employee Views All Policies

### Steps:
1. **Login as Employee**
2. **Navigate to:** Policy Center (`/employee/policies`)
3. **Scroll to Company Policies section**

### Expected Result:
You should see **3 purple company policy cards:**

```
┌─────────────────────────────────────────────┐
│ 📄 WFH Policy                               │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 1.0 • Uploaded: Jan 4, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 2.0 • Uploaded: Jan 3, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 1.0 • Uploaded: Jan 1, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘
```

✅ **All 3 policies visible**
✅ **Sorted newest first**
✅ **All show "PENDING" status**

---

## Test Scenario 3: Accept First Policy

### Steps:
1. **Still logged in as Employee**
2. **Click "Accept Policy"** on "Leave Policy v1.0"
3. **Observe the UI**

### Expected Immediate Changes (NO REFRESH):
1. ✅ Button changes to green badge: **"✓ Accepted"**
2. ✅ Status badge changes from PENDING to **"✓ ACCEPTED"**
3. ✅ "Accepted: [date]" appears in metadata
4. ✅ Other policies remain PENDING
5. ✅ Progress bar updates
6. ✅ Filter counts update

### Updated View:
```
┌─────────────────────────────────────────────┐
│ 📄 WFH Policy                               │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 1.0 • Uploaded: Jan 4, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 2.0 • Uploaded: Jan 3, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [✓ ACCEPTED]               │
│ Version 1.0 • Uploaded: Jan 1, 2024         │
│ Accepted: Jan 5, 2024                       │
│ [View Policy] [✓ Accepted]                  │
└─────────────────────────────────────────────┘
```

✅ **Policy v1.0 shows ACCEPTED**
✅ **Policies v2.0 and WFH still PENDING**
✅ **All 3 policies still visible**

---

## Test Scenario 4: Upload Fourth Policy (Critical Test)

### Steps:
1. **Logout from Employee**
2. **Login as HR**
3. **Upload Fourth Policy:**
   - Name: "IT Usage Policy"
   - Version: "1.0"
   - Upload PDF file

4. **Logout from HR**
5. **Login as Employee again**
6. **Navigate to Policy Center**

### Expected Result:
You should now see **4 company policy cards:**

```
┌─────────────────────────────────────────────┐
│ 📄 IT Usage Policy                          │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 1.0 • Uploaded: Jan 5, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 WFH Policy                               │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 1.0 • Uploaded: Jan 4, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [PENDING]                  │
│ Version 2.0 • Uploaded: Jan 3, 2024         │
│ [View Policy] [Accept Policy]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Leave Policy                             │
│ [COMPANY POLICY] [✓ ACCEPTED]               │
│ Version 1.0 • Uploaded: Jan 1, 2024         │
│ Accepted: Jan 5, 2024                       │
│ [View Policy] [✓ Accepted]                  │
└─────────────────────────────────────────────┘
```

### 🚨 **CRITICAL CHECK:**
✅ **Previously accepted "Leave Policy v1.0" still shows ACCEPTED**
✅ **All 4 policies visible**
✅ **Nothing disappeared**

**THIS IS THE BUG FIX!** Before, the accepted policy would have disappeared.

---

## Test Scenario 5: Filter Functionality

### Steps:
1. **Click "ALL" tab**
   - ✅ Shows: All 4 policies
   - ✅ Count: "All (4)"

2. **Click "PENDING" tab**
   - ✅ Shows: IT Usage, WFH, Leave v2.0 (3 policies)
   - ✅ Count: "Pending (3)"
   - ✅ Hides: Leave v1.0 (accepted)

3. **Click "ACCEPTED" tab**
   - ✅ Shows: Leave v1.0 only (1 policy)
   - ✅ Count: "Accepted (1)"
   - ✅ Hides: All pending policies

---

## Test Scenario 6: Progress Calculation

### Check Progress Bar:
Assuming employee also has 5 regular policies (3 accepted, 2 pending):

**Calculation:**
```
Company Policies: 4 total (1 accepted, 3 pending)
Regular Policies: 5 total (3 accepted, 2 pending)

Total Assigned: 4 + 5 = 9 policies
Total Accepted: 1 + 3 = 4 policies
Progress: 4 ÷ 9 = 44%
```

**Expected Display:**
```
Acceptance Progress
4 of 9 policies accepted
[████████░░░░░░░░░░] 44%
4 pending
```

---

## Test Scenario 7: Search Functionality

### Search Tests:
1. **Search: "Leave"**
   - ✅ Shows: Leave Policy v1.0 and v2.0
   - ✅ Hides: WFH Policy, IT Usage Policy

2. **Search: "v2.0"**
   - ✅ Shows: Leave Policy v2.0 only
   - ✅ Hides: All other policies

3. **Search: "Jan 5"**
   - ✅ Shows: IT Usage Policy (uploaded Jan 5)
   - ✅ Hides: Older policies

4. **Search: "xyz"**
   - ✅ Shows empty state
   - ✅ Message: "No policies match your search or filter"
   - ✅ Shows "Clear filters" button

---

## Test Scenario 8: Database Integrity

### Check CompanyPolicyAcceptance Table:
```sql
SELECT cpa.id, cp.policyName, cp.version, e.firstName, cpa.status, cpa.acceptedAt
FROM "CompanyPolicyAcceptance" cpa
JOIN "CompanyPolicy" cp ON cpa."companyPolicyId" = cp.id
JOIN "Employee" e ON cpa."employeeId" = e.id
ORDER BY cp.createdAt DESC;
```

**Expected Result:**
```
policyName       | version | firstName | status   | acceptedAt
-----------------|---------|-----------|----------|------------------
IT Usage Policy  | 1.0     | John      | PENDING  | NULL
WFH Policy       | 1.0     | John      | PENDING  | NULL
Leave Policy     | 2.0     | John      | PENDING  | NULL
Leave Policy     | 1.0     | John      | ACCEPTED | 2024-01-05 XX:XX
```

✅ **Each policy has its own acceptance record**
✅ **Old acceptance preserved**
✅ **New policies auto-assigned**

---

## Test Scenario 9: HR View (Bonus)

### Steps:
1. **Login as HR**
2. **Navigate to Company Policies list**

### Expected Result:
```
Company Policies (4)

IT Usage Policy     v1.0  ACTIVE  Jan 5, 2024
WFH Policy          v1.0  ACTIVE  Jan 4, 2024
Leave Policy        v2.0  ACTIVE  Jan 3, 2024
Leave Policy        v1.0  ACTIVE  Jan 1, 2024
```

✅ **All policies listed**
✅ **All show "ACTIVE" status**
✅ **No policies archived**

---

## 🐛 What to Watch For (Bugs to Avoid)

### ❌ **Bug Indicators:**
1. After uploading new policy, old policies disappear
2. After uploading new policy, old acceptances lost
3. Employee sees only one company policy
4. Progress bar doesn't include company policies
5. Filter counts don't include company policies
6. Database shows policies with status = 'ARCHIVED'
7. Accepting a policy causes other policies to hide
8. Page refresh required to see updated status

### ✅ **Success Indicators:**
1. All uploaded policies remain visible forever
2. Accepted policies show green badges
3. Pending policies show orange badges
4. Progress bar updates immediately
5. Filter counts update immediately
6. No page refresh needed
7. Search works across all policies
8. Newest policies appear first

---

## 📊 Performance Testing

### Load Test:
1. Upload 20 company policies
2. Check employee page load time
3. Check filter responsiveness
4. Check search performance

**Expected:**
- Page loads in < 2 seconds
- Filters apply instantly
- Search responds in < 100ms
- No lag or stuttering

---

## 🔒 Security Testing

### Access Control:
1. **Try to accept policy as HR** → Should fail (role check)
2. **Try to upload policy as Employee** → Should fail (role check)
3. **Try to view policy without login** → Should fail (auth check)
4. **Try to accept another employee's policy** → Should fail (ownership check)

---

## 📱 Responsive Testing

### Test on Different Screen Sizes:
1. **Desktop (1920x1080)**
   - ✅ Policy cards in 3-column grid
   - ✅ All content readable

2. **Tablet (768x1024)**
   - ✅ Policy cards in 2-column grid
   - ✅ Text doesn't overflow

3. **Mobile (375x667)**
   - ✅ Policy cards in single column
   - ✅ Buttons stack vertically
   - ✅ Scrollable and readable

---

## ✅ Final Checklist

- [ ] Multiple policies can be uploaded
- [ ] All policies remain visible after new upload
- [ ] Accepted policies show green badge
- [ ] Pending policies show orange badge
- [ ] Progress bar includes all policies
- [ ] Filter counts are accurate
- [ ] Search works correctly
- [ ] No page refresh needed after acceptance
- [ ] Database shows all policies as ACTIVE
- [ ] Acceptance records preserved
- [ ] HR can view all policies
- [ ] Employee can view only assigned policies
- [ ] Performance is acceptable
- [ ] Security checks pass
- [ ] Responsive on all devices

---

## 🆘 Troubleshooting

### Problem: Employee sees no company policies
**Check:**
- Is employee logged in?
- Are policies assigned to employee in DB?
- Check network tab for API errors
- Check backend logs

### Problem: Policy disappeared after upload
**Check:**
- Backend uploadPolicy() method
- Look for "ARCHIVED" status in database
- This means the fix didn't apply correctly

### Problem: Acceptance not updating
**Check:**
- Network tab for API call
- Backend logs for errors
- React Query cache invalidation
- CompanyPolicyAcceptance table in DB

### Problem: Progress bar wrong percentage
**Check:**
- Console for calculation logs
- Total policies count
- Accepted policies count
- Are company policies included in calculation?

---

## 📝 Test Report Template

```
# Policy History Test Report
Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]

## Test Results

### Scenario 1: Upload Multiple Policies
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Scenario 2: Employee Views All Policies
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 3: Accept First Policy
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 4: Upload Fourth Policy
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 5: Filter Functionality
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 6: Progress Calculation
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 7: Search Functionality
- Status: [ ] PASS [ ] FAIL
- Notes:

### Scenario 8: Database Integrity
- Status: [ ] PASS [ ] FAIL
- Notes:

## Overall Result
- [ ] All tests PASSED - Ready for deployment
- [ ] Some tests FAILED - See notes above
- [ ] Critical bug found - Do not deploy

## Bugs Found
1. [Description]
2. [Description]

## Sign-off
Tested by: _______________
Date: _______________
```

---

**Remember:** The critical test is Scenario 4. If previously accepted policies remain visible after uploading a new policy, the fix is working! ✅
