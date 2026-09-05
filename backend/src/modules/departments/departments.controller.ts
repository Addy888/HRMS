import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, BulkAssignEmployeesDto } from './dto/department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Departments / Processes')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new department/process' })
  @ApiResponse({ status: 201, description: 'Department created' })
  create(@Body() dto: CreateDepartmentDto, @GetUser('id') userId: string) {
    return this.departmentsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments/processes' })
  findAll(@GetUser('id') userId: string) {
    return this.departmentsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department/process details with employees' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.departmentsService.findOne(id, userId);
  }

  @Put(':id')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update department/process' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @GetUser('id') userId: string,
  ) {
    return this.departmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete department/process' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.departmentsService.remove(id, userId);
  }

  @Post(':id/bulk-assign')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk assign employees to department/process' })
  @ApiResponse({ status: 200, description: 'Employees assigned successfully' })
  bulkAssignEmployees(
    @Param('id') departmentId: string,
    @Body() dto: BulkAssignEmployeesDto,
    @GetUser('id') userId: string,
  ) {
    return this.departmentsService.bulkAssignEmployees(departmentId, dto.employeeIds, userId);
  }
}
