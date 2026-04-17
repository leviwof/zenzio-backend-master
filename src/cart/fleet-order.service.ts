import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CartGroup } from './entity/cart-group.entity';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
import { CartOrderStatus } from 'src/constants/status.constants';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Order } from 'src/orders/order.entity';
import { User } from 'src/users/user.entity';
import { DeliveryLocation } from 'src/delivery-location/delivery_location.entity';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class FleetOrderService {
  constructor(
    @InjectRepository(CartGroup)
    private readonly groupRepo: Repository<CartGroup>,
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DeliveryLocation)
    private readonly deliveryLocationRepo: Repository<DeliveryLocation>,
    private readonly redisService: RedisService,
  ) {}

  // ==========================================================
  // AVAILABLE ORDERS (NEARBY)
  // ==========================================================
  async getAvailableOrders(fleet_uid: string, lat: number, lng: number, radius: number) {
    // 0. Update live location in Redis (TTL 5 mins)
    if (lat !== undefined && lng !== undefined) {
      await this.redisService.set(
        `fleet:location:${fleet_uid}`,
        {
          lat,
          lng,
          updatedAt: new Date().toISOString(),
        },
        300,
      );
    }

    // 1. Check if fleet is active
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleet_uid } });
    if (!fleet) throw new NotFoundException('Fleet not found');

    // If inactive, return empty list (no orders received)
    if (!fleet.isActive) {
      return {
        status: 'success',
        code: 200,
        message: 'You are offline. Go online to receive orders.',
        data: [],
      };
    }

    // 2. Find available orders
    // Criteria:
    // - Restaurant Accepted (R_ACCEPTED) OR Ready for Pickup (R_READY_FOR_PICKUP)
    // - No fleet assigned yet (fleet_uid IS NULL)
    // - (Optional) Distance check - omitted for now as per requirement to show "visible" orders with large radius

    const availableOrders = await this.groupRepo.find({
      where: [
        {
          r_status: CartOrderStatus.R_ACCEPTED.code,
          f_status: '0', // Assuming '0' is default for unassigned
        },
        {
          r_status: CartOrderStatus.R_READY_FOR_PICKUP.code,
          f_status: '0',
        },
      ],
      order: { createdAt: 'DESC' },
    });

    // Filter out orders that already have a fleet_uid (just in case default '0' isn't checking nulls correctly if schema changed)
    const unassignedOrders = availableOrders.filter((o) => !o.fleet_uid);

    // 3. Enrich orders for consistent frontend experience
    const enrichedOrders = unassignedOrders.map((o) => ({
      ...o,
      price: Number(o.grand_total) || Number(o.subtotal) || 0,
      payment_mode: o.pay_mode,
    }));

    return {
      status: 'success',
      code: 200,
      message: 'Available orders fetched successfully',
      data: enrichedOrders,
    };
  }

  // ==========================================================
  // EARNINGS
  // ==========================================================
  async getFleetEarnings(fleet_uid: string) {
    // Get all completed orders for this fleet
    const completedOrders = await this.groupRepo.find({
      where: {
        fleet_uid: fleet_uid,
        f_status: CartOrderStatus.F_HANDOVER_COMPLETE.code,
      },
    });

    // Mock Calculation: ₹40 per delivery
    const perOrderEarnings = 40.0;
    const totalEarnings = completedOrders.length * perOrderEarnings;

    // Daily earnings (simple filter for today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = completedOrders.filter((o) => {
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const todayEarnings = todaysOrders.length * perOrderEarnings;

    return {
      status: 'success',
      code: 200,
      message: 'Earnings fetched successfully',
      data: {
        totalEarnings,
        todayEarnings,
        totalDeliveries: completedOrders.length,
        todayDeliveries: todaysOrders.length,
        currency: '₹',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ==========================================================
  // GET RESTAURANT ACCEPTED ORDERS WITH FULL DETAILS
  // ==========================================================
  async getRestaurantAcceptedOrders(fleet_uid: string) {
    // 1. Check if fleet is active
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleet_uid } });
    if (!fleet) throw new NotFoundException('Fleet not found');

    // If inactive, return empty list
    if (!fleet.isActive) {
      return {
        status: 'success',
        code: 200,
        message: 'You are offline. Go online to receive orders.',
        data: [],
      };
    }

    // 2. Find orders where restaurant has accepted/ready and no delivery partner assigned
    const acceptedOrders = await this.orderRepo.find({
      where: [
        {
          restaurantStatus: 'accepted',
          deliveryPartnerStatus: 'pending',
        },
        {
          restaurantStatus: 'ready',
          deliveryPartnerStatus: 'pending',
        },
      ],
      order: { createdAt: 'DESC' },
    });

    // Filter out orders that already have a delivery_partner_uid
    const unassignedOrders = acceptedOrders.filter((o) => !o.delivery_partner_uid);

    if (unassignedOrders.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No restaurant accepted orders available',
        data: [],
      };
    }

    // 3. Get unique restaurant UIDs from orders
    const restaurantUids = [
      ...new Set(unassignedOrders.map((o) => o.restaurant_uid).filter(Boolean)),
    ];

    // 4. Fetch restaurants with all relations
    const restaurants =
      restaurantUids.length > 0
        ? await this.restaurantRepo.find({
            where: { uid: In(restaurantUids) },
            relations: ['contact', 'address', 'profile'],
          })
        : [];

    // 5. Create a map for quick lookup
    const restaurantMap = new Map<string, any>();
    restaurants.forEach((r) => {
      restaurantMap.set(r.uid, {
        uid: r.uid,
        isActive: r.isActive,
        isActive_flag: r.isActive_flag,
        profile: r.profile
          ? {
              restaurant_name: r.profile.restaurant_name || null,
              contact_person: r.profile.contact_person || null,
              contact_number: r.profile.contact_number || null,
              contact_email: r.profile.contact_email || null,
              avg_cost_for_two: r.profile.avg_cost_for_two || null,
              photo: r.profile.photo || [],
            }
          : null,
        address: r.address
          ? {
              city: r.address.city || null,
              state: r.address.state || null,
              pincode: r.address.pincode || null,
              address: r.address.address || null,
              lat: r.address.lat ? Number(r.address.lat) : null,
              lng: r.address.lng ? Number(r.address.lng) : null,
              land_mark: r.address.land_mark || null,
              verified: r.address.verified || false,
            }
          : null,
        contact: r.contact
          ? {
              email: r.contact.encryptedEmail || null,
              phone: r.contact.encryptedPhone || null,
            }
          : null,
      });
    });

    // 6. Get unique customer UIDs from orders
    const customerUids = [...new Set(unassignedOrders.map((o) => o.customer).filter(Boolean))];

    // 7. Fetch customers with profile and contact
    const customers =
      customerUids.length > 0
        ? await this.userRepo.find({
            where: { uid: In(customerUids) },
            relations: ['profile', 'contact', 'address'],
          })
        : [];

    // 8. Create customer map
    const customerMap = new Map<string, any>();
    customers.forEach((c) => {
      customerMap.set(c.uid, {
        uid: c.uid,
        profile: c.profile
          ? {
              first_name: c.profile.first_name || null,
              last_name: c.profile.last_name || null,
              photo: c.profile.photo || [],
            }
          : null,
        contact: c.contact
          ? {
              phone: c.contact.encryptedPhone || null,
              email: c.contact.encryptedEmail || null,
            }
          : null,
        address: c.address
          ? {
              address: c.address.address || null,
              city: c.address.city || null,
              state: c.address.state || null,
              pincode: c.address.pincode || null,
            }
          : null,
      });
    });

    // 9. Fetch delivery locations for customers (get default one)
    const deliveryLocations =
      customerUids.length > 0
        ? await this.deliveryLocationRepo.find({
            where: { user_uid: In(customerUids), is_default: true },
          })
        : [];

    // 10. Create delivery location map
    const deliveryLocationMap = new Map<string, any>();
    deliveryLocations.forEach((dl) => {
      deliveryLocationMap.set(dl.user_uid, {
        address: dl.address || null,
        lat: dl.lat ? Number(dl.lat) : null,
        lng: dl.lng ? Number(dl.lng) : null,
        address_type: dl.address_type || null,
      });
    });

    // 11. Enrich orders with restaurant and customer details
    const enrichedOrders = unassignedOrders.map((order, index) => ({
      sno: index + 1,
      order_id: order.id,
      orderId: order.orderId,
      restaurant_uid: order.restaurant_uid,
      customer_uid: order.customer,
      price: Number(order.price) || 0,
      items: order.items || [],
      restaurantStatus: order.restaurantStatus,
      deliveryPartnerStatus: order.deliveryPartnerStatus,
      createdAt: order.createdAt,
      // Delivery partner live location
      delivery_lat: order.delivery_lat ? Number(order.delivery_lat) : null,
      delivery_lng: order.delivery_lng ? Number(order.delivery_lng) : null,
      restaurant: order.restaurant_uid ? restaurantMap.get(order.restaurant_uid) || null : null,
      customer: order.customer ? customerMap.get(order.customer) || null : null,
      delivery_location: (() => {
        // Prioritize location stored in the Order
        if (order.customer_lat && order.customer_lng) {
          return {
            lat: Number(order.customer_lat),
            lng: Number(order.customer_lng),
            address: order.delivery_address || 'Address from Order',
            address_type: 'Order Address',
          };
        }
        // Fallback to default user location
        return order.customer ? deliveryLocationMap.get(order.customer) || null : null;
      })(),
      payment_mode: order.payment_mode,
    }));

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant accepted orders fetched successfully',
      data: enrichedOrders,
    };
  }

  // ==========================================================
  // GET SINGLE ORDER WITH FULL RESTAURANT DETAILS
  // ==========================================================
  async getOrderWithRestaurantDetails(fleet_uid: string, order_identifier: string) {
    // 1. Check if fleet is active
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleet_uid } });
    if (!fleet) throw new NotFoundException('Fleet not found');

    // 2. Find the order (try by orderId first, then by id)
    let order = await this.orderRepo.findOne({
      where: { orderId: order_identifier },
    });

    if (!order) {
      order = await this.orderRepo.findOne({
        where: { id: order_identifier },
      });
    }

    if (order) {
      console.log('🔍 [DEBUG] Order Details Fetch:', {
        orderId: order.orderId,
        customerLat: order.customer_lat,
        customerLng: order.customer_lng,
        deliveryAddress: order.delivery_address,
        customerUid: order.customer,
      });
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 3. Fetch restaurant with all relations if restaurant_uid exists
    let restaurantDetails: any = null;
    if (order.restaurant_uid) {
      const restaurant = await this.restaurantRepo.findOne({
        where: { uid: order.restaurant_uid },
        relations: ['contact', 'address', 'profile'],
      });

      if (restaurant) {
        restaurantDetails = {
          uid: restaurant.uid,
          isActive: restaurant.isActive,
          isActive_flag: restaurant.isActive_flag,
          profile: restaurant.profile
            ? {
                restaurant_name: restaurant.profile.restaurant_name || null,
                contact_person: restaurant.profile.contact_person || null,
                contact_number: restaurant.profile.contact_number || null,
                contact_email: restaurant.profile.contact_email || null,
                avg_cost_for_two: restaurant.profile.avg_cost_for_two || null,
                photo: restaurant.profile.photo || [],
              }
            : null,
          address: restaurant.address
            ? {
                city: restaurant.address.city || null,
                state: restaurant.address.state || null,
                pincode: restaurant.address.pincode || null,
                address: restaurant.address.address || null,
                lat: restaurant.address.lat ? Number(restaurant.address.lat) : null,
                lng: restaurant.address.lng ? Number(restaurant.address.lng) : null,
                land_mark: restaurant.address.land_mark || null,
                verified: restaurant.address.verified || false,
              }
            : null,
          contact: restaurant.contact
            ? {
                email: restaurant.contact.encryptedEmail || null,
                phone: restaurant.contact.encryptedPhone || null,
              }
            : null,
        };
      }
    }

    return {
      status: 'success',
      code: 200,
      message: 'Order details fetched successfully',
      data: {
        order_id: order.id,
        orderId: order.orderId,
        restaurant_uid: order.restaurant_uid,
        delivery_partner_uid: order.delivery_partner_uid,
        price: Number(order.price) || 0,
        items: order.items || [],
        restaurantStatus: order.restaurantStatus,
        deliveryPartnerStatus: order.deliveryPartnerStatus,
        time: order.time,
        createdAt: order.createdAt,
        // Delivery partner live location
        delivery_lat: order.delivery_lat ? Number(order.delivery_lat) : null,
        delivery_lng: order.delivery_lng ? Number(order.delivery_lng) : null,
        payment_mode: order.payment_mode,
        restaurant: restaurantDetails,
        customer: await (async () => {
          if (!order.customer) return null;
          const customer = await this.userRepo.findOne({
            where: { uid: order.customer },
            relations: ['profile', 'contact', 'address'],
          });
          if (!customer) return order.customer; // Fallback to UID if not found
          return {
            uid: customer.uid,
            profile: customer.profile
              ? {
                  first_name: customer.profile.first_name || null,
                  last_name: customer.profile.last_name || null,
                  photo: customer.profile.photo || [],
                }
              : null,
            contact: customer.contact
              ? {
                  phone: customer.contact.encryptedPhone || null,
                  email: customer.contact.encryptedEmail || null,
                }
              : null,
            address: customer.address
              ? {
                  address: customer.address.address || null,
                  city: customer.address.city || null,
                  state: customer.address.state || null,
                  pincode: customer.address.pincode || null,
                }
              : null,
          };
        })(),
        delivery_location: await (async () => {
          // 1. Try Order location
          if (order.customer_lat && order.customer_lng) {
            return {
              lat: Number(order.customer_lat),
              lng: Number(order.customer_lng),
              address: order.delivery_address,
              address_type: 'Order Location',
            };
          }
          // 2. Try User Default location
          if (order.customer) {
            const defLoc = await this.deliveryLocationRepo.findOne({
              where: { user_uid: order.customer, is_default: true },
            });
            if (defLoc) {
              return {
                lat: Number(defLoc.lat),
                lng: Number(defLoc.lng),
                address: defLoc.address,
                address_type: defLoc.address_type,
              };
            }
          }
          return null;
        })(),
      },
    };
  }

  // ==========================================================
  // ACCEPT ORDER FROM ORDERS TABLE (Fleet)
  // ==========================================================
  async acceptOrderFromOrdersTable(fleet_uid: string, order_id: string) {
    // 1. Check if fleet exists and is active
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleet_uid } });
    if (!fleet) throw new NotFoundException('Fleet not found');

    if (!fleet.isActive) {
      return {
        status: 'error',
        code: 400,
        message: 'You are offline. Go online to accept orders.',
      };
    }

    // 2. Find the order by orderId or id
    let order = await this.orderRepo.findOne({
      where: { orderId: order_id },
    });

    if (!order) {
      order = await this.orderRepo.findOne({
        where: { id: order_id },
      });
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 3. Check if order is still available
    if (order.delivery_partner_uid) {
      return {
        status: 'error',
        code: 400,
        message: 'Order has already been accepted by another delivery partner',
      };
    }

    // 4. Update order with fleet assignment
    order.delivery_partner_uid = fleet_uid;
    order.status = 'processing';
    order.deliveryPartnerStatus = 'accepted';

    await this.orderRepo.save(order);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted successfully',
      data: {
        order_id: order.id,
        orderId: order.orderId,
        delivery_partner_uid: order.delivery_partner_uid,
        status: order.status,
        deliveryPartnerStatus: order.deliveryPartnerStatus,
      },
    };
  }

  // ==========================================================
  // 1) FLEET ACCEPT ORDER
  // ==========================================================
  async acceptOrderByFleet(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // Assign fleet UID only on ACCEPT
    // -------------------------------------------------
    group.fleet_uid = fleet_uid;

    // Fleet accept status
    group.f_status = CartOrderStatus.F_ACCEPTED.code;
    group.f_status_flag = CartOrderStatus.F_ACCEPTED.label;

    const timestamp = new Date().toISOString();

    // Add logs
    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted by fleet',
      data: {
        cart_group_uid: group.cart_group_uid,
        fleet_uid: group.fleet_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }

  // ==========================================================
  // 2) FLEET REJECT ORDER
  // ==========================================================
  async rejectOrderByFleet(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // ❌ DO NOT UPDATE fleet_uid on reject
    // -------------------------------------------------

    group.f_status = CartOrderStatus.F_REJECTED.code;
    group.f_status_flag = CartOrderStatus.F_REJECTED.label;

    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order rejected by fleet',
      data: {
        cart_group_uid: group.cart_group_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }

  // ==========================================================
  async fleetArrivedRest(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // ❌ DO NOT UPDATE fleet_uid on reject
    // -------------------------------------------------

    group.f_status = CartOrderStatus.F_ARRIVED_AT_RESTAURANT.code;
    group.f_status_flag = CartOrderStatus.F_ARRIVED_AT_RESTAURANT.label;

    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Fleet reached restaurant',
      data: {
        cart_group_uid: group.cart_group_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }

  async orderPicked(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // ❌ DO NOT UPDATE fleet_uid on reject
    // -------------------------------------------------

    group.f_status = CartOrderStatus.F_PICKED_UP.code;
    group.f_status_flag = CartOrderStatus.F_PICKED_UP.label;

    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Fleet reached restaurant',
      data: {
        cart_group_uid: group.cart_group_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }

  async reachedLoc(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // ❌ DO NOT UPDATE fleet_uid on reject
    // -------------------------------------------------

    group.f_status = CartOrderStatus.F_ARRIVED_LOCATION.code;
    group.f_status_flag = CartOrderStatus.F_ARRIVED_LOCATION.label;

    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Fleet reached customer location',
      data: {
        cart_group_uid: group.cart_group_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }

  async delivered(fleet_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found`);
    }

    // -------------------------------------------------
    // ❌ DO NOT UPDATE fleet_uid on reject
    // -------------------------------------------------

    group.f_status = CartOrderStatus.F_HANDOVER_COMPLETE.code;
    group.f_status_flag = CartOrderStatus.F_HANDOVER_COMPLETE.label;

    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.f_status,
        desc: group.f_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Fleet reached customer location',
      data: {
        cart_group_uid: group.cart_group_uid,
        f_status: group.f_status,
        f_status_flag: group.f_status_flag,
        logs: group.logs,
      },
      meta: { timestamp },
    };
  }
}
