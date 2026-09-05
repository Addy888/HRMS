import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service.js';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
} from './dto/employee.dto.js';
import { UpdateProfileDto } from './dto/profile.dto.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard) // ✅ JWT Auth Guard at controller level
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get profile details of logged-in employee' })
  getProfile(@GetUser('id') userId: string) {
    return this.employeesService.getProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update profile details of logged-in employee' })
  updateProfile(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.employeesService.updateProfile(userId, dto);
  }

  @Get('profile/completion')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get profile onboarding completion status & percentage checklist',
  })
  getProfileCompletion(@GetUser('id') userId: string) {
    return this.employeesService.getProfileCompletion(userId);
  }

  @Post('profile/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, and PNG images are supported!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
    }),
  )
  @ApiOperation({ summary: 'Upload/Replace profile avatar photo (Max 2MB)' })
  uploadPhoto(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }
    const photoUrl = `/uploads/avatars/${file.filename}`;
    return this.employeesService.uploadPhoto(userId, photoUrl);
  }

  @Delete('profile/photo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete profile avatar photo' })
  deletePhoto(@GetUser('id') userId: string) {
    return this.employeesService.deletePhoto(userId);
  }

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Register/Create a new employee profile (HR Only)' })
  @ApiResponse({
    status: 201,
    description:
      'Employee registered successfully, temporary credentials returned',
  })
  create(@Body() createEmployeeDto: CreateEmployeeDto, @GetUser('id') userId: string) {
    return this.employeesService.create(createEmployeeDto, userId);
  }

  @Get('next-employee-id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get next available Employee ID for preview (HR Only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the next available Employee ID',
  })
  getNextEmployeeId(@GetUser('id') userId: string) {
    return this.employeesService.getNextEmployeeId(userId);
  }

  @Get()
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Get all employees with pagination, search & filters (HR Only)',
  })
  findAll(@Query() query: QueryEmployeeDto, @GetUser('id') userId: string) {
    return this.employeesService.findAll(query, userId);
  }

  @Get(':id')
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Get full detail of a specific employee profile (HR Only)',
  })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.employeesService.findOne(id, userId);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Update employee basic/contact profile details (HR Only)',
  })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser('id') userId: string,
  ) {
    console.log('[EMPLOYEE-UPDATE] Controller received:', {
      employeeId: id,
      departmentId: updateEmployeeDto.departmentId,
      fullBody: updateEmployeeDto,
    });
    return this.employeesService.update(id, updateEmployeeDto, userId);
  }

  @Post(':id/activate')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Activate employee account (HR Only)' })
  activate(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.employeesService.setActivation(id, true, userId);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Deactivate employee account (HR Only)' })
  deactivate(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.employeesService.setActivation(id, false, userId);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.HR)
  @ApiOperation({
    summary:
      'Reset employee password back to default (1234) and force rewrite (HR Only)',
  })
  resetPassword(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.employeesService.resetPassword(id, userId);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Permanently remove employee user record from backend (HR Only)',
  })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.employeesService.remove(id, userId);
  }

  @Post('bulk/assign-department')
  @Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Bulk assign employees to department/process (HR Only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees assigned successfully',
  })
  bulkAssignDepartment(
    @Body() dto: { employeeIds: string[]; departmentId: string },
    @GetUser('id') userId: string,
  ) {
    return this.employeesService.bulkAssignDepartment(dto.employeeIds, dto.departmentId, userId);
  }
}
