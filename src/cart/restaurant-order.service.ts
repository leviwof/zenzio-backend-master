import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartGroup } from '../cart/entity/cart-group.entity';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { CartOrderStatus } from 'src/constants/status.constants';

@Injectable()
export class RestaurantOrderService {
  constructor(
    @InjectRepository(CartGroup)
    private readonly groupRepo: Repository<CartGroup>,
  ) {}

  // -----------------------------------------------------
  // HANDLE RESTAURANT ORDER ACTIONS
  // -----------------------------------------------------
  async updateOrderStatus(
    restaurant_uid: string,
    cart_group_uid: string,
    dto: UpdateCartStatusDto,
  ) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid, restaurant_uid },
    });

    if (!group) {
      throw new NotFoundException('Order not found for restaurant');
    }

    // --------------------------------------------
    // Update fields dynamically (only values sent)
    // --------------------------------------------
    Object.assign(group, dto);

    // --------------------------------------------
    // Add log entries automatically
    // --------------------------------------------
    const timestamp = new Date().toISOString();

    if (dto.r_status_flag || dto.r_status) {
      group.logs = [
        ...(group.logs || []),
        {
          code: dto.r_status ?? '',
          desc: dto.r_status_flag ?? '',
          timestamp,
        },
      ];
    }

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Restaurant order status updated successfully',
      data: { group },
      meta: { timestamp },
    };
  }

  // -----------------------------------------------------------
  // ACCEPT ORDER ACTION
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // ACCEPT ORDER ACTION (POST) — NO BODY REQUIRED
  // -----------------------------------------------------------
  async acceptOrderByRes(restaurant_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid, restaurant_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found for restaurant uid=${restaurant_uid}`);
    }

    // -----------------------------------------------------
    // Set Accept Status (Restaurant side)
    // -----------------------------------------------------
    group.r_status = CartOrderStatus.R_ACCEPTED.code;
    group.r_status_flag = CartOrderStatus.R_ACCEPTED.label;

    // -----------------------------------------------------
    // Add logs
    // -----------------------------------------------------
    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.r_status,
        desc: group.r_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted successfully',
      data: {
        group: {
          cart_group_uid: group.cart_group_uid,
          r_status: group.r_status,
          r_status_flag: group.r_status_flag,
          logs: group.logs,
        },
      },
      meta: { timestamp },
    };
  }

  // -----------------------------------------------------------
  // ACCEPT ORDER ACTION
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // ACCEPT ORDER ACTION (POST) — NO BODY REQUIRED
  // -----------------------------------------------------------
  async rejectOrderByRes(restaurant_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid, restaurant_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found for restaurant uid=${restaurant_uid}`);
    }

    // -----------------------------------------------------
    // Set Accept Status (Restaurant side)
    // -----------------------------------------------------
    group.r_status = CartOrderStatus.R_REJECTED.code;
    group.r_status_flag = CartOrderStatus.R_REJECTED.label;

    // -----------------------------------------------------
    // Add logs
    // -----------------------------------------------------
    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.r_status,
        desc: group.r_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted successfully',
      data: {
        group: {
          cart_group_uid: group.cart_group_uid,
          r_status: group.r_status,
          r_status_flag: group.r_status_flag,
          logs: group.logs,
        },
      },
      meta: { timestamp },
    };
  }

  // -----------------------------------------------------------
  async foodPrepare(restaurant_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid, restaurant_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found for restaurant uid=${restaurant_uid}`);
    }

    // -----------------------------------------------------
    // Set Accept Status (Restaurant side)
    // -----------------------------------------------------
    group.r_status = CartOrderStatus.R_PREPARING.code;
    group.r_status_flag = CartOrderStatus.R_PREPARING.label;

    // -----------------------------------------------------
    // Add logs
    // -----------------------------------------------------
    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.r_status,
        desc: group.r_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted successfully',
      data: {
        group: {
          cart_group_uid: group.cart_group_uid,
          r_status: group.r_status,
          r_status_flag: group.r_status_flag,
          logs: group.logs,
        },
      },
      meta: { timestamp },
    };
  }

  async foodReady(restaurant_uid: string, cart_group_uid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid, restaurant_uid },
    });

    if (!group) {
      throw new NotFoundException(`Order not found for restaurant uid=${restaurant_uid}`);
    }

    // -----------------------------------------------------
    // Set Accept Status (Restaurant side)
    // -----------------------------------------------------
    group.r_status = CartOrderStatus.R_READY_FOR_PICKUP.code;
    group.r_status_flag = CartOrderStatus.R_READY_FOR_PICKUP.label;

    // -----------------------------------------------------
    // Add logs
    // -----------------------------------------------------
    const timestamp = new Date().toISOString();

    group.logs = [
      ...(group.logs || []),
      {
        code: group.r_status,
        desc: group.r_status_flag,
        timestamp,
      },
    ];

    await this.groupRepo.save(group);

    return {
      status: 'success',
      code: 200,
      message: 'Order accepted successfully',
      data: {
        group: {
          cart_group_uid: group.cart_group_uid,
          r_status: group.r_status,
          r_status_flag: group.r_status_flag,
          logs: group.logs,
        },
      },
      meta: { timestamp },
    };
  }
}
