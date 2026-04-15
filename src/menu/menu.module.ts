// src/menu/menu.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { Menu } from './menu.entity';
import { MenuImagesService } from './menu-images.service';
import { S3Util } from 'src/aws/s3.util';

@Module({
  imports: [TypeOrmModule.forFeature([Menu])],
  controllers: [MenuController],
  providers: [MenuService, MenuImagesService, S3Util],
})
export class MenuModule {}
