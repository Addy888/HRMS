/**
 * DTO for 360-Degree Feedback
 * 
 * Multi-source feedback from:
 * - Manager
 * - Peers
 * - Self
 * - HR
 * - Subordinates
 * - Customers (future)
 * 
 * Supports anonymous feedback
 */

import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeedbackType {
  MANAGER = 'MANAGER',
  PEER = 'PEER',
  SELF = 'SELF',
  HR = 'HR',
  SUBORDINATE = 'SUBORDINATE',
  CUSTOMER = 'CUSTOMER',
}

export class CreateFeedback360Dto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.PEER })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty({ example: false, description: 'Is feedback anonymous' })
  @IsBoolean()
  isAnonymous: boolean;

  @ApiPropertyOptional({ 
    example: 'Excellent team player, always willing to help',
    description: 'Strengths observed' 
  })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ 
    example: 'Could improve communication with other teams',
    description: 'Areas needing improvement' 
  })
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @ApiPropertyOptional({ 
    example: 'Continue the great work, consider taking on mentorship role',
    description: 'Suggestions for improvement' 
  })
  @IsOptional()
  @IsString()
  suggestions?: string;

  @ApiPropertyOptional({ example: 'Overall a valuable team member' })
  @IsOptional()
  @IsString()
  overallComments?: string;

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

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;
}

export class UpdateFeedback360Dto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suggestions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallComments?: string;

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
  overallRating?: number;
}

export class SubmitFeedback360Dto {
  @ApiProperty({ example: 'feedback-uuid' })
  @IsString()
  id: string;
}

export class RequestFeedback360Dto {
  @ApiProperty({ example: 'review-uuid' })
  @IsString()
  reviewId: string;

  @ApiProperty({ 
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'User IDs to request feedback from' 
  })
  @IsString({ each: true })
  feedbackFromUserIds: string[];

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.PEER })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty({ example: false })
  @IsBoolean()
  isAnonymous: boolean;
}
