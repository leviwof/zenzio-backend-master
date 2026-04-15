import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';

import { AttendanceService } from './attendance.service';
import { PunchDto } from './dto/punch.dto';
import { AccessTokenAuthGuard } from 'src/guards';
import { JwtPayload } from 'src/shared/jwt.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';

interface AuthUser extends JwtPayload {
  role: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ---------------------------------------------------------
  // PUNCH / BREAK EVENT
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Post('punch')
  async punch(@Req() req: AuthRequest, @Body() dto: PunchDto) {
    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');

    // Inject uid into DTO since it's now optional in payload but required by service checks or logic
    dto.fleet_uid = fleet_uid;

    const result = await this.attendanceService.punch(fleet_uid, dto);

    return {
      status: 'success',
      code: 200,
      message: 'Punch recorded successfully',
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // GET DAILY LOGS
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('daily')
  async getDailyLogs(@Req() req: AuthRequest, @Query('date') date: string) {
    if (!date) throw new BadRequestException('date is required');

    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');
    const logs = await this.attendanceService.getDailyLogs(fleet_uid, date);

    return {
      status: 'success',
      code: 200,
      message: 'Daily logs fetched successfully',
      data: logs,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // GET MONTHLY LOGS
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('monthly')
  async getMonthlyLogs(
    @Req() req: AuthRequest,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    if (!year || !month) throw new BadRequestException('year and month are required');

    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');

    const logs = await this.attendanceService.getMonthlyLogs(
      fleet_uid,
      Number(year),
      Number(month),
    );

    return {
      status: 'success',
      code: 200,
      message: 'Monthly logs fetched successfully',
      data: logs,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // GET RANGE SUMMARY
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('range-summary')
  async rangeSummary(
    @Req() req: AuthRequest,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    if (!startDate || !endDate)
      throw new BadRequestException('start_date and end_date are required');

    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');

    const summary = await this.attendanceService.getRangeSummary(fleet_uid, startDate, endDate);

    return {
      status: 'success',
      code: 200,
      message: 'Range summary fetched successfully',
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // DAILY SUMMARY
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('daily-summary')
  async dailySummary(@Req() req: AuthRequest, @Query('date') date: string) {
    if (!date) throw new BadRequestException('date is required');

    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');

    const summary = await this.attendanceService.getDailySummary(fleet_uid, date);

    return {
      status: 'success',
      code: 200,
      message: 'Daily summary fetched successfully',
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // HOURLY STATUS
  // ---------------------------------------------------------
  @UseGuards(AccessTokenAuthGuard)
  @Get('hourly-status')
  async hourlyStatus(@Req() req: AuthRequest, @Query('date') date: string) {
    if (!date) throw new BadRequestException('date is required');

    const fleet_uid = req.user?.uid;
    if (!fleet_uid) throw new BadRequestException('Invalid fleet user');

    const hourly = await this.attendanceService.getHourlySummary(fleet_uid, date);

    return {
      status: 'success',
      code: 200,
      message: 'Hourly summary fetched successfully',
      data: hourly,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ---------------------------------------------------------
  // ADMIN: GET RANGE SUMMARY
  // ---------------------------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @Get('admin/range-summary')
  async rangeSummaryAdmin(
    @Query('fleet_uid') fleetUid: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    if (!fleetUid || !startDate || !endDate)
      throw new BadRequestException('fleet_uid, start_date and end_date are required');

    const summary = await this.attendanceService.getRangeSummary(fleetUid, startDate, endDate);

    return {
      status: 'success',
      code: 200,
      message: 'Range summary fetched successfully',
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
