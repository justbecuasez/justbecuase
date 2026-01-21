const { MongoClient } = require('mongodb');

async function initializeSettings() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/justbecause';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Check if settings exist
    const existing = await db.collection('adminSettings').findOne({});

    if (existing) {
      console.log('📋 Settings exist, updating test prices...');
      await db.collection('adminSettings').updateOne(
        {},
        { 
          $set: { 
            ngoProPrice: 1,
            volunteerProPrice: 1
          },
          $unset: { singleProfileUnlockPrice: '' }
        }
      );
    } else {
      console.log('📋 No settings found, creating with test prices...');
      await db.collection('adminSettings').insertOne({
        // Platform Settings
        platformName: "JustBecause Network",
        platformDescription: "Connecting NGOs with skilled volunteers",
        supportEmail: "support@justbecausenetwork.com",
        
        // Payment Settings
        currency: "INR",
        
        // Volunteer Free Plan
        volunteerFreeApplicationsPerMonth: 3,
        volunteerFreeProfileVisibility: true,
        
        // Volunteer Pro Plan - TEST PRICE
        volunteerProPrice: 1,
        volunteerProApplicationsUnlimited: true,
        volunteerProFeatures: [
          "Unlimited job applications",
          "Featured profile badge",
          "Priority in search results",
          "Direct message NGOs",
          "Early access to opportunities",
          "Profile analytics",
          "Certificate downloads",
        ],
        
        // NGO Free Plan
        ngoFreeProjectsPerMonth: 3,
        ngoFreeProfileUnlocksPerMonth: 0,
        
        // NGO Pro Plan - TEST PRICE
        ngoProPrice: 1,
        ngoProProjectsUnlimited: true,
        ngoProUnlocksUnlimited: true,
        ngoProFeatures: [
          "Unlimited projects",
          "Unlimited profile unlocks",
          "Advanced AI-powered matching",
          "Priority support",
          "Project analytics & reports",
          "Featured NGO badge",
          "Bulk volunteer outreach",
        ],
        
        // Features Toggle
        enablePayments: true,
        enableMessaging: true,
        enableNotifications: true,
        requireEmailVerification: false,
        requireNGOVerification: false,
        requirePhoneVerification: false,
        
        // Meta
        metaTitle: "JustBecause Network - Connect NGOs with Volunteers",
        metaDescription: "Platform connecting NGOs with skilled volunteers for social impact",
        
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Verify
    const settings = await db.collection('adminSettings').findOne({});
    console.log('\n✅ Current Settings:');
    console.log('  - Platform:', settings.platformName);
    console.log('  - NGO Pro Price: ₹' + settings.ngoProPrice, '(test price)');
    console.log('  - Volunteer Pro Price: ₹' + settings.volunteerProPrice, '(test price)');
    console.log('  - Currency:', settings.currency);
    console.log('  - Payments Enabled:', settings.enablePayments);
    
    console.log('\n🎉 Settings initialized with test prices (₹1)!');
    console.log('   For production, change to ₹2999 (NGO) and ₹999 (Volunteer).');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

initializeSettings();
