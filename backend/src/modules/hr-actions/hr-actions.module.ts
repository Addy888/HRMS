import { Module } from '@nestjs/common';
import { HRActionsController } from './hr-actions.controller.js';
import { HRActionsService } from './hr-actions.service.js';
import { DatabaseModule } from '../../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [HRActionsController],
  providers: [HRActionsService],
  exports: [HRActionsService],
})
export class HRActionsModule {}
