/**
 * DTO for HR Review (Final Review)
 *
 * HR conducts final assessment including:
 * - Final rating and calibration
 * - Salary recommendations
 * - Promotion decisions
 * - Performance letter generation
 * - Action items and follow-ups
 */

import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HRReviewDto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiPropertyOptional({
    example: 'Calibrated rating based on department-wide performance',
  })
  @IsOptional()
  @IsString()
  hrComments?: string;

  @ApiPropertyOptional({
    example: 'Discussed in calibration meeting, aligned with peer group',
  })
  @IsOptional()
  @IsString()
  calibrationNotes?: string;

  @ApiProperty({
    example: 4,
    description: 'Final rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  finalRating: number;

  @ApiPropertyOptional({
    example: 'Rating justified based on achievements and manager feedback',
  })
  @IsOptional()
  @IsString()
  ratingJustification?: string;

  // Salary Recommendation
  @ApiPropertyOptional({ example: 50000, description: 'Current salary' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentSalary?: number;

  @ApiPropertyOptional({ example: 57500, description: 'Recommended salary' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedSalary?: number;

  @ApiPropertyOptional({ example: 15, description: 'Increment percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  incrementPercentage?: number;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Increment effective date',
  })
  @IsOptional()
  @IsDateString()
  incrementEffectiveDate?: string;

  @ApiPropertyOptional({
    example: 'Based on performance and market benchmarking',
  })
  @IsOptional()
  @IsString()
  salaryRemarks?: string;

  // Promotion Recommendation
  @ApiPropertyOptional({ example: 'Senior Software Engineer' })
  @IsOptional()
  @IsString()
  currentDesignation?: string;

  @ApiPropertyOptional({ example: 'Lead Software Engineer' })
  @IsOptional()
  @IsString()
  recommendedDesignation?: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Promotion effective date',
  })
  @IsOptional()
  @IsDateString()
  promotionEffectiveDate?: string;

  @ApiPropertyOptional({
    example: 'Ready for leadership role, demonstrated strong performance',
  })
  @IsOptional()
  @IsString()
  promotionRemarks?: string;

  // Action Items
  @ApiPropertyOptional({
    description: 'Action items for follow-up',
    example: [
      {
        action: 'Complete leadership training',
        dueDate: '2026-06-01',
        responsible: 'HR',
      },
      {
        action: 'Schedule promotion discussion',
        dueDate: '2026-04-15',
        responsible: 'Manager',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  actionItems?: Array<{
    action: string;
    dueDate?: string;
    responsible?: string;
  }>;

  @ApiProperty({ example: false })
  @IsBoolean()
  followUpRequired: boolean;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Follow-up date' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class UpdateHRReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hrComments?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calibrationNotes?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  finalRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ratingJustification?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  currentSalary?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  recommendedSalary?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  incrementPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  incrementEffectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentDesignation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendedDesignation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  promotionEffectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  actionItems?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class CompleteHRReviewDto {
  @ApiProperty({ example: 'hr-review-uuid' })
  @IsString()
  id: string;
}

export class GeneratePerformanceLetterDto {
  @ApiProperty({ example: 'review-uuid' })
  @IsString()
  reviewId: string;
}
