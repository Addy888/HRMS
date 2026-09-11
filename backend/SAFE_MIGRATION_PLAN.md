# Safe Migration Plan for CompanyPolicy.organizationId

## Problem Identified

**Local Database**: Has `companypolicy.organizationId` column ✅  
**Migration Status**: OUT OF SYNC ❌

### Current State:
- Database has these old migrations applied:
  - 20260805075958_add_attendance_module
  - 20260806103300_add_company_policy (WITHOUT organizationId)
  - 20260808102317_add_otp_verification
  - 20260808111700_add_multi_tenant_support
  - 20260808120000_add_hr_ownership

- Local migrations folder has:
  - 20260907081455_add_organization_to_company_policy (NOT APPLIED)
  - 20260908101346_add_flexible_attendance_import (NOT APPLIED)
  - 20260909120000_fix_department_missing_fields (NOT APPLIED)

### Root Cause:
The migration `20260907081455_add_organization_to_company_policy` exists but was never applied to the database. However, someone manually added the `organizationId` column to the local database (possibly through manual SQL or a different process).

## Solution: Baseline the Database

Since the database already HAS the `organizationId` column (someone added it manually), we need to tell Prisma that the migrations are already applied.

### Step-by-Step Safe Migration:

1. **Mark old migrations as resolved** (they're applied but not in local folder)
2. **Mark new migrations as resolved** (changes already exist in database)
3. **Verify schema matches**

## Execution Commands:

```bash
# Step 1: Mark old migrations as applied (resolve the mismatch)
npx prisma migrate resolve --applied "20260805075958_add_attendance_module"
npx prisma migrate resolve --applied "20260806103300_add_company_policy"
npx prisma migrate resolve --applied "20260808102317_add_otp_verification"
npx prisma migrate resolve --applied "20260808111700_add_multi_tenant_support"
npx prisma migrate resolve --applied "20260808120000_add_hr_ownership"

# Step 2: Mark new migrations as applied (organizationId already exists)
npx prisma migrate resolve --applied "20260907081455_add_organization_to_company_policy"
npx prisma migrate resolve --applied "20260908101346_add_flexible_attendance_import"
npx prisma migrate resolve --applied "20260909120000_fix_department_missing_fields"

# Step 3: Verify status
npx prisma migrate status

# Step 4: Generate Prisma client
npx prisma generate

# Step 5: Rebuild backend
npm run build
```

## Alternative: If organizationId is actually MISSING from production

If the production server database truly DOESN'T have `organizationId`, then we need to apply the migration safely:

```bash
# Check current schema first
node check-schema.mjs

# If organizationId is missing, apply the migration
npx prisma migrate deploy
```

## Verification After Migration:

```sql
-- Verify organizationId exists
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'fcs_hrms'
  AND TABLE_NAME = 'companypolicy'
  AND COLUMN_NAME = 'organizationId';

-- Should return:
-- organizationId | varchar(191) | NO | MUL
```

## Data Backfill (if needed):

If CompanyPolicy records exist WITHOUT organizationId values:

```sql
-- Check if any policies need organizationId
SELECT id, policyName, organizationId 
FROM companypolicy 
WHERE organizationId IS NULL OR organizationId = '';

-- If records exist, determine correct organization and update
-- DO NOT run this without knowing the correct organizationId!
```

## Risk Assessment:

- **Risk Level**: LOW (if organizationId already exists)
- **Data Loss Risk**: NONE (no data deletion)
- **Downtime**: < 1 minute
- **Rollback**: Mark migrations as rolled back if needed

## Pre-Migration Checklist:

- [ ] Backup database
- [ ] Verify current schema (run `node check-schema.mjs`)
- [ ] Confirm no active transactions
- [ ] Test on local database first
- [ ] Have rollback plan ready

## Post-Migration Verification:

- [ ] Check migration status (`npx prisma migrate status`)
- [ ] Verify column exists (`node check-schema.mjs`)
- [ ] Test employee creation (HR panel)
- [ ] Test employee edit (SUPER_ADMIN panel)
- [ ] Check application logs for P2022 errors
