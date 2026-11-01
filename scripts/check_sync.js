const https = require('https');
const http = require('http');

https.get('https://amaterasu-x.vercel.app/api/data', res => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const d = JSON.parse(raw);
    console.log('=== VERCEL DATA ===');
    console.log('activeSignal:', d.activeSignal?.symbol, d.activeSignal?.type, d.activeSignal?.entry);
    (d.activeSignals || []).forEach(s => console.log(' [Vercel]', s.symbol, s.type, s.entry, s.status));
  });
});

http.get('http://localhost:3000/api/data', res => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const d = JSON.parse(raw);
    console.log('=== LOCALHOST DATA ===');
    console.log('activeSignal:', d.activeSignal?.symbol, d.activeSignal?.type, d.activeSignal?.entry);
    (d.activeSignals || []).forEach(s => console.log(' [Local]', s.symbol, s.type, s.entry, s.status));
  });
});
