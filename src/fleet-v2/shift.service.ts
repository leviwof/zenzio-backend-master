import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fleet } from './entity/fleet.entity';
import { FleetProfile } from './entity/fleet_profile.entity';
import { FleetContact } from './entity/fleet_contact.entity';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { AdminUpdateShiftDto } from './dto/admin-update-shift.dto';
import { SHIFTS, getShiftById } from 'src/constants/shifts.constant';

const convert12to24 = (time12h: string): string => {
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12h;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
    @InjectRepository(FleetProfile)
    private readonly fleetProfileRepo: Repository<FleetProfile>,
    @InjectRepository(FleetContact)
    private readonly fleetContactRepo: Repository<FleetContact>,
  ) {}

  async assignShift(userId: string, shiftId: string) {
    const fleet = await this.fleetRepo.findOne({
      where: { uid: userId },
      relations: ['profile'],
    });

    if (!fleet) {
      throw new BadRequestException('Fleet partner not found');
    }

    const shift = getShiftById(shiftId);
    if (!shift) {
      throw new BadRequestException(`Invalid shift ID: ${shiftId}`);
    }

    if (fleet.shift_locked && fleet.shift_id) {
      throw new BadRequestException('Shift already assigned. Contact admin to change shift.');
    }

    await this.fleetRepo.update(
      { uid: userId },
      {
        shift_id: shiftId,
        shift_locked: true,
        shift_assigned_at: new Date(),
      },
    );

    if (fleet.profile) {
      await this.fleetProfileRepo.update(
        { fleetUid: userId },
        {
          start_time: convert12to24(shift.start),
          end_time: convert12to24(shift.end),
          break_start_time: undefined,
          break_end_time: undefined,
        },
      );
    }

    return {
      status: 'success',
      message: 'Shift assigned successfully',
      data: {
        userId,
        shiftId,
        shiftName: shift.name,
        locked: true,
        assignedAt: new Date().toISOString(),
      },
    };
  }

  async getShiftConfig() {
    return {
      status: 'success',
      data: SHIFTS.map((shift) => ({
        id: shift.id,
        name: shift.name,
        start: shift.start,
        end: shift.end,
        workHours: shift.workHours,
        breakMinutes: shift.breakMinutes,
        breakType: shift.breakType,
      })),
    };
  }

  async getFleetShift(userId: string) {
    const fleet = await this.fleetRepo.findOne({
      where: { uid: userId },
    });

    if (!fleet) {
      throw new BadRequestException('Fleet partner not found');
    }

    if (!fleet.shift_id) {
      return {
        status: 'success',
        data: {
          assigned: false,
          shiftId: null,
          shiftLocked: false,
        },
      };
    }

    const shift = getShiftById(fleet.shift_id);
    return {
      status: 'success',
      data: {
        assigned: true,
        shiftId: fleet.shift_id,
        shiftName: shift?.name,
        locked: fleet.shift_locked,
        assignedAt: fleet.shift_assigned_at,
        startTime: shift?.start,
        endTime: shift?.end,
        workHours: shift?.workHours,
        breakMinutes: shift?.breakMinutes,
      },
    };
  }

  async adminUpdateShift(dto: AdminUpdateShiftDto) {
    const fleet = await this.fleetRepo.findOne({
      where: { uid: dto.userId },
      relations: ['profile'],
    });

    if (!fleet) {
      throw new BadRequestException('Fleet partner not found');
    }

    const updateData: Partial<Fleet> = {};

    if (dto.shiftId !== undefined) {
      if (dto.shiftId) {
        const shift = getShiftById(dto.shiftId);
        if (!shift) {
          throw new BadRequestException(`Invalid shift ID: ${dto.shiftId}`);
        }
        updateData.shift_id = dto.shiftId;
        updateData.shift_locked = dto.locked ?? fleet.shift_locked;
        updateData.shift_assigned_at = fleet.shift_assigned_at || new Date();

        if (fleet.profile) {
          await this.fleetProfileRepo.update(
            { fleetUid: dto.userId },
            {
              start_time: convert12to24(shift.start),
              end_time: convert12to24(shift.end),
              break_start_time: undefined,
              break_end_time: undefined,
            },
          );
        }
      } else {
        updateData.shift_id = undefined;
        updateData.shift_locked = false;
        updateData.shift_assigned_at = undefined;
      }
    }

    if (dto.locked !== undefined) {
      updateData.shift_locked = dto.locked;
    }

    await this.fleetRepo.update({ uid: dto.userId }, updateData);

    const updatedFleet = await this.fleetRepo.findOne({ where: { uid: dto.userId } });
    const shift = updatedFleet?.shift_id ? getShiftById(updatedFleet.shift_id) : null;

    return {
      status: 'success',
      message: 'Shift updated successfully',
      data: {
        userId: dto.userId,
        shiftId: updatedFleet?.shift_id,
        shiftName: shift?.name,
        locked: updatedFleet?.shift_locked,
        assignedAt: updatedFleet?.shift_assigned_at,
      },
    };
  }
}