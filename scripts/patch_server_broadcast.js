const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.replace(
  "broadcastEvent('copytrade_update', db.copytrade);",
  "broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrades: db.copytrades || [db.copytrade, db.copytrade2].filter(Boolean) });"
);

fs.writeFileSync('server.js', s, 'utf8');
console.log('[OK] server.js broadcast patched successfully');
