import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferController } from './offers.controller';
import { OfferService } from './offers.service';
import { Offer } from './offers.entity';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { OfferImagesService } from './offer-images.service';
import { S3Util } from 'src/aws/s3.util';

@Module({
  imports: [TypeOrmModule.forFeature([Offer])],
  controllers: [OfferController],
  providers: [OfferService, JwtServiceShared, OfferImagesService, S3Util],
})
export class OffersModule {}
