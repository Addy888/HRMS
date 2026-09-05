import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'The unique name of the department/process',
    example: 'VTP',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Department/Process code',
    example: 'VTP',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'A short description of the department/process',
    example: 'Voice Training Process team',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is the department/process active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'The unique name of the department/process',
    example: 'VTP',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Department/Process code',
    example: 'VTP',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'A short description of the department/process',
    example: 'Voice Training Process team',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is the department/process active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class BulkAssignEmployeesDto {
  @ApiProperty({
    description: 'Array of employee IDs to assign to this department/process',
    example: ['employee-uuid-1', 'employee-uuid-2', 'employee-uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];
}
