# 🔧 HRMS Quick Reference - Role vs Designation

## 🎯 KEY RULE
**NEVER create a Designation with the same name as a system Role**

---

## ⚠️ SYSTEM ROLES (Authentication Only)
These should ONLY exist in the `Role` table:

- `SUPER_ADMIN` / `Super Admin`
- `PLATFORM_SUPER_ADMIN` / `Platform Super Admin`
- `HR_ADMIN` / `HR Admin`
- `HR_USER` / `HR User`
- `HR`
- `EMPLOYEE` / `Employee`
- `ADMIN` / `Admin`

❌ **DO NOT** create these as Designations!

---

## ✅ EMPLOYEE DESIGNATIONS (Job Titles)
These go in the `Designation` table:

### Management
- Manager
- Team Leader
- Senior Manager
- Department Head
- Project Manager

### Technical
- Developer
- Senior Developer
- Software Engineer
- IT Engineer
- QA Engineer
- DevOps Engineer
- Data Analyst
- UI/UX Designer
- Technical Writer

### Business
- Agent
- Senior Agent
- Sales Executive
- Marketing Executive
- Business Analyst
- Accountant
- HR Executive
- HR Manager

✅ **DO** create custom job titles as needed!

---

## 🛠️ USEFUL SCRIPTS

### Check Database Status
```bash
npx ts-node test-designation-api.ts
```

### Clean System Roles from Designations
```bash
npx ts-node cleanup-system-role-designations.ts
```

### Add Employee Designations
```bash
npx ts-node seed-employee-designations.ts
```

---

## 🔍 Quick Database Queries

### Check for system roles in wrong table
```sql
SELECT * FROM Designation 
WHERE name IN ('SUPER_ADMIN', 'Super Admin', 'HR_ADMIN', 'EMPLOYEE');
-- Expected: 0 rows
```

### List all employee designations
```sql
SELECT d.name, COUNT(e.id) as employee_count
FROM Designation d
LEFT JOIN Employee e ON e.designationId = d.id
GROUP BY d.id, d.name
ORDER BY d.name;
```

### List all system roles
```sql
SELECT name, level, isSystem 
FROM Role 
ORDER BY level DESC;
```

---

## 📝 Adding New Designations

### Via Code (Recommended for initial setup)
Edit `seed-employee-designations.ts`:
```typescript
const employeeDesignations = [
  // ... existing
  { name: 'Your New Title', description: 'Description' },
];
```

### Via HR Panel (Recommended for production)
1. Login as HR Admin
2. Go to HR Panel → Designations
3. Click "Create Designation"
4. Enter name (e.g., "Senior Analyst")
5. Ensure name is NOT a system role

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T
```typescript
// DON'T create system roles as designations
await prisma.designation.create({
  data: { name: 'Super Admin' }  // ❌ WRONG
});

await prisma.designation.create({
  data: { name: 'HR_ADMIN' }  // ❌ WRONG
});
```

### ✅ DO
```typescript
// DO create proper job titles
await prisma.designation.create({
  data: { name: 'Senior Manager' }  // ✅ CORRECT
});

await prisma.designation.create({
  data: { name: 'Lead Developer' }  // ✅ CORRECT
});
```

---

## 🔐 Security Checklist

When modifying designation-related code:

- [ ] Does the API enforce organizationId filtering?
- [ ] Are system roles excluded from designation list?
- [ ] Can users only see their organization's data?
- [ ] Is the EMPLOYEE role automatically assigned during employee creation?
- [ ] Can HR create SUPER_ADMIN through employee form? (Should be NO)

---

## 📞 Troubleshooting

### "Super Admin" appears in dropdown
1. Run cleanup script: `npx ts-node cleanup-system-role-designations.ts`
2. Verify backend filtering in `designations.service.ts`
3. Check database: No system roles in Designation table

### Dropdown is empty
1. Run seed script: `npx ts-node seed-employee-designations.ts`
2. Check organization: Designations are org-scoped
3. Verify API: Check `/designations` endpoint response

### Cross-tenant data leak
1. Verify `organizationId` filtering in service
2. Check JWT token includes correct org
3. Test with users from different orgs

---

## 📚 Related Files

- `backend/src/modules/designations/designations.service.ts` - Main logic
- `backend/src/modules/designations/designations.controller.ts` - API endpoints
- `backend/setup-initial-organization.ts` - Initial setup
- `backend/cleanup-system-role-designations.ts` - Cleanup tool
- `backend/seed-employee-designations.ts` - Seed tool
- `backend/test-designation-api.ts` - Test tool
- `frontend/src/components/CreateEmployeeModal.tsx` - UI component

---

## ✅ Quick Test
```bash
# Run test to verify everything is correct
cd backend
npx ts-node test-designation-api.ts

# Expected output:
# ✅ No system roles in Designation table
# ✅ Valid employee designations present
# ✅ Organization isolation working
# ✅ ALL CHECKS PASSED!
```

---

**Last Updated:** 2026-09-07  
**Status:** Production Ready ✅
