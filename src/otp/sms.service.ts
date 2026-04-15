import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

interface SmsHubResponse {
  ErrorCode: string;
  ErrorMessage: string;
  JobId?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly apiUrl = process.env.SMS_API_URL || 'http://cloud.smsindiahub.in/api/mt/SendSMS';
  private readonly apiKey = process.env.SMS_API_KEY || '';
  private readonly senderId = process.env.SMS_SENDER_ID || 'SMSHUB';
  private readonly dltTemplateId = process.env.SMS_DLT_TEMPLATE_ID || '';
  private readonly peId = process.env.SMS_PEID || '';
  private readonly channel = 'TRANS';

  private readonly message =
    'Welcome to the Zenzio powered by SMSINDIAHUB. Your OTP for registration is';

  async sendOtp(
    mobile: string,
    otp: number,
  ): Promise<{ success: boolean; message: string; data?: SmsHubResponse; error?: string }> {
    try {
      const params = {
        senderid: this.senderId,
        channel: this.channel,
        DCS: 0,
        flashsms: 0,
        number: mobile,
        text: `${this.message} ${otp}`,
        DLTTemplateId: this.dltTemplateId,
        route: 0,
        PEId: this.peId,
        APIKey: this.apiKey,
      };

      const response: AxiosResponse<SmsHubResponse> = await axios.get(this.apiUrl, {
        params,
      });

      this.logger.log(`OTP sent to ${mobile}: ${otp}`);

      return {
        success: true,
        message: 'SMS sent successfully',
        data: response.data,
      };
    } catch (error) {
      this.logger.error('SMS sending failed', error);

      return {
        success: false,
        message: 'Failed to send SMS',
        error: (error as Error).message ?? 'Unknown error',
      };
    }
  }
}
