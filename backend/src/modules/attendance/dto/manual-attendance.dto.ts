/**
 * Manual Attendance DTO
 * For HR to manually mark or modify attendance
 */

import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../enums';

export class ManualAttendanceDto {
  @ApiProperty({ example: 'emp-uuid-123' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2026-08-13' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '2026-08-13T10:00:00+05:30' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2026-08-13T19:00:00+05:30' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ example: 'Employee was present but attendance device/network was unavailable.' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-08-13T10:00:00+05:30' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2026-08-13T19:00:00+05:30' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiProperty({ example: 'Correcting attendance record - Employee was actually present.' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
