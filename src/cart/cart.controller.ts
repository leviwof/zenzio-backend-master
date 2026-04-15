import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';

import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdatePaymentModeDto } from './dto/update-payment-mode.dto';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { CartGroupService } from './cart-group.service';
import { AuthRequest, RequestWithUser } from 'src/types/auth-request';
import { RolesDecorator } from 'src/auth/app.decorator';

// interface AuthRequest extends Request {
//   user?: { uid: string; role: string; [key: string]: any };
// }

@ApiTags('Cart')
@Controller('cart')
// @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private cartGroupService: CartGroupService,
  ) { }

  // ------------------------------------------------
  // 🟩 GET CART
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get()
  @ApiOperation({ summary: 'Get full cart for logged-in user' })
  async getCart(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const cart = await this.cartService.getCartWithItems(user_uid);

    // Debug logging
    console.log('🛒 Cart groups:', cart?.groups?.length || 0);
    if (cart?.groups) {
      cart.groups.forEach((group: any) => {
        console.log(`📦 Group ${group.restaurant_uid}: ${group.items?.length || 0} items`);
        group.items?.forEach((item: any) => {
          console.log(
            `  📍 Item: ${item.menu_name}, Images: ${JSON.stringify(item.images)}, Discount: ${item.discount}`,
          );
        });
      });
    }

    return {
      status: 'success',
      code: 200,
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @UseGuards(AccessTokenAuthGuard)
  @Post('add')
  // @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiBody({ type: AddToCartDto })
  async addToCart(@Body() dto: AddToCartDto, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const cart = await this.cartService.addItem(req.user.uid, dto);

    return {
      status: 'success',
      code: 201,
      message: 'Item added to cart successfully',
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟧 UPDATE ITEM
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Patch('item/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateCartItemDto })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: AuthRequest,
  ) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const cart = await this.cartService.updateItem(user_uid, Number(id), dto);

    return {
      status: 'success',
      code: 200,
      message: 'Cart item updated successfully',
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟥 REMOVE ITEM
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Delete('item/:id')
  @ApiOperation({ summary: 'Remove one item from the cart' })
  @ApiParam({ name: 'id', example: 1 })
  async removeItem(@Param('id') id: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const cart = await this.cartService.removeItem(user_uid, Number(id));

    return {
      status: 'success',
      code: 200,
      message: 'Cart item removed successfully',
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟪 CLEAR GROUP
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Delete('group/:restaurant_uid')
  @ApiOperation({ summary: 'Clear all items from a restaurant group' })
  @ApiParam({ name: 'restaurant_uid', example: 'RES-123ABC' })
  async clearGroup(@Param('restaurant_uid') restaurant_uid: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const cart = await this.cartService.clearGroup(user_uid, restaurant_uid);

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant group cleared successfully',
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟫 CLEAR CART
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Delete('clear')
  @ApiOperation({ summary: 'Clear full cart' })
  async clearCart(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const cart = await this.cartService.clearCart(user_uid);

    return {
      status: 'success',
      code: 200,
      message: 'Cart cleared successfully',
      data: { cart },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Patch('payment-mode/:group_uid')
  async updatePaymentMode(
    @Req() req: AuthRequest,
    @Param('group_uid') group_uid: string,
    @Body() dto: UpdatePaymentModeDto,
  ) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    console.log('DTO RECEIVED:', dto);
    const user_uid = req.user.uid;
    const group = await this.cartService.updatePaymentMode(user_uid, group_uid, dto);
    return {
      status: 'success',
      code: 200,
      data: group,
      message: 'Payment mode updated successfully',
    };
  }

  // ------------------------------------------------
  // 📦 GET MY ORDERS (Customer Orders)
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get('my-orders')
  @ApiOperation({ summary: 'Get all orders for logged-in customer' })
  async getMyOrders(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    // Get all cart groups for this user (orders)
    const groups = await this.cartGroupService.listGroups(user_uid, {
      page: 1,
      limit: 100, // Get all orders
      user_uid, // Filter by this user
    });

    return {
      status: 'success',
      code: 200,
      data: { orders: groups },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @UseGuards(AccessTokenAuthGuard)
  @Get('order-list-restaurant')
  getOrders(
    @Req() req: AuthRequest,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const restaurant_uid: string = req.user.uid;

    // Parse status query parameter into array if provided
    let statusList: string[] | undefined;

    if (typeof status === 'string' && status.length > 0) {
      statusList = status.split(',').map((s: string) => s.trim());
    }

    return this.cartService.getOrdersListForRestaurant(
      restaurant_uid,
      statusList,
      Number(page),
      Number(limit),
      startDate,
      endDate,
    );
  }

  // ------------------------------------------------
  // 🟦 VIEW ITEMS BY RESTAURANT UID
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get('restaurant/:restaurant_uid/items')
  @ApiOperation({ summary: 'View items for a restaurant group' })
  @ApiParam({ name: 'restaurant_uid', example: 'RES-123ABC' })
  async viewItemsByRestaurant(
    @Param('restaurant_uid') restaurant_uid: string,
    @Req() req: AuthRequest,
  ) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    const user_uid: string = req.user.uid;

    const group = await this.cartService.getItemsByRestaurant(user_uid, restaurant_uid);
    console.log({ group });

    // Flatten menu data (images, discount) into items for frontend
    const itemsWithMenuData = group.items.map((item: any) => ({
      id: item.id,
      cart_item_uid: item.cart_item_uid,
      menu_uid: item.menu_uid,
      menu_name: item.menu_name,
      price: item.price,
      qty: item.qty,
      total_price: item.total_price,
      images: item.menu?.images || [],
      discount: item.menu?.discount || 0,
    }));

    return {
      status: 'success',
      code: 200,
      data: {
        restaurant_uid: group.restaurant_uid,
        cart_group_uid: group.cart_group_uid,
        subtotal: group.subtotal,
        items: itemsWithMenuData,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟦 VIEW ITEMS BY GROUP ID
  // ------------------------------------------------
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get('group/:groupId/items')
  @ApiOperation({ summary: 'View items of a specific cart group by ID' })
  @ApiParam({ name: 'groupId', example: 10 })
  async viewGroupItemsById(@Param('groupId') groupId: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const user_uid: string = req.user.uid;

    const { group, addressDetails } = await this.cartService.getItemsByGroupId(
      user_uid,
      Number(groupId),
    );

    return {
      status: 'success',
      code: 200,
      data: {
        // group_id: group.id,
        // restaurant_uid: group.restaurant_uid,
        // subtotal: group.subtotal,

        // old
        // address: group.address_type,

        // NEW
        ...group,
        address_details: addressDetails
          ? {
            ...addressDetails,
            // type: addressDetails.address_type,
            // address: addressDetails.address,
            // lat: addressDetails.lat,
            // lng: addressDetails.lng,
            // verified: addressDetails.verified,
          }
          : null,

        // items: group.items,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('list')
  // @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin: List All Cart Groups with filters + pagination' })
  listGroups(
    @Req() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('restaurant_uid') restaurant_uid?: string,
    @Query('fleet_uid') fleet_uid?: string,
    @Query('user_uid') user_uid?: string,
    @Query('status') status?: string,
    @Query('r_status') r_status?: string,
    @Query('f_status') f_status?: string,
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const admin_uid = req.user.uid;

    return this.cartGroupService.listGroups(
      admin_uid, // ✅ FIRST ARGUMENT
      {
        page: Number(page),
        limit: Number(limit),
        restaurant_uid,
        fleet_uid,
        user_uid,
        status,
        r_status,
        f_status,
      }, // ✅ SECOND ARGUMENT
    );
  }

  @Get('list/admin')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin: List All Cart Groups with filters + pagination' })
  async listCartGroupsForAdmin(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('restaurant_uid') restaurant_uid?: string,
    @Query('fleet_uid') fleet_uid?: string,
    @Query('user_uid') user_uid?: string,
    @Query('status') status?: string,
    @Query('r_status') r_status?: string,
    @Query('f_status') f_status?: string,
  ) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid admin');
    }

    const admin_uid = req.user.uid;

    return this.cartGroupService.listGroupsForAdmin(admin_uid, {
      page: Number(page),
      limit: Number(limit),
      restaurant_uid,
      fleet_uid,
      user_uid,
      status,
      r_status,
      f_status,
    });
  }
}
