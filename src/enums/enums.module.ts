import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnumOption } from './enum-option.entity';
import { EnumController } from './enums.controller';
import { EnumService } from './enums.service';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnumOption])],
  providers: [EnumService, JwtServiceShared],
  controllers: [EnumController],
  exports: [EnumService],
})
export class EnumsModule {}
