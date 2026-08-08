import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import {
  UploadDocumentDto,
  ReplaceDocumentDto,
  VerifyDocumentDto,
  QueryDocumentDto,
} from './dto/document.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Employee uploads a new onboarding document (Max 10MB, PDF/PNG/JPG/JPEG)',
  })
  uploadDocument(
    @GetUser('id') userId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No document file provided');
    return this.documentsService.uploadDocument(
      userId,
      dto.type,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('replace')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Employee replaces/updates an existing document version',
  })
  replaceDocument(
    @GetUser('id') userId: string,
    @Body() dto: ReplaceDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No document file provided');
    return this.documentsService.replaceDocument(
      userId,
      dto.documentId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Employee deletes a pending or rejected document' })
  deleteDocument(
    @GetUser('id') userId: string,
    @Param('id') documentId: string,
    @Req() req: any,
  ) {
    return this.documentsService.deleteDocument(
      userId,
      documentId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all uploaded documents of logged-in employee' })
  getEmployeeDocuments(@GetUser('id') userId: string) {
    return this.documentsService.getEmployeeDocuments(userId);
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'HR: Get all documents of a specific employee' })
  @ApiResponse({ status: 200, description: 'Returns all documents for the employee' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getEmployeeDocumentsByEmployeeId(
    @GetUser('id') userId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.documentsService.getDocumentsByEmployeeId(employeeId, userId);
  }

  @Get('queue')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Get global HR document verification queue (HR Only)',
  })
  getDocumentQueue(@GetUser('id') userId: string, @Query() query: QueryDocumentDto) {
    return this.documentsService.getDocumentQueue(query, userId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'HR approves/rejects/requests re-upload of a document (HR Only)',
  })
  verifyDocument(
    @GetUser('id') hrUserId: string,
    @Param('id') documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.verifyDocument(
      hrUserId,
      documentId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
