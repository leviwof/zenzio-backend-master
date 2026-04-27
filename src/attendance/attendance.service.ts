import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceEventType, PunchDto, AttendanceEventLog } from './dto/punch.dto';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
import { getShiftById } from 'src/constants/shifts.constant';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
  ) {}

  
  
  

  
  private getISTDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  }

  
  private getISTDateString(): string {
    return this.getISTDate().toISOString().split('T')[0];
  }

  
  private formatIST(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    const hour = pad(date.getHours());
    const min = pad(date.getMinutes());
    const sec = pad(date.getSeconds());

    return `${year}-${month}-${day}T${hour}:${min}:${sec}+05:30`;
  }

  
  
  
  async punch(fleet_uid: string, dto: PunchDto) {
    const nowIST = this.getISTDate();
    const date = this.getISTDateString();

    let row = await this.attendanceRepo.findOne({
      where: { fleet_uid, date },
    });

    if (!row) {
      row = this.attendanceRepo.create({
        fleet_uid,
        date,
        logs: { events: [] },
      });
    }

    const events = row.logs.events;
    const lastEvent = events[events.length - 1]?.type as AttendanceEventType | undefined;

    
    
    
    switch (dto.event_type) {
      case AttendanceEventType.PUNCH_IN:
        if (lastEvent === AttendanceEventType.PUNCH_IN)
          throw new BadRequestException('Already punched in.');

        // Work Hours Guard - prevent punch in between 11PM and 7AM
        const currentTime = this.getISTDate();
        const currentHour = currentTime.getHours();
        const currentMin = currentTime.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMin;
        const startBlock = 23 * 60;
        const endBlock = 7 * 60;
        if (currentTimeMinutes >= startBlock || currentTimeMinutes < endBlock) {
          throw new BadRequestException('Login/work not allowed between 11PM and 7AM');
        }

        const fleet = await this.fleetRepo.findOne({
          where: { uid: fleet_uid },
          relations: ['profile'],
        });

        if (!fleet?.shift_id) {
          throw new BadRequestException('No shift assigned. Please contact admin to assign a shift first.');
        }

        const shift = getShiftById(fleet.shift_id);
        if (!shift) {
          throw new BadRequestException('Invalid shift configuration. Please contact admin.');
        }

        const parse12HourToMinutes = (timeStr: string): number => {
          const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (!match) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
          }
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const period = match[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const shiftStartMinutes = parse12HourToMinutes(shift.start);
        const shiftEndMinutes = parse12HourToMinutes(shift.end);

        if (currentTimeMinutes < shiftStartMinutes) {
          throw new BadRequestException(`Cannot punch in before your shift starts at ${shift.start}.`);
        }
        if (shiftEndMinutes > shiftStartMinutes && currentTimeMinutes > shiftEndMinutes) {
          throw new BadRequestException(`Cannot punch in after your shift ends at ${shift.end}.`);
        }
        break;

      case AttendanceEventType.PUNCH_OUT:
        if (!lastEvent || lastEvent === AttendanceEventType.PUNCH_OUT)
          throw new BadRequestException('Cannot punch out before punching in.');
        if (lastEvent === AttendanceEventType.BREAK_START)
          throw new BadRequestException('Cannot punch out during break.');
        break;

      case AttendanceEventType.BREAK_START:
        if (!lastEvent) throw new BadRequestException('Must punch in before break.');
        if (lastEvent === AttendanceEventType.BREAK_START)
          throw new BadRequestException('Break already started.');
        if (lastEvent === AttendanceEventType.PUNCH_OUT)
          throw new BadRequestException('Cannot break after logout.');
        break;

      case AttendanceEventType.BREAK_END:
        if (lastEvent !== AttendanceEventType.BREAK_START)
          throw new BadRequestException('No break to end.');

        // Break validation against shift config
        const breakStartEvent = events.find(e => e.type === AttendanceEventType.BREAK_START);
        if (breakStartEvent) {
          const breakStartTime = new Date(breakStartEvent.time).getTime();
          const breakEndTime = new Date(this.formatIST(nowIST)).getTime();
          const breakDurationMinutes = Math.round((breakEndTime - breakStartTime) / 60000);

          const fleetForBreakValidation = await this.fleetRepo.findOne({
            where: { uid: fleet_uid },
          });

          if (fleetForBreakValidation?.shift_id) {
            const shift = getShiftById(fleetForBreakValidation.shift_id);
            if (shift) {
              if (shift.breakType === 'CONTINUOUS') {
                // Full time shifts require exactly 2 hours continuous break
                if (breakDurationMinutes !== shift.breakMinutes) {
                  throw new BadRequestException(
                    `Full time shift requires exactly ${shift.breakMinutes} minutes continuous break. You took ${breakDurationMinutes} minutes.`,
                  );
                }
              } else {
                // Standard shifts allow max 30 mins total break
                if (breakDurationMinutes > shift.breakMinutes) {
                  throw new BadRequestException(
                    `Maximum ${shift.breakMinutes} minutes break allowed. You took ${breakDurationMinutes} minutes.`,
                  );
                }
              }
            }
          }
        }
        break;
    }

    
    
    
    const event: AttendanceEventLog = {
      type: dto.event_type,
      time: this.formatIST(nowIST), 
    };

    events.push(event);
    await this.attendanceRepo.save(row);

    
    
    
    let isActive = false;
    if (
      dto.event_type === AttendanceEventType.PUNCH_IN ||
      dto.event_type === AttendanceEventType.BREAK_END
    ) {
      isActive = true;
    } else {
      isActive = false;
    } 

    await this.fleetRepo.update(
      { uid: fleet_uid },
      {
        isActive: isActive,
        isActive_flag: isActive ? 'Available' : 'Unavailable',
      },
    );

    return row;
  }

  
  
  
  async getDailyLogs(fleet_uid: string, date: string) {
    const row = await this.attendanceRepo.findOne({
      where: { fleet_uid, date },
    });

    if (!row) throw new BadRequestException('No attendance found for this date');
    return row;
  }

  
  
  
  async getMonthlyLogs(fleet_uid: string, year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;

    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear++;
    }

    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    return await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.fleet_uid = :fleet', { fleet: fleet_uid })
      .andWhere('att.date >= :start', { start })
      .andWhere('att.date < :end', { end })
      .orderBy('att.date', 'ASC')
      .getMany();
  }

  
  
  
  
  
  
  private calculateDailyStats(events: any[], targetDate: string) {
    let workMs = 0;
    let breakMs = 0;

    let lastPunchIn: string | null = null;
    let lastBreakStart: string | null = null;

    for (const event of events) {
      const type = event.type as AttendanceEventType;

      switch (type) {
        case AttendanceEventType.PUNCH_IN:
          lastPunchIn = event.time;
          break;

        case AttendanceEventType.BREAK_START:
          if (lastPunchIn) {
            workMs += new Date(event.time).getTime() - new Date(lastPunchIn).getTime();
            lastPunchIn = null;
          }
          lastBreakStart = event.time;
          break;

        case AttendanceEventType.BREAK_END:
          if (lastBreakStart) {
            breakMs += new Date(event.time).getTime() - new Date(lastBreakStart).getTime();
            lastBreakStart = null;
          }
          lastPunchIn = event.time;
          break;

        case AttendanceEventType.PUNCH_OUT:
          if (lastPunchIn) {
            workMs += new Date(event.time).getTime() - new Date(lastPunchIn).getTime();
            lastPunchIn = null;
          }
          if (lastBreakStart) {
            breakMs += new Date(event.time).getTime() - new Date(lastBreakStart).getTime();
            lastBreakStart = null;
          }
          break;
      }
    }

    
    const today = this.getISTDateString();
    if (targetDate === today) {
      
      
      
      const nowMs = new Date().getTime();
      if (lastPunchIn) {
        workMs += nowMs - new Date(lastPunchIn).getTime();
      }
      if (lastBreakStart) {
        breakMs += nowMs - new Date(lastBreakStart).getTime();
      }
    }

    return { workMs, breakMs };
  }

  
  
  
  async getDailySummary(fleet_uid: string, date: string) {
    const row = await this.attendanceRepo.findOne({
      where: { fleet_uid, date },
    });

    
    
    if (!row) throw new BadRequestException('No attendance found.');

    const events = row.logs.events;
    const stats = this.calculateDailyStats(events, date);

    const lastEvent = events.length > 0 ? events[events.length - 1] : null;

    return {
      fleet_uid,
      date,
      working_hours: stats.workMs / 3600000,
      break_hours: stats.breakMs / 3600000,
      working_ms: stats.workMs,
      break_ms: stats.breakMs,
      last_event: lastEvent
        ? {
            type: lastEvent.type,
            time: lastEvent.time,
          }
        : null,
    };
  }

  
  
  async getRangeSummary(fleet_uid: string, startDate: string, endDate: string) {
    console.log(`[RangeSummary] Querying fleet_uid=${fleet_uid}, range=${startDate} to ${endDate}`);
    const rows = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.fleet_uid = :fleet', { fleet: fleet_uid })
      .andWhere('att.date >= :start', { start: startDate })
      .andWhere('att.date <= :end', { end: endDate })
      .orderBy('att.date', 'ASC')
      .getMany();

    console.log(`[RangeSummary] Found ${rows.length} attendance rows`);

    const dailyBreakdown: any[] = [];
    let totalWorkMs = 0;
    let totalBreakMs = 0;

    for (const row of rows) {
      const stats = this.calculateDailyStats(row.logs.events, row.date);
      totalWorkMs += stats.workMs;
      totalBreakMs += stats.breakMs;

      dailyBreakdown.push({
        date: row.date,
        working_hours: stats.workMs / 3600000,
        break_hours: stats.breakMs / 3600000,
      });
    }

    return {
      fleet_uid,
      start_date: startDate,
      end_date: endDate,
      total_working_hours: totalWorkMs / 3600000,
      total_break_hours: totalBreakMs / 3600000,
      daily_breakdown: dailyBreakdown,
    };
  }

  
  
  
  async getHourlySummary(fleet_uid: string, date: string) {
    const row = await this.attendanceRepo.findOne({
      where: { fleet_uid, date },
    });

    if (!row) throw new BadRequestException('No attendance found.');

    const events = row.logs.events;

    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      working_minutes: 0,
      break_minutes: 0,
      offline_minutes: 0,
    }));

    const intervals: { start: Date; end: Date; state: 'WORKING' | 'BREAK' | 'OFFLINE' }[] = [];

    let currentState: 'WORKING' | 'BREAK' | 'OFFLINE' = 'OFFLINE';
    let currentStart: Date | null = null;

    function closeInterval(endTime: Date) {
      if (currentStart) intervals.push({ start: currentStart, end: endTime, state: currentState });
    }

    for (const e of events) {
      const time = new Date(e.time);
      const type = e.type as AttendanceEventType;

      if (currentStart) closeInterval(time);

      if (type === AttendanceEventType.PUNCH_IN) currentState = 'WORKING';
      if (type === AttendanceEventType.BREAK_START) currentState = 'BREAK';
      if (type === AttendanceEventType.BREAK_END) currentState = 'WORKING';
      if (type === AttendanceEventType.PUNCH_OUT) currentState = 'OFFLINE';

      currentStart = time;
    }

    if (currentStart) {
      intervals.push({
        start: currentStart,
        end: new Date(`${date} T23: 59: 59 +05: 30`),
        state: currentState,
      });
    }

    
    for (const interval of intervals) {
      const sHour = interval.start.getHours();
      const eHour = interval.end.getHours();

      for (let h = sHour; h <= eHour; h++) {
        const hourStart = new Date(interval.start);
        hourStart.setHours(h, 0, 0, 0);

        const hourEnd = new Date(interval.start);
        hourEnd.setHours(h, 59, 59, 999);

        const start = interval.start > hourStart ? interval.start : hourStart;
        const end = interval.end < hourEnd ? interval.end : hourEnd;

        const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);

        if (minutes > 0) {
          if (interval.state === 'WORKING') hours[h].working_minutes += minutes;
          if (interval.state === 'BREAK') hours[h].break_minutes += minutes;
          if (interval.state === 'OFFLINE') hours[h].offline_minutes += minutes;
        }
      }
    }

    return {
      fleet_uid,
      date,
      hourly: hours,
      totals: {
        working_hours: hours.reduce((s, x) => s + x.working_minutes, 0) / 60,
        break_hours: hours.reduce((s, x) => s + x.break_minutes, 0) / 60,
        offline_hours: hours.reduce((s, x) => s + x.offline_minutes, 0) / 60,
      },
    };
  }
}
