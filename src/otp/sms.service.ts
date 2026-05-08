import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

interface Fast2SmsResponse {
  return: boolean;
  request_id: string;
  message: string[] | string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.SMS_API_KEY || '';

  async sendOtp(
    mobile: string,
    otp: number,
  ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {

    // Test mode
    const testMode = process.env.SMS_TEST_MODE === 'true';
    if (testMode) {
      this.logger.warn(`🧪 TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)}`);
      return {
        success: true,
        message: 'SMS sent successfully (TEST MODE)',
        data: { return: true, request_id: 'test-' + Date.now(), message: ['Test mode'] }
      };
    }

    try {
      const response: AxiosResponse<Fast2SmsResponse> = await axios.get(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          params: {
            authorization: this.apiKey,
            sender_id: process.env.SMS_SENDER_ID || 'SMSHUB',
            message: `Welcome to the Zenzio powered by SMSINDIAHUB. Your OTP for registration is ${otp}`,
            language: 'english',
            route: 'dlt',                          // ✅ DLT route
            numbers: this.sanitizeMobile(mobile),
            dlt_template_id: process.env.SMS_DLT_TEMPLATE_ID || '1007801291964877107',
          },
          timeout: 10_000,
        },
      );

      if (response.data?.return === true) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.log(`OTP sent to ${this.maskMobile(mobile)}: ${otp}`);
        } else {
          this.logger.log(`OTP sent successfully to ${this.maskMobile(mobile)}`);
        }
        return { success: true, message: 'SMS sent successfully', data: response.data };
      }

      const messageData = response.data?.message;
      const errMsg = Array.isArray(messageData)
        ? messageData.join(', ')
        : (typeof messageData === 'string' ? messageData : 'Unknown Fast2SMS error');
      this.logger.error(`Fast2SMS rejected: ${errMsg}`);
      return { success: false, message: 'Failed to send SMS', error: errMsg };

    } catch (error) {
      this.logger.error('SMS sending failed', error);
      return { success: false, message: 'Failed to send SMS', error: (error as Error).message ?? 'Unknown error' };
    }
  }

  private sanitizeMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  }

  private maskMobile(mobile: string): string {
    const d = this.sanitizeMobile(mobile);
    return d.slice(0, 5) + 'XXXXX';
  }
}