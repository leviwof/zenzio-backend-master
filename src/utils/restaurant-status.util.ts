export function isTimeClosed(hour: number): boolean {
  return hour >= 23 || hour < 7;
}

export function getRestaurantStatus(restaurant: {
  isActive: boolean;
  isManuallyOff: boolean;
}): { isOpen: boolean; statusLabel: 'ON' | 'OFF' | 'BLOCKED' } {
  const now = new Date();
  const hour = now.getHours();

  const timeClosed = isTimeClosed(hour);

  const isOpen = restaurant.isActive && !restaurant.isManuallyOff && !timeClosed;

  let statusLabel: 'ON' | 'OFF' | 'BLOCKED' = 'ON';
  if (!restaurant.isActive) {
    statusLabel = 'BLOCKED';
  } else if (!isOpen) {
    statusLabel = 'OFF';
  }

  return {
    isOpen,
    statusLabel,
  };
}

export function checkRestaurantOpen(restaurant: {
  isActive: boolean;
  isManuallyOff: boolean;
}): boolean {
  const status = getRestaurantStatus(restaurant);
  return status.isOpen;
}