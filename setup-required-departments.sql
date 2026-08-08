-- ============================================================
-- SETUP REQUIRED DEPARTMENTS AND DESIGNATIONS
-- This script ensures Manager, IT, and Agent departments exist
-- ============================================================

-- First, check if departments already exist to avoid duplicates
SET @managerDeptId = UUID();
SET @itDeptId = UUID();
SET @agentDeptId = UUID();

-- Insert Manager department if it doesn't exist
INSERT INTO Department (id, name, description, createdAt, updatedAt)
SELECT @managerDeptId, 'Manager', 'Management Department', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Department WHERE name = 'Manager');

-- Insert IT department if it doesn't exist
INSERT INTO Department (id, name, description, createdAt, updatedAt)
SELECT @itDeptId, 'IT', 'Information Technology Department', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Department WHERE name = 'IT');

-- Insert Agent department if it doesn't exist
INSERT INTO Department (id, name, description, createdAt, updatedAt)
SELECT @agentDeptId, 'Agent', 'Agent Department', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Department WHERE name = 'Agent');

-- ============================================================
-- SETUP DESIGNATIONS
-- ============================================================

-- HR Manager designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'HR Manager', 'Human Resources Manager', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'HR Manager');

-- IT Engineer designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'IT Engineer', 'Information Technology Engineer', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'IT Engineer');

-- Software Developer designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'Software Developer', 'Software Development Professional', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'Software Developer');

-- Agent designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'Agent', 'Agent', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'Agent');

-- Sales Executive designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'Sales Executive', 'Sales Executive', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'Sales Executive');

-- Team Leader designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'Team Leader', 'Team Leader', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'Team Leader');

-- Senior Manager designation
INSERT INTO Designation (id, name, description, createdAt, updatedAt)
SELECT UUID(), 'Senior Manager', 'Senior Management Position', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Designation WHERE name = 'Senior Manager');

-- ============================================================
-- VERIFY
-- ============================================================

SELECT '✅ DEPARTMENTS CREATED/VERIFIED:' as '';
SELECT id, name, description FROM Department WHERE name IN ('Manager', 'IT', 'Agent') ORDER BY name;

SELECT '' as '';
SELECT '✅ DESIGNATIONS CREATED/VERIFIED:' as '';
SELECT id, name, description FROM Designation ORDER BY name;
