import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Products } from './products.entity';
import { ProductsDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly repository: Repository<Products>,
  ) {}

  async create(dto: ProductsDto): Promise<Products> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async findAll(): Promise<Products[]> {
    return this.repository.find({ where: { deletedAt: IsNull() } });
  }

  async findAllWithPagination(page: number, limit: number): Promise<[Products[], number]> {
    return this.repository.findAndCount({
      where: { deletedAt: IsNull() },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: number): Promise<Products | null> {
    return this.repository.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async update(id: number, dto: ProductsDto): Promise<Products | null> {
    const entity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!entity) return null;
    this.repository.merge(entity, dto);
    return this.repository.save(entity);
  }

  /** Hard delete */
  async remove(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** Soft delete */
  async softDelete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { deletedAt: new Date() } as Partial<Products>);
    return (result.affected ?? 0) > 0;
  }
}
