import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftChangeRequest, ShiftChangeRequestStatus } from './entity/shift-change-request.entity';
import { FleetProfile } from './entity/fleet_profile.entity';
import { WorkType } from '../work-type/work-type.entity';
import { CreateShiftChangeRequestDto } from './dto/create-shift-change-request.dto';
import { ApproveShiftChangeRequestDto } from './dto/approve-shift-change-request.dto';

@Injectable()
export class ShiftChangeRequestService {
  constructor(
    @InjectRepository(ShiftChangeRequest)
    private readonly shiftChangeRequestRepo: Repository<ShiftChangeRequest>,
    @InjectRepository(FleetProfile)
    private readonly fleetProfileRepo: Repository<FleetProfile>,
    @InjectRepository(WorkType)
    private readonly workTypeRepo: Repository<WorkType>,
  ) {}

  // Create shift change request by delivery partner
  async createRequest(fleetUid: string, dto: CreateShiftChangeRequestDto) {
    // Get fleet profile
    const fleet = await this.fleetProfileRepo.findOne({
      where: { fleetUid: fleetUid },
      relations: ['work_type'],
    });

    if (!fleet) {
      throw new NotFoundException('Fleet profile not found');
    }

    if (!fleet.work_type_uid) {
      throw new BadRequestException('Current work type not set');
    }

    // Validate requested work type exists
    const requestedWorkType = await this.workTypeRepo.findOne({
      where: { work_type_uid: dto.requested_work_type_uid },
    });

    if (!requestedWorkType) {
      throw new NotFoundException('Requested work type not found');
    }

    // Check if same as current
    if (fleet.work_type_uid === dto.requested_work_type_uid) {
      throw new BadRequestException('Requested work type is same as current');
    }

    // Check if there's already a pending request
    const existingPending = await this.shiftChangeRequestRepo.findOne({
      where: {
        fleet_uid: fleetUid,
        status: ShiftChangeRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending shift change request');
    }

    // Create request
    const request = this.shiftChangeRequestRepo.create({
      fleet_uid: fleetUid,
      current_work_type_uid: fleet.work_type_uid,
      requested_work_type_uid: dto.requested_work_type_uid,
      reason: dto.reason,
      status: ShiftChangeRequestStatus.PENDING,
    });

    return await this.shiftChangeRequestRepo.save(request);
  }

  // Get all shift change requests (for admin)
  async getAllRequests(status?: ShiftChangeRequestStatus) {
    const query = this.shiftChangeRequestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.fleet', 'fleet')
      .leftJoinAndSelect('fleet.profile', 'profile')
      .leftJoinAndSelect('request.currentWorkType', 'currentWorkType')
      .leftJoinAndSelect('request.requestedWorkType', 'requestedWorkType')
      .orderBy('request.created_at', 'DESC');

    if (status) {
      query.where('request.status = :status', { status });
    }

    return await query.getMany();
  }

  // Get shift change requests for a specific fleet
  async getRequestsByFleet(fleetUid: string) {
    return await this.shiftChangeRequestRepo.find({
      where: { fleet_uid: fleetUid },
      relations: ['currentWorkType', 'requestedWorkType'],
      order: { created_at: 'DESC' },
    });
  }

  // Approve or reject request (admin only)
  async processRequest(requestId: number, dto: ApproveShiftChangeRequestDto, adminUid: string) {
    const request = await this.shiftChangeRequestRepo.findOne({
      where: { id: requestId },
      relations: ['fleet'],
    });

    if (!request) {
      throw new NotFoundException('Shift change request not found');
    }

    if (request.status !== ShiftChangeRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // Update request status
    request.status = dto.status;
    if (dto.admin_notes) {
      request.admin_notes = dto.admin_notes;
    }
    request.approved_by = adminUid;
    request.approved_at = new Date();

    await this.shiftChangeRequestRepo.save(request);

    // If approved, update fleet profile work type
    if (dto.status === ShiftChangeRequestStatus.APPROVED) {
      await this.fleetProfileRepo.update(
        { fleetUid: request.fleet_uid },
        { work_type_uid: request.requested_work_type_uid },
      );
    }

    return request;
  }

  // Get request by ID
  async getRequestById(requestId: number) {
    const request = await this.shiftChangeRequestRepo.findOne({
      where: { id: requestId },
      relations: ['fleet', 'fleet.profile', 'currentWorkType', 'requestedWorkType'],
    });

    if (!request) {
      throw new NotFoundException('Shift change request not found');
    }

    return request;
  }
}
