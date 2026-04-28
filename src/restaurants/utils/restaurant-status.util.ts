export interface RestaurantStatusResult {
  isOpen: boolean;
  statusLabel: 'ON' | 'OFF' | 'BLOCKED';
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function isTimeInRange(currentTime: string, fromTime: string, toTime: string): boolean {
  const current = parseInt(currentTime.replace(':', ''));
  const from = parseInt(fromTime.replace(':', ''));
  const to = parseInt(toTime.replace(':', ''));

  if (from < to) {
    return current >= from && current <= to;
  } else {
    return current >= from || current <= to;
  }
}

function checkOperationalHours(hours: { day: string; enabled: boolean; from: string; to: string }[]): boolean {
  const now = new Date();
  const currentHour = now.toTimeString().slice(0, 5);
  const today = DAYS[now.getDay()];

  const todayHours = hours.find(
    (h) => h.day.toLowerCase() === today && h.enabled,
  );

  if (!todayHours) {
    return false;
  }

  return isTimeInRange(currentHour, todayHours.from, todayHours.to);
}

export function getRestaurantStatus(restaurant: {
  isActive?: boolean;
  isManuallyOff?: boolean;
  operational_hours?: { day: string; enabled: boolean; from: string; to: string }[];
}): RestaurantStatusResult {
  const now = new Date();
  const hour = now.getHours();

  const isTimeClosed = hour >= 23 || hour < 7;

  const isActive = restaurant.isActive ?? false;
  const isManuallyOff = restaurant.isManuallyOff ?? false;

  let isOpen = isActive && !isManuallyOff && !isTimeClosed;

  if (restaurant.operational_hours && restaurant.operational_hours.length > 0) {
    isOpen = isActive && !isManuallyOff && checkOperationalHours(restaurant.operational_hours);
  }

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
  operational_hours?: { day: string; enabled: boolean; from: string; to: string }[];
}): boolean {
  const { isOpen } = getRestaurantStatus(restaurant);
  return isOpen;
}