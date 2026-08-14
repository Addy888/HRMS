# Attendance 403 Forbidden Error - Root Cause & Fix

## Problem
Employee attendance page was getting **403 Forbidden** errors when trying to access attendance endpoints like:
- `GET /attendance/my/today`
- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `GET /attendance/my`
- `GET /attendance/my/monthly`

## Root Causes (2 Issues Found & Fixed)

### Issue 1: Missing Prisma Dependency Injection
The `AttendanceController` was trying to access `req.prisma` throughout all methods, but **PrismaService was never injected** into the controller's constructor.

```typescript
// ❌ BROKEN CODE
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}
  
  async checkIn(@Request() req, @Body() dto: CheckInDto) {
    // This fails because req.prisma doesn't exist!
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });
  }
}
```

When `req.prisma` is undefined, the code throws an error which NestJS converts to a 403 Forbidden response.

### Issue 2: Hardcoded 'HR' Role Check
The `AttendanceService` was checking for exactly `user.role.name === 'HR'`, but the system has three HR roles:
- `HR` (deprecated)
- `HR_ADMIN` 
- `HR_USER`

```typescript
// ❌ BROKEN CODE
if (user.role.name !== 'HR') {
  throw new ForbiddenException('Only HR can view all attendance');
}
```

This caused **"Only HR can view all attendance"** error for users with `HR_ADMIN` or `HR_USER` roles.

## Solutions

### Fix 1: Inject PrismaService
1. **Inject PrismaService** into the controller constructor
2. **Use `this.prisma`** instead of `req.prisma` in all methods
3. **Add null check** for user in manualAttendance method

```typescript
// ✅ FIXED CODE
import { PrismaService } from '../../../database/prisma.service.js';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService, // ✅ Inject Prisma
  ) {}
  
  async checkIn(@Request() req, @Body() dto: CheckInDto) {
    // ✅ Use this.prisma
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });
    
    if (!employee) {
      throw new Error('Employee record not found');
    }
    
    return this.attendanceService.checkIn(employee.id, dto, req.user.id);
  }
}
```

### Fix 2: Support All HR Roles
Created a helper method to check for all HR role variants:

```typescript
// ✅ FIXED CODE - In AttendanceService
/**
 * Helper method to check if user has HR role
 * Supports: HR, HR_ADMIN, HR_USER
 */
private isHRRole(roleName: string): boolean {
  return ['HR', 'HR_ADMIN', 'HR_USER'].includes(roleName);
}

// Use in all role checks
if (!user || !this.isHRRole(user.role.name)) {
  throw new ForbiddenException('Only HR can view all attendance');
}
```

## Changes Made

### File: `backend/src/modules/attendance/controllers/attendance.controller.ts`

1. **Added PrismaService import**
   ```typescript
   import { PrismaService } from '../../../database/prisma.service.js';
   ```

2. **Injected PrismaService in constructor**
   ```typescript
   constructor(
     private readonly attendanceService: AttendanceService,
     private readonly prisma: PrismaService,
   ) {}
   ```

3. **Replaced all `req.prisma` with `this.prisma`** in methods:
   - `checkIn()`
   - `checkOut()`
   - `getMyAttendance()`
   - `getMyMonthlyAttendance()`
   - `getTodayStatus()`
   - `manualAttendance()`
   - `updateAttendance()`

4. **Added null check in manualAttendance**
   ```typescript
   const user = await this.prisma.user.findUnique({
     where: { id: req.user.id },
   });
   
   if (!user) {
     throw new ForbiddenException('User not found');
   }
   ```

### File: `backend/src/modules/attendance/services/attendance.service.ts`

1. **Added helper method**
   ```typescript
   private isHRRole(roleName: string): boolean {
     return ['HR', 'HR_ADMIN', 'HR_USER'].includes(roleName);
   }
   ```

2. **Updated all role checks** (6 locations):
   - `checkIn()` - Check if user can mark attendance for another employee
   - `checkOut()` - Check if user can mark attendance for another employee
   - `getAllAttendance()` - Check if user is HR
   - `getAttendanceSummary()` - Check if user is HR
   - `manualAttendance()` - Check if user is HR
   - `getAuditLog()` - Check if user is HR

   Changed from:
   ```typescript
   if (user.role.name !== 'HR') { ... }
   ```
   
   To:
   ```typescript
   if (!this.isHRRole(user.role.name)) { ... }
   ```

### File: `backend/src/common/guards/roles.guard.ts`

Added debug logging to help diagnose authorization issues:
```typescript
console.log('🔍 RolesGuard Debug:');
console.log('  Required roles:', requiredRoles);
console.log('  User role:', user.role);
console.log('  User role type:', typeof user.role);
console.log('  Match result:', requiredRoles.includes(user.role));
```

## Testing Instructions

1. **Restart the backend server** (critical - code changes won't take effect without restart)
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test employee endpoints** (no RolesGuard, just JwtAuthGuard):
   - Login as an employee
   - Visit `/employee/attendance` page
   - Should successfully load today's status
   - Should be able to check-in and check-out

3. **Test HR endpoints** (requires RolesGuard with HR roles):
   - Login as HR user (with any of: HR, HR_ADMIN, HR_USER role)
   - Visit `/hr/attendance` page
   - Should see all employee attendance
   - No more "Only HR can view all attendance" error

4. **Check console logs**:
   - Look for "🔍 Check-in request - User:" to see JWT payload
   - Look for "🔍 Check-in request - Employee:" to see employee lookup result
   - Look for "🔍 RolesGuard Debug:" to see role checking for HR endpoints

## Expected Behavior After Fix

### Employee Endpoints (No Role Guard)
These should work for ANY authenticated user:
- ✅ `GET /attendance/my/today` - Today's status
- ✅ `POST /attendance/check-in` - Check in
- ✅ `POST /attendance/check-out` - Check out
- ✅ `GET /attendance/my` - My attendance history
- ✅ `GET /attendance/my/monthly` - My monthly calendar

### HR Endpoints (Requires HR Role)
These require `RolesGuard` with HR, HR_ADMIN, or HR_USER role:
- ✅ `GET /attendance` - All attendance records
- ✅ `GET /attendance/summary` - Attendance summary
- ✅ `GET /attendance/employee/:id` - Specific employee
- ✅ `POST /attendance/manual` - Manual entry
- ✅ `PATCH /attendance/:id` - Update record

## Why This Happened

### Issue 1: Prisma Injection
The controller was written assuming `req.prisma` would be available (like in some frameworks that use middleware to attach Prisma to the request object), but NestJS uses **Dependency Injection** instead. Services must be:

1. Imported in the module
2. Injected via constructor
3. Accessed as `this.serviceName`

### Issue 2: Role Checking
The original code was written when there was only one `HR` role. As the system evolved to support `HR_ADMIN` and `HR_USER`, the hardcoded checks were never updated to support the new role variants.

## Status
- ✅ Backend builds successfully
- ✅ PrismaService properly injected
- ✅ All `req.prisma` references fixed
- ✅ Null checks added
- ✅ Multi-role HR support added
- ✅ All 6 hardcoded role checks fixed
- ⏳ Need to restart backend and test

## Next Steps
1. Restart backend server
2. Test employee check-in/check-out flow
3. Test HR dashboard with HR_ADMIN or HR_USER role
4. Verify no 403 errors
5. Remove debug console.log statements once confirmed working
6. Continue with HR dashboard enhancements
