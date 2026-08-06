/**
 * DTO for Manager Review
 *
 * Manager conducts comprehensive review including:
 * - Overall assessment
 * - Competency ratings
 * - Goal/KPI/KRA assessment
 * - Promotion and increment recommendations
 * - Training recommendations
 */

import {
  IsString,
  IsInt,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManagerReviewDto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({
    example: 'Employee has shown exceptional performance throughout the cycle',
    description: 'Overall assessment comments',
  })
  @IsString()
  overallComments: string;

  @ApiPropertyOptional({
    example: 'Strong technical skills, excellent team player',
  })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({
    example: 'Needs to improve time management and prioritization',
  })
  @IsOptional()
  @IsString()
  areasOfImprovement?: string;

  @ApiProperty({
    example: 4,
    description: 'Manager rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  managerRating: number;

  @ApiPropertyOptional({
    description: 'Goal assessment by manager',
    example: [
      {
        goalId: 'goal-uuid-1',
        managerRating: 4,
        comments: 'Good progress, achieved 90% of target',
        achieved: true,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  goalAssessment?: Array<{
    goalId: string;
    managerRating: number;
    comments?: string;
    achieved: boolean;
  }>;

  @ApiPropertyOptional({
    description: 'KPI assessment by manager',
    example: [
      {
        kpiId: 'kpi-uuid-1',
        managerRating: 5,
        actualValue: 105,
        comments: 'Exceeded target consistently',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  kpiAssessment?: Array<{
    kpiId: string;
    managerRating: number;
    actualValue: number;
    comments?: string;
  }>;

  @ApiPropertyOptional({
    description: 'KRA assessment by manager',
    example: [
      { kraId: 'kra-uuid-1', managerRating: 4, comments: 'Strong performance' },
    ],
  })
  @IsOptional()
  @IsArray()
  kraAssessment?: Array<{
    kraId: string;
    managerRating: number;
    comments?: string;
  }>;

  // Competency Ratings
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  technicalSkills?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  teamwork?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  leadership?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  problemSolving?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  initiative?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  adaptability?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  timeManagement?: number;

  // Promotion Recommendation
  @ApiProperty({ example: true })
  @IsBoolean()
  recommendPromotion: boolean;

  @ApiPropertyOptional({
    example:
      'Employee is ready for next level, consistently exceeds expectations',
  })
  @IsOptional()
  @IsString()
  promotionReason?: string;

  // Increment Recommendation
  @ApiProperty({ example: true })
  @IsBoolean()
  recommendIncrement: boolean;

  @ApiPropertyOptional({
    example: 15,
    description: 'Recommended increment percentage',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  incrementPercentage?: number;

  @ApiPropertyOptional({
    example: 'Based on exceptional performance and market standards',
  })
  @IsOptional()
  @IsString()
  incrementReason?: string;

  // Training Recommendation
  @ApiProperty({ example: true })
  @IsBoolean()
  recommendTraining: boolean;

  @ApiPropertyOptional({
    example: 'Advanced leadership program, Project management certification',
  })
  @IsOptional()
  @IsString()
  trainingAreas?: string;
}

export class UpdateManagerReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallComments?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  areasOfImprovement?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  managerRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  goalAssessment?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  kpiAssessment?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  kraAssessment?: any[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  technicalSkills?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  communication?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  teamwork?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  leadership?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  problemSolving?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  initiative?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  adaptability?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  timeManagement?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recommendPromotion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recommendIncrement?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  incrementPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incrementReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recommendTraining?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainingAreas?: string;
}

export class SubmitManagerReviewDto {
  @ApiProperty({ example: 'manager-review-uuid' })
  @IsString()
  id: string;
}
