// src/menu/menu.controller.ts
import {
  Controller,
  Post,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuService } from './menu.service';
import { MenuImagesService } from './menu-images.service';
import { Menu } from './menu.entity';
import { MulterFile } from 'src/types/multer-file.type';
import { UpdateMenuStatusDto, BulkUpdateStatusDto, BulkDeleteDto } from './dto/menu-status.dto';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly menuImagesService: MenuImagesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createMenu(@UploadedFile() image: MulterFile, @Body() body: CreateMenuDto) {
    let customizationOptions = (body as any).customizationOptions;
    if (customizationOptions && typeof customizationOptions === 'string') {
      try {
        customizationOptions = JSON.parse(customizationOptions);
      } catch {
        throw new BadRequestException('customizationOptions must be valid JSON');
      }
    }

    let imageUrl: string | undefined;
    if (image) {
      const uploadResult = await this.menuImagesService.uploadMenuImage(image);
      imageUrl = uploadResult.url;
    }

    const payload: Partial<Menu> = {
      ...body,
      customizationOptions: customizationOptions || [],
      imageUrl,
      isActive: true,
    };

    const created = await this.menuService.create(payload);

    return {
      message: 'Menu added successfully',
      data: created,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true }))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateMenu(
    @Param('id') id: string,
    @UploadedFile() image: MulterFile,
    @Body() body: Partial<CreateMenuDto>,
  ) {
    let customizationOptions = (body as any)?.customizationOptions;
    if (customizationOptions && typeof customizationOptions === 'string') {
      try {
        customizationOptions = JSON.parse(customizationOptions);
      } catch {
        throw new BadRequestException('customizationOptions must be valid JSON');
      }
    }

    let imageUrl: string | undefined;
    if (image) {
      const uploadResult = await this.menuImagesService.uploadMenuImage(image);
      imageUrl = uploadResult.url;
    }

    const payload: Partial<Menu> = {
      ...(body as any),
      ...(customizationOptions ? { customizationOptions } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    };

    const updated = await this.menuService.update(id, payload);
    if (!updated) throw new NotFoundException('Menu item not found');

    return {
      message: 'Menu updated successfully',
      data: updated,
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateMenuStatusDto) {
    const updated = await this.menuService.updateStatus(id, dto);
    return {
      message: 'Menu status updated successfully',
      data: updated,
    };
  }

  @Patch('bulk-status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto) {
    const result = await this.menuService.bulkUpdateStatus(dto);
    return {
      message: 'Menu status updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMenu(@Param('id') id: string) {
    await this.menuService.remove(id);
    return {
      message: 'Menu deleted successfully',
    };
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkDelete(@Body() dto: BulkDeleteDto) {
    const result = await this.menuService.bulkDelete(dto);
    return {
      message: 'Menus deleted successfully',
      data: result,
    };
  }

  @Get()
  async list() {
    return this.menuService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }
}