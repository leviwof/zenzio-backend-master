import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { MulterFile } from '../aws/types/multer-file.type';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async getBanners() {
    return await this.bannersService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadBanner(@UploadedFile() file: MulterFile) {
    return await this.bannersService.create(file);
  }

  @Delete(':id')
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return await this.bannersService.remove(id);
  }
}
