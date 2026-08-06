import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDesignationDto {
  @ApiProperty({
    description: 'The unique name of the designation',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A short description of the role profile',
    example: 'Leads engineering sprints and code reviews',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateDesignationDto {
  @ApiProperty({
    description: 'The unique name of the designation',
    example: 'Senior Software Engineer',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'A short description of the role profile',
    example: 'Leads engineering sprints and code reviews',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
