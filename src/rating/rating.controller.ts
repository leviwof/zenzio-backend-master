import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import {
  CustRestaurantRatingDto,
  CustFleetRatingDto,
  FleetCustRatingDto,
  FleetRestRatingDto,
  RestFleetRatingDto,
  RestCustRatingDto,
  CusAppRatingDto,
  RestAppRatingDto,
  FleetAppRatingDto,
  SubmitOrderRatingDto,
} from './rating.dto';

@ApiTags('Rating')
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // General
  @Get()
  findAll() {
    return this.ratingService.findAll();
  }

  @Get('group/:group_id')
  findByGroup(@Param('group_id') group_id: string) {
    return this.ratingService.findByGroup(group_id);
  }

  // ===== SPECIFIC RATING ENDPOINTS =====

  @Post('cust-restaurant')
  rateCustRestaurant(@Body() dto: CustRestaurantRatingDto) {
    return this.ratingService.rateCustRestaurant(dto);
  }

  @Post('cust-fleet')
  rateCustFleet(@Body() dto: CustFleetRatingDto) {
    return this.ratingService.rateCustFleet(dto);
  }

  @Post('fleet-cust')
  rateFleetCust(@Body() dto: FleetCustRatingDto) {
    return this.ratingService.rateFleetCust(dto);
  }

  @Post('fleet-rest')
  rateFleetRest(@Body() dto: FleetRestRatingDto) {
    return this.ratingService.rateFleetRest(dto);
  }

  @Post('rest-fleet')
  rateRestFleet(@Body() dto: RestFleetRatingDto) {
    return this.ratingService.rateRestFleet(dto);
  }

  @Post('rest-cust')
  rateRestCust(@Body() dto: RestCustRatingDto) {
    return this.ratingService.rateRestCust(dto);
  }

  @Post('cus-app')
  rateCusApp(@Body() dto: CusAppRatingDto) {
    return this.ratingService.rateCusApp(dto);
  }

  @Post('rest-app')
  rateRestApp(@Body() dto: RestAppRatingDto) {
    return this.ratingService.rateRestApp(dto);
  }

  @Post('fleet-app')
  rateFleetApp(@Body() dto: FleetAppRatingDto) {
    return this.ratingService.rateFleetApp(dto);
  }

  @Post('submit-order-rating')
  submitOrderRating(@Body() dto: SubmitOrderRatingDto) {
    return this.ratingService.submitOrderRating(dto);
  }
}
