-- AlterTable
ALTER TABLE `attendanceimporthistory` ADD COLUMN `columnMapping` TEXT NULL,
    ADD COLUMN `fileStoragePath` VARCHAR(191) NULL,
    ADD COLUMN `originalColumns` TEXT NULL;

-- CreateTable
CREATE TABLE `RawAttendanceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `importHistoryId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `originalIdentifier` VARCHAR(191) NULL,
    `originalName` VARCHAR(191) NULL,
    `rawData` TEXT NOT NULL,
    `attendanceDate` DATE NULL,
    `attendanceMonth` INTEGER NULL,
    `attendanceYear` INTEGER NULL,
    `isMatched` BOOLEAN NOT NULL DEFAULT false,
    `matchedAt` DATETIME(3) NULL,
    `matchingNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RawAttendanceRecord_organizationId_idx`(`organizationId`),
    INDEX `RawAttendanceRecord_importHistoryId_idx`(`importHistoryId`),
    INDEX `RawAttendanceRecord_employeeId_idx`(`employeeId`),
    INDEX `RawAttendanceRecord_originalIdentifier_idx`(`originalIdentifier`),
    INDEX `RawAttendanceRecord_attendanceMonth_attendanceYear_idx`(`attendanceMonth`, `attendanceYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RawAttendanceRecord` ADD CONSTRAINT `RawAttendanceRecord_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RawAttendanceRecord` ADD CONSTRAINT `RawAttendanceRecord_importHistoryId_fkey` FOREIGN KEY (`importHistoryId`) REFERENCES `AttendanceImportHistory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RawAttendanceRecord` ADD CONSTRAINT `RawAttendanceRecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
