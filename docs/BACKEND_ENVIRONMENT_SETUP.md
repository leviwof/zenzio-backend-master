# 🖥️ Backend Environment Setup Guide

## Overview

Setting up dev/UAT/production environments for **zenzio-backend-master**.

---

## 📁 Backend Environment Files

Create these files in your backend project:

```
zenzio-backend-master/
├── .env.development     # Local development
├── .env.uat            # UAT/Staging
├── .env.production     # Production
└── .env                # Current active (gitignored)
```

---

## 🔧 Environment Configuration

### .env.development

```env
# =============================================
# DEVELOPMENT ENVIRONMENT
# =============================================

NODE_ENV=development
PORT=3000

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/zenzio_dev
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=zenzio_dev
DB_SSL=false

# JWT Secrets (Development - 32+ chars)
JWT_ACCESS_SECRET=dev-access-secret-for-local-testing-only-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-for-local-testing-only-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Client Authentication
CLIENT_ID=b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0
CLIENT_SECRET=40073b11481b87eaa6ba4fb4b15a34c6784e1fec1079bb74b9a154b200c047f7

# CORS (Allow local frontend)
CORS_ORIGIN=http://localhost:5173

# Encryption
ENCRYPTION_KEY=dev-encryption-key-16-chars-min

# SMS/Email (Test mode)
SMS_API_KEY=test-sms-key
SMS_SENDER_ID=ZENZIO
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=test@example.com
EMAIL_PASS=test-password
EMAIL_FROM=noreply@zenzio.local

# Google OAuth (Test credentials)
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Redis (Optional for dev)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
</env>
```

### .env.uat

```env
# =============================================
# UAT (User Acceptance Testing) ENVIRONMENT
# =============================================

NODE_ENV=uat
PORT=3000

# Database (UAT PostgreSQL)
DATABASE_URL=postgresql://uat_user:UAT_PASSWORD@uat-db.example.com:5432/zenzio_uat?sslmode=require
DB_HOST=uat-db.example.com
DB_PORT=5432
DB_USERNAME=uat_user
DB_PASSWORD=UAT_PASSWORD_CHANGE_ME
DB_DATABASE=zenzio_uat
DB_SSL=true

# JWT Secrets (UAT - 64 chars recommended)
JWT_ACCESS_SECRET=uat-access-secret-64-chars-CHANGE-THIS-IN-YOUR-REAL-UAT-ENV
JWT_REFRESH_SECRET=uat-refresh-secret-64-chars-CHANGE-THIS-IN-YOUR-REAL-UAT-ENV
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Client Authentication (UAT-specific if needed)
CLIENT_ID=b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0
CLIENT_SECRET=40073b11481b87eaa6ba4fb4b15a34c6784e1fec1079bb74b9a154b200c047f7

# CORS (UAT frontend URL)
CORS_ORIGIN=https://uat-admin.zenzio.com

# Encryption
ENCRYPTION_KEY=uat-encryption-key-32-chars-min-CHANGE-THIS

# SMS/Email (Test mode or staging service)
SMS_API_KEY=uat-sms-api-key
SMS_SENDER_ID=ZENZIO
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=uat@zenzio.com
EMAIL_PASS=uat-email-password
EMAIL_FROM=noreply@uat.zenzio.com

# Google OAuth (UAT credentials)
GOOGLE_CLIENT_ID=uat-google-client-id
GOOGLE_CLIENT_SECRET=uat-google-client-secret
GOOGLE_CALLBACK_URL=https://uat-api.zenzio.com/auth/google/callback

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Redis
REDIS_HOST=uat-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=uat-redis-password

# Rate Limiting (more strict than dev)
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=50

# Logging
LOG_LEVEL=info
</env>
```

### .env.production

