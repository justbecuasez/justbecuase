# 📱 Vonage SMS Setup Guide

## ✅ What I've Done

I've added **Vonage (Nexmo) SMS provider** support to your admin settings! You can now configure it directly from your admin dashboard.

### Features Added:
- ✅ Vonage provider option in admin SMS settings
- ✅ Full integration with signup/onboarding phone verification
- ✅ Admin can configure credentials via UI (stored in database)
- ✅ Fallback to environment variables
- ✅ Better error handling

---

## 🔑 What You Need from Vonage

To get Vonage working, you need **3 things**:

### 1. **API Key** (Required)
- Example: `a1b2c3d4` or similar
- This is your Vonage account identifier

### 2. **API Secret** (Required)
- Example: `YourSecretKey123`
- This is your authentication secret

### 3. **From Number/Brand Name** (Required)
- Can be either:
  - **Brand Name**: `"JustBecause"` (alphanumeric, works in most countries)
  - **Phone Number**: `"+12403014982"` (if you have a Vonage number)
- Recommendation: Use brand name "JustBecause" - it's simpler!

---

## 📝 How to Get Vonage Credentials

### Step 1: Login to Vonage Dashboard
Visit: **https://dashboard.nexmo.com**

### Step 2: Get Your API Credentials
1. After login, you'll see your dashboard
2. Look for **"API Settings"** or **"Settings"** in the left menu
3. You'll find your:
   - **API Key** (e.g., `a1b2c3d4`)
   - **API Secret** (e.g., `YourSecretKey123`)
4. Copy both!

### Step 3: Check Your Balance
- You mentioned you have **$9 left** - that's perfect!
- Vonage SMS pricing:
  - India: ~$0.01 - $0.03 per SMS
  - USA: ~$0.01 per SMS
  - Your $9 = approximately 300-900 SMS messages

---

## ⚙️ How to Configure in Admin Dashboard

### Option 1: Via Admin UI (Recommended - Stores in Database)

1. **Start your app**:
   ```bash
   bun dev
   ```

2. **Login as Admin**:
   - Go to: http://localhost:3000/admin
   - Navigate to **Settings** → **SMS Configuration**

3. **Select Vonage**:
   - Provider: Select "Vonage (Nexmo)"
   
4. **Enter Credentials**:
   - **API Key**: [Your Vonage API Key]
   - **API Secret**: [Your Vonage API Secret]
   - **From Number/Brand**: `JustBecause` (or your phone number)

5. **Save Configuration**:
   - Click "Save SMS Configuration"
   - Test by going through signup flow!

### Option 2: Via Environment Variables (Alternative)

Add to your `.env.local`:
```bash
# Vonage SMS Configuration
VONAGE_API_KEY=your-api-key-here
VONAGE_API_SECRET=your-api-secret-here
VONAGE_FROM_NUMBER=JustBecause
SMS_PROVIDER=vonage
```

---

## 🧪 Testing Vonage SMS

### Test Complete Flow:

1. **Start Development Server**:
   ```bash
   bun dev
   ```

2. **Go to Signup**:
   - Visit: http://localhost:3000/auth/signup
   - Complete email verification
   - Select role (Volunteer or NGO)

3. **Onboarding - Phone Verification**:
   - Enter your phone number (e.g., +919876543210)
   - Click "Send OTP"
   - **You should receive SMS via Vonage!** 📱
   - Enter the 6-digit code
   - Continue with onboarding

### Check Vonage Logs:
- Dashboard: https://dashboard.nexmo.com
- Go to "Reports" → "SMS" to see sent messages
- Monitor your balance

---

## 💰 Vonage Pricing & Balance

### Your Current Status:
- Balance: **$9.00**
- Estimated SMS: **~300-900 messages** (depending on destination)

### Per-SMS Pricing:
- **India**: $0.01 - $0.03 per SMS
- **USA**: $0.01 per SMS
- **UK**: $0.04 per SMS
- **Other countries**: Varies

