import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../../common/guards/roles.guard.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { UserRole } from '../../common/constants/index.js';
import { NotificationService } from './notification.service.js';
import { AnnouncementService } from './announcement.service.js';
import {
  BroadcastNotificationDto,
  CreateAnnouncementDto,
  GetNotificationsQueryDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly announcementService: AnnouncementService,
  ) {}

  // ─────────────────── Notifications ───────────────────

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for the current user (search, filter)' })
  getUserNotifications(@GetUser('id') userId: string, @Query() query: GetNotificationsQueryDto) {
    return this.notificationService.getUserNotifications(userId, query);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notification count for the current user' })
  getUnreadCount(@GetUser('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@GetUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read by recipient record ID' })
  markAsRead(@GetUser('id') userId: string, @Param('id') recipientId: string) {
    return this.notificationService.markAsRead(userId, recipientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification (for the current user only)' })
  deleteNotification(@GetUser('id') userId: string, @Param('id') recipientId: string) {
    return this.notificationService.deleteNotification(userId, recipientId);
  }

  @Post('broadcast')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Broadcast a notification (HR only) to All, Department, Designation, or specific Employee' })
  broadcastNotification(@GetUser('id') hrId: string, @Body() dto: BroadcastNotificationDto) {
    return this.notificationService.broadcastNotification(hrId, dto);
  }

  // ─────────────────── Preferences ───────────────────

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for the current user' })
  getPreferences(@GetUser('id') userId: string) {
    return this.notificationService.getOrCreatePreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences (email, inApp, push, sound, doNotDisturb)' })
  updatePreferences(@GetUser('id') userId: string, @Body() dto: UpdateNotificationPreferenceDto) {
    return this.notificationService.updatePreferences(userId, dto);
  }

  // ─────────────────── Audit Logs ───────────────────

  @Get('audit-logs')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get notification audit logs (HR only)' })
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationService.getAuditLogs(+page, +limit);
  }

  // ─────────────────── Announcements ───────────────────

  @Post('/announcements')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Publish a new announcement (HR only)' })
  createAnnouncement(@GetUser('id') hrId: string, @Body() dto: CreateAnnouncementDto) {
    return this.announcementService.createAnnouncement(hrId, dto);
  }

  @Get('/announcements')
  @ApiOperation({ summary: 'Get announcements feed for the current user' })
  getAnnouncements(
    @GetUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.announcementService.getAnnouncements(userId, +page, +limit);
  }

  @Patch('/announcements/:id/read')
  @ApiOperation({ summary: 'Mark announcement as read (by AnnouncementRecipient ID)' })
  markAnnouncementAsRead(@GetUser('id') userId: string, @Param('id') recipientId: string) {
    return this.announcementService.markAsRead(userId, recipientId);
  }
}
