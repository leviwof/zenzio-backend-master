import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyAlert } from './emergency-alert.entity';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyStatusDto } from './dto/update-emergency-status.dto';
import { EmergencyAlertStatus } from './emergency-alert-status.enum';

@Injectable()
export class EmergencyAlertService {
  constructor(
    @InjectRepository(EmergencyAlert)
    private readonly alertRepo: Repository<EmergencyAlert>,
  ) {}

  private generateUid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `EA-${code}`;
  }

  async createAlert(user_uid: string, dto: CreateEmergencyAlertDto) {
    const alert = this.alertRepo.create({
      alert_uid: this.generateUid(),
      user_uid,
      fleet_uid: dto.fleet_uid,
      lat: dto.lat,
      lng: dto.lng,
      location_address: dto.location_address,
      description: dto.description,
      meta: dto.meta ? { ...dto.meta } : null, // SAFE
      status: EmergencyAlertStatus.OPEN,
    });

    const saved = await this.alertRepo.save(alert);
    return saved;
  }

  async findAllOpen() {
    return this.alertRepo.find({
      where: { status: EmergencyAlertStatus.OPEN },
      order: { created_at: 'DESC' },
    });
  }

  async findOneByUid(alert_uid: string) {
    const alert = await this.alertRepo.findOne({ where: { alert_uid } });
    if (!alert) {
      throw new NotFoundException(`Alert with uid=${alert_uid} not found`);
    }
    return alert;
  }

  async updateStatus(alert_uid: string, dto: UpdateEmergencyStatusDto) {
    const alert = await this.findOneByUid(alert_uid);

    alert.status = dto.status;

    if (dto.status === EmergencyAlertStatus.RESOLVED) {
      alert.resolved_at = new Date();
      alert.resolved_by_uid = dto.resolved_by_uid || alert.resolved_by_uid;
      alert.meta = {
        ...(alert.meta || {}),
        resolution_note: dto.resolution_note,
      };
    }

    return this.alertRepo.save(alert);
  }
}
