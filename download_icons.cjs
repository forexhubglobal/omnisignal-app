const https = require('https');
const fs = require('fs');

https.get('https://via.placeholder.com/192.png?text=O', (res) => {
  res.pipe(fs.createWriteStream('public/pwa-192x192.png'));
});

https.get('https://via.placeholder.com/512.png?text=O', (res) => {
  res.pipe(fs.createWriteStream('public/pwa-512x512.png'));
});
