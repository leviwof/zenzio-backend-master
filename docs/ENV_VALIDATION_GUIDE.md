# Environment Variable Validation Guide

## Overview

The application now validates all required environment variables on startup. If any required variable is missing or invalid, **the application will fail to start** with detailed error messages.

This prevents runtime errors and ensures proper configuration before the application accepts requests.

---

## What Gets Validated?

### ✅ Required Variables (Application won't start without these)

**Authentication & Security:**
- `JWT_ACCESS_SECRET` - Min 32 characters
- `JWT_REFRESH_SECRET` - Min 32 characters  
- `APP_CLIENT_ID` - Must be valid UUID
- `APP_CLIENT_SECRET` - Min 32 characters
- `APP_ENCRYPTION_SECRET` - Min 32 characters
- `APP_ENCRYPTION_IV` - Exactly 16 characters

**Database:**
- `DATABASE_URL` - Must be valid PostgreSQL URI

**Third-Party Services:**
- `FIREBASE_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `AWS_ACCESS_KEY`
- `AWS_SECRET_KEY`
- `AWS_BUCKET_NAME`
- `AWS_ENDPOINT` - Must be valid URL
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `FAST2SMS_API_KEY`

**Email:**
- `MAIL_HOST`
- `MAIL_USER` - Must be valid email
- `MAIL_PASS`
- `SUPPORT_EMAIL` - Must be valid email
- `SUPPORT_REPLY_EMAIL` - Must be valid email

**CORS & Frontend:**
- `CORS_ORIGIN` - Comma-separated URLs
- `FRONTEND_RESET_REDIRECT` - Must be valid URL
- `EMAIL_VERIFICATION_REDIRECT_URL` - Must be valid URL

### 📋 Optional Variables (Have defaults)

- `NODE_ENV` - Default: `development`
- `PORT` - Default: `4000`
- `JWT_ACCESS_TOKEN_EXPIRE` - Default: `15m`
- `JWT_REFRESH_TOKEN_EXPIRE` - Default: `7d`
- `DB_SSL` - Default: `false`
- `AWS_REGION` - Default: `ap-south-1`
- `AWS_API_VERSION` - Default: `2006-03-01`
- `MAIL_PORT` - Default: `587`
- `MAIL_SECURE` - Default: `false`
- `REDIS_HOST` - Default: `127.0.0.1`
- `REDIS_PORT` - Default: `6379`
- `REDIS_PASSWORD` - Optional (can be empty)
- `PLATFORM_FEE_PERCENT` - Default: `8`
- `APP_MODE` - Default: `development`

---

## Example Error Messages

### Missing Required Variable

```bash
$ npm start

Error: Config validation error: "JWT_ACCESS_SECRET" is required
    at AppModule.onModuleInit
    
✗ Application failed to start

Fix: Add JWT_ACCESS_SECRET to your .env file
```

### Invalid Format

```bash
$ npm start

Error: Config validation error: "APP_CLIENT_ID" must be a valid GUID
    Value: "not-a-uuid"
    
✗ Application failed to start

Fix: APP_CLIENT_ID must be a valid UUID format (e.g., 4197a0e1-6e3f-4452-8381-d391f60f8154)
```

### Multiple Errors

```bash
$ npm start

Error: Config validation errors:
  - "JWT_ACCESS_SECRET" is required
  - "DATABASE_URL" must be a valid URI with scheme postgres or postgresql
  - "MAIL_USER" must be a valid email
  - "PORT" must be a port (1-65535)
  
✗ Application failed to start

Fix: Correct all errors listed above in your .env file
```

---

## Setting Up Your Environment

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secrets (min 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate client secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption IV (exactly 16 characters)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"

# Generate client ID (UUID)
node -e "console.log(require('crypto').randomUUID())"
```

### 3. Fill in All Required Values

Edit `.env` and replace all placeholder values with real credentials:

