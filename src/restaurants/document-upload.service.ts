import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Util } from 'src/aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { DocUtilsRes } from './utils/res-doc-utils';

import { DocumentUtils } from './utils/document-utils';

import { RestaurantDocument } from './entity/restaurant_document.entity';
import { DocumentUploadResponse } from './interface/document-upload-response.type';


@Injectable()
export class DocumentUploadService {
  constructor(
    private readonly s3Util: S3Util,
    @InjectRepository(RestaurantDocument)
    private readonly docRepo: Repository<RestaurantDocument>,
  ) { }

  async uploadMultipleDocuments(
    files: MulterFile[],
    restaurantUid: string,
    docType: 'fssai' | 'gst' | 'trade' | 'other',
  ): Promise<DocumentUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No documents uploaded');
    }

    files.forEach((file) => DocUtilsRes.validateDocument(file, 2));

    let document = await this.docRepo.findOne({ where: { restaurantUid } });

    if (!document) {
      document = this.docRepo.create({ restaurantUid });
      await this.docRepo.save(document);
    }

    let existingDocs: string[] = [];

    switch (docType) {
      case 'fssai':
        existingDocs = [...(document.file_fssai ?? [])];
        break;
      case 'gst':
        existingDocs = [...(document.file_gst ?? [])];
        break;
      case 'trade':
        existingDocs = [...(document.file_trade_license ?? [])];
        break;
      case 'other':
        existingDocs = [...(document.file_other_doc ?? [])];
        break;
    }

    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: DocumentUploadResponse[] = [];

    for (const file of files) {
      const suffix = DocumentUtils.getNextDocSuffix(existingDocs);
      const ext = file.originalname.split('.').pop();
      const fileName = `${restaurantUid}-${docType}-${suffix}.${ext}`;
      const key = `documents/restaurant/${fileName}`;

      const url = await this.s3Util.uploadFile(bucket, key, file);

      existingDocs.push(fileName);

      results.push({
        status: 'success',
        message: `${docType} document uploaded`,
        key: fileName,
        url,
      });
    }

    switch (docType) {
      case 'fssai':
        document.file_fssai = existingDocs;
        break;
      case 'gst':
        document.file_gst = existingDocs;
        break;
      case 'trade':
        document.file_trade_license = existingDocs;
        break;
      case 'other':
        document.file_other_doc = existingDocs;
        break;
    }

    await this.docRepo.save(document);

    return results;
  }
}
