# 🔧 FIX OTP DATABASE TABLE - EXECUTE NOW

## ✅ PROBLEM IDENTIFIED
The `OtpVerification` model exists in Prisma schema but the database table was never created.

## 🚀 SOLUTION (Choose ONE method)

---

## METHOD 1: Using Prisma Migrate (RECOMMENDED)

### Step 1: Stop Backend
In your backend terminal:
```
Ctrl + C
```

### Step 2: Apply Migration
```bash
cd backend
npx prisma migrate deploy
```

This will apply the existing migration I just fixed.

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Start Backend
```bash
npm run start:dev
```

### Step 5: Test
Try employee login - OTP should work now!

---

## METHOD 2: Using Prisma DB Push (Alternative)

If Method 1 doesn't work, try this:

### Step 1: Stop Backend
```
Ctrl + C
```

### Step 2: Push Schema to Database
```bash
cd backend
npx prisma db push
```

This will create the missing OtpVerification table.

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Start Backend
```bash
npm run start:dev
```

---

## METHOD 3: Direct SQL (If backend must stay running)

### Step 1: Open New Terminal

### Step 2: Run SQL Script
```bash
cd backend
type fix-otp-table.sql | mysql -u root -pAditya@2508 fcs_hrms
```

**OR** if you have MySQL Workbench or phpMyAdmin:
1. Open the tool
2. Connect to `fcs_hrms` database
3. Run the SQL from `backend/fix-otp-table.sql`

### Step 3: Restart Backend
In backend terminal:
```
Ctrl + C
npm run start:dev
```

---

## ✅ VERIFICATION

After applying the fix:

### 1. Check Table Exists
```sql
SHOW TABLES LIKE 'OtpVerification';
```

Should return: `OtpVerification`

### 2. Check Table Structure
```sql
DESCRIBE OtpVerification;
```

Should show columns:
- id
- userId
- otpHash
- purpose
- phoneNumber
- expiresAt
- verified
- verifiedAt
- attempts
- maxAttempts
- createdAt
- updatedAt

### 3. Test Employee Login
1. Go to: http://localhost:3000/login/employee
2. Enter employee email/password
3. Backend should generate OTP
4. Check backend logs for:
   ```
   ✅ OTP generated for user...
   ```
5. No error about "table otpverification does not exist"

### 4. Test Forgot Password
1. Go to: http://localhost:3000/forgot-password
2. Enter employee email
3. OTP should be generated
4. No database errors

---

## 📊 WHAT WAS FIXED

### File: `backend/prisma/migrations/20260808102317_add_otp_verification/migration.sql`
**Before:** Empty migration (just comments)  
**After:** Proper SQL to create OtpVerification table

### Database Table Created:
```sql
OtpVerification
- id (VARCHAR, PRIMARY KEY)
- userId (VARCHAR, FOREIGN KEY → User.id)
- otpHash (VARCHAR)
- purpose (VARCHAR) -- LOGIN or PASSWORD_RESET
- phoneNumber (VARCHAR)
- expiresAt (DATETIME)
- verified (BOOLEAN, default: false)
- verifiedAt (DATETIME, nullable)
- attempts (INT, default: 0)
- maxAttempts (INT, default: 5)
- createdAt (DATETIME)
- updatedAt (DATETIME)
- INDEX on (userId, purpose, verified)
```

---

## 🧪 COMPLETE OTP FLOW VERIFICATION

### Employee Login Flow:
```
1. Employee enters email/password
   ↓
2. Backend validates credentials
   ↓
3. OTP created in OtpVerification table ✅
   ↓
4. OTP sent to phone (or logged in dev mode)
   ↓
5. Employee enters OTP
   ↓
6. OTP verified against database ✅
   ↓
7. Login succeeds
```

### Forgot Password Flow:
```
1. Employee clicks Forgot Password
   ↓
2. Enters email
   ↓
3. OTP created in OtpVerification table ✅
   ↓
4. OTP sent to registered mobile
   ↓
5. Employee enters OTP
   ↓
6. OTP verified ✅
   ↓
7. Password reset allowed
```

### Resend OTP:
```
1. Employee clicks Resend OTP
   ↓
2. Check last OTP timestamp (cooldown)
   ↓
3. If cooldown passed, create new OTP ✅
   ↓
4. Send to mobile
```

---

## ⚠️ TROUBLESHOOTING

### Issue: "Table already exists"
**Meaning:** Table was already created  
**Solution:** Just run `npx prisma generate` and restart backend

### Issue: "Migration failed"
**Try:**
```bash
cd backend
npx prisma migrate resolve --applied 20260808102317_add_otp_verification
npx prisma generate
```

### Issue: "Foreign key constraint fails"
**Check:** User table exists  
**Solution:** Run migrations in order:
```bash
npx prisma migrate deploy
```

### Issue: Still getting "table does not exist"
**Check:**
1. Which database is backend connected to?
   ```bash
   # Check .env file
   cat .env | grep DATABASE_URL
   ```
2. Verify table in that specific database:
   ```sql
   USE fcs_hrms;
   SHOW TABLES LIKE 'OtpVerification';
   ```

---

## 📝 COMMANDS SUMMARY

**Quick Fix (Recommended):**
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

**Alternative (DB Push):**
```bash
cd backend
npx prisma db push
npx prisma generate
npm run start:dev
```

**Direct SQL (Last Resort):**
```bash
cd backend
# Copy SQL from fix-otp-table.sql and run in MySQL
# Then:
npm run start:dev
```

---

## ✅ SUCCESS INDICATORS

After fix:
- ✅ No error: "table otpverification does not exist"
- ✅ Employee login generates OTP successfully
- ✅ OTP is stored in database
- ✅ OTP verification works
- ✅ Forgot password OTP works
- ✅ Resend OTP cooldown works
- ✅ All other HRMS data untouched

---

## 🎯 EXPECTED BACKEND LOGS

After fix, you should see:
```
[OtpService] Generating OTP for user: user@example.com
[OtpService] OTP generated and saved: 123456 (DEV MODE)
[OtpService] Verifying OTP for user: user@example.com
[OtpService] OTP verified successfully
```

No more:
```
❌ The table `otpverification` does not exist in the current database
```

---

## 📞 IF STILL FAILING

1. **Check Prisma version:**
   ```bash
   cd backend
   npx prisma --version
   ```

2. **Check database connection:**
   ```bash
   cd backend
   npx prisma db pull
   ```

3. **Regenerate client:**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

4. **Check actual database:**
   ```sql
   USE fcs_hrms;
   SHOW TABLES;
   -- Look for OtpVerification
   ```

---

**EXECUTE METHOD 1 NOW TO FIX THE ISSUE**

Time: 2 minutes  
Result: OTP table created, login works  
Risk: None (only creates missing table)
