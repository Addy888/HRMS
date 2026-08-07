# Testing Accept & Reject Workflow

## Prerequisites
- ✅ Backend running on http://localhost:4000/api/v1
- ✅ Frontend running on http://localhost:3000
- ✅ HR user credentials available
- ✅ At least one OPEN complaint exists in database

---

## Test 1: Accept Workflow

### Steps:
1. Login as HR user
2. Navigate to `/hr/complaints`
3. Click on an OPEN complaint (blue badge)
4. Verify you see:
   - 🟢 Accept button
   - 🔴 Reject button
5. Click "🟢 Accept"
6. Confirm the dialog
7. Wait for mutation to complete

### Expected Results:
- ✅ Status badge changes to "IN PROGRESS" (indigo color)
- ✅ Accept/Reject buttons disappear
- ✅ Timeline shows new entry: "ACCEPTED"
- ✅ Timeline details: "Ticket accepted by HR and moved to IN_PROGRESS"
- ✅ Page refreshes automatically
- ✅ Employee receives notification

### Verify Database:
```sql
SELECT 
  complaintNumber,
  status,
  acceptedById,
  acceptedAt
FROM Complaint 
WHERE status = 'IN_PROGRESS' AND acceptedById IS NOT NULL;
```

Should show:
- status = "IN_PROGRESS"
- acceptedById = HR Employee ID (UUID)
- acceptedAt = Current timestamp

---

## Test 2: Reject Workflow

### Steps:
1. Ensure you have another OPEN complaint
2. Navigate to complaint detail page
3. Verify Accept/Reject buttons are visible
4. Click "🔴 Reject"
5. Modal should appear with:
   - Title: "Reject Complaint"
   - Required textarea
   - Cancel button
   - Reject button (disabled initially)
6. Try clicking "Reject Complaint" without entering reason
7. Verify error: "Please provide a reason for rejection"
8. Enter reason: "This issue should be directed to IT Support, not HR."
9. Click "Reject Complaint"
10. Wait for mutation

### Expected Results:
- ✅ Modal closes automatically
- ✅ Status badge changes to "REJECTED" (red color)
- ✅ Accept/Reject buttons disappear
- ✅ Timeline shows new entry: "REJECTED"
- ✅ Timeline details includes the reason
- ✅ Page refreshes automatically
- ✅ Employee receives notification with reason

### Verify Database:
```sql
SELECT 
  complaintNumber,
  status,
  rejectedById,
  rejectedAt,
  rejectReason
FROM Complaint 
WHERE status = 'REJECTED';
```

Should show:
- status = "REJECTED"
- rejectedById = HR Employee ID (UUID)
- rejectedAt = Current timestamp
- rejectReason = The entered text

---

## Test 3: Button Visibility Rules

### Test 3A: OPEN Status
- Navigate to OPEN complaint
- ✅ Accept button visible
- ✅ Reject button visible

### Test 3B: IN_PROGRESS Status
- Navigate to IN_PROGRESS complaint
- ❌ Accept button hidden
- ❌ Reject button hidden

### Test 3C: RESOLVED Status
- Navigate to RESOLVED complaint
- ❌ Accept button hidden
- ❌ Reject button hidden
- ✅ Reopen button visible (existing feature)

### Test 3D: REJECTED Status
- Navigate to REJECTED complaint
- ❌ Accept button hidden
- ❌ Reject button hidden

### Test 3E: CLOSED Status
- Navigate to CLOSED complaint
- ❌ Accept button hidden
- ❌ Reject button hidden

---

## Test 4: Employee Dashboard

### Steps:
1. Logout from HR account
2. Login as the employee who raised the complaint
3. Navigate to `/employee/complaints`
4. Check notifications bell icon

### Expected Results:
- ✅ Dashboard stats show correct counts
- ✅ Ticket list shows updated status
- ✅ Accepted ticket shows "IN PROGRESS" badge
- ✅ Rejected ticket shows "REJECTED" badge
- ✅ Notification received for accept action
- ✅ Notification received for reject action
- ✅ Reject notification includes reason

---

## Test 5: API Endpoints

### Test Accept Endpoint
```bash
# Replace {{ticket_id}} with actual OPEN complaint ID
# Replace {{auth_token}} with HR user JWT token

POST http://localhost:4000/api/v1/admin/complaints/{{ticket_id}}/accept
Authorization: Bearer {{auth_token}}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "IN_PROGRESS",
    "acceptedById": "...",
    "acceptedAt": "2026-08-07T...",
    ...
  }
}
```

### Test Reject Endpoint
```bash
POST http://localhost:4000/api/v1/admin/complaints/{{ticket_id}}/reject
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "rejectReason": "This complaint does not fall under HR jurisdiction."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "REJECTED",
    "rejectedById": "...",
    "rejectedAt": "2026-08-07T...",
    "rejectReason": "This complaint does not fall under HR jurisdiction.",
    ...
  }
}
```

