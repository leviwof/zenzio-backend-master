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
  Put,
  Param,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Patch,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginEmailDto, LoginOtpDto } from './dto/login.dto';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
// import { RolesDecorator } from 'src/auth/app.decorator'; // decorator
// import { Roles as RoleEnum } from 'src/constants/app.enums';
// import { AccessTokenAuthGuard } from 'src/auth/access-token.guard';
import { JwtPayload, JwtServiceShared } from 'src/shared/jwt.service';
// import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { AccessTokenAuthGuard, JwtAuthGuard, RolesGuard } from 'src/guards';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MulterFile } from 'src/types/multer-file.type';
import { UFileService } from './user-images.service';
import { RolesDecorator } from 'src/auth/app.decorator';
import { AuthRequest, RequestWithUser } from 'src/types/auth-request';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileService: UFileService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  @Get()
  async getUsersWithAllDetails(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    page = Math.max(1, Number(page));
    limit = Math.max(1, Number(limit));

    // DEBUG INPUT
    console.log('API /users params:', { page, limit, search, status, sortBy });

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.contact', 'contact');

    if (search) {
      qb.andWhere(
        `(profile.first_name ILIKE :search
        OR profile.last_name ILIKE :search
        OR user.uid ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Fix: Only filter if status is explicitly a number (0 or 1) and NOT empty string
    if (status !== undefined && status !== null && status !== ('' as any)) {
      qb.andWhere('user.isActive = :status', { status });
    }

    if (sortBy) {
      const [field, order] = sortBy.split('_');
      const map = {
        createdAt: 'user.createdAt',
        name: 'profile.first_name',
      };
      if (map[field]) {
        qb.orderBy(map[field], order.toUpperCase() as 'ASC' | 'DESC');
      }
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    // DEBUG LOG
    console.log('API /users data sample:', JSON.stringify(data[0], null, 2));

    const mappedData = data.map((user) => ({
      ...user,
      user_contact: user.contact,
      user_profile: user.profile,
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

  @UseGuards(AccessTokenAuthGuard)
  @Get('me')
  async getUserProfile(@Req() req: { user: JwtPayload }) {
    console.log('Recieveduser=====', req.user);

    // You can use either uid or userId to fetch full profile
    const userProfile = await this.usersService.findByUid(req.user.uid);

    return userProfile;
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('auth/signup/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  signupWithEmail(
    @Body() registerUserDto: RegisterUserDto,
    // @Param('userType', new ParseEnumPipe(Roles)) userType: Roles,
  ) {
    return this.usersService.signupWithEmail(registerUserDto);
  }

  @Post('auth/login/email')
  @UsePipes(new ValidationPipe({ transform: true }))
  loginEmail(@Body() loginDto: LoginEmailDto) {
    return this.usersService.loginWithEmail(loginDto);
  }

  @Post('auth/login/otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  loginOtp(@Body() loginOtpDto: LoginOtpDto) {
    return this.usersService.loginWithOtp(loginOtpDto);
  }
  // @Post('auth/google')
  // handleSocialLogin(@Body('idToken') idToken: string) {
  //   return this.usersService.signupWithGoogle(idToken);
  // }

  @Post('refresh-auth')
  refreshAuth(@Query('refreshToken') refreshToken: string) {
    console.log({ refreshToken123: refreshToken });
    return this.usersService.refreshAuthToken(refreshToken);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Put('profile')
  updateMyProfile(@Req() req: { user: JwtPayload }, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateByUid(req.user.uid, dto);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Get('my-profile')
  async getMyProfile(@Req() req: { user: JwtPayload }) {
    return this.usersService.getMyFullProfile(req.user.uid);
  }

  @Post('upload-image/:userUid')
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
  uploadMenuImagePrefix(@UploadedFiles() files: MulterFile[], @Param('userUid') userUid: string) {
    return this.fileService.uploadMultiplerestResImages(files, userUid);
  }

  @Patch('toggle')
  @RolesDecorator(RoleEnum.USER_CUSTOMER)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async toggleUserStatus(@Req() req: AuthRequest) {
    if (!req.user?.uid) {
      throw new BadRequestException('Invalid user');
    }

    const userUid = req.user.uid;

    const result = await this.usersService.toggleUserIsActive(userUid);

    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'User not found',
        data: null,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const isActiveNum = Number(result);

    return {
      status: 'success',
      code: 200,
      message: `User status changed to ${isActiveNum === 1 ? 'Active' : 'Inactive'}`,
      data: {
        uid: userUid,
        isActive: isActiveNum,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Patch('notifications/toggle')
  @UseGuards(AccessTokenAuthGuard)
  async toggleNotifications(@Req() req: { user: JwtPayload }) {
    const isEnabled = await this.usersService.toggleNotifications(req.user.uid);
    return {
      success: true,
      data: { notificationsEnabled: isEnabled },
      message: `Notifications ${isEnabled ? 'enabled' : 'disabled'}`,
    };
  }

  @Patch(':uid/status/admin')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async userStatusByAdmin(
    @Req() req: RequestWithUser,
    @Param('uid') userUid: string,
    @Body() body: { status?: number | boolean; isActive?: number | boolean },
  ) {
    if (!req.user?.uid) {
      throw new UnauthorizedException('Invalid admin');
    }

    const result = await this.usersService.userStatusByAdmin(userUid, body);

    if (result === null) {
      return {
        status: 'failed',
        code: 404,
        message: 'User not found',
        data: null,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const statusNum = Number(result.status);
    const isActiveNum = Number(result.isActive);

    const statusMsg = statusNum === 1 ? 'User activated by admin' : 'User deactivated by admin';

    const listMsg = isActiveNum === 1 ? 'User available' : 'User unavailable';

    return {
      status: 'success',
      code: 200,
      message: statusMsg,
      data: {
        uid: userUid,
        status: statusNum,
        isActive: isActiveNum,
        listMessage: listMsg,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get(':uid')
  async findOneByUid(@Param('uid') uid: string) {
    return this.usersService.findByUid(uid);
  }
  @UseGuards(AccessTokenAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: { user: JwtPayload }) {
    console.log('🗑️ Request to delete logged-in user:', req.user.uid);
    return this.usersService.removeByUid(req.user.uid);
  }

  @Delete(':uid')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(AccessTokenAuthGuard, RolesGuard)
  async remove(@Param('uid') uid: string) {
    return this.usersService.removeByUid(uid);
  }

  /***
    @Post('refresh-auth')
    refreshAuth(@Query('refreshToken') refreshToken: string) {
      console.log({ refreshToken123: refreshToken });
      return this.usersService.refreshAuthToken(refreshToken);
    }
  
    @Get()
    async findAll() {
      return this.usersService.findAll();
    }
  
    @Get(':id')
    async findOne(@Param('id') id: number) {
      return this.usersService.findOne(id);
    }
  
    @Patch(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(id, updateUserDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: number) {
      return this.usersService.remove(id);
    }
  */
}
