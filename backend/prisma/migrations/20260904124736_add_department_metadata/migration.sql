/*
  Warnings:

  - You are about to drop the column `changeReason` on the `attendancehistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `attendancehistory` DROP COLUMN `changeReason`,
    ADD COLUMN `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `reason` TEXT NULL,
    MODIFY `oldValue` TEXT NULL,
    MODIFY `newValue` TEXT NULL,
    MODIFY `changedBy` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AttendanceHistory_changedBy_idx` ON `AttendanceHistory`(`changedBy`);

-- AddForeignKey
ALTER TABLE `AttendanceHistory` ADD CONSTRAINT `AttendanceHistory_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
