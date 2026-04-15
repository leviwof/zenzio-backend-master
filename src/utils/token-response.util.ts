import { Response } from 'express';
import { JwtServiceShared, JwtPayload } from '../shared/jwt.service';

export interface TokenResponseMeta {
  timestamp: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface TokenResponseData {
  message: string;
}

export class TokenResponseUtil {
  static async sendTokens(
    res: Response,
    jwtService: JwtServiceShared,
    payload: JwtPayload,
    message = 'Token refreshed successfully',
  ) {
    // Generate tokens
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = await jwtService.generateRefreshToken(payload);

    // Calculate expiry
    const accessTokenExpiry = jwtService.getExpireInSeconds(jwtService['accessTokenExpiresIn']);
    const refreshTokenExpiry = jwtService.getExpireInSeconds(jwtService['refreshTokenExpiresIn']);

    // Set cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiry * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiry * 1000,
    });

    // Return structured response
    const data: TokenResponseData = { message };

    const meta: TokenResponseMeta = {
      timestamp: new Date().toISOString(),
      accessTokenExpiresIn: accessTokenExpiry,
      refreshTokenExpiresIn: refreshTokenExpiry,
    };

    return { status: 'success', code: 200, data, meta };
  }
}
