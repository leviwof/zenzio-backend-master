import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AccessTokenAuthGuard } from 'src/guards';
import { JwtServiceShared, JwtPayload } from 'src/shared/jwt.service';
import { RefreshTokenUtil } from 'src/utils/refresh-token.util';
// import { AccessTokenAuthGuard } from './app-auth.guard';
// AccessTokenAuthGuard
@Controller('auth-header')
export class AuthHeaderController {
  constructor(private readonly jwtService: JwtServiceShared) {}

  // 🔁 Refresh using Authorization header
  @Post('refresh')
  async refreshFromHeader(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpException('Refresh token missing', HttpStatus.UNAUTHORIZED);
    }

    const refreshToken = header.split(' ')[1];

    return RefreshTokenUtil.refresh(refreshToken, res, this.jwtService);
  }

  // 👤 Get user profile using header-based access token
  @UseGuards(AccessTokenAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: JwtPayload }) {
    return req.user;
  }
}
