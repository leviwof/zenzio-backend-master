import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageUtils } from 'src/file/utils/image-utils';
// import { ResImageUtils } from './utils/rest-image-utils';
// import { FleetProfile } from './restaurant_rest.entity';

import { ResImageUploadResponse } from './interface/res-image-response.type';
import { ResImageUtils } from './utils/res-image-utils';
import { FleetProfile } from './entity/fleet_profile.entity';
// import { FleetProfile } from './entity/restaurant_profile.entity';

@Injectable()
export class FFileService {
  constructor(
    private readonly s3Util: S3Util,
    @InjectRepository(FleetProfile)
    private readonly restRepo: Repository<FleetProfile>,
  ) {}

  // ============================================================
  // MULTIPLE rest IMAGE UPLOAD WITH PREFIX
  // ============================================================
  async uploadMultiplerestResImages(
    files: MulterFile[],
    fleetUid: string,
  ): Promise<ResImageUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file
    files.forEach((file) => ImageUtils.validateImage(file, 1));

    const rest = await this.restRepo.findOne({ where: { fleetUid } });

    if (!rest) {
      throw new BadRequestException('Invalid rest UID');
    }

    const existingImages = rest.photo ?? [];
    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: ResImageUploadResponse[] = [];

    console.log('FILES:', files);
    console.log('fleetUid param:', fleetUid);

    for (const file of files) {
      // GAP-AWARE SUFFIX
      const suffix = ResImageUtils.getNextImageSuffix(existingImages);

      const ext = file.originalname.split('.').pop();
      const imageName = `${fleetUid}-${suffix}.${ext}`;
      const key = `images/fleets/${imageName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      console.log(`   ✅ Uploaded: ${imageName}`);
      console.log(`      🔗 URL: ${url}`);

      // STORE FULL URL IN DB
      existingImages.push(url);

      results.push({
        status: 'success',
        message: 'rest image uploaded with prefix',
        key: imageName,
        url,
      });
    }

    // SAVE ALL NEW IMAGES
    await this.restRepo.update({ fleetUid }, { photo: existingImages });

    return results;
  }
}
