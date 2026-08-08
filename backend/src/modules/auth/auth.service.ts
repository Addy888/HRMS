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
import { OtpService } from '../../common/services/otp.service.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private otpService: OtpService,
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
  // EMPLOYEE LOGIN NOW REQUIRES OTP VERIFICATION
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
            phone: true,
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

    // ========================================
    // TEMPORARILY DISABLED: OTP verification for EMPLOYEE role
    // TODO: Re-enable after OTP table is created
    // ========================================
    /*
    // 3. Check if user is EMPLOYEE role - requires OTP
    if (user.role.name === 'EMPLOYEE') {
      // Check if employee has phone number
      if (!user.employee?.phone) {
        throw new BadRequestException(
          'Your account does not have a registered mobile number. Please contact HR to update your profile.',
        );
      }

      // Generate and send OTP
      const { maskedPhone } = await this.otpService.createAndSendOtp(
        user.id,
        user.employee.phone,
        'LOGIN',
      );

      // Return pending OTP verification response (DO NOT return access token yet)
      return {
        requiresOtp: true,
        userId: user.id,
        maskedPhone,
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
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================

    // 4. For HR/Admin users AND EMPLOYEES (temporarily), proceed with normal JWT login (no OTP required)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      employeeId: user.employee?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    // 5. Fire login notification (non-blocking — never breaks auth)
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

    // 6. Return token + user profile
    return {
      requiresOtp: false,
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

  // ─────────────────────────────────────────────────────────────────
  // VERIFY LOGIN OTP
  // ─────────────────────────────────────────────────────────────────
  async verifyLoginOtp(userId: string, otp: string) {
    // ========================================
    // TEMPORARILY DISABLED: OTP verification functionality
    // TODO: Re-enable after OTP table is created
    // ========================================
    throw new BadRequestException('OTP verification is temporarily unavailable');
    
    /*
    // Verify OTP
    await this.otpService.verifyOtp(userId, otp, 'LOGIN');

    // Get user details
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
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT token after successful OTP verification
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      employeeId: user.employee?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    // Clear verified OTP
    await this.otpService.clearVerifiedOtp(userId, 'LOGIN');

    // Fire login notification
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

    // Return token + user profile
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
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================
  }

  // ─────────────────────────────────────────────────────────────────
  // RESEND LOGIN OTP
  // ─────────────────────────────────────────────────────────────────
  async resendLoginOtp(userId: string) {
    // ========================================
    // TEMPORARILY DISABLED: OTP resend functionality
    // TODO: Re-enable after OTP table is created
    // ========================================
    throw new BadRequestException('OTP verification is temporarily unavailable');
    
    /*
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (!user || !user.employee?.phone) {
      throw new BadRequestException('User or phone number not found');
    }

    const { maskedPhone } = await this.otpService.createAndSendOtp(
      userId,
      user.employee.phone,
      'LOGIN',
    );

    return {
      message: 'OTP resent successfully',
      maskedPhone,
    };
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================
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
    // ========================================
    // TEMPORARILY DISABLED: OTP-based password reset for employees
    // TODO: Re-enable after OTP table is created
    // For now, return a message that OTP is unavailable
    // ========================================
    
    return {
      message: 'Password reset with OTP is temporarily unavailable. Please contact HR for assistance.',
    };
    
    /*
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        employee: {
          select: {
            phone: true,
          },
        },
      },
    });

    // Always return success message to prevent email enumeration
    const successMessage =
      'If the email matches a registered account, an OTP has been sent to your registered mobile number.';

    if (!user) {
      return { message: successMessage };
    }

    // Check if user is employee (OTP required)
    if (user.role.name === 'EMPLOYEE') {
      if (!user.employee?.phone) {
        // Don't reveal whether user exists or not
        return { message: successMessage };
      }

      // Send OTP to employee's phone
      const { maskedPhone } = await this.otpService.createAndSendOtp(
        user.id,
        user.employee.phone,
        'PASSWORD_RESET',
      );

      return {
        message: successMessage,
        requiresOtp: true,
        maskedPhone,
        email: user.email,
      };
    }

    // For HR/Admin users, use existing token-based reset
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

    return {
      message: successMessage,
      requiresOtp: false,
    };
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================
  }

  // ─────────────────────────────────────────────────────────────────
  // VERIFY RESET OTP (Employee Password Reset)
  // ─────────────────────────────────────────────────────────────────
  async verifyResetOtp(email: string, otp: string) {
    // ========================================
    // TEMPORARILY DISABLED: OTP verification for password reset
    // TODO: Re-enable after OTP table is created
    // ========================================
    throw new BadRequestException('OTP verification is temporarily unavailable');
    
    /*
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
      },
    });

    if (!user || user.role.name !== 'EMPLOYEE') {
      throw new BadRequestException('Invalid request');
    }

    // Verify OTP
    await this.otpService.verifyOtp(user.id, otp, 'PASSWORD_RESET');

    // Generate a short-lived reset token (valid for 10 minutes)
    const crypto = await import('crypto');
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store reset token
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    return {
      message: 'OTP verified successfully',
      resetToken,
    };
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================
  }

  // ─────────────────────────────────────────────────────────────────
  // RESEND RESET OTP (Employee Password Reset)
  // ─────────────────────────────────────────────────────────────────
  async resendResetOtp(email: string) {
    // ========================================
    // TEMPORARILY DISABLED: OTP resend for password reset
    // TODO: Re-enable after OTP table is created
    // ========================================
    throw new BadRequestException('OTP verification is temporarily unavailable');
    
    /*
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        employee: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (!user || user.role.name !== 'EMPLOYEE' || !user.employee?.phone) {
      throw new BadRequestException('Invalid request');
    }

    const { maskedPhone } = await this.otpService.createAndSendOtp(
      user.id,
      user.employee.phone,
      'PASSWORD_RESET',
    );

    return {
      message: 'OTP resent successfully',
      maskedPhone,
    };
    */
    // ========================================
    // END TEMPORARY DISABLE
    // ========================================
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

    // Clear any verified OTP for password reset
    await this.otpService.clearVerifiedOtp(resetRequest.userId, 'PASSWORD_RESET');

    this.notificationService
      .createNotification([resetRequest.userId], {
        title: 'Password Reset',
        description:
          'Your account password was reset successfully. If this was not you, contact HR immediately.',
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
