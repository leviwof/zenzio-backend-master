import { Response } from 'express';

export interface LogoutResponse {
  status: 'success';
  code: number;
  data: { message: string };
  meta: { timestamp: string };
}

/**
 * Clears authentication cookies and returns a structured response
 */
export class LogoutUtil {
  static performLogout(res: Response): LogoutResponse {
    // Clear cookies
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

    return {
      status: 'success',
      code: 200,
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
