const https = require('https');

https.get('https://amaterasux.onrender.com/api/data', res => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(raw);
      const recentSigs = (d.signals || []).slice(0, 40);
      console.log('=== AUTOPSY TRADES HARI INI (10 NOV 2026) ===');
      const todayNov10 = recentSigs.filter(s => s.date && s.date.includes('Nov 10'));
      console.log('Jumlah Trade Ditutup 10 Nov:', todayNov10.length);

      let totalPips = 0;
      let wins = 0;
      let losses = 0;
      todayNov10.forEach(s => {
        const sign = s.pips > 0 ? '+' : '';
        totalPips += s.pips;
        if (s.pips > 0) wins++;
        else if (s.pips < 0) losses++;
        console.log(`[${s.time}] ${s.symbol} ${s.type} -> ${s.status} (${sign}${s.pips}p) | Peak: ${s.peak}p`);
      });

      console.log('--------------------------------------------------');
      console.log(`Total Pips Hari Ini: ${totalPips > 0 ? '+' : ''}${totalPips} pips`);
      console.log(`Wins: ${wins} | Losses: ${losses} | WinRate: ${((wins / (wins + losses || 1)) * 100).toFixed(1)}%`);

      console.log('\n=== POSISI AKTIF MT5 SEKARANG ===');
      const m3 = d.copytrade3?.openPositions || [];
      const m2 = d.copytrade2?.openPositions || [];
      console.log('Master 3 Positions:', m3.map(p => ({ sym: p.symbol, type: p.type, open: p.openPrice, sl: p.sl, tp: p.tp, prof: p.profit })));
      console.log('Master 2 Positions:', m2.map(p => ({ sym: p.symbol, type: p.type, open: p.openPrice, sl: p.sl, tp: p.tp, prof: p.profit })));
    } catch (e) {
      console.error(e);
    }
  });
});
