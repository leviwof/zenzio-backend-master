import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CartGroup } from './entity/cart-group.entity';

// --------------------------------------------------------
// Reusable helper to exclude multiple fields safely
// --------------------------------------------------------
function excludeFields<T extends Record<string, any>>(item: T, fields: (keyof T)[]) {
  const clone = { ...item }; // plain object, safe — not CartGroup instance
  for (const field of fields) {
    delete clone[field];
  }
  return clone;
}

@Injectable()
export class CartGroupService {
  constructor(
    @InjectRepository(CartGroup)
    private readonly repo: Repository<CartGroup>,
  ) {}

  async listGroups(
    login_uid: string,
    query: {
      page: number;
      limit: number;
      restaurant_uid?: string;
      fleet_uid?: string;
      user_uid?: string;
      status?: string;
      r_status?: string;
      f_status?: string;
    },
  ) {
    if (!login_uid) throw new BadRequestException('Invalid user');

    const {
      page = 1,
      limit = 10,
      restaurant_uid,
      fleet_uid,
      user_uid,
      status,
      r_status,
      f_status,
    } = query;

    const skip = (page - 1) * limit;

    // ------------------------- WHERE CONDITIONS -------------------------
    const where: FindOptionsWhere<CartGroup> = {
      user_uid: login_uid,
    };

    if (restaurant_uid) where.restaurant_uid = restaurant_uid;
    if (fleet_uid) where.fleet_uid = fleet_uid;
    if (user_uid) where.user_uid = user_uid;
    if (status) where.status = status;
    if (r_status) where.r_status = r_status;
    if (f_status) where.f_status = f_status;

    // ------------------------- DB QUERY -------------------------
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });

    // ------------------------- FIELD EXCLUSION -------------------------
    const excludeList: (keyof CartGroup)[] = [
      'logs',
      'f_ticket_id',
      'r_ticket_id',
      'c_ticket_id',
      'status_flag',
      'f_status_flag',
      'r_status_flag',
      'm_status_flag',
    ];

    const sanitized = data.map((item) => excludeFields(item, excludeList));

    // ------------------------- RESPONSE FORMAT -------------------------
    return {
      status: 'success',
      code: 200,
      data: {
        cart_groups: sanitized,
      },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          restaurant_uid: restaurant_uid ?? null,
          fleet_uid: fleet_uid ?? null,
          user_uid: user_uid ?? null,
          status: status ?? null,
          r_status: r_status ?? null,
          f_status: f_status ?? null,
        },
      },
    };
  }

  async listGroupsForAdmin(
    admin_uid: string,
    query: {
      page: number;
      limit: number;
      restaurant_uid?: string;
      fleet_uid?: string;
      user_uid?: string;
      status?: string;
      r_status?: string;
      f_status?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      restaurant_uid,
      fleet_uid,
      user_uid,
      status,
      r_status,
      f_status,
    } = query;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CartGroup> = {};

    if (restaurant_uid) where.restaurant_uid = restaurant_uid;
    if (fleet_uid) where.fleet_uid = fleet_uid;
    if (user_uid) where.user_uid = user_uid;
    if (status) where.status = status;
    if (r_status) where.r_status = r_status;
    if (f_status) where.f_status = f_status;

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });

    const excludeList: (keyof CartGroup)[] = [
      // 'logs',
      // 'f_ticket_id',
      // 'r_ticket_id',
      // 'c_ticket_id',
      // 'status_flag',
      // 'f_status_flag',
      // 'r_status_flag',
      // 'm_status_flag',
    ];

    const sanitized = data.map((item) => excludeFields(item, excludeList));

    return {
      status: 'success',
      code: 200,
      data: {
        cart_groups: sanitized,
      },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          restaurant_uid: restaurant_uid ?? null,
          fleet_uid: fleet_uid ?? null,
          user_uid: user_uid ?? null,
          status: status ?? null,
          r_status: r_status ?? null,
          f_status: f_status ?? null,
        },
      },
    };
  }
}
