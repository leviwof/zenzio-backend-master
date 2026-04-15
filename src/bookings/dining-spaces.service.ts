import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiningSpace } from './entities/dining-space.entity';
import { CreateDiningSpaceDto } from './dto/create-dining-space.dto';
import { UpdateDiningSpaceDto } from './dto/update-dining-space.dto';

@Injectable()
export class DiningSpaceService {
  constructor(
    @InjectRepository(DiningSpace)
    private readonly diningSpaceRepository: Repository<DiningSpace>,
  ) {}

  async create(createDiningSpaceDto: CreateDiningSpaceDto): Promise<DiningSpace> {
    const diningSpace = this.diningSpaceRepository.create(createDiningSpaceDto);
    return this.diningSpaceRepository.save(diningSpace);
  }

  async findAllByRestaurant(restaurantId: string): Promise<DiningSpace[]> {
    return this.diningSpaceRepository.find({
      where: { restaurantId },
      relations: ['offer'],
    });
  }

  async findOne(id: string): Promise<DiningSpace> {
    const diningSpace = await this.diningSpaceRepository.findOne({
      where: { id },
      relations: ['offer'],
    });
    if (!diningSpace) {
      throw new NotFoundException(`Dining Space with ID ${id} not found`);
    }
    return diningSpace;
  }

  async update(id: string, updateDiningSpaceDto: UpdateDiningSpaceDto): Promise<DiningSpace> {
    const diningSpace = await this.findOne(id);
    this.diningSpaceRepository.merge(diningSpace, updateDiningSpaceDto);
    return this.diningSpaceRepository.save(diningSpace);
  }

  async remove(id: string): Promise<void> {
    await this.diningSpaceRepository.delete(id);
  }
}
