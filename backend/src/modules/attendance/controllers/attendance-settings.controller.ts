/**
 * ATTENDANCE SETTINGS CONTROLLER
 * API endpoints for attendance settings management
 */

import {
  Controller,
  Get,
  Put,
  Body,
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
import { AttendanceSettingsService } from '../services/attendance-settings.service.js';
import { AttendanceSettingsDto } from '../dto/index.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../../common/constants/index.js';
import { PrismaService } from '../../../database/prisma.service.js';

@ApiTags('Attendance Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance/settings')
export class AttendanceSettingsController {
  constructor(
    private readonly attendanceSettingsService: AttendanceSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET ATTENDANCE SETTINGS
   * Get current attendance settings
   */
  @Get()
  @ApiOperation({ summary: 'Get attendance settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.attendanceSettingsService.getSettings(user.organizationId);
  }

  /**
   * UPDATE ATTENDANCE SETTINGS (HR)
   * Update attendance settings
   */
  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update attendance settings (HR only)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Request() req, @Body() dto: AttendanceSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.attendanceSettingsService.updateSettings(
      user.organizationId,
      dto,
      req.user.id,
    );
  }
}
