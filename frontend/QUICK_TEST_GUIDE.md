# Quick Authentication Test Guide

## 🚀 Start Testing in 3 Steps

### Step 1: Clear Browser Data
```
1. Open Developer Tools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Click "Clear site data" button
5. Close and reopen the browser tab
```

### Step 2: Test Unauthenticated Access
```
Open http://localhost:3000/super-admin
✅ Expected: Redirects to /login

Open http://localhost:3000/hr
✅ Expected: Redirects to /login

Open http://localhost:3000/employee
✅ Expected: Redirects to /login
```

### Step 3: Test Authenticated Access

#### Super Admin Test
```
1. Login at http://localhost:3000/login/admin
2. After login, manually type: http://localhost:3000/super-admin
✅ Expected: Shows Super Admin dashboard (NO redirect to login)
```

#### HR Test
```
1. Logout
2. Login at http://localhost:3000/login/hr
3. After login, manually type: http://localhost:3000/hr
✅ Expected: Shows HR dashboard (NO redirect to login)
```

#### Employee Test
```
1. Logout
2. Login at http://localhost:3000/login/employee
3. After login, manually type: http://localhost:3000/employee
✅ Expected: Shows Employee dashboard (NO redirect to login)
```

## 🔍 Check Console Logs

Open browser console (F12 → Console tab) and look for:

### When NOT logged in:
```
[Middleware] { pathname: '/super-admin', hasToken: false, isExpired: true, isAuthenticated: false, userRole: null }
[ProtectedRoute] Not authenticated, redirecting to: /login
```

### When logged in:
```
[Middleware] { pathname: '/super-admin', hasToken: true, isExpired: false, isAuthenticated: true, userRole: 'SUPER_ADMIN' }
```

## ✅ Success Criteria

### PASS ✓
- Unauthenticated users CANNOT see dashboards
- All protected routes redirect to /login
- Authenticated users CAN access their dashboards
- Direct URL access requires authentication

### FAIL ✗
- Dashboard shows without login
- No redirect to /login when not authenticated
- Infinite redirect loops
- Console errors

## 🐛 If Something Fails

1. **Check Browser Console** for errors
2. **Check Network Tab** for redirect chains
3. **Check Application > Storage** - should be empty when not logged in
4. **Clear cache and try again** - sometimes browser caches cause issues
5. **Restart dev server** - `npm run dev` in frontend directory

## 📝 Test Credentials

Ask your backend team for test credentials for:
- Super Admin account
- HR account  
- Employee account

Or check your `.env.local` file for default test accounts.

## 🔧 Dev Server

Make sure the frontend dev server is running:
```bash
cd frontend
npm run dev
```

And the backend server is running:
```bash
cd backend
npm run start:dev
```

## 📊 What Was Fixed?

✅ Middleware now properly validates tokens
✅ Expired tokens are immediately cleared
✅ Both token AND user must exist for authentication
✅ ProtectedRoute blocks rendering until validation completes
✅ Added debug logging for troubleshooting
✅ Fixed redirect to /login (not /login/admin) for consistency

## 🎯 The Original Problem

**Before Fix**:
Opening `http://localhost:3000/super-admin` directly showed the dashboard WITHOUT login.

**After Fix**:
Opening `http://localhost:3000/super-admin` without authentication redirects to `/login`.

---

**Need more details?** See `AUTHENTICATION_FIX_SUMMARY.md` for complete technical documentation.
