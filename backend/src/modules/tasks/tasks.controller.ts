import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';

@ApiTags('Tasks & Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task, field visit, or daily work activity' })
  create(@GetUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get task, visit and work activity summary metrics' })
  getSummary(
    @GetUser('id') userId: string,
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.tasksService.getSummary(userId, employeeId, departmentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of tasks/activities with filters and pagination' })
  findAll(@GetUser('id') userId: string, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific task or activity' })
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task, record outcome, update status, or add notes' })
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task/activity' })
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.remove(userId, id);
  }
}
