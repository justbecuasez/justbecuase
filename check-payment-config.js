// Check MongoDB Payment Config
// Run with: node check-payment-config.js

const { MongoClient } = require('mongodb');

async function checkPaymentConfig() {
  const uri = 'mongodb://localhost:27017/justbecausetest2222';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('justbecausetest2222');
    
    // Check paymentGatewayConfig collection
    const config = await db.collection('paymentGatewayConfig').findOne({ type: 'primary' });
    
    console.log('='.repeat(60));
    console.log('PAYMENT GATEWAY CONFIG IN DATABASE');
    console.log('='.repeat(60));
    
    if (config) {
      console.log('\nGateway:', config.gateway);
      console.log('Is Live:', config.isLive);
      console.log('Stripe Configured:', !!config.stripeSecretKey);
      console.log('Razorpay Configured:', !!config.razorpayKeySecret);
      console.log('\nStripe Keys:');
      console.log('  Publishable:', config.stripePublishableKey ? config.stripePublishableKey.substring(0, 20) + '...' : 'Not set');
      console.log('  Secret:', config.stripeSecretKey ? config.stripeSecretKey.substring(0, 20) + '...' : 'Not set');
      console.log('\nRazorpay Keys:');
      console.log('  Key ID:', config.razorpayKeyId || 'Not set');
      console.log('  Secret:', config.razorpayKeySecret ? config.razorpayKeySecret.substring(0, 10) + '...' : 'Not set');
      console.log('\nConfig Info:');
      console.log('  Configured At:', config.configuredAt);
      console.log('  Configured By:', config.configuredBy);
      console.log('  Last Tested:', config.lastTestedAt);
      console.log('  Test Successful:', config.testSuccessful);
    } else {
      console.log('\nNo payment config found in database.');
      console.log('System will use environment variables.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SOLUTION');
    console.log('='.repeat(60));
    
    if (config && config.gateway === 'stripe') {
      console.log('\n⚠️  DATABASE HAS STRIPE CONFIGURED!');
      console.log('\nThe system is using Stripe from the database config,');
      console.log('but your Stripe keys are INVALID.');
      console.log('\nOptions:');
      console.log('1. Get valid Stripe keys from dashboard.stripe.com/apikeys');
      console.log('2. Switch to Razorpay in admin settings');
      console.log('3. Clear the database config (will fallback to env vars with Razorpay)');
      
      console.log('\nWould you like me to switch to Razorpay? Run:');
      console.log('node fix-payment-config.js');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkPaymentConfig();
