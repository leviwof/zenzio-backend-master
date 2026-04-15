// src/aws/s3.module.ts
import { Module } from '@nestjs/common';
import { S3Util } from './s3.util';

@Module({
  providers: [S3Util],
  exports: [S3Util],
})
export class S3Module {}
