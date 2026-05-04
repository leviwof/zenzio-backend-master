import * as Joi from 'joi';

/**
 * Environment Variable Validation Schema
 *
 * This schema validates all required and optional environment variables on application startup.
 * If validation fails, the application will not start and will show detailed error messages.
 */
export const envValidationSchema = Joi.object({
  // ============================================================================
  // NODE ENVIRONMENT
  // ============================================================================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('Application environment'),

  PORT: Joi.number()
    .port()
    .default(4000)
    .description('Application port'),

  // ============================================================================
  // DATABASE
  // ============================================================================
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required()
    .description('PostgreSQL connection URL'),

  DB_SSL: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable database SSL connection'),

  // ============================================================================
  // JWT AUTHENTICATION
  // ============================================================================
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT access token secret (min 32 characters)'),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret (min 32 characters)'),

  JWT_ACCESS_TOKEN_EXPIRE: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m')
    .description('JWT access token expiration (e.g., 15m, 1h, 7d)'),

  JWT_REFRESH_TOKEN_EXPIRE: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .description('JWT refresh token expiration (e.g., 7d, 30d)'),

  // ============================================================================
  // CLIENT AUTHENTICATION
  // ============================================================================
  APP_CLIENT_ID: Joi.string()
    .uuid()
    .required()
    .description('Application client ID (UUID format)'),

  APP_CLIENT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Application client secret (min 32 characters)'),

  // ============================================================================
  // ENCRYPTION
  // ============================================================================
  APP_ENCRYPTION_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Encryption secret key (min 32 characters)'),

  APP_ENCRYPTION_IV: Joi.string()
    .length(16)
    .required()
    .description('Encryption initialization vector (exactly 16 characters)'),

  // ============================================================================
  // FIREBASE
  // ============================================================================
  FIREBASE_API_KEY: Joi.string()
    .required()
    .description('Firebase API key'),

  // ============================================================================
  // GOOGLE SERVICES
  // ============================================================================
  GOOGLE_API_KEY: Joi.string()
    .optional()
    .description('Google API key (optional)'),

  GOOGLE_MAPS_API_KEY: Joi.string()
    .required()
    .description('Google Maps API key'),

  GOOGLE_CLIENT_ID: Joi.string()
    .optional()
    .description('Google OAuth client ID (optional)'),

  // ============================================================================
  // AWS S3
  // ============================================================================
  AWS_ACCESS_KEY: Joi.string()
    .required()
    .description('AWS access key ID'),

  AWS_SECRET_KEY: Joi.string()
    .required()
    .description('AWS secret access key'),

  AWS_REGION: Joi.string()
    .default('ap-south-1')
    .description('AWS region'),

  AWS_BUCKET_NAME: Joi.string()
    .required()
    .description('AWS S3 bucket name'),

  AWS_ENDPOINT: Joi.string()
    .uri()
    .required()
    .description('AWS S3 endpoint URL'),

  AWS_API_VERSION: Joi.string()
    .default('2006-03-01')
    .description('AWS API version'),

  // ============================================================================
  // PAYMENT GATEWAY (RAZORPAY)
  // ============================================================================
  RAZORPAY_KEY_ID: Joi.string()
    .required()
    .description('Razorpay key ID'),

  RAZORPAY_KEY_SECRET: Joi.string()
    .required()
    .description('Razorpay key secret'),

  // ============================================================================
  // SMS SERVICE (FAST2SMS)
  // ============================================================================
  FAST2SMS_API_KEY: Joi.string()
    .required()
    .description('Fast2SMS API key'),

  // ============================================================================
  // EMAIL SERVICE
  // ============================================================================
  MAIL_HOST: Joi.string()
    .required()
    .description('SMTP server host'),

  MAIL_PORT: Joi.number()
    .port()
    .default(587)
    .description('SMTP server port'),

  MAIL_SECURE: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable SMTP SSL/TLS'),

  MAIL_USER: Joi.string()
    .email()
    .required()
    .description('SMTP username (email)'),

  MAIL_PASS: Joi.string()
    .required()
    .description('SMTP password'),

  SUPPORT_EMAIL: Joi.string()
    .email()
    .required()
    .description('Support email address'),

  SUPPORT_REPLY_EMAIL: Joi.string()
    .email()
    .required()
    .description('Support reply-to email address'),

  // ============================================================================
  // REDIS (OPTIONAL)
  // ============================================================================
  REDIS_HOST: Joi.string()
    .default('127.0.0.1')
    .description('Redis server host'),

  REDIS_PORT: Joi.number()
    .port()
    .default(6379)
    .description('Redis server port'),

  REDIS_PASSWORD: Joi.string()
    .optional()
    .allow('')
    .description('Redis password (optional)'),

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  CORS_ORIGIN: Joi.string()
    .required()
    .description('Comma-separated list of allowed CORS origins'),

  // ============================================================================
  // FRONTEND URLS
  // ============================================================================
  FRONTEND_RESET_REDIRECT: Joi.string()
    .uri()
    .required()
    .description('Frontend password reset redirect URL'),

  EMAIL_VERIFICATION_REDIRECT_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend email verification redirect URL'),

  // ============================================================================
  // BUSINESS CONFIGURATION
  // ============================================================================
  PLATFORM_FEE_PERCENT: Joi.number()
    .min(0)
    .max(100)
    .default(8)
    .description('Platform fee percentage'),

  APP_MODE: Joi.string()
    .valid('development', 'production')
    .default('development')
    .description('Application mode'),
});

/**
 * Validation options
 */
export const envValidationOptions = {
  // Allow unknown environment variables (for system variables)
  allowUnknown: true,

  // Strip unknown environment variables from the result
  stripUnknown: false,

  // Abort early on first error (set to false to see all errors)
  abortEarly: false,
};
