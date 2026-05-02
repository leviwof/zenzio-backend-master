import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponStatus, DiscountType } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Order } from 'src/orders/order.entity';
import { CouponValidationResponseDto } from './dto/coupon-validation-response.dto';

export type ValidationFailureReason =
  | 'EXPIRED'
  | 'INACTIVE'
  | 'MIN_ORDER_NOT_MET'
  | 'USER_LIMIT_REACHED'
  | 'LIMIT_REACHED'
  | 'NOT_ELIGIBLE'
  | 'NOT_YET_ACTIVE'
  | 'NOT_AUTHORIZED'
  | 'NOT_FOUND';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

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

  private getUTCDate(date: Date | string | null): Date | null {
    if (!date) return null;
    return new Date(new Date(date).toISOString());
  }

  private getCurrentUTCDate(): Date {
    return new Date(new Date().toISOString());
  }

  private calculateDiscount(coupon: Coupon, orderAmount: number): number {
    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (orderAmount * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }
    if (coupon.maxDiscountCap) {
      discount = Math.min(discount, Number(coupon.maxDiscountCap));
    }
    return Number(discount.toFixed(2));
  }

  async findAll(
    search?: string,
    status?: string,
    user_uid?: string,
    isAdmin: boolean = false,
  ): Promise<any[]> {
    const queryBuilder = this.couponsRepository.createQueryBuilder('coupon');

    if (search) {
      queryBuilder.andWhere(
        '(coupon.code ILIKE :search OR coupon.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      if (status === 'Expired') {
        queryBuilder.andWhere('coupon.endDate < :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('coupon.status = :status', { status });
      }
    }

    if (user_uid) {
      queryBuilder.andWhere(
        '(coupon.source IS NULL OR coupon.assigned_to_uid = :uid)',
        { uid: user_uid },
      );

      if (!isAdmin) {
        queryBuilder.andWhere('coupon.status = :activeStatus', {
          activeStatus: CouponStatus.ACTIVE,
        });
      }
    } else {
      queryBuilder.andWhere('coupon.source IS NULL');
    }

    queryBuilder.orderBy('coupon.createdAt', 'DESC');
    const coupons = await queryBuilder.getMany();

    if (user_uid) {
      const results: any[] = [];
      const now = this.getCurrentUTCDate();

      for (const coupon of coupons) {
        const usageCount = await this.orderRepository.count({
          where: {
            customer: user_uid,
            coupon_code: coupon.code,
          },
        });

        const usageLimitPerUser = coupon.usageLimitPerUser || Infinity;

        let isDateValid = true;
        const startDate = this.getUTCDate(coupon.startDate);
        const endDate = this.getUTCDate(coupon.endDate);

        if (startDate && now < startDate) isDateValid = false;
        if (endDate && now > endDate) isDateValid = false;

        const isStatusValid = coupon.status === CouponStatus.ACTIVE;
        const isGlobalLimitValid =
          !coupon.usageLimit || coupon.redemptionCount < coupon.usageLimit;
        const isUserLimitValid = usageCount < usageLimitPerUser;

        let isEligibleAsNewUser: boolean = false;
        let isNewUserConstraintValid: boolean = true;

        if (coupon.targetAudience === 'new' || coupon.source === 'referral_joinee') {
          const existingOrders = await this.orderRepository.count({
            where: [{ customer: user_uid }],
          });
          if (existingOrders === 0) {
            isEligibleAsNewUser = true;
          } else {
            isNewUserConstraintValid = false;
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

  async validateCouponDetailed(
    code: string,
    user_uid: string,
    orderAmount?: number,
  ): Promise<CouponValidationResponseDto> {
    const coupon = await this.couponsRepository.findOne({ where: { code } });
    const now = this.getCurrentUTCDate();

    if (!coupon) {
      this.logger.warn({
        couponId: null,
        code,
        userId: user_uid,
        orderAmount,
        reason: 'NOT_FOUND',
        message: 'Coupon not found',
      });
      return {
        isValidForUser: false,
        reason: 'NOT_ELIGIBLE',
        message: 'Coupon not found',
        status: 'Inactive',
        endDate: 'N/A',
      };
    }

    const endDateStr = coupon.endDate
      ? this.getUTCDate(coupon.endDate)!.toISOString()
      : 'N/A';

    // A) STATUS CHECK
    if (coupon.status !== CouponStatus.ACTIVE) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        status: coupon.status,
        endDate: endDateStr,
        reason: 'INACTIVE',
      });
      return {
        isValidForUser: false,
        reason: 'INACTIVE',
        message: `Coupon is ${coupon.status.toLowerCase()}`,
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // B) DATE CHECKS
    const startDate = this.getUTCDate(coupon.startDate);
    const endDate = this.getUTCDate(coupon.endDate);

    if (startDate && now < startDate) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        status: coupon.status,
        startDate: startDate.toISOString(),
        currentDate: now.toISOString(),
        reason: 'NOT_YET_ACTIVE',
      });
      return {
        isValidForUser: false,
        reason: 'NOT_ELIGIBLE',
        message: `Coupon will be active on ${startDate.toISOString().split('T')[0]}`,
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    if (endDate && now > endDate) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        status: coupon.status,
        endDate: endDate.toISOString(),
        currentDate: now.toISOString(),
        reason: 'EXPIRED',
      });
      return {
        isValidForUser: false,
        reason: 'EXPIRED',
        message: `Coupon expired on ${endDate.toISOString().split('T')[0]}`,
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // C) MIN ORDER CHECK
    if (orderAmount !== undefined && orderAmount < Number(coupon.minOrderValue)) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        minOrderValue: Number(coupon.minOrderValue),
        reason: 'MIN_ORDER_NOT_MET',
      });
      return {
        isValidForUser: false,
        reason: 'MIN_ORDER_NOT_MET',
        message: `Minimum order value of ${coupon.minOrderValue} required. Current: ${orderAmount}`,
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // D) USER LIMIT CHECK
    const userUsage = await this.getUsageCountForUser(code, user_uid);
    if (coupon.usageLimitPerUser && userUsage >= coupon.usageLimitPerUser) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        userUsage,
        usageLimitPerUser: coupon.usageLimitPerUser,
        reason: 'USER_LIMIT_REACHED',
      });
      return {
        isValidForUser: false,
        reason: 'USER_LIMIT_REACHED',
        message: `You have already used this coupon ${userUsage} times (Limit: ${coupon.usageLimitPerUser})`,
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // E) TOTAL LIMIT CHECK
    if (coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        orderAmount,
        redemptionCount: coupon.redemptionCount,
        usageLimit: coupon.usageLimit,
        reason: 'LIMIT_REACHED',
      });
      return {
        isValidForUser: false,
        reason: 'LIMIT_REACHED',
        message: 'Coupon usage limit reached',
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // Private coupon check
    if (coupon.assigned_to_uid && coupon.assigned_to_uid !== user_uid) {
      this.logger.log({
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        assignedTo: coupon.assigned_to_uid,
        reason: 'NOT_AUTHORIZED',
      });
      return {
        isValidForUser: false,
        reason: 'NOT_ELIGIBLE',
        message: 'This coupon is not valid for your account',
        status: coupon.status,
        endDate: endDateStr,
      };
    }

    // F) TARGET AUDIENCE CHECK
    if (coupon.source === 'referral_joinee') {
      const orderCount = await this.orderRepository.count({
        where: { customer: user_uid },
      });
      if (orderCount > 0) {
        this.logger.log({
          couponId: coupon.id,
          code: coupon.code,
          userId: user_uid,
          orderAmount,
          orderCount,
          reason: 'NOT_ELIGIBLE',
        });
        return {
          isValidForUser: false,
          reason: 'NOT_ELIGIBLE',
          message: 'This coupon is only valid on your first order',
          status: coupon.status,
          endDate: endDateStr,
        };
      }
    }

    if (coupon.targetAudience === 'new' && !coupon.source) {
      const existingOrders = await this.orderRepository.count({
        where: [{ customer: user_uid }],
      });
      if (existingOrders > 0) {
        this.logger.log({
          couponId: coupon.id,
          code: coupon.code,
          userId: user_uid,
          orderAmount,
          orderCount: existingOrders,
          reason: 'NOT_ELIGIBLE',
        });
        return {
          isValidForUser: false,
          reason: 'NOT_ELIGIBLE',
          message: 'This coupon is only valid for new users',
          status: coupon.status,
          endDate: endDateStr,
        };
      }
    }

    // SUCCESS CASE
    const discountAmount =
      orderAmount !== undefined ? this.calculateDiscount(coupon, orderAmount) : 0;
    const finalAmount =
      orderAmount !== undefined
        ? Number((orderAmount - discountAmount).toFixed(2))
        : 0;

    this.logger.log({
      couponId: coupon.id,
      code: coupon.code,
      userId: user_uid,
      orderAmount,
      discountAmount,
      finalAmount,
      reason: null,
    });

    return {
      isValidForUser: true,
      reason: null,
      message: 'Coupon applied successfully',
      status: coupon.status,
      endDate: endDateStr,
      discountAmount: orderAmount !== undefined ? discountAmount : undefined,
      finalAmount: orderAmount !== undefined ? finalAmount : undefined,
    };
  }

  async validateCouponForUser(
    code: string,
    user_uid: string,
    orderAmount?: number,
  ): Promise<void> {
    const result = await this.validateCouponDetailed(code, user_uid, orderAmount);
    if (!result.isValidForUser) {
      throw new ConflictException(result.message || 'Coupon validation failed');
    }
  }

  async getUsageCountForUser(code: string, user_uid: string): Promise<number> {
    return await this.orderRepository.count({
      where: {
        customer: user_uid,
        coupon_code: code,
      },
    });
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
        c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
        c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
      ].join(',');
    });
    return header + rows.join('\n');
  }

  async redeemCoupon(code: string): Promise<void> {
    const result = await this.couponsRepository
      .createQueryBuilder()
      .update(Coupon)
      .set({
        redemptionCount: () => 'redemptionCount + 1',
        status: () =>
          `CASE WHEN (redemptionCount + 1) >= usageLimit AND usageLimit IS NOT NULL THEN '${CouponStatus.INACTIVE}' ELSE status END`,
      })
      .where({ code })
      .andWhere('(usageLimit IS NULL OR redemptionCount < usageLimit)')
      .execute();

    if (result.affected === 0) {
      this.logger.warn(
        `Coupon ${code} redemption skipped - usage limit reached or coupon not found.`,
      );
    } else {
      const updated = await this.couponsRepository.findOne({ where: { code } });
      this.logger.log(`Coupon ${code} redeemed. New count: ${updated?.redemptionCount}`);
    }
  }
}
