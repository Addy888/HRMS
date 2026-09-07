# Testing Guide: Role-Based Admin Access

## Test Scenario 1: Create HR Admin

### Steps:
1. Login as existing Super Admin via `/login/admin`
2. Navigate to Super Admin → Admin Management
3. Click "Add Admin" button
4. Fill in the form:
   ```
   First Name: John
   Last Name: Smith
   Email: john.smith@company.com
   Phone: 9876543210
   Role: HR Admin (select from dropdown)
   Default Password: 123456
   Active: ✓ checked
   ```
5. Click "Create Admin"

### Expected Results:
- ✅ Admin created successfully
- ✅ Admin appears in list with "HR ADMIN" role badge (blue)
- ✅ Employee ID starts with "HR-"

### Test Login as HR Admin:
1. Logout
2. Go to `/login/hr`
3. Login with: `john.smith@company.com` / `123456`
4. **Expected:** Redirected to `/hr` (HR Panel Dashboard)
5. **Expected:** Can access all HR features
6. Try manually typing `/super-admin` in browser
7. **Expected:** Automatically redirected back to `/hr`

---

## Test Scenario 2: Create Super Admin

### Steps:
1. Login as existing Super Admin via `/login/admin`
2. Navigate to Super Admin → Admin Management
3. Click "Add Admin" button
4. Fill in the form:
   ```
   First Name: Sarah
   Last Name: Johnson
   Email: sarah.johnson@company.com
   Phone: 9876543211
   Role: Super Admin (select from dropdown)
   Default Password: 123456
   Active: ✓ checked
   ```
5. Click "Create Admin"

### Expected Results:
- ✅ Admin created successfully
- ✅ Admin appears in list with "SUPER ADMIN" role badge (purple gradient)
- ✅ Employee ID starts with "SA-"

### Test Login as Super Admin:
1. Logout
2. Go to `/login/admin`
3. Login with: `sarah.johnson@company.com` / `123456`
4. **Expected:** Redirected to `/super-admin` (Super Admin Dashboard)
5. **Expected:** Can access all Super Admin features
6. **Expected:** Can view Admin Management page
7. **Expected:** Can create both HR Admin and Super Admin accounts

---

## Test Scenario 3: Access Control Verification

### HR Admin Access Control:
1. Login as HR Admin (john.smith@company.com)
2. Open browser DevTools → Network tab
3. Try to call Super Admin API:
   ```javascript
   fetch('/api/super-admin/dashboard/stats', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   })
   ```
4. **Expected:** 403 Forbidden response
5. Try to navigate to `/super-admin/admins`
6. **Expected:** Redirected to `/hr`

### Super Admin Access Control:
1. Login as Super Admin (sarah.johnson@company.com)
2. Navigate to `/super-admin` routes
3. **Expected:** Full access granted
4. Try accessing `/hr` routes
5. **Expected:** Can access (Super Admin has elevated privileges)

---

## Test Scenario 4: Admin List Display

### Verify Role Column:
1. Login as Super Admin
2. Go to Admin Management (`/super-admin/admins`)
3. **Expected to see:**
   - Column headers: Admin | Contact | Role | Employees Managed | Status | Actions
   - HR Admins show: Blue badge with "HR ADMIN" text
   - Super Admins show: Purple gradient badge with "SUPER ADMIN" text
4. Click on an admin row
5. **Expected:** Navigate to admin detail page
6. **Expected:** Can see:
   - Total Processes created by admin
   - Total Employees managed by admin
   - Process-wise breakdown

---

## Test Scenario 5: Existing Accounts

### Verify Existing HR Admin:
1. Find existing HR Admin account email (e.g., sumaiyyatamboli50@gmail.com)
2. Login via `/login/hr`
3. **Expected:** Works exactly as before
4. **Expected:** Access to HR Panel
5. **Expected:** Can manage employees, attendance, payroll as usual

### Verify Existing Super Admin:
1. Find existing Super Admin account email (e.g., adityashastri76@gmail.com)
2. Login via `/login/admin`
3. **Expected:** Works exactly as before
4. **Expected:** Access to Super Admin Panel
5. **Expected:** Can view all admins, processes, employees

### Verify Existing Employee:
1. Find any existing employee account
2. Login via `/login` (employee login)
3. **Expected:** Works exactly as before
4. **Expected:** Redirected to `/employee`
5. **Expected:** Can access employee dashboard, profile, documents

