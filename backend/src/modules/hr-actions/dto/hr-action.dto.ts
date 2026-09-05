import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

// ─── Enums ────────────────────────────────────────────────────────────────────

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

export enum HRActionType {
  WARNING = 'WARNING',
  WRITTEN_WARNING = 'WRITTEN_WARNING',
  SUSPENSION = 'SUSPENSION',
  TERMINATION = 'TERMINATION',
  COUNSELLING = 'COUNSELLING',
  PERFORMANCE_IMPROVEMENT_PLAN = 'PERFORMANCE_IMPROVEMENT_PLAN',
  COMMENDATION = 'COMMENDATION',
  OTHER = 'OTHER',
}

export enum HRActionSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─── Create DTO ───────────────────────────────────────────────────────────────

export class CreateHRActionDto {
  @ApiProperty({ description: 'Target employee ID (UUID)', example: 'uuid-of-employee' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: HRActionType, description: 'Type of HR action', example: HRActionType.WARNING })
  @IsEnum(HRActionType)
  @IsNotEmpty()
  actionType: HRActionType;

  @ApiProperty({ enum: HRActionSeverity, description: 'Severity level', example: HRActionSeverity.MEDIUM })
  @IsEnum(HRActionSeverity)
  @IsNotEmpty()
  severity: HRActionSeverity;

  @ApiProperty({ description: 'Subject / title of the HR action', example: 'Repeated tardiness' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Detailed reason / description', example: 'Employee was late 5 times in the last month.' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Date the incident occurred (ISO 8601)', example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  incidentDate: string;

  @ApiPropertyOptional({ description: 'Corrective action required from the employee' })
  @IsString()
  @IsOptional()
  correctiveAction?: string;

  @ApiPropertyOptional({ description: 'Any additional remarks' })
  @IsString()
  @IsOptional()
  additionalRemarks?: string;

  @ApiPropertyOptional({ description: 'Whether the employee is required to respond', default: false })
  @IsBoolean()
  @IsOptional()
  responseRequired?: boolean;

  @ApiPropertyOptional({ description: 'Deadline for the employee to respond (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  responseDeadline?: string;
}

// ─── Update DTO ───────────────────────────────────────────────────────────────

export class UpdateHRActionDto {
  @ApiPropertyOptional({ enum: HRActionType })
  @IsEnum(HRActionType)
  @IsOptional()
  actionType?: HRActionType;

  @ApiPropertyOptional({ enum: HRActionSeverity })
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

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  responseDeadline?: string;
}

// ─── Respond DTO ──────────────────────────────────────────────────────────────

export class RespondHRActionDto {
  @ApiProperty({ description: "Employee's written response to the HR action" })
  @IsString()
  @IsNotEmpty()
  responseText: string;
}

// ─── Resolve DTO ──────────────────────────────────────────────────────────────

export class ResolveHRActionDto {
  @ApiPropertyOptional({ description: "HR's closing remarks when resolving the action" })
  @IsString()
  @IsOptional()
  resolvedRemarks?: string;
}

// ─── Cancel DTO ───────────────────────────────────────────────────────────────

export class CancelHRActionDto {
  @ApiProperty({ description: 'Reason for cancelling the HR action' })
  @IsString()
  @IsNotEmpty()
  cancelledReason: string;
}

// ─── Query / Filter DTO ───────────────────────────────────────────────────────

export class QueryHRActionsDto {
  @ApiPropertyOptional({ description: 'Filter by employee ID' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ enum: HRActionType, description: 'Filter by action type' })
  @IsEnum(HRActionType)
  @IsOptional()
  actionType?: HRActionType;

  @ApiPropertyOptional({ enum: HRActionSeverity, description: 'Filter by severity' })
  @IsEnum(HRActionSeverity)
  @IsOptional()
  severity?: HRActionSeverity;

  @ApiPropertyOptional({ enum: HRActionStatus, description: 'Filter by status' })
  @IsEnum(HRActionStatus)
  @IsOptional()
  status?: HRActionStatus;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by incident date range start (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter by incident date range end (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search by action number, subject, or employee name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
