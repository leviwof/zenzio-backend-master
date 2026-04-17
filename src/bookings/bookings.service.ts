import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Raw, ILike } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/entity/restaurant.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class BookingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async onModuleInit() {
    await this.migrateColumns();
  }

  private async migrateColumns() {
    const queryRunner = this.bookingRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();

    const columnsToAdd = [
      { name: 'bookingTime', type: 'varchar', isNullable: true },
      { name: 'purpose', type: 'varchar', isNullable: true },
      { name: 'dining_space_id', type: 'uuid', isNullable: true },
      { name: 'event_id', type: 'uuid', isNullable: true },
    ];

    for (const column of columnsToAdd) {
      const hasColumn = await queryRunner.hasColumn('bookings', column.name);
      if (!hasColumn) {
        console.log(`Adding column ${column.name} to bookings table...`);
        await queryRunner.query(
          `ALTER TABLE bookings ADD COLUMN "${column.name}" ${column.type}${column.isNullable ? '' : ' NOT NULL'}`,
        );
      }
    }

    await queryRunner.release();
  }

  async create(createBookingDto: CreateBookingDto, user: User): Promise<Booking> {
    console.log('✍️ [DEBUG] Creating booking with DTO:', JSON.stringify(createBookingDto, null, 2));

    if (!createBookingDto.date) {
      console.error('❌ [ERROR] Booking creation failed: Date is missing');
      throw new BadRequestException('Date is required for booking');
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { uid: createBookingDto.restaurant_id },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found with UID: ${createBookingDto.restaurant_id}`,
      );
    }

    if (createBookingDto.event_id) {
      const event = await this.eventRepository.findOne({
        where: { id: createBookingDto.event_id },
      });

      if (!event) {
        throw new NotFoundException(`Event not found with ID: ${createBookingDto.event_id}`);
      }

      if (createBookingDto.guests > event.max_persons) {
        throw new BadRequestException(
          `Maximum ${event.max_persons} persons allowed per booking for this event`,
        );
      }

      const existingBookings = await this.bookingRepository.find({
        where: { event_id: event.id, status: Raw((alias) => `${alias} != 'CANCELLED'`) },
      });

      const currentTotalGuests = existingBookings.reduce((sum, b) => sum + Number(b.guests), 0);

      if (currentTotalGuests + createBookingDto.guests > event.capacity) {
        const available = event.capacity - currentTotalGuests;
        throw new BadRequestException(
          `Only ${available > 0 ? available : 0} spots remaining for this event`,
        );
      }
    }

    const bookingData: Partial<Booking> = {
      date: createBookingDto.date as any,
      guests: createBookingDto.guests,
      specialRequest: createBookingDto.specialRequest,
      bookingTime: createBookingDto.bookingTime,
      purpose: createBookingDto.purpose,
      dining_space_id: createBookingDto.diningSpaceId,
      event_id: createBookingDto.event_id,
      user_id: user.id || (user as any).userId,
      restaurant: restaurant,
      status: BookingStatus.PENDING,
    };

    console.log('✍️ [DEBUG] Final Booking Entity Data:', JSON.stringify(bookingData, null, 2));

    const booking = this.bookingRepository.create(bookingData);

    (booking as any).user = { id: user.id || (user as any).userId };

    const savedBooking = await this.bookingRepository.save(booking);

    console.log('✍️ [DEBUG] Saved Booking ID:', savedBooking.id);
    return savedBooking;
  }

  async findAll(
    params: {
      status?: string;
      date?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    } = {},
  ) {
    const { status, date, page = 1, pageSize = 10, search } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.profile', 'restaurantProfile')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.profile', 'userProfile')
      .orderBy('booking.date', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (status && status !== 'All') {
      queryBuilder.andWhere('booking.status = :status', { status: status.toUpperCase() });
    }

    if (date) {
      if (date.includes(',')) {
        const [start, end] = date.split(',');
        queryBuilder.andWhere('booking.date BETWEEN :start AND :end', { start, end });
      } else {
        queryBuilder.andWhere('booking.date = :date', { date });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(booking.id::text ILIKE :search OR restaurantProfile.restaurant_name ILIKE :search OR userProfile.first_name ILIKE :search OR userProfile.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [bookings, total] = await queryBuilder.getManyAndCount();

    const mappedBookings = bookings.map((b) => {
      const customerName = b.user?.profile
        ? `${b.user.profile.first_name} ${b.user.profile.last_name}`
        : (b.user as any)?.name || 'Guest';
      const restaurantName =
        (b.restaurant as any)?.profile?.restaurant_name ||
        (b.restaurant as any)?.name ||
        'Restaurant';

      return {
        id: b.id,
        bookingId: b.id.toString(),
        customerName: customerName,
        restaurantName: restaurantName,
        dateTime: `${b.date} ${b.bookingTime || ''}`,
        guests: b.guests,
        status: b.status,
      };
    });

    return {
      bookings: mappedBookings,
      total,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'user',
        'user.profile',
        'user.contact',
        'restaurant',
        'restaurant.profile',
        'restaurant.address',
        'diningSpace',
        'event',
      ],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return {
      id: booking.id,
      bookingNumber: booking.id,
      status: booking.status,
      updatedAt: booking.updated_at,
      bookingDate: booking.date,
      bookingTime: booking.bookingTime,
      numberOfGuests: booking.guests,
      specialRequests: booking.specialRequest,
      diningArea: booking.diningSpace ? { areaName: booking.diningSpace.areaName } : null,
      event: booking.event ? { eventName: booking.event.name, isAdminVerified: true } : null,
      user: {
        id: booking.user?.id || (booking.user as any)?.uid,
        name: booking.user?.profile
          ? `${booking.user.profile.first_name} ${booking.user.profile.last_name}`
          : 'Guest',
        email: booking.user?.contact?.encryptedEmail || (booking.user as any)?.email || 'N/A',
        mobile: booking.user?.contact?.encryptedPhone || (booking.user as any)?.phone || 'N/A',
      },
      restaurant: {
        id: booking.restaurant?.id,
        rest_name: booking.restaurant?.profile?.restaurant_name || 'Restaurant',
        contact_email: booking.restaurant?.profile?.contact_email,
        contact_number: booking.restaurant?.profile?.contact_number,
        rest_address: booking.restaurant?.address?.address || 'N/A',
      },
      timeline: [{ status: 'created', event: 'Booking Created', timestamp: booking.created_at }],
    };
  }

  async findAllByUser(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { user_id: userId },
      relations: [
        'restaurant',
        'restaurant.profile',
        'restaurant.contact',
        'restaurant.address',
        'diningSpace',
        'event',
      ],
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async findAllByRestaurant(
    restaurantUid: string,
    status?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Booking[]> {
    console.log(
      `🔍 [DEBUG] findAllByRestaurant: uid=${restaurantUid}, status=${status}, date=${date}, startDate=${startDate}, endDate=${endDate}`,
    );

    const where: any = {
      restaurant: { uid: restaurantUid },
    };

    if (!restaurantUid) {
      console.warn('⚠️ [WARN] findAllByRestaurant called without restaurantUid');
      return [];
    }

    if (status && status !== 'All') {
      where.status = status.toUpperCase();
    }

    if (startDate && endDate) {
      const { Between } = require('typeorm');
      where.date = Between(startDate, endDate);
      console.log(`🔍 [DEBUG] Using date range: ${startDate} to ${endDate}`);
    } else if (date) {
      where.date = date;
      console.log(`🔍 [DEBUG] Using exact date: ${date}`);
    }

    const bookings = await this.bookingRepository.find({
      where,
      relations: ['user', 'user.profile', 'user.contact', 'restaurant', 'diningSpace', 'event'],
      order: { created_at: 'DESC' },
    });

    console.log(`🔍 [DEBUG] Found ${bookings.length} bookings for restaurant ${restaurantUid}`);
    if (bookings.length > 0) {
      console.log(`🔍 [DEBUG] First booking status: ${bookings[0].status} (ID: ${bookings[0].id})`);
    }

    if (bookings.length === 0) {
      const allCount = await this.bookingRepository.count({
        where: { restaurant: { uid: restaurantUid } },
      });
      console.log(`🔍 [DEBUG] Total bookings for this restaurant (ignoring filters): ${allCount}`);
    }

    return bookings;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    console.log(`🔄 [DEBUG] Updating booking ${id} to status: ${status}`);

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.bookingRepository.update(id, { status });

    const updatedBooking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant'],
    });

    if (!updatedBooking) {
      throw new NotFoundException(`Booking with ID ${id} not found after update`);
    }

    console.log(`✅ [DEBUG] Updated booking ${id} status. New Value: ${updatedBooking.status}`);
    return updatedBooking;
  }

  async clearAllEventBookings(): Promise<void> {
    await this.bookingRepository
      .createQueryBuilder()
      .delete()
      .from(Booking)
      .where('event_id IS NOT NULL')
      .execute();
    console.log('🧹 [DEBUG] Cleared all event bookings');
  }

  async getStats(params: any = {}) {
    const { restaurantUid, date, startDate, endDate } = params;
    console.log(
      `📊 [DEBUG] getStats: uid=${restaurantUid}, date=${date}, startDate=${startDate}, endDate=${endDate}`,
    );

    if (!restaurantUid) {
      console.warn('⚠️ [WARN] getStats called without restaurantUid - returning empty stats');
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        seated: 0,
      };
    }

    const where: any = {};

    where.restaurant = { uid: restaurantUid };

    if (startDate && endDate) {
      const { Between } = require('typeorm');
      where.date = Between(startDate, endDate);
      console.log(`📊 [DEBUG] Stats using date range: ${startDate} to ${endDate}`);
    } else if (date) {
      where.date = Raw((alias) => `DATE(${alias}) = :date`, { date });
      console.log(`📊 [DEBUG] Stats using exact date: ${date}`);
    }

    const total = await this.bookingRepository.count({ where });
    console.log(`📊 [DEBUG] Stats Query - Total WHERE:`, JSON.stringify(where, null, 2));

    const pending = await this.bookingRepository.count({
      where: { ...where, status: BookingStatus.PENDING },
    });
    console.log(`📊 [DEBUG] Stats Result - Total: ${total}, Pending: ${pending}`);
    const confirmed = await this.bookingRepository.count({
      where: { ...where, status: BookingStatus.CONFIRMED },
    });
    const cancelled = await this.bookingRepository.count({
      where: { ...where, status: BookingStatus.CANCELLED },
    });
    const seated = await this.bookingRepository.count({
      where: { ...where, status: BookingStatus.SEATED },
    });

    return {
      total,
      pending,
      confirmed,
      cancelled,
      seated,
    };
  }
}
