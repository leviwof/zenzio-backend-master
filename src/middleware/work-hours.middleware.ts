import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WorkHoursMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60 * 1000);
    const hour = istNow.getUTCHours();
    const minute = istNow.getUTCMinutes();
    const currentTime = hour * 60 + minute;
    const startBlock = 23 * 60;
    const endBlock = 7 * 60;

    if (currentTime >= startBlock || currentTime < endBlock) {
      throw new BadRequestException(
        'Login/work not allowed between 11PM and 7AM',
      );
    }

    next();
  }
}