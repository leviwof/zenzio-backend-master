// src/fleet/utils/loginUtils.ts

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FleetLoginEmailDto } from '../dto/login.dto';
import { Fleet } from '../entity/fleet.entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { SessionService } from 'src/auth/session.service';

interface LoginDeps {
  fleetRepository: Repository<Fleet>;
  firebaseService: FirebaseService;
  jwtService: JwtServiceShared;
  sessionService: SessionService;
}

export async function loginWithEmail(payload: FleetLoginEmailDto, deps: LoginDeps) {
  const { email, password } = payload;
  const { fleetRepository, firebaseService, jwtService, sessionService } = deps;

  type FirebaseLoginResponse = {
    user?: { firebase_uid: string; [key: string]: any };
    message?: string;
    details?: string[];
    [key: string]: any;
  };

  // Step 1: Try Firebase login
  const firebaseResponse = (await firebaseService.loginUser(
    email,
    password,
  )) as FirebaseLoginResponse;

  // Step 2: Handle invalid Firebase response
  if (!firebaseResponse.user) {
    const message = firebaseResponse.message || 'Invalid credentials or unverified email.';
    const details = firebaseResponse.details || [];

    throw new BadRequestException({
      statusCode: 400,
      message,
      details,
      error: 'BadRequestException',
    });
  }

  // Step 3: Check if user exists in DB
  const userInDb = await fleetRepository.findOne({
    where: { firebase_uid: firebaseResponse.user.firebase_uid },
    relations: ['contact', 'bank_details', 'address'],
  });

  if (!userInDb) {
    throw new UnauthorizedException('Fleet not registered in the application database.');
  }

  // Step 4: Prepare JWT payload
  const payloadJwt = {
    uid: userInDb.uid,
    userId: userInDb.id,
    email,
    role: userInDb.role,
  };

  // Step 5: Generate tokens
  const accessToken = jwtService.generateAccessToken(payloadJwt);
  const refreshToken = await jwtService.generateRefreshToken(payloadJwt);

  // Step 6: Save session
  // await sessionService.createSession(userInDb, refreshToken);
  await sessionService.createFleetSession(userInDb, refreshToken);

  // Step 7: Return response
  return {
    user: {
      id: userInDb.id,
      uid: userInDb.uid,
      firebase_uid: userInDb.firebase_uid,
      providerType: userInDb.providerType,
      role: userInDb.role,
      status: userInDb.status,
      verificationFlags: userInDb.verificationFlags,
      createdAt: userInDb.createdAt,
      updatedAt: userInDb.updatedAt,
    },
    accessToken,
    refreshToken,
    accessTokenExpiresIn: jwtService.getExpireInSeconds(jwtService['accessTokenExpiresIn']),
    refreshTokenExpiresIn: jwtService.getExpireInSeconds(jwtService['refreshTokenExpiresIn']),
  };
}
