import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionInvoice, PaymentStatus } from './entities/subscription-invoice.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionInvoice)
    private readonly invoiceRepository: Repository<SubscriptionInvoice>,
  ) {}

  // PLANS
  async createPlan(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({ where: { isActive: true } });
  }

  // SUBSCRIPTIONS
  async createSubscription(dto: CreateSubscriptionDto): Promise<Subscription> {
    const plan = await this.planRepository.findOne({ where: { id: dto.plan_id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    const subscription = this.subscriptionRepository.create({
      restaurant_id: dto.restaurant_id,
      plan_id: dto.plan_id,
      startDate,
      endDate,
      autoRenew: dto.autoRenew ?? true,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ['restaurant', 'plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { restaurant_id: restaurantId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  // INVOICES & HISTORY
  async getPaymentHistory(restaurantId: string): Promise<SubscriptionInvoice[]> {
    return this.invoiceRepository.find({
      where: { subscription: { restaurant_id: restaurantId } },
      relations: ['subscription', 'subscription.plan'],
      order: { created_at: 'DESC' },
    });
  }

  // STATS
  async getStats() {
    const totalSubscriptions = await this.subscriptionRepository.count();
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    // This is a placeholder. Real stats would involve summing invoice amounts.
    const revenueMock = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: PaymentStatus.PAID })
      .select('SUM(invoice.amount)', 'total')
      .getRawOne();

    return {
      totalSubscriptions,
      activeSubscriptions,
      revenue: revenueMock.total || 0,
    };
  }
}
