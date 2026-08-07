# 🔍 HELPDESK ROUTING DEBUG & FIX

## Problem
HR can see tickets in the queue, but clicking "Manage" shows "Ticket Not Found".

---

## Investigation Results

### ✅ Step 1: Ticket List API Response
**Endpoint**: `GET /admin/complaints`

**Response Structure**:
```javascript
{
  success: true,
  data: [
    {
      id: "uuid-here",               // ✅ UUID primary key
      complaintNumber: "HD-2026-000001", // Human-readable number
      title: "Ticket title",
      status: "OPEN",
      // ... other fields
    }
  ],
  meta: { total, page, limit, totalPages }
}
```

**Key Finding**: Each ticket has both `id` (UUID) and `complaintNumber`.

### ✅ Step 2: Frontend Navigation
**File**: `frontend/src/app/hr/complaints/page.tsx`

**Current Code**:
```typescript
<Link href={`/hr/complaints/${item.id}`}>
  Manage
</Link>
```

**Identifier Used**: `item.id` (UUID) ✅ **CORRECT**

### ✅ Step 3: Detail Page Parameter
**File**: `frontend/src/app/hr/complaints/[id]/page.tsx`

**Route**: `/hr/complaints/[id]`

**Parameter Extraction**:
```typescript
const params = useParams();
const id = params?.id as string;
```

**Receives**: UUID from URL ✅ **CORRECT**

### ✅ Step 4: Backend Expects
**File**: `backend/src/modules/complaints/complaints.controller.ts`

**Endpoint**: `GET /complaints/:id`

**Service Call**:
```typescript
getComplaintById(id, userId, userRole, ...)
```

**Expects**: UUID ✅ **CORRECT**

### ✅ Step 5: Database Query
**File**: `backend/src/modules/complaints/complaints.service.ts`

**Query**:
```typescript
const complaint = await this.prisma.complaint.findUnique({
  where: { id },  // ✅ Uses UUID
  include: { ... }
});
```

**Lookup Field**: `id` (UUID) ✅ **CORRECT**

---

## ✅ Conclusion

**Everything is using UUID consistently!**

The routing logic is **CORRECT**:
- ✅ Frontend navigates with UUID (`item.id`)
- ✅ Detail page receives UUID from route
- ✅ API call uses UUID
- ✅ Backend query uses UUID
- ✅ Database lookup by UUID

**There is NO routing mismatch.**

---

## 🔍 Debug Logs Added

To help diagnose the actual issue, I've added comprehensive logging:

### Frontend Logs (Browser Console)

**1. When Clicking "Manage"**:
```javascript
=== CLICKED TICKET DEBUG ===
Selected Ticket ID: uuid-here
Selected Ticket Number: HD-2026-000001
Navigating to: /hr/complaints/uuid-here
===========================
```

**2. When Detail Page Loads**:
```javascript
=== HR DETAIL PAGE DEBUG ===
Route Params: { id: "uuid-here" }
Extracted ID: uuid-here
===========================
```

**3. When API Call is Made**:
```javascript
=== FETCHING TICKET DETAIL ===
API Call: GET /complaints/uuid-here
API Response: { success: true, data: {...} }
==============================
```

### Backend Logs (Terminal)

**When Detail API is Called**:
```
=== GET COMPLAINT BY ID DEBUG ===
Route Param (id): uuid-here
User ID: hr-user-id
User Role: HR
Ticket Found: YES
Ticket ID: uuid-here
Ticket Number: HD-2026-000001
================================
```

---

## 🐛 Possible Root Causes

Since routing is correct, the "Ticket Not Found" error could be from:

### 1. **Database Issue**
- Ticket was deleted from database
- Database migration pending
- UUID mismatch in database

**Check**:
```sql
SELECT id, "complaintNumber", title, status 
FROM "Complaint" 
LIMIT 5;
```

### 2. **Permission Issue**
- HR role not properly set
- Employee trying to access ticket they don't own
- Role guard blocking access

**Check Backend Logs**:
- Look for "User Role: EMPLOYEE" when it should be "HR"
- Look for "Access denied" messages

