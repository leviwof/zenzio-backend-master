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

  // Owner toggle - use isManuallyOff (not isActive)
  restaurant.isManuallyOff = !restaurant.isManuallyOff;

  await restaurantRepository.save(restaurant);

  const { isOpen, statusLabel } = getRestaurantStatus(restaurant);

  return {
    status: 'success',
    message: `Restaurant isManuallyOff updated to ${restaurant.isManuallyOff}`,
    data: {
      id: restaurant.id,
      uid: restaurant.uid,
      isManuallyOff: restaurant.isManuallyOff,
      isOpen,
      statusLabel,
    },
  };
}

function getRestaurantStatus(restaurant: Restaurant): { isOpen: boolean; statusLabel: string } {
  const now = new Date();
  const hour = now.getHours();
  const timeClosed = hour >= 23 || hour < 7;

  const isOpen = restaurant.isActive && !restaurant.isManuallyOff && !timeClosed;

  let statusLabel = 'ON';
  if (!restaurant.isActive) {
    statusLabel = 'BLOCKED';
  } else if (!isOpen) {
    statusLabel = 'OFF';
  }

  return { isOpen, statusLabel };
}
