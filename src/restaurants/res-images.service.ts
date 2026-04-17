import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageUtils } from 'src/file/utils/image-utils';
// import { ResImageUtils } from './utils/rest-image-utils';
// import { RestaurantProfile } from './restaurant_rest.entity';

import { ResImageUploadResponse } from './interface/res-image-response.type';
import { ResImageUtils } from './utils/res-image-utils';
import { RestaurantProfile } from './entity/restaurant_profile.entity';

@Injectable()
export class RFileService {
  constructor(
    private readonly s3Util: S3Util,
    @InjectRepository(RestaurantProfile)
    private readonly restRepo: Repository<RestaurantProfile>,
  ) {}

  private buildRestaurantImageUrl(image: string): string {
    if (!image || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    const bucket = process.env.AWS_BUCKET_NAME!;
    const region = process.env.AWS_REGION!;
    return `https://${bucket}.s3.${region}.amazonaws.com/images/restaurant/${image}`;
  }

  // ============================================================
  // MULTIPLE rest IMAGE UPLOAD WITH PREFIX
  // ============================================================
  async uploadMultiplerestResImages(
    files: MulterFile[],
    restaurantUid: string,
  ): Promise<ResImageUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file
    files.forEach((file) => ImageUtils.validateImage(file, 1));

    const rest = await this.restRepo.findOne({ where: { restaurantUid } });

    if (!rest) {
      throw new BadRequestException('Invalid rest UID');
    }

    const existingImages = (rest.photo ?? []).map((image) => this.buildRestaurantImageUrl(image));
    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: ResImageUploadResponse[] = [];

    for (const file of files) {
      // GAP-AWARE SUFFIX
      const suffix = ResImageUtils.getNextImageSuffix(existingImages);

      const ext = file.originalname.split('.').pop();
      const imageName = `${restaurantUid}-${suffix}.${ext}`;
      const key = `images/restaurant/${imageName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      existingImages.push(url);

      results.push({
        status: 'success',
        message: 'rest image uploaded with prefix',
        key: imageName,
        url,
      });
    }

    rest.photo = existingImages;
    await this.restRepo.save(rest);

    return results;
  }
}
