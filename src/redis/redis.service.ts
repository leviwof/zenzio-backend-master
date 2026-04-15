import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClient;

  constructor(private readonly appConfigService: AppConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.appConfigService.getOptional('redis.host', 'localhost');
    const port = parseInt(this.appConfigService.getOptional('redis.port', '6379'), 10);
    const password = this.appConfigService.getOptional('redis.password', '');
    // const storageSize = this.appConfigService.getOptional('redis.storageSize', '512mb');

    this.logger.log(`Connecting to Redis at ${host}:${port}`);

    // Final merged Redis client configuration with TLS and env overrides
    this.client = new Redis({
      host: process.env.REDIS_HOST || host,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : port,
      password: process.env.REDIS_PASSWORD || password,
      tls:
        process.env.REDIS_TLS === 'true' ||
        (process.env.REDIS_HOST || '').includes('upstash.io') ||
        (process.env.REDIS_HOST || '').includes('amazonaws.com') // Assume TLS for AWS/Upstash
          ? {}
          : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => {
      // Prevent crashing app on Redis connection error during dev if not critical
      this.logger.error('Redis error', err);
    });

    try {
      // Don't await ping in onModuleInit to avoid blocking boot if Redis is down
      this.client
        .ping()
        .then(() => this.logger.log('Redis ping successful'))
        .catch((e) => this.logger.warn('Redis initial ping failed'));
    } catch (err) {
      this.logger.error('Redis ping failed:', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): RedisClient {
    return this.client;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || this.client.status !== 'ready') return;
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, stringValue, 'EX', ttl);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || this.client.status !== 'ready') return null;
    const data = await this.client.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error('Redis JSON parse error for key', key, error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.client || this.client.status !== 'ready') return 0;
    return this.client.del(key);
  }
}
