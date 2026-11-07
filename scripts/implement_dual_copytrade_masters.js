const fs = require('fs');

// ==========================================
// 1. UPDATE data/db.json
// ==========================================
let db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

db.copytrade = {
  id: "master-1",
  name: "The Mighty Duck",
  avatar: "img/themightyduck.png",
  masterAccount: "5100154135",
  broker: "Versus Trade Ltd. (Live1)",
  initialDeposit: 10000.0,
  totalWithdrawn: 10000.0,
  totalWithdrawnUsd: 100.0,
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
  badge: "VAULT 1 (REALISED PROFIT)",
  copiersCount: 42,
  affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
  lastSync: "2026-11-08 07:45:00"
};

db.copytrade2 = {
  id: "master-2",
  name: "The Mighty Duck II",
  avatar: "img/themightyduck.png",
  masterAccount: "5100207348",
  broker: "Versus Trade Ltd. (Live1)",
  initialDeposit: 10000.0,
  totalWithdrawn: 0.0,
  totalWithdrawnUsd: 0.0,
  allTimeProfitUsc: 0.0,
  allTimeProfitUsd: 0.0,
  allTimeGrowthPct: 0.0,
  growthPct: 0.0,
  netProfitUsc: 0.0,
  netProfitUsd: 0.0,
  currentBalance: 10000.0,
  currentEquity: 10000.0,
  activeEquity: 10000.0,
  activeEquityUsd: 100.0,
  winRate: 100.0,
  maxDrawdown: 0.0,
  status: "LIVE & ACTIVE",
  badge: "VAULT 2 (FRESH POOL)",
  copiersCount: 18,
  affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
  lastSync: "2026-11-08 07:45:00"
};

db.copytrades = [db.copytrade, db.copytrade2];

