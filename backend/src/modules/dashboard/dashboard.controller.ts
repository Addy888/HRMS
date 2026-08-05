import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { Roles, RolesGuard } from '../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UserRole } from '../../common/constants/index.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('hr')
  @Roles(UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get consolidated HR analytical metrics & charts (HR + Super Admin)' })
  @ApiResponse({ status: 200, description: 'KPI stats and listings returned successfully' })
  getHRStats() {
    return this.dashboardService.getHRStats();
  }
}
