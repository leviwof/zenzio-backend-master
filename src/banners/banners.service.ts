import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';
import { S3Util } from '../aws/s3.util';
import { MulterFile } from '../aws/types/multer-file.type';

@Injectable()
export class BannersService {
  private readonly s3Util = new S3Util();
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME || 'zenzio-s3-bucket';

  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async findAll() {
    return await this.bannerRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
      take: 3,
    });
  }

  async create(file: MulterFile) {
    const bannerCount = await this.bannerRepository.count({ where: { isActive: true } });
    if (bannerCount >= 3) {
      throw new BadRequestException('Maximum 3 active banners allowed');
    }

    const fileName = `banners/${Date.now()}-${file.originalname}`;
    const imageUrl = await this.s3Util.uploadFile(this.bucketName, fileName, file);

    const banner = this.bannerRepository.create({
      imageUrl,
      isActive: true,
      displayOrder: bannerCount + 1,
    });

    return await this.bannerRepository.save(banner);
  }

  async remove(id: number) {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner not found');
    }

    // Optional: Delete from S3
    // const key = banner.imageUrl.split('.com/')[1];
    // await this.s3Util.deleteFile(this.bucketName, key);

    return await this.bannerRepository.remove(banner);
  }
}
