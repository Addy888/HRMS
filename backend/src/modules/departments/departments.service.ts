import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });
    if (existing) {
      throw new ConflictException('Department with this name already exists');
    }
    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
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
    if (!dept) {
      throw new NotFoundException('Department not found');
    }
    return dept;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);
    if (updateDepartmentDto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          name: updateDepartmentDto.name,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'Another department with this name already exists',
        );
      }
    }
    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });
  }

  async remove(id: string) {
    const dept = await this.findOne(id);
    if (dept.employees.length > 0) {
      throw new ConflictException(
        'Cannot delete department with active employees. Please re-assign them first.',
      );
    }
    return this.prisma.department.delete({
      where: { id },
    });
  }
}
