/**
 * DTOs for System Settings
 * 
 * System-wide configuration management
 */

import { IsString, IsBoolean, IsInt, IsOptional, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

export enum SidebarLayout {
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  COMPACT = 'COMPACT',
}

export class SystemSettingDto {
  @ApiProperty({ example: 'SYSTEM' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'THEME_MODE' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'LIGHT' })
  value: any;

  @ApiProperty({ enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'] })
  @IsEnum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'])
  dataType: string;

  @ApiPropertyOptional({ example: 'Default theme mode for the application' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateSystemSettingDto {
  @ApiProperty()
  value: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkUpdateSystemSettingsDto {
  @ApiProperty({
    example: [
      { category: 'SYSTEM', key: 'THEME_MODE', value: 'DARK' },
      { category: 'SYSTEM', key: 'SESSION_TIMEOUT', value: 30 },
    ],
  })
  settings: Array<{
    category: string;
    key: string;
    value: any;
  }>;
}

export class UIPreferencesDto {
  @ApiPropertyOptional({ enum: ThemeMode, default: ThemeMode.LIGHT })
  @IsOptional()
  @IsEnum(ThemeMode)
  themeMode?: ThemeMode;

  @ApiPropertyOptional({ enum: SidebarLayout, default: SidebarLayout.VERTICAL })
  @IsOptional()
  @IsEnum(SidebarLayout)
  sidebarLayout?: SidebarLayout;

  @ApiPropertyOptional({ default: 'blue' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  paginationSize?: number;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ default: 30, description: 'Session timeout in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  sessionTimeout?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoLogout?: boolean;

  @ApiPropertyOptional({
    description: 'Dashboard widgets configuration',
    example: {
      widgets: [
        { id: 'attendance', visible: true, order: 1 },
        { id: 'leave-balance', visible: true, order: 2 },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  dashboardWidgets?: Record<string, any>;
}
