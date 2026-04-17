import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, LessThan, MoreThanOrEqual } from 'typeorm';
import { Coupon, CouponStatus } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Order } from 'src/orders/order.entity';
@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponsRepository.findOne({
      where: { code: createCouponDto.code },
    });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const coupon = this.couponsRepository.create(createCouponDto);
    return this.couponsRepository.save(coupon);
  }

  async findAll(
    search?: string,
    status?: string,
    user_uid?: string,
    isAdmin: boolean = false,
  ): Promise<any[]> {
    const queryBuilder = this.couponsRepository.createQueryBuilder('coupon');

    if (search) {
      queryBuilder.andWhere('(coupon.code ILIKE :search OR coupon.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (status) {
      if (status === 'Expired') {
        queryBuilder.andWhere('coupon.endDate < :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('coupon.status = :status', { status });
      }
    }

    // Role-based visibility logic
    if (user_uid) {
      // If fetching for a specific user, show public coupons + their private referral coupons
      queryBuilder.andWhere('(coupon.source IS NULL OR coupon.assigned_to_uid = :uid)', {
        uid: user_uid,
      });

      // Force mobile users (non-admins) to ONLY see Active coupons
      if (!isAdmin) {
        queryBuilder.andWhere('coupon.status = :activeStatus', {
          activeStatus: CouponStatus.ACTIVE,
        });
      }
    } else {
      // Admin global view — exclude private Joinee/Reward coupons from the master list
      queryBuilder.andWhere('coupon.source IS NULL');
    }

    queryBuilder.orderBy('coupon.createdAt', 'DESC');
    const coupons = await queryBuilder.getMany();

    if (user_uid) {
      const results: any[] = [];
      const now = new Date();

      for (const coupon of coupons) {
        const usageCount = await this.orderRepository.count({
          where: {
            customer: user_uid,
            coupon_code: coupon.code,
          },
        });

        const usageLimitPerUser = coupon.usageLimitPerUser || Infinity;

        // Base checks
        const todayDateStr = now.toISOString().split('T')[0];
        const isDateValid = !coupon.endDate || todayDateStr <= String(coupon.endDate);
        const isStatusValid = coupon.status === 'Active';
        const isGlobalLimitValid = !coupon.usageLimit || coupon.redemptionCount < coupon.usageLimit;
        const isUserLimitValid = usageCount < usageLimitPerUser;

        // New User Constraint Check
        let isEligibleAsNewUser: boolean = false;
        let isNewUserConstraintValid: boolean = true; // Assume true unless restriction applies

        if (coupon.targetAudience === 'new' || coupon.source === 'referral_joinee') {
          const existingOrders = await this.orderRepository.count({
            where: [{ customer: user_uid }],
          });
          if (existingOrders === 0) {
            isEligibleAsNewUser = true;
          } else {
            isNewUserConstraintValid = false; // Restriction applies and failed
          }
        }

        const isValidForUser =
          isDateValid &&
          isStatusValid &&
          isGlobalLimitValid &&
          isUserLimitValid &&
          isNewUserConstraintValid;

        results.push({
          ...coupon,
          currentUserUsage: usageCount,
          isUserEligible: usageCount < usageLimitPerUser,
          isEligibleAsNewUser: isEligibleAsNewUser,
          isValidForUser: isValidForUser,
        });
      }
      return results;
    }

    return coupons;
  }

  async getUsageCountForUser(code: string, user_uid: string): Promise<number> {
    return await this.orderRepository.count({
      where: {
        customer: user_uid,
        coupon_code: code,
      },
    });
  }

  async validateCouponForUser(code: string, user_uid: string): Promise<void> {
    const coupon = await this.couponsRepository.findOne({ where: { code } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (coupon.status !== CouponStatus.ACTIVE) throw new ConflictException('Coupon is not active');
    const todayDateStr = new Date().toISOString().split('T')[0];
    if (coupon.endDate && todayDateStr > String(coupon.endDate))
      throw new ConflictException('Coupon has expired');

    if (coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit) {
      throw new ConflictException('Coupon usage limit reached');
    }

    // Private coupon — only the assigned user can apply
    if (coupon.assigned_to_uid && coupon.assigned_to_uid !== user_uid) {
      throw new ConflictException('This coupon is not valid for your account');
    }

    // Joinee coupon — only valid on first order (order count = 0)
    // Reward coupons (referral_reward) have NO order restriction
    if (coupon.source === 'referral_joinee') {
      const orderCount = await this.orderRepository.count({
        where: { customer: user_uid },
      });
      if (orderCount > 0)
        throw new ConflictException('This coupon is only valid on your first order');
    }

    const userUsage = await this.getUsageCountForUser(code, user_uid);
    if (coupon.usageLimitPerUser && userUsage >= coupon.usageLimitPerUser) {
      throw new ConflictException(
        `You have already used this coupon ${userUsage} times (Limit: ${coupon.usageLimitPerUser})`,
      );
    }

    // Existing targetAudience = 'new' check (for non-referral coupons)
    if (coupon.targetAudience === 'new' && !coupon.source) {
      const existingOrders = await this.orderRepository.count({
        where: [{ customer: user_uid }],
      });
      if (existingOrders > 0)
        throw new ConflictException('This coupon is only valid for new user only');
    }
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    const updated = Object.assign(coupon, updateCouponDto);
    return this.couponsRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
  }

  async generateReport(): Promise<string> {
    const coupons = await this.findAll();
    const header =
      'Code,Name,Discount Type,Discount Value,Min Order Value,Usage Limit,Redemption Count,Status,Start Date,End Date\n';
    const rows = coupons.map((c) => {
      return [
        c.code,
        `"${c.name}"`,
        c.discountType,
        c.discountValue,
        c.minOrderValue || 0,
        c.usageLimit || 'Unlimited',
        c.redemptionCount || 0,
        c.status,
        c.startDate ? c.startDate.toISOString().split('T')[0] : '',
        c.endDate ? c.endDate.toISOString().split('T')[0] : '',
      ].join(',');
    });
    return header + rows.join('\n');
  }

  async redeemCoupon(code: string): Promise<void> {
    const coupon = await this.couponsRepository.findOne({ where: { code } });
    if (!coupon) return;

    coupon.redemptionCount = (Number(coupon.redemptionCount) || 0) + 1;

    if (coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit) {
      coupon.status = CouponStatus.INACTIVE;
    }

    await this.couponsRepository.save(coupon);
    console.log(`✅ Coupon ${code} redeemed. New count: ${coupon.redemptionCount}`);
  }
}
