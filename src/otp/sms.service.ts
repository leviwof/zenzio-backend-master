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

  const testMode = process.env.SMS_TEST_MODE === 'true';

  if (testMode) {
   this.logger.log(`TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)}`);
   return {
    success: true,
    message: 'SMS sent successfully (TEST MODE)',
    data: { return: true, request_id: 'test-' + Date.now(), message: ['Test mode - no actual SMS sent'] }
   };
  }

  const num = this.sanitizeMobile(mobile);
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
   return {
    success: false,
    message: 'SMS API key not configured',
    error: 'Set SMS_API_KEY or FAST2SMS_API_KEY in the active environment',
   };
  }

  // Try DLT route first (for DLT-approved sender IDs)
  const dltResult = await this.tryDltRoute(apiKey, num, otp);
  if (dltResult.success) return dltResult;

  // Fallback to Quick SMS route
  this.logger.warn(`DLT route failed, trying Quick SMS for ${this.maskMobile(mobile)}`);
  return this.tryQuickSms(apiKey, num, otp);
 }

 private async tryDltRoute(
  apiKey: string,
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
  const senderId = process.env.SMS_SENDER_ID;
  const templateId = process.env.SMS_DLT_TEMPLATE_ID;
  if (!senderId || !templateId) return { success: false, message: 'DLT sender ID or template ID not configured' };

  try {
   const response: AxiosResponse<Fast2SmsResponse> = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
     route: 'dlt',
     sender_id: senderId,
     message: templateId,
     variables_values: otp.toString(),
     numbers: mobile,
    },
    {
     headers: { authorization: apiKey },
     timeout: 10_000,
    },
   );

   this.logger.log(`DLT response: ${JSON.stringify(response.data)}`);

   if (response.data?.return === true) {
    this.logger.log(`OTP sent via DLT to ${this.maskMobile(mobile)}`);
    return { success: true, message: 'SMS sent successfully', data: response.data };
   }

   return { success: false, message: 'DLT route failed', data: response.data };
  } catch (error) {
   this.logger.error(`DLT exception: ${(error as Error).message}`);
   return { success: false, message: 'DLT route failed', error: (error as Error).message };
  }
 }

 private async tryQuickSms(
  apiKey: string,
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {
  try {
   const response: AxiosResponse<Fast2SmsResponse> = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
     route: 'q',
     message: `Your OTP for Zenzio is ${otp}. It expires in 5 minutes.`,
     language: 'english',
     numbers: mobile,
    },
    {
     headers: { authorization: apiKey },
     timeout: 10_000,
    },
   );

   this.logger.log(`Quick SMS response: ${JSON.stringify(response.data)}`);

   if (response.data?.return === true) {
    this.logger.log(`OTP sent via Quick SMS to ${this.maskMobile(mobile)}`);
    return { success: true, message: 'SMS sent successfully', data: response.data };
   }

   const errMsg = Array.isArray(response.data?.message)
     ? response.data.message.join(', ')
     : (typeof response.data?.message === 'string' ? response.data.message : JSON.stringify(response.data));
   this.logger.error(`Quick SMS failed: ${errMsg}`);
   return { success: false, message: 'Failed to send SMS', error: errMsg };
  } catch (error) {
   this.logger.error(`Quick SMS exception: ${(error as Error).message}`);
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
