import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplaintCategory {
  HR_ISSUE = 'HR_ISSUE',
  SALARY_ISSUE = 'SALARY_ISSUE',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  MANAGER = 'MANAGER',
  IT_SUPPORT = 'IT_SUPPORT',
  PAYROLL = 'PAYROLL',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  WORK_ENVIRONMENT = 'WORK_ENVIRONMENT',
  HARASSMENT = 'HARASSMENT',
  POSH = 'POSH',
  ASSET_ISSUE = 'ASSET_ISSUE',
  SYSTEM_BUG = 'SYSTEM_BUG',
  OTHER = 'OTHER',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_EMPLOYEE = 'WAITING_FOR_EMPLOYEE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'Salary credit delayed for July' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: ComplaintCategory,
    example: ComplaintCategory.SALARY_ISSUE,
  })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiProperty({ enum: ComplaintPriority, example: ComplaintPriority.HIGH })
  @IsEnum(ComplaintPriority)
  priority: ComplaintPriority;

  @ApiProperty({
    example:
      'My salary has not been credited yet despite submitting timesheets on time.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}

export class UpdateComplaintDto {
  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintPriority })
  @IsEnum(ComplaintPriority)
  @IsOptional()
  priority?: ComplaintPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateReplyDto {
  @ApiProperty({
    example: 'Thank you for updating. I will check with finance.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Only visible to HR. Ignored for employee replies.',
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

export class AssignComplaintDto {
  @ApiProperty({ description: 'Employee ID of the HR agent to assign to' })
  @IsUUID()
  @IsNotEmpty()
  assignedToId: string;
}

export class ResolveComplaintDto {
  @ApiProperty({
    example:
      'Finance confirmed delay due to bank processing. It will be cleared by tomorrow.',
  })
  @IsString()
  @IsNotEmpty()
  resolutionDetails: string;
}
