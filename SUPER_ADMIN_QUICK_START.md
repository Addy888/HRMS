# Super Admin - Quick Start Guide 🚀

## Access Super Admin Panel

### 1. Login
```
URL: http://localhost:3000/login/admin
Email: adityashastri76@gmail.com
Password: 12345678
```

### 2. Navigate Dashboard
After login, you'll see the Super Admin dashboard at `/admin` with:
- System statistics
- Quick action buttons
- System status indicators

## Create HR Account

### Step-by-Step:

1. **Click "HR Management" in sidebar**
   - Or go directly to: `http://localhost:3000/admin/hr-users`

2. **Click "+ Create HR Account"**

3. **Fill the form:**
   ```
   First Name: John
   Last Name: Doe
   Email: john.doe@company.com
   Password: SecurePass@123
   Confirm Password: SecurePass@123
   Mobile: 9876543210
   Status: ✓ Active
   ```

4. **Click "Create HR Account"**

5. **Success!** The HR account is now created

## Test HR Login

1. **Logout from Super Admin**
   - Click "Logout" in sidebar

2. **Go to HR Login**
   ```
   URL: http://localhost:3000/login/hr
   Email: john.doe@company.com
   Password: SecurePass@123
   ```

3. **HR Portal Opens**
   - Redirects to `/hr`
   - Full HR access granted
   - All HR modules visible

## Manage HR Accounts

### Edit HR Account
1. Find HR in table
2. Click ✏️ Edit icon
3. Update name or mobile
4. Save changes

### Deactivate HR
1. Find HR in table
2. Click 🔴 PowerOff icon
3. Status changes to "Inactive"
4. HR can no longer login

### Reactivate HR
1. Find inactive HR in table
2. Click 🟢 Power icon
3. Status changes to "Active"
4. HR can login again

### Reset Password
1. Find HR in table
2. Click 🔑 Key icon
3. Enter new password
4. Confirm password
5. Click "Reset Password"
6. HR must use new password

## Search HR Accounts

- Use search bar at top
- Type name or email
- Results filter in real-time

## System Access

### Super Admin Can Access:
- ✅ `/admin/*` - Super Admin panel
- ❌ `/hr/*` - Not accessible
- ❌ `/employee/*` - Not accessible

### HR Can Access:
- ❌ `/admin/*` - Not accessible
- ✅ `/hr/*` - HR panel
- ❌ `/employee/*` - Not accessible

### Employee Can Access:
- ❌ `/admin/*` - Not accessible
- ❌ `/hr/*` - Not accessible
- ✅ `/employee/*` - Employee portal

## Quick Reference

### Default Accounts

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| Super Admin | adityashastri76@gmail.com | 12345678 | /login/admin |
| HR | sumaiyyatamboli50@gmail.com | 123456789 | /login/hr |

### API Endpoints

All require Super Admin JWT token:

```
GET    /admin/hr-users              # List HRs
POST   /admin/hr-users              # Create HR
GET    /admin/hr-users/:id          # Get HR details
PATCH  /admin/hr-users/:id          # Update HR
PATCH  /admin/hr-users/:id/status   # Change status
POST   /admin/hr-users/:id/reset-password  # Reset password
```

### Status Values

- **ACTIVE**: HR can login
- **INACTIVE**: HR cannot login

## Troubleshooting

### "Access denied. Only Super Admin can login here"
- You're trying to login at `/login/admin` with non-Super Admin account
- HR users should use `/login/hr`
- Employees should use `/login`

### "Email already exists"
- Email is already registered in system
- Use different email address
- Check if account already exists in table

### HR cannot login
- Check account status (must be Active)
- Verify password is correct
- Ensure using `/login/hr` (not `/login/admin`)

### Can't access admin panel
- Verify you're logged in as Super Admin
- Check browser console for errors
- Clear localStorage and login again

## Best Practices

1. **Use strong passwords** (min 8 characters)
2. **Deactivate unused accounts** (don't delete)
3. **Regular audits** of HR account list
4. **Document password resets** for security
5. **Keep Super Admin credentials secure**

## What's Next?

The Super Admin panel is ready for:
- Creating unlimited HR accounts
- Managing HR access
- Viewing system overview

Coming soon:
- Detailed audit log viewer
- Employee management
- System settings
- Role & permission configuration

---

Need help? Check `SUPER_ADMIN_IMPLEMENTATION.md` for complete technical documentation.
