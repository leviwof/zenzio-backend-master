import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { OtpEntity } from './otp.entity';
import { SmsService } from './sms.service';
import { MailService } from 'src/mail/mail.service';

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30_000;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
  ) {}

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private normalizeIdentifier(identifier: string): string {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) return trimmed.toLowerCase();

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  }

  async sendOtp(identifier: string): Promise<any> {
    const normalizedIdentifier = this.normalizeIdentifier(identifier);

    const lastOtp = await this.otpRepository.findOne({
      where: { phone: normalizedIdentifier },
      order: { createdAt: 'DESC' },
    });

    if (lastOtp) {
      const elapsed = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        return {
          status: 'error',
          code: 429,
          data: {
            message: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting a new OTP`,
          },
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    const otp = this.generateOtp();

    this.logger.log(`[OTP] Sending OTP to ${normalizedIdentifier}: ${otp}`);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otpRecord = this.otpRepository.create({
      phone: normalizedIdentifier,
      otp,
      expiresAt,
    });

    await this.otpRepository.save(otpRecord);

    let response;

    if (normalizedIdentifier.includes('@')) {
      try {
        await this.mailService.sendMail(
          normalizedIdentifier,
          'Your Verification Code',
          `<p>Your OTP code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
        );
        response = { success: true };
      } catch (error) {
        response = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      const smsResponse = await this.smsService.sendOtp(normalizedIdentifier, Number(otp));
      this.logger.log(`SMS Response for ${normalizedIdentifier}: ${JSON.stringify(smsResponse)}`);
      response = { success: smsResponse.success, error: smsResponse.error, data: smsResponse.data };
    }

    if (!response.success) {
      return {
        status: 'error',
        code: 500,
        data: {
          message: 'Failed to send OTP',
          error: response.error,
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const responseData: any = {
      identifier: normalizedIdentifier,
      message: 'OTP generated and sent successfully',
    };

    responseData.otp = otp;

    return {
      status: 'success',
      code: 200,
      data: { otpDetails: responseData },
      meta: {
        timestamp: new Date().toISOString(),
        otpExpiresIn: 300,
      },
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<any> {
    const timestamp = new Date().toISOString();
    const normalizedPhone = this.normalizeIdentifier(phone);
    this.logger.log(`[OTP] Verifying OTP for ${normalizedPhone}: ${otp}`);

    const record = await this.otpRepository.findOne({
      where: { phone: normalizedPhone, isVerified: false, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      this.logger.warn(`[OTP] No record found for ${normalizedPhone}`);
      return {
        status: 'error',
        code: 404,
        data: { message: 'No OTP found for this phone number' },
        meta: { timestamp },
      };
    }

    if (new Date() > record.expiresAt) {
      return {
        status: 'error',
        code: 410,
        data: { message: 'OTP expired' },
        meta: { timestamp },
      };
    }

    if (record.attemptCount >= MAX_ATTEMPTS) {
      return {
        status: 'error',
        code: 429,
        data: { message: 'Maximum OTP attempts exceeded. Please request a new OTP.' },
        meta: { timestamp },
      };
    }

    if (record.otp !== otp) {
      record.attemptCount += 1;
      await this.otpRepository.save(record);
      return {
        status: 'error',
        code: 400,
        data: { message: 'Invalid OTP' },
        meta: { timestamp },
      };
    }

    record.isVerified = true;
    await this.otpRepository.save(record);

    return {
      status: 'success',
      code: 200,
      data: {
        user: { phone },
        message: 'OTP verified successfully',
      },
      meta: { timestamp },
    };
  }

  async markOtpAsUsed(phone: string): Promise<void> {
    const normalizedPhone = this.normalizeIdentifier(phone);
    const record = await this.otpRepository.findOne({
      where: { phone: normalizedPhone, isVerified: true, used: false },
      order: { createdAt: 'DESC' },
    });
    if (record) {
      record.used = true;
      await this.otpRepository.save(record);
    }
  }

  async getAllOtps(): Promise<any> {
    const otps = await this.otpRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      status: 'success',
      code: 200,
      data: {
        total: otps.length,
        otps,
      },
      meta: {
        timestamp: new Date().toISOString(),
        note: 'Only last 20 OTP records returned',
      },
    };
  }
}
