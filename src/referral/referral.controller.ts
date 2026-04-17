import { Controller, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { AccessTokenAuthGuard } from 'src/guards';
import { AuthRequest } from 'src/types/auth-request';

@ApiTags('Referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral stats and refer code for the logged-in user' })
  async getReferralStats(@Req() req: AuthRequest) {
    const userUid = req.user?.uid;
    if (!userUid) throw new BadRequestException('Invalid user');
    return this.referralService.getReferralStats(userUid);
  }
}
