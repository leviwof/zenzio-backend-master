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

// Only extend 'user', do NOT redeclare 'cookies'
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUserInt;
  }
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

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();

    // Assert cookies type locally
    const cookies = request.cookies as { [key: string]: string } | undefined;
    const token = cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    let user: JwtUserInt;

    try {
      user = this.jwtService.verifyAccessToken(token) as JwtUserInt;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = user;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }
}
