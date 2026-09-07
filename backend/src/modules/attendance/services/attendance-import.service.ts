/**
 * ATTENDANCE IMPORT SERVICE
 * 
 * Handles Excel-based attendance import for HR/Admin users.
 * Provides validation, preview, and bulk import functionality.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SocketGateway } from '../../notifications/socket.gateway';
import * as XLSX from 'xlsx';
import {
  ExcelRowImportResult,
  AttendanceImportPreviewDto,
  GetImportHistoryDto,
} from '../dto/attendance-import.dto';
import {
  getAttendanceBusinessDate,
  getIndianCalendarDate,
} from '../utils/attendance-date.util';
import { parseISO, format, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { AttendanceStatus, AttendanceSource } from '../enums';

interface ImportSession {
  sessionId: string;
  organizationId: string;
  uploadedBy: string;
  fileName: string;
  validRows: ExcelRowImportResult[];
  invalidRows: ExcelRowImportResult[];
  duplicateRows: ExcelRowImportResult[];
  createdAt: Date;
}

@Injectable()
export class AttendanceImportService {
  private readonly logger = new Logger(AttendanceImportService.name);
  private readonly importSessions = new Map<string, ImportSession>();
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,
  ) {
    // Clean up old sessions periodically
    setInterval(() => this.cleanupOldSessions(), 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Parse and validate Excel file
   * Returns preview data without saving to database
   */
  async parseAndValidateExcel(
    file: Express.Multer.File,
    organizationId: string,
    userId: string,
  ): Promise<AttendanceImportPreviewDto & { sessionId: string }> {
    this.logger.log(`Parsing Excel file: ${file.originalname}`);

    // Parse Excel file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    this.logger.log(`Parsed ${rows.length} rows from Excel`);

    if (rows.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    // Validate headers
    this.validateHeaders(rows[0]);

    // Process each row
    const results: ExcelRowImportResult[] = [];
    const employeeIds = new Set<string>();
    const employeesNotFound = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // Excel row number (header is row 1)
      const row = rows[i];

      const result = await this.validateRow(
        row,
        rowNumber,
        organizationId,
      );

      results.push(result);

      if (result.employeeFound) {
        employeeIds.add(result.employeeId);
      } else {
        employeesNotFound.add(result.employeeId);
      }
    }

    // Categorize results
    const validRows = results.filter((r) => r.success && !r.isDuplicate);
    const invalidRows = results.filter((r) => !r.success);
    const duplicateRows = results.filter((r) => r.isDuplicate);

    // Create session
    const sessionId = this.generateSessionId();
    this.importSessions.set(sessionId, {
      sessionId,
      organizationId,
      uploadedBy: userId,
      fileName: file.originalname,
      validRows,
      invalidRows,
      duplicateRows,
      createdAt: new Date(),
    });

    this.logger.log(`Import session created: ${sessionId}`);

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicateRows: duplicateRows.length,
      employeesFound: employeeIds.size,
      employeesNotFound: employeesNotFound.size,
      results,
      warnings: this.generateWarnings(results),
      sessionId,
    };
  }

  /**
   * Confirm and execute import
   */
  async confirmImport(
    sessionId: string,
    organizationId: string,
    userId: string,
  ) {
    const session = this.importSessions.get(sessionId);

    if (!session) {
      throw new BadRequestException('Import session expired or not found');
    }

    if (session.organizationId !== organizationId) {
      throw new BadRequestException('Invalid session');
    }

    this.logger.log(
      `Executing import for session ${sessionId} with ${session.validRows.length} valid rows`,
    );

    // Create import history record
    const importHistory = await this.prisma.attendanceImportHistory.create({
      data: {
        organizationId,
        fileName: session.fileName,
        uploadedBy: userId,
        totalRows: session.validRows.length + session.invalidRows.length,
        successfulRows: 0,
        failedRows: 0,
        duplicateRows: session.duplicateRows.length,
        status: 'PROCESSING',
      },
    });

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // Import valid rows
    for (const row of session.validRows) {
      try {
        await this.importAttendanceRow(row, organizationId, userId);
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          error: error.message,
        });
        this.logger.error(
          `Failed to import row ${row.rowNumber}: ${error.message}`,
        );
      }
    }

    // Update import history
    await this.prisma.attendanceImportHistory.update({
      where: { id: importHistory.id },
      data: {
        successfulRows: successCount,
        failedRows: failCount + session.invalidRows.length,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
        errorReport: JSON.stringify({
          importErrors: errors,
          validationErrors: session.invalidRows.map((r) => ({
            rowNumber: r.rowNumber,
            employeeId: r.employeeId,
            error: r.error,
          })),
        }),
        completedAt: new Date(),
      },
    });

    // Clean up session
    this.importSessions.delete(sessionId);

    this.logger.log(
      `Import completed: ${successCount} success, ${failCount} failed`,
    );

    // Emit real-time notification to HR users
    try {
      this.socketGateway.sendToRole('HR', 'attendance:import:completed', {
        importHistoryId: importHistory.id,
        fileName: session.fileName,
        totalRows: session.validRows.length,
        successfulRows: successCount,
        failedRows: failCount,
        duplicateRows: session.duplicateRows.length,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
      });
      this.socketGateway.sendToRole('HR_ADMIN', 'attendance:import:completed', {
        importHistoryId: importHistory.id,
        fileName: session.fileName,
        totalRows: session.validRows.length,
        successfulRows: successCount,
        failedRows: failCount,
        duplicateRows: session.duplicateRows.length,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
      });
      this.socketGateway.sendToRole('HR_USER', 'attendance:import:completed', {
        importHistoryId: importHistory.id,
        fileName: session.fileName,
        totalRows: session.validRows.length,
        successfulRows: successCount,
        failedRows: failCount,
        duplicateRows: session.duplicateRows.length,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
      });
    } catch (error) {
      this.logger.warn('Failed to emit Socket.IO notification:', error.message);
    }

    return {
      success: true,
      importHistoryId: importHistory.id,
      totalRows: session.validRows.length,
      successfulRows: successCount,
      failedRows: failCount,
      duplicateRows: session.duplicateRows.length,
      invalidRows: session.invalidRows.length,
    };
  }

  /**
   * Import single attendance row
   */
  private async importAttendanceRow(
    row: ExcelRowImportResult,
    organizationId: string,
    userId: string,
  ) {
    // Parse date and times
    const businessDate = this.parseDate(row.date);
    const checkInTime = row.checkIn ? this.parseDateTime(row.date, row.checkIn) : null;
    const checkOutTime = row.checkOut ? this.parseDateTime(row.date, row.checkOut) : null;

    // Find employee
    const employee = await this.prisma.employee.findFirst({
      where: {
        employeeId: row.employeeId,
        organizationId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check for existing attendance
    const existing = await this.prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId: employee.id,
          date: businessDate,
        },
      },
    });

    // Calculate status
    let status = row.status?.toUpperCase() || AttendanceStatus.PRESENT;
    let workingHours = 0;
    let lateBy = 0;

    if (checkInTime && checkOutTime) {
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      workingHours = diffMs / (1000 * 60 * 60); // Convert to hours

      // Apply existing business rules
      const zonedCheckInTime = toZonedTime(checkInTime, 'Asia/Kolkata');
      const zonedCheckOutTime = toZonedTime(checkOutTime, 'Asia/Kolkata');

      // Check if Monday (Week Off)
      if (zonedCheckInTime.getDay() === 1) {
        status = AttendanceStatus.WEEK_OFF;
      } else {
        // Late check (assuming 10:00 AM with 10-minute grace)
        const checkInHour = zonedCheckInTime.getHours();
        const checkInMinute = zonedCheckInTime.getMinutes();
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const graceEndMinutes = 10 * 60 + 10; // 10:10 AM

        if (checkInMinutes > graceEndMinutes) {
          lateBy = checkInMinutes - graceEndMinutes;
          status = AttendanceStatus.LATE;
        }

        // Early checkout check (before 7:00 PM)
        const checkOutHour = zonedCheckOutTime.getHours();
        const checkOutMinute = zonedCheckOutTime.getMinutes();
        const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
        const officialCheckoutMinutes = 19 * 60; // 7:00 PM

        if (checkOutMinutes < officialCheckoutMinutes && status !== AttendanceStatus.WEEK_OFF) {
          status = AttendanceStatus.HALF_DAY;
        }
      }
    }

    const attendanceData = {
      organizationId,
      employeeId: employee.id,
      date: businessDate,
      checkInTime,
      checkOutTime,
      workingHours,
      status,
      lateBy,
      source: AttendanceSource.MANUAL,
      isManualEntry: true,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: 'Imported from Excel',
    };

    if (existing) {
      // Update existing (upsert logic)
      await this.prisma.attendance.update({
        where: { id: existing.id },
        data: attendanceData,
      });

      // Create history log
      await this.prisma.attendanceHistory.create({
        data: {
          attendanceId: existing.id,
          field: 'EXCEL_IMPORT_UPDATE',
          oldValue: JSON.stringify({
            checkInTime: existing.checkInTime,
            checkOutTime: existing.checkOutTime,
            status: existing.status,
          }),
          newValue: JSON.stringify({
            checkInTime,
            checkOutTime,
            status,
          }),
          reason: 'Excel Import Update',
          changedBy: userId,
        },
      });
    } else {
      // Create new
      const created = await this.prisma.attendance.create({
        data: attendanceData,
      });

      // Create history log
      await this.prisma.attendanceHistory.create({
        data: {
          attendanceId: created.id,
          field: 'EXCEL_IMPORT_CREATE',
          newValue: JSON.stringify({
            checkInTime,
            checkOutTime,
            status,
          }),
          reason: 'Excel Import',
          changedBy: userId,
        },
      });
    }
  }

  /**
   * Validate Excel row
   */
  private async validateRow(
    row: any,
    rowNumber: number,
    organizationId: string,
  ): Promise<ExcelRowImportResult> {
    const employeeId = row['Employee ID']?.toString().trim() || '';
    const date = row['Date']?.toString().trim() || '';
    const checkIn = row['Check In']?.toString().trim() || '';
    const checkOut = row['Check Out']?.toString().trim() || '';
    const status = row['Status']?.toString().trim() || '';

    const result: ExcelRowImportResult = {
      rowNumber,
      employeeId,
      date,
      checkIn,
      checkOut,
      status,
      success: true,
    };

    // Validate Employee ID
    if (!employeeId) {
      result.success = false;
      result.error = 'Employee ID is required';
      return result;
    }

    // Find employee
    const employee = await this.prisma.employee.findFirst({
      where: {
        employeeId,
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!employee) {
      result.success = false;
      result.employeeFound = false;
      result.error = 'Employee not found';
      return result;
    }

    result.employeeFound = true;
    result.employeeName = `${employee.firstName} ${employee.lastName}`;

    // Validate Date
    if (!date) {
      result.success = false;
      result.error = 'Date is required';
      return result;
    }

    try {
      const parsedDate = this.parseDate(date);
      if (!isValid(parsedDate)) {
        result.success = false;
        result.error = 'Invalid date format. Use YYYY-MM-DD';
        return result;
      }
    } catch (error) {
      result.success = false;
      result.error = 'Invalid date format. Use YYYY-MM-DD';
      return result;
    }

    // Validate Check In
    if (checkIn && !this.isValidTime(checkIn)) {
      result.success = false;
      result.error = 'Invalid check-in time format. Use HH:MM or HH:MM AM/PM';
      return result;
    }

    // Validate Check Out
    if (checkOut && !this.isValidTime(checkOut)) {
      result.success = false;
      result.error = 'Invalid check-out time format. Use HH:MM or HH:MM AM/PM';
      return result;
    }

    // Check for duplicate in database
    const businessDate = this.parseDate(date);
    const existing = await this.prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId: employee.id,
          date: businessDate,
        },
      },
    });

    if (existing) {
      result.isDuplicate = true;
      result.error = 'Attendance already exists for this date (will be updated)';
    }

    return result;
  }

  /**
   * Validate Excel headers
   */
  private validateHeaders(firstRow: any) {
    const requiredHeaders = ['Employee ID', 'Date', 'Check In', 'Check Out', 'Status'];
    const actualHeaders = Object.keys(firstRow);

    for (const required of requiredHeaders) {
      if (!actualHeaders.includes(required)) {
        throw new BadRequestException(
          `Missing required column: "${required}". Please use the provided template.`,
        );
      }
    }
  }

  /**
   * Parse date string to business date
   */
  private parseDate(dateStr: string): Date {
    // Try various date formats
    let date: Date;

    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      date = parseISO(dateStr);
    }
    // Try DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      date = new Date(`${year}-${month}-${day}`);
    }
    // Try MM/DD/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      date = new Date(dateStr);
    } else {
      throw new Error('Invalid date format');
    }

    if (!isValid(date)) {
      throw new Error('Invalid date');
    }

    return getAttendanceBusinessDate(date);
  }

  /**
   * Parse date and time to DateTime
   */
  private parseDateTime(dateStr: string, timeStr: string): Date {
    const date = this.parseDate(dateStr);
    const time = this.parseTime(timeStr);

    // Combine date and time in IST
    const dateTimeStr = `${format(date, 'yyyy-MM-dd')}T${time}:00`;
    const istDateTime = parseISO(dateTimeStr);

    // Convert IST to UTC
    const zonedTime = toZonedTime(istDateTime, 'Asia/Kolkata');
    return zonedTime;
  }

  /**
   * Parse time string to HH:mm format
   */
  private parseTime(timeStr: string): string {
    // Remove spaces
    timeStr = timeStr.trim().toUpperCase();

    // Try HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hour, minute] = timeStr.split(':');
      return `${hour.padStart(2, '0')}:${minute}`;
    }

    // Try HH:MM AM/PM format
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/.test(timeStr)) {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2];
        const period = match[3];

        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }
    }

    throw new Error('Invalid time format');
  }

  /**
   * Validate time format
   */
  private isValidTime(timeStr: string): boolean {
    try {
      this.parseTime(timeStr);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate warnings
   */
  private generateWarnings(results: ExcelRowImportResult[]): string[] {
    const warnings: string[] = [];

    const duplicates = results.filter((r) => r.isDuplicate).length;
    if (duplicates > 0) {
      warnings.push(
        `${duplicates} attendance records already exist and will be updated`,
      );
    }

    const notFound = results.filter((r) => !r.employeeFound).length;
    if (notFound > 0) {
      warnings.push(`${notFound} employees not found in the system`);
    }

    return warnings;
  }

  /**
   * Get import history
   */
  async getImportHistory(
    organizationId: string,
    dto: GetImportHistoryDto,
  ) {
    const { page = 1, limit = 20, status, startDate, endDate } = dto;

    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.uploadedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.attendanceImportHistory.findMany({
        where,
        include: {
          uploadedByUser: {
            select: {
              email: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceImportHistory.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get import history by ID
   */
  async getImportHistoryById(id: string, organizationId: string) {
    const record = await this.prisma.attendanceImportHistory.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        uploadedByUser: {
          select: {
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Import history not found');
    }

    return record;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.importSessions.entries()) {
      if (now - session.createdAt.getTime() > this.SESSION_TIMEOUT_MS) {
        this.importSessions.delete(sessionId);
        this.logger.log(`Cleaned up expired session: ${sessionId}`);
      }
    }
  }
}
