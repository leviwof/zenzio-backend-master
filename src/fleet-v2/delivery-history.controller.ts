import {
  Controller,
  Param,
  Req,
  Body,
  BadRequestException,
  UseGuards,
  Post,
  Get,
  Patch,
  Query,
} from '@nestjs/common';

import { AccessTokenAuthGuard, RolesGuard } from 'src/guards';
import { DeliveryHistoryService } from './delivery-history.service';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { RolesDecorator } from 'src/auth/app.decorator';
import { DeliveryStatus } from './entity/delivery_history.entity';

interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}

@Controller('delivery-history')
export class DeliveryHistoryController {
  constructor(private readonly deliveryHistoryService: DeliveryHistoryService) {}

  // -----------------------------------------------------------
  // CREATE DELIVERY HISTORY (called when fleet accepts order)
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post('create/:order_id')
  createDeliveryHistory(
    @Req() req: AuthRequest,
    @Param('order_id') order_id: string,
    @Body()
    body: {
      restaurant_uid?: string;
      restaurant_name?: string;
      restaurant_address?: string;
      restaurant_lat?: number;
      restaurant_lng?: number;
      customer_uid?: string;
      customer_name?: string;
      customer_phone?: string;
      customer_address?: string;
      customer_lat?: number;
      customer_lng?: number;
      order_value?: number;
      delivery_earning?: number;
      distance_km?: number;
      estimated_time_min?: number;
      items?: any[];
      payment_method?: string;
    },
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.deliveryHistoryService.createDeliveryHistory(req.user.uid, order_id, body);
  }

  // -----------------------------------------------------------
  // GET DELIVERY DETAILS
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get(':order_id')
  getDeliveryDetails(@Req() req: AuthRequest, @Param('order_id') order_id: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.deliveryHistoryService.getDeliveryDetails(req.user.uid, order_id);
  }

  // -----------------------------------------------------------
  // UPDATE DELIVERY STATUS
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Patch(':order_id/status')
  updateDeliveryStatus(
    @Req() req: AuthRequest,
    @Param('order_id') order_id: string,
    @Body() body: { status: DeliveryStatus; notes?: string },
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    if (!body.status) {
      throw new BadRequestException('Status is required');
    }
    return this.deliveryHistoryService.updateDeliveryStatus(
      req.user.uid,
      order_id,
      body.status,
      body.notes,
    );
  }

  // -----------------------------------------------------------
  // SEND OTP TO CUSTOMER
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':order_id/send-otp')
  sendOtpToCustomer(@Req() req: AuthRequest, @Param('order_id') order_id: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.deliveryHistoryService.sendDeliveryOtpToCustomer(req.user.uid, order_id);
  }

  // -----------------------------------------------------------
  // VERIFY DELIVERY OTP
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':order_id/verify-otp')
  verifyDeliveryOtp(
    @Req() req: AuthRequest,
    @Param('order_id') order_id: string,
    @Body() body: { otp: string },
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    if (!body.otp) {
      throw new BadRequestException('OTP is required');
    }
    return this.deliveryHistoryService.verifyDeliveryOtp(req.user.uid, order_id, body.otp);
  }

  // -----------------------------------------------------------
  // COMPLETE DELIVERY
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':order_id/complete')
  completeDelivery(
    @Req() req: AuthRequest,
    @Param('order_id') order_id: string,
    @Body()
    body: {
      delivery_notes?: string;
      delivery_photo_url?: string;
      tip_amount?: number;
      payment_collected?: boolean;
    },
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.deliveryHistoryService.completeDelivery(req.user.uid, order_id, body);
  }

  // -----------------------------------------------------------
  // GET FLEET DELIVERY HISTORY
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get()
  getFleetDeliveryHistory(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.deliveryHistoryService.getFleetDeliveryHistory(req.user.uid, pageNum, limitNum);
  }

  // -----------------------------------------------------------
  // GET EARNINGS SUMMARY
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get('earnings/summary')
  getEarningsSummary(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.deliveryHistoryService.getFleetEarningsSummary(req.user.uid);
  }
}
