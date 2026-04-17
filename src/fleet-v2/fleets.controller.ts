import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Query,
  Param,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Patch,
  Put,
  UnauthorizedException,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { RegisterFleetDto } from './dto/registerFleet.dto';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
// import { JwtPayload } from 'src/shared/jwt.service';
import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { CreateFleetDto } from './dto/createFleet.dto';
import { FleetsService } from './fleets.service';
import { FleetLoginEmailDto, FleetLoginOtpDto } from './dto/login.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MulterFile } from 'src/types/multer-file.type';
import { DocumentUploadService } from './document-upload.service';
import { FFileService } from './res-images.service';
import { UpdateFleetAddressDto } from './dto/update-fleet-address.dto';
import { UpdateWorkTimeDto } from './dto/update-work-time.dto';
import { UpdateBreakTimeDto } from './dto/update-break-time.dto';
import { UpdateFleetBankDto } from './dto/udate-bank.dto';
import { AuthRequest, RequestWithUser } from 'src/types/auth-request';
import { UpdateFleetProfileDto } from './dto/update-fleet-profile.dto';
import { ResetPasswordOtpDto } from './dto/reset-password-otp.dto';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FleetDocument } from './entity/fleet-document.entity';
import { Fleet } from './entity/fleet.entity';
import { RedisService } from 'src/redis/redis.service';

// interface AuthRequest extends Request {
//   user?: {
//     uid: string;
//     role: string;
//     [key: string]: any;
//   };
// }
@Controller('fleets')
export class FleetsController {
  constructor(
    private readonly fleetService: FleetsService,
    private readonly documentService: DocumentUploadService,
    private readonly fileService: FFileService,
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
    private readonly redisService: RedisService,
  ) { }

