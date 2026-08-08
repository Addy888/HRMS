import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  CreateReplyDto,
  AssignComplaintDto,
  ResolveComplaintDto,
  ComplaintStatus,
} from './dto/complaint.dto.js';
import { NotificationService } from '../notifications/notification.service.js';

@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Create a complaint (Employee)
  async createComplaint(
    userId: string,
    dto: CreateComplaintDto,
    file?: Express.Multer.File,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const currentYear = new Date().getFullYear();
    const count = await this.prisma.complaint.count();
    const complaintNumber = `HD-${currentYear}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Complaint
      const complaint = await tx.complaint.create({
        data: {
          complaintNumber,
          title: dto.title,
          category: dto.category,
          priority: dto.priority,
          description: dto.description,
          anonymous: dto.anonymous ?? false,
          status: ComplaintStatus.OPEN,
          organizationId: employee.organizationId,
          raisedById: employee.id,
        },
      });

      // 2. Handle File Attachment if present
      if (file) {
        // Validate size (10 MB = 10 * 1024 * 1024 bytes)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new BadRequestException(
            'Attachment size exceeds the 10 MB limit',
          );
        }

        // Validate extension
        const allowedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Invalid file type. Supported types: PDF, PNG, JPG, JPEG, DOCX',
          );
        }

        const fileUrl = `/uploads/complaints/${file.filename}`;
        await tx.complaintAttachment.create({
          data: {
            complaintId: complaint.id,
            fileUrl,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
          },
        });
      }

      // 3. Add Timeline Event
      await tx.complaintTimeline.create({
        data: {
          complaintId: complaint.id,
          action: 'COMPLAINT_CREATED',
          details: `Complaint ${complaintNumber} has been raised by ${dto.anonymous ? 'Anonymous Employee' : 'Employee'}`,
          actorId: userId,
        },
      });

      // 4. Create Audit Log
      await tx.complaintAuditLog.create({
        data: {
          complaintId: complaint.id,
          userId,
          action: 'CREATED',
          details: `Complaint created. Anonymous: ${dto.anonymous ?? false}`,
          ipAddress,
          userAgent,
        },
      });

      // 5. Send notifications to HR (fire-and-forget via NotificationService)
      const hrUsers = await tx.user.findMany({
        where: { role: { name: 'HR' } },
        select: { id: true },
      });
      const hrIds = hrUsers.map((h: any) => h.id);
      if (hrIds.length > 0) {
        this.notificationService
          .createNotification(hrIds, {
            title:
              dto.priority === 'CRITICAL'
                ? '🚨 CRITICAL Complaint Raised'
                : 'New Complaint Raised',
            description: `Complaint ${complaintNumber} raised under category ${dto.category}. Priority: ${dto.priority}.`,
            type: 'complaint.created',
            module: 'COMPLAINT',
            priority: dto.priority as any,
            icon: 'life-buoy',
            actionUrl: '/hr/complaints',
          })
          .catch(() => {});
      }

      return complaint;
    });
  }

  // Get My Complaints (Employee)
  async getMyComplaints(userId: string, query: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      raisedById: employee.id,
    };

    // Only apply filters if they have actual values
    if (query?.status && query.status.trim()) {
      where.status = query.status;
    }
    if (query?.category && query.category.trim()) {
      where.category = query.category;
    }
    if (query?.priority && query.priority.trim()) {
      where.priority = query.priority;
    }

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    // Format output to respect anonymity if necessary
    const formatted = data.map((item) => ({
      ...item,
      raisedBy: item.anonymous
        ? 'Anonymous'
        : `${employee.firstName} ${employee.lastName}`,
    }));

    return {
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get Complaint Detail (HR and Employees)
  async getComplaintById(
    id: string,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        raisedBy: {
          include: {
            department: true,
            designation: true,
            user: { select: { email: true } },
          },
        },
        assignedTo: true,
        attachments: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { include: { employee: true } } },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              include: { employee: true },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Access Check: Employees can only view their own complaints
    if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (!employee || complaint.raisedById !== employee.id) {
        throw new ForbiddenException('Access denied to this complaint');
      }
    }

    // Log the view in Audit logs
    await this.prisma.complaintAuditLog.create({
      data: {
        complaintId: id,
        userId,
        action: 'VIEWED',
        details: `Complaint details viewed`,
        ipAddress,
        userAgent,
      },
    });

    // If Employee is viewing, hide internal replies and clean up anonymous profile
    const showReplies =
      userRole === 'HR'
        ? complaint.replies
        : complaint.replies.filter((r) => !r.isInternal);

    const formattedReplies = showReplies.map((r) => {
      const isActorHR = r.user.roleId === 'HR'; // or role checking
      return {
        id: r.id,
        message: r.message,
        isInternal: r.isInternal,
        createdAt: r.createdAt,
        sender: r.user.employee
          ? `${r.user.employee.firstName} ${r.user.employee.lastName}`
          : 'System Admin',
        senderRole:
          r.user.id === complaint.raisedBy.userId && complaint.anonymous
            ? 'Anonymous'
            : r.user.employee
              ? 'Employee'
              : 'HR',
      };
    });

    return {
      id: complaint.id,
      complaintNumber: complaint.complaintNumber,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      anonymous: complaint.anonymous,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      resolvedAt: complaint.resolvedAt,
      resolutionTime: complaint.resolutionTime,
      raisedBy:
        complaint.anonymous && userRole !== 'HR'
          ? {
              id: '',
              firstName: 'Anonymous',
              lastName: '',
              department: null,
              designation: null,
            }
          : {
              id: complaint.raisedBy.id,
              firstName: complaint.raisedBy.firstName,
              lastName: complaint.raisedBy.lastName,
              email: complaint.raisedBy.user.email,
              employeeId: complaint.raisedBy.employeeId,
              department: complaint.raisedBy.department?.name || '—',
              designation: complaint.raisedBy.designation?.name || '—',
            },
      assignedTo: complaint.assignedTo
        ? {
            id: complaint.assignedTo.id,
            firstName: complaint.assignedTo.firstName,
            lastName: complaint.assignedTo.lastName,
          }
        : null,
      attachments: complaint.attachments,
      timeline: complaint.timeline.map((t) => ({
        id: t.id,
        action: t.action,
        details: t.details,
        createdAt: t.createdAt,
        actorName: t.actor.employee
          ? `${t.actor.employee.firstName} ${t.actor.employee.lastName}`
          : 'System',
      })),
      replies: formattedReplies,
    };
  }

  // Reply to a Complaint
  async addReply(
    id: string,
    userId: string,
    userRole: string,
    dto: CreateReplyDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Access Check
    if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (!employee || complaint.raisedById !== employee.id) {
        throw new ForbiddenException('Access denied to this complaint');
      }
    }

    // Employees cannot write internal notes
    const isInternal = userRole === 'HR' ? (dto.isInternal ?? false) : false;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Reply
      const reply = await tx.complaintReply.create({
        data: {
          complaintId: id,
          userId,
          message: dto.message,
          isInternal,
        },
      });

      // 2. Set Status (waiting/in progress)
      let nextStatus = complaint.status;
      if (userRole === 'HR' && !isInternal) {
        nextStatus = ComplaintStatus.WAITING_FOR_EMPLOYEE;
      } else if (userRole === 'EMPLOYEE') {
        nextStatus = ComplaintStatus.IN_PROGRESS;
      }

      if (nextStatus !== complaint.status) {
        await tx.complaint.update({
          where: { id },
          data: { status: nextStatus },
        });

        // Add status change timeline
        await tx.complaintTimeline.create({
          data: {
            complaintId: id,
            action: 'STATUS_CHANGED',
            details: `Status updated to ${nextStatus} after reply`,
            actorId: userId,
          },
        });
      }

      // 3. Add Reply Timeline
      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: userRole === 'HR' ? 'HR_REPLIED' : 'EMPLOYEE_REPLIED',
          details: isInternal
            ? `HR logged an internal note`
            : `New message posted`,
          actorId: userId,
        },
      });

      // 4. Audit Log
      await tx.complaintAuditLog.create({
        data: {
          complaintId: id,
          userId,
          action: 'REPLY_ADDED',
          details: `Reply added. Internal: ${isInternal}`,
          ipAddress,
          userAgent,
        },
      });

      // 5. Send Notification (fire-and-forget)
      if (userRole === 'HR' && !isInternal) {
        this.notificationService
          .createNotification([complaint.raisedBy.userId], {
            title: 'HR Replied to Helpdesk Ticket',
            description: `HR has replied to your ticket ${complaint.complaintNumber}. Please check the details.`,
            type: 'complaint.replied',
            module: 'COMPLAINT',
            priority: 'MEDIUM',
            icon: 'message-square',
            actionUrl: '/employee/complaints',
          })
          .catch(() => {});
      } else if (userRole === 'EMPLOYEE') {
        if (complaint.assignedToId) {
          const hr = await tx.employee.findUnique({
            where: { id: complaint.assignedToId },
          });
          if (hr) {
            this.notificationService
              .createNotification([hr.userId], {
                title: 'Employee Replied to Ticket',
                description: `Employee replied to ticket ${complaint.complaintNumber}.`,
                type: 'complaint.replied',
                module: 'COMPLAINT',
                priority: 'LOW',
                icon: 'message-circle',
                actionUrl: '/hr/complaints',
              })
              .catch(() => {});
          }
        }
      }

      return reply;
    });
  }

  // Close Complaint (Employee or HR)
  async closeComplaint(
    id: string,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (!employee || complaint.raisedById !== employee.id) {
        throw new ForbiddenException('Access denied to this complaint');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: { status: ComplaintStatus.CLOSED },
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'CLOSED',
          details: `Ticket closed by ${userRole}`,
          actorId: userId,
        },
      });

      await tx.complaintAuditLog.create({
        data: {
          complaintId: id,
          userId,
          action: 'CLOSED',
          details: `Complaint status marked as CLOSED`,
          ipAddress,
          userAgent,
        },
      });

      // Notification (fire-and-forget)
      if (userRole === 'HR') {
        this.notificationService
          .createNotification([complaint.raisedBy.userId], {
            title: 'Ticket Closed',
            description: `Your ticket ${complaint.complaintNumber} has been marked as closed by HR.`,
            type: 'complaint.closed',
            module: 'COMPLAINT',
            priority: 'MEDIUM',
            icon: 'check-circle',
            actionUrl: '/employee/complaints',
          })
          .catch(() => {});
      }

      return updated;
    });
  }

  // Admin: Get Complaints Queue (HR)
  async getHRComplaintsQueue(userId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get HR user info for debugging
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true, role: true },
    });

    console.log('=== HR COMPLAINTS QUEUE DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Role:', user?.role?.name);
    console.log('Employee ID:', user?.employee?.id);
    console.log('Query Params:', query);

    const where: any = {};

    // HR should see ALL tickets (no employee filtering)
    // Only apply optional filters from query params

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.departmentId) {
      where.raisedBy = {
        departmentId: query.departmentId,
      };
    }

    if (query.search) {
      const searchFilter = { contains: query.search, mode: 'insensitive' };
      where.OR = [
        { complaintNumber: searchFilter },
        { title: searchFilter },
        {
          raisedBy: {
            OR: [
              { firstName: searchFilter },
              { lastName: searchFilter },
              { employeeId: searchFilter },
            ],
          },
        },
      ];
    }

    console.log('Prisma Where Clause:', JSON.stringify(where, null, 2));

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          raisedBy: {
            include: {
              department: true,
            },
          },
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    console.log('Tickets Found:', data.length);
    console.log('Total Count:', total);
    console.log('================================');

    const formatted = data.map((item) => ({
      ...item,
      raisedByName: item.anonymous
        ? 'Anonymous'
        : `${item.raisedBy.firstName} ${item.raisedBy.lastName}`,
      department: item.raisedBy.department?.name || '—',
    }));

    return {
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Admin: Update Status or Details (HR)
  async updateHRComplaint(
    id: string,
    hrUserId: string,
    dto: UpdateComplaintDto,
  ) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.priority) data.priority = dto.priority;
    if (dto.description) data.description = dto.description;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data,
      });

      if (dto.status && dto.status !== complaint.status) {
        await tx.complaintTimeline.create({
          data: {
            complaintId: id,
            action: 'STATUS_CHANGED',
            details: `HR updated status from ${complaint.status} to ${dto.status}`,
            actorId: hrUserId,
          },
        });
      }

      if (dto.priority && dto.priority !== complaint.priority) {
        await tx.complaintTimeline.create({
          data: {
            complaintId: id,
            action: 'PRIORITY_CHANGED',
            details: `HR updated priority from ${complaint.priority} to ${dto.priority}`,
            actorId: hrUserId,
          },
        });
      }

      return updated;
    });
  }

  // Admin: Assign HR Agent to Complaint
  async assignComplaint(id: string, hrUserId: string, dto: AssignComplaintDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const hrAssignee = await this.prisma.employee.findUnique({
      where: { id: dto.assignedToId },
    });
    if (!hrAssignee) {
      throw new NotFoundException('HR agent employee profile not found');
    }

    const hrActor = await this.prisma.employee.findUnique({
      where: { userId: hrUserId },
    });
    if (!hrActor) {
      throw new NotFoundException('HR actor employee profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          assignedToId: dto.assignedToId,
          status: ComplaintStatus.ASSIGNED,
        },
      });

      // Record Assignment History
      await tx.complaintAssignment.create({
        data: {
          complaintId: id,
          assignedToId: dto.assignedToId,
          assignedById: hrActor.id,
        },
      });

      // Record Timeline Event
      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'ASSIGNED',
          details: `Ticket assigned to HR Agent: ${hrAssignee.firstName} ${hrAssignee.lastName}`,
          actorId: hrUserId,
        },
      });

      // Send Notification to Assignee (fire-and-forget)
      this.notificationService
        .createNotification([hrAssignee.userId], {
          title: 'New Support Ticket Assigned',
          description: `Ticket ${complaint.complaintNumber} has been assigned to you. Please review and take action.`,
          type: 'complaint.assigned',
          module: 'COMPLAINT',
          priority: 'HIGH',
          icon: 'user-check',
          actionUrl: '/hr/complaints',
        })
        .catch(() => {});

      return updated;
    });
  }

  // Admin: Resolve Complaint
  async resolveComplaint(
    id: string,
    hrUserId: string,
    dto: ResolveComplaintDto,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const now = new Date();
    const resolutionTimeMinutes = Math.round(
      (now.getTime() - complaint.createdAt.getTime()) / (1000 * 60),
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatus.RESOLVED,
          resolvedAt: now,
          resolutionTime: resolutionTimeMinutes,
        },
      });

      // Log reply as system resolution description
      await tx.complaintReply.create({
        data: {
          complaintId: id,
          userId: hrUserId,
          message: `### Resolution Details:\n${dto.resolutionDetails}`,
          isInternal: false,
        },
      });

      // Add timeline resolved event
      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'RESOLVED',
          details: `Ticket marked as RESOLVED by HR. Total resolution time: ${resolutionTimeMinutes} minutes.`,
          actorId: hrUserId,
        },
      });

      // Notify employee (fire-and-forget)
      this.notificationService
        .createNotification([complaint.raisedBy.userId], {
          title: 'Ticket Resolved',
          description: `Your ticket ${complaint.complaintNumber} has been resolved. Please review and confirm closure.`,
          type: 'complaint.resolved',
          module: 'COMPLAINT',
          priority: 'MEDIUM',
          icon: 'check-circle-2',
          actionUrl: '/employee/complaints',
        })
        .catch(() => {});

      return updated;
    });
  }

  // Admin: Reopen Complaint
  async reopenComplaint(id: string, hrUserId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatus.IN_PROGRESS,
          resolvedAt: null,
          resolutionTime: null,
        },
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'REOPENED',
          details: `Ticket reopened by HR`,
          actorId: hrUserId,
        },
      });

      // Notify employee (fire-and-forget)
      this.notificationService
        .createNotification([complaint.raisedBy.userId], {
          title: 'Ticket Reopened',
          description: `Your ticket ${complaint.complaintNumber} has been reopened by HR for further inspection.`,
          type: 'complaint.updated',
          module: 'COMPLAINT',
          priority: 'MEDIUM',
          icon: 'refresh-cw',
          actionUrl: '/employee/complaints',
        })
        .catch(() => {});

      return updated;
    });
  }

  // Admin: Accept Complaint (NEW)
  async acceptComplaint(id: string, hrUserId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (complaint.status !== ComplaintStatus.OPEN) {
      throw new BadRequestException(
        'Only OPEN complaints can be accepted',
      );
    }

    const hrEmployee = await this.prisma.employee.findUnique({
      where: { userId: hrUserId },
    });
    if (!hrEmployee) {
      throw new NotFoundException('HR employee profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatus.IN_PROGRESS,
          acceptedById: hrEmployee.id,
          acceptedAt: new Date(),
        },
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'ACCEPTED',
          details: `Ticket accepted by HR and moved to IN_PROGRESS`,
          actorId: hrUserId,
        },
      });

      // Notify employee (fire-and-forget)
      this.notificationService
        .createNotification([complaint.raisedBy.userId], {
          title: 'Complaint Accepted',
          description: `Your complaint ${complaint.complaintNumber} has been accepted by HR and is now under review.`,
          type: 'complaint.accepted',
          module: 'COMPLAINT',
          priority: 'MEDIUM',
          icon: 'check-circle',
          actionUrl: '/employee/complaints',
        })
        .catch(() => {});

      return updated;
    });
  }

  // Admin: Reject Complaint (NEW)
  async rejectComplaint(id: string, hrUserId: string, rejectReason: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (complaint.status !== ComplaintStatus.OPEN) {
      throw new BadRequestException(
        'Only OPEN complaints can be rejected',
      );
    }

    const hrEmployee = await this.prisma.employee.findUnique({
      where: { userId: hrUserId },
    });
    if (!hrEmployee) {
      throw new NotFoundException('HR employee profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatus.REJECTED,
          rejectedById: hrEmployee.id,
          rejectedAt: new Date(),
          rejectReason,
        },
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          action: 'REJECTED',
          details: `Ticket rejected by HR. Reason: ${rejectReason}`,
          actorId: hrUserId,
        },
      });

      // Notify employee (fire-and-forget)
      this.notificationService
        .createNotification([complaint.raisedBy.userId], {
          title: 'Complaint Rejected',
          description: `Your complaint ${complaint.complaintNumber} has been rejected by HR. Reason: ${rejectReason}`,
          type: 'complaint.rejected',
          module: 'COMPLAINT',
          priority: 'HIGH',
          icon: 'x-circle',
          actionUrl: '/employee/complaints',
        })
        .catch(() => {});

      return updated;
    });
  }

  // Admin: Get HR Dashboard stats
  async getHRDashboardStats() {
    console.log('=== HR DASHBOARD STATS DEBUG ===');
    
    const [total, open, inProgress, resolved, closed, highPriority, critical] =
      await Promise.all([
        this.prisma.complaint.count(),
        this.prisma.complaint.count({
          where: { status: ComplaintStatus.OPEN },
        }),
        this.prisma.complaint.count({
          where: { status: ComplaintStatus.IN_PROGRESS },
        }),
        this.prisma.complaint.count({
          where: { status: ComplaintStatus.RESOLVED },
        }),
        this.prisma.complaint.count({
          where: { status: ComplaintStatus.CLOSED },
        }),
        this.prisma.complaint.count({ where: { priority: 'HIGH' } }),
        this.prisma.complaint.count({ where: { priority: 'CRITICAL' } }),
      ]);

    console.log('Dashboard Stats:');
    console.log('- Total:', total);
    console.log('- Open:', open);
    console.log('- In Progress:', inProgress);
    console.log('- Resolved:', resolved);
    console.log('- Closed:', closed);
    console.log('================================');

    const resolvedTickets = await this.prisma.complaint.findMany({
      where: {
        resolutionTime: { not: null },
      },
      select: {
        resolutionTime: true,
      },
    });

    const sum = resolvedTickets.reduce(
      (acc, t) => acc + (t.resolutionTime ?? 0),
      0,
    );
    const averageResolutionTime =
      resolvedTickets.length > 0 ? Math.round(sum / resolvedTickets.length) : 0; // in minutes

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      highPriority,
      critical,
      averageResolutionTime, // in minutes
    };
  }

  // Employee: Get Dashboard stats
  async getEmployeeDashboardStats(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const [open, resolved, pendingReply, closed] = await Promise.all([
      this.prisma.complaint.count({
        where: { raisedById: employee.id, status: ComplaintStatus.OPEN },
      }),
      this.prisma.complaint.count({
        where: { raisedById: employee.id, status: ComplaintStatus.RESOLVED },
      }),
      this.prisma.complaint.count({
        where: {
          raisedById: employee.id,
          status: ComplaintStatus.WAITING_FOR_EMPLOYEE,
        },
      }),
      this.prisma.complaint.count({
        where: { raisedById: employee.id, status: ComplaintStatus.CLOSED },
      }),
    ]);

    return {
      open,
      resolved,
      pendingReply,
      closed,
    };
  }
}
