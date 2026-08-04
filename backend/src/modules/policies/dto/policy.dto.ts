import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PolicyCategory {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  CODE_OF_CONDUCT = 'CODE_OF_CONDUCT',
  POSH = 'POSH',
  DATA_PRIVACY = 'DATA_PRIVACY',
  INFO_SEC = 'INFO_SEC',
  IT_USAGE = 'IT_USAGE',
  CONFIDENTIALITY = 'CONFIDENTIALITY',
  NDA = 'NDA',
  REMOTE_WORK = 'REMOTE_WORK',
  LAPTOP_ASSET = 'LAPTOP_ASSET',
  INTERNET_USAGE = 'INTERNET_USAGE',
  HANDBOOK = 'HANDBOOK',
  TRAVEL = 'TRAVEL',
  MEDICAL = 'MEDICAL',
  CUSTOM = 'CUSTOM',
}

export enum AssignmentTargetType {
  ALL = 'ALL',
  DEPARTMENT = 'DEPARTMENT',
  DESIGNATION = 'DESIGNATION',
  EMPLOYEE = 'EMPLOYEE',
}

export class CreatePolicyDto {
  @ApiProperty({ example: 'Remote Work Guidelines' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'POL-009' })
  @IsString()
  @IsNotEmpty()
  policyNumber: string;

  @ApiProperty({ enum: PolicyCategory, example: PolicyCategory.REMOTE_WORK })
  @IsEnum(PolicyCategory)
  category: PolicyCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Rich text content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: '2026-08-04T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ example: '2027-08-04T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class UpdatePolicyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsEnum(PolicyCategory)
  @IsOptional()
  category?: PolicyCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class AssignPolicyDto {
  @ApiProperty({ enum: AssignmentTargetType })
  @IsEnum(AssignmentTargetType)
  targetType: AssignmentTargetType;

  @ApiPropertyOptional({ description: 'Department ID, Designation ID, or Employee ID (ignored if targetType is ALL)' })
  @IsUUID()
  @IsOptional()
  targetId?: string;
}

export class AcceptPolicyDto {
  @ApiProperty({ example: 1 })
  versionAccepted: number;
}

export class SubmitAcknowledgementDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
