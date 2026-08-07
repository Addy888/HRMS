-- Add Accept/Reject workflow fields to Complaint table
ALTER TABLE `Complaint` 
ADD COLUMN `acceptedById` VARCHAR(191) NULL AFTER `assignedToId`,
ADD COLUMN `acceptedAt` DATETIME(3) NULL AFTER `acceptedById`,
ADD COLUMN `rejectedById` VARCHAR(191) NULL AFTER `acceptedAt`,
ADD COLUMN `rejectedAt` DATETIME(3) NULL AFTER `rejectedById`,
ADD COLUMN `rejectReason` TEXT NULL AFTER `rejectedAt`;

-- Add foreign key constraints
ALTER TABLE `Complaint`
ADD CONSTRAINT `Complaint_acceptedById_fkey` FOREIGN KEY (`acceptedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `Complaint_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
