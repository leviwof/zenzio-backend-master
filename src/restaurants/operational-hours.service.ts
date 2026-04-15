import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entity/restaurant.entity';
import { OperationalHour } from './entity/operational_hour.entity';

@Injectable()
export class OperationalHoursService {
  constructor(
    @InjectRepository(OperationalHour)
    private readonly operationalHourRepo: Repository<OperationalHour>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  /**
   * 🔹 Generate default timings (9:00 PM to 11:00 PM, all days open)
   */
  private getDefaultOperationalHours(restaurantUid: string): Partial<OperationalHour>[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      day,
      enabled: true,
      from: '21:00', // 9:00 PM
      to: '23:00', // 11:00 PM
      restaurantUid,
    }));
  }

  /**
   * 🔹 Create default operational hours for a restaurant
   */
  async createDefaultHours(restaurantUid: string): Promise<OperationalHour[]> {
    const restaurant = await this.restaurantRepo.findOne({ where: { uid: restaurantUid } });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with UID ${restaurantUid} not found`);
    }

    const defaultHours = this.getDefaultOperationalHours(restaurantUid);
    const operationalHours = this.operationalHourRepo.create(
      defaultHours.map((h) => ({
        ...h,
        restaurant,
      })),
    );

    return await this.operationalHourRepo.save(operationalHours);
  }

  /**
   * 🔹 Create or update restaurant’s operational hours manually
   */
  async upsertHours(
    restaurantUid: string,
    hours: Partial<OperationalHour>[],
  ): Promise<OperationalHour[]> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { uid: restaurantUid },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with UID ${restaurantUid} not found`);
    }

    // Delete existing hours first
    await this.operationalHourRepo.delete({ restaurantUid });

    const newHours = this.operationalHourRepo.create(
      hours.map((h) => ({
        ...h,
        restaurant,
        restaurantUid,
      })),
    );

    return await this.operationalHourRepo.save(newHours);
  }

  /**
   * 🔹 Get all operational hours for a restaurant
   */
  async getHoursByRestaurant(restaurantUid: string): Promise<OperationalHour[]> {
    const hours = await this.operationalHourRepo.find({
      where: { restaurantUid },
      order: { id: 'ASC' },
    });

    if (!hours.length) {
      throw new NotFoundException(`No operational hours found for ${restaurantUid}`);
    }

    return hours;
  }

  /**
   * 🔹 Update a single day's timing
   */
  async updateSingleDay(
    restaurantUid: string,
    day: string,
    data: Partial<OperationalHour>,
  ): Promise<OperationalHour> {
    const record = await this.operationalHourRepo.findOne({
      where: { restaurantUid, day },
    });

    if (!record) {
      throw new NotFoundException(`No timing found for ${day} in restaurant ${restaurantUid}`);
    }

    Object.assign(record, data);
    return await this.operationalHourRepo.save(record);
  }

  /**
   * 🔹 Delete all operational hours for a restaurant
   */
  async deleteByRestaurant(restaurantUid: string): Promise<void> {
    await this.operationalHourRepo.delete({ restaurantUid });
  }
}
