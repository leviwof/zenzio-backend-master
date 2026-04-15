import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  async getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get()
  async getHealth(@Res({ passthrough: true }) response: Response) {
    const health = await this.healthService.getHealthStatus();

    response.status(health.status === 'unhealthy' ? 503 : 200);

    return health;
  }
}
