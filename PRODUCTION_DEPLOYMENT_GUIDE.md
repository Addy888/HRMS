# 🚀 PRODUCTION DEPLOYMENT GUIDE

This guide walks you through deploying the HRMS application to production.

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Database Backup
```bash
# MySQL backup
mysqldump -u root -p hrms_db > backup_before_production.sql
```

### 2. Clean Test Data
```bash
cd backend
npx ts-node scripts/cleanup-test-data.ts
```

### 3. Create Production Admin
```bash
cd backend
npx ts-node scripts/create-production-admin.ts
```

## 🔧 BACKEND DEPLOYMENT

### Step 1: Environment Variables
```bash
cd backend
cp .env.example .env
# Edit .env with production values
```

**Required Variables**:
- `DATABASE_URL` - Production MySQL connection
- `JWT_SECRET` - Secure random string (use: `openssl rand -base64 32`)
- `FRONTEND_URL` - Your frontend domain
- `CORS_ORIGIN` - Your frontend domain (no wildcards)

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Run Database Migrations
```bash
npx prisma migrate deploy
```

### Step 5: Build for Production
```bash
npm run build
```

### Step 6: Start Production Server
```bash
npm run start:prod
```

**Or with PM2**:
```bash
pm2 start dist/src/main.js --name hrms-backend
pm2 save
pm2 startup
```

## 🎨 FRONTEND DEPLOYMENT

### Step 1: Environment Variables
```bash
cd frontend
cp .env.example .env.production
# Edit .env.production with production values
```

**Required Variables**:
- `NEXT_PUBLIC_API_URL` - Production backend URL

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build for Production
```bash
npm run build
```

### Step 4: Start Production Server
```bash
npm run start
```

**Or with PM2**:
```bash
pm2 start npm --name hrms-frontend -- start
pm2 save
```

## 🗄️ DATABASE SETUP

### Production MySQL Database

1. **Create Database**:
```sql
CREATE DATABASE hrms_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Create Database User**:
```sql
CREATE USER 'hrms_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hrms_production.* TO 'hrms_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Update DATABASE_URL** in backend/.env:
```
DATABASE_URL="mysql://hrms_user:secure_password@localhost:3306/hrms_production"
```

## 📁 FILE STORAGE

The application stores uploaded files in `backend/uploads/`.

**For Production**:
- Ensure the upload directory is persistent (not ephemeral storage)
- Set proper permissions: `chmod 755 uploads/`
- Consider using cloud storage (S3, Google Cloud Storage) for scalability

**Current Upload Paths**:
- `/uploads/avatars/` - Profile photos
- `/uploads/documents/` - Employee documents
- `/uploads/complaints/` - Complaint attachments

## 🔒 SECURITY CHECKLIST

- [x] JWT_SECRET is changed from default
- [x] DATABASE_URL uses strong password
- [x] CORS is restricted to frontend domain only
- [x] .env files are in .gitignore
- [x] Passwords are hashed with bcrypt
- [x] No test/demo accounts in production
- [x] No hardcoded credentials
- [x] Error messages don't expose stack traces
- [x] File uploads have size limits (10MB)
- [x] HR ownership isolation is enforced
- [x] Organization isolation is enforced

## 🎯 EMPLOYEE ID SYSTEM

### Production Format
- **Format**: `FCS0151`, `FCS0152`, `FCS0153`, etc.
- **Starting ID**: `FCS0151`
- **Auto-generated**: Backend creates IDs automatically
- **Thread-safe**: Prevents duplicate IDs

### How It Works
1. HR creates an employee
2. Backend queries database for the last employee ID
3. Increments the sequence by 1
4. Assigns new ID to employee
5. Returns employee with ID

**No manual input required** - HR users do not enter employee IDs.

## 🧪 POST-DEPLOYMENT TESTING

### 1. Test Admin Login
```
URL: https://your-frontend-domain.com/auth/login
Email: (from create-production-admin script)
Password: (from create-production-admin script)
```

### 2. Test Employee Creation
```
1. Login as HR_ADMIN
2. Navigate to Employees → Create Employee
3. Fill in employee details
4. Submit form
5. Verify employee ID is: FCS0151
6. Create another employee
7. Verify employee ID is: FCS0152
```

### 3. Test HR Ownership Isolation
```
1. Create second HR_USER account
2. HR_USER creates an employee
3. Logout
4. Login as first HR_USER
5. Verify you cannot see second HR's employee
6. Verify dashboard shows only your employees
```

### 4. Test All Modules
- [ ] Employee Management
- [ ] Document Management
- [ ] Policy Management
- [ ] Helpdesk/Complaints
- [ ] Payroll
- [ ] Dashboard
- [ ] Notifications
- [ ] Attendance (if applicable)

## 🚨 TROUBLESHOOTING

### Issue: "Cannot connect to database"
**Solution**: Check DATABASE_URL in .env, verify MySQL is running

### Issue: "CORS error"
**Solution**: Verify CORS_ORIGIN in backend/.env matches frontend domain

### Issue: "Employee ID not generated"
**Solution**: Check backend logs, ensure employee creation is using new format

### Issue: "File uploads not working"
**Solution**: Check uploads/ directory exists and has write permissions

### Issue: "JWT authentication fails"
**Solution**: Verify JWT_SECRET is set and matches across restarts

## 📊 MONITORING

### Backend Health Check
```bash
curl https://your-backend-domain.com/health
```

### View Backend Logs
```bash
# If using PM2
pm2 logs hrms-backend

# If using direct process
tail -f logs/application.log
```

### Database Monitoring
```sql
-- Check employee count
SELECT COUNT(*) FROM Employee WHERE user.role = 'EMPLOYEE';

-- Check latest employee ID
SELECT employeeId FROM Employee 
WHERE employeeId LIKE 'FCS%' 
ORDER BY employeeId DESC LIMIT 1;

-- Check active users
SELECT role.name, COUNT(*) as count 
FROM User 
JOIN Role ON User.roleId = Role.id 
WHERE User.isActive = true 
GROUP BY role.name;
```

## 🔄 MAINTENANCE

### Database Backup (Schedule Daily)
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u hrms_user -p hrms_production > /backups/hrms_$DATE.sql
```

### Log Rotation
```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/hrms
```

### Update Application
```bash
cd backend
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hrms-backend

cd ../frontend
git pull
npm install
npm run build
pm2 restart hrms-frontend
```

## 📞 SUPPORT

### Common Issues Repository
Create an issue on your repository for bugs or feature requests.

### Production Admin Contact
Keep production admin credentials secure and accessible only to authorized personnel.

## ✅ DEPLOYMENT COMPLETE

After completing all steps:

1. Test all functionality thoroughly
2. Monitor logs for 24 hours
3. Set up automated backups
4. Document any customizations
5. Train HR users on the system
6. Provide user documentation

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Admin Email**: _______________
