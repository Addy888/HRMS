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
  Req,
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

  @Get('employee/active')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Get active company policy for employee with acceptance status',
  })
  async getActivePolicyForEmployee(@GetUser('employeeId') employeeId: string) {
    return this.companyPoliciesService.getActivePolicyForEmployee(employeeId);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Accept company policy (Employee only)' })
  async acceptCompanyPolicy(
    @Param('id') id: string,
    @GetUser('employeeId') employeeId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.companyPoliciesService.acceptCompanyPolicy(
      employeeId,
      id,
      ipAddress,
      userAgent,
    );
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
    try {
      const policy = await this.companyPoliciesService.getPolicyById(id);

      if (!policy.fileUrl) {
        throw new NotFoundException('Policy file URL not found in database');
      }

      // Normalize the file path - remove leading ./ or .\ and ensure forward slashes
      let normalizedPath = policy.fileUrl.replace(/^\.[\\/]/, '').replace(/\\/g, '/');
      
      // Construct the file path
      const filePath = join(process.cwd(), normalizedPath);
      
      console.log('=== PDF View Request ===');
      console.log('Policy ID:', id);
      console.log('Policy fileUrl from DB:', policy.fileUrl);
      console.log('Normalized path:', normalizedPath);
      console.log('Full file path:', filePath);
      console.log('Process cwd:', process.cwd());

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found at path:', filePath);
        
        // Try alternate paths
        const alternatePath1 = join(process.cwd(), 'uploads', 'company-policies', policy.fileUrl.split(/[\\/]/).pop() || '');
        const alternatePath2 = join(process.cwd(), policy.fileUrl);
        
        console.log('Trying alternate path 1:', alternatePath1, '- exists:', fs.existsSync(alternatePath1));
        console.log('Trying alternate path 2:', alternatePath2, '- exists:', fs.existsSync(alternatePath2));
        
        throw new NotFoundException(
          `Policy file not found. Path in DB: ${policy.fileUrl}`,
        );
      }

      console.log('✅ File found, creating stream...');
      const file = createReadStream(filePath);

      // Handle stream errors
      file.on('error', (error) => {
        console.error('❌ Stream error:', error);
        throw new NotFoundException('Failed to read policy file');
      });

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
      });

      console.log('✅ Streaming PDF to client');
      return new StreamableFile(file);
    } catch (error) {
      console.error('❌ Error in viewPolicy:', error);
      throw error;
    }
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

  @Get('tracking/acceptance')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HR)
  @ApiOperation({
    summary: 'Get company policy acceptance tracking (HR Only)',
  })
  async getAcceptanceTracking() {
    return this.companyPoliciesService.getAcceptanceTracking();
  }
}
