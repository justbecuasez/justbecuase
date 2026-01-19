const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://admin:ewXAu2Gg19YZbFn2@justbecause.rjzpnln.mongodb.net/?appName=justbecause';

async function checkNotifications() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    console.log('🔗 Connecting to PRODUCTION MongoDB...');
    await client.connect();
    
    const db = client.db('justbecause');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 All collections in database:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Check notifications collection
    const notificationsCount = await db.collection('notifications').countDocuments();
    console.log('\n📬 Notifications count:', notificationsCount);
    
    if (notificationsCount > 0) {
      const recentNotifications = await db.collection('notifications').find().limit(5).toArray();
      console.log('\n📄 Recent notifications:');
      recentNotifications.forEach(n => {
        console.log(`  - ${n.title}: ${n.message} (${n.isRead ? 'read' : 'unread'})`);
      });
    }
    
    // Check conversations
    const conversationsCount = await db.collection('conversations').countDocuments();
    console.log('\n💬 Conversations count:', conversationsCount);
    
    // Check messages
    const messagesCount = await db.collection('messages').countDocuments();
    console.log('📨 Messages count:', messagesCount);
    
    // Check projects
    const projectsCount = await db.collection('projects').countDocuments();
    console.log('📁 Projects count:', projectsCount);
    
    // Check users
    const usersCount = await db.collection('user').countDocuments();
    console.log('👥 Users count:', usersCount);
    
    // Check user roles
    const users = await db.collection('user').find({}).toArray();
    console.log('\n👤 User breakdown by role:');
    const roleCounts = {};
    users.forEach(u => {
      const role = u.role || 'no-role';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });
    
    // Show user details
    console.log('\n👤 Users:');
    users.slice(0, 5).forEach(u => {
      console.log(`  - ${u.name || u.email} (${u.role}) - Onboarded: ${u.isOnboarded}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkNotifications();
