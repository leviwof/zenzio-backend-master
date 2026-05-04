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
    // 🔐 ALWAYS VERIFY CLIENT CREDENTIALS
    // ---------------------------------------------------
    if (!clientId) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing clientId header',
      });
    }

    if (!ENV_CLIENT_ID || !ENV_CLIENT_SECRET) {
      console.error('⚠️ APP_CLIENT_ID or APP_CLIENT_SECRET not configured');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server configuration error',
      });
    }

    if (clientId !== ENV_CLIENT_ID) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid Client ID',
        authenticated: false,
      });
    }

    if (environment === 'development') {
      console.log('✅ Client verified (development mode)');
    }

    next();
  }
}
