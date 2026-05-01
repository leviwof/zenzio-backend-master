import { Injectable, Logger } from '@nestjs/common';
import * as turf from '@turf/turf';
import { DELIVERY_POLYGON, DELIVERY_POINTS } from './constants/delivery-zone.constants';

@Injectable()
export class DeliveryZoneService {
  private readonly logger = new Logger('DeliveryZone');

  private validateCoordinates(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || isNaN(lat)) {
      this.logger.warn(`Invalid lat (not a number): ${lat}`);
      return false;
    }
    if (typeof lng !== 'number' || isNaN(lng)) {
      this.logger.warn(`Invalid lng (not a number): ${lng}`);
      return false;
    }
    if (lat < -90 || lat > 90) {
      this.logger.warn(`Invalid lat (out of range): ${lat}`);
      return false;
    }
    if (lng < -180 || lng > 180) {
      this.logger.warn(`Invalid lng (out of range): ${lng}`);
      return false;
    }
    return true;
  }

  isInsidePolygon(userLat: number, userLng: number): boolean {
    if (!this.validateCoordinates(userLat, userLng)) {
      return false;
    }

    const point = turf.point([userLng, userLat]);
    const polygon = turf.polygon([DELIVERY_POLYGON]);
    const result = turf.booleanPointInPolygon(point, polygon);

    this.logger.log(`[DeliveryZone] Polygon check for [${userLat}, ${userLng}]: ${result}`);
    return result;
  }

  isWithinRadius(userLat: number, userLng: number, radiusKm: number = 5): boolean {
    if (!this.validateCoordinates(userLat, userLng)) {
      return false;
    }

    const userPoint = turf.point([userLng, userLat]);

    for (const deliveryPoint of DELIVERY_POINTS) {
      const deliveryTurfPoint = turf.point([deliveryPoint.lng, deliveryPoint.lat]);
      const distance = turf.distance(userPoint, deliveryTurfPoint, { units: 'kilometers' });

      if (distance <= radiusKm) {
        this.logger.log(
          `[DeliveryZone] Radius match: ${deliveryPoint.name} is ${distance.toFixed(2)}km away (within ${radiusKm}km)`,
        );
        return true;
      }
    }

    this.logger.log(`[DeliveryZone] Radius check for [${userLat}, ${userLng}]: false`);
    return false;
  }

  isDeliveryAllowed(userLat: number, userLng: number): boolean {
    if (!this.validateCoordinates(userLat, userLng)) {
      this.logger.warn(`[DeliveryZone] Invalid coordinates: lat=${userLat}, lng=${userLng}`);
      return false;
    }

    this.logger.log(`[DeliveryZone] Checking: lat=${userLat}, lng=${userLng}`);

    const polygonResult = this.isInsidePolygon(userLat, userLng);
    this.logger.log(`[DeliveryZone] Polygon result: ${polygonResult}`);

    if (polygonResult) {
      this.logger.log(`[DeliveryZone] Final decision: ALLOWED (inside polygon)`);
      return true;
    }

    const radiusResult = this.isWithinRadius(userLat, userLng);
    this.logger.log(`[DeliveryZone] Radius result: ${radiusResult}`);

    const allowed = polygonResult || radiusResult;
    this.logger.log(`[DeliveryZone] Final decision: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);

    return allowed;
  }
}
