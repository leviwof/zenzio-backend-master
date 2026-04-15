import { BadRequestException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VerificationClientMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const environment = this.configService.get<string>('NODE_ENV') || 'development';
    const clientId = Array.isArray(req.headers['clientid'])
      ? req.headers['clientid'][0]
      : req.headers['clientid'];

    const ENV_CLIENT_ID = this.configService.get<string>('APP_CLIENT_ID');
    const ENV_CLIENT_SECRET = this.configService.get<string>('APP_CLIENT_SECRET');

    // ---------------------------------------------------
    // 🚀 SKIP CHECK IN DEVELOPMENT
    // ---------------------------------------------------
    if (environment === 'development') {
      console.log('⚠️ Skipping client verification (development mode)');
      return next();
    }

    // ---------------------------------------------------
    // 🔐 STRICT CHECK IN PRODUCTION
    // ---------------------------------------------------
    if (!clientId) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing clientId header',
      });
    }

    if (clientId !== ENV_CLIENT_ID) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid Client ID',
        authenticated: false,
      });
    }

    if (!ENV_CLIENT_SECRET) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server configuration error',
      });
    }

    console.log('✅ Client verified successfully!');
    next();
  }
}
