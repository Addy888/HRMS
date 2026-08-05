import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AnnouncementCategory {
  COMPANY_NEWS = 'COMPANY_NEWS',
  HOLIDAY_NOTICE = 'HOLIDAY_NOTICE',
  MEETING_NOTICE = 'MEETING_NOTICE',
  TRAINING_NOTICE = 'TRAINING_NOTICE',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 'Document Approved' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your Aadhaar card has been verified.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'document.approved' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'DOCUMENT' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: string = 'MEDIUM';

  @ApiProperty({ example: 'file-text', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: '/employee/documents', required: false })
  @IsString()
  @IsOptional()
  actionUrl?: string;
}

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'System Maintenance Notice' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'The system will be down on Sunday from 2 AM to 4 AM.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'SYSTEM' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: string = 'MEDIUM';

  @ApiProperty({ example: 'alert-triangle', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: '/', required: false })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiProperty({ example: 'ALL', description: 'ALL, DEPARTMENT, DESIGNATION, ROLE, EMPLOYEE' })
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @ApiProperty({ example: 'some-uuid-value', required: false })
  @IsString()
  @IsOptional()
  targetId?: string;
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Independence Day Holiday' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'August 15th will be a paid holiday for all employees.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: AnnouncementCategory })
  @IsEnum(AnnouncementCategory)
  category: AnnouncementCategory;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  inApp?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sound?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  doNotDisturb?: boolean;
}

export class GetNotificationsQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ example: 10, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ example: 'Aadhaar', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 'DOCUMENT', required: false })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({ enum: NotificationPriority, required: false })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  read?: boolean;
}
