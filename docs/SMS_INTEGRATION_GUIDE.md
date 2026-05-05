# 📱 SMS OTP Integration Guide - Fast2SMS

## Overview
This guide documents the SMS OTP service using Fast2SMS provider for sending verification codes to mobile numbers.

---

## 🔧 **Setup & Configuration**

### **1. Get Fast2SMS API Key**

1. Visit: https://www.fast2sms.com/
2. Sign up for an account
3. Go to "Dev API" section
4. Copy your API key

### **2. Configure Environment Variables**

Add to your `.env` file:
```env
FAST2SMS_API_KEY=your_api_key_here
NODE_ENV=development  # or production
```

**Important:** Never commit `.env` file to git!

---

## 📋 **Implementation Details**

### **SMS Service (src/otp/sms.service.ts)**

**Features:**
- ✅ Fast2SMS Quick Route (no DLT approval needed)
- ✅ Mobile number sanitization (handles +91, 091, 10-digit formats)
- ✅ Mobile number masking for security
- ✅ Timeout protection (10 seconds)
- ✅ Comprehensive error handling
- ✅ Secure logging (OTP hidden in production)

**Provider Details:**
- **API:** Fast2SMS Bulk v2
- **Route:** Quick SMS (`route: 'q'`)
- **Language:** English
- **Timeout:** 10,000ms

---

## 🔌 **API Endpoints**

### **1. Send OTP**

```http
POST /otp/send
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**Supported Phone Formats:**
- `9876543210` (10 digits)
- `+919876543210` (with country code)
- `919876543210` (country code without +)
- `09876543210` (with leading 0)

**Success Response (Development):**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "otpDetails": {
      "identifier": "9876543210",
      "otp": "123456",
      "message": "OTP generated and sent successfully"
    }
  },
  "meta": {
    "timestamp": "2026-05-03T10:30:00.000Z",
    "otpExpiresIn": 300
  }
}
```

**Success Response (Production):**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "otpDetails": {
      "identifier": "9876543210",
      "message": "OTP generated and sent successfully"
    }
  },
  "meta": {
    "timestamp": "2026-05-03T10:30:00.000Z",
    "otpExpiresIn": 300
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "code": 500,
  "data": {
    "message": "Failed to send OTP",
    "error": "API key invalid or expired"
  },
  "meta": {
    "timestamp": "2026-05-03T10:30:00.000Z"
  }
}
```

---

### **2. Verify OTP**

```http
POST /otp/verify
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Success Response:**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "message": "OTP verified successfully"
  },
  "meta": {
    "timestamp": "2026-05-03T10:35:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "code": 400,
  "data": {
    "message": "Invalid or expired OTP"
  },
  "meta": {
    "timestamp": "2026-05-03T10:35:00.000Z"
  }
}
```

---

## 🔒 **Security Features**

### **1. OTP Not Logged in Production**

```typescript
// Development: Logs OTP for debugging
[OTP] Sending OTP to 9876543210: 123456

// Production: OTP hidden
[OTP] Sending OTP to 9876543210
```

### **2. Mobile Number Masking**

```typescript
// Original: 9876543210
// Logged:   98765XXXXX
```

### **3. OTP Not Returned in Production API Response**

- **Development:** Returns OTP in response for testing
- **Production:** OTP only sent via SMS, not returned

### **4. Environment-Based Behavior**

Set `NODE_ENV` in your `.env`:
```env
NODE_ENV=development  # Shows OTP in logs and API response
NODE_ENV=production   # Hides OTP from logs and API response
```

---

## 📱 **Phone Number Sanitization**

The service automatically handles various phone formats:

| Input | Sanitized Output | Valid |
|-------|-----------------|-------|
| `9876543210` | `9876543210` | ✅ |
| `+919876543210` | `9876543210` | ✅ |
| `919876543210` | `9876543210` | ✅ |
| `09876543210` | `9876543210` | ✅ |
| `(987) 654-3210` | `9876543210` | ✅ |

**Logic:**
```typescript
private sanitizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, ''); // Remove non-digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}
```

---

## 🧪 **Testing**

### **Test with Postman/cURL**

**1. Send OTP:**
```bash
curl -X POST http://localhost:3000/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

