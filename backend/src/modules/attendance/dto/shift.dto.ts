/**
 * Shift Management DTOs
 */
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ description: 'Shift name', example: 'General Shift' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Shift code', example: 'GEN' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '18:00' })
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Grace time in minutes',
    example: 15,
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  graceTime?: number;

  @ApiPropertyOptional({
    description: 'Late mark after minutes',
    example: 15,
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  lateMarkAfter?: number;

  @ApiPropertyOptional({
    description: 'Half day if late by minutes',
    example: 240,
    default: 240,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(480)
  halfDayIfLateBy?: number;

  @ApiPropertyOptional({
    description: 'Minimum working hours',
    example: 8.0,
    default: 8.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  minimumWorkingHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum working hours',
    example: 12.0,
    default: 12.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  maximumWorkingHours?: number;

  @ApiPropertyOptional({
    description: 'Break time in minutes',
    example: 60,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(240)
  breakTime?: number;

  @ApiPropertyOptional({
    description: 'Overtime applicable',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  overtimeApplicable?: boolean;

  @ApiPropertyOptional({
    description: 'Flexible shift',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  flexibleShift?: boolean;

  @ApiPropertyOptional({
    description: 'Weekends (comma-separated)',
    example: 'SATURDAY,SUNDAY',
    default: 'SATURDAY,SUNDAY',
  })
  @IsOptional()
  @IsString()
  weekends?: string;

  @ApiPropertyOptional({ description: 'Shift description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ description: 'Shift name', example: 'General Shift' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm)', example: '18:00' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Grace time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  graceTime?: number;

  @ApiPropertyOptional({ description: 'Late mark after minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  lateMarkAfter?: number;

  @ApiPropertyOptional({ description: 'Half day if late by minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(480)
  halfDayIfLateBy?: number;

  @ApiPropertyOptional({ description: 'Minimum working hours' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  minimumWorkingHours?: number;

  @ApiPropertyOptional({ description: 'Maximum working hours' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  maximumWorkingHours?: number;

  @ApiPropertyOptional({ description: 'Break time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(240)
  breakTime?: number;

  @ApiPropertyOptional({ description: 'Overtime applicable' })
  @IsOptional()
  @IsBoolean()
  overtimeApplicable?: boolean;

  @ApiPropertyOptional({ description: 'Flexible shift' })
  @IsOptional()
  @IsBoolean()
  flexibleShift?: boolean;

  @ApiPropertyOptional({ description: 'Weekends (comma-separated)' })
  @IsOptional()
  @IsString()
  weekends?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Shift description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignShiftDto {
  @ApiProperty({ description: 'Employee ID', example: 'FCS-2026-0001' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Shift ID' })
  @IsNotEmpty()
  @IsString()
  shiftId: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-08-05' })
  @IsNotEmpty()
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({
    description: 'Effective to date',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
