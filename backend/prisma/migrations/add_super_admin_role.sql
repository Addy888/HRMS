-- Add SUPER_ADMIN role if it doesn't exist
INSERT INTO Role (id, name, displayName, description, level, isSystem, isActive, createdAt, updatedAt)
SELECT 
  UUID(),
  'SUPER_ADMIN',
  'Super Admin',
  'Company Owner with full system access',
  100,
  TRUE,
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM Role WHERE name = 'SUPER_ADMIN');

-- Note: To create a Super Admin user, run this after the above:
-- 1. Find your organization ID: SELECT id, name FROM Organization;
-- 2. Get the SUPER_ADMIN role ID: SELECT id FROM Role WHERE name = 'SUPER_ADMIN';
-- 3. Create Super Admin user (replace placeholders):
-- 
-- INSERT INTO User (id, email, password, roleId, organizationId, isFirstLogin, isActive, createdAt, updatedAt)
-- VALUES (
--   UUID(),
--   'superadmin@fcs.com',
--   '$2b$10$rBV2JDeWW2eKgkFx0w7JOutUO9p7aV08HXH6mMSyTwszS4Y2MXOiy', -- hashed: 'superadmin123'
--   '<SUPER_ADMIN_ROLE_ID>',
--   '<YOUR_ORGANIZATION_ID>',
--   TRUE,
--   TRUE,
--   NOW(),
--   NOW()
-- );
--
-- 4. Create employee profile for super admin:
--
-- INSERT INTO Employee (id, employeeId, userId, organizationId, firstName, lastName, joiningDate, onboardingStatus, createdAt, updatedAt)
-- VALUES (
--   UUID(),
--   'SUPER-ADMIN-001',
--   '<USER_ID_FROM_STEP_3>',
--   '<YOUR_ORGANIZATION_ID>',
--   'Super',
--   'Admin',
--   NOW(),
--   'COMPLETED',
--   NOW(),
--   NOW()
-- );
