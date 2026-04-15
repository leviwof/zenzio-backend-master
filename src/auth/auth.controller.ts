import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  // BadRequestException,
  Body,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtServiceShared, JwtPayload } from '../shared/jwt.service';
import { AuthService } from './auth.service';
import { AccessTokenAuthGuard } from 'src/guards';
import { RefreshTokenUtil } from 'src/utils/refresh-token.util';
import { LogoutUtil } from 'src/utils/logout.util';
import { AuthRequest } from 'src/types/auth-request';
import { FirebaseService } from 'src/firebase/firebase.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtServiceShared,
    private readonly authService: AuthService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined>;
    const refreshToken = cookies['refresh_token'];

    return await RefreshTokenUtil.refresh(refreshToken, res, this.jwtService);
  }

  @Post('refresh/header')
  async refreshFromHeader(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      // 1️⃣ Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException('Refresh token missing', HttpStatus.UNAUTHORIZED);
      }

      const refreshToken = authHeader.split(' ')[1];

      // 2️⃣ Use the same refresh logic utility
      return await RefreshTokenUtil.refresh(refreshToken, res, this.jwtService);
    } catch (error) {
      console.error('Header refresh error:', error);
      throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  @Patch('change-password')
  @UseGuards(AccessTokenAuthGuard)
  async changePassword(
    @Req() req: AuthRequest,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    if (!req.user?.uid) {
      throw new UnauthorizedException('Invalid user');
    }
    console.log({ fbu: req.user });

    // const firebaseUid = req.user.firebase_uid ?? req.user.uid;
    const firebaseUid: string = req.user.firebase_uid
      ? String(req.user.firebase_uid)
      : String(req.user.uid);

    await this.firebaseService.changeUserPassword(firebaseUid, dto.oldPassword, dto.newPassword);

    return {
      status: 'success',
      message: 'Password updated successfully, please login again.',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @UseGuards(AccessTokenAuthGuard)
  @Get('me')
  getUserProfile(@Req() req: { user: JwtPayload }): JwtPayload {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return LogoutUtil.performLogout(res);
  }
}
