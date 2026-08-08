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

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: AttendanceProviderRegistry,
  ) {}

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

    if (user.role.name !== 'HR' && employee.userId !== userId) {
      throw new ForbiddenException('You can only mark your own attendance');
    }

    // Check if already checked in today
    const today = startOfDay(new Date());
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      throw new BadRequestException('Already checked in today');
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

    // Save to database
    const attendance = await this.saveAttendance(
      employee,
      recordedEvent,
      dto.remarks,
    );

    // Log attendance event
    await this.logAttendanceEvent(recordedEvent, attendance.id);

    this.logger.log(`Check-in successful for employee: ${employeeId}`);

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

    if (user.role.name !== 'HR' && employee.userId !== userId) {
      throw new ForbiddenException('You can only mark your own attendance');
    }

    // Check if checked in today
    const today = startOfDay(new Date());
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
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
   * SAVE ATTENDANCE (CHECK-IN)
   * Private method to save attendance record
   */
  private async saveAttendance(
    employee: any,
    event: IAttendanceEvent,
    remarks?: string,
  ) {
    const date = startOfDay(event.timestamp);

    // Get employee shift
    const shiftAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId: employee.id,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      include: { shift: true },
    });

    // Calculate if late
    let lateBy = 0;
    let status = AttendanceStatus.PRESENT;

    if (shiftAssignment) {
      const shift = shiftAssignment.shift;
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const shiftStart = new Date(event.timestamp);
      shiftStart.setHours(startHour, startMinute, 0, 0);

      const minutesLate = differenceInMinutes(event.timestamp, shiftStart);

      if (minutesLate > shift.graceTime) {
        lateBy = minutesLate - shift.graceTime;
        if (lateBy >= shift.halfDayIfLateBy) {
          status = AttendanceStatus.HALF_DAY;
        } else if (lateBy >= shift.lateMarkAfter) {
          status = AttendanceStatus.LATE;
        }
      }
    }

    // Check if holiday
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        date: date,
        OR: [{ departmentId: null }, { departmentId: employee.departmentId }],
      },
    });

    if (holiday) {
      status = AttendanceStatus.HOLIDAY;
    }

    // Check if week off
    const dayName = format(date, 'EEEE').toUpperCase();
    const weekOff = await this.prisma.weekOff.findFirst({
      where: {
        dayOfWeek: dayName,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } },
          { employeeId: null },
          { employeeId: employee.id },
        ],
      },
    });

    if (weekOff) {
      status = AttendanceStatus.WEEK_OFF;
    }

    return await this.prisma.attendance.create({
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId,
        date: date,
        shiftId: shiftAssignment?.shiftId,
        checkInTime: event.timestamp,
        status,
        lateBy,
        source: event.source,
        deviceType: event.deviceType,
        location: event.location ? JSON.stringify(event.location) : null,
        ipAddress: event.ipAddress,
        isManualEntry: event.source === AttendanceSource.MANUAL,
        remarks,
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
   * UPDATE CHECK-OUT
   * Private method to update attendance with check-out
   */
  private async updateCheckOut(
    attendance: any,
    event: IAttendanceEvent,
    remarks?: string,
  ) {
    const checkInTime = attendance.checkInTime;
    const checkOutTime = event.timestamp;

    // Calculate working hours
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
    const workingHours = totalMinutes / 60;

    // Calculate break time (if applicable)
    const breakTime = attendance.shift?.breakTime || 0;
    const netWorkingHours = Math.max(0, workingHours - breakTime / 60);

    // Calculate overtime
    const minimumHours = attendance.shift?.minimumWorkingHours || 8;
    const overtime = Math.max(0, netWorkingHours - minimumHours);

    // Calculate early exit
    let earlyExitBy = 0;
    if (attendance.shift) {
      const [endHour, endMinute] = attendance.shift.endTime
        .split(':')
        .map(Number);
      const shiftEnd = new Date(checkOutTime);
      shiftEnd.setHours(endHour, endMinute, 0, 0);

      const minutesEarly = differenceInMinutes(shiftEnd, checkOutTime);
      if (minutesEarly > 0) {
        earlyExitBy = minutesEarly;
      }
    }

    return await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        workingHours: netWorkingHours,
        breakTime,
        overtime: attendance.shift?.overtimeApplicable ? overtime : 0,
        earlyExitBy,
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
    const date = startOfDay(event.timestamp);

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
      where.date = {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      };
    } else if (startDate) {
      where.date = { gte: startOfDay(parseISO(startDate)) };
    } else if (endDate) {
      where.date = { lte: endOfDay(parseISO(endDate)) };
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
    const summary = await this.getAttendanceSummary(employeeId, month, year);

    return {
      month,
      year,
      attendances,
      summary,
    };
  }

  /**
   * GET ATTENDANCE SUMMARY
   * Calculate monthly statistics
   */
  private async getAttendanceSummary(
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
}
