import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const pdfFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf)$/)) {
    return callback(
      new BadRequestException('Only PDF files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

export const pdfStorage = diskStorage({
  destination: './uploads/company-policies',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `policy-${uniqueSuffix}${ext}`);
  },
});

export const pdfUploadOptions = {
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
};
