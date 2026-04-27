import { GlobalSettingsService } from 'src/global-settings/global-settings.service';

let platformFeePercentCache: number | null = null;

export async function getPlatformFeePercent(settingsService: GlobalSettingsService): Promise<number> {
  if (platformFeePercentCache !== null) {
    return platformFeePercentCache;
  }

  const envPercent = process.env.PLATFORM_FEE_PERCENT;
  if (envPercent) {
    platformFeePercentCache = parseFloat(envPercent);
    return platformFeePercentCache;
  }

  try {
    const settings = await settingsService.getSettings();
    platformFeePercentCache = settings.platformFeePercent ?? 33;
    return platformFeePercentCache;
  } catch {
    platformFeePercentCache = 33;
    return platformFeePercentCache;
  }
}

export function calculateFinalPrice({
  price,
  discount = 0,
  platformFeePercent,
}: {
  price: number;
  discount?: number;
  platformFeePercent: number;
}): { basePrice: number; finalPrice: number } {
  const clampedDiscount = discount > price ? price : discount;
  const discountedPrice = price - clampedDiscount;
  const final = discountedPrice + discountedPrice * (platformFeePercent / 100);
  const finalPrice = Math.round(final * 100) / 100;

  return {
    basePrice: price,
    finalPrice: Number.isInteger(finalPrice) ? finalPrice : parseFloat(finalPrice.toFixed(2)),
  };
}

export function resetPlatformFeeCache(): void {
  platformFeePercentCache = null;
}