import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HRActionsService } from './hr-actions.service.js';
import {
  CreateHRActionDto,
  UpdateHRActionDto,
  RespondHRActionDto,
  ResolveHRActionDto,
  CancelHRActionDto,
  QueryHRActionsDto,
} from './dto/hr-action.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard, Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('hr-actions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRActionsController {
  constructor(private readonly hrActionsService: HRActionsService) {}

  @Post()
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  create(@Body() createHRActionDto: CreateHRActionDto, @Req() req, @Query('sendImmediately') sendImmediately?: string) {
    const shouldSendImmediately = sendImmediately === 'true';
    return this.hrActionsService.create(createHRActionDto, req.user.id, shouldSendImmediately);
  }

  @Get()
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryHRActionsDto, @Req() req) {
    return this.hrActionsService.findAll(query, req.user.id);
  }

  @Get('statistics')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  getStatistics(@Req() req) {
    return this.hrActionsService.getStatistics(req.user.id);
  }

  @Get('my-actions')
  @Roles(UserRole.EMPLOYEE)
  async getMyActions(@Req() req) {
    console.log('[HR ACTIONS CONTROLLER] getMyActions called');
    console.log('[HR ACTIONS CONTROLLER] User ID:', req.user?.id);
    console.log('[HR ACTIONS CONTROLLER] User email:', req.user?.email);
    console.log('[HR ACTIONS CONTROLLER] User role:', req.user?.role);
    
    const result = await this.hrActionsService.getMyActions(req.user.id);
    
    console.log('[HR ACTIONS CONTROLLER] Service returned:', Array.isArray(result) ? `${result.length} actions` : 'not an array');
    if (Array.isArray(result) && result.length > 0) {
      console.log('[HR ACTIONS CONTROLLER] First action:', {
        actionNumber: result[0].actionNumber,
        status: result[0].status,
        employeeId: result[0].employeeId
      });
    }
    
    return result;
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string, @Req() req) {
    return this.hrActionsService.findByEmployee(employeeId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.hrActionsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateHRActionDto: UpdateHRActionDto,
    @Req() req,
  ) {
    return this.hrActionsService.update(id, updateHRActionDto, req.user.id);
  }

  @Post(':id/issue')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  issue(@Param('id') id: string, @Req() req) {
    return this.hrActionsService.issue(id, req.user.id);
  }

  @Post(':id/send')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  send(@Param('id') id: string, @Req() req) {
    return this.hrActionsService.send(id, req.user.id);
  }

  @Post(':id/acknowledge')
  @Roles(UserRole.EMPLOYEE)
  acknowledge(@Param('id') id: string, @Req() req) {
    return this.hrActionsService.acknowledge(id, req.user.id);
  }

  @Post(':id/mark-viewed')
  @Roles(UserRole.EMPLOYEE)
  markAsViewed(@Param('id') id: string, @Req() req) {
    return this.hrActionsService.markAsViewed(id, req.user.id);
  }

  @Post(':id/respond')
  @Roles(UserRole.EMPLOYEE)
  respond(
    @Param('id') id: string,
    @Body() respondDto: RespondHRActionDto,
    @Req() req,
  ) {
    return this.hrActionsService.respond(id, respondDto, req.user.id);
  }

  @Post(':id/resolve')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveHRActionDto,
    @Req() req,
  ) {
    return this.hrActionsService.resolve(id, resolveDto, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelHRActionDto,
    @Req() req,
  ) {
    return this.hrActionsService.cancel(id, cancelDto, req.user.id);
  }
}
