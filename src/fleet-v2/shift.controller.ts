import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { AdminUpdateShiftDto } from './dto/admin-update-shift.dto';
import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { AuthRequest } from 'src/types/auth-request';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';

@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('config')
  async getShiftConfig() {
    return this.shiftService.getShiftConfig();
  }

  @Get('my')
  @UseGuards(AccessTokenAuthGuard)
  async getMyShift(@Req() req: AuthRequest) {
    const userId = req.user?.uid;
    return this.shiftService.getFleetShift(userId);
  }

  @Post('assign')
  @UseGuards(AccessTokenAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async assignShift(@Req() req: AuthRequest, @Body() dto: AssignShiftDto) {
    const userId = req.user?.uid;
    if (!userId) {
      return {
        status: 'failed',
        code: 400,
        message: 'Invalid user',
      };
    }
    return this.shiftService.assignShift(userId, dto.shiftId);
  }

  @Put('admin/update')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminUpdateShift(@Body() dto: AdminUpdateShiftDto) {
    return this.shiftService.adminUpdateShift(dto);
  }

  @Get('admin/:userId')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getFleetShift(@Param('userId') userId: string) {
    return this.shiftService.getFleetShift(userId);
  }
}