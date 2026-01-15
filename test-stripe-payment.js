// Test Stripe Payment Integration
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

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const secretKey = process.env.STRIPE_SECRET_KEY

console.log("═══════════════════════════════════════════════════════════")
console.log("  JUSTBECAUSE.ASIA - STRIPE PAYMENT INTEGRATION TEST")
console.log("═══════════════════════════════════════════════════════════\n")

console.log("📋 Configuration Check:")
console.log("─────────────────────────────────────────────────────────")
console.log("Publishable Key:", publishableKey ? `${publishableKey.substring(0, 20)}...` : "❌ Not found")
console.log("Secret Key:", secretKey ? `✓ Set (***${secretKey.substring(secretKey.length - 4)})` : "❌ NOT SET - REQUIRED!")

if (!publishableKey) {
  console.error("\n❌ ERROR: Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local")
  process.exit(1)
}

if (!secretKey) {
  console.error("\n❌ ERROR: Missing STRIPE_SECRET_KEY in .env.local")
  console.error("\n⚠️  IMPORTANT: You need to provide the Stripe Secret Key")
  console.error("   The publishable key is set, but the secret key is required for backend operations.")
  console.error("\n📝 Please add to your .env.local:")
  console.error("   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx")
  console.error("\n💡 Get your secret key from:")
  console.error("   https://dashboard.stripe.com/apikeys")
  process.exit(1)
}

async function testStripe() {
  try {
    console.log("\n💳 Testing Stripe Integration:")
    console.log("─────────────────────────────────────────────────────────")
    
    console.log("\n1️⃣  Initializing Stripe client...")
    const stripe = require("stripe")(secretKey)

    console.log("2️⃣  Verifying Stripe API connection...")
    
    // Test by fetching account info
    const account = await stripe.accounts.retrieve()
    console.log("   ✅ Stripe account verified!")
    console.log(`   • Account ID: ${account.id}`)
    console.log(`   • Account Type: ${account.type}`)
    console.log(`   • Country: ${account.country}`)
    console.log(`   • Default Currency: ${account.default_currency?.toUpperCase() || 'Not set'}`)
    console.log(`   • Charges Enabled: ${account.charges_enabled ? '✓' : '✗'}`)
    console.log(`   • Payouts Enabled: ${account.payouts_enabled ? '✓' : '✗'}`)

    if (!account.charges_enabled) {
      console.warn("\n   ⚠️  Charges are not enabled on this account")
      console.warn("   You may need to complete account setup in Stripe Dashboard")
    }

    // Test creating a test product (won't actually create in test mode)
    console.log("\n3️⃣  Testing Stripe API functionality...")
    const testPrice = await stripe.prices.list({ limit: 1 })
    console.log("   ✅ Successfully connected to Stripe API")

    console.log("\n═══════════════════════════════════════════════════════════")
    console.log("  ✅ STRIPE CONFIGURATION SUCCESSFUL!")
    console.log("═══════════════════════════════════════════════════════════\n")

    console.log("📝 Payment Flow in JustBecause.Asia:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("Currently using: Razorpay (default)")
    console.log("\n💡 To enable Stripe payments:")
    console.log("1. Update payment gateway configuration in admin settings")
    console.log("2. Or modify the payment API routes to use Stripe")
    console.log("\n📍 Payment API Endpoints:")
    console.log("• POST /api/payments/create-order")
    console.log("• POST /api/payments/create-subscription")
    console.log("• POST /api/payments/verify")
    console.log("• POST /api/payments/verify-subscription")

    console.log("\n🔄 Current Payment Features:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("• Profile Unlock Payments (NGOs unlock volunteer profiles)")
    console.log("• Subscription Payments (Premium features)")
    console.log("• Payment Gateway: Razorpay (configured)")
    console.log("• Stripe: Now configured and ready to integrate!")

    console.log("\n🚀 Next Steps to Integrate Stripe:")
    console.log("─────────────────────────────────────────────────────────")
    console.log("1. Create Stripe payment routes (similar to Razorpay)")
    console.log("2. Add payment gateway selection in admin settings")
    console.log("3. Update frontend to use Stripe.js")
    console.log("4. Test with Stripe test cards")
    console.log("\n📚 Stripe Documentation:")
    console.log("   https://stripe.com/docs/api")
    console.log("\n🧪 Test Cards:")
    console.log("   4242 4242 4242 4242 - Success")
    console.log("   4000 0000 0000 9995 - Declined")

  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════════════")
    console.error("  ❌ STRIPE VERIFICATION FAILED")
    console.error("═══════════════════════════════════════════════════════════\n")
    console.error(`Error: ${error.message}`)
    
    if (error.type === 'StripeAuthenticationError') {
      console.error("\n🔍 Authentication Failed:")
      console.error("   • Check that your Secret Key is correct")
      console.error("   • Verify you're using sk_live_ or sk_test_ prefix")
      console.error("   • Make sure there are no extra spaces in .env.local")
      console.error("\n💡 Get your keys from:")
      console.error("   https://dashboard.stripe.com/apikeys")
    } else if (error.type === 'StripeConnectionError') {
      console.error("\n🔍 Connection Error:")
      console.error("   • Check your internet connection")
      console.error("   • Verify firewall/proxy settings")
    }
    
    process.exit(1)
  }
}

testStripe()