```env
# =============================================
# PRODUCTION ENVIRONMENT
# =============================================

NODE_ENV=production
PORT=3000

# Database (Production PostgreSQL with SSL)
DATABASE_URL=postgresql://prod_user:STRONG_PROD_PASSWORD@prod-db.example.com:5432/zenzio_prod?sslmode=require
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_USERNAME=prod_user
DB_PASSWORD=STRONG_PROD_PASSWORD_CHANGE_ME
DB_DATABASE=zenzio_prod
DB_SSL=true

# JWT Secrets (Production - MUST be 64+ chars, cryptographically secure)
JWT_ACCESS_SECRET=e7a4797c20a527db17484f7f2f7c6cf8976a96cc1da5382d95511854bc043c42
JWT_REFRESH_SECRET=94e0a05940d63fee80495b46aac1de66f06643156f62d3a4d78ca46507fa46a5
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Client Authentication (Production)
CLIENT_ID=b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0
CLIENT_SECRET=40073b11481b87eaa6ba4fb4b15a34c6784e1fec1079bb74b9a154b200c047f7

# CORS (Production frontend URL)
CORS_ORIGIN=https://admin.zenzio.com

# Encryption (64 chars minimum for production)
ENCRYPTION_KEY=prod-encryption-key-64-chars-min-CHANGE-THIS-TO-SECURE-KEY

# SMS/Email (Production service)
SMS_API_KEY=prod-sms-api-key-CHANGE-ME
SMS_SENDER_ID=ZENZIO
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@zenzio.com
EMAIL_PASS=PROD-EMAIL-PASSWORD-CHANGE-ME
EMAIL_FROM=noreply@zenzio.com

# Google OAuth (Production credentials)
GOOGLE_CLIENT_ID=prod-google-client-id-CHANGE-ME
GOOGLE_CLIENT_SECRET=prod-google-client-secret-CHANGE-ME
GOOGLE_CALLBACK_URL=https://api.zenzio.com/auth/google/callback

# File Upload (Use S3 or CDN in production)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Redis (Production)
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=PROD-REDIS-PASSWORD-CHANGE-ME

# Rate Limiting (Strict in production)
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=30

# Logging
LOG_LEVEL=warn
</env>
```

---

## 🚀 Usage

### Local Development:
```bash
cd zenzio-backend-master

# Copy development template
cp .env.development .env

# Start development server
npm run start:dev
```

### UAT Testing:
```bash
# On UAT server
cp .env.uat .env

# Update credentials in .env
nano .env

# Run migrations
npm run migration:run

# Start server
npm run start:prod
# or with PM2
pm2 start npm --name "zenzio-backend-uat" -- run start:prod
```

### Production:
```bash
# On production server
cp .env.production .env

# Update all CHANGE_ME values
nano .env

# IMPORTANT: Verify all secrets are secure
grep "CHANGE" .env  # Should return nothing

# Run migrations
npm run migration:run

# Start server
pm2 start npm --name "zenzio-backend" -- run start:prod
```

---

## 🔐 Security Checklist

### Before UAT Deployment:
- [ ] Generate new JWT secrets (64 chars minimum)
- [ ] Update database credentials
- [ ] Configure CORS for UAT domain
- [ ] Use SSL for database connection
- [ ] Update email/SMS credentials
- [ ] Set appropriate rate limits
- [ ] Use info-level logging

### Before Production Deployment:
- [ ] **CRITICAL:** Generate unique production JWT secrets
- [ ] Use strong database passwords (20+ chars)
- [ ] Enable database SSL (sslmode=require)
- [ ] Configure production CORS domain only
- [ ] Use production email/SMS service
- [ ] Set strict rate limits
- [ ] Use warn/error level logging
- [ ] Enable Redis for session management
- [ ] Configure file uploads to S3/CDN
- [ ] Backup database before deployment

---

## 🔑 Generate Secure Secrets

### JWT Secrets (64 chars):
```bash
# Generate access secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate refresh secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Encryption Key (32 chars):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Strong Password (32 chars):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

---

## 📊 Environment Comparison

| Feature | Development | UAT | Production |
|---------|-------------|-----|------------|
| Database | Local PostgreSQL | UAT DB (SSL) | Production DB (SSL) |
| JWT Secrets | Simple (32 chars) | Secure (64 chars) | Secure (64 chars) |
| CORS | localhost:5173 | uat-admin.zenzio.com | admin.zenzio.com |
| Logging | debug | info | warn |
| Rate Limit | 100/min | 50/min | 30/min |
| DB SSL | false | true | true |
| Redis | Optional | Required | Required |
| File Storage | Local | Local/S3 | S3/CDN |

---

## 🧪 Testing Each Environment

### Development:
```bash
# Start backend
npm run start:dev

# Test health check
curl http://localhost:3000/health

