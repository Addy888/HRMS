/**
 * SHIFT SERVICE
 * Manages employee shift scheduling
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from '../dto';
import { parseISO } from 'date-fns';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREATE SHIFT
   */
  async createShift(dto: CreateShiftDto, requestUserId: string) {
    this.logger.log(`Creating shift: ${dto.name}`);

    // Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new BadRequestException('User organization not found');
    }

    // Check if shift code already exists in this organization
    const existing = await this.prisma.shift.findUnique({
      where: {
        organizationId_code: {
          organizationId: requestingUser.organizationId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Shift with code '${dto.code}' already exists in your organization`,
      );
    }

    return await this.prisma.shift.create({
      data: {
        organizationId: requestingUser.organizationId,
        name: dto.name,
        code: dto.code,
        startTime: dto.startTime,
        endTime: dto.endTime,
        graceTime: dto.graceTime || 15,
        lateMarkAfter: dto.lateMarkAfter || 15,
        halfDayIfLateBy: dto.halfDayIfLateBy || 240,
        minimumWorkingHours: dto.minimumWorkingHours || 8.0,
        maximumWorkingHours: dto.maximumWorkingHours || 12.0,
        breakTime: dto.breakTime || 60,
        overtimeApplicable: dto.overtimeApplicable || false,
        flexibleShift: dto.flexibleShift || false,
        weekends: dto.weekends || 'SATURDAY,SUNDAY',
        description: dto.description,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * GET ALL SHIFTS
   */
  async getAllShifts(status?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return await this.prisma.shift.findMany({
      where,
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GET SHIFT BY ID
   */
  async getShiftById(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
          where: { isActive: true },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return shift;
  }

  /**
   * UPDATE SHIFT
   */
  async updateShift(id: string, dto: UpdateShiftDto) {
    this.logger.log(`Updating shift: ${id}`);

    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return await this.prisma.shift.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * DELETE SHIFT
   */
  async deleteShift(id: string) {
    this.logger.log(`Deleting shift: ${id}`);

    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift._count.assignments > 0) {
      throw new BadRequestException(
        'Cannot delete shift with active assignments',
      );
    }

    await this.prisma.shift.delete({ where: { id } });

    return { success: true, message: 'Shift deleted successfully' };
  }

  /**
   * ASSIGN SHIFT TO EMPLOYEE
   */
  async assignShift(dto: AssignShiftDto, assignedBy: string) {
    this.logger.log(
      `Assigning shift ${dto.shiftId} to employee ${dto.employeeId}`,
    );

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify shift exists
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const effectiveFrom = parseISO(dto.effectiveFrom);
    const effectiveTo = dto.effectiveTo ? parseISO(dto.effectiveTo) : null;

    // Deactivate current active assignments
    await this.prisma.shiftAssignment.updateMany({
      where: {
        employeeId: dto.employeeId,
        isActive: true,
      },
      data: {
        isActive: false,
        effectiveTo: effectiveFrom,
      },
    });

    // Create new assignment
    return await this.prisma.shiftAssignment.create({
      data: {
        employeeId: dto.employeeId,
        shiftId: dto.shiftId,
        effectiveFrom,
        effectiveTo,
        isActive: true,
        assignedBy,
        remarks: dto.remarks,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        shift: true,
      },
    });
  }

  /**
   * GET EMPLOYEE SHIFT HISTORY
   */
  async getEmployeeShiftHistory(employeeId: string) {
    return await this.prisma.shiftAssignment.findMany({
      where: { employeeId },
      include: {
        shift: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * GET EMPLOYEE CURRENT SHIFT
   */
  async getEmployeeCurrentShift(employeeId: string) {
    const now = new Date();

    return await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: {
        shift: true,
      },
    });
  }
}
