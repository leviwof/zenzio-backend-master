import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageUtils } from 'src/file/utils/image-utils';
import { ResImageUtils } from './utils/res-image-utils';
import { UserProfile } from './user_profile.entity';
import { ResImageUploadResponse } from 'src/restaurants/interface/res-image-response.type';

@Injectable()
export class UFileService {
  constructor(
    private readonly s3Util: S3Util,

    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
  ) {}

  // ============================================================
  // MULTIPLE USER PROFILE IMAGES UPLOAD WITH PREFIX
  // ============================================================
  async uploadMultiplerestResImages(
    files: MulterFile[],
    userUid: string,
  ): Promise<ResImageUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate files
    files.forEach((file) => ImageUtils.validateImage(file, 1));

    // FIND USER PROFILE BY RELATED USER UID
    const profile = await this.userRepo.findOne({
      where: { user: { uid: userUid } },
      relations: ['user'],
    });

    if (!profile) {
      throw new BadRequestException('Invalid user UID');
    }

    const existingImages = profile.photo ?? [];
    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: ResImageUploadResponse[] = [];

    console.log('FILES:', files);
    console.log('userUid:', userUid);

    for (const file of files) {
      const suffix = ResImageUtils.getNextImageSuffix(existingImages);

      const ext = file.originalname.split('.').pop();
      const imageName = `${userUid}-${suffix}.${ext}`;
      const key = `images/users/${imageName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      console.log(`   ✅ Uploaded: ${imageName}`);
      console.log(`      🔗 URL: ${url}`);

      // STORE FULL URL IN DB
      existingImages.push(url);

      results.push({
        status: 'success',
        message: 'User image uploaded successfully',
        key: imageName,
        url,
      });
    }

    // ✔ CORRECT UPDATE USING RELATION
    // await this.userRepo.update(
    //   { user: { uid: userUid } }, // WHERE
    //   { photo: existingImages }, // UPDATE
    // );

    // FIX: SAVE profile instead of update()
    profile.photo = existingImages;
    await this.userRepo.save(profile);
    return results;
  }
}
