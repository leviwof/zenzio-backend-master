import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('test-email')
export class TestEmailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  async sendTest() {
    console.log('[TEST EMAIL] Controller Hit');

    return this.mailService.sendMail(
      'smileatdgs@gmail.com',
      'Welcome!',
      '<h1>Hello, your order is confirmed!</h1>',
    );
  }
}
