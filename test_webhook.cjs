const http = require('http');

const data = JSON.stringify({
  pair: 'XAUUSD',
  type: 'BUY NOW (Omni AI)',
  price: '2350.00',
  tp: '2360.00',
  sl: '2345.00'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => console.error(error));
req.write(data);
req.end();
