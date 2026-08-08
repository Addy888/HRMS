# Quick Start - HR User Management

## 🚀 Access the Feature

1. **Login as HR:**
   ```
   URL: http://localhost:3000/login/hr
   Email: sumaiyyatamboli50@gmail.com
   Password: 123456789
   ```

2. **Navigate to HR Users:**
   - From HR sidebar, click **"HR Users"**
   - Or go directly: `http://localhost:3000/hr/hr-users`

## ➕ Create New HR User

1. Click **"+ Add HR User"** button
2. Fill the form:
   - First Name: (required)
   - Last Name: (required)
   - Corporate Email: (required, must be unique)
   - Mobile Number: (optional, 10 digits)
   - Department: (optional dropdown)
   - Designation: (optional dropdown)
   - Status: ✓ Active (default checked)

3. Click **"Create HR User"**
4. **IMPORTANT:** Copy the temporary password from the modal
5. Share credentials with the new HR user

## 🔄 Manage HR Users

### Edit HR User
- Click the **Edit** icon (✏️) next to any HR user
- Update: Name, Mobile, Department, Designation
- Email cannot be changed

### Activate/Deactivate
- Click the **Power** icon to toggle status
- 🟢 Active = User can login
- 🔴 Inactive = Login blocked

### Reset Password
- Click the **Key** icon (🔑)
- New temporary password is generated
- Password is displayed in modal
- User must change password on next login

## 🔐 Login as New HR User

1. **First Login:**
   ```
   URL: http://localhost:3000/login/hr
   Email: [new-hr-email]
   Password: [temporary-password]
   ```

2. **System redirects to:** `/change-password`
3. **Enter:**
   - Current Password: [temporary-password]
   - New Password: [your-secure-password]
   - Confirm: [your-secure-password]

4. **Click:** "Change Password"
5. **Redirected to:** `/hr` dashboard

## ⚡ Quick Actions

| Action | Icon | Description |
|--------|------|-------------|
| Edit | ✏️ | Update HR profile details |
| Activate | 🟢 | Enable HR login access |
| Deactivate | 🔴 | Block HR login access |
| Reset Password | 🔑 | Generate new temporary password |

## 🔍 Search & Filter

- **Search bar:** Type name or email to filter
- **Real-time:** Results update as you type
- **Case-insensitive:** Works with partial matches

## 📊 Table Columns

| Column | Data |
|--------|------|
| HR Name | Full name + Employee ID |
| Email | Corporate email address |
| Mobile | Phone number (or "—" if not set) |
| Department | Department name (or "—") |
| Status | 🟢 Active / 🔴 Inactive badge |
| Created | Date when account was created |
| Actions | Edit / Status / Reset Password |

## 🛡️ Security Notes

1. **Passwords:**
   - Never stored in plain text
   - Hashed with bcrypt
   - 12 characters auto-generated
   - Must be changed on first login

2. **Access Control:**
   - Only HR role can access `/hr/*` routes
   - Inactive users cannot login
   - JWT token required for all actions

3. **Audit Trail:**
   - All actions are logged
   - Database maintains full history
   - Accounts are never deleted (soft delete)

## 🎯 Common Tasks

### Onboard New HR Staff Member
1. Create HR user with their details
2. Copy temporary password
3. Send credentials via secure channel (Slack, WhatsApp, Email)
4. User logs in and sets permanent password
5. User gains full HR portal access

### Temporarily Suspend HR Access
1. Find HR user in table
2. Click Deactivate (🔴)
3. User cannot login until reactivated
4. Account data is preserved

### Reset Forgotten Password
1. Find HR user in table
2. Click Reset Password (🔑)
3. Copy new temporary password
4. Share with user securely
5. User logs in and changes password

## 🐛 Troubleshooting

### "Email already exists"
- Email must be unique across all users
- Check if email is already registered
- Use a different email address

### "Account deactivated"
- Check user status in table
- Activate the account
- User can then login

### "Invalid credentials"
- Verify email is correct
- Check if account exists
- Ensure using correct password
- Check account status (must be Active)

### Temporary password not working
- Password is case-sensitive
- No spaces before/after
- Use copy-paste to avoid typos
- If expired, generate new one

## 📱 Default HR Accounts

The system comes with two pre-configured HR accounts:

### Account 1 (Primary)
```
Email: sumaiyyatamboli50@gmail.com
Password: 123456789
Employee ID: FCS-HR-ADMIN-001
Role: HR
Status: Active
```

### Account 2 (Secondary)
```
Email: adityashastri76@gmail.com
Password: 12345678
Employee ID: FCS-HR-001
Role: HR
Status: Active
```

Both accounts have full HR access and cannot be deleted.

## 🎓 Best Practices

1. **Create HR accounts before employee's first day**
2. **Always use corporate email addresses**
3. **Set department and designation for better organization**
4. **Deactivate accounts when HR staff leave (don't delete)**
5. **Regularly audit HR user list**
6. **Use strong passwords when changing from temporary**
7. **Reset passwords immediately if compromised**

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify account status in HR Users table
3. Check browser console for errors
4. Review audit logs in database
5. Contact system administrator

---

**Happy HR Management! 🎉**
