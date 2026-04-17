import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Query,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Put,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { GetNearestRestaurantsDto } from './dto/get-nearest-restaurants.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';

import { RestaurantsService } from './restaurants.service';
import { RegisterRestaurantDto } from './dto/registerRestaurnat.dto';
import { RestaurantLoginEmailDto, RestaurantLoginOtpDto } from './dto/login.dto';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { CreateRestaurantDto } from './dto/createRestaurant.dto';

import { ResImageUploadResponse } from './interface/res-image-response.type';
import { RFileService } from './res-images.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterFile } from 'src/types/multer-file.type';
import { DocumentUploadService } from './document-upload.service';
import { UpdateRestaurantProfileDto } from './dto/restaurant-profile.dto';
import { UpdateOperationalHoursDto } from './dto/operational-hour.dto';
import { UpdateRestaurantAddressDto } from './dto/update-restaurant-address.dto';
import { UpdateBankDetailsDto } from './dto/update-bank-details.dto';
import { ChangePasswordDto, ResetPasswordDto } from './dto/change-password.dto';
import { UpdateRestaurantDocumentDto } from './dto/update-restaurant-document.dto';
import { AuthRequest, RequestWithUser } from 'src/types/auth-request';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurantService: RestaurantsService,
    private readonly fileService: RFileService,
    private readonly documentService: DocumentUploadService,
    private readonly profileService: RestaurantsService,
  ) { }

  
  
  
  @UseGuards(FirebaseAuthGuard)
  @Get('firebase-profile')
  @ApiOperation({ summary: 'Get Firebase authenticated user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  getFirebaseProfile(@Req() req: Request) {
    const user = req['user'] as {
      uid: string;
      email: string;
      name?: string;
      picture?: string;
    };

    return {
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }

  
  
  
  @UseGuards(AccessTokenAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get logged-in restaurant profile' })
  @ApiBearerAuth()
  async getRestaurantProfile(@Req() req: AuthRequest) {
    const uid = req.user?.uid;
    if (!uid) {
      throw new BadRequestException('Invalid user');
    }

    const restaurant = await this.restaurantService.getMyProfile(uid);

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant profile fetched successfully',
      data: restaurant,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  
  
  
  @Post()
  @ApiOperation({ summary: 'Create restaurant' })
  @ApiResponse({ status: 201, description: 'Restaurant created' })
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Put('address')
  @ApiOperation({ summary: 'Update restaurant address' })
  @ApiBearerAuth()
  updateAddress(@Req() req: AuthRequest, @Body() dto: UpdateRestaurantAddressDto) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    return this.restaurantService.updateAddress(req.user.uid, dto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Put('bank')
  @ApiOperation({ summary: 'Update restaurant bank details' })
  @ApiBearerAuth()
  updateBankDetails(@Req() req: AuthRequest, @Body() dto: UpdateBankDetailsDto) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.restaurantService.updateBankDetails(req.user.uid, dto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Put('change-password')
  @ApiOperation({ summary: 'Change restaurant password' })
  @ApiBearerAuth()
  async changePassword(@Req() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.restaurantService.changePassword(req.user.uid, dto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Put('reset-password')
  @ApiOperation({ summary: 'Reset restaurant password (no current password required)' })
  @ApiBearerAuth()
  async resetPassword(@Req() req: AuthRequest, @Body() dto: ResetPasswordDto) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.restaurantService.resetPassword(req.user.uid, dto);
  }

  
  
  
  @Post('auth/signup/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Restaurant signup with email' })
  @ApiResponse({ status: 201, description: 'Signup successful' })
  signupWithEmail(@Body() registerUserDto: RegisterRestaurantDto) {
    return this.restaurantService.signupWithEmail(registerUserDto);
  }

  
  
  
  @Post('auth/login/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Restaurant login with email' })
  @ApiResponse({ status: 200, description: 'Login success' })
  loginWithEmail(@Body() loginDto: RestaurantLoginEmailDto) {
    return this.restaurantService.loginWithEmail(loginDto);
  }

  @Post('auth/login/otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Restaurant login with email' })
  @ApiResponse({ status: 200, description: 'Login success' })
  loginWithOtp(@Body() loginDto: RestaurantLoginOtpDto) {
    return this.restaurantService.loginwithOtp(loginDto);
  }

  @Post('auth/resend-verification-email')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerificationEmail(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.restaurantService.resendVerificationEmail(email);
  }

  
  
  
  @Post('refresh-auth')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiQuery({ name: 'refreshToken', required: true })
  refreshAuth(@Query('refreshToken') refreshToken: string) {
    return this.restaurantService.refreshAuthToken(refreshToken);
  }

  
  
  
  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiResponse({ status: 200, description: 'Restaurants loaded' })
  async findAll() {
    return this.restaurantService.findAll();
  }

  
  @Get('nearest')
  async getNearestRestaurants(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '10',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('filter') filter = 'all',
    @Query('sort') sort?: string,
    @Query('order') order = 'asc',
  ) {
    const [items, total] = await this.restaurantService.getNearestActiveRestaurants(
      Number(lat),
      Number(lng),
      Number(radius),
      Number(page),
      Number(limit),
      filter,
      sort,
      order,
    );

    return {
      status: 'success',
      code: 200,
      data: { restaurants: items }, 
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
  @ApiOperation({ summary: 'Get nearest active restaurants (POST)' })
  @ApiResponse({ status: 200, description: 'Nearest restaurants loaded' })
  async findNearestRestaurants(@Body() dto: GetNearestRestaurantsDto) {
    const { lat, lng, radius, page, limit,search, filter, sort, order } = dto;
    const [items, total] = await this.restaurantService.getNearestActiveRestaurants(
      lat,
      lng,
      radius,
      page,
      limit,
      search,
      filter,
      sort,
      order,
    );

    return {
      status: 'success',
      code: 200,
      data: { restaurants: items },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  @Patch(':id/toggle-active')
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  
  async toggleRestaurantActive(@Param('id') id: string, @Req() req: AuthRequest) {
    if (!id) {
      throw new BadRequestException('Invalid user');
    }
    const restaurantUid = id;
    return this.restaurantService.toggleRestaurantActive(restaurantUid);
  }

  
  
  
  /**
   * 🔄 TOGGLE RESTAURANT STATUS (ADMIN)
   */
  @Patch(':uid/status/admin')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  statusRestaurantByAdmin(
    @Req() req: RequestWithUser,
    @Param('uid') restaurant_uid: string,
    @Body() body: { status?: boolean; isActive?: boolean },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    if (!req.user.uid) {
      throw new BadRequestException('Invalid admin user');
    }

    const admin_uid = req.user.uid;

    return this.restaurantService.statusRestaurantByAdmin(admin_uid, restaurant_uid, body);
  }

  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  

  
  @Get(':uid')
  @ApiOperation({ summary: 'Get restaurant by UID with profile' })
  @ApiParam({ name: 'uid', example: 'RES-123ABC', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Restaurant found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOneByUid(@Param('uid') uid: string) {
    const restaurant = await this.restaurantService.findByUidPublic(uid);

    return {
      status: 'success',
      code: 200,
      data: { restaurant },
      message: 'Restaurant fetched successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get(':uid/admin')
  @ApiOperation({ summary: 'Get restaurant by UID with profile' })
  @ApiParam({ name: 'uid', example: 'RES-123ABC', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Restaurant found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOneByUidForAdmin(@Param('uid') uid: string) {
    const restaurant = await this.restaurantService.findByUidForAdmin(uid);

    return {
      status: 'success',
      code: 200,
      data: { restaurant },
      message: 'Restaurant fetched successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Put(':uid/admin/address')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update restaurant address (Admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'uid', example: 'RES-123ABC', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateAddressByAdmin(
    @Param('uid') uid: string,
    @Body() dto: UpdateRestaurantAddressDto,
  ) {
    const address = await this.restaurantService.updateAddress(uid, dto);
    return {
      status: 'success',
      code: 200,
      data: address,
      message: 'Address updated successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Put(':uid/admin/profile')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update restaurant profile (Admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'uid', example: 'RES-123ABC', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateProfileByAdmin(
    @Param('uid') uid: string,
    @Body() dto: UpdateRestaurantProfileDto,
  ) {
    const profile = await this.restaurantService.updateProfile(uid, dto);
    return {
      status: 'success',
      code: 200,
      data: profile,
      message: 'Profile updated successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Put(':uid/admin/documents')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update restaurant documents (Admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'uid', example: 'RES-123ABC', description: 'Restaurant UID' })
  @ApiResponse({ status: 200, description: 'Documents updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateDocumentsByAdmin(
    @Param('uid') uid: string,
    @Body() dto: UpdateRestaurantDocumentDto,
  ) {
    const documents = await this.restaurantService.updateDocumentsByUid(uid, dto);
    return {
      status: 'success',
      code: 200,
      data: documents,
      message: 'Documents updated successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  
  
  
  
  
  
  
  
  

  
  
  
  @Delete('me/account')
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete logged-in restaurant account' })
  async deleteMyAccount(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.restaurantService.permanentlyDeleteRestaurant(req.user.uid);
  }

  @Delete(':uid/admin/permanent')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Permanently delete restaurant (Admin Only)' })
  async permanentlyDeleteRestaurant(@Param('uid') uid: string) {
    return this.restaurantService.permanentlyDeleteRestaurant(uid);
  }

  
  
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  
  
  
  
  

  
  
  
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateRestaurantProfileDto) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const restaurantUid = req.user.uid;
    return this.profileService.updateProfile(restaurantUid, dto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth()
  @Put('operational-hours')
  @ApiOperation({ summary: 'Update operational hours for logged-in restaurant' })
  updateOperationalHours(@Req() req: AuthRequest, @Body() body: UpdateOperationalHoursDto) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    return this.restaurantService.updateOperationalHours(req.user.uid, body.operationalHours);
  }

  @Post('upload-image/:restaurantUid')
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
  @UseInterceptors(FilesInterceptor('file')) 
  async uploadMenuImagePrefix(
    @UploadedFiles() files: MulterFile[],
    @Param('restaurantUid') restaurantUid: string,
  ): Promise<ResImageUploadResponse[]> {
    return await this.fileService.uploadMultiplerestResImages(files, restaurantUid);
  }

  @Patch('toggle-dining')
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle dining enabled status' })
  async toggleDining(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.restaurantService.toggleDiningStatus(req.user.uid);
  }

  @Post('upload-documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        restaurantUid: { type: 'string' },
        docType: {
          type: 'string',
          enum: ['fssai', 'gst', 'trade', 'other'],
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadDocuments(
    @UploadedFiles() files: MulterFile[],
    @Body('restaurantUid') restaurantUid: string,
    @Body('docType') docType: 'fssai' | 'gst' | 'trade' | 'other',
  ) {
    return await this.documentService.uploadMultipleDocuments(files, restaurantUid, docType);
  }

  @Get(':uid/admin-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  async getAdminStats(
    @Param('uid') uid: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const stats = await this.restaurantService.getAdminStats(uid, startDate, endDate);
    return {
      status: 'success',
      code: 200,
      message: 'Admin stats fetched successfully',
      data: stats,
    };
  }
}
