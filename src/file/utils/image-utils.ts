import { BadRequestException } from '@nestjs/common';
import { MulterFile } from 'src/types/multer-file.type';

export class ImageUtils {
  static readonly allowedFormats = ['webp', 'jpg', 'png', 'jpeg'];

  
  static validateImage(file: MulterFile, maxSizeMB: number) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !ImageUtils.allowedFormats.includes(ext)) {
      throw new BadRequestException(
        `Invalid file format. Allowed formats: ${ImageUtils.allowedFormats.join(', ')}`,
      );
    }

    
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`File size exceeds limit of ${maxSizeMB} MB`);
    }
  }
}