---

## Test 6: Error Handling

### Test 6A: Accept Non-OPEN Ticket
- Try to accept a ticket with status IN_PROGRESS
- Expected: 400 Bad Request
- Message: "Only OPEN complaints can be accepted"

### Test 6B: Reject Non-OPEN Ticket
- Try to reject a ticket with status RESOLVED
- Expected: 400 Bad Request
- Message: "Only OPEN complaints can be rejected"

### Test 6C: Reject Without Reason
- Send reject request with empty rejectReason
- Expected: 400 Bad Request
- Validation error for required field

### Test 6D: Unauthorized Access
- Try endpoints without auth token
- Expected: 401 Unauthorized

### Test 6E: Employee Role Access
- Try endpoints with employee JWT token
- Expected: 403 Forbidden (role guard)

---

## Test 7: Timeline Verification

### Check Accept Timeline
Navigate to an accepted complaint and verify timeline shows:
- Action: "ACCEPTED"
- Details: "Ticket accepted by HR and moved to IN_PROGRESS"
- Actor: HR user name
- Timestamp: Recent date/time

### Check Reject Timeline
Navigate to a rejected complaint and verify timeline shows:
- Action: "REJECTED"
- Details: "Ticket rejected by HR. Reason: {reason}"
- Actor: HR user name
- Timestamp: Recent date/time

---

## Test 8: Concurrent Operations

### Test 8A: Double Click Prevention
1. Click Accept button
2. Immediately click again before mutation completes
3. Expected: Button disabled during loading
4. Only one request sent

### Test 8B: Modal Spam Prevention
1. Click Reject button multiple times
2. Expected: Only one modal opens

---

## Test 9: Modal Functionality

### Test 9A: Modal Close Methods
1. Open reject modal
2. Test closing via:
   - ✅ X button (top right)
   - ✅ Cancel button
   - ✅ (Optional) Click outside modal

### Test 9B: Modal Reset
1. Open reject modal
2. Enter some text in reason field
3. Enter error state (try submitting empty)
4. Close modal
5. Reopen modal
6. Verify: Text cleared, error cleared

---

## Test 10: UI/UX Validation

### Visual Checks:
- ✅ Accept button is green with check icon
- ✅ Reject button is red with alert icon
- ✅ Buttons have hover states
- ✅ Loading spinner shows during mutation
- ✅ Modal has backdrop blur effect
- ✅ Modal is centered on screen
- ✅ Modal textarea has focus state
- ✅ Error messages are red and visible
- ✅ Required field marked with red asterisk

### Responsive Checks:
- ✅ Buttons stack properly on mobile
- ✅ Modal is scrollable if content overflows
- ✅ Modal doesn't break layout

---

## Success Criteria

All tests must pass:
- ✅ Accept workflow completes successfully
- ✅ Reject workflow with modal completes successfully
- ✅ Buttons only visible for OPEN status
- ✅ Database fields updated correctly
- ✅ Timeline entries created
- ✅ Notifications sent to employee
- ✅ Employee dashboard reflects changes
- ✅ API endpoints return correct responses
- ✅ Error handling works properly
- ✅ UI/UX meets requirements

---

## Rollback Plan (If Needed)

If critical bugs found:

1. Stop backend
2. Revert database migration:
```sql
ALTER TABLE `Complaint` 
DROP FOREIGN KEY `Complaint_acceptedById_fkey`,
DROP FOREIGN KEY `Complaint_rejectedById_fkey`,
DROP COLUMN `acceptedById`,
DROP COLUMN `acceptedAt`,
DROP COLUMN `rejectedById`,
DROP COLUMN `rejectedAt`,
DROP COLUMN `rejectReason`;
```

3. Revert code changes using git

---

## Test Report Template

Date: ___________  
Tester: ___________  
Environment: Development

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| Test 1 | Accept Workflow | ☐ Pass ☐ Fail | |
| Test 2 | Reject Workflow | ☐ Pass ☐ Fail | |
| Test 3 | Button Visibility | ☐ Pass ☐ Fail | |
| Test 4 | Employee Dashboard | ☐ Pass ☐ Fail | |
| Test 5 | API Endpoints | ☐ Pass ☐ Fail | |
| Test 6 | Error Handling | ☐ Pass ☐ Fail | |
| Test 7 | Timeline Verification | ☐ Pass ☐ Fail | |
| Test 8 | Concurrent Operations | ☐ Pass ☐ Fail | |
| Test 9 | Modal Functionality | ☐ Pass ☐ Fail | |
| Test 10 | UI/UX Validation | ☐ Pass ☐ Fail | |

**Overall Result:** ☐ PASS ☐ FAIL

**Sign-off:** ___________
