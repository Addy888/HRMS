-- Fix OTP Verification Table
-- Run this script to create the missing OtpVerification table

-- Check if table already exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'OtpVerification table already exists'
    ELSE 'OtpVerification table does not exist'
  END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'OtpVerification';

-- Create OtpVerification table if it doesn't exist
CREATE TABLE IF NOT EXISTS `OtpVerification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `otpHash` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `OtpVerification_userId_purpose_verified_idx`(`userId`, `purpose`, `verified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint if it doesn't exist
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'OtpVerification' 
      AND CONSTRAINT_NAME = 'OtpVerification_userId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE `OtpVerification` ADD CONSTRAINT `OtpVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "Foreign key already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify table was created
SELECT 'OtpVerification table created successfully!' as result
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'OtpVerification';
