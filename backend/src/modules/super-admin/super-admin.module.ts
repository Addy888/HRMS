import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller.js';
import { SuperAdminService } from './super-admin.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [SuperAdminController],
  providers: [SuperAdminService, PrismaService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
