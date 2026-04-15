import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fleet } from './entity/fleet.entity';
import { FleetDocument } from './entity/fleet-document.entity';

import { CreateFleetDocumentDto } from './dto/createFleetDocument.dto';
import { UpdateFleetDocumentDto } from './dto/updateFleetDocument.dto';

@Injectable()
export class FleetDocumentService {
  constructor(
    @InjectRepository(FleetDocument)
    private readonly fleetDocumentRepository: Repository<FleetDocument>,

    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
  ) {}

  /**
   * ✅ Create new document record for a fleet
   */
  async create(createDto: CreateFleetDocumentDto): Promise<FleetDocument> {
    const fleet = await this.fleetRepository.findOne({
      where: { uid: createDto.fleetUid },
    });

    if (!fleet) {
      throw new NotFoundException(`Fleet with UID ${createDto.fleetUid} not found`);
    }

    // Ensure file fields convert to array format []
    const document = this.fleetDocumentRepository.create({
      ...createDto,
      file_insurance: createDto.file_insurance ?? [],
      file_aadhar: createDto.file_aadhar ?? [],
      file_pan: createDto.file_pan ?? [],
      file_rc: createDto.file_rc ?? [],
      file_other: createDto.file_other ?? [],
      fleet,
    });

    return await this.fleetDocumentRepository.save(document);
  }

  /**
   * ✅ Get ALL documents
   */
  async findAll(): Promise<FleetDocument[]> {
    return await this.fleetDocumentRepository.find({
      relations: ['fleet'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * ✅ Get all documents by fleet UID
   */
  async findByFleetUid(uid: string): Promise<FleetDocument[]> {
    const docs = await this.fleetDocumentRepository.find({
      where: { fleetUid: uid },
      relations: ['fleet'],
    });

    if (docs.length === 0) {
      throw new NotFoundException(`No documents found for fleet UID ${uid}`);
    }

    return docs;
  }

  /**
   * ✅ Get single document by ID
   */
  async findOne(id: number): Promise<FleetDocument> {
    const doc = await this.fleetDocumentRepository.findOne({
      where: { id },
      relations: ['fleet'],
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return doc;
  }

  /**
   * ✅ Update document by ID
   */
  async update(id: number, updateDto: UpdateFleetDocumentDto): Promise<FleetDocument> {
    const document = await this.findOne(id);

    Object.assign(document, {
      ...updateDto,
      file_insurance: updateDto.file_insurance ?? document.file_insurance,
      file_aadhar: updateDto.file_aadhar ?? document.file_aadhar,
      file_pan: updateDto.file_pan ?? document.file_pan,
      file_rc: updateDto.file_rc ?? document.file_rc,
      file_other: updateDto.file_other ?? document.file_other,
    });

    return await this.fleetDocumentRepository.save(document);
  }

  /**
   * ❌ Delete document
   */
  async remove(id: number): Promise<{ message: string }> {
    const doc = await this.findOne(id);
    await this.fleetDocumentRepository.remove(doc);
    return { message: 'Document deleted successfully' };
  }
}
