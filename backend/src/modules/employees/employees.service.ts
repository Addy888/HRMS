import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto/employee.dto.js';
import * as bcrypt from 'bcrypt';
import { UserRole, OnboardingStatus } from '../../common/constants/index.js';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // 1. Validate unique email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    // 2. Fetch Employee Role
    const empRole = await this.prisma.role.findUnique({
      where: { name: UserRole.EMPLOYEE },
    });
    if (!empRole) {
      throw new BadRequestException('EMPLOYEE role not initialized in database.');
    }

    // 3. Generate default credentials
    const defaultPassword = '1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4. Generate custom Employee ID Code (e.g. FCS-2026-XXXX)
    const currentYear = new Date().getFullYear();
    const count = await this.prisma.employee.count();
    const nextSeq = String(count + 1).padStart(4, '0');
    const employeeIdCode = `FCS-${currentYear}-${nextSeq}`;

    // 5. Build transaction
    return this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: createEmployeeDto.email,
          password: hashedPassword,
          roleId: empRole.id,
          isFirstLogin: true,
          isActive: true,
        },
      });

      // Create employee profile linked to user
      const employee = await tx.employee.create({
        data: {
          employeeId: employeeIdCode,
          userId: user.id,
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          phone: createEmployeeDto.phone,
          dob: createEmployeeDto.dob ? new Date(createEmployeeDto.dob) : null,
          gender: createEmployeeDto.gender,
          bloodGroup: createEmployeeDto.bloodGroup,
          address: createEmployeeDto.address,
          emergencyContact: createEmployeeDto.emergencyContact,
          joiningDate: createEmployeeDto.joiningDate ? new Date(createEmployeeDto.joiningDate) : new Date(),
          departmentId: createEmployeeDto.departmentId || null,
          designationId: createEmployeeDto.designationId || null,
          onboardingStatus: OnboardingStatus.PENDING,
        },
      });

      // Create onboarding helper profile tracker
      await tx.employeeProfile.create({
        data: {
          employeeId: employee.id,
          profileCompletion: 0,
        },
      });

      // Create initial audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMPLOYEE_CREATED',
          details: `HR created employee account for ${createEmployeeDto.email} with ID ${employeeIdCode}`,
        },
      });

      // Simulated Welcome Email logic
      console.log(`[EMAIL DISPATCH] Sent welcome details to: ${createEmployeeDto.email}. Temporary Password: ${defaultPassword}`);

      return {
        employee,
        defaultCredentials: {
          email: createEmployeeDto.email,
          temporaryPassword: defaultPassword,
        },
      };
    });
  }

  async findAll(query: QueryEmployeeDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      // Exclude HR admin profile from listing
      user: {
        role: {
          name: { not: UserRole.HR },
        },
      },
    };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { employeeId: { contains: query.search } },
        { user: { email: { contains: query.search } } },
      ];
    }

    if (query.departmentId) {
      whereClause.departmentId = query.departmentId;
    }

    if (query.designationId) {
      whereClause.designationId = query.designationId;
    }

    if (query.onboardingStatus) {
      whereClause.onboardingStatus = query.onboardingStatus;
    }

    if (query.isActive !== undefined) {
      whereClause.user = {
        ...whereClause.user,
        isActive: query.isActive === 'true',
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where: whereClause }),
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { joiningDate: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
              isFirstLogin: true,
            },
          },
          department: true,
          designation: true,
          profile: true,
        },
      }),
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

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
            role: true,
          },
        },
        department: true,
        designation: true,
        profile: true,
        education: true,
        experience: true,
        documents: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    const updateData: any = {
      firstName: updateEmployeeDto.firstName,
      lastName: updateEmployeeDto.lastName,
      phone: updateEmployeeDto.phone,
      gender: updateEmployeeDto.gender,
      bloodGroup: updateEmployeeDto.bloodGroup,
      address: updateEmployeeDto.address,
      emergencyContact: updateEmployeeDto.emergencyContact,
    };

    if (updateEmployeeDto.dob) {
      updateData.dob = new Date(updateEmployeeDto.dob);
    }

    if (updateEmployeeDto.joiningDate) {
      updateData.joiningDate = new Date(updateEmployeeDto.joiningDate);
    }

    if (updateEmployeeDto.departmentId !== undefined) {
      updateData.departmentId = updateEmployeeDto.departmentId || null;
    }

    if (updateEmployeeDto.designationId !== undefined) {
      updateData.designationId = updateEmployeeDto.designationId || null;
    }

    // Recalculate Profile Completion Percentage
    let filledFields = 0;
    const coreFields = [
      employee.phone,
      employee.dob,
      employee.gender,
      employee.bloodGroup,
      employee.address,
      employee.emergencyContact,
    ];
    coreFields.forEach((val) => {
      if (val) filledFields++;
    });
    // Add newly provided fields to the score
    if (updateEmployeeDto.phone) filledFields++;
    if (updateEmployeeDto.dob) filledFields++;
    if (updateEmployeeDto.gender) filledFields++;
    if (updateEmployeeDto.bloodGroup) filledFields++;
    if (updateEmployeeDto.address) filledFields++;
    if (updateEmployeeDto.emergencyContact) filledFields++;

    const finalPercent = Math.min(100, Math.round((filledFields / 6) * 100));

    return this.prisma.$transaction(async (tx) => {
      const updatedEmp = await tx.employee.update({
        where: { id },
        data: updateData,
      });

      await tx.employeeProfile.update({
        where: { employeeId: id },
        data: { profileCompletion: finalPercent },
      });

      await tx.auditLog.create({
        data: {
          action: 'EMPLOYEE_UPDATED',
          details: `Employee profile updated for ${employee.employeeId}`,
        },
      });

      return updatedEmp;
    });
  }

  async setActivation(id: string, active: boolean) {
    const employee = await this.findOne(id);
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { isActive: active },
    });
    await this.prisma.auditLog.create({
      data: {
        action: active ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
        details: `Active status for ${employee.employeeId} set to ${active}`,
      },
    });
    return { status: active ? 'Activated' : 'Deactivated' };
  }

  async resetPassword(id: string) {
    const employee = await this.findOne(id);
    const defaultPassword = '1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: hashedPassword,
        isFirstLogin: true, // Forces password change on next login
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_PASSWORD_RESET',
        details: `Password reset by HR for employee ID ${employee.employeeId}`,
      },
    });

    return { message: 'Password reset to default (1234) successfully' };
  }

  async remove(id: string) {
    const employee = await this.findOne(id);

    // Cascades deletion of User which cascades Employee, profile, education, docs, logs etc.
    await this.prisma.user.delete({
      where: { id: employee.userId },
    });

    return { message: `Employee ${employee.employeeId} permanently removed` };
  }
}