# Test login (should work)
curl -X POST http://localhost:3000/super-admin/login \
  -H "Content-Type: application/json" \
  -H "clientId: b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0" \
  -d '{"email":"admin@zenzio.in","password":"Admin@123","role":"1"}'
```

### UAT:
```bash
# Test health check
curl https://uat-api.zenzio.com/health

# Test login
curl -X POST https://uat-api.zenzio.com/super-admin/login \
  -H "Content-Type: application/json" \
  -H "clientId: b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0" \
  -d '{"email":"admin@zenzio.in","password":"Admin@123","role":"1"}'

# Check logs
pm2 logs zenzio-backend-uat --lines 50
```

### Production:
```bash
# Test health check
curl https://api.zenzio.com/health

# Check PM2 status
pm2 status

# Monitor logs
pm2 logs zenzio-backend --lines 100
```

---

## 🔄 Deployment Workflow

### 1. Local Development:
```bash
# Use .env.development
cp .env.development .env
npm run start:dev

# Test locally
npm run test
```

### 2. Deploy to UAT:
```bash
# SSH to UAT server
ssh ubuntu@uat-server

# Pull latest code
cd /var/www/backend-uat
git pull origin main

# Use UAT environment
cp .env.uat .env

# Install dependencies
npm install

# Run migrations
npm run migration:run

# Restart server
pm2 restart zenzio-backend-uat

# Verify
curl https://uat-api.zenzio.com/health
```

### 3. Deploy to Production:
```bash
# After UAT testing passes

# SSH to production server
ssh ubuntu@prod-server

# Pull latest code
cd /var/www/backend
git pull origin main

# Use production environment
cp .env.production .env

# Install dependencies
npm ci --production

# Run migrations
npm run migration:run

# Restart with zero downtime
pm2 reload zenzio-backend

# Verify
curl https://api.zenzio.com/health
pm2 logs zenzio-backend --lines 50
```

---

## 🐛 Troubleshooting

### Issue: JWT secrets too short
```bash
# Check secret length
node -e "console.log(process.env.JWT_ACCESS_SECRET.length)"
# Should be >= 32 (64 recommended for production)

# Generate new one
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: Database connection failed
```bash
# Test database connection
psql "$DATABASE_URL"

# Check SSL requirement
# If error about SSL, add ?sslmode=require to DATABASE_URL
```

### Issue: CORS errors
```bash
# Check CORS_ORIGIN matches frontend URL
echo $CORS_ORIGIN

# Update in .env
CORS_ORIGIN=https://admin.zenzio.com
```

### Issue: Wrong environment loaded
```bash
# Check which .env is active
cat .env | head -5

# Copy correct environment
cp .env.production .env
```

---

## 📋 Pre-Deployment Checklist

### UAT Deployment:
- [ ] UAT server provisioned
- [ ] UAT database created
- [ ] `.env.uat` file configured
- [ ] All CHANGE_ME values updated
- [ ] CORS configured for UAT domain
- [ ] SSL certificates installed
- [ ] DNS pointing to UAT server
- [ ] Migrations tested
- [ ] Backend health check passes
- [ ] Frontend can connect to UAT backend

### Production Deployment:
- [ ] UAT testing completed and approved
- [ ] Production server provisioned
- [ ] Production database created and backed up
- [ ] `.env.production` file configured
- [ ] **All secrets are unique and secure**
- [ ] CORS configured for production domain only
- [ ] SSL certificates installed (production)
- [ ] DNS pointing to production server
- [ ] Redis configured and running
- [ ] PM2 configured for auto-restart
- [ ] Monitoring/alerts set up
- [ ] Backup strategy in place
- [ ] Rollback plan prepared
- [ ] Users notified of maintenance window (if needed)

---

## 🎉 Summary

**You now have:**
✅ Three environment configurations
✅ Security-hardened production setup
✅ Clear deployment workflow
✅ Testing strategy for each environment
✅ Troubleshooting guides

**Next steps:**
1. Copy `.env.development` locally and start testing
2. Set up UAT server with `.env.uat`
3. Test JWT fix in UAT before production
4. Deploy to production with `.env.production`

**Remember:**
- Never commit `.env` files to git
- Always use unique secrets per environment
- Test in UAT before production
- Use SSL for all non-local databases
- Monitor logs after deployment

---

**Created**: 2026-05-05  
**For**: zenzio-backend-master  
**Purpose**: Safe multi-environment backend deployment
