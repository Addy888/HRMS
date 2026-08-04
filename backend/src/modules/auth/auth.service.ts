import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Fetch user with role and employee info
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
      throw new ForbiddenException('Your account has been deactivated. Please contact HR.');
    }

    // 2. Verify password
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

    // 4. Build response
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

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        isFirstLogin: false,
      },
    });

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

    // For security reasons, don't disclose if user exists or not,
    // but internally generate token and log it.
    if (user) {
      const crypto = await import('crypto');
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      console.log(`[EMAIL DISPATCH] Password reset requested for: ${email}. Reset Token: ${token}`);
    }

    return { message: 'If the email matches a registered account, a password reset link has been generated.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRequest = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest || resetRequest.used || resetRequest.expiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid, expired, or already used');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update user password
      await tx.user.update({
        where: { id: resetRequest.userId },
        data: {
          password: hashedPassword,
          isFirstLogin: false, // reset resets forced change flag
        },
      });

      // 2. Mark token as used
      await tx.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true },
      });

      // 3. Log audit
      await tx.auditLog.create({
        data: {
          userId: resetRequest.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          details: `Password reset successfully via reset token`,
        },
      });
    });

    return { message: 'Password reset successfully' };
  }
}
