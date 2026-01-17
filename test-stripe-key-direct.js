// Direct Stripe Key Test
// Run with: node test-stripe-key-direct.js

const testStripeKey = async () => {
  // Read environment variables manually from .env.local
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse env file manually
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  
  const secretKey = envVars['STRIPE_SECRET_KEY'];
  const publishableKey = envVars['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'];
  
  console.log("=".repeat(60));
  console.log("STRIPE KEY DIAGNOSTIC TEST");
  console.log("=".repeat(60));
  
  // Check raw values
  console.log("\n1. RAW KEY ANALYSIS:");
  console.log("   Secret Key Length:", secretKey?.length || "N/A");
  console.log("   Secret Key Start:", secretKey?.substring(0, 20) + "...");
  console.log("   Secret Key End:", "..." + secretKey?.slice(-20));
  console.log("   Publishable Key Length:", publishableKey?.length || "N/A");
  
  // Check for whitespace issues
  console.log("\n2. WHITESPACE CHECK:");
  const trimmedKey = secretKey?.trim();
  console.log("   Has leading/trailing whitespace:", secretKey !== trimmedKey);
  console.log("   Contains newlines:", secretKey?.includes('\n') || secretKey?.includes('\r'));
  console.log("   Contains tabs:", secretKey?.includes('\t'));
  
  // Check for hidden characters
  console.log("\n3. CHARACTER ENCODING CHECK:");
  if (secretKey) {
    const nonAscii = secretKey.split('').filter(c => c.charCodeAt(0) > 127);
    console.log("   Non-ASCII characters found:", nonAscii.length > 0 ? nonAscii : "None");
    
    // Check each character
    const suspicious = [];
    for (let i = 0; i < secretKey.length; i++) {
      const code = secretKey.charCodeAt(i);
      if (code < 32 || code > 126) {
        suspicious.push({ pos: i, char: secretKey[i], code });
      }
    }
    console.log("   Suspicious characters:", suspicious.length > 0 ? suspicious : "None");
  }
  
  // Try to initialize Stripe
  console.log("\n4. STRIPE INITIALIZATION TEST:");
  try {
    const Stripe = require('stripe');
    
    // Test with raw key
    console.log("   Testing with raw key...");
    const stripe = new Stripe(secretKey);
    
    // Try a simple API call
    console.log("   Making API call (accounts.retrieve)...");
    const account = await stripe.accounts.retrieve();
    
    console.log("\n✅ SUCCESS! Stripe key is VALID");
    console.log("   Account ID:", account.id);
    console.log("   Country:", account.country);
    console.log("   Charges Enabled:", account.charges_enabled);
    console.log("   Payouts Enabled:", account.payouts_enabled);
    
  } catch (error) {
    console.log("\n❌ FAILED!");
    console.log("   Error Type:", error.type);
    console.log("   Error Message:", error.message);
    console.log("   Status Code:", error.statusCode);
    console.log("   Raw Type:", error.rawType);
    
    if (error.statusCode === 401) {
      console.log("\n🔍 DIAGNOSIS: 401 Authentication Error");
      console.log("   This means Stripe rejected the API key.");
      console.log("   Possible causes:");
      console.log("   1. Key was revoked or deleted in Stripe dashboard");
      console.log("   2. Key belongs to a different Stripe account");
      console.log("   3. Stripe account is not fully activated");
      console.log("   4. Key was copied incorrectly (extra/missing characters)");
      console.log("\n   SOLUTION:");
      console.log("   - Go to https://dashboard.stripe.com/apikeys");
      console.log("   - Generate a new Secret Key");
      console.log("   - Copy the ENTIRE key carefully");
      console.log("   - Replace in .env.local");
    }
  }
  
  // Test with trimmed key (in case whitespace is the issue)
  console.log("\n5. TESTING WITH TRIMMED KEY:");
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(trimmedKey);
    await stripe.accounts.retrieve();
    console.log("   ✅ Trimmed key works! Issue was whitespace.");
  } catch (error) {
    console.log("   ❌ Trimmed key also fails. Key itself is invalid.");
  }
};

testStripeKey().catch(console.error);
