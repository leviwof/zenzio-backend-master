import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async getLiveness() {
    return {
      status: 'healthy',
      service: 'zenzio-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
    };
  }

  async getHealthStatus() {
    const startedAt = Date.now();
    const [databaseCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const overallStatus =
      databaseCheck.status === 'up'
        ? redisCheck.status === 'up'
          ? 'healthy'
          : 'degraded'
        : 'unhealthy';

    return {
      status: overallStatus,
      service: 'zenzio-backend',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: databaseCheck,
        redis: redisCheck,
      },
      system: {
        memory: process.memoryUsage(),
        pid: process.pid,
      },
    };
  }

  private async checkDatabase() {
    const startedAt = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'up',
        responseTimeMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - startedAt,
        message: this.getErrorMessage(error),
      };
    }
  }

  private async checkRedis() {
    const startedAt = Date.now();

    try {
      const client = this.redisService.getClient();

      if (!client) {
        return {
          status: 'down',
          responseTimeMs: Date.now() - startedAt,
          message: 'Redis client not initialized',
        };
      }

      const pingResponse = await client.ping();

      return {
        status: pingResponse === 'PONG' ? 'up' : 'down',
        responseTimeMs: Date.now() - startedAt,
        message: pingResponse === 'PONG' ? undefined : `Unexpected ping response: ${pingResponse}`,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - startedAt,
        message: this.getErrorMessage(error),
      };
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
