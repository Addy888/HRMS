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
    return ['HR', 'HR_ADMIN', 'HR_USER'].includes(roleName);
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

    // Get active provider (Manual/Biometric/RFID/etc.)
    const provider = await this.providerRegistry.getActiveProvider();
    this.logger.log(`Using provider: ${provider.getName()}`);

    // Prepare attendance event
    const timestamp = dto.timestamp ? parseISO(dto.timestamp) : new Date();
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

    // Prepare attendance event
    const timestamp = dto.timestamp ? parseISO(dto.timestamp) : new Date();
    const attendanceEvent: Partial<IAttendanceEvent> = {
      employeeId,
      eventType: AttendanceEventType.CHECK_OUT,
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

    // Calculate late status
    let lateBy = 0;
    let status = AttendanceStatus.PRESENT;

    if (shiftAssignment) {
      const shift = shiftAssignment.shift;
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      
      // Create shift start time in IST for comparison
      const zonedCheckInTime = toZonedTime(event.timestamp, 'Asia/Kolkata');
      const shiftStartTime = new Date(zonedCheckInTime);
      shiftStartTime.setHours(startHour, startMinute, 0, 0);

      const minutesLate = differenceInMinutes(zonedCheckInTime, shiftStartTime);

      // IMPORTANT: Late starts AFTER grace time, not AT grace time
      // If graceTime is 10 minutes and startTime is 09:00:
      // - 09:00 to 09:10 => ON TIME
      // - 09:11 onwards => LATE
      if (minutesLate > shift.graceTime) {
        lateBy = minutesLate - shift.graceTime;
        if (lateBy >= shift.halfDayIfLateBy) {
          status = AttendanceStatus.HALF_DAY;
        } else if (lateBy >= shift.lateMarkAfter) {
          status = AttendanceStatus.LATE;
        }
      }
    }

    // Check holiday
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        date: businessDate,
        OR: [{ departmentId: null }, { departmentId: employee.departmentId }],
      },
    });

    if (holiday) {
      status = AttendanceStatus.HOLIDAY;
    }

    // Check week off
    const dayOfWeek = format(new Date(businessDate), 'EEEE').toUpperCase();
    const weekOff = await this.prisma.weekOff.findFirst({
      where: {
        dayOfWeek: dayOfWeek,
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
   * Applies half-day rule if checking out before official end time
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

    // Get shift details for half-day calculation
    const shift = attendance.shift;
    
    // Determine status based on checkout time
    let status = attendance.status;
    
    if (shift) {
      // Parse official end time (e.g., "19:00" for 7 PM)
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      
      // Create official end time in IST
      const zonedCheckOutTime = toZonedTime(checkOutTime, 'Asia/Kolkata');
      const officialEndTime = new Date(zonedCheckOutTime);
      officialEndTime.setHours(endHour, endMinute, 0, 0);
      
      // HALF DAY RULE: If checkout is BEFORE official end time => HALF_DAY
      // Unless already marked as HOLIDAY, WEEK_OFF, or LEAVE
      if (zonedCheckOutTime < officialEndTime) {
        if (!['HOLIDAY', 'WEEK_OFF', 'LEAVE'].includes(status)) {
          status = AttendanceStatus.HALF_DAY;
          this.logger.log(`[ATTENDANCE-CHECKOUT] Early checkout detected - Status: HALF_DAY`);
        }
      }
      
      // Calculate overtime if applicable
      const netWorkingHours = Math.max(0, workingHours - (shift.breakTime || 0) / 60);
      const minimumHours = shift.minimumWorkingHours || 8;
      const overtime = shift.overtimeApplicable ? Math.max(0, netWorkingHours - minimumHours) : 0;
      
      // Calculate early exit
      let earlyExitBy = 0;
      const minutesEarly = differenceInMinutes(officialEndTime, zonedCheckOutTime);
      if (minutesEarly > 0) {
        earlyExitBy = minutesEarly;
      }

      return await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime,
          workingHours: netWorkingHours,
          breakTime: shift.breakTime,
          overtime,
          earlyExitBy,
          status,
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
    return await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        workingHours,
        status,
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
   */
  async getMonthlyAttendance(employeeId: string, dto: GetMonthlyAttendanceDto) {
    const now = new Date();
    const month = dto.month || now.getMonth() + 1;
    const year = dto.year || now.getFullYear();

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
      include: {
        shift: true,
      },
      orderBy: { date: 'asc' },
    });

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

    const totalPresent = attendances.filter((a) =>
      [AttendanceStatus.PRESENT, AttendanceStatus.LATE].includes(
        a.status as AttendanceStatus,
      ),
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

    const attendancePercentage =
      workingDays > 0
        ? ((totalPresent + totalWFH + totalOnDuty) / workingDays) * 100
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

    const where: any = { organizationId: user.organizationId };

    // Date filtering using canonical date
    if (date) {
      const targetDate = getAttendanceBusinessDate(parseISO(date));
      where.date = targetDate;
    } else if (startDate && endDate) {
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

    // Search filter
    if (search) {
      where.employee = {
        OR: [
          { employeeId: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Department filter
    if (departmentId) {
      where.employee = {
        ...(where.employee || {}),
        departmentId,
      };
    }

    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
        user: { isActive: true },
      },
    });

    // Get attendance counts
    const attendances = await this.prisma.attendance.findMany({
      where: {
        organizationId: user.organizationId,
        date: businessDate,
      },
    });

    const present = attendances.filter(
      (a) =>
        a.status === AttendanceStatus.PRESENT ||
        a.status === AttendanceStatus.LATE,
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
