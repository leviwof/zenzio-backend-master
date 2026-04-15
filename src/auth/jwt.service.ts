// src/auth/jwt.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from 'src/config/config.service';

export interface JwtPayload {
  userId: number | string;
  uid: string;
  firebase_uid: string;
  email?: string;
  role: string;
}

@Injectable()
export class JwtService {
  private readonly accessTokenSecret: jwt.Secret;
  private readonly refreshTokenSecret: jwt.Secret;
  private readonly accessTokenExpiresIn: jwt.SignOptions['expiresIn'];
  private readonly refreshTokenExpiresIn: jwt.SignOptions['expiresIn'];

  constructor(private appConfigService: AppConfigService) {
    this.accessTokenSecret = this.appConfigService.getRequired('jwt.accessSecret');
    this.refreshTokenSecret = this.appConfigService.getRequired('jwt.refreshSecret');
    this.accessTokenExpiresIn = this.appConfigService.getRequired(
      'jwt.accessTokenExpire',
    ) as jwt.SignOptions['expiresIn'];
    this.refreshTokenExpiresIn = this.appConfigService.getRequired(
      'jwt.refreshTokenExpire',
    ) as jwt.SignOptions['expiresIn'];
  }

  // -----------------------------------------------------------------------------
  // ACCESS TOKEN
  // -----------------------------------------------------------------------------
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  // -----------------------------------------------------------------------------
  // REFRESH TOKEN
  // -----------------------------------------------------------------------------
  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  // -----------------------------------------------------------------------------
  // VERIFY ACCESS TOKEN
  // -----------------------------------------------------------------------------
  verifyAccessToken(token: string): JwtPayload {
    try {
      const raw = jwt.verify(token, this.accessTokenSecret);

      if (typeof raw !== 'object' || raw === null) {
        throw new UnauthorizedException('Invalid access token payload');
      }

      const payload = raw as Partial<JwtPayload>;

      if (!payload.userId || !payload.uid || !payload.firebase_uid || !payload.role) {
        throw new UnauthorizedException('Invalid access token payload');
      }

      return payload as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  // -----------------------------------------------------------------------------
  // VERIFY REFRESH TOKEN (ONLY VERIFY JWT, NO REDIS)
  // -----------------------------------------------------------------------------
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);

      // Strip JWT standard claims (exp, iat, nbf, aud, iss, sub) to avoid conflicts when generating new tokens
      if (typeof decoded === 'object' && decoded !== null) {
        const { exp, iat, nbf, aud, iss, sub, ...cleanPayload } = decoded as any;

        const payload = cleanPayload as Partial<JwtPayload>;

        if (!payload.userId || !payload.uid || !payload.firebase_uid || !payload.role) {
          throw new UnauthorizedException('Invalid refresh token payload');
        }

        return payload as JwtPayload;
      }

      throw new UnauthorizedException('Invalid refresh token payload');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // -----------------------------------------------------------------------------
  // REFRESH TOKENS (NO REDIS — JUST GENERATE NEW TOKENS)
  // -----------------------------------------------------------------------------
  refreshTokens(oldRefreshToken: string) {
    const payload = this.verifyRefreshToken(oldRefreshToken);

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.getExpireInSeconds(this.accessTokenExpiresIn),
      refreshTokenExpiresIn: this.getExpireInSeconds(this.refreshTokenExpiresIn),
    };
  }

  // -----------------------------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------------------------
  private convertExpireToSeconds(expire: jwt.SignOptions['expiresIn']): number {
    if (!expire) throw new Error('expiresIn missing');

    if (typeof expire === 'number') return expire;

    const match = expire.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Invalid expiresIn');

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 86400;
      case 'h':
        return value * 86400;
      case 'd':
        return value * 86400;
      default:
        throw new Error('Invalid time format');
    }
  }

  public getExpireInSeconds(expire: jwt.SignOptions['expiresIn']): number {
    return this.convertExpireToSeconds(expire);
  }
}
