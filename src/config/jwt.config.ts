import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTokenExpire: string;
  refreshTokenExpire: string;
}

export const jwtConfig = registerAs('jwt', (): JwtConfig => {
  const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_TOKEN_EXPIRE,
    JWT_REFRESH_TOKEN_EXPIRE,
  } = process.env;

  if (
    !JWT_ACCESS_SECRET ||
    !JWT_REFRESH_SECRET ||
    !JWT_ACCESS_TOKEN_EXPIRE ||
    !JWT_REFRESH_TOKEN_EXPIRE
  ) {
    throw new Error('❌ Missing required environment variables for Jwt');
  }

  return {
    accessSecret: JWT_ACCESS_SECRET,
    refreshSecret: JWT_REFRESH_SECRET,
    accessTokenExpire: JWT_ACCESS_TOKEN_EXPIRE,
    refreshTokenExpire: JWT_REFRESH_TOKEN_EXPIRE,
  };
});
