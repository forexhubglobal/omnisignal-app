const https = require('https');

https.get('https://amaterasux.onrender.com/api/data', res => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(raw);
      console.log('=== 1. TELEMETRY AKAUN MASTER ===');
      console.log('MASTER 1 (#5100154135 Cent):', {
        balance: d.copytrade?.currentBalance,
        equity: d.copytrade?.currentEquity,
        growth: (d.copytrade?.growthPct || 0) + '%',
        lastSync: d.copytrade?.lastSync
      });
      console.log('MASTER 2 (#5100207348 Cent):', {
        balance: d.copytradeMaster2?.currentBalance,
        equity: d.copytradeMaster2?.currentEquity,
        growth: (d.copytradeMaster2?.growthPct || 0) + '%',
        lastSync: d.copytradeMaster2?.lastSync
      });
      console.log('MASTER 3 (#5100209626 Standard USD):', {
        balance: d.copytradeMaster3?.currentBalance,
        equity: d.copytradeMaster3?.currentEquity,
        growth: (d.copytradeMaster3?.growthPct || 0) + '%',
        lastSync: d.copytradeMaster3?.lastSync
      });

      console.log('\n=== 2. ISYARAT AKTIF (ON PIPS) ===');
      console.log('Jumlah Active Signals:', (d.activeSignals || []).length);
      (d.activeSignals || []).forEach(s => {
        console.log(`* ${s.symbol} ${s.type} | Entry: ${s.entry} | SL: ${s.sl} | TP1: ${s.tp1} | Status: ${s.status} | Floating: ${s.floatingPips}p`);
      });

      console.log('\n=== 3. LIVE MT5 OPEN POSITIONS ===');
      const pos = d.openPositions || [];
      console.log('Jumlah MT5 Open Positions:', pos.length);
      const bySym = {};
      let totalFloatingProfit = 0;
      pos.forEach(p => {
        bySym[p.symbol] = bySym[p.symbol] || { count: 0, profit: 0, buy: 0, sell: 0, totalLots: 0 };
        bySym[p.symbol].count++;
        bySym[p.symbol].profit += p.profit;
        bySym[p.symbol].totalLots += (p.volume || 0);
        totalFloatingProfit += p.profit;
        if (p.type === 'BUY') bySym[p.symbol].buy++;
        else bySym[p.symbol].sell++;
      });
      console.log('Total Floating MT5 Profit:', totalFloatingProfit);
      console.log('Ringkasan Posisi MT5 per Simbol:', JSON.stringify(bySym, null, 2));

      console.log('\n=== 4. LIVE MARKET QUOTES ===');
      ['XAUUSD', 'EURUSD', 'USDCHF'].forEach(sym => {
        if (d.liveQuotes && d.liveQuotes[sym]) {
          console.log(`${sym}: Bid=${d.liveQuotes[sym].bid} | Ask=${d.liveQuotes[sym].ask}`);
        }
      });
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', e => console.error(e));
