import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTaskDto, TaskType, TaskStatus } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { UserRole } from '../../common/constants/index.js';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private isHROrAdmin(role: string): boolean {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.HR_ADMIN,
      UserRole.HR_USER,
      UserRole.HR,
      UserRole.PLATFORM_SUPER_ADMIN,
    ].includes(role as UserRole);
  }

  /**
   * Helper to fetch authenticated user with role and employee record
   */
  private async getAuthContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('User not authenticated or organization missing');
    }

    return user;
  }

  /**
   * Create a new Task, Visit, or Daily Activity
   */
  async create(userId: string, dto: CreateTaskDto) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);

    let targetEmployeeId: string;

    if (isHR && dto.employeeId) {
      // HR creating task for specific employee
      const emp = await this.prisma.employee.findFirst({
        where: {
          id: dto.employeeId,
          organizationId: authUser.organizationId,
        },
      });
      if (!emp) {
        throw new NotFoundException('Target employee not found in your organization');
      }
      targetEmployeeId = emp.id;
    } else {
      // Employee creating task for themselves
      if (!authUser.employee) {
        throw new BadRequestException('Authenticated user does not have an employee profile');
      }
      targetEmployeeId = authUser.employee.id;
    }

    const completedAt =
      dto.status === TaskStatus.COMPLETED
        ? dto.completedAt
          ? new Date(dto.completedAt)
          : new Date()
        : dto.completedAt
        ? new Date(dto.completedAt)
        : null;

    const task = await this.prisma.employeeTask.create({
      data: {
        organizationId: authUser.organizationId,
        employeeId: targetEmployeeId,
        createdByUserId: isHR ? authUser.id : null,
        taskType: dto.taskType || TaskType.TASK,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        status: dto.status || TaskStatus.PENDING,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        completedAt,
        // Visit fields
        visitCount: dto.visitCount !== undefined ? dto.visitCount : 1,
        visitClientName: dto.visitClientName,
        visitLocation: dto.visitLocation,
        visitPurpose: dto.visitPurpose,
        visitOutcome: dto.visitOutcome,
        followUpRequired: dto.followUpRequired ?? false,
        visitFollowUpDate: dto.visitFollowUpDate ? new Date(dto.visitFollowUpDate) : null,
        visitFollowUpNotes: dto.visitFollowUpNotes,
        // Daily Activity fields
        activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
        workHours: dto.workHours,
        remarks: dto.remarks,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Task/Activity created successfully',
      data: task,
    };
  }

  /**
   * Find all tasks matching filters with role-based scoping
   */
  async findAll(userId: string, query: QueryTaskDto) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);
    const isTeamLeader = roleName === 'TEAM_LEADER';

    const where: any = {
      organizationId: authUser.organizationId,
    };

    // Role-based scoping
    if (isHR) {
      // HR can filter by employeeId or departmentId
      if (query.employeeId) {
        where.employeeId = query.employeeId;
      }
      if (query.departmentId) {
        where.employee = { departmentId: query.departmentId };
      }
    } else if (isTeamLeader) {
      // Team leader can ONLY see their assigned department's employees
      const myDeptId = authUser.employee?.departmentId;
      if (!myDeptId) {
        throw new ForbiddenException('Team leader is not assigned to any department');
      }
      where.employee = { departmentId: myDeptId };

      // Can optionally filter within their own team
      if (query.employeeId) {
        where.employeeId = query.employeeId;
      }
    } else {
      // Standard employee can ONLY see their own tasks
      if (!authUser.employee) {
        throw new BadRequestException('User does not have an employee profile');
      }
      where.employeeId = authUser.employee.id;
    }

    // Additional query filters
    if (query.taskType) {
      where.taskType = query.taskType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.client) {
      where.visitClientName = { contains: query.client };
    }
    if (query.startDate || query.endDate) {
      where.activityDate = {};
      if (query.startDate) {
        where.activityDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.activityDate.lte = end;
      }
    }
    if (query.search && query.search.trim().length > 0) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { visitClientName: { contains: q } },
        { visitLocation: { contains: q } },
        { visitOutcome: { contains: q } },
        { remarks: { contains: q } },
        {
          employee: {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { employeeId: { contains: q } },
            ],
          },
        },
      ];
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.employeeTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.employeeTask.count({ where }),
    ]);

    return {
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get activity statistics & summary widget data
   */
  async getSummary(userId: string, employeeId?: string, departmentId?: string) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);
    const isTeamLeader = roleName === 'TEAM_LEADER';

    const baseWhere: any = {
      organizationId: authUser.organizationId,
    };

    if (isHR) {
      if (employeeId) baseWhere.employeeId = employeeId;
      if (departmentId) baseWhere.employee = { departmentId };
    } else if (isTeamLeader) {
      const myDeptId = authUser.employee?.departmentId;
      if (myDeptId) {
        baseWhere.employee = { departmentId: myDeptId };
      }
      if (employeeId) baseWhere.employeeId = employeeId;
    } else {
      if (!authUser.employee) {
        throw new BadRequestException('User does not have an employee profile');
      }
      baseWhere.employeeId = authUser.employee.id;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Week start (last 7 days)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      totalActivities,
      completedActivities,
      pendingActivities,
      inProgressActivities,
      allVisits,
      activitiesThisWeek,
      todayTasks,
    ] = await Promise.all([
      this.prisma.employeeTask.count({ where: baseWhere }),
      this.prisma.employeeTask.count({
        where: { ...baseWhere, status: TaskStatus.COMPLETED },
      }),
      this.prisma.employeeTask.count({
        where: { ...baseWhere, status: TaskStatus.PENDING },
      }),
      this.prisma.employeeTask.count({
        where: { ...baseWhere, status: TaskStatus.IN_PROGRESS },
      }),
      this.prisma.employeeTask.findMany({
        where: { ...baseWhere, taskType: TaskType.VISIT },
        select: { visitCount: true },
      }),
      this.prisma.employeeTask.count({
        where: {
          ...baseWhere,
          activityDate: { gte: weekStart },
        },
      }),
      this.prisma.employeeTask.findMany({
        where: {
          ...baseWhere,
          activityDate: { gte: todayStart, lte: todayEnd },
        },
        select: { status: true, visitCount: true, taskType: true },
      }),
    ]);

    const totalVisits = allVisits.reduce((sum, item) => sum + (item.visitCount || 1), 0);

    const todayActivities = todayTasks.length;
    const todayCompleted = todayTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const todayPending = todayTasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const todayVisits = todayTasks
      .filter((t) => t.taskType === TaskType.VISIT)
      .reduce((sum, item) => sum + (item.visitCount || 1), 0);

    return {
      success: true,
      data: {
        totalActivities,
        completedActivities,
        pendingActivities,
        inProgressActivities,
        totalVisits,
        activitiesThisWeek,
        today: {
          activities: todayActivities,
          completed: todayCompleted,
          pending: todayPending,
          visits: todayVisits,
        },
      },
    };
  }

  /**
   * Find a single task with ownership validation
   */
  async findOne(userId: string, id: string) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);
    const isTeamLeader = roleName === 'TEAM_LEADER';

    const task = await this.prisma.employeeTask.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task || task.organizationId !== authUser.organizationId) {
      throw new NotFoundException('Task not found');
    }

    if (!isHR) {
      if (isTeamLeader) {
        if (task.employee.departmentId !== authUser.employee?.departmentId) {
          throw new ForbiddenException('Access denied: Employee does not belong to your team');
        }
      } else {
        if (task.employeeId !== authUser.employee?.id) {
          throw new ForbiddenException('Access denied: You can only view your own tasks');
        }
      }
    }

    return {
      success: true,
      data: task,
    };
  }

  /**
   * Update task (Employee can update own task; HR can update any within org)
   */
  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);

    const existing = await this.prisma.employeeTask.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing || existing.organizationId !== authUser.organizationId) {
      throw new NotFoundException('Task not found');
    }

    // Backend enforcement: Employees can ONLY edit their own tasks!
    if (!isHR) {
      if (existing.employeeId !== authUser.employee?.id) {
        throw new ForbiddenException('You can only modify your own tasks and activities');
      }
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === TaskStatus.COMPLETED && !existing.completedAt) {
        updateData.completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
      }
    }
    if (dto.scheduledDate !== undefined) {
      updateData.scheduledDate = dto.scheduledDate ? new Date(dto.scheduledDate) : null;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.completedAt !== undefined) {
      updateData.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    }
    if (dto.visitCount !== undefined) updateData.visitCount = dto.visitCount;
    if (dto.visitClientName !== undefined) updateData.visitClientName = dto.visitClientName;
    if (dto.visitLocation !== undefined) updateData.visitLocation = dto.visitLocation;
    if (dto.visitPurpose !== undefined) updateData.visitPurpose = dto.visitPurpose;
    if (dto.visitOutcome !== undefined) updateData.visitOutcome = dto.visitOutcome;
    if (dto.followUpRequired !== undefined) updateData.followUpRequired = dto.followUpRequired;
    if (dto.visitFollowUpDate !== undefined) {
      updateData.visitFollowUpDate = dto.visitFollowUpDate ? new Date(dto.visitFollowUpDate) : null;
    }
    if (dto.visitFollowUpNotes !== undefined) updateData.visitFollowUpNotes = dto.visitFollowUpNotes;
    if (dto.activityDate !== undefined) {
      updateData.activityDate = dto.activityDate ? new Date(dto.activityDate) : null;
    }
    if (dto.workHours !== undefined) updateData.workHours = dto.workHours;
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;

    const updated = await this.prisma.employeeTask.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Task/Activity updated successfully',
      data: updated,
    };
  }

  /**
   * Delete task
   */
  async remove(userId: string, id: string) {
    const authUser = await this.getAuthContext(userId);
    const roleName = authUser.role.name;
    const isHR = this.isHROrAdmin(roleName);

    const existing = await this.prisma.employeeTask.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== authUser.organizationId) {
      throw new NotFoundException('Task not found');
    }

    if (!isHR && existing.employeeId !== authUser.employee?.id) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.prisma.employeeTask.delete({ where: { id } });

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }
}
