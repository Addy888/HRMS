# Fix Prisma Client - OtpVerification Not Found

## ❌ ERROR

```
error TS2551: Property 'otpVerification' does not exist on type 'PrismaService'
```

## 🔍 ROOT CAUSE

The Prisma client needs to be regenerated after the `OtpVerification` model was added to the schema. The TypeScript types are out of sync with the database schema.

## ✅ SOLUTION

### Step 1: Stop the Backend Server

**Important:** You must stop the backend server first because it locks the Prisma client files.

Press `Ctrl+C` in the terminal where backend is running.

### Step 2: Regenerate Prisma Client

Run this command in the backend directory:

```bash
cd backend
npx prisma generate
```

### Step 3: Run Database Migration (if needed)

If the OtpVerification table doesn't exist in your database yet:

```bash
npx prisma migrate dev --name add_otp_verification
```

Or if you prefer to push without migration:

```bash
npx prisma db push
```

### Step 4: Restart Backend Server

```bash
npm run start:dev
```

## 📝 DETAILED STEPS

### Windows (PowerShell):

```powershell
# 1. Stop backend (Ctrl+C in backend terminal)

# 2. Navigate to backend folder
cd C:\Users\ADITYA\OneDrive\Desktop\HRMS\backend

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Apply database migration
npx prisma migrate dev

# 5. Restart backend
npm run start:dev
```

## ✅ VERIFICATION

After regenerating, you should see:

```
✔ Generated Prisma Client (5.x.x | library) to .\node_modules\@prisma\client
```

And the TypeScript errors should disappear.

## 🔄 IF STILL GETTING ERRORS

If `npx prisma generate` fails with "EPERM: operation not permitted":

1. **Make sure backend is fully stopped** (no `nest start` or `npm run start:dev` running)
2. **Close VS Code** (it might be locking files)
3. **Run command prompt as Administrator**
4. Try again:
   ```bash
   cd backend
   npx prisma generate
   ```

## 📊 WHAT THIS DOES

`npx prisma generate` reads your `schema.prisma` file and generates:
- TypeScript types for all models (including OtpVerification)
- Prisma Client API methods
- Type-safe database queries

After generation, `this.prisma.otpVerification` will be available in your TypeScript code.

---

**Quick Fix:**
1. Stop backend (Ctrl+C)
2. Run: `cd backend && npx prisma generate`
3. Run: `npm run start:dev`
4. Done! ✅
