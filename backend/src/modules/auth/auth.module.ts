import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { DatabaseModule } from '../../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OtpService } from '../../common/services/otp.service.js';
import { SmsService } from '../../common/services/sms.service.js';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule, // Clean static import — no circular dep anymore
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'fcs-hrms-super-secret-key',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '8h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpService, SmsService],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
