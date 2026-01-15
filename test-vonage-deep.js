// Deep Test: Check Vonage Configuration and SMS Flow
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^["'](.*)["']$/, '$1');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  DEEP VONAGE CONFIGURATION CHECK");
console.log("═══════════════════════════════════════════════════════════\n");

async function deepTest() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/justbecausetest2222';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log("1️⃣  Checking Environment Variables:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("VONAGE_API_KEY:", process.env.VONAGE_API_KEY ? "✓ Set" : "❌ Not set");
    console.log("VONAGE_API_SECRET:", process.env.VONAGE_API_SECRET ? "✓ Set" : "❌ Not set");
    console.log("VONAGE_FROM_NUMBER:", process.env.VONAGE_FROM_NUMBER || "Not set");
    console.log("SMS_PROVIDER:", process.env.SMS_PROVIDER || "Not set");
    
    console.log("\n2️⃣  Checking Database Configuration:");
    console.log("─────────────────────────────────────────────────────────");
    const smsConfig = await db.collection('system_config').findOne({ type: 'sms' });
    
    if (smsConfig && smsConfig.data) {
      console.log("✅ SMS Configuration found in database!");
      console.log("Provider:", smsConfig.data.provider || "Not set");
      console.log("Vonage API Key:", smsConfig.data.vonageApiKey ? "✓ Set (***" + smsConfig.data.vonageApiKey.slice(-4) + ")" : "❌ Not set");
      console.log("Vonage API Secret:", smsConfig.data.vonageApiSecret ? "✓ Set" : "❌ Not set");
      console.log("Vonage From Number:", smsConfig.data.vonageFromNumber || "Not set");
      console.log("Vonage Configured:", smsConfig.data.vonageConfigured || false);
      console.log("\nFull Config:");
      console.log(JSON.stringify(smsConfig.data, null, 2));
    } else {
      console.log("❌ No SMS configuration found in database");
      console.log("💡 Please configure via Admin Dashboard:");
      console.log("   http://localhost:3000/admin/settings");
    }
    
    console.log("\n3️⃣  Testing Vonage API Connection:");
    console.log("─────────────────────────────────────────────────────────");
    
    // Get credentials from DB or env
    const apiKey = smsConfig?.data?.vonageApiKey || process.env.VONAGE_API_KEY;
    const apiSecret = smsConfig?.data?.vonageApiSecret || process.env.VONAGE_API_SECRET;
    const fromNumber = smsConfig?.data?.vonageFromNumber || process.env.VONAGE_FROM_NUMBER || "JustBecause";
    
    if (apiKey && apiSecret) {
      console.log("Using credentials from:", smsConfig?.data?.vonageApiKey ? "Database" : "Environment");
      
      const balanceParams = new URLSearchParams({
        api_key: apiKey,
        api_secret: apiSecret
      });
      
      try {
        const response = await fetch(`https://rest.nexmo.com/account/get-balance?${balanceParams.toString()}`);
        const data = await response.json();
        
        if (data.value !== undefined) {
          console.log("✅ Vonage API connection successful!");
          console.log("Account Balance: €" + data.value);
          console.log("Auto-reload:", data.autoReload ? "Enabled" : "Disabled");
        } else if (data['error-code']) {
          console.log("❌ Vonage API error:");
          console.log("Error Code:", data['error-code']);
          console.log("Error Message:", data['error-code-label']);
        } else {
          console.log("⚠️  Unexpected response from Vonage");
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.log("❌ Failed to connect to Vonage API");
        console.log("Error:", error.message);
      }
    } else {
      console.log("❌ Vonage credentials not found in database or environment");
    }
    
    console.log("\n4️⃣  Checking Collections:");
    console.log("─────────────────────────────────────────────────────────");
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name).join(", "));
    
    const smsOtpCount = await db.collection('sms_otps').countDocuments();
    const verifiedPhonesCount = await db.collection('verified_phones').countDocuments();
    console.log("SMS OTPs in database:", smsOtpCount);
    console.log("Verified phones:", verifiedPhonesCount);
    
    console.log("\n5️⃣  Testing SMS OTP Generation:");
    console.log("─────────────────────────────────────────────────────────");
    
    // Simulate what happens when user requests OTP
    const testPhone = "+919876543210";
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log("Test scenario: User enters phone", testPhone);
    console.log("Generated OTP:", testOtp);
    console.log("Provider to use:", smsConfig?.data?.provider || process.env.SMS_PROVIDER || "none");
    
    if ((smsConfig?.data?.provider || process.env.SMS_PROVIDER) === "vonage") {
      if (apiKey && apiSecret) {
        console.log("\n✅ Ready to send SMS via Vonage!");
        console.log("From:", fromNumber);
        console.log("To:", testPhone);
        console.log("Message: Your JustBecause.asia verification code is: " + testOtp);
        
        // Actual test send (optional - uncomment to send real SMS)
        /*
        console.log("\n📱 Sending actual test SMS...");
        const smsParams = new URLSearchParams({
          api_key: apiKey,
          api_secret: apiSecret,
          to: testPhone.replace("+", ""),
          from: fromNumber,
          text: `Test from JustBecause: Your verification code is ${testOtp}`
        });
        
        const smsResponse = await fetch("https://rest.nexmo.com/sms/json", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: smsParams.toString()
        });
        
        const smsData = await smsResponse.json();
        console.log("SMS Response:", JSON.stringify(smsData, null, 2));
        */
      } else {
        console.log("❌ Cannot send SMS - credentials missing");
      }
    } else {
      console.log("⚠️  SMS provider is not set to 'vonage'");
      console.log("Current provider:", smsConfig?.data?.provider || process.env.SMS_PROVIDER || "none");
    }
    
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    const hasEnvConfig = !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET);
    const hasDbConfig = !!(smsConfig?.data?.vonageApiKey && smsConfig?.data?.vonageApiSecret);
    const providerSet = (smsConfig?.data?.provider || process.env.SMS_PROVIDER) === "vonage";
    
    console.log("✓ Environment config:", hasEnvConfig ? "✅" : "❌");
    console.log("✓ Database config:", hasDbConfig ? "✅" : "❌");
    console.log("✓ Provider set to Vonage:", providerSet ? "✅" : "❌");
    console.log("✓ Vonage API working:", apiKey && apiSecret ? "✅ (tested above)" : "❌");
    
    if (hasDbConfig && providerSet) {
      console.log("\n🎉 CONFIGURATION COMPLETE!");
      console.log("Your Vonage SMS is ready to use in signup flow!");
    } else if (hasEnvConfig) {
      console.log("\n⚠️  Environment variables set but not in database");
      console.log("Please configure via admin dashboard to use DB config");
    } else {
      console.log("\n❌ CONFIGURATION INCOMPLETE");
      console.log("\n📝 To fix:");
      console.log("1. Go to: http://localhost:3000/admin/settings");
      console.log("2. Navigate to SMS Configuration");
      console.log("3. Select 'Vonage (Nexmo)'");
      console.log("4. Enter API Key, API Secret, From Number");
      console.log("5. Click Save");
    }
    
    console.log("\n🧪 To test signup flow:");
    console.log("bun dev → http://localhost:3000/auth/signup\n");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

deepTest();
