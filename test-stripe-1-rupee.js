// Test Stripe Payment with ₹1 (100 paise)
// Run with: node test-stripe-1-rupee.js

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

console.log("═══════════════════════════════════════════════════════════");
console.log("  JUSTBECAUSE.ASIA - STRIPE ₹1 PAYMENT TEST");
console.log("═══════════════════════════════════════════════════════════\n");

console.log("📋 Configuration Check:");
console.log("─────────────────────────────────────────────────────────");
console.log("Publishable Key:", publishableKey ? `✓ ${publishableKey.substring(0, 25)}...` : "❌ Not found");
console.log("Secret Key:", secretKey ? `✓ Set (***${secretKey.substring(secretKey.length - 8)})` : "❌ NOT SET");
console.log("Mode:", secretKey?.startsWith("sk_live") ? "🔴 LIVE" : "🟡 TEST");

if (!secretKey) {
  console.error("\n❌ ERROR: Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

async function testStripePayment() {
  try {
    console.log("\n💳 Testing Stripe Connection & Payment:");
    console.log("─────────────────────────────────────────────────────────");

    // 1. Initialize Stripe
    console.log("\n1️⃣  Initializing Stripe client...");
    const stripe = require("stripe")(secretKey);
    console.log("   ✅ Stripe client initialized");

    // 2. Verify account
    console.log("\n2️⃣  Verifying Stripe account...");
    const account = await stripe.accounts.retrieve();
    console.log("   ✅ Account verified!");
    console.log(`   • Account ID: ${account.id}`);
    console.log(`   • Country: ${account.country}`);
    console.log(`   • Currency: ${account.default_currency?.toUpperCase() || 'INR'}`);
    console.log(`   • Charges Enabled: ${account.charges_enabled ? '✓ Yes' : '✗ No'}`);
    console.log(`   • Payouts Enabled: ${account.payouts_enabled ? '✓ Yes' : '✗ No'}`);

    if (!account.charges_enabled) {
      console.warn("\n   ⚠️  WARNING: Charges are not enabled!");
      console.warn("   Complete your Stripe account setup first.");
    }

    // 3. Create a test PaymentIntent for ₹1 (100 paise)
    console.log("\n3️⃣  Creating PaymentIntent for ₹1 (100 paise)...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // 100 paise = ₹1
      currency: 'inr',
      description: 'Test payment - JustBecause.Asia',
      metadata: {
        test: 'true',
        source: 'test-stripe-1-rupee.js',
        timestamp: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("   ✅ PaymentIntent created successfully!");
    console.log(`   • PaymentIntent ID: ${paymentIntent.id}`);
    console.log(`   • Amount: ₹${(paymentIntent.amount / 100).toFixed(2)} INR`);
    console.log(`   • Status: ${paymentIntent.status}`);
    console.log(`   • Client Secret: ${paymentIntent.client_secret?.substring(0, 30)}...`);

    // 4. Summary
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ✅ STRIPE PAYMENT SYSTEM READY!");
    console.log("═══════════════════════════════════════════════════════════\n");

    console.log("📝 Next Steps:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("1. Go to Admin Settings → Payment tab");
    console.log("2. Select 'Stripe' as payment gateway");
    console.log("3. Enter the Stripe keys (or they're already in env vars)");
    console.log("4. Save and test the connection");
    console.log("\n💡 Test Payment in Browser:");
    console.log("   The PaymentIntent above can be completed using Stripe.js");
    console.log("   Use test card: 4242 4242 4242 4242 (any future date, any CVC)");

    console.log("\n📍 Payment Intent Details (for frontend testing):");
    console.log("─────────────────────────────────────────────────────────");
    console.log(`   Publishable Key: ${publishableKey}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret}`);

    // Cancel the test payment intent (since we won't complete it)
    console.log("\n5️⃣  Canceling test PaymentIntent (cleanup)...");
    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log("   ✅ Test PaymentIntent canceled (no charge made)");

    return true;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error("   Check your API keys are correct");
    }
    if (error.type === 'StripeInvalidRequestError') {
      console.error("   Invalid request - check parameters");
    }
    return false;
  }
}

testStripePayment().then(success => {
  process.exit(success ? 0 : 1);
});
