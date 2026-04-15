import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fleet } from './entity/fleet.entity';
import { WorkingHour } from './entity/working-hour.entity';

@Injectable()
export class WorkingHoursService {
  constructor(
    @InjectRepository(WorkingHour)
    private readonly operationalHourRepo: Repository<WorkingHour>,

    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
  ) {}

  /**
   * 🔹 Generate default timings (9:00 PM to 11:00 PM, all days open)
   */
  private getDefaultOperationalHours(fleetUid: string): Partial<WorkingHour>[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      day,
      enabled: true,
      from: '21:00', // 9:00 PM
      to: '23:00', // 11:00 PM
      fleetUid,
    }));
  }

  /**
   * 🔹 Create default operational hours for a fleet
   */
  async createDefaultHours(fleetUid: string): Promise<WorkingHour[]> {
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleetUid } });
    if (!fleet) {
      throw new NotFoundException(`Fleet with UID ${fleetUid} not found`);
    }

    const defaultHours = this.getDefaultOperationalHours(fleetUid);
    const operationalHours = this.operationalHourRepo.create(
      defaultHours.map((h) => ({
        ...h,
        fleet,
      })),
    );

    return await this.operationalHourRepo.save(operationalHours);
  }

  /**
   * 🔹 Create or update fleet’s operational hours manually
   */
  async upsertHours(fleetUid: string, hours: Partial<WorkingHour>[]): Promise<WorkingHour[]> {
    const fleet = await this.fleetRepo.findOne({
      where: { uid: fleetUid },
    });
    if (!fleet) {
      throw new NotFoundException(`Fleet with UID ${fleetUid} not found`);
    }

    // Delete existing hours first
    await this.operationalHourRepo.delete({ fleetUid });

    const newHours = this.operationalHourRepo.create(
      hours.map((h) => ({
        ...h,
        fleet,
        fleetUid,
      })),
    );

    return await this.operationalHourRepo.save(newHours);
  }

  /**
   * 🔹 Get all operational hours for a fleet
   */
  async getHoursByRestaurant(fleetUid: string): Promise<WorkingHour[]> {
    const hours = await this.operationalHourRepo.find({
      where: { fleetUid },
      order: { id: 'ASC' },
    });

    if (!hours.length) {
      throw new NotFoundException(`No operational hours found for ${fleetUid}`);
    }

    return hours;
  }

  /**
   * 🔹 Update a single day's timing
   */
  async updateSingleDay(
    fleetUid: string,
    day: string,
    data: Partial<WorkingHour>,
  ): Promise<WorkingHour> {
    const record = await this.operationalHourRepo.findOne({
      where: { fleetUid, day },
    });

    if (!record) {
      throw new NotFoundException(`No timing found for ${day} in fleet ${fleetUid}`);
    }

    Object.assign(record, data);
    return await this.operationalHourRepo.save(record);
  }

  /**
   * 🔹 Delete all operational hours for a fleet
   */
  async deleteByRestaurant(fleetUid: string): Promise<void> {
    await this.operationalHourRepo.delete({ fleetUid });
  }
}
