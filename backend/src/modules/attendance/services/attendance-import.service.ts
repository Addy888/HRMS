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
import { promises as fs } from 'fs';
import { join } from 'path';
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
  fileBuffer?: Buffer;
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
   * Parse and validate Excel file (FLEXIBLE FORMAT)
   * Accepts ANY Excel structure without requiring specific columns
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
    
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }
    
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON - accept whatever format exists
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    this.logger.log(`Parsed ${rows.length} rows from Excel`);

    if (rows.length === 0) {
      throw new BadRequestException('Excel file has no data rows');
    }

    // ✅ FLEXIBLE: Extract actual columns from first row
    const actualColumns = Object.keys(rows[0]);
    this.logger.log(`✅ FLEXIBLE MODE: Detected ${actualColumns.length} columns from Excel`);
    this.logger.log(`Column names: ${actualColumns.slice(0, 10).join(', ')}${actualColumns.length > 10 ? '...' : ''}`);

    // ✅ NO VALIDATION: Accept any columns without error
    // Try to identify employee identifier column (if any)
    const identifierColumn = this.detectEmployeeIdentifierColumn(actualColumns);
    this.logger.log(`Detected identifier column: ${identifierColumn || 'NONE (will store all records)'}`);

    // ✅ Try to match employees
    const matchResults = await this.matchEmployees(rows, organizationId, identifierColumn);

    // Create session
    const sessionId = this.generateSessionId();
    this.importSessions.set(sessionId, {
      sessionId,
      organizationId,
      uploadedBy: userId,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      validRows: matchResults.matched,
      invalidRows: [], // No validation errors for flexible format
      duplicateRows: matchResults.unmatched, // Reuse for unmatched
      createdAt: new Date(),
    });

    this.logger.log(`Import session created: ${sessionId}`);
    this.logger.log(`Matched: ${matchResults.matched.length}, Unmatched: ${matchResults.unmatched.length}`);

    return {
      totalRows: rows.length,
      validRows: matchResults.matched.length,
      invalidRows: 0, // No invalid rows in flexible mode
      duplicateRows: matchResults.unmatched.length, // Repurpose for unmatched
      employeesFound: matchResults.matchedEmployeeIds.size,
      employeesNotFound: matchResults.unmatched.length,
      results: [...matchResults.matched, ...matchResults.unmatched],
      warnings: this.generateFlexibleWarnings(matchResults, identifierColumn),
      sessionId,
    };
  }

  /**
   * Confirm and execute import (FLEXIBLE FORMAT)
   * Stores raw attendance data as-is without forcing structure
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
      `Executing flexible import for session ${sessionId} with ${session.validRows.length} rows`,
    );

    // Get all rows (matched + unmatched)
    const allRows = [...session.validRows, ...session.duplicateRows];

    // Extract column names from first row
    const columns = allRows.length > 0 && allRows[0].rawData 
      ? Object.keys(JSON.parse(allRows[0].rawData))
      : [];

    // Create import history record with flexible format metadata
    const importHistory = await this.prisma.attendanceImportHistory.create({
      data: {
        organizationId,
        fileName: session.fileName,
        uploadedBy: userId,
        totalRows: allRows.length,
        successfulRows: 0,
        failedRows: 0,
        duplicateRows: 0,
        status: 'PROCESSING',
        originalColumns: JSON.stringify(columns), // ✅ Store original columns
      },
    });

    const storagePath = await this.persistUploadedFile(session, importHistory.id);
    await this.prisma.attendanceImportHistory.update({
      where: { id: importHistory.id },
      data: {
        fileStoragePath: storagePath,
      },
    });

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // ✅ Import ALL rows as raw attendance records
    for (const row of allRows) {
      try {
        await this.importRawAttendanceRow(row, organizationId, importHistory.id, session.fileName);
        
        // ✅ CRITICAL FIX: Convert matched raw records to Attendance table entries
        // This makes imported attendance visible in employee calendar
        if (row.matchedEmployeeUUID) {
          await this.importFlexibleAttendanceRow(
            row,
            organizationId,
            userId,
            session.fileName,
          );
        }
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({
          rowNumber: row.rowNumber,
          identifier: row.employeeId,
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
        failedRows: failCount,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
        errorReport: JSON.stringify({ importErrors: errors }),
        completedAt: new Date(),
      },
    });

    // Clean up session
    this.importSessions.delete(sessionId);

    this.logger.log(
      `Flexible import completed: ${successCount} success, ${failCount} failed`,
    );

    // Emit real-time notification
    try {
      const notification = {
        importHistoryId: importHistory.id,
        fileName: session.fileName,
        totalRows: allRows.length,
        successfulRows: successCount,
        failedRows: failCount,
        status: failCount > 0 ? 'PARTIAL' : 'COMPLETED',
      };
      
      this.socketGateway.sendToRole('HR', 'attendance:import:completed', notification);
      this.socketGateway.sendToRole('HR_ADMIN', 'attendance:import:completed', notification);
      this.socketGateway.sendToRole('HR_USER', 'attendance:import:completed', notification);
    } catch (error) {
      this.logger.warn('Failed to emit Socket.IO notification:', error.message);
    }

    return {
      success: true,
      importHistoryId: importHistory.id,
      totalRows: allRows.length,
      successfulRows: successCount,
      failedRows: failCount,
      matchedEmployees: session.validRows.length,
      unmatchedRecords: session.duplicateRows.length,
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
    // For flexible format, date might not exist
    if (!row.date) {
      this.logger.warn(`Row ${row.rowNumber} has no date field, using raw format instead`);
      // Delegate to raw import
      throw new Error('Date field required for structured import');
    }

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
   * Get column value from row with flexible header matching
   */
  private getColumnValue(row: any, columnName: string): string {
    const normalizeHeader = (header: string) => 
      header.toLowerCase().replace(/[\s_-]/g, '');
    
    const targetNormalized = normalizeHeader(columnName);
    
    // Map of column variations
    const columnVariations: Record<string, string[]> = {
      'employeeid': ['employeeid', 'empid', 'employee', 'employee id', 'emp_id'],
      'date': ['date', 'attendancedate', 'day', 'attendance date', 'attendance_date'],
      'checkin': ['checkin', 'timein', 'intime', 'clockin', 'check in', 'time in', 'clock in'],
      'checkout': ['checkout', 'timeout', 'outtime', 'clockout', 'check out', 'time out', 'clock out'],
      'status': ['status', 'attendancestatus', 'state', 'attendance status', 'attendance_status'],
    };
    
    const variations = columnVariations[targetNormalized] || [targetNormalized];
    
    // Try to find matching column in row
    for (const key of Object.keys(row)) {
      const normalizedKey = normalizeHeader(key);
      if (variations.includes(normalizedKey)) {
        return row[key]?.toString().trim() || '';
      }
    }
    
    return '';
  }

  /**
   * Validate Excel row
   */
  private async validateRow(
    row: any,
    rowNumber: number,
    organizationId: string,
  ): Promise<ExcelRowImportResult> {
    const employeeId = this.getColumnValue(row, 'Employee ID');
    const date = this.getColumnValue(row, 'Date');
    const checkIn = this.getColumnValue(row, 'Check In');
    const checkOut = this.getColumnValue(row, 'Check Out');
    const status = this.getColumnValue(row, 'Status');

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
   * Supports flexible column name matching (case-insensitive, handles variations)
   */
  private validateHeaders(firstRow: any) {
    const actualHeaders = Object.keys(firstRow);
    
    // Log actual headers for debugging
    this.logger.debug(`Actual Excel headers: ${JSON.stringify(actualHeaders)}`);
    
    // Normalize header names for comparison (lowercase, remove spaces/underscores)
    const normalizeHeader = (header: string) => 
      header.toLowerCase().replace(/[\s_-]/g, '');
    
    const normalizedActual = actualHeaders.map(normalizeHeader);
    this.logger.debug(`Normalized headers: ${JSON.stringify(normalizedActual)}`);
    
    // Required headers with their variations
    const requiredHeadersMap = {
      'Employee ID': ['employeeid', 'empid', 'employee'],
      'Date': ['date', 'attendancedate', 'day'],
      'Check In': ['checkin', 'timein', 'intime', 'clockin'],
      'Check Out': ['checkout', 'timeout', 'outtime', 'clockout'],
      'Status': ['status', 'attendancestatus', 'state'],
    };
    
    const missingHeaders: string[] = [];
    
    for (const [displayName, variations] of Object.entries(requiredHeadersMap)) {
      const found = variations.some(variant => normalizedActual.includes(variant));
      if (!found) {
        missingHeaders.push(displayName);
      }
    }
    
    if (missingHeaders.length > 0) {
      this.logger.error(`Missing headers: ${JSON.stringify(missingHeaders)}`);
      this.logger.error(`Headers found in file: ${JSON.stringify(actualHeaders)}`);
      this.logger.error(`Expected variations: ${JSON.stringify(requiredHeadersMap)}`);
      throw new BadRequestException(
        `Missing required columns: ${missingHeaders.join(', ')}. ` +
        `Found columns: ${actualHeaders.join(', ')}. ` +
        `Please use the provided template or ensure columns are named correctly.`
      );
    }
    
    this.logger.debug('All required headers found');
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
   * Delete import history and all associated attendance records
   * TRANSACTIONAL: Ensures all-or-nothing deletion
   */
  async deleteImportHistory(id: string, organizationId: string) {
    this.logger.log(`Deleting import history: ${id} for organization: ${organizationId}`);

    // First verify the import exists and belongs to the organization
    const importHistory = await this.prisma.attendanceImportHistory.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!importHistory) {
      throw new NotFoundException('Import history not found or access denied');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Delete all RawAttendanceRecords associated with this import
      const deletedRawRecords = await tx.rawAttendanceRecord.deleteMany({
        where: {
          importHistoryId: id,
          organizationId, // Double-check organization for security
        },
      });

      this.logger.log(`Deleted ${deletedRawRecords.count} raw attendance records for import ${id}`);

      // Step 2: Delete the import history record itself
      await tx.attendanceImportHistory.delete({
        where: {
          id,
        },
      });

      this.logger.log(`Deleted import history: ${id}`);

      // Step 3: Clean up stored file if it exists
      if (importHistory.fileStoragePath) {
        try {
          const { join } = await import('path');
          const fs = await import('fs/promises');
          const filePath = join(process.cwd(), importHistory.fileStoragePath);
          await fs.unlink(filePath);
          this.logger.log(`Deleted stored file: ${filePath}`);
        } catch (error) {
          // Don't fail the transaction if file cleanup fails
          this.logger.warn(`Failed to delete stored file: ${error.message}`);
        }
      }
    });

    return {
      success: true,
      message: 'Import history and all associated records deleted successfully',
      deletedImportId: id,
    };
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

  /**
   * ✅ NEW: Detect employee identifier column from Excel headers
   */
  private detectEmployeeIdentifierColumn(columns: string[]): string | null {
    const normalizeColumn = (col: string) => col.toLowerCase().replace(/[\s_-]/g, '');
    
    // Prioritized list of identifier patterns
    const identifierPatterns = [
      ['agentid', 'agent'],
      ['employeeid', 'empid'],
      ['biometricid', 'biometric'],
      ['staffid', 'staff'],
      ['userid', 'user'],
    ];

    for (const patterns of identifierPatterns) {
      for (const col of columns) {
        const normalized = normalizeColumn(col);
        if (patterns.some(p => normalized === p || normalized.includes(p))) {
          this.logger.log(`✅ Detected identifier column: "${col}"`);
          return col;
        }
      }
    }

    this.logger.warn('⚠️ No employee identifier column detected - will try to match by name');
    return null;
  }

  /**
   * ✅ NAME-ONLY MATCHING: Match employees using NAME ONLY (no ID, no biometric number)
   * Handles ambiguous duplicate names safely
   */
  private async matchEmployees(
    rows: any[],
    organizationId: string,
    identifierColumn: string | null,
  ) {
    const matched: ExcelRowImportResult[] = [];
    const unmatched: ExcelRowImportResult[] = [];
    const ambiguous: ExcelRowImportResult[] = [];
    const matchedEmployeeIds = new Set<string>();

    // Get all employees for this organization
    const employees = await this.prisma.employee.findMany({
      where: { organizationId },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
      },
    });

    this.logger.log(`[BIOMETRIC-NAME-MATCH] Found ${employees.length} employees in organization`);

    // Group employees by normalized name to detect duplicates
    const employeesByNormalizedName = new Map<string, typeof employees>();
    
    for (const emp of employees) {
      const fullName = `${emp.firstName} ${emp.lastName}`;
      const normalized = this.normalizeName(fullName);
      
      if (!employeesByNormalizedName.has(normalized)) {
        employeesByNormalizedName.set(normalized, []);
      }
      employeesByNormalizedName.get(normalized)!.push(emp);
    }

    // Log employees with duplicate names
    for (const [normalizedName, emps] of employeesByNormalizedName.entries()) {
      if (emps.length > 1) {
        const ids = emps.map(e => e.employeeId).join(', ');
        this.logger.warn(
          `[BIOMETRIC-NAME-MATCH] ⚠️ DUPLICATE NAME DETECTED: "${normalizedName}" has ${emps.length} employees: ${ids}`
        );
      }
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // Excel row (header = row 1)
      const row = rows[i];

      // Find name column
      const nameColumn = this.detectNameColumn(Object.keys(row));
      
      if (!nameColumn || !row[nameColumn]) {
        this.logger.warn(`[BIOMETRIC-NAME-MATCH] Row ${rowNumber}: No name column found`);
        unmatched.push({
          rowNumber,
          employeeId: `ROW-${rowNumber}`,
          employeeName: 'UNKNOWN',
          rawData: JSON.stringify(row),
          success: false,
          employeeFound: false,
          error: 'No name column found in Excel row',
        });
        continue;
      }

      const excelName = row[nameColumn].toString().trim();
      const normalizedExcelName = this.normalizeName(excelName);

      console.log(`[BIOMETRIC-NAME-MATCH] Row ${rowNumber}: Excel Name="${excelName}", Normalized="${normalizedExcelName}"`);

      const matchingEmployees = employeesByNormalizedName.get(normalizedExcelName) || [];

      if (matchingEmployees.length === 0) {
        // No match found
        console.log(`[BIOMETRIC-NAME-MATCH] ❌ Row ${rowNumber}: No HRMS employee found with name "${excelName}"`);
        unmatched.push({
          rowNumber,
          employeeId: excelName,
          employeeName: excelName,
          rawData: JSON.stringify(row),
          success: false,
          employeeFound: false,
          error: `Employee not found by name: "${excelName}"`,
        });
      } else if (matchingEmployees.length === 1) {
        // Exact single match - SAFE
        const employee = matchingEmployees[0];
        console.log(`[BIOMETRIC-NAME-MATCH] ✅ Row ${rowNumber}: Matched "${excelName}" → ${employee.employeeId} (${employee.firstName} ${employee.lastName})`);
        
        matched.push({
          rowNumber,
          employeeId: employee.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          rawData: JSON.stringify(row),
          success: true,
          employeeFound: true,
          matchedEmployeeUUID: employee.id,
        });
        
        matchedEmployeeIds.add(employee.id);
      } else {
        // Multiple employees with same name - AMBIGUOUS
        const employeeIds = matchingEmployees.map(e => e.employeeId).join(', ');
        console.log(
          `[BIOMETRIC-NAME-MATCH] ⚠️ Row ${rowNumber}: AMBIGUOUS - "${excelName}" matches ${matchingEmployees.length} employees: ${employeeIds}`
        );
        
        ambiguous.push({
          rowNumber,
          employeeId: excelName,
          employeeName: excelName,
          rawData: JSON.stringify(row),
          success: false,
          employeeFound: false,
          error: `Multiple employees found with name "${excelName}": ${employeeIds}. Cannot determine which employee.`,
        });
      }
    }

    this.logger.log(
      `[BIOMETRIC-NAME-MATCH] ✅ Matching complete: ${matched.length} matched, ${unmatched.length} unmatched, ${ambiguous.length} ambiguous`
    );
    
    // Merge unmatched and ambiguous for backward compatibility
    // Both are treated as failed imports
    const allUnmatched = [...unmatched, ...ambiguous];
    
    return { matched, unmatched: allUnmatched, matchedEmployeeIds };
  }

  /**
   * ✅ NEW: Normalize name for safe matching
   * - Converts to lowercase
   * - Trims whitespace
   * - Collapses multiple spaces to single space
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * ✅ NEW: Detect name column from Excel headers
   */
  private detectNameColumn(columns: string[]): string | null {
    const normalizeColumn = (col: string) => col.toLowerCase().replace(/[\s_-]/g, '');
    
    const namePatterns = ['agentname', 'employeename', 'name', 'fullname', 'staffname', 'empname'];

    for (const col of columns) {
      const normalized = normalizeColumn(col);
      if (namePatterns.some(p => normalized === p || normalized.includes(p))) {
        this.logger.log(`✅ Detected name column: "${col}"`);
        return col;
      }
    }

    return null;
  }

  /**
   * ✅ NEW: Import raw attendance row (flexible format)
   */
  private async importRawAttendanceRow(
    row: ExcelRowImportResult,
    organizationId: string,
    importHistoryId: string,
    fileName: string, // ✅ ADD: Pass filename to extract month/year
  ) {
    const rawData = row.rawData || JSON.stringify({});
    const parsedData = JSON.parse(rawData);

    // ✅ EXTRACT ATTENDANCE MONTH/YEAR FROM EXCEL DATA
    // Priority 1: Period row (e.g., "Period : 2026/09/01 ~ 09/12 (fcs)")
    // Priority 2: Week columns (e.g., "Wk 03-09 Aug", "Wk 10-16 Sep")
    // Priority 3: Filename (e.g., "September_2026.xlsx")
    // Priority 4: Excel column data
    let attendanceMonth: number | null = null;
    let attendanceYear: number | null = null;

    // Strategy 1: Extract from Period row/column (HIGHEST PRIORITY)
    const columns = Object.keys(parsedData);
    for (const col of columns) {
      if (/period/i.test(col) && parsedData[col]) {
        const periodValue = parsedData[col].toString();
        // Pattern: "Period : 2026/09/01 ~ 09/12 (fcs)" or "2026/09/01 ~ 09/12"
        const periodMatch = periodValue.match(/(\d{4})\/(\d{2})\/(\d{2})\s*~\s*(\d{2})\/(\d{2})/);
        if (periodMatch) {
          attendanceYear = parseInt(periodMatch[1]);
          attendanceMonth = parseInt(periodMatch[2]);
          this.logger.log(`✅ Detected Period from Excel: ${periodValue}`);
          this.logger.log(`✅ Extracted: Year=${attendanceYear}, Month=${attendanceMonth}`);
          break;
        }
      }
    }

    // Strategy 2: Extract from week columns (e.g., "Wk 03-09 Aug", "Wk 10-16 Sep")
    if (attendanceMonth === null || attendanceYear === null) {
      const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                               'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      
      for (const col of columns) {
        // Match pattern like "Wk 03-09 Aug" or "Week 1-7 Sep"
        const weekMatch = col.match(/wk?\s*\d+-\d+\s*(\w{3})/i);
        if (weekMatch) {
          const monthAbbr = weekMatch[1].toLowerCase();
          const monthIndex = monthNamesShort.findIndex(m => monthAbbr.startsWith(m));
          if (monthIndex !== -1) {
            attendanceMonth = monthIndex + 1;
            this.logger.log(`✅ Detected attendance month from week column "${col}": ${monthAbbr} (${attendanceMonth})`);
            break;
          }
        }
      }
      
      // Year from week columns or filename
      if (attendanceYear === null) {
        const yearMatch = fileName.match(/20\d{2}/);
        if (yearMatch) {
          attendanceYear = parseInt(yearMatch[0]);
          this.logger.log(`✅ Detected attendance year from filename: ${attendanceYear}`);
        } else {
          // Default to current year if not found
          attendanceYear = new Date().getFullYear();
          this.logger.log(`⚠️ No year found, defaulting to current year: ${attendanceYear}`);
        }
      }
    }

    // Strategy 3: Extract from filename (if Period/Week not found)
    if (attendanceMonth === null || attendanceYear === null) {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      const lowerFileName = fileName.toLowerCase();
      
      // Find month name in filename
      if (attendanceMonth === null) {
        for (let i = 0; i < monthNames.length; i++) {
          if (lowerFileName.includes(monthNames[i])) {
            attendanceMonth = i + 1; // 1-12
            this.logger.log(`✅ Detected attendance month from filename: ${monthNames[i]} (${attendanceMonth})`);
            break;
          }
        }
      }
      
      // Find year in filename (pattern: 2024, 2025, 2026, etc.)
      if (attendanceYear === null) {
        const yearMatch = fileName.match(/20\d{2}/);
        if (yearMatch) {
          attendanceYear = parseInt(yearMatch[0]);
          this.logger.log(`✅ Detected attendance year from filename: ${attendanceYear}`);
        }
      }
    }

    // Strategy 3: Look for month/year in Excel column names or data
    if (attendanceMonth === null || attendanceYear === null) {
      for (const col of columns) {
        if (attendanceMonth === null && /month|mth/i.test(col) && parsedData[col]) {
          const monthMatch = parsedData[col].toString().match(/(\d{1,2})/);
          if (monthMatch) {
            attendanceMonth = parseInt(monthMatch[1]);
            this.logger.log(`✅ Detected attendance month from Excel data: ${attendanceMonth}`);
          }
        }
        if (attendanceYear === null && /year|yr/i.test(col) && parsedData[col]) {
          const yearMatch = parsedData[col].toString().match(/(\d{4})/);
          if (yearMatch) {
            attendanceYear = parseInt(yearMatch[1]);
            this.logger.log(`✅ Detected attendance year from Excel data: ${attendanceYear}`);
          }
        }
      }
    }

    // Strategy 4: Look for date patterns in column values
    if (attendanceMonth === null || attendanceYear === null) {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      for (const col of columns) {
        const value = parsedData[col];
        if (typeof value === 'string') {
          // Try to find date patterns like "01-Aug-2026" or "August 2026"
          if (attendanceMonth === null) {
            for (let i = 0; i < monthNames.length; i++) {
              if (value.toLowerCase().includes(monthNames[i])) {
                attendanceMonth = i + 1;
                this.logger.log(`✅ Detected attendance month from cell value: ${monthNames[i]} (${attendanceMonth})`);
                break;
              }
            }
          }
          if (attendanceYear === null) {
            const yearInValue = value.match(/20\d{2}/);
            if (yearInValue) {
              attendanceYear = parseInt(yearInValue[0]);
              this.logger.log(`✅ Detected attendance year from cell value: ${attendanceYear}`);
            }
          }
        }
      }
    }

    // ⚠️ FALLBACK: If still not found, log warning
    // DO NOT use current date - this would be the upload date, not attendance period
    if (attendanceMonth === null || attendanceYear === null) {
      this.logger.warn(
        `⚠️ Could not detect attendance month/year from filename "${fileName}" or Excel data. ` +
        `This attendance record will need manual month/year assignment.`
      );
      // Store null values - frontend will need to handle this
      attendanceMonth = null;
      attendanceYear = null;
    }

    // Create raw attendance record
    // ✅ attendanceMonth/attendanceYear = ATTENDANCE PERIOD (e.g., August 2026)
    // ✅ createdAt (auto) = UPLOAD DATE (e.g., September 2026)
    await this.prisma.rawAttendanceRecord.create({
      data: {
        organizationId,
        importHistoryId,
        employeeId: row.matchedEmployeeUUID || null,
        originalIdentifier: row.employeeId,
        originalName: row.employeeName,
        rawData: rawData,
        attendanceMonth, // ✅ Attendance period month (from filename/content)
        attendanceYear,  // ✅ Attendance period year (from filename/content)
        isMatched: !!row.matchedEmployeeUUID,
        matchedAt: row.matchedEmployeeUUID ? new Date() : null,
        matchingNote: row.employeeFound ? 'Auto-matched by identifier' : row.error || 'No match found',
        // createdAt is auto-set to NOW (upload date)
      },
    });
  }

  /**
   * ✅ NEW: Generate warnings for flexible format
   */
  private generateFlexibleWarnings(matchResults: any, identifierColumn: string | null): string[] {
    const warnings: string[] = [];

    if (!identifierColumn) {
      warnings.push(
        'No employee identifier column detected (Agent ID, Employee ID, etc.). ' +
        'All records will be imported as unmatched. Please ensure your Excel contains an identifier column.'
      );
    }

    if (matchResults.unmatched.length > 0) {
      warnings.push(
        `${matchResults.unmatched.length} records could not be matched to employees in the system. ` +
        `These will be stored but not visible to employees until matched.`
      );
    }

    if (matchResults.matched.length === 0) {
      warnings.push(
        'No records were matched to employees. Please verify that employee identifiers in Excel match those in the HRMS system.'
      );
    }

    return warnings;
  }

  private getRawDateValue(rawData?: string): string {
    if (!rawData) return '';
    try {
      const data = JSON.parse(rawData);
      const candidates = [
        'Date',
        'Attendance Date',
        'attendanceDate',
        'date',
        'AttendanceDate',
      ];
      for (const key of Object.keys(data)) {
        if (candidates.includes(key) || /date/i.test(key)) {
          const value = data[key];
          if (value) return String(value).trim();
        }
      }
    } catch {
      // ignore parse errors; rawData is not guaranteed to be JSON
    }
    return '';
  }

  private getRawTimeValue(rawData?: string, type: 'checkin' | 'checkout' = 'checkin'): string {
    if (!rawData) return '';
    try {
      const data = JSON.parse(rawData);
      const patterns = type === 'checkin'
        ? ['Check In', 'CheckIn', 'checkIn', 'Time In', 'timeIn', 'In Time', 'inTime']
        : ['Check Out', 'CheckOut', 'checkOut', 'Time Out', 'timeOut', 'Out Time', 'outTime'];
      for (const key of Object.keys(data)) {
        const matches = patterns.includes(key) || new RegExp(type, 'i').test(key);
        if (matches) {
          const value = data[key];
          if (value) return String(value).trim();
        }
      }
    } catch {
      // ignore parse errors
    }
    return '';
  }

  private getRawStatusValue(rawData?: string): string {
    if (!rawData) return AttendanceStatus.PRESENT;
    try {
      const data = JSON.parse(rawData);
      for (const key of Object.keys(data)) {
        if (/status/i.test(key)) {
          const value = data[key];
          if (value) return String(value).trim().toUpperCase();
        }
      }
    } catch {
      // ignore parse errors
    }
    return AttendanceStatus.PRESENT;
  }

  private async persistUploadedFile(session: ImportSession, historyId: string): Promise<string> {
    if (!session.fileBuffer) {
      this.logger.warn(`No file buffer found for import session ${session.sessionId}`);
      return '';
    }

    const targetDir = join(process.cwd(), 'uploads', 'attendance');
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, `${historyId}.xlsx`);
    await fs.writeFile(targetPath, session.fileBuffer);

    return join('uploads', 'attendance', `${historyId}.xlsx`);
  }

  /**
   * ✅ FLEXIBLE ATTENDANCE IMPORT: Handles BOTH status codes AND biometric punch times
   * Supports multiple Excel formats:
   * 1. Status code format: Day columns "01 Sat", "02 Sun" with values "P", "WO", "A", "H"
   * 2. Biometric format: Day columns "1", "2" with punch times "08:53\n18:06"
   */
  private async importFlexibleAttendanceRow(
    row: ExcelRowImportResult,
    organizationId: string,
    userId: string,
    fileName: string,
  ) {
    // Skip if no matched employee
    if (!row.matchedEmployeeUUID || !row.rawData) {
      this.logger.warn(`[ATTENDANCE-IMPORT] Skipping row - no matched employee or raw data`);
      return;
    }

    // Parse raw data from Excel
    const rawData = JSON.parse(row.rawData);
    
    console.log(`[ATTENDANCE-IMPORT] Processing row for employee: ${row.employeeId}`);
    const allColumns = Object.keys(rawData);
    console.log(`[ATTENDANCE-IMPORT] Raw data columns (first 15): ${allColumns.slice(0, 15).join(', ')}...`);

    // Extract month and year from stored raw record
    const rawRecord = await this.prisma.rawAttendanceRecord.findFirst({
      where: {
        employeeId: row.matchedEmployeeUUID,
        originalName: row.employeeName,
      },
      orderBy: { createdAt: 'desc' },
      select: { attendanceMonth: true, attendanceYear: true }
    });

    let attendanceMonth = rawRecord?.attendanceMonth;
    let attendanceYear = rawRecord?.attendanceYear;

    // Fallback: Extract from filename if not in raw record
    if (!attendanceMonth || !attendanceYear) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'];
      
      const lowerFileName = fileName.toLowerCase();
      
      for (let i = 0; i < monthNames.length; i++) {
        if (lowerFileName.includes(monthNames[i])) {
          attendanceMonth = i + 1;
          break;
        }
      }
      
      const yearMatch = fileName.match(/20\d{2}/);
      if (yearMatch) {
        attendanceYear = parseInt(yearMatch[0]);
      }
    }

    if (!attendanceMonth || !attendanceYear) {
      this.logger.error(`[ATTENDANCE-IMPORT] Could not determine month/year for ${row.employeeId}`);
      return;
    }

    console.log(`[ATTENDANCE-IMPORT] Period: ${attendanceYear}-${String(attendanceMonth).padStart(2, '0')}`);

    // Find day columns - supports multiple formats:
    // Format 1: "01 Sat", "02 Sun", "03 Mon" etc.
    // Format 2: "1", "2", "3" etc.
    const dayColumnPattern1 = /^(\d{2})\s+\w{3}$/; // "01 Sat"
    const dayColumnPattern2 = /^(\d+)$/; // "1", "2", "3"
    
    const dayColumns = allColumns.filter(col => {
      return dayColumnPattern1.test(col) || dayColumnPattern2.test(col);
    });
    
    console.log(`[ATTENDANCE-IMPORT] Found ${dayColumns.length} day columns`);
    if (dayColumns.length > 0) {
      console.log(`[ATTENDANCE-IMPORT] Sample day columns: ${dayColumns.slice(0, 5).join(', ')}`);
    }

    let recordsCreated = 0;
    let recordsSkipped = 0;

    // Get shift start time for default check-in
    const shiftStartStr = rawData['Shift Start'] || rawData['shift_start'] || rawData['Shift'] || '10:00';
    const defaultShiftHour = 10;
    const defaultShiftMinute = 0;

    // Process each day column
    for (const dayCol of dayColumns) {
      // Extract day number from column name
      let dayNum: number;
      const match1 = dayCol.match(dayColumnPattern1);
      const match2 = dayCol.match(dayColumnPattern2);
      
      if (match1) {
        dayNum = parseInt(match1[1]);
      } else if (match2) {
        dayNum = parseInt(match2[1]);
      } else {
        continue;
      }

      if (dayNum < 1 || dayNum > 31) continue;

      const cellValue = rawData[dayCol];
      if (!cellValue || cellValue === '') {
        recordsSkipped++;
        continue;
      }

      const valueStr = cellValue.toString().trim();
      if (!valueStr) {
        recordsSkipped++;
        continue;
      }

      console.log(`[ATTENDANCE-IMPORT] Day ${dayNum} ("${dayCol}"): Value = "${valueStr}"`);

      // Determine if this is status code format or punch time format
      const isPunchTimeFormat = /\d{1,2}:\d{2}/.test(valueStr);
      
      let attendanceStatus: string;
      let checkInTime: Date | null = null;
      let checkOutTime: Date | null = null;
      let workingHours = 0;
      let lateBy = 0;

      if (isPunchTimeFormat) {
        // BIOMETRIC PUNCH FORMAT: "08:53" or "08:53\n18:06"
        console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: Detected PUNCH TIME format`);
        
        const punches = valueStr
          .split(/[\n\r]+/)
          .map(p => p.trim())
          .filter(p => /^\d{1,2}:\d{2}$/.test(p));

        if (punches.length === 0) {
          console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: No valid punch times, skipping`);
          recordsSkipped++;
          continue;
        }

        const firstPunch = punches[0];
        const lastPunch = punches.length > 1 ? punches[punches.length - 1] : null;

        checkInTime = this.parsePunchDateTime(attendanceYear, attendanceMonth, dayNum, firstPunch);
        if (lastPunch) {
          checkOutTime = this.parsePunchDateTime(attendanceYear, attendanceMonth, dayNum, lastPunch);
        }

        workingHours = checkInTime && checkOutTime
          ? (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
          : 0;

        attendanceStatus = this.calculateBiometricAttendanceStatus(checkInTime, checkOutTime, workingHours);
        lateBy = this.calculateLateMinutes(checkInTime);

        console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: Punches: ${firstPunch} - ${lastPunch || 'N/A'}, Status: ${attendanceStatus}`);
      } else {
        // STATUS CODE FORMAT: "P", "WO", "A", "H", "1", "0", "0.5" etc.
        console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: Detected STATUS CODE format`);
        
        const statusCode = valueStr.toUpperCase();
        
        // Map status codes to AttendanceStatus enum
        // ✅ SUPPORT NUMERIC CODES: "1" = Present, "0" = Absent, "0.5" = Half Day
        switch (statusCode) {
          case 'P':
          case '1':
            attendanceStatus = AttendanceStatus.PRESENT;
            checkInTime = new Date(Date.UTC(attendanceYear, attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
            checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours later
            workingHours = 9;
            break;
          case 'A':
          case '0':
            attendanceStatus = AttendanceStatus.ABSENT;
            break;
          case 'H':
          case 'HD':
          case '0.5':
            attendanceStatus = AttendanceStatus.HALF_DAY;
            checkInTime = new Date(Date.UTC(attendanceYear, attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
            checkOutTime = new Date(checkInTime.getTime() + 5 * 60 * 60 * 1000); // 5 hours
            workingHours = 5;
            break;
          case 'WO':
          case 'W':
            attendanceStatus = AttendanceStatus.WEEK_OFF;
            break;
          case 'L':
            attendanceStatus = AttendanceStatus.LATE;
            checkInTime = new Date(Date.UTC(attendanceYear, attendanceMonth - 1, dayNum, defaultShiftHour + 1, 0, 0)); // 1 hour late
            checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
            workingHours = 9;
            lateBy = 60;
            break;
          case 'LV':
          case 'LEAVE':
            attendanceStatus = AttendanceStatus.LEAVE;
            break;
          case 'HOL':
          case 'HOLIDAY':
            attendanceStatus = AttendanceStatus.HOLIDAY;
            break;
          default:
            console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: Unknown status code "${statusCode}", skipping`);
            recordsSkipped++;
            continue;
        }

        console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: Status code "${statusCode}" → ${attendanceStatus}`);
      }

      // Create attendance date
      const attendanceDate = new Date(Date.UTC(attendanceYear, attendanceMonth - 1, dayNum, 0, 0, 0, 0));

      // Save to Attendance table
      try {
        const existing = await this.prisma.attendance.findUnique({
          where: {
            organizationId_employeeId_date: {
              organizationId,
              employeeId: row.matchedEmployeeUUID,
              date: attendanceDate,
            },
          },
        });

        const attendanceData = {
          organizationId,
          employeeId: row.matchedEmployeeUUID,
          date: attendanceDate,
          checkInTime,
          checkOutTime,
          workingHours,
          status: attendanceStatus,
          lateBy,
          source: AttendanceSource.MANUAL,
          isManualEntry: true,
          approvedBy: userId,
          approvedAt: new Date(),
          remarks: `Imported from Excel: ${fileName}`,
        };

        if (existing) {
          await this.prisma.attendance.update({
            where: { id: existing.id },
            data: attendanceData,
          });

          await this.prisma.attendanceHistory.create({
            data: {
              attendanceId: existing.id,
              field: 'EXCEL_IMPORT_UPDATE',
              oldValue: JSON.stringify({ status: existing.status }),
              newValue: JSON.stringify({ status: attendanceStatus }),
              reason: `Excel Import Update: ${fileName}`,
              changedBy: userId,
            },
          });

          console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: UPDATED record ${existing.id}`);
        } else {
          const created = await this.prisma.attendance.create({
            data: attendanceData,
          });

          await this.prisma.attendanceHistory.create({
            data: {
              attendanceId: created.id,
              field: 'EXCEL_IMPORT_CREATE',
              newValue: JSON.stringify({ status: attendanceStatus }),
              reason: `Excel Import: ${fileName}`,
              changedBy: userId,
            },
          });

          console.log(`[ATTENDANCE-IMPORT] Day ${dayNum}: CREATED record ${created.id}`);
        }

        recordsCreated++;
      } catch (error) {
        this.logger.error(`[ATTENDANCE-IMPORT] Day ${dayNum}: FAILED - ${error.message}`);
        recordsSkipped++;
      }
    }

    console.log(`[ATTENDANCE-IMPORT] ✅ Employee ${row.employeeId}: ${recordsCreated} created, ${recordsSkipped} skipped`);
  }

  /**
   * ✅ NEW: Parse biometric punch time to full DateTime
   * Converts "08:53" to Date object for specific day
   */
  private parsePunchDateTime(year: number, month: number, day: number, timeStr: string): Date {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    // Create UTC DateTime for the punch
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }

  /**
   * ✅ NEW: Calculate attendance status based on biometric punch times
   * Late threshold: 10:05 AM (as per user requirement)
   */
  private calculateBiometricAttendanceStatus(
    checkInTime: Date | null,
    checkOutTime: Date | null,
    workingHours: number,
  ): string {
    if (!checkInTime) {
      return AttendanceStatus.ABSENT;
    }

    // Get check-in hour in UTC
    const checkInHour = checkInTime.getUTCHours();
    const checkInMinute = checkInTime.getUTCMinutes();
    const checkInMinutes = checkInHour * 60 + checkInMinute;

    // ✅ Late threshold: 10:05 AM (exactly)
    const lateThresholdMinutes = 10 * 60 + 5; // 10:05 AM

    // Check if Monday (Week Off) - getUTCDay() returns 0 for Sunday, 1 for Monday
    if (checkInTime.getUTCDay() === 1) {
      return AttendanceStatus.WEEK_OFF;
    }

    // Late check
    if (checkInMinutes > lateThresholdMinutes) {
      return AttendanceStatus.LATE;
    }

    // Half day check (less than 6 hours)
    if (checkOutTime && workingHours < 6) {
      return AttendanceStatus.HALF_DAY;
    }

    // Default: Present
    return AttendanceStatus.PRESENT;
  }

  /**
   * ✅ NEW: Calculate late minutes based on check-in time
   * Late threshold: 10:05 AM (as per user requirement)
   */
  private calculateLateMinutes(checkInTime: Date | null): number {
    if (!checkInTime) {
      return 0;
    }

    const checkInHour = checkInTime.getUTCHours();
    const checkInMinute = checkInTime.getUTCMinutes();
    const checkInMinutes = checkInHour * 60 + checkInMinute;

    // ✅ Late threshold: 10:05 AM (exactly, no grace period beyond this)
    const lateThresholdMinutes = 10 * 60 + 5; // 10:05 AM

    if (checkInMinutes > lateThresholdMinutes) {
      return checkInMinutes - lateThresholdMinutes;
    }

    return 0;
  }
}