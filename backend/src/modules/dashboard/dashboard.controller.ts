import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('hr')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get consolidated HR analytical metrics & charts (HR Only)' })
  @ApiResponse({ status: 200, description: 'KPI stats and listings returned successfully' })
  getHRStats() {
    return this.dashboardService.getHRStats();
  }
}
