/**
 * Actually Send a Test SMS via Twilio
 * Using production database credentials
 */

const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

// CHANGE THIS TO YOUR TEST PHONE NUMBER
const TEST_PHONE_NUMBER = process.argv[2];

async function sendTestSMS() {
  if (!TEST_PHONE_NUMBER) {
    console.log('Usage: node send-real-sms-test.js +91XXXXXXXXXX');
    console.log('Example: node send-real-sms-test.js +919876543210');
    return;
  }
  
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...\n');
    await client.connect();
    
    const db = client.db('justbecause');
    const smsConfig = await db.collection('system_config').findOne({ type: 'sms' });
    
    if (!smsConfig?.data) {
      console.log('❌ No SMS configuration found!');
      return;
    }
    
    const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = smsConfig.data;
    
    console.log('📱 Using Twilio:');
    console.log('   From:', twilioPhoneNumber);
    console.log('   To:', TEST_PHONE_NUMBER);
    console.log('');
    
    const twilio = require('twilio');
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    
    // Generate a test OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('📤 Sending SMS...');
    const message = await twilioClient.messages.create({
      body: `Your JustBecause Network verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: TEST_PHONE_NUMBER
    });
    
    console.log('');
    console.log('✅ SMS SENT SUCCESSFULLY!');
    console.log('   Message SID:', message.sid);
    console.log('   Status:', message.status);
    console.log('   OTP sent:', otp);
    console.log('');
    console.log('📱 Check your phone for the SMS!');
    
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    if (error.code) {
      console.error('   Twilio Error Code:', error.code);
      console.error('   More Info:', error.moreInfo);
      
      if (error.code === 21211) {
        console.log('\n💡 Error 21211: Invalid phone number format');
        console.log('   Make sure to use E.164 format: +[country code][number]');
        console.log('   Example for India: +919876543210');
      }
      if (error.code === 21608) {
        console.log('\n💡 Error 21608: The phone number is not a valid SMS-capable number');
      }
      if (error.code === 21614) {
        console.log('\n💡 Error 21614: The "To" phone number is not valid');
      }
    }
  } finally {
    await client.close();
  }
}

sendTestSMS();
