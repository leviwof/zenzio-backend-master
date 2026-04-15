import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // PLANS
  @Post('plans')
  @UseGuards(JwtAuthGuard)
  createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(createPlanDto);
  }

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  // SUBSCRIPTIONS
  @Post()
  @UseGuards(JwtAuthGuard)
  createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(createSubscriptionDto);
  }

  @Get()
  getAllSubscriptions() {
    return this.subscriptionsService.findAllSubscriptions();
  }

  @Get('stats')
  getStats() {
    return this.subscriptionsService.getStats();
  }

  @Get('restaurant/:restaurantId')
  getByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.findByRestaurant(restaurantId);
  }

  @Get('restaurant/:restaurantId/history')
  getHistory(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.getPaymentHistory(restaurantId);
  }
}