---

## Test Scenario 6: Data Integrity Check

### Verify No Data Loss:
1. Login as Super Admin
2. Go to Employees page (`/super-admin/employees`)
3. **Expected:** All existing employees visible
4. Check employee count matches before changes
5. Go to Processes page (`/super-admin/processes`)
6. **Expected:** All existing departments/processes visible
7. Go to Admin Management (`/super-admin/admins`)
8. **Expected:** All existing admins visible with correct roles
9. Random check: Open a few employee details
10. **Expected:** All data intact (attendance, payroll, documents)

---

## Test Scenario 7: Role Dropdown Validation

### Test Required Field:
1. Login as Super Admin
2. Click "Add Admin"
3. Fill all fields EXCEPT role dropdown
4. Try to submit
5. **Expected:** Browser validation error "Please select an item in the list"

### Test Role Options:
1. Open role dropdown
2. **Expected options:**
   - HR Admin
   - Super Admin
3. **Expected:** No other options visible

### Test Helper Text:
1. Look at role field
2. **Expected helper text below dropdown:**
   "HR Admin: Access to HR Panel only | Super Admin: Full system access"

---

## Test Scenario 8: Login Flow Redirection

### HR Admin Login Flow:
```
/login/hr → Enter HR Admin credentials → Authenticated
→ Check role = HR_ADMIN
→ Redirect to /hr
→ Middleware allows access (HR_ROLES includes HR_ADMIN)
```

### Super Admin Login Flow:
```
/login/admin → Enter Super Admin credentials → Authenticated
→ Check role = SUPER_ADMIN
→ Redirect to /super-admin
→ Middleware allows access (role === SUPER_ADMIN)
```

### Root Route Redirection:
```
Access / → Check authentication
→ If HR_ADMIN: Redirect to /hr
→ If SUPER_ADMIN: Redirect to /super-admin
→ If EMPLOYEE: Redirect to /employee
→ If not authenticated: Redirect to /login
```

---

## Common Issues & Solutions

### Issue 1: HR Admin can still access /super-admin
**Cause:** Middleware not updated or token cached
**Solution:** 
- Clear browser cookies and localStorage
- Logout and login again
- Check middleware.ts has latest changes

### Issue 2: Role dropdown not showing
**Cause:** Frontend code not updated
**Solution:**
- Check form state has `role: 'HR_ADMIN'` field
- Check dropdown JSX is present in Create Admin Modal
- Refresh browser (Ctrl+Shift+R)

### Issue 3: Backend returns "HR_ADMIN role not found"
**Cause:** Database doesn't have HR_ADMIN role
**Solution:**
- Run seed: `npm run seed` in backend folder
- Or manually create role in database

### Issue 4: Admin creation fails with 400 error
**Cause:** Email already exists or validation error
**Solution:**
- Check if email is unique
- Check all required fields are filled
- Check backend logs for exact error

---

## Success Criteria

✅ **Feature Complete When:**
1. Can create HR Admin via modal with role dropdown
2. Can create Super Admin via modal with role dropdown
3. HR Admin login → redirected to /hr
4. Super Admin login → redirected to /super-admin
5. HR Admin cannot access /super-admin routes (redirected)
6. Super Admin can access /super-admin routes
7. Role column visible in admin list
8. Role badges clearly distinguish HR Admin vs Super Admin
9. Existing accounts (HR, Super Admin, Employee) work unchanged
10. No data loss in employees, processes, attendance, payroll
11. Backend enforces role-based API access (403 for unauthorized)
12. No authentication loops or redirect issues

---

## Performance Check

- Admin list loads without errors
- Create admin modal opens instantly
- Form submission is fast (<2 seconds)
- Login redirection is immediate
- No console errors in browser DevTools
- No API errors in Network tab
- Backend builds without errors
- Frontend builds without errors

---

## Rollback Plan (if needed)

If critical issues occur:
1. Revert these 3 files:
   - `backend/src/modules/super-admin/super-admin.service.ts`
   - `frontend/src/app/super-admin/admins/page.tsx`
   - `frontend/src/middleware.ts`
2. Rebuild backend: `npm run build`
3. Restart servers
4. System returns to previous state (all admins are HR_ADMIN by default)
5. No database rollback needed (no schema changes)

The changes are **non-destructive** and can be safely reverted without data loss.
