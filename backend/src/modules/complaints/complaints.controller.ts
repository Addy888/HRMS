import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ComplaintsService } from './complaints.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  CreateReplyDto,
  AssignComplaintDto,
  ResolveComplaintDto,
} from './dto/complaint.dto.js';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ==========================================
  // EMPLOYEE ENDPOINTS
  // ==========================================

  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/complaints',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `attachment-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a new complaint with optional attachment (Employee Only)' })
  createComplaint(
    @GetUser('id') userId: string,
    @Body() dto: CreateComplaintDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.complaintsService.createComplaint(
      userId,
      dto,
      file,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('complaints/my')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get logged-in employee\'s raised complaints' })
  getMyComplaints(@GetUser('id') userId: string, @Query() query: any) {
    return this.complaintsService.getMyComplaints(userId, query);
  }

  @Get('complaints/dashboard/stats')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get employee complaints dashboard counts' })
  getEmployeeDashboardStats(@GetUser('id') userId: string) {
    return this.complaintsService.getEmployeeDashboardStats(userId);
  }

  @Get('complaints/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get full details of a specific complaint (Employee & HR)' })
  getComplaintById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Req() req: any,
  ) {
    return this.complaintsService.getComplaintById(
      id,
      userId,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('complaints/:id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a message reply to a complaint (Employee & HR)' })
  addReply(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Body() dto: CreateReplyDto,
    @Req() req: any,
  ) {
    return this.complaintsService.addReply(
      id,
      userId,
      userRole,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('complaints/:id/close')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Close a complaint ticket (Employee & HR)' })
  closeComplaint(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Req() req: any,
  ) {
    return this.complaintsService.closeComplaint(
      id,
      userId,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ==========================================
  // HR ADMIN ENDPOINTS
  // ==========================================

  @Get('admin/complaints')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get global complaints queue list (HR Only)' })
  getHRComplaintsQueue(@GetUser('id') userId: string, @Query() query: any) {
    return this.complaintsService.getHRComplaintsQueue(userId, query);
  }

  @Get('admin/complaints/dashboard/stats')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Get HR helpdesk analytics metrics (HR Only)' })
  getHRDashboardStats() {
    return this.complaintsService.getHRDashboardStats();
  }

  @Patch('admin/complaints/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update priority or status details of a complaint (HR Only)' })
  updateHRComplaint(
    @Param('id') id: string,
    @GetUser('id') hrUserId: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateHRComplaint(id, hrUserId, dto);
  }

  @Post('admin/complaints/:id/assign')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Assign/Reassign support ticket to an HR Agent (HR Only)' })
  assignComplaint(
    @Param('id') id: string,
    @GetUser('id') hrUserId: string,
    @Body() dto: AssignComplaintDto,
  ) {
    return this.complaintsService.assignComplaint(id, hrUserId, dto);
  }

  @Post('admin/complaints/:id/resolve')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Mark complaint support ticket as RESOLVED (HR Only)' })
  resolveComplaint(
    @Param('id') id: string,
    @GetUser('id') hrUserId: string,
    @Body() dto: ResolveComplaintDto,
  ) {
    return this.complaintsService.resolveComplaint(id, hrUserId, dto);
  }

  @Post('admin/complaints/:id/reopen')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Reopen a previously resolved complaint (HR Only)' })
  reopenComplaint(
    @Param('id') id: string,
    @GetUser('id') hrUserId: string,
  ) {
    return this.complaintsService.reopenComplaint(id, hrUserId);
  }
}
