import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './offers.entity';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferImagesService } from './offer-images.service';
import { MulterFile } from 'src/types/multer-file.type';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private repo: Repository<Offer>,
    private readonly offerImagesService: OfferImagesService,
  ) {}

  
  async createOffer(dto: CreateOfferDto, image?: MulterFile) {
    let offerImage: string | undefined;

    
    if (image) {
      const uploadResult = await this.offerImagesService.uploadOfferImage(image);
      offerImage = uploadResult.url;
    }

    const offer = this.repo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      offerImage,
      status: 'PENDING',
      createdByAdmin: false,
    });
    return this.repo.save(offer);
  }

  
  async getOffersByRestaurant(restaurantId: string, page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    return this.repo.find({
      where: { restaurantId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  
  async updateOffer(id: string, dto: UpdateOfferDto, image?: MulterFile) {
    const existingOffer = await this.repo.findOneBy({ id });
    if (!existingOffer) {
      throw new NotFoundException('Offer not found');
    }

    if (existingOffer.status === 'PENDING') {
      throw new BadRequestException('Cannot update offer while it is in PENDING status');
    }

    if (existingOffer.status === 'REJECTED') {
      throw new BadRequestException('Cannot update REJECTED offer. Please create a new one.');
    }

    const updateData: any = {
      ...dto,
      status: 'PENDING', // Reset to pending for re-review
    };

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    // Handle image update
    if (image) {
      const uploadResult = await this.offerImagesService.uploadOfferImage(image);
      updateData.offerImage = uploadResult.url;
    }

    await this.repo.update(id, updateData);
    return this.repo.findOneBy({ id });
  }

  
  async deleteOffer(id: string) {
    return this.repo.delete(id);
  }

  getPendingOffers() {
    return this.repo.find({ where: { status: 'PENDING' } });
  }

  async getAllOffers(query: any) {
    const { search, page = 1, pageSize = 10, approvalStatus, offerType, ...restResponse } = query;
    const take = Number(pageSize) || 10;
    const skip = (Number(page) - 1) * take;

    
    const allowedFields = [
      'restaurantId',
      'status',
      'discountType',
      'createdByAdmin',
      'isCommissionAuto',
    ];
    const filter: any = {};

    
    if (approvalStatus) {
      filter.status = approvalStatus;
    }
    

    
    Object.keys(restResponse).forEach((key) => {
      if (
        allowedFields.includes(key) &&
        restResponse[key] !== '' &&
        restResponse[key] !== null &&
        restResponse[key] !== undefined
      ) {
        filter[key] = restResponse[key];
      }
    });

    const where = search
      ? [
          { ...filter, title: ILike(`%${search}%`) },
          { ...filter, description: ILike(`%${search}%`) },
        ]
      : filter;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['restaurant', 'restaurant.profile', 'restaurant.address'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { data: items, count: total };
  }

  getOfferDetails(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.profile', 'restaurant.address'],
    });
  }

  approveOffer(id: string, comments?: string) {
    return this.repo.update(id, {
      status: 'APPROVED',
      adminComments: comments,
    });
  }

  rejectOffer(id: string, reason?: string) {
    return this.repo.update(id, {
      status: 'REJECTED',
      rejectionReason: reason,
    });
  }

  requestChanges(id: string, comments?: string) {
    return this.repo.update(id, {
      status: 'CHANGES_REQUESTED',
      adminComments: comments,
    });
  }

  async getAdminOffers(query: any) {
    const { search, page = 1, pageSize = 10, ...filter } = query;
    const take = Number(pageSize) || 10;
    const skip = (Number(page) - 1) * take;

    const baseFilter = { createdByAdmin: true, ...filter };

    const where = search
      ? [
          { ...baseFilter, title: ILike(`%${search}%`) },
          { ...baseFilter, description: ILike(`%${search}%`) },
        ]
      : baseFilter;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['restaurant', 'restaurant.profile', 'restaurant.address'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { data: items, count: total };
  }

  getAdminOfferById(id: string) {
    return this.repo.findOne({
      where: { id, createdByAdmin: true },
      relations: ['restaurant', 'restaurant.profile', 'restaurant.address'],
    });
  }

  async createOfferByAdmin(dto: CreateOfferDto, image?: MulterFile) {
    let offerImage: string | undefined;

    
    if (image) {
      const uploadResult = await this.offerImagesService.uploadOfferImage(image);
      offerImage = uploadResult.url;
    }

    return this.repo.save({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      offerImage,
      status: 'APPROVED',
      createdByAdmin: true,
    });
  }

  async updateAdminOffer(id: string, dto: UpdateOfferDto, image?: MulterFile) {
    const updateData: any = { ...dto };

    
    if (image) {
      const uploadResult = await this.offerImagesService.uploadOfferImage(image);
      updateData.offerImage = uploadResult.url;
    }

    return this.repo.update(id, updateData);
  }

  deleteAdminOffer(id: string) {
    return this.repo.delete(id);
  }
}
