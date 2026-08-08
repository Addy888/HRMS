import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { SocketGateway } from './socket.gateway.js';
import { EmailNotificationService } from './email-notification.service.js';
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
  GetNotificationsQueryDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly emailService: EmailNotificationService,
  ) {}

  /**
   * Helper to ensure user preferences exist, returns preference
   */
  async getOrCreatePreferences(userId: string) {
    let pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return pref;
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferenceDto,
  ) {
    const pref = await this.getOrCreatePreferences(userId);
    const updated = await this.prisma.notificationPreference.update({
      where: { userId },
      data: dto,
    });
    await this.auditLog(
      userId,
      'UPDATE_PREFERENCES',
      `Updated preferences: ${JSON.stringify(dto)}`,
    );
    return updated;
  }

  /**
   * Create a standard 1-to-1 or 1-to-many notification
   */
  async createNotification(userIds: string[], dto: CreateNotificationDto) {
    // 1. Create the central Notification metadata record
    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        module: dto.module,
        priority: dto.priority,
        icon: dto.icon,
        actionUrl: dto.actionUrl,
      },
    });

    // 2. Create recipient records for each user
    const recipientData = userIds.map((userId) => ({
      notificationId: notification.id,
      userId,
    }));

    await this.prisma.notificationRecipient.createMany({
      data: recipientData,
    });

    // 3. Dispatch real-time alerts (Socket and Email) based on preferences
    for (const userId of userIds) {
      try {
        const pref = await this.getOrCreatePreferences(userId);

        // Socket emit (In-App)
        if (pref.inApp && !pref.doNotDisturb) {
          this.socketGateway.sendToUser(userId, 'notification.created', {
            ...notification,
            recipient: { read: false },
          });
        }

        // Email delivery
        if (pref.email) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });
          if (user && user.email) {
            // Non-blocking fire-and-forget email delivery
            this.emailService
              .sendEmail(
                user.email,
                dto.title,
                dto.description,
                dto.actionUrl
                  ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}${dto.actionUrl}`
                  : undefined,
              )
              .catch((err) =>
                this.logger.error(
                  `Error sending notification email: ${err.message}`,
                ),
              );
          }
        }
      } catch (err) {
        this.logger.error(
          `Error dispatching notification to user ${userId}: ${err.message}`,
        );
      }
    }

    // 4. Audit logs
    await this.prisma.notificationAuditLog.create({
      data: {
        notificationId: notification.id,
        userId: userIds[0] || 'SYSTEM',
        action: 'SEND',
        details: `Sent notification "${dto.title}" to ${userIds.length} users.`,
      },
    });

    return notification;
  }

  /**
   * Broadcast notifications by targeting filters (All, Department, Designation, Roles)
   */
  async broadcastNotification(
    senderUserId: string,
    dto: BroadcastNotificationDto,
  ) {
    let targetedUsers: string[] = [];

    if (dto.targetType === 'ALL') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetedUsers = users.map((u) => u.id);
    } else if (dto.targetType === 'ROLE') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, role: { name: dto.targetId } },
        select: { id: true },
      });
      targetedUsers = users.map((u) => u.id);
    } else if (dto.targetType === 'DEPARTMENT') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, employee: { departmentId: dto.targetId } },
        select: { id: true },
      });
      targetedUsers = users.map((u) => u.id);
    } else if (dto.targetType === 'DESIGNATION') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, employee: { designationId: dto.targetId } },
        select: { id: true },
      });
      targetedUsers = users.map((u) => u.id);
    } else if (dto.targetType === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.targetId },
        select: { userId: true },
      });
      if (employee) {
        targetedUsers = [employee.userId];
      }
    }

    if (targetedUsers.length === 0) {
      return { count: 0, message: 'No recipients matched the target filters.' };
    }

    const notificationDto: CreateNotificationDto = {
      title: dto.title,
      description: dto.description,
      type: 'system.broadcast',
      module: dto.module,
      priority: dto.priority,
      icon: dto.icon,
      actionUrl: dto.actionUrl,
    };

    const notification = await this.createNotification(
      targetedUsers,
      notificationDto,
    );

    await this.prisma.notificationAuditLog.create({
      data: {
        notificationId: notification.id,
        userId: senderUserId,
        action: 'BROADCAST',
        details: `Broadcasted notification to target type ${dto.targetType} (Total Recipients: ${targetedUsers.length})`,
      },
    });

    return { notification, recipientCount: targetedUsers.length };
  }

  /**
   * Get User Notifications (Paginated, Searchable, Filterable)
   */
  async getUserNotifications(userId: string, query: GetNotificationsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      module: searchModule,
      priority,
      read,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (read !== undefined) {
      whereClause.read = read;
    }

    if (searchModule || priority || search) {
      whereClause.notification = {};
      if (searchModule) {
        whereClause.notification.module = searchModule;
      }
      if (priority) {
        whereClause.notification.priority = priority;
      }
      if (search) {
        whereClause.notification.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }
    }

    const [recipients, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where: whereClause,
        include: {
          notification: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notificationRecipient.count({
        where: whereClause,
      }),
    ]);

    const items = recipients.map((r) => ({
      id: r.id,
      notificationId: r.notificationId,
      title: r.notification.title,
      description: r.notification.description,
      type: r.notification.type,
      module: r.notification.module,
      priority: r.notification.priority,
      icon: r.notification.icon,
      actionUrl: r.notification.actionUrl,
      read: r.read,
      readAt: r.readAt,
      createdAt: r.createdAt,
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Unread Notifications count
   */
  async getUnreadCount(userId: string) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 NOTIFICATION SERVICE: getUnreadCount() entered');
    console.log('   User ID:', userId);
    console.log('   Timestamp:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      console.log('📊 NOTIFICATION SERVICE: Executing Prisma query...');
      console.log('   Query: notificationRecipient.count()');
      console.log('   Where: { userId:', userId, ', read: false }');
      
      const count = await this.prisma.notificationRecipient.count({
        where: {
          userId,
          read: false,
        },
      });
      
      console.log('✅ NOTIFICATION SERVICE: Prisma query successful');
      console.log('   Unread count:', count);
      console.log('   Returning: { count:', count, '}');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return { count };
    } catch (error) {
      console.error('❌ NOTIFICATION SERVICE: Prisma query failed');
      console.error('   User ID:', userId);
      console.error('   Error Type:', error.constructor.name);
      console.error('   Error Name:', error.name);
      console.error('   Error Message:', error.message);
      console.error('   Error Code:', error.code);
      console.error('   Error Meta:', JSON.stringify(error.meta || {}, null, 2));
      console.error('   Full Error:', error);
      console.error('   Stack Trace:');
      console.error(error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      this.logger.error(
        `Failed to get unread count for user ${userId}: ${error.message}`,
        error.stack,
      );
      
      throw error;
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, recipientId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Notification not found');
    }

    if (recipient.userId !== userId) {
      throw new ForbiddenException("Cannot mark someone else's notification");
    }

    const updated = await this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: {
        read: true,
        readAt: new Date(),
      },
      include: {
        notification: true,
      },
    });

    // Notify socket client of status update
    this.socketGateway.sendToUser(userId, 'notification.updated', {
      id: updated.id,
      read: true,
      readAt: updated.readAt,
    });

    await this.auditLog(
      userId,
      'READ',
      `Marked notification ${recipientId} as read.`,
    );

    return updated;
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notificationRecipient.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.socketGateway.sendToUser(userId, 'notification.updated-all', {
      read: true,
    });

    await this.auditLog(
      userId,
      'READ_ALL',
      `Marked all unread notifications as read. Count: ${result.count}`,
    );

    return { count: result.count };
  }

  /**
   * Delete single notification
   */
  async deleteNotification(userId: string, recipientId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Notification not found');
    }

    if (recipient.userId !== userId) {
      throw new ForbiddenException("Cannot delete someone else's notification");
    }

    await this.prisma.notificationRecipient.delete({
      where: { id: recipientId },
    });

    this.socketGateway.sendToUser(userId, 'notification.deleted', {
      id: recipientId,
    });

    await this.auditLog(
      userId,
      'DELETE',
      `Deleted notification ${recipientId}.`,
    );

    return { success: true };
  }

  /**
   * Retrieve Audit Logs (HR/Super Admin only)
   */
  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notificationAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificationAuditLog.count(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Internal audit logging helper
   */
  private async auditLog(userId: string, action: string, details: string) {
    try {
      await this.prisma.notificationAuditLog.create({
        data: {
          userId,
          action,
          details,
        },
      });
    } catch (err) {
      this.logger.error(`Error writing notification audit log: ${err.message}`);
    }
  }
}
