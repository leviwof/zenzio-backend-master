// src/maps/maps.service.ts

import { Injectable } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';
import { calculateEta } from './utils/eta.util';
import { calculateSpeedStats, GpsPoint } from './utils/speed.util';
import { calculateDistanceKm, isWithinRadius } from './utils/radius.util';

// import { calculateEta } from 'src/utils/eta.util';
// calculateEta
@Injectable()
export class MapsService {
  private client: Client;
  private readonly apiKey: string;

  constructor() {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is missing in environment variables.');
    }

    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.client = new Client({});
  }

  // -------------------------
  // GEOCODE
  // -------------------------
  async geocodeAddress(address: string) {
    const res = await this.client.geocode({
      params: {
        address,
        key: this.apiKey,
      },
    });
    return res.data.results;
  }

  // -------------------------
  // REVERSE GEOCODE
  // -------------------------
  async reverseGeocode(lat: number, lng: number) {
    const res = await this.client.reverseGeocode({
      params: {
        latlng: `${lat},${lng}`,
        key: this.apiKey,
      },
    });
    return res.data.results;
  }

  // -------------------------
  // ROUTE
  // -------------------------
  async getRoute(start: number[], end: number[]) {
    const res = await this.client.directions({
      params: {
        origin: { lat: start[0], lng: start[1] },
        destination: { lat: end[0], lng: end[1] },
        key: this.apiKey,
      },
    });

    return res.data.routes[0];
  }

  // -------------------------
  // DISTANCE MATRIX
  // -------------------------
  async getDistance(start: number[], end: number[]) {
    const res = await this.client.distancematrix({
      params: {
        origins: [{ lat: start[0], lng: start[1] }],
        destinations: [{ lat: end[0], lng: end[1] }],
        key: this.apiKey,
      },
    });

    return res.data.rows[0].elements[0];
  }

  // -------------------------
  // ETA (Delivery Time)
  // -------------------------
  async getEstimatedTime(start: number[], end: number[]) {
    const res = await this.client.distancematrix({
      params: {
        origins: [{ lat: start[0], lng: start[1] }],
        destinations: [{ lat: end[0], lng: end[1] }],
        departure_time: Math.floor(Date.now() / 1000),

        key: this.apiKey,
      },
    });

    const data = res.data.rows[0].elements[0];

    const distanceKm = data.distance.value / 1000;
    const travelTime = data.duration.value / 60;

    const travelTimeWithTraffic = data.duration_in_traffic
      ? data.duration_in_traffic.value / 60
      : travelTime;

    // Calculate ETA using utility
    const eta = calculateEta({
      travelTimeMinutes: travelTime,
      travelTimeWithTrafficMinutes: travelTimeWithTraffic,
    });

    return {
      distance_km: Number(distanceKm.toFixed(2)),
      travel_time_minutes: Number(travelTime.toFixed(2)),
      travel_time_with_traffic_minutes: Number(travelTimeWithTraffic.toFixed(2)),
      traffic_delay_minutes: eta.trafficDelayMinutes,
      preparation_time_minutes: eta.preparationTime,
      buffer_minutes: eta.bufferTime,
      estimated_delivery_time_minutes: eta.estimatedDeliveryTimeMinutes,
    };
  }

  // -------------------------
  // SPEED ANALYTICS
  // -------------------------
  getSpeedAnalytics(points: GpsPoint[]) {
    return calculateSpeedStats(points);
  }

  checkRadius(source: number[], target: number[], radiusKm: number) {
    const distance = calculateDistanceKm(source[0], source[1], target[0], target[1]);

    return {
      distance_km: Number(distance.toFixed(2)),
      withinRadius: isWithinRadius(source[0], source[1], target[0], target[1], radiusKm),
    };
  }
}
