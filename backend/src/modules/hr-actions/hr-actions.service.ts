import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import {
  CreateHRActionDto,
  UpdateHRActionDto,
  RespondHRActionDto,
  ResolveHRActionDto,
  CancelHRActionDto,
  QueryHRActionsDto,
  HRActionStatus,
} from './dto/hr-action.dto.js';

@Injectable()
export class HRActionsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Generate unique action number in transaction-safe manner
   * Format: FCS-HRA-0001, FCS-HRA-0002, etc.
   */
  private async generateActionNumber(organizationId: string): Promise<string> {
    return await this.prisma.$transaction(async (tx) => {
      const lastAction = await tx.hRAction.findFirst({
        where: { organizationId },
        orderBy: { actionNumber: 'desc' },
      });

      let nextNumber = 1;
      if (lastAction?.actionNumber) {
        const match = lastAction.actionNumber.match(/FCS-HRA-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `FCS-HRA-${String(nextNumber).padStart(4, '0')}`;
    });
  }

  /**
   * Create HR Action (Draft or Issued based on sendImmediately flag)
   */
  async create(dto: CreateHRActionDto, userId: string, sendImmediately: boolean = false) {
    console.log('[HR ACTIONS CREATE] Starting create action');
    console.log('[HR ACTIONS CREATE] sendImmediately:', sendImmediately);
    console.log('[HR ACTIONS CREATE] dto.employeeId:', dto.employeeId);
    console.log('[HR ACTIONS CREATE] userId:', userId);
    
    // Validate user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('User not found or not associated with organization');
    }

    console.log('[HR ACTIONS CREATE] HR User:', { id: user.id, email: user.email, organizationId: user.organizationId });

    // Validate employee exists and belongs to same organization
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: {
        user: { select: { id: true, email: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    console.log('[HR ACTIONS CREATE] Target Employee:', {
      id: employee.id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      userId: employee.userId,
      organizationId: employee.organizationId
    });

    if (employee.organizationId !== user.organizationId) {
      throw new ForbiddenException('Employee belongs to different organization');
    }

    // Generate action number
    const actionNumber = await this.generateActionNumber(user.organizationId);

    console.log('[HR ACTIONS CREATE] Generated action number:', actionNumber);

    // Determine status based on sendImmediately flag
    const status = sendImmediately ? HRActionStatus.ISSUED : HRActionStatus.DRAFT;
    const now = new Date();

    console.log('[HR ACTIONS CREATE] Status:', status);
    console.log('[HR ACTIONS CREATE] Creating action with employeeId:', employee.id);

    // Create action
    return this.prisma.$transaction(async (tx) => {
      const action = await tx.hRAction.create({
        data: {
          actionNumber,
          employeeId: dto.employeeId,
          issuedById: userId,
          organizationId: user.organizationId,
          actionType: dto.actionType,
          severity: dto.severity,
          subject: dto.subject,
          reason: dto.reason,
          incidentDate: new Date(dto.incidentDate),
          correctiveAction: dto.correctiveAction,
          additionalRemarks: dto.additionalRemarks,
          responseRequired: dto.responseRequired,
          responseDeadline: dto.responseDeadline ? new Date(dto.responseDeadline) : null,
          status,
          issuedAt: sendImmediately ? now : null,
        },
        include: {
          employee: {
            include: {
              user: { select: { id: true, email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
          issuedBy: {
            select: { email: true, employee: { select: { firstName: true, lastName: true } } },
          },
        },
      });

      console.log('[HR ACTIONS CREATE] Action created:', {
        id: action.id,
        actionNumber: action.actionNumber,
        employeeId: action.employeeId,
        status: action.status,
        issuedAt: action.issuedAt
      });

      // Audit log
      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: action.id,
          userId,
          action: sendImmediately ? 'CREATED_AND_ISSUED' : 'CREATED',
          details: `HR Action ${actionNumber} created in ${status} status`,
        },
      });

      // Send notification if issued immediately
      if (sendImmediately) {
        console.log('[HR ACTIONS CREATE] Sending notification to user:', action.employee.user.id);
        this.notificationService
          .createNotification([action.employee.user.id], {
            title: `⚠️ New HR Action: ${action.subject}`,
            description: `You have received an official HR action (${action.actionNumber}). Please review immediately.`,
            type: 'hr_action.issued',
            module: 'HR_ACTION',
            priority: action.severity === 'CRITICAL' ? 'CRITICAL' : action.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            icon: 'alert-triangle',
            actionUrl: '/employee/hr-actions',
          })
          .catch((err) => console.error('Failed to send notification:', err));
      }

      return action;
    });
  }

  /**
   * Update HR Action (only in DRAFT status)
   */
  async update(id: string, dto: UpdateHRActionDto, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: { issuedBy: true },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    if (action.status !== HRActionStatus.DRAFT) {
      throw new BadRequestException('Can only update actions in DRAFT status');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || action.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (action.issuedById !== userId) {
      throw new ForbiddenException('You can only update your own actions');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          actionType: dto.actionType,
          severity: dto.severity,
          subject: dto.subject,
          reason: dto.reason,
          incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
          correctiveAction: dto.correctiveAction,
          additionalRemarks: dto.additionalRemarks,
          responseRequired: dto.responseRequired,
          responseDeadline: dto.responseDeadline ? new Date(dto.responseDeadline) : undefined,
        },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'UPDATED',
          details: `HR Action ${action.actionNumber} updated`,
        },
      });

      return updated;
    });
  }

  /**
   * Issue HR Action (DRAFT → ISSUED)
   * This sends the action to the employee, making it immediately visible
   */
  async issue(id: string, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    if (action.status !== HRActionStatus.DRAFT) {
      throw new BadRequestException('Can only issue actions in DRAFT status');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || action.organizationId !== user.organizationId || action.issuedById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: HRActionStatus.ISSUED,
          issuedAt: new Date(),
        },
        include: {
          employee: {
            include: {
              user: { select: { id: true, email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'ISSUED',
          details: `HR Action ${action.actionNumber} issued to employee`,
        },
      });

      // Send notification to employee
      this.notificationService
        .createNotification([action.employee.user.id], {
          title: `⚠️ New HR Action: ${action.subject}`,
          description: `You have received an official HR action (${action.actionNumber}). Please review immediately.`,
          type: 'hr_action.issued',
          module: 'HR_ACTION',
          priority: action.severity === 'CRITICAL' ? 'CRITICAL' : action.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          icon: 'alert-triangle',
          actionUrl: '/employee/hr-actions',
        })
        .catch((err) => console.error('Failed to send notification:', err));

      return updated;
    });
  }

  /**
   * Send HR Action to Employee (ISSUED → SENT)
   * Sends notification to employee
   */
  async send(id: string, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    if (action.status !== HRActionStatus.ISSUED) {
      throw new BadRequestException('Can only send actions in ISSUED status');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || action.organizationId !== user.organizationId || action.issuedById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: HRActionStatus.SENT,
          sentAt: new Date(),
        },
        include: {
          employee: {
            include: {
              user: { select: { id: true, email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'SENT',
          details: `HR Action ${action.actionNumber} sent to employee`,
        },
      });

      // Send notification to employee
      this.notificationService
        .createNotification([action.employee.user.id], {
          title: `⚠️ HR Warning/Notice: ${action.subject}`,
          description: `You have received an official HR notice (${action.actionNumber}). Please review immediately.`,
          type: 'hr_action.sent',
          module: 'HR_ACTION',
          priority: action.severity === 'CRITICAL' ? 'CRITICAL' : action.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          icon: 'alert-triangle',
          actionUrl: '/employee/hr-actions',
        })
        .catch((err) => console.error('Failed to send notification:', err));

      return updated;
    });
  }

  /**
   * Mark HR Action as viewed when employee opens it for the first time
   */
  async markAsViewed(id: string, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: { include: { user: { select: { id: true } } } },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    // Verify employee owns this action
    if (action.employee.user.id !== userId) {
      throw new ForbiddenException('You can only view your own HR actions');
    }

    // Only mark as viewed if currently ISSUED and not yet viewed
    if (action.status === HRActionStatus.ISSUED && !action.viewedAt) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.hRAction.update({
          where: { id },
          data: {
            status: HRActionStatus.VIEWED,
            viewedAt: new Date(),
          },
        });

        await tx.hRActionAuditLog.create({
          data: {
            hrActionId: id,
            userId,
            action: 'VIEWED',
            details: `Employee viewed HR Action ${action.actionNumber}`,
          },
        });

        return updated;
      });
    }

    return action;
  }

  /**
   * Employee acknowledges HR Action (VIEWED → ACKNOWLEDGED or RESPONSE_PENDING)
   */
  async acknowledge(id: string, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: { include: { user: { select: { id: true } } } },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    // Verify employee owns this action
    if (action.employee.user.id !== userId) {
      throw new ForbiddenException('You can only acknowledge your own HR actions');
    }

    if (action.status !== HRActionStatus.ISSUED && 
        action.status !== HRActionStatus.VIEWED &&
        action.status !== HRActionStatus.SENT) {
      throw new BadRequestException('Action is not in a state to be acknowledged');
    }

    const newStatus = action.responseRequired ? HRActionStatus.RESPONSE_PENDING : HRActionStatus.ACKNOWLEDGED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: newStatus,
          acknowledgedAt: new Date(),
          acknowledgedById: userId,
          viewedAt: action.viewedAt || new Date(), // Ensure viewedAt is set
        },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'ACKNOWLEDGED',
          details: `Employee acknowledged HR Action ${action.actionNumber}`,
        },
      });

      // Notify HR
      this.notificationService
        .createNotification([action.issuedById], {
          title: 'HR Action Acknowledged',
          description: `${action.employee.firstName} ${action.employee.lastName} has acknowledged HR Action ${action.actionNumber}`,
          type: 'hr_action.acknowledged',
          module: 'HR_ACTION',
          priority: 'LOW',
          icon: 'check-circle',
          actionUrl: '/hr/hr-actions',
        })
        .catch(() => {});

      return updated;
    });
  }

  /**
   * Employee submits response to HR Action
   */
  async respond(id: string, dto: RespondHRActionDto, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: { include: { user: { select: { id: true } } } },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    if (action.employee.user.id !== userId) {
      throw new ForbiddenException('You can only respond to your own HR actions');
    }

    if (action.status !== HRActionStatus.RESPONSE_PENDING && action.status !== HRActionStatus.ACKNOWLEDGED) {
      throw new BadRequestException('Action is not in a state to accept responses');
    }

    if (!action.responseRequired) {
      throw new BadRequestException('This action does not require a response');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: HRActionStatus.RESPONSE_SUBMITTED,
          responseText: dto.responseText,
          responseSubmittedAt: new Date(),
        },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'RESPONSE_SUBMITTED',
          details: `Employee submitted response to HR Action ${action.actionNumber}`,
        },
      });

      // Notify HR
      this.notificationService
        .createNotification([action.issuedById], {
          title: 'HR Action Response Received',
          description: `${action.employee.firstName} ${action.employee.lastName} has submitted a response to HR Action ${action.actionNumber}`,
          type: 'hr_action.response_submitted',
          module: 'HR_ACTION',
          priority: 'MEDIUM',
          icon: 'message-square',
          actionUrl: '/hr/hr-actions',
        })
        .catch(() => {});

      return updated;
    });
  }

  /**
   * HR resolves HR Action
   */
  async resolve(id: string, dto: ResolveHRActionDto, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || action.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (action.status === HRActionStatus.RESOLVED || action.status === HRActionStatus.CANCELLED) {
      throw new BadRequestException('Action is already resolved or cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: HRActionStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: userId,
          resolvedRemarks: dto.resolvedRemarks,
        },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'RESOLVED',
          details: `HR Action ${action.actionNumber} resolved by HR`,
        },
      });

      // Notify employee
      this.notificationService
        .createNotification([action.employee.user.id], {
          title: 'HR Action Resolved',
          description: `Your HR Action ${action.actionNumber} has been resolved`,
          type: 'hr_action.resolved',
          module: 'HR_ACTION',
          priority: 'MEDIUM',
          icon: 'check-circle-2',
          actionUrl: '/employee/hr-actions',
        })
        .catch(() => {});

      return updated;
    });
  }

  /**
   * HR cancels HR Action
   */
  async cancel(id: string, dto: CancelHRActionDto, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || action.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (action.status === HRActionStatus.RESOLVED || action.status === HRActionStatus.CANCELLED) {
      throw new BadRequestException('Action is already resolved or cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hRAction.update({
        where: { id },
        data: {
          status: HRActionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancelledReason: dto.cancelledReason,
        },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      await tx.hRActionAuditLog.create({
        data: {
          hrActionId: id,
          userId,
          action: 'CANCELLED',
          details: `HR Action ${action.actionNumber} cancelled. Reason: ${dto.cancelledReason}`,
        },
      });

      // Notify employee if action was sent
      if (action.status !== HRActionStatus.DRAFT && action.status !== HRActionStatus.ISSUED) {
        this.notificationService
          .createNotification([action.employee.user.id], {
            title: 'HR Action Cancelled',
            description: `HR Action ${action.actionNumber} has been cancelled`,
            type: 'hr_action.cancelled',
            module: 'HR_ACTION',
            priority: 'LOW',
            icon: 'x-circle',
            actionUrl: '/employee/hr-actions',
          })
          .catch(() => {});
      }

      return updated;
    });
  }

  /**
   * Get all HR Actions (HR view with filters and pagination)
   */
  async findAll(query: QueryHRActionsDto, userId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('User not found');
    }

    const whereClause: any = {
      organizationId: user.organizationId,
    };

    // HR Ownership: HR_USER can only see actions they issued
    if (user.role.name === 'HR_USER' || user.role.name === 'HR') {
      whereClause.issuedById = userId;
    }

    // Apply filters
    if (query.employeeId) {
      whereClause.employeeId = query.employeeId;
    }

    if (query.actionType) {
      whereClause.actionType = query.actionType;
    }

    if (query.severity) {
      whereClause.severity = query.severity;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.departmentId) {
      whereClause.employee = {
        departmentId: query.departmentId,
      };
    }

    if (query.fromDate || query.toDate) {
      whereClause.incidentDate = {};
      if (query.fromDate) {
        whereClause.incidentDate.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        whereClause.incidentDate.lte = new Date(query.toDate);
      }
    }

    if (query.search) {
      whereClause.OR = [
        { actionNumber: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        {
          employee: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { employeeId: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.hRAction.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: {
              user: { select: { email: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
          issuedBy: {
            select: { email: true, employee: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.hRAction.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single HR Action by ID
   */
  async findOne(id: string, userId: string) {
    const action = await this.prisma.hRAction.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        issuedBy: {
          select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
        },
        acknowledgedBy: {
          select: { email: true, employee: { select: { firstName: true, lastName: true } } },
        },
        resolvedBy: {
          select: { email: true, employee: { select: { firstName: true, lastName: true } } },
        },
        cancelledBy: {
          select: { email: true, employee: { select: { firstName: true, lastName: true } } },
        },
        auditLogs: {
          include: {
            user: {
              select: { email: true, employee: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('HR Action not found');
    }

    // Verify access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // HR can access actions in their organization
    const isHR = ['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'].includes(user.role.name);
    if (isHR) {
      if (action.organizationId !== user.organizationId) {
        throw new ForbiddenException('Access denied');
      }
      // HR_USER can only see their own actions
      if (user.role.name === 'HR_USER' && action.issuedById !== userId) {
        throw new ForbiddenException('You can only view actions you created');
      }
    } else {
      // Employee can only see their own actions
      if (action.employee.user.id !== userId) {
        throw new ForbiddenException('You can only view your own HR actions');
      }

      // Mark as viewed if first time and status is ISSUED
      if (action.status === HRActionStatus.ISSUED && !action.viewedAt) {
        await this.prisma.$transaction(async (tx) => {
          await tx.hRAction.update({
            where: { id },
            data: {
              status: HRActionStatus.VIEWED,
              viewedAt: new Date(),
            },
          });

          await tx.hRActionAuditLog.create({
            data: {
              hrActionId: id,
              userId,
              action: 'VIEWED',
              details: `Employee viewed HR Action ${action.actionNumber}`,
            },
          });
        });

        // Update the returned action object
        action.status = HRActionStatus.VIEWED;
        action.viewedAt = new Date();
      }
    }

    return action;
  }

  /**
   * Get employee's HR actions (employee can only see ISSUED and later statuses, not DRAFT)
   */
  async findByEmployee(employeeId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, employee: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify access
    const isHR = ['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'].includes(user.role.name);
    if (!isHR && user.employee?.id !== employeeId) {
      throw new ForbiddenException('You can only view your own HR actions');
    }

    const actions = await this.prisma.hRAction.findMany({
      where: {
        employeeId,
        organizationId: user.organizationId,
        // Only show issued/viewed/acknowledged/resolved actions to employees, not drafts
        status: {
          notIn: isHR ? [] : [HRActionStatus.DRAFT],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        issuedBy: {
          select: { email: true, employee: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return actions;
  }

  /**
   * Get current user's HR actions (simplified endpoint for employees)
   * Employee can only see ISSUED and later statuses
   */
  async getMyActions(userId: string) {
    console.log('[HR ACTIONS SERVICE] getMyActions called for userId:', userId);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    console.log('[HR ACTIONS SERVICE] User found:', user ? {
      id: user.id,
      email: user.email,
      hasEmployee: !!user.employee,
      employeeId: user.employee?.id,
      employeeDisplayId: user.employee?.employeeId,
      organizationId: user.organizationId
    } : 'NOT FOUND');

    if (!user || !user.employee) {
      console.log('[HR ACTIONS SERVICE] ERROR: User has no employee profile');
      throw new NotFoundException('Employee profile not found');
    }

    console.log('[HR ACTIONS SERVICE] Querying HR Actions with:');
    console.log('  - employeeId:', user.employee.id);
    console.log('  - organizationId:', user.organizationId);
    console.log('  - excluding status: DRAFT');

    // First, let's check ALL actions for this employee (including DRAFT) to debug
    const allActions = await this.prisma.hRAction.findMany({
      where: {
        employeeId: user.employee.id,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        actionNumber: true,
        status: true,
        employeeId: true,
        organizationId: true,
        createdAt: true,
      },
    });

    console.log('[HR ACTIONS SERVICE] ALL actions (including DRAFT):', allActions.length);
    if (allActions.length > 0) {
      console.log('[HR ACTIONS SERVICE] All actions details:', allActions.map(a => ({
        actionNumber: a.actionNumber,
        status: a.status,
        employeeId: a.employeeId,
        matches: a.employeeId === user.employee!.id
      })));
    }

    const actions = await this.prisma.hRAction.findMany({
      where: {
        employeeId: user.employee.id,
        organizationId: user.organizationId,
        // Only show issued and later statuses to employees
        status: {
          notIn: [HRActionStatus.DRAFT],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        issuedBy: {
          select: { email: true, employee: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    console.log('[HR ACTIONS SERVICE] Filtered actions (excluding DRAFT):', actions.length);
    if (actions.length > 0) {
      console.log('[HR ACTIONS SERVICE] Actions details:', actions.map(a => ({
        actionNumber: a.actionNumber,
        status: a.status,
        employeeId: a.employeeId,
        actionType: a.actionType,
        severity: a.severity
      })));
    } else {
      console.log('[HR ACTIONS SERVICE] WARNING: No actions found after filtering');
    }

    return actions;
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('User not found');
    }

    const whereClause: any = {
      organizationId: user.organizationId,
    };

    // HR Ownership filter
    if (user.role.name === 'HR_USER' || user.role.name === 'HR') {
      whereClause.issuedById = userId;
    }

    const [
      total,
      byStatus,
      bySeverity,
      byType,
    ] = await Promise.all([
      this.prisma.hRAction.count({ where: whereClause }),
      this.prisma.hRAction.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      this.prisma.hRAction.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: true,
      }),
      this.prisma.hRAction.groupBy({
        by: ['actionType'],
        where: whereClause,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.actionType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
