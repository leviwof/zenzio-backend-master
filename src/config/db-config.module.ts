// src/db-config/db-config.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import databaseConfig from './database.config';

const envFilePath =
  process.env.NODE_ENV === 'staging'
    ? '.env.staging'
    : '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '..', '..', envFilePath),
      load: [databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<{
          host: string;
          port: number;
          username: string;
          password: string;
          database: string;
        }>('database');

        if (!db) {
          throw new Error('Database config not defined!');
        }

        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,

          entities: [path.resolve(__dirname, '..', '**/*.entity{.ts,.js}')], // Fix: Look in src/

          synchronize: false,
          logging: false,
          autoLoadEntities: true,
          retryAttempts: 3,
          retryDelay: 3000,
          extra: {
            connectionTimeoutMillis: 10000,
          },

          // ✅ No SSL, no CA certificate, no encryption
          // ✅ Secure by default, but allow disabling for Internal Render updates
          ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        };
      },
    }),
  ],
})
export class DbConfigModule { }
