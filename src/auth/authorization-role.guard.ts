// src/auth/authorization-role.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { ROLES_KEY } from 'src/auth/app.decorator';
import { JwtUserInt } from 'src/constants/app.interface';

// Extend Request.user (safe typing)
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUserInt;
  }
}

@Injectable()
export class AuthorizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtServiceShared,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route has no roles → allow
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();

    // 1️⃣ Try header token
    let token = this.extractTokenFromHeader(request);

    // 2️⃣ Fallback to cookie token
    if (!token) {
      const cookies = request.cookies as Record<string, string> | undefined;
      token = cookies?.access_token ?? null;
    }

    // 3️⃣ No token at all
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    // 4️⃣ Verify token & extract user
    let user: JwtUserInt;
    try {
      user = this.jwtService.verifyAccessToken(token) as JwtUserInt;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 5️⃣ Attach user for controller access
    request.user = user;

    // 6️⃣ Check if the user’s role matches
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const header = request.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      return header.split(' ')[1];
    }
    return null;
  }
}
