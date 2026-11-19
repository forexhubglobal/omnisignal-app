const https = require('https');

https.get('https://amaterasux.onrender.com/api/data', res => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(raw);
      console.log('=== 1. SERVER HEALTH & PING ===');
      console.log('HTTP Status:', res.statusCode);
      console.log('Current System Time:', new Date().toISOString());

      console.log('\n=== 2. MASTER ACCOUNTS SYNC STATUS ===');
      const ct1 = d.copytrade || {};
      const ct2 = d.copytrade2 || (d.copytrades && d.copytrades[1]) || {};
      const ct3 = d.copytrade3 || (d.copytrades && d.copytrades[2]) || {};

      console.log('MASTER 1 (#5100154135 Cent - The Mighty Duck):', {
        balance: ct1.currentBalance,
        equity: ct1.currentEquity,
        growth: ct1.growthPct + '%',
        lastSync: ct1.lastSync,
        openPosCount: (ct1.openPositions || []).length
      });

      console.log('MASTER 2 (#5100207348 Cent - Amaterasu X):', {
        balance: ct2.currentBalance,
        equity: ct2.currentEquity,
        growth: ct2.growthPct + '%',
        lastSync: ct2.lastSync,
        openPosCount: (ct2.openPositions || []).length
      });

      console.log('MASTER 3 (#5100209626 Standard USD - Amaterasu X 2.0):', {
        balance: ct3.currentBalance,
        equity: ct3.currentEquity,
        growth: ct3.growthPct + '%',
        lastSync: ct3.lastSync,
        openPosCount: (ct3.openPositions || []).length
      });

      console.log('\n=== 3. OPEN POSITIONS IN MT5 ===');
      const allOpen = d.openPositions || [];
      console.log('Total Root Open Positions:', allOpen.length);
      const m2Open = ct2.openPositions || [];
      const m3Open = ct3.openPositions || [];
      console.log('M2 Open Positions Count:', m2Open.length);
      console.log('M3 Open Positions Count:', m3Open.length);

      const summarizePos = (posList, label) => {
        const bySym = {};
        posList.forEach(p => {
          bySym[p.symbol] = bySym[p.symbol] || { count: 0, profit: 0, type: p.type, minPrice: 99999, maxPrice: 0, sl: p.sl, tp: p.tp };
          bySym[p.symbol].count++;
          bySym[p.symbol].profit = +(bySym[p.symbol].profit + (p.profit || 0)).toFixed(2);
          bySym[p.symbol].minPrice = Math.min(bySym[p.symbol].minPrice, p.openPrice || 0);
          bySym[p.symbol].maxPrice = Math.max(bySym[p.symbol].maxPrice, p.openPrice || 0);
          bySym[p.symbol].sl = p.sl;
          bySym[p.symbol].tp = p.tp;
        });
        console.log(`Posisi ${label}:`, JSON.stringify(bySym, null, 2));
      };

      if (m2Open.length > 0) summarizePos(m2Open, 'Master 2');
      if (m3Open.length > 0) summarizePos(m3Open, 'Master 3');

      console.log('\n=== 4. ACTIVE SIGNALS (ON PIPS) ===');
      const sigs = d.activeSignals || [];
      console.log('Active Signals Count:', sigs.length);
      sigs.forEach(s => {
        console.log(`* [${s.symbol}] ${s.type} | Entry: ${s.entry} | SL: ${s.sl} | TP1: ${s.tp1} | Status: ${s.status} | Floating: ${s.floatingPips}p`);
      });

      console.log('\n=== 5. AI ENGINE & NEWS SYNERGY ===');
      console.log('News Synergy Mode:', d.newsSynergyMode || 'AUTO');
      console.log('AI News Stats:', d.aiNewsStats);

    } catch (e) {
      console.error('Parse Error:', e.message);
    }
  });
}).on('error', e => console.error('Request Error:', e));
