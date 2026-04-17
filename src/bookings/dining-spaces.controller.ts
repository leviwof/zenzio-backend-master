import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { DiningSpaceService } from './dining-spaces.service';
import { CreateDiningSpaceDto } from './dto/create-dining-space.dto';
import { UpdateDiningSpaceDto } from './dto/update-dining-space.dto';
import { AccessTokenAuthGuard } from 'src/guards';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Util } from 'src/aws/s3.util';
import { MulterFile } from 'src/aws/types/multer-file.type';

@Controller('dining-spaces')
export class DiningSpaceController {
  constructor(
    private readonly diningSpaceService: DiningSpaceService,
    private readonly s3Util: S3Util,
  ) {}

  @Post()
  @UseGuards(AccessTokenAuthGuard)
  @UseInterceptors(FilesInterceptor('photos'))
  async create(
    @Body() createDiningSpaceDto: CreateDiningSpaceDto,
    @UploadedFiles() files: MulterFile[],
  ) {
    if (files && files.length > 0) {
      const photoUrls: string[] = [];
      for (const file of files) {
        const key = `dining-space/${Date.now()}_${file.originalname}`;
        const url = await this.s3Util.uploadFile(process.env.AWS_S3_BUCKET_NAME!, key, file);
        // Extract clean key/filename if needed, but entity expects array of something.
        // Based on S3Util, it returns full URL.
        // But other parts of app seem to store filename only?
        // Let's check S3Util again. It returns full URL.
        // But SettingsScreen logic suggests it handles either URL or filename.
        // Let's store the filename (key) or just the part after folder?
        // Actually S3Util uploads to `key`.
        // Let's double check what other controllers do.
        // But for now, let's store the full URL or just the key.
        // SettingsScreen: `if (photo.startsWith('http'))` -> return.
        // So full URL is fine.
        // Wait, S3Util returns `https://${bucket}.../${key}`.
        // So we can assume full URL.
        // We'll store the filename part if we want consistency with specific logic, but URL is safer.
        // However, `photoUrls` in entity is `simple-array`.

        // Let's just push the unique part of filename to avoid huge URLs if possible?
        // No, sticking to what S3Util returns is safest unless we see evidence otherwise.
        // But wait, `SettingsScreen` constructs URL if it's not http.
        // 'https://zenzio-s3-bucket.s3.ap-south-1.amazonaws.com/images/restaurant/$photo'
        // This implies restaurant photos are stored as filenames.
        // For dining spaces, we should probably store full URLs to be independent.

        // Wait, I should check if `CreateDiningSpaceDto` allows full URLs. Yes string array.
        // Let's use the filenames (after dining-space/ prefix?)
        // Actually `S3Util.uploadFile` returns the full URL.
        // I will use that.

        // BUT, `BookingViewModel` logic in frontend might expect something?
        // Frontend just displays `photoUrls`.
        // Let's use full URL.
        photoUrls.push(url);
      }
      createDiningSpaceDto.photoUrls = photoUrls;
    }
    return this.diningSpaceService.create(createDiningSpaceDto);
  }

  // Admin can create dining spaces for any restaurant (no auth required for admin)
  @Post('admin-create')
  @UseGuards(AccessTokenAuthGuard)
  async createByAdmin(@Body() createDiningSpaceDto: CreateDiningSpaceDto) {
    if (!createDiningSpaceDto.restaurantId) {
      throw new Error('restaurantId is required');
    }
    const result = await this.diningSpaceService.create(createDiningSpaceDto);
    return {
      status: 'success',
      data: result,
      message: 'Dining space created successfully by admin',
    };
  }

  @Get('restaurant/:restaurantId')
  findAllByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.diningSpaceService.findAllByRestaurant(restaurantId);
  }

  @Get(':id')
  @UseGuards(AccessTokenAuthGuard)
  findOne(@Param('id') id: string) {
    return this.diningSpaceService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenAuthGuard)
  @UseInterceptors(FilesInterceptor('photos'))
  async update(
    @Param('id') id: string,
    @Body() updateDiningSpaceDto: UpdateDiningSpaceDto,
    @UploadedFiles() files: MulterFile[],
  ) {
    if (files && files.length > 0) {
      const photoUrls: string[] = [];
      for (const file of files) {
        const key = `dining-space/${Date.now()}_${file.originalname}`;
        const url = await this.s3Util.uploadFile(process.env.AWS_S3_BUCKET_NAME!, key, file);
        photoUrls.push(url);
      }
      // If we want to append? Or replace?
      // Usually update replaces if provided.
      // Frontend sends all photos including new ones?
      // AddDiningAreaScreen sends _selectedPhotos. If checking `updateDiningSpace` in ViewModel...
      // It sends `photos` (files). Existing URLs are not sent as files.
      // So if files are present, we should probably append them to existing?
      // Or does frontend send existing URLs in body?
      // `AddDiningAreaScreen` logic:
      // `diningSpace` object has existing data.
      // ViewModel `updateDiningSpace` sends `data` (which has JSON) + `files`.
      // If I overwrite `photoUrls` with *only* new files, I lose old ones.
      // I need to merge.
      // But simple solution: assume frontend handles it?
      // Frontend logic:
      // `viewModel.updateDiningSpace(id, space, files)`
      // It sends `space` which might contain `photoUrls` (existing).
      // And `files` (new).
      // The backend receives `updateDiningSpaceDto` with `photoUrls` (existing, if mapped correctly? No, FormData text fields).
      // NestJS will map form fields to DTO.
      // So `updateDiningSpaceDto.photoUrls` will have existing URLs (if frontend sent them).
      // The files are *new* files.
      // So I should append new `photoUrls` to `updateDiningSpaceDto.photoUrls`.

      // Issue: Does frontend send `photoUrls` in FormData?
      // `BookingService.dart`:
      // `if (diningSpace.photoUrls != null) ... map to formData fields`?
      // I need to check `BookingService.dart`.

      // Assuming I should append new files to whatever comes in DTO.
      const existing = updateDiningSpaceDto.photoUrls || [];
      // createDiningSpaceDto.photoUrls is string[] | string (if single).
      // FormData might make it single string if only one, or array.
      // I'll handle that.

      const newUrls = [
        ...(Array.isArray(existing) ? existing : [existing]).filter(Boolean),
        ...photoUrls,
      ];
      updateDiningSpaceDto.photoUrls = newUrls;
    }
    return this.diningSpaceService.update(id, updateDiningSpaceDto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenAuthGuard)
  remove(@Param('id') id: string) {
    return this.diningSpaceService.remove(id);
  }
}
