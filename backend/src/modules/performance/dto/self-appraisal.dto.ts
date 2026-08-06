/**
 * DTO for Self Appraisal
 *
 * Employee submits self-assessment including:
 * - Achievements and challenges
 * - Self-rating on goals, KPIs, KRAs
 * - Future goals and training needs
 * - Supporting documents
 */

import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SelfAppraisalDto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({
    example:
      'Successfully led the Q1 product launch, exceeded sales targets by 20%',
    description: 'Major achievements',
  })
  @IsString()
  achievements: string;

  @ApiPropertyOptional({
    example:
      'Faced resource constraints, managed to overcome with cross-functional collaboration',
  })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional({
    example: 'Learned advanced project management techniques',
  })
  @IsOptional()
  @IsString()
  learnings?: string;

  @ApiPropertyOptional({
    example: 'Lead the Q2 expansion project, improve team productivity by 15%',
  })
  @IsOptional()
  @IsString()
  futureGoals?: string;

  @ApiPropertyOptional({
    example: 'Advanced leadership training, PMP certification',
  })
  @IsOptional()
  @IsString()
  trainingRequired?: string;

  @ApiPropertyOptional({
    example: 'Aiming for senior management role in next 2 years',
  })
  @IsOptional()
  @IsString()
  careerAspirations?: string;

  @ApiProperty({
    example: 4,
    description: 'Self rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating: number;

  @ApiPropertyOptional({
    example: 'I believe I have exceeded expectations this quarter',
  })
  @IsOptional()
  @IsString()
  selfComments?: string;

  @ApiPropertyOptional({
    description: 'Goal self-assessment',
    example: [
      {
        goalId: 'goal-uuid-1',
        selfRating: 4,
        comments: 'Achieved 95% of target',
      },
      {
        goalId: 'goal-uuid-2',
        selfRating: 5,
        comments: 'Exceeded expectations',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  goalAssessment?: Array<{
    goalId: string;
    selfRating: number;
    comments?: string;
  }>;

  @ApiPropertyOptional({
    description: 'KPI self-assessment',
    example: [
      {
        kpiId: 'kpi-uuid-1',
        selfRating: 4,
        comments: 'Consistently met targets',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  kpiAssessment?: Array<{
    kpiId: string;
    selfRating: number;
    comments?: string;
  }>;

  @ApiPropertyOptional({
    description: 'KRA self-assessment',
    example: [
      { kraId: 'kra-uuid-1', selfRating: 5, comments: 'Excellent performance' },
    ],
  })
  @IsOptional()
  @IsArray()
  kraAssessment?: Array<{
    kraId: string;
    selfRating: number;
    comments?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Supporting document URLs',
    example: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
  })
  @IsOptional()
  @IsArray()
  supportingDocuments?: string[];
}

export class UpdateSelfAppraisalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learnings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  futureGoals?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainingRequired?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  careerAspirations?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfComments?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  supportingDocuments?: string[];
}

export class SubmitSelfAppraisalDto {
  @ApiProperty({ example: 'self-appraisal-uuid' })
  @IsString()
  id: string;
}