### 3. **Prisma Query Failing**
- Relations not loading (raisedBy, assignedTo, etc.)
- Database schema out of sync

**Check Backend Logs**:
- Look for Prisma errors
- Look for "Ticket Found: NO"

### 4. **Frontend Data Extraction Issue**
- API returns data but frontend extracts incorrectly
- `res.data.data` is undefined

**Check Browser Console**:
- Look at API Response log
- Verify `data` property exists

---

## 🔧 How to Use Debug Logs

### Step 1: Open Browser Console
Press `F12` → Console tab

### Step 2: Click "Manage" on Any Ticket

**Expected Logs**:
```
=== CLICKED TICKET DEBUG ===
Selected Ticket ID: abc-123-def-456
Selected Ticket Number: HD-2026-000001
Navigating to: /hr/complaints/abc-123-def-456
===========================

=== HR DETAIL PAGE DEBUG ===
Route Params: { id: "abc-123-def-456" }
Extracted ID: abc-123-def-456
===========================

=== FETCHING TICKET DETAIL ===
API Call: GET /complaints/abc-123-def-456
API Response: { success: true, data: {...} }
==============================
```

### Step 3: Check Backend Terminal

**Expected Logs**:
```
=== GET COMPLAINT BY ID DEBUG ===
Route Param (id): abc-123-def-456
User ID: xyz-789
User Role: HR
Ticket Found: YES
Ticket ID: abc-123-def-456
Ticket Number: HD-2026-000001
================================
```

---

## 🎯 Diagnosis Guide

### Scenario A: Ticket ID is Undefined
**Symptom**: Browser logs show `undefined` for ticket ID

**Cause**: API response doesn't have `id` field

**Fix**: Check backend response format

### Scenario B: Backend Says "Ticket Found: NO"
**Symptom**: Backend logs show ticket not found

**Possible Causes**:
1. UUID doesn't exist in database
2. Ticket was deleted
3. Database out of sync

**Fix**: Check database directly

### Scenario C: Role is EMPLOYEE Not HR
**Symptom**: Backend logs show `User Role: EMPLOYEE`

**Cause**: User is logged in as employee, not HR

**Fix**: Login as HR user

### Scenario D: API Call Returns 403 Forbidden
**Symptom**: Browser console shows 403 error

**Cause**: Permission denied by role guard

**Fix**: Verify user has HR role in database

### Scenario E: API Call Returns 500 Error
**Symptom**: Backend crashes with Prisma error

**Cause**: Database relations broken or schema mismatch

**Fix**: Run migrations, regenerate Prisma client

---

## 🚀 Next Steps

1. **Start Backend**: `cd backend && npm run start:dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Login as HR**: Navigate to `/hr/complaints`
4. **Click "Manage"**: On any ticket
5. **Check Console Logs**: Both browser and terminal
6. **Compare Logs**: With expected output above
7. **Share Logs**: If issue persists, share the logs

---

## 📊 Expected vs Actual

### If Everything Works:

**Browser Console**:
```
✅ Ticket ID: Valid UUID
✅ Navigation: Correct route
✅ API Response: Has data
```

**Backend Terminal**:
```
✅ Route Param: Valid UUID
✅ User Role: HR
✅ Ticket Found: YES
```

**Result**: Page loads successfully

### If "Ticket Not Found" Appears:

**Check Which Log Shows the Issue**:

1. **Frontend logs OK, Backend says "NO"**:
   - Issue: UUID not in database
   - Action: Check database

2. **Frontend logs OK, Backend shows 403/500**:
   - Issue: Permission or database error
   - Action: Check role and migrations

3. **Frontend logs show undefined**:
   - Issue: API response malformed
   - Action: Check backend response format

4. **No logs appear**:
   - Issue: Code not running
   - Action: Clear cache, restart servers

---

## ✅ Verification

After reviewing logs, the issue will be clear:

- If UUID is correct everywhere → Database issue
- If role is wrong → Permission issue
- If API fails → Backend error
- If data undefined → Response format issue

**The routing itself is correct. The debug logs will reveal the actual problem.** 🎯
