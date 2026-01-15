# Quick Fix: Twilio Trial Account SMS Restriction

## ❌ Current Error
```
Error: Permission to send an SMS has not been enabled for the region indicated by the 'To' number: +91781400XXXX
Code: 21408
```

## 🔍 Root Cause
Your Twilio account is in **Trial mode**. Trial accounts can only send SMS to:
- Verified phone numbers that you've added in Twilio Console
- The phone number cannot be in a geo-blocked region

## ✅ Solutions

### Option 1: Verify Your Phone Number in Twilio (Quick - 2 minutes)

1. **Go to Twilio Console**: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

2. **Click "Add a new number"** (Red + button)

3. **Enter your phone number** (e.g., +919876543210)

4. **Verify it via SMS or Call** - You'll receive a code from Twilio

5. **Test again** - Now your number will work!

### Option 2: Enable India SMS for Trial Account

1. **Go to**: https://console.twilio.com/us1/develop/sms/settings/geo-permissions

2. **Check if India is enabled** for SMS

3. **If not, enable it**

4. **Important**: Even with geo-permissions, trial accounts still need verified numbers!

### Option 3: Upgrade to Paid Account (For Production)

1. **Go to Billing**: https://console.twilio.com/us1/billing

2. **Upgrade your account** (removes all restrictions)

3. **Add payment method**

4. **Now you can send to ANY number!**

### Option 4: Development Mode (No SMS, Console Only)

Already implemented in your code! If you want to test without sending SMS:

**Temporarily comment out the SMS_PROVIDER in .env.local:**
```bash
# SMS_PROVIDER=twilio
```

Then the system will:
- Log OTP to console (visible in terminal)
- Return OTP in API response during development
- No actual SMS sent

## 🚀 Recommended Approach

For **development/testing**:
1. Verify 2-3 phone numbers in Twilio Console (yours and test numbers)
2. Use those numbers for testing

For **production**:
1. Upgrade Twilio account to paid
2. Add billing information
3. Remove trial restrictions

## 📋 Quick Action Steps

**Right Now** (to test immediately):
```bash
# In terminal, stop the dev server (Ctrl+C)
# Then edit .env.local and comment out:
# SMS_PROVIDER=twilio

# Restart dev server
bun dev
```

Now the OTP will appear in your terminal when you test!

**For Real SMS** (5 minutes):
1. Open: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Add your phone number (+91...)
3. Verify it
4. Test signup again - SMS will work! 📱

## 🔗 More Info
- Error 21408: https://www.twilio.com/docs/errors/21408
- Verify Phone Numbers: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Geo Permissions: https://console.twilio.com/us1/develop/sms/settings/geo-permissions
