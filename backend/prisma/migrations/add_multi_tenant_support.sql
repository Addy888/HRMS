-- =====================================================
-- MULTI-TENANT SAAS MIGRATION
-- Each HR user represents a separate organization/company
-- Complete data isolation between organizations
-- =====================================================

-- Step 1: Create Organization table
CREATE TABLE `Organization` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Organization_code_key`(`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Add organizationId to User table (HR users belong to organizations)
ALTER TABLE `User` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `roleId`,
  ADD INDEX `User_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `User_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Step 3: Add organizationId to Employee table (employees belong to organizations)
ALTER TABLE `Employee` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `userId`,
  ADD INDEX `Employee_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Employee_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 4: Add organizationId to Department table
ALTER TABLE `Department` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Department_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Department_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Remove unique constraint on name (departments can have same name across orgs)
ALTER TABLE `Department` DROP INDEX `Department_name_key`;
ALTER TABLE `Department` ADD UNIQUE INDEX `Department_organizationId_name_key`(`organizationId`, `name`);

-- Step 5: Add organizationId to Designation table
ALTER TABLE `Designation` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Designation_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Designation_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Remove unique constraint on name
ALTER TABLE `Designation` DROP INDEX `Designation_name_key`;
ALTER TABLE `Designation` ADD UNIQUE INDEX `Designation_organizationId_name_key`(`organizationId`, `name`);

-- Step 6: Add organizationId to Policy table
ALTER TABLE `Policy` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Policy_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Policy_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Remove unique constraints
ALTER TABLE `Policy` DROP INDEX `Policy_title_key`;
ALTER TABLE `Policy` DROP INDEX `Policy_policyNumber_key`;
ALTER TABLE `Policy` ADD UNIQUE INDEX `Policy_organizationId_title_key`(`organizationId`, `title`);
ALTER TABLE `Policy` ADD UNIQUE INDEX `Policy_organizationId_policyNumber_key`(`organizationId`, `policyNumber`);

-- Step 7: Add organizationId to Complaint table
ALTER TABLE `Complaint` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Complaint_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Complaint_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 8: Add organizationId to Document table
ALTER TABLE `Document` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Document_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Document_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 9: Add organizationId to SalaryStructure table (if exists)
ALTER TABLE `SalaryStructure` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `SalaryStructure_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `SalaryStructure_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 10: Add organizationId to Payslip table (if exists)
ALTER TABLE `Payslip` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Payslip_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Payslip_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 11: Add organizationId to Attendance table (if exists)
ALTER TABLE `Attendance` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Attendance_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Attendance_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Step 12: Add organizationId to Shift table (if exists)
ALTER TABLE `Shift` 
  ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`,
  ADD INDEX `Shift_organizationId_idx`(`organizationId`),
  ADD CONSTRAINT `Shift_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) 
    REFERENCES `Organization`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Remove unique constraint on shift name/code
ALTER TABLE `Shift` DROP INDEX `Shift_name_key`;
ALTER TABLE `Shift` DROP INDEX `Shift_code_key`;
ALTER TABLE `Shift` ADD UNIQUE INDEX `Shift_organizationId_name_key`(`organizationId`, `name`);
ALTER TABLE `Shift` ADD UNIQUE INDEX `Shift_organizationId_code_key`(`organizationId`, `code`);

-- =====================================================
-- DATA MIGRATION: Assign existing data to default organization
-- =====================================================

-- Create default organization for existing data
INSERT INTO `Organization` (`id`, `name`, `code`, `email`, `isActive`, `createdAt`, `updatedAt`)
VALUES (
  UUID(),
  'Default Organization',
  'DEFAULT-ORG',
  'admin@defaultorg.com',
  1,
  NOW(),
  NOW()
);

-- Get the default organization ID
SET @defaultOrgId = (SELECT id FROM `Organization` WHERE code = 'DEFAULT-ORG' LIMIT 1);

-- Assign all existing HR users to default organization
UPDATE `User` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing employees to default organization
UPDATE `Employee` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing departments to default organization
UPDATE `Department` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing designations to default organization
UPDATE `Designation` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing policies to default organization
UPDATE `Policy` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing complaints to default organization
UPDATE `Complaint` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing documents to default organization
UPDATE `Document` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing salary structures to default organization
UPDATE `SalaryStructure` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing payslips to default organization
UPDATE `Payslip` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing attendance to default organization
UPDATE `Attendance` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- Assign all existing shifts to default organization
UPDATE `Shift` SET `organizationId` = @defaultOrgId WHERE `organizationId` IS NULL;

-- =====================================================
-- Make organizationId NOT NULL after migration
-- =====================================================

-- Now make organizationId required for new records
ALTER TABLE `User` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Employee` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Department` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Designation` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Policy` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Complaint` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Document` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `SalaryStructure` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Payslip` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Attendance` MODIFY `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `Shift` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All existing data is assigned to "Default Organization"
-- 2. New HR users will create their own organization on signup
-- 3. Each organization is completely isolated
-- 4. Super Admin can see all organizations
-- 5. HR_ADMIN and HR_USER only see their organization's data
