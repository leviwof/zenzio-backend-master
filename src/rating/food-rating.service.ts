import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodRating } from './food-rating.entity';
import { FoodRatingDto } from './food-rating.dto';

@Injectable()
export class FoodRatingService {
  constructor(
    @InjectRepository(FoodRating)
    private readonly repo: Repository<FoodRating>,
  ) {}

  // Create or Update
  async rateFood(cus_uid: string, dto: FoodRatingDto): Promise<FoodRating> {
    const { group_id, menu_uid, rating, description } = dto;

    // check existing row for this group + customer + menu
    let entity = await this.repo.findOne({
      where: { group_id, cus_uid, menu_uid },
    });

    if (!entity) {
      // CREATE NEW ROW
      entity = this.repo.create({
        group_id,
        cus_uid,
        menu_uid,
        rating,
        description: description ?? null,
      });

      return await this.repo.save(entity);
    }

    // UPDATE EXISTING ROW
    entity.rating = rating;
    entity.description = description ?? null;

    return await this.repo.save(entity);
  }

  // Get by group + customer
  async getRatings(group_id: string, cus_uid: string) {
    return await this.repo.find({
      where: { group_id, cus_uid },
    });
  }
}
