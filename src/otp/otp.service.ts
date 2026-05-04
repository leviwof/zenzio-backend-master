import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { OtpEntity } from './otp.entity';
import { SmsService } from './sms.service';
import { MailService } from 'src/mail/mail.service';

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
    // Use cryptographically secure random number generator
    return randomInt(100000, 1000000).toString();
  }

  async sendOtp(identifier: string): Promise<any> {
    const otp = this.generateOtp();

    // ⚠️ SECURITY: Only log OTP in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[OTP] Sending OTP to ${identifier}: ${otp}`);
    } else {
      this.logger.log(`[OTP] Sending OTP to ${identifier}`);
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP
    const otpRecord = this.otpRepository.create({
      phone: identifier, // 'phone' column stores identifier (email or phone)
      otp,
      expiresAt,
    });

    await this.otpRepository.save(otpRecord);

    let response;

    if (identifier.includes('@')) {
      // Send Email
      try {
        await this.mailService.sendMail(
          identifier,
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
      // Send SMS
      const smsResponse = await this.smsService.sendOtp(identifier, Number(otp));
      this.logger.log(`SMS Response for ${identifier}: ${JSON.stringify(smsResponse)}`);
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

    // ⚠️ SECURITY: Only return OTP in development mode
    const responseData: any = {
      identifier,
      message: 'OTP generated and sent successfully',
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp; // Only for dev/testing
    }

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
    this.logger.log(`[OTP] Verifying OTP for ${phone}: ${otp}`);

    const record = await this.otpRepository.findOne({
      where: { phone: phone.trim(), isVerified: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      this.logger.warn(`[OTP] No record found for ${phone}`);
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

    if (record.otp !== otp) {
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
