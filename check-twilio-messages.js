/**
 * Check Twilio Message Status
 * Queries recent messages sent through Twilio
 */

const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function checkTwilioMessages() {
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
    
    const { twilioAccountSid, twilioAuthToken } = smsConfig.data;
    
    console.log('📱 Checking Twilio Messages...\n');
    
    const twilio = require('twilio');
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    
    // Get messages from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const messages = await twilioClient.messages.list({
      dateSentAfter: oneHourAgo,
      limit: 20
    });
    
    if (messages.length === 0) {
      console.log('📭 No messages sent in the last hour');
    } else {
      console.log(`📬 Found ${messages.length} messages:\n`);
      messages.forEach((msg, i) => {
        console.log(`${i + 1}. To: ${msg.to}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   Error Code: ${msg.errorCode || 'None'}`);
        console.log(`   Error Message: ${msg.errorMessage || 'None'}`);
        console.log(`   Sent: ${msg.dateSent}`);
        console.log(`   Body: ${msg.body.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    // Also check account balance
    const account = await twilioClient.api.accounts(twilioAccountSid).fetch();
    console.log('💰 Account Info:');
    console.log(`   Name: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Type: ${account.type}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkTwilioMessages();
