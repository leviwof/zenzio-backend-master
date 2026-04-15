import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { OfferService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { AdminActionDto } from './dto/admin-create-offer.dto';
import { offerMulterConfig } from '../config/offer-multer.config';
import { AccessTokenAuthGuard, RolesGuard } from 'src/guards';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { AuthRequest } from 'src/types/auth-request';
import { MulterFile } from 'src/types/multer-file.type';

@Controller('offers')
export class OfferController {
  constructor(private readonly service: OfferService) {}

  // ============================
  // RESTAURANT - Protected by JWT
  // ============================

  /** Create a new offer (Restaurant) */
  @Post()
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('image', offerMulterConfig))
  async createOffer(
    @Req() req: AuthRequest,
    @Body() dto: CreateOfferDto,
    @UploadedFile() image?: MulterFile,
  ) {
    const restaurant_uid = req.user?.uid;
    if (!restaurant_uid) {
      throw new BadRequestException('Invalid restaurant user');
    }
    // Override restaurantId with the authenticated user's UID
    dto.restaurantId = restaurant_uid;
    return this.service.createOffer(dto, image);
  }

  /** Get offers for logged-in restaurant */
  @Get('me')
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async getMyOffers(@Req() req: AuthRequest, @Query('page') page = 1, @Query('limit') limit = 100) {
    const restaurant_uid = req.user?.uid;
    if (!restaurant_uid) {
      throw new BadRequestException('Invalid restaurant user');
    }
    const offers = await this.service.getOffersByRestaurant(restaurant_uid, +page, +limit);
    return {
      status: 'success',
      code: 200,
      data: offers,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /** Update offer (Restaurant - owner only) */
  @Put(':id')
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('image', offerMulterConfig))
  async updateOffer(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOfferDto,
    @UploadedFile() image?: MulterFile,
  ) {
    const restaurant_uid = req.user?.uid;
    if (!restaurant_uid) {
      throw new BadRequestException('Invalid restaurant user');
    }

    // Verify ownership
    const offer = await this.service.getOfferDetails(id);
    if (!offer || offer.restaurantId !== restaurant_uid) {
      throw new BadRequestException('Offer not found or not authorized');
    }

    const result = await this.service.updateOffer(id, dto, image);
    return {
      status: 'success',
      code: 200,
      data: result,
      message: 'Offer updated successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /** Delete offer (Restaurant - owner only) */
  @Delete(':id')
  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async deleteOffer(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const restaurant_uid = req.user?.uid;
    if (!restaurant_uid) {
      throw new BadRequestException('Invalid restaurant user');
    }

    // Verify ownership
    const offer = await this.service.getOfferDetails(id);
    if (!offer || offer.restaurantId !== restaurant_uid) {
      throw new BadRequestException('Offer not found or not authorized');
    }

    await this.service.deleteOffer(id);
    return {
      status: 'success',
      code: 200,
      message: 'Offer deleted successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ============================
  // STATIC ROUTES FIRST
  // ============================

  @Get('pending')
  getPendingOffers() {
    return this.service.getPendingOffers();
  }

  @Get('admin-created')
  getAdminOffers(@Query() query: any) {
    return this.service.getAdminOffers(query);
  }

  @Get('admin-created/:id')
  getAdminOfferById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getAdminOfferById(id);
  }

  // ============================
  // ADMIN ACTIONS
  // ============================

  @Put(':id/approve')
  approveOffer(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AdminActionDto) {
    return this.service.approveOffer(id, dto.comments);
  }

  @Put(':id/reject')
  rejectOffer(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AdminActionDto) {
    return this.service.rejectOffer(id, dto.reason);
  }

  @Put(':id/request-changes')
  requestChanges(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AdminActionDto) {
    return this.service.requestChanges(id, dto.comments);
  }

  // ============================
  // ADMIN CREATE / UPDATE
  // ============================

  @Post('admin-create')
  @UseInterceptors(FileInterceptor('image', offerMulterConfig))
  createOfferByAdmin(@Body() dto: CreateOfferDto, @UploadedFile() image?: MulterFile) {
    return this.service.createOfferByAdmin(dto, image);
  }

  @Put('admin-created/:id')
  @UseInterceptors(FileInterceptor('image', offerMulterConfig))
  updateAdminOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOfferDto,
    @UploadedFile() image?: MulterFile,
  ) {
    return this.service.updateAdminOffer(id, dto, image);
  }

  @Delete('admin-created/:id')
  deleteAdminOffer(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.deleteAdminOffer(id);
  }

  // ============================
  // PUBLIC ROUTES - MUST BE LAST
  // ============================

  @Get()
  getAllOffers(@Query() query: any) {
    return this.service.getAllOffers(query);
  }

  @Get(':id')
  getOfferById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getOfferDetails(id);
  }

  @Get('details/:id')
  getOfferDetails(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getOfferDetails(id);
  }
}
