import { IsEmail, IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Employee first name', example: 'Rahul' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Employee last name', example: 'Sharma' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Unique corporate email address', example: 'rahul.sharma@fcs.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Primary contact/mobile number', example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Date of birth', example: '1995-08-15', required: false })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ description: 'Gender: MALE, FEMALE, OTHER', example: 'MALE', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ description: 'Blood group', example: 'O+', required: false })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiProperty({ description: 'Permanent residential address', example: '123 Tech Park Suite, Delhi', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Emergency contact detail name/number', example: 'Amit Sharma: 9988776655', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ description: 'Date of joining the company', example: '2026-08-01', required: false })
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiProperty({ description: 'UUID of the mapped department', example: 'd5005bed-a9ea-462b-8bed-9f3bf97fb660', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ description: 'UUID of the mapped designation', example: '4daecbb5-3e4b-4a85-8349-3ad553703d5b', required: false })
  @IsString()
  @IsOptional()
  designationId?: string;
}

export class UpdateEmployeeDto {
  @ApiProperty({ description: 'Employee first name', example: 'Rahul', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Employee last name', example: 'Sharma', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Primary contact/mobile number', example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Date of birth', example: '1995-08-15', required: false })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ description: 'Gender', example: 'MALE', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ description: 'Blood group', example: 'O+', required: false })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiProperty({ description: 'Permanent residential address', example: '123 Tech Park Suite, Delhi', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Emergency contact detail name/number', example: 'Amit Sharma: 9988776655', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ description: 'Date of joining the company', example: '2026-08-01', required: false })
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiProperty({ description: 'UUID of the mapped department', example: 'd5005bed-a9ea-462b-8bed-9f3bf97fb660', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ description: 'UUID of the mapped designation', example: '4daecbb5-3e4b-4a85-8349-3ad553703d5b', required: false })
  @IsString()
  @IsOptional()
  designationId?: string;
}

export class QueryEmployeeDto {
  @ApiProperty({ description: 'Search term for name/email/ID', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'Filter by Department UUID', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ description: 'Filter by Designation UUID', required: false })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiProperty({ description: 'Filter by onboardingStatus', example: 'PENDING', required: false })
  @IsString()
  @IsOptional()
  onboardingStatus?: string;

  @ApiProperty({ description: 'Filter by user active status', example: 'true', required: false })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiProperty({ description: 'Page number (default 1)', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page (default 10)', required: false })
  @IsOptional()
  limit?: number;
}
