import { Request } from 'express';

export interface AuthUser {
  uid: string;
  role: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

interface RequestWithUser extends Request {
  user?: { uid: string; role: string; [key: string]: any };
}
