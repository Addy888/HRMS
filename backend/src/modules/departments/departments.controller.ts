import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Create a new department (HR Only)' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments list' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single department' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update department details (HR Only)' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Delete a department (HR Only)' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
