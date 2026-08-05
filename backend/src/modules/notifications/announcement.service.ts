import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { SocketGateway } from './socket.gateway.js';
import { CreateAnnouncementDto } from './dto/notification.dto.js';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Publish a new Announcement (HR only)
   */
  async createAnnouncement(hrUserId: string, dto: CreateAnnouncementDto) {
    // 1. Create central Announcement
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        createdById: hrUserId,
      },
      include: {
        createdBy: {
          select: {
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // 2. Fetch all active users to create recipient link records
    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const recipientData = activeUsers.map((u) => ({
      announcementId: announcement.id,
      userId: u.id,
    }));

    await this.prisma.announcementRecipient.createMany({
      data: recipientData,
    });

    // 3. Broadcast instantly via socket
    this.socketGateway.broadcast('announcement.created', {
      ...announcement,
      read: false,
    });

    this.logger.log(`Announcement published: ${announcement.title}. Broadcasted to ${activeUsers.length} users.`);

    // 4. Log to notification audits
    await this.prisma.notificationAuditLog.create({
      data: {
        userId: hrUserId,
        action: 'CREATE_ANNOUNCEMENT',
        details: `Published announcement "${dto.title}" (Category: ${dto.category}) to ${activeUsers.length} recipients.`,
      },
    });

    return announcement;
  }

  /**
   * Get Announcements feed for employee/user (Paginated, showing read/unread status)
   */
  async getAnnouncements(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const whereClause = {
      userId,
    };

    const [recipients, total] = await Promise.all([
      this.prisma.announcementRecipient.findMany({
        where: whereClause,
        include: {
          announcement: {
            include: {
              createdBy: {
                select: {
                  email: true,
                  employee: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.announcementRecipient.count({
        where: whereClause,
      }),
    ]);

    const items = recipients.map((r) => ({
      id: r.announcement.id,
      recipientId: r.id, // announcement recipient junction row id
      title: r.announcement.title,
      content: r.announcement.content,
      category: r.announcement.category,
      createdAt: r.announcement.createdAt,
      read: r.read,
      readAt: r.readAt,
      author: r.announcement.createdBy.employee
        ? `${r.announcement.createdBy.employee.firstName} ${r.announcement.createdBy.employee.lastName}`
        : r.announcement.createdBy.email,
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
   * Mark announcement as read
   */
  async markAsRead(userId: string, recipientId: string) {
    const r = await this.prisma.announcementRecipient.findUnique({
      where: { id: recipientId },
    });

    if (r && r.userId === userId) {
      return this.prisma.announcementRecipient.update({
        where: { id: recipientId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    }
  }
}
