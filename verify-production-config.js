const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function verifyProduction() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...');
    await client.connect();
    console.log('✅ Connected to production database');
    console.log('');
    
    const db = client.db('justbecause');
    const configCollection = db.collection('system_config');
    
    const smsConfig = await configCollection.findOne({ type: 'sms' });
    
    if (!smsConfig) {
      console.log('❌ No SMS configuration found in production!');
      return;
    }
    
    console.log('📋 Production SMS Configuration:');
    console.log('='.repeat(50));
    console.log('Provider:', smsConfig.data.provider);
    console.log('');
    
    if (smsConfig.data.provider === 'twilio') {
      console.log('✅ TWILIO Configuration:');
      console.log('   Account SID:', smsConfig.data.twilioAccountSid);
      console.log('   Auth Token:', smsConfig.data.twilioAuthToken ? '***' + smsConfig.data.twilioAuthToken.slice(-4) : 'NOT SET');
      console.log('   Phone Number:', smsConfig.data.twilioPhoneNumber);
      console.log('   Configured:', smsConfig.data.twilioConfigured);
    }
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Add these to Vercel Environment Variables:');
    console.log('   TWILIO_ACCOUNT_SID=<from .env.local>');
    console.log('   TWILIO_AUTH_TOKEN=<from .env.local>');
    console.log('   TWILIO_PHONE_NUMBER=<from .env.local>');
    console.log('   SMS_PROVIDER=twilio');
    console.log('');
    console.log('2. Redeploy your Vercel project');
    console.log('');
    console.log('3. Test at your production domain');
    console.log('');
    console.log('📝 What is your actual Vercel deployment URL?');
    console.log('   (e.g., justbecause.vercel.app or your custom domain)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyProduction();
