import { Controller, Get, Req } from '@nestjs/common';
import { User } from 'src/users/user.entity';

@Controller('test')
export class TestController {
  @Get('auth-me-middleware')
  dummyGet(@Req() req: { me: User }) {
    const user: User = req.me;

    console.log('User from req.me:', user);

    return {
      message: 'Hello Dummy!',
      currentUser: user,
    };
  }
}
