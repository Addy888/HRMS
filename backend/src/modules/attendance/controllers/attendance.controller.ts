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

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: businessDate,
      },
      include: {
        shift: true,
      },
    });

    console.log('[ATTENDANCE-API] Today\'s attendance fetched:', {
      employeeId: employee.id,
      date: businessDate,
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
      canCheckIn: !attendance || !attendance.checkInTime,
      canCheckOut:
        attendance && attendance.checkInTime && !attendance.checkOutTime,
    };

    console.log('[ATTENDANCE-API] Returning response:', {
      date: response.date,
      hasAttendance: !!response.attendance,
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get all attendance records (HR only)' })
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get attendance summary (HR only)' })
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get employee attendance (HR only)' })
  @ApiResponse({ status: 200, description: 'Employee attendance retrieved' })
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query() query: GetAttendanceQueryDto,
  ) {
    return this.attendanceService.getMyAttendance(employeeId, query);
  }

  /**
   * GET EMPLOYEE MONTHLY ATTENDANCE (HR)
   * HR views employee monthly attendance
   */
  @Get('employee/:employeeId/monthly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get employee monthly attendance (HR only)' })
  @ApiResponse({
    status: 200,
    description: 'Employee monthly attendance retrieved',
  })
  async getEmployeeMonthlyAttendance(
    @Param('employeeId') employeeId: string,
    @Query() dto: GetMonthlyAttendanceDto,
  ) {
    return this.attendanceService.getMonthlyAttendance(employeeId, dto);
  }

  /**
   * MANUAL ATTENDANCE (HR)
   * HR manually marks or corrects attendance
   */
  @Post('manual')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually mark attendance (HR only)' })
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update attendance record (HR only)' })
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
   * GET AUDIT LOG (HR)
   * Get audit log for specific attendance record
   */
  @Get(':id/audit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get attendance audit log (HR only)' })
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
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get employee late count (HR only)' })
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
}
