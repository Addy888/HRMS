/**
 * DTO for Creating Performance Cycle
 *
 * Performance cycles define the appraisal period and timelines for:
 * - Self appraisal
 * - Manager review
 * - HR review
 *
 * Supports: QUARTERLY, HALF_YEARLY, ANNUAL, CUSTOM cycles
 */

import {
  IsString,
  IsEnum,
  IsInt,
  IsDateString,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PerformanceCycleType {
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export enum PerformanceCycleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export class CreatePerformanceCycleDto {
  @ApiProperty({
    example: 'Q1 2026 Performance Review',
    description: 'Cycle name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    enum: PerformanceCycleType,
    example: PerformanceCycleType.QUARTERLY,
  })
  @IsEnum(PerformanceCycleType)
  type: PerformanceCycleType;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Quarter (1-4), required for QUARTERLY type',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  quarter?: number;

  @ApiProperty({ example: '2026-01-01', description: 'Cycle start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-31', description: 'Cycle end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Self appraisal start date',
  })
  @IsOptional()
  @IsDateString()
  selfAppraisalStartDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-15',
    description: 'Self appraisal end date',
  })
  @IsOptional()
  @IsDateString()
  selfAppraisalEndDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-16',
    description: 'Manager review start date',
  })
  @IsOptional()
  @IsDateString()
  managerReviewStartDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Manager review end date',
  })
  @IsOptional()
  @IsDateString()
  managerReviewEndDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'HR review start date',
  })
  @IsOptional()
  @IsDateString()
  hrReviewStartDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-15',
    description: 'HR review end date',
  })
  @IsOptional()
  @IsDateString()
  hrReviewEndDate?: string;

  @ApiPropertyOptional({ description: 'Cycle description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cycle settings',
    example: {
      enableSelfAppraisal: true,
      enable360Feedback: true,
      enableGoalWeightage: true,
      enableKPITracking: true,
      enableKRATracking: true,
      allowLateSubmissions: false,
    },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdatePerformanceCycleDto {
  @ApiPropertyOptional({ example: 'Q1 2026 Performance Review - Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PerformanceCycleStatus })
  @IsOptional()
  @IsEnum(PerformanceCycleStatus)
  status?: PerformanceCycleStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  selfAppraisalStartDate?: string;

  @ApiPropertyOptional({ example: '2026-04-15' })
  @IsOptional()
  @IsDateString()
  selfAppraisalEndDate?: string;

  @ApiPropertyOptional({ example: '2026-04-16' })
  @IsOptional()
  @IsDateString()
  managerReviewStartDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  managerReviewEndDate?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  hrReviewStartDate?: string;

  @ApiPropertyOptional({ example: '2026-05-15' })
  @IsOptional()
  @IsDateString()
  hrReviewEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
