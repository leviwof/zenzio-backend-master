import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

import { AccessTokenAuthGuard } from 'src/guards';
import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';

import { DeliveryLocationService } from './delivery-location.service';
import { CreateDeliveryLocationDto } from './dto/create-delivery-location.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';

interface AuthRequest extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}

@ApiTags('Delivery Location')
@Controller('delivery-location')
@UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
export class DeliveryLocationController {
  constructor(private readonly service: DeliveryLocationService) {}

  // ----------------------------------------------------------------
  // 🟦 CREATE LOCATION
  // ----------------------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Create a new delivery location for logged-in user' })
  @ApiBody({ type: CreateDeliveryLocationDto })
  async create(@Body() dto: CreateDeliveryLocationDto, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    dto.user_uid = req.user.uid;

    const location = await this.service.create(dto);

    return {
      status: 'success',
      code: 201,
      message: 'Delivery location created successfully',
      data: { location },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ----------------------------------------------------------------
  // 🟩 GET ALL USER LOCATIONS
  // ----------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Get all delivery locations of the logged-in user' })
  async findAll(@Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const locations = await this.service.findAll(req.user.uid);

    return {
      status: 'success',
      code: 200,
      data: { locations },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ----------------------------------------------------------------
  // 🟨 GET LOCATION BY UID
  // ----------------------------------------------------------------
  @Get(':uid')
  @ApiOperation({ summary: 'Get a specific delivery location by its UID' })
  @ApiParam({ name: 'uid', example: 'DL-ABCD1234' })
  async findOne(@Param('uid') uid: string) {
    const location = await this.service.findOne(uid);

    return {
      status: 'success',
      code: 200,
      data: { location },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ----------------------------------------------------------------
  // 🟪 GET LOCATION BY TYPE
  // /delivery-location/type/home
  // ----------------------------------------------------------------
  @Get('type/:address_type')
  @ApiOperation({ summary: 'Get user delivery location by address type (home, office, etc)' })
  @ApiParam({ name: 'address_type', example: 'home' })
  async findByType(@Param('address_type') address_type: string, @Req() req: AuthRequest) {
    if (!req.user?.uid) throw new BadRequestException('Invalid user');

    const user_uid = req.user.uid;

    const addressDetails = await this.service.findByUserAndType(user_uid, address_type);

    return {
      status: 'success',
      code: 200,
      data: {
        address_type,
        address_details: addressDetails
          ? {
              address: addressDetails.address,
              lat: addressDetails.lat,
              lng: addressDetails.lng,
              verified: addressDetails.verified,
            }
          : '', // EMPTY STRING IF NO ADDRESS
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ----------------------------------------------------------------
  // 🟧 UPDATE LOCATION
  // ----------------------------------------------------------------
  @Patch(':uid')
  @ApiOperation({ summary: 'Update a delivery location by UID' })
  @ApiParam({ name: 'uid', example: 'DL-XYZ9876' })
  @ApiBody({ type: UpdateDeliveryLocationDto })
  async update(@Param('uid') uid: string, @Body() dto: UpdateDeliveryLocationDto) {
    const location = await this.service.update(uid, dto);

    return {
      status: 'success',
      code: 200,
      message: 'Delivery location updated successfully',
      data: { location },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ----------------------------------------------------------------
  // 🟥 DELETE LOCATION
  // ----------------------------------------------------------------
  @Delete(':uid')
  @ApiOperation({ summary: 'Delete a delivery location by UID' })
  @ApiParam({ name: 'uid', example: 'DL-XYZ9876' })
  async remove(@Param('uid') uid: string) {
    await this.service.remove(uid);

    return {
      status: 'success',
      code: 200,
      message: 'Delivery location deleted successfully',
      data: {},
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
