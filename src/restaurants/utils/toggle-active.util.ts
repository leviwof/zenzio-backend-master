import { Restaurant } from '../entity/restaurant.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export async function toggleRestaurantActiveUtil(
  restaurantRepository: Repository<Restaurant>,
  uid: string,
) {
  const restaurant = await restaurantRepository.findOne({ where: { uid } });

  if (!restaurant) {
    throw new NotFoundException(`Restaurant with UID ${uid} not found`);
  }

  restaurant.isActive = !restaurant.isActive; // Toggle boolean

  await restaurantRepository.save(restaurant);

  return {
    status: 'success',
    message: `Restaurant isActive updated to ${restaurant.isActive}`,
    data: {
      id: restaurant.id,
      uid: restaurant.uid,
      isActive: restaurant.isActive,
      isActive_flag: restaurant.isActive ? 'Open' : 'Closed',
    },
  };
}
