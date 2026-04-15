import { Response } from 'express';
import { JwtServiceShared, JwtPayload } from '../shared/jwt.service';
import { UnauthorizedException } from '@nestjs/common';

export interface TokenResponseMeta {
  timestamp: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface TokenResponseData {
  message: string;
}

/**
 * Handles verifying refresh token, setting new cookies, and returning structured response
 */
export class RefreshTokenUtil {
  static async refresh(
    refreshToken: string | undefined,
    res: Response,
    jwtService: JwtServiceShared,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      // Verify refresh token and get payload
      const payload: JwtPayload = await jwtService.verifyRefreshToken(refreshToken);

      // Generate new access & refresh tokens
      const accessToken = jwtService.generateAccessToken(payload);
      const newRefreshToken = await jwtService.generateRefreshToken(payload);

      // Expiration seconds
      const accessExpiry = jwtService.getExpireInSeconds(jwtService['accessTokenExpiresIn']);
      const refreshExpiry = jwtService.getExpireInSeconds(jwtService['refreshTokenExpiresIn']);

      // ---------------------------------------------------------
      // SET COOKIES ONLY IF USER IS USING COOKIE-BASED AUTH
      // ---------------------------------------------------------
      if (res) {
        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: accessExpiry * 1000,
        });

        res.cookie('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: refreshExpiry * 1000,
        });
      }

      // ---------------------------------------------------------
      // RETURN TOKENS ALSO IN RESPONSE BODY (IMPORTANT)
      // ---------------------------------------------------------
      const data = {
        message: 'Token refreshed successfully',
        accessToken: accessToken,
        refreshToken: newRefreshToken,
      };

      const meta = {
        timestamp: new Date().toISOString(),
        accessTokenExpiresIn: accessExpiry,
        refreshTokenExpiresIn: refreshExpiry,
      };

      return { status: 'success', code: 200, data, meta };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
