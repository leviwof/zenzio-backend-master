// src/utils/speed.util.ts

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number; // Unix timestamp in seconds
}

export interface SpeedStats {
  totalDistanceKm: number;
  totalTimeMinutes: number;
  averageSpeedKmph: number;
  maxSpeedKmph: number;
}

// Haversine formula to compute distance between 2 coordinates
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function calculateSpeedStats(points: GpsPoint[]): SpeedStats {
  if (points.length < 2) {
    return {
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      averageSpeedKmph: 0,
      maxSpeedKmph: 0,
    };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  const totalTime = (points[points.length - 1].timestamp - points[0].timestamp) / 60; // minutes

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    const distance = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    const timeSec = p2.timestamp - p1.timestamp;

    if (timeSec > 0) {
      const speed = (distance / timeSec) * 3600; // km/h
      maxSpeed = Math.max(maxSpeed, speed);
    }

    totalDistance += distance;
  }

  const averageSpeed = totalDistance / (totalTime / 60); // km/h

  return {
    totalDistanceKm: Number(totalDistance.toFixed(3)),
    totalTimeMinutes: Number(totalTime.toFixed(2)),
    averageSpeedKmph: Number(averageSpeed.toFixed(2)),
    maxSpeedKmph: Number(maxSpeed.toFixed(2)),
  };
}