**2. Verify OTP:**
```bash
curl -X POST http://localhost:3000/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

### **Test with Development Mode**

Set in `.env`:
```env
NODE_ENV=development
```

Response will include OTP:
```json
{
  "data": {
    "otpDetails": {
      "identifier": "9876543210",
      "otp": "123456",  // ✅ Included in dev mode
      "message": "OTP generated and sent successfully"
    }
  }
}
```

---

## 🐛 **Troubleshooting**

### **Issue 1: SMS Not Received**

**Check:**
1. ✅ API key is correct in `.env`
2. ✅ Fast2SMS account has sufficient balance
3. ✅ Phone number is valid Indian number (10 digits)
4. ✅ Check server logs for error messages

**Common Errors:**
- `"API key invalid"` → Check `FAST2SMS_API_KEY` in `.env`
- `"Insufficient balance"` → Recharge Fast2SMS account
- `"Invalid phone number"` → Must be valid 10-digit Indian number

### **Issue 2: OTP Not Visible in Response**

**Cause:** Running in production mode

**Solution:** 
- For testing: Set `NODE_ENV=development` in `.env`
- For production: OTP should NOT be in response (security feature)

### **Issue 3: Timeout Errors**

**Cause:** Fast2SMS API taking too long

**Check:**
1. Internet connectivity
2. Fast2SMS service status
3. Increase timeout if needed:
```typescript
timeout: 15_000, // Increase to 15 seconds
```

---

## 📊 **Fast2SMS Dashboard**

Monitor your SMS usage:
- **URL:** https://www.fast2sms.com/dashboard
- **Check:** Balance, delivery reports, API logs

---

## 🔄 **Migration from SMS India Hub**

### **Old Configuration (Removed):**
```env
SMS_API_URL=http://cloud.smsindiahub.in/api/mt/SendSMS
SMS_API_KEY=...
SMS_SENDER_ID=SMSHUB
SMS_DLT_TEMPLATE_ID=...
SMS_PEID=...
```

### **New Configuration:**
```env
FAST2SMS_API_KEY=your_api_key_here
```

**Why We Switched:**
- ✅ Fast2SMS Quick Route doesn't require DLT approval
- ✅ Simpler API integration
- ✅ Works immediately after signup
- ✅ Better documentation and support

---

## 📝 **OTP Storage**

### **Database Schema:**
```sql
CREATE TABLE otp_entity (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **OTP Lifecycle:**
1. **Generated:** 6-digit random number
2. **Expires:** 5 minutes (300 seconds)
3. **Stored:** In database for verification
4. **Verified:** Marked as `is_verified = true`
5. **Cleanup:** Old OTPs should be cleaned periodically

---

## 🔐 **Security Best Practices**

### **✅ DO:**
- ✅ Use environment variables for API keys
- ✅ Hide OTP from logs in production
- ✅ Mask mobile numbers in logs
- ✅ Set OTP expiry (5 minutes)
- ✅ Rate limit OTP endpoints
- ✅ Validate phone numbers
- ✅ Use HTTPS in production

### **❌ DON'T:**
- ❌ Commit API keys to git
- ❌ Log full mobile numbers
- ❌ Return OTP in production API response
- ❌ Allow unlimited OTP requests
- ❌ Store OTP in plain text (consider hashing)
- ❌ Use same OTP for multiple requests

---

## 📊 **Rate Limiting (Recommended)**

Add rate limiting to prevent abuse:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([{
  ttl: 60000,    // 1 minute
  limit: 3,      // 3 OTP requests per minute per IP
}])
```

---

## 🚀 **Production Checklist**

Before deploying:
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Verify `FAST2SMS_API_KEY` is correct
- [ ] Test OTP sending in production
- [ ] Verify OTP is NOT logged
- [ ] Verify OTP is NOT in API response
- [ ] Set up monitoring/alerts for SMS failures
- [ ] Configure rate limiting
- [ ] Set up OTP cleanup cron job
- [ ] Test with various phone formats
- [ ] Check Fast2SMS dashboard for delivery status

---

## 📞 **Support**

### **Fast2SMS:**
- Website: https://www.fast2sms.com
- Support: https://www.fast2sms.com/support
- Docs: https://www.fast2sms.com/docs

### **Backend Issues:**
- Check server logs
- Verify `.env` configuration
- Test API endpoint directly
- Review Fast2SMS dashboard

---

**Last Updated:** 2026-05-03  
**Provider:** Fast2SMS  
**Service:** SMS OTP Verification
