# 🧪 QUICK TEST CARD - HR Session Isolation

## ⚡ 3-Minute Test

### Step 1: Login HR Account A
```
URL: http://localhost:3000/login/hr
Email: test123@gmail.com
Password: (your password)
```
**Expected Result:**
- ✅ Redirects to `/hr` dashboard
- ✅ Top-right header shows: `test123@gmail.com`
- ✅ User badge shows: `HR ADMIN`

---

### Step 2: Logout
- Click the logout button
**Expected Result:**
- ✅ Redirects to `/login`
- ✅ localStorage cleared (check console: `localStorage.getItem('fcs-auth-storage')` should be null)

---

### Step 3: Login HR Account B
```
URL: http://localhost:3000/login/hr
Email: sumaiyyatamboli50@gmail.com
Password: 123456789
```
**Expected Result:**
- ✅ Redirects to `/hr` dashboard
- ✅ Top-right header shows: `sumaiyyatamboli50@gmail.com` ← **MUST BE DIFFERENT FROM STEP 1**
- ✅ User badge shows: `HR ADMIN`

---

### Step 4: Logout Again
- Click logout button

---

### Step 5: Login HR Account C
```
URL: http://localhost:3000/login/hr
Email: adityashastri76@gmail.com
Password: 12345678
```
**Expected Result:**
- ✅ Redirects to `/hr` dashboard
- ✅ Top-right header shows: `adityashastri76@gmail.com` ← **MUST BE DIFFERENT FROM STEPS 1 & 3**
- ✅ User badge shows: `HR ADMIN`

---

## ❌ FAIL Criteria

The fix is **NOT working** if:

1. ❌ All three accounts show the same email (e.g., all show `test123@gmail.com`)
2. ❌ Account B or C shows Account A's email after logout/login
3. ❌ localStorage still contains `fcs_token` or `fcs_user` keys
4. ❌ JWT token doesn't change between logins (decode at jwt.io to check)

---

## 🔍 Browser Console Quick Check

**After each login, run in browser console (F12):**

```javascript
// Check localStorage keys
console.log('Auth Storage:', localStorage.getItem('fcs-auth-storage'));
console.log('Old Token Key:', localStorage.getItem('fcs_token'));  // Should be null
console.log('Old User Key:', localStorage.getItem('fcs_user'));    // Should be null

// Parse and verify user
const auth = JSON.parse(localStorage.getItem('fcs-auth-storage'));
console.log('Current User Email:', auth.state.user.email);
console.log('Current User Role:', auth.state.user.role);
console.log('JWT Token (first 50 chars):', auth.state.token.substring(0, 50));
```

**Expected Output:**
```
Auth Storage: {"state":{"token":"eyJhbGc...","user":{...},...},"version":0}
Old Token Key: null          ✅
Old User Key: null           ✅
Current User Email: test123@gmail.com  (or current HR account)
Current User Role: HR
JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...
```

---

## 📊 Visual Verification

### Before Fix (Broken) 🔴
```
Login: test123@gmail.com      → Header shows: test123@gmail.com ✅
Logout
Login: sumaiyyatamboli50...   → Header shows: test123@gmail.com ❌ BUG!
Logout
Login: adityashastri76...     → Header shows: test123@gmail.com ❌ BUG!
```

### After Fix (Working) 🟢
```
Login: test123@gmail.com      → Header shows: test123@gmail.com ✅
Logout
Login: sumaiyyatamboli50...   → Header shows: sumaiyyatamboli50... ✅
Logout
Login: adityashastri76...     → Header shows: adityashastri76... ✅
```

---

## 🎯 Success Criteria

- [x] Each HR account displays its OWN email in header
- [x] JWT token changes with each login
- [x] localStorage only contains `fcs-auth-storage` key
- [x] Logout clears ALL auth data
- [x] No stale sessions between logins

---

## 📝 Test Result Template

```
Date: _____________
Tester: _____________

[ ] Test 1: HR Account A shows correct email
[ ] Test 2: Logout clears localStorage
[ ] Test 3: HR Account B shows correct email (not A)
[ ] Test 4: HR Account C shows correct email (not A or B)
[ ] Test 5: Browser console shows clean localStorage
[ ] Test 6: JWT tokens are different per account

Result: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
```

---

**If all tests PASS:** ✅ Fix is working correctly  
**If any test FAILS:** ❌ Report the specific failure with screenshot
