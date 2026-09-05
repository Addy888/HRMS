# Authentication & Route Protection Test Plan

## Expected Behavior

### Unauthenticated Users
- ✅ `http://localhost:3000/` → should redirect to `/login`
- ✅ `http://localhost:3000/super-admin` → should redirect to `/login`
- ✅ `http://localhost:3000/hr` → should redirect to `/login`
- ✅ `http://localhost:3000/employee` → should redirect to `/login`
- ✅ `http://localhost:3000/login` → should show login page (no redirect)

### Authenticated Super Admin
- ✅ `http://localhost:3000/` → should redirect to `/super-admin`
- ✅ `http://localhost:3000/super-admin` → should show Super Admin dashboard
- ✅ `http://localhost:3000/hr` → should redirect to `/super-admin`
- ✅ `http://localhost:3000/employee` → should redirect to `/super-admin`
- ✅ `http://localhost:3000/login` → should redirect to `/super-admin`

### Authenticated HR
- ✅ `http://localhost:3000/` → should redirect to `/hr`
- ✅ `http://localhost:3000/super-admin` → should redirect to `/hr`
- ✅ `http://localhost:3000/hr` → should show HR dashboard
- ✅ `http://localhost:3000/employee` → should redirect to `/hr`
- ✅ `http://localhost:3000/login` → should redirect to `/hr`

### Authenticated Employee
- ✅ `http://localhost:3000/` → should redirect to `/employee`
- ✅ `http://localhost:3000/super-admin` → should redirect to `/employee`
- ✅ `http://localhost:3000/hr` → should redirect to `/employee`
- ✅ `http://localhost:3000/employee` → should show Employee dashboard
- ✅ `http://localhost:3000/login` → should redirect to `/employee`

## Testing Steps

### 1. Test Unauthenticated Access
```bash
# Clear all browser data and localStorage
# Open Developer Tools > Application > Clear Storage

# Test each protected route
1. Navigate to http://localhost:3000/super-admin
   Expected: Redirect to /login

2. Navigate to http://localhost:3000/hr
   Expected: Redirect to /login

3. Navigate to http://localhost:3000/employee
   Expected: Redirect to /login

4. Navigate to http://localhost:3000/
   Expected: Redirect to /login

5. Navigate to http://localhost:3000/login
   Expected: Show login page (no redirect)
```

### 2. Test Super Admin Access
```bash
# Login as Super Admin via http://localhost:3000/login/admin

# Test each route
1. Navigate to http://localhost:3000/super-admin
   Expected: Show Super Admin dashboard

2. Navigate to http://localhost:3000/
   Expected: Redirect to /super-admin

3. Navigate to http://localhost:3000/hr
   Expected: Redirect to /super-admin

4. Navigate to http://localhost:3000/employee
   Expected: Redirect to /super-admin

5. Navigate to http://localhost:3000/login
   Expected: Redirect to /super-admin
```

### 3. Test HR Access
```bash
# Logout and login as HR via http://localhost:3000/login/hr

# Test each route
1. Navigate to http://localhost:3000/hr
   Expected: Show HR dashboard

2. Navigate to http://localhost:3000/
   Expected: Redirect to /hr

3. Navigate to http://localhost:3000/super-admin
   Expected: Redirect to /hr

4. Navigate to http://localhost:3000/employee
   Expected: Redirect to /hr

5. Navigate to http://localhost:3000/login
   Expected: Redirect to /hr
```

### 4. Test Employee Access
```bash
# Logout and login as Employee via http://localhost:3000/login/employee

# Test each route
1. Navigate to http://localhost:3000/employee
   Expected: Show Employee dashboard

2. Navigate to http://localhost:3000/
   Expected: Redirect to /employee

3. Navigate to http://localhost:3000/super-admin
   Expected: Redirect to /employee

4. Navigate to http://localhost:3000/hr
   Expected: Redirect to /employee

5. Navigate to http://localhost:3000/login
   Expected: Redirect to /employee
```

## Debugging Steps

### Check Browser DevTools Console
Look for these log messages:
- `[AuthStore] Token expired, clearing auth state`
- `[AuthStore] Incomplete credentials, clearing auth state`
- `[AuthStore] Rehydration: Token expired, clearing state`
- `[AuthStore] Rehydration: Missing token or user, clearing state`
- `[ProtectedRoute] Not authenticated, redirecting to: /login`
- `[ProtectedRoute] Wrong role. User role: X Allowed: Y`

### Check Network Tab
- Middleware redirects (307 redirects)
- API calls should have Authorization header

### Check Application Tab > Storage
- localStorage: `fcs-auth-storage`, `fcs_token`, `fcs_user`
- Cookies: `fcs_token`, `fcs_role`

All should be cleared when not authenticated.

## Known Issues Fixed

1. ✅ Middleware now redirects unauthenticated super-admin access to `/login` (not `/login/admin`)
2. ✅ AuthStore properly validates both token AND user existence
3. ✅ AuthStore clears expired tokens on initialization
4. ✅ ProtectedRoute adds console logs for debugging
5. ✅ ProtectedRoute blocks rendering until auth check completes
