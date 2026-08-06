/**
 * Check-In DTO
 * Data Transfer Object for employee check-in
 */
import {
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsIP,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiPropertyOptional({ example: 28.6139 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.209 })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Connaught Place, New Delhi' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CheckInDto {
  @ApiPropertyOptional({
    description: 'IP Address of the device',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Device type or name',
    example: 'Web Browser',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Location information',
    type: LocationDto,
  })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Working from home today',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Custom timestamp (for manual entry by HR)',
    example: '2026-08-05T09:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({
    description: 'IP Address of the device',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Device type or name',
    example: 'Web Browser',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Location information',
    type: LocationDto,
  })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Left early due to emergency',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Custom timestamp (for manual entry by HR)',
    example: '2026-08-05T18:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class ManualAttendanceDto {
  @ApiProperty({ description: 'Employee ID', example: 'FCS-2026-0001' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Attendance date', example: '2026-08-05' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Check-in time',
    example: '2026-08-05T09:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '2026-08-05T18:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiProperty({
    description: 'Attendance status',
    example: 'PRESENT',
    enum: [
      'PRESENT',
      'ABSENT',
      'HALF_DAY',
      'WFH',
      'ON_DUTY',
      'HOLIDAY',
      'WEEK_OFF',
      'LEAVE',
    ],
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Approved by manager for late arrival',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
