# 🧪 HELPDESK WORKFLOW TESTING GUIDE

## Quick Test Scenarios

### 🎯 Scenario 1: Complete Employee Flow

1. **Login as Employee**
   - Navigate to `/employee/complaints`
   - Verify dashboard shows 4 stat cards

2. **Create New Complaint**
   - Click "File Complaint" button
   - Fill form:
     - Category: Salary Issue
     - Priority: High
     - Subject: "July salary not credited"
     - Description: "My salary for July has not been credited to my account"
     - Upload a file (optional)
     - Check "Submit Anonymously" (optional)
   - Click "File Complaint"
   - Verify success toast appears
   - Verify redirect to complaints list

3. **Verify Ticket Created**
   - Check ticket appears in list with format HD-2026-XXXXXX
   - Status should be "OPEN"
   - Priority badge should show "HIGH"

4. **View Ticket Details**
   - Click "View Details" on the ticket
   - Verify ticket number, subject, description visible
   - Verify timeline shows "COMPLAINT_CREATED" event
   - Verify assigned HR shows "Unassigned"

5. **Reply to Ticket**
   - Type a message: "When can I expect the payment?"
   - Click Send
   - Verify message appears in conversation thread
   - Verify status changes to "IN_PROGRESS"

6. **Close Ticket**
   - After HR resolves, click "Mark Closed / Resolved"
   - Confirm the action
   - Verify status changes to "CLOSED"

---

### 🎯 Scenario 2: Complete HR Flow

1. **Login as HR User**
   - Navigate to `/hr/complaints`
   - Verify dashboard shows 4 stat cards with real counts

2. **View All Tickets Queue**
   - Verify list shows ALL employee tickets
   - Use filters to test:
     - Search by ticket number
     - Filter by Status: OPEN
     - Filter by Priority: HIGH
     - Filter by Category: Salary Issue
   - Click "Reset Filters" to clear

3. **Manage Ticket**
   - Click "Manage" on any ticket
   - Verify full ticket details visible
   - Verify employee details shown (even if anonymous)

4. **Assign Ticket**
   - Select an HR agent from "Assign Ticket Case HR Agent" dropdown
   - Verify success
   - Verify status changes to "ASSIGNED"
   - Verify timeline shows assignment event
   - Verify assignee name appears in metadata

5. **Update Status**
   - Use "Change Status..." dropdown
   - Select "IN_PROGRESS"
   - Verify badge updates immediately
   - Verify timeline event created

6. **Update Priority**
   - Use "Change Priority..." dropdown
   - Change from HIGH to CRITICAL
   - Verify badge animates with pulse
   - Verify timeline event created

7. **Reply to Employee**
   - Type message: "We are checking with finance team"
   - **Test Internal Note**:
     - Check "Mark as Internal Note"
     - Type: "Called finance - processing delay"
     - Send
     - Verify amber badge shows "Internal Note"
   - **Test Regular Reply**:
     - Uncheck internal note
     - Type: "Your salary will be processed tomorrow"
     - Send
     - Verify status changes to "WAITING_FOR_EMPLOYEE"

8. **Resolve Ticket**
   - Scroll to "Resolve Complaint Ticket" section
   - Enter resolution details: "Finance confirmed payment processed. Salary will be credited by EOD tomorrow."
   - Click "Resolve Ticket Case"
   - Verify status changes to "RESOLVED"
   - Verify resolution appears in conversation
   - Verify timeline shows "RESOLVED" event

9. **Reopen Ticket** (Optional Test)
   - Click "Reopen Ticket" button
   - Confirm action
   - Verify status changes back to "IN_PROGRESS"
   - Verify timeline shows "REOPENED" event

---

### 🎯 Scenario 3: Anonymous Ticket Test

1. **As Employee**
   - Create complaint with "Submit Anonymously" checked
   - Submit

2. **As Employee (Same User)**
   - View ticket in own list
   - Open details
   - Verify own messages show as "Anonymous"

3. **As HR**
   - View ticket in queue
   - Verify "Anon" badge shown
   - Open ticket details
   - **Verify HR can see full employee details** (name, email, dept)
   - Reply to ticket
   - Verify employee receives notification

---

### 🎯 Scenario 4: File Attachment Test

1. **Create Complaint with File**
   - Select a PDF or image file
   - Upload (verify under 10MB)
   - Submit complaint

2. **View Ticket**
   - Open ticket details
   - Verify "Attachments" section appears
   - Verify file name and size shown
   - Click download icon
   - Verify file downloads correctly

3. **Test Validation**
   - Try uploading file > 10MB
   - Verify error toast appears
   - Try uploading .exe or unsupported file
   - Verify error message

---

### 🎯 Scenario 5: Search & Filter Test

1. **Employee Dashboard**
   - Create 3 tickets with different statuses
   - Test search by ticket number
   - Test filter by status
   - Test filter by category
   - Verify reset filters button works

2. **HR Dashboard**
   - Test search by employee name
   - Test search by employee ID
   - Test combined filters (status + priority)
   - Test pagination (if > 10 tickets)
   - Verify counts update correctly

---

### 🎯 Scenario 6: Conversation Thread Test

1. **Create Ticket as Employee**
2. **Reply 3 times as Employee**
3. **Reply 2 times as HR** (one internal, one regular)
4. **Reply 2 more times as Employee**

