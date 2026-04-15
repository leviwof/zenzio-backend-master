import {
  Controller,
  Post,
  Get,
  Req,
  Body,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

import { AccessTokenAuthGuard } from 'src/guards';
import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';

import { FoodRatingService } from './food-rating.service';
import { FoodRatingDto } from './food-rating.dto';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    role: string;
    [key: string]: any;
  };
}

@ApiTags('Food Ratings')
@Controller('food-rating')
@UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
export class FoodRatingController {
  constructor(private readonly service: FoodRatingService) {}

  // ------------------------------------------------
  // 🟩 CREATE / UPDATE FOOD RATING
  // ------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Create or Update a food rating for logged-in user' })
  @ApiBody({ type: FoodRatingDto })
  @ApiResponse({ status: 200, description: 'Food rating saved successfully' })
  async rate(@Req() req: AuthRequest, @Body() dto: FoodRatingDto) {
    const cus_uid = req.user?.uid;
    if (!cus_uid) throw new BadRequestException('Invalid user');

    const rating = await this.service.rateFood(cus_uid, dto);

    return {
      status: 'success',
      code: 200,
      message: 'Food rating saved successfully',
      data: { rating },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ------------------------------------------------
  // 🟦 GET rating for user by groupId
  // ------------------------------------------------
  @Get(':group_id')
  @ApiOperation({ summary: 'Get food ratings for logged-in user by group_id' })
  @ApiParam({ name: 'group_id', example: 'GRP-ORDER-001' })
  @ApiResponse({ status: 200, description: 'Ratings fetched successfully' })
  async getUserRatings(@Param('group_id') group_id: string, @Req() req: AuthRequest) {
    const cus_uid = req.user?.uid;
    if (!cus_uid) throw new BadRequestException('Invalid user');

    const rating = await this.service.getRatings(group_id, cus_uid);

    return {
      status: 'success',
      code: 200,
      data: { rating },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
