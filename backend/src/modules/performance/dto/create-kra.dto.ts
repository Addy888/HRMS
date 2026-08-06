/**
 * DTO for KRA Management (Key Responsibility Areas)
 *
 * KRAs define key responsibilities and expected outcomes
 * Manager reviews and rates employee performance on KRAs
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KRAStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
}

export class CreateKRADto {
  @ApiProperty({ example: 'cycle-uuid', description: 'Performance cycle ID' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    example: 'Sales Performance Management',
    description: 'KRA title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Manage and drive sales performance for assigned territory',
    description: 'KRA description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'employee-uuid',
    description: 'Employee ID to assign KRA',
  })
  @IsString()
  assignedTo: string;

  @ApiPropertyOptional({
    example: 'manager-user-uuid',
    description: 'Assigned by user ID',
  })
  @IsOptional()
  @IsString()
  assignedBy?: string;

  @ApiProperty({
    example: 30,
    description: 'KRA weightage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage: number;

  @ApiPropertyOptional({ example: 'Achieve $500K in sales revenue' })
  @IsOptional()
  @IsString()
  targetMetric?: string;
}

export class UpdateKRADto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetMetric?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ReviewKRADto {
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

  @ApiProperty({ example: 'Excellent performance in managing sales team' })
  @IsString()
  managerComments: string;
}
