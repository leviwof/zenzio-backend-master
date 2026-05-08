import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { jwtConfig } from './jwt.config';
import { envValidationSchema, envValidationOptions } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,

      envFilePath:
        process.env.NODE_ENV === 'staging'
          ? '.env.staging'
          : process.env.NODE_ENV === 'production'
          ? '.env'
          : '.env',

      // optional but useful for debugging
      ignoreEnvFile: false,

      load: [jwtConfig],

      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}