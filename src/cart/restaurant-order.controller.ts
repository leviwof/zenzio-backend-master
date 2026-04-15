import {
  Controller,
  Patch,
  Param,
  Body,
  Req,
  BadRequestException,
  UseGuards,
  Post,
} from '@nestjs/common';
import { RestaurantOrderService } from './restaurant-order.service';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { AccessTokenAuthGuard, RolesGuard } from 'src/guards';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { RolesDecorator } from 'src/auth/app.decorator';
interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}

@Controller('restaurant-order')
export class RestaurantOrderController {
  constructor(private readonly restaurantOrderService: RestaurantOrderService) {}

  // -----------------------------------------------------
  // RESTAURANT RECEIVES OR ACCEPTS ORDER
  // -----------------------------------------------------
  @Patch(':cart_group_uid')
  updateOrderStatus(
    @Req() req: AuthRequest,
    @Param('cart_group_uid') cart_group_uid: string,
    @Body() dto: UpdateCartStatusDto,
  ) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const restaurant_uid = req.user.uid;
    return this.restaurantOrderService.updateOrderStatus(restaurant_uid, cart_group_uid, dto);
  }

  // -----------------------------------------------------------
  // ACCEPT ORDER (Restaurant)
  // -----------------------------------------------------------

  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/accept')
  acceptOrderByRes(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid Restaurant user');
    }

    const restaurant_uid = req.user.uid;
    return this.restaurantOrderService.acceptOrderByRes(restaurant_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/reject')
  rejectOrderByRes(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid Restaurant user');
    }

    const restaurant_uid = req.user.uid;
    return this.restaurantOrderService.rejectOrderByRes(restaurant_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/food-prepare')
  foodPrepare(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid Restaurant user');
    }

    const restaurant_uid = req.user.uid;
    return this.restaurantOrderService.foodPrepare(restaurant_uid, cart_group_uid);
  }

  @RolesDecorator(RoleEnum.USER_RESTAURANT)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  @Post(':cart_group_uid/food-ready')
  foodReady(@Req() req: AuthRequest, @Param('cart_group_uid') cart_group_uid: string) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid Restaurant user');
    }

    const restaurant_uid = req.user.uid;
    return this.restaurantOrderService.foodReady(restaurant_uid, cart_group_uid);
  }
}
