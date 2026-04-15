// src/auth/firebase-auth.guard.ts
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
      throw new UnauthorizedException('No token provided 15');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log({ decodedToken });
      // Map Firebase token to JwtUserInt type
      const user: JwtUserInt = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        role: 'user', // default role or fetch from your DB
        userId: decodedToken.uid, // optional mapping
      };

      request['user'] = user; // attach typed user to request
      console.log('Firebase user:', user);

      return true;
    } catch (err) {
      console.error('Firebase token verification failed', err);
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
