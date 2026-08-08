import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service.js';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  AssignPolicyDto,
  AcceptPolicyDto,
  SubmitAcknowledgementDto,
} from './dto/policy.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';

@ApiTags('Policies')
@ApiBearerAuth()
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary:
      'List all policies with optional search/status/category filter (HR Only)',
  })
  listPolicies(@Query() query: any) {
    return this.policiesService.listPolicies(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single policy by ID (HR & Employee)' })
  getPolicyById(@Param('id') id: string) {
    return this.policiesService.getPolicyById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Create a new policy in draft (HR Only)' })
  createPolicy(@GetUser('id') hrUserId: string, @Body() dto: CreatePolicyDto) {
    return this.policiesService.createPolicy(hrUserId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary:
      'Update policy details & automatically backup version if revised (HR Only)',
  })
  updatePolicy(
    @GetUser('id') hrUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.updatePolicy(hrUserId, id, dto);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Publish or archive a policy (HR Only)' })
  setPolicyStatus(
    @GetUser('id') hrUserId: string,
    @Param('id') id: string,
    @Body() dto: { status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT' },
  ) {
    return this.policiesService.setPolicyStatus(hrUserId, id, dto.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Delete a policy permanently (HR Only)' })
  deletePolicy(@GetUser('id') hrUserId: string, @Param('id') id: string) {
    return this.policiesService.deletePolicy(hrUserId, id);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Assign a policy to target scopes (HR Only)' })
  assignPolicy(
    @GetUser('id') hrUserId: string,
    @Param('id') id: string,
    @Body() dto: AssignPolicyDto,
  ) {
    return this.policiesService.assignPolicy(hrUserId, id, dto);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get policies status metrics dashboard (HR Only)' })
  getHRDashboard() {
    return this.policiesService.getHRDashboard();
  }

  @Get('tracking')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Get details tracking list of employee acceptances (HR Only)',
  })
  getHRTracking(@Query() query: any) {
    return this.policiesService.getHRTracking(query);
  }

  // Employee-facing Endpoints
  @Get('assigned')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Get assigned policies checklist for logged-in employee',
  })
  getEmployeePolicies(@GetUser('id') userId: string) {
    return this.policiesService.getEmployeePolicies(userId);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Accept a specific policy version' })
  acceptPolicy(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AcceptPolicyDto,
  ) {
    return this.policiesService.acceptPolicy(userId, id, dto);
  }

  @Get('acknowledgement/status')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Get acknowledgement status for logged-in employee',
  })
  getAcknowledgementStatus(@GetUser('id') userId: string) {
    return this.policiesService.getAcknowledgementStatus(userId);
  }

  @Post('acknowledge')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Submit final digital signature signoff (onboarding milestone 4)',
  })
  submitAcknowledgement(
    @GetUser('id') userId: string,
    @Body() dto: SubmitAcknowledgementDto,
    @Req() req: any,
  ) {
    return this.policiesService.submitAcknowledgement(
      userId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
