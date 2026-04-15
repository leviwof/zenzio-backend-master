import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryLocation, AddressType } from './delivery_location.entity';
import { CreateDeliveryLocationDto } from './dto/create-delivery-location.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';

@Injectable()
export class DeliveryLocationService {
  constructor(
    @InjectRepository(DeliveryLocation)
    private readonly repo: Repository<DeliveryLocation>,
  ) {}

  private readonly ALLOWED_TYPES: AddressType[] = ['primary', 'home', 'office', 'public', 'guest'];

  // CREATE
  async create(dto: CreateDeliveryLocationDto) {
    const allowed: AddressType[] = ['primary', 'home', 'office', 'public', 'guest'];

    if (!allowed.includes(dto.address_type)) {
      throw new BadRequestException(`Invalid address_type. Allowed: ${allowed.join(', ')}`);
    }

    if (dto.is_default) {
      await this.repo.update({ user_uid: dto.user_uid }, { is_default: false });
    }

    // check for existing type & update
    const existing = await this.repo.findOne({
      where: { user_uid: dto.user_uid, address_type: dto.address_type },
    });

    if (existing) {
      existing.address = dto.address;
      existing.lat = dto.lat;
      existing.lng = dto.lng;
      existing.is_default = dto.is_default;
      existing.status = 0;
      existing.verified = true;

      return this.repo.save(existing);
    }

    const location = this.repo.create({
      ...dto,
      status: 0,
      verified: true,
    });

    return this.repo.save(location);
  }

  // LIST BY USER
  async findAll(user_uid: string) {
    return this.repo.find({
      where: { user_uid },
      order: { created_at: 'DESC' },
    });
  }

  // GET BY UID
  async findOne(uid: string) {
    const location = await this.repo.findOne({
      where: { delivery_uid: uid },
    });

    if (!location) throw new NotFoundException('Delivery location not found');

    return location;
  }

  // GET BY USER + ADDRESS TYPE (SAFE)
  async findByUserAndType(user_uid: string, type: string) {
    // SAFE validation
    if (!this.ALLOWED_TYPES.includes(type as AddressType)) {
      throw new NotFoundException('Invalid address type');
    }

    const location = await this.repo.findOne({
      where: {
        user_uid,
        address_type: type as AddressType,
      },
    });

    if (!location) {
      throw new NotFoundException('Address not found');
    }

    return location;
  }

  async addAddressToCartGroup(user_uid: string, type: string) {
    const allowed = ['primary', 'home', 'office', 'public', 'guest'];

    if (!allowed.includes(type)) {
      return null;
    }

    const location = await this.repo.findOne({
      where: {
        user_uid,
        address_type: type as AddressType,
      },
    });

    return location || null;
  }

  // UPDATE
  async update(uid: string, dto: UpdateDeliveryLocationDto) {
    const location = await this.findOne(uid);

    if (dto.is_default) {
      await this.repo.update({ user_uid: location.user_uid }, { is_default: false });
    }

    Object.assign(location, dto);
    return this.repo.save(location);
  }

  // DELETE
  async remove(uid: string) {
    const location = await this.findOne(uid);
    return this.repo.remove(location);
  }
}
