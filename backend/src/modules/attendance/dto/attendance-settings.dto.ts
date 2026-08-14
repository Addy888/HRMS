/**
 * Attendance Settings DTOs
 * For managing office timings, IP verification, GPS verification
 */

import { IsBoolean, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceSettingsDto {
  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  officeStartTime?: string;

  @ApiPropertyOptional({ example: '19:00' })
  @IsOptional()
  @IsString()
  officeEndTime?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  gracePeriodMinutes?: number;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @IsNumber()
  halfDayThresholdMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ipRestrictionEnabled?: boolean;

  @ApiPropertyOptional({ example: ['192.168.1.1', '10.0.0.1'] })
  @IsOptional()
  @IsArray()
  allowedIps?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  locationVerificationEnabled?: boolean;

  @ApiPropertyOptional({ example: 28.7041 })
  @IsOptional()
  @IsNumber()
  officeLatitude?: number;

  @ApiPropertyOptional({ example: 77.1025 })
  @IsOptional()
  @IsNumber()
  officeLongitude?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  allowedRadiusMeters?: number;
}

export class GetAttendanceSettingsResponseDto {
  @ApiProperty()
  officeStartTime: string;

  @ApiProperty()
  officeEndTime: string;

  @ApiProperty()
  gracePeriodMinutes: number;

  @ApiProperty()
  halfDayThresholdMinutes: number;

  @ApiProperty()
  ipRestrictionEnabled: boolean;

  @ApiProperty()
  allowedIps: string[];

  @ApiProperty()
  locationVerificationEnabled: boolean;

  @ApiProperty()
  officeLatitude: number | null;

  @ApiProperty()
  officeLongitude: number | null;

  @ApiProperty()
  allowedRadiusMeters: number;
}
