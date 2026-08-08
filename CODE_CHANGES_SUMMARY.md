# Code Changes Summary - HR Session Isolation Fix

## Key Change Pattern

**❌ OLD CODE (Broken):**
```typescript
// Login success handler
setAuth(data.accessToken, data.user);
api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
localStorage.setItem('fcs_token', data.accessToken);       // ❌ Redundant
localStorage.setItem('fcs_user', JSON.stringify(data.user)); // ❌ Redundant
```

**✅ NEW CODE (Fixed):**
```typescript
// ✅ STEP 1: Clear ALL stale auth data FIRST
if (typeof window !== 'undefined') {
  localStorage.removeItem('fcs_token');
  localStorage.removeItem('fcs_user');
  localStorage.removeItem('fcs-auth-storage');
}

// ✅ STEP 2: Set fresh auth state (Zustand handles persist)
setAuth(data.accessToken, data.user);
api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
```

---

## File 1: `frontend/src/app/login/hr/page.tsx`

**Location:** Line ~38-50 (onSuccess handler)

**Old:**
```typescript
onSuccess: (data) => {
  if (!HR_PORTAL_ROLES.includes(data.user?.role)) {
    setError('Invalid email or password');
    return;
  }

  setAuth(data.accessToken, data.user);
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
  localStorage.setItem('fcs_token', data.accessToken);
  localStorage.setItem('fcs_user', JSON.stringify(data.user));

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/hr');
  }
},
```

**New:**
```typescript
onSuccess: (data) => {
  if (!HR_PORTAL_ROLES.includes(data.user?.role)) {
    setError('Invalid email or password');
    return;
  }

  // ✅ CRITICAL FIX: Clear any stale authentication data FIRST
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fcs_token');
    localStorage.removeItem('fcs_user');
    localStorage.removeItem('fcs-auth-storage');
  }

  // ✅ Set fresh auth state in Zustand store (single source of truth)
  setAuth(data.accessToken, data.user);
  
  // ✅ Set authorization header for immediate API requests
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/hr');
  }
},
```

---

## File 2: `frontend/src/app/login/employee/page.tsx`

**Location 1:** Line ~48-60 (direct login - no OTP)

**Old:**
```typescript
} else {
  setAuth(data.accessToken, data.user);
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
  localStorage.setItem('fcs_token', data.accessToken);
  localStorage.setItem('fcs_user', JSON.stringify(data.user));

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/employee');
  }
}
```

**New:**
```typescript
} else {
  // ✅ CRITICAL FIX: Clear stale auth data first
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fcs_token');
    localStorage.removeItem('fcs_user');
    localStorage.removeItem('fcs-auth-storage');
  }

  setAuth(data.accessToken, data.user);
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/employee');
  }
}
```

**Location 2:** Line ~70-80 (OTP verification success)

**Old:**
```typescript
onSuccess: (data) => {
  setAuth(data.accessToken, data.user);
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
  localStorage.setItem('fcs_token', data.accessToken);
  localStorage.setItem('fcs_user', JSON.stringify(data.user));

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/employee');
  }
},
```

**New:**
```typescript
onSuccess: (data) => {
  // ✅ CRITICAL FIX: Clear stale auth data first
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fcs_token');
    localStorage.removeItem('fcs_user');
    localStorage.removeItem('fcs-auth-storage');
  }

  setAuth(data.accessToken, data.user);
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

  if (data.mustChangePassword) {
    router.push('/change-password');
  } else {
    router.push('/employee');
  }
},
```

---

## File 3: `frontend/src/app/login/admin/page.tsx`

**Location:** Line ~35-45 (after role check)

**Old:**
```typescript
if (userData.role !== 'Super Admin') {
  setError('Access denied. Only Super Admin can login here.');
  setLoading(false);
  return;
}

setAuth(accessToken, userData);
router.push('/admin');
```

**New:**
```typescript
if (userData.role !== 'Super Admin') {
  setError('Access denied. Only Super Admin can login here.');
  setLoading(false);
  return;
}

// ✅ CRITICAL FIX: Clear stale auth data first
localStorage.removeItem('fcs_token');
localStorage.removeItem('fcs_user');
localStorage.removeItem('fcs-auth-storage');

setAuth(accessToken, userData);
router.push('/admin');
```

