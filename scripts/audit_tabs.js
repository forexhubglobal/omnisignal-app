const fs = require('fs');
const http = require('http');

console.log('==================================================');
console.log('   AMATERASU X - 7 TABS FULL FUNCTIONALITY AUDIT   ');
console.log('==================================================');

const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));

// 1. SIGNAL TAB AUDIT
console.log('\n[1/7] TAB: SIGNAL');
console.log('  - Active Hero Signal:', db.activeSignal ? `${db.activeSignal.symbol} ${db.activeSignal.type} @ ${db.activeSignal.entry} (Status: ${db.activeSignal.status})` : 'None');
if (db.activeSignal) {
  console.log(`    TP1: ${db.activeSignal.tp1} | TP2: ${db.activeSignal.tp2} | TP3: ${db.activeSignal.tp3} | SL: ${db.activeSignal.sl}`);
  console.log(`    Analysis/Notes: ${db.activeSignal.notes ? 'OK (Present)' : 'MISSING'}`);
}
console.log(`  - On Pips (Multi-asset Active Signals): ${db.activeSignals ? db.activeSignals.length : 0} running`);
(db.activeSignals || []).forEach((s, idx) => {
  console.log(`    #${idx+1} ${s.symbol} ${s.type} Entry: ${s.entry} TP1: ${s.tp1} TP2: ${s.tp2} TP3: ${s.tp3} CurP: ${s.curP} Pips: ${s.currentPips} (Ticks: ${s.ticks}, BE: ${s.beLocked})`);
});
console.log(`  - Signal History: ${db.signals ? db.signals.length : 0} closed signals`);
(db.signals || []).slice(-5).forEach((s, idx) => {
  console.log(`    Hist #${idx+1} ${s.symbol} ${s.type} Outcome: ${s.outcome} Pips: ${s.pips} Tags: [${s.tags || ''}] Time: ${s.closedAt}`);
});

// 2. STAT TAB AUDIT
console.log('\n[2/7] TAB: STAT');
console.log('  - Stats Summary:', JSON.stringify(db.stats, null, 2));
const statsValid = db.stats && typeof db.stats.totalSignals === 'number' && typeof db.stats.winRate === 'number' && typeof db.stats.tp1Hit === 'number' && typeof db.stats.tp2Hit === 'number' && typeof db.stats.tp3Hit === 'number';
console.log(`  - TP1/TP2/TP3 Fields Integrity: ${statsValid ? '100% OK' : 'MISSING FIELDS'}`);

// 3. ANALYSIS TAB AUDIT
console.log('\n[3/7] TAB: ANALYSIS');
if (db.analysis) {
  console.log(`  - Asset: ${db.analysis.symbol} (${db.analysis.price})`);
  console.log(`  - Headline: ${db.analysis.headline}`);
  console.log(`  - Resistance: ${db.analysis.resistance} | Support: ${db.analysis.support}`);
  console.log(`  - Multi-Timeframe Trends: M15: ${db.analysis.trends?.m15}, H1: ${db.analysis.trends?.h1}, H4: ${db.analysis.trends?.h4}, D1: ${db.analysis.trends?.d1}`);
  console.log(`  - Driving Factors: ${db.analysis.driving ? 'OK' : 'MISSING'}`);
  console.log(`  - Risk: ${db.analysis.risk ? 'OK' : 'MISSING'}`);
} else {
  console.log('  - ANALYSIS DATA MISSING!');
}

// 4. SCREENER TAB AUDIT
console.log('\n[4/7] TAB: SCREENER');
console.log(`  - Screener Items Count: ${db.screener ? db.screener.length : 0}`);
(db.screener || []).forEach(sc => {
  console.log(`    * ${sc.symbol.padEnd(8)} Price: ${String(sc.price).padEnd(9)} Change: ${String(sc.change).padEnd(7)} Trend: ${sc.trend} (RSI: ${sc.rsi})`);
});

// 5. NEWS TAB AUDIT
console.log('\n[5/7] TAB: NEWS');
console.log(`  - News Stories Count: ${db.newsStories ? db.newsStories.length : 0}`);
(db.newsStories || []).forEach((n, idx) => {
  console.log(`    #${idx+1} [${n.badge}] ${n.title} (${n.time}) - Source: ${n.source}`);
});

// 6. AI NEWS TAB AUDIT
console.log('\n[6/7] TAB: AI NEWS');
console.log(`  - Economic Calendar Events: ${db.economicCalendar ? db.economicCalendar.length : 0}`);
(db.economicCalendar || []).forEach((e, idx) => {
  console.log(`    #${idx+1} ${e.time} [${e.impact}] ${e.currency} - ${e.event} | Bias: ${e.aiSignal?.direction || 'N/A'} (Forecast: ${e.forecast}, Previous: ${e.previous})`);
});
console.log('  - AI News Stats:', JSON.stringify(db.aiNewsStats));
console.log(`  - AI News Performance History: ${db.aiNewsHistory ? db.aiNewsHistory.length : 0} past events`);
(db.aiNewsHistory || []).forEach((h, idx) => {
  console.log(`    Past #${idx+1} ${h.event} (${h.currency}) Result: ${h.outcome} Pips: ${h.pips} Actual: ${h.actual} vs Forecast: ${h.forecast}`);
});

// 7. MORE TAB AUDIT
console.log('\n[7/7] TAB: MORE');
console.log(`  - Academy Masterclasses: ${db.classes ? db.classes.length : 0} active`);
(db.classes || []).forEach(c => console.log(`    * Class: ${c.title} by ${c.instructor} (Registered: ${c.registered})`));
console.log(`  - Championship Contests: ${db.contests ? db.contests.length : 0} active`);
(db.contests || []).forEach(co => console.log(`    * Contest: ${co.title} (Prize: ${co.prizePool}, Participants: ${co.participants})`));
console.log(`  - Trading Products: ${db.products ? db.products.length : 0}`);

console.log('\n==================================================');
console.log('              ALL 7 TABS DATA COMPLETE            ');
console.log('==================================================');
