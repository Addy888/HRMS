# HR User Cleanup - Testing Instructions

## ✅ What Has Been Done

### Database Cleanup ✓
- **Deleted:** test1@gmail.com (HR_USER)
- **Deleted:** test1233@gmail.com (HR_USER)
- **Protected:** sumaiyyatamboli50@gmail.com (HR_ADMIN) ✅ SAFE

### Verification ✓
- Backend builds successfully
- No TypeScript errors
- Database verification confirms only 1 HR user remaining
- Protected account is intact and active

---

## 🧪 Manual Testing Required

Please follow these steps to complete the verification:

### Step 1: Start the Backend Server

```bash
cd backend
npm run start:dev
```

Wait for the message: `Nest application successfully started`

### Step 2: Start the Frontend Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

Wait for: `Ready on http://localhost:3000`

---

## 🔐 Step 3: Login Verification

### Test the Protected Account

1. Open browser: `http://localhost:3000`
2. Login with:
   - **Email:** `sumaiyyatamboli50@gmail.com`
   - **Password:** (use the existing password)
3. **Expected:** ✅ Login succeeds, HR Dashboard loads

---

## 📋 Step 4: HR User Management Page Verification

After logging in:

1. Navigate to: **HR Portal** → **HR Users** (or `/hr/hr-users`)

2. **Expected Result:**

   The page should display **EXACTLY ONE** HR user:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ HR User Management                                          │
   ├─────────────────────────────────────────────────────────────┤
   │                                                              │
   │  Sumaiyya Tamboli                                           │
   │  sumaiyyatamboli50@gmail.com                                │
   │  Department: Administration                                 │
   │  Status: Active                                             │
   │  Role: HR_ADMIN                                             │
   │                                                              │
   └─────────────────────────────────────────────────────────────┘
   ```

3. **Verify:**
   - ❌ NO `test1@gmail.com` displayed
   - ❌ NO `test1233@gmail.com` displayed
   - ❌ NO `adityashastri76@gmail.com` displayed
   - ✅ ONLY `sumaiyyatamboli50@gmail.com` displayed

---

## 🌐 Step 5: API Verification

### Option A: Browser DevTools

1. While on HR Users page, open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Find the request to `/hr-users`
5. Check the **Response**

**Expected Response:**

```json
{
  "data": [
    {
      "id": "...",
      "email": "sumaiyyatamboli50@gmail.com",
      "role": "HR_ADMIN",
      "isActive": true,
      "employee": {
        "firstName": "Sumaiyya",
        "lastName": "Tamboli",
        "employeeId": "FCS-HR-ADMIN-001",
        "department": {
          "name": "Administration"
        }
      }
    }
  ],
  "meta": {
    "total": 1
  }
}
```

### Option B: cURL (if you have auth token)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/hr-users
```

---

## 🔍 Step 6: Search Functionality Test

On the HR Users page:

1. Try searching for deleted emails:
   - Search: `test1@gmail.com` → **Expected:** No results
   - Search: `test1233@gmail.com` → **Expected:** No results
   - Search: `adityashastri76@gmail.com` → **Expected:** No results

2. Search for protected account:
   - Search: `sumaiyya` → **Expected:** Shows Sumaiyya Tamboli
   - Search: `administration` → **Expected:** Shows Sumaiyya Tamboli

---

## ✅ Step 7: Functionality Test

Test that the protected HR Admin account has full access:

### Navigation Test
- [ ] HR Dashboard loads
- [ ] Employees page works
- [ ] HR Users page works (you're already here)
- [ ] Departments page works
- [ ] Policies page works
- [ ] Complaints page works

### HR Admin Features
- [ ] Can view HR users list
- [ ] Can create new HR user (test button, don't actually create)
- [ ] Can view employee list
- [ ] Can access all HR features

---

## 🚨 Troubleshooting

### If you see deleted users on the page:

**Cause:** Frontend cache issue

**Solution:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check the API response in DevTools Network tab
4. Restart the frontend server

### If login fails:

**Cause:** Authentication issue

**Solution:**
1. Verify the email is correct: `sumaiyyatamboli50@gmail.com`
2. Try password reset if needed
3. Check backend logs for errors

### If HR Users page is empty:

**Cause:** Database verification issue

**Solution:**
1. Run verification script:
   ```bash
   cd backend
   npm run verify:hr-users
   ```
2. Check the output confirms 1 HR user exists
3. Check backend console for errors

---

## 📊 Expected Final State

### Database
- ✅ 1 HR user in database
- ✅ Email: sumaiyyatamboli50@gmail.com
- ✅ Role: HR_ADMIN
- ✅ Status: Active
- ✅ Department: Administration

### Frontend
- ✅ HR Users page shows exactly 1 user
- ✅ No deleted users visible
- ✅ No cache issues
- ✅ Search works correctly

### Authentication
- ✅ Protected account can log in
- ✅ All HR features accessible
- ✅ No permission issues

---

## 🎯 Success Criteria

The cleanup is successful if:

1. ✅ Only 1 HR user appears in HR User Management
2. ✅ That user is: Sumaiyya Tamboli (sumaiyyatamboli50@gmail.com)
3. ✅ Department shows: Administration
4. ✅ Status shows: Active
5. ✅ Login works for sumaiyyatamboli50@gmail.com
6. ✅ All HR features are accessible
7. ✅ No deleted users appear anywhere
8. ✅ API returns only 1 HR user

---

## 📝 Quick Verification Checklist

```
□ Backend server started
□ Frontend server started
□ Login successful with sumaiyyatamboli50@gmail.com
□ HR Dashboard loads
□ HR Users page shows exactly 1 user
□ User is Sumaiyya Tamboli
□ Department is Administration
□ Status is Active
□ No test1@gmail.com visible
□ No test1233@gmail.com visible
□ No adityashastri76@gmail.com visible
□ Search functionality works
□ API returns correct data
□ All HR features accessible
```

---

## 🔄 Re-run Cleanup (if needed)

If you need to run the cleanup again (safe to re-run):

```bash
cd backend
npm run cleanup:hr-users
```

---

## 📞 Support Commands

### Verify HR users in database:
```bash
cd backend
npm run verify:hr-users
```

### Check backend build:
```bash
cd backend
npm run build
```

### Check backend logs:
```bash
cd backend
npm run start:dev
# Watch the console output
```

---

## ✅ Completion

Once all tests pass:

1. ✅ Mark this task as complete
2. ✅ Document any issues found
3. ✅ Keep the cleanup script for future use
4. ✅ Archive this testing document

---

**Last Updated:** August 12, 2026  
**Status:** Ready for Manual Testing
