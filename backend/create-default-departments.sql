-- Check if departments exist
SELECT * FROM Department;

-- If no departments exist, create them:

-- Create Engineering Department
INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (
  UUID(),
  'Engineering',
  'Engineering and Technology Department',
  NOW(),
  NOW()
);

-- Create Sales Department
INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (
  UUID(),
  'Sales',
  'Sales and Business Development',
  NOW(),
  NOW()
);

-- Create HR Department
INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (
  UUID(),
  'Human Resources',
  'Human Resources Management',
  NOW(),
  NOW()
);

-- Create Administration Department
INSERT INTO Department (id, name, description, createdAt, updatedAt)
VALUES (
  UUID(),
  'Administration',
  'Administration and Operations',
  NOW(),
  NOW()
);

-- Verify departments created
SELECT id, name, description FROM Department ORDER BY name;
