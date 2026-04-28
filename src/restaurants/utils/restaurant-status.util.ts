export interface RestaurantStatusResult {
  isOpen: boolean;
  statusLabel: 'ON' | 'OFF' | 'BLOCKED';
}

const DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYS_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
  // TODO: Remove this debug override
  console.log('DEBUG - TEMP OVERRIDE: Allowing all orders for testing');
  return true;

  const now = new Date();
  const currentHour = now.toTimeString().slice(0, 5);
  const todayShort = DAYS_SHORT[now.getDay()];
  const todayFull = DAYS_FULL[now.getDay()];

  console.log('DEBUG - Current time:', currentHour, 'Day index:', now.getDay(), 'Short:', todayShort, 'Full:', todayFull);
  console.log('DEBUG - Available hours:', hours);

  const todayHours = hours.find(
    (h) => {
      const dayLower = h.day?.toLowerCase();
      return dayLower && (dayLower === todayShort || dayLower === todayFull || dayLower === todayShort.slice(0, 3)) && h.enabled;
    },
  );

  console.log('DEBUG - Today hours:', todayHours);

  if (!todayHours) {
    return false;
  }

  const inRange = isTimeInRange(currentHour, todayHours.from, todayHours.to);
  console.log('DEBUG - In range:', inRange, 'current:', currentHour, 'from:', todayHours.from, 'to:', todayHours.to);
  return inRange;
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

  let isOpen = false;

  // If no operational hours set, use default 7AM-11PM logic
  if (!restaurant.operational_hours || restaurant.operational_hours.length === 0) {
    isOpen = isActive && !isManuallyOff && !isTimeClosed;
  } else {
    isOpen = isActive && !isManuallyOff && checkOperationalHours(restaurant.operational_hours);
  }

  console.log('DEBUG - isOpen:', isOpen, 'isActive:', isActive, 'isManuallyOff:', isManuallyOff, 'hours length:', restaurant.operational_hours?.length);

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