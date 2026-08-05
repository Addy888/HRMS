/**
 * Attendance Correction DTOs
 * For requesting and managing attendance corrections
 */
import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CorrectionField {
  CHECK_IN_TIME = 'CHECK_IN_TIME',
  CHECK_OUT_TIME = 'CHECK_OUT_TIME',
  STATUS = 'STATUS',
  WORKING_HOURS = 'WORKING_HOURS',
}

export class CreateAttendanceCorrectionDto {
  @ApiProperty({ description: 'Attendance ID to correct' })
  @IsNotEmpty()
  @IsString()
  attendanceId: string;

  @ApiProperty({ description: 'Field to correct', enum: CorrectionField })
  @IsNotEmpty()
  @IsEnum(CorrectionField)
  field: CorrectionField;

  @ApiPropertyOptional({ description: 'Old value (for reference)' })
  @IsOptional()
  @IsString()
  oldValue?: string;

  @ApiProperty({ description: 'New value', example: '2026-08-05T09:30:00Z' })
  @IsNotEmpty()
  @IsString()
  newValue: string;

  @ApiProperty({ description: 'Reason for correction', example: 'Missed punch due to system issue' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UpdateCorrectionStatusDto {
  @ApiProperty({ description: 'Correction status', enum: ['APPROVED', 'REJECTED'] })
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Rejection reason (if rejected)', example: 'Invalid reason provided' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
