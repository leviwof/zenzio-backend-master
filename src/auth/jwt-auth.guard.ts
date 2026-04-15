import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtServiceShared, JwtPayload } from 'src/shared/jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtServiceShared) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    let token: string | undefined;

    // 1️⃣ Authorization header
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2️⃣ Fallback: cookies
    if (!token && request.cookies?.['access_token']) {
      token = request.cookies['access_token'] as string;
    }

    if (!token) {
      throw new UnauthorizedException('');
    }

    try {
      const payload: JwtPayload = this.jwtService.verifyAccessToken(token);
      request.user = payload; // request.user is now typed JwtPayload
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
