import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Coupon, CouponStatus } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Order } from 'src/orders/order.entity';
import { CouponValidationResponseDto } from './dto/coupon-validation-response.dto';

export type ValidationFailureReason =
  | 'EXPIRED'
  | 'INACTIVE'
  | 'ALREADY_USED'
  | 'NOT_ELIGIBLE'
  | 'USAGE_LIMIT_REACHED'
  | 'NOT_YET_ACTIVE'
  | 'NOT_AUTHORIZED';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) { }

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

  private getUTCDateString(date: Date | string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  }

  private getCurrentUTCDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async findAll(search?: string, status?: string, user_uid?: string, isAdmin: boolean = false): Promise<any[]> {
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

    if (user_uid) {
      queryBuilder.andWhere(
        '(coupon.source IS NULL OR coupon.assigned_to_uid = :uid)',
        { uid: user_uid },
      );

      if (!isAdmin) {
        queryBuilder.andWhere('coupon.status = :activeStatus', { activeStatus: CouponStatus.ACTIVE });
      }
    } else {
      queryBuilder.andWhere('coupon.source IS NULL');
    }

    queryBuilder.orderBy('coupon.createdAt', 'DESC');
    const coupons = await queryBuilder.getMany();

    if (user_uid) {
      const results: any[] = [];
      const nowStr = this.getCurrentUTCDateString();

      for (const coupon of coupons) {
        const usageCount = await this.orderRepository.count({
          where: {
            customer: user_uid,
            coupon_code: coupon.code,
          },
        });

        const usageLimitPerUser = coupon.usageLimitPerUser || Infinity;

        let isDateValid = true;
        if (coupon.startDate) {
          const startDateStr = this.getUTCDateString(coupon.startDate);
          if (startDateStr && nowStr < startDateStr) isDateValid = false;
        }
        if (coupon.endDate) {
          const endDateStr = this.getUTCDateString(coupon.endDate);
          if (endDateStr && nowStr > endDateStr) isDateValid = false;
        }

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

  async validateCouponDetailed(code: string, user_uid: string): Promise<CouponValidationResponseDto> {
    const coupon = await this.couponsRepository.findOne({ where: { code } });
    const currentDateStr = this.getCurrentUTCDateString();

    if (!coupon) {
      this.logger.warn({ code, user_uid, reason: 'NOT_FOUND', message: 'Coupon not found' });
      return {
        valid: false,
        reason: 'NOT_ELIGIBLE',
        message: 'Coupon not found',
      };
    }

    const endDateStr = this.getUTCDateString(coupon.endDate) || 'N/A';
    const startDateStr = this.getUTCDateString(coupon.startDate);

    // A) STATUS CHECK
    if (coupon.status !== CouponStatus.ACTIVE) {
      const logData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        status: coupon.status,
        endDate: endDateStr,
        currentDate: currentDateStr,
        reason: 'INACTIVE',
      };
      this.logger.log(logData);
      return {
        valid: false,
        reason: 'INACTIVE',
        message: `Coupon is ${coupon.status.toLowerCase()}`,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderValue: Number(coupon.minOrderValue),
          maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
        },
      };
    }

    // B) DATE CHECKS
    if (startDateStr && currentDateStr < startDateStr) {
      const logData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        status: coupon.status,
        startDate: startDateStr,
        currentDate: currentDateStr,
        reason: 'NOT_YET_ACTIVE',
      };
      this.logger.log(logData);
      return {
        valid: false,
        reason: 'NOT_YET_ACTIVE',
        message: `Coupon will be active on ${startDateStr}`,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderValue: Number(coupon.minOrderValue),
          maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
        },
      };
    }

    if (coupon.endDate) {
      const endDateStrCheck = this.getUTCDateString(coupon.endDate);
      if (endDateStrCheck && currentDateStr > endDateStrCheck) {
        const logData = {
          couponId: coupon.id,
          code: coupon.code,
          userId: user_uid,
          status: coupon.status,
          endDate: endDateStrCheck,
          currentDate: currentDateStr,
          reason: 'EXPIRED',
        };
        this.logger.log(logData);
        return {
          valid: false,
          reason: 'EXPIRED',
          message: `Coupon expired on ${endDateStrCheck}`,
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderValue: Number(coupon.minOrderValue),
            maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
          },
        };
      }
    }

    // Check global usage limit
    if (coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit) {
      const logData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        status: coupon.status,
        redemptionCount: coupon.redemptionCount,
        usageLimit: coupon.usageLimit,
        reason: 'USAGE_LIMIT_REACHED',
      };
      this.logger.log(logData);
      return {
        valid: false,
        reason: 'USAGE_LIMIT_REACHED',
        message: 'Coupon usage limit reached',
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderValue: Number(coupon.minOrderValue),
          maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
        },
      };
    }

    // Private coupon check
    if (coupon.assigned_to_uid && coupon.assigned_to_uid !== user_uid) {
      const logData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        assignedTo: coupon.assigned_to_uid,
        reason: 'NOT_AUTHORIZED',
      };
      this.logger.log(logData);
      return {
        valid: false,
        reason: 'NOT_AUTHORIZED',
        message: 'This coupon is not valid for your account',
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderValue: Number(coupon.minOrderValue),
          maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
        },
      };
    }

    // Joinee coupon - first order only
    if (coupon.source === 'referral_joinee') {
      const orderCount = await this.orderRepository.count({
        where: { customer: user_uid },
      });
      if (orderCount > 0) {
        const logData = {
          couponId: coupon.id,
          code: coupon.code,
          userId: user_uid,
          orderCount,
          reason: 'NOT_ELIGIBLE',
        };
        this.logger.log(logData);
        return {
          valid: false,
          reason: 'NOT_ELIGIBLE',
          message: 'This coupon is only valid on your first order',
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderValue: Number(coupon.minOrderValue),
            maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
          },
        };
      }
    }

    // User usage limit check
    const userUsage = await this.getUsageCountForUser(code, user_uid);
    if (coupon.usageLimitPerUser && userUsage >= coupon.usageLimitPerUser) {
      const logData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user_uid,
        userUsage,
        usageLimitPerUser: coupon.usageLimitPerUser,
        reason: 'ALREADY_USED',
      };
      this.logger.log(logData);
      return {
        valid: false,
        reason: 'ALREADY_USED',
        message: `You have already used this coupon ${userUsage} times (Limit: ${coupon.usageLimitPerUser})`,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderValue: Number(coupon.minOrderValue),
          maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
        },
      };
    }

    // New user target audience check
    if (coupon.targetAudience === 'new' && !coupon.source) {
      const existingOrders = await this.orderRepository.count({
        where: [{ customer: user_uid }],
      });
      if (existingOrders > 0) {
        const logData = {
          couponId: coupon.id,
          code: coupon.code,
          userId: user_uid,
          orderCount: existingOrders,
          reason: 'NOT_ELIGIBLE',
        };
        this.logger.log(logData);
        return {
          valid: false,
          reason: 'NOT_ELIGIBLE',
          message: 'This coupon is only valid for new users',
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderValue: Number(coupon.minOrderValue),
            maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
          },
        };
      }
    }

    // All checks passed
    this.logger.log({
      couponId: coupon.id,
      code: coupon.code,
      userId: user_uid,
      reason: 'VALID',
    });

    return {
      valid: true,
      reason: null,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderValue: Number(coupon.minOrderValue),
        maxDiscountCap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : undefined,
      },
    };
  }

  async validateCouponForUser(code: string, user_uid: string): Promise<void> {
    const result = await this.validateCouponDetailed(code, user_uid);
    if (!result.valid) {
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
        c.startDate ? c.startDate.toISOString().split('T')[0] : '',
        c.endDate ? c.endDate.toISOString().split('T')[0] : '',
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
        status: () => `CASE WHEN (redemptionCount + 1) >= usageLimit AND usageLimit IS NOT NULL THEN '${CouponStatus.INACTIVE}' ELSE status END`,
      })
      .where({ code })
      .andWhere('(usageLimit IS NULL OR redemptionCount < usageLimit)')
      .execute();

    if (result.affected === 0) {
      this.logger.warn(`Coupon ${code} redemption skipped - usage limit reached or coupon not found.`);
    } else {
      const updated = await this.couponsRepository.findOne({ where: { code } });
      this.logger.log(`Coupon ${code} redeemed. New count: ${updated?.redemptionCount}`);
    }
  }
}
