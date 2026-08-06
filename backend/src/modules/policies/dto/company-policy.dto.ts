import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadCompanyPolicyDto {
  @ApiProperty({ example: 'Company Handbook 2026' })
  @IsString()
  @IsNotEmpty()
  policyName: string;

  @ApiPropertyOptional({ example: '1.0' })
  @IsString()
  @IsOptional()
  version?: string;
}

export class UpdateCompanyPolicyStatusDto {
  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: 'ACTIVE' | 'ARCHIVED';
}
