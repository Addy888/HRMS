import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API and DB service health status' })
  @ApiResponse({ status: 200, description: 'Service is running healthily' })
  check() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'FCS-HRMS Backend API',
      uptime: process.uptime(),
    };
  }
}
