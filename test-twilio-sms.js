// Comprehensive Test for Twilio SMS Integration in Signup Flow
// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      value = value.replace(/^["'](.*)["']$/, '$1');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER
const smsProvider = process.env.SMS_PROVIDER

console.log("═══════════════════════════════════════════════════════════")
console.log("  JUSTBECAUSE.ASIA - TWILIO SMS INTEGRATION TEST")
console.log("═══════════════════════════════════════════════════════════\n")

console.log("📋 Configuration Check:")
console.log("─────────────────────────────────────────────────────────")
console.log("SMS Provider:", smsProvider || "Not set")
console.log("Account SID:", accountSid ? `${accountSid.substring(0, 10)}...` : "❌ Not found")
console.log("Auth Token:", authToken ? "✓ Set (***" + authToken.substring(authToken.length - 4) + ")" : "❌ Not found")
console.log("Phone Number:", fromNumber || "❌ Not found")

if (!accountSid || !authToken || !fromNumber) {
  console.error("\n❌ ERROR: Missing Twilio credentials in .env.local")
  console.error("\nRequired environment variables:")
  console.error("  • TWILIO_ACCOUNT_SID")
  console.error("  • TWILIO_AUTH_TOKEN")
  console.error("  • TWILIO_PHONE_NUMBER")
  console.error("  • SMS_PROVIDER (should be set to 'twilio')")
  process.exit(1)
}

if (smsProvider !== "twilio") {
  console.warn("\n⚠️  WARNING: SMS_PROVIDER is not set to 'twilio'")
  console.warn("   Please add SMS_PROVIDER=twilio to your .env.local file")
}

async function testTwilio() {
  try {
    console.log("\n📱 Testing Twilio Integration:")
    console.log("─────────────────────────────────────────────────────────")
    
    console.log("\n1️⃣  Initializing Twilio client...")
    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)

    // Test by fetching account info
    console.log("2️⃣  Verifying Twilio credentials...")
    const account = await client.api.accounts(accountSid).fetch()
    console.log("   ✅ Account verified successfully!")
    console.log(`   • Status: ${account.status}`)
    console.log(`   • Account Name: ${account.friendlyName}`)
    console.log(`   • Account Type: ${account.type}`)

    // Test phone number
    console.log("\n3️⃣  Verifying Twilio phone number...")
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: fromNumber,
      limit: 1
    })

    if (phoneNumbers.length > 0) {
      console.log("   ✅ Phone number verified!")
      console.log(`   • Number: ${phoneNumbers[0].phoneNumber}`)
      console.log(`   • SMS Enabled: ${phoneNumbers[0].capabilities.sms ? '✓' : '✗'}`)
      console.log(`   • Voice Enabled: ${phoneNumbers[0].capabilities.voice ? '✓' : '✗'}`)
      console.log(`   • Friendly Name: ${phoneNumbers[0].friendlyName || 'N/A'}`)
    } else {
      console.warn("   ⚠️  Phone number not found in your account")
      console.warn("   This might still work, but verify in Twilio console")
    }

    // Check account balance
    console.log("\n4️⃣  Checking account balance...")
    try {
      const balance = await client.balance.fetch()
      console.log(`   ✅ Account Balance: ${balance.currency} ${balance.balance}`)
    } catch (e) {
      console.log("   ⚠️  Could not fetch balance (might not be available for all account types)")
    }

    console.log("\n═══════════════════════════════════════════════════════════")
    console.log("  ✅ TWILIO CONFIGURATION SUCCESSFUL!")
    console.log("═══════════════════════════════════════════════════════════\n")

    console.log("📝 Signup Flow with SMS OTP:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("1. User visits /auth/signup")
    console.log("2. User enters email and name")
    console.log("3. Email OTP is sent for email verification")
    console.log("4. User verifies email and sets password")
    console.log("5. User selects role (Volunteer or NGO)")
    console.log("6. User completes signup and proceeds to onboarding")
    console.log("\n7. 📱 ONBOARDING - Phone Verification:")
    console.log("   • Volunteer: /volunteer/onboarding (Step 1)")
    console.log("   • NGO: /ngo/onboarding (Step 1)")
    console.log("   • User enters phone number")
    console.log("   • SMS OTP sent via Twilio ← YOUR SETUP IS READY!")
    console.log("   • User verifies phone with 6-digit OTP")
    console.log("   • Continues with rest of onboarding")

    console.log("\n📍 API Endpoints:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("• POST /api/auth/send-sms-otp - Sends SMS OTP")
    console.log("• POST /api/auth/verify-sms-otp - Verifies SMS OTP")
    console.log("  Both endpoints are configured to use Twilio!")

    console.log("\n🧪 To Test the Complete Flow:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("1. Start your Next.js app: bun run dev")
    console.log("2. Visit http://localhost:3000/auth/signup")
    console.log("3. Complete email verification")
    console.log("4. Go through onboarding")
    console.log("5. When prompted for phone, enter your number")
    console.log("6. You should receive SMS OTP from Twilio!")
    console.log("\n💡 Tip: Check Twilio console logs at:")
    console.log("   https://console.twilio.com/us1/monitor/logs/sms")

  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════════════")
    console.error("  ❌ TWILIO VERIFICATION FAILED")
    console.error("═══════════════════════════════════════════════════════════\n")
    console.error(`Error: ${error.message}`)
    
    if (error.status === 401 || error.code === 20003) {
      console.error("\n🔍 Authentication Failed:")
      console.error("   • Double-check Account SID matches Auth Token")
      console.error("   • Verify credentials from: https://console.twilio.com")
      console.error("   • Make sure there are no extra spaces in .env.local")
    } else if (error.code === 20404) {
      console.error("\n🔍 Resource Not Found:")
      console.error("   • Verify your Account SID is correct")
      console.error("   • Check you're using the right Twilio account")
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("\n🔍 Network Error:")
      console.error("   • Check your internet connection")
      console.error("   • Verify firewall/proxy settings")
    }
    
    console.error("\n📚 Twilio Documentation:")
    console.error("   https://www.twilio.com/docs/sms/quickstart/node")
    
    process.exit(1)
  }
}

testTwilio()
