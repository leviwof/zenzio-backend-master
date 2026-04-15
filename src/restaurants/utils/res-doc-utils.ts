import { BadRequestException } from '@nestjs/common';
import { MulterFile } from 'src/types/multer-file.type';

export class DocUtilsRes {
  static readonly allowedExtensions = ['pdf', 'docx', 'png', 'jpg', 'jpeg'];
  static readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];

  static validateDocument(file: MulterFile, maxSizeMB = 2) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!DocUtilsRes.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${DocUtilsRes.allowedExtensions.join(', ')}`,
      );
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !DocUtilsRes.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed: ${DocUtilsRes.allowedExtensions.join(', ')}`,
      );
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`File exceeds ${maxSizeMB} MB size limit`);
    }
  }
}
