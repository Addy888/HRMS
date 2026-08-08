import { Module } from '@nestjs/common';
import { AdminHRController } from './admin-hr.controller.js';
import { AdminHRService } from './admin-hr.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [AdminHRController],
  providers: [AdminHRService, PrismaService],
  exports: [AdminHRService],
})
export class AdminModule {}
