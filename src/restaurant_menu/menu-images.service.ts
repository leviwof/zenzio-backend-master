import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageUtils } from 'src/file/utils/image-utils';
import { MenuImageUtils } from './utils/menu-image-utils';
import { RestaurantMenu } from './restaurant_menu.entity';
import { MenuImageUploadResponse } from './types/menu-image-response.type';

@Injectable()
export class MFileService {
  constructor(
    private readonly s3Util: S3Util,
    @InjectRepository(RestaurantMenu)
    private readonly menuRepo: Repository<RestaurantMenu>,
  ) { }

  
  
  
  async uploadMultipleMenuImages(
    files: MulterFile[],
    menu_uid: string,
  ): Promise<MenuImageUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    
    files.forEach((file) => ImageUtils.validateImage(file, 5));

    const menu = await this.menuRepo.findOne({ where: { menu_uid } });

    if (!menu) {
      throw new BadRequestException('Invalid menu UID');
    }

    const existingImages = menu.images ?? [];
    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: MenuImageUploadResponse[] = [];

    console.log(
      `\n☁️  [S3 UPLOAD] Starting upload of ${files.length} menu images for menu: ${menu_uid}`,
    );

    for (const file of files) {
      
      const suffix = MenuImageUtils.getNextImageSuffix(existingImages);

      const ext = file.originalname.split('.').pop();
      const imageName = `${menu_uid}-${suffix}.${ext}`;
      const key = `images/menu/${imageName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      console.log(`   ✅ Uploaded: ${imageName}`);
      console.log(`      🔗 URL: ${url}`);

      
      existingImages.push(url);

      results.push({
        status: 'success',
        message: 'Menu image uploaded with prefix',
        key: imageName,
        url,
      });
    }

    
    await this.menuRepo.update({ menu_uid }, { images: existingImages });

    console.log(`   📊 Total images now: ${existingImages.length}\n`);

    return results;
  }

  
  
  
  async uploadImagesForNewMenu(
    files: MulterFile[],
    prefix: string,
  ): Promise<MenuImageUploadResponse[]> {
    if (!files || files.length === 0) {
      return []; 
    }

    
    files.forEach((file) => ImageUtils.validateImage(file, 5));

    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: MenuImageUploadResponse[] = [];

    console.log(
      `\n☁️  [S3 UPLOAD] Starting upload of ${files.length} images for new menu with prefix: ${prefix}`,
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.originalname.split('.').pop();
      const imageName = `${prefix}-${i + 1}.${ext}`;
      const key = `images/menu/${imageName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      console.log(`   ✅ Uploaded: ${imageName}`);
      console.log(`      🔗 URL: ${url}`);

      results.push({
        status: 'success',
        message: 'Menu image uploaded for new menu',
        key: url, 
        url,
      });
    }

    console.log(`   📊 Total images uploaded: ${results.length}\n`);

    return results;
  }
}
