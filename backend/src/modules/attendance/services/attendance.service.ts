/**
 * ATTENDANCE SERVICE
 *
 * CORE BUSINESS LOGIC for attendance management.
 *
 * KEY PRINCIPLE: This service communicates ONLY with IAttendanceProvider interface.
 * It NEVER directly uses ManualAttendanceProvider, BiometricProvider, etc.
 *
 * This ensures:
 * 1. Business logic is decoupled from attendance source
 * 2. New providers can be added without changing this service
 * 3. Provider can be switched at runtime
 * 4. Easy testing with mock providers
 *
 * ARCHITECTURE:
 * Employee/HR -> Controller -> AttendanceService -> AttendanceProviderRegistry -> ActiveProvider
 *                                                                                  (Manual/Biometric/RFID/etc.)
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../../common/constants';
import { AttendanceProviderRegistry } from '../providers/provider.registry';
import {
  AttendanceEventType,
  AttendanceStatus,
  AttendanceSource,
} from '../enums';
import {
  CheckInDto,
  CheckOutDto,
  ManualAttendanceDto,
  GetAttendanceQueryDto,
  GetMonthlyAttendanceDto,
} from '../dto';
import { IAttendanceEvent } from '../interfaces/attendance-event.interface';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
  differenceInHours,
  format,
  parseISO,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  getAttendanceBusinessDate,
  getAttendanceDayBoundaries,
  formatAttendanceDateLog,
  getIndianCalendarDate,
} from '../utils/attendance-date.util';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: AttendanceProviderRegistry,
  ) {}

  /**
   * Helper method to check if user has HR role
   * Supports: HR, HR_ADMIN, HR_USER
   */
  private isHRRole(roleName: string): boolean {
    return ['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'].includes(roleName);
  }

  /**
   * CHECK-IN
   * Employee marks attendance (check-in)
   * Uses ACTIVE PROVIDER (Manual/Biometric/RFID/etc.)
   */
  async checkIn(employeeId: string, dto: CheckInDto, userId: string) {
    this.logger.log(`Check-in request for employee: ${employeeId}`);

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify user owns this employee record (or is HR)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.isHRRole(user.role.name) && employee.userId !== userId) {
      throw new ForbiddenException('You can only mark your own attendance');
    }

    // ============================================
    // BUSINESS RULE: MONDAY = WEEK OFF
    // ============================================
    // Check if today is Monday using Asia/Kolkata timezone
    const timestamp = dto.timestamp ? parseISO(dto.timestamp) : new Date();
    const zonedDate = toZonedTime(timestamp, 'Asia/Kolkata');
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
    
    if (dayOfWeek === 1) { // Monday
      this.logger.log(`[ATTENDANCE-CHECKIN] Monday detected - WEEK OFF`);
      throw new BadRequestException('Today is a weekly off.');
    }

    // Get active provider (Manual/Biometric/RFID/etc.)
    const provider = await this.providerRegistry.getActiveProvider();
    this.logger.log(`Using provider: ${provider.getName()}`);

    // Prepare attendance event
    const attendanceEvent: Partial<IAttendanceEvent> = {
      employeeId,
      eventType: AttendanceEventType.CHECK_IN,
      timestamp,
      source: provider.getSource(),
      deviceType: dto.deviceType,
      location: dto.location,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      rawData: dto,
    };

    // Record attendance using provider
    const recordedEvent = await provider.recordAttendance(attendanceEvent);

    // Save/update attendance in database (handles both create and update)
    const attendance = await this.upsertCheckIn(
      employee,
      recordedEvent,
      dto.remarks,
    );

    // Log attendance event
    await this.logAttendanceEvent(recordedEvent, attendance.id);

    this.logger.log(`[ATTENDANCE-API] Check-in successful for employee: ${employeeId}`);
    this.logger.log(`[ATTENDANCE-API] Attendance record: ${JSON.stringify({
      id: attendance.id,
      date: attendance.date,
      status: attendance.status,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      workingHours: attendance.workingHours
    })}`);

    return {
      success: true,
      message: 'Checked in successfully',
      attendance,
    };
  }

  /**
   * CHECK-OUT
   * Employee marks attendance (check-out)
   * Uses ACTIVE PROVIDER
   */
  async checkOut(employeeId: string, dto: CheckOutDto, userId: string) {
    this.logger.log(`Check-out request for employee: ${employeeId}`);

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify user owns this employee record (or is HR)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.isHRRole(user.role.name) && employee.userId !== userId) {
      throw new ForbiddenException('You can only mark your own attendance');
    }

    // ============================================
    // BUSINESS RULE: MONDAY = WEEK OFF
    // ============================================
    // Check if today is Monday using Asia/Kolkata timezone
    const checkoutTimestamp = dto.timestamp ? parseISO(dto.timestamp) : new Date();
    const zonedDate = toZonedTime(checkoutTimestamp, 'Asia/Kolkata');
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
    
    if (dayOfWeek === 1) { // Monday
      this.logger.log(`[ATTENDANCE-CHECKOUT] Monday detected - WEEK OFF`);
      throw new BadRequestException('Today is a weekly off.');
    }

    // Check if checked in today
    const businessDate = getAttendanceBusinessDate();
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        organizationId: employee.organizationId,
        date: businessDate,
      },
    });

    if (!existingAttendance || !existingAttendance.checkInTime) {
      throw new BadRequestException('Please check in first');
    }

    if (existingAttendance.checkOutTime) {
      throw new BadRequestException('Already checked out today');
    }

    // Get active provider
    const provider = await this.providerRegistry.getActiveProvider();
    this.logger.log(`Using provider: ${provider.getName()}`);

    // Prepare attendance event using the same timestamp
    const attendanceEvent: Partial<IAttendanceEvent> = {
      employeeId,
      eventType: AttendanceEventType.CHECK_OUT,
      timestamp: checkoutTimestamp,
      source: provider.getSource(),
      deviceType: dto.deviceType,
      location: dto.location,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      rawData: dto,
    };

    // Record attendance using provider
    const recordedEvent = await provider.recordAttendance(attendanceEvent);

    // Update attendance with checkout
    const attendance = await this.updateCheckOut(
      existingAttendance,
      recordedEvent,
      dto.remarks,
    );

    // Log attendance event
    await this.logAttendanceEvent(recordedEvent, attendance.id);

    this.logger.log(`Check-out successful for employee: ${employeeId}`);

    return {
      success: true,
      message: 'Checked out successfully',
      attendance,
    };
  }

  /**
   * UPSERT CHECK-IN
   * Create or update attendance record for check-in
   * Uses deterministic find-then-create/update pattern
   */
  private async upsertCheckIn(
    employee: any,
    event: IAttendanceEvent,
    remarks?: string,
  ) {
    // STEP 1: Normalize business date ONCE using canonical utility
    // CRITICAL: Returns Date object at midnight UTC for IST calendar date
    // This ensures the EXACT SAME date value is used for findUnique and create
    const businessDate = getAttendanceBusinessDate(event.timestamp);
    
    // STEP 2: Extract consistent keys
    const lookupKey = {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      date: businessDate, // Date object: e.g., 2026-08-14T00:00:00.000Z
    };
    
    // STEP 3: Enhanced logging for debugging
    const indianDate = getIndianCalendarDate(event.timestamp);
    this.logger.log(`[ATTENDANCE-DATE] Current server timestamp: ${event.timestamp.toISOString()}`);
    this.logger.log(`[ATTENDANCE-DATE] Asia/Kolkata calendar date: ${indianDate.year}-${String(indianDate.month).padStart(2, '0')}-${String(indianDate.day).padStart(2, '0')} (${indianDate.dayOfWeek})`);
    this.logger.log(`[ATTENDANCE-DATE] Business date (UTC Date): ${businessDate.toISOString()}`);
    this.logger.log(`[ATTENDANCE-DATE] Business date (DATE value): ${businessDate.toISOString().split('T')[0]}`);
    
    this.logger.log(`[ATTENDANCE-CHECKIN] START`);
    this.logger.log(`[ATTENDANCE-CHECKIN] organizationId: ${lookupKey.organizationId}`);
    this.logger.log(`[ATTENDANCE-CHECKIN] employeeId: ${lookupKey.employeeId}`);
    this.logger.log(`[ATTENDANCE-CHECKIN] businessDate: ${lookupKey.date.toISOString()}`);

    // STEP 4: Calculate attendance metadata
    const shiftAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId: employee.id,
        isActive: true,
        effectiveFrom: { lte: new Date(businessDate) },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date(businessDate) } }],
      },
      include: { shift: true },
    });

    // ============================================
    // BUSINESS RULE: MONDAY = WEEK OFF (PRIORITY 1)
    // ============================================
    // Check if this date is Monday using Asia/Kolkata timezone
    const zonedBusinessDate = toZonedTime(event.timestamp, 'Asia/Kolkata');
    const dayOfWeekNumber = zonedBusinessDate.getDay(); // 0 = Sunday, 1 = Monday
    
    let status = AttendanceStatus.PRESENT;
    let lateBy = 0;

    if (dayOfWeekNumber === 1) { // Monday
      this.logger.log(`[ATTENDANCE-CHECKIN] Monday detected - Setting status to WEEK_OFF`);
      status = AttendanceStatus.WEEK_OFF;
      lateBy = 0; // No late marking on week off
    } else {
      // Check holiday first (only for non-Monday days)
      const holiday = await this.prisma.holiday.findFirst({
        where: {
          date: businessDate,
          OR: [{ departmentId: null }, { departmentId: employee.departmentId }],
        },
      });

      if (holiday) {
        status = AttendanceStatus.HOLIDAY;
      } else {
        // Check database week off (only for non-Monday days as fallback)
        const dayOfWeekName = format(new Date(businessDate), 'EEEE').toUpperCase();
        const weekOff = await this.prisma.weekOff.findFirst({
          where: {
            dayOfWeek: dayOfWeekName,
            isActive: true,
            effectiveFrom: { lte: new Date(businessDate) },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date(businessDate) } },
              { employeeId: null },
              { employeeId: employee.id },
            ],
          },
        });

        if (weekOff) {
          status = AttendanceStatus.WEEK_OFF;
        } else {
          // ============================================
          // NEW ATTENDANCE RULE: 10:05 AM CUTOFF
          // ============================================
          // Calculate late status only for working days (not WEEK_OFF or HOLIDAY)
          // Fixed cutoff: 10:05 AM Asia/Kolkata time
          // - 10:05 AM or before = PRESENT
          // - After 10:05 AM = LATE (initially)
          const zonedCheckInTime = toZonedTime(event.timestamp, 'Asia/Kolkata');
          const checkInHour = zonedCheckInTime.getHours();
          const checkInMinute = zonedCheckInTime.getMinutes();
          
          // Convert to minutes for comparison
          const checkInMinutes = checkInHour * 60 + checkInMinute;
          const cutoffMinutes = 10 * 60 + 5; // 10:05 AM = 605 minutes
          
          this.logger.log(
            `[ATTENDANCE-CHECKIN] Check-in time: ${checkInHour}:${String(checkInMinute).padStart(2, '0')} IST ` +
            `(${checkInMinutes} minutes) | Cutoff: 10:05 AM (${cutoffMinutes} minutes)`
          );
          
          if (checkInMinutes > cutoffMinutes) {
            // Late check-in detected
            lateBy = checkInMinutes - cutoffMinutes;
            status = AttendanceStatus.LATE;
            
            this.logger.log(
              `[ATTENDANCE-CHECKIN] Late check-in detected - ${lateBy} minutes late`
            );
            
            // ============================================
            // NEW RULE: 3 LATE DAYS IN SAME WEEK = HALF DAY
            // ============================================
            // Calculate the start of the current week (Sunday)
            const weekStart = new Date(businessDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go back to Sunday
            weekStart.setHours(0, 0, 0, 0);
            
            // Calculate the end of the current week (Saturday)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // Saturday
            weekEnd.setHours(23, 59, 59, 999);
            
            this.logger.log(
              `[ATTENDANCE-CHECKIN] Week range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`
            );
            
            // Count late attendance in the current week for THIS employee only
            // Exclude today's record from the count
            const lateCountInWeek = await this.prisma.attendance.count({
              where: {
                employeeId: employee.id,
                date: {
                  gte: weekStart,
                  lt: businessDate, // Don't count today
                },
                status: AttendanceStatus.LATE,
              },
            });
            
            this.logger.log(
              `[ATTENDANCE-CHECKIN] Late count in current week (excluding today): ${lateCountInWeek}`
            );
            
            // If this is the 3rd late occurrence in the week (2 previous + this one = 3), mark as HALF_DAY
            if (lateCountInWeek >= 2) {
              status = AttendanceStatus.HALF_DAY;
              this.logger.log(
                `[ATTENDANCE-CHECKIN] 3rd late occurrence in current week - Changing to HALF_DAY`
              );
            }
          } else {
            // On time
            this.logger.log(
              `[ATTENDANCE-CHECKIN] On-time check-in - Status: PRESENT`
            );
          }
        }
      }
    }

    // STEP 4: Prepare check-in data
    const checkInData = {
      checkInTime: event.timestamp,
      status,
      lateBy,
      source: event.source,
      deviceType: event.deviceType,
      location: event.location ? JSON.stringify(event.location) : null,
      ipAddress: event.ipAddress,
      isManualEntry: event.source === AttendanceSource.MANUAL,
      remarks,
    };

    // STEP 5: Find existing attendance using EXACT same keys
    this.logger.log(`[ATTENDANCE-CHECKIN] Finding existing record...`);
    
    const existing = await this.prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: lookupKey,
      },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        shift: true,
      },
    });

    // CASE A: Record exists
    if (existing) {
      this.logger.log(`[ATTENDANCE-CHECKIN] FOUND existing record`);
      this.logger.log(`[ATTENDANCE-CHECKIN] existingId: ${existing.id}`);
      this.logger.log(`[ATTENDANCE-CHECKIN] existingCheckIn: ${existing.checkInTime || 'NULL'}`);
      
      if (existing.checkInTime) {
        this.logger.warn(`[ATTENDANCE-CHECKIN] DUPLICATE - Already checked in`);
        throw new BadRequestException('You have already checked in today');
      }

      // Update existing record without checkInTime
      this.logger.log(`[ATTENDANCE-CHECKIN] DB OPERATION: UPDATE`);
      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: checkInData,
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          shift: true,
        },
      });

      this.logger.log(`[ATTENDANCE-CHECKIN] SUCCESS - Updated record ${updated.id}`);
      return updated;
    }

    // CASE B: No existing record - create new
    this.logger.log(`[ATTENDANCE-CHECKIN] NO existing record found`);
    this.logger.log(`[ATTENDANCE-CHECKIN] DB OPERATION: CREATE`);
    
    try {
      const created = await this.prisma.attendance.create({
        data: {
          organizationId: lookupKey.organizationId,
          employeeId: lookupKey.employeeId,
          date: lookupKey.date,
          shiftId: shiftAssignment?.shiftId,
          ...checkInData,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          shift: true,
        },
      });

      this.logger.log(`[ATTENDANCE-CHECKIN] SUCCESS - Created record ${created.id}`);
      return created;
      
    } catch (error: any) {
      // STEP 6: Handle P2002 race condition
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`[ATTENDANCE-CHECKIN] P2002 race detected - another request created record`);
        this.logger.log(`[ATTENDANCE-CHECKIN] Re-fetching with SAME keys: orgId=${lookupKey.organizationId}, empId=${lookupKey.employeeId}, date=${lookupKey.date.toISOString()}`);
        
        // Re-fetch using EXACT same keys
        const existingAfterRace = await this.prisma.attendance.findUnique({
          where: {
            organizationId_employeeId_date: lookupKey,
          },
          include: {
            employee: {
              include: {
                department: true,
                designation: true,
              },
            },
            shift: true,
          },
        });

        if (!existingAfterRace) {
          // Should never happen - log all details for debugging
          this.logger.error(`[ATTENDANCE-CHECKIN] CRITICAL - P2002 but findUnique returned null`);
          this.logger.error(`[ATTENDANCE-CHECKIN] Lookup keys: ${JSON.stringify(lookupKey)}`);
          this.logger.error(`[ATTENDANCE-CHECKIN] This indicates date normalization inconsistency`);
          throw new BadRequestException('Unable to process check-in due to system error. Please contact support.');
        }

        this.logger.log(`[ATTENDANCE-CHECKIN] Found record after race: id=${existingAfterRace.id}`);
        
        if (existingAfterRace.checkInTime) {
          this.logger.log(`[ATTENDANCE-CHECKIN] DUPLICATE - Other request already checked in`);
          throw new BadRequestException('You have already checked in today');
        }

        // Update the record created by concurrent request
        this.logger.log(`[ATTENDANCE-CHECKIN] DB OPERATION: UPDATE (after race)`);
        const updated = await this.prisma.attendance.update({
          where: { id: existingAfterRace.id },
          data: checkInData,
          include: {
            employee: {
              include: {
                department: true,
                designation: true,
              },
            },
            shift: true,
          },
        });

        this.logger.log(`[ATTENDANCE-CHECKIN] SUCCESS - Updated after race ${updated.id}`);
        return updated;
      }

      // Re-throw any other errors
      this.logger.error(`[ATTENDANCE-CHECKIN] UNEXPECTED ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * UPDATE CHECK-OUT
   * Private method to update attendance with check-out
   * Applies HALF_DAY rule if checking out before 7:00 PM (19:00) Asia/Kolkata
   * 
   * CRITICAL BUSINESS RULES:
   * 1. Checkout before 7:00 PM => HALF_DAY (overrides PRESENT/LATE)
   * 2. Checkout at/after 7:00 PM => Keep original status (PRESENT/LATE)
   * 3. Never override WEEK_OFF, HOLIDAY, LEAVE
   * 4. All time calculations use Asia/Kolkata timezone
   */
  private async updateCheckOut(
    attendance: any,
    event: IAttendanceEvent,
    remarks?: string,
  ) {
    const checkInTime = attendance.checkInTime;
    const checkOutTime = event.timestamp;

    // Calculate working hours (in hours as decimal)
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
    const workingHours = totalMinutes / 60;

    // Get shift details for calculations
    const shift = attendance.shift;
    
    // ============================================
    // FIXED 7:00 PM (19:00) CHECKOUT RULE - PRIORITY 1
    // ============================================
    // Convert checkout time to Asia/Kolkata timezone
    const zonedCheckOutTime = toZonedTime(checkOutTime, 'Asia/Kolkata');
    
    // Extract hour and minute in IST
    const checkoutHour = zonedCheckOutTime.getHours();
    const checkoutMinute = zonedCheckOutTime.getMinutes();
    
    // Convert to total minutes for comparison
    const checkoutMinutes = checkoutHour * 60 + checkoutMinute;
    const officeCheckoutMinutes = 19 * 60; // 7:00 PM = 19:00 = 1140 minutes
    
    // Get current status from database
    let status = attendance.status;
    
    // BUSINESS RULE: Checkout BEFORE 7:00 PM => HALF_DAY
    // This rule MUST override PRESENT and LATE status
    // Examples:
    // - 16:38 (4:38 PM) = 998 minutes < 1140 => HALF_DAY
    // - 17:26 (5:26 PM) = 1046 minutes < 1140 => HALF_DAY
    // - 18:30 (6:30 PM) = 1110 minutes < 1140 => HALF_DAY
    // - 18:59 (6:59 PM) = 1139 minutes < 1140 => HALF_DAY
    // - 19:00 (7:00 PM) = 1140 minutes = 1140 => NOT HALF_DAY (keep original)
    // - 19:01 (7:01 PM) = 1141 minutes > 1140 => NOT HALF_DAY (keep original)
    
    this.logger.log(
      `[ATTENDANCE-CHECKOUT] Processing checkout - ` +
      `Employee: ${attendance.employeeId} | ` +
      `Current Status: ${status} | ` +
      `Checkout Time: ${checkoutHour}:${String(checkoutMinute).padStart(2, '0')} IST | ` +
      `Minutes: ${checkoutMinutes} | ` +
      `Threshold: ${officeCheckoutMinutes}`
    );
    
    if (checkoutMinutes < officeCheckoutMinutes) {
      // Early checkout detected - apply HALF_DAY rule
      // ONLY override if current status is PRESENT or LATE
      const overridableStatuses = ['PRESENT', 'LATE'];
      
      if (overridableStatuses.includes(status)) {
        this.logger.log(
          `[ATTENDANCE-CHECKOUT] ⚠️ EARLY CHECKOUT - ` +
          `Time: ${checkoutHour}:${String(checkoutMinute).padStart(2, '0')} IST ` +
          `(${checkoutMinutes} minutes < ${officeCheckoutMinutes} minutes) - ` +
          `Changing status from ${status} to HALF_DAY`
        );
        status = AttendanceStatus.HALF_DAY;
      } else {
        this.logger.log(
          `[ATTENDANCE-CHECKOUT] Early checkout but status is ${status} - not overriding`
        );
      }
    } else {
      // On-time or late checkout - keep original status
      this.logger.log(
        `[ATTENDANCE-CHECKOUT] ✓ ON-TIME CHECKOUT - ` +
        `Time: ${checkoutHour}:${String(checkoutMinute).padStart(2, '0')} IST ` +
        `(${checkoutMinutes} minutes >= ${officeCheckoutMinutes} minutes) - ` +
        `Keeping status: ${status}`
      );
    }
    
    // Calculate early exit minutes (for reference)
    let earlyExitBy = 0;
    if (checkoutMinutes < officeCheckoutMinutes) {
      earlyExitBy = officeCheckoutMinutes - checkoutMinutes;
    }
    
    // Update database with ALL fields including status
    if (shift) {
      // Calculate net working hours after break deduction
      const netWorkingHours = Math.max(0, workingHours - (shift.breakTime || 0) / 60);
      const minimumHours = shift.minimumWorkingHours || 8;
      const overtime = shift.overtimeApplicable ? Math.max(0, netWorkingHours - minimumHours) : 0;

      this.logger.log(
        `[ATTENDANCE-CHECKOUT] Updating DB - ` +
        `Status: ${status} | ` +
        `Working Hours: ${netWorkingHours.toFixed(2)}h | ` +
        `Early Exit: ${earlyExitBy} mins`
      );

      return await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime,
          workingHours: netWorkingHours,
          breakTime: shift.breakTime,
          overtime,
          earlyExitBy,
          status, // CRITICAL: Update status in database
          remarks: remarks || attendance.remarks,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          shift: true,
        },
      });
    }

    // No shift assigned - simple calculation
    this.logger.log(
      `[ATTENDANCE-CHECKOUT] Updating DB (no shift) - ` +
      `Status: ${status} | ` +
      `Working Hours: ${workingHours.toFixed(2)}h | ` +
      `Early Exit: ${earlyExitBy} mins`
    );

    return await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        workingHours,
        earlyExitBy,
        status, // CRITICAL: Update status in database
        remarks: remarks || attendance.remarks,
      },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        shift: true,
      },
    });
  }

  /**
   * LOG ATTENDANCE EVENT
   * Save attendance log for audit trail
   */
  private async logAttendanceEvent(
    event: IAttendanceEvent,
    attendanceId?: string,
  ) {
    const date = getAttendanceBusinessDate(event.timestamp);

    await this.prisma.attendanceLog.create({
      data: {
        attendanceId,
        employeeId: event.employeeId,
        date,
        eventType: event.eventType,
        timestamp: event.timestamp,
        source: event.source,
        deviceId: event.deviceId,
        deviceName: event.deviceName,
        location: event.location ? JSON.stringify(event.location) : null,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        rawData: event.rawData ? JSON.stringify(event.rawData) : null,
        syncStatus: 'SYNCED',
      },
    });
  }

  /**
   * GET MY ATTENDANCE
   * Employee views their own attendance
   */
  async getMyAttendance(employeeId: string, query: GetAttendanceQueryDto) {
    const { startDate, endDate, page = 1, limit = 10, status } = query;

    const where: any = { employeeId };

    if (startDate && endDate) {
      const startBoundary = getAttendanceBusinessDate(parseISO(startDate));
      const endBoundary = getAttendanceBusinessDate(parseISO(endDate));
      where.date = {
        gte: startBoundary,
        lte: endBoundary,
      };
    } else if (startDate) {
      const startBoundary = getAttendanceBusinessDate(parseISO(startDate));
      where.date = { gte: startBoundary };
    } else if (endDate) {
      const endBoundary = getAttendanceBusinessDate(parseISO(endDate));
      where.date = { lte: endBoundary };
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          shift: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET MONTHLY ATTENDANCE
   * Get monthly calendar view
   * Applies weekly late penalties after fetching raw attendance
   */
  async getMonthlyAttendance(employeeId: string, dto: GetMonthlyAttendanceDto) {
    const now = new Date();
    const month = dto.month || now.getMonth() + 1;
    const year = dto.year || now.getFullYear();

    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));

    let attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shift: true,
        history: {
          where: { field: { in: ['HR_CORRECTION', 'HR_CORRECTION_CREATE'] } },
          select: { reason: true, changedAt: true, changedBy: true },
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    // ============================================
    // APPLY WEEKLY LATE PENALTY RULE
    // If employee was late on ALL working days in a week,
    // mark ONE FULL DAY OFF for that week
    // ============================================
    attendances = await this.applyWeeklyLatePenalty(employeeId, attendances);

    // Get summary
    const summary = await this.getMonthlyAttendanceSummary(employeeId, month, year);

    return {
      month,
      year,
      attendances,
      summary,
    };
  }

  /**
   * APPLY WEEKLY LATE PENALTY
   * For each week in the attendance records:
   * - Check if employee was late on ALL working days
   * - If yes, mark ONE FULL DAY OFF for that week
   * 
   * IMPORTANT: 
   * - Working days exclude WEEK_OFF, HOLIDAY, LEAVE, ABSENT
   * - Only applies penalty if employee was late on EVERY scheduled working day
   * - Only ONE penalty per week, not per late day
   */
  private async applyWeeklyLatePenalty(
    employeeId: string,
    attendances: any[],
  ): Promise<any[]> {
    if (attendances.length === 0) return attendances;

    // Group attendance by week
    const weekMap = new Map<string, any[]>();
    
    attendances.forEach(attendance => {
      const date = new Date(attendance.date);
      // Calculate week start (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(attendance);
    });

    this.logger.log(`[WEEKLY-PENALTY] Processing ${weekMap.size} weeks for employee ${employeeId}`);

    // Process each week
    for (const [weekKey, weekAttendances] of weekMap.entries()) {
      // Filter only working days (exclude WEEK_OFF, HOLIDAY, LEAVE, ABSENT)
      const workingDays = weekAttendances.filter(a => 
        ![
          AttendanceStatus.WEEK_OFF,
          AttendanceStatus.HOLIDAY,
          AttendanceStatus.LEAVE,
          AttendanceStatus.ABSENT,
        ].includes(a.status as AttendanceStatus)
      );

      if (workingDays.length === 0) {
        this.logger.log(`[WEEKLY-PENALTY] Week ${weekKey}: No working days, skipping`);
        continue;
      }

      // Count how many working days were LATE (or HALF_DAY which originated from late)
      const lateDays = workingDays.filter(a => 
        a.status === AttendanceStatus.LATE || a.status === AttendanceStatus.HALF_DAY
      );

      this.logger.log(
        `[WEEKLY-PENALTY] Week ${weekKey}: ` +
        `${workingDays.length} working days, ` +
        `${lateDays.length} late/half-day`
      );

      // If ALL working days were late, apply ONE FULL DAY OFF penalty
      if (lateDays.length === workingDays.length && workingDays.length > 0) {
        this.logger.log(
          `[WEEKLY-PENALTY] Week ${weekKey}: Employee was late on ALL ${workingDays.length} working days - Applying FULL DAY OFF penalty`
        );

        // Check if we already applied this penalty for this week
        const existingPenalty = await this.prisma.attendance.findFirst({
          where: {
            employeeId,
            date: {
              gte: new Date(weekKey),
              lt: new Date(new Date(weekKey).getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            remarks: { contains: 'FULL_WEEK_LATE_PENALTY' },
          },
        });

        if (!existingPenalty) {
          // Find the first LATE day in the week to mark as penalty
          const firstLateDay = lateDays[0];
          
          // Update the first late day to include penalty marker in remarks
          await this.prisma.attendance.update({
            where: { id: firstLateDay.id },
            data: {
              remarks: firstLateDay.remarks 
                ? `${firstLateDay.remarks} | FULL_WEEK_LATE_PENALTY_APPLIED`
                : 'FULL_WEEK_LATE_PENALTY_APPLIED',
            },
          });

          // Mark in the attendance object returned to frontend
          firstLateDay.fullWeekLatePenalty = true;
          
          this.logger.log(
            `[WEEKLY-PENALTY] Applied penalty marker to attendance ${firstLateDay.id} on ${firstLateDay.date}`
          );
        } else {
          this.logger.log(
            `[WEEKLY-PENALTY] Week ${weekKey}: Penalty already applied, skipping`
          );
        }
      }
    }

    return attendances;
  }

  /**
   * GET ATTENDANCE SUMMARY (Private Helper)
   * Calculate monthly statistics
   */
  private async getMonthlyAttendanceSummary(
    employeeId: string,
    month: number,
    year: number,
  ) {
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));

    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // ============================================
    // CRITICAL: Count each status separately
    // HALF_DAY must NOT be counted as PRESENT
    // LATE must NOT be counted as PRESENT
    // ============================================
    const totalPresent = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;

    const totalAbsent = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    
    const totalLate = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    
    const totalHalfDay = attendances.filter(
      (a) => a.status === AttendanceStatus.HALF_DAY,
    ).length;
    
    const totalHolidays = attendances.filter(
      (a) => a.status === AttendanceStatus.HOLIDAY,
    ).length;
    
    const totalWeekOffs = attendances.filter(
      (a) => a.status === AttendanceStatus.WEEK_OFF,
    ).length;
    
    const totalWFH = attendances.filter(
      (a) => a.status === AttendanceStatus.WFH,
    ).length;
    
    const totalOnDuty = attendances.filter(
      (a) => a.status === AttendanceStatus.ON_DUTY,
    ).length;

    const totalWorkingHours = attendances.reduce(
      (sum, a) => sum + (a.workingHours || 0),
      0,
    );
    const totalOvertime = attendances.reduce(
      (sum, a) => sum + (a.overtime || 0),
      0,
    );

    const workingDays = attendances.filter(
      (a) =>
        ![AttendanceStatus.HOLIDAY, AttendanceStatus.WEEK_OFF].includes(
          a.status as AttendanceStatus,
        ),
    ).length;

    // Attendance percentage calculation
    // Consider PRESENT, LATE, WFH, ON_DUTY as "attended"
    // HALF_DAY counts as partial attendance (0.5)
    const fullAttendance = totalPresent + totalLate + totalWFH + totalOnDuty;
    const partialAttendance = totalHalfDay * 0.5;
    const totalAttendance = fullAttendance + partialAttendance;
    
    const attendancePercentage =
      workingDays > 0
        ? (totalAttendance / workingDays) * 100
        : 0;

    return {
      totalWorkingDays: workingDays,
      totalPresent,
      totalAbsent,
      totalLate,
      totalHalfDay,
      totalHolidays,
      totalWeekOffs,
      totalWFH,
      totalOnDuty,
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      totalOvertime: parseFloat(totalOvertime.toFixed(2)),
      averageWorkingHours:
        workingDays > 0
          ? parseFloat((totalWorkingHours / workingDays).toFixed(2))
          : 0,
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    };
  }

  /**
   * GET ALL ATTENDANCE (HR)
   * HR views all employee attendance with filters
   */
  async getAllAttendance(query: GetAttendanceQueryDto, userId: string) {
    this.logger.log(`HR getting all attendance records`);

    // Get user's organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !this.isHRRole(user.role.name)) {
      throw new ForbiddenException('Only HR can view all attendance');
    }

    const {
      startDate,
      endDate,
      page = 1,
      limit = 20,
      status,
      search,
      departmentId,
      date,
    } = query;

    const employeeWhere: any = {
      organizationId: user.organizationId,
      user: {
        isActive: true,
        role: { name: { notIn: [UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER] } },
      },
    };

    let targetDate: Date | undefined;
    let dateFilter: { gte?: Date; lte?: Date } | undefined;

    // Date filtering using canonical date
    if (date) {
      targetDate = getAttendanceBusinessDate(parseISO(date));
    } else if (startDate && endDate) {
      const startBoundary = getAttendanceBusinessDate(parseISO(startDate));
      const endBoundary = getAttendanceBusinessDate(parseISO(endDate));
      dateFilter = { gte: startBoundary, lte: endBoundary };
    } else if (startDate) {
      dateFilter = { gte: getAttendanceBusinessDate(parseISO(startDate)) };
    } else if (endDate) {
      dateFilter = { lte: getAttendanceBusinessDate(parseISO(endDate)) };
    }

    if (search) {
      employeeWhere.OR = [
        { employeeId: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    if (departmentId) {
      employeeWhere.departmentId = departmentId;
    }

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      include: {
        department: true,
        designation: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const attendances = (targetDate || dateFilter)
      ? await this.prisma.attendance.findMany({
          where: {
            organizationId: user.organizationId,
            date: targetDate ?? dateFilter,
            employeeId: { in: employees.map((employee) => employee.id) },
          },
          include: {
            employee: {
              include: { department: true, designation: true },
            },
            shift: true,
          },
        })
      : [];

    const attendanceByEmployee = new Map(
      attendances.map((attendance) => [attendance.employeeId, attendance]),
    );

    let rows = targetDate
      ? employees.map((employee) => {
      const attendance = attendanceByEmployee.get(employee.id);
      return attendance ?? {
        id: null,
        organizationId: user.organizationId,
        employeeId: employee.id,
        date: targetDate ?? null,
        checkInTime: null,
        checkOutTime: null,
        workingHours: null,
        lateBy: null,
        source: null,
        status: 'NO_RECORD',
        employee,
        shift: null,
      };
    })
      : attendances;

    if (status) {
      rows = rows.filter((row) => row.status === status);
    }

    const skip = (page - 1) * limit;
    const pagedRows = rows.slice(skip, skip + limit);

    return {
      data: pagedRows,
      meta: {
        page,
        limit,
        total: rows.length,
        totalPages: Math.ceil(rows.length / limit),
      },
    };
  }

  /**
   * GET ATTENDANCE SUMMARY (HR)
   * Get today's attendance summary
   */
  async getAttendanceSummary(date: string | undefined, userId: string) {
    this.logger.log(`HR getting attendance summary`);

    // Get user's organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !this.isHRRole(user.role.name)) {
      throw new ForbiddenException('Only HR can view attendance summary');
    }

    const targetDate = date ? parseISO(date) : new Date();
    const businessDate = getAttendanceBusinessDate(targetDate);

    // Get total active employees
    const totalEmployees = await this.prisma.employee.count({
      where: {
        organizationId: user.organizationId,
        user: {
          isActive: true,
          role: { name: { notIn: [UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER] } },
        },
      },
    });

    // Get attendance counts
    const attendances = await this.prisma.attendance.findMany({
      where: {
        organizationId: user.organizationId,
        date: businessDate,
      },
    });

    // ============================================
    // CRITICAL: Count each status separately
    // Do NOT count LATE as PRESENT
    // HALF_DAY is separate from PRESENT
    // ============================================
    const present = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;

    const late = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    const absent = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;

    const onLeave = attendances.filter(
      (a) => a.status === AttendanceStatus.LEAVE,
    ).length;

    const halfDay = attendances.filter(
      (a) => a.status === AttendanceStatus.HALF_DAY,
    ).length;

    const weekOff = attendances.filter(
      (a) => a.status === AttendanceStatus.WEEK_OFF,
    ).length;

    const holiday = attendances.filter(
      (a) => a.status === AttendanceStatus.HOLIDAY,
    ).length;

    const notMarked = totalEmployees - attendances.length;

    return {
      date: businessDate,
      totalEmployees,
      present,
      late,
      absent,
      onLeave,
      halfDay,
      weekOff,
      holiday,
      notMarked,
    };
  }

  /**
   * MANUAL ATTENDANCE ENTRY (HR)
   * HR manually marks attendance for an employee
   */
  async manualAttendance(
    dto: any,
    userId: string,
    organizationId: string,
  ) {
    this.logger.log(`HR manually marking attendance for employee`);

    // Verify HR permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !this.isHRRole(user.role.name)) {
      throw new ForbiddenException('Only HR can manually mark attendance');
    }

    // Verify employee belongs to same organization
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { user: true, department: true, designation: true },
    });

    if (!employee || employee.organizationId !== organizationId) {
      throw new NotFoundException('Employee not found');
    }

    const attendanceDate = getAttendanceBusinessDate(parseISO(dto.date));

    // Check if attendance already exists
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId: dto.employeeId,
          date: attendanceDate,
        },
      },
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance
      const oldStatus = existingAttendance.status;
      const oldCheckIn = existingAttendance.checkInTime;
      const oldCheckOut = existingAttendance.checkOutTime;

      attendance = await this.prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: dto.checkInTime ? parseISO(dto.checkInTime) : null,
          checkOutTime: dto.checkOutTime ? parseISO(dto.checkOutTime) : null,
          status: dto.status,
          isManualEntry: true,
          approvedBy: userId,
          approvedAt: new Date(),
          remarks: dto.remarks,
          workingHours: dto.checkInTime && dto.checkOutTime
            ? differenceInHours(parseISO(dto.checkOutTime), parseISO(dto.checkInTime))
            : null,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
        },
      });

      // Create audit log
      await this.prisma.attendanceHistory.create({
        data: {
          attendanceId: existingAttendance.id,
          field: 'MANUAL_UPDATE',
          oldValue: JSON.stringify({
            status: oldStatus,
            checkInTime: oldCheckIn,
            checkOutTime: oldCheckOut,
          }),
          newValue: JSON.stringify({
            status: dto.status,
            checkInTime: dto.checkInTime,
            checkOutTime: dto.checkOutTime,
          }),
          reason: dto.reason,
          changedBy: userId,
        },
      });

    } else {
      // Create new attendance record
      attendance = await this.prisma.attendance.create({
        data: {
          organizationId,
          employeeId: dto.employeeId,
          date: attendanceDate,
          checkInTime: dto.checkInTime ? parseISO(dto.checkInTime) : null,
          checkOutTime: dto.checkOutTime ? parseISO(dto.checkOutTime) : null,
          status: dto.status,
          source: AttendanceSource.MANUAL,
          isManualEntry: true,
          approvedBy: userId,
          approvedAt: new Date(),
          remarks: dto.remarks,
          workingHours: dto.checkInTime && dto.checkOutTime
            ? differenceInHours(parseISO(dto.checkOutTime), parseISO(dto.checkInTime))
            : null,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
        },
      });

      // Create audit log
      await this.prisma.attendanceHistory.create({
        data: {
          attendanceId: attendance.id,
          field: 'MANUAL_CREATE',
          oldValue: null,
          newValue: JSON.stringify({
            status: dto.status,
            checkInTime: dto.checkInTime,
            checkOutTime: dto.checkOutTime,
          }),
          reason: dto.reason,
          changedBy: userId,
        },
      });
    }

    this.logger.log(`Manual attendance recorded successfully`);

    return {
      success: true,
      message: 'Attendance marked successfully',
      attendance,
    };
  }

  /**
   * GET ATTENDANCE AUDIT LOG (HR)
   * Get audit log for attendance modifications
   */
  async getAuditLog(attendanceId: string, userId: string) {
    this.logger.log(`Getting audit log for attendance: ${attendanceId}`);

    // Verify HR permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !this.isHRRole(user.role.name)) {
      throw new ForbiddenException('Only HR can view audit logs');
    }

    const auditLogs = await this.prisma.attendanceHistory.findMany({
      where: { attendanceId },
      include: {
        changedByUser: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    return auditLogs;
  }

  /**
   * HR ATTENDANCE CORRECTION
   * Updates only submitted fields, or creates a record for an explicit HR request.
   */
  async regularizeAttendance(attendanceId: string, dto: any, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'].includes(user.role.name)) {
      throw new ForbiddenException('Only HR can correct attendance');
    }

    return this.prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.findUnique({
        where: { id: attendanceId },
        include: { employee: true },
      });

      if (!attendance || attendance.organizationId !== user.organizationId) {
        throw new NotFoundException('Attendance record not found in your organization');
      }

      const updateData: any = {
        approvedBy: userId,
        approvedAt: new Date(),
      };

      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.checkInTime !== undefined) updateData.checkInTime = parseISO(dto.checkInTime);
      if (dto.checkOutTime !== undefined) updateData.checkOutTime = parseISO(dto.checkOutTime);
      if (dto.remarks !== undefined) updateData.remarks = dto.remarks;

      if (dto.checkInTime !== undefined || dto.checkOutTime !== undefined) {
        const checkInTime = updateData.checkInTime ?? attendance.checkInTime;
        const checkOutTime = updateData.checkOutTime ?? attendance.checkOutTime;
        if (checkInTime && checkOutTime) {
          updateData.workingHours =
            (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }
      }

      const updated = await tx.attendance.update({
        where: { id: attendanceId },
        data: updateData,
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          shift: true,
        },
      });

      await tx.attendanceHistory.create({
        data: {
          attendanceId,
          field: 'HR_CORRECTION',
          oldValue: JSON.stringify({
            employeeId: attendance.employeeId,
            employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
            employeeCode: attendance.employee.employeeId,
            date: attendance.date,
            status: attendance.status,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
          }),
          newValue: JSON.stringify({
            employeeId: attendance.employeeId,
            employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
            employeeCode: attendance.employee.employeeId,
            date: attendance.date,
            status: updated.status,
            checkInTime: updated.checkInTime,
            checkOutTime: updated.checkOutTime,
            changedByRole: user.role.name,
          }),
          reason: dto.reason,
          changedBy: userId,
        },
      });

      return {
        success: true,
        message: 'Attendance corrected successfully',
        attendance: updated,
      };
    });
  }

  async createRegularizedAttendance(dto: any, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'].includes(user.role.name)) {
      throw new ForbiddenException('Only HR can create attendance corrections');
    }
    if (!dto.employeeId || !dto.date || !dto.status || !dto.reason) {
      throw new BadRequestException('employeeId, date, status, and reason are required');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId: user.organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found in your organization');

    const date = getAttendanceBusinessDate(parseISO(dto.date));
    const existing = await this.prisma.attendance.findUnique({
      where: { organizationId_employeeId_date: {
        organizationId: user.organizationId,
        employeeId: dto.employeeId,
        date,
      } },
    });
    if (existing) return this.regularizeAttendance(existing.id, dto, userId);

    const checkInTime = dto.checkInTime ? parseISO(dto.checkInTime) : null;
    const checkOutTime = dto.checkOutTime ? parseISO(dto.checkOutTime) : null;
    const workingHours = checkInTime && checkOutTime
      ? (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.create({
        data: {
          organizationId: user.organizationId,
          employeeId: dto.employeeId,
          date,
          status: dto.status,
          checkInTime,
          checkOutTime,
          workingHours,
          source: AttendanceSource.MANUAL,
          isManualEntry: true,
          approvedBy: userId,
          approvedAt: new Date(),
          remarks: dto.remarks,
        },
        include: { employee: true },
      });

      await tx.attendanceHistory.create({
        data: {
          attendanceId: attendance.id,
          field: 'HR_CORRECTION_CREATE',
          oldValue: null,
          newValue: JSON.stringify({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            date,
            status: dto.status,
            checkInTime,
            checkOutTime,
            changedByRole: user.role.name,
          }),
          reason: dto.reason,
          changedBy: userId,
        },
      });

      return { success: true, message: 'Attendance created successfully', attendance };
    });
  }

  /**
   * GET EMPLOYEE LATE COUNT (HR)
   * Get late attendance count for an employee in a specific month
   */
  async getEmployeeLateCount(
    employeeId: string,
    month: number,
    year: number,
    userId: string,
  ) {
    this.logger.log(`Getting late count for employee: ${employeeId}`);

    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));

    const lateAttendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: AttendanceStatus.LATE,
      },
      orderBy: { date: 'asc' },
    });

    return {
      employeeId,
      month,
      year,
      lateCount: lateAttendances.length,
      lateRecords: lateAttendances.map((a) => ({
        date: a.date,
        checkInTime: a.checkInTime,
        lateBy: a.lateBy,
      })),
    };
  }
}
