-- Safe additive fix for the live Department table used by the HRMS Prisma schema.
-- This preserves all existing data and only adds the columns/constraint required by the current schema.

ALTER TABLE `Department`
  ADD COLUMN `code` VARCHAR(191) NULL,
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

CREATE INDEX `Department_createdByUserId_idx`
  ON `Department` (`createdByUserId`);

ALTER TABLE `Department`
  ADD CONSTRAINT `Department_createdByUserId_fkey`
  FOREIGN KEY (`createdByUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