  @Get('stats')
  async getPartnerStats() {
    const totalPartners = await this.fleetRepository.count();
    const activePartners = await this.fleetRepository.count({ where: { isActive: true } });
    const onDutyPartners = await this.fleetRepository.count({ where: { status: true, isActive: true } });
    const pendingPartners = await this.fleetRepository
      .createQueryBuilder('fleet')
      .where('fleet.status = :status', { status: false })
      .andWhere('(fleet.verificationFlags = 0 OR fleet.verificationFlags IS NULL)')
      .getCount();

    return {
      status: 'success',
      code: 200,
      data: {
        total: totalPartners,
        active: activePartners,
        onDuty: onDutyPartners,
        pending: pendingPartners,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('vehicles')
  async getVehicleTypes() {
    return this.fleetService.getVehicleTypes();
  }

  @Get()
  async getAllFleets(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('vehicleType') vehicleType?: string,
  ) {
    page = Math.max(1, Number(page));
    limit = Math.max(1, Number(limit));

    const qb = this.fleetRepository
      .createQueryBuilder('fleet')
      .leftJoinAndSelect('fleet.profile', 'profile')
      .leftJoinAndSelect('fleet.contact', 'contact')
      .leftJoinAndSelect('fleet.documents', 'doc');

    /* 🔍 SEARCH */
    if (search) {
      qb.andWhere(
        `
      (fleet.uid ILIKE :search
      OR doc.registrationNumber ILIKE :search
      OR doc.licenseNumber ILIKE :search
      OR CONCAT(profile.first_name, ' ', profile.last_name) ILIKE :search)
    `,
        { search: `%${search}%` },
      );
    }

    /* 🟢 STATUS (BOOLEAN SAFE) */
    if (status && status !== 'All') {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === 'active') {
        qb.andWhere('fleet.status = :status', { status: true });
      } else if (lowerStatus === 'on-duty') {
        qb.andWhere('fleet.isActive = :isActive', { isActive: true });
        // qb.andWhere('fleet.status = :status', { status: true }); // Removing strict check to show all on-duty
      } else if (lowerStatus === 'pending') {
        // Assuming pending means inactive AND (explicitly marked pending OR no flag set yet)
        qb.andWhere('fleet.status = :status', { status: false });
        qb.andWhere('(fleet.verificationFlags = 0 OR fleet.verificationFlags IS NULL)');
      } else if (lowerStatus === 'blocked') {
        qb.andWhere('fleet.status = :status', { status: false });
        qb.andWhere('fleet.status_flag = :blocked', { blocked: 'Blocked' });
      } else if (lowerStatus === 'inactive') {
        // Strict inactive (approved but turned off, or explicitly set to inactive)
        qb.andWhere('fleet.status = :status', { status: false });
        // Exclude blocked if we want pure inactive, or just keep it broad.
        // Let's assume 'inactive' filter should show manually deactivated users.
        qb.andWhere('(fleet.status_flag IS NULL OR fleet.status_flag != :blocked)', {
          blocked: 'Blocked',
        });
      } else {
        // Fallback for any other status: just check status bool
        qb.andWhere('fleet.status = :status', { status: false });
      }
    }

    /* 🚲 VEHICLE TYPE */
    if (vehicleType && vehicleType !== 'All') {
      qb.andWhere('LOWER(doc.vehicle_type) = LOWER(:vehicleType)', {
        vehicleType,
      });
    }

    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('fleet.createdAt', 'DESC'); // Good practice

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: {
        totalPartners: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('firebase-profile')
  // @Get('google-profile')
  getFirebaseProfile(@Req() req: Request) {
    const user = req['user'] as {
      uid: string;
      email: string;
      name?: string;
      picture?: string;
    };

    return {
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }

  // @UseGuards(AccessTokenAuthGuard)
  // @Get('me')
  // async getUserProfile(@Req() req: { user: JwtPayload }) {
  //   console.log('Recieveduser=====', req.user);

  //   // You can use either uid or userId to fetch full profile
  //   const userProfile = await this.fleetService.findByUid(req.user.uid);

  //   return userProfile;
  // }

  @Post()
  async create(@Body() CreateFleetDto: CreateFleetDto) {
    return this.fleetService.create(CreateFleetDto);
  }

  @Post('auth/signup/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  signupWithEmail(
    @Body() registerUserDto: RegisterFleetDto,
    // @Param('userType', new ParseEnumPipe(Roles)) userType: Roles,
  ) {
    return this.fleetService.signupWithEmail(registerUserDto);
  }

  @Post('auth/login/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  loginEmail(@Body() loginDto: FleetLoginEmailDto) {
    return this.fleetService.loginWithEmail(loginDto);
  }

  @Post('auth/login/otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  loginOtp(@Body() loginDto: FleetLoginOtpDto) {
    return this.fleetService.loginwithOtp(loginDto);
  }

  @Post('auth/reset-password-otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  resetPasswordOtp(@Body() dto: ResetPasswordOtpDto) {
    return this.fleetService.resetPasswordWithOtp(dto);
  }

  @Post('refresh-auth')
  refreshAuth(@Query('refreshToken') refreshToken: string) {
    console.log({ refreshToken123: refreshToken });
    return this.fleetService.refreshAuthToken(refreshToken);
  }

  // @Patch('address')
  // @ApiOperation({ summary: 'Update fleet address for logged-in user' })
  // @ApiBody({ type: UpdateFleetAddressDto })
  // @ApiResponse({ status: 200, description: 'Address updated successfully' })
  // @UseGuards(AccessTokenAuthGuard)
  // async updateAddress(@Req() req: AuthRequest, @Body() dto: UpdateFleetAddressDto) {
  //   const user_uid = req.user?.uid;
  //   if (!user_uid) throw new BadRequestException('Invalid user');

  //   const updated = await this.fleetService.updateAddress(user_uid, dto);

  //   return {
  //     status: 'success',
  //     code: 200,
  //     message: 'Address updated successfully',
  //     data: { address: updated },
  //     meta: { timestamp: new Date().toISOString() },
  //   };
  // }

  @Get('check-phone/:phone')
  async checkPhone(@Param('phone') phone: string) {
    const exists = await this.fleetService.checkPhoneExists(phone);
    return {
      status: 'success',
      data: { exists },
    };
  }

  @UseGuards(AccessTokenAuthGuard)
  @Get('me')
  async myProfile(@Req() req: AuthRequest) {
    const uid = req.user?.uid;
    if (!uid) throw new BadRequestException('Invalid user');

    const fleet = await this.fleetService.myProfile(uid);

    return {
      status: 'success',
      code: 200,
      message: 'Fleet profile fetched successfully',
      data: fleet, // <= Your exact data here
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':fleetUid/work-time')
  updateWorkTime(@Param('fleetUid') fleetUid: string, @Body() dto: UpdateWorkTimeDto) {
    return this.fleetService.updateWorkTime(fleetUid, dto);
  }

  @Patch(':fleetUid/break-time')
  updateBreakTime(@Param('fleetUid') fleetUid: string, @Body() dto: UpdateBreakTimeDto) {
    return this.fleetService.updateBreakTime(fleetUid, dto);
  }

  @Patch(':fleetUid/profile')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateProfileByAdmin(@Param('fleetUid') fleetUid: string, @Body() dto: UpdateFleetProfileDto) {
    return this.fleetService.updateFleetProfile(fleetUid, dto);
  }

  @Put('bank')
  @UseGuards(AccessTokenAuthGuard)
  async updateFleetBank(@Req() req: AuthRequest, @Body() dto: UpdateFleetBankDto) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const fleetUid: string = req.user.uid;

    return this.fleetService.updateFleetBank(fleetUid, dto);
  }

  @Put('address')
  @UseGuards(AccessTokenAuthGuard)
  async updateFleetAddress(@Req() req: AuthRequest, @Body() dto: UpdateFleetAddressDto) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const fleetUid: string = req.user.uid;

    return this.fleetService.updateFleetAddress(fleetUid, dto);
  }

  @Get(':uid')
  async findOneByUid(@Param('uid') uid: string) {
    return this.fleetService.findByUid(uid);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.fleetService.toggleStatus(id);
  }

  @Delete(':uid/admin')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async permanentlyDeleteFleet(@Param('uid') uid: string) {
    return this.fleetService.permanentlyDeleteFleet(uid);
  }

  @Delete('delete')
  @UseGuards(AccessTokenAuthGuard)
  async deleteMyAccount(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }
    return this.fleetService.deleteMyAccount(req.user.uid);
  }

  /***
    @Post('refresh-auth')
    refreshAuth(@Query('refreshToken') refreshToken: string) {
      console.log({ refreshToken123: refreshToken });
      return this.fleetService.refreshAuthToken(refreshToken);
    }
  
    @Get()
    async findAll() {
      return this.fleetService.findAll();
    }
  
    @Get(':id')
    async findOne(@Param('id') id: number) {
      return this.fleetService.findOne(id);
    }
  
    @Patch(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
      return this.fleetService.update(id, updateUserDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: number) {
      return this.fleetService.remove(id);
    }
  */

  @Post('upload-image/:fleetUid')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('file', 10))
  async uploadMenuImagePrefix(
    @UploadedFiles() files: MulterFile[],
    @Param('fleetUid') fleetUid: string,
  ) {
    return this.fileService.uploadMultiplerestResImages(files, fleetUid);
  }

  @Put('profile')
  @UseGuards(AccessTokenAuthGuard)
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateFleetProfileDto) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const fleetUid: string = req.user.uid;

    return this.fleetService.updateFleetProfile(fleetUid, dto);
  }

