# 🔄 DATABASE MIGRATION REQUIRED

## ⚠️ IMPORTANT: Run This Before Testing

The Accept/Reject workflow requires new database columns. Follow these steps:

---

## Step 1: Run Prisma Migration

**Open terminal in backend folder**:
```bash
cd backend
```

**Create and apply migration**:
```bash
npx prisma migrate dev --name add_accept_reject_workflow
```

**Expected Output**:
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "hrms", schema "public" at "localhost:5432"

Applying migration `20260807XXXXXX_add_accept_reject_workflow`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260807XXXXXX_add_accept_reject_workflow/
    └─ migration.sql

Your database is now in sync with your schema.
```

---

## Step 2: Generate Prisma Client

```bash
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in XXXms
```

---

## Step 3: Restart Backend

**Stop current backend** (Ctrl+C)

**Start fresh**:
```bash
npm run start:dev
```

**Look for**:
```
[Nest] INFO  NestApplication ready on http://localhost:4000
```

---

## What This Migration Does

**Adds to `Complaint` table**:
- `acceptedById` (VARCHAR, nullable) - FK to Employee
- `acceptedAt` (TIMESTAMP, nullable) - When complaint was accepted
- `rejectedById` (VARCHAR, nullable) - FK to Employee
- `rejectedAt` (TIMESTAMP, nullable) - When complaint was rejected
- `rejectReason` (TEXT, nullable) - Why complaint was rejected

**Updates `Employee` table**:
- Adds foreign key relations for accepted/rejected complaints

---

## Verify Migration Success

### Option 1: Prisma Studio
```bash
npx prisma studio
```
- Open browser to http://localhost:5555
- Click on `Complaint` model
- Check if new columns exist

### Option 2: Database Query
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Complaint' 
AND column_name IN ('acceptedById', 'acceptedAt', 'rejectedById', 'rejectedAt', 'rejectReason');
```

**Should return 5 rows** if successful.

---

## If Migration Fails

### Issue: Database Out of Sync
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run migration again
npx prisma migrate dev --name add_accept_reject_workflow
```

### Issue: Connection Error
- Check PostgreSQL is running
- Verify `.env` DATABASE_URL is correct
- Check port 5432 is accessible

### Issue: Permission Error
- Run terminal as Administrator
- Check database user has CREATE TABLE permission

---

## After Migration Success

✅ **Backend will work with Accept/Reject endpoints**
✅ **Frontend UI will display accept/reject data**
✅ **Notifications will be sent**
✅ **Timeline will show events**

---

## Test the Workflow

1. **Login as Employee**
   - Create a test complaint

2. **Login as HR**
   - Navigate to complaints queue
   - Click on the ticket
   - See Accept and Reject buttons
   - Click Accept → Verify status changes
   - Create another ticket and Reject it → Verify modal & reason

3. **Login as Employee**
   - Check accepted ticket → See green acceptance card
   - Check rejected ticket → See red rejection card with reason

**If you see the Accept/Reject buttons and can successfully click them, migration worked!** 🎉

---

## Need Help?

**Common Commands**:
```bash
# Check migration status
npx prisma migrate status

# View database schema
npx prisma db pull

# Open database browser
npx prisma studio

# Regenerate client after changes
npx prisma generate
```

**Logs to Check**:
- Backend console (look for Prisma errors)
- Browser console (look for 500 errors)
- Database logs (look for constraint violations)
