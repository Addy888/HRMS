-- AlterTable: Add process/department metadata for tracking creation and status
ALTER TABLE `Department` 
  ADD COLUMN `code` VARCHAR(191) NULL,
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

-- CreateIndex: Add index for createdByUserId for HR ownership queries
CREATE INDEX `Department_createdByUserId_idx` ON `Department`(`createdByUserId`);

-- AddForeignKey: Link department to creator user
ALTER TABLE `Department` ADD CONSTRAINT `Department_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
