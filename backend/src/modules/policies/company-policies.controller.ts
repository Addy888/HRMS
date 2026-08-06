import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/constants/index.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { CompanyPoliciesService } from './company-policies.service.js';
import { UploadCompanyPolicyDto } from './dto/company-policy.dto.js';
import { pdfUploadOptions } from '../../common/config/multer.config.js';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

@ApiTags('Company Policies')
@ApiBearerAuth()
@Controller('company-policies')
export class CompanyPoliciesController {
  constructor(
    private readonly companyPoliciesService: CompanyPoliciesService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @UseInterceptors(FileInterceptor('file', pdfUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload company policy PDF (HR Only)' })
  async uploadPolicy(
    @GetUser('id') userId: string,
    @GetUser('employee') employee: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCompanyPolicyDto,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const uploaderName = employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'HR Admin';

    return this.companyPoliciesService.uploadPolicy(
      userId,
      uploaderName,
      file,
      dto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'List all company policies (HR Only)' })
  async listPolicies() {
    return this.companyPoliciesService.listPolicies();
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get active company policy (All authenticated users)',
  })
  async getActivePolicy() {
    return this.companyPoliciesService.getActivePolicy();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get company policy by ID (All authenticated users)',
  })
  async getPolicyById(@Param('id') id: string) {
    return this.companyPoliciesService.getPolicyById(id);
  }

  @Get(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'View/stream company policy PDF securely' })
  async viewPolicy(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const policy = await this.companyPoliciesService.getPolicyById(id);

    const filePath = join(process.cwd(), policy.fileUrl);
    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return new StreamableFile(file);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Download company policy PDF (HR Only)' })
  async downloadPolicy(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const policy = await this.companyPoliciesService.getPolicyById(id);

    const filePath = join(process.cwd(), policy.fileUrl);
    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${policy.fileName}"`,
    });

    return new StreamableFile(file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Delete company policy (HR Only)' })
  async deletePolicy(@Param('id') id: string) {
    return this.companyPoliciesService.deletePolicy(id);
  }
}
