/**
 * ATTENDANCE CONTROLLER
 * API endpoints for attendance management
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service.js';
import {
  CheckInDto,
  CheckOutDto,
  GetAttendanceQueryDto,
  GetMonthlyAttendanceDto,
  ManualAttendanceDto,
  UpdateAttendanceDto,
  AttendanceSettingsDto,
} from '../dto/index.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../../common/constants/index.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { getAttendanceBusinessDate } from '../utils/attendance-date.util.js';
import { AttendanceSource } from '../enums/attendance-source.enum.js';
import { toZonedTime } from 'date-fns-tz';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * CHECK-IN
   * Employee marks attendance (check-in)
   */
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in attendance' })
  @ApiResponse({ status: 200, description: 'Checked in successfully' })
  @ApiResponse({ status: 400, description: 'Already checked in today' })
  async checkIn(@Request() req, @Body() dto: CheckInDto) {
    // Get employee ID from authenticated user
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.checkIn(employee.id, dto, req.user.id);
  }

  /**
   * CHECK-OUT
   * Employee marks attendance (check-out)
   */
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-out attendance' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  @ApiResponse({ status: 400, description: 'Not checked in yet' })
  async checkOut(@Request() req, @Body() dto: CheckOutDto) {
    // Get employee ID from authenticated user
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.checkOut(employee.id, dto, req.user.id);
  }

  /**
   * GET MY ATTENDANCE
   * Employee views their attendance history
   */
  @Get('my')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved' })
  async getMyAttendance(@Request() req, @Query() query: GetAttendanceQueryDto) {
    // Get employee ID from authenticated user
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.getMyAttendance(employee.id, query);
  }

  /**
   * GET MY MONTHLY ATTENDANCE
   * Employee views monthly attendance calendar
   */
  @Get('my/monthly')
  @ApiOperation({ summary: 'Get my monthly attendance' })
  @ApiResponse({ status: 200, description: 'Monthly attendance retrieved' })
  async getMyMonthlyAttendance(
    @Request() req,
    @Query() dto: GetMonthlyAttendanceDto,
  ) {
    // Get employee ID from authenticated user
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.getMonthlyAttendance(employee.id, dto);
  }

  /**
   * ✅ FIXED: GET MY IMPORTED ATTENDANCE FROM ACTUAL ATTENDANCE TABLE
   * Employee views their processed attendance records (NOT raw Excel)
   * Security: Backend filters by employeeId from authenticated user
   */
  @Get('my/imported')
  @ApiOperation({ summary: 'Get my attendance records' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  async getMyImportedAttendance(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    console.log('[EMPLOYEE-ATTENDANCE] ========== START ==========');
    console.log('[EMPLOYEE-ATTENDANCE] User ID:', req.user.id);

    // Get employee UUID from authenticated user
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        organizationId: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user || !user.employee) {
      console.log('[EMPLOYEE-ATTENDANCE] ERROR: Employee not found');
      throw new Error('Employee not found');
    }

    const employeeUUID = user.employee.id;
    const organizationId = user.organizationId;
    const employeeCode = user.employee.employeeId;

    console.log('[IMPORTED-ATTENDANCE]', { employeeUUID, employeeCode, organizationId });

    const now = new Date();
    const queryMonth = Number(month) || now.getMonth() + 1;
    const queryYear = Number(year) || now.getFullYear();

    // Build date range for the month
    const startDate = new Date(Date.UTC(queryYear, queryMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(queryYear, queryMonth, 1, 0, 0, 0, 0));

    console.log('[IMPORTED-ATTENDANCE]', {
      queryMonth,
      queryYear,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Query ACTUAL Attendance table (NOT RawAttendanceRecord)
    const whereClause = {
      organizationId: organizationId,
      employeeId: employeeUUID, // Use employee UUID (Employee.id)
      source: AttendanceSource.BIOMETRIC,
      date: {
        gte: startDate,
        lt: endDate,
      },
    };

    console.log('[IMPORTED-ATTENDANCE] WHERE clause:', JSON.stringify(whereClause, null, 2));

    const records = await this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        shift: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    console.log('[IMPORTED-ATTENDANCE] recordsFound:', records.length);

    if (records.length > 0) {
      records.forEach(r => {
        console.log('[IMPORTED-ATTENDANCE] record:', {
          attendanceId: r.id,
          date: r.date.toISOString().split('T')[0],
          status: r.status,
          checkInTime: r.checkInTime?.toISOString(),
          checkOutTime: r.checkOutTime?.toISOString(),
          source: r.source,
        });
      });
    }

    // Get available months with attendance
    const allRecords = await this.prisma.attendance.findMany({
      where: {
        organizationId: organizationId,
        employeeId: employeeUUID,
      },
      select: {
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    const availableMonths = new Set<string>();
    allRecords.forEach(r => {
      const d = new Date(r.date);
      availableMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    const result = {
      month: queryMonth,
      year: queryYear,
      attendances: records.map(r => ({
        id: r.id,
        date: r.date,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        status: r.status,
        workingHours: r.workingHours,
        lateBy: r.lateBy,
        earlyExitBy: r.earlyExitBy,
        overtime: r.overtime,
        source: r.source,
        isManualEntry: r.isManualEntry,
        remarks: r.remarks,
        shift: r.shift,
      })),
      total: records.length,
      availableMonths: Array.from(availableMonths).sort().reverse(),
    };

    console.log('[IMPORTED-ATTENDANCE] Returning:', result.attendances.length, 'records');
    console.log('[IMPORTED-ATTENDANCE] ========== END ==========');

    return result;
  }

  /**
   * GET TODAY'S STATUS
   * Get today's attendance status
   */
  @Get('my/today')
  @ApiOperation({ summary: "Get today's attendance status" })
  @ApiResponse({ status: 200, description: "Today's attendance status" })
  async getTodayStatus(@Request() req) {
    // Get employee ID from authenticated user
    const employee = await this.prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    // Use canonical attendance business date
    const businessDate = getAttendanceBusinessDate();

    // ============================================
    // BUSINESS RULE: MONDAY = WEEK OFF
    // ============================================
    // Check if today is Monday using Asia/Kolkata timezone
    const now = new Date();
    const zonedDate = toZonedTime(now, 'Asia/Kolkata');
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 1 = Monday
    const isMonday = dayOfWeek === 1;

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: businessDate,
      },
      include: {
        shift: true,
        history: {
          where: { field: { in: ['HR_CORRECTION', 'HR_CORRECTION_CREATE'] } },
          select: { reason: true, changedAt: true, changedBy: true },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    console.log('[ATTENDANCE-API] Today\'s attendance fetched:', {
      employeeId: employee.id,
      date: businessDate,
      isMonday,
      found: !!attendance,
      attendance: attendance ? {
        id: attendance.id,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        workingHours: attendance.workingHours
      } : null
    });

    const response = {
      date: businessDate,
      attendance,
      isMonday, // Flag for frontend to know it's Monday
      canCheckIn: !isMonday && (!attendance || !attendance.checkInTime), // Disable on Monday
      canCheckOut: !isMonday && (attendance && attendance.checkInTime && !attendance.checkOutTime), // Disable on Monday
    };

    console.log('[ATTENDANCE-API] Returning response:', {
      date: response.date,
      hasAttendance: !!response.attendance,
      isMonday: response.isMonday,
      canCheckIn: response.canCheckIn,
      canCheckOut: response.canCheckOut,
      attendanceCheckInTime: response.attendance?.checkInTime,
      attendanceCheckOutTime: response.attendance?.checkOutTime
    });

    return response;
  }

  /**
   * GET ALL ATTENDANCE (HR)
   * HR views all employee attendance
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all attendance records (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  async getAllAttendance(@Request() req, @Query() query: GetAttendanceQueryDto) {
    return this.attendanceService.getAllAttendance(query, req.user.id);
  }

  /**
   * GET ATTENDANCE SUMMARY (HR)
   * HR views attendance summary for a specific date
   */
  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get attendance summary (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Attendance summary retrieved' })
  async getAttendanceSummary(@Request() req, @Query('date') date?: string) {
    return this.attendanceService.getAttendanceSummary(date, req.user.id);
  }

  /**
   * GET EMPLOYEE ATTENDANCE (HR)
   * HR views specific employee attendance
   */
  @Get('employee/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get employee attendance (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Employee attendance retrieved' })
  async getEmployeeAttendance(
    @Request() req,
    @Param('employeeId') employeeId: string,
    @Query() query: GetAttendanceQueryDto,
  ) {
    await this.verifyEmployeeOrganization(employeeId, req.user.id);
    return this.attendanceService.getMyAttendance(employeeId, query);
  }

  /**
   * GET EMPLOYEE MONTHLY ATTENDANCE (HR)
   * HR views employee monthly attendance
   */
  @Get('employee/:employeeId/monthly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get employee monthly attendance (HR/Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Employee monthly attendance retrieved',
  })
  async getEmployeeMonthlyAttendance(
    @Request() req,
    @Param('employeeId') employeeId: string,
    @Query() dto: GetMonthlyAttendanceDto,
  ) {
    await this.verifyEmployeeOrganization(employeeId, req.user.id);
    return this.attendanceService.getMonthlyAttendance(employeeId, dto);
  }

  private async verifyEmployeeOrganization(employeeId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: user?.organizationId },
      select: { id: true },
    });
    if (!user || !employee) {
      throw new NotFoundException('Employee not found in your organization');
    }
  }

  /**
   * MANUAL ATTENDANCE (HR)
   * HR manually marks or corrects attendance
   */
  @Post('manual')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually mark attendance (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Attendance marked successfully' })
  async manualAttendance(@Request() req, @Body() dto: ManualAttendanceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return this.attendanceService.manualAttendance(
      dto,
      req.user.id,
      user.organizationId,
    );
  }

  /**
   * UPDATE ATTENDANCE (HR)
   * HR updates existing attendance record
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update attendance record (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  async updateAttendance(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    // Get attendance record
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Build update data
    const updateData: any = {};
    if (dto.checkInTime) updateData.checkInTime = new Date(dto.checkInTime);
    if (dto.checkOutTime) updateData.checkOutTime = new Date(dto.checkOutTime);
    if (dto.status) updateData.status = dto.status;
    if (dto.remarks) updateData.remarks = dto.remarks;

    updateData.approvedBy = req.user.id;
    updateData.approvedAt = new Date();

    // Calculate working hours if both times are provided
    if (updateData.checkInTime && updateData.checkOutTime) {
      const diffMs =
        updateData.checkOutTime.getTime() - updateData.checkInTime.getTime();
      updateData.workingHours = diffMs / (1000 * 60 * 60); // Convert to hours
    }

    // Update attendance
    const updated = await this.prisma.attendance.update({
      where: { id },
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

    // Create audit log
    await this.prisma.attendanceHistory.create({
      data: {
        attendanceId: id,
        field: 'UPDATE',
        oldValue: JSON.stringify({
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          status: attendance.status,
        }),
        newValue: JSON.stringify({
          checkInTime: updateData.checkInTime,
          checkOutTime: updateData.checkOutTime,
          status: updateData.status,
        }),
        reason: dto.reason,
        changedBy: req.user.id,
      },
    });

    return {
      success: true,
      message: 'Attendance updated successfully',
      attendance: updated,
    };
  }

  /**
   * HR ATTENDANCE CORRECTION
   * Updates only fields submitted by HR.
   */
  @Patch(':id/regularize')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Correct attendance record (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Attendance corrected successfully' })
  async regularizeAttendance(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.regularizeAttendance(id, dto, req.user.id);
  }

  @Post('regularize')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create explicit HR attendance correction' })
  async createRegularizedAttendance(@Request() req, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.createRegularizedAttendance(dto, req.user.id);
  }

  /**
   * GET AUDIT LOG (HR)
   * Get audit log for specific attendance record
   */
  @Get(':id/audit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get attendance audit log (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved' })
  async getAuditLog(@Request() req, @Param('id') id: string) {
    return this.attendanceService.getAuditLog(id, req.user.id);
  }

  /**
   * GET EMPLOYEE LATE COUNT (HR)
   * Get employee late attendance count
   */
  @Get('employee/:employeeId/late-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get employee late count (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'Late count retrieved' })
  async getEmployeeLateCount(
    @Request() req,
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    return this.attendanceService.getEmployeeLateCount(
      employeeId,
      targetMonth,
      targetYear,
      req.user.id,
    );
  }

  /**
   * ✅ HR: GET ALL IMPORTED ATTENDANCE RECORDS
   * HR/Super Admin can view all imported attendance for verification
   */
  @Get('imported/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all imported attendance records (HR/Super Admin)' })
  @ApiResponse({ status: 200, description: 'All imported attendance records retrieved' })
  async getAllImportedAttendance(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('employeeId') filterEmployeeId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { organizationId: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const now = new Date();
    const queryMonth = month || now.getMonth() + 1;
    const queryYear = year || now.getFullYear();

    const where: any = {
      organizationId: user.organizationId,
      OR: [
        { 
          attendanceMonth: queryMonth, 
          attendanceYear: queryYear 
        },
        { 
          attendanceMonth: null 
        },
      ],
    };

    // Optional: Filter by specific employee
    if (filterEmployeeId) {
      where.employeeId = filterEmployeeId;
    }

    const records = await this.prisma.rawAttendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        importHistory: {
          select: {
            fileName: true,
            uploadedAt: true,
            originalColumns: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { originalIdentifier: 'asc' },
      ],
    });

    return {
      month: queryMonth,
      year: queryYear,
      records: records.map(r => ({
        id: r.id,
        employeeId: r.employee?.employeeId,
        employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : null,
        originalIdentifier: r.originalIdentifier,
        originalName: r.originalName,
        data: JSON.parse(r.rawData),
        uploadedAt: r.createdAt,
        fileName: r.importHistory?.fileName,
        attendanceMonth: r.attendanceMonth,
        attendanceYear: r.attendanceYear,
        isMatched: r.isMatched,
        matchingNote: r.matchingNote,
      })),
      total: records.length,
    };
  }
}
