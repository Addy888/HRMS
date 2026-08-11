import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HRActionType {
  LATE_LOGIN_WARNING = 'LATE_LOGIN_WARNING',
  ATTENDANCE_WARNING = 'ATTENDANCE_WARNING',
  UNAUTHORIZED_ABSENCE = 'UNAUTHORIZED_ABSENCE',
  LEAVE_VIOLATION = 'LEAVE_VIOLATION',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  MISCONDUCT = 'MISCONDUCT',
  PERFORMANCE_WARNING = 'PERFORMANCE_WARNING',
  REPEATED_LATE_LOGIN = 'REPEATED_LATE_LOGIN',
  SHOW_CAUSE_NOTICE = 'SHOW_CAUSE_NOTICE',
  FINAL_WARNING = 'FINAL_WARNING',
  GENERAL_WARNING = 'GENERAL_WARNING',
  CUSTOM_NOTICE = 'CUSTOM_NOTICE',
}

export enum HRActionSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum HRActionStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESPONSE_PENDING = 'RESPONSE_PENDING',
  RESPONSE_SUBMITTED = 'RESPONSE_SUBMITTED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export class CreateHRActionDto {
  @ApiProperty({ description: 'Employee ID', example: 'emp-uuid' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: HRActionType })
  @IsEnum(HRActionType)
  @IsNotEmpty()
  actionType: HRActionType;

  @ApiProperty({ enum: HRActionSeverity })
  @IsEnum(HRActionSeverity)
  @IsNotEmpty()
  severity: HRActionSeverity;

  @ApiProperty({ description: 'Subject', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Detailed reason/description' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Incident date' })
  @IsDateString()
  @IsNotEmpty()
  incidentDate: string;

  @ApiPropertyOptional({ description: 'Required corrective action' })
  @IsString()
  @IsOptional()
  correctiveAction?: string;

  @ApiPropertyOptional({ description: 'Additional remarks' })
  @IsString()
  @IsOptional()
  additionalRemarks?: string;

  @ApiProperty({ description: 'Response required from employee' })
  @IsBoolean()
  responseRequired: boolean;

  @ApiPropertyOptional({ description: 'Response deadline date (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)' })
  @IsDateString({}, { message: 'responseDeadline must be a valid ISO 8601 date string' })
  @IsOptional()
  responseDeadline?: string | null;
}

export class UpdateHRActionDto {
  @ApiPropertyOptional()
  @IsEnum(HRActionType)
  @IsOptional()
  actionType?: HRActionType;

  @ApiPropertyOptional()
  @IsEnum(HRActionSeverity)
  @IsOptional()
  severity?: HRActionSeverity;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  incidentDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correctiveAction?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  additionalRemarks?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  responseRequired?: boolean;

  @ApiPropertyOptional({ description: 'Response deadline date (ISO 8601 format)' })
  @IsDateString({}, { message: 'responseDeadline must be a valid ISO 8601 date string' })
  @IsOptional()
  responseDeadline?: string | null;
}

export class AcknowledgeHRActionDto {
  // No additional fields needed - acknowledgement is implicit
}

export class RespondHRActionDto {
  @ApiProperty({ description: 'Employee response' })
  @IsString()
  @IsNotEmpty()
  responseText: string;
}

export class ResolveHRActionDto {
  @ApiProperty({ description: 'Resolution remarks' })
  @IsString()
  @IsNotEmpty()
  resolvedRemarks: string;
}

export class CancelHRActionDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  cancelledReason: string;
}

export class QueryHRActionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsEnum(HRActionType)
  @IsOptional()
  actionType?: HRActionType;

  @ApiPropertyOptional()
  @IsEnum(HRActionSeverity)
  @IsOptional()
  severity?: HRActionSeverity;

  @ApiPropertyOptional()
  @IsEnum(HRActionStatus)
  @IsOptional()
  status?: HRActionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;
}
