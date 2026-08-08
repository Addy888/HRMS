import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto.js';
import {
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordOtpDto,
  VerifyResetOtpDto,
  ResetPasswordWithOtpDto,
} from './dto/otp.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password (Employee users require OTP)' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for employee login' })
  verifyLoginOtp(@Body() dto: VerifyOtpDto & { userId: string }) {
    return this.authService.verifyLoginOtp(dto.userId, dto.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for employee login' })
  resendLoginOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendLoginOtp(dto.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (required on first login)' })
  changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@GetUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (Employee: OTP, HR: Token)' })
  forgotPassword(@Body() dto: ForgotPasswordOtpDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for employee password reset' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto.email, dto.otp);
  }

  @Post('resend-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for employee password reset' })
  resendResetOtp(@Body() dto: ForgotPasswordOtpDto) {
    return this.authService.resendResetOtp(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  resetPassword(@Body() dto: ResetPasswordWithOtpDto) {
    return this.authService.resetPassword(dto.resetToken, dto.newPassword);
  }
}
