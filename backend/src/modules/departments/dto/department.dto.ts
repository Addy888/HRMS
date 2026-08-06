import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'The unique name of the department',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A short description of the department',
    example: 'Product & Tech development team',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({
    description: 'The unique name of the department',
    example: 'Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'A short description of the department',
    example: 'Product & Tech development team',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
