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
    @Res() res: Response, // Take full control - no passthrough
  ) {
    try {
      console.log('\n=== PDF VIEW REQUEST ===');
      console.log('Policy ID:', id);
      
      const policy = await this.companyPoliciesService.getPolicyById(id);

      if (!policy.fileUrl) {
        return res.status(404).json({ message: 'Policy file URL not found in database' });
      }

      // Normalize the file path - remove leading ./ or .\ and ensure forward slashes
      let normalizedPath = policy.fileUrl.replace(/^\.[\\/]/, '').replace(/\\/g, '/');
      
      // Construct the file path
      const filePath = join(process.cwd(), normalizedPath);
      
      console.log('Policy fileUrl from DB:', policy.fileUrl);
      console.log('Normalized path:', normalizedPath);
      console.log('Full file path:', filePath);
      console.log('Process cwd:', process.cwd());

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found at path:', filePath);
        return res.status(404).json({ message: 'Policy file not found' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      console.log('✅ File found');
      console.log('✓ File Size:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        console.error('❌ File is empty (0 bytes)');
        return res.status(404).json({ message: 'Policy file is empty' });
      }

      // Read first 5 bytes to verify PDF header
      const buffer = Buffer.alloc(5);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      
      const header = buffer.toString('utf-8');
      console.log('✓ PDF Header:', JSON.stringify(header));
      
      if (header !== '%PDF-') {
        console.error('❌ Invalid PDF header:', JSON.stringify(header));
        console.error('Expected: %PDF-');
        console.error('This is not a valid PDF file!');
        return res.status(400).json({ message: 'File is not a valid PDF' });
      }
      
      console.log('✅ Valid PDF file confirmed');

      // Set headers BEFORE piping
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${policy.fileName}"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
      
      console.log('✓ Headers Set:');
      console.log('  Content-Type: application/pdf');
      console.log('  Content-Length:', stats.size);
      console.log('  Content-Disposition: inline');

      console.log('✅ Starting direct pipe to response...');

      // Create read stream and pipe DIRECTLY to response - no wrapper
      const fileStream = createReadStream(filePath);
      
      let bytesStreamed = 0;
      
      fileStream.on('data', (chunk) => {
        bytesStreamed += chunk.length;
      });
      
      fileStream.on('error', (error) => {
        console.error('❌ Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Stream error' });
        }
      });

      fileStream.on('end', () => {
        console.log('✓ Stream Finished');
        console.log('✓ Bytes Streamed:', bytesStreamed);
        console.log('✓ Expected:', stats.size);
        console.log('✓ Match:', bytesStreamed === stats.size ? 'YES ✅' : 'NO ❌');
      });

      fileStream.on('close', () => {
        console.log('✅ Stream Closed');
        console.log('✅ Response Status: 200 OK');
        console.log('=== PDF STREAM COMPLETE ===\n');
      });

      // Direct pipe - no transformation, no wrapping
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('❌ Error in viewPolicy:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error' });
      }
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
