/**
 * Holiday Management DTOs
 */
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HolidayType {
  NATIONAL = 'NATIONAL',
  COMPANY = 'COMPANY',
  FESTIVAL = 'FESTIVAL',
  DEPARTMENT = 'DEPARTMENT',
}

export class CreateHolidayDto {
  @ApiProperty({ description: 'Holiday name', example: 'Independence Day' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Holiday date', example: '2026-08-15' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Holiday type',
    enum: HolidayType,
    example: HolidayType.NATIONAL,
  })
  @IsNotEmpty()
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiPropertyOptional({
    description: 'Department ID (if department-specific)',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Holiday description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is optional holiday',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ description: 'Holiday name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Holiday date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Holiday type', enum: HolidayType })
  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Holiday description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is optional holiday' })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class CreateWeekOffDto {
  @ApiPropertyOptional({ description: 'Employee ID (null for company-wide)' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'Day of week',
    example: 'SUNDAY',
    enum: [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ],
  })
  @IsNotEmpty()
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-08-01' })
  @IsNotEmpty()
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({
    description: 'Effective to date',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
