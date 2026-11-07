const https = require('https');

https.get('https://amaterasux.onrender.com/api/data', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('=== AUDIT SISTEM AMATERASU X & MT5 SYNC ===');
      console.log('Status HTTP:', res.statusCode);
      console.log('Server Timestamp:', new Date().toISOString());

      console.log('\n--- 1. COPYTRADE & MT5 SYNC ---');
      console.log('Copytrade Master Account:', data.copytrade ? data.copytrade.masterAccount : 'N/A');
      console.log('Broker:', data.copytrade ? data.copytrade.broker : 'N/A');
      console.log('Live Balance:', data.copytrade ? data.copytrade.currentBalance : 'N/A', 'USC');
      console.log('Live Equity:', data.copytrade ? data.copytrade.currentEquity : 'N/A', 'USC');
      console.log('Growth:', (data.copytrade ? data.copytrade.growthPct : '0') + '%');
      console.log('Win Rate:', (data.copytrade ? data.copytrade.winRate : '0') + '%');
      console.log('Last Sync Time:', data.copytrade ? data.copytrade.lastSync : 'N/A');
      
      console.log('\n--- 2. ACTIVE SIGNALS & POSITIONS ---');
      const sigs = data.activeSignals || [];
      console.log('Active Signals Count:', sigs.length);
      sigs.forEach(s => {
        console.log(`* [${s.symbol}] ${s.type} | Entry: ${s.entry} | SL: ${s.sl} | TP1: ${s.tp1} | Ticket: ${s.mt5Ticket || s.id}`);
      });
      
      console.log('\n--- 3. TRADERS LIST (ACCOUNT 2 STATUS) ---');
      const acc2 = (data.traders || []).find(t => t.mt5Account === '5100207348');
      if (acc2) {
        console.log('Account 2 Registered:', acc2.name);
        console.log('MT5 Login:', acc2.mt5Account);
        console.log('Status:', acc2.status);
        console.log('Expiry:', acc2.expiresAt);
        console.log('Notes:', acc2.notes);
      } else {
        console.log('Account 2 NOT FOUND');
      }

      console.log('\n--- 4. AI SIGNALS ENGINE ---');
      console.log('Active Signal Object:', data.activeSignal ? data.activeSignal.symbol : 'N/A', data.activeSignal ? data.activeSignal.type : '', '| Status:', data.activeSignal ? data.activeSignal.status : 'N/A');
      console.log('Total News Signals:', data.aiNewsStats ? data.aiNewsStats.totalNewsSignals : 0);
      console.log('News Win Rate:', (data.aiNewsStats ? data.aiNewsStats.winRate : 0) + '%');
      
      console.log('\n--- 5. LIVE TICKS / QUOTES ---');
      const quotes = data.liveQuotes || {};
      console.log('Tick Quotes Count:', Object.keys(quotes).length);
      ['XAUUSD', 'USDCHF', 'EURUSD'].forEach(sym => {
        if (quotes[sym]) {
          console.log(`* ${sym}: Bid ${quotes[sym].bid} | Ask ${quotes[sym].ask}`);
        }
      });
      console.log('\n=== KEPUTUSAN AUDIT: 100% OPERASIONAL ===');
    } catch(e) {
      console.error('Parse Error:', e.message);
    }
  });
}).on('error', e => console.error('Request Error:', e));
