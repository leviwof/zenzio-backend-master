import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface Fast2SmsResponse {
  return: boolean;
  request_id: string;
  message: string[] | string;
}

type Fast2SmsRoute = 'q' | 'dlt' | 'dlt_manual' | 'otp';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly fast2SmsUrl = 'https://www.fast2sms.com/dev/bulkV2';

  async sendOtp(
    mobile: string,
    otp: number,
  ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
    const testMode = process.env.SMS_TEST_MODE === 'true';

    if (testMode) {
      this.logger.log(`TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)}`);
      return {
        success: true,
        message: 'SMS sent successfully (TEST MODE)',
        data: {
          return: true,
          request_id: 'test-' + Date.now(),
          message: ['Test mode - no actual SMS sent'],
        },
      };
    }

    const num = this.sanitizeMobile(mobile);
    if (!this.isValidIndianMobile(num)) {
      return {
        success: false,
        message: 'Invalid mobile number',
        error: 'Enter a valid 10-digit Indian mobile number',
      };
    }

    const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: 'SMS API key not configured',
        error: 'Set FAST2SMS_API_KEY in the active environment',
      };
    }

    this.logger.log(`Sending OTP SMS to ${this.maskMobile(num)}`);
    return this.sendFast2SmsOtp(apiKey, num, otp);
  }

  private async sendFast2SmsOtp(
    apiKey: string,
    mobile: string,
    otp: number,
  ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
    try {
      const payload = this.buildFast2SmsPayload(mobile, otp);

      const response: AxiosResponse<Fast2SmsResponse> = await axios.post(
        this.fast2SmsUrl,
        payload,
        {
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
          },
          timeout: 10_000,
        },
      );

      this.logger.log(`Fast2SMS OTP response: ${JSON.stringify(response.data)}`);

      if (response.data?.return === true) {
        this.logger.log(`OTP sent via Fast2SMS to ${this.maskMobile(mobile)}`);
        return { success: true, message: 'SMS sent successfully', data: response.data };
      }

      const errMsg = Array.isArray(response.data?.message)
        ? response.data.message.join(', ')
        : typeof response.data?.message === 'string'
          ? response.data.message
          : JSON.stringify(response.data);
      this.logger.error(`Fast2SMS OTP failed: ${errMsg}`);
      return { success: false, message: 'Failed to send SMS', error: errMsg };
    } catch (error) {
      const err = error as AxiosError<Fast2SmsResponse>;
      const providerMessage = this.formatProviderMessage(err.response?.data);
      const errorMessage = providerMessage || err.message;

      this.logger.error(`Fast2SMS OTP exception for ${this.maskMobile(mobile)}: ${errorMessage}`);

      return { success: false, message: 'Failed to send SMS', error: errorMessage };
    }
  }

  private buildFast2SmsPayload(mobile: string, otp: number): URLSearchParams {
    const route = this.getFast2SmsRoute();
    const payload = new URLSearchParams({
      route,
      numbers: mobile,
    });

    if (route === 'otp') {
      payload.set('variables_values', otp.toString());
      return payload;
    }

    if (route === 'dlt') {
      const senderId = process.env.SMS_SENDER_ID;
      const messageId = process.env.SMS_DLT_MESSAGE_ID;

      if (!senderId || !messageId) {
        throw new Error('Set SMS_SENDER_ID and SMS_DLT_MESSAGE_ID before using SMS_ROUTE=dlt');
      }

      payload.set('sender_id', senderId);
      payload.set('message', messageId);
      payload.set('variables_values', otp.toString());
      return payload;
    }

    if (route === 'dlt_manual') {
      const senderId = process.env.SMS_SENDER_ID;
      const templateId = process.env.SMS_DLT_TEMPLATE_ID;
      const entityId = process.env.SMS_ENTITY_ID || process.env.SMS_PEID;

      if (!senderId || !templateId || !entityId) {
        throw new Error(
          'Set SMS_SENDER_ID, SMS_DLT_TEMPLATE_ID, and SMS_ENTITY_ID before using SMS_ROUTE=dlt_manual',
        );
      }

      payload.set('sender_id', senderId);
      payload.set('template_id', templateId);
      payload.set('entity_id', entityId);
    }

    payload.set('message', this.buildOtpMessage(otp));

    if (route === 'q') {
      payload.set('language', 'english');
    }

    return payload;
  }

  private getFast2SmsRoute(): Fast2SmsRoute {
    const route = (process.env.SMS_ROUTE || 'q').toLowerCase();

    if (route === 'q' || route === 'dlt' || route === 'dlt_manual' || route === 'otp') {
      return route;
    }

    throw new Error('SMS_ROUTE must be one of: q, dlt, dlt_manual, otp');
  }

  private buildOtpMessage(otp: number): string {
    const template =
      process.env.SMS_DLT_TEMPLATE_TEXT ||
      'Welcome to the Zenzio powered by SMSINDIAHUB. Your OTP for registration is {#var#}';

    return template.replace('{#var#}', otp.toString());
  }

  private formatProviderMessage(data?: Fast2SmsResponse): string | undefined {
    if (!data) return undefined;
    if (Array.isArray(data.message)) return data.message.join(', ');
    if (typeof data.message === 'string') return data.message;
    return JSON.stringify(data);
  }

  private sanitizeMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  }

  private isValidIndianMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  private maskMobile(mobile: string): string {
    const d = this.sanitizeMobile(mobile);
    return d.slice(0, 5) + 'XXXXX';
  }
}
