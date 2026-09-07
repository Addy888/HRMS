import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto.js';

@Injectable()
export class DesignationsService {
  constructor(private prisma: PrismaService) {}

  async create(createDesignationDto: CreateDesignationDto, requestUserId: string) {
    // Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const existing = await this.prisma.designation.findUnique({
      where: {
        organizationId_name: {
          organizationId: requestingUser.organizationId,
          name: createDesignationDto.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Designation with this name already exists in your organization');
    }
    return this.prisma.designation.create({
      data: {
        ...createDesignationDto,
        organizationId: requestingUser.organizationId,
      },
    });
  }

  async findAll(requestUserId: string) {
    // ✅ SECURITY FIX: Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    // ✅ SYSTEM ROLE EXCLUSION: List of system/authentication roles that should NEVER appear as designations
    const systemRoleNames = [
      'SUPER_ADMIN',
      'Super Admin',
      'Platform Super Admin',
      'PLATFORM_SUPER_ADMIN',
      'HR_ADMIN',
      'HR Admin',
      'HR_USER',
      'HR User',
      'HR',
      'EMPLOYEE',
      'Employee',
      'ADMIN',
      'Admin',
    ];

    // ✅ SECURITY FIX: Filter by organization to prevent cross-tenant access
    // ✅ ROLE SEPARATION: Exclude any designations that match system role names
    return this.prisma.designation.findMany({
      where: {
        organizationId: requestingUser.organizationId,
        // ✅ CRITICAL: Prevent system roles from appearing as employee designations
        name: {
          notIn: systemRoleNames,
        },
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findOne(id: string, requestUserId: string) {
    // ✅ SECURITY FIX: Get requesting user's organization
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new NotFoundException('User organization not found');
    }

    const desig = await this.prisma.designation.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (!desig) {
      throw new NotFoundException('Designation not found');
    }

    // ✅ SECURITY FIX: Validate organization match (IDOR prevention)
    if (desig.organizationId !== requestingUser.organizationId) {
      throw new NotFoundException('Designation not found'); // Don't reveal existence
    }

    return desig;
  }

  async update(id: string, updateDesignationDto: UpdateDesignationDto, requestUserId: string) {
    // ✅ SECURITY FIX: findOne now validates organizationId
    await this.findOne(id, requestUserId);
    
    if (updateDesignationDto.name) {
      // ✅ SECURITY FIX: Get user organization for name uniqueness check
      const requestingUser = await this.prisma.user.findUnique({
        where: { id: requestUserId },
        select: { organizationId: true },
      });

      if (!requestingUser || !requestingUser.organizationId) {
        throw new NotFoundException('User organization not found');
      }

      const existing = await this.prisma.designation.findFirst({
        where: {
          organizationId: requestingUser.organizationId, // ✅ Scoped to org
          name: updateDesignationDto.name,
          NOT: { id },
        },
      });
      
      if (existing) {
        throw new ConflictException(
          'Another designation with this name already exists in your organization',
        );
      }
    }
    
    return this.prisma.designation.update({
      where: { id },
      data: updateDesignationDto,
    });
  }

  async remove(id: string, requestUserId: string) {
    // ✅ SECURITY FIX: findOne now validates organizationId
    const desig = await this.findOne(id, requestUserId);
    
    if (desig.employees.length > 0) {
      throw new ConflictException(
        'Cannot delete designation with active employees. Please re-assign them first.',
      );
    }
    return this.prisma.designation.delete({
      where: { id },
    });
  }
}
