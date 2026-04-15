import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDocumentDto } from './dto/create-restaurant-document.dto';
import { UpdateRestaurantDocumentDto } from './dto/update-restaurant-document.dto';
import { Restaurant } from './entity/restaurant.entity';
import { RestaurantDocument } from './entity/restaurant_document.entity';

@Injectable()
export class RestaurantDocumentService {
  constructor(
    @InjectRepository(RestaurantDocument)
    private readonly restaurantDocumentRepository: Repository<RestaurantDocument>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  /**
   * ✅ Create a new document for a restaurant (linked via UID)
   */
  async create(createDto: CreateRestaurantDocumentDto): Promise<RestaurantDocument> {
    const restaurant: Restaurant | null = await this.restaurantRepository.findOne({
      where: { uid: createDto.restaurantUid },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with UID ${createDto.restaurantUid} not found`);
    }

    const document: RestaurantDocument = this.restaurantDocumentRepository.create({
      ...createDto,
      restaurant,
    });

    return await this.restaurantDocumentRepository.save(document);
  }

  /**
   * ✅ Get all documents (with restaurant info)
   */
  async findAll(): Promise<RestaurantDocument[]> {
    return await this.restaurantDocumentRepository.find({
      relations: ['restaurant'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * ✅ Get all documents for a specific restaurant UID
   */
  async findByRestaurantUid(uid: string): Promise<RestaurantDocument[]> {
    const documents: RestaurantDocument[] = await this.restaurantDocumentRepository.find({
      where: { restaurant: { uid } },
      relations: ['restaurant'],
    });

    if (documents.length === 0) {
      throw new NotFoundException(`No documents found for restaurant UID ${uid}`);
    }

    return documents;
  }

  /**
   * ✅ Get a single document by ID
   */
  async findOne(id: string): Promise<RestaurantDocument> {
    const document: RestaurantDocument | null = await this.restaurantDocumentRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  /**
   * ✅ Update a restaurant document by ID
   */
  async update(id: string, updateDto: UpdateRestaurantDocumentDto): Promise<RestaurantDocument> {
    const document: RestaurantDocument = await this.findOne(id);
    const updatedDocument: RestaurantDocument = {
      ...document,
      ...updateDto,
    };

    return await this.restaurantDocumentRepository.save(updatedDocument);
  }

  /**
   * ✅ Delete a restaurant document by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    const document: RestaurantDocument = await this.findOne(id);
    await this.restaurantDocumentRepository.remove(document);
    return { message: 'Document deleted successfully' };
  }
}
