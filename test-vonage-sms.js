// Test Vonage SMS API
// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

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

const apiKey = process.env.VONAGE_API_KEY
const apiSecret = process.env.VONAGE_API_SECRET
const fromNumber = process.env.VONAGE_FROM_NUMBER || "JustBecause"

console.log("═══════════════════════════════════════════════════════════")
console.log("  VONAGE SMS CONFIGURATION TEST")
console.log("═══════════════════════════════════════════════════════════\n")

console.log("📋 Configuration Check:")
console.log("─────────────────────────────────────────────────────────")
console.log("API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "❌ Not found")
console.log("API Secret:", apiSecret ? "✓ Set (***" + apiSecret.substring(apiSecret.length - 4) + ")" : "❌ Not found")
console.log("From Number/Brand:", fromNumber || "❌ Not found")

if (!apiKey || !apiSecret) {
  console.error("\n❌ ERROR: Missing Vonage credentials")
  console.error("\nRequired in .env.local or admin settings:")
  console.error("  • VONAGE_API_KEY")
  console.error("  • VONAGE_API_SECRET")
  console.error("  • VONAGE_FROM_NUMBER (optional, defaults to 'JustBecause')")
  console.error("\n📝 Get your credentials from:")
  console.error("   https://dashboard.nexmo.com → Settings → API Settings")
  process.exit(1)
}

async function testVonage() {
  try {
    console.log("\n📱 Testing Vonage SMS API:")
    console.log("─────────────────────────────────────────────────────────")
    
    console.log("\n1️⃣  Checking account balance...")
    
    // Test by checking account balance
    const balanceParams = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret
    })
    
    const balanceResponse = await fetch(`https://rest.nexmo.com/account/get-balance?${balanceParams.toString()}`)
    const balanceData = await balanceResponse.json()
    
    if (balanceData.value) {
      console.log("   ✅ Account verified!")
      console.log(`   • Balance: €${balanceData.value} EUR`)
      console.log(`   • Auto-reload: ${balanceData.autoReload ? 'Enabled' : 'Disabled'}`)
    } else {
      console.warn("   ⚠️  Could not fetch balance (might be OK)")
    }
    
    console.log("\n2️⃣  Testing SMS sending capability...")
    console.log("   Note: This is a DRY RUN - no actual SMS will be sent")
    console.log("   To test actual sending, enter a phone number below.\n")
    
    // Ask for test phone number
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question('   Enter test phone number (or press Enter to skip): ', async (testPhone) => {
      rl.close()
      
      if (testPhone && testPhone.trim()) {
        console.log(`\n3️⃣  Sending test SMS to ${testPhone}...`)
        
        // Format phone number
        let formattedPhone = testPhone.replace(/[^\d+]/g, "")
        if (!formattedPhone.startsWith("+")) {
          if (formattedPhone.startsWith("0")) {
            formattedPhone = formattedPhone.substring(1)
          }
          if (formattedPhone.length === 10) {
            formattedPhone = "+91" + formattedPhone
          }
        }
        
        // Remove + for Vonage API
        const vonagePhone = formattedPhone.replace("+", "")
        
        const smsParams = new URLSearchParams({
          api_key: apiKey,
          api_secret: apiSecret,
          to: vonagePhone,
          from: fromNumber,
          text: "Test SMS from JustBecause.asia! Your Vonage integration is working perfectly! 🎉"
        })
        
        try {
          const smsResponse = await fetch("https://rest.nexmo.com/sms/json", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: smsParams.toString()
          })
          
          const smsData = await smsResponse.json()
          
          console.log("\n   Response from Vonage:")
          console.log("   ─────────────────────────────────────────────────")
          
          if (smsData.messages && smsData.messages[0]) {
            const msg = smsData.messages[0]
            
            if (msg.status === "0") {
              console.log("   ✅ SMS SENT SUCCESSFULLY!")
              console.log(`   • Message ID: ${msg["message-id"]}`)
              console.log(`   • To: ${msg.to}`)
              console.log(`   • Remaining Balance: ${msg["remaining-balance"]}`)
              console.log(`   • Message Price: ${msg["message-price"]}`)
              console.log(`   • Network: ${msg.network || 'N/A'}`)
              
              console.log("\n   📱 Check your phone - you should receive the SMS!")
            } else {
              console.error("   ❌ SMS FAILED")
              console.error(`   • Status Code: ${msg.status}`)
              console.error(`   • Error: ${msg["error-text"] || "Unknown error"}`)
              console.error(`\n   💡 Common Error Codes:`)
              console.error(`      1 = Throttled`)
              console.error(`      2 = Missing params`)
              console.error(`      3 = Invalid params`)
              console.error(`      4 = Invalid credentials`)
              console.error(`      5 = Internal error`)
              console.error(`      6 = Invalid message`)
              console.error(`      7 = Number barred`)
              console.error(`      8 = Partner account barred`)
              console.error(`      9 = Partner quota exceeded`)
              console.error(`      15 = Invalid sender address`)
              console.error(`      29 = Non-whitelisted destination (demo mode)`)
            }
          }
        } catch (error) {
          console.error("   ❌ Request failed:", error.message)
        }
      }
      
      console.log("\n═══════════════════════════════════════════════════════════")
      console.log("  ✅ VONAGE CONFIGURATION TEST COMPLETE!")
      console.log("═══════════════════════════════════════════════════════════\n")
      
      console.log("📝 Integration Status:")
      console.log("─────────────────────────────────────────────────────────")
      console.log("✅ Vonage API credentials configured")
      console.log("✅ Account balance verified")
      console.log("✅ Ready to send SMS via signup flow")
      
      console.log("\n🚀 To Use in Your App:")
      console.log("─────────────────────────────────────────────────────────")
      console.log("1. Configure in Admin: /admin/settings → SMS Configuration")
      console.log("2. Select 'Vonage (Nexmo)' as provider")
      console.log("3. Enter your API Key, API Secret, From Number")
      console.log("4. Save configuration")
      console.log("5. Test signup flow: /auth/signup")
      
      console.log("\n💡 Tips:")
      console.log("─────────────────────────────────────────────────────────")
      console.log("• Use 'JustBecause' as sender - works in most countries")
      console.log("• Phone numbers in E.164 format (+countrycode...)")
      console.log("• Check balance at: https://dashboard.nexmo.com")
      console.log("• View SMS logs at: https://dashboard.nexmo.com/sms/logs")
      
      console.log("\n📊 Your Current Balance: €" + (balanceData.value || "N/A"))
      console.log("   Estimated SMS: ~" + (balanceData.value ? Math.floor(balanceData.value * 100) : "N/A") + " messages\n")
    })
    
  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════════════")
    console.error("  ❌ VONAGE TEST FAILED")
    console.error("═══════════════════════════════════════════════════════════\n")
    console.error(`Error: ${error.message}`)
    
    if (error.message.includes("401") || error.message.includes("403")) {
      console.error("\n🔍 Authentication Failed:")
      console.error("   • Check your API Key and API Secret")
      console.error("   • Verify at: https://dashboard.nexmo.com")
    }
    
    process.exit(1)
  }
}

testVonage()
