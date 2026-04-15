
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) { }

  async onModuleInit() {
    await this.migrateColumns();
  }

  private async migrateColumns() {
    const queryRunner = this.eventRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();

    try {
      const hasColumn = await queryRunner.hasColumn('events', 'max_persons');
      if (!hasColumn) {
        console.log('Adding column max_persons to events table...');
        await queryRunner.query(
          `ALTER TABLE events ADD COLUMN "max_persons" integer DEFAULT 1 NOT NULL`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      restaurant_id: createEventDto.restaurant_id,
      status: EventStatus.PENDING,
    });
    return this.eventRepository.save(event);
  }

  
  async createApproved(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      restaurant_id: createEventDto.restaurant_id,
      status: EventStatus.APPROVED, 
    });
    return this.eventRepository.save(event);
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Reset status to PENDING on update to ensure admin re-review
    event.status = EventStatus.PENDING;
    event.rejectionReason = '';

    const updatedEvent = this.eventRepository.merge(event, updateEventDto);
    return this.eventRepository.save(updatedEvent);
  }

  async remove(id: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    await this.eventRepository.remove(event);
  }

  async findAll(params: any = {}): Promise<any> {
    const { status, restaurantId, page = 1, pageSize = 10, search } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.eventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.profile', 'restaurantProfile')
      .orderBy('event.created_at', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (status && status !== 'All') {
      if (status.toUpperCase() === 'APPROVED') {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        queryBuilder.andWhere(
          '(event.status = :status AND (event.date > :today OR (event.date = :today AND event.endTime >= :currentTime)))',
          { status: EventStatus.APPROVED, today, currentTime }
        );
      } else {
        queryBuilder.andWhere('event.status = :status', { status: status.toUpperCase() });
      }
    }

    if (restaurantId) {
      queryBuilder.andWhere('event.restaurant_id = :restaurantId', { restaurantId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(event.name ILIKE :search OR restaurantProfile.restaurant_name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [events, total] = await queryBuilder.getManyAndCount();

    return {
      events: events.map(e => this.mapEventToFrontend(e)),
      total,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findPending(params: any = {}): Promise<any> {
    const { page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const [events, total] = await this.eventRepository.findAndCount({
      where: { status: EventStatus.PENDING },
      relations: ['restaurant', 'restaurant.profile'],
      order: { created_at: 'ASC' },
      skip,
      take: pageSize,
    });

    return {
      events: await Promise.all(events.map(async (e) => {
        const c = await this.countBookedGuests(e.id);
        return this.mapEventToFrontend(e, c);
      })),
      total,
      pages: Math.ceil(total / pageSize),
    };
  }

  private async countBookedGuests(eventId: string): Promise<number> {
    const { sum } = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.guests)', 'sum')
      .where('booking.event_id = :eventId', { eventId })
      .andWhere('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .getRawOne();
    return parseInt(sum || '0', 10);
  }

  private mapEventToFrontend(event: Event, bookedCount: number = 0) {
    const remaining = event.capacity - bookedCount;

    
    const now = new Date();
    
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); 

    let computedStatus = event.status;

    
    if (event.status !== EventStatus.REJECTED) {
      if (event.date < today) {
        computedStatus = EventStatus.EXPIRED;
      } else if (event.date === today && event.endTime < currentTime) {
        computedStatus = EventStatus.EXPIRED;
      }
    }

    return {
      id: event.id,
      name: event.name, 
      eventName: event.name, 
      description: event.description, 
      eventDescription: event.description, 
      date: event.date,
      eventDate: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      eventTimes: [event.startTime, event.endTime],
      image: event.image,
      price: typeof event.price === 'string' ? parseFloat(event.price) : event.price,
      capacity: event.capacity,
      max_persons: event.max_persons,
      remaining_capacity: remaining > 0 ? remaining : 0,
      status: computedStatus, 
      rejectionReason: event.rejectionReason,
      restaurant_id: event.restaurant_id, 
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      restaurant: {
        id: event.restaurant?.id,
        uid: event.restaurant?.uid,
        rest_name: event.restaurant?.profile?.restaurant_name || 'Restaurant',
      },
      restaurantName: event.restaurant?.profile?.restaurant_name || 'Restaurant',
      isVerified: event.status === EventStatus.APPROVED,
      isActive: computedStatus !== EventStatus.EXPIRED && computedStatus !== EventStatus.REJECTED,
      diningArea: {
        areaName: 'Event Space',
        seatingCapacity: event.capacity,
        description: event.description,
        photos: event.image ? [event.image] : [],
      }
    };
  }

  async findAllByRestaurant(restaurantId: string): Promise<any[]> {
    const events = await this.eventRepository.find({
      where: { restaurant_id: restaurantId },
      order: { date: 'ASC' },
      relations: ['restaurant', 'restaurant.profile'],
    });

    return Promise.all(events.map(async (e) => {
      const c = await this.countBookedGuests(e.id);
      return this.mapEventToFrontend(e, c);
    }));
  }

  async findOne(id: string): Promise<any> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.profile'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    const bookedCount = await this.countBookedGuests(event.id);
    return this.mapEventToFrontend(event, bookedCount);
  }

  async approve(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    event.status = EventStatus.APPROVED;
    return this.eventRepository.save(event);
  }

  async reject(id: string, reason: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    event.status = EventStatus.REJECTED;
    event.rejectionReason = reason;
    return this.eventRepository.save(event);
  }
}
