import {
  Controller,
  Param,
  Req,
  BadRequestException,
  UseGuards,
  Post,
  Get,
  Query,
} from '@nestjs/common';

import { AccessTokenAuthGuard, RolesGuard } from 'src/guards';
import { FleetOrderService } from './fleet-order.service';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { RolesDecorator } from 'src/auth/app.decorator';
interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}

@Controller('fleet-order')
export class FleetOrderController {
  constructor(private readonly fleetOrderService: FleetOrderService) {}

  // -----------------------------------------------------------
  // GET NEARBY ORDERS
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get('available')
  getAvailableOrders(
    @Req() req: AuthRequest,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    // Default radius 10000km if not provided (as per user request "update radius to 10000kms")
    const radiusVal = radius ? Number(radius) : 10000;
    const latVal = lat ? Number(lat) : 0;
    const lngVal = lng ? Number(lng) : 0;

    return this.fleetOrderService.getAvailableOrders(fleet_uid, latVal, lngVal, radiusVal);
  }

  // -----------------------------------------------------------
  // GET EARNINGS
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get('earnings')
  getEarnings(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.fleetOrderService.getFleetEarnings(req.user.uid);
  }

  // -----------------------------------------------------------
  // GET RESTAURANT ACCEPTED ORDERS (with full restaurant details)
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get('restaurant-accepted')
  getRestaurantAcceptedOrders(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.fleetOrderService.getRestaurantAcceptedOrders(req.user.uid);
  }

  // -----------------------------------------------------------
  // GET SINGLE ORDER WITH FULL RESTAURANT DETAILS
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Get(':cart_group_uid/details')
  getOrderDetails(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.fleetOrderService.getOrderWithRestaurantDetails(req.user.uid, cart_group_uid);
  }

  // -----------------------------------------------------------
  // ACCEPT ORDER FROM ORDERS TABLE (Fleet)
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post('accept-order/:order_id')
  acceptOrderNew(@Req() req: AuthRequest, @Param('order_id') order_id: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }
    return this.fleetOrderService.acceptOrderFromOrdersTable(req.user.uid, order_id);
  }

  // -----------------------------------------------------------
  // ACCEPT ORDER (Fleet)
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/accept')
  acceptOrderByFleet(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.acceptOrderByFleet(fleet_uid, cart_group_uid);
  }

  // -----------------------------------------------------------
  // REJECT ORDER (Fleet)
  // -----------------------------------------------------------
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/reject')
  rejectOrderByFleet(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.rejectOrderByFleet(fleet_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/reached-res')
  fleetArrivedRest(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.fleetArrivedRest(fleet_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/picked-up')
  orderPicked(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.orderPicked(fleet_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/reached-loc')
  reachedLoc(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.reachedLoc(fleet_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/delivered')
  delivered(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid fleet user');
    }

    const fleet_uid = req.user.uid;
    return this.fleetOrderService.delivered(fleet_uid, cart_group_uid);
  }
}
