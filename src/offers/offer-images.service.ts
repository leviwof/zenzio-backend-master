import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { ImageUtils } from 'src/file/utils/image-utils';

export interface OfferImageUploadResponse {
  status: string;
  message: string;
  key: string;
  url: string;
}

@Injectable()
export class OfferImagesService {
  constructor(private readonly s3Util: S3Util) {}

  // ============================================================
  // SINGLE OFFER IMAGE UPLOAD TO S3
  // ============================================================
  async uploadOfferImage(file: MulterFile): Promise<OfferImageUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate image (max 2MB)
    ImageUtils.validateImage(file, 2);

    const bucket = process.env.AWS_BUCKET_NAME!;
    const ext = file.originalname.split('.').pop();
    const imageName = `offer-${Date.now()}.${ext}`;
    const key = `images/offers/${imageName}`;

    const url = await this.s3Util.uploadFile(bucket, key, file);

    // ✅ LOG S3 UPLOAD SUCCESS
    console.log(`\n☁️  [S3 UPLOAD] Offer image uploaded successfully`);
    console.log(`   📁 Key: ${key}`);
    console.log(`   🔗 URL: ${url}\n`);

    return {
      status: 'success',
      message: 'Offer image uploaded successfully',
      key,
      url,
    };
  }

  // ============================================================
  // DELETE OFFER IMAGE FROM S3
  // ============================================================
  async deleteOfferImage(key: string): Promise<{ status: string; message: string }> {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    const bucket = process.env.AWS_BUCKET_NAME!;
    await this.s3Util.deleteFile(bucket, key);

    // ✅ LOG S3 DELETE SUCCESS
    console.log(`\n🗑️  [S3 DELETE] Offer image deleted successfully`);
    console.log(`   📁 Key: ${key}\n`);

    return {
      status: 'success',
      message: 'Offer image deleted successfully',
    };
  }
}