fs.writeFileSync('data/db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('[OK] data/db.json updated with dual copytrade masters!');

// ==========================================
// 2. UPDATE server.js
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Ensure copytrade2 and copytrades exist in defaultDB
if (!serverJs.includes('copytrade2:')) {
  serverJs = serverJs.replace(
    'copytradeRequests: []',
    `copytrade2: {
    id: "master-2",
    name: "The Mighty Duck II",
    avatar: "img/themightyduck.png",
    masterAccount: "5100207348",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    totalWithdrawn: 0.0,
    totalWithdrawnUsd: 0.0,
    allTimeProfitUsc: 0.0,
    allTimeProfitUsd: 0.0,
    allTimeGrowthPct: 0.0,
    growthPct: 0.0,
    netProfitUsc: 0.0,
    netProfitUsd: 0.0,
    currentBalance: 10000.0,
    currentEquity: 10000.0,
    activeEquity: 10000.0,
    activeEquityUsd: 100.0,
    winRate: 100.0,
    maxDrawdown: 0.0,
    status: "LIVE & ACTIVE",
    copiersCount: 18,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "07:45:00"
  },
  copytrades: [],
  copytradeRequests: []`
  );
}

// In /api/market/sync-mt5 follower section: sync Account 2 into db.copytrade2
const oldFollowerSync = `      // Follower Accounts (e.g. Account 2 #5100207348) must NEVER overwrite Master positions or purge activeSignals!
      if (!isMasterAccount) {
        if (payload && payload.accountInfo) {
          const acc = payload.accountInfo;
          const trd = (db.traders || []).find(t => String(t.mt5Account) === String(acc.login));
          if (trd) {
            trd.currentBalance = acc.balance;
            trd.currentEquity = acc.equity;
            trd.lastSync = getMYTTimeWithSeconds();
            saveDB(db);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, followerSynced: true, login: payload?.accountInfo?.login }));
      }`;

const newFollowerSync = `      // Follower Accounts (e.g. Account 2 #5100207348) must NEVER overwrite Master positions or purge activeSignals!
      if (!isMasterAccount) {
        if (payload && payload.accountInfo) {
          const acc = payload.accountInfo;
          const trd = (db.traders || []).find(t => String(t.mt5Account) === String(acc.login));
          if (trd) {
            trd.currentBalance = acc.balance;
            trd.currentEquity = acc.equity;
            trd.lastSync = getMYTTimeWithSeconds();
          }

          // SYNC MASTER COPYTRADE 2 (#5100207348):
          if (String(acc.login) === '5100207348') {
            if (!db.copytrade2) {
              db.copytrade2 = {
                id: "master-2",
                name: "The Mighty Duck II",
                avatar: "img/themightyduck.png",
                masterAccount: "5100207348",
                broker: "Versus Trade Ltd. (Live1)",
                initialDeposit: 10000.0,
                totalWithdrawn: 0.0,
                totalWithdrawnUsd: 0.0,
                allTimeProfitUsc: 0.0,
                allTimeProfitUsd: 0.0,
                allTimeGrowthPct: 0.0,
                growthPct: 0.0,
                netProfitUsc: 0.0,
                netProfitUsd: 0.0,
                currentBalance: 10000.0,
                currentEquity: 10000.0,
                activeEquity: 10000.0,
                activeEquityUsd: 100.0,
                winRate: 100.0,
                maxDrawdown: 0.0,
                status: "LIVE & ACTIVE",
                copiersCount: 18,
                affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
              };
            }
            const initDep2 = Number(db.copytrade2.initialDeposit) || 10000.0;
            const eq2 = Number(acc.equity) || db.copytrade2.currentEquity;
            const bal2 = Number(acc.balance) || db.copytrade2.currentBalance;
            const totalWd2 = Number(db.copytrade2.totalWithdrawn) || 0.0;
            db.copytrade2.currentEquity = eq2;
            db.copytrade2.currentBalance = bal2;
            db.copytrade2.activeEquity = eq2;
            db.copytrade2.activeEquityUsd = +(eq2 / 100).toFixed(2);
            const netProfit2 = +(eq2 + totalWd2 - initDep2).toFixed(2);
            db.copytrade2.netProfitUsc = netProfit2;
            db.copytrade2.netProfitUsd = +(netProfit2 / 100).toFixed(2);
            db.copytrade2.growthPct = +((netProfit2 / initDep2) * 100).toFixed(2);
            db.copytrade2.allTimeProfitUsc = Math.max(netProfit2, 0);
            db.copytrade2.allTimeGrowthPct = Math.max(db.copytrade2.growthPct, 0);
            db.copytrade2.lastSync = getMYTTimeWithSeconds();

            if (!Array.isArray(db.copytrades)) {
              db.copytrades = [db.copytrade, db.copytrade2];
            } else {
              db.copytrades[1] = db.copytrade2;
            }
            broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrades: db.copytrades });
          }
          saveDB(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, followerSynced: true, login: payload?.accountInfo?.login, copytrade2: db.copytrade2 }));
      }`;

serverJs = serverJs.replace(oldFollowerSync.replace(/\r\n/g, '\n'), () => newFollowerSync);
serverJs = serverJs.replace(oldFollowerSync.replace(/\n/g, '\r\n'), () => newFollowerSync);

// In initial_sync SSE: send copytrade2 and copytrades
const oldInitialSync = `      copytrade: db.copytrade || null
    })}\n\n\`);`;

const newInitialSync = `      copytrade: db.copytrade || null,
      copytrade2: db.copytrade2 || null,
      copytrades: db.copytrades || [db.copytrade, db.copytrade2].filter(Boolean)
    })}\n\n\`);`;

serverJs = serverJs.replace(oldInitialSync.replace(/\r\n/g, '\n'), () => newInitialSync);
serverJs = serverJs.replace(oldInitialSync.replace(/\n/g, '\r\n'), () => newInitialSync);

// In GET /api/copytrade/info
const oldCopytradeGet = `  // 0.1c GET /api/copytrade/info
  if (pathname === '/api/copytrade/info' && req.method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.copytrade || {}));
  }`;

const newCopytradeGet = `  // 0.1c GET /api/copytrade/info
  if (pathname === '/api/copytrade/info' && req.method === 'GET') {
    const db = getDB();
    const list = db.copytrades || [db.copytrade, db.copytrade2].filter(Boolean);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      copytrade: db.copytrade || {},
      copytrade2: db.copytrade2 || {},
      copytrades: list
    }));
  }`;

serverJs = serverJs.replace(oldCopytradeGet.replace(/\r\n/g, '\n'), () => newCopytradeGet);
serverJs = serverJs.replace(oldCopytradeGet.replace(/\n/g, '\r\n'), () => newCopytradeGet);

fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('[OK] server.js updated with dual master copytrade sync & endpoints!');

// ==========================================
// 3. UPDATE js/core.js
// ==========================================
let coreJs = fs.readFileSync('js/core.js', 'utf8');

// in load():
coreJs = coreJs.replace(
  'this.copytrade = this.db.copytrade || null;',
  `this.copytrade = this.db.copytrade || null;
      this.copytrade2 = this.db.copytrade2 || null;
      this.copytrades = this.db.copytrades || [this.copytrade, this.copytrade2].filter(Boolean);`
);

// in initial_sync:
coreJs = coreJs.replace(
  'this.copytrade = d.copytrade || null;',
  `this.copytrade = d.copytrade || null;
        this.copytrade2 = d.copytrade2 || null;
        this.copytrades = d.copytrades || [this.copytrade, this.copytrade2].filter(Boolean);`
);

// in s.addEventListener('copytrade_update', ...):
const oldCoreSSE = `      s.addEventListener('copytrade_update', e => {
        try {
          const cp = JSON.parse(e.data);
          this.copytrade = cp;
          document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
            el.textContent = \`+\${cp.growthPct || 122.55}%\`;
          });
          document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
            el.textContent = \`\${num(cp.currentEquity || 2254.62)} USC\`;
          });
          document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
            el.textContent = \`+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 12254.62)} USC\`;
          });
        } catch (err) {}
      });`;

const newCoreSSE = `      s.addEventListener('copytrade_update', e => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.copytrade) {
            this.copytrade = raw.copytrade;
            if (raw.copytrade2) this.copytrade2 = raw.copytrade2;
            if (raw.copytrades) this.copytrades = raw.copytrades;
          } else {
            this.copytrade = raw;
          }
          if (typeof window.refreshCopytradeUI === 'function') {
            window.refreshCopytradeUI();
          } else {
            document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
              el.textContent = \`+\${this.copytrade.growthPct || 122.55}%\`;
            });
            document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
              el.textContent = \`\${num(this.copytrade.currentEquity || 2254.62)} USC\`;
            });
            document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
              el.textContent = \`+\${num(this.copytrade.allTimeProfitUsc || this.copytrade.netProfitUsc || 12254.62)} USC\`;
            });
          }
        } catch (err) {}
      });`;

coreJs = coreJs.replace(oldCoreSSE.replace(/\r\n/g, '\n'), () => newCoreSSE);
coreJs = coreJs.replace(oldCoreSSE.replace(/\n/g, '\r\n'), () => newCoreSSE);

fs.writeFileSync('js/core.js', coreJs, 'utf8');
console.log('[OK] js/core.js updated with dual master copytrade listener!');
