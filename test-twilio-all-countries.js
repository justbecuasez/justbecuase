const https = require('https');
require('dotenv').config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const testNumbers = [
  { number: '+918105577584', country: 'India' },
  { number: '+6593852858', country: 'Singapore' },
  { number: '+919964030568', country: 'India' },
  { number: '+917892610317', country: 'India' },
  { number: '+917814002784', country: 'India (Akash)' }
];

function sendSMS(toNumber, country, index, total) {
  return new Promise((resolve, reject) => {
    const message = `Hello from JustBecauseNetwork! Your verification code is: ${Math.floor(100000 + Math.random() * 900000)}. Valid for 10 minutes.`;
    
    console.log(`\n[${index + 1}/${total}] 📱 Sending to ${country} ${toNumber}...`);
    
    const postData = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message
    }).toString();

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 201) {
            console.log(`   ✅ SUCCESS!`);
            console.log(`   Message SID: ${result.sid}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Price: ${result.price} ${result.price_unit || 'USD'}`);
            resolve({ success: true, number: toNumber, country, result });
          } else {
            console.log(`   ❌ FAILED!`);
            console.log(`   Error Code: ${result.code}`);
            console.log(`   Error: ${result.message}`);
            resolve({ success: false, number: toNumber, country, error: result });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Request Error: ${e.message}`);
      resolve({ success: false, number: toNumber, country, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllNumbers() {
  console.log('🚀 Testing Twilio SMS to Multiple Countries');
  console.log('='.repeat(50));
  console.log('From: ' + fromNumber);
  console.log('Platform: JustBecauseNetwork');
  console.log('Total Recipients: ' + testNumbers.length);
  
  const results = [];
  
  for (let i = 0; i < testNumbers.length; i++) {
    const { number, country } = testNumbers[i];
    const result = await sendSMS(number, country, i, testNumbers.length);
    results.push(result);
    
    // Wait 1 second between requests to avoid rate limiting
    if (i < testNumbers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Deliveries:');
    successful.forEach(r => {
      console.log(`   • ${r.country} ${r.number}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Deliveries:');
    failed.forEach(r => {
      console.log(`   • ${r.country} ${r.number}`);
      if (r.error && r.error.message) {
        console.log(`     Reason: ${r.error.message}`);
      }
    });
  }
  
  console.log('\n🎉 Test Complete!');
}

testAllNumbers();
