-- Safe partial application: create AttendanceImportHistory table only
CREATE TABLE IF NOT EXISTS `AttendanceImportHistory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `successfulRows` INTEGER NOT NULL DEFAULT 0,
    `failedRows` INTEGER NOT NULL DEFAULT 0,
    `duplicateRows` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PROCESSING',
    `errorReport` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Indexes (if not exist)
ALTER TABLE `AttendanceImportHistory` ADD INDEX `AttendanceImportHistory_organizationId_idx`(`organizationId`);
ALTER TABLE `AttendanceImportHistory` ADD INDEX `AttendanceImportHistory_uploadedBy_idx`(`uploadedBy`);
ALTER TABLE `AttendanceImportHistory` ADD INDEX `AttendanceImportHistory_uploadedAt_idx`(`uploadedAt`);

-- Foreign keys: ensure they exist
-- Organization and User tables expected to already exist
ALTER TABLE `AttendanceImportHistory` ADD CONSTRAINT `AttendanceImportHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AttendanceImportHistory` ADD CONSTRAINT `AttendanceImportHistory_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
