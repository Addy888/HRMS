/**
 * BIOMETRIC ATTENDANCE IMPORTER
 * Imports biometric Excel files and creates Attendance records
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BiometricParserService, BiometricEmployee, BiometricPeriod } from './biometric-parser.service';
import { AttendanceStatus, AttendanceSource } from '../enums';
import { fromZonedTime, formatInTimeZone, toZonedTime } from 'date-fns-tz';

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

    const periodStart = new Date(Date.UTC(
      period.startYear,
      period.startMonth - 1,
      period.startDay,
      0, 0, 0, 0,
    ));
    const periodEndExclusive = new Date(Date.UTC(
      period.endYear,
      period.endMonth - 1,
      period.endDay + 1,
      0, 0, 0, 0,
    ));

    const cleanup = await this.prisma.$transaction(async transaction =>
      transaction.attendance.deleteMany({
        where: {
          organizationId,
          source: AttendanceSource.BIOMETRIC,
          date: {
            gte: periodStart,
            lt: periodEndExclusive,
          },
        },
      }),
    );

    this.logger.log(
      `[BIOMETRIC-CLEANUP] Removed ${cleanup.count} old BIOMETRIC records for ${periodStart.toISOString().split('T')[0]} through ${new Date(periodEndExclusive.getTime() - 1).toISOString().split('T')[0]}`,
    );

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
        this.logger.warn(`[BIOMETRIC-SKIP] reason: no-match, excelNo: ${empData.biometricNo || ''}, excelName: ${empData.name || ''}`);
        continue;
      }

      matched++;
      this.logger.log(
        `[BIOMETRIC-MATCH] excelNo: ${empData.biometricNo || ''}, excelName: ${empData.name || ''}, matchedEmployeeUUID: ${match.id}, matchedEmployeeCode: ${match.employeeId}, matchedEmployeeName: ${match.firstName || ''} ${match.lastName || ''}, matchMethod: ${match.matchMethod || 'name'}`,
      );

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
    const matchData = { matchMethod: 'none' };

    // Strategy 1: Match by name (firstName only, normalized)
    if (bioEmp.name && bioEmp.name.trim()) {
      const normalizedBioName = this.normalizeName(bioEmp.name);

      const nameMatches = dbEmployees.filter(e =>
        this.normalizeName(e.firstName) === normalizedBioName,
      );

      if (nameMatches.length === 1) {
        const match = { ...nameMatches[0], matchMethod: 'name' };
        return match;
      }

      if (nameMatches.length > 1) {
        this.logger.warn(
          `[BIOMETRIC-MATCH] ambiguousName: ${bioEmp.name}, candidates: ${nameMatches.map(e => e.employeeId).join(', ')}`,
        );
      }
    }

    // A present name is authoritative. Never fall back to biometric number when
    // the name is unmatched or ambiguous.
    if (bioEmp.name && bioEmp.name.trim()) {
      return null;
    }

    // Strategy 2: Match by biometric number only when the Excel name is blank.
    if (bioEmp.biometricNo) {
      const employeeCode = this.biometricNoToEmployeeCode(bioEmp.biometricNo);
      const codeMatch = dbEmployees.find(e => e.employeeId === employeeCode);
      if (codeMatch) {
        return { ...codeMatch, matchMethod: 'biometric-no' };
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

    for (let dayNum = period.startDay; dayNum <= period.endDay; dayNum++) {
      if (empData.punches.has(dayNum)) continue;

      const attendanceDate = new Date(Date.UTC(
        period.startYear,
        period.startMonth - 1,
        dayNum,
        0, 0, 0, 0,
      ));

      const existingBlankDay = await this.prisma.attendance.findUnique({
        where: {
          organizationId_employeeId_date: {
            organizationId,
            employeeId: employeeUUID,
            date: attendanceDate,
          },
        },
      });

      if (existingBlankDay?.source === AttendanceSource.BIOMETRIC) {
        await this.prisma.attendance.delete({
          where: { id: existingBlankDay.id },
        });
        this.logger.log(
          `[BIOMETRIC-BLANK-SKIP] employee: ${empData.name}, date: ${attendanceDate.toISOString().split('T')[0]}, removed stale BIOMETRIC record: ${existingBlankDay.id}`,
        );
      }
    }

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

      if (times.length === 0) continue;

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

      this.logger.log(
        `[BIOMETRIC-PUNCH-RAW]\nemployee: ${empData.name}\ndateFromExcel: ${attendanceDate.toISOString().split('T')[0]}\ndayNumber: ${dayNum}\nrawCell:\n${times.join('\n')}\nparsedTimes:\n${times.join(', ')}`,
      );
      this.logger.log(
        `[BIOMETRIC-EXACT]\nemployee: ${empData.name}\nexcelDay: ${dayNum}\nexcelDate: ${attendanceDate.toISOString().split('T')[0]}\nrawExcelCell:\n${times.join('\n')}\nparsedCheckIn: ${times[0]}\nparsedCheckOut: ${times.length > 1 ? times[times.length - 1] : ''}`,
      );

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

      this.logger.log(
        `[BIOMETRIC-PUNCH-SAVE]\nemployee: ${empData.name}\nattendanceDate: ${attendanceDate.toISOString().split('T')[0]}\nexcelCheckIn: ${times[0]}\nexcelCheckOut: ${times.length > 1 ? times[times.length - 1] : ''}\ndatabaseCheckIn: ${checkInTime ? `${checkInTime.toISOString()} (${formatInTimeZone(checkInTime, 'Asia/Kolkata', 'HH:mm')})` : 'null'}\ndatabaseCheckOut: ${checkOutTime ? `${checkOutTime.toISOString()} (${formatInTimeZone(checkOutTime, 'Asia/Kolkata', 'HH:mm')})` : 'null'}`,
      );

      if (existing) {
        if (existing.source === AttendanceSource.MANUAL) {
          this.logger.warn(
            `[BIOMETRIC-SKIP] reason: manual-existing, attendanceId: ${existing.id}, employeeUUID: ${employeeUUID}, employeeCode: ${empData.biometricNo ? this.biometricNoToEmployeeCode(empData.biometricNo) : ''}, date: ${attendanceDate.toISOString().split('T')[0]}`,
          );
          continue;
        }

        await this.prisma.attendance.update({
          where: { id: existing.id },
          data: attendanceData,
        });
        updated++;

        this.logger.log(
          `[BIOMETRIC-SAVE] attendanceId: ${existing.id}, employeeUUID: ${employeeUUID}, employeeCode: ${this.biometricNoToEmployeeCode(empData.biometricNo)}, date: ${attendanceDate.toISOString().split('T')[0]}, checkIn: ${times[0]}, checkOut: ${times[times.length - 1] || ''}, status: ${status}, source: ${AttendanceSource.BIOMETRIC}`,
        );
        this.logger.log(
          `[BIOMETRIC-SAVED]\nemployee: ${empData.name}\nattendanceDate: ${attendanceDate.toISOString().split('T')[0]}\nsavedCheckIn: ${checkInTime ? formatInTimeZone(checkInTime, 'Asia/Kolkata', 'HH:mm') : ''}\nsavedCheckOut: ${checkOutTime ? formatInTimeZone(checkOutTime, 'Asia/Kolkata', 'HH:mm') : ''}\nstatus: ${status}\nsource: ${AttendanceSource.BIOMETRIC}`,
        );
      } else {
        const createdRecord = await this.prisma.attendance.create({
          data: attendanceData,
        });
        created++;

        this.logger.log(
          `[BIOMETRIC-SAVE] attendanceId: ${createdRecord.id}, employeeUUID: ${employeeUUID}, employeeCode: ${this.biometricNoToEmployeeCode(empData.biometricNo)}, date: ${attendanceDate.toISOString().split('T')[0]}, checkIn: ${times[0]}, checkOut: ${times[times.length - 1] || ''}, status: ${status}, source: ${AttendanceSource.BIOMETRIC}`,
        );
        this.logger.log(
          `[BIOMETRIC-SAVED]\nemployee: ${empData.name}\nattendanceDate: ${attendanceDate.toISOString().split('T')[0]}\nsavedCheckIn: ${checkInTime ? formatInTimeZone(checkInTime, 'Asia/Kolkata', 'HH:mm') : ''}\nsavedCheckOut: ${checkOutTime ? formatInTimeZone(checkOutTime, 'Asia/Kolkata', 'HH:mm') : ''}\nstatus: ${status}\nsource: ${AttendanceSource.BIOMETRIC}`,
        );
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
    const localDateTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    return fromZonedTime(localDateTime, 'Asia/Kolkata');
  }

  /**
   * Calculate late minutes
   * Late threshold: 10:05 AM
   */
  private calculateLateMinutes(checkInTime: Date | null): number {
    if (!checkInTime) return 0;

    const istCheckInTime = toZonedTime(checkInTime, 'Asia/Kolkata');
    const hour = istCheckInTime.getHours();
    const minute = istCheckInTime.getMinutes();
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
    if (toZonedTime(checkInTime, 'Asia/Kolkata').getDay() === 1) {
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
