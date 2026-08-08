/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,employeeId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,complaintNumber]` on the table `Complaint` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `Designation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,employeeId,month,year]` on the table `PayrollRun` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,payslipNumber]` on the table `Payslip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,title]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,policyNumber]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `AdvanceSalary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Designation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PayrollRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Payslip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SalaryStructure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Attendance_employeeId_date_key` ON `attendance`;

-- DropIndex
DROP INDEX `Complaint_complaintNumber_key` ON `complaint`;

-- DropIndex
DROP INDEX `Department_name_key` ON `department`;

-- DropIndex
DROP INDEX `Designation_name_key` ON `designation`;

-- DropIndex
DROP INDEX `PayrollRun_employeeId_month_year_key` ON `payrollrun`;

-- DropIndex
DROP INDEX `Payslip_payslipNumber_key` ON `payslip`;

-- DropIndex
DROP INDEX `Policy_policyNumber_key` ON `policy`;

-- DropIndex
DROP INDEX `Policy_title_key` ON `policy`;

-- DropIndex
DROP INDEX `Shift_code_key` ON `shift`;

-- DropIndex
DROP INDEX `Shift_name_key` ON `shift`;

-- AlterTable
ALTER TABLE `advancesalary` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `complaint` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `acceptedById` VARCHAR(191) NULL,
    ADD COLUMN `organizationId` VARCHAR(191) NOT NULL,
    ADD COLUMN `rejectReason` TEXT NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `department` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `designation` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `documentverification` ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectionReason` TEXT NULL,
    MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `employee` ADD COLUMN `monthlySalary` DOUBLE NULL,
    ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `loan` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `payrollrun` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `payslip` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `policy` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `salarystructure` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `shift` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyPolicyAcceptance` (
    `id` VARCHAR(191) NOT NULL,
    `companyPolicyId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `acceptedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyPolicyAcceptance_employeeId_idx`(`employeeId`),
    INDEX `CompanyPolicyAcceptance_status_idx`(`status`),
    UNIQUE INDEX `CompanyPolicyAcceptance_companyPolicyId_employeeId_key`(`companyPolicyId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AdvanceSalary_organizationId_idx` ON `AdvanceSalary`(`organizationId`);

-- CreateIndex
CREATE INDEX `Attendance_organizationId_idx` ON `Attendance`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Attendance_organizationId_employeeId_date_key` ON `Attendance`(`organizationId`, `employeeId`, `date`);

-- CreateIndex
CREATE INDEX `Complaint_organizationId_idx` ON `Complaint`(`organizationId`);

-- CreateIndex
CREATE INDEX `Complaint_status_idx` ON `Complaint`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `Complaint_organizationId_complaintNumber_key` ON `Complaint`(`organizationId`, `complaintNumber`);

-- CreateIndex
CREATE INDEX `Department_organizationId_idx` ON `Department`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Department_organizationId_name_key` ON `Department`(`organizationId`, `name`);

-- CreateIndex
CREATE INDEX `Designation_organizationId_idx` ON `Designation`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Designation_organizationId_name_key` ON `Designation`(`organizationId`, `name`);

-- CreateIndex
CREATE INDEX `Document_organizationId_idx` ON `Document`(`organizationId`);

-- CreateIndex
CREATE INDEX `Employee_organizationId_idx` ON `Employee`(`organizationId`);

-- CreateIndex
CREATE INDEX `Employee_userId_idx` ON `Employee`(`userId`);

-- CreateIndex
CREATE INDEX `Loan_organizationId_idx` ON `Loan`(`organizationId`);

-- CreateIndex
CREATE INDEX `PayrollRun_organizationId_idx` ON `PayrollRun`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `PayrollRun_organizationId_employeeId_month_year_key` ON `PayrollRun`(`organizationId`, `employeeId`, `month`, `year`);

-- CreateIndex
CREATE INDEX `Payslip_organizationId_idx` ON `Payslip`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Payslip_organizationId_payslipNumber_key` ON `Payslip`(`organizationId`, `payslipNumber`);

-- CreateIndex
CREATE INDEX `Policy_organizationId_idx` ON `Policy`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Policy_organizationId_title_key` ON `Policy`(`organizationId`, `title`);

-- CreateIndex
CREATE UNIQUE INDEX `Policy_organizationId_policyNumber_key` ON `Policy`(`organizationId`, `policyNumber`);

-- CreateIndex
CREATE INDEX `SalaryStructure_organizationId_idx` ON `SalaryStructure`(`organizationId`);

-- CreateIndex
CREATE INDEX `Shift_organizationId_idx` ON `Shift`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Shift_organizationId_name_key` ON `Shift`(`organizationId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `Shift_organizationId_code_key` ON `Shift`(`organizationId`, `code`);

-- CreateIndex
CREATE INDEX `User_organizationId_idx` ON `User`(`organizationId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Designation` ADD CONSTRAINT `Designation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Policy` ADD CONSTRAINT `Policy_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_acceptedById_fkey` FOREIGN KEY (`acceptedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shift` ADD CONSTRAINT `Shift_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalaryStructure` ADD CONSTRAINT `SalaryStructure_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollRun` ADD CONSTRAINT `PayrollRun_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceSalary` ADD CONSTRAINT `AdvanceSalary_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyPolicyAcceptance` ADD CONSTRAINT `CompanyPolicyAcceptance_companyPolicyId_fkey` FOREIGN KEY (`companyPolicyId`) REFERENCES `CompanyPolicy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyPolicyAcceptance` ADD CONSTRAINT `CompanyPolicyAcceptance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `Complaint_raisedById_fkey` TO `Complaint_raisedById_idx`;

-- RenameIndex
ALTER TABLE `document` RENAME INDEX `Document_employeeId_fkey` TO `Document_employeeId_idx`;
