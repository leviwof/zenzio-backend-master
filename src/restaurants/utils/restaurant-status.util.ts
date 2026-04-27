export interface RestaurantStatusResult {
  isOpen: boolean;
  statusLabel: 'ON' | 'OFF' | 'BLOCKED';
}

export function getRestaurantStatus(restaurant: {
  isActive?: boolean;
  isManuallyOff?: boolean;
}): RestaurantStatusResult {
  const now = new Date();
  const hour = now.getHours();

  const isTimeClosed = hour >= 23 || hour < 7;

  const isActive = restaurant.isActive ?? false;
  const isManuallyOff = restaurant.isManuallyOff ?? false;
  const isOpen = isActive && !isManuallyOff && !isTimeClosed;

  let statusLabel: 'ON' | 'OFF' | 'BLOCKED' = 'ON';

  if (!isActive) {
    statusLabel = 'BLOCKED';
  } else if (!isOpen) {
    statusLabel = 'OFF';
  }

  return {
    isOpen,
    statusLabel,
  };
}

export function isRestaurantOpenForOrder(restaurant: {
  isActive?: boolean;
  isManuallyOff?: boolean;
}): boolean {
  const { isOpen } = getRestaurantStatus(restaurant);
  return isOpen;
}