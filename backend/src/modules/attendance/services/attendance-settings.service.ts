/**
 * ATTENDANCE SETTINGS SERVICE
 * Manages configurable attendance settings
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AttendanceSettingsDto } from '../dto';

@Injectable()
export class AttendanceSettingsService {
  private readonly logger = new Logger(AttendanceSettingsService.name);

  // Default settings
  private readonly DEFAULT_SETTINGS = {
    officeStartTime: '10:00',
    officeEndTime: '19:00',
    gracePeriodMinutes: 15,
    halfDayThresholdMinutes: 240,
    ipRestrictionEnabled: false,
    allowedIps: [],
    locationVerificationEnabled: false,
    officeLatitude: null,
    officeLongitude: null,
    allowedRadiusMeters: 200,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get attendance settings
   */
  async getSettings(organizationId: string) {
    this.logger.log(`Getting attendance settings for org: ${organizationId}`);

    const settings = await Promise.all([
      this.prisma.setting.findUnique({
        where: { key: `attendance_office_start_time_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_office_end_time_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_grace_period_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_half_day_threshold_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_ip_restriction_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_allowed_ips_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_location_verification_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_office_latitude_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_office_longitude_${organizationId}` },
      }),
      this.prisma.setting.findUnique({
        where: { key: `attendance_allowed_radius_${organizationId}` },
      }),
    ]);

    return {
      officeStartTime:
        settings[0]?.value || this.DEFAULT_SETTINGS.officeStartTime,
      officeEndTime:
        settings[1]?.value || this.DEFAULT_SETTINGS.officeEndTime,
      gracePeriodMinutes: settings[2]?.value
        ? parseInt(settings[2].value)
        : this.DEFAULT_SETTINGS.gracePeriodMinutes,
      halfDayThresholdMinutes: settings[3]?.value
        ? parseInt(settings[3].value)
        : this.DEFAULT_SETTINGS.halfDayThresholdMinutes,
      ipRestrictionEnabled: settings[4]?.value === 'true',
      allowedIps: settings[5]?.value
        ? JSON.parse(settings[5].value)
        : this.DEFAULT_SETTINGS.allowedIps,
      locationVerificationEnabled: settings[6]?.value === 'true',
      officeLatitude: settings[7]?.value ? parseFloat(settings[7].value) : null,
      officeLongitude: settings[8]?.value
        ? parseFloat(settings[8].value)
        : null,
      allowedRadiusMeters: settings[9]?.value
        ? parseInt(settings[9].value)
        : this.DEFAULT_SETTINGS.allowedRadiusMeters,
    };
  }

  /**
   * UPDATE SETTINGS
   * Update attendance settings with proper typing
   */
  async updateSettings(
    organizationId: string,
    dto: AttendanceSettingsDto,
    userId: string,
  ) {
    this.logger.log(`Updating attendance settings for org: ${organizationId}`);

    const updatePromises: Promise<any>[] = [];

    if (dto.officeStartTime !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_office_start_time_${organizationId}` },
          create: {
            key: `attendance_office_start_time_${organizationId}`,
            value: dto.officeStartTime,
          },
          update: { value: dto.officeStartTime },
        }),
      );
    }

    if (dto.officeEndTime !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_office_end_time_${organizationId}` },
          create: {
            key: `attendance_office_end_time_${organizationId}`,
            value: dto.officeEndTime,
          },
          update: { value: dto.officeEndTime },
        }),
      );
    }

    if (dto.gracePeriodMinutes !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_grace_period_${organizationId}` },
          create: {
            key: `attendance_grace_period_${organizationId}`,
            value: dto.gracePeriodMinutes.toString(),
          },
          update: { value: dto.gracePeriodMinutes.toString() },
        }),
      );
    }

    if (dto.halfDayThresholdMinutes !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_half_day_threshold_${organizationId}` },
          create: {
            key: `attendance_half_day_threshold_${organizationId}`,
            value: dto.halfDayThresholdMinutes.toString(),
          },
          update: { value: dto.halfDayThresholdMinutes.toString() },
        }),
      );
    }

    if (dto.ipRestrictionEnabled !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_ip_restriction_${organizationId}` },
          create: {
            key: `attendance_ip_restriction_${organizationId}`,
            value: dto.ipRestrictionEnabled.toString(),
          },
          update: { value: dto.ipRestrictionEnabled.toString() },
        }),
      );
    }

    if (dto.allowedIps !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_allowed_ips_${organizationId}` },
          create: {
            key: `attendance_allowed_ips_${organizationId}`,
            value: JSON.stringify(dto.allowedIps),
          },
          update: { value: JSON.stringify(dto.allowedIps) },
        }),
      );
    }

    if (dto.locationVerificationEnabled !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_location_verification_${organizationId}` },
          create: {
            key: `attendance_location_verification_${organizationId}`,
            value: dto.locationVerificationEnabled.toString(),
          },
          update: { value: dto.locationVerificationEnabled.toString() },
        }),
      );
    }

    if (dto.officeLatitude !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_office_latitude_${organizationId}` },
          create: {
            key: `attendance_office_latitude_${organizationId}`,
            value: dto.officeLatitude.toString(),
          },
          update: { value: dto.officeLatitude.toString() },
        }),
      );
    }

    if (dto.officeLongitude !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_office_longitude_${organizationId}` },
          create: {
            key: `attendance_office_longitude_${organizationId}`,
            value: dto.officeLongitude.toString(),
          },
          update: { value: dto.officeLongitude.toString() },
        }),
      );
    }

    if (dto.allowedRadiusMeters !== undefined) {
      updatePromises.push(
        this.prisma.setting.upsert({
          where: { key: `attendance_allowed_radius_${organizationId}` },
          create: {
            key: `attendance_allowed_radius_${organizationId}`,
            value: dto.allowedRadiusMeters.toString(),
          },
          update: { value: dto.allowedRadiusMeters.toString() },
        }),
      );
    }

    await Promise.all(updatePromises);

    this.logger.log(`Attendance settings updated for org: ${organizationId}`);

    return this.getSettings(organizationId);
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
