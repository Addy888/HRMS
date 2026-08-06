/**
 * DTO for Training Recommendations
 *
 * Manages training needs and recommendations:
 * - Skill gap identification
 * - Training priorities
 * - Status tracking
 */

import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrainingArea {
  TECHNICAL = 'TECHNICAL',
  LEADERSHIP = 'LEADERSHIP',
  COMMUNICATION = 'COMMUNICATION',
  SOFT_SKILLS = 'SOFT_SKILLS',
  DOMAIN_KNOWLEDGE = 'DOMAIN_KNOWLEDGE',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  COMPLIANCE = 'COMPLIANCE',
  OTHER = 'OTHER',
}

export enum TrainingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TrainingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RecommendedByRole {
  MANAGER = 'MANAGER',
  HR = 'HR',
  SELF = 'SELF',
}

export class CreateTrainingRecommendationDto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({ example: 'employee-uuid' })
  @IsString()
  employeeId: string;

  @ApiProperty({ enum: TrainingArea, example: TrainingArea.LEADERSHIP })
  @IsEnum(TrainingArea)
  trainingArea: TrainingArea;

  @ApiProperty({ example: 'Advanced Leadership Program' })
  @IsString()
  trainingTitle: string;

  @ApiProperty({
    example:
      'Comprehensive leadership training covering team management, strategic thinking, and decision making',
    description: 'Training description',
  })
  @IsString()
  description: string;

  @ApiProperty({ enum: TrainingPriority, example: TrainingPriority.HIGH })
  @IsEnum(TrainingPriority)
  priority: TrainingPriority;

  @ApiProperty({ enum: RecommendedByRole, example: RecommendedByRole.MANAGER })
  @IsEnum(RecommendedByRole)
  recommendedByRole: RecommendedByRole;
}

export class UpdateTrainingRecommendationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainingTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TrainingPriority })
  @IsOptional()
  @IsEnum(TrainingPriority)
  priority?: TrainingPriority;

  @ApiPropertyOptional({ enum: TrainingStatus })
  @IsOptional()
  @IsEnum(TrainingStatus)
  status?: TrainingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;
}

export class ApproveTrainingDto {
  @ApiProperty({ example: 'training-recommendation-uuid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Scheduled training date',
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}

export class CompleteTrainingDto {
  @ApiProperty({ example: 'training-recommendation-uuid' })
  @IsString()
  id: string;

  @ApiProperty({
    example: '2026-05-15',
    description: 'Training completion date',
  })
  @IsDateString()
  completedDate: string;
}

export class CancelTrainingDto {
  @ApiProperty({ example: 'training-recommendation-uuid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'Budget constraints' })
  @IsOptional()
  @IsString()
  reason?: string;
}