---

## File 4: `frontend/src/store/authStore.ts`

**Location:** Line ~40-46 (logout function)

**Old:**
```typescript
logout: () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fcs_token');
    localStorage.removeItem('fcs_user');
  }
  set({ token: null, user: null, isAuthenticated: false });
},
```

**New:**
```typescript
logout: () => {
  if (typeof window !== 'undefined') {
    // ✅ CRITICAL FIX: Clear ALL auth-related localStorage keys
    localStorage.removeItem('fcs_token');
    localStorage.removeItem('fcs_user');
    localStorage.removeItem('fcs-auth-storage');
    
    // ✅ Clear axios authorization header
    const api = require('@/lib/api').default;
    if (api?.defaults?.headers?.common) {
      delete api.defaults.headers.common['Authorization'];
    }
  }
  set({ token: null, user: null, isAuthenticated: false });
},
```

---

## File 5: `frontend/src/app/change-password/page.tsx`

**Location:** Line ~28-35 (after password change)

**Old:**
```typescript
if (user) {
  useAuthStore.getState().setAuth(
    localStorage.getItem('fcs_token') || '',
    { ...user, mustChangePassword: false }
  );
  localStorage.setItem('fcs_user', JSON.stringify({ ...user, mustChangePassword: false }));
}
```

**New:**
```typescript
if (user) {
  useAuthStore.getState().setAuth(
    localStorage.getItem('fcs_token') || '',
    { ...user, mustChangePassword: false }
  );
  // ✅ Removed redundant localStorage.setItem('fcs_user', ...)
}
```

---

## Why This Fixes The Bug

### Before Fix
1. HR A logs in
   - `fcs_token` = Token A ✓
   - `fcs_user` = User A ✓
   - `fcs-auth-storage` = {token: A, user: A} ✓
   
2. HR A logs out
   - `fcs-auth-storage` cleared ✓
   - `fcs_token` still exists ❌
   - `fcs_user` still exists ❌
   
3. HR B logs in
   - `fcs_token` = Token B ✓ (overwritten)
   - `fcs_user` = User B ✓ (overwritten)
   - `fcs-auth-storage` = {token: B, user: B} ✓
   - **BUT** if any code reads from `fcs_user`, it might get stale data ❌

### After Fix
1. HR A logs in
   - Clears all keys first ✓
   - `fcs-auth-storage` = {token: A, user: A} ✓
   - `fcs_token` = null ✓
   - `fcs_user` = null ✓
   
2. HR A logs out
   - ALL keys cleared including `fcs-auth-storage` ✓
   
3. HR B logs in
   - Clears all keys first (clean slate) ✓
   - `fcs-auth-storage` = {token: B, user: B} ✓
   - No stale data anywhere ✓

---

## Single Source of Truth

**Zustand persist** stores to `fcs-auth-storage`:
```javascript
{
  state: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "uuid",
      email: "hr@fcs.com",
      role: "HR",
      employee: {...}
    },
    isAuthenticated: true
  },
  version: 0
}
```

**API interceptor** reads from `fcs-auth-storage`:
```typescript
// lib/api.ts request interceptor
const storage = localStorage.getItem('fcs-auth-storage');
const parsed = JSON.parse(storage);
const token = parsed?.state?.token;
config.headers.Authorization = `Bearer ${token}`;
```

**Layouts read from Zustand hook:**
```typescript
// HRLayout.tsx
const user = useAuthStore((state) => state.user);
// Displays user.email
```

---

## Verification Checklist

After deploying this fix:

- [ ] Login as HR A → See email A in header
- [ ] Logout → localStorage cleared completely
- [ ] Login as HR B → See email B (not A) in header
- [ ] Check browser console → No `fcs_token` or `fcs_user` keys
- [ ] Check Network tab → Authorization header has correct JWT
- [ ] Decode JWT → Should contain correct user ID and email
- [ ] Backend logs → req.user should match logged-in user

---

**Status:** ✅ ALL CHANGES APPLIED - READY FOR TESTING
