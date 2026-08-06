/**
 * ATTENDANCE CONTROLLER
 * API endpoints for attendance management
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
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
} from '../dto/index.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../../common/constants/index.js';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

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
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.userId },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.checkIn(employee.id, dto, req.user.userId);
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
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.userId },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    return this.attendanceService.checkOut(employee.id, dto, req.user.userId);
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
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.userId },
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
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.userId },
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
    const employee = await req.prisma.employee.findUnique({
      where: { userId: req.user.userId },
    });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await req.prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: today,
      },
      include: {
        shift: true,
      },
    });

    return {
      date: today,
      attendance,
      canCheckIn: !attendance || !attendance.checkInTime,
      canCheckOut:
        attendance && attendance.checkInTime && !attendance.checkOutTime,
    };
  }

  /**
   * GET ALL ATTENDANCE (HR)
   * HR views all employee attendance
   */
  @Get()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get all attendance records (HR only)' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  async getAllAttendance(@Query() query: GetAttendanceQueryDto) {
    // Implementation for HR to view all attendance
    // This will be implemented in AttendanceService
    return { message: 'HR attendance view - to be implemented' };
  }

  /**
   * GET EMPLOYEE ATTENDANCE (HR)
   * HR views specific employee attendance
   */
  @Get('employee/:employeeId')
  @Roles(UserRole.HR)
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
  @Roles(UserRole.HR)
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
}
