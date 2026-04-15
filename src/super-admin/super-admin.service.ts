import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SuperAdmin } from './super-admin.entity';
import { Repository } from 'typeorm';
import { Argon2Service } from 'src/shared/argon2.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UtilService } from 'src/utils/util.service';
import { ErrorMessages } from 'src/constants/app.constants';

import { MailService } from 'src/mail/mail.service';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepo: Repository<SuperAdmin>,
    private readonly argon2Service: Argon2Service,
    private readonly utilService: UtilService,
    private readonly mailService: MailService,
  ) {}

  // ... existing methods ...

  async requestOtp(adminId: string): Promise<string> {
    const admin = await this.findOne(adminId);

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // Valid for 10 mins

    admin.otp_code = otp;
    admin.otp_expiry = expiry;
    await this.superAdminRepo.save(admin);

    // Send Email
    await this.mailService.sendMail(
      admin.email,
      'Password Change OTP - Zenzio Admin',
      `<p>Your OTP for password change is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`,
    );

    return 'OTP sent successfully';
  }

  async verifyOtp(adminId: string, otp: string): Promise<boolean> {
    const admin = await this.findOne(adminId);

    if (!admin.otp_code || !admin.otp_expiry) {
      throw new BadRequestException('No OTP requested');
    }

    if (new Date() > admin.otp_expiry) {
      throw new BadRequestException('OTP expired');
    }

    if (admin.otp_code !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return true;
  }

  async resetPasswordWithOtp(
    adminId: string,
    otp: string,
    newPassword: string,
  ): Promise<SuperAdmin> {
    await this.verifyOtp(adminId, otp);

    const admin = await this.findOne(adminId);
    const hashedPassword = await this.argon2Service.hashPassword(newPassword);

    admin.password = hashedPassword;
    admin.otp_code = null; // Clear OTP
    admin.otp_expiry = null;

    return this.superAdminRepo.save(admin);
  }

  async create(createUserDto: CreateAdminDto): Promise<SuperAdmin> {
    const { email, password } = createUserDto;
    const role = String(createUserDto.role);

    // Allow only one super admin (role 0)
    if (role === '0') {
      const existingRoleZero = await this.superAdminRepo.findOneBy({ role: '0' });
      if (existingRoleZero) {
        throw new BadRequestException(ErrorMessages.ADMIN_CREATE_INVALID_ROLE);
      }
    }

    // Email should be unique
    const existingEmailUser = await this.superAdminRepo.findOneBy({ email });
    if (existingEmailUser) {
      throw new BadRequestException(ErrorMessages.EMAIL_EXISTS);
    }

    const uid = await this.utilService.generateUniqueUid(async (generatedUid) => {
      const existingUid = await this.superAdminRepo.findOne({ where: { uid: generatedUid } });
      return !!existingUid;
    });

    const hashedPassword = await this.argon2Service.hashPassword(password);

    const user = this.superAdminRepo.create({
      ...createUserDto,
      uid,
      password: hashedPassword,
      providerType: 'password',
      role,
    });

    return await this.superAdminRepo.save(user);
  }

  async findByEmail(email: string): Promise<SuperAdmin | null> {
    if (!email) return null;
    return this.superAdminRepo.findOneBy({ email });
  }

  initSuperAdmin(): void {
    this.logger.log('Super admin auto-creation disabled. Skipping...');
    return;
  }

  async findByUid(uid: string): Promise<SuperAdmin> {
    const user = await this.superAdminRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException(`User with uid=${uid} not found`);
    return user;
  }

  async findAll(): Promise<SuperAdmin[]> {
    return this.superAdminRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<SuperAdmin> {
    const admin = await this.superAdminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`SuperAdmin with ID=${id} not found`);
    }
    return admin;
  }

  async findAllPaginated(page = 1, limit = 10): Promise<[SuperAdmin[], number]> {
    const [admins, total] = await this.superAdminRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return [admins, total];
  }

  async update(id: string, updateDto: Partial<CreateAdminDto>): Promise<SuperAdmin> {
    const admin = await this.findOne(id);
    Object.assign(admin, updateDto);
    return this.superAdminRepo.save(admin);
  }

  async remove(id: string): Promise<{ message: string }> {
    const admin = await this.findOne(id);
    await this.superAdminRepo.remove(admin);
    return { message: `SuperAdmin with ID=${id} deleted successfully` };
  }

  async activate(id: string): Promise<SuperAdmin> {
    const admin = await this.findOne(id);
    admin.isActive = true;
    return this.superAdminRepo.save(admin);
  }

  async deactivate(id: string): Promise<SuperAdmin> {
    const admin = await this.findOne(id);
    admin.isActive = false;
    return this.superAdminRepo.save(admin);
  }

  async changePassword(id: string, dto: any): Promise<SuperAdmin> {
    const { oldPassword, newPassword } = dto;
    const admin = await this.findOne(id);

    const isPasswordValid = await this.argon2Service.verifyPassword(admin.password, oldPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const hashedPassword = await this.argon2Service.hashPassword(newPassword);
    admin.password = hashedPassword;

    return this.superAdminRepo.save(admin);
  }
}
