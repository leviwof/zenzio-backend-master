import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantEnum } from './restaurant_enum.entity';
import { RestaurantEnumDto } from './dto/restaurant_enum.dto';

@Injectable()
export class RestaurantEnumService {
  constructor(
    @InjectRepository(RestaurantEnum)
    private readonly repository: Repository<RestaurantEnum>,
  ) {}

  /** ✅ Create new enum value with duplicate check (based on name + father_id + parent_id) */
  async create(dto: RestaurantEnumDto): Promise<RestaurantEnum> {
    const exists = await this.repository.findOne({
      where: {
        name: dto.name,
        father_id: dto.father_id ?? 0,
        parent_id: dto.parent_id ?? 0,
      },
    });

    if (exists) {
      throw new BadRequestException(
        `Duplicate entry: '${dto.name}' already exists under this hierarchy (father_id=${dto.father_id ?? 0}, parent_id=${dto.parent_id ?? 0}).`,
      );
    }

    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  /** 🔹 Get all records */
  async findAll(): Promise<RestaurantEnum[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  /** 🔹 Get top-level groups (main categories) */
  async findGroups(): Promise<RestaurantEnum[]> {
    return this.repository.find({
      where: { father_id: 0, parent_id: 0 },
      order: { id: 'ASC' },
    });
  }

  /** 🔹 Get children of a specific parent_id (subcategory or item list) */
  async findByParent(parent_id: number): Promise<RestaurantEnum[]> {
    return this.repository.find({
      where: { parent_id },
      order: { id: 'ASC' },
    });
  }

  /** 🔹 Get one record by ID */
  async findOne(id: number): Promise<RestaurantEnum | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** ✅ Update with duplicate check (based on name + father_id + parent_id) */
  async update(id: number, dto: RestaurantEnumDto): Promise<RestaurantEnum | null> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) return null;

    const duplicate = await this.repository.findOne({
      where: {
        name: dto.name,
        father_id: dto.father_id ?? 0,
        parent_id: dto.parent_id ?? 0,
      },
    });

    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException(
        `Duplicate entry: '${dto.name}' already exists under this hierarchy (father_id=${dto.father_id ?? 0}, parent_id=${dto.parent_id ?? 0}).`,
      );
    }

    this.repository.merge(existing, dto);
    return this.repository.save(existing);
  }

  /** 🔹 Delete a record */
  async remove(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** 🔹 Get all items under a specific father_id (entire hierarchy of a main category) */
  async findByFather(father_id: number): Promise<RestaurantEnum[]> {
    return this.repository.find({
      where: { father_id },
      order: { id: 'ASC' },
    });
  }
}
