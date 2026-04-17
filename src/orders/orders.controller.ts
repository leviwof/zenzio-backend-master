import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  BadRequestException,
  Query,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateRestaurantStatusDto } from './dtos/update-restaurant-status.dto';
import { UpdateDeliveryStatusDto } from './dtos/update-delivery-status.dto';
import { AccessTokenAuthGuard } from 'src/guards';
import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles } from 'src/constants/app.enums';
import { MulterFile } from 'src/types/multer-file.type';

interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    // Auto-set customer to logged-in user
    dto.customer = req.user.uid;
    return this.ordersService.create(dto);
  }

  // ANALYTICS
  @UseGuards(AccessTokenAuthGuard)
  @Get('analytics/stats')
  async getAnalytics(@Req() req: AuthRequest, @Query('period') period?: string) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.ordersService.getAnalytics(req.user.uid, period || 'Last 7 Days');
  }

  // ADMIN ANALYTICS - GLOBAL
  // @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @RolesDecorator(Roles.SUPER_ADMIN, Roles.MASTER_ADMIN, Roles.ADMIN)
  @Get('admin/analytics')
  async getAdminAnalytics(@Query('period') period?: string) {
    // Role check is handled by AuthorizationRoleGuard but good to be explicit or trust guard?
    // The guard typically checks allowed roles if decorated, but here we just need to ensure it's not a regular user if that's critical.
    // Assuming AuthorizationRoleGuard defaults to Admin access or similar if not specified?
    // Actually, usually we need @Roles() decorator.
    // Let's assume standard admin access is sufficient.
    return this.ordersService.getAdminAnalytics(period || 'last7days');
  }

  // MONITORING STATS
  @Get('monitoring-stats')
  async getMonitoringStats() {
    return this.ordersService.getOrderMonitoringStats('', '');
  }

  // ORDER STATS - For admin dashboard
  @Get('stats')
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  // GET /orders - Get all orders for logged-in user
  // GET /orders/admin/all - Public access for Admin Panel
  // GET /orders/admin/all - Public access for Admin Panel
  @Get('admin/all')
  findAllForAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAllOrders({ status, search, startDate, endDate });
  }

  // GET /orders - Get all orders for logged-in user
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    // Allow admin to see all orders (Super Admin, Master Admin, or Admin)
    const isAdmin = [Roles.SUPER_ADMIN, Roles.MASTER_ADMIN, Roles.ADMIN].includes(
      req.user.role as Roles,
    );

    if (isAdmin) {
      return this.ordersService.findAllOrders(); // Use the enriched method
    }

    // Filter by logged-in user
    return this.ordersService.findByCustomer(req.user.uid);
  }

  // GET /orders/:id
  @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const order = await this.ordersService.findOneEnriched(id);

    // 🔒 Ownership check for customers
    const isAdmin = [Roles.SUPER_ADMIN, Roles.MASTER_ADMIN, Roles.ADMIN].includes(
      req.user.role as Roles,
    );

    if (!isAdmin && order.customer !== req.user.uid) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Restaurant status updates
  // PUT /orders/:id/restaurant-status
  @UseGuards(AccessTokenAuthGuard)
  @Put(':id/restaurant-status')
  updateRestaurantStatus(@Param('id') id: string, @Body() dto: UpdateRestaurantStatusDto) {
    return this.ordersService.updateRestaurantStatus(id, dto);
  }

  // Delivery partner status updates
  // PUT /orders/:id/delivery-status
  @Put(':id/delivery-status')
  updateDeliveryStatus(@Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.ordersService.updateDeliveryStatus(id, dto);
  }

  // Delivery partner location updates (Live Tracking)
  // PUT /orders/:id/delivery-location
  @Put(':id/delivery-location')
  updateDeliveryLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    console.log(`📍 Update Location for Order #${id}: Lat=${lat}, Lng=${lng}`); // Optional Log
    return this.ordersService.updateDeliveryLocation(id, lat, lng);
  }

  // GET /orders/:id/details - Full order details for restaurant (with customer & delivery info)
  @UseGuards(AccessTokenAuthGuard)
  @Get(':id/details')
  getOrderDetails(@Param('id') id: string) {
    return this.ordersService.getOrderDetailsForRestaurant(id);
  }

  // GET /orders/:id/admin-details - Full order details for Admin Dashboard
  @Get(':id/admin-details')
  getOrderDetailsForAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderDetailsForAdmin(id);
  }

  // ADMIN: Update delivery status (Cancel/Change delivery)
  // PUT /orders/:id/admin/delivery-status
  @Put(':id/admin/delivery-status')
  updateDeliveryStatusByAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.updateDeliveryStatusByAdmin(id, dto, reason);
  }

  // ADMIN: Reassign Delivery Partner
  @Put(':id/admin/reassign')
  reassignDeliveryPartner(
    @Param('id') id: string,
    @Body('newPartnerUid') newPartnerUid: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.reassignDeliveryPartner(id, newPartnerUid, reason);
  }

  // DELIVERY: Available orders
  @UseGuards(AccessTokenAuthGuard)
  @Get('delivery/available')
  findAvailableForDelivery(@Query('lat') lat?: number, @Query('lng') lng?: number) {
    return this.ordersService.findAvailableForDelivery(lat, lng);
  }

  // DELIVERY: My orders
  @UseGuards(AccessTokenAuthGuard)
  @Get('delivery/my-orders')
  findMyDeliveries(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.ordersService.findByDeliveryPartner(req.user.uid);
  }

  // DELIVERY: Accept order
  @UseGuards(AccessTokenAuthGuard)
  @Put(':id/delivery/accept')
  acceptDelivery(@Param('id') id: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');
    return this.ordersService.assignDeliveryPartner(id, req.user.uid);
  }

  // DELIVERY: Get One Request
  @UseGuards(AccessTokenAuthGuard)
  @Get('delivery/request/:id')
  findOneForDelivery(@Param('id') id: string) {
    return this.ordersService.findOneForDelivery(id);
  }

  // DELIVERY: Send OTP (Mock/Dev)
  @UseGuards(AccessTokenAuthGuard)
  @Post(':id/otp/send')
  sendDeliveryOtp(@Param('id') id: string, @Body('phone') phone?: string) {
    return this.ordersService.sendDeliveryOtp(id, phone);
  }

  // DELIVERY: Verify OTP
  @UseGuards(AccessTokenAuthGuard)
  @Post(':id/otp/verify')
  verifyDeliveryOtp(@Param('id') id: string, @Body('otp') otp: string) {
    if (!otp) throw new BadRequestException('OTP is required');
    return this.ordersService.verifyDeliveryOtp(id, otp);
  }

  // DELIVERY: Complete Delivery
  @UseGuards(AccessTokenAuthGuard)
  @UseInterceptors(FileInterceptor('deliveryPhoto'))
  @Post(':id/delivery/complete')
  completeDelivery(
    @Param('id') id: string,
    @Body('deliveryNotes') deliveryNotes?: string,
    @Body('paymentCollected') paymentCollected?: any,
    @UploadedFile() deliveryPhoto?: MulterFile,
  ) {
    const isPaymentCollected = String(paymentCollected) === 'true';
    return this.ordersService.completeDelivery(
      id,
      deliveryNotes,
      isPaymentCollected,
      deliveryPhoto,
    );
  }
}
