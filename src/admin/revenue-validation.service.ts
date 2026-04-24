// Revenue Validation & Audit Script
// Run this to compare backend revenue with payment gateway and log mismatches

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from '../orders/order.entity';

interface RevenueMismatch {
  orderId: string;
  backendRevenue: number;
  gatewayAmount: number;
  discrepancy: number;
  reason: string;
}

interface RevenueValidationResult {
  totalOrders: number;
  validOrders: number;
  totalBackendRevenue: number;
  expectedRevenue: number;
  mismatches: RevenueMismatch[];
  isBalanced: boolean;
}

@Injectable()
export class RevenueValidationService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async validateRevenue(startDate: Date, endDate: Date): Promise<RevenueValidationResult> {
    const orders = await this.orderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    const mismatches: RevenueMismatch[] = [];
    let totalBackendRevenue = 0;
    let expectedRevenue = 0;
    let validOrders = 0;

    for (const order of orders) {
      const isValid = this.isValidRevenueOrder(order);
      
      if (isValid) {
        validOrders++;
        
        const deliveryFee = Number(order.delivery_fee) || 0;
        const packingCharge = Number(order.packing_charge) || 0;
        const tax = Number(order.taxes) || 0;
        const refundedAmount = Number(order.refundedAmount) || 0;
        
        const backendRev = Math.max(0, deliveryFee + packingCharge + tax - refundedAmount);
        const expectedRev = deliveryFee + packingCharge + tax;
        
        totalBackendRevenue += backendRev;
        expectedRevenue += expectedRev;

        if (Math.abs(backendRev - expectedRev) > 0.01) {
          mismatches.push({
            orderId: order.orderId,
            backendRevenue: Math.round(backendRev * 100) / 100,
            gatewayAmount: Math.round(expectedRev * 100) / 100,
            discrepancy: Math.round((backendRev - expectedRev) * 100) / 100,
            reason: order.refundedAmount > 0 
              ? `Partial refund: ${order.refundedAmount}` 
              : 'Unknown',
          });
        }
      }
    }

    return {
      totalOrders: orders.length,
      validOrders,
      totalBackendRevenue: Math.round(totalBackendRevenue * 100) / 100,
      expectedRevenue: Math.round(expectedRevenue * 100) / 100,
      mismatches,
      isBalanced: mismatches.length === 0,
    };
  }

  private isValidRevenueOrder(order: Order): boolean {
    const status = order.restaurantStatus?.toLowerCase();
    const deliveryStatus = order.deliveryPartnerStatus?.toLowerCase();
    const paymentMode = order.payment_mode?.toUpperCase();
    const paymentStatus = order.paymentStatus?.toLowerCase();

    if (['cancelled', 'rejected'].includes(status)) return false;
    if (['cancelled', 'admin_cancelled'].includes(deliveryStatus)) return false;

    if (paymentMode === 'ONLINE') {
      return paymentStatus === 'success';
    }

    if (paymentMode === 'COD') {
      return deliveryStatus === 'delivered';
    }

    return false;
  }

  async generateSanityCheckReport(startDate: Date, endDate: Date): Promise<{
    summary: string;
    details: {
      onlineSuccess: number;
      codDelivered: number;
      cancelled: number;
      refunded: number;
      pending: number;
    };
  }> {
    const orders = await this.orderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    const details = {
      onlineSuccess: 0,
      codDelivered: 0,
      cancelled: 0,
      refunded: 0,
      pending: 0,
    };

    for (const order of orders) {
      const isCancelled = ['cancelled', 'rejected'].includes(order.restaurantStatus?.toLowerCase()) ||
        ['cancelled', 'admin_cancelled'].includes(order.deliveryPartnerStatus?.toLowerCase());
      
      if (isCancelled) {
        details.cancelled++;
        continue;
      }

      const paymentMode = order.payment_mode?.toUpperCase();
      const paymentStatus = order.paymentStatus?.toLowerCase();
      const deliveryStatus = order.deliveryPartnerStatus?.toLowerCase();

      if (paymentMode === 'ONLINE' && paymentStatus === 'success') {
        details.onlineSuccess++;
      } else if (paymentMode === 'COD' && deliveryStatus === 'delivered') {
        details.codDelivered++;
      } else {
        details.pending++;
      }

      if (order.refundedAmount > 0) {
        details.refunded++;
      }
    }

    return {
      summary: `Total: ${orders.length} | Valid Revenue: ${details.onlineSuccess + details.codDelivered} | Cancelled: ${details.cancelled} | Pending: ${details.pending} | Refunded: ${details.refunded}`,
      details,
    };
  }
}

// Usage in admin controller:
// GET /admin/revenue/validate?startDate=2024-01-01&endDate=2024-01-31