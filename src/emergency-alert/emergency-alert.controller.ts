import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { EmergencyAlertService } from './emergency-alert.service';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyStatusDto } from './dto/update-emergency-status.dto';
import { AccessTokenAuthGuard } from 'src/guards'; // adjust path

interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any; firebase_uid: string };
}

@Controller('emergency')
export class EmergencyAlertController {
  constructor(private readonly emergencyService: EmergencyAlertService) {}

  // --------------------------------------------------
  // FRONTEND EMERGENCY BUTTON -> CALLS THIS
  // --------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Post('alert')
  async createAlert(@Req() req: AuthRequest, @Body() dto: CreateEmergencyAlertDto) {
    const user = req.user;
    if (!user?.uid) {
      // should not happen if guard is correct
      throw new Error('Invalid user in request');
    }

    const alert = await this.emergencyService.createAlert(user.uid, dto);

    return {
      status: 'success',
      code: 201,
      data: alert,
    };
  }

  // --------------------------------------------------
  // ADMIN: GET ALL OPEN ALERTS
  // (you can protect with RolesGuard later)
  // --------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('open')
  async getOpenAlerts() {
    const alerts = await this.emergencyService.findAllOpen();
    return {
      status: 'success',
      code: 200,
      data: alerts,
    };
  }

  // --------------------------------------------------
  // ADMIN: VIEW ONE ALERT DETAIL
  // --------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get(':alert_uid')
  async getAlert(@Param('alert_uid') alert_uid: string) {
    const alert = await this.emergencyService.findOneByUid(alert_uid);
    return {
      status: 'success',
      code: 200,
      data: alert,
    };
  }

  // --------------------------------------------------
  // ADMIN: UPDATE STATUS (ACK / RESOLVE)
  // --------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Patch(':alert_uid/status')
  async updateStatus(
    @Param('alert_uid') alert_uid: string,
    @Body() dto: UpdateEmergencyStatusDto,
    @Req() req: AuthRequest,
  ) {
    // you can override resolved_by_uid from token if not sent
    if (!dto.resolved_by_uid && req.user?.uid) {
      dto.resolved_by_uid = req.user.uid;
    }

    const updated = await this.emergencyService.updateStatus(alert_uid, dto);

    return {
      status: 'success',
      code: 200,
      data: updated,
    };
  }
}