5. **Verify Conversation Display**:
   - Employee view:
     - Should see own messages (left-aligned)
     - Should see HR replies (right-aligned, blue tint)
     - Should NOT see internal notes
   - HR view:
     - Should see all messages
     - Should see internal notes with amber background
     - Should see correct sender labels

---

### 🎯 Scenario 7: Status Flow Test

**Test Complete Status Progression**:

1. Create ticket → Status: **OPEN**
2. HR assigns → Status: **ASSIGNED**
3. HR or employee replies → Status: **IN_PROGRESS**
4. HR replies (non-internal) → Status: **WAITING_FOR_EMPLOYEE**
5. HR resolves → Status: **RESOLVED**
6. Employee/HR closes → Status: **CLOSED**

**Test Rejection Path**:

1. Create ticket → Status: **OPEN**
2. HR changes status to **REJECTED**
3. Verify stays REJECTED

---

### 🎯 Scenario 8: Timeline Verification

**For Each Action, Verify Timeline Event**:

- ✅ Ticket created → "COMPLAINT_CREATED"
- ✅ Ticket assigned → "ASSIGNED"
- ✅ Status changed → "STATUS_CHANGED"
- ✅ Priority changed → "PRIORITY_CHANGED"
- ✅ HR replied → "HR_REPLIED"
- ✅ Employee replied → "EMPLOYEE_REPLIED"
- ✅ Ticket resolved → "RESOLVED"
- ✅ Ticket closed → "CLOSED"
- ✅ Ticket reopened → "REOPENED"

**Verify Timeline Display**:
- Actor name shown
- Action description shown
- Timestamp shown (DD MMM, HH:MM format)
- Visual timeline with dots
- Events in chronological order

---

### 🎯 Scenario 9: Dashboard Stats Validation

1. **Create Test Data**:
   - 2 OPEN tickets
   - 3 IN_PROGRESS tickets
   - 1 RESOLVED ticket
   - 1 CLOSED ticket

2. **Verify Employee Dashboard**:
   - Open Tickets: 2
   - Waiting Response: 0 (or count of WAITING_FOR_EMPLOYEE)
   - Resolved: 1
   - Closed: 1

3. **Verify HR Dashboard**:
   - Open Tickets: 2
   - In Progress: 3
   - Resolved Cases: 1
   - Average Resolution Time: Calculated value
   - High Priority: Count of HIGH priority
   - Critical: Count of CRITICAL priority

---

### 🎯 Scenario 10: Notification Test

**Verify Notifications Sent** (check notifications module):

1. Employee files complaint → HR users get notification
2. HR replies (non-internal) → Employee gets notification
3. Employee replies → Assigned HR gets notification
4. Ticket assigned → Assignee gets notification
5. Ticket resolved → Employee gets notification
6. Ticket closed by HR → Employee gets notification
7. Ticket reopened → Employee gets notification

---

## 🔍 Data Validation Checklist

### Database Checks

1. **Complaint Table**:
   - [x] Ticket number format: HD-YYYY-NNNNNN
   - [x] All fields populated correctly
   - [x] Status enum values correct
   - [x] Priority enum values correct
   - [x] Anonymous flag stored
   - [x] Timestamps auto-generated

2. **ComplaintReply Table**:
   - [x] Messages stored with correct user ID
   - [x] Internal flag stored correctly
   - [x] Timestamps accurate

3. **ComplaintTimeline Table**:
   - [x] All actions logged
   - [x] Actor ID recorded
   - [x] Details descriptive

4. **ComplaintAttachment Table**:
   - [x] File URL stored
   - [x] File metadata correct
   - [x] Files accessible

5. **ComplaintAssignment Table**:
   - [x] Assignment history tracked
   - [x] Assignee and assigner recorded

6. **ComplaintAuditLog Table**:
   - [x] All actions audited
   - [x] IP address and user agent recorded

---

## 🐛 Common Issues & Solutions

### Issue 1: Ticket Number Not Generating
**Solution**: Ensure database count query works and year is current

### Issue 2: File Upload Fails
**Solutions**:
- Check `/uploads/complaints/` directory exists
- Check directory permissions (755)
- Verify file size < 10MB
- Verify file type in allowed list

### Issue 3: Employee Can See Other Tickets
**Solution**: Check `raisedById` filter in employee queries

### Issue 4: Internal Notes Visible to Employee
**Solution**: Verify reply filter excludes `isInternal: true` for employees

### Issue 5: Status Not Updating
**Solution**: Check mutation invalidates query cache correctly

### Issue 6: Notifications Not Sent
**Solution**: Verify NotificationService is injected and fire-and-forget works

---

## ✅ Final Validation

After all tests, verify:

- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] All API calls return 200/201 status
- [ ] Database populated correctly
- [ ] Files uploaded successfully
- [ ] UI responsive on mobile
- [ ] Toast notifications appear for all actions
- [ ] Loading states shown during API calls
- [ ] Empty states display when no data
- [ ] Pagination works with > 10 tickets
- [ ] Filters work independently and combined
- [ ] Search is case-insensitive
- [ ] Anonymous tickets protect identity
- [ ] Timeline shows all events
- [ ] Conversation thread chronological
- [ ] Status badges color-coded correctly
- [ ] Priority badges animate for CRITICAL
- [ ] Resolution time calculated accurately

---

## 🎉 Test Completion

If all scenarios pass, the helpdesk workflow is **FULLY FUNCTIONAL** and ready for production use!

**Happy Testing!** 🚀
