import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto.js';
import { SocketGateway } from '../notifications/socket.gateway.js';

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, requestUserId: string) {
    // Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { id: true, organizationId: true, role: { select: { name: true } } },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const existing = await this.prisma.department.findUnique({
      where: {
        organizationId_name: {
          organizationId: requestingUser.organizationId,
          name: createDepartmentDto.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Department with this name already exists in your organization');
    }
    
    const department = await this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
        code: createDepartmentDto.code,
        description: createDepartmentDto.description,
        isActive: createDepartmentDto.isActive !== undefined ? createDepartmentDto.isActive : true,
        organizationId: requestingUser.organizationId,
        createdByUserId: requestUserId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: requestUserId,
        action: 'PROCESS_CREATED',
        details: `Process/Department "${department.name}" created`,
      },
    });

    // Emit real-time event
    this.socketGateway.emitToOrganization(requestingUser.organizationId, 'process.created', {
      processId: department.id,
      processName: department.name,
      createdBy: requestingUser.id,
    });

    return department;
  }

  async findAll(requestUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true, role: { select: { name: true } } },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    return this.prisma.department.findMany({
      where: { organizationId: requestingUser.organizationId },
      orderBy: { name: 'asc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findOne(id: string, requestUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true, role: { select: { name: true } } },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        employees: {
          where: { organizationId: requestingUser.organizationId },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            monthlySalary: true,
            joiningDate: true,
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
            designation: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { firstName: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });
    
    if (!dept) {
      throw new NotFoundException('Process/Department not found');
    }

    // Verify organization match
    if (dept.organizationId !== requestingUser.organizationId) {
      throw new ForbiddenException('Access denied to this process/department');
    }

    // Calculate payroll statistics
    const activeEmployees = dept.employees.filter(e => e.user.isActive);
    const inactiveEmployees = dept.employees.filter(e => !e.user.isActive);
    const monthlyBasicSalary = activeEmployees.reduce((sum, e) => sum + (e.monthlySalary || 0), 0);

    return {
      ...dept,
      statistics: {
        totalEmployees: dept.employees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: inactiveEmployees.length,
        monthlyBasicSalary,
        monthlyIncentive: 0, // Placeholder for future incentive tracking
        totalMonthlyPayroll: monthlyBasicSalary,
        avgSalary: activeEmployees.length > 0 ? monthlyBasicSalary / activeEmployees.length : 0,
      },
    };
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto, requestUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const dept = await this.prisma.department.findUnique({ where: { id } });
    
    if (!dept) {
      throw new NotFoundException('Process/Department not found');
    }

    if (dept.organizationId !== requestingUser.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (updateDepartmentDto.name && updateDepartmentDto.name !== dept.name) {
      const existing = await this.prisma.department.findUnique({
        where: {
          organizationId_name: {
            organizationId: requestingUser.organizationId,
            name: updateDepartmentDto.name,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Another department with this name already exists');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        createdByUser: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: requestUserId,
        action: 'PROCESS_UPDATED',
        details: `Process/Department "${updated.name}" updated`,
      },
    });

    // Emit real-time event
    this.socketGateway.emitToOrganization(requestingUser.organizationId, 'process.updated', {
      processId: updated.id,
      processName: updated.name,
      updatedBy: requestUserId,
    });

    return updated;
  }

  async remove(id: string, requestUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
      },
    });

    if (!dept) {
      throw new NotFoundException('Process/Department not found');
    }

    if (dept.organizationId !== requestingUser.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (dept.employees.length > 0) {
      throw new ConflictException(
        `Cannot delete process/department with ${dept.employees.length} employees. Please re-assign them first.`,
      );
    }

    await this.prisma.department.delete({ where: { id } });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: requestUserId,
        action: 'PROCESS_DELETED',
        details: `Process/Department "${dept.name}" deleted`,
      },
    });

    // Emit real-time event
    this.socketGateway.emitToOrganization(requestingUser.organizationId, 'process.deleted', {
      processId: id,
      processName: dept.name,
      deletedBy: requestUserId,
    });

    return { message: `Process/Department "${dept.name}" deleted successfully` };
  }

  /**
   * Bulk assign employees to a department/process
   */
  async bulkAssignEmployees(departmentId: string, employeeIds: string[], requestUserId: string) {
    console.log('[BULK ASSIGN] Starting bulk assignment');
    console.log('[BULK ASSIGN] Department ID:', departmentId);
    console.log('[BULK ASSIGN] Employee IDs:', employeeIds);
    console.log('[BULK ASSIGN] Request User ID:', requestUserId);

    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true, role: { select: { name: true } } },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    // Validate department exists and belongs to organization
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Process/Department not found');
    }

    if (department.organizationId !== requestingUser.organizationId) {
      throw new ForbiddenException('Access denied to this process/department');
    }

    // Validate all employees exist and belong to organization
    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        organizationId: requestingUser.organizationId,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        user: { select: { id: true } },
      },
    });

    if (employees.length !== employeeIds.length) {
      throw new BadRequestException('Some employees not found or access denied');
    }

    console.log('[BULK ASSIGN] Found employees:', employees.length);

    // Perform bulk update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.updateMany({
        where: {
          id: { in: employeeIds },
          organizationId: requestingUser.organizationId,
        },
        data: {
          departmentId: departmentId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: requestUserId,
          action: 'BULK_PROCESS_ASSIGNMENT',
          details: `Bulk assigned ${updated.count} employees to process/department "${department.name}"`,
        },
      });

      return { updated: updated.count, employees };
    });

    console.log('[BULK ASSIGN] Updated count:', result.updated);

    // Emit real-time events to each affected employee
    for (const employee of result.employees) {
      this.socketGateway.emitToUser(employee.user.id, 'employee.process.updated', {
        employeeId: employee.id,
        newProcessId: departmentId,
        newProcessName: department.name,
        updatedBy: requestUserId,
      });
    }

    // Emit to organization for dashboard updates
    this.socketGateway.emitToOrganization(requestingUser.organizationId, 'process.employees.bulk_updated', {
      processId: departmentId,
      processName: department.name,
      employeeCount: result.updated,
      updatedBy: requestUserId,
    });

    return {
      message: `Successfully assigned ${result.updated} employees to ${department.name}`,
      updated: result.updated,
      processId: departmentId,
      processName: department.name,
    };
  }
}
