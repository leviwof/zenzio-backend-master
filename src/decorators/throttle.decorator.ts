import { SetMetadata } from '@nestjs/common';

export const THROTTLE_SKIP_KEY = 'throttle_skip';
export const SkipThrottle = () => SetMetadata(THROTTLE_SKIP_KEY, true);

// Stricter rate limiting for sensitive endpoints (auth, OTP, etc.)
export const THROTTLE_STRICT_KEY = 'throttle_strict';
export const StrictThrottle = (options: { limit: number; ttl: number }) =>
  SetMetadata(THROTTLE_STRICT_KEY, options);
