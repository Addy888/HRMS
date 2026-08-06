import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller.js';
import { PoliciesService } from './policies.service.js';
import { CompanyPoliciesController } from './company-policies.controller.js';
import { CompanyPoliciesService } from './company-policies.service.js';
import { DatabaseModule } from '../../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MulterModule } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Ensure uploads directory exists
const uploadsPath = join(process.cwd(), 'uploads', 'company-policies');
try {
  mkdirSync(uploadsPath, { recursive: true });
} catch (error) {
  // Directory already exists
}

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    MulterModule.register({
      dest: uploadsPath,
    }),
  ],
  controllers: [PoliciesController, CompanyPoliciesController],
  providers: [PoliciesService, CompanyPoliciesService],
  exports: [PoliciesService, CompanyPoliciesService],
})
export class PoliciesModule {}
