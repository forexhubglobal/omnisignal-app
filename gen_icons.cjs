const PImage = require('pureimage');
const fs = require('fs');

async function createIcon(size, filename) {
  const img = PImage.make(size, size);
  const ctx = img.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, size, size);
  await PImage.encodePNGToStream(img, fs.createWriteStream(filename));
}

createIcon(192, 'public/pwa-192x192.png').then(() => {
  return createIcon(512, 'public/pwa-512x512.png');
}).then(() => console.log('Done'));
