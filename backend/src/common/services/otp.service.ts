import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { SmsService } from './sms.service.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  /**
   * Generate a secure 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and send OTP for login or password reset
   */
  async createAndSendOtp(
    userId: string,
    phoneNumber: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<{ maskedPhone: string }> {
    // Check for recent OTP resend cooldown
    await this.checkResendCooldown(userId, purpose);

    // Invalidate any previous OTP for the same purpose
    await this.invalidatePreviousOtps(userId, purpose);

    // Generate new OTP
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Store OTP in database
    await this.prisma.otpVerification.create({
      data: {
        userId,
        otpHash,
        purpose,
        phoneNumber,
        expiresAt,
        maxAttempts: this.MAX_ATTEMPTS,
      },
    });

    // Send OTP via SMS
    await this.smsService.sendOtp(phoneNumber, otp);

    // Return masked phone number
    return {
      maskedPhone: this.smsService.maskPhoneNumber(phoneNumber),
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(
    userId: string,
    otp: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<void> {
    // Find the latest unverified OTP for this user and purpose
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        userId,
        purpose,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new BadRequestException(
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    // Increment attempt counter
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    if (!isValid) {
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      
      if (remainingAttempts <= 0) {
        throw new BadRequestException(
          'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.',
        );
      }

      throw new BadRequestException(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Mark OTP as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `OTP_VERIFIED_${purpose}`,
        details: `OTP verification successful for ${purpose}`,
      },
    });
  }

  /**
   * Check if user recently requested OTP (resend cooldown)
   */
  private async checkResendCooldown(
    userId: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<void> {
    const cooldownTime = new Date();
    cooldownTime.setSeconds(cooldownTime.getSeconds() - this.RESEND_COOLDOWN_SECONDS);

    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId,
        purpose,
        createdAt: {
          gte: cooldownTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentOtp) {
      const remainingSeconds = Math.ceil(
        (recentOtp.createdAt.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000,
      );

      if (remainingSeconds > 0) {
        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        );
      }
    }
  }

  /**
   * Invalidate previous OTPs for the same user and purpose
   */
  private async invalidatePreviousOtps(
    userId: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<void> {
    await this.prisma.otpVerification.updateMany({
      where: {
        userId,
        purpose,
        verified: false,
      },
      data: {
        verified: true, // Mark as verified to invalidate
      },
    });
  }

  /**
   * Check if user has verified OTP for the given purpose
   */
  async hasVerifiedOtp(
    userId: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<boolean> {
    const verifiedOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId,
        purpose,
        verified: true,
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    });

    if (!verifiedOtp) {
      return false;
    }

    // Check if verification is recent (within last 10 minutes)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    return verifiedOtp.verifiedAt! >= tenMinutesAgo;
  }

  /**
   * Clear verified OTP after successful action
   */
  async clearVerifiedOtp(
    userId: string,
    purpose: 'LOGIN' | 'PASSWORD_RESET',
  ): Promise<void> {
    await this.prisma.otpVerification.deleteMany({
      where: {
        userId,
        purpose,
        verified: true,
      },
    });
  }
}
