const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function setTwilio() {
  const client = new MongoClient(PRODUCTION_URI);
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...');
    await client.connect();
    console.log('✅ Connected');

    const db = client.db('justbecause');
    const configCollection = db.collection('system_config');

    const config = {
      type: 'sms',
      data: {
        provider: 'twilio',
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
        twilioConfigured: true,
        vonageConfigured: false,
        updatedAt: new Date()
      }
    };

    const result = await configCollection.updateOne(
      { type: 'sms' },
      { $set: config },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('✅ Twilio SMS config INSERTED in production');
    } else if (result.modifiedCount > 0) {
      console.log('✅ Twilio SMS config UPDATED in production');
    } else {
      console.log('ℹ️ Twilio SMS config already set');
    }

    const saved = await configCollection.findOne({ type: 'sms' });
    console.log('\n📋 Stored production SMS config:');
    console.log('  Provider:', saved.data.provider);
    console.log('  Twilio SID:', saved.data.twilioAccountSid);
    console.log('  From:', saved.data.twilioPhoneNumber);
    console.log('  Twilio Configured:', saved.data.twilioConfigured);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

setTwilio();
