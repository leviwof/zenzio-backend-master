import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
// import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FleetContact } from 'src/fleet-v2/entity/fleet_contact.entity';
import { ForgotPasswordDto } from '../auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '../auth/reset-password.dto';

@Controller('fleet/auth')
export class ForgotPasswordController {
  constructor(
    private readonly firebaseService: FirebaseService,

    @InjectRepository(FleetContact)
    private readonly fleetContactRepo: Repository<FleetContact>,
  ) {}

  @Post('request-reset-password')
  async requestResetPassword(@Body() dto: ForgotPasswordDto): Promise<any> {
    const { email } = dto;

    // check fleet exists
    const contact = await this.fleetContactRepo.findOne({
      where: { encryptedEmail: email },
    });

    if (!contact) {
      throw new BadRequestException('Email not registered');
    }

    // generate Firebase reset link
    const link = await this.firebaseService.generatePasswordResetLink(email);

    // TODO: send via email service (SendGrid, SES, etc)
    console.log('Reset Link: ', link);

    return {
      status: 'success',
      message: 'Password reset link sent successfully',
      link, // Only DEV — remove in production
    };
  }

  @Post('confirm-reset-password')
  async confirmResetPassword(@Body() dto: ConfirmResetPasswordDto): Promise<any> {
    const { oobCode, newPassword } = dto;

    // Let Firebase handle reset using code
    await this.firebaseService.confirmPasswordReset(oobCode, newPassword);

    return {
      status: 'success',
      message: 'Password updated successfully',
    };
  }
}
