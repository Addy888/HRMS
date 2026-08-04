import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Create a new designation (HR Only)' })
  @ApiResponse({ status: 201, description: 'Designation created successfully' })
  create(@Body() createDesignationDto: CreateDesignationDto) {
    return this.designationsService.create(createDesignationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all designations list' })
  findAll() {
    return this.designationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single designation' })
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update designation details (HR Only)' })
  update(@Param('id') id: string, @Body() updateDesignationDto: UpdateDesignationDto) {
    return this.designationsService.update(id, updateDesignationDto);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Delete a designation (HR Only)' })
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
