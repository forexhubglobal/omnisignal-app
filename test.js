fetch('http://localhost:3001/api/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pair: 'XAUUSD',
    type: 'STRONG BUY',
    price: '2345.50',
    tp: '2355.00',
    sl: '2335.00'
  })
}).then(r => r.json()).then(console.log).catch(console.error);
