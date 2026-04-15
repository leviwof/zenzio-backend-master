
import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Order } from './order.entity';
import { UpdateRestaurantStatusDto } from './dtos/update-restaurant-status.dto';
import { UpdateDeliveryStatusDto } from './dtos/update-delivery-status.dto';
import { CreateOrderDto } from './dtos/create-order.dto';
import { NotificationService } from 'src/notifications/notification.service';

import { DeliveryHistory, DeliveryStatus } from 'src/fleet-v2/entity/delivery_history.entity';

import { RedisService } from 'src/redis/redis.service';

import { FileService } from 'src/file/file.service';
import { MulterFile } from 'src/types/multer-file.type';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';
import { RestaurantDocument } from 'src/restaurants/entity/restaurant_document.entity';
import { ReferralService } from 'src/referral/referral.service';


@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(DeliveryHistory)
    private readonly deliveryHistoryRepo: Repository<DeliveryHistory>,
    @InjectRepository(RestaurantProfile)
    private readonly restaurantProfileRepo: Repository<RestaurantProfile>,
    @InjectRepository(RestaurantDocument)
    private readonly restaurantDocRepo: Repository<RestaurantDocument>,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
    private readonly fileService: FileService,
    private readonly referralService: ReferralService,
  ) { }


  async onModuleInit() {
    try {
      await this.orderRepo.query(`
        ALTER TABLE "orders" 
        ADD COLUMN IF NOT EXISTS "status_timeline" jsonb DEFAULT '[]'::jsonb;
        ALTER TABLE "orders" 
        ADD COLUMN IF NOT EXISTS "delivery_proof_photo" text;
        ALTER TABLE "orders" 
        ADD COLUMN IF NOT EXISTS "admin_commission" float DEFAULT 0;
        ALTER TABLE "orders" 
        ADD COLUMN IF NOT EXISTS "packing_charge" float DEFAULT 10;
        
        -- ✅ Standards: Force 15 min to 5 min for existing rows and set default
        UPDATE "orders" SET "estimated_time" = '5 min' WHERE "estimated_time" = '15 min' OR "estimated_time" = '15 mins';
        ALTER TABLE "orders" ALTER COLUMN "estimated_time" SET DEFAULT '5 min';
      `);
      console.log(
        '✅ [Migration] preparation time defaults and existing rows updated to 5 min',
      );
    } catch (error: any) {
      console.warn('⚠️ [Migration] Could not add status_timeline column:', error?.message || error);
    }
  }


  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 0xffff).toString(16)}`;
  }


  private generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }


  private calculatePrice(items: any[]): number {
    let total = 0;
    for (const it of items) {
      const price = typeof it.price === 'number' ? it.price : 0;
      const qty = typeof it.qty === 'number' ? it.qty : 1;
      total += price * qty;
    }
    return total;
  }


  private generateComprehensiveTimeline(order: any): Array<{
    status: string;
    timestamp: string | null;
    message: string;
    updatedBy?: string;
  }> {

    const restaurantStatusOrder = ['new', 'accepted', 'preparing', 'ready'];
    const deliveryStatusOrder = [
      'new',
      'pending',
      'assigned',
      'on_the_way_to_restaurant',
      'picked_up',
      'out_for_delivery',
      'on_the_way_to_customer',
      'delivered',
    ];

    const currentRestaurantStatus = order.restaurantStatus?.toLowerCase() || 'new';
    const currentDeliveryStatus = order.deliveryPartnerStatus?.toLowerCase() || 'new';

    const currentRestaurantIdx = restaurantStatusOrder.indexOf(currentRestaurantStatus);
    const currentDeliveryIdx = deliveryStatusOrder.indexOf(currentDeliveryStatus);


    const isCancelled =
      currentRestaurantStatus === 'cancelled' ||
      currentRestaurantStatus === 'rejected' ||
      currentDeliveryStatus === 'cancelled' ||
      currentDeliveryStatus === 'admin_cancelled';


    const isRestaurantStepCompleted = (stepStatus: string) => {
      const stepIdx = restaurantStatusOrder.indexOf(stepStatus);
      return stepIdx >= 0 && currentRestaurantIdx >= stepIdx;
    };

    const isDeliveryStepCompleted = (stepStatus: string) => {
      const stepIdx = deliveryStatusOrder.indexOf(stepStatus);
      return stepIdx >= 0 && currentDeliveryIdx >= stepIdx;
    };



    const orderTime = new Date(order.time || order.createdAt);


    const addMinutes = (date: Date, minutes: number): string => {
      return new Date(date.getTime() + minutes * 60000).toISOString();
    };


    const timeline: Array<{
      status: string;
      timestamp: string | null;
      message: string;
      updatedBy?: string;
    }> = [];

    let cumulativeMinutes = 0;


    timeline.push({
      status: 'PLACED',
      timestamp: orderTime.toISOString(),
      message: 'Order placed successfully',
      updatedBy: 'customer',
    });


    if (isRestaurantStepCompleted('accepted')) {
      cumulativeMinutes += 2;
    }
    timeline.push({
      status: 'ACCEPTED',
      timestamp: isRestaurantStepCompleted('accepted') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: isRestaurantStepCompleted('accepted')
        ? 'Order confirmed by restaurant'
        : 'Waiting for restaurant confirmation',
      updatedBy: 'restaurant',
    });


    if (isRestaurantStepCompleted('preparing')) {
      cumulativeMinutes += 10;
    }
    timeline.push({
      status: 'PREPARING',
      timestamp: isRestaurantStepCompleted('preparing') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: isRestaurantStepCompleted('preparing')
        ? 'Restaurant is preparing your order'
        : 'Waiting for preparation to start',
      updatedBy: 'restaurant',
    });


    if (isRestaurantStepCompleted('ready')) {
      cumulativeMinutes += 5;
    }
    timeline.push({
      status: 'READY',
      timestamp: isRestaurantStepCompleted('ready') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: isRestaurantStepCompleted('ready')
        ? 'Order is ready for pickup'
        : 'Waiting for order to be ready',
      updatedBy: 'restaurant',
    });


    const hasDeliveryPartner = !!order.delivery_partner_uid;
    if (hasDeliveryPartner && isDeliveryStepCompleted('assigned')) {
      cumulativeMinutes += 3;
    }
    timeline.push({
      status: 'ASSIGNED',
      timestamp: hasDeliveryPartner && isDeliveryStepCompleted('assigned') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: hasDeliveryPartner
        ? 'Delivery partner assigned'
        : 'Waiting for delivery partner assignment',
      updatedBy: 'system',
    });


    if (isDeliveryStepCompleted('picked_up')) {
      cumulativeMinutes += 5;
    }
    timeline.push({
      status: 'PICKED_UP',
      timestamp: isDeliveryStepCompleted('picked_up') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: isDeliveryStepCompleted('picked_up')
        ? 'Order picked up by delivery partner'
        : 'Waiting for pickup',
      updatedBy: 'delivery_partner',
    });


    if (isDeliveryStepCompleted('out_for_delivery')) {
      cumulativeMinutes += 2;
    }
    timeline.push({
      status: 'OUT_FOR_DELIVERY',
      timestamp: isDeliveryStepCompleted('out_for_delivery') ? addMinutes(orderTime, cumulativeMinutes) : null,
      message: isDeliveryStepCompleted('out_for_delivery')
        ? 'Order is out for delivery'
        : 'Waiting for delivery to start',
      updatedBy: 'delivery_partner',
    });


    if (currentDeliveryStatus === 'delivered') {
      cumulativeMinutes += 15;
    }
    timeline.push({
      status: 'DELIVERED',
      timestamp: currentDeliveryStatus === 'delivered' ? addMinutes(orderTime, cumulativeMinutes) : null,
      message:
        currentDeliveryStatus === 'delivered'
          ? 'Order delivered successfully'
          : 'Waiting for delivery',
      updatedBy: 'delivery_partner',
    });


    if (isCancelled) {
      let cancelMessage = 'Order cancelled';
      let cancelledBy = 'system';

      if (currentRestaurantStatus === 'rejected') {
        cancelMessage = 'Order rejected by restaurant';
        cancelledBy = 'restaurant';
      } else if (currentDeliveryStatus === 'admin_cancelled') {
        cancelMessage = 'Order cancelled by Admin';
        cancelledBy = 'admin';
      } else if (currentRestaurantStatus === 'cancelled') {
        cancelMessage = 'Order cancelled';
        cancelledBy = 'restaurant';
      }

      timeline.push({
        status: 'CANCELLED',
        timestamp: order.updatedAt || addMinutes(orderTime, cumulativeMinutes + 1),
        message: cancelMessage,
        updatedBy: cancelledBy,
      });
    }

    return timeline;
  }


  private buildCompleteTimeline(order: any): Array<{
    status: string;
    timestamp: string | null;
    message: string;
    updatedBy?: string;
  }> {

    const timelineTemplate = [
      { status: 'PLACED', message: 'Order placed successfully', updatedBy: 'customer' },
      { status: 'ACCEPTED', message: 'Order confirmed by restaurant', updatedBy: 'restaurant' },
      { status: 'PREPARING', message: 'Restaurant is preparing your order', updatedBy: 'restaurant' },
      { status: 'READY', message: 'Order is ready for pickup', updatedBy: 'restaurant' },
      { status: 'ASSIGNED', message: 'Delivery partner assigned', updatedBy: 'system' },
      { status: 'ON_THE_WAY_TO_RESTAURANT', message: 'Delivery partner is on the way to restaurant', updatedBy: 'delivery_partner' },
      { status: 'REACHED_RESTAURANT', message: 'Delivery partner has reached the restaurant', updatedBy: 'delivery_partner' },
      { status: 'PICKED_UP', message: 'Order picked up by delivery partner', updatedBy: 'delivery_partner' },
      { status: 'OUT_FOR_DELIVERY', message: 'Order is out for delivery', updatedBy: 'delivery_partner' },
      { status: 'ON_THE_WAY_TO_CUSTOMER', message: 'Delivery partner is on the way to customer', updatedBy: 'delivery_partner' },
      { status: 'DELIVERED', message: 'Order delivered successfully', updatedBy: 'delivery_partner' },
    ];


    const restaurantStatusOrder = ['new', 'accepted', 'preparing', 'ready'];
    const deliveryStatusOrder = [
      'new',
      'pending',
      'assigned',
      'on_the_way_to_restaurant',
      'reached_restaurant',
      'picked_up',
      'out_for_delivery',
      'on_the_way_to_customer',
      'delivered',
    ];

    const currentRestaurantStatus = (order.restaurantStatus || 'new').toLowerCase();
    const currentDeliveryStatus = (order.deliveryPartnerStatus || 'new').toLowerCase();

    const currentRestaurantIdx = restaurantStatusOrder.indexOf(currentRestaurantStatus);
    const currentDeliveryIdx = deliveryStatusOrder.indexOf(currentDeliveryStatus);


    const storedTimeline = order.status_timeline || [];


    const storedMap = new Map<string, any>();
    storedTimeline.forEach((entry: any) => {
      storedMap.set(entry.status.toUpperCase(), entry);
    });


    let lastCompletedTimestamp = new Date().toISOString();
    if (order.time || order.createdAt) {
      try {
        lastCompletedTimestamp = new Date(order.time || order.createdAt).toISOString();
      } catch (e) {
        lastCompletedTimestamp = new Date().toISOString();
      }
    }


    const completeTimeline = timelineTemplate.map((template, index) => {
      const statusKey = template.status.toUpperCase();
      const stored = storedMap.get(statusKey);

      let finalTimestamp: string | null = null;
      let finalMessage = template.message;
      let finalUpdatedBy = template.updatedBy;

      if (stored) {

        finalTimestamp = stored.timestamp;
        finalMessage = stored.message || template.message;
        finalUpdatedBy = stored.updatedBy || template.updatedBy;
      } else {



        const isLaterStepCompleted = timelineTemplate.slice(index + 1).some(futureStep =>
          storedMap.has(futureStep.status.toUpperCase())
        );


        const isRestaurantStep = ['ACCEPTED', 'PREPARING', 'READY'].includes(statusKey);
        const isDeliveryStep = [
          'ASSIGNED',
          'ON_THE_WAY_TO_RESTAURANT',
          'REACHED_RESTAURANT',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
          'ON_THE_WAY_TO_CUSTOMER',
          'DELIVERED'
        ].includes(statusKey);

        let impliedByEntityStatus = false;

        if (isRestaurantStep) {
          const stepIdx = restaurantStatusOrder.indexOf(statusKey.toLowerCase());
          if (stepIdx !== -1 && currentRestaurantIdx >= stepIdx) impliedByEntityStatus = true;
        }

        if (isDeliveryStep) {
          const stepIdx = deliveryStatusOrder.indexOf(statusKey.toLowerCase());
          if (stepIdx !== -1 && currentDeliveryIdx >= stepIdx) impliedByEntityStatus = true;

          if (currentDeliveryStatus === 'delivered') impliedByEntityStatus = true;
        }

        if (isLaterStepCompleted || impliedByEntityStatus) {

          const isCurrentStatus =
            (statusKey === currentRestaurantStatus.toUpperCase()) ||
            (statusKey === currentDeliveryStatus.toUpperCase());

          if (isCurrentStatus && !isLaterStepCompleted && order.updatedAt) {

            try {
              finalTimestamp = new Date(order.updatedAt).toISOString();
            } catch (e) {
              finalTimestamp = lastCompletedTimestamp;
            }
          } else {
            finalTimestamp = lastCompletedTimestamp;
          }
        }
      }






      return {
        status: template.status,
        timestamp: finalTimestamp,
        message: finalMessage,
        updatedBy: finalUpdatedBy,
      };
    });


    const isCancelled = storedTimeline.some((entry: any) =>
      ['CANCELLED', 'REJECTED'].includes(entry.status.toUpperCase())
    );


    const entityCancelled =
      ['cancelled', 'rejected'].includes(currentRestaurantStatus) ||
      ['cancelled', 'admin_cancelled'].includes(currentDeliveryStatus);

    if (isCancelled || entityCancelled) {
      let cancelEntry = storedTimeline.find((entry: any) =>
        ['CANCELLED', 'REJECTED'].includes(entry.status.toUpperCase())
      );


      if (!cancelEntry && entityCancelled) {
        cancelEntry = {
          status: 'CANCELLED',
          timestamp: order.updatedAt || new Date().toISOString(),
          message: 'Order cancelled',
          updatedBy: 'system'
        };
      }

      if (cancelEntry) {
        completeTimeline.push({
          status: cancelEntry.status,
          timestamp: cancelEntry.timestamp,
          message: cancelEntry.message || 'Order cancelled',
          updatedBy: cancelEntry.updatedBy || 'system',
        });
      }
    }

    return completeTimeline;
  }



  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }


    const rawItemTotal = dto.item_total ?? this.calculatePrice(dto.items);
    const itemTotal = Number(rawItemTotal.toFixed(2));


    const deliveryFee = Number((dto.delivery_fee ?? 0).toFixed(2));

    // Fetch packaging charge and GST status from restaurant
    const restaurantProfile = await this.restaurantProfileRepo.findOne({
      where: { restaurantUid: dto.restaurant_uid },
    });
    const packingCharge = Number(restaurantProfile?.packing_charge ?? 0);

    const restaurantDoc = await this.restaurantDocRepo.findOne({
      where: { restaurantUid: dto.restaurant_uid },
    });
    const isGstRegistered = Boolean(restaurantDoc?.gst_number?.toString().trim());
    const taxes = isGstRegistered ? Number((dto.taxes ?? itemTotal * 0.05).toFixed(2)) : 0;

    const adminCommission = Number((itemTotal - (itemTotal / 1.08)).toFixed(2));

    const grandTotal = Number((dto.price ?? itemTotal + deliveryFee + taxes + packingCharge).toFixed(2));

    console.log('📦 [DEBUG] Order Creation - Incoming Location:', {
      customer: dto.customer,
      lat: dto.customer_lat,
      lng: dto.customer_lng,
      address: dto.delivery_address,
    });

    const orderTime = new Date().toISOString();

    const order = this.orderRepo.create({
      orderId: this.generateOrderId(),
      customer: dto.customer,
      items: dto.items,
      price: grandTotal,
      item_total: itemTotal,
      delivery_fee: deliveryFee,
      taxes: taxes,
      admin_commission: adminCommission,
      packing_charge: packingCharge,
      time: orderTime,

      restaurantStatus: 'new',
      deliveryPartnerStatus: 'new',

      user_otp: this.generateOTP(),

      restaurant_uid: dto.restaurant_uid,
      delivery_address: dto.delivery_address,
      restaurant_lat: dto.restaurant_lat,
      restaurant_lng: dto.restaurant_lng,
      customer_lat: dto.customer_lat,
      customer_lng: dto.customer_lng,
      distance_km: dto.distance_km,
      payment_mode: dto.payment_mode,

      status_timeline: [
        {
          status: 'PLACED',
          timestamp: orderTime,
          message: 'Order placed successfully',
        },
      ],
    });

    const savedOrder = await this.orderRepo.save(order);


    try {

      if (dto.customer) {
        await this.notificationService.notifyOrderConfirmed(dto.customer, savedOrder.orderId);
      }


      if (dto.restaurant_uid) {
        const customerName = dto.customer_name || 'Customer';
        await this.notificationService.notifyRestaurantNewOrder(
          dto.restaurant_uid,
          savedOrder.orderId,
          customerName,
          grandTotal,
        );
      }
    } catch (error) {
      console.error('Error sending order notifications:', error);
    }

    return savedOrder;
  }


  async findAll() {
    return this.orderRepo.find({
      order: { time: 'DESC' as any },
    });
  }


  async findByCustomer(customerUid: string) {
    try {
      console.log(`📦 [findByCustomer] Fetching orders for customer: ${customerUid}`);


      const orders = await this.orderRepo.query(
        `SELECT * FROM "orders" WHERE customer = $1 AND "restaurantStatus" != 'pending_payment' ORDER BY "time" DESC LIMIT 50`,
        [customerUid],
      );

      console.log(`📦 [findByCustomer] Found ${orders.length} orders for customer: ${customerUid}`);


      const ordersWithRestaurantNames = await Promise.all(
        orders.map(async (order) => {
          let restaurantName = 'Unknown Restaurant';


          if (order.restaurant_uid) {
            try {
              const result = await this.orderRepo.manager
                .createQueryBuilder()
                .select('rp.restaurant_name', 'restaurant_name')
                .from('restaurants', 'r')
                .leftJoin('restaurant_profile', 'rp', 'r.uid = rp."restaurantUid"')
                .where('r.uid = :uid', { uid: order.restaurant_uid })
                .getRawOne();

              if (result && result.restaurant_name) {
                restaurantName = result.restaurant_name;
              }
            } catch (error) {
              console.error(`Error fetching restaurant name:`, error);
            }
          }

          return {
            ...order,
            restaurant_name: restaurantName,
          };
        }),
      );

      return ordersWithRestaurantNames;
    } catch (e) {
      console.error('❌ Error in findByCustomer:', e);

      return [];
    }
  }



  async findAllOrders(options?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const { status, search, startDate, endDate } = options || {};
      const params: any[] = [];
      let whereClause = 'WHERE 1=1';


      if (status && status !== 'All') {
        if (status === 'Pending') {
          whereClause += ` AND (o."restaurantStatus" IN ('new', 'pending', 'payment_pending', 'pending_payment', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'C008', 'C007', 'payment_initiated', 'PAYMENT_INITIATED') OR o."status" IN ('payment_pending', 'pending_payment', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'C008'))`;
        } else if (status === 'Active') {
          whereClause += ` AND (o."restaurantStatus" IN ('accepted', 'preparing', 'ready') AND o."deliveryPartnerStatus" != 'delivered')`;
        } else if (status === 'Delivered') {
          whereClause += ` AND o."deliveryPartnerStatus" = 'delivered'`;
        } else if (status === 'Cancelled') {
          whereClause += ` AND o."restaurantStatus" IN ('rejected', 'cancelled')`;
        }
      }


      if (startDate) {
        params.push(startDate);
        whereClause += ` AND o."createdAt" >= $${params.length}`;
      }
      if (endDate) {


        const endD = new Date(endDate);
        endD.setDate(endD.getDate() + 1);
        params.push(endD.toISOString().split('T')[0]);
        whereClause += ` AND o."createdAt" < $${params.length}`;
      }


      if (search) {
        params.push(`%${search}%`);
        const idx = params.length;
        whereClause += ` AND (
          o."orderId" ILIKE $${idx} OR 
          up.first_name ILIKE $${idx} OR 
          up.last_name ILIKE $${idx} OR 
          rp.restaurant_name ILIKE $${idx}
        )`;
      }



      const orders = await this.orderRepo.query(
        `
        SELECT 
          o.*,
          rp.restaurant_name,
          COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), uc."encryptedUsername", 'Customer') as customer_name
        FROM "orders" o
        LEFT JOIN "restaurants" r ON o.restaurant_uid = r.uid
        LEFT JOIN "restaurant_profile" rp ON r.uid = rp."restaurantUid"
        LEFT JOIN "user_profile" up ON o.customer = up."userUid"
        LEFT JOIN "user_contacts" uc ON o.customer = uc."userUid"
        ${whereClause}
        ORDER BY o."time" DESC
      `,
        params,
      );

      return orders;
    } catch (e) {
      console.error('❌ Error in findAllOrders:', e);
      return [];
    }
  }


  async findOne(id: string, customerUid?: string) {
    try {

      const result = await this.orderRepo.query(`SELECT * FROM "orders" WHERE "orderId" = $1`, [
        id,
      ]);

      if (!result || result.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = result[0];


      if (customerUid && order.customer !== customerUid) {
        throw new NotFoundException('Order not found');
      }


      let restaurantName = 'Unknown Restaurant';

      if (order.restaurant_uid) {
        try {
          const resResult = await this.orderRepo.manager
            .createQueryBuilder()
            .select('rp.restaurant_name', 'restaurant_name')
            .from('restaurants', 'r')
            .leftJoin('restaurant_profile', 'rp', 'r.uid = rp."restaurantUid"')
            .where('r.uid = :uid', { uid: order.restaurant_uid })
            .getRawOne();

          if (resResult && resResult.restaurant_name) {
            restaurantName = resResult.restaurant_name;
          }
        } catch (error) {
          console.error(`Error fetching restaurant name:`, error);
        }
      }

      return {
        ...order,
        restaurant_name: restaurantName,
      };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      console.error('❌ Error in findOne:', e);
      throw new BadRequestException('Failed to fetch order details');
    }
  }

  async findOneEnriched(orderId: string) {
    const res = await this.orderRepo.query(
      `SELECT 
      o.*,
      rp.restaurant_name,
      rad.address as pickup_address,
      rad.lat as pickup_lat,
      rad.lng as pickup_lng,
      COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), uc."encryptedUsername", 'Customer') as customer_name,
      uc."encryptedPhone" as customer_phone
     FROM "orders" o
     LEFT JOIN "restaurants" r ON o.restaurant_uid = r.uid
     LEFT JOIN "restaurant_profile" rp ON r.uid = rp."restaurantUid"
     LEFT JOIN "restaurant_address" rad ON r.uid = rad."restaurantUid"
     LEFT JOIN "user_contacts" uc ON o.customer = uc."userUid"
     LEFT JOIN "user_profile" up ON o.customer = up."userUid"
     WHERE o."orderId" = $1`,
      [orderId],
    );

    if (!res || res.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const dbOrder = res[0];


    try {
      const cachedLoc = await this.redisService.get<{ lat: number; lng: number }>(
        `delivery:loc:${orderId}`,
      );
      if (cachedLoc) {
        dbOrder.delivery_lat = cachedLoc.lat;
        dbOrder.delivery_lng = cachedLoc.lng;

      }
    } catch (e) {
      console.warn('Redis fetch failed for location, using DB fallback');
    }

    return dbOrder;
  }


  async updateRestaurantStatus(id: string, dto: UpdateRestaurantStatusDto) {
    const order = await this.findOne(id);
    const previousStatus = order.restaurantStatus;
    order.restaurantStatus = dto.status;


    if (dto.estimated_time) {
      order.estimated_time = dto.estimated_time;
    } else if (dto.status === 'accepted' && !order.estimated_time) {

      order.estimated_time = '5 min';
    }


    if (dto.status === 'picked_up' || dto.status === 'out_for_delivery') {
      if (!order.delivery_partner_uid) {
        throw new BadRequestException('No Partner is Assigned. Wait for Delivery Partner.');
      }

      order.deliveryPartnerStatus = dto.status;
    }


    const currentTimestamp = new Date().toISOString();
    const statusMessages: Record<string, string> = {
      accepted: 'Order accepted by restaurant',
      preparing: 'Restaurant is preparing your order',
      ready: 'Order is ready for pickup',
      picked_up: 'Order picked up by delivery partner',
      out_for_delivery: 'Order is out for delivery',
      rejected: 'Order rejected by restaurant',
      cancelled: 'Order cancelled',
    };

    const newTimelineEntry = {
      status: dto.status.toUpperCase(),
      timestamp: currentTimestamp,
      message: statusMessages[dto.status] || `Restaurant status: ${dto.status}`,
      updatedBy: 'restaurant',
    };

    if (!order.status_timeline) {
      order.status_timeline = [];
    }
    order.status_timeline.push(newTimelineEntry);

    const savedOrder = await this.orderRepo.save(order);


    try {
      if (dto.status === 'accepted' && previousStatus !== 'accepted') {

        if (order.customer) {
          const restaurantName = order.restaurant_name || 'Restaurant';
          await this.notificationService.notifyOrderAccepted(
            order.customer,
            order.orderId,
            restaurantName,
          );
        }


        if (order.restaurant_uid) {
          const restaurantName = order.restaurant_name || 'Restaurant';
          const pickupAddress = order.delivery_address || 'Pickup location';
          await this.notificationService.notifyDeliveryPartnersNewJob(
            order.orderId,
            restaurantName,
            pickupAddress,
          );
        }
      } else if (
        (dto.status === 'picked_up' || dto.status === 'out_for_delivery') &&
        previousStatus !== 'picked_up' &&
        previousStatus !== 'out_for_delivery'
      ) {

        if (order.customer) {
          await this.notificationService.notifyOrderOutForDelivery(order.customer, order.orderId);
        }
      }
    } catch (error) {
      console.error('Error sending restaurant status notifications:', error);
    }

    return savedOrder;
  }


  async updateDeliveryStatus(id: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.findOne(id);
    const previousStatus = order.deliveryPartnerStatus;
    order.deliveryPartnerStatus = dto.status;


    const currentTimestamp = new Date().toISOString();
    const statusMessages: Record<string, string> = {
      assigned: 'Delivery partner assigned',
      on_the_way_to_restaurant: 'Delivery partner is on the way to restaurant',
      reached_restaurant: 'Delivery partner has reached the restaurant',
      picked_up: 'Order picked up by delivery partner',
      out_for_delivery: 'Order is out for delivery',
      on_the_way_to_customer: 'Delivery partner is on the way to customer',
      delivered: 'Order delivered successfully',
      cancelled: 'Delivery cancelled',
    };

    const newTimelineEntry = {
      status: dto.status.toUpperCase(),
      timestamp: currentTimestamp,
      message: statusMessages[dto.status] || `Delivery status: ${dto.status}`,
      updatedBy: 'delivery_partner',
    };

    if (!order.status_timeline) {
      order.status_timeline = [];
    }
    order.status_timeline.push(newTimelineEntry);

    const savedOrder = await this.orderRepo.save(order);


    try {
      if (
        (dto.status === 'picked_up' || dto.status === 'out_for_delivery') &&
        previousStatus !== 'picked_up' &&
        previousStatus !== 'out_for_delivery'
      ) {

        if (order.customer) {
          await this.notificationService.notifyOrderOutForDelivery(order.customer, order.orderId);
        }
      } else if (dto.status === 'delivered' && previousStatus !== 'delivered') {

        if (order.customer) {
          await this.notificationService.notifyOrderDelivered(order.customer, order.orderId);
          await this.referralService.handleOrderDelivered(order.customer, order.orderId);
        }
      }
    } catch (error) {
      console.error('Error sending delivery status notifications:', error);
    }

    return savedOrder;
  }


  async updateDeliveryLocation(id: string, lat: number, lng: number) {

    await this.redisService.set(`delivery:loc:${id}`, { lat, lng }, 3600);


    const lastUpdateKey = `delivery:loc:last_db_success:${id}`;
    const lastUpdate = await this.redisService.get(lastUpdateKey);
    const now = Date.now();

    if (!lastUpdate || now - parseInt(lastUpdate, 10) > 60000) {
      try {
        await this.orderRepo.update(
          { orderId: id },
          {
            delivery_lat: lat,
            delivery_lng: lng,
          },
        );
        await this.redisService.set(lastUpdateKey, now.toString(), 3600);
        console.log(`💾 Persisted location for ${id} to DB`);
      } catch (e: any) {

        console.warn('⚠️ DB Location Update Failed (Redis is Live):', e.message);
      }
    }

    return { status: 'success', lat, lng };
  }




  async updateDeliveryStatusByAdmin(id: string, dto: UpdateDeliveryStatusDto, reason?: string) {

    const order = await this.findOne(id);
    const previousStatus = order.deliveryPartnerStatus;
    const newStatus = dto.status;


    const isCancellation = newStatus === 'cancelled' || newStatus === 'admin_cancelled';


    const currentTimestamp = new Date().toISOString();


    const newTimelineEntry = {
      status: newStatus.toUpperCase(),
      timestamp: currentTimestamp,
      message: isCancellation
        ? `Order cancelled by Admin${reason ? `: ${reason}` : ''}`
        : `Delivery status updated to ${newStatus.replace(/_/g, ' ')}`,
      updatedBy: 'admin',
    };


    const existingTimeline = order.status_timeline || [];


    const updateData: any = {
      deliveryPartnerStatus: newStatus,
      status_timeline: [...existingTimeline, newTimelineEntry],
    };


    if (isCancellation) {
      updateData.status = 'cancelled';
      updateData.restaurantStatus = 'cancelled';
    }


    await this.orderRepo.update({ orderId: id }, updateData);


    if (order.delivery_partner_uid) {
      try {

        const deliveryHistory = await this.deliveryHistoryRepo.findOne({
          where: { order_id: id },
        });

        if (deliveryHistory) {
          deliveryHistory.status = DeliveryStatus.CANCELLED;


          if (!deliveryHistory.status_history) {
            deliveryHistory.status_history = [];
          }
          deliveryHistory.status_history.push({
            status: 'cancelled',
            timestamp: new Date().toISOString(),
            notes: isCancellation
              ? `Admin cancelled: ${reason || 'No reason'}`
              : `Admin changed status to ${newStatus}`,
          });

          await this.deliveryHistoryRepo.save(deliveryHistory);
          console.log(`📋 [ADMIN] Updated delivery_history for order ${id} to CANCELLED`);
        } else {
          console.log(`⚠️ No delivery_history found for order ${id}`);
        }
      } catch (historyError) {
        console.warn('⚠️ Could not update delivery_history:', historyError);

      }
    }


    const updatedOrder = await this.findOne(id);


    try {
      if (isCancellation) {
        console.log(`🚫 [ADMIN] Processing cancellation for order ${order.orderId}`);
        console.log(`   Customer UID: ${order.customer}`);
        console.log(`   Restaurant UID: ${order.restaurant_uid}`);
        console.log(`   Delivery Partner UID: ${order.delivery_partner_uid}`);


        if (order.customer) {
          console.log(
            `📱 [ADMIN] Sending cancellation notification to customer: ${order.customer}`,
          );
          await this.notificationService.notifyUserDeliveryCancelledByAdmin(
            order.customer,
            order.orderId,
            reason,
          );
        }


        if (order.restaurant_uid) {
          console.log(
            `📱 [ADMIN] Sending cancellation notification to restaurant: ${order.restaurant_uid}`,
          );
          await this.notificationService.notifyRestaurantDeliveryCancelledByAdmin(
            order.restaurant_uid,
            order.orderId,
            reason,
          );
        }


        if (order.delivery_partner_uid) {
          console.log(
            `📱 [ADMIN] Sending cancellation notification to delivery partner: ${order.delivery_partner_uid}`,
          );
          await this.notificationService.notifyDeliveryPartnerCancelledByAdmin(
            order.delivery_partner_uid,
            order.orderId,
            reason,
          );
        }

        console.log(
          `✅ [ADMIN] Delivery cancelled for order ${order.orderId}. Reason: ${reason || 'No reason provided'}`,
        );
      } else {

        if (order.delivery_partner_uid) {
          await this.notificationService.notifyDeliveryPartnerStatusChangedByAdmin(
            order.delivery_partner_uid,
            order.orderId,
            newStatus,
          );
        }


        if (
          (newStatus === 'picked_up' || newStatus === 'out_for_delivery') &&
          previousStatus !== 'picked_up' &&
          previousStatus !== 'out_for_delivery'
        ) {
          if (order.customer) {
            await this.notificationService.notifyOrderOutForDelivery(order.customer, order.orderId);
          }
        }

        console.log(
          `📋 [ADMIN] Delivery status updated for order ${order.orderId}: ${previousStatus} -> ${newStatus}`,
        );
      }
    } catch (error) {
      console.error('❌ Error sending admin delivery status notifications:', error);
    }

    return {
      status: 'success',
      message: isCancellation
        ? 'Delivery cancelled successfully. All parties have been notified.'
        : `Delivery status updated to ${newStatus}. Relevant parties have been notified.`,
      order: updatedOrder,
    };
  }


  async getOrderDetailsForRestaurant(orderId: string) {

    const orderResult = await this.orderRepo.query(`SELECT * FROM "orders" WHERE "orderId" = $1`, [
      orderId,
    ]);

    if (!orderResult || orderResult.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orderResult[0];


    let customerDetails: { uid: string; email: string; phone: string; name: string } | null = null;
    if (order.customer) {
      try {
        const customerResult = await this.orderRepo.manager.query(
          `SELECT "userUid", "encryptedEmail", "encryptedPhone", "encryptedUsername" 
           FROM "user_contacts" WHERE "userUid" = $1`,
          [order.customer],
        );
        if (customerResult && customerResult.length > 0) {
          customerDetails = {
            uid: customerResult[0].userUid,
            email: customerResult[0].encryptedEmail,
            phone: customerResult[0].encryptedPhone,
            name: customerResult[0].encryptedUsername || 'Customer',
          };
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    }


    let deliveryPartnerDetails: {
      uid: string;
      name: string;
      phone: string;
      vehicleType: string;
    } | null = null;
    if (order.delivery_partner_uid) {
      try {
        const fleetResult = await this.orderRepo.manager.query(
          `SELECT 
            fp.first_name, 
            fp.last_name, 
            fc."encryptedPhone" as phone, 
            fd.vehicle_type
           FROM "fleets" f
           LEFT JOIN "fleet_profile" fp ON f.uid = fp."fleetUid"
           LEFT JOIN "fleet_contacts" fc ON f.uid = fc."fleetUid"
           LEFT JOIN "fleet_documents" fd ON f.uid = fd."fleetUid"
           WHERE f.uid = $1`,
          [order.delivery_partner_uid],
        );

        if (fleetResult && fleetResult.length > 0) {
          deliveryPartnerDetails = {
            uid: order.delivery_partner_uid,
            name:
              `${fleetResult[0].first_name || ''} ${fleetResult[0].last_name || ''}`.trim() ||
              'Delivery Partner',
            phone: fleetResult[0].phone || 'N/A',
            vehicleType: fleetResult[0].vehicle_type || 'Bike',
          };
        }
      } catch (error) {
        console.error('Error fetching delivery partner details:', error);
      }
    }


    let restaurantName = 'Unknown Restaurant';
    if (order.restaurant_uid) {
      try {
        const resResult = await this.orderRepo.manager
          .createQueryBuilder()
          .select('rp.restaurant_name', 'restaurant_name')
          .from('restaurants', 'r')
          .leftJoin('restaurant_profile', 'rp', 'r.uid = rp."restaurantUid"')
          .where('r.uid = :uid', { uid: order.restaurant_uid })
          .getRawOne();

        if (resResult && resResult.restaurant_name) {
          restaurantName = resResult.restaurant_name;
        }
      } catch (error) {
        console.error('Error fetching restaurant name:', error);
      }
    }




    const rawItemTotal = Number(order.item_total) || 0;
    const baseFoodValue = Number((rawItemTotal / 1.08).toFixed(2));
    const restaurantCommission = Number((baseFoodValue * 0.08).toFixed(2));
    const restaurantTotal = Number((baseFoodValue + restaurantCommission).toFixed(2));


    let items = order.items || [];
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }
    const markedDownItems = Array.isArray(items)
      ? items.map((item) => ({
        ...item,
        price: Number((Number(item.price) / 1.08).toFixed(2)),
      }))
      : [];

    return {
      order: {
        id: order.id,
        orderId: order.orderId,
        time: order.time,
        createdAt: order.createdAt || order.time,
        price: restaurantTotal,
        items: markedDownItems,
        restaurantStatus: order.restaurantStatus,
        deliveryPartnerStatus: order.deliveryPartnerStatus,
        payment_mode: order.payment_mode,
        restaurant_uid: order.restaurant_uid,
        restaurant_name: restaurantName,
        estimated_time: order.estimated_time || '5 min',
        delivery_partner_uid: order.delivery_partner_uid,
        restaurant_lat: order.restaurant_lat,
        restaurant_lng: order.restaurant_lng,
        customer_lat: order.customer_lat,
        customer_lng: order.customer_lng,
        deliveryProof: order.delivery_proof_photo,
      },
      customer: customerDetails,
      deliveryPartner: deliveryPartnerDetails,
      billSummary: {
        itemTotal: baseFoodValue,
        gst: restaurantCommission,
        deliveryCharge: 0,
        grandTotal: restaurantTotal,
      },
    };
  }


  async getOrderDetailsForAdmin(orderId: string) {

    const orderResult = await this.orderRepo.query(`SELECT * FROM "orders" WHERE "orderId" = $1`, [
      orderId,
    ]);

    if (!orderResult || orderResult.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orderResult[0];


    let customerDetails = {
      name: 'Guest',
      customerId: order.customer || 'N/A',
      email: 'N/A',
      mobile: 'N/A',
      deliveryAddress: order.delivery_address || 'N/A',
    };
    if (order.customer) {
      try {
        const customerResult = await this.orderRepo.manager.query(
          `SELECT "userUid", "encryptedEmail", "encryptedPhone", "encryptedUsername" 
           FROM "user_contacts" WHERE "userUid" = $1`,
          [order.customer],
        );
        if (customerResult && customerResult.length > 0) {
          customerDetails.name = customerResult[0].encryptedUsername || 'Customer';
          customerDetails.customerId = customerResult[0].userUid;
          customerDetails.email = customerResult[0].encryptedEmail;
          customerDetails.mobile = customerResult[0].encryptedPhone;
        }


        try {
          const profileResult = await this.orderRepo.manager.query(
            `SELECT "firstName", "lastName" FROM "user_profile" WHERE "userUid" = $1`,
            [order.customer]
          );
          if (profileResult && profileResult.length > 0) {
            const { firstName, lastName } = profileResult[0];
            if (firstName || lastName) {
              customerDetails.name = `${firstName || ''} ${lastName || ''}`.trim();
            }
          }
        } catch (e) {

        }

      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    }


    let deliveryPartnerDetails: any = null;
    if (order.delivery_partner_uid) {
      try {
        const fleetResult = await this.orderRepo.manager.query(
          `SELECT 
            fp.first_name, 
            fp.last_name, 
            fc."encryptedPhone" as phone, 
            fd.vehicle_type, 
            fd."registrationNumber"
           FROM "fleets" f
           LEFT JOIN "fleet_profile" fp ON f.uid = fp."fleetUid"
           LEFT JOIN "fleet_contacts" fc ON f.uid = fc."fleetUid"
           LEFT JOIN "fleet_documents" fd ON f.uid = fd."fleetUid"
           WHERE f.uid = $1`,
          [order.delivery_partner_uid],
        );

        if (fleetResult && fleetResult.length > 0) {
          deliveryPartnerDetails = {
            name:
              `${fleetResult[0].first_name || ''} ${fleetResult[0].last_name || ''}`.trim() ||
              'Delivery Partner',
            partnerId: order.delivery_partner_uid,
            mobile: fleetResult[0].phone || 'N/A',
            vehicleType: fleetResult[0].vehicle_type || 'Bike',
            vehicleNumber: fleetResult[0].registrationNumber || 'N/A',
          };
        }
      } catch (error) {
        console.error('Error fetching delivery partner details:', error);
      }
    }


    let restaurantInfo = {
      name: 'Unknown Restaurant',
      email: 'N/A',
      mobile: 'N/A',
      address: 'N/A',
    };
    if (order.restaurant_uid) {
      try {
        const resProfile = await this.orderRepo.manager.query(
          `SELECT restaurant_name, contact_email, contact_number FROM restaurant_profile WHERE "restaurantUid" = $1`,
          [order.restaurant_uid],
        );
        const resAddress = await this.orderRepo.manager.query(
          `SELECT address FROM restaurant_address WHERE "restaurantUid" = $1`,
          [order.restaurant_uid],
        );

        if (resProfile && resProfile.length > 0) {
          restaurantInfo.name = resProfile[0].restaurant_name;
          restaurantInfo.email = resProfile[0].contact_email;
          restaurantInfo.mobile = resProfile[0].contact_number;
        }
        if (resAddress && resAddress.length > 0) {
          restaurantInfo.address = resAddress[0].address;
        }
      } catch (error) {
        console.error('Error fetching restaurant name:', error);
      }
    }


    const itemTotal = Number(order.item_total) || 0;
    const taxes = Number(order.taxes) || 0;
    const deliveryCharge = Number(order.delivery_fee) || 0;
    const packingCharge = Number(order.packing_charge) || 0;
    const adminCommission = Number(order.admin_commission) || 0;
    const grandTotal = Number(order.price) || 0;
    const adminEarnings = Number((adminCommission + deliveryCharge).toFixed(2));


    let timeline = this.buildCompleteTimeline(order);


    const completedEntries = timeline.filter((entry: any) => entry.timestamp);
    const latestTimelineEntry =
      completedEntries.length > 0 ? completedEntries[completedEntries.length - 1] : null;
    const lastUpdatedTime = latestTimelineEntry?.timestamp || order.updatedAt || order.time;

    let prepTime = 5;
    if (order.estimated_time) {
      const match = order.estimated_time.match(/(\d+)/);
      if (match) prepTime = parseInt(match[1]);
    }

    const deliveryTime = order.distance_km
      ? `${Math.max(prepTime + 5, Math.ceil(order.distance_km * 5) + prepTime)} mins`
      : '30-45 mins';

    const paymentMethodStr = order.payment_mode
      ? order.payment_mode.toUpperCase() === 'COD'
        ? 'COD'
        : 'ONLINE'
      : 'ONLINE';

    return {
      orderId: order.orderId,
      lastUpdated: lastUpdatedTime,
      deliveryTime: deliveryTime,
      paymentMethod: paymentMethodStr,
      restaurant_name: restaurantInfo.name,
      restaurantInformation: {
        email: restaurantInfo.email,
        mobile: restaurantInfo.mobile,
        address: restaurantInfo.address,
      },
      orderSummary: {
        orderPlacement: order.time,
        totalAmount: grandTotal.toFixed(2),
        paymentMethod: paymentMethodStr,
        discountApplied: 0,
      },
      items: order.items || [],
      priceSummary: {
        subtotal: itemTotal,
        tax: taxes,
        deliveryFee: deliveryCharge,
        packingCharge: packingCharge,
        adminEarnings: adminEarnings,
        discount: Number(order.coupon_discount) || 0,
        total: grandTotal,
      },
      customerInformation: {
        name: customerDetails.name,
        customerId: customerDetails.customerId,
        email: customerDetails.email,
        mobile: customerDetails.mobile,
        deliveryAddress: customerDetails.deliveryAddress,
      },
      deliveryPartnerInformation: deliveryPartnerDetails,
      deliveryProof: order.delivery_proof_photo,
      orderTimeline: timeline,
    };
  }

  async findAvailableForDelivery(userLat?: number, userLng?: number) {
    const orders = await this.orderRepo.query(
      `SELECT 
        o.*,
        rp.restaurant_name,
        rad.address as pickup_address,
        rad.lat as pickup_lat,
        rad.lng as pickup_lng,
        COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), uc."encryptedUsername", 'Customer') as customer_name,
        uc."encryptedPhone" as customer_phone
       FROM "orders" o
       LEFT JOIN "restaurants" r ON o.restaurant_uid = r.uid
       LEFT JOIN "restaurant_profile" rp ON r.uid = rp."restaurantUid"
       LEFT JOIN "restaurant_address" rad ON r.uid = rad."restaurantUid"
       LEFT JOIN "user_contacts" uc ON o.customer = uc."userUid"
       LEFT JOIN "user_profile" up ON o.customer = up."userUid"
       WHERE o."restaurantStatus" IN ('accepted', 'preparing', 'ready') 
       AND (o."delivery_partner_uid" IS NULL OR o."delivery_partner_uid" = '')
       ORDER BY o."time" DESC`,
    );


    if (userLat && userLng) {
      const enrichedOrders = orders.map((order: any) => {
        const pickupLat = parseFloat(order.pickup_lat);
        const pickupLng = parseFloat(order.pickup_lng);

        let distance = Infinity;
        if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
          distance = this.calculateHaversineDistance(userLat, userLng, pickupLat, pickupLng);
        }

        return {
          ...order,
          distance_from_partner_km: distance,
        };
      });


      const filtered = enrichedOrders.filter((o: any) => o.distance_from_partner_km <= 7.0);


      filtered.sort((a: any, b: any) => a.distance_from_partner_km - b.distance_from_partner_km);

      return filtered;
    }

    return orders;
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }


  async assignDeliveryPartner(orderId: string, partnerUid: string, partnerName?: string) {
    const order = await this.findOne(orderId);

    if (order.delivery_partner_uid) {
      throw new BadRequestException('Order already assigned to a delivery partner');
    }

    order.delivery_partner_uid = partnerUid;
    order.deliveryPartnerStatus = 'assigned';


    const currentTimestamp = new Date().toISOString();
    const deliveryPartnerDisplayName = partnerName || 'Delivery Partner';

    const newTimelineEntry = {
      status: 'ASSIGNED',
      timestamp: currentTimestamp,
      message: `Delivery partner ${deliveryPartnerDisplayName} assigned to your order`,
      updatedBy: 'system',
    };

    if (!order.status_timeline) {
      order.status_timeline = [];
    }
    order.status_timeline.push(newTimelineEntry);


    const savedOrder = await this.orderRepo.save(order);


    try {
      const deliveryPartnerDisplayName = partnerName || 'Delivery Partner';


      if (order.customer) {
        await this.notificationService.notifyDeliveryAssigned(
          order.customer,
          order.orderId,
          deliveryPartnerDisplayName,
        );
      }


      if (order.restaurant_uid) {
        await this.notificationService.notifyRestaurantDeliveryAssigned(
          order.restaurant_uid,
          order.orderId,
          deliveryPartnerDisplayName,
        );
      }
    } catch (error) {
      console.error('Error sending delivery partner assignment notifications:', error);
    }

    return savedOrder;
  }


  async findByDeliveryPartner(partnerUid: string) {
    return this.orderRepo.query(
      `SELECT 
            o.*,
            rp.restaurant_name,
            rad.address as pickup_address,
            rad.lat as pickup_lat,
            rad.lng as pickup_lng,
            COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), uc."encryptedUsername", 'Customer') as customer_name,
            uc."encryptedPhone" as customer_phone
           FROM "orders" o
           LEFT JOIN "restaurants" r ON o.restaurant_uid = r.uid
           LEFT JOIN "restaurant_profile" rp ON r.uid = rp."restaurantUid"
           LEFT JOIN "restaurant_address" rad ON r.uid = rad."restaurantUid"
           LEFT JOIN "user_contacts" uc ON o.customer = uc."userUid"
           LEFT JOIN "user_profile" up ON o.customer = up."userUid"
           WHERE o."delivery_partner_uid" = $1 
           AND o."deliveryPartnerStatus" NOT IN ('cancelled', 'admin_cancelled', 'delivered')
           AND o."status" NOT IN ('cancelled')
           ORDER BY o."time" DESC`,
      [partnerUid],
    );
  }


  async findOneForDelivery(orderId: string) {
    const res = await this.orderRepo.query(
      `SELECT 
        o.*,
        rp.restaurant_name,
        rad.address as pickup_address,
        rad.lat as pickup_lat,
        rad.lng as pickup_lng,
        COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), uc."encryptedUsername", 'Customer') as customer_name,
        uc."encryptedPhone" as customer_phone
       FROM "orders" o
       LEFT JOIN "restaurants" r ON o.restaurant_uid = r.uid
       LEFT JOIN "restaurant_profile" rp ON r.uid = rp."restaurantUid"
       LEFT JOIN "restaurant_address" rad ON r.uid = rad."restaurantUid"
       LEFT JOIN "user_contacts" uc ON o.customer = uc."userUid"
       LEFT JOIN "user_profile" up ON o.customer = up."userUid"
       WHERE o."orderId" = $1`,
      [orderId],
    );
    return res[0];
  }


  async sendDeliveryOtp(orderId: string, phone?: string) {
    const order = await this.orderRepo.findOne({ where: { orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (!order.user_otp) {
      order.user_otp = this.generateOTP();
      await this.orderRepo.save(order);
    }


    let customerPhone = phone;
    if (!customerPhone && order.customer) {
      const enriched = await this.findOneForDelivery(orderId);
      customerPhone = enriched?.customer_phone;
    }

    console.log(`📨 Sending OTP ${order.user_otp} to ${customerPhone || 'Customer'}`);




    return {
      status: 'success',
      message: 'OTP sent successfully',
      otp: order.user_otp,
      customer_phone: customerPhone,
    };
  }


  async verifyDeliveryOtp(orderId: string, otp: string) {
    console.log(`🚀 [DEBUG] verifyDeliveryOtp called for Order: ${orderId}`);
    const order = await this.orderRepo.findOne({ where: { orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.user_otp !== otp) {


      throw new BadRequestException('Invalid OTP');
    }


    order.deliveryPartnerStatus = 'delivered';
    order.status = 'completed';
    order.restaurantStatus = 'completed';

    await this.orderRepo.save(order);




    console.log(`🔍 [DEBUG] Syncing DeliveryHistory for Order ${orderId}`);
    const history = await this.deliveryHistoryRepo.findOne({ where: { order_id: orderId } });
    if (history) {
      console.log(`📝 [DEBUG] Found History. Current Status: ${history.status}`);
      history.otp_verified = true;
      history.otp_verified_at = new Date();
      history.status = DeliveryStatus.DELIVERED;
      history.delivered_at = new Date();
      history.status_history = [
        ...(history.status_history || []),
        {
          status: DeliveryStatus.DELIVERED,
          timestamp: new Date().toISOString(),
          notes: 'Order Verified via OTP & Completed',
        },
      ];

      if (history.accepted_at) {
        const acceptedTime = new Date(history.accepted_at).getTime();
        const deliveredTime = new Date().getTime();
        history.actual_time_min = Math.round((deliveredTime - acceptedTime) / 60000);
      }
      const saved = await this.deliveryHistoryRepo.save(history);
      console.log(`✅ [DEBUG] DeliveryHistory saved. New Status: ${saved.status}`);
    } else {
      console.warn(`⚠️ [DEBUG] No DeliveryHistory found for order_id: ${orderId} in OrdersService`);
    }


    if (order.customer) {
      await this.notificationService.notifyOrderDelivered(order.customer, order.orderId);
    }

    return {
      status: 'success',
      message: 'Order verified and delivered (Synced)',
      orderId: order.orderId,
    };
  }



  async completeDelivery(
    orderId: string,
    notes?: string,
    paymentCollected?: boolean,
    deliveryPhoto?: MulterFile,
  ) {
    const order = await this.orderRepo.findOne({ where: { orderId } });
    if (!order) throw new NotFoundException('Order not found');


    if (order.deliveryPartnerStatus !== 'delivered') {
      order.deliveryPartnerStatus = 'delivered';
    }
    order.status = 'completed';


    if (deliveryPhoto) {
      try {
        const uploadResult = await this.fileService.uploadImage(deliveryPhoto);
        order.delivery_proof_photo = uploadResult.url;
        console.log(`📸 Delivery proof uploaded: ${uploadResult.url}`);
      } catch (err) {
        console.error('❌ Failed to upload delivery proof:', err);

      }
    }

    if (notes) {
      order.notes = notes;
    }


    if (paymentCollected && order.payment_mode === 'COD') {


    }

    await this.orderRepo.save(order);




    console.log(`🔍 [DEBUG] completeDelivery: Syncing DeliveryHistory for Order ${orderId}`);
    const history = await this.deliveryHistoryRepo.findOne({ where: { order_id: orderId } });
    if (history) {
      console.log(`📝 [DEBUG] completeDelivery: Found History. Status: ${history.status}`);
      if (history.status !== DeliveryStatus.DELIVERED) {
        history.status = DeliveryStatus.DELIVERED;
        history.delivered_at = new Date();


        if (history.accepted_at && !history.actual_time_min) {
          const acceptedTime = new Date(history.accepted_at).getTime();
          const deliveredTime = new Date().getTime();
          history.actual_time_min = Math.round((deliveredTime - acceptedTime) / 60000);
        }
      }
      if (notes) history.delivery_notes = notes;
      if (paymentCollected !== undefined) history.payment_collected = paymentCollected;



      await this.deliveryHistoryRepo.save(history);
      console.log(`✅ [DEBUG] completeDelivery: DeliveryHistory updated.`);
    } else {
      console.warn(
        `⚠️ [DEBUG] completeDelivery: No DeliveryHistory found for order_id: ${orderId}`,
      );
    }

    return {
      status: 'success',
      message: 'Delivery completed successfully',
      orderId: order.orderId,
      deliveryProof: order.delivery_proof_photo,
    };
  }


  async getAnalytics(restaurantUid: string, period: string) {

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'Last 7 Days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'Last 3 Months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'Last Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }


    const orders = await this.orderRepo.find({
      where: {
        restaurant_uid: restaurantUid,
        createdAt: MoreThanOrEqual(startDate),
      },
      order: { createdAt: 'ASC' },
    });


    let totalSales = 0;
    let totalOrders = 0;
    const salesBreakdown: Record<string, number> = {};
    const popularDishesMap: Record<string, { count: number; revenue: number; price: number }> = {};
    const orderBreakdown = { delivery: 0, pickup: 0 };
    const peakHours: Record<number, number> = {};

    for (const order of orders) {
      if (['rejected', 'cancelled'].includes(order.restaurantStatus)) continue;

      totalOrders++;
      const amt = Number(order.price) || 0;
      totalSales += amt;


      const dateKey = order.createdAt.toISOString().split('T')[0];
      salesBreakdown[dateKey] = (salesBreakdown[dateKey] || 0) + amt;


      const hour = new Date(order.createdAt).getHours();
      peakHours[hour] = (peakHours[hour] || 0) + 1;


      if (order.delivery_partner_uid || order.delivery_fee > 0) {
        orderBreakdown.delivery++;
      } else {
        orderBreakdown.pickup++;
      }


      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const name = item.name || item.menu_name || 'Unknown Item';
          const price = Number(item.price) || 0;
          const qty = Number(item.qty) || 1;

          if (!popularDishesMap[name]) {
            popularDishesMap[name] = { count: 0, revenue: 0, price: price };
          }
          popularDishesMap[name].count += qty;
          popularDishesMap[name].revenue += price * qty;
        }
      }
    }


    let totalBookings = 0;
    try {
      const bookingsCountResult = await this.orderRepo.query(
        `SELECT COUNT(*) as count FROM "bookings" b
         JOIN "restaurants" r ON b.restaurant_id = r.id
         WHERE r.uid = $1 AND b.created_at >= $2`,
        [restaurantUid, startDate],
      );
      totalBookings = parseInt(bookingsCountResult[0].count, 10) || 0;
    } catch (e: any) {
      console.warn('Could not fetch bookings count:', e.message);
    }

    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;


    const salesTrend: { day: string; amount: number }[] = [];
    const nowLocal = new Date();

    const baseDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());

    if (period === 'Last Year') {

      for (let i = 11; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthVal = d.getMonth();
        const yearVal = d.getFullYear();

        let monthTotal = 0;
        for (const [dateStr, amt] of Object.entries(salesBreakdown)) {
          const dateObj = new Date(dateStr);
          if (dateObj.getUTCMonth() === monthVal && dateObj.getUTCFullYear() === yearVal) {
            monthTotal += amt;
          }
        }
        salesTrend.push({ day: monthName, amount: monthTotal });
      }
    } else {

      const daysCount = period === 'Last 7 Days' ? 7 : period === 'Last 30 Days' ? 30 : 90;
      const bucketSize = period === 'Last 3 Months' ? 3 : 1;

      for (let i = daysCount - 1; i >= 0; i -= bucketSize) {
        let bucketAmt = 0;
        const bucketDate = new Date(baseDate);
        bucketDate.setDate(baseDate.getDate() - i);
        const label = bucketDate.toISOString().split('T')[0].substring(5);

        for (let j = 0; j < bucketSize; j++) {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() - (i - j));
          const key = d.toISOString().split('T')[0];
          bucketAmt += salesBreakdown[key] || 0;
        }
        salesTrend.push({ day: label, amount: bucketAmt });
      }
    }

    const popularDishes = Object.entries(popularDishesMap)
      .map(([name, stats]) => ({
        name,
        orders: stats.count,
        revenue: stats.revenue,
        price: stats.price,
      }))
      .sort((a, b) => b.orders - a.orders);

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: peakHours[i] || 0,
    }));

    return {
      totalSales,
      totalOrders,
      totalBookings,
      averageOrderValue,
      salesTrend,
      popularDishes: popularDishes.slice(0, 5),
      allMenuStats: popularDishes,
      orderBreakdown,
      hourlyData,
      periods: ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last Year'],
    };
  }


  async getAdminAnalytics(period: string) {

    const now = new Date();
    const startDate = new Date();
    let previousStartDate = new Date();

    switch (period) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case 'thismonth':
        startDate.setDate(1);
        previousStartDate.setMonth(now.getMonth() - 1);
        previousStartDate.setDate(1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
    }





    const orders = await this.orderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),




      },
      order: { createdAt: 'ASC' },
    });


    let totalRevenue = 0;
    let totalOrdersCount = 0;
    let activeCustomersSet = new Set<string>();


    const dailyData: Record<string, number> = {};
    const restaurantRevenue: Record<string, { name: string; revenue: number }> = {};
    const orderSourceCount = { delivery: 0, pickup: 0 };
    const categoryRevenue: Record<string, { orders: number; revenue: number }> = {};



    const allMenuItemIds = new Set<number>();
    const allMenuItemUids = new Set<string>();

    let debugLogged = false;

    for (const order of orders) {


      if (['rejected', 'cancelled'].includes(order.restaurantStatus)) continue;

      if (!debugLogged && order.items && order.items.length > 0) {
        console.log('DEBUG: First Order Items Structure:', JSON.stringify(order.items, null, 2));
        debugLogged = true;
      }

      totalOrdersCount++;



      const adminCommission = Number(order.admin_commission) || (Number(order.item_total) / 1.08 * 0.08);
      const deliveryFee = Number(order.delivery_fee) || 0;
      const packingCharge = Number(order.packing_charge) || (order.item_total ? 10 : 0);

      const adminRevenue = Number((adminCommission + deliveryFee).toFixed(2));

      totalRevenue += adminRevenue;

      if (order.customer) activeCustomersSet.add(order.customer);


      const day = order.createdAt.toISOString().split('T')[0];
      dailyData[day] = Number(((dailyData[day] || 0) + adminRevenue).toFixed(2));


      if (order.restaurant_uid) {
        if (!restaurantRevenue[order.restaurant_uid]) {
          restaurantRevenue[order.restaurant_uid] = { name: 'Unknown', revenue: 0 };
        }
        restaurantRevenue[order.restaurant_uid].revenue = Number(
          (restaurantRevenue[order.restaurant_uid].revenue + adminRevenue).toFixed(2),
        );
      }


      if (order.delivery_partner_uid || order.delivery_fee > 0) {
        orderSourceCount.delivery++;
      } else {
        orderSourceCount.pickup++;
      }


      if (Array.isArray(order.items)) {
        for (const item of order.items) {


          const rawId =
            item.menuItemId ||
            item.menu_item_id ||
            item.menu_uid ||
            (item.food && (item.food.id || item.food.menuItemId || item.food.menu_uid)) ||
            item.id;

          if (rawId) {

            const numId = Number(rawId);
            if (!isNaN(numId) && typeof rawId !== 'string') {
              allMenuItemIds.add(numId);
            } else if (
              typeof rawId === 'string' &&
              !isNaN(parseFloat(rawId)) &&
              isFinite(rawId as any) &&
              !rawId.includes('-') &&
              !rawId.startsWith('MNU')
            ) {

              allMenuItemIds.add(Number(rawId));
            } else {

              allMenuItemUids.add(String(rawId));
            }
          }
        }
      }
    }


    const restaurantUids = Object.keys(restaurantRevenue);
    if (restaurantUids.length > 0) {
      try {
        const restaurants = await this.orderRepo.query(
          `SELECT r.uid, rp.restaurant_name 
           FROM restaurants r 
           LEFT JOIN restaurant_profile rp ON r.uid = rp."restaurantUid" 
           WHERE r.uid IN (${restaurantUids.map((id) => `'${id}'`).join(',')})`,
        );
        for (const r of restaurants) {
          if (restaurantRevenue[r.uid]) {
            restaurantRevenue[r.uid].name = r.restaurant_name;
          }
        }
      } catch (e) {
        console.error('Error fetching rest names', e);
      }
    }


    console.log('Unique Menu Item IDs collected:', Array.from(allMenuItemIds));
    console.log('Unique Menu Item UIDs collected:', Array.from(allMenuItemUids));

    const menuCategoryMap = new Map<string | number, string>();


    if (allMenuItemIds.size > 0) {
      try {
        const query = `SELECT id, category FROM restaurant_menus WHERE id IN (${Array.from(allMenuItemIds).join(',')})`;

        const menus = await this.orderRepo.manager.query(query);
        for (const m of menus) {
          menuCategoryMap.set(Number(m.id), m.category || 'Uncategorized');
        }
      } catch (e) {
        console.error('Error fetching categories by ID', e);
      }
    }


    if (allMenuItemUids.size > 0) {
      try {

        const uidsList = Array.from(allMenuItemUids)
          .map((u) => `'${u}'`)
          .join(',');
        const query = `SELECT menu_uid, category FROM restaurant_menus WHERE menu_uid IN (${uidsList})`;

        const menus = await this.orderRepo.manager.query(query);
        for (const m of menus) {
          menuCategoryMap.set(m.menu_uid, m.category || 'Uncategorized');
        }
      } catch (e) {
        console.error('Error fetching categories by UID', e);
      }
    }

    if (menuCategoryMap.size > 0) {

      for (const order of orders) {
        if (['rejected', 'cancelled'].includes(order.restaurantStatus)) continue;
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const rawId =
              item.menuItemId ||
              item.menu_item_id ||
              item.menu_uid ||
              (item.food && (item.food.id || item.food.menuItemId || item.food.menu_uid)) ||
              item.id;

            let cat = 'Unknown';

            if (rawId) {

              const numId = Number(rawId);
              if (!isNaN(numId) && menuCategoryMap.has(numId)) {
                cat = menuCategoryMap.get(numId) || 'Unknown';
              }

              else if (menuCategoryMap.has(String(rawId))) {
                cat = menuCategoryMap.get(String(rawId)) || 'Unknown';
              }
            }


            const itemTotalPrice =
              (Number(item.price) || 0) * (Number(item.qty) || Number(item.quantity) || 1);
            const adminCommission = (itemTotalPrice / 1.08) * 0.08;

            if (!categoryRevenue[cat]) categoryRevenue[cat] = { orders: 0, revenue: 0 };

            const qty = Number(item.qty) || Number(item.quantity) || 1;
            categoryRevenue[cat].orders += qty;
            categoryRevenue[cat].revenue += adminCommission;
          }
        }
      }
    } else {
      console.log('No menu categories found for items.');
    }


    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;


    const salesReportChart = Object.entries(dailyData)
      .map(([date, sales]) => ({
        day: date,
        sales,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));


    const topRestaurants = Object.values(restaurantRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);


    const totalSource = orderSourceCount.delivery + orderSourceCount.pickup;
    const orderSourceChart = [
      {
        name: 'Delivery',
        value: totalSource ? Math.round((orderSourceCount.delivery / totalSource) * 100) : 0,
        color: '#EF4444',
      },
      {
        name: 'Pickup/Dine-in',
        value: totalSource ? Math.round((orderSourceCount.pickup / totalSource) * 100) : 0,
        color: '#3B82F6',
      },
    ];


    const categoryDetails = Object.entries(categoryRevenue)
      .map(([cat, stats]) => {

        return {
          category: cat,
          orders: stats.orders,
          revenue: stats.revenue.toFixed(2),
          avgOrder: (stats.revenue / stats.orders).toFixed(2),
          growth: '+0%',
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    return {
      totalRevenue,
      totalOrders: totalOrdersCount,
      avgOrderValue,
      activeCustomers: activeCustomersSet.size,
      dailySalesData: salesReportChart,
      topRestaurantsData: topRestaurants,
      orderSourceData: orderSourceChart,
      categoryData: categoryDetails,
    };
  }


  async getOrderMonitoringStats(userUid: string, role: string) {
    const stats = {
      all: 0,
      active: 0,
      pending: 0,
      delivered: 0,
      cancelled: 0,
    };

    try {

      const counters = await this.orderRepo.query(`
        SELECT
            COUNT(*) as "all",
            COUNT(CASE WHEN "restaurantStatus" IN ('new', 'pending', 'payment_pending', 'pending_payment', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'C008', 'C007', 'payment_initiated', 'PAYMENT_INITIATED') OR "status" IN ('payment_pending', 'pending_payment', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'C008') THEN 1 END) as "pending",
            COUNT(CASE WHEN "restaurantStatus" IN ('accepted', 'preparing', 'ready') AND "deliveryPartnerStatus" != 'delivered' THEN 1 END) as "active",
            COUNT(CASE WHEN "deliveryPartnerStatus" = 'delivered' THEN 1 END) as "delivered",
            COUNT(CASE WHEN "restaurantStatus" IN ('rejected', 'cancelled') THEN 1 END) as "cancelled"
        FROM "orders"
        `);

      if (counters && counters.length > 0) {
        stats.all = parseInt(counters[0].all, 10) || 0;
        stats.pending = parseInt(counters[0].pending, 10) || 0;
        stats.active = parseInt(counters[0].active, 10) || 0;
        stats.delivered = parseInt(counters[0].delivered, 10) || 0;
        stats.cancelled = parseInt(counters[0].cancelled, 10) || 0;
      }
    } catch (e) {
      console.error('Error fetching monitoring stats:', e);
    }

    return stats;
  }


  async reassignDeliveryPartner(orderId: string, newPartnerUid: string, reason?: string) {
    const order = await this.findOne(orderId);
    const oldPartnerUid = order.delivery_partner_uid;

    if (!newPartnerUid) {
      throw new BadRequestException('New delivery partner UID is required');
    }

    if (oldPartnerUid === newPartnerUid) {
      throw new BadRequestException('Order is already assigned to this partner');
    }


    let newPartnerName = 'Delivery Partner';
    try {
      const res = await this.orderRepo.manager.query(
        `SELECT first_name, last_name FROM fleet_profile WHERE "fleetUid" = $1`,
        [newPartnerUid],
      );
      if (res && res.length > 0) {
        newPartnerName = `${res[0].first_name} ${res[0].last_name}`.trim();
      }
    } catch (e) {
      console.warn('Could not fetch new partner name', e);
    }


    order.delivery_partner_uid = newPartnerUid;
    order.deliveryPartnerStatus = 'assigned';


    const currentTimestamp = new Date().toISOString();
    const timelineEntry = {
      status: 'REASSIGNED',
      timestamp: currentTimestamp,
      message: `Order reassigned to ${newPartnerName} by Admin.${reason ? ` Reason: ${reason}` : ''}`,
      updatedBy: 'admin',
    };
    if (!order.status_timeline) {
      order.status_timeline = [];
    }
    order.status_timeline.push(timelineEntry);

    const savedOrder = await this.orderRepo.save(order);


    try {

      if (oldPartnerUid) {
        await this.deliveryHistoryRepo.update(
          { order_id: orderId, fleet_uid: oldPartnerUid },
          { status: DeliveryStatus.CANCELLED },
        );
      }


      const deliveryHistory = this.deliveryHistoryRepo.create({
        order_id: orderId,
        fleet_uid: newPartnerUid,
        accepted_at: new Date(),
        status: DeliveryStatus.ACCEPTED,
        status_history: [
          {
            status: 'assigned',
            timestamp: currentTimestamp,
            notes: `Reassigned by Admin. ${reason || ''}`,
          },
        ],
      });
      await this.deliveryHistoryRepo.save(deliveryHistory);
    } catch (err) {
      console.error('Error updating delivery history during reassignment:', err);
    }



    if (oldPartnerUid) {
      try {
        await this.notificationService.notifyDeliveryPartnerCancelledByAdmin(
          oldPartnerUid,
          orderId,
          'Order Reassigned by Admin',
        );
      } catch (e) {
        console.error('Failed to notify old partner:', e);
      }
    }


    try {
      const restaurantName = order.restaurant_name || 'Restaurant';
      const pickupAddress = order.delivery_address || 'Pickup location';


      await this.notificationService.notifyDeliveryPartnerAssignedJob(
        newPartnerUid,
        orderId,
        restaurantName,
        pickupAddress,
      );
    } catch (e) {
      console.error('Failed to notify new partner:', e);
    }


    if (order.customer) {
      try {
        await this.notificationService.notifyDeliveryAssigned(
          order.customer,
          orderId,
          newPartnerName,
        );
      } catch (e) {
        console.error('Failed to notify customer:', e);
      }
    }

    return savedOrder;
  }
}
