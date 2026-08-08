# Test Employee Creation - Step by Step

## ✅ CODE IS FIXED

The CreateEmployeeModal is now correctly:
- Fetching departments from API with UUIDs
- Fetching designations from API with UUIDs
- Using `d.id` (UUID) as the option value
- Displaying `d.name` to the user

## 🧹 CLEAR BROWSER CACHE

**CRITICAL:** You must clear your browser cache to see the changes!

### Method 1: Hard Refresh (Quick)
1. Open the application in browser
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. This forces the browser to reload all files

### Method 2: Clear Cache (Complete)
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Clear storage** in left sidebar
4. Click **Clear site data** button
5. Refresh the page (`F5`)

### Method 3: Incognito/Private Window
1. Open new Incognito window (`Ctrl + Shift + N`)
2. Login to the application
3. Test employee creation

## 📋 TEST STEPS

### Step 1: Verify Departments Exist in Database

Run this SQL query:
```sql
SELECT id, name FROM Department ORDER BY name;
```

**Expected:** You should see departments with UUID ids like:
```
id                                   | name
-------------------------------------|------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Engineering
b2c3d4e5-f6a7-8901-bcde-f12345678901 | Sales
```

**If empty:** Create departments first via HR dashboard or SQL:
```sql
INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (UUID(), 'Engineering', 'Engineering Department', NOW(), NOW());

INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (UUID(), 'Sales', 'Sales Department', NOW(), NOW());
```

### Step 2: Verify Designations Exist in Database

Run this SQL query:
```sql
SELECT id, name FROM Designation ORDER BY name;
```

**If empty:** Create designations via HR dashboard or SQL:
```sql
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
VALUES (UUID(), 'Software Engineer', 'Software Development', NOW(), NOW());

INSERT INTO Designation (id, name, description, createdAt, updatedAt)
VALUES (UUID(), 'Sales Executive', 'Sales Operations', NOW(), NOW());
```

### Step 3: Open Create Employee Modal

1. Login as HR (adityashastri76@gmail.com / 12345678)
2. Go to **Employees** page
3. Click **"Add Employee"** button
4. Modal opens

### Step 4: Check Browser Console

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. You should see:
   ```
   🔍 Fetching departments from API...
   📊 Departments loaded: X items
   📋 Departments data: [...]
   🔍 Fetching designations from API...
   📊 Designations loaded: X items
   📋 Designations data: [...]
   ```

### Step 5: Inspect Department Dropdown

1. Click on the **Department** dropdown
2. Right-click on an option → **Inspect Element**
3. Check the `<option>` element:
   ```html
   <option value="a1b2c3d4-...">Engineering</option>
   ```
4. **The value MUST be a UUID, not "IT" or "SALES"**

### Step 6: Fill Form and Monitor

1. Fill in employee details:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@fcs.com
   - Phone: 9876543210
   - Department: Select "Engineering"
   - Designation: Select "Software Engineer"
   - Monthly Salary: 50000

2. **Watch the console when you select department:**
   ```
   🏢 Department selected: {
     value: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     option: { id: "a1b2c3d4-...", name: "Engineering" }
   }
   ```

3. **Watch the console when you select designation:**
   ```
   💼 Designation selected: {
     value: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
     option: { id: "b2c3d4e5-...", name: "Software Engineer" }
   }
   ```

### Step 7: Submit and Check Payload

1. Click **"Create Employee"** button
2. **Check browser console:**
   ```
   📤 Submitting employee creation with: {
     firstName: "John",
     lastName: "Doe",
     email: "john.doe@fcs.com",
     departmentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  ← MUST BE UUID!
     designationId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",  ← MUST BE UUID!
     ...
   }
   ```

3. **Check backend terminal:**
   ```
   📝 Creating employee with data: {
     email: 'john.doe@fcs.com',
     departmentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     designationId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
   }
   🔍 Validating department ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   📊 Department found: { id: 'a1b2c3d4-...', name: 'Engineering' }
   ```

4. **Expected:** Success message "Employee created successfully!"

### Step 8: Verify in Database

Run this SQL query:
```sql
SELECT 
  e.employeeId,
  e.firstName,
  e.lastName,
  d.name as department,
  ds.name as designation
FROM Employee e
LEFT JOIN Department d ON e.departmentId = d.id
LEFT JOIN Designation ds ON e.designationId = ds.id
WHERE e.email = 'john.doe@fcs.com';
```

**Expected:**
```
employeeId    | firstName | lastName | department  | designation
--------------|-----------|----------|-------------|------------------
FCS-2026-0001 | John      | Doe      | Engineering | Software Engineer
```

## ❌ IF STILL SEEING "SALES" or "AI_ENGINEER"

### Problem: Browser Cache

**Solution:**
1. Close the browser completely
2. Restart the browser
3. Open in Incognito/Private mode
4. Try again

### Problem: Old Build

**Solution:**
1. Stop frontend server (`Ctrl+C`)
2. Delete `.next` folder:
   ```bash
   cd frontend
   rm -rf .next
   ```
3. Restart:
   ```bash
   npm run dev
   ```

### Problem: Wrong API Endpoint

**Solution:**
Check Network tab in DevTools:
1. Look for `/departments` request
2. Check the Response
3. Verify it returns UUID ids

## ✅ SUCCESS CRITERIA

- [ ] Browser console shows departments with UUID ids
- [ ] Browser console shows designations with UUID ids
- [ ] Department dropdown `<option value="uuid">Name</option>`
- [ ] Designation dropdown `<option value="uuid">Name</option>`
- [ ] Submitted payload contains UUID departmentId
- [ ] Submitted payload contains UUID designationId
- [ ] Backend validates department successfully
- [ ] Employee created without errors
- [ ] Database shows correct department/designation

## 🎯 FINAL VERIFICATION

After successful creation:
1. Go to Employees list
2. Find the newly created employee
3. Department column shows correct name
4. Click on employee to view details
5. Department and designation display correctly

---

**If you're still seeing hardcoded "SALES" or "IT" values, the browser is serving cached JavaScript. Clear the cache completely!**
