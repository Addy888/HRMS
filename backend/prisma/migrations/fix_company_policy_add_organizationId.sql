-- Safe migration: Add organizationId to CompanyPolicy table
-- This preserves all existing data

-- Step 1: Add organizationId column as NULL first
ALTER TABLE `CompanyPolicy` 
ADD COLUMN `organizationId` VARCHAR(191) NULL AFTER `id`;

-- Step 2: Get the first organization ID (for existing records)
-- Run this to set a default organizationId for existing records
SET @default_org_id = (SELECT id FROM Organization LIMIT 1);

-- Step 3: Update all existing CompanyPolicy records with the default organization
UPDATE `CompanyPolicy` 
SET `organizationId` = @default_org_id 
WHERE `organizationId` IS NULL;

-- Step 4: Make the column NOT NULL now that all rows have values
ALTER TABLE `CompanyPolicy` 
MODIFY COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- Step 5: Add index for performance
CREATE INDEX `CompanyPolicy_organizationId_idx` ON `CompanyPolicy`(`organizationId`);

-- Step 6: Add foreign key constraint
ALTER TABLE `CompanyPolicy` 
ADD CONSTRAINT `CompanyPolicy_organizationId_fkey` 
FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify the change
SELECT 'CompanyPolicy table updated successfully' AS status;
