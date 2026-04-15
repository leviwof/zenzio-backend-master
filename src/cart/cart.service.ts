import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Cart } from './entity/cart.entity';
import { CartGroup } from './entity/cart-group.entity';
import { CartItem } from './entity/cart-item.entity';

import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdatePaymentModeDto } from './dto/update-payment-mode.dto';
import { DeliveryLocationService } from 'src/delivery-location/delivery-location.service';
import { CartOrderStatus } from 'src/constants/status.constants';
import { RestaurantMenu } from 'src/restaurant_menu/restaurant_menu.entity';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';
import { RestaurantDocument } from 'src/restaurants/entity/restaurant_document.entity';

import { UtilService } from 'src/utils/util.service';
import { Order } from 'src/orders/order.entity';
import { RazorpayService } from 'src/payments/razorpay.service';
import { NotificationService } from 'src/notifications/notification.service';
import { CouponsService } from 'src/coupons/coupons.service';




@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartGroup) private groupRepo: Repository<CartGroup>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    @InjectRepository(CartItem) private menuRepo: Repository<RestaurantMenu>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(RestaurantProfile) private restaurantProfileRepo: Repository<RestaurantProfile>,
    @InjectRepository(RestaurantDocument) private restaurantDocRepo: Repository<RestaurantDocument>,

    private readonly deliveryLocationService: DeliveryLocationService,
    private readonly utilService: UtilService,
    private readonly razorpayService: RazorpayService,
    private readonly notificationService: NotificationService,
    private readonly couponsService: CouponsService,
  ) { }




  async getCart(user_uid: string) {
    return this.cartRepo.findOne({ where: { user_uid } });
  }

  async getCartWithItems(user_uid: string) {
    const cart = await this.cartRepo.findOne({
      where: { user_uid },
      relations: ['groups', 'groups.items'],
    });

    if (cart && cart.groups) {

      cart.groups = cart.groups.filter((g) => !['C011', 'C012', 'S012', 'D001'].includes(g.status));


      if (cart && cart.groups && cart.groups.length > 0) {
        const restaurantUids = cart.groups.map((g) => g.restaurant_uid);


        const restaurants = await this.groupRepo.manager
          .createQueryBuilder()
          .select('r.uid', 'uid')
          .addSelect('rp.restaurant_name', 'restaurant_name')
          .from('restaurants', 'r')
          .leftJoin('restaurant_profile', 'rp', 'r.uid = rp."restaurantUid"')
          .where('r.uid IN (:...uids)', { uids: restaurantUids })
          .getRawMany();


        const nameMap = new Map();
        restaurants.forEach((r) => {
          nameMap.set(r.uid, r.restaurant_name || 'Unknown Restaurant');
        });


        const menuUids: string[] = [];
        cart.groups.forEach((g) => {
          g.items?.forEach((item: any) => {
            if (item.menu_uid) menuUids.push(item.menu_uid);
          });
        });


        let menuMap = new Map();
        if (menuUids.length > 0) {
          const menus = await this.groupRepo.manager
            .createQueryBuilder()
            .select('m.menu_uid', 'menu_uid')
            .addSelect('m.images', 'images')
            .addSelect('m.discount', 'discount')
            .from('restaurant_menus', 'm')
            .where('m.menu_uid IN (:...uids)', { uids: menuUids })
            .getRawMany();

          menus.forEach((m) => {
            menuMap.set(m.menu_uid, { images: m.images, discount: m.discount });
          });
          console.log('📦 Menu data fetched:', menus);
        }


        cart.groups.forEach((g) => {
          (g as any).restaurant_name = nameMap.get(g.restaurant_uid) || 'Unknown Restaurant';


          g.items?.forEach((item: any) => {
            const menuData = menuMap.get(item.menu_uid);
            if (menuData) {
              item.images = menuData.images || [];
              item.discount = menuData.discount || 0;
            }
          });
        });
      }
      return cart;
    }

    return cart;
  }




  async addItem(user_uid: string, dto: AddToCartDto) {
    let cart = await this.getCart(user_uid);

    if (!cart) {
      cart = this.cartRepo.create({ user_uid, grand_total: 0 });
      await this.cartRepo.save(cart);
    }

    let group = await this.groupRepo.findOne({
      where: { restaurant_uid: dto.restaurant_uid, cart: { id: cart.id } },
      relations: ['items'],
    });

    if (!group) {
      group = this.groupRepo.create({
        cart,
        restaurant_uid: dto.restaurant_uid,
        subtotal: 0,
        user_uid,
        grand_total: 0,
        item_count: 0,
        total_item_qty: 0,
      });
      await this.groupRepo.save(group);
      group.items = [];
    }

    let item = group.items.find((it) => it.menu_uid === dto.menu_uid);

    if (item) {
      item.qty += dto.qty;
      item.total_price = item.qty * item.price;
      await this.itemRepo.save(item);




      group.status = CartOrderStatus.ADDED_TO_CART.code;
      group.status_flag = CartOrderStatus.ADDED_TO_CART.label;

      group.logs = [
        ...(group.logs || []),
        {
          code: CartOrderStatus.ADDED_TO_CART.code,
          desc: CartOrderStatus.ADDED_TO_CART.label,
          timestamp: new Date().toISOString(),
        },
      ];

      await this.groupRepo.save(group);
    } else {
      item = this.itemRepo.create({
        group,
        menu_uid: dto.menu_uid,
        menu_name: dto.menu_name,
        price: dto.price,
        qty: dto.qty,
        total_price: dto.qty * dto.price,
      });
      await this.itemRepo.save(item);
    }

    await this.recalculateGroupTotals(group.id);
    await this.recalculateCartTotals(cart.id);

    return this.getCartWithItems(user_uid);
  }




  async updateItem(user_uid: string, item_id: number, dto: UpdateCartItemDto) {
    const item = await this.itemRepo.findOne({
      where: { id: item_id },
      relations: ['group', 'group.cart'],
    });

    if (!item || item.group.cart.user_uid !== user_uid) {
      throw new NotFoundException('Item not found');
    }

    if (dto.qty <= 0) {
      await this.itemRepo.delete(item_id);
    } else {
      item.qty = dto.qty;
      item.total_price = item.qty * item.price;
      await this.itemRepo.save(item);
    }

    await this.recalculateGroupTotals(item.group.id);
    await this.recalculateCartTotals(item.group.cart.id);

    return this.getCartWithItems(user_uid);
  }




  async removeItem(user_uid: string, item_id: number) {
    const item = await this.itemRepo.findOne({
      where: { id: item_id },
      relations: ['group', 'group.cart'],
    });

    if (!item || item.group.cart.user_uid !== user_uid) {
      throw new NotFoundException('Item not found');
    }

    await this.itemRepo.delete(item_id);

    await this.recalculateGroupTotals(item.group.id);
    await this.recalculateCartTotals(item.group.cart.id);

    return this.getCartWithItems(user_uid);
  }




  async clearGroup(user_uid: string, restaurant_uid: string) {
    const cart = await this.getCart(user_uid);
    if (!cart) throw new NotFoundException('Cart not found');

    const group = await this.groupRepo.findOne({
      where: { restaurant_uid, cart: { id: cart.id } },
    });

    if (!group) throw new NotFoundException('Group not found');

    await this.itemRepo.delete({ group: { id: group.id } });
    await this.groupRepo.delete(group.id);

    await this.recalculateCartTotals(cart.id);

    return this.getCartWithItems(user_uid);
  }




  async clearCart(user_uid: string) {
    const cart = await this.getCartWithItems(user_uid);

    if (!cart) return { message: 'Cart already empty' };

    await this.itemRepo.delete({ group: { cart: { id: cart.id } } });
    await this.groupRepo.delete({ cart: { id: cart.id } });

    await this.cartRepo.update(cart.id, { grand_total: 0 });

    return this.getCartWithItems(user_uid);
  }




  async recalculateGroupTotals(group_id: number) {
    const items = await this.itemRepo.find({
      where: { group: { id: group_id } },
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.total_price), 0);

    const grand_total = subtotal;

    const item_count = items.length;
    const total_item_qty = items.reduce((sum, i) => sum + i.qty, 0);

    await this.groupRepo.update(group_id, {
      subtotal,
      grand_total,
      item_count,
      total_item_qty,
    });
  }




  async recalculateCartTotals(cart_id: number) {
    const groups = await this.groupRepo.find({
      where: { cart: { id: cart_id } },
    });

    const grand_total = groups.reduce((sum, g) => sum + Number(g.grand_total), 0);

    await this.cartRepo.update(cart_id, { grand_total });
  }





  async getItemsByRestaurant(user_uid: string, restaurant_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { restaurant_uid, cart: { user_uid } },
      relations: ['items', 'items.menu'],
      select: {

        id: true,
        cart_group_uid: true,
        restaurant_uid: true,
        subtotal: true,


        items: {
          id: true,
          cart_item_uid: true,
          menu_uid: true,
          menu_name: true,
          price: true,
          qty: true,
          total_price: true,


          menu: {
            images: true,
            discount: true,
          },
        },
      },
    });

    if (!group) throw new NotFoundException('No group found');

    return group;
  }

  async getOrdersListForRestaurant(
    restaurant_uid: string,
    statusList?: string[],
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {

    const defaultStatuses = [
      'new',
      'accepted',
      'Accepted',
      'preparing',
      'ready',
      'picked_up',
      'rejected',
      'cancelled',
      'admin_cancelled',
      'delivered',
      'completed',
    ];

    let restaurantStatuses: string[];

    if (Array.isArray(statusList) && statusList.length > 0) {
      const statusMap: { [key: string]: string | string[] } = {
        C011: 'new',
        R002: ['accepted', 'Accepted'],
        R007: 'preparing',
        R012: 'ready',
        R030: 'picked_up',
        R040: ['delivered', 'completed'],
        R008: ['cancelled', 'admin_cancelled'],
        R003: 'rejected',
      };

      restaurantStatuses = statusList.flatMap((code) => {
        const mapped = statusMap[code];
        if (!mapped) return [code];
        return Array.isArray(mapped) ? mapped : [mapped];
      });
    } else {
      restaurantStatuses = defaultStatuses;
    }

    const offset = (page - 1) * limit;
    const params: any[] = [restaurant_uid, restaurantStatuses, limit, offset];
    let dateFilter = '';

    if (startDate && endDate) {
      dateFilter = 'AND "createdAt" BETWEEN $5 AND $6';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'AND "createdAt" >= $5';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'AND "createdAt" <= $5';
      params.push(endDate);
    }

    try {
      const orders = await this.orderRepo.query(
        `SELECT 
          id, "orderId", 
          ROUND(CAST(COALESCE(item_total, 0) / 1.08 * 1.08 AS NUMERIC), 2) as price,
          time, customer, restaurant_uid, delivery_partner_uid,
          items, status, "restaurantStatus", "deliveryPartnerStatus", 
          "createdAt", "updatedAt",
          COALESCE(user_otp, '') as user_otp,
          COALESCE(item_total, 0) as item_total,
          COALESCE(delivery_fee, 0) as delivery_fee,
          COALESCE(taxes, 0) as taxes,
          COALESCE(delivery_address, '') as delivery_address,
          COALESCE(payment_mode, '') as payment_mode,
          COALESCE(estimated_time, '5 min') as estimated_time,
          restaurant_lat,
          restaurant_lng,
          customer_lat,
          customer_lng,
          delivery_lat,
          delivery_lng
        FROM orders 
        WHERE restaurant_uid = $1 
        AND "restaurantStatus" = ANY($2)
        ${dateFilter}
        ORDER BY time DESC
        LIMIT $3 OFFSET $4`,
        params,
      );

      return orders;
    } catch (error: any) {
      console.error('❌ Error fetching orders, trying fallback query:', error.message);

      const orders = await this.orderRepo.query(
        `SELECT 
          id, "orderId", price, time, customer, restaurant_uid, delivery_partner_uid,
          items, status, "restaurantStatus", "deliveryPartnerStatus", 
          "createdAt", "updatedAt",
          '5 min' as estimated_time
        FROM orders 
        WHERE restaurant_uid = $1 
        AND "restaurantStatus" = ANY($2)
        ${dateFilter}
        ORDER BY time DESC
        LIMIT $3 OFFSET $4`,
        params,
      );

      return orders;
    }
  }




  async getItemsByGroupId(user_uid: string, groupId: number) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId, cart: { user_uid } },
      relations: ['items'],
    });

    if (!group) throw new NotFoundException('Group not found');


    const addressDetails = await this.deliveryLocationService.addAddressToCartGroup(
      user_uid,
      group.address_type,
    );

    return { group, addressDetails };


  }


  private generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async updatePaymentMode(user_uid: string, group_uid: string, dto: UpdatePaymentModeDto) {
    const pay_mode = dto.pay_mode;
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid: group_uid, cart: { user_uid } },
      relations: ['items'],
    });

    if (!group) {
      throw new NotFoundException('Cart group not found');
    }

    if (!['COD', 'ONLINE'].includes(pay_mode)) {
      throw new NotFoundException('Invalid payment mode. Allowed: COD, ONLINE');
    }

    group.pay_mode = pay_mode;
    if (pay_mode === 'COD') {
      group.status = CartOrderStatus.ORDER_CREATED_COD.code;
      group.status_flag = CartOrderStatus.ORDER_CREATED_COD.label;
    } else {
      group.status = CartOrderStatus.ORDER_CREATED_ONLINE.code;
      group.status_flag = CartOrderStatus.ORDER_CREATED_ONLINE.label;
    }

    console.log('📦 Creating Order - DTO Received:');
    console.log('   - item_total:', dto.item_total);
    console.log('   - delivery_fee:', dto.delivery_fee);
    console.log('   - taxes:', dto.taxes);
    console.log('   - price:', dto.price);
    console.log('   - delivery_address:', dto.delivery_address);
    console.log('   - restaurant_lat/lng:', dto.restaurant_lat, dto.restaurant_lng);
    console.log('   - customer_lat/lng:', dto.customer_lat, dto.customer_lng);
    console.log('   - distance_km:', dto.distance_km);

    const items = group.items || [];
    const orderItems = items.map((item) => ({
      name: item.menu_name,
      qty: item.qty,
      price: item.price,
      menuItemId: item.menu_uid,
    }));

    const itemTotal = dto.item_total ?? group.subtotal;
    const deliveryFee = dto.delivery_fee ?? 0;
    const couponDiscount = dto.coupon_discount ?? 0;

    // Fetch packaging charge and GST status from restaurant
    const restaurantProfile = await this.restaurantProfileRepo.findOne({
      where: { restaurantUid: group.restaurant_uid },
    });
    const packingCharge = Number(restaurantProfile?.packing_charge ?? 0);

    const restaurantDoc = await this.restaurantDocRepo.findOne({
      where: { restaurantUid: group.restaurant_uid },
    });
    const isGstRegistered = Boolean(restaurantDoc?.gst_number?.toString().trim());
    const taxes = isGstRegistered ? (dto.taxes ?? itemTotal * 0.05) : 0;

    const grandTotal = dto.price ?? itemTotal + deliveryFee + taxes + packingCharge - couponDiscount;

    if (dto.coupon_code) {
      console.log(`🎟 Validating coupon: ${dto.coupon_code} for user: ${user_uid}`);
      await this.couponsService.validateCouponForUser(dto.coupon_code, user_uid);
    }

    // --- REUSE LOGIC: Check for an existing pending_payment Order for this user + restaurant ---
    const existingPendingOrder = await this.orderRepo.findOne({
      where: {
        restaurant_uid: group.restaurant_uid,
        customer: user_uid,
        restaurantStatus: 'pending_payment',
      },
      order: { createdAt: 'DESC' },
    });

    let savedOrder: any;

    if (existingPendingOrder) {
      console.log(`♻️ Reusing existing pending order: ${existingPendingOrder.orderId}`);

      // Update all pricing + delivery fields from the new request
      existingPendingOrder.price = grandTotal;
      existingPendingOrder.item_total = itemTotal;
      existingPendingOrder.delivery_fee = deliveryFee;
      existingPendingOrder.taxes = taxes;
      existingPendingOrder.packing_charge = packingCharge;
      existingPendingOrder.items = orderItems;
      existingPendingOrder.time = new Date().toISOString();
      existingPendingOrder.payment_mode = pay_mode;
      existingPendingOrder.coupon_code = dto.coupon_code ?? (null as unknown as string);
      existingPendingOrder.coupon_discount = dto.coupon_discount ?? 0;
      existingPendingOrder.delivery_address = dto.delivery_address ?? existingPendingOrder.delivery_address;
      existingPendingOrder.restaurant_lat = dto.restaurant_lat ?? existingPendingOrder.restaurant_lat;
      existingPendingOrder.restaurant_lng = dto.restaurant_lng ?? existingPendingOrder.restaurant_lng;
      existingPendingOrder.customer_lat = dto.customer_lat ?? existingPendingOrder.customer_lat;
      existingPendingOrder.customer_lng = dto.customer_lng ?? existingPendingOrder.customer_lng;
      existingPendingOrder.distance_km = dto.distance_km ?? existingPendingOrder.distance_km;
      existingPendingOrder.admin_commission = Number((itemTotal - (itemTotal / 1.08)).toFixed(2));

      if (pay_mode === 'COD') {
        // Switching from ONLINE → COD: clear all Razorpay fields
        existingPendingOrder.restaurantStatus = 'new';
        existingPendingOrder.razorpay_order_id = null as unknown as string;

        // Also clear Razorpay fields on the CartGroup
        group.raz_ord_id = null as unknown as string;
        group.raz_pay_id = null as unknown as string;
        group.pay_status = '0';
        group.pay_status_flag = '0';
      } else {
        // Retrying ONLINE: keep pending_payment, clear old razorpay_order_id (it's expired)
        existingPendingOrder.restaurantStatus = 'pending_payment';
        existingPendingOrder.razorpay_order_id = null as unknown as string;
      }

      savedOrder = await this.orderRepo.save(existingPendingOrder);
      console.log(`✅ Existing Order updated: ${savedOrder.orderId}`);

    } else {
      // No existing pending order → create a fresh one (original behaviour)
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newOrder = this.orderRepo.create({
        orderId: orderId,
        customer: user_uid,
        restaurant_uid: group.restaurant_uid,
        price: grandTotal,
        item_total: itemTotal,
        delivery_fee: deliveryFee,
        taxes: taxes,
        time: new Date().toISOString(),
        items: orderItems,
        restaurantStatus: pay_mode === 'COD' ? 'new' : 'pending_payment',
        deliveryPartnerStatus: 'pending',
        user_otp: this.generateOTP(),
        delivery_address: dto.delivery_address,
        restaurant_lat: dto.restaurant_lat,
        restaurant_lng: dto.restaurant_lng,
        customer_lat: dto.customer_lat,
        customer_lng: dto.customer_lng,
        distance_km: dto.distance_km,
        payment_mode: pay_mode,
        coupon_code: dto.coupon_code,
        coupon_discount: dto.coupon_discount,
        admin_commission: Number((itemTotal - (itemTotal / 1.08)).toFixed(2)),
        packing_charge: packingCharge,
      });

      savedOrder = await this.orderRepo.save(newOrder);
      console.log(`✅ New Order Created: ${savedOrder.orderId}`);
    }

    console.log('   - User OTP:', savedOrder.user_otp);
    console.log('   - Grand Total:', savedOrder.price);
    console.log('   - Payment Mode:', savedOrder.payment_mode);
    if (savedOrder.coupon_code) console.log('   - Coupon:', savedOrder.coupon_code);

    // COD path: notify, redeem coupon, delete cart group, return
    if (pay_mode === 'COD') {
      try {
        console.log('🔔 Sending notification to user:', user_uid);
        await this.notificationService.notifyOrderConfirmed(user_uid, savedOrder.orderId);

        console.log('🔔 Sending notification to restaurant:', group.restaurant_uid);
        await this.notificationService.notifyRestaurantNewOrder(
          group.restaurant_uid,
          savedOrder.orderId,
          'Customer',
          grandTotal,
        );
      } catch (notifError) {
        console.error('❌ Error sending order notifications:', notifError);
      }

      if (dto.coupon_code) {
        console.log(`🎟 Redeeming coupon for COD: ${dto.coupon_code}`);
        await this.couponsService.redeemCoupon(dto.coupon_code);
      }

      await this.groupRepo.remove(group);
      return savedOrder;
    }

    // ONLINE path: save updated CartGroup, create new Razorpay order, return
    await this.groupRepo.save(group);

    try {
      console.log('💳 Creating Razorpay Order with Amount:', grandTotal);
      const razorpayOrder = await this.razorpayService.createOrder(
        grandTotal,
        group.restaurant_uid,
        group_uid,
      );


      savedOrder.razorpay_order_id = razorpayOrder.id;
      await this.orderRepo.save(savedOrder);

      return {
        ...savedOrder,
        razorpay_order: razorpayOrder,
      };
    } catch (error: any) {
      console.error('❌ Razorpay order creation failed:', error?.response?.data || error.message);

      const errorMessage =
        error?.response?.data?.error?.description ||
        error.message ||
        'Razorpay order creation failed';

      throw new BadRequestException(errorMessage);
    }
  }
}
