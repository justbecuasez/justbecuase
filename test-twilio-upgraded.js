const https = require('https');
require('dotenv').config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = '+917814002784';
const message = 'Hello from JustBecause! Your Twilio is now upgraded and working! Test code: 123456';

console.log('📱 Sending SMS via Twilio...');
console.log('From:', fromNumber);
console.log('To:', toNumber);
console.log('Message:', message);
console.log('');

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
    const result = JSON.parse(data);
    console.log('Response Status:', res.statusCode);
    
    if (res.statusCode === 201) {
      console.log('');
      console.log('✅ SMS sent successfully via Twilio!');
      console.log('Message SID:', result.sid);
      console.log('Status:', result.status);
      console.log('Date Sent:', result.date_created);
    } else {
      console.log('');
      console.log('❌ Twilio Error!');
      console.log('Error Code:', result.code);
      console.log('Error Message:', result.message);
      console.log('More Info:', result.more_info);
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(postData);
req.end();
