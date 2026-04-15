import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReferral } from './referral.entity';
import { User } from 'src/users/user.entity';
import { CouponsService } from 'src/coupons/coupons.service';
import { DiscountType, CouponStatus } from 'src/coupons/coupon.entity';
import { Order } from 'src/orders/order.entity';

@Injectable()
export class ReferralService implements OnModuleInit {
    constructor(
        @InjectRepository(UserReferral)
        private readonly referralRepo: Repository<UserReferral>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        private readonly couponsService: CouponsService,
    ) { }

    async onModuleInit() {
        try {
            await this.referralRepo.query(`
                ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refer_code" varchar UNIQUE;
                ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" varchar;
                ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "assigned_to_uid" varchar;
                ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS source varchar;
                CREATE TABLE IF NOT EXISTS user_referrals (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    referrer_uid varchar NOT NULL,
                    referred_uid varchar NOT NULL,
                    is_rewarded boolean DEFAULT false,
                    reward_coupon_code varchar,
                    "createdAt" timestamp DEFAULT now()
                );
            `);
            console.log("✅ [Referral Migration] refer and earn columns and table ready");
        } catch (error) {
            console.warn("⚠️ [Referral Migration] Error:", (error as any)?.message || error);
        }
    }


    // ─── Generate a unique refer_code and save it to the user ──────────────────

    async generateAndSaveReferCode(userUid: string): Promise<string> {
        const referCode = this.generateUniqueReferCode(userUid);
        await this.userRepo.update({ uid: userUid }, { refer_code: referCode });
        return referCode;
    }

    private generateUniqueReferCode(userUid: string): string {
        // e.g. REF-2UsR-XYZ9
        // const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        // const uidPart = userUid.slice(-4).toUpperCase();
        // return `REF-${uidPart}-${randomPart}`;
        return `REF${userUid}`;
    }

    // ─── Pure Validation Hook (Before Signup) ──────────────────────────────────

    async validateReferCode(referCode: string): Promise<void> {
        const referrer = await this.userRepo.findOne({
            where: { refer_code: referCode },
        });
        if (!referrer) {
            throw new BadRequestException('Invalid referral code');
        }
    }

    // ─── Apply a refer code at signup ──────────────────────────────────────────
    // - Validates the code
    // - Saves referred_by on the new user
    // - Creates a private joinee coupon for the new user
    // - Creates a UserReferral tracking record

    async applyReferCode(newUserUid: string, referCode: string): Promise<void> {
        const referrer = await this.userRepo.findOne({
            where: { refer_code: referCode },
        });

        if (!referrer) {
            throw new BadRequestException('Invalid referral code');
        }

        if (referrer.uid === newUserUid) {
            throw new BadRequestException('You cannot use your own referral code');
        }

        // Check if this user was already referred
        const alreadyReferred = await this.referralRepo.findOne({
            where: { referred_uid: newUserUid },
        });
        if (alreadyReferred) return;

        // Save referred_by on new user
        await this.userRepo.update({ uid: newUserUid }, { referred_by: referCode });

        // Create tracking record
        const referral = this.referralRepo.create({
            referrer_uid: referrer.uid,
            referred_uid: newUserUid,
            is_rewarded: false,
        });
        await this.referralRepo.save(referral);

        // Issue private joinee coupon to new user
        await this.issueJoineeCoupon(newUserUid);

        console.log(
            `✅ [Referral] ${newUserUid} joined via ${referrer.uid}'s code. Joinee coupon issued.`,
        );
    }

    // ─── Handle order delivered ─────────────────────────────────────────────────
    // Called when a user's order is marked delivered.
    // If this is the referred user's FIRST delivered order, reward the referrer.

    async handleOrderDelivered(customerUid: string, orderId: string): Promise<void> {
        try {
            // Is this customer a referred user?
            const referral = await this.referralRepo.findOne({
                where: { referred_uid: customerUid, is_rewarded: false },
            });

            if (!referral) return; // Not a referred user, or already rewarded

            // Is this their first completed (delivered) order?
            const deliveredOrderCount = await this.orderRepo.count({
                where: { customer: customerUid, deliveryPartnerStatus: 'delivered' },
            });

            // deliveredOrderCount === 1 means THIS is the first delivered order
            // (the current order was already updated before this hook runs)
            if (deliveredOrderCount !== 1) return;

            // Issue reward coupon to referrer
            const couponCode = await this.issueRewardCoupon(referral.referrer_uid);

            // Mark referral as rewarded
            referral.is_rewarded = true;
            referral.reward_coupon_code = couponCode;
            await this.referralRepo.save(referral);

            console.log(
                `✅ [Referral] Referrer ${referral.referrer_uid} rewarded! Coupon: ${couponCode}`,
            );
        } catch (error) {
            // Never block order flow
            console.error('[Referral] handleOrderDelivered error:', error);
        }
    }

    // ─── Get referral stats for a user ─────────────────────────────────────────

    async getReferralStats(userUid: string) {
        const user = await this.userRepo.findOne({ where: { uid: userUid } });
        if (!user) throw new BadRequestException('User not found');

        // Lazy-generate code for legacy users who don't have one
        let refer_code = user.refer_code;
        if (!refer_code) {
            console.log(`[Referral] Generating missing refer_code for legacy user: ${user.uid}`);
            refer_code = await this.generateAndSaveReferCode(user.uid);
        }

        const refer_link = `${process.env.APP_BASE_URL ?? 'https://app.zenzio.in'}/signup?ref=${refer_code}`;

        const referrals = await this.referralRepo.find({
            where: { referrer_uid: userUid },
        });

        const total_referrals = referrals.length;
        const rewarded_count = referrals.filter((r) => r.is_rewarded).length;
        const pending_count = total_referrals - rewarded_count;

        return {
            refer_code,
            refer_link,
            total_referrals,
            rewarded_count,
            pending_count,
        };
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private async issueJoineeCoupon(userUid: string): Promise<string> {
        // e.g. JN3XY9Z
        const code = `JN${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await this.couponsService.create({
            code,
            name: 'Welcome Referral Discount',
            description: 'Exclusive discount for joining via a referral link. Valid on your first order only.',
            discountType: DiscountType.FIXED,
            discountValue: 50,
            minOrderValue: 250,
            usageLimitPerUser: 1,
            usageLimit: 1,
            assigned_to_uid: userUid,
            source: 'referral_joinee',
            status: CouponStatus.ACTIVE,
        });
        return code;
    }

    private async issueRewardCoupon(referrerUid: string): Promise<string> {
        // e.g. RW3XY9Z
        const code = `RW${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await this.couponsService.create({
            code,
            name: 'Referral Reward',
            description: 'Thank you for referring a friend! Valid on any order.',
            discountType: DiscountType.FIXED,
            discountValue: 50,
            minOrderValue: 250,
            usageLimitPerUser: 1,
            usageLimit: 1,
            assigned_to_uid: referrerUid,
            source: 'referral_reward',
            status: CouponStatus.ACTIVE,
        });
        return code;
    }
}
