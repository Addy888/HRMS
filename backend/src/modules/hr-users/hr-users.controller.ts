import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HRUsersService } from './hr-users.service.js';
import {
  CreateHRUserDto,
  UpdateHRUserDto,
  UpdateHRStatusDto,
} from './dto/hr-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';

@ApiTags('HR Users')
@ApiBearerAuth()
@Controller('hr-users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.HR_ADMIN) // ✅ Only HR_ADMIN can access HR User Management
export class HRUsersController {
  constructor(private readonly hrUsersService: HRUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all HR users (HR_ADMIN Only)' })
  findAll(@Query() query: any, @Request() req: any) {
    return this.hrUsersService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HR user by ID (HR_ADMIN Only)' })
  findOne(@Param('id') id: string) {
    return this.hrUsersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new HR user (HR_ADMIN Only)' })
  create(@Body() dto: CreateHRUserDto, @Request() req: any) {
    return this.hrUsersService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update HR user (HR_ADMIN Only)' })
  update(@Param('id') id: string, @Body() dto: UpdateHRUserDto) {
    return this.hrUsersService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate/Deactivate HR user (HR_ADMIN Only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateHRStatusDto) {
    return this.hrUsersService.updateStatus(id, dto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset HR user password (HR_ADMIN Only)' })
  resetPassword(@Param('id') id: string) {
    return this.hrUsersService.resetPassword(id);
  }
}