### Balance Alerts:
- Set up low balance alerts in Vonage dashboard
- Add more credit when needed: Dashboard → Billing

---

## 🔧 Technical Details

### How It Works:

1. **Admin configures Vonage** in settings (stored in MongoDB `system_config` collection)

2. **User signup flow**:
   - Email verification (existing)
   - Role selection (existing)
   - **Onboarding → Phone verification** (uses Vonage!)

3. **SMS OTP sending**:
   ```
   API: POST /api/auth/send-sms-otp
   → Checks Vonage config from database
   → Sends SMS via Vonage REST API
   → Returns success/error
   ```

4. **SMS OTP verification**:
   ```
   API: POST /api/auth/verify-sms-otp
   → Validates OTP from database
   → Marks phone as verified
   → User continues onboarding
   ```

### Vonage API Endpoint Used:
```
POST https://rest.nexmo.com/sms/json
Parameters:
  - api_key: Your API key
  - api_secret: Your API secret
  - to: Recipient phone (+91...)
  - from: JustBecause (brand name)
  - text: OTP message
```

### Security:
- Credentials stored **plain text in database** (as you requested)
- Only accessible by admin users
- Can be changed anytime via admin UI

---

## 🚀 Quick Start Checklist

- [ ] Get Vonage API Key from dashboard
- [ ] Get Vonage API Secret from dashboard
- [ ] Login to your admin panel
- [ ] Go to Settings → SMS Configuration
- [ ] Select "Vonage (Nexmo)"
- [ ] Enter API Key, API Secret, From Number
- [ ] Save configuration
- [ ] Test signup flow with your phone number
- [ ] Check Vonage dashboard for sent SMS

---

## ❓ FAQ

### Q: Can I use a brand name instead of phone number?
**A:** Yes! Use "JustBecause" as the from number. It works in most countries and doesn't require buying a phone number.

### Q: What if SMS fails?
**A:** Check:
- API credentials are correct
- You have sufficient balance ($9)
- Recipient country is supported
- Phone number format is correct (+countrycode...)

### Q: How do I switch from Twilio to Vonage?
**A:** Just go to admin settings, change provider from "Twilio" to "Vonage", enter Vonage credentials, and save!

### Q: Can I use both Twilio and Vonage?
**A:** You can configure both, but only one will be active at a time (based on provider selection).

### Q: Where are credentials stored?
**A:** In MongoDB database, `system_config` collection, `type: "sms"`, stored as **plain text** (as you requested).

### Q: What if I run out of balance?
**A:** Add more credit in Vonage dashboard → Billing. SMS will fail if balance is $0.

---

## 📊 Monitoring

### Check SMS Status:
1. **Vonage Dashboard**: https://dashboard.nexmo.com
   - Reports → SMS
   - See delivered, failed, pending messages

2. **Application Logs**:
   - Check terminal/console for Vonage responses
   - Success: "Vonage SMS sent successfully"
   - Error: Details of what went wrong

3. **Database**:
   - Collection: `sms_otps` (pending OTPs)
   - Collection: `verified_phones` (verified numbers)

---

## 🔗 Useful Links

- **Vonage Dashboard**: https://dashboard.nexmo.com
- **Vonage SMS API Docs**: https://developer.vonage.com/messaging/sms/overview
- **Vonage Pricing**: https://www.vonage.com/communications-apis/sms/pricing/
- **Support**: https://developer.vonage.com/support

---

## 🎉 You're All Set!

Once you add your Vonage credentials to the admin settings:
1. Users can sign up
2. Phone verification will send SMS via Vonage
3. You'll have ~300-900 SMS available with your $9 balance
4. Monitor usage in Vonage dashboard

**Current Balance: $9.00** 💰
**Estimated SMS: ~300-900** 📨

Need help? The system will show clear errors if something's wrong!
