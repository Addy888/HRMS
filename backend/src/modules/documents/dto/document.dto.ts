import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentVerificationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_RE_UPLOAD = 'REQUEST_RE_UPLOAD',
}

export class UploadDocumentDto {
  @ApiProperty({
    description:
      'The document type, e.g. RESUME, AADHAAR, PAN, MARKSHEET_10TH, etc.',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}

export class ReplaceDocumentDto {
  @ApiProperty({ description: 'The document ID to replace' })
  @IsUUID()
  @IsNotEmpty()
  documentId: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ enum: DocumentVerificationAction })
  @IsEnum(DocumentVerificationAction)
  action: DocumentVerificationAction;

  @ApiPropertyOptional({ description: 'Feedback comments from HR' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class QueryDocumentDto {
  @ApiPropertyOptional({ description: 'Search term for employee name or code' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by document type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by verification status (PENDING, APPROVED, REJECTED, RE_UPLOAD_REQUIRED)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}
