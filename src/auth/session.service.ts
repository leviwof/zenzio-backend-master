import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { User } from '../users/user.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
// import { Fleet } from 'src/fleet/fleet.entity';
// Fleet

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) { }

  // ==============================================================
  // ✅ USER SESSION MANAGEMENT
  // ==============================================================

  async createSession(user: User, refreshToken: string): Promise<Session> {
    const session = new Session();
    session.user = user;
    session.userId = user.id;
    session.refreshToken = refreshToken;
    return await this.sessionRepository.save(session);
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { refreshToken } });
    if (!session) {
      throw new NotFoundException('User session not found');
    }
    return session;
  }

  async deleteSession(refreshToken: string): Promise<void> {
    const session = await this.findSessionByRefreshToken(refreshToken);
    await this.sessionRepository.remove(session);
  }

  async deleteSessionsForUser(userUid: string): Promise<void> {
    await this.sessionRepository.delete({ userUid });
  }

  // ==============================================================
  // ✅ RESTAURANT SESSION MANAGEMENT
  // ==============================================================

  async createRestaurantSession(restaurant: Restaurant, refreshToken: string): Promise<Session> {
    const session = new Session();
    session.restaurant = restaurant;
    session.restaurantId = restaurant.id;
    session.refreshToken = refreshToken;
    return await this.sessionRepository.save(session);
  }

  async findRestaurantSessionByRefreshToken(refreshToken: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { refreshToken } });
    if (!session) {
      throw new NotFoundException('Restaurant session not found');
    }
    return session;
  }

  async deleteRestaurantSession(refreshToken: string): Promise<void> {
    const session = await this.findRestaurantSessionByRefreshToken(refreshToken);
    await this.sessionRepository.remove(session);
  }

  // ==============================================================
  // ✅ FLEET SESSION MANAGEMENT (NEW)
  // ==============================================================

  async createFleetSession(fleet: Fleet, refreshToken: string): Promise<Session> {
    const session = new Session();
    session.fleet = fleet;
    session.fleetId = fleet.id;
    session.refreshToken = refreshToken;
    return await this.sessionRepository.save(session);
  }

  async findFleetSessionByRefreshToken(refreshToken: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { refreshToken } });
    if (!session) {
      throw new NotFoundException('Fleet session not found');
    }
    return session;
  }

  async deleteFleetSession(refreshToken: string): Promise<void> {
    const session = await this.findFleetSessionByRefreshToken(refreshToken);
    await this.sessionRepository.remove(session);
  }
}
