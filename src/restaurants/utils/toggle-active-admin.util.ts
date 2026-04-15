import { Restaurant } from '../entity/restaurant.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export async function statusRestaurantByAdminUtil(
  restaurantRepository: Repository<Restaurant>,
  uid: string,
  body: { status?: boolean; isActive?: boolean },
) {
  const restaurant = await restaurantRepository.findOne({ where: { uid } });

  if (!restaurant) {
    throw new NotFoundException(`Restaurant with UID ${uid} not found`);
  }

  // Update fields if provided
  if (body.status !== undefined) {
    restaurant.status = body.status;
  }

  if (body.isActive !== undefined) {
    restaurant.isActive = body.isActive;
  }

  await restaurantRepository.save(restaurant);

  return {
    status: 'success',
    message: 'Restaurant status updated successfully',
    data: {
      id: restaurant.id,
      uid: restaurant.uid,
      status: restaurant.status,
      isActive: restaurant.isActive,
      status_flag: restaurant.status ? 'Active' : 'Inactive',
      isActive_flag: restaurant.isActive ? 'Open' : 'Closed',
    },
  };
}
