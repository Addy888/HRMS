/**
 * ATTENDANCE IMPORT CONTROLLER
 * API endpoints for Excel-based attendance import (HR/Admin only)
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AttendanceImportService } from '../services/attendance-import.service.js';
import {
  ConfirmImportDto,
  GetImportHistoryDto,
} from '../dto/attendance-import.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../../common/constants/index.js';
import { PrismaService } from '../../../database/prisma.service.js';
import * as XLSX from 'xlsx';

@ApiTags('Attendance Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER, UserRole.SUPER_ADMIN)
@Controller('attendance/import')
export class AttendanceImportController {
  constructor(
    private readonly importService: AttendanceImportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Download Excel Template
   */
  @Get('template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download attendance Excel template' })
  @ApiResponse({ status: 200, description: 'Template downloaded' })
  async downloadTemplate(@Res() res: Response) {
    // Create sample data
    const templateData = [
      {
        'Employee ID': 'FCS-2026-0001',
        'Date': '2026-09-05',
        'Check In': '09:30',
        'Check Out': '19:15',
        'Status': 'PRESENT',
      },
      {
        'Employee ID': 'FCS-2026-0002',
        'Date': '2026-09-05',
        'Check In': '10:15',
        'Check Out': '19:00',
        'Status': 'LATE',
      },
      {
        'Employee ID': 'FCS-2026-0003',
        'Date': '2026-09-05',
        'Check In': '09:00',
        'Check Out': '16:30',
        'Status': 'HALF_DAY',
      },
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Employee ID
      { wch: 12 }, // Date
      { wch: 10 }, // Check In
      { wch: 10 }, // Check Out
      { wch: 12 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Attendance_Template.xlsx',
    );

    res.send(buffer);
  }

  /**
   * Upload and Preview Excel
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload and preview attendance Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 200, description: 'Preview generated' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async previewImport(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (
      !file.originalname.match(/\.(xlsx|xls)$/) &&
      file.mimetype !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.importService.parseAndValidateExcel(
      file,
      user.organizationId,
      user.id,
    );
  }

  /**
   * Confirm and Execute Import
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and execute attendance import' })
  @ApiResponse({ status: 200, description: 'Import completed' })
  @ApiResponse({ status: 400, description: 'Invalid session' })
  async confirmImport(@Request() req, @Body() dto: ConfirmImportDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.importService.confirmImport(
      dto.sessionId,
      user.organizationId,
      user.id,
    );
  }

  /**
   * Get Import History
   */
  @Get('history')
  @ApiOperation({ summary: 'Get attendance import history' })
  @ApiResponse({ status: 200, description: 'Import history retrieved' })
  async getImportHistory(@Request() req, @Query() dto: GetImportHistoryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.importService.getImportHistory(user.organizationId, dto);
  }

  /**
   * Get Import History by ID
   */
  @Get('history/:id')
  @ApiOperation({ summary: 'Get import history details' })
  @ApiResponse({ status: 200, description: 'Import history details retrieved' })
  @ApiResponse({ status: 404, description: 'Import history not found' })
  async getImportHistoryById(@Request() req, @Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.importService.getImportHistoryById(id, user.organizationId);
  }

  /**
   * Download Error Report
   */
  @Get('history/:id/errors')
  @ApiOperation({ summary: 'Download error report for import' })
  @ApiResponse({ status: 200, description: 'Error report downloaded' })
  @ApiResponse({ status: 404, description: 'Import history not found' })
  async downloadErrorReport(
    @Request() req,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const history = await this.importService.getImportHistoryById(
      id,
      user.organizationId,
    );

    if (!history.errorReport) {
      throw new BadRequestException('No errors in this import');
    }

    const errorData = JSON.parse(history.errorReport);
    const allErrors = [
      ...(errorData.importErrors || []),
      ...(errorData.validationErrors || []),
    ];

    // Create Excel with errors
    const worksheet = XLSX.utils.json_to_sheet(allErrors);
    worksheet['!cols'] = [
      { wch: 10 }, // Row Number
      { wch: 15 }, // Employee ID
      { wch: 50 }, // Error
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Import_Errors_${id}.xlsx`,
    );

    res.send(buffer);
  }

  /**
   * DELETE IMPORT HISTORY
   * Delete an attendance import and all its associated records
   */
  @Delete('history/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attendance import history and all associated records' })
  @ApiResponse({ status: 200, description: 'Import history deleted successfully' })
  @ApiResponse({ status: 404, description: 'Import history not found' })
  async deleteImportHistory(@Request() req, @Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.importService.deleteImportHistory(id, user.organizationId);
  }

  /**
   * GET UPLOADED ATTENDANCE FILE
   * Download/view the originally uploaded Excel file
   * Falls back to reconstructing Excel from raw records if original not found
   */
  @Get('file/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download uploaded attendance file' })
  @ApiResponse({ status: 200, description: 'File downloaded' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadUploadedFile(
    @Request() req,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { join } = await import('path');
    const fs = await import('fs/promises');

    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const history = await this.importService.getImportHistoryById(id, user.organizationId);

    // Strategy 1: Try to read original stored file
    if (history.fileStoragePath) {
      const filePath = join(process.cwd(), history.fileStoragePath);
      try {
        const data = await fs.readFile(filePath);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${history.fileName}`,
        );

        return res.send(data);
      } catch (error) {
        console.error(`Failed to read stored file ${filePath}:`, error.message);
        // Fall through to Strategy 2
      }
    }

    // Strategy 2: Reconstruct Excel from raw records
    try {
      const rawRecords = await this.prisma.rawAttendanceRecord.findMany({
        where: {
          importHistoryId: id,
          organizationId: user.organizationId,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (rawRecords.length === 0) {
        throw new NotFoundException('No attendance records found for this import');
      }

      // Parse all raw data and reconstruct rows
      const rows = rawRecords.map(record => {
        try {
          return JSON.parse(record.rawData || '{}');
        } catch {
          return {};
        }
      });

      // Create Excel worksheet from reconstructed rows
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Set column widths (auto-fit based on content)
      const colWidths: any[] = [];
      if (rows.length > 0) {
        const firstRow = rows[0];
        Object.keys(firstRow).forEach(() => {
          colWidths.push({ wch: 15 });
        });
      }
      if (colWidths.length > 0) {
        worksheet['!cols'] = colWidths;
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${history.fileName}`,
      );

      return res.send(buffer);
    } catch (error) {
      console.error(`Failed to download/reconstruct file ${id}:`, error.message);
      throw new NotFoundException('Unable to retrieve attendance file');
    }
  }
}
