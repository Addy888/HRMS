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

  async findAll() {
    return this.prisma.designation.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findOne(id: string) {
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
    return desig;
  }

  async update(id: string, updateDesignationDto: UpdateDesignationDto) {
    await this.findOne(id);
    if (updateDesignationDto.name) {
      const existing = await this.prisma.designation.findFirst({
        where: {
          name: updateDesignationDto.name,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'Another designation with this name already exists',
        );
      }
    }
    return this.prisma.designation.update({
      where: { id },
      data: updateDesignationDto,
    });
  }

  async remove(id: string) {
    const desig = await this.findOne(id);
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
