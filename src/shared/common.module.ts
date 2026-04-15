import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UtilService } from 'src/utils/util.service';
import { AppConfigService } from 'src/config/config.service';
import { AppConfigModule } from 'src/config/config.module';
import { JwtServiceShared } from './jwt.service';

// ✅ Add StringValue type here
//    This matches jsonwebtoken's supported formats like "1d", "10h", "30m", "5s"
type StringValue = `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;

@Module({
  imports: [
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getRequired('jwt.accessSecret'),
        signOptions: {
          // ✅ Fully typed — NO ANY, NO ERROR
          expiresIn: appConfig.getRequired('jwt.accessTokenExpire') as StringValue,
        },
      }),
    }),
  ],
  providers: [UtilService, JwtServiceShared],
  exports: [UtilService, JwtModule, JwtServiceShared],
})
export class CommonModule {}
