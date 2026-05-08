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

  const fast2smsResult = await this.tryFast2Sms(mobile, otp);
  if (fast2smsResult.success) return fast2smsResult;

  this.logger.warn(`Fast2SMS failed, trying SMSIndiaHub for ${this.maskMobile(mobile)}`);
  return this.trySmsIndiaHub(mobile, otp);
 }

 private async tryFast2Sms(
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { success: false, message: 'Fast2SMS API key not configured' };

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
    this.logger.log(`OTP sent via Fast2SMS to ${this.maskMobile(mobile)}`);
    return { success: true, message: 'SMS sent successfully', data: response.data };
   }

   const errMsg = Array.isArray(response.data?.message)
     ? response.data.message.join(', ')
     : (typeof response.data?.message === 'string' ? response.data.message : 'Fast2SMS rejected');
   this.logger.error(`Fast2SMS error: ${errMsg}`);
   return { success: false, message: 'Fast2SMS failed', error: errMsg };
  } catch (error) {
   this.logger.error(`Fast2SMS exception: ${(error as Error).message}`);
   return { success: false, message: 'Fast2SMS failed', error: (error as Error).message };
  }
 }

 private async trySmsIndiaHub(
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; error?: string }> {
  const apiKey = process.env.SMS_API_KEY;
  const apiUrl = process.env.SMS_API_URL || 'http://cloud.smsindiahub.in/api/mt/SendSMS';

  if (!apiKey) return { success: false, message: 'SMSIndiaHub API key not configured' };

  try {
   const response = await axios.get(apiUrl, {
    params: {
     APIKey: apiKey,
     senderid: process.env.SMS_SENDER_ID || 'SMSHUB',
     channel: 'Trans',
     DCS: 0,
     flashsms: 0,
     number: this.sanitizeMobile(mobile),
     text: `Your OTP for Zenzio registration is ${otp}. It expires in 5 minutes.`,
     route: 1,
    },
    timeout: 10_000,
   });

   if (response.status === 200) {
    this.logger.log(`OTP sent via SMSIndiaHub to ${this.maskMobile(mobile)}`);
    return { success: true, message: 'SMS sent successfully' };
   }

   this.logger.error(`SMSIndiaHub rejected: ${JSON.stringify(response.data)}`);
   return { success: false, message: 'SMSIndiaHub failed', error: 'Provider rejected request' };
  } catch (error) {
   this.logger.error(`SMSIndiaHub exception: ${(error as Error).message}`);
   return { success: false, message: 'SMSIndiaHub failed', error: (error as Error).message };
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
