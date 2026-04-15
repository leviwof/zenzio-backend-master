import { Injectable } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { ImageUtils } from './utils/image-utils';
import { DocUtils } from './utils/doc-utils';

@Injectable()
export class FileService {
  constructor(private readonly s3Util: S3Util) {}

  // ============================================================
  // NORMAL IMAGE UPLOAD (2 MB limit)
  // ============================================================
  async uploadImage(file: MulterFile) {
    ImageUtils.validateImage(file, 2); // <── 2MB max

    const bucket = process.env.AWS_BUCKET_NAME!;
    const key = `images/${Date.now()}-${file.originalname}`;

    const url = await this.s3Util.uploadFile(bucket, key, file);

    // ✅ LOG S3 UPLOAD SUCCESS
    console.log(`\n☁️  [S3 UPLOAD] Image uploaded successfully`);
    console.log(`   📁 Key: ${key}`);
    console.log(`   🔗 URL: ${url}\n`);

    return {
      status: 'success',
      message: 'Image uploaded successfully',
      url,
      key,
    };
  }

  // ============================================================
  // MENU IMAGE UPLOAD (1 MB limit)
  // ============================================================
  async uploadMenuImage(file: MulterFile) {
    ImageUtils.validateImage(file, 1); // <── 1MB max

    const bucket = process.env.AWS_BUCKET_NAME!;
    const key = `images/menu/${Date.now()}-${file.originalname}`;

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

  async uploadDocument(file: MulterFile) {
    DocUtils.validateDocument(file, 2); // 2MB max

    const bucket = process.env.AWS_BUCKET_NAME!;
    const key = `documents/${Date.now()}-${file.originalname}`;

    const url = await this.s3Util.uploadFile(bucket, key, file);

    // ✅ LOG S3 UPLOAD SUCCESS
    console.log(`\n☁️  [S3 UPLOAD] Document uploaded successfully`);
    console.log(`   📁 Key: ${key}`);
    console.log(`   🔗 URL: ${url}\n`);

    return {
      status: 'success',
      message: 'Document uploaded successfully',
      key,
      url,
    };
  }

  // ============================================================
  // GET FILE URL
  // ============================================================
  async getFileUrl(key: string) {
    const bucket = process.env.AWS_BUCKET_NAME!;
    const url = await this.s3Util.getFileUrl(bucket, key);

    return {
      status: 'success',
      fileUrl: url,
    };
  }

  // ============================================================
  // DELETE FILE
  // ============================================================
  async deleteFile(key: string) {
    const bucket = process.env.AWS_BUCKET_NAME!;
    await this.s3Util.deleteFile(bucket, key);

    // ✅ LOG S3 DELETE SUCCESS
    console.log(`\n🗑️  [S3 DELETE] File deleted successfully`);
    console.log(`   📁 Key: ${key}\n`);

    return {
      status: 'success',
      message: 'File deleted successfully',
    };
  }
}
