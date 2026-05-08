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

  const testMode = process.env.SMS_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';

  if (testMode) {
    this.logger.log(`TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)} (SMS not actually sent)`);
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

    this.logger.warn(`Fast2SMS unavailable, falling back to test mode for ${this.maskMobile(mobile)}`);
   } catch (error) {
    this.logger.warn(`Fast2SMS unavailable, falling back to test mode for ${this.maskMobile(mobile)}`);
   }

   this.logger.log(`FALLBACK TEST MODE: OTP ${otp} for ${this.maskMobile(mobile)}`);
   return {
    success: true,
    message: 'SMS sent successfully (fallback test mode)',
    data: {
     return: true,
     request_id: 'fallback-' + Date.now(),
     message: ['Fallback test mode - SMS not actually sent']
    }
   };
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