/**
 * PLATFORM CONTROLLER
 * 
 * Organization management endpoints for PLATFORM_SUPER_ADMIN
 * 
 * SECURITY:
 * - Only PLATFORM_SUPER_ADMIN can access these endpoints
 * - Company SUPER_ADMIN cannot access
 * - These APIs manage organizations, not company data
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';
import { PlatformService } from './platform.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_SUPER_ADMIN) // Only platform super admin
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * Create new organization with Super Admin
   */
  @Post('organizations')
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.platformService.createOrganization(dto);
  }

  /**
   * Get all organizations
   */
  @Get('organizations')
  async getAllOrganizations(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.platformService.getAllOrganizations({
      search,
      isActive: isActive ? isActive === 'true' : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get single organization details
   */
  @Get('organizations/:id')
  async getOrganization(@Param('id') id: string) {
    return this.platformService.getOrganization(id);
  }

  /**
   * Update organization
   */
  @Patch('organizations/:id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.platformService.updateOrganization(id, dto);
  }

  /**
   * Activate organization
   */
  @Patch('organizations/:id/activate')
  async activateOrganization(@Param('id') id: string) {
    return this.platformService.toggleOrganizationStatus(id, true);
  }

  /**
   * Deactivate organization
   */
  @Patch('organizations/:id/deactivate')
  async deactivateOrganization(@Param('id') id: string) {
    return this.platformService.toggleOrganizationStatus(id, false);
  }

  /**
   * Create additional Super Admin for an organization
   */
  @Post('organizations/:id/super-admin')
  async createOrganizationSuperAdmin(
    @Param('id') id: string,
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.platformService.createOrganizationSuperAdmin(id, body);
  }

  /**
   * Get platform statistics
   */
  @Get('statistics')
  async getPlatformStatistics() {
    return this.platformService.getPlatformStatistics();
  }
}
