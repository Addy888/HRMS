/**
 * BIOMETRIC ATTENDANCE IMPORTER
 * Imports biometric Excel files and creates Attendance records
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BiometricParserService, BiometricEmployee, BiometricPeriod } from './biometric-parser.service';
import { AttendanceStatus, AttendanceSource } from '../enums';

@Injectable()
export class BiometricImporterService {
  private readonly logger = new Logger(BiometricImporterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: BiometricParserService,
  ) {}

  /**
   * Import biometric Excel file
   */
  async importBiometricFile(
    fileBuffer: Buffer,
    organizationId: string,
    userId: string,
  ): Promise<{
    totalEmployees: number;
    matched: number;
    unmatched: number;
    totalDays: number;
    recordsCreated: number;
    recordsUpdated: number;
  }> {
    this.logger.log('[BIOMETRIC-IMPORT] Starting import');

    // Parse Excel
    const { period, employees } = this.parser.parseBiometricExcel(fileBuffer);

    this.logger.log(`[BIOMETRIC-IMPORT] Period: ${period.startYear}-${period.startMonth}-${period.startDay} to ${period.endMonth}-${period.endDay}`);
    this.logger.log(`[BIOMETRIC-IMPORT] Employees: ${employees.length}`);

    // Get all employees for matching
    const dbEmployees = await this.prisma.employee.findMany({
      where: { organizationId },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
      },
    });

    this.logger.log(`[BIOMETRIC-IMPORT] Database employees: ${dbEmployees.length}`);

    let matched = 0;
    let unmatched = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Process each employee
    for (const empData of employees) {
      const match = this.matchEmployee(empData, dbEmployees);
      
      if (!match) {
        unmatched++;
        this.logger.warn(`[BIOMETRIC-SKIP] No: ${empData.biometricNo}, Name: ${empData.name} - No match`);
        continue;
      }

      matched++;
      this.logger.log(`[BIOMETRIC-MATCH] No: ${empData.biometricNo}, Name: ${empData.name} -> ${match.employeeId} (${match.firstName})`);

      // Import punches for this employee
      const result = await this.importEmployeePunches(
        empData,
        period,
        match.id,
        organizationId,
        userId,
      );

      recordsCreated += result.created;
      recordsUpdated += result.updated;
    }

    this.logger.log(`[BIOMETRIC-IMPORT] Complete: ${matched} matched, ${unmatched} unmatched, ${recordsCreated} created, ${recordsUpdated} updated`);

    return {
      totalEmployees: employees.length,
      matched,
      unmatched,
      totalDays: period.endDay - period.startDay + 1,
      recordsCreated,
      recordsUpdated,
    };
  }

  /**
   * Match biometric employee to database employee
   * Uses two-stage fallback: name match first, then biometric number
   */
  private matchEmployee(
    bioEmp: BiometricEmployee,
    dbEmployees: any[],
  ): any | null {
    // Strategy 1: Match by name (firstName only, normalized)
    if (bioEmp.name) {
      const normalizedBioName = this.normalizeName(bioEmp.name);
      
      const nameMatches = dbEmployees.filter(e => 
        this.normalizeName(e.firstName) === normalizedBioName
      );

      if (nameMatches.length === 1) {
        this.logger.log(`[BIOMETRIC-MATCH] Name match: "${bioEmp.name}" -> ${nameMatches[0].employeeId}`);
        return nameMatches[0];
      }

      if (nameMatches.length > 1) {
        this.logger.warn(`[BIOMETRIC-MATCH] AMBIGUOUS: "${bioEmp.name}" matches ${nameMatches.length} employees, trying biometric number fallback`);
        // Don't return null yet - try biometric number fallback
      }
    }

    // Strategy 2: Match by biometric number -> employee code (fallback for ambiguous/blank names)
    if (bioEmp.biometricNo) {
      const employeeCode = this.biometricNoToEmployeeCode(bioEmp.biometricNo);
      const codeMatch = dbEmployees.find(e => e.employeeId === employeeCode);
      if (codeMatch) {
        this.logger.log(`[BIOMETRIC-MATCH] Biometric No fallback: ${bioEmp.biometricNo} -> ${employeeCode}`);
        return codeMatch;
      }
    }

    return null;
  }

  /**
   * Normalize name for matching
   */
  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Convert biometric number to employee code
   * Examples: 1 -> FCS0001, 2 -> FCS0002, 180 -> FCS0180
   */
  private biometricNoToEmployeeCode(bioNo: string): string {
    const num = parseInt(bioNo);
    if (isNaN(num)) return '';
    return `FCS${num.toString().padStart(4, '0')}`;
  }

  /**
   * Import punches for one employee
   */
  private async importEmployeePunches(
    empData: BiometricEmployee,
    period: BiometricPeriod,
    employeeUUID: string,
    organizationId: string,
    userId: string,
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const [dayNum, times] of empData.punches) {
      if (dayNum < period.startDay || dayNum > period.endDay) {
        continue;
      }

      const attendanceDate = new Date(Date.UTC(
        period.startYear,
        period.startMonth - 1,
        dayNum,
        0, 0, 0, 0
      ));

      if (times.length === 0) {
        continue;
      }

      // Parse check-in and check-out
      const checkInTime = this.parseTimeToDateTime(period.startYear, period.startMonth, dayNum, times[0]);
      const checkOutTime = times.length > 1
        ? this.parseTimeToDateTime(period.startYear, period.startMonth, dayNum, times[times.length - 1])
        : null;

      // Calculate working hours and status
      const workingHours = checkInTime && checkOutTime
        ? (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
        : 0;

      const lateBy = this.calculateLateMinutes(checkInTime);
      const status = this.calculateStatus(checkInTime, checkOutTime, workingHours, lateBy);

      // Check existing
      const existing = await this.prisma.attendance.findUnique({
        where: {
          organizationId_employeeId_date: {
            organizationId,
            employeeId: employeeUUID,
            date: attendanceDate,
          },
        },
      });

      const attendanceData = {
        organizationId,
        employeeId: employeeUUID,
        date: attendanceDate,
        checkInTime,
        checkOutTime,
        workingHours,
        status,
        lateBy,
        source: AttendanceSource.BIOMETRIC,
        isManualEntry: false,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks: `Imported from biometric (No: ${empData.biometricNo})`,
      };

      if (existing) {
        // Only update if existing is BIOMETRIC (don't overwrite MANUAL)
        if (existing.source === AttendanceSource.BIOMETRIC) {
          await this.prisma.attendance.update({
            where: { id: existing.id },
            data: attendanceData,
          });
          updated++;
          
          this.logger.log(`[BIOMETRIC-SAVE] UPDATED: UUID=${employeeUUID}, Date=${attendanceDate.toISOString().split('T')[0]}, Status=${status}, In=${times[0]}, Out=${times[times.length - 1]}`);
        } else {
          this.logger.log(`[BIOMETRIC-SKIP] MANUAL exists: UUID=${employeeUUID}, Date=${attendanceDate.toISOString().split('T')[0]}`);
        }
      } else {
        const created_record = await this.prisma.attendance.create({
          data: attendanceData,
        });
        created++;
        
        this.logger.log(`[BIOMETRIC-SAVE] CREATED: UUID=${employeeUUID}, Date=${attendanceDate.toISOString().split('T')[0]}, Status=${status}, In=${times[0]}, Out=${times[times.length - 1]}, ID=${created_record.id}`);
      }
    }

    return { created, updated };
  }

  /**
   * Parse time string to DateTime
   */
  private parseTimeToDateTime(year: number, month: number, day: number, timeStr: string): Date {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }

  /**
   * Calculate late minutes
   * Late threshold: 10:05 AM
   */
  private calculateLateMinutes(checkInTime: Date | null): number {
    if (!checkInTime) return 0;

    const hour = checkInTime.getUTCHours();
    const minute = checkInTime.getUTCMinutes();
    const totalMinutes = hour * 60 + minute;

    const lateThreshold = 10 * 60 + 5; // 10:05 AM

    if (totalMinutes > lateThreshold) {
      return totalMinutes - lateThreshold;
    }

    return 0;
  }

  /**
   * Calculate attendance status
   */
  private calculateStatus(
    checkInTime: Date | null,
    checkOutTime: Date | null,
    workingHours: number,
    lateBy: number,
  ): string {
    if (!checkInTime) {
      return AttendanceStatus.ABSENT;
    }

    // Check if Monday (Week Off)
    if (checkInTime.getUTCDay() === 1) {
      return AttendanceStatus.WEEK_OFF;
    }

    // Late check
    if (lateBy > 0) {
      return AttendanceStatus.LATE;
    }

    // Half day check (less than 6 hours)
    if (checkOutTime && workingHours < 6) {
      return AttendanceStatus.HALF_DAY;
    }

    return AttendanceStatus.PRESENT;
  }
}
