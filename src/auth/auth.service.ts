import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {}

  logout(): string {
    // No Redis — nothing to delete
    return 'Logout successful';
  }
}
