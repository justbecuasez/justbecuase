// Deep Stripe Key Debug Test
// This tests the exact key you provide directly against Stripe API

const testKey = async (key) => {
  console.log("=".repeat(70));
  console.log("DEEP STRIPE KEY DIAGNOSTIC");
  console.log("=".repeat(70));
  
  // Key Analysis
  console.log("\n📋 KEY ANALYSIS:");
  console.log("   Length:", key.length);
  console.log("   Starts with sk_live_:", key.startsWith("sk_live_"));
  console.log("   First 40 chars:", key.substring(0, 40));
  console.log("   Last 20 chars:", key.slice(-20));
  
  // Check for hidden characters
  console.log("\n🔍 CHARACTER CHECK:");
  let issues = [];
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    const code = key.charCodeAt(i);
    
    // Check for problematic characters
    if (code < 32 || code > 126) {
      issues.push({ pos: i, char, code, issue: "non-printable" });
    }
    if (char === ' ') {
      issues.push({ pos: i, char: "SPACE", code, issue: "space" });
    }
    if (char === '\n' || char === '\r') {
      issues.push({ pos: i, char: "NEWLINE", code, issue: "newline" });
    }
  }
  
  if (issues.length > 0) {
    console.log("   ⚠️ ISSUES FOUND:", issues);
  } else {
    console.log("   ✅ No hidden characters found");
  }
  
  // Test with Stripe SDK
  console.log("\n🧪 STRIPE SDK TEST:");
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(key);
    
    console.log("   Creating Stripe instance...");
    
    // Test 1: Get balance
    console.log("   Testing balance endpoint...");
    const balance = await stripe.balance.retrieve();
    console.log("\n   ✅ SUCCESS! Key is VALID");
    console.log("   Available balance:", balance.available);
    console.log("   Pending balance:", balance.pending);
    return true;
    
  } catch (error) {
    console.log("\n   ❌ FAILED!");
    console.log("   Error Type:", error.type);
    console.log("   Error Code:", error.code);
    console.log("   Status Code:", error.statusCode);
    console.log("   Message:", error.message);
    
    if (error.statusCode === 401) {
      console.log("\n📌 401 ERROR ANALYSIS:");
      console.log("   The key format is correct but Stripe rejects it.");
      console.log("   This means:");
      console.log("   1. The key may be deleted/rotated in Stripe dashboard");
      console.log("   2. The key might have IP restrictions");
      console.log("   3. The Stripe account may have issues");
      console.log("   4. The key might belong to a different account");
      
      console.log("\n📌 HOW TO VERIFY IN STRIPE DASHBOARD:");
      console.log("   1. Go to: https://dashboard.stripe.com/apikeys");
      console.log("   2. Look at 'Standard keys' section");
      console.log("   3. Check if 'Secret key' shows: sk_live_...t0SE (last 4 chars)");
      console.log("   4. Click 'Reveal live key' to see full key");
      console.log("   5. Use the COPY button (not manual typing)");
      console.log("   6. Check 'Created' date - is it recent?");
      console.log("   7. Check if there are IP restrictions on the key");
    }
    return false;
  }
};

// Test with the provided key from environment or command line argument
const KEY = process.argv[2] || process.env.STRIPE_SECRET_KEY || "";

if (!KEY) {
  console.error("❌ No Stripe key provided!");
  console.log("Usage: node deep-stripe-test.js YOUR_STRIPE_KEY");
  console.log("   OR: Set STRIPE_SECRET_KEY in environment");
  process.exit(1);
}

testKey(KEY);
