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

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // ✅ Import ALL rows as raw attendance records
    for (const row of allRows) {
      try {
        await this.importRawAttendanceRow(row, organizationId, importHistory.id);
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
   * ✅ NEW: Match employees from flexible Excel format
   */
  private async matchEmployees(
    rows: any[],
    organizationId: string,
    identifierColumn: string | null,
  ) {
    const matched: ExcelRowImportResult[] = [];
    const unmatched: ExcelRowImportResult[] = [];
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

    this.logger.log(`Found ${employees.length} employees in organization`);

    // Create lookup maps
    const employeeByIdMap = new Map(
      employees.map(e => [e.employeeId.toLowerCase().trim(), e])
    );
    
    const employeeByNameMap = new Map(
      employees.map(e => [`${e.firstName} ${e.lastName}`.toLowerCase().trim(), e])
    );

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // Excel row (header = row 1)
      const row = rows[i];

      let matchedEmployee: typeof employees[0] | undefined = undefined;
      let originalIdentifier: string | null = null;
      let matchMethod = 'NONE';

      // Strategy 1: Try to match using identifier column
      if (identifierColumn && row[identifierColumn]) {
        originalIdentifier = row[identifierColumn].toString().trim();
        if (originalIdentifier) {
          const lookupKey = originalIdentifier.toLowerCase().trim();
          matchedEmployee = employeeByIdMap.get(lookupKey);
          if (matchedEmployee) {
            matchMethod = 'ID';
            this.logger.log(`Row ${rowNumber}: Matched by ID "${originalIdentifier}" -> ${matchedEmployee.employeeId}`);
          }
        }
      }

      // Strategy 2: Try to match by name if ID match failed
      if (!matchedEmployee) {
        const nameColumn = this.detectNameColumn(Object.keys(row));
        if (nameColumn && row[nameColumn]) {
          const originalName = row[nameColumn].toString().trim();
          const lookupKey = originalName.toLowerCase().trim();
          matchedEmployee = employeeByNameMap.get(lookupKey);
          if (matchedEmployee) {
            matchMethod = 'NAME';
            originalIdentifier = originalIdentifier || originalName;
            this.logger.log(`Row ${rowNumber}: Matched by NAME "${originalName}" -> ${matchedEmployee.employeeId}`);
          }
        }
      }

      // Extract name for display
      const nameColumn = this.detectNameColumn(Object.keys(row));
      const originalName = nameColumn ? row[nameColumn]?.toString().trim() : (originalIdentifier || 'UNKNOWN');

      const result: ExcelRowImportResult = {
        rowNumber,
        employeeId: originalIdentifier || originalName || `ROW-${rowNumber}`,
        employeeName: originalName,
        rawData: JSON.stringify(row), // ✅ Store complete row as JSON
        success: !!matchedEmployee,
        employeeFound: !!matchedEmployee,
        matchedEmployeeUUID: matchedEmployee?.id,
      };

      if (matchedEmployee) {
        result.employeeName = `${matchedEmployee.firstName} ${matchedEmployee.lastName}`;
        matchedEmployeeIds.add(matchedEmployee.id);
        matched.push(result);
      } else {
        result.error = `No match found (tried ID: "${originalIdentifier || 'N/A'}", Name: "${originalName}")`;
        unmatched.push(result);
      }
    }

    this.logger.log(`✅ Matching complete: ${matched.length} matched, ${unmatched.length} unmatched`);
    
    return { matched, unmatched, matchedEmployeeIds };
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
  ) {
    const rawData = row.rawData || JSON.stringify({});
    const parsedData = JSON.parse(rawData);

    // Try to extract month/year if identifiable
    let attendanceMonth: number | null = null;
    let attendanceYear: number | null = null;

    // Look for month/year in column names or data
    const columns = Object.keys(parsedData);
    
    // Strategy 1: Look for explicit month/year columns or data
    for (const col of columns) {
      if (/month|mth/i.test(col) && parsedData[col]) {
        const monthMatch = parsedData[col].toString().match(/(\d{1,2})/);
        if (monthMatch) attendanceMonth = parseInt(monthMatch[1]);
      }
      if (/year|yr/i.test(col) && parsedData[col]) {
        const yearMatch = parsedData[col].toString().match(/(\d{4})/);
        if (yearMatch) attendanceYear = parseInt(yearMatch[1]);
      }
    }

    // Strategy 2: If not found, use current month/year
    // This ensures uploaded attendance is visible for the current month
    if (attendanceMonth === null || attendanceYear === null) {
      const now = new Date();
      attendanceMonth = now.getMonth() + 1; // 1-12
      attendanceYear = now.getFullYear();
      this.logger.log(`No month/year detected in Excel, using current: ${attendanceMonth}/${attendanceYear}`);
    }

    // Create raw attendance record
    await this.prisma.rawAttendanceRecord.create({
      data: {
        organizationId,
        importHistoryId,
        employeeId: row.matchedEmployeeUUID || null,
        originalIdentifier: row.employeeId,
        originalName: row.employeeName,
        rawData: rawData,
        attendanceMonth,
        attendanceYear,
        isMatched: !!row.matchedEmployeeUUID,
        matchedAt: row.matchedEmployeeUUID ? new Date() : null,
        matchingNote: row.employeeFound ? 'Auto-matched by identifier' : row.error || 'No match found',
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
}