import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto.js';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../notifications/notification.service.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // STARTUP HOOK — Ensures the default HR admin account always exists
  // Runs once when the NestJS application initialises.
  // Safe to call repeatedly; uses upsert / existence checks.
  // ─────────────────────────────────────────────────────────────────
  async onModuleInit() {
    await this.ensureDefaultHRUser();
  }

  private async ensureDefaultHRUser() {
    try {
      const defaultEmail = 'adityashastri76@gmail.com';
      const defaultCode = 'FCS-HR-001';

      // 1. Ensure HR role exists
      const hrRole = await this.prisma.role.upsert({
        where: { name: 'HR' },
        update: {},
        create: {
          name: 'HR',
          description: 'Human Resource Management & Administrator',
        },
      });

      // 2. Ensure EMPLOYEE role exists
      await this.prisma.role.upsert({
        where: { name: 'EMPLOYEE' },
        update: {},
        create: { name: 'EMPLOYEE', description: 'Standard Company Employee' },
      });

      // 3. Ensure Administration department exists
      const adminDept = await this.prisma.department.upsert({
        where: { name: 'Administration' },
        update: {},
        create: {
          name: 'Administration',
          description: 'Core Executive & Administrative Operations',
        },
      });

      // 4. Ensure HR Manager designation exists
      const hrManagerDesg = await this.prisma.designation.upsert({
        where: { name: 'HR Manager' },
        update: {},
        create: {
          name: 'HR Manager',
          description: 'Human Resources Management Lead',
        },
      });

      // 5. Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: defaultEmail },
        include: { role: true },
      });

      if (existingUser) {
        // If the existing user has a non-HR role (e.g. "Super Admin" from old seeder),
        // update it to HR so authentication works correctly.
        if (existingUser.role.name !== 'HR') {
          await this.prisma.user.update({
            where: { email: defaultEmail },
            data: { roleId: hrRole.id },
          });
          this.logger.log(
            `✔ Default HR Admin role corrected: ${defaultEmail} → HR`,
          );
        } else {
          this.logger.log(`✔ Default HR Admin already exists: ${defaultEmail}`);
        }
        return;
      }

      // 6. Check employee code is not taken
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { employeeId: defaultCode },
      });
      if (existingEmployee) {
        this.logger.log(
          `✔ Default HR Admin employee record already exists: ${defaultCode}`,
        );
        return;
      }

      // 7. Create user with bcrypt-hashed password
      const hashedPassword = await bcrypt.hash('12345678', 10);
      const newUser = await this.prisma.user.create({
        data: {
          email: defaultEmail,
          password: hashedPassword,
          roleId: hrRole.id,
          isFirstLogin: false,
          isActive: true,
        },
      });

      // 8. Create employee profile
      await this.prisma.employee.create({
        data: {
          employeeId: defaultCode,
          userId: newUser.id,
          firstName: 'Aditya',
          lastName: 'Shastri',
          phone: '9876543210',
          departmentId: adminDept.id,
          designationId: hrManagerDesg.id,
          onboardingStatus: 'VERIFIED',
        },
      });

      // 9. Initialise notification preferences
      await this.prisma.notificationPreference.create({
        data: { userId: newUser.id },
      });

      this.logger.log(
        `✔ Default HR Admin created automatically: ${defaultEmail} / FCS-HR-001`,
      );
    } catch (err: any) {
      // Non-fatal — log and continue. Auth still works for existing users.
      this.logger.error(`ensureDefaultHRUser failed: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGIN — Pure database authentication, no hardcoded logic
  // ─────────────────────────────────────────────────────────────────
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find user in database
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            onboardingStatus: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Your account has been deactivated. Please contact HR.',
      );
    }

    // 2. Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Sign JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      employeeId: user.employee?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    // 4. Fire login notification (non-blocking — never breaks auth)
    this.notificationService
      .createNotification([user.id], {
        title: 'New Login Detected',
        description: `Your account was accessed at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`,
        type: 'auth.login',
        module: 'AUTH',
        priority: 'LOW',
        icon: 'log-in',
        actionUrl: undefined,
      })
      .catch(() => {});

    // 5. Return token + user profile
    return {
      accessToken,
      mustChangePassword: user.isFirstLogin,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        mustChangePassword: user.isFirstLogin,
        employee: user.employee
          ? {
              id: user.employee.id,
              employeeId: user.employee.employeeId,
              firstName: user.employee.firstName,
              lastName: user.employee.lastName,
              onboardingStatus: user.employee.onboardingStatus,
              department: user.employee.department?.name ?? null,
              designation: user.employee.designation?.name ?? null,
            }
          : null,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, isFirstLogin: false },
    });

    this.notificationService
      .createNotification([userId], {
        title: 'Password Changed',
        description:
          'Your account password was changed successfully. If this was not you, contact HR immediately.',
        type: 'auth.password_changed',
        module: 'AUTH',
        priority: 'HIGH',
        icon: 'shield-alert',
        actionUrl: undefined,
      })
      .catch(() => {});

    return { message: 'Password changed successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            onboardingStatus: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            profile: { select: { profileCompletion: true } },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      mustChangePassword: user.isFirstLogin,
      employee: user.employee ?? null,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      const crypto = await import('crypto');
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
      });

      this.logger.log(
        `[EMAIL] Password reset requested for: ${email}. Token: ${token}`,
      );
    }

    return {
      message:
        'If the email matches a registered account, a password reset link has been generated.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRequest = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !resetRequest ||
      resetRequest.used ||
      resetRequest.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Reset token is invalid, expired, or already used',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRequest.userId },
        data: { password: hashedPassword, isFirstLogin: false },
      });
      await tx.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true },
      });
      await tx.auditLog.create({
        data: {
          userId: resetRequest.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          details: 'Password reset successfully via reset token',
        },
      });
    });

    this.notificationService
      .createNotification([resetRequest.userId], {
        title: 'Password Reset',
        description:
          'Your account password was reset via the password reset link.',
        type: 'auth.password_reset',
        module: 'AUTH',
        priority: 'HIGH',
        icon: 'key',
        actionUrl: undefined,
      })
      .catch(() => {});

    return { message: 'Password reset successfully' };
  }
}
