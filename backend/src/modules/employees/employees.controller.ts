import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto/employee.dto';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Register/Create a new employee profile (HR Only)' })
  @ApiResponse({ status: 201, description: 'Employee registered successfully, temporary credentials returned' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get all employees with pagination, search & filters (HR Only)' })
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get full detail of a specific employee profile (HR Only)' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update employee basic/contact profile details (HR Only)' })
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Post(':id/activate')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Activate employee account (HR Only)' })
  activate(@Param('id') id: string) {
    return this.employeesService.setActivation(id, true);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Deactivate employee account (HR Only)' })
  deactivate(@Param('id') id: string) {
    return this.employeesService.setActivation(id, false);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Reset employee password back to default (1234) and force rewrite (HR Only)' })
  resetPassword(@Param('id') id: string) {
    return this.employeesService.resetPassword(id);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Permanently remove employee user record from backend (HR Only)' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
