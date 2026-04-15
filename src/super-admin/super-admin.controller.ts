import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SuperAdminService } from './super-admin.service';
import { Argon2Service } from 'src/shared/argon2.service';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { JwtServiceShared, JwtPayload } from 'src/shared/jwt.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RolesDecorator } from 'src/auth/app.decorator';
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { JwtAuthGuard, RolesGuard } from 'src/guards';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Controller('super-admin')
export class SuperAdminController {
  private readonly logger = new Logger(SuperAdminController.name);

  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly argon2Service: Argon2Service,
    private readonly jwtService: JwtServiceShared,
  ) {}

  /**
   * 🔑 LOGIN
   */
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() loginDto: SuperAdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const { email, password, role } = loginDto;
    this.logger.log(`🔐 Login attempt: email=${email}, role=${role}`);

    const admin = await this.superAdminService.findByEmail(email);
    this.logger.log(`🔍 Admin found: ${admin ? 'YES' : 'NO'}`);

    if (!admin) {
      this.logger.warn(`❌ No admin found with email: ${email}`);
      throw new UnauthorizedException('Invalid credentials or role');
    }

    this.logger.log(`Admin role: ${admin.role}, Expected: ${role}, Match: ${admin.role === role}`);

    if (admin.role !== role) {
      throw new UnauthorizedException('Invalid credentials or role');
    }

    const isValid = await this.argon2Service.verifyPassword(admin.password, password);
    this.logger.log(`✔️ Password valid: ${isValid}`);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ⭐ FIXED — firebase_uid is now included
    const payload: JwtPayload = {
      uid: admin.uid,
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      // firebase_uid: admin.firebase_uid, // <—— ✔ FIX ADDED
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    const accessTokenExpiry = this.jwtService.getExpireInSeconds(
      this.jwtService['accessTokenExpiresIn'],
    );
    const refreshTokenExpiry = this.jwtService.getExpireInSeconds(
      this.jwtService['refreshTokenExpiresIn'],
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiry * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiry * 1000,
    });

    return {
      status: 'success',
      code: 200,
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        accessToken, // ✅ ADD THIS
        refreshToken, // ✅ OPTIONAL but recommended
        message: 'Logged in successfully',
      },
      meta: {
        timestamp: new Date().toISOString(),
        accessTokenExpiresIn: accessTokenExpiry,
        refreshTokenExpiresIn: refreshTokenExpiry,
      },
    };
  }

  /**
   * 🔍 DEBUG - LIST ALL SUPER ADMINS (For troubleshooting)
   */
  @Get('debug/list')
  async debugListAll() {
    const admins = await this.superAdminService.findAll();
    this.logger.log(`📊 Total admins in DB: ${admins.length}`);
    return {
      status: 'success',
      count: admins.length,
      data: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        uid: admin.uid,
        isActive: admin.isActive,
      })),
    };
  }

  /**
   * 👤 PROFILE
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  async getProfile(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return await this.superAdminService.findOne(String(req.user.userId));
  }

  /**
   * ➕ CREATE
   */
  @Post('create')
  // @RolesDecorator(RoleEnum.MASTER_ADMIN)
  // @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createSuperAdminDto: CreateAdminDto) {
    return this.superAdminService.create(createSuperAdminDto);
  }

  /**
   * 📋 LIST
   */
  @Get('list')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    const [admins, total] = await this.superAdminService.findAllPaginated(pageNumber, pageSize);

    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      uid: admin.uid,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      photo: admin.photo,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));

    const message =
      formattedAdmins.length > 0 ? 'Super Admin list fetched successfully' : 'No data available';

    return {
      status: 'success',
      code: 200,
      data: { users: formattedAdmins, message },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 👀 VIEW
   */
  @Get(':id')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.superAdminService.findOne(id);
  }

  /**
   * ✏️ UPDATE
   */
  @Patch(':id')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateAdminDto>) {
    return await this.superAdminService.update(id, updateDto);
  }

  /**
   * 🗑 DELETE
   */
  @Delete(':id')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.superAdminService.remove(id);
  }

  /**
   * ✅ ACTIVATE
   */
  @Patch(':id/activate')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async activate(@Param('id') id: string) {
    return await this.superAdminService.activate(id);
  }

  /**
   * 🚫 DEACTIVATE
   */
  @Patch(':id/deactivate')
  @RolesDecorator(RoleEnum.MASTER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async deactivate(@Param('id') id: string) {
    return await this.superAdminService.deactivate(id);
  }

  /**
   * 🔑 CHANGE PASSWORD (LOCAL)
   */
  @Patch('auth/change-password-local')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async changePasswordLocal(
    @Req() req: RequestWithUser,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Invalid user');
    }
    await this.superAdminService.changePassword(String(req.user.userId), dto);
    return {
      status: 'success',
      message: 'Password updated successfully.',
    };
  }

  /**
   * 📧 REQUEST OTP
   */
  @Post('auth/request-otp')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async requestOtp(@Req() req: RequestWithUser) {
    if (!req.user?.userId) throw new UnauthorizedException('Invalid user');
    return {
      status: 'success',
      message: await this.superAdminService.requestOtp(String(req.user.userId)),
    };
  }

  /**
   * ✅ VERIFY OTP
   */
  @Post('auth/verify-otp')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async verifyOtp(@Req() req: RequestWithUser, @Body() body: { otp: string }) {
    if (!req.user?.userId) throw new UnauthorizedException('Invalid user');
    const isValid = await this.superAdminService.verifyOtp(String(req.user.userId), body.otp);
    return {
      status: 'success',
      isValid,
    };
  }

  /**
   * 🔄 RESET PASSWORD WITH OTP
   */
  @Patch('auth/reset-password-otp')
  @RolesDecorator(RoleEnum.MASTER_ADMIN, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  async resetPasswordWithOtp(
    @Req() req: RequestWithUser,
    @Body() body: { otp: string; newPassword: string },
  ) {
    if (!req.user?.userId) throw new UnauthorizedException('Invalid user');
    await this.superAdminService.resetPasswordWithOtp(
      String(req.user.userId),
      body.otp,
      body.newPassword,
    );
    return {
      status: 'success',
      message: 'Password updated successfully.',
    };
  }

  /**
   * 🚪 LOGOUT
   */
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }
}
