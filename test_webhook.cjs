const https = require('https');
const data = JSON.stringify({"pair":"XAUUSD","type":"BUY LIVE","price":"2345.50","tp":"2355.00","sl":"2335.00"});
const options = {
  hostname: 'omnisignal-app.onrender.com',
  port: 443,
  path: '/api/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  res.on('data', d => process.stdout.write(d));
});
req.write(data);
req.end();
