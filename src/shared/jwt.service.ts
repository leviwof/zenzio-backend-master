// src/shared/jwt.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from 'src/config/config.service';

export interface JwtPayload {
  userId: number | string;
  uid: string;
  firebase_uid?: string;
  email?: string;
  role: string;
}

@Injectable()
export class JwtServiceShared {
  private readonly accessTokenSecret: jwt.Secret;
  private readonly refreshTokenSecret: jwt.Secret;
  private readonly accessTokenExpiresIn: jwt.SignOptions['expiresIn'];
  private readonly refreshTokenExpiresIn: jwt.SignOptions['expiresIn'];

  constructor(private readonly appConfigService: AppConfigService) {
    this.accessTokenSecret = this.appConfigService.getRequired('jwt.accessSecret');
    this.refreshTokenSecret = this.appConfigService.getRequired('jwt.refreshSecret');
    this.accessTokenExpiresIn = this.appConfigService.getRequired(
      'jwt.accessTokenExpire',
    ) as jwt.SignOptions['expiresIn'];
    this.refreshTokenExpiresIn = this.appConfigService.getRequired(
      'jwt.refreshTokenExpire',
    ) as jwt.SignOptions['expiresIn'];
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret);

      if (
        typeof payload === 'object' &&
        payload !== null &&
        'userId' in payload &&
        'uid' in payload &&
        'role' in payload
      ) {
        return payload as JwtPayload;
      }

      throw new UnauthorizedException('Invalid access token payload');
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);

      // Strip JWT standard claims (exp, iat, nbf, aud, iss, sub) to avoid conflicts
      if (typeof decoded === 'object' && decoded !== null) {
        const { exp, iat, nbf, aud, iss, sub, ...payload } = decoded as any;
        return payload as JwtPayload;
      }

      throw new UnauthorizedException('Invalid refresh token payload');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  invalidateRefreshToken(): void {
    // No Redis → cannot invalidate
    return;
  }

  private convertExpireToSeconds(expire: jwt.SignOptions['expiresIn']): number {
    if (typeof expire === 'number') return expire;

    const match = (expire as string).match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Invalid expiresIn format');

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        throw new Error('Invalid time unit in expiresIn value');
    }
  }

  public getExpireInSeconds(expire: jwt.SignOptions['expiresIn']): number {
    return this.convertExpireToSeconds(expire);
  }
}
