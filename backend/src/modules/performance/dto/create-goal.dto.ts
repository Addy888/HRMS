/**
 * DTO for Goal Management
 * 
 * Goals can be:
 * - INDIVIDUAL: Personal employee goals
 * - TEAM: Team-level goals
 * - DEPARTMENT: Department-wide goals
 * - COMPANY: Organization-wide goals
 * 
 * Supports goal cascading and weightage-based scoring
 */

import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GoalType {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
  DEPARTMENT = 'DEPARTMENT',
  COMPANY = 'COMPANY',
}

export enum GoalTargetType {
  EMPLOYEE = 'EMPLOYEE',
  TEAM = 'TEAM',
  DEPARTMENT = 'DEPARTMENT',
}

export enum GoalMeasurementType {
  PERCENTAGE = 'PERCENTAGE',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  QUALITATIVE = 'QUALITATIVE',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  DROPPED = 'DROPPED',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateGoalDto {
  @ApiProperty({ example: 'cycle-uuid', description: 'Performance cycle ID' })
  @IsString()
  cycleId: string;

  @ApiProperty({ example: 'Increase sales by 20%', description: 'Goal title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Achieve 20% growth in Q1 sales compared to Q4', description: 'Goal description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: GoalType, example: GoalType.INDIVIDUAL })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty({ enum: GoalTargetType, example: GoalTargetType.EMPLOYEE })
  @IsEnum(GoalTargetType)
  targetType: GoalTargetType;

  @ApiPropertyOptional({ example: 'employee-uuid', description: 'Target employee/team/department ID' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiProperty({ example: 'SALES', description: 'Goal category' })
  @IsString()
  category: string;

  @ApiProperty({ enum: GoalPriority, example: GoalPriority.HIGH })
  @IsEnum(GoalPriority)
  priority: GoalPriority;

  @ApiProperty({ enum: GoalMeasurementType, example: GoalMeasurementType.PERCENTAGE })
  @IsEnum(GoalMeasurementType)
  measurementType: GoalMeasurementType;

  @ApiPropertyOptional({ example: '20', description: 'Target value' })
  @IsOptional()
  @IsString()
  targetValue?: string;

  @ApiPropertyOptional({ example: '%', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 25, description: 'Goal weightage (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage: number;

  @ApiPropertyOptional({ example: 'employee-uuid', description: 'Goal owner employee ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'manager-user-uuid', description: 'Assigned by user ID' })
  @IsOptional()
  @IsString()
  assignedBy?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Goal start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Goal due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ 
    description: 'Milestones (JSON array)',
    example: [
      { title: 'Complete Phase 1', dueDate: '2026-02-01', completed: false },
      { title: 'Complete Phase 2', dueDate: '2026-03-01', completed: false }
    ]
  })
  @IsOptional()
  @IsArray()
  milestones?: any[];

  @ApiPropertyOptional({ 
    description: 'Dependent goal IDs',
    example: ['goal-uuid-1', 'goal-uuid-2']
  })
  @IsOptional()
  @IsArray()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Additional remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({ example: 'Updated goal title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GoalPriority })
  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualValue?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ enum: GoalStatus })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  milestones?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateGoalProgressDto {
  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ example: '15', description: 'Actual achieved value' })
  @IsOptional()
  @IsString()
  actualValue?: string;

  @ApiPropertyOptional({ example: 'Made significant progress in Q1' })
  @IsOptional()
  @IsString()
  comment?: string;
}
