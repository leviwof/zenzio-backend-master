import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import { JwtUserInt } from 'src/constants/app.interface';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided 13');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Map Firebase token to JwtUserInt
      const user: JwtUserInt = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        role: 'user', // Assign a default role or fetch from DB
        userId: decodedToken.uid, // optional mapping
      };

      request.user = user;
      console.log('Firebase user:', user);

      return true;
    } catch (err) {
      console.error('Firebase verification failed', err);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return null;
  }
}
