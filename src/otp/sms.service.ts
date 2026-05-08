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

 async sendOtp(
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {

  const testMode = process.env.SMS_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';

  if (testMode) {
   this.logger.log(`TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)}`);
   return {
    success: true,
    message: 'SMS sent successfully (TEST MODE)',
    data: { return: true, request_id: 'test-' + Date.now(), message: ['Test mode - no actual SMS sent'] }
   };
  }

  return this.sendViaFast2Sms(mobile, otp);
 }

 private async sendViaFast2Sms(
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) return { success: false, message: 'SMS API key not configured' };

  try {
   const response: AxiosResponse<Fast2SmsResponse> = await axios.get(
    'https://www.fast2sms.com/dev/bulkV2',
    {
     params: {
      authorization: apiKey,
      message: `Welcome to Zenzio. Your OTP for registration is ${otp}`,
      language: 'english',
      route: 'q',
      numbers: this.sanitizeMobile(mobile),
     },
     timeout: 10_000,
    },
   );

   if (response.data?.return === true) {
    this.logger.log(`OTP sent successfully to ${this.maskMobile(mobile)}`);
    return { success: true, message: 'SMS sent successfully', data: response.data };
   }

   const errMsg = Array.isArray(response.data?.message)
     ? response.data.message.join(', ')
     : (typeof response.data?.message === 'string' ? response.data.message : 'SMS provider rejected');
   this.logger.error(`SMS failed: ${errMsg}`);
   return { success: false, message: 'Failed to send SMS', error: errMsg };
  } catch (error) {
   this.logger.error(`SMS failed: ${(error as Error).message}`);
   return { success: false, message: 'Failed to send SMS', error: (error as Error).message };
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
