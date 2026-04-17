import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Roles } from '../constants/app.constants';
import { SuperAdminService } from '../super-admin/super-admin.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { FleetsService } from '../fleet-v2/fleets.service';

interface RequestWithUser extends Request {
  cookies: { [key: string]: string | undefined };
  me?: MeUser | null;
}

type MeUser =
  | Awaited<ReturnType<UsersService['findByUid']>>
  | Awaited<ReturnType<RestaurantsService['getMyProfile']>>
  | Awaited<ReturnType<SuperAdminService['findByUid']>>
  | Awaited<ReturnType<FleetsService['findByUid']>>;

@Injectable()
export class AuthMeMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly restaurantService: RestaurantsService,
    private readonly superAdminService: SuperAdminService,
    private readonly fleetsService: FleetsService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    let token = req.cookies.accessToken;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      req.me = null;
      return next();
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        uid: string;
        role: string;
      }>(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });

      let user: MeUser | null = null;
      const role = payload.role;

      if (role === Roles.USER_CUSTOMER) {
        user = await this.usersService.findByUid(payload.uid);
      } else if (role === Roles.USER_FLEET) {
        user = await this.fleetsService.findByUid(payload.uid);
      } else if (role === Roles.USER_RESTAURANT) {
        user = await this.restaurantService.getMyProfile(payload.uid);
      } else if (
        role === Roles.SUPER_ADMIN ||
        role === Roles.MASTER_ADMIN ||
        role === Roles.ADMIN
      ) {
        user = await this.superAdminService.findByUid(payload.uid);
      } else {
        // Fallback or other roles
        user = null;
      }

      if (!user) {
        throw new NotFoundException(`User with uid=${payload.uid} not found (role: ${role})`);
      }

      req.me = user;
      return next();
    } catch (err) {
      console.error('AuthMeMiddleware error:', err);
      // Don't throw 401 here if we want to allow optional auth,
      // but usually if token is present and invalid, we should throw.
      // However, if token is expired, we might want to let it pass as guest?
      // For now, consistent with previous behavior:
      throw new UnauthorizedException('Invalid token');
    }
  }
}
