-- CreateTable
CREATE TABLE `HRAction` (
    `id` VARCHAR(191) NOT NULL,
    `actionNumber` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `issuedById` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `incidentDate` DATETIME(3) NOT NULL,
    `correctiveAction` TEXT NULL,
    `additionalRemarks` TEXT NULL,
    `responseRequired` BOOLEAN NOT NULL DEFAULT false,
    `responseDeadline` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `documentUrl` VARCHAR(191) NULL,
    `issuedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `viewedAt` DATETIME(3) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `acknowledgedById` VARCHAR(191) NULL,
    `responseSubmittedAt` DATETIME(3) NULL,
    `responseText` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` VARCHAR(191) NULL,
    `resolvedRemarks` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledById` VARCHAR(191) NULL,
    `cancelledReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HRAction_actionNumber_key`(`actionNumber`),
    INDEX `HRAction_organizationId_idx`(`organizationId`),
    INDEX `HRAction_employeeId_idx`(`employeeId`),
    INDEX `HRAction_issuedById_idx`(`issuedById`),
    INDEX `HRAction_status_idx`(`status`),
    INDEX `HRAction_actionType_idx`(`actionType`),
    INDEX `HRAction_severity_idx`(`severity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HRActionAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `hrActionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HRActionAuditLog_hrActionId_idx`(`hrActionId`),
    INDEX `HRActionAuditLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_issuedById_fkey` FOREIGN KEY (`issuedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_acknowledgedById_fkey` FOREIGN KEY (`acknowledgedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRAction` ADD CONSTRAINT `HRAction_cancelledById_fkey` FOREIGN KEY (`cancelledById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRActionAuditLog` ADD CONSTRAINT `HRActionAuditLog_hrActionId_fkey` FOREIGN KEY (`hrActionId`) REFERENCES `HRAction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRActionAuditLog` ADD CONSTRAINT `HRActionAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
