const https = require('https');

const apiKey = 'ee1651e2';
const apiSecret = 'juPuxHwLgt0VhS2$8lQ';
const from = '12134981083';
const to = '917814002784';
const text = 'Hello from JustBecause! Your verification code is: 123456';

console.log('📱 Sending SMS via Vonage...');
console.log('To: +' + to);
console.log('From:', from);
console.log('Message:', text);
console.log('');

const postData = new URLSearchParams({
  api_key: apiKey,
  api_secret: apiSecret,
  from: from,
  to: to,
  text: text
}).toString();

const options = {
  hostname: 'rest.nexmo.com',
  port: 443,
  path: '/sms/json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages[0]) {
      const msg = result.messages[0];
      if (msg.status === '0') {
        console.log('');
        console.log('✅ SMS sent successfully!');
        console.log('Message ID:', msg['message-id']);
        console.log('Remaining Balance:', msg['remaining-balance']);
      } else {
        console.log('');
        console.log('❌ SMS failed!');
        console.log('Error:', msg['error-text']);
        console.log('Status:', msg.status);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
