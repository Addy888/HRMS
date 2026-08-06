import { Injectable, BadRequestException } from '@nestjs/common';
import { IStorageService, UploadedFileResponse } from './storage.interface.js';
import { join, extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly baseUploadPath = join(process.cwd(), 'uploads');

  constructor() {
    // Ensure core upload paths exist
    if (!fs.existsSync(this.baseUploadPath)) {
      fs.mkdirSync(this.baseUploadPath, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'documents',
  ): Promise<UploadedFileResponse> {
    // 1. Validate MIME Types
    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        'MIME type not allowed. Supported formats: PDF, PNG, JPG, JPEG.',
      );
    }

    // 2. Prevent Path Traversal
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const ext = extname(sanitizedName);

    // 3. Generate Unique File Name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const uniqueFileName = `${uniqueSuffix}${ext}`;

    const destFolder = join(this.baseUploadPath, folder);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const destPath = join(destFolder, uniqueFileName);
    fs.writeFileSync(destPath, fileBuffer);

    const fileUrl = `/uploads/${folder}/${uniqueFileName}`;
    return {
      fileUrl,
      fileName: sanitizedName,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Validate path is indeed inside uploads to prevent arbitrary deletion (path traversal)
    if (!fileUrl.startsWith('/uploads/')) {
      throw new BadRequestException('Invalid file URL pattern');
    }

    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = join(this.baseUploadPath, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
