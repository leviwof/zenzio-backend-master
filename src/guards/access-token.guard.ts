// src/auth/app-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtServiceShared) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('No token provided 14');

    try {
      const decoded = this.jwtService.verifyAccessToken(token);

      // decoded contains firebase_uid now
      request['user'] = decoded;
      console.log('Decoded App JWT user:', decoded);

      return true;
    } catch (err) {
      console.error('Login Guard Error:', (err as any).message);
      // console.log('Token start:', (token || '').substring(0, 15));
      throw new UnauthorizedException('Invalid App JWT token: ' + (err as any).message);
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.substring(7);
    return null;
  }
}
