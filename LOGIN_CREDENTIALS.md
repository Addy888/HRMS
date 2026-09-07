# 🔑 HRMS LOGIN CREDENTIALS

## Super Admin Accounts

### Primary Super Admin
```
Email: superadmin@fcs.com
Password: Admin@123
Redirect: /super-admin
Status: ✅ WORKING
```

### Alternative Super Admin
```
Email: adityashastri76@gmail.com
Password: 12345678
Redirect: /super-admin
Status: ✅ WORKING
```

---

## Important Notes

1. **Clear Browser Storage First**
   - Press F12 → Application → Clear site data
   - This removes old authentication tokens

2. **Backend Must Be Running**
   - Ensure backend is running on port 4000
   - Check terminal for any errors

3. **Both Accounts Work**
   - Use either Super Admin account
   - Both have full access to /super-admin

---

## API Endpoint

```
POST http://localhost:4000/api/v1/auth/login

Body:
{
  "email": "superadmin@fcs.com",
  "password": "Admin@123"
}

Response: 200 OK
```

---

## Database State

- **Organizations:** 1 (FCS Corporation)
- **Super Admins:** 2
- **Employees:** 1
- **All data preserved:** ✅

---

**Last Updated:** After creating superadmin@fcs.com account
**Status:** Both logins tested and working ✅
