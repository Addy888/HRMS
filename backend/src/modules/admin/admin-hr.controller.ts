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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminHRService } from './admin-hr.service.js';
import {
  CreateHRAccountDto,
  UpdateHRAccountDto,
  UpdateHRStatusDto,
  ResetHRPasswordDto,
} from './dto/admin-hr.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';

@ApiTags('Admin - HR Management')
@ApiBearerAuth()
@Controller('admin/hr-users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminHRController {
  constructor(private readonly adminHRService: AdminHRService) {}

  @Get()
  @ApiOperation({ summary: 'List all HR accounts (Super Admin Only)' })
  findAll(@Query() query: any) {
    return this.adminHRService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HR account by ID (Super Admin Only)' })
  findOne(@Param('id') id: string) {
    return this.adminHRService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new HR account (Super Admin Only)' })
  create(@Body() dto: CreateHRAccountDto, @GetUser('id') userId: string) {
    return this.adminHRService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update HR account (Super Admin Only)' })
  update(@Param('id') id: string, @Body() dto: UpdateHRAccountDto) {
    return this.adminHRService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activate/Deactivate HR account (Super Admin Only)',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateHRStatusDto) {
    return this.adminHRService.updateStatus(id, dto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset HR account password (Super Admin Only)' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetHRPasswordDto) {
    return this.adminHRService.resetPassword(id, dto);
  }
}
