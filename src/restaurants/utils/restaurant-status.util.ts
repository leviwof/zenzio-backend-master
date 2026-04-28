export interface RestaurantStatusResult {
  isOpen: boolean;
  statusLabel: 'ON' | 'OFF' | 'BLOCKED';
}

const DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYS_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function isTimeInRange(currentTime: string, fromTime: string, toTime: string): boolean {
  // Convert HH:MM to minutes since midnight for proper comparison
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const current = toMinutes(currentTime);
  const from = toMinutes(fromTime);
  const to = toMinutes(toTime);

  // Handle overnight hours (e.g., 22:00 to 02:00)
  if (from > to) {
    return current >= from || current <= to;
  }
  return current >= from && current <= to;
}

function checkOperationalHours(hours: { day: string; enabled: boolean; from: string; to: string }[]): boolean {
  // Use IST explicitly - server is in ap-south-1 (Mumbai)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + istOffset);
  
  const currentHour = istTime.toISOString().slice(11, 16); // HH:MM in IST
  const todayShort = DAYS_SHORT[istTime.getDay()];
  const todayFull = DAYS_FULL[istTime.getDay()];

  const todayHours = hours.find(
    (h) => {
      const dayLower = h.day?.toLowerCase();
      return dayLower && (dayLower === todayShort || dayLower === todayFull || dayLower === todayShort.slice(0, 3)) && h.enabled;
    },
  );

  if (!todayHours) {
    return false;
  }

  return isTimeInRange(currentHour, todayHours.from, todayHours.to);
}

export function getRestaurantStatus(restaurant: {
  isActive?: boolean;
  isBlocked?: boolean;
  isManuallyOff?: boolean;
  operational_hours?: { day: string; enabled: boolean; from: string; to: string }[];
}): RestaurantStatusResult {
  // Use IST explicitly
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + istOffset);
  
  const hour = istTime.getHours();

  // Working hours: 7 AM to 11 PM (23:00)
  const isWorkingHours = hour >= 7 && hour < 23;

  const isActive = restaurant.isActive ?? false;
  const isBlocked = restaurant.isBlocked ?? restaurant.isManuallyOff ?? false;

  let isOpen = false;

  if (isWorkingHours) {
    // During working hours (7 AM - 11 PM), ignore operational hours check
    // Only check if restaurant is active and not blocked/manually off
    isOpen = isActive && !isBlocked;
  } else {
    // Outside working hours, check operational hours if available
    if (!restaurant.operational_hours || restaurant.operational_hours.length === 0) {
      isOpen = isActive && !isBlocked;
    } else {
      isOpen = isActive && !isBlocked && checkOperationalHours(restaurant.operational_hours);
    }
  }

  let statusLabel: 'ON' | 'OFF' | 'BLOCKED' = 'ON';

  if (isBlocked) {
    statusLabel = 'BLOCKED';
  } else if (!isActive) {
    statusLabel = 'OFF';
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
  isBlocked?: boolean;
  isManuallyOff?: boolean;
  operational_hours?: { day: string; enabled: boolean; from: string; to: string }[];
}): boolean {
  const { isOpen } = getRestaurantStatus(restaurant);
  return isOpen;
}