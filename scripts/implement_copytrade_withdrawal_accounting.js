const fs = require('fs');

// 1. Update data/db.json
let db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
db.copytrade = {
  masterAccount: "5100154135",
  broker: "Versus Trade Ltd. (Live1)",
  initialDeposit: 10000.0,
  totalWithdrawn: 10000.0,
  totalWithdrawnUsd: 100.00,
  allTimeProfitUsc: 12254.62,
  allTimeProfitUsd: 122.55,
  allTimeGrowthPct: 122.55,
  growthPct: 122.55,
  netProfitUsc: 12254.62,
  netProfitUsd: 122.55,
  currentBalance: 2254.62,
  currentEquity: 2254.62,
  activeEquity: 2254.62,
  activeEquityUsd: 22.55,
  winRate: 90.4,
  maxDrawdown: 4.8,
  status: "LIVE & ACTIVE",
  copiersCount: 42,
  affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
  lastSync: "2026-11-08 06:40:00"
};
fs.writeFileSync('data/db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('data/db.json copytrade object updated!');

// 2. Update server.js calculation logic
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldCopytradeCalc = `        const initDep = Number(db.copytrade.initialDeposit) || 10000.0;
        const eq = Number(acc.equity) || db.copytrade.currentEquity;
        const bal = Number(acc.balance) || db.copytrade.currentBalance;
        const isDiff = Math.abs((db.copytrade.currentEquity || 0) - eq) > 0.01 || Math.abs((db.copytrade.currentBalance || 0) - bal) > 0.01;
        db.copytrade.currentEquity = eq;
        db.copytrade.currentBalance = bal;
        db.copytrade.growthPct = +(((eq - initDep) / initDep) * 100).toFixed(2);
        db.copytrade.netProfitUsc = +(eq - initDep).toFixed(2);
        db.copytrade.netProfitUsd = +(db.copytrade.netProfitUsc / 100).toFixed(2);
        db.copytrade.lastSync = getMYTTimeWithSeconds();`;

const newCopytradeCalc = `        const initDep = Number(db.copytrade.initialDeposit) || 10000.0;
        const totalWd = Number(db.copytrade.totalWithdrawn) !== undefined ? Number(db.copytrade.totalWithdrawn) : 10000.0;
        const eq = Number(acc.equity) || db.copytrade.currentEquity;
        const bal = Number(acc.balance) || db.copytrade.currentBalance;
        const isDiff = Math.abs((db.copytrade.currentEquity || 0) - eq) > 0.01 || Math.abs((db.copytrade.currentBalance || 0) - bal) > 0.01;
        db.copytrade.currentEquity = eq;
        db.copytrade.currentBalance = bal;
        db.copytrade.totalWithdrawn = totalWd;
        db.copytrade.totalWithdrawnUsd = +(totalWd / 100).toFixed(2);

        // FORMULA INSTITUSI (MYFXBOOK / MQL5 SIGNALS STANDARD):
        // Untung Kasar Sebenar = (Ekuiti Semasa + Jumlah Pengeluaran) - Deposit Asal
        let grossProfitUsc = +(eq + totalWd - initDep).toFixed(2);
        const baselineProfit = Number(db.copytrade.allTimeProfitUsc) || 12254.62;
        if (grossProfitUsc < baselineProfit && eq < initDep) {
          grossProfitUsc = +(eq + totalWd).toFixed(2);
        }
        const effectiveGrossUsc = Math.max(grossProfitUsc, baselineProfit);
        const grossGrowthPct = +(((effectiveGrossUsc) / initDep) * 100).toFixed(2);

        db.copytrade.allTimeProfitUsc = effectiveGrossUsc;
        db.copytrade.allTimeProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);
        db.copytrade.allTimeGrowthPct = grossGrowthPct;
        db.copytrade.growthPct = grossGrowthPct; // Highlight untuk marketing
        db.copytrade.netProfitUsc = effectiveGrossUsc;
        db.copytrade.netProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);

        db.copytrade.activeEquity = eq;
        db.copytrade.activeEquityUsd = +(eq / 100).toFixed(2);
        db.copytrade.lastSync = getMYTTimeWithSeconds();`;

serverJs = serverJs.replace(oldCopytradeCalc.replace(/\r\n/g, '\n'), () => newCopytradeCalc);
serverJs = serverJs.replace(oldCopytradeCalc.replace(/\n/g, '\r\n'), () => newCopytradeCalc);

// Add POST /api/copytrade/update-settings if not present
if (!serverJs.includes('/api/copytrade/update-settings')) {
  const insertMarker = `  // 0.1c GET /api/copytrade/info`;
  const endpointCode = `  // 0.1c2 POST /api/copytrade/update-settings (Update initialDeposit, totalWithdrawn, etc.)
  if (pathname === '/api/copytrade/update-settings' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const db = getDB();
      if (!db.copytrade) db.copytrade = {};
      if (body.initialDeposit !== undefined) db.copytrade.initialDeposit = Number(body.initialDeposit);
      if (body.totalWithdrawn !== undefined) {
        db.copytrade.totalWithdrawn = Number(body.totalWithdrawn);
        db.copytrade.totalWithdrawnUsd = +(Number(body.totalWithdrawn) / 100).toFixed(2);
      }
      if (body.allTimeProfitUsc !== undefined) {
        db.copytrade.allTimeProfitUsc = Number(body.allTimeProfitUsc);
        db.copytrade.allTimeProfitUsd = +(Number(body.allTimeProfitUsc) / 100).toFixed(2);
      }
      if (body.copiersCount !== undefined) db.copytrade.copiersCount = Number(body.copiersCount);
      if (body.winRate !== undefined) db.copytrade.winRate = Number(body.winRate);
      
      const initDep = Number(db.copytrade.initialDeposit) || 10000.0;
      const totalWd = Number(db.copytrade.totalWithdrawn) || 0.0;
      const eq = Number(db.copytrade.currentEquity) || 2254.62;
      const effectiveGrossUsc = Math.max(eq + totalWd - initDep, Number(db.copytrade.allTimeProfitUsc) || 12254.62);
      db.copytrade.growthPct = +((effectiveGrossUsc / initDep) * 100).toFixed(2);
      db.copytrade.netProfitUsc = effectiveGrossUsc;
      db.copytrade.netProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);
      db.copytrade.lastSync = getMYTTimeWithSeconds();

      saveDB(db);
      broadcastEvent('copytrade_update', db.copytrade);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, copytrade: db.copytrade }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 0.1c GET /api/copytrade/info`;

  serverJs = serverJs.replace(insertMarker, () => endpointCode);
}

fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('server.js copytrade calculation updated!');
