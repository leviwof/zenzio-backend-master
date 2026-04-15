// src/auth/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { JwtUserInt } from 'src/constants/app.interface';

// Extend Express Request to include 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUserInt;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtServiceShared) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Try to get token from cookies
    const cookies = request.cookies as { [key: string]: string } | undefined;
    let token = cookies?.access_token;

    // 2. If not in cookies, try Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    let payload: JwtUserInt;

    try {
      payload = this.jwtService.verifyAccessToken(token) as JwtUserInt;
      request.user = payload; // Attach payload to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
