/*
  Warnings:

  - You are about to drop the column `attendancePercentage` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `averageWorkingHours` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalAbsent` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalHalfDay` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalHolidays` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalLate` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalLeaves` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalOnDuty` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalOvertime` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalPresent` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalWFH` on the `attendancesummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeekOffs` on the `attendancesummary` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,date]` on the table `Holiday` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `AttendanceSummary_month_year_idx` ON `attendancesummary`;

-- AlterTable
ALTER TABLE `attendancesummary` DROP COLUMN `attendancePercentage`,
    DROP COLUMN `averageWorkingHours`,
    DROP COLUMN `totalAbsent`,
    DROP COLUMN `totalHalfDay`,
    DROP COLUMN `totalHolidays`,
    DROP COLUMN `totalLate`,
    DROP COLUMN `totalLeaves`,
    DROP COLUMN `totalOnDuty`,
    DROP COLUMN `totalOvertime`,
    DROP COLUMN `totalPresent`,
    DROP COLUMN `totalWFH`,
    DROP COLUMN `totalWeekOffs`,
    ADD COLUMN `absentDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `halfDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `holidayDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lateDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `leaveDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `overtimeHours` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `presentDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `weekOffDays` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `role` ADD COLUMN `displayName` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `level` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SalaryStructure` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `hra` DOUBLE NOT NULL DEFAULT 0,
    `conveyance` DOUBLE NOT NULL DEFAULT 0,
    `medicalAllowance` DOUBLE NOT NULL DEFAULT 0,
    `specialAllowance` DOUBLE NOT NULL DEFAULT 0,
    `otherAllowances` DOUBLE NOT NULL DEFAULT 0,
    `pf` DOUBLE NOT NULL DEFAULT 0,
    `esi` DOUBLE NOT NULL DEFAULT 0,
    `professionalTax` DOUBLE NOT NULL DEFAULT 0,
    `tds` DOUBLE NOT NULL DEFAULT 0,
    `otherDeductions` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `ctc` DOUBLE NOT NULL DEFAULT 0,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveTo` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SalaryStructure_employeeId_idx`(`employeeId`),
    INDEX `SalaryStructure_effectiveFrom_idx`(`effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollRun` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `paymentDate` DATE NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `deductions` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `processedBy` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollRun_employeeId_idx`(`employeeId`),
    INDEX `PayrollRun_year_month_idx`(`year`, `month`),
    INDEX `PayrollRun_status_idx`(`status`),
    UNIQUE INDEX `PayrollRun_employeeId_month_year_key`(`employeeId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payslip` (
    `id` VARCHAR(191) NOT NULL,
    `payrollRunId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `payslipNumber` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `sentToEmployee` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `downloadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payslip_payrollRunId_key`(`payrollRunId`),
    UNIQUE INDEX `Payslip_payslipNumber_key`(`payslipNumber`),
    INDEX `Payslip_employeeId_idx`(`employeeId`),
    INDEX `Payslip_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `loanType` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `interestRate` DOUBLE NOT NULL DEFAULT 0,
    `tenure` INTEGER NOT NULL,
    `emiAmount` DOUBLE NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Loan_employeeId_idx`(`employeeId`),
    INDEX `Loan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvanceSalary` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `reason` TEXT NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `disbursedAt` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdvanceSalary_employeeId_idx`(`employeeId`),
    INDEX `AdvanceSalary_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceCycle` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `quarter` INTEGER NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `selfAppraisalStartDate` DATE NULL,
    `selfAppraisalEndDate` DATE NULL,
    `managerReviewStartDate` DATE NULL,
    `managerReviewEndDate` DATE NULL,
    `hrReviewStartDate` DATE NULL,
    `hrReviewEndDate` DATE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `description` TEXT NULL,
    `settings` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PerformanceCycle_name_key`(`name`),
    INDEX `PerformanceCycle_year_quarter_idx`(`year`, `quarter`),
    INDEX `PerformanceCycle_status_idx`(`status`),
    INDEX `PerformanceCycle_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `measurementType` VARCHAR(191) NOT NULL,
    `targetValue` VARCHAR(191) NULL,
    `actualValue` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `weightage` DOUBLE NOT NULL DEFAULT 0,
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `completionPercentage` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `ownerId` VARCHAR(191) NULL,
    `assignedBy` VARCHAR(191) NULL,
    `startDate` DATE NULL,
    `dueDate` DATE NULL,
    `completedDate` DATE NULL,
    `milestones` TEXT NULL,
    `dependencies` TEXT NULL,
    `attachments` TEXT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Goal_cycleId_idx`(`cycleId`),
    INDEX `Goal_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `Goal_ownerId_idx`(`ownerId`),
    INDEX `Goal_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoalUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NOT NULL,
    `updateType` VARCHAR(191) NOT NULL,
    `progress` DOUBLE NULL,
    `status` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `updatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GoalUpdate_goalId_idx`(`goalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KPI` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `assignedTo` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NULL,
    `measurementType` VARCHAR(191) NOT NULL,
    `targetValue` DOUBLE NOT NULL,
    `actualValue` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NULL,
    `weightage` DOUBLE NOT NULL DEFAULT 0,
    `completionPercentage` DOUBLE NOT NULL DEFAULT 0,
    `frequency` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `excellentThreshold` DOUBLE NULL,
    `goodThreshold` DOUBLE NULL,
    `satisfactoryThreshold` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KPI_cycleId_idx`(`cycleId`),
    INDEX `KPI_assignedTo_idx`(`assignedTo`),
    INDEX `KPI_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KPIReading` (
    `id` VARCHAR(191) NOT NULL,
    `kpiId` VARCHAR(191) NOT NULL,
    `readingDate` DATE NOT NULL,
    `value` DOUBLE NOT NULL,
    `remarks` TEXT NULL,
    `recordedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KPIReading_kpiId_idx`(`kpiId`),
    INDEX `KPIReading_readingDate_idx`(`readingDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KRA` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `assignedTo` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NULL,
    `weightage` DOUBLE NOT NULL DEFAULT 0,
    `targetMetric` VARCHAR(191) NULL,
    `managerRating` INTEGER NULL,
    `managerComments` TEXT NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KRA_cycleId_idx`(`cycleId`),
    INDEX `KRA_assignedTo_idx`(`assignedTo`),
    INDEX `KRA_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceReview` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `finalRating` INTEGER NULL,
    `normalizedScore` DOUBLE NULL,
    `selfAppraisalSubmittedAt` DATETIME(3) NULL,
    `managerReviewSubmittedAt` DATETIME(3) NULL,
    `hrReviewCompletedAt` DATETIME(3) NULL,
    `finalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PerformanceReview_cycleId_idx`(`cycleId`),
    INDEX `PerformanceReview_employeeId_idx`(`employeeId`),
    INDEX `PerformanceReview_status_idx`(`status`),
    UNIQUE INDEX `PerformanceReview_cycleId_employeeId_key`(`cycleId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelfAppraisal` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `achievements` TEXT NOT NULL,
    `challenges` TEXT NULL,
    `learnings` TEXT NULL,
    `futureGoals` TEXT NULL,
    `trainingRequired` TEXT NULL,
    `careerAspirations` TEXT NULL,
    `selfRating` INTEGER NULL,
    `selfComments` TEXT NULL,
    `goalAssessment` TEXT NULL,
    `kpiAssessment` TEXT NULL,
    `kraAssessment` TEXT NULL,
    `supportingDocuments` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SelfAppraisal_reviewId_key`(`reviewId`),
    INDEX `SelfAppraisal_reviewId_idx`(`reviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManagerReview` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NOT NULL,
    `overallComments` TEXT NOT NULL,
    `strengths` TEXT NULL,
    `areasOfImprovement` TEXT NULL,
    `managerRating` INTEGER NOT NULL,
    `goalAssessment` TEXT NULL,
    `kpiAssessment` TEXT NULL,
    `kraAssessment` TEXT NULL,
    `technicalSkills` INTEGER NULL,
    `communication` INTEGER NULL,
    `teamwork` INTEGER NULL,
    `leadership` INTEGER NULL,
    `problemSolving` INTEGER NULL,
    `initiative` INTEGER NULL,
    `adaptability` INTEGER NULL,
    `timeManagement` INTEGER NULL,
    `recommendPromotion` BOOLEAN NOT NULL DEFAULT false,
    `promotionReason` TEXT NULL,
    `recommendIncrement` BOOLEAN NOT NULL DEFAULT false,
    `incrementPercentage` DOUBLE NULL,
    `incrementReason` TEXT NULL,
    `recommendTraining` BOOLEAN NOT NULL DEFAULT false,
    `trainingAreas` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ManagerReview_reviewId_key`(`reviewId`),
    INDEX `ManagerReview_reviewId_idx`(`reviewId`),
    INDEX `ManagerReview_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HRReview` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `hrId` VARCHAR(191) NOT NULL,
    `hrComments` TEXT NULL,
    `calibrationNotes` TEXT NULL,
    `finalRating` INTEGER NOT NULL,
    `ratingJustification` TEXT NULL,
    `currentSalary` DOUBLE NULL,
    `recommendedSalary` DOUBLE NULL,
    `incrementPercentage` DOUBLE NULL,
    `incrementEffectiveDate` DATE NULL,
    `salaryRemarks` TEXT NULL,
    `currentDesignation` VARCHAR(191) NULL,
    `recommendedDesignation` VARCHAR(191) NULL,
    `promotionEffectiveDate` DATE NULL,
    `promotionRemarks` TEXT NULL,
    `performanceLetterUrl` VARCHAR(191) NULL,
    `letterSentAt` DATETIME(3) NULL,
    `actionItems` TEXT NULL,
    `followUpRequired` BOOLEAN NOT NULL DEFAULT false,
    `followUpDate` DATE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HRReview_reviewId_key`(`reviewId`),
    INDEX `HRReview_reviewId_idx`(`reviewId`),
    INDEX `HRReview_hrId_idx`(`hrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceRating` (
    `id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `minScore` DOUBLE NOT NULL,
    `maxScore` DOUBLE NOT NULL,
    `color` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PerformanceRating_rating_key`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback360` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `feedbackType` VARCHAR(191) NOT NULL,
    `feedbackFrom` VARCHAR(191) NOT NULL,
    `feedbackFromName` VARCHAR(191) NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `strengths` TEXT NULL,
    `weaknesses` TEXT NULL,
    `suggestions` TEXT NULL,
    `overallComments` TEXT NULL,
    `technicalSkills` INTEGER NULL,
    `communication` INTEGER NULL,
    `teamwork` INTEGER NULL,
    `leadership` INTEGER NULL,
    `problemSolving` INTEGER NULL,
    `initiative` INTEGER NULL,
    `overallRating` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Feedback360_reviewId_idx`(`reviewId`),
    INDEX `Feedback360_feedbackType_idx`(`feedbackType`),
    INDEX `Feedback360_feedbackFrom_idx`(`feedbackFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `currentDesignation` VARCHAR(191) NOT NULL,
    `recommendedDesignation` VARCHAR(191) NOT NULL,
    `justification` TEXT NOT NULL,
    `recommendedBy` VARCHAR(191) NOT NULL,
    `recommendedByRole` VARCHAR(191) NOT NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `effectiveDate` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PromotionRecommendation_reviewId_key`(`reviewId`),
    INDEX `PromotionRecommendation_reviewId_idx`(`reviewId`),
    INDEX `PromotionRecommendation_employeeId_idx`(`employeeId`),
    INDEX `PromotionRecommendation_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `trainingArea` VARCHAR(191) NOT NULL,
    `trainingTitle` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `recommendedBy` VARCHAR(191) NOT NULL,
    `recommendedByRole` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `scheduledDate` DATE NULL,
    `completedDate` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TrainingRecommendation_reviewId_idx`(`reviewId`),
    INDEX `TrainingRecommendation_employeeId_idx`(`employeeId`),
    INDEX `TrainingRecommendation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `performedByRole` VARCHAR(191) NOT NULL,
    `changes` TEXT NULL,
    `remarks` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PerformanceAuditLog_reviewId_idx`(`reviewId`),
    INDEX `PerformanceAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `PerformanceAuditLog_action_idx`(`action`),
    INDEX `PerformanceAuditLog_performedBy_idx`(`performedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SkillGapAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NULL,
    `currentSkills` TEXT NOT NULL,
    `requiredSkills` TEXT NOT NULL,
    `skillGaps` TEXT NOT NULL,
    `analysisMethod` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `confidence` DOUBLE NULL,
    `recommendations` TEXT NULL,
    `analyzedBy` VARCHAR(191) NULL,
    `analyzedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SkillGapAnalysis_employeeId_idx`(`employeeId`),
    INDEX `SkillGapAnalysis_cycleId_idx`(`cycleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttritionPrediction` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `riskScore` DOUBLE NOT NULL,
    `riskLevel` VARCHAR(191) NOT NULL,
    `factors` TEXT NOT NULL,
    `indicators` TEXT NULL,
    `recommendations` TEXT NULL,
    `predictionMethod` VARCHAR(191) NOT NULL DEFAULT 'RULE_BASED',
    `modelVersion` VARCHAR(191) NULL,
    `confidence` DOUBLE NULL,
    `predictedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttritionPrediction_employeeId_idx`(`employeeId`),
    INDEX `AttritionPrediction_riskLevel_idx`(`riskLevel`),
    INDEX `AttritionPrediction_predictedAt_idx`(`predictedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalaryTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `hra` DOUBLE NOT NULL DEFAULT 0,
    `da` DOUBLE NOT NULL DEFAULT 0,
    `specialAllowance` DOUBLE NOT NULL DEFAULT 0,
    `medicalAllowance` DOUBLE NOT NULL DEFAULT 0,
    `travelAllowance` DOUBLE NOT NULL DEFAULT 0,
    `foodAllowance` DOUBLE NOT NULL DEFAULT 0,
    `performanceBonus` DOUBLE NOT NULL DEFAULT 0,
    `incentive` DOUBLE NOT NULL DEFAULT 0,
    `employerPF` DOUBLE NOT NULL DEFAULT 0,
    `employerESI` DOUBLE NOT NULL DEFAULT 0,
    `employeePF` DOUBLE NOT NULL DEFAULT 0,
    `employeeESI` DOUBLE NOT NULL DEFAULT 0,
    `professionalTax` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `totalDeductions` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `ctc` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SalaryTemplate_name_key`(`name`),
    UNIQUE INDEX `SalaryTemplate_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `dataType` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isEncrypted` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SystemSetting_category_idx`(`category`),
    INDEX `SystemSetting_key_idx`(`key`),
    UNIQUE INDEX `SystemSetting_category_key_key`(`category`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `panNumber` VARCHAR(191) NULL,
    `cinNumber` VARCHAR(191) NULL,
    `tanNumber` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `supportEmail` VARCHAR(191) NULL,
    `supportPhone` VARCHAR(191) NULL,
    `hrEmail` VARCHAR(191) NULL,
    `financeEmail` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `currencySymbol` VARCHAR(191) NOT NULL DEFAULT '₹',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `timeFormat` VARCHAR(191) NOT NULL DEFAULT '12',
    `workWeekStart` VARCHAR(191) NOT NULL DEFAULT 'MONDAY',
    `fiscalYearStart` INTEGER NOT NULL DEFAULT 4,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `branchType` VARCHAR(191) NOT NULL DEFAULT 'OFFICE',
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `managerName` VARCHAR(191) NULL,
    `managerEmail` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `geoFenceRadius` INTEGER NULL,
    `timeZone` VARCHAR(191) NULL,
    `workingHours` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isHeadquarters` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Branch_code_key`(`code`),
    INDEX `Branch_companyId_idx`(`companyId`),
    INDEX `Branch_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `isSystemPermission` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    INDEX `Permission_module_idx`(`module`),
    INDEX `Permission_resource_idx`(`resource`),
    INDEX `Permission_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `variables` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailTemplate_name_key`(`name`),
    INDEX `EmailTemplate_category_idx`(`category`),
    INDEX `EmailTemplate_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SMSTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `variables` TEXT NULL,
    `dltTemplateId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SMSTemplate_name_key`(`name`),
    INDEX `SMSTemplate_category_idx`(`category`),
    INDEX `SMSTemplate_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `headerType` VARCHAR(191) NULL,
    `headerContent` TEXT NULL,
    `footerText` VARCHAR(191) NULL,
    `buttons` TEXT NULL,
    `variables` TEXT NULL,
    `metaTemplateId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppTemplate_name_key`(`name`),
    INDEX `WhatsAppTemplate_category_idx`(`category`),
    INDEX `WhatsAppTemplate_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailQueue` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `cc` VARCHAR(191) NULL,
    `bcc` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateData` TEXT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `error` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `attachments` TEXT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailQueue_status_idx`(`status`),
    INDEX `EmailQueue_priority_idx`(`priority`),
    INDEX `EmailQueue_scheduledFor_idx`(`scheduledFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SMSQueue` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateData` TEXT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `error` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `providerMessageId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `deliveryStatus` VARCHAR(191) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SMSQueue_status_idx`(`status`),
    INDEX `SMSQueue_to_idx`(`to`),
    INDEX `SMSQueue_scheduledFor_idx`(`scheduledFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppQueue` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateData` TEXT NULL,
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `mediaUrl` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `error` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `providerMessageId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `deliveryStatus` VARCHAR(191) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsAppQueue_status_idx`(`status`),
    INDEX `WhatsAppQueue_to_idx`(`to`),
    INDEX `WhatsAppQueue_scheduledFor_idx`(`scheduledFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationConfig` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerType` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `configuration` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `testMode` BOOLEAN NOT NULL DEFAULT true,
    `lastTestedAt` DATETIME(3) NULL,
    `testStatus` VARCHAR(191) NULL,
    `testError` TEXT NULL,
    `metadata` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationConfig_provider_key`(`provider`),
    INDEX `IntegrationConfig_providerType_idx`(`providerType`),
    INDEX `IntegrationConfig_provider_idx`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecuritySetting` (
    `id` VARCHAR(191) NOT NULL,
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireUppercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireLowercase` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireNumbers` BOOLEAN NOT NULL DEFAULT true,
    `passwordRequireSpecialChars` BOOLEAN NOT NULL DEFAULT false,
    `passwordExpiryDays` INTEGER NULL,
    `passwordHistoryCount` INTEGER NOT NULL DEFAULT 3,
    `maxLoginAttempts` INTEGER NOT NULL DEFAULT 5,
    `lockoutDuration` INTEGER NOT NULL DEFAULT 30,
    `sessionTimeout` INTEGER NOT NULL DEFAULT 30,
    `maxActiveSessions` INTEGER NOT NULL DEFAULT 3,
    `autoLogout` BOOLEAN NOT NULL DEFAULT true,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorMethod` VARCHAR(191) NULL,
    `jwtAccessTokenExpiry` INTEGER NOT NULL DEFAULT 15,
    `jwtRefreshTokenExpiry` INTEGER NOT NULL DEFAULT 7,
    `ipWhitelist` TEXT NULL,
    `ipBlacklist` TEXT NULL,
    `apiRateLimitPerMinute` INTEGER NOT NULL DEFAULT 60,
    `apiRateLimitPerHour` INTEGER NOT NULL DEFAULT 1000,
    `corsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `corsOrigins` TEXT NOT NULL,
    `dataEncryptionEnabled` BOOLEAN NOT NULL DEFAULT true,
    `encryptionAlgorithm` VARCHAR(191) NOT NULL DEFAULT 'AES-256-GCM',
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationLog` (
    `id` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `stackTrace` TEXT NULL,
    `userId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NULL,
    `module` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationLog_level_idx`(`level`),
    INDEX `ApplicationLog_category_idx`(`category`),
    INDEX `ApplicationLog_userId_idx`(`userId`),
    INDEX `ApplicationLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `APILog` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `method` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `requestHeaders` TEXT NULL,
    `requestBody` TEXT NULL,
    `requestQuery` TEXT NULL,
    `responseStatus` INTEGER NOT NULL,
    `responseBody` TEXT NULL,
    `duration` INTEGER NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `APILog_requestId_key`(`requestId`),
    INDEX `APILog_userId_idx`(`userId`),
    INDEX `APILog_endpoint_idx`(`endpoint`),
    INDEX `APILog_responseStatus_idx`(`responseStatus`),
    INDEX `APILog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BackupHistory` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `backupName` VARCHAR(191) NOT NULL,
    `size` DOUBLE NULL,
    `filePath` VARCHAR(191) NULL,
    `storageProvider` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `error` TEXT NULL,
    `tablesIncluded` TEXT NULL,
    `recordCount` INTEGER NULL,
    `canRestore` BOOLEAN NOT NULL DEFAULT true,
    `restoredCount` INTEGER NOT NULL DEFAULT 0,
    `lastRestoredAt` DATETIME(3) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `checksum` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `autoDeleteAfterExpiry` BOOLEAN NOT NULL DEFAULT false,
    `triggeredBy` VARCHAR(191) NULL,
    `isAutomatic` BOOLEAN NOT NULL DEFAULT false,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BackupHistory_backupName_key`(`backupName`),
    INDEX `BackupHistory_type_idx`(`type`),
    INDEX `BackupHistory_status_idx`(`status`),
    INDEX `BackupHistory_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemMetric` (
    `id` VARCHAR(191) NOT NULL,
    `metricType` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `threshold` DOUBLE NULL,
    `isAlert` BOOLEAN NOT NULL DEFAULT false,
    `metadata` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemMetric_metricType_idx`(`metricType`),
    INDEX `SystemMetric_recordedAt_idx`(`recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureFlag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `rolloutPercentage` INTEGER NOT NULL DEFAULT 100,
    `targetRoles` TEXT NULL,
    `targetUsers` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `metadata` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeatureFlag_name_key`(`name`),
    INDEX `FeatureFlag_name_idx`(`name`),
    INDEX `FeatureFlag_isEnabled_idx`(`isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `policyName` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `uploadedBy` VARCHAR(191) NOT NULL,
    `uploadedByName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyPolicy_status_idx`(`status`),
    INDEX `CompanyPolicy_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AttendanceSummary_year_month_idx` ON `AttendanceSummary`(`year`, `month`);

-- CreateIndex
CREATE UNIQUE INDEX `Holiday_name_date_key` ON `Holiday`(`name`, `date`);

-- AddForeignKey
ALTER TABLE `SalaryStructure` ADD CONSTRAINT `SalaryStructure_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollRun` ADD CONSTRAINT `PayrollRun_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_payrollRunId_fkey` FOREIGN KEY (`payrollRunId`) REFERENCES `PayrollRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceSalary` ADD CONSTRAINT `AdvanceSalary_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `PerformanceCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoalUpdate` ADD CONSTRAINT `GoalUpdate_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `Goal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KPI` ADD CONSTRAINT `KPI_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `PerformanceCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KPIReading` ADD CONSTRAINT `KPIReading_kpiId_fkey` FOREIGN KEY (`kpiId`) REFERENCES `KPI`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KRA` ADD CONSTRAINT `KRA_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `PerformanceCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceReview` ADD CONSTRAINT `PerformanceReview_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `PerformanceCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelfAppraisal` ADD CONSTRAINT `SelfAppraisal_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManagerReview` ADD CONSTRAINT `ManagerReview_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRReview` ADD CONSTRAINT `HRReview_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback360` ADD CONSTRAINT `Feedback360_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRecommendation` ADD CONSTRAINT `PromotionRecommendation_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingRecommendation` ADD CONSTRAINT `TrainingRecommendation_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceAuditLog` ADD CONSTRAINT `PerformanceAuditLog_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `PerformanceReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
