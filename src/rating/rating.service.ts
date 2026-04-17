import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
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
} from './rating.dto';

import { DataSource } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Restaurant } from '../restaurants/entity/restaurant.entity';
import { Fleet } from '../fleet-v2/entity/fleet.entity';
import { SubmitOrderRatingDto } from './rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
    private readonly dataSource: DataSource,
  ) {}

  // Helper: get or create by group_id
  private async getOrCreateByGroup(group_id: string): Promise<Rating> {
    let rating = await this.ratingRepo.findOne({ where: { group_id } });

    if (!rating) {
      rating = this.ratingRepo.create({ group_id });
      rating = await this.ratingRepo.save(rating);
    }

    return rating;
  }

  // ========= GENERAL QUERIES =========

  async findAll(): Promise<Rating[]> {
    return this.ratingRepo.find();
  }

  async findByGroup(group_id: string): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({ where: { group_id } });
    if (!rating) throw new NotFoundException('Rating for this group not found');
    return rating;
  }

  // ========= SPECIFIC RATING APIs =========

  async rateCustRestaurant(dto: CustRestaurantRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.cust_restaurant = dto.rating;
    entity.cust_restaurant_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateCustFleet(dto: CustFleetRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.cust_fleet = dto.rating;
    entity.cust_fleet_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateFleetCust(dto: FleetCustRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.fleet_cust = dto.rating;
    entity.fleet_cust_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateFleetRest(dto: FleetRestRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.fleet_rest = dto.rating;
    entity.fleet_rest_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateRestFleet(dto: RestFleetRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.rest_fleet = dto.rating;
    entity.rest_fleet_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateRestCust(dto: RestCustRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.rest_cust = dto.rating;
    entity.rest_cust_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateCusApp(dto: CusAppRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.cus_app = dto.rating;
    entity.cus_app_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateRestApp(dto: RestAppRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.rest_app = dto.rating;
    entity.rest_app_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  async rateFleetApp(dto: FleetAppRatingDto): Promise<Rating> {
    const entity = await this.getOrCreateByGroup(dto.group_id);
    entity.fleet_app = dto.rating;
    entity.fleet_app_desc = dto.description ?? null;
    return this.ratingRepo.save(entity);
  }

  // ========= SCALABLE RATING TRANSACTION =========

  async submitOrderRating(dto: SubmitOrderRatingDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.restaurantRating === undefined || dto.restaurantRating === null) {
        throw new Error('Restaurant rating is missing');
      }
      // Force conversion to number in case it comes as string
      const finalRestRating = Number(dto.restaurantRating);

      // 1. Validate Order
      // Use queryRunner manager to ensure consistency if we were locking, but simple read is fine here
      // primarily we want the write locks later.
      const order = await queryRunner.manager.findOne(Order, {
        where: { orderId: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException(`Order ${dto.orderId} not found`);
      }

      // Check Status
      const status = order.status?.toLowerCase();
      const deliveryStatus = order.deliveryPartnerStatus?.toLowerCase();

      if (status !== 'completed' && deliveryStatus !== 'delivered') {
        throw new NotFoundException(
          `Order must be delivered before rating. Status: ${status}, Delivery: ${deliveryStatus}`,
        );
      }

      console.log(
        `[Rating] Order validated: ${order.orderId}, Rest: ${order.restaurant_uid}, Driver: ${order.delivery_partner_uid}`,
      );

      // 2. Check if already rated
      const existingRating = await queryRunner.manager.findOne(Rating, {
        where: { order_id: dto.orderId },
      });

      let diffRestaurantRating = finalRestRating;
      let diffDriverRating = dto.driverRating ?? 0;
      let isUpdate = false;
      let ratingEntity: Rating;

      if (existingRating) {
        console.log(`[Rating] Updating existing rating for order ${dto.orderId}`);
        // Calculate difference for aggregation
        // If updating, SUBTRACT old value and ADD new value. Or just add (new - old).
        // diff = new - old
        if (isNaN(finalRestRating)) {
          throw new Error(`Restaurant rating is not a number: ${dto.restaurantRating}`);
        }

        diffRestaurantRating = finalRestRating - (existingRating.cust_restaurant || 0);

        // If driver rating was previously set, subtract it. If it was 0/null, subtract 0.
        // If new driver rating is provided, use it.
        const oldDriverRating = existingRating.cust_fleet || 0;
        const newDriverRating = dto.driverRating && !isNaN(dto.driverRating) ? dto.driverRating : 0;
        diffDriverRating = newDriverRating - oldDriverRating;

        isUpdate = true;
        ratingEntity = existingRating;
      } else {
        // Create new
        ratingEntity = new Rating();
        ratingEntity.order_id = dto.orderId;
        ratingEntity.group_id = dto.orderId; // Backward compatibility
        ratingEntity.restaurant_id = order.restaurant_uid;
        ratingEntity.driver_id = order.delivery_partner_uid;
      }

      // Update Entity Fields
      ratingEntity.cust_restaurant = finalRestRating;
      ratingEntity.cust_restaurant_desc = dto.restaurantReview ?? null;
      ratingEntity.cust_fleet = dto.driverRating ?? 0;
      ratingEntity.cust_fleet_desc = dto.driverReview ?? null;

      // Save Rating
      await queryRunner.manager.save(ratingEntity);

      // 4. Update Restaurant Aggregation
      if (order.restaurant_uid) {
        // Update sum by difference
        await queryRunner.manager.increment(
          Restaurant,
          { uid: order.restaurant_uid },
          'rating_sum',
          diffRestaurantRating,
        );

        // Only increment count if it's a NEW rating
        if (!isUpdate) {
          await queryRunner.manager.increment(
            Restaurant,
            { uid: order.restaurant_uid },
            'rating_count',
            1,
          );
        }

        // Recalculate Average
        // Cast to numeric to avoid "NaN" being passed to SQL or strings being concatenated
        await queryRunner.query(`
          UPDATE restaurants
          SET rating_avg = CASE 
            WHEN COALESCE(rating_count, 0) > 0 THEN COALESCE(rating_sum, 0) / COALESCE(rating_count, 1) 
            ELSE 0 
          END
          WHERE uid = '${order.restaurant_uid}'
        `);
        console.log(
          `[Rating] Restaurant ${order.restaurant_uid} updated. Diff: ${diffRestaurantRating}`,
        );
      }

      // 5. Update Delivery Partner Aggregation
      if (order.delivery_partner_uid) {
        // For driver, we only update if:
        // A) It's a new rating and driverRating is provided (>0)
        // B) It's an update. Even if new rating is 0, we might need to "remove" the old rating score.
        //    (Assuming 0 means "no rating" or "bad rating"? Usually 0 means not rated in this logic if strictly optional)
        //    However, if the user explicitly sends 0, it might skew avg if we count it.
        //    Let's assume standard logic:
        //    - If isUpdate: modify sum by diff.
        //    - If !isUpdate: modify sum by value, count by 1 (if value > 0). NOTE: if value is 0 on creation, we shouldn't count it?
        //    The original code incremented count regardless of value? No, original had `if (typeof dto.driverRating === 'number')` check but inside likely incremented.

        // Let's refine driver count logic:
        // If !isUpdate and newRating > 0: increment count.
        // If isUpdate: We assume count doesn't change unless we handle "un-rating" which is complex. Let's assume count is stable for update.

        const newDriverRating = dto.driverRating ?? 0;

        // Update Sum
        if (diffDriverRating !== 0) {
          await queryRunner.manager.increment(
            Fleet,
            { uid: order.delivery_partner_uid },
            'rating_sum',
            diffDriverRating,
          );
        }

        // Update Count (Only for new ratings that are actual ratings)
        // If previous code allowed 0 rating to count, we stick to that.
        // Original code: `if (... && typeof dto.driverRating === 'number') { increment count }`. So even 0 counted.
        if (!isUpdate && typeof dto.driverRating === 'number') {
          await queryRunner.manager.increment(
            Fleet,
            { uid: order.delivery_partner_uid },
            'rating_count',
            1,
          );
        }

        // Recalculate Average
        await queryRunner.query(`
          UPDATE fleets
          SET rating_avg = CASE 
            WHEN COALESCE(rating_count, 0) > 0 THEN COALESCE(rating_sum, 0) / COALESCE(rating_count, 1) 
            ELSE 0 
          END
          WHERE uid = '${order.delivery_partner_uid}'
        `);
        console.log(
          `[Rating] Driver ${order.delivery_partner_uid} aggregation updated. Diff: ${diffDriverRating}`,
        );
      }

      await queryRunner.commitTransaction();

      return { message: 'Rating submitted successfully', rating: ratingEntity };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
