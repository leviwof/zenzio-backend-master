import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartGroup } from './entity/cart-group.entity';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { StatusCodeToLabel } from 'src/constants/status.constants';
// import { StatusCodeToLabel } from 'src/constants/app.constants';
// StatusCodeToLabel
// UpdateCartStatusDto
// import { CartGroup } from '../entity/cart-group.entity';
// import { UpdateCartStatusDto } from '../dto/update-cart-status.dto';
// StatusCodeToLabel
@Injectable()
export class CartStatusService {
  constructor(
    @InjectRepository(CartGroup)
    private groupRepo: Repository<CartGroup>,
  ) {}

  // ---------------------------------------------
  // UPDATE CART GROUP USING cart_group_uid
  // ---------------------------------------------
  async updateStatus(cartGroupUid: string, dto: UpdateCartStatusDto) {
    const group = await this.groupRepo.findOneBy({ cart_group_uid: cartGroupUid });

    if (!group) throw new NotFoundException('Cart Group Not Found');

    // 1. Apply numeric code → label auto-update
    if (dto.f_status !== undefined) {
      dto.f_status_flag = StatusCodeToLabel[dto.f_status];
    }

    if (dto.r_status !== undefined) {
      dto.r_status_flag = StatusCodeToLabel[dto.r_status];
    }

    if (dto.status !== undefined) {
      dto.status_flag = StatusCodeToLabel[dto.status];
    }

    // 2. Merge changes
    Object.assign(group, dto);

    await this.groupRepo.save(group);

    return { success: true, message: 'Status Updated Successfully' };
  }

  // ---------------------------------------------
  // GET STATUS USING cart_group_uid
  // ---------------------------------------------
  async getStatus(cartGroupUid: string) {
    const group = await this.groupRepo.findOne({
      where: { cart_group_uid: cartGroupUid },
    });

    if (!group) {
      throw new NotFoundException('CartGroup not found');
    }

    return group;
  }
}
