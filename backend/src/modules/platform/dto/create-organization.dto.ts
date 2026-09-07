import { IsString, IsEmail, IsOptional, MinLength, IsBoolean } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Super Admin details for this organization
  @IsString()
  @MinLength(2)
  superAdminFirstName: string;

  @IsString()
  @MinLength(2)
  superAdminLastName: string;

  @IsEmail()
  superAdminEmail: string;

  @IsString()
  @MinLength(8)
  superAdminPassword: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
