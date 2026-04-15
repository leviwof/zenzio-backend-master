import { Controller, Post, Body, Get } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.phone);
  }

  @Post('verify')
  verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.otpService.verifyOtp(phone, otp);
  }
  // ✅ Get all stored OTP records
  @Get('list')
  getAllOtps() {
    return this.otpService.getAllOtps();
  }
}
