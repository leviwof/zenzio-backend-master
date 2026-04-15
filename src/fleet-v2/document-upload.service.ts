import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Util } from 'src/aws/s3.util';
import { MulterFile } from 'src/types/multer-file.type';
import { DocUtilsRes } from './utils/res-doc-utils';
// import { FleetDocument } from '../entity/restaurant_document.entity';
import { DocumentUtils } from './utils/document-utils';
// import { DocumentUploadResponse } from './interfaces/document-upload-response.type';
// import { FleetDocument } from './entity/restaurant_document.entity';

import { DocumentUploadResponse } from './interface/document-upload-response.type';
import { FleetDocument } from './entity/fleet-document.entity';
// FleetDocument
// DocumentUploadRespons
@Injectable()
export class DocumentUploadService {
  constructor(
    private readonly s3Util: S3Util,
    @InjectRepository(FleetDocument)
    private readonly docRepo: Repository<FleetDocument>,
  ) {}

  async uploadMultipleDocuments(
    files: MulterFile[],
    fleetUid: string,
    docType: 'rc' | 'pan' | 'aadhar' | 'other',
  ): Promise<DocumentUploadResponse[]> {
    // 1. Check for empty files
    if (!files || files.length === 0) {
      throw new BadRequestException('No documents uploaded');
    }

    // 2. Validate each file
    files.forEach((file) => DocUtilsRes.validateDocument(file, 2));

    // 3. Fetch or create document record
    let document = await this.docRepo.findOne({ where: { fleetUid } });

    if (!document) {
      document = this.docRepo.create({ fleetUid });
      await this.docRepo.save(document);
    }

    // 4. Load existing docs for this docType
    let existingDocs: string[] = [];

    switch (docType) {
      case 'rc':
        existingDocs = [...(document.file_rc ?? [])];
        break;
      case 'pan':
        existingDocs = [...(document.file_pan ?? [])];
        break;
      case 'aadhar':
        existingDocs = [...(document.file_aadhar ?? [])];
        break;
      case 'other':
        existingDocs = [...(document.file_other ?? [])];
        break;
    }

    const bucket = process.env.AWS_BUCKET_NAME!;
    const results: DocumentUploadResponse[] = [];

    // 5. Upload each file
    for (const file of files) {
      const suffix = DocumentUtils.getNextDocSuffix(existingDocs);
      const ext = file.originalname.split('.').pop()?.toLowerCase();

      const fileName = `${fleetUid}-${docType}-${suffix}.${ext}`;
      const key = `documents/fleet/${fileName}`; // <-- FIXED

      const url = await this.s3Util.uploadFile(bucket, key, file);

      existingDocs.push(fileName);

      results.push({
        status: 'success',
        message: `${docType} document uploaded`,
        key: fileName,
        url,
      });
    }

    // 6. Save back based on docType
    switch (docType) {
      case 'rc':
        document.file_rc = existingDocs;
        break;
      case 'pan':
        document.file_pan = existingDocs;
        break;
      case 'aadhar':
        document.file_aadhar = existingDocs;
        break;
      case 'other':
        document.file_other = existingDocs;
        break;
    }

    // 7. Persist updated record
    await this.docRepo.save(document);

    return results;
  }
}
