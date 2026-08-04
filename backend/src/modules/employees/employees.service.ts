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

    return this.prisma.$transaction(async (tx) => {
      const updatedEmp = await tx.employee.update({
        where: { id },
        data: updateData,
      });

      // Recalculate Completion after update
      await this.internalRecalculateCompletion(id, tx);

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

    await this.prisma.user.delete({
      where: { id: employee.userId },
    });

    return { message: `Employee ${employee.employeeId} permanently removed` };
  }

  // Employee-facing Profile Operations
  async getProfile(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, isFirstLogin: true, isActive: true } },
        department: true,
        designation: true,
        profile: true,
      },
    });
    if (!emp) throw new NotFoundException('Employee profile not found');
    return emp;
  }

  async updateProfile(userId: string, dto: any) {
    const emp = await this.getProfile(userId);

    const updateData: any = {};
    const allowedFields = [
      'firstName', 'lastName', 'fatherName', 'motherName', 'gender', 'bloodGroup',
      'maritalStatus', 'nationality', 'phone', 'alternatePhone', 'personalEmail',
      'permanentAddress', 'currentAddress', 'emergencyContactName', 'emergencyContactPhone',
      'emergencyContactRelation', 'reportingManager', 'employmentType', 'bankAccountHolder',
      'bankName', 'bankBranch', 'bankAccountNumber', 'bankIfsc', 'upiId',
      'aadhaarNumber', 'panNumber', 'passportNumber', 'drivingLicenseNumber'
    ];

    allowedFields.forEach(f => {
      if (dto[f] !== undefined) updateData[f] = dto[f];
    });

    if (dto.dob) updateData.dob = new Date(dto.dob);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: updateData,
      });

      // Recalculate
      await this.internalRecalculateCompletion(emp.id, tx);

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATED',
          details: `Employee completed/updated their profile details`,
        },
      });

      return updated;
    });
  }

  async getProfileCompletion(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: { profile: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const sections = this.calculateSections(emp);
    return {
      percentage: emp.profile?.profileCompletion || 0,
      sections,
    };
  }

  async uploadPhoto(userId: string, photoUrl: string) {
    const emp = await this.getProfile(userId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: { photoUrl },
      });
      await this.internalRecalculateCompletion(emp.id, tx);
      return updated;
    });
  }

  async deletePhoto(userId: string) {
    const emp = await this.getProfile(userId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: { photoUrl: null },
      });
      await this.internalRecalculateCompletion(emp.id, tx);
      return updated;
    });
  }

  // Internal helper to calculate percentage and checklist
  private calculateSections(emp: any) {
    const personal = [emp.firstName, emp.lastName, emp.fatherName, emp.motherName, emp.dob, emp.gender, emp.bloodGroup, emp.maritalStatus, emp.nationality];
    const personalFilled = personal.filter(Boolean).length;
    const personalPct = Math.round((personalFilled / personal.length) * 100);

    const contact = [emp.phone, emp.alternatePhone, emp.personalEmail, emp.permanentAddress, emp.currentAddress, emp.emergencyContactName, emp.emergencyContactPhone, emp.emergencyContactRelation];
    const contactFilled = contact.filter(Boolean).length;
    const contactPct = Math.round((contactFilled / contact.length) * 100);

    const professional = [emp.employeeId, emp.departmentId, emp.designationId, emp.reportingManager, emp.employmentType, emp.joiningDate];
    const professionalFilled = professional.filter(Boolean).length;
    const professionalPct = Math.round((professionalFilled / professional.length) * 100);

    const bank = [emp.bankAccountHolder, emp.bankName, emp.bankBranch, emp.bankAccountNumber, emp.bankIfsc, emp.upiId];
    const bankFilled = bank.filter(Boolean).length;
    const bankPct = Math.round((bankFilled / bank.length) * 100);

    const govt = [emp.aadhaarNumber, emp.panNumber, emp.passportNumber, emp.drivingLicenseNumber];
    const govtFilled = govt.filter(Boolean).length;
    const govtPct = Math.round((govtFilled / govt.length) * 100);

    return {
      personal: { percentage: personalPct, filled: personalFilled, total: personal.length, label: 'Personal Information' },
      contact: { percentage: contactPct, filled: contactFilled, total: contact.length, label: 'Contact Details' },
      professional: { percentage: professionalPct, filled: professionalFilled, total: professional.length, label: 'Professional Info' },
      bank: { percentage: bankPct, filled: bankFilled, total: bank.length, label: 'Bank Details' },
      government: { percentage: govtPct, filled: govtFilled, total: govt.length, label: 'Government ID Cards' },
    };
  }

  private async internalRecalculateCompletion(employeeId: string, tx: any) {
    const emp = await tx.employee.findUnique({
      where: { id: employeeId },
    });
    const sects = this.calculateSections(emp);
    
    // Average of 5 sections (each counts for 20%)
    const finalPct = Math.round(
      (sects.personal.percentage +
        sects.contact.percentage +
        sects.professional.percentage +
        sects.bank.percentage +
        sects.government.percentage) / 5
    );

    await tx.employeeProfile.update({
      where: { employeeId },
      data: { profileCompletion: finalPct },
    });

    if (finalPct === 100 && emp.onboardingStatus === OnboardingStatus.PENDING) {
      await tx.employee.update({
        where: { id: employeeId },
        data: { onboardingStatus: OnboardingStatus.PROFILE_COMPLETED },
      });
    }
  }
}