```env
# ✅ Example of properly configured variables
JWT_ACCESS_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
APP_CLIENT_ID=4197a0e1-6e3f-4452-8381-d391f60f8154
APP_CLIENT_SECRET=supersecretkey32charactersorlonger123456
APP_ENCRYPTION_IV=1234567890abcdef
APP_ENCRYPTION_SECRET=anothersupersecretkey32charactersormore

DATABASE_URL=postgresql://user:password@localhost:5432/zenzio

# ... and so on
```

### 4. Verify Configuration

```bash
# Start the application - it will validate on startup
npm run start:dev

# Look for this message:
# ✅ Environment validation passed
# 🚀 Server running on http://0.0.0.0:4000
```

---

## Production Checklist

Before deploying to production:

- [ ] All required environment variables are set
- [ ] Secrets are cryptographically secure (min 32 chars)
- [ ] `NODE_ENV=production`
- [ ] Database URL points to production database
- [ ] CORS origins include all production frontend URLs
- [ ] Email configuration is correct (test emails work)
- [ ] SMS API keys are production keys (not test)
- [ ] Payment gateway keys are production keys
- [ ] AWS S3 bucket is configured correctly
- [ ] Firebase configuration is for production project
- [ ] All secrets are stored securely (not in git)

---

## Security Best Practices

### ✅ DO:

- Generate long, random secrets (32+ characters)
- Use different secrets for each environment (dev, staging, prod)
- Store secrets in environment variables or secret management service
- Rotate secrets periodically (every 90 days)
- Use strong passwords for database and email accounts
- Restrict API keys to specific IP addresses where possible
- Enable MFA on all third-party service accounts

### ❌ DON'T:

- Never commit `.env` file to git
- Never use the same secrets across environments
- Never hardcode secrets in source code
- Never share secrets via email or Slack
- Never use short or simple secrets
- Never reuse secrets from other projects
- Never expose secrets in logs or error messages

---

## Troubleshooting

### Application won't start

**Problem**: Application fails with validation error  
**Solution**: Check error message for specific missing/invalid variable, then fix in `.env`

### Can't find .env file

**Problem**: `Config validation error: "JWT_ACCESS_SECRET" is required`  
**Solution**: 
```bash
# Verify .env exists
ls -la .env

# If not, copy from example
cp .env.example .env
```

### Database connection fails despite valid DATABASE_URL

**Problem**: Connection error even though DATABASE_URL is set  
**Solution**: 
- Verify database is running: `pg_isready`
- Check credentials are correct
- Ensure database exists: `psql -c "\l"`
- Verify network connectivity to database server

### CORS errors even with CORS_ORIGIN set

**Problem**: CORS blocking requests  
**Solution**:
- Ensure CORS_ORIGIN includes the exact origin (including protocol and port)
- No trailing slashes in URLs
- Use commas without spaces: `http://localhost:3000,http://localhost:5173`

---

## Environment Variable Reference

See `src/config/env.validation.ts` for the complete validation schema including:
- Allowed formats for each variable
- Default values
- Required vs optional
- Validation rules (min length, email format, UUID format, etc.)

---

## Testing Validation

### Test Missing Variable

```bash
# Remove a required variable temporarily
cp .env .env.backup
grep -v "JWT_ACCESS_SECRET" .env > .env.tmp && mv .env.tmp .env

# Try to start - should fail
npm run start:dev

# Restore
mv .env.backup .env
```

### Test Invalid Format

```bash
# Set invalid UUID
echo "APP_CLIENT_ID=not-a-uuid" >> .env

# Try to start - should fail with format error
npm run start:dev

# Fix it
# Edit .env and set correct UUID
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Validate Environment
        run: |
          # Create .env from secrets
          echo "JWT_ACCESS_SECRET=${{ secrets.JWT_ACCESS_SECRET }}" >> .env
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> .env
          # ... add all required variables
          
          # Validate (will fail build if invalid)
          npm install
          npm run build
```

---

**Last Updated**: 2026-05-04  
**Maintained By**: Development Team  
**Related**: `.env.example`, `src/config/env.validation.ts`
