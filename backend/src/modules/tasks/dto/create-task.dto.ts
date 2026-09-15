import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsPositive, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskType {
  TASK = 'TASK',
  VISIT = 'VISIT',
  DAILY_ACTIVITY = 'DAILY_ACTIVITY',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateTaskDto {
  @ApiProperty({ enum: TaskType, description: 'Type of task: TASK | VISIT | DAILY_ACTIVITY' })
  @IsEnum(TaskType)
  taskType: TaskType;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: 'PENDING' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  // Scheduling
  @ApiPropertyOptional({ description: 'Scheduled date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Completion timestamp (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  // Visit-specific
  @ApiPropertyOptional({ description: 'Number of visits made' })
  @IsOptional()
  @IsNumber()
  visitCount?: number;

  @ApiPropertyOptional({ description: 'Client / Customer name (VISIT type)' })
  @IsOptional()
  @IsString()
  visitClientName?: string;

  @ApiPropertyOptional({ description: 'Visit location (VISIT type)' })
  @IsOptional()
  @IsString()
  visitLocation?: string;

  @ApiPropertyOptional({ description: 'Purpose of visit' })
  @IsOptional()
  @IsString()
  visitPurpose?: string;

  @ApiPropertyOptional({ description: 'Outcome / Result of the visit' })
  @IsOptional()
  @IsString()
  visitOutcome?: string;

  @ApiPropertyOptional({ description: 'Whether follow-up is required' })
  @IsOptional()
  followUpRequired?: boolean;

  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  visitFollowUpDate?: string;

  @ApiPropertyOptional({ description: 'Follow-up notes' })
  @IsOptional()
  @IsString()
  visitFollowUpNotes?: string;

  // Daily Activity
  @ApiPropertyOptional({ description: 'Activity date (ISO 8601, DAILY_ACTIVITY type)' })
  @IsOptional()
  @IsDateString()
  activityDate?: string;

  @ApiPropertyOptional({ description: 'Work hours logged' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  workHours?: number;

  @ApiPropertyOptional({ description: 'General remarks / notes' })
  @IsOptional()
  @IsString()
  remarks?: string;

  // HR-only: which employee to assign when HR creates the task
  @ApiPropertyOptional({ description: 'Employee ID to assign task to (HR use only)' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
