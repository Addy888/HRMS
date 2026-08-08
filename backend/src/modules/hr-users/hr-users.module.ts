import { Module } from '@nestjs/common';
import { HRUsersController } from './hr-users.controller.js';
import { HRUsersService } from './hr-users.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [HRUsersController],
  providers: [HRUsersService, PrismaService],
  exports: [HRUsersService],
})
export class HRUsersModule {}
