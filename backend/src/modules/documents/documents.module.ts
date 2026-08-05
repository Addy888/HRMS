import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { LocalStorageService } from './storage/local-storage.service.js';
import { DatabaseModule } from '../../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, LocalStorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
