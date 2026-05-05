import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

interface Fast2SmsResponse {
 return: boolean;
 request_id: string;
 message: string[] | string; // Can be array or string depending on response
}

@Injectable()
export class SmsService {
 private readonly logger = new Logger(SmsService.name);
 private readonly apiKey = process.env.FAST2SMS_API_KEY || '';
 private readonly message =
  'Welcome to Zenzio. Your OTP for registration is';
 async sendOtp(
  mobile: string,
  otp: number,
 ): Promise<{ success: boolean; message: string; data?: Fast2SmsResponse; error?: string }> {

  // ⚠️ TEMPORARY: Test mode when Fast2SMS account not recharged
  const testMode = process.env.SMS_TEST_MODE === 'true';

  if (testMode) {
    this.logger.warn(`🧪 TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)} (SMS not actually sent)`);
    return {
      success: true,
      message: 'SMS sent successfully (TEST MODE)',
      data: {
        return: true,
        request_id: 'test-' + Date.now(),
        message: ['Test mode - no actual SMS sent']
      }
    };
  }

  try {
   const response: AxiosResponse<Fast2SmsResponse> = await axios.get(
    'https://www.fast2sms.com/dev/bulkV2',
    {
     params: {
      authorization: this.apiKey,
      message: `${this.message} ${otp}`,
      language: 'english',
      route: 'q',     // Quick SMS — no DLT needed, works immediately
      numbers: this.sanitizeMobile(mobile),
     },
     timeout: 10_000,
    },
   );

   if (response.data?.return === true) {
    // Only log OTP in development for debugging
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`OTP sent to ${this.maskMobile(mobile)}: ${otp}`);
    } else {
      this.logger.log(`OTP sent successfully to ${this.maskMobile(mobile)}`);
    }
    return {
     success: true,
     message: 'SMS sent successfully',
     data: response.data,
    };
   }

   // API returned 200 but failed
   const messageData = response.data?.message;
   const errMsg = Array.isArray(messageData)
     ? messageData.join(', ')
     : (typeof messageData === 'string' ? messageData : 'Unknown Fast2SMS error');
   this.logger.error(`Fast2SMS rejected request: ${errMsg}`);
   return {
    success: false,
    message: 'Failed to send SMS',
    error: errMsg,
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

 // Strip country code, handle +91 / 091 / plain 10-digit formats
 private sanitizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
 }

 // Safe logging — never log full mobile numbers in production
 private maskMobile(mobile: string): string {
  const d = this.sanitizeMobile(mobile);
  return d.slice(0, 5) + 'XXXXX';
 }
}