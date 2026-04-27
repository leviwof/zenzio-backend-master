import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  UseGuards,
  Req,
  Res,
  ParseIntPipe,
  Patch,

  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { RestaurantMenuService } from './restaurant_menu.service';
import { Restaurant_menuDto } from './dto/restaurant_menu.dto';

import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';
import { FilesInterceptor } from '@nestjs/platform-express';



import { MulterFile } from 'src/types/multer-file.type';
import { MFileService } from './menu-images.service';
import { MenuImageUploadResponse } from './types/menu-image-response.type';
import { RestaurantMenuUpdateDto } from './dto/restaurant_menu-update.dto';
import { RestaurantMenu } from './restaurant_menu.entity';
import { AuthRequest, RequestWithUser } from 'src/types/auth-request';
import { GetNearestMenusDto } from './dto/get-nearest-menus.dto';
import { GlobalSettingsService } from 'src/global-settings/global-settings.service';
import { calculateFinalPrice, getPlatformFeePercent } from 'src/utils/price.util';

export interface AuthUser {
  uid: string;
  role: string;
  [key: string]: any;
}

@ApiTags('Restaurant Menu')
@Controller('restaurant-menu')
export class Restaurant_menuController {
  constructor(
    private readonly restaurant_menuService: RestaurantMenuService,
    private readonly fileService: MFileService,
    private readonly globalSettingsService: GlobalSettingsService,
  ) { }


