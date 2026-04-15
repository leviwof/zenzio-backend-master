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
    const isAdmin = roleStr === '0' || roleStr === '1' || roleStr === '2'; // SUPER_ADMIN, MASTER_ADMIN, ADMIN

    // If an Admin calls this, their personal UID from the token is ignored.
    // We only use queryUserUid if the admin explicitly searches for a user.
    // For mobile users, we force their personal UID.
    const userUid = isAdmin
      ? queryUserUid
      : req?.me?.uid || req?.user?.uid || queryUserUid;

    console.log(`🔍 Coupons Fetch - Role: ${roleStr}, isAdmin: ${isAdmin}, Target UID: ${userUid}`);
    return this.couponsService.findAll(search, status, userUid, isAdmin);
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
