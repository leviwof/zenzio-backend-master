import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkType } from './work-type.entity';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Injectable()
export class WorkTypeService {
  constructor(
    @InjectRepository(WorkType)
    private readonly workTypeRepo: Repository<WorkType>,
  ) {}

  async create(dto: CreateWorkTypeDto) {
    // Check if name already exists
    const exists = await this.workTypeRepo.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new BadRequestException('Name already exists');
    }

    // Create new record
    const newType = this.workTypeRepo.create(dto);
    return await this.workTypeRepo.save(newType);
  }

  async findAll() {
    return await this.workTypeRepo.find();
  }

  async findOne(uid: string) {
    const type = await this.workTypeRepo.findOne({
      where: { work_type_uid: uid },
    });

    if (!type) throw new NotFoundException(`Work Type ${uid} not found`);
    return type;
  }

  async update(uid: string, dto: UpdateWorkTypeDto) {
    const type = await this.workTypeRepo.findOne({
      where: { work_type_uid: uid },
    });

    if (!type) {
      throw new NotFoundException(`Work Type ${uid} not found`);
    }

    // Check duplicate name (if name is being updated)
    if (dto.name && dto.name !== type.name) {
      const nameExists = await this.workTypeRepo.findOne({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new BadRequestException('Name already exists');
      }
    }

    Object.assign(type, dto);

    return await this.workTypeRepo.save(type);
  }

  async remove(uid: string) {
    const type = await this.findOne(uid);
    return await this.workTypeRepo.remove(type);
  }
}
