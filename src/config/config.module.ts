import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { jwtConfig } from './jwt.config';
import { envValidationSchema, envValidationOptions } from './env.validation';

@Global() // 👈 makes AppConfigService globally available — no need to re-import everywhere
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