  @Post('upload-documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fleetUid: { type: 'string' },
        docType: {
          type: 'string',
          enum: ['rc', 'pan', 'aadhar', 'other'], // <-- FIXED ENUM
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // <-- MUST MATCH
  async uploadDocuments(
    @UploadedFiles() files: MulterFile[],
    @Body('fleetUid') fleetUid: string,
    @Body('docType') docType: 'rc' | 'pan' | 'aadhar' | 'other',
  ) {
    return this.documentService.uploadMultipleDocuments(files, fleetUid, docType);
  }

  @Patch('toggle')
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async toggleFleetStatus(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const fleetUid = req.user.uid; // 🚀 Use token UID only

    const result = await this.fleetService.toggleFleetIsActive(fleetUid);

    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'Fleet not found',
        data: null,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const isActiveNum = Number(result);

    return {
      status: 'success',
      code: 200,
      message: `Fleet status changed to ${isActiveNum === 1 ? 'Active' : 'Inactive'}`,
      data: {
        uid: fleetUid,
        isActive: isActiveNum,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Patch(':uid/status/admin')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async fleetStatusByAdmin(
    @Req() req: RequestWithUser,
    @Param('uid') fleetUid: string,
    @Body() body: { status?: number | boolean; isActive?: number | boolean },
  ) {
    if (!req.user?.uid) {
      throw new UnauthorizedException('Invalid admin');
    }

    const adminUid = req.user.uid;

    const result = await this.fleetService.fleetStatusByAdmin(adminUid, fleetUid, body);

    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'Fleet not found',
        data: null,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const statusNum = Number(result.status);
    const isActiveNum = Number(result.isActive);

    const statusMsg = statusNum === 1 ? 'Fleet activated by admin' : 'Fleet deactivated by admin';

    const listMsg =
      isActiveNum === 1 ? 'Fleet available for service' : 'Fleet not available for service';

    return {
      status: 'success',
      code: 200,
      message: statusMsg,
      data: {
        uid: fleetUid,
        status: statusNum,
        isActive: isActiveNum,
        listMessage: listMsg,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('heartbeat')
  @RolesDecorator(RoleEnum.USER_FLEET)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async updateHeartbeat(@Req() req: AuthRequest, @Body() body: { lat: number; lng: number }) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const { lat, lng } = body;
    await this.redisService.set(
      `fleet:location:${req.user.uid}`,
      {
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      },
      300,
    ); // 5 mins heartbeat

    return { status: 'success' };
  }

  // ============================================================
  // LIVE TRACKING ALL FLEETS
  // ============================================================
  @Get('live-tracking/all')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllLiveLocations() {
    // 1. Get all active fleets
    const fleets = await this.fleetRepository.find({
      where: { isActive: true },
      relations: ['profile'],
    });

    // 2. Get locations from Redis
    const client = this.redisService.getClient();
    const results: any[] = [];

    for (const fleet of fleets) {
      const loc = await this.redisService.get(`fleet:location:${fleet.uid}`);

      results.push({
        uid: fleet.uid,
        name:
          `${fleet.profile?.first_name || ''} ${fleet.profile?.last_name || ''}`.trim() ||
          'Partner',
        lat: loc?.lat || 0,
        lng: loc?.lng || 0,
        lastUpdated: loc?.updatedAt || null,
        status: loc ? 'Online' : 'Offline (No GPS)',
        isActive: fleet.isActive,
      });
    }

    return {
      status: 'success',
      data: results,
      meta: {
        totalActive: fleets.length,
        totalOnline: results.filter((r) => r.status === 'Online').length,
      },
    };
  }
}
