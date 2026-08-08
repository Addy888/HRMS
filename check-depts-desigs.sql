-- Check current departments
SELECT 'DEPARTMENTS:' as '';
SELECT id, name, description FROM Department ORDER BY name;

-- Check current designations
SELECT '' as '';
SELECT 'DESIGNATIONS:' as '';
SELECT id, name, description FROM Designation ORDER BY name;

-- Check employees and their departments/designations
SELECT '' as '';
SELECT 'EMPLOYEES:' as '';
SELECT 
  e.employeeId,
  e.firstName,
  e.lastName,
  d.name as department,
  ds.name as designation
FROM Employee e
LEFT JOIN Department d ON e.departmentId = d.id
LEFT JOIN Designation ds ON e.designationId = ds.id
ORDER BY e.createdAt DESC
LIMIT 10;
