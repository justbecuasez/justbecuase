/**
 * Deep Twilio SMS Test for Production
 * Tests the exact same flow as the production API
 */

const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function testTwilioSMS() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...\n');
    await client.connect();
    
    const db = client.db('justbecause');
    const configCollection = db.collection('system_config');
    
    // Get SMS config exactly as the API does
    const smsConfig = await configCollection.findOne({ type: 'sms' });
    
    if (!smsConfig) {
      console.log('❌ No SMS configuration found in production database!');
      console.log('\n💡 Solution: Go to Admin > Settings > SMS Configuration and set up Twilio');
      return;
    }
    
    const dbConfig = smsConfig.data || {};
    console.log('📋 SMS Configuration from Database:');
    console.log('='.repeat(50));
    console.log('Provider:', dbConfig.provider);
    console.log('');
    
    if (dbConfig.provider === 'twilio') {
      const accountSid = dbConfig.twilioAccountSid;
      const authToken = dbConfig.twilioAuthToken;
      const fromNumber = dbConfig.twilioPhoneNumber;
      
      console.log('📱 Twilio Configuration:');
      console.log('   Account SID:', accountSid || 'NOT SET');
      console.log('   Auth Token:', authToken ? `SET (${authToken.length} chars, ends with ...${authToken.slice(-4)})` : 'NOT SET');
      console.log('   Phone Number:', fromNumber || 'NOT SET');
      console.log('   Configured Flag:', dbConfig.twilioConfigured);
      console.log('');
      
      if (!accountSid || !authToken || !fromNumber) {
        console.log('❌ Twilio is not fully configured!');
        console.log('   Missing:', [
          !accountSid && 'Account SID',
          !authToken && 'Auth Token', 
          !fromNumber && 'Phone Number'
        ].filter(Boolean).join(', '));
        return;
      }
      
      // Test Twilio credentials
      console.log('🔐 Testing Twilio Credentials...');
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(accountSid, authToken);
        
        // First, verify the account exists
        const account = await twilioClient.api.accounts(accountSid).fetch();
        console.log('✅ Account Valid:', account.friendlyName);
        console.log('   Status:', account.status);
        console.log('   Type:', account.type);
        console.log('');
        
        // Check if it's a trial account
        if (account.type === 'Trial') {
          console.log('⚠️  WARNING: This is a TRIAL account!');
          console.log('   Trial accounts can only send SMS to verified phone numbers.');
          console.log('   Upgrade to a paid account or verify recipient numbers at:');
          console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
          console.log('');
        }
        
        // Check the phone number
        console.log('📞 Checking Phone Number:', fromNumber);
        try {
          const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ phoneNumber: fromNumber });
          if (phoneNumbers.length > 0) {
            console.log('✅ Phone Number Valid');
            console.log('   Friendly Name:', phoneNumbers[0].friendlyName);
            console.log('   SMS Capable:', phoneNumbers[0].capabilities.sms);
          } else {
            console.log('❌ Phone number not found in your Twilio account!');
          }
        } catch (e) {
          console.log('⚠️  Could not verify phone number:', e.message);
        }
        
        // Try sending a test message (commented out to avoid charges)
        console.log('\n📤 To test sending a real SMS, uncomment the code below and add a verified number');
        console.log('   Or use this test manually in the Twilio console');
        
        /*
        // UNCOMMENT TO TEST - Replace with a verified phone number
        const testNumber = '+91XXXXXXXXXX';  // YOUR VERIFIED TEST NUMBER
        const testMessage = await twilioClient.messages.create({
          body: 'Test from JustBecause production - ' + new Date().toISOString(),
          from: fromNumber,
          to: testNumber
        });
        console.log('✅ Test Message Sent! SID:', testMessage.sid);
        */
        
      } catch (twilioError) {
        console.log('❌ Twilio Error:', twilioError.message);
        console.log('   Code:', twilioError.code);
        console.log('   More Info:', twilioError.moreInfo);
        
        if (twilioError.code === 20003) {
          console.log('\n💡 Error 20003 means INVALID CREDENTIALS');
          console.log('   The Account SID and Auth Token do not match.');
          console.log('   Please verify them at: https://console.twilio.com');
        }
      }
      
    } else if (dbConfig.provider === 'vonage') {
      console.log('📱 Vonage Configuration:');
      console.log('   API Key:', dbConfig.vonageApiKey || 'NOT SET');
      console.log('   API Secret:', dbConfig.vonageApiSecret ? 'SET' : 'NOT SET');
    } else {
      console.log('⚠️  SMS Provider is:', dbConfig.provider);
      console.log('   Valid options: twilio, vonage');
    }
    
    // Also check environment variables that might be expected
    console.log('\n📋 Environment Variables (if running locally with .env):');
    console.log('   SMS_PROVIDER:', process.env.SMS_PROVIDER || 'NOT SET');
    console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
    console.log('   TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
    console.log('   TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'NOT SET');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testTwilioSMS();
