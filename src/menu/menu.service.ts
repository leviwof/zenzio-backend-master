// src/menu/menu.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';
import { UpdateMenuStatusDto, BulkUpdateStatusDto, BulkDeleteDto } from './dto/menu-status.dto';
import { roundPrice } from 'src/utils/price.util';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
  ) {}

  async create(payload: Partial<Menu>) {
    const item = this.menuRepo.create({ ...payload, isActive: payload.isActive ?? true });
    return this.menuRepo.save(item);
  }

  async findAll() {
    const items = await this.menuRepo.find({
      where: { deletedAt: null as any },
      order: { createdAt: 'DESC' },
    });
    return items.map(item => ({
      ...item,
      price: roundPrice(item.price),
    }));
  }

  async findOne(id: string) {
    const menu = await this.menuRepo.findOne({
      where: { id, deletedAt: null as any },
    });
    if (!menu) throw new NotFoundException('Menu item not found');
    return menu;
  }

  async update(id: string, payload: Partial<Menu>) {
    const menu = await this.findOne(id);
    Object.assign(menu, payload);
    return this.menuRepo.save(menu);
  }

  async updateStatus(id: string, dto: UpdateMenuStatusDto) {
    const menu = await this.findOne(id);
    menu.isActive = dto.isActive;
    return this.menuRepo.save(menu);
  }

  async bulkUpdateStatus(dto: BulkUpdateStatusDto) {
    if (!dto.ids || dto.ids.length === 0) {
      throw new BadRequestException('IDs array is required');
    }

    const result = await this.menuRepo
      .createQueryBuilder()
      .update(Menu)
      .set({ isActive: dto.isActive })
      .where('id IN (:...ids)', { ids: dto.ids })
      .andWhere('deleted_at IS NULL')
      .execute();

    return {
      updated: result.affected,
      ids: dto.ids,
    };
  }

  async remove(id: string) {
    const menu = await this.findOne(id);
    menu.deletedAt = new Date();
    await this.menuRepo.save(menu);
    return true;
  }

  async bulkDelete(dto: BulkDeleteDto) {
    if (!dto.ids || dto.ids.length === 0) {
      throw new BadRequestException('IDs array is required');
    }

    const result = await this.menuRepo
      .createQueryBuilder()
      .update(Menu)
      .set({ deletedAt: new Date() })
      .where('id IN (:...ids)', { ids: dto.ids })
      .andWhere('deleted_at IS NULL')
      .execute();

    return {
      deleted: result.affected,
      ids: dto.ids,
    };
  }
}