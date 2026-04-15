// src/utils/eta.util.ts

export interface EtaInput {
  travelTimeMinutes: number;
  travelTimeWithTrafficMinutes: number;
  preparationTime?: number;
  bufferTime?: number;
}

export interface EtaOutput {
  trafficDelayMinutes: number;
  preparationTime: number;
  bufferTime: number;
  estimatedDeliveryTimeMinutes: number;
}

export function calculateEta(input: EtaInput): EtaOutput {
  const {
    travelTimeMinutes,
    travelTimeWithTrafficMinutes,
    preparationTime = 10, // default: 10 min for food prep
    bufferTime = 5, // default: 5 min buffer
  } = input;

  const trafficDelay = travelTimeWithTrafficMinutes - travelTimeMinutes;

  const finalEta = preparationTime + travelTimeWithTrafficMinutes + bufferTime;

  return {
    trafficDelayMinutes: Number(trafficDelay.toFixed(2)),
    preparationTime,
    bufferTime,
    estimatedDeliveryTimeMinutes: Number(finalEta.toFixed(2)),
  };
}
