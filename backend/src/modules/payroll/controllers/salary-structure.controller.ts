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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/constants';
import { SalaryStructureService } from '../services/salary-structure.service';
import { CreateSalaryStructureDto } from '../dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from '../dto/update-salary-structure.dto';

@Controller('salary-structure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryStructureController {
  constructor(
    private readonly salaryStructureService: SalaryStructureService,
  ) {}

  @Post()
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createDto: CreateSalaryStructureDto) {
    return this.salaryStructureService.create(createDto);
  }

  @Get()
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query() query: any) {
    return this.salaryStructureService.findAll(query);
  }

  @Get('list')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async getEmployeeSalaryList(
    @Query('search') search?: string,
    @Query('department') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salaryStructureService.getEmployeeSalaryList({
      search,
      departmentId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('dashboard/stats')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async getDashboardStats() {
    return this.salaryStructureService.getDashboardStats();
  }

  @Get(':id')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.salaryStructureService.findOne(id);
  }

  @Get('employee/:employeeId/active')
  async getActiveSalary(@Param('employeeId') employeeId: string) {
    return this.salaryStructureService.getActiveSalaryStructure(employeeId);
  }

  @Get('employee/:employeeId/history')
  async getSalaryHistory(@Param('employeeId') employeeId: string) {
    return this.salaryStructureService.getSalaryHistory(employeeId);
  }

  @Put(':id')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalaryStructureDto,
  ) {
    return this.salaryStructureService.update(id, updateDto);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.salaryStructureService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.HR_USER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.salaryStructureService.delete(id);
  }
}
