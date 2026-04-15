import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { S3Module } from '../aws/s3.module';

@Module({
  imports: [S3Module],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
