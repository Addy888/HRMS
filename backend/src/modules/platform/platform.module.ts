/**
 * PLATFORM MODULE
 * 
 * Organization/Company management for platform super admin
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  controllers: [PlatformController],
  providers: [PrismaService, PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
