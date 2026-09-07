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
import { DesignationsService } from './designations.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
@UseGuards(JwtAuthGuard) // ✅ CRITICAL FIX: Added JWT authentication guard
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Create a new designation (HR Only)' })
  @ApiResponse({ status: 201, description: 'Designation created successfully' })
  create(@Body() createDesignationDto: CreateDesignationDto, @GetUser('id') userId: string) {
    return this.designationsService.create(createDesignationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all designations list' })
  findAll(@GetUser('id') userId: string) {
    return this.designationsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single designation' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.designationsService.findOne(id, userId);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update designation details (HR Only)' })
  update(
    @Param('id') id: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
    @GetUser('id') userId: string,
  ) {
    return this.designationsService.update(id, updateDesignationDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Delete a designation (HR Only)' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.designationsService.remove(id, userId);
  }
}
