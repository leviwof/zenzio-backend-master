import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryZoneService } from './delivery-zone.service';

describe('DeliveryZoneService', () => {
  let service: DeliveryZoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryZoneService],
    }).compile();

    service = module.get<DeliveryZoneService>(DeliveryZoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isDeliveryAllowed', () => {
    it('TEST 1 — Inside polygon (should return TRUE)', () => {
      const userLat = 11.9627188;
      const userLng = 79.8059994;
      const result = service.isDeliveryAllowed(userLat, userLng);
      expect(result).toBe(true);
    });

    it('TEST 2 — Outside polygon and outside radius (should return FALSE)', () => {
      const userLat = 12.9716;
      const userLng = 77.5946;
      const result = service.isDeliveryAllowed(userLat, userLng);
      expect(result).toBe(false);
    });

    it('TEST 3 — Edge case: on polygon boundary (should return TRUE)', () => {
      const userLat = 11.9793644;
      const userLng = 79.7904007;
      const result = service.isDeliveryAllowed(userLat, userLng);
      expect(result).toBe(true);
    });

    it('TEST 4 — Invalid coordinates (should return FALSE)', () => {
      const userLat = 999;
      const userLng = 999;
      const result = service.isDeliveryAllowed(userLat, userLng);
      expect(result).toBe(false);
    });

    it('TEST 5 — Near delivery point within 5km (should return TRUE)', () => {
      const userLat = 11.9600;
      const userLng = 79.7950;
      const result = service.isDeliveryAllowed(userLat, userLng);
      expect(result).toBe(true);
    });
  });
});
