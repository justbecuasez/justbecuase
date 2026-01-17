const { MongoClient } = require('mongodb');

async function updateTestPrices() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/justbecause';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Update settings with test prices and remove singleProfileUnlockPrice
    const result = await db.collection('admin_settings').updateOne(
      {},
      { 
        $set: { 
          ngoProPrice: 1,  // TEST PRICE ₹1
          volunteerProPrice: 1  // TEST PRICE ₹1
        },
        $unset: { 
          singleProfileUnlockPrice: ''  // Remove this field
        }
      }
    );
    
    console.log('\n📋 Updated settings:');
    console.log('  Modified:', result.modifiedCount > 0 ? 'Yes' : 'No');
    
    // Verify the update
    const settings = await db.collection('admin_settings').findOne({});
    if (settings) {
      console.log('\n✅ Current Settings:');
      console.log('  - NGO Pro Price:', settings.ngoProPrice);
      console.log('  - Volunteer Pro Price:', settings.volunteerProPrice);
      console.log('  - Profile Unlock Price:', settings.singleProfileUnlockPrice || '(removed)');
      console.log('  - Currency:', settings.currency);
    }
    
    console.log('\n🎉 Test prices set to ₹1 for testing!');
    console.log('   Change to ₹2999 (NGO) and ₹999 (Volunteer) for production.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

updateTestPrices();
