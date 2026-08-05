/**
 * DTO for KPI Management (Key Performance Indicators)
 * 
 * KPIs are measurable metrics assigned to employees
 * Supports frequency-based tracking and threshold-based scoring
 */

import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KPIMeasurementType {
  NUMBER = 'NUMBER',
  PERCENTAGE = 'PERCENTAGE',
  CURRENCY = 'CURRENCY',
  BOOLEAN = 'BOOLEAN',
}

export enum KPIFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export enum KPIStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export class CreateKPIDto {
  @ApiProperty({ example: 'cycle-uuid', description: 'Performance cycle ID' })
  @IsString()
  cycleId: string;

  @ApiProperty({ example: 'Sales Target Achievement', description: 'KPI name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Monthly sales target achievement percentage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'SALES', description: 'KPI category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'employee-uuid', description: 'Employee ID to assign KPI' })
  @IsString()
  assignedTo: string;

  @ApiPropertyOptional({ example: 'manager-user-uuid', description: 'Assigned by user ID' })
  @IsOptional()
  @IsString()
  assignedBy?: string;

  @ApiProperty({ enum: KPIMeasurementType, example: KPIMeasurementType.PERCENTAGE })
  @IsEnum(KPIMeasurementType)
  measurementType: KPIMeasurementType;

  @ApiProperty({ example: 100, description: 'Target value' })
  @IsNumber()
  targetValue: number;

  @ApiPropertyOptional({ example: '%', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 20, description: 'KPI weightage (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage: number;

  @ApiProperty({ enum: KPIFrequency, example: KPIFrequency.MONTHLY })
  @IsEnum(KPIFrequency)
  frequency: KPIFrequency;

  @ApiPropertyOptional({ example: 120, description: 'Excellent threshold (>= 5 rating)' })
  @IsOptional()
  @IsNumber()
  excellentThreshold?: number;

  @ApiPropertyOptional({ example: 100, description: 'Good threshold (>= 4 rating)' })
  @IsOptional()
  @IsNumber()
  goodThreshold?: number;

  @ApiPropertyOptional({ example: 80, description: 'Satisfactory threshold (>= 3 rating)' })
  @IsOptional()
  @IsNumber()
  satisfactoryThreshold?: number;

  @ApiPropertyOptional({ description: 'Additional remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateKPIDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualValue?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage?: number;

  @ApiPropertyOptional({ enum: KPIStatus })
  @IsOptional()
  @IsEnum(KPIStatus)
  status?: KPIStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  excellentThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  goodThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  satisfactoryThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordKPIReadingDto {
  @ApiProperty({ example: '2026-01-31', description: 'Reading date' })
  @IsString()
  readingDate: string;

  @ApiProperty({ example: 95.5, description: 'KPI value' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: 'Achieved 95.5% of monthly target' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
