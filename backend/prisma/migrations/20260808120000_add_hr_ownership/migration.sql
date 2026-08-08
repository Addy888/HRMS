-- Add HR ownership to Employee table
-- This enables HR-level data isolation within the same organization

ALTER TABLE `Employee` ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

-- Create index for performance
CREATE INDEX `Employee_createdByUserId_idx` ON `Employee`(`createdByUserId`);

-- Add foreign key constraint
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_createdByUserId_fkey` 
  FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- For existing records, set createdByUserId to the first HR user in their organization
-- This is a safe default for development/test data
UPDATE `Employee` e
LEFT JOIN `User` u ON u.organizationId = e.organizationId
LEFT JOIN `Role` r ON r.id = u.roleId
SET e.createdByUserId = (
  SELECT u2.id 
  FROM `User` u2
  INNER JOIN `Role` r2 ON r2.id = u2.roleId
  WHERE u2.organizationId = e.organizationId
    AND r2.name IN ('HR', 'HR_ADMIN', 'HR_USER')
  ORDER BY u2.createdAt ASC
  LIMIT 1
)
WHERE e.createdByUserId IS NULL;
