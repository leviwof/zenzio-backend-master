// src/menu/menu.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
  ) {}

  async create(payload: Partial<Menu>) {
    const item = this.menuRepo.create(payload);
    return this.menuRepo.save(item);
  }

  async findAll() {
    return this.menuRepo.find();
  }

  async findOne(id: string) {
    return this.menuRepo.findOne({ where: { id } });
  }

  // Update: use preload to merge and validate existence
  async update(id: string, payload: Partial<Menu>) {
    const toUpdate = await this.menuRepo.preload({ id, ...payload });
    if (!toUpdate) {
      return null; // controller will translate to 404
    }
    return this.menuRepo.save(toUpdate);
  }

  // Remove by id
  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) return null;
    await this.menuRepo.remove(entity);
    return true;
  }
}
