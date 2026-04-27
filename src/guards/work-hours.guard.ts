import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class WorkHoursGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
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

    return true;
  }
}