import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AccessTokenAuthGuard } from 'src/guards/access-token.guard';
import { Booking, BookingStatus } from './entities/booking.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  @UseGuards(AccessTokenAuthGuard)
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create(createBookingDto, req.user);
  }

  @Get('stats')
  getStats(@Query() params: any) {
    return this.bookingsService.getStats(params);
  }

  @Get()
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search?: string,
  ) {
    if (restaurantId) {
      return this.bookingsService.findAllByRestaurant(
        restaurantId,
        status,
        date,
        startDate,
        endDate,
      );
    }
    return this.bookingsService.findAll({ status, date, page, pageSize, search });
  }

  @Get('my-bookings')
  @UseGuards(AccessTokenAuthGuard)
  findAllByUser(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    console.log(`🔍 [DEBUG] my-bookings request for userId: ${userId}`);
    return this.bookingsService.findAllByUser(userId);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.CONFIRMED);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.CANCELLED);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.CANCELLED);
  }

  @Post(':id/seated')
  seated(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.SEATED);
  }

  @Get('restaurant/:restaurantId')
  findAllByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.bookingsService.findAllByRestaurant(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateBookingStatusDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto.status);
  }
}
