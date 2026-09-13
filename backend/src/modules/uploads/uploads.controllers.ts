import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { join, resolve, isAbsolute } from 'path';
import { existsSync, createReadStream, statSync, readdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  private readonly baseUploadPath: string;

  constructor() {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    this.baseUploadPath = isAbsolute(uploadDir)
      ? uploadDir
      : resolve(process.cwd(), uploadDir);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('UploadsController Initialized');
    console.log(`  UPLOAD_DIR env: ${process.env.UPLOAD_DIR || 'not set'}`);
    console.log(`  process.cwd(): ${process.cwd()}`);
    console.log(`  Base upload path: ${this.baseUploadPath}`);
    console.log(`  Path exists: ${existsSync(this.baseUploadPath)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  @Get('documents/:filename')
  @ApiOperation({ summary: 'Serve uploaded document files' })
  @ApiParam({ name: 'filename', description: 'Document filename' })
  async serveDocument(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    console.log('UPLOAD DOCUMENT ROUTE HIT:', filename);
    return this.serveFile('documents', filename, res);
  }

  @Get('avatars/:filename')
  @ApiOperation({ summary: 'Serve uploaded avatar images' })
  @ApiParam({ name: 'filename', description: 'Avatar filename' })
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.serveFile('avatars', filename, res);
  }

  @Get('complaints/:filename')
  @ApiOperation({ summary: 'Serve uploaded complaint attachments' })
  @ApiParam({
    name: 'filename',
    description: 'Complaint attachment filename',
  })
  async serveComplaint(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.serveFile('complaints', filename, res);
  }

  @Get('company-policies/:filename')
  @ApiOperation({ summary: 'Serve uploaded company policy documents' })
  @ApiParam({
    name: 'filename',
    description: 'Company policy filename',
  })
  async serveCompanyPolicy(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.serveFile('company-policies', filename, res);
  }

  @Get('attendance/:filename')
  @ApiOperation({ summary: 'Serve uploaded attendance files' })
  @ApiParam({
    name: 'filename',
    description: 'Attendance filename',
  })
  async serveAttendance(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.serveFile('attendance', filename, res);
  }

  @Get('_debug/info')
  @ApiOperation({ summary: 'Debug: Show upload configuration info' })
  async debugInfo(@Res() res: Response) {
    const info = {
      uploadDir: process.env.UPLOAD_DIR || 'not set',
      cwd: process.cwd(),
      baseUploadPath: this.baseUploadPath,
      pathExists: existsSync(this.baseUploadPath),
      folders: {} as Record<string, any>,
    };

    const folders = [
      'documents',
      'avatars',
      'complaints',
      'company-policies',
      'attendance',
    ];

    for (const folder of folders) {
      const folderPath = join(this.baseUploadPath, folder);
      const folderExists = existsSync(folderPath);

      info.folders[folder] = {
        path: folderPath,
        exists: folderExists,
        fileCount: 0,
        sampleFiles: [] as string[],
      };

      if (folderExists) {
        try {
          const files = readdirSync(folderPath);

          info.folders[folder].fileCount = files.length;
          info.folders[folder].sampleFiles = files.slice(0, 5);
        } catch (err) {
          info.folders[folder].error = (err as Error).message;
        }
      }
    }

    res.json(info);
  }

  private async serveFile(
    folder: string,
    filename: string,
    res: Response,
  ): Promise<void> {
    // Prevent path traversal attacks
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('Invalid filename');
    }

    const folderPath = join(this.baseUploadPath, folder);
    const filePath = join(folderPath, filename);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 DOCUMENT REQUEST: ${filename}`);
    console.log(`   Folder: ${folder}`);
    console.log(
      `   CONFIGURED UPLOAD_DIR: ${
        process.env.UPLOAD_DIR || './uploads (default)'
      }`,
    );
    console.log(`   PROCESS CWD: ${process.cwd()}`);
    console.log(`   RESOLVED BASE PATH: ${this.baseUploadPath}`);
    console.log(`   RESOLVED FOLDER PATH: ${folderPath}`);
    console.log(`   RESOLVED FILE PATH: ${filePath}`);
    console.log(`   FOLDER EXISTS: ${existsSync(folderPath)}`);
    console.log(`   FILE EXISTS: ${existsSync(filePath)}`);

    if (!existsSync(filePath)) {
      console.log(`   ❌ FILE NOT FOUND AT EXPECTED LOCATION`);

      if (existsSync(folderPath)) {
        console.log(`   📁 Available files in ${folder}/ folder:`);

        try {
          const files = readdirSync(folderPath);

          if (files.length === 0) {
            console.log(
              `      ⚠️ Folder is empty - no files uploaded yet`,
            );
          } else {
            console.log(`      Found ${files.length} file(s):`);

            files.slice(0, 20).forEach((f, idx) => {
              const fPath = join(folderPath, f);
              const fStats = statSync(fPath);

              console.log(
                `      ${idx + 1}. ${f} (${fStats.size} bytes, modified: ${fStats.mtime.toISOString()})`,
              );
            });

            if (files.length > 20) {
              console.log(
                `      ... and ${files.length - 20} more files`,
              );
            }
          }
        } catch (err: any) {
          console.log(
            `      ❌ Error reading folder: ${err.message}`,
          );
        }
      } else {
        console.log(
          `   ❌ FOLDER DOES NOT EXIST: ${folderPath}`,
        );
        console.log(
          `   💡 TIP: Run the server to auto-create upload folders`,
        );
      }

      console.log('\n   🔍 TROUBLESHOOTING:');
      console.log(
        `      1. Check if file exists in database: SELECT * FROM Document WHERE fileUrl LIKE '%${filename}%';`,
      );
      console.log(
        `      2. If database has record but file missing: File was deleted or moved`,
      );
      console.log(
        `      3. If database has no record but file exists: Run restore-documents.js`,
      );
      console.log(
        `      4. If neither exists: Document was never uploaded or was fully deleted`,
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      throw new NotFoundException(
        `File not found: ${filename}. Check server logs for details.`,
      );
    }

    const stats = statSync(filePath);

    console.log(`   ✅ FILE FOUND (${stats.size} bytes)`);
    console.log(
      `   LAST MODIFIED: ${stats.mtime.toISOString()}`,
    );

    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
    };

    const mimeType =
      mimeTypes[ext || ''] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename}"`,
    );
    res.setHeader(
      'Cache-Control',
      'public, max-age=31536000',
    );

    console.log(`   MIME TYPE: ${mimeType}`);
    console.log(`   ✅ STREAMING FILE...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const fileStream = createReadStream(filePath);

    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error(
        `   ❌ ERROR STREAMING FILE:`,
        error,
      );

      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Error serving file' });
      }
    });
  }
}