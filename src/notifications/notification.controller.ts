import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { JwtAuthGuard } from 'src/guards';
import { UserType } from './fcm-token.entity';

interface AuthRequest extends Request {
  user: {
    uid: string;
    role: string;
    userId?: string;
  };
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ============================================================
  // GET NOTIFICATIONS
  // ============================================================
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @HttpCode(HttpStatus.OK)
  async getNotifications(@Req() req: AuthRequest) {
    const userId = req.user.uid;
    const role = req.user.role;
    let userType = UserType.USER;

    if (role === 'restaurant' || role === '4') userType = UserType.RESTAURANT;
    else if (role === 'fleet' || role === 'delivery_partner' || role === '3')
      userType = UserType.DELIVERY_PARTNER;
    else if (['admin', '0', '1', '2', 'super_admin', 'master_admin'].includes(role))
      userType = UserType.ADMIN;
    else if (role === 'customer' || role === '5') userType = UserType.USER;

    const notifications = await this.notificationService.getUserNotifications(userType, userId);

    return {
      success: true,
      data: notifications,
    };
  }

  // ============================================================
  // REGISTER FCM TOKEN - USER APP
  // ============================================================
  @Post('register/user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register FCM token for user app' })
  @HttpCode(HttpStatus.OK)
  async registerUserToken(@Req() req: AuthRequest, @Body() dto: RegisterTokenDto) {
    const userId = req.user.uid;
    const result = await this.notificationService.registerToken(
      UserType.USER,
      userId,
      dto.token,
      dto.deviceId,
      dto.platform,
    );

    return {
      success: true,
      message: 'FCM token registered successfully',
      data: { id: result.id },
    };
  }

  // ============================================================
  // REGISTER FCM TOKEN - RESTAURANT APP
  // ============================================================
  @Post('register/restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register FCM token for restaurant app' })
  @HttpCode(HttpStatus.OK)
  async registerRestaurantToken(@Req() req: AuthRequest, @Body() dto: RegisterTokenDto) {
    const restaurantId = req.user.uid;
    const result = await this.notificationService.registerToken(
      UserType.RESTAURANT,
      restaurantId,
      dto.token,
      dto.deviceId,
      dto.platform,
    );

    return {
      success: true,
      message: 'FCM token registered successfully',
      data: { id: result.id },
    };
  }

  // ============================================================
  // REGISTER FCM TOKEN - DELIVERY PARTNER APP
  // ============================================================
  @Post('register/delivery-partner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register FCM token for delivery partner app' })
  @HttpCode(HttpStatus.OK)
  async registerDeliveryPartnerToken(@Req() req: AuthRequest, @Body() dto: RegisterTokenDto) {
    const partnerId = req.user.uid;
    const result = await this.notificationService.registerToken(
      UserType.DELIVERY_PARTNER,
      partnerId,
      dto.token,
      dto.deviceId,
      dto.platform,
    );

    return {
      success: true,
      message: 'FCM token registered successfully',
      data: { id: result.id },
    };
  }

  // ============================================================
  // REGISTER FCM TOKEN - ADMIN PANEL (WEB)
  // ============================================================
  @Post('register/admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register FCM token for admin panel' })
  @HttpCode(HttpStatus.OK)
  async registerAdminToken(@Req() req: AuthRequest, @Body() dto: RegisterTokenDto) {
    const adminId = req.user.uid;
    const result = await this.notificationService.registerToken(
      UserType.ADMIN,
      adminId,
      dto.token,
      dto.deviceId,
      dto.platform || 'web',
    );

    return {
      success: true,
      message: 'FCM token registered successfully',
      data: { id: result.id },
    };
  }

  // ============================================================
  // MARK AS READ
  // ============================================================
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true, message: 'Notification marked as read' };
  }

  // ============================================================
  // REMOVE FCM TOKEN (on logout)
  // ============================================================
  @Delete('unregister')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unregister FCM token on logout' })
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Body('token') token: string) {
    await this.notificationService.removeToken(token);

    return {
      success: true,
      message: 'FCM token unregistered successfully',
    };
  }
}
