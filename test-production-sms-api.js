const https = require('https');

const PRODUCTION_URL = 'www.justbecuasenetwork.com';
const TEST_PHONE = '+917814002784';

console.log('🧪 Testing Production SMS API');
console.log('='.repeat(50));
console.log('Production URL:', `https://${PRODUCTION_URL}`);
console.log('Test Phone:', TEST_PHONE);
console.log('');

const postData = JSON.stringify({
  phone: TEST_PHONE
});

const options = {
  hostname: PRODUCTION_URL,
  port: 443,
  path: '/api/auth/send-sms-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending request to production API...');
console.log(`   POST https://${PRODUCTION_URL}/api/auth/send-sms-otp`);
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response Status:', res.statusCode);
    console.log('');
    
    try {
      const result = JSON.parse(data);
      console.log('Response Body:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
      
      if (res.statusCode === 200 && result.success) {
        console.log('✅ SUCCESS! Production SMS API is working!');
        console.log('   SMS OTP sent to:', TEST_PHONE);
        console.log('   Expires at:', result.expiresAt);
        
        if (result.devOtp) {
          console.log('   Dev OTP:', result.devOtp);
        }
        
        console.log('');
        console.log('🎉 Production SMS system is FULLY OPERATIONAL!');
        console.log('   Provider: Twilio');
        console.log('   From: +12403014982');
        console.log('   Platform: JustBecauseNetwork');
      } else if (res.statusCode === 503) {
        console.log('⚠️ SMS service not configured in production');
        console.log('   Need to check Vercel environment variables');
      } else {
        console.log('❌ Error occurred');
        console.log('   Status:', res.statusCode);
        console.log('   Message:', result.error || result.message);
      }
    } catch (e) {
      console.log('❌ Failed to parse response');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
  console.log('');
  console.log('Possible issues:');
  console.log('  • Production site not deployed yet');
  console.log('  • Network connectivity issue');
  console.log('  • Domain not resolving');
});

req.write(postData);
req.end();