  @Post()
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new restaurant menu item' })
  @ApiResponse({ status: 201, description: 'Menu created successfully' })
  @ApiResponse({ status: 400, description: 'Validation or creation failed' })
  @ApiBody({ type: Restaurant_menuDto })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: Restaurant_menuDto, @Req() req: AuthRequest) {
    try {

      let restaurant_uid: string = req.user?.uid;

      if (!restaurant_uid) {
        if (data.restaurant_uid) {
          restaurant_uid = data.restaurant_uid;
        } else {
          throw new BadRequestException('Invalid restaurant user or missing restaurant_uid');
        }
      }


      const item = await this.restaurant_menuService.create({
        ...data,
        restaurant_uid,
      });

      return {
        status: 'success',
        code: 201,
        data: { restaurant_menu: item },
        message: 'Restaurant menu created successfully',
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unexpected error occurred while creating menu');
    }
  }


  @Post('admin-create')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Admin creates a menu item for any restaurant' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Menu created successfully by admin' })
  @ApiResponse({ status: 400, description: 'Validation or creation failed' })
  async createByAdmin(
    @Body() data: any,
    @UploadedFiles() files: MulterFile[],
  ) {
    try {
      const restaurant_uid = data.restaurant_uid;
      if (!restaurant_uid) {
        throw new BadRequestException('restaurant_uid is required');
      }

      if (!data.menu_name) {
        throw new BadRequestException('menu_name is required');
      }

      if (!data.price) {
        throw new BadRequestException('price is required');
      }


      let images: string[] = [];
      if (files && files.length > 0) {
        const uploadResults = await this.fileService.uploadImagesForNewMenu(files, `admin-menu-${Date.now()}`);
        images = uploadResults.map(r => r.url);
      }


      const menuData = {
        restaurant_uid: restaurant_uid,
        menu_name: data.menu_name,
        price: parseFloat(data.price) || 0,
        discount: data.discount ? parseInt(data.discount, 10) : 0,
        description: data.description || null,
        category: data.category || null,
        food_type: data.food_type || 'Veg',
        cuisine_type: data.cuisine_type || null,
        isActive: data.isActive === '1' || data.isActive === 'true' || data.isActive === true,
        status: data.isActive === '1' || data.isActive === 'true' || data.isActive === true,
        images: images.length > 0 ? images : undefined,
      };

      console.log('📌 Admin creating menu with data:', menuData);

      const item = await this.restaurant_menuService.create(menuData);

      return {
        status: 'success',
        code: 201,
        data: { restaurant_menu: item },
        message: 'Restaurant menu created successfully by admin',
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error: unknown) {
      console.error('❌ Admin menu creation error:', error);
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unexpected error occurred while creating menu');
    }
  }

  @Post('admin-bulk-upload')
@UseGuards(AccessTokenAuthGuard)
  @UseInterceptors(FilesInterceptor('file', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Admin bulk upload menu items from Excel/CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Menu items created successfully by admin' })
  @ApiResponse({ status: 400, description: 'Validation or creation failed' })
  async bulkUpload(
    @Body() data: any,
    @UploadedFiles() files: MulterFile[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Excel/CSV file is required');
      }

      const file = files[0];
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

      if (!fileExtension || !['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        throw new BadRequestException('Only Excel (.xlsx, .xls) or CSV files are allowed');
      }

      const restaurantUidFromBody = data?.restaurant_uid;

      if (!restaurantUidFromBody) {
        throw new BadRequestException('restaurant_uid is required');
      }

      let rows: any[] = [];

      if (fileExtension === 'csv') {
        const content = file.buffer.toString('utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
          throw new BadRequestException('File is empty');
        }
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
      } else {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      if (!rows || rows.length === 0) {
        throw new BadRequestException('File is empty or has no valid data');
      }

      const createdItems: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.menu_name) {
            errors.push(`Row ${i + 2}: menu_name is required`);
            continue;
          }
          if (!row.price) {
            errors.push(`Row ${i + 2}: price is required`);
            continue;
          }

          const menuData = {
            restaurant_uid: restaurantUidFromBody,
            menu_name: String(row.menu_name),
            price: parseFloat(String(row.price)) || 0,
            discount: row.discount ? parseInt(String(row.discount), 10) : 0,
            description: row.description || null,
            category: row.category || null,
            food_type: row.food_type || 'Veg',
            cuisine_type: row.cuisine_type || null,
            isActive: row.isActive === '1' || row.isActive === 'true' || row.isActive === true,
            status: row.isActive === '1' || row.isActive === 'true' || row.isActive === true,
          };

          const item = await this.restaurant_menuService.create(menuData);
          createdItems.push(item);
        } catch (rowError: any) {
          errors.push(`Row ${i + 2}: ${rowError.message || 'Failed to create item'}`);
        }
      }

      return {
        status: 'success',
        code: 201,
        data: {
          created: createdItems.length,
          failed: errors.length,
          items: createdItems,
          errors: errors.length > 0 ? errors : undefined,
        },
        message: errors.length > 0 ? 'Bulk upload failed' : 'Bulk uploaded successfully',
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error: unknown) {
      console.error('❌ Bulk upload error:', error);
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unexpected error occurred during bulk upload');
    }
  }


  @Get()
  @ApiOperation({ summary: 'Fetch all restaurant menu items with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'All menu items fetched successfully' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [items, total] = await this.restaurant_menuService.findAllWithPagination(+page, +limit);

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: RestaurantMenu) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }


  @Get('categories')
  @ApiOperation({ summary: 'Fetch unique categories from restaurant menus' })
  @ApiResponse({ status: 200, description: 'Categories fetched successfully' })
  async getCategories() {
    const categories = await this.restaurant_menuService.getUniqueCategories();

    return {
      status: 'success',
      code: 200,
      data: categories.map((name, index) => ({
        id: index + 1,
        name: name,
      })),
      meta: {
        timestamp: new Date().toISOString(),
        total: categories.length,
      },
    };
  }

  @Get('download-template')
  @ApiOperation({ summary: 'Download menu bulk upload template' })
  @ApiResponse({ status: 200, description: 'Template file downloaded' })
  async downloadTemplate(@Res() res: Response) {
    const template = `menu_name,price,discount,description,category,food_type,cuisine_type,isActive
Pizza,299,10,Pepperoni pizza with cheese,Main Course,Veg,Italian,true
Burger,199,5,Chicken burger with fries,Snacks,Non-Veg,American,true
Biryani,349,0,Hyderabadi biryani,Main Course,Non-Veg,Indian,true
Ice Cream,99,15,Chocolate ice cream,Desserts,Veg,Continental,true`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="menu_template.csv"');
    res.send(template);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for food items and restaurant names' })
  @ApiQuery({ name: 'query', required: false, example: 'pizza' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Suggestions fetched successfully' })
  async getSuggestions(
    @Query('query') query?: string,
    @Query('limit') limit = 10,
  ) {
    const data = await this.restaurant_menuService.getSearchSuggestions(query, Number(limit));

    return {
      status: 'success',
      code: 200,
      message: 'Search suggestions fetched successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
        total: data.suggestions.length,
        limit: Number(limit),
      },
    };
  }

  @Get(':restaurant_uid/categories')
  @ApiOperation({ summary: 'Fetch unique categories for a specific restaurant' })
  @ApiParam({ name: 'restaurant_uid', example: 'REST-123456', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Categories fetched successfully' })
  async getCategoriesByRestaurant(@Param('restaurant_uid') restaurant_uid: string) {
    const categories = await this.restaurant_menuService.getUniqueCategoriesByRestaurant(restaurant_uid);

    return {
      status: 'success',
      code: 200,
      data: categories.map((name, index) => ({
        id: index + 1,
        name: name,
      })),
      meta: {
        timestamp: new Date().toISOString(),
        total: categories.length,
      },
    };
  }



  @Get('/search')
  @ApiOperation({ summary: 'Fetch all restaurant menu items with filters & pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'pizza' })
  @ApiQuery({ name: 'category', required: false, example: 'Main Course' })
  @ApiQuery({ name: 'food_type', required: false, example: 'Veg | Non-Veg' })
  @ApiQuery({ name: 'cuisine_type', required: false, example: 'Italian' })
  @ApiResponse({ status: 200, description: 'Menu items fetched successfully' })
  async findAllWithSearch(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('food_type') food_type?: string,
    @Query('cuisine_type') cuisine_type?: string,
  ) {
    const result: [RestaurantMenu[], number] =
      await this.restaurant_menuService.findAllWithSearchPagination(Number(page), Number(limit), {
        search,
        category,
        food_type,
        cuisine_type,
      });

    const [items, total] = result;
    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: RestaurantMenu) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        filters: {
          search: search ?? null,
          category: category ?? null,
          food_type: food_type ?? null,
          cuisine_type: cuisine_type ?? null,
        },
      },
    };
  }

  @Get('nearest')
  async findNearestMenus(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '10',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const [items, total] = await this.restaurant_menuService.getMenusByNearestRestaurant(
      Number(lat),
      Number(lng),
      Number(radius),
      Number(page),
      Number(limit),
    );

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: any) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  @Post('nearest')
  @ApiOperation({ summary: 'Fetch nearest menu items with advanced filtering' })
  @ApiBody({ type: GetNearestMenusDto })
  @ApiResponse({ status: 200, description: 'Filtered menu items fetched successfully' })
  async findNearestMenusPost(@Body() dto: GetNearestMenusDto) {
    const { lat, lng, radius = 10, page = 1, limit = 10, search, categories, cuisine_types, food_types } = dto;

    const [items, total] = await this.restaurant_menuService.getMenusByNearestRestaurant(
      Number(lat),
      Number(lng),
      Number(radius),
      Number(page),
      Number(limit),
      {
        categories,
        cuisine_types,
        food_types,
        search,
      },
    );

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: any) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        filters: {
          search: search ?? null,
          categories: categories ?? null,
          cuisine_types: cuisine_types ?? null,
          food_types: food_types ?? null,
        },
      },
    };
  }


  @Get('me')
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @ApiOperation({ summary: 'Fetch menus for logged-in restaurant' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'My menu items fetched successfully' })
  async findMyMenus(@Req() req: AuthRequest, @Query('page') page = 1, @Query('limit') limit = 10) {
    const restaurant_uid = req.user?.uid;

    if (!restaurant_uid) {
      throw new BadRequestException('Invalid restaurant user');
    }


    const [items, total] = await this.restaurant_menuService.findMyMenus(
      restaurant_uid,
      +page,
      +limit,
      true,
    );

    console.log(`📊 [/restaurant-menu/me] Restaurant: ${restaurant_uid}`);
    console.log(`📊 [/restaurant-menu/me] Returning ${items.length} items out of ${total} total`);
    console.log(`📊 [/restaurant-menu/me] Menu names:`, items.map(i => i.menu_name));

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: RestaurantMenu) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }

  @Get('by-restaurant')
  @ApiOperation({ summary: 'Fetch menus by restaurant UID' })
  @ApiQuery({ name: 'restaurant_uid', required: true, example: 'RES123ABC' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'includeInactive', required: false, example: 'true', description: 'Include inactive menus (for admin)' })
  @ApiResponse({ status: 200, description: 'Menus fetched successfully' })
  async findMenusByRestaurant(
    @Query('restaurant_uid') restaurant_uid: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (!restaurant_uid) {
      throw new BadRequestException('restaurant_uid is required');
    }


    const showInactive = includeInactive === 'true' || includeInactive === '1';

    const [items, total] = await this.restaurant_menuService.findMyMenus(
      restaurant_uid,
      +page,
      +limit,
      showInactive,
    );

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: RestaurantMenu) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }




  @Get('by-restaurant-category')
  @ApiOperation({ summary: 'Fetch menus by restaurant UID' })
  @ApiQuery({ name: 'restaurant_uid', required: true, example: 'RES123ABC' })
  @ApiQuery({ name: 'category', required: true, example: 'Main Course' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Menus fetched successfully' })
  async findMenusByRestaurantAndCategory(
    @Query('restaurant_uid') restaurant_uid: string,
    @Query('category') category: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (!restaurant_uid) {
      throw new BadRequestException('restaurant_uid is required');
    }

    const [items, total] = await this.restaurant_menuService.findMenusByRestaurantAndCategory(
      restaurant_uid,
      category,
      +page,
      +limit,
    );

    const platformFeePercent = await getPlatformFeePercent(this.globalSettingsService);

    const itemsWithPrices = items.map((item: RestaurantMenu) => {
      const priceData = calculateFinalPrice({
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : 0,
        platformFeePercent,
      });
      return {
        ...item,
        basePrice: priceData.basePrice,
        finalPrice: priceData.finalPrice,
      };
    });

    return {
      status: 'success',
      code: 200,
      data: { restaurant_menus: itemsWithPrices },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }





















  @Get(':menu_uid')
  @ApiOperation({ summary: 'Fetch a single restaurant menu item by UID' })
  @ApiParam({
    name: 'menu_uid',
    example: 'MENU-AB12CD3',
    description: 'Restaurant menu UID',
  })
  @ApiResponse({ status: 200, description: 'Menu item fetched successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findOneByUid(@Param('menu_uid') menu_uid: string) {
    const item = await this.restaurant_menuService.findOneByUid(menu_uid);

    return item
      ? {
        status: 'success',
        code: 200,
        data: { restaurant_menu: item },
        message: 'Restaurant menu fetched successfully',
        meta: { timestamp: new Date().toISOString() },
      }
      : {
        status: 'error',
        code: 404,
        message: 'Restaurant menu not found',
        meta: { timestamp: new Date().toISOString() },
      };
  }


  @Put(':id')
  @ApiOperation({ summary: 'Update an existing restaurant menu item' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: RestaurantMenuUpdateDto) {
    try {
      const item = await this.restaurant_menuService.update(+id, data);
      return item
        ? {
          status: 'success',
          code: 200,
          data: { restaurant_menu: item },
          message: 'Restaurant menu updated successfully',
        }
        : {
          status: 'error',
          code: 404,
          message: 'Restaurant menu not found',
        };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unexpected error occurred');
    }
  }

























  @Delete(':menu_uid')
  @ApiOperation({ summary: 'Hard delete a restaurant menu item by UID' })
  @ApiParam({
    name: 'menu_uid',
    example: 'MNU-ABC1234',
    description: 'Restaurant menu UID',
  })
  @ApiResponse({ status: 200, description: 'Menu deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async removeByUid(@Param('menu_uid') menu_uid: string) {
    const isDeleted: boolean = await this.restaurant_menuService.removeByUid(menu_uid);

    if (!isDeleted) {
      return {
        status: 'error',
        code: 404,
        message: 'Restaurant menu not found',
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant menu deleted successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }


  @Patch(':menu_uid')
  @ApiOperation({ summary: 'Update a restaurant menu item by UID' })
  @ApiParam({
    name: 'menu_uid',
    example: 'MNU-ABC1234',
    description: 'Restaurant menu UID',
  })
  @ApiResponse({ status: 200, description: 'Menu updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async updateByUid(
    @Param('menu_uid') menu_uid: string,
    @Body() updateMenuDto: RestaurantMenuUpdateDto,
  ) {
    const updated: boolean = await this.restaurant_menuService.updateByUid(menu_uid, updateMenuDto);

    if (!updated) {
      return {
        status: 'error',
        code: 404,
        message: 'Restaurant menu not found',
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant menu updated successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }


  @Delete(':id/soft')
  @ApiOperation({ summary: 'Soft delete a restaurant menu item by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Restaurant menu ID' })
  @ApiResponse({ status: 200, description: 'Menu soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async softDelete(@Param('id') id: string) {
    const softDeleted = await this.restaurant_menuService.softDelete(+id);
    return softDeleted
      ? {
        status: 'success',
        code: 200,
        message: 'Restaurant menu soft deleted successfully',
        meta: { timestamp: new Date().toISOString() },
      }
      : {
        status: 'error',
        code: 404,
        message: 'Restaurant menu not found',
        meta: { timestamp: new Date().toISOString() },
      };
  }




  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a menu item' })
  @ApiResponse({
    status: 200,
    description: 'Menu activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu not found',
  })
  async activate(@Param('id', ParseIntPipe) id: number) {
    const success = await this.restaurant_menuService.activateMenu(id);

    return {
      status: success ? 'success' : 'failed',
      code: success ? 200 : 404,
      message: success ? 'Menu activated successfully' : 'Menu not found',
    };
  }




  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a menu item' })
  @ApiResponse({
    status: 200,
    description: 'Menu deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu not found',
  })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const success = await this.restaurant_menuService.deactivateMenu(id);

    return {
      status: success ? 'success' : 'failed',
      code: success ? 200 : 404,
      message: success ? 'Menu deactivated successfully' : 'Menu not found',
    };
  }





  @Patch(':uid/toggle')
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async toggle(@Req() req: AuthRequest, @Param('uid') menuUid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const restaurantUid = req.user.uid;

    const result = await this.restaurant_menuService.toggleMenuStatus(restaurantUid, menuUid);


    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'Menu not found',
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }


    if (result === false) {
      return {
        status: 'failed',
        code: 403,
        message: 'Invalid restaurant to update menu',
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }

    const isActiveNum = Number(result);

    return {
      status: 'success',
      code: 200,
      message: `Menu status changed to ${isActiveNum === 1 ? 'Active' : 'Inactive'}`,
      data: {
        uid: menuUid,
        isActive: isActiveNum,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':menuUid/status/admin')
  @ApiOperation({ summary: 'Admin toggles menu active/inactive status' })
  @ApiResponse({ status: 200, description: 'Menu status updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async menuStatusByAdmin(
    @Param('menuUid') menuUid: string,
    @Body() body: { status?: number; isActive?: number },
  ) {
    console.log('📌 Admin toggling menu status:', { menuUid, body });

    const result = await this.restaurant_menuService.menuStatusByAdmin('admin', menuUid, body);

    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'Menu not found',
        data: null,
        meta: { timestamp: new Date().toISOString() },
      };
    }




    const statusMessage =
      result.status === 1 ? 'Menu activated by admin' : 'Menu deactivated by admin';

    const listMessage =
      result.isActive === 1 ? 'Menu available in list' : 'Menu not available in list';

    return {
      status: 'success',
      code: 200,
      message: statusMessage,
      data: {
        uid: menuUid,
        status: result.status,
        isActive: result.isActive,
        listMessage,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }


































  @Patch('admin-edit/:menu_uid')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin edit menu item with optional image upload' })
  @ApiResponse({ status: 200, description: 'Menu updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  @UseInterceptors(FilesInterceptor('files'))
  async adminEditMenu(
    @Param('menu_uid') menu_uid: string,
    @Body() data: any,
    @UploadedFiles() files: MulterFile[],
  ) {
    try {
      const existingMenu = await this.restaurant_menuService.findOneByUid(menu_uid);
      if (!existingMenu) {
        return {
          status: 'error',
          code: 404,
          message: 'Menu not found',
          meta: { timestamp: new Date().toISOString() },
        };
      }

      let images: string[] = existingMenu.images && existingMenu.images.length > 0 ? existingMenu.images : [];
      if (files && files.length > 0) {
        const uploadResults = await this.fileService.uploadImagesForNewMenu(files, `admin-menu-${menu_uid}`);
        images = uploadResults.map(r => r.url);
      }

      const menuData: any = {};
      if (data.restaurant_uid !== undefined) menuData.restaurant_uid = data.restaurant_uid;
      if (data.menu_name !== undefined) menuData.menu_name = data.menu_name;
      if (data.price !== undefined) menuData.price = parseFloat(data.price) || 0;
      if (data.discount !== undefined) menuData.discount = data.discount ? parseInt(data.discount, 10) : 0;
      if (data.description !== undefined) menuData.description = data.description || null;
      if (data.category !== undefined) menuData.category = data.category || null;
      if (data.food_type !== undefined) menuData.food_type = data.food_type || 'Veg';
      if (data.cuisine_type !== undefined) menuData.cuisine_type = data.cuisine_type || null;
      if (data.isActive !== undefined) {
        menuData.isActive = data.isActive === '1' || data.isActive === 'true' || data.isActive === true;
        menuData.status = menuData.isActive;
      }
      if (images.length > 0) {
        menuData.images = images;
      }

      console.log('📌 Admin editing menu with data:', menuData);

      const updated = await this.restaurant_menuService.updateByUid(menu_uid, menuData);

      if (!updated) {
        return {
          status: 'error',
          code: 404,
          message: 'Menu not found or update failed',
          meta: { timestamp: new Date().toISOString() },
        };
      }

      const updatedMenu = await this.restaurant_menuService.findOneByUid(menu_uid);

      return {
        status: 'success',
        code: 200,
        data: { restaurant_menu: updatedMenu },
        message: 'Menu updated successfully by admin',
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error: unknown) {
      console.error('❌ Admin menu edit error:', error);
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unexpected error occurred while updating menu');
    }
  }

  @Post('upload-image/:menu_uid')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMenuImagePrefix(
    @UploadedFiles() files: MulterFile[],
    @Param('menu_uid') menu_uid: string,
  ): Promise<MenuImageUploadResponse[]> {
    return this.fileService.uploadMultipleMenuImages(files, menu_uid);
  }
}
