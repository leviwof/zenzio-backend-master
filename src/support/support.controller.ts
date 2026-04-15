import { Controller, Get, Query } from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.supportService.findAll(query);
  }
}
