const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function setupProductionSMS() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...');
    await client.connect();
    console.log('✅ Connected to production database!');
    
    const db = client.db('justbecause');
    const configCollection = db.collection('system_config');
    
    // Insert/Update Vonage SMS configuration
    const smsConfig = {
      type: 'sms',
      data: {
        provider: 'vonage',
        vonageApiKey: 'ee1651e2',
        vonageApiSecret: 'juPuxHwLgt0VhS2$8lQ',
        vonageFromNumber: '12134981083',
        vonageConfigured: true,
        updatedAt: new Date()
      }
    };
    
    const result = await configCollection.updateOne(
      { type: 'sms' },
      { $set: smsConfig },
      { upsert: true }
    );
    
    console.log('');
    if (result.upsertedCount > 0) {
      console.log('✅ SMS configuration INSERTED into production!');
    } else if (result.modifiedCount > 0) {
      console.log('✅ SMS configuration UPDATED in production!');
    } else {
      console.log('✅ SMS configuration already exists (no changes needed)');
    }
    
    // Verify the configuration
    const saved = await configCollection.findOne({ type: 'sms' });
    console.log('');
    console.log('📋 Production SMS Configuration:');
    console.log('   Provider:', saved.data.provider);
    console.log('   Vonage API Key:', saved.data.vonageApiKey);
    console.log('   Vonage From Number:', saved.data.vonageFromNumber);
    console.log('   Configured:', saved.data.vonageConfigured);
    console.log('');
    console.log('🎉 PRODUCTION DATABASE READY!');
    console.log('   You can now signup at: https://justbecuasenetwork.com/auth/signup');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

setupProductionSMS();
