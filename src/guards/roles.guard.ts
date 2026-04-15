// src/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { JwtPayload } from 'src/shared/jwt.service'; // ✅ Correct location
import { JwtServiceShared } from 'src/shared/jwt.service';
import { ROLES_KEY } from 'src/auth/app.decorator';

// Extend Express Request to include cookies & user
interface RequestWithUser extends Request {
  cookies: Record<string, string | undefined>;
  user?: JwtPayload; // now includes firebase_uid
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtServiceShared,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow by default
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.getToken(request);

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    let user: JwtPayload;
    try {
      user = this.jwtService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach decoded user to request
    request.user = user;

    // Role validation
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }

  // Extract token safely from headers or cookies
  private getToken(request: RequestWithUser): string | null {
    // Header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Cookie
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}
