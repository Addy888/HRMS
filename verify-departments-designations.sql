-- ============================================================
-- VERIFY DEPARTMENTS AND DESIGNATIONS
-- Run this to check if your database has the required data
-- ============================================================

-- Check all departments
SELECT 
  id as 'Department ID',
  name as 'Department Name',
  description as 'Description',
  createdAt as 'Created At'
FROM Department
ORDER BY name;

-- Check all designations
SELECT 
  id as 'Designation ID',
  name as 'Designation Name',
  description as 'Description',
  createdAt as 'Created At'
FROM Designation
ORDER BY name;

-- Check if common department names exist (case-insensitive)
SELECT 
  CASE
    WHEN EXISTS(SELECT 1 FROM Department WHERE LOWER(name) = 'sales') THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'Sales Department',
  CASE
    WHEN EXISTS(SELECT 1 FROM Department WHERE LOWER(name) = 'it') THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'IT Department',
  CASE
    WHEN EXISTS(SELECT 1 FROM Department WHERE LOWER(name) = 'hr') THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'HR Department',
  CASE
    WHEN EXISTS(SELECT 1 FROM Department WHERE LOWER(name) = 'administration') THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'Administration Department';

-- Check if common designation names exist
SELECT 
  CASE
    WHEN EXISTS(SELECT 1 FROM Designation WHERE LOWER(name) IN ('sales executive', 'sales_executive')) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'Sales Executive',
  CASE
    WHEN EXISTS(SELECT 1 FROM Designation WHERE LOWER(name) IN ('ai engineer', 'ai_engineer')) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'AI Engineer',
  CASE
    WHEN EXISTS(SELECT 1 FROM Designation WHERE LOWER(name) IN ('team leader', 'team_leader')) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'Team Leader',
  CASE
    WHEN EXISTS(SELECT 1 FROM Designation WHERE LOWER(name) IN ('manager', 'manager')) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as 'Manager';

-- Count total records
SELECT 
  (SELECT COUNT(*) FROM Department) as 'Total Departments',
  (SELECT COUNT(*) FROM Designation) as 'Total Designations',
  (SELECT COUNT(*) FROM Employee) as 'Total Employees';

-- Check employees with their department and designation names
SELECT 
  e.employeeId as 'Employee ID',
  e.email as 'Email',
  e.firstName as 'First Name',
  e.lastName as 'Last Name',
  d.name as 'Department',
  ds.name as 'Designation',
  e.departmentId as 'Dept UUID',
  e.designationId as 'Desig UUID'
FROM Employee e
LEFT JOIN Department d ON e.departmentId = d.id
LEFT JOIN Designation ds ON e.designationId = ds.id
ORDER BY e.createdAt DESC
LIMIT 10;

-- Check for any employees with invalid foreign keys (should be none)
SELECT 
  'Employees with invalid departmentId' as Issue,
  COUNT(*) as Count
FROM Employee e
WHERE e.departmentId IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM Department d WHERE d.id = e.departmentId)
UNION ALL
SELECT 
  'Employees with invalid designationId' as Issue,
  COUNT(*) as Count
FROM Employee e
WHERE e.designationId IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM Designation ds WHERE ds.id = e.designationId);
