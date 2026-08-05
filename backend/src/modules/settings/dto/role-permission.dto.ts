/**
 * DTOs for Role and Permission Management
 * 
 * Granular access control configuration
 */

import { IsString, IsBoolean, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Manager' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Can manage team members and approve requests' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 40, description: 'Role level (0-100), higher = more privileges' })
  @IsInt()
  @Min(0)
  @Max(100)
  level: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePermissionDto {
  @ApiProperty({ example: 'EMPLOYEES', description: 'Module name' })
  @IsString()
  module: string;

  @ApiProperty({ example: 'USER', description: 'Resource name' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'CREATE', description: 'Action name' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'Create Employee', description: 'Human-readable name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Allows creating new employee records' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'UI', description: 'Permission category (UI, API, BUTTON, FIELD)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystemPermission?: boolean;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ example: 'role-uuid' })
  @IsString()
  roleId: string;

  @ApiProperty({
    example: ['permission-uuid-1', 'permission-uuid-2'],
    description: 'Array of permission IDs to assign',
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class GrantPermissionDto {
  @ApiProperty({ example: 'role-uuid' })
  @IsString()
  roleId: string;

  @ApiProperty({ example: 'permission-uuid' })
  @IsString()
  permissionId: string;
}

export class RevokePermissionDto {
  @ApiProperty({ example: 'role-uuid' })
  @IsString()
  roleId: string;

  @ApiProperty({ example: 'permission-uuid' })
  @IsString()
  permissionId: string;
}

export class CheckPermissionDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'employees:user:create' })
  @IsString()
  permissionCode: string;
}

export class CheckMultiplePermissionsDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({
    example: ['employees:user:create', 'employees:user:update'],
  })
  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];

  @ApiProperty({
    example: 'ALL',
    enum: ['ALL', 'ANY'],
    description: 'ALL = user needs all permissions, ANY = user needs at least one',
  })
  @IsString()
  mode: 'ALL' | 'ANY';
}
