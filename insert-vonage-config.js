const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/justbecausetest2222';
const client = new MongoClient(uri);

async function insertConfig() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Insert Vonage configuration with proper 'data' structure (like the API does)
    const result = await db.collection('system_config').updateOne(
      { type: 'sms' },
      { 
        $set: { 
          type: 'sms',
          data: {
            provider: 'vonage',
            vonageApiKey: 'ee1651e2',
            vonageApiSecret: 'juPuxHwLgt0VhS2$8lQ',
            vonageFromNumber: '12134981083',
            vonageConfigured: true
          },
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('Insert result:', result);
    
    // Verify the config was saved
    const config = await db.collection('system_config').findOne({ type: 'sms' });
    console.log('\n✅ SMS Configuration saved successfully!');
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

insertConfig();
