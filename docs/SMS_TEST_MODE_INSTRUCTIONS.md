# 🧪 Fast2SMS Test Mode Instructions

## ⚠️ **Current Issue**

Your Fast2SMS account requires a **minimum recharge of ₹100** before you can use the API.

**Error:**
```
status_code: 999
message: "You need to complete one transaction of 100 INR or more before using API route."
```

---

## ✅ **SOLUTION 1: Recharge Fast2SMS Account** (PERMANENT FIX)

### **Steps:**

1. **Login to Fast2SMS:**
   ```
   https://www.fast2sms.com/login
   ```

2. **Go to Recharge Section:**
   - Click on "Recharge" or "Add Balance"
   - Minimum: ₹100 INR
   - Recommended: ₹500 or ₹1000 for production

3. **Complete Payment:**
   - Choose payment method
   - Complete transaction
   - Wait 5-10 minutes for activation

4. **Verify Balance:**
   ```
   https://www.fast2sms.com/dashboard
   ```
   - Check balance shows ₹100+
   - API access should be enabled

5. **Test OTP Sending:**
   ```bash
   # Disable test mode
   SMS_TEST_MODE=false
   
   # Test with real SMS
   curl -X POST http://your-server.com/otp/send \
     -H "Content-Type: application/json" \
     -d '{"phone":"YOUR_NUMBER"}'
   ```

---

## 🧪 **SOLUTION 2: Use Test Mode** (TEMPORARY)

While waiting for recharge, enable test mode to continue development:

### **Step 1: Update .env**

```env
# Enable test mode (bypasses Fast2SMS, logs OTP only)
SMS_TEST_MODE=true

# Keep your API key for when you recharge
FAST2SMS_API_KEY=QqSkpwILfR4Cb2xZOXYyderjznKVWBUG1l0tiNMcsPgoA6TEu92MlfnrD5eQCdwNxGuHmobZVWFI6g1t

# Set to development to see OTPs in response
NODE_ENV=development
```

### **Step 2: Restart Server**

```bash
pm2 restart backend
# or
npm run start:dev
```

### **Step 3: Test OTP Flow**

```bash
# Send OTP request
curl -X POST http://localhost:3000/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

**Expected Response:**
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

**Server Logs:**
```
🧪 TEST MODE: OTP 123456 for 98765XXXXX (SMS not actually sent)
```

### **Step 4: Verify OTP**

Use the OTP from the response to verify:

```bash
curl -X POST http://localhost:3000/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

---

## 📋 **Environment Variable Reference**

### **Production (After Recharge):**
```env
SMS_TEST_MODE=false
FAST2SMS_API_KEY=your_api_key_here
NODE_ENV=production
```

### **Development (Test Mode):**
```env
SMS_TEST_MODE=true
FAST2SMS_API_KEY=your_api_key_here
NODE_ENV=development
```

---

## 🔍 **How Test Mode Works**

When `SMS_TEST_MODE=true`:

1. ✅ **No API Call** - Bypasses Fast2SMS completely
2. ✅ **OTP Generated** - Still creates 6-digit OTP
3. ✅ **Database Saved** - OTP stored for verification
4. ✅ **Returns OTP** - OTP included in API response (dev only)
5. ✅ **Logs Warning** - Shows test mode in logs
6. ✅ **Verification Works** - Can still verify OTPs

**What's Skipped:**
- ❌ No actual SMS sent to phone
- ❌ No Fast2SMS API call
- ❌ No balance deducted

---

## 🚀 **When to Use Each Mode**

### **Use TEST MODE When:**
- ✅ Fast2SMS account not recharged yet
- ✅ Developing/testing locally
- ✅ Running integration tests
- ✅ Don't want to waste SMS credits

### **Use PRODUCTION MODE When:**
- ✅ Fast2SMS account recharged (₹100+)
- ✅ Deploying to staging/production
- ✅ Need to send real SMS to users
- ✅ Ready for live testing

---

## ⚠️ **IMPORTANT NOTES**

### **Security:**
- 🔒 Test mode should **NEVER** be enabled in production
- 🔒 Always verify `SMS_TEST_MODE=false` before deploying
- 🔒 OTPs in test mode are still valid for verification

### **Fast2SMS Pricing:**
- ₹0.17 per SMS (promotional route)
- ₹0.25 per SMS (transactional route)
- ₹0.50 per SMS (quick route - what we use)

### **Recharge Recommendations:**
- **Minimum:** ₹100 (needed to activate)
- **Testing:** ₹500 (1000 SMS)
- **Production:** ₹2000+ (4000+ SMS)

---

## 🐛 **Troubleshooting**

### **Issue: Test mode not working**

**Check:**
```bash
# Verify environment variable
echo $SMS_TEST_MODE

# Should output: true
```

**Fix:**
```bash
# Update .env
SMS_TEST_MODE=true

# Restart server
pm2 restart backend
```

### **Issue: Still getting Fast2SMS error**

**Check:**
```bash
# Make sure test mode is enabled
cat .env | grep SMS_TEST_MODE
```

**Should show:**
```
SMS_TEST_MODE=true
```

### **Issue: OTP not in response**

**Check NODE_ENV:**
```env
NODE_ENV=development  # Shows OTP in response
NODE_ENV=production   # Hides OTP in response
```

---

## 📊 **Cost Calculation**

**Expected OTP Usage:**
- 1000 users/month × 2 OTPs = 2000 SMS
- Cost: 2000 × ₹0.50 = ₹1000/month

**Recommended Recharge:**
- Start: ₹500 (for testing)
- Production: ₹2000-5000 (monthly)

---

## ✅ **Final Checklist**

### **Before Going Live:**
- [ ] Fast2SMS account recharged (₹100+ minimum)
- [ ] Balance verified in dashboard
- [ ] Test SMS sent successfully to real number
- [ ] `SMS_TEST_MODE=false` in production .env
- [ ] `NODE_ENV=production` in production
- [ ] OTP not appearing in logs
- [ ] OTP not in API response
- [ ] Mobile numbers masked in logs

### **Current Status:**
- [x] Code is correct and working
- [ ] Fast2SMS account needs recharge ← **YOU ARE HERE**
- [ ] Test mode enabled as temporary workaround
- [ ] Ready for production after recharge

---

## 🎯 **Next Steps**

1. **Immediate (Use Test Mode):**
   ```bash
   # Add to .env
   echo "SMS_TEST_MODE=true" >> .env
   
   # Restart server
   pm2 restart backend
   ```

2. **Within 24 Hours (Recharge):**
   - Login to Fast2SMS
   - Recharge ₹100+
   - Wait for activation
   - Disable test mode
   - Test with real SMS

3. **Before Production:**
   - Set `SMS_TEST_MODE=false`
   - Set `NODE_ENV=production`
   - Verify real SMS working
   - Deploy

---

**Summary:** Your code is correct! You just need to recharge your Fast2SMS account with ₹100 to use the API. Use test mode in the meantime.
