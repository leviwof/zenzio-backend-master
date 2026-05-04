import { Controller, Post, Body, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  // Strict rate limit: 3 OTP requests per 60 seconds per IP
  @Post('send')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.phone);
  }

  // Strict rate limit: 5 verification attempts per 60 seconds per IP
  @Post('verify')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.otpService.verifyOtp(phone, otp);
  }
  // ✅ Get all stored OTP records
  @Get('list')
  getAllOtps() {
    return this.otpService.getAllOtps();
  }
}
