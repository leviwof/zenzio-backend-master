// src/constants/app.constants.ts

/*** ROLES ***/
export const Violoations = Object.freeze({
  PG_UNIQUE: '23505',
  PG_FOREIGN_KEY: '23503',
  NOT_NULL: '23502',
} as const);

/*** ROLES ***/
export const Roles = Object.freeze({
  GUEST: '-1', // not logged in
  SUPER_ADMIN: '0', // super admin of the app
  MASTER_ADMIN: '1', // admin of a particular instance
  ADMIN: '2', // admin of a particular module
  USER_FLEET: '3', // delivery fleet user
  USER_RESTAURANT: '4', // restaurant user
  USER_CUSTOMER: '5', // customer user
} as const);

/*** MESSAGE ***/
export const ErrorMessages = Object.freeze({
  ADMIN_CREATE_INVALID_ROLE:
    'Only one Super Admin with role is allowed. For any other roles contact Admin.',
  INVALID_ADMIN_TOKEN: 'Invalid or expired token',
  ROLE_ACCESS_DENIED: 'Access denied: insufficient role',
  EMAIL_EXISTS: 'Email already registered',
} as const);
export interface AuthenticatedUser {
  id: number;
  uid: string;
  role: string;
  // other fields you want to access
}

export interface AuthenticatedUser {
  id: number;
  uid: string;
  role: string;
  // other fields you want to access
}

// All status codes
// 0 1 2 3 4
// Customer cart and order status1
export const PaymentMode = Object.freeze({
  NOT_SELECTED: { code: 0, label: 'Not Selected' },
  ONLINE: { code: 1, label: 'Any Online Payment' },
  ZENZIO_WALLET: { code: 2, label: 'Zenzio wallet' },
  COD: { code: 3, label: 'COD' },
  OTHER_WALLET: { code: 3, label: 'Other Wallets' },
} as const);
// All status codes

/*** MESSAGE ***/
export const RedisCacheKeys = Object.freeze({
  /**
   * Clear this key when updating user
   */
  REFRSH_TOKEN: (refrshToken: string) => `refresh:${refrshToken}`,
  USER_PROFILE_UID: (uid: string) => `user-profile:${uid}`,
} as const);
