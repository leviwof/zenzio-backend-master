import { Controller, Get, Param, Body, Patch } from '@nestjs/common';
import { CartStatusService } from './cart-status.service';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
// import { UpdateCartStatusDto } from '../dto/update-cart-status.dto';
// UpdateCartStatusDto
@Controller('cart-status')
export class CartStatusController {
  constructor(private readonly statusService: CartStatusService) {}

  // UPDATE BY UID
  @Patch(':cartGroupUid')
  updateStatus(@Param('cartGroupUid') cartGroupUid: string, @Body() dto: UpdateCartStatusDto) {
    return this.statusService.updateStatus(cartGroupUid, dto);
  }

  // GET STATUS BY UID
  @Get(':cartGroupUid')
  getStatus(@Param('cartGroupUid') cartGroupUid: string) {
    return this.statusService.getStatus(cartGroupUid);
  }
}
