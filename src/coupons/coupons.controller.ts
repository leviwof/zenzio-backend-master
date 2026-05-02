import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponValidationResponseDto } from './dto/coupon-validation-response.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('user_uid') queryUserUid?: string,
    @Req() req?: any,
  ) {
    const roleStr = String(req?.me?.role || req?.user?.role || '');
    const isAdmin = roleStr === '0' || roleStr === '1' || roleStr === '2';

    const userUid = isAdmin
      ? queryUserUid
      : req?.me?.uid || req?.user?.uid || queryUserUid;

    return this.couponsService.findAll(search, status, userUid, isAdmin);
  }

  @Get('validate')
  async validateCoupon(
    @Query('code') code: string,
    @Query('user_uid') queryUserUid: string,
    @Query('orderAmount') orderAmountQuery?: string,
    @Req() req?: any,
  ): Promise<CouponValidationResponseDto> {
    const roleStr = String(req?.me?.role || req?.user?.role || '');
    const isAdmin = roleStr === '0' || roleStr === '1' || roleStr === '2';
    const user_uid = isAdmin
      ? queryUserUid
      : req?.me?.uid || req?.user?.uid || queryUserUid;

    const orderAmount = orderAmountQuery ? Number(orderAmountQuery) : undefined;

    if (!code || !user_uid) {
      return {
        isValidForUser: false,
        reason: 'NOT_ELIGIBLE',
        message: 'code and user_uid are required',
        status: 'Inactive',
        endDate: 'N/A',
      };
    }
    return this.couponsService.validateCouponDetailed(code, user_uid, orderAmount);
  }

  @Get('report')
  async downloadReport(@Res() res: Response) {
    const csv = await this.couponsService.generateReport();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="coupons_report.csv"',
    });
    res.send(csv);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
