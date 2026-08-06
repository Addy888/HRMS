import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller.js';
import { NotificationService } from './notification.service.js';
import { AnnouncementService } from './announcement.service.js';
import { SocketGateway } from './socket.gateway.js';
import { EmailNotificationService } from './email-notification.service.js';
import { DatabaseModule } from '../../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    // Register JwtModule directly here so SocketGateway can inject JwtService
    // without importing AuthModule — which would create a circular dependency.
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
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    AnnouncementService,
    SocketGateway,
    EmailNotificationService,
  ],
  exports: [NotificationService, AnnouncementService, SocketGateway],
})
export class NotificationsModule {}
