import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryHistory, DeliveryStatus } from './entity/delivery_history.entity';
import { Order } from 'src/orders/order.entity';
import { Fleet } from './entity/fleet.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeliveryHistoryService {
  constructor(
    @InjectRepository(DeliveryHistory)
    private readonly deliveryHistoryRepo: Repository<DeliveryHistory>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Fleet)
    private readonly fleetRepo: Repository<Fleet>,
  ) {}

  // ==========================================================
  // CREATE DELIVERY HISTORY WHEN ORDER IS ACCEPTED
  // ==========================================================
  async createDeliveryHistory(
    fleet_uid: string,
    order_id: string,
    data: {
      restaurant_uid?: string;
      restaurant_name?: string;
      restaurant_address?: string;
      restaurant_lat?: number;
      restaurant_lng?: number;
      customer_uid?: string;
      customer_name?: string;
      customer_phone?: string;
      customer_address?: string;
      customer_lat?: number;
      customer_lng?: number;
      order_value?: number;
      delivery_earning?: number;
      distance_km?: number;
      estimated_time_min?: number;
      items?: any[];
      payment_method?: string;
    },
  ) {
    // Check if fleet exists
    const fleet = await this.fleetRepo.findOne({ where: { uid: fleet_uid } });
    if (!fleet) throw new NotFoundException('Fleet not found');

    // Check if delivery history already exists for this order
    const existingHistory = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (existingHistory) {
      return {
        status: 'success',
        code: 200,
        message: 'Delivery history already exists',
        data: existingHistory,
      };
    }

    // Generate a 4-digit OTP for delivery verification
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const deliveryHistory = this.deliveryHistoryRepo.create({
      uid: uuidv4(),
      order_id,
      order_number: order_id.substring(order_id.length - 8).toUpperCase(),
      fleet_uid,
      restaurant_uid: data.restaurant_uid,
      restaurant_name: data.restaurant_name,
      restaurant_address: data.restaurant_address,
      restaurant_lat: data.restaurant_lat,
      restaurant_lng: data.restaurant_lng,
      customer_uid: data.customer_uid,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_address: data.customer_address,
      customer_lat: data.customer_lat,
      customer_lng: data.customer_lng,
      order_value: data.order_value || 0,
      delivery_earning: data.delivery_earning || 0,
      total_earning: data.delivery_earning || 0,
      distance_km: data.distance_km,
      estimated_time_min: data.estimated_time_min,
      items: data.items || [],
      payment_method: data.payment_method || 'prepaid',
      delivery_otp: deliveryOtp,
      status: DeliveryStatus.ACCEPTED,
      accepted_at: new Date(),
      status_history: [
        {
          status: DeliveryStatus.ACCEPTED,
          timestamp: new Date().toISOString(),
          notes: 'Order accepted by delivery partner',
        },
      ],
    });

    await this.deliveryHistoryRepo.save(deliveryHistory);

    return {
      status: 'success',
      code: 201,
      message: 'Delivery history created successfully',
      data: {
        ...deliveryHistory,
        delivery_otp: deliveryOtp, // Return OTP for testing (remove in production)
      },
    };
  }

  // ==========================================================
  // UPDATE DELIVERY STATUS
  // ==========================================================
  async updateDeliveryStatus(
    fleet_uid: string,
    order_id: string,
    newStatus: DeliveryStatus,
    notes?: string,
  ) {
    const history = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (!history) {
      throw new NotFoundException('Delivery history not found');
    }

    history.status = newStatus;
    history.status_history = [
      ...(history.status_history || []),
      {
        status: newStatus,
        timestamp: new Date().toISOString(),
        notes: notes || `Status updated to ${newStatus}`,
      },
    ];

    // Update specific timestamps based on status
    if (newStatus === DeliveryStatus.PICKED_UP) {
      history.picked_up_at = new Date();
    } else if (newStatus === DeliveryStatus.DELIVERED) {
      history.delivered_at = new Date();
      // Calculate actual delivery time
      if (history.accepted_at) {
        const acceptedTime = new Date(history.accepted_at).getTime();
        const deliveredTime = new Date().getTime();
        history.actual_time_min = Math.round((deliveredTime - acceptedTime) / 60000);
      }
    }

    await this.deliveryHistoryRepo.save(history);

    // Also update the Order table status
    await this.updateOrderStatus(order_id, newStatus);

    return {
      status: 'success',
      code: 200,
      message: `Delivery status updated to ${newStatus}`,
      data: history,
    };
  }

  // Helper to update Order entity status based on delivery status
  private async updateOrderStatus(order_id: string, deliveryStatus: DeliveryStatus) {
    let order = await this.orderRepo.findOne({ where: { orderId: order_id } });
    if (!order) {
      order = await this.orderRepo.findOne({ where: { id: order_id } });
    }

    if (!order) return;

    switch (deliveryStatus) {
      case DeliveryStatus.PICKED_UP:
        order.deliveryPartnerStatus = 'picked_up';
        break;
      case DeliveryStatus.DELIVERED:
        order.deliveryPartnerStatus = 'delivered';
        order.status = 'completed';
        break;
      case DeliveryStatus.CANCELLED:
        order.deliveryPartnerStatus = 'cancelled';
        break;
      default:
        order.deliveryPartnerStatus = deliveryStatus;
    }

    await this.orderRepo.save(order);
  }

  // ==========================================================
  // VERIFY DELIVERY OTP
  // ==========================================================
  async verifyDeliveryOtp(fleet_uid: string, order_id: string, otp: string) {
    const history = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (!history) {
      throw new NotFoundException('Delivery not found');
    }

    // 1. Verify OTP if not already verified
    if (!history.otp_verified) {
      if (history.delivery_otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }
      history.otp_verified = true;
      history.otp_verified_at = new Date();
    }

    // 2. Ensure Delivery is marked as DELIVERED (Idempotent check)
    // This allows recovering "stuck" orders where OTP was verified but status update failed
    if (history.status !== DeliveryStatus.DELIVERED) {
      // ==========================================
      // AUTO-COMPLETE DELIVERY ON OTP VERIFICATION
      // ==========================================
      history.status = DeliveryStatus.DELIVERED;
      history.delivered_at = new Date();
      // Default values if not provided via completeDelivery later
      history.payment_collected = history.payment_method === 'cod' ? true : false;

      // Calculate actual time
      if (history.accepted_at) {
        const acceptedTime = new Date(history.accepted_at).getTime();
        const deliveredTime = new Date().getTime();
        history.actual_time_min = Math.round((deliveredTime - acceptedTime) / 60000);
      }

      history.status_history = [
        ...(history.status_history || []),
        {
          status: DeliveryStatus.DELIVERED,
          timestamp: new Date().toISOString(),
          notes: 'Delivery verified & completed via OTP',
        },
      ];

      await this.deliveryHistoryRepo.save(history);

      // Update Data in Orders Table as well
      await this.updateOrderStatus(order_id, DeliveryStatus.DELIVERED);
    }

    return {
      status: 'success',
      code: 200,
      message: 'OTP verified & Delivery Completed',
      data: { verified: true, status: DeliveryStatus.DELIVERED },
    };
  }

  // ==========================================================
  // COMPLETE DELIVERY
  // ==========================================================
  async completeDelivery(
    fleet_uid: string,
    order_id: string,
    data: {
      delivery_notes?: string;
      delivery_photo_url?: string;
      tip_amount?: number;
      payment_collected?: boolean;
    },
  ) {
    const history = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (!history) {
      throw new NotFoundException('Delivery not found');
    }

    if (!history.otp_verified) {
      throw new BadRequestException('OTP verification required before completing delivery');
    }

    history.status = DeliveryStatus.DELIVERED;
    history.delivered_at = new Date();
    history.delivery_notes = data.delivery_notes || history.delivery_notes;
    history.delivery_photo_url = data.delivery_photo_url || history.delivery_photo_url;
    history.tip_amount = data.tip_amount || 0;
    history.total_earning = Number(history.delivery_earning) + Number(data.tip_amount || 0);
    history.payment_collected = data.payment_collected || false;

    // Calculate actual time
    if (history.accepted_at) {
      const acceptedTime = new Date(history.accepted_at).getTime();
      const deliveredTime = new Date().getTime();
      history.actual_time_min = Math.round((deliveredTime - acceptedTime) / 60000);
    }

    history.status_history = [
      ...(history.status_history || []),
      {
        status: DeliveryStatus.DELIVERED,
        timestamp: new Date().toISOString(),
        notes: 'Delivery completed successfully',
      },
    ];

    await this.deliveryHistoryRepo.save(history);

    // Update order status
    await this.updateOrderStatus(order_id, DeliveryStatus.DELIVERED);

    return {
      status: 'success',
      code: 200,
      message: 'Delivery completed successfully',
      data: history,
    };
  }

  // ==========================================================
  // GET DELIVERY DETAILS (FOR COMPLETE DELIVERY SCREEN)
  // ==========================================================
  async getDeliveryDetails(fleet_uid: string, order_id: string) {
    const history = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (!history) {
      throw new NotFoundException('Delivery not found');
    }

    return {
      status: 'success',
      code: 200,
      message: 'Delivery details fetched successfully',
      data: {
        order_id: history.order_id,
        order_number: history.order_number,
        customer_name: history.customer_name,
        customer_phone: history.customer_phone,
        customer_address: history.customer_address,
        restaurant_name: history.restaurant_name,
        restaurant_address: history.restaurant_address,
        order_value: history.order_value,
        delivery_earning: history.delivery_earning,
        items: history.items,
        status: history.status,
        otp_verified: history.otp_verified,
        delivery_otp: history.delivery_otp, // Include OTP for customer verification
      },
    };
  }

  // ==========================================================
  // GET FLEET DELIVERY HISTORY
  // ==========================================================
  async getFleetDeliveryHistory(fleet_uid: string, page = 1, limit = 20, activeOnly = false) {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = { fleet_uid };

    // If activeOnly, exclude cancelled and delivered orders
    // This is used by the dashboard to show current active orders
    if (activeOnly) {
      // Note: TypeORM doesn't support NOT IN directly, so we'll filter in code
    }

    const [deliveries, total] = await this.deliveryHistoryRepo.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Filter out cancelled/delivered if activeOnly
    let filteredDeliveries = deliveries;
    if (activeOnly) {
      filteredDeliveries = deliveries.filter(
        (d) => d.status !== DeliveryStatus.CANCELLED && d.status !== DeliveryStatus.DELIVERED,
      );
    }

    return {
      status: 'success',
      code: 200,
      message: 'Delivery history fetched successfully',
      data: filteredDeliveries,
      meta: {
        total: activeOnly ? filteredDeliveries.length : total,
        page,
        limit,
        totalPages: Math.ceil((activeOnly ? filteredDeliveries.length : total) / limit),
      },
    };
  }

  // ==========================================================
  // GET FLEET EARNINGS SUMMARY
  // ==========================================================
  async getFleetEarningsSummary(fleet_uid: string) {
    const completedDeliveries = await this.deliveryHistoryRepo.find({
      where: { fleet_uid, status: DeliveryStatus.DELIVERED },
    });

    // Helper to get YYYY-MM-DD string in IST
    const getISTDateStr = (date: Date) => {
      if (!date) return '';
      // Offset by 5.5 hours for IST
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      return istDate.toISOString().split('T')[0];
    };

    const todayIST = getISTDateStr(new Date());

    const todayDeliveries = completedDeliveries.filter((d) => {
      const deliveredDate = d.delivered_at || d.createdAt;
      return getISTDateStr(deliveredDate) === todayIST;
    });

    // Helper function to get earning - use total_earning, fallback to delivery_earning
    const getEarning = (d: DeliveryHistory) => {
      const total = Number(d.total_earning || 0);
      if (total > 0) return total;
      return Number(d.delivery_earning || 0);
    };

    const totalEarnings = completedDeliveries.reduce((sum, d) => sum + getEarning(d), 0);
    const todayEarnings = todayDeliveries.reduce((sum, d) => sum + getEarning(d), 0);

    return {
      status: 'success',
      code: 200,
      message: 'Earnings summary fetched successfully',
      data: {
        totalEarnings,
        todayEarnings,
        totalDeliveries: completedDeliveries.length,
        todayDeliveries: todayDeliveries.length,
        currency: '₹',
      },
    };
  }

  // ==========================================================
  // SEND OTP TO CUSTOMER (Mock - integrate with SMS service)
  // ==========================================================
  async sendDeliveryOtpToCustomer(fleet_uid: string, order_id: string) {
    const history = await this.deliveryHistoryRepo.findOne({
      where: { order_id, fleet_uid },
    });

    if (!history) {
      throw new NotFoundException('Delivery not found');
    }

    // Here you would integrate with your SMS service to send OTP
    // For now, we just return success and log the OTP
    console.log(`📱 Sending OTP ${history.delivery_otp} to ${history.customer_phone}`);

    return {
      status: 'success',
      code: 200,
      message: 'OTP sent to customer',
      data: {
        customer_phone: history.customer_phone
          ? `${history.customer_phone.substring(0, 3)}****${history.customer_phone.slice(-4)}`
          : 'N/A',
        // For development, include OTP - remove in production
        otp: history.delivery_otp,
      },
    };
  }
}
