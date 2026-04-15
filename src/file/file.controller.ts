import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MulterFile } from 'src/types/multer-file.type';

@ApiTags('File Upload')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // ------------ MENU IMAGE UPLOAD -------------------
  @Post('menu-upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMenuImage(@UploadedFile() file: MulterFile) {
    return this.fileService.uploadMenuImage(file);
  }

  // ------------ NORMAL IMAGE UPLOAD -------------------
  @Post('upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: MulterFile) {
    return this.fileService.uploadImage(file);
  }

  @Post('upload-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: MulterFile) {
    return await this.fileService.uploadDocument(file);
  }

  // ------------ VIEW FILE -------------------
  @Get('view/:key')
  async viewImage(@Param('key') key: string) {
    return this.fileService.getFileUrl(key);
  }

  // ------------ DELETE FILE -------------------
  @Delete('delete/:key')
  async deleteImage(@Param('key') key: string) {
    return this.fileService.deleteFile(key);
  }
}
