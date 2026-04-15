import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { ImageUtils } from 'src/file/utils/image-utils';

export interface MenuImageUploadResponse {
  status: string;
  message: string;
  key: string;
  url: string;
}

@Injectable()
export class MenuImagesService {
  constructor(private readonly s3Util: S3Util) {}

  // ============================================================
  // SINGLE MENU IMAGE UPLOAD TO S3
  // ============================================================
  async uploadMenuImage(file: MulterFile): Promise<MenuImageUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate image (max 5MB for menu images)
    ImageUtils.validateImage(file, 5);

    const bucket = process.env.AWS_BUCKET_NAME!;
    const ext = file.originalname.split('.').pop();
    const imageName = `menu-${Date.now()}.${ext}`;
    const key = `images/menu/${imageName}`;

    const url = await this.s3Util.uploadFile(bucket, key, file);

    // ✅ LOG S3 UPLOAD SUCCESS
    console.log(`\n☁️  [S3 UPLOAD] Menu image uploaded successfully`);
    console.log(`   📁 Key: ${key}`);
    console.log(`   🔗 URL: ${url}\n`);

    return {
      status: 'success',
      message: 'Menu image uploaded successfully',
      key,
      url,
    };
  }

  // ============================================================
  // DELETE MENU IMAGE FROM S3
  // ============================================================
  async deleteMenuImage(key: string): Promise<{ status: string; message: string }> {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    const bucket = process.env.AWS_BUCKET_NAME!;
    await this.s3Util.deleteFile(bucket, key);

    // ✅ LOG S3 DELETE SUCCESS
    console.log(`\n🗑️  [S3 DELETE] Menu image deleted successfully`);
    console.log(`   📁 Key: ${key}\n`);

    return {
      status: 'success',
      message: 'Menu image deleted successfully',
    };
  }
}
