import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkType } from './work-type.entity';
import { WorkTypeService } from './work-type.service';
import { WorkTypeController } from './work-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkType])],
  controllers: [WorkTypeController],
  providers: [WorkTypeService],
})
export class WorkTypeModule {}
