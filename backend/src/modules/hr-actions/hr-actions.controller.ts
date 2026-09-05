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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('HR Actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr-actions')
export class HRActionsController {
  constructor(private readonly hrActionsService: HRActionsService) {}

  /**
   * Create HR Action (HR only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create HR Action (HR only)' })
  @ApiResponse({ status: 201, description: 'HR Action created successfully' })
  async create(
    @Request() req,
    @Body() dto: CreateHRActionDto,
    @Query('sendImmediately') sendImmediately?: string,
  ) {
    const shouldSendImmediately = sendImmediately === 'true';
    return this.hrActionsService.create(dto, req.user.id, shouldSendImmediately);
  }

  /**
   * Get all HR Actions (HR only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get all HR Actions (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Actions retrieved' })
  async findAll(@Request() req, @Query() query: QueryHRActionsDto) {
    return this.hrActionsService.findAll(query, req.user.id);
  }

  /**
   * Get my HR actions (current logged-in employee)
   * MUST be defined before :id route to avoid path collision
   */
  @Get('my/actions')
  @ApiOperation({ summary: 'Get my HR Actions (Employee)' })
  @ApiResponse({ status: 200, description: 'My HR Actions retrieved' })
  async getMyActions(@Request() req) {
    return this.hrActionsService.getMyActions(req.user.id);
  }

  /**
   * Get HR Actions statistics
   * MUST be defined before :id route to avoid path collision
   */
  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @ApiOperation({ summary: 'Get HR Actions statistics (HR only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(@Request() req) {
    return this.hrActionsService.getStatistics(req.user.id);
  }

  /**
   * Get employee's HR actions
   * MUST be defined before :id route to avoid path collision
   */
  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee HR Actions' })
  @ApiResponse({ status: 200, description: 'Employee HR Actions retrieved' })
  async findByEmployee(@Request() req, @Param('employeeId') employeeId: string) {
    return this.hrActionsService.findByEmployee(employeeId, req.user.id);
  }

  /**
   * Get single HR Action by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get HR Action by ID' })
  @ApiResponse({ status: 200, description: 'HR Action retrieved' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.hrActionsService.findOne(id, req.user.id);
  }

  /**
   * Update HR Action (HR only, DRAFT status only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update HR Action (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Action updated successfully' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateHRActionDto,
  ) {
    return this.hrActionsService.update(id, dto, req.user.id);
  }

  /**
   * Issue HR Action (HR only)
   */
  @Post(':id/issue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue HR Action (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Action issued successfully' })
  async issue(@Request() req, @Param('id') id: string) {
    return this.hrActionsService.issue(id, req.user.id);
  }

  /**
   * Send HR Action (HR only)
   */
  @Post(':id/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send HR Action (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Action sent successfully' })
  async send(@Request() req, @Param('id') id: string) {
    return this.hrActionsService.send(id, req.user.id);
  }

  /**
   * Acknowledge HR Action (Employee only)
   */
  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge HR Action (Employee)' })
  @ApiResponse({ status: 200, description: 'HR Action acknowledged successfully' })
  async acknowledge(@Request() req, @Param('id') id: string) {
    return this.hrActionsService.acknowledge(id, req.user.id);
  }

  /**
   * Respond to HR Action (Employee only)
   */
  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to HR Action (Employee)' })
  @ApiResponse({ status: 200, description: 'Response submitted successfully' })
  async respond(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RespondHRActionDto,
  ) {
    return this.hrActionsService.respond(id, dto, req.user.id);
  }

  /**
   * Resolve HR Action (HR only)
   */
  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve HR Action (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Action resolved successfully' })
  async resolve(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ResolveHRActionDto,
  ) {
    return this.hrActionsService.resolve(id, dto, req.user.id);
  }

  /**
   * Cancel HR Action (HR only)
   */
  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel HR Action (HR only)' })
  @ApiResponse({ status: 200, description: 'HR Action cancelled successfully' })
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelHRActionDto,
  ) {
    return this.hrActionsService.cancel(id, dto, req.user.id);
  }
}
