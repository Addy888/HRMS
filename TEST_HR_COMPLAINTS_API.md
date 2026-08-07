# 🔍 HR Complaints API Diagnostic Guide

## Issue
- HR Dashboard shows: **Open Tickets = 2**
- HR Ticket Queue shows: **EMPTY TABLE**

## Diagnostic Steps

### Step 1: Check Backend Logs

**Start the backend in watch mode:**
```bash
cd backend
npm run start:dev
```

**Watch for console output when HR page loads:**
```
=== HR DASHBOARD STATS DEBUG ===
Dashboard Stats:
- Total: X
- Open: 2
- In Progress: X
- Resolved: X
- Closed: X
================================

=== HR COMPLAINTS QUEUE DEBUG ===
User ID: xxx-xxx-xxx
User Role: HR
Employee ID: xxx-xxx-xxx
Query Params: { page: '1', limit: '10' }
Prisma Where Clause: {}
Tickets Found: X
Total Count: X
================================
```

### Step 2: Compare Counts

**If Dashboard Stats shows 2 but Queue shows 0:**
- Problem is in the query or data mapping
- Check the logs for the Prisma where clause

**If both show 2:**
- Problem is in frontend data extraction
- Check browser console for errors

### Step 3: Test API Directly

**Open Postman/Insomnia or use curl:**

**Get HR Stats:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/complaints/dashboard/stats" \
  -H "Authorization: Bearer YOUR_HR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "total": 2,
    "open": 2,
    "inProgress": 0,
    "resolved": 0,
    "closed": 0,
    "highPriority": 0,
    "critical": 0,
    "averageResolutionTime": 0
  }
}
```

**Get HR Complaints List:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/complaints?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_HR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "...",
      "complaintNumber": "HD-2026-000001",
      "title": "Test Complaint",
      "status": "OPEN",
      ...
    },
    {
      "id": "...",
      "complaintNumber": "HD-2026-000002",
      "title": "Another Complaint",
      "status": "OPEN",
      ...
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Step 4: Check Database Directly

**Connect to PostgreSQL:**
```bash
# If using psql
psql -h localhost -U your_user -d your_database

# Or use Prisma Studio
cd backend
npx prisma studio
```

**Query complaints:**
```sql
SELECT 
  "complaintNumber",
  "title",
  "status",
  "priority",
  "raisedById",
  "createdAt"
FROM "Complaint"
ORDER BY "createdAt" DESC;
```

**Check if tickets exist:**
- If tickets exist in DB → Backend query issue
- If tickets don't exist → Creation issue (but you said employee side works)

### Step 5: Check Frontend Console

**Open Browser DevTools (F12) → Console Tab**

**Look for React Query logs:**
```javascript
// Should show the API call
GET /admin/complaints?page=1&limit=10

// Check the response
{
  success: true,
  data: [...],  // Should have tickets
  meta: {...}
}
```

**Check the component state:**
```javascript
// In the component, log the data
console.log('Queue Data:', queueData);
console.log('Queue List:', queueList);
console.log('Meta:', meta);
```

### Step 6: Common Issues & Solutions

#### Issue 1: Frontend Data Extraction
**Symptom**: Backend returns data but frontend shows empty

**Check**: Is the frontend correctly extracting data?
```typescript
// CORRECT
const queueList = queueData?.data ?? [];

// WRONG
const queueList = queueData?.data?.data ?? [];
```

**Solution**: Already fixed in previous update. Verify the fix is applied.

#### Issue 2: Search Filter Breaking Query
**Symptom**: Query fails when search string has special characters

**Check Backend Logs**: Look for Prisma errors

**Solution**: Use `mode: 'insensitive'` in contains filters (already added)

#### Issue 3: Role Guard Blocking
**Symptom**: 403 Forbidden error

**Check**: Is the user actually HR role?
```sql
SELECT u.id, u.email, r.name as role
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = 'hr@company.com';
```

**Solution**: Ensure user has role 'HR' or 'Admin'

#### Issue 4: Empty Where Clause
**Symptom**: Where clause is empty `{}`

**This is CORRECT for HR!** HR should see all tickets.

**Solution**: No fix needed - this is expected behavior.

### Step 7: Verify Fix Works

1. **Login as Employee**
   - Create a new complaint
   - Verify it appears in employee list

2. **Login as HR**
   - Refresh the page
   - Check dashboard stats → Should increase
   - Check table → Should show the new ticket

3. **Test Filters**
   - Apply status filter → Should work
   - Apply search → Should work
   - Clear filters → Should show all tickets

## Quick Fix Summary

The issue was in frontend data extraction. The fix changed:

**BEFORE (Wrong):**
```typescript
const res = await api.get('/admin/complaints?...');
return res.data?.data ?? res.data;  // Double extraction
```

**AFTER (Correct):**
```typescript
const res = await api.get('/admin/complaints?...');
return res.data;  // Single extraction, let component handle
```

**In Component:**
```typescript
const queueList = queueData?.data ?? [];
const meta = queueData?.meta ?? {};
```

## Expected Console Logs After Fix

**Backend:**
```
=== HR COMPLAINTS QUEUE DEBUG ===
User ID: xxx
User Role: HR
Query Params: { page: '1', limit: '10' }
Prisma Where Clause: {}
Tickets Found: 2
Total Count: 2
================================
```

**Frontend (Browser Console):**
```javascript
{
  success: true,
  statusCode: 200,
  data: Array(2),  // 2 tickets
  meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
}
```

## Next Steps

1. Start backend with logs
2. Refresh HR complaints page
3. Check backend console logs
4. Check browser console
5. Compare the counts
6. If still empty, share the logs for further investigation

**The fix has already been applied. Test it now!** 🚀
