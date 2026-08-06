/**
 * DTO for Promotion Recommendations
 *
 * Manages promotion workflow:
 * - Manager/HR recommendations
 * - Approval workflow
 * - Effective date tracking
 */

import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PromotionApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
}

export enum RecommendedByRole {
  MANAGER = 'MANAGER',
  HR = 'HR',
}

export class CreatePromotionRecommendationDto {
  @ApiProperty({ example: 'review-uuid', description: 'Performance review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({ example: 'employee-uuid' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  currentDesignation: string;

  @ApiProperty({ example: 'Lead Software Engineer' })
  @IsString()
  recommendedDesignation: string;

  @ApiProperty({
    example:
      'Employee has consistently exceeded expectations and is ready for leadership role',
    description: 'Justification for promotion',
  })
  @IsString()
  justification: string;

  @ApiProperty({ enum: RecommendedByRole, example: RecommendedByRole.MANAGER })
  @IsEnum(RecommendedByRole)
  recommendedByRole: RecommendedByRole;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Proposed effective date',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class UpdatePromotionRecommendationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendedDesignation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ enum: PromotionApprovalStatus })
  @IsOptional()
  @IsEnum(PromotionApprovalStatus)
  approvalStatus?: PromotionApprovalStatus;
}

export class ApprovePromotionDto {
  @ApiProperty({ example: 'promotion-recommendation-uuid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Final effective date',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class RejectPromotionDto {
  @ApiProperty({ example: 'promotion-recommendation-uuid' })
  @IsString()
  id: string;

  @ApiProperty({
    example: 'Does not meet experience requirements for this role',
  })
  @IsString()
  rejectionReason: string;
}
