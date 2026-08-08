# PAYROLL MODULE ROLES FIX

## Issue
Payroll endpoints were returning **403 Forbidden** because they only allowed `UserRole.HR` and `UserRole.SUPER_ADMIN`, but the new role system uses `UserRole.HR_USER` and `UserRole.HR_ADMIN`.

## Root Cause
The payroll module was created before the HR role split (HR → HR_USER + HR_ADMIN) and wasn't updated to include the new roles.

## Files Fixed

### 1. `payroll-processing.controller.ts`
Updated all endpoints to include HR_USER and HR_ADMIN:

**Read/View Operations** (HR_USER + HR_ADMIN + SUPER_ADMIN):
- `GET /dashboard/stats` - View payroll dashboard
- `GET /history` - View payroll history  
- `POST /bulk` - Process bulk payroll
- `POST /employee/:employeeId` - Process single employee

**Administrative Operations** (HR_ADMIN + SUPER_ADMIN only):
- `PUT /:id/approve` - Approve payroll
- `PUT /:id/mark-paid` - Mark as paid
- `DELETE /:id` - Delete payroll

### 2. `payroll.controller.ts`
Updated all endpoints:

**HR_USER + HR_ADMIN + SUPER_ADMIN**:
- `POST /generate/employee/:employeeId`
- `GET /history`
- `GET /:id`
- `GET /summary/:month/:year`

**HR_ADMIN + SUPER_ADMIN only**:
- `POST /generate/bulk`
- `PATCH /:id/approve`
- `PATCH /:id/pay`
- `DELETE /:id`

### 3. `salary-structure.controller.ts`
All endpoints updated to include HR_USER and HR_ADMIN.

### 4. `salary-slip.controller.ts`
All endpoints updated to include HR_USER and HR_ADMIN.

## Role Access Matrix

| Endpoint | HR_USER | HR_ADMIN | SUPER_ADMIN |
|----------|---------|----------|-------------|
| View Dashboard | ✅ | ✅ | ✅ |
| View History | ✅ | ✅ | ✅ |
| Process Payroll (Single) | ✅ | ✅ | ✅ |
| Process Payroll (Bulk) | ❌ | ✅ | ✅ |
| Approve Payroll | ❌ | ✅ | ✅ |
| Mark as Paid | ❌ | ✅ | ✅ |
| Delete Payroll | ❌ | ✅ | ✅ |

## Testing

1. ✅ Build completed successfully
2. ⏳ Restart backend to load changes
3. ⏳ Test payroll dashboard as HR_USER
4. ⏳ Test payroll dashboard as HR_ADMIN

## Commands to Test

```bash
# Restart backend
cd backend
npm run start:dev

# Or if using PM2
pm2 restart hrms-backend
```

Then refresh the frontend and navigate to the payroll page. The 403 error should be resolved.

## Next Steps

The payroll module will now be accessible to HR_USER and HR_ADMIN roles. However, **HR ownership filtering** should also be added to payroll queries in the future to ensure:

- HR_USER only processes payroll for employees they created
- HR_ADMIN can process payroll for all organization employees

This follows the same pattern implemented for:
- Dashboard
- Employees
- Documents  
- Complaints

For now, the immediate 403 error is fixed.
