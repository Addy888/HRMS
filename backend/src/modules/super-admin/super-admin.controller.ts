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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';

@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get company-wide dashboard statistics (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  getDashboardStats(@GetUser('id') userId: string) {
    return this.superAdminService.getDashboardStats(userId);
  }

  @Get('dashboard/process-overview')
  @ApiOperation({ summary: 'Get process-wise overview (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Process overview retrieved' })
  getProcessOverview(@GetUser('id') userId: string) {
    return this.superAdminService.getProcessOverview(userId);
  }

  // ==========================================
  // ADMIN MANAGEMENT
  // ==========================================
  @Get('admins')
  @ApiOperation({ summary: 'Get all HR admins (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Admin list retrieved' })
  getAllAdmins(@GetUser('id') userId: string) {
    return this.superAdminService.getAllAdmins(userId);
  }

  @Get('admins/:id')
  @ApiOperation({ summary: 'Get HR admin details with processes and employees (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Admin details retrieved' })
  getAdminDetails(
    @GetUser('id') userId: string,
    @Param('id') adminId: string,
  ) {
    return this.superAdminService.getAdminDetails(userId, adminId);
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create new HR admin (Super Admin Only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  createAdmin(@GetUser('id') userId: string, @Body() dto: any) {
    return this.superAdminService.createAdmin(userId, dto);
  }

  @Put('admins/:id')
  @ApiOperation({ summary: 'Update HR admin (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  updateAdmin(
    @GetUser('id') userId: string,
    @Param('id') adminId: string,
    @Body() dto: any,
  ) {
    return this.superAdminService.updateAdmin(userId, adminId, dto);
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Delete HR admin (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  deleteAdmin(@GetUser('id') userId: string, @Param('id') adminId: string) {
    return this.superAdminService.deleteAdmin(userId, adminId);
  }

  @Post('admins/:id/reset-password')
  @ApiOperation({ summary: 'Reset HR admin password (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetAdminPassword(
    @GetUser('id') userId: string,
    @Param('id') adminId: string,
  ) {
    return this.superAdminService.resetAdminPassword(userId, adminId);
  }

  // ==========================================
  // EMPLOYEE MANAGEMENT
  // ==========================================
  @Get('employees')
  @ApiOperation({ summary: 'Get all employees company-wide (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee list retrieved' })
  getAllEmployees(@GetUser('id') userId: string, @Query() filters: any) {
    return this.superAdminService.getAllEmployees(userId, filters);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get single employee details (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee details retrieved' })
  getEmployeeDetails(
    @GetUser('id') userId: string,
    @Param('id') employeeId: string,
  ) {
    return this.superAdminService.getEmployeeDetails(userId, employeeId);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create new employee (Super Admin Only)' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  createEmployee(@GetUser('id') userId: string, @Body() dto: any) {
    return this.superAdminService.createEmployee(userId, dto);
  }

  @Put('employees/:id')
  @ApiOperation({ summary: 'Update employee details (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  updateEmployee(
    @GetUser('id') userId: string,
    @Param('id') employeeId: string,
    @Body() dto: any,
  ) {
    return this.superAdminService.updateEmployee(userId, employeeId, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Delete employee (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  deleteEmployee(@GetUser('id') userId: string, @Param('id') employeeId: string) {
    return this.superAdminService.deleteEmployee(userId, employeeId);
  }

  @Post('employees/:id/activate')
  @ApiOperation({ summary: 'Activate employee account (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee activated successfully' })
  activateEmployee(@GetUser('id') userId: string, @Param('id') employeeId: string) {
    return this.superAdminService.setEmployeeActivation(userId, employeeId, true);
  }

  @Post('employees/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate employee account (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Employee deactivated successfully' })
  deactivateEmployee(@GetUser('id') userId: string, @Param('id') employeeId: string) {
    return this.superAdminService.setEmployeeActivation(userId, employeeId, false);
  }

  @Post('employees/:id/reset-password')
  @ApiOperation({ summary: 'Reset employee password (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetEmployeePassword(@GetUser('id') userId: string, @Param('id') employeeId: string) {
    return this.superAdminService.resetEmployeePassword(userId, employeeId);
  }

  // ==========================================
  // PROCESS MANAGEMENT
  // ==========================================
  @Get('processes')
  @ApiOperation({ summary: 'Get all processes (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Process list retrieved' })
  getAllProcesses(@GetUser('id') userId: string) {
    return this.superAdminService.getAllProcesses(userId);
  }

  @Get('processes/:id')
  @ApiOperation({ summary: 'Get process details with employees (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Process details retrieved' })
  getProcessDetails(
    @GetUser('id') userId: string,
    @Param('id') processId: string,
  ) {
    return this.superAdminService.getProcessDetails(userId, processId);
  }

  @Post('processes')
  @ApiOperation({ summary: 'Create new process (Super Admin Only)' })
  @ApiResponse({ status: 201, description: 'Process created successfully' })
  createProcess(@GetUser('id') userId: string, @Body() dto: any) {
    return this.superAdminService.createProcess(userId, dto);
  }

  @Put('processes/:id')
  @ApiOperation({ summary: 'Update process (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Process updated successfully' })
  updateProcess(
    @GetUser('id') userId: string,
    @Param('id') processId: string,
    @Body() dto: any,
  ) {
    return this.superAdminService.updateProcess(userId, processId, dto);
  }

  @Delete('processes/:id')
  @ApiOperation({ summary: 'Delete process (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Process deleted successfully' })
  deleteProcess(@GetUser('id') userId: string, @Param('id') processId: string) {
    return this.superAdminService.deleteProcess(userId, processId);
  }

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================
  @Get('search')
  @ApiOperation({ summary: 'Global search across employees, processes, admins (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  globalSearch(@GetUser('id') userId: string, @Query('q') searchTerm: string) {
    return this.superAdminService.globalSearch(userId, searchTerm);
  }
}
