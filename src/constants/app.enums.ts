// src/constants/app.enums.ts

export enum Roles {
  GUEST = '-1', // not logged in
  SUPER_ADMIN = '0', // super admin of the app
  MASTER_ADMIN = '1', // admin of a particular instance
  ADMIN = '2', // admin of a particular module
  USER_FLEET = '3', // delivery fleet user
  USER_RESTAURANT = '4', // restaurant user
  USER_CUSTOMER = '5', // customer user
}

export enum WorkPrefrence {
  REMOTE = '1',
  ON_SITE = '2',
  HYBRID = '3',
}

export enum Status {
  INACTIVE = '0',
  ACTIVE = '1',
}

export enum ProviderType {
  NONE = 'none', // no login access
  PASSWORD = 'password', // login with email and passsowrd
  GOOGLE = 'google',
  APPLE = 'apple',
  PHONE = 'phone',
}

export enum VerificationFlags {
  AdminVerified = 1 << 0, // 1
  EmailVerified = 1 << 1, // 2
  MobileVerified = 1 << 2, // 4
}
