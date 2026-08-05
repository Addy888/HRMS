import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreatePolicyDto, UpdatePolicyDto, AssignPolicyDto, AcceptPolicyDto, SubmitAcknowledgementDto } from './dto/policy.dto.js';
import { NotificationService } from '../notifications/notification.service.js';

@Injectable()
export class PoliciesService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async listPolicies(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { policyNumber: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { assignments: true, _count: { select: { acceptances: true } } },
      }),
      this.prisma.policy.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPolicyById(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        assignments: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        _count: { select: { acceptances: true } },
      },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async createPolicy(hrUserId: string, dto: CreatePolicyDto) {
    // Check duplicate title or number
    const existing = await this.prisma.policy.findFirst({
      where: { OR: [{ title: dto.title }, { policyNumber: dto.policyNumber }] },
    });
    if (existing) {
      throw new BadRequestException('A policy with this title or policy number already exists.');
    }

    const hrUser = await this.prisma.user.findUnique({
      where: { id: hrUserId },
      include: { employee: true },
    });
    const creatorName = hrUser?.employee ? `${hrUser.employee.firstName} ${hrUser.employee.lastName}` : 'HR Admin';

    return this.prisma.$transaction(async (tx) => {
      const policy = await tx.policy.create({
        data: {
          title: dto.title,
          policyNumber: dto.policyNumber,
          category: dto.category,
          description: dto.description || null,
          content: dto.content,
          version: 1,
          status: 'DRAFT',
          effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          createdBy: creatorName,
        },
      });

      // Log initial version
      await tx.policyVersion.create({
        data: {
          policyId: policy.id,
          title: policy.title,
          content: policy.content,
          versionNumber: 1,
          effectiveDate: policy.effectiveDate,
        },
      });

      // Audit Log
      await tx.policyAuditLog.create({
        data: {
          policyId: policy.id,
          userId: hrUserId,
          action: 'CREATE',
          details: `Policy created in DRAFT status`,
        },
      });

      return policy;
    });
  }

  async updatePolicy(hrUserId: string, id: string, dto: UpdatePolicyDto) {
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');

    const hrUser = await this.prisma.user.findUnique({
      where: { id: hrUserId },
      include: { employee: true },
    });
    const updaterName = hrUser?.employee ? `${hrUser.employee.firstName} ${hrUser.employee.lastName}` : 'HR Admin';

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.category) updateData.category = dto.category;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.effectiveDate) updateData.effectiveDate = new Date(dto.effectiveDate);
    if (dto.expiryDate) updateData.expiryDate = new Date(dto.expiryDate);
    updateData.updatedBy = updaterName;

    // Check if rich text content changed
    let contentChanged = false;
    let nextVersion = policy.version;

    if (dto.content && dto.content !== policy.content) {
      updateData.content = dto.content;
      contentChanged = true;
      nextVersion = policy.version + 1;
      updateData.version = nextVersion;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id },
        data: updateData,
      });

      if (contentChanged) {
        // Create historical backup version
        await tx.policyVersion.create({
          data: {
            policyId: id,
            title: updated.title,
            content: updated.content,
            versionNumber: nextVersion,
            effectiveDate: updated.effectiveDate,
          },
        });
      }

      await tx.policyAuditLog.create({
        data: {
          policyId: id,
          userId: hrUserId,
          action: 'UPDATE',
          details: `Updated policy details. Content revised: ${contentChanged}`,
        },
      });

      return updated;
    });
  }

  async setPolicyStatus(hrUserId: string, id: string, status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') {
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');

    await this.prisma.policy.update({
      where: { id },
      data: { status },
    });

    await this.prisma.policyAuditLog.create({
      data: {
        policyId: id,
        userId: hrUserId,
        action: status === 'PUBLISHED' ? 'PUBLISH' : status === 'ARCHIVED' ? 'ARCHIVE' : 'DRAFT',
        details: `Policy status updated to ${status}`,
      },
    });

    return { status };
  }

  async deletePolicy(hrUserId: string, id: string) {
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');

    await this.prisma.policy.delete({ where: { id } });
    return { message: 'Policy deleted successfully' };
  }

  async assignPolicy(hrUserId: string, id: string, dto: AssignPolicyDto) {
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.policyAssignment.create({
        data: {
          policyId: id,
          targetType: dto.targetType,
          targetId: dto.targetId || null,
        },
      });

      // Audit Log
      await tx.policyAuditLog.create({
        data: {
          policyId: id,
          userId: hrUserId,
          action: 'ASSIGN',
          details: `Assigned to target type ${dto.targetType} (targetId: ${dto.targetId || 'ALL'})`,
        },
      });

      // Send notifications to affected employees in the background
      const targets = await this.resolveTargetUserIds(dto.targetType, dto.targetId, tx);
      if (targets.length > 0) {
        this.notificationService.createNotification(targets, {
          title: 'New Policy Assigned',
          description: `A new policy "${policy.title}" has been assigned. Please review and accept it.`,
          type: 'policy.assigned',
          module: 'POLICY',
          priority: 'MEDIUM',
          icon: 'shield-check',
          actionUrl: '/employee/policies',
        }).catch(() => {});
      }

      return assignment;
    });
  }

  async getEmployeePolicies(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: { department: true, designation: true },
    });
    if (!emp) throw new NotFoundException('Employee profile not found');

    // Fetch all published policies
    const allPublished = await this.prisma.policy.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        assignments: true,
        acceptances: { where: { employeeId: emp.id } },
      },
    });

    // Filter policies matching assignments targeting this employee
    const matched = allPublished.filter((pol) => {
      if (pol.assignments.length === 0) return true; // default unassigned is fallback ALL
      return pol.assignments.some((assign) => {
        if (assign.targetType === 'ALL') return true;
        if (assign.targetType === 'DEPARTMENT' && assign.targetId === emp.departmentId) return true;
        if (assign.targetType === 'DESIGNATION' && assign.targetId === emp.designationId) return true;
        if (assign.targetType === 'EMPLOYEE' && assign.targetId === emp.id) return true;
        return false;
      });
    });

    return matched.map((pol) => {
      const acceptance = pol.acceptances[0];
      return {
        id: pol.id,
        title: pol.title,
        policyNumber: pol.policyNumber,
        category: pol.category,
        description: pol.description,
        content: pol.content,
        version: pol.version,
        effectiveDate: pol.effectiveDate,
        accepted: acceptance ? acceptance.versionAccepted === pol.version : false,
        versionAccepted: acceptance?.versionAccepted || null,
        acceptedAt: acceptance?.acceptedAt || null,
      };
    });
  }

  async acceptPolicy(userId: string, id: string, dto: AcceptPolicyDto) {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new NotFoundException('Employee not found');

    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');

    return this.prisma.$transaction(async (tx) => {
      const acceptance = await tx.policyAcceptance.upsert({
        where: { policyId_employeeId: { policyId: id, employeeId: emp.id } },
        create: {
          policyId: id,
          employeeId: emp.id,
          versionAccepted: dto.versionAccepted,
          acceptedAt: new Date(),
        },
        update: {
          versionAccepted: dto.versionAccepted,
          acceptedAt: new Date(),
        },
      });

      await tx.policyAuditLog.create({
        data: {
          policyId: id,
          userId,
          action: 'ACCEPT',
          details: `Accepted policy version ${dto.versionAccepted}`,
        },
      });

      // Check if all assigned policies are accepted
      const assigned = await this.getEmployeePolicies(userId);
      const allAccepted = assigned.every((p) => p.accepted);

      if (allAccepted && emp.onboardingStatus === 'DOCUMENTS_UPLOADED') {
        await tx.employee.update({
          where: { id: emp.id },
          data: { onboardingStatus: 'POLICIES_ACCEPTED' },
        });
      }

      return acceptance;
    });
  }

  async submitAcknowledgement(
    userId: string,
    dto: SubmitAcknowledgementDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    // Make sure all policies are accepted first
    const assigned = await this.getEmployeePolicies(userId);
    const pending = assigned.filter((p) => !p.accepted);
    if (pending.length > 0) {
      throw new BadRequestException(`Please accept all assigned policies first. ${pending.length} pending.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const ack = await tx.acknowledgement.upsert({
        where: { employeeId: emp.id },
        create: {
          employeeId: emp.id,
          fullName: dto.fullName,
          ipAddress,
          userAgent,
          signedAt: new Date(),
        },
        update: {
          fullName: dto.fullName,
          ipAddress,
          userAgent,
          signedAt: new Date(),
        },
      });

      // Update onboarding status
      await tx.employee.update({
        where: { id: emp.id },
        data: { onboardingStatus: 'COMPLETED' },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'FINAL_ACKNOWLEDGEMENT_SIGNED',
          details: `Employee signed digital declaration. Signature: ${dto.fullName}`,
        },
      });

      // Notify HR (fire-and-forget)
      const hrUsers = await tx.user.findMany({
        where: { role: { name: 'HR' } },
        select: { id: true },
      });
      const hrIds = hrUsers.map((h: any) => h.id);
      if (hrIds.length > 0) {
        this.notificationService.createNotification(hrIds, {
          title: 'Onboarding Complete',
          description: `${emp.firstName} ${emp.lastName} has completed all policies and signed final acknowledgement.`,
          type: 'employee.onboarding_completed',
          module: 'EMPLOYEE',
          priority: 'HIGH',
          icon: 'sparkles',
          actionUrl: '/hr/employees',
        }).catch(() => {});
      }

      return ack;
    });
  }

  async getHRDashboard() {
    const [total, draft, published, archived] = await Promise.all([
      this.prisma.policy.count(),
      this.prisma.policy.count({ where: { status: 'DRAFT' } }),
      this.prisma.policy.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.policy.count({ where: { status: 'ARCHIVED' } }),
    ]);

    const employees = await this.prisma.employee.findMany({
      where: { user: { role: { name: 'EMPLOYEE' } } },
      select: { id: true, userId: true },
    });

    let completedAcceptanceCount = 0;
    let pendingAcceptanceCount = 0;

    for (const emp of employees) {
      const assigned = await this.getEmployeePolicies(emp.userId);
      const isDone = assigned.length > 0 && assigned.every((p) => p.accepted);
      if (isDone) completedAcceptanceCount++;
      else pendingAcceptanceCount++;
    }

    const recentLogs = await this.prisma.policyAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { title: true, policyNumber: true } },
      },
    });

    return {
      metrics: {
        total,
        draft,
        published,
        archived,
        employeesPending: pendingAcceptanceCount,
        employeesCompleted: completedAcceptanceCount,
      },
      recentLogs,
    };
  }

  async getHRTracking(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      user: { role: { name: 'EMPLOYEE' } },
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { employeeId: { contains: query.search } },
      ];
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: true,
          designation: true,
          acceptances: {
            include: { policy: true },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    const data: any[] = [];
    for (const emp of employees) {
      const assigned = await this.getEmployeePolicies(emp.userId);
      const totalAssigned = assigned.length;
      const acceptedCount = assigned.filter((p) => p.accepted).length;

      data.push({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department?.name || '—',
        designation: emp.designation?.name || '—',
        totalAssigned,
        acceptedCount,
        status: totalAssigned === 0 ? 'NO_POLICIES' : acceptedCount === totalAssigned ? 'COMPLETED' : 'PENDING',
      });
    }

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

  // Helper: Find affected employee user IDs based on scoping
  private async resolveTargetUserIds(targetType: string, targetId: string | undefined, tx: any): Promise<string[]> {
    const whereClause: any = {
      user: { role: { name: 'EMPLOYEE' } },
    };

    if (targetType === 'DEPARTMENT' && targetId) {
      whereClause.departmentId = targetId;
    } else if (targetType === 'DESIGNATION' && targetId) {
      whereClause.designationId = targetId;
    } else if (targetType === 'EMPLOYEE' && targetId) {
      whereClause.id = targetId;
    }

    const employees = await tx.employee.findMany({
      where: whereClause,
      select: { userId: true },
    });

    return employees.map((e: any) => e.userId);
  }
}
