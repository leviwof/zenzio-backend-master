import { Module, forwardRef } from '@nestjs/common';
import { JwtServiceShared } from '../shared/jwt.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthHeaderController } from './auth-header.controller';
import { AuthorizationRoleGuard } from './authorization-role.guard';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [
    forwardRef(() => FirebaseModule), // ✅ FIX: Import FirebaseModule instead of providing FirebaseService
  ],
  providers: [JwtServiceShared, AuthService, AuthorizationRoleGuard],
  controllers: [AuthController, AuthHeaderController],
  exports: [JwtServiceShared, AuthorizationRoleGuard],
})
export class AuthModule {}
