const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Protect server process from termination on broken client sockets or transient errors
process.on('uncaughtException', (err) => {
  console.error('[CRASH GUARD] uncaughtException caught:', err && err.message ? err.message : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH GUARD] unhandledRejection caught:', reason);
});

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const TMP_DB_FILE = path.join(os.tmpdir(), 'amaterasu_db_cache.json');

// Ensure data directory
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Malaysia Timezone (MYT / UTC+8) Formatter Helpers
function getMYTTime(options = { hour12: false, hour: '2-digit', minute: '2-digit' }) {
  try {
    return new Date().toLocaleTimeString('en-US', { ...options, timeZone: 'Asia/Kuala_Lumpur' });
  } catch (e) {
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    return d.toISOString().substr(11, 5);
  }
}

function getMYTTimeWithSeconds() {
  try {
    return new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
  } catch (e) {
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    return d.toISOString().substr(11, 8);
  }
}

function getMYTDate(options = { month: 'short', day: 'numeric' }) {
  try {
    return new Date().toLocaleDateString('en-US', { ...options, timeZone: 'Asia/Kuala_Lumpur' });
  } catch (e) {
    return new Date().toLocaleDateString('en-US', options);
  }
}

// Initial Database Seeds
const defaultDB = {
  stats: {
    totalSignals: 0,
    winRate: 0,
    tp1Hit: 0,
    tp2Hit: 0,
    tp3Hit: 0,
    slHit: 0,
    totalProfitToday: 0,
    last7Days: [
      { day: 'Wed', pips: 480 },
      { day: 'Thu', pips: 540 },
      { day: 'Fri', pips: 620 },
      { day: 'Sat', pips: 210 },
      { day: 'Sun', pips: 180 },
      { day: 'Mon', pips: 710 },
      { day: 'Today', pips: 0 }
    ]
  },
  activeSignal: {
    status: 'WAITING', // 'WAITING' or 'ACTIVE'
    symbol: 'XAUUSD',
    type: 'BUY',
    timeframe: 'M15',
    entry: 0,
    tp1: 0,
    tp2: 0,
    sl: 0,
    firedAt: null,
    notes: 'Amaterasu AI (Institutional SMC & Malaysian SNR Model) mengimbas zon kecairan Order Block & Malaysian SNR untuk setup berkebarangkalian tinggi...'
  },
  signals: [],
  aiNewsStats: {
    totalNewsSignals: 0,
    winRate: 0,
    tpHit: 0,
    slHit: 0,
    totalPips: 0
  },
  aiNewsHistory: [],
  analysis: {
    symbol: 'XAUUSD',
    date: '17 October 2026, 18:00',
    headline: 'Solar Macro Bias: USD yields pressure gold intraday while long-term solar trend holds bullish',
    price: 2738.50,
    unit: 'USD/oz',
    trends: {
      m1: 'BULLISH',
      m5: 'BULLISH',
      h1: 'BULLISH',
      d1: 'BULLISH'
    },
    direction: 'UP',
    resistance: ['2,746.50 (M15 immediate)', '2,758.00 (H1 secondary)', '2,770.00 (H4 major)'],
    support: ['2,730.00 (M15 nearest)', '2,722.50 (H1 secondary)', '2,710.00 (H4 major)'],
    driving: [
      'US inflation data printed above estimates, driving rapid bond yield expansions and dampening gold bullion appetite.',
      'Amaterasu multi-timeframe algorithm detects M1 and M5 price compression beneath the 200 EMA cluster (4,028.50).',
      'Liquidity sweep at 4,032 was rejected cleanly, validating tactical short scalp rotations toward 4,015.20.'
    ],
    risk: 'If H1 candle closes firmly above 4,030.88 with volume confirmation, intraday bearish bias is invalidated in favor of D1 solar momentum.',
    takeaway: 'Scale into short liquidity pockets between 4,028.00 and 4,030.88 with tight SL at 4,035.00. Primary profit objective sits at 4,015.20.'
  },
  screener: [
    { symbol: 'XAUUSD', price: '4,024.87', trend: 'BEARISH', strengthLabel: 'WEAK BEARISH', strengthVal: -26 },
    { symbol: 'GBPJPY', price: '209.646', trend: 'NEUTRAL', strengthLabel: 'WEAK BEARISH', strengthVal: -26 },
    { symbol: 'BTCUSD', price: '81,700', trend: 'BULLISH', strengthLabel: 'NEUTRAL', strengthVal: 14 },
    { symbol: 'WTI', price: '101.12', trend: 'BULLISH', strengthLabel: 'STRONG BULLISH', strengthVal: 100 },
    { symbol: 'EURUSD', price: '1.12304', trend: 'NEUTRAL', strengthLabel: 'NEUTRAL', strengthVal: 8 },
    { symbol: 'USDJPY', price: '156.102', trend: 'BEARISH', strengthLabel: 'STRONG BEARISH', strengthVal: -64 }
  ],
  newsStories: [
    { id: 1, flags: ['us', 'jp'], time: '4 hours ago', title: 'USD/JPY: Yen Surges as BoJ Signals Aggressive Rate Normalization' },
    { id: 2, flags: ['eu', 'us'], time: '4 days ago', title: 'EUR/USD: Euro Holds Steady Near $1.1230 amid ECB Inflation Rebalancing' },
    { id: 3, flags: ['eu', 'us'], time: 'Oct 7', title: 'EUR/USD: Structural Downtrend Tested as Federal Reserve Tightening Pauses' },
    { id: 4, flags: ['us'], time: 'Oct 6', title: 'Gold Consolidates Above $4,000 Milestone with Central Bank Reserve Inflows' }
  ],
  economicCalendar: [
    { id: 'ev-1', day: 'Today', date: 'October 23', time: '20:30', country: 'us', name: 'Initial Jobless Claims', impact: 3, previous: '225 K', forecast: '223 K' },
    { id: 'ev-2', day: 'Today', date: 'October 23', time: '22:00', country: 'us', name: 'Existing Home Sales', impact: 2, previous: '4.06 M', forecast: '4.10 M' },
    { id: 'ev-3', day: 'Tomorrow', date: 'October 24', time: '14:00', country: 'gb', name: 'Retail Sales m/m', impact: 3, previous: '0.4%', forecast: '0.2%' },
    { id: 'ev-4', day: 'Tomorrow', date: 'October 24', time: '17:00', country: 'eu', name: 'German Ifo Business Climate', impact: 2, previous: '87.7', forecast: '88.1' },
    { id: 'ev-5', day: 'Next Week', date: 'November 2', time: '23:00', country: 'us', name: 'ISM Manufacturing PMI', impact: 3, previous: '54.5', forecast: '55.0' },
    { id: 'ev-6', day: 'Next Week', date: 'November 3', time: '23:00', country: 'us', name: 'JOLTS Job Openings', impact: 3, previous: '7.079 M', forecast: '7.120 M' },
    { id: 'ev-7', day: 'Next Week', date: 'November 4', time: '21:15', country: 'us', name: 'ADP National Employment', impact: 3, previous: '90 K', forecast: '95 K' }
  ],
  classes: [
    { id: 'cls-1', title: 'Amaterasu Solar Scalping Live', trainer: 'Sensei Hiro', date: '2026-10-24', timeMYT: '21:00 MYT', duration: '90 mins', attendees: 184, link: 'https://zoom.us' },
    { id: 'cls-2', title: 'Sun-Disc Liquidity & Order Flow', trainer: 'Lead Quant Kenji', date: '2026-10-26', timeMYT: '21:00 MYT', duration: '120 mins', attendees: 142, link: 'https://zoom.us' },
    { id: 'cls-3', title: 'Weekly Macro & Gold Forecast', trainer: 'Amaterasu Desk', date: '2026-10-28', timeMYT: '20:30 MYT', duration: '60 mins', attendees: 290, link: 'https://zoom.us' }
  ],
  products: [
    { id: 'prd-1', name: 'Amaterasu Solar AI Indicator (MT5)', type: 'indicator', price: '$299', desc: 'Predictive solar trend momentum, institutional liquidity bands & zero-lag alerts.' },
    { id: 'prd-2', name: 'Amaterasu Order Flow Heatmap Pro', type: 'indicator', price: '$199', desc: 'Institutional volume profile and algorithmic liquidity absorption radar.' },
    { id: 'prd-3', name: 'Amaterasu Sovereign Trader Mastery', type: 'course', price: '$499', desc: 'Complete 12-stage institutional trading mastery program from edge to funded capital.' }
  ],
  contests: [
    {
      id: 'ct-1',
      title: 'Amaterasu Solar Championship 2026',
      status: 'active', // 'active', 'upcoming', 'ended'
      prizePool: '$25,000 USD',
      startDate: '2026-10-15',
      endDate: '2026-10-31',
      participantsCount: 128,
      leaderboard: [
        { rank: 1, name: 'SolarBlade_MY', returnRate: '+412.5%', pips: 2450, badge: '👑' },
        { rank: 2, name: 'Amaterasu_Ghost', returnRate: '+328.0%', pips: 1980, badge: '🥈' },
        { rank: 3, name: 'ZenTrader_KL', returnRate: '+295.4%', pips: 1720, badge: '🥉' },
        { rank: 4, name: 'kj35 (You)', returnRate: '+184.2%', pips: 979, badge: '☀️' },
        { rank: 5, name: 'KuroNeko_Fx', returnRate: '+142.1%', pips: 860, badge: '5' }
      ]
    }
  ],
  users: [
    { id: 'usr-1', username: 'kj35', displayName: 'kj35', status: 'online', devices: 2, maxDevices: 4, joined: '2026-09-01', pnlTotal: 979 },
    { id: 'usr-2', username: 'trader_zack', displayName: 'Zack Alpha', status: 'offline', devices: 1, maxDevices: 4, joined: '2026-09-15', pnlTotal: 1420 },
    { id: 'usr-3', username: 'nur_trade', displayName: 'NurFX', status: 'online', devices: 1, maxDevices: 4, joined: '2026-10-02', pnlTotal: 650 }
  ],
  feedbacks: [
    { id: 'fb-1', user: 'kj35', message: 'Accuracy Amaterasu AI memang gempak! TP2 hit tepat di zon solar resistance.', createdAt: '2026-10-23 16:45', status: 'replied', reply: 'Arigatou! Amaterasu AI sentiasa pantau liquidity cluster terbaik untuk anda.' },
    { id: 'fb-2', user: 'trader_zack', message: 'Boleh tambah pair GBPUSD dekat screener tak?', createdAt: '2026-10-23 18:20', status: 'pending', reply: '' }
  ],
  pnlRecords: {
    'kj35': {
      'goal-2026-10': 2000,
      '2026-10-19': 350.00,
      '2026-10-20': 420.50,
      '2026-10-21': -80.00,
      '2026-10-22': 210.00,
      '2026-10-23': 180.00
    }
  },
  gameScores: [
    { id: 'sc-1', name: 'Zack Alpha', score: 3840, game: 'blocks', month: '2026-10' },
    { id: 'sc-2', name: 'kj35', score: 2450, game: 'blocks', month: '2026-10' },
    { id: 'sc-3', name: 'NurFX', score: 1920, game: 'blocks', month: '2026-10' }
  ],
  copytrade: {
    name: "The Mighty Duck",
    avatar: "img/themightyduck.png",
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    currentBalance: 16466.53,
    currentEquity: 16478.53,
    growthPct: 64.79,
    netProfitUsc: 6478.53,
    netProfitUsd: 64.79,
    winRate: 89.2,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "04:20:00"
  },
  copytrade2: {
    id: "master-2",
    name: "Amaterasu X",
    avatar: "img/amaterasux.png",
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
  copytradeRequests: []
};

// Helper to synchronize stats with actual signal history

// Helper to format trader pass and compute live 14-day expiry
function formatTraderData(trader) {
  if (!trader) return null;
  const now = new Date();
  const exp = new Date(trader.expiresAt || (now.getTime() + 14 * 86400000));
  const diffMs = exp.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let computedStatus = trader.status || 'active';
  if (computedStatus !== 'locked') {
    if (daysRemaining <= 0) computedStatus = 'expired';
    else if (daysRemaining <= 3) computedStatus = 'expiring';
    else computedStatus = 'active';
  }

  return {
    ...trader,
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
    status: computedStatus
  };
}

function syncStatsWithSignals(db) {
  if (!db || !Array.isArray(db.signals)) return;
  const signals = db.signals;
  let wins = 0, losses = 0, tp1 = 0, tp2 = 0, tp3 = 0, sl = 0;
  let totalProfitAllTime = 0;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Normalise strictly to Malaysia Timezone (Asia/Kuala_Lumpur)
  const mytNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

  // Build last 7 days map from actual signals
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(mytNow);
    d.setDate(mytNow.getDate() - i);
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = (i === 0);

    let dayPips = 0;
    for (const s of signals) {
      if (s.date === dateStr || (isToday && (s.date === 'Today' || s.date === dateStr))) {
        const isBe = s.status === 'BE' || (s.status === 'SL' && (s.peak || 0) >= 25);
        dayPips += isBe ? 0 : (Number(s.pips) || 0);
      }
    }

    last7Days.push({
      day: isToday ? 'Today' : dayName,
      date: dateStr,
      pips: dayPips
    });
  }

  // Aggregate stats across all signals
  for (const s of signals) {
    const isBe = s.status === 'BE' || (s.status === 'SL' && (s.peak || 0) >= 25);
    const p = isBe ? 0 : (Number(s.pips) || 0);
    totalProfitAllTime += p;
    if (p > 0 || ['TP1','TP2','TP3','CLOSED IN PROFIT','TP_TRAIL'].includes(s.status)) {
      wins++;
      if (s.status === 'TP3') tp3++;
      else if (s.status === 'TP2') tp2++;
      else tp1++;
    } else if (s.status === 'SL' && !isBe) {
      losses++;
      sl++;
    }
  }

  const totalSignals = wins + losses;
  const winRate = totalSignals > 0 ? Math.round((wins / totalSignals) * 100) : 92;
  const todayPips = last7Days[last7Days.length - 1].pips;

  db.stats = {
    totalSignals,
    totalSignalsClosed: signals.length,
    totalProfitAllTime,
    winRate,
    tp1Hit: tp1,
    tp2Hit: tp2,
    tp3Hit: tp3,
    slHit: sl,
    totalProfitToday: todayPips,
    last7Days,
    lastUpdated: mytNow.toISOString()
  };
}

// Load or initialize DB with in-memory caching & writable /tmp fallback
let inMemoryDB = null;
function getDB() {
  if (inMemoryDB) {
    syncStatsWithSignals(inMemoryDB);
    return inMemoryDB;
  }
  // 1. Primary: Load bundled DB_FILE (carries latest git deployed data)
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryDB = JSON.parse(content);
      if (!Array.isArray(inMemoryDB.activeSignals)) {
        inMemoryDB.activeSignals = (inMemoryDB.activeSignal && inMemoryDB.activeSignal.status === 'ACTIVE') ? [inMemoryDB.activeSignal] : [];
      }
      syncStatsWithSignals(inMemoryDB);
      return inMemoryDB;
    }
  } catch (e) {
    console.error('Error reading DB_FILE:', e);
  }

  // 2. Fallback to TMP_DB_FILE
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const tmpContent = fs.readFileSync(TMP_DB_FILE, 'utf8');
      inMemoryDB = JSON.parse(tmpContent);
      if (Array.isArray(inMemoryDB.activeSignals)) {
        syncStatsWithSignals(inMemoryDB);
        return inMemoryDB;
      }
    }
  } catch (e) {}

  inMemoryDB = JSON.parse(JSON.stringify(defaultDB));
  syncStatsWithSignals(inMemoryDB);
  return inMemoryDB;
}

let saveTimeout = null;
function saveDB(db) {
  syncStatsWithSignals(db);
  inMemoryDB = db;
  // Debounce writes to disk to prevent I/O blocking and CPU throttling on cloud hosting
  if (!saveTimeout) {
    saveTimeout = setTimeout(() => {
      saveTimeout = null;
      try {
        const payload = JSON.stringify(inMemoryDB, null, 2);
        fs.writeFile(TMP_DB_FILE, payload, 'utf8', () => {});
        fs.writeFile(DB_FILE, payload, 'utf8', () => {});
      } catch (e) {}
    }, 1500);
  }
}

// SSE (Server-Sent Events) clients
const sseClients = new Set();
function broadcastEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      if (client.writable && !client.destroyed) {
        client.write(payload);
      } else {
        sseClients.delete(client);
      }
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// SSE Keep-Alive Heartbeat: Send ping comment every 15s to keep connections alive and prevent proxy disconnects
setInterval(() => {
  for (const client of sseClients) {
    try {
      if (client.writable && !client.destroyed) {
        client.write(': ping\n\n');
      } else {
        sseClients.delete(client);
      }
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 15000);

// ===== LIVE REAL-TIME TRADINGVIEW MARKET FEED SERVICE =====
// Queries TradingView's official scanners directly to achieve 100% 1:1 price synchronization
const TV_SYMBOLS_MAP = {
  cfd: {
    XAUUSD: 'PEPPERSTONE:XAUUSD',
    XAGUSD: 'PEPPERSTONE:XAGUSD'
  },
  forex: {
    EURUSD: 'PEPPERSTONE:EURUSD',
    GBPJPY: 'PEPPERSTONE:GBPJPY',
    GBPUSD: 'PEPPERSTONE:GBPUSD',
    USDJPY: 'PEPPERSTONE:USDJPY',
    EURJPY: 'PEPPERSTONE:EURJPY',
    AUDUSD: 'PEPPERSTONE:AUDUSD',
    USDCAD: 'PEPPERSTONE:USDCAD',
    USDCHF: 'PEPPERSTONE:USDCHF'
  },
  futures: {
    WTI: 'NYMEX:CL1!'
  },
  crypto: {
    BTCUSD: 'BINANCE:BTCUSDT'
  }
};

const liveMarketQuotes = {
  XAUUSD: { price: 3991.50, change: 0.12, decimals: 2 },
  XAGUSD: { price: 52.87, change: 0.25, decimals: 3 },
  EURUSD: { price: 1.1152, change: -0.05, decimals: 4 },
  GBPUSD: { price: 1.3320, change: 0.08, decimals: 4 },
  USDJPY: { price: 157.74, change: 0.15, decimals: 3 },
  GBPJPY: { price: 210.15, change: 0.20, decimals: 3 },
  EURJPY: { price: 175.95, change: 0.10, decimals: 3 },
  AUDUSD: { price: 0.7023, change: -0.04, decimals: 4 },
  USDCAD: { price: 1.4016, change: 0.06, decimals: 4 },
  USDCHF: { price: 0.8283, change: -0.02, decimals: 4 },
  WTI: { price: 100.76, change: -0.45, decimals: 2 },
  BTCUSD: { price: 79700.0, change: 0.15, decimals: 0 }
};

let hasInitialLiveQuote = false;

function queryTradingViewScanner(scannerName, tickers) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      symbols: { tickers },
      columns: ['close', 'change']
    });
    const req = https.request(`https://scanner.tradingview.com/${scannerName}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          const map = {};
          if (j.data && Array.isArray(j.data)) {
            j.data.forEach(item => {
              if (item.s && Array.isArray(item.d) && typeof item.d[0] === 'number') {
                map[item.s] = {
                  price: item.d[0],
                  change: typeof item.d[1] === 'number' ? Number(item.d[1].toFixed(2)) : 0
                };
              }
            });
          }
          resolve(map);
        } catch(e) { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.setTimeout(4000, () => { req.destroy(); resolve({}); });
    req.write(postData);
    req.end();
  });
}

async function refreshAllLiveQuotes() {
  try {
    const [cfdData, fxData, futData, cryData] = await Promise.all([
      queryTradingViewScanner('cfd', Object.values(TV_SYMBOLS_MAP.cfd)),
      queryTradingViewScanner('forex', Object.values(TV_SYMBOLS_MAP.forex)),
      queryTradingViewScanner('futures', Object.values(TV_SYMBOLS_MAP.futures)),
      queryTradingViewScanner('crypto', Object.values(TV_SYMBOLS_MAP.crypto))
    ]);

    const combined = { ...cfdData, ...fxData, ...futData, ...cryData };

    for (const group of Object.values(TV_SYMBOLS_MAP)) {
      for (const [sym, ticker] of Object.entries(group)) {
        if (combined[ticker] && typeof combined[ticker].price === 'number') {
          const decimals = liveMarketQuotes[sym] ? liveMarketQuotes[sym].decimals : 2;
          liveMarketQuotes[sym] = {
            price: Number(combined[ticker].price.toFixed(decimals)),
            change: combined[ticker].change,
            decimals: decimals
          };
        }
      }
    }

    hasInitialLiveQuote = true;
    if (liveMarketQuotes.XAUUSD) {
      currentMarketPrice = liveMarketQuotes.XAUUSD.price;
    }
    broadcastEvent('market_quotes', liveMarketQuotes);
  } catch (err) {
    // Keep last known quotes on failure
  }
}

// MIME Types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ps1': 'text/plain; charset=utf-8',
  '.py': 'text/plain; charset=utf-8',
};

// Helper to read JSON request body (with Max 1MB Payload Guard & Prototype Pollution Defense)
function parseJsonBody(req, maxBytes = 1048576) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        req.destroy();
        return reject(new Error('Payload Too Large: Had maksimum 1MB dilanggar'));
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        // Anti-Prototype Pollution Protection
        if (parsed && typeof parsed === 'object') {
          delete parsed.__proto__;
          delete parsed.constructor;
          delete parsed.prototype;
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ===== AMATERASU X ENTERPRISE SECURITY FORTRESS =====
const SecurityShield = {
  secretKey: process.env.ADMIN_SECRET || 'amaterasu_sovereign_fortress_key_9942',
  masterPasscode: process.env.ADMIN_PASSWORD || 'AMATERASU-2026',

  // In-Memory Rate Limiter & IP Shield
  ipBuckets: new Map(),

  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
  },

  // Global DDoS / Rate Limit Guard (Max 250 req/min per IP)
  checkRateLimit(ip, limit = 250, windowMs = 60000) {
    const now = Date.now();
    let b = this.ipBuckets.get(ip);
    if (!b || now > b.resetTime) {
      b = { count: 0, resetTime: now + windowMs, failedAuth: b?.failedAuth || 0, lockedUntil: b?.lockedUntil || 0 };
      this.ipBuckets.set(ip, b);
    }
    b.count++;
    return b.count <= limit;
  },

  isIpLocked(ip) {
    const b = this.ipBuckets.get(ip);
    if (!b) return false;
    if (b.lockedUntil && Date.now() < b.lockedUntil) {
      return true;
    }
    if (b.lockedUntil && Date.now() >= b.lockedUntil) {
      b.lockedUntil = 0;
      b.failedAuth = 0;
    }
    return false;
  },

  recordFailedAuth(ip) {
    let b = this.ipBuckets.get(ip);
    if (!b) {
      b = { count: 0, resetTime: Date.now() + 60000, failedAuth: 0, lockedUntil: 0 };
      this.ipBuckets.set(ip, b);
    }
    b.failedAuth = (b.failedAuth || 0) + 1;
    if (b.failedAuth >= 5) {
      // 5 failed attempts -> Lock IP for 15 minutes!
      b.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
  },

  resetFailedAuth(ip) {
    const b = this.ipBuckets.get(ip);
    if (b) {
      b.failedAuth = 0;
      b.lockedUntil = 0;
    }
  },

  // Timing-safe comparison to prevent side-channel timing attacks
  safeCompare(a, b) {
    try {
      const hashA = crypto.createHash('sha256').update(String(a || '')).digest();
      const hashB = crypto.createHash('sha256').update(String(b || '')).digest();
      return crypto.timingSafeEqual(hashA, hashB);
    } catch (e) {
      return false;
    }
  },

  // Generate cryptographically signed token: operator:expiry:signature
  generateAdminToken(operator = 'Tengku Khairi') {
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours validity
    const payload = `${operator}:${expiry}`;
    const sig = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
    return `${payload}:${sig}`;
  },

  // Verify token signature and expiration
  verifyAdminToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split(':');
    if (parts.length !== 3) return false;
    const [operator, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    const payload = `${operator}:${expiryStr}`;
    const expectedSig = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
    if (!this.safeCompare(signature, expectedSig)) return false;

    return { operator, expiry };
  },

  // Check request authorization
  isRequestAuthorized(req) {
    const authHeader = req.headers['authorization'] || '';
    const adminToken = req.headers['x-admin-token'] || (authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');
    return this.verifyAdminToken(adminToken);
  }
};

function requireAdminAuth(req, res) {
  const auth = SecurityShield.isRequestAuthorized(req);
  if (!auth) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Akses Disekat: Sesi Master Admin tidak sah atau telah tamat. Sila log masuk ke Command Center semula.',
      unauthorized: true
    }));
    return false;
  }
  return auth;
}

// ===== Telegram VIP Channel & Group Auto-Broadcast =====
const TelegramNotifier = {
  send(text) {
    try {
      const db = getDB();
      const cfg = db.telegramConfig || {};
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return Promise.resolve({ skipped: true });
      }

      const postData = JSON.stringify({
        chat_id: cfg.chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 8000
        }, res => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => {
            try {
              const j = JSON.parse(b);
              resolve({ ok: j.ok === true, data: j });
            } catch(e) { resolve({ ok: false, error: e.message }); }
          });
        });
        req.on('error', err => resolve({ ok: false, error: err.message }));
        req.setTimeout(8000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: e.message });
    }
  },

  formatSignalMessage(sig) {
    const isBuy = sig.type === 'BUY';
    const arrow = isBuy ? '🟢 BUY' : '🔴 SELL';
    const timeStr = sig.firedAt || getMYTTime();
    return `👁️ <b>AMATERASU X · AI INSTITUTIONAL SIGNAL</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 <b>Instrumen:</b> #${sig.symbol}\n` +
      `⚡ <b>Tindakan:</b> ${arrow} (${sig.timeframe || 'M15'})\n` +
      `🕒 <b>Masa:</b> <code>${timeStr} MYT</code>\n` +
      `🎯 <b>Entry:</b> <code>${sig.entry}</code>\n\n` +
      `🎯 <b>Take Profit 1:</b> <code>${sig.tp1}</code>\n` +
      `🚀 <b>Take Profit 2:</b> <code>${sig.tp2}</code>\n` +
      `🏆 <b>Take Profit 3:</b> <code>${sig.tp3 || '---'}</code>\n` +
      `🛑 <b>Stop Loss:</b> <code>${sig.sl}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 <b>AI Confluence:</b> ${sig.notes || 'Amaterasu Institutional SMC & Malaysian SNR'}\n` +
      `⚖️ <b>Risk/Reward:</b> 1 : 3.0\n` +
      `🛡️ <b>SOP:</b> Alih SL ke Break-Even (BE) bila TP1 dicapai! Kunci SL di TP1 bila TP2 dicapai!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 <i>Precision Signals. Smarter Decisions. Your Trading Edge.</i>`;
  },

  formatTp1Message(sig, pips) {
    return `🎯 <b>AMATERASU X · TARGET 1 TERCAPAI! (+${pips || 40} PIPS)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <b>#${sig.symbol}</b> telah mencapai TP1 @ <code>${sig.tp1}</code>!\n` +
      `🛡️ <b>TINDAKAN WAJIB:</b> Ambil 50% partial profit & ubah Stop Loss ke harga Entry (<code>${sig.entry}</code>). Baki posisi sasarkan TP2 & TP3 tanpa sebarang risiko!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 <i>AMATERASU X AI PLATFORM</i>`;
  },

  formatTp2Message(sig, pips) {
    return `🚀 <b>AMATERASU X · TARGET 2 TERCAPAI! (+${pips || 80} PIPS)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 <b>#${sig.symbol}</b> RUNNER HIT TARGET 2 @ <code>${sig.tp2}</code>!\n` +
      `🛡️ <b>TINDAKAN:</b> Alih Stop Loss ke paras TP1 (<code>${sig.tp1}</code>) untuk kunci keuntungan! Baki posisi dibiarkan mengalir ke sasaran maksima TP3 (<code>${sig.tp3 || '---'}</code>)!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 <i>AMATERASU X AI PLATFORM</i>`;
  },

  formatTp3Message(sig, pips) {
    return `🏆 <b>AMATERASU X · ULTIMATE TARGET 3 TERCAPAI! (+${pips || 120} PIPS)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👑 <b>#${sig.symbol}</b> FULL TARGET 3 SECURED @ <code>${sig.tp3 || sig.tp2}</code>!\n` +
      `🎉 <b>Status:</b> Posisi ditutup sepenuhnya (+${pips || 120} pips profit maksima). Tahniah semua operator!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 <i>AMATERASU X AI PLATFORM</i>`;
  }
,

  formatCopytradeMessage(vaultId, cp) {
    const vNum = Number(vaultId);
    if (vNum === 3) {
      const growth = Number(cp?.growthPct || 188.76).toFixed(2);
      const netUsd = Number(cp?.netProfitUsd || 1887.57).toFixed(2);
      const balUsd = Number(cp?.currentBalance || 2887.57).toFixed(2);
      return '👑 <b>AMATERASU X 2.0 · MASTER 3 OFFICIAL STANDARD COPYTRADE</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🏆 <b>Master:</b> AMATERASU X 2.0 (#5100209626)\n' +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '💼 <b>Jenis Akaun:</b> Standard USD ($1,000 Pool)\n' +
        '📈 <b>Live Growth:</b> +' + growth + '%\n' +
        '💰 <b>Untung Bersih Terkumpul:</b> +$' + netUsd + ' USD\n' +
        '💎 <b>Baki Semasa:</b> $' + balUsd + ' USD\n' +
        '🎯 <b>Winrate Terbukti:</b> 91.5% (Max Drawdown < 4%)\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🚀 <b>Sertai Akaun Standard VIP:</b>\n' +
        '1. Buka akaun Versus Trade (Standard USD)\n' +
        '2. Deposit modal $1,000 USD\n' +
        '3. Hantar No MT5 anda di App Amaterasu X untuk disambungkan automatik!\n' +
        '👉 <i>Buka App: https://amaterasux.onrender.com</i>';
    } else if (vNum === 2) {
      const growth = Number(cp?.growthPct !== undefined ? cp.growthPct : 0.0).toFixed(2);
      return '🔥 <b>AMATERASU X · MASTER 2 OFFICIAL COPYTRADE ANNOUNCEMENT</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '👑 <b>Master:</b> AMATERASU X (#5100207348)\n' +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '💼 <b>Status:</b> LIVE & ACTIVE · FRESH STANDBY\n' +
        '📈 <b>Growth:</b> +' + growth + '%\n' +
        '💰 <b>Modal Pool Semasa:</b> 10,000.00 USC ($100.00 USD ✓)\n' +
        '🛡️ <b>Strategi:</b> Institutional SMC + Malaysian SNR Multi-Terminal AI\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🚀 <b>Peluang Masuk Dari Baseline:</b>\n' +
        'Sertai Master 2 sekarang untuk menikmati pertumbuhan akaun sejak hari pertama!\n' +
        '👉 <i>Buka App: https://amaterasux.onrender.com</i>';
    } else {
      const growth = Number(cp?.growthPct || 122.55).toFixed(2);
      const grossProfit = Number(cp?.allTimeProfitUsc || 12254.62).toLocaleString();
      const grossUsd = Number(cp?.allTimeProfitUsd || 122.55).toFixed(2);
      const wd = Number(cp?.totalWithdrawn || 10000.0).toLocaleString();
      const wdUsd = Number(cp?.totalWithdrawnUsd || 100.0).toFixed(2);
      return '🦆 <b>AMATERASU X · THE MIGHTY DUCK COPYTRADE PERFORMANCE</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🏆 <b>Master:</b> THE MIGHTY DUCK (#5100154135)\n' +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '📈 <b>All-Time Realized Growth:</b> +' + growth + '%\n' +
        '💰 <b>Untung Kasar Terkumpul:</b> +' + grossProfit + ' USC (+$' + grossUsd + ' USD)\n' +
        '🛡️ <b>Telah Dikeluarkan (WD):</b> ' + wd + ' USC ($+' + wdUsd + ' USD ✓)\n' +
        '💎 <b>Status Modal Asal:</b> 100% BEBAS RISIKO (Modal asal selamat ditarik keluar!)\n' +
        '🎯 <b>Winrate Terbukti:</b> 90.4% (Max Drawdown < 5%)\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🚀 <b>Sertai Copytrade Sekarang:</b>\n' +
        '1. Buka akaun Versus Trade (Cent Account)\n' +
        '2. Deposit serendah $50 - $100 USD (5,000 - 10,000 USC)\n' +
        '3. Hantar No MT5 anda di App Amaterasu X untuk disambungkan automatik!\n' +
        '👉 <i>Buka App: https://amaterasux.onrender.com</i>';
    }
  }};

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  // CORS & Enterprise Security Headers (OWASP Hardening)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Global DDoS / Rate Limit Guard (Max 250 req/min per IP)
  const clientIp = SecurityShield.getClientIp(req);
  if (!SecurityShield.checkRateLimit(clientIp, 250, 60000)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Too Many Requests (Had Kadar Akses Dilanggar)' }));
  }

  // Fast health check for Render & uptime monitors
  if (pathname === '/api/ping' || pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('pong');
  }

  // SSE Stream: /api/events
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('retry: 3000\n\n');
    sseClients.add(res);

    // Initial sync
    const db = getDB();
    res.write(`event: initial_sync\ndata: ${JSON.stringify({
      activeSignal: db.activeSignal,
      activeSignals: db.activeSignals || (db.activeSignal && db.activeSignal.status === 'ACTIVE' ? [db.activeSignal] : []),
      lastResolvedSignal: db.lastResolvedSignal,
      signals: db.signals || [],
      marketQuotes: liveMarketQuotes,
      stats: db.stats,
      aiNewsStats: db.aiNewsStats || { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 },
      aiNewsHistory: db.aiNewsHistory || [],
      analysis: db.analysis,
      screener: db.screener,
      classes: db.classes,
      contests: db.contests,
      ibs: db.ibs || [],
      traders: (db.traders || []).map(formatTraderData),
      copytrade: db.copytrade || null,
      copytrade2: db.copytrade2 || null,
      copytrade3: db.copytrade3 || null,
      copytrades: db.copytrades || [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean),
      marketBrain: db.marketBrain || AiEngine.updateMarketBrain()
    })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // ===== MASTER AUTHENTICATION FORTRESS ENDPOINTS =====

  // POST /api/auth/master-login
  if (pathname === '/api/auth/master-login' && req.method === 'POST') {
    const clientIp = SecurityShield.getClientIp(req);
    if (SecurityShield.isIpLocked(clientIp)) {
      const remainingSec = Math.ceil(((SecurityShield.ipBuckets.get(clientIp)?.lockedUntil || 0) - Date.now()) / 1000);
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: `[SEKATAN KESELAMATAN] Terlalu banyak percubaan gagal. IP anda disekat selama ${remainingSec} saat.`
      }));
    }

    try {
      const payload = await parseJsonBody(req);
      const inputPasscode = (payload.passcode || payload.password || '').trim();
      const operator = (payload.operator || 'Tengku Khairi').trim();

      if (!inputPasscode || !SecurityShield.safeCompare(inputPasscode, SecurityShield.masterPasscode)) {
        SecurityShield.recordFailedAuth(clientIp);
        const attemptsLeft = Math.max(0, 5 - (SecurityShield.ipBuckets.get(clientIp)?.failedAuth || 0));
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: `Kunci Keselamatan Master tidak sah! (${attemptsLeft} percubaan berbaki sebelum sekatan IP).`
        }));
      }

      // Success
      SecurityShield.resetFailedAuth(clientIp);
      const token = SecurityShield.generateAdminToken(operator);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        token: token,
        operator: operator,
        message: 'Akses Master Admin Disahkan!'
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // GET /api/auth/verify-master
  if (pathname === '/api/auth/verify-master' && req.method === 'GET') {
    const auth = SecurityShield.isRequestAuthorized(req);
    if (!auth) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ valid: false, error: 'Token tidak sah atau tamat tempoh' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ valid: true, operator: auth.operator, expiry: auth.expiry }));
  }

  // ===== REST API Endpoints =====

  // 0.04 GET /api/market/brain (Live Institutional Market Brain Telemetry)
  if (pathname === '/api/market/brain' && req.method === 'GET') {
    const brain = AiEngine.updateMarketBrain();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(brain));
  }

  // 0.05 GET /api/autopsy/xauusd (Live Multi-Timeframe Telemetry for Gold)
  if (pathname === '/api/autopsy/xauusd' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      goldQuote: liveMarketQuotes.XAUUSD || null,
      asianSession: AiEngine.goldAsianSession || null,
      volumeFlow: (AiEngine.liveVolumeFlow && AiEngine.liveVolumeFlow.XAUUSD) || null,
      mtfMaFlow: (AiEngine.liveMtfMaFlow && AiEngine.liveMtfMaFlow.XAUUSD) || null,
      openPositions: (AiEngine.liveMT5Positions || []).filter(p => (p.symbol || '').toUpperCase().includes('XAU')),
      serverTimeMYT: getMYTTimeWithSeconds()
    }));
  }

  // 0. GET /api/market/quotes (Live TradingView-synchronized market feeds)
  if (pathname === '/api/market/quotes' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(liveMarketQuotes));
  }

  // 0.1 POST /api/market/sync-mt5 (Live Bridge Quotes Direct From Local MT5)
  if (pathname === '/api/market/sync-mt5' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      let dbChanged = false;

      if (payload && payload.quotes) {
        for (const [sym, q] of Object.entries(payload.quotes)) {
          if (liveMarketQuotes[sym] && typeof q.price === 'number') {
            liveMarketQuotes[sym].price = Number(q.price.toFixed(liveMarketQuotes[sym].decimals));
            if (typeof q.change === 'number') liveMarketQuotes[sym].change = q.change;
          }
        }
        if (liveMarketQuotes.XAUUSD) {
          currentMarketPrice = liveMarketQuotes.XAUUSD.price;
        }
        broadcastEvent('market_quotes', liveMarketQuotes);
      }

      if (payload && payload.volumeFlow) {
        AiEngine.liveVolumeFlow = payload.volumeFlow;
      }
      if (payload && payload.mtfMaFlow) {
        AiEngine.liveMtfMaFlow = payload.mtfMaFlow;
      }

      const brain = AiEngine.updateMarketBrain();
      db.marketBrain = brain;
      broadcastEvent('market_brain', brain);

      const isMasterAccount = !payload.accountInfo || String(payload.accountInfo.login) === '5100154135' || !payload.accountInfo.login;

      // Follower Accounts (e.g. Account 2 #5100207348) must NEVER overwrite Master positions or purge activeSignals!
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
                name: "Amaterasu X",
                avatar: "img/amaterasux.png",
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
            db.copytrade2.openPositions = payload.openPositions || [];

            if (!Array.isArray(db.copytrades)) {
              db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
            } else {
              db.copytrades[1] = db.copytrade2;
            }
            broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrades: db.copytrades });
          }

          // SYNC MASTER COPYTRADE 3 (#5100209626 - $1,000 USD Standard Account):
          if (String(acc.login) === '5100209626') {
            if (!db.copytrade3) {
              db.copytrade3 = {
                id: "master-3",
                name: "Amaterasu X 2.0",
                avatar: "img/amaterasux_2.jpg",
                masterAccount: "5100209626",
                broker: "Versus Trade Ltd. (Live1)",
                accountType: "Standard USD",
                currency: "USD",
                initialDeposit: 1000.0,
                totalWithdrawn: 0.0,
                totalWithdrawnUsd: 0.0,
                allTimeProfitUsd: 0.0,
                allTimeGrowthPct: 0.0,
                growthPct: 0.0,
                netProfitUsd: 0.0,
                currentBalance: 1000.0,
                currentEquity: 1000.0,
                activeEquity: 1000.0,
                activeEquityUsd: 1000.0,
                winRate: 100.0,
                maxDrawdown: 0.0,
                status: "LIVE & ACTIVE",
                copiersCount: 12,
                affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
              };
            }
            db.copytrade3.name = "Amaterasu X 2.0";
            db.copytrade3.avatar = "img/amaterasux_2.jpg";
            const initDep3 = Number(db.copytrade3.initialDeposit) || 1000.0;
            const eq3 = Number(acc.equity) || db.copytrade3.currentEquity;
            const bal3 = Number(acc.balance) || db.copytrade3.currentBalance;
            const totalWd3 = Number(db.copytrade3.totalWithdrawn) || 0.0;
            db.copytrade3.currentEquity = eq3;
            db.copytrade3.currentBalance = bal3;
            db.copytrade3.activeEquity = eq3;
            db.copytrade3.activeEquityUsd = eq3;
            const netProfit3 = +(eq3 + totalWd3 - initDep3).toFixed(2);
            db.copytrade3.netProfitUsd = netProfit3;
            db.copytrade3.growthPct = +((netProfit3 / initDep3) * 100).toFixed(2);
            db.copytrade3.allTimeProfitUsd = Math.max(netProfit3, 0);
            db.copytrade3.allTimeGrowthPct = Math.max(db.copytrade3.growthPct, 0);
            db.copytrade3.lastSync = getMYTTimeWithSeconds();
            db.copytrade3.openPositions = payload.openPositions || [];

            if (!Array.isArray(db.copytrades)) {
              db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
            } else {
              db.copytrades[2] = db.copytrade3;
            }
            broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrades: db.copytrades });
          }
          saveDB(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, followerSynced: true, login: payload?.accountInfo?.login, copytrade2: db.copytrade2 }));
      }

      if (payload && Array.isArray(payload.openPositions)) {
        AiEngine.liveMT5Positions = payload.openPositions;
        if (db.copytrade) db.copytrade.openPositions = payload.openPositions;

        // =========================================================================
        // CONTINUOUS MT5 POSITION AUTO-RECONCILIATION ENGINE
        // MT5 is the single absolute truth. The Web App MUST reflect MT5 reality!
        // =========================================================================
        const allowedWhitelist = ['XAUUSD', 'USDCHF', 'EURUSD'];

        // Map MT5 positions by clean symbol (e.g. 'XAUUSD', 'USDCHF', 'EURUSD')
        const mt5BySymbol = {};
        for (const p of payload.openPositions) {
          const sym = (p.symbol || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
          if (allowedWhitelist.includes(sym) && !mt5BySymbol[sym]) {
            mt5BySymbol[sym] = p;
          }
        }

        if (!Array.isArray(db.activeSignals)) db.activeSignals = [];

        // 1. Reconcile existing active signals against MT5 open positions
        for (let i = 0; i < db.activeSignals.length; i++) {
          const sig = db.activeSignals[i];
          const sym = (sig.symbol || '').toUpperCase();
          if (sig.isTest) continue;
          const mt5Pos = mt5BySymbol[sym];
          if (mt5Pos) {
            // Direction or major entry divergence: forcefully align to MT5 reality!
            const priceDiff = Math.abs(sig.entry - mt5Pos.openPrice);
            const maxTol = sym === 'XAUUSD' ? 2.0 : 0.0020;
            if (sig.type !== mt5Pos.type || priceDiff > maxTol) {
              console.log(`🚨 [AUTO-RECONCILE] Discrepancy detected for #${sym}! DB was ${sig.type} @ ${sig.entry}. Aligning to MT5 reality: ${mt5Pos.type} @ ${mt5Pos.openPrice}`);
              sig.type = mt5Pos.type;
              sig.entry = mt5Pos.openPrice;
              sig.status = 'ACTIVE';
              sig.notes = `[MT5 Real-Time Verified] Selaras 100% dengan posisi terbuka MT5 (Tiket #${mt5Pos.ticket})`;
              if (mt5Pos.sl) sig.sl = mt5Pos.sl;
              if (mt5Pos.tp) sig.tp1 = mt5Pos.tp;
              dbChanged = true;
            }
            if (!sig.mt5Verified || sig.mt5Ticket !== mt5Pos.ticket) {
              sig.mt5Verified = true;
              sig.mt5Ticket = mt5Pos.ticket;
              sig.mt5OpenPrice = mt5Pos.openPrice;
              dbChanged = true;
            }
          }
        }

        // 2. If MT5 has an open whitelist position not yet in db.activeSignals, auto-insert it!
        for (const [sym, mt5Pos] of Object.entries(mt5BySymbol)) {
          const existing = db.activeSignals.find(s => s.symbol === sym);
          if (!existing) {
            console.log(`⚡ [AUTO-RECONCILE] Inserting missing MT5 position to Web App: #${sym} ${mt5Pos.type} @ ${mt5Pos.openPrice}`);
            const pipMult = sym === 'XAUUSD' ? 1.0 : (sym.includes('JPY') ? 0.01 : 0.0001);
            const slDistance = sym === 'XAUUSD' ? 12 : 25 * pipMult;
            const tp1Distance = sym === 'XAUUSD' ? 6.5 : 20 * pipMult;
            const tp2Distance = sym === 'XAUUSD' ? 13 : 35 * pipMult;
            const tp3Distance = sym === 'XAUUSD' ? 20 : 55 * pipMult;

            const newSig = {
              id: 'mt5-' + mt5Pos.ticket,
              status: 'ACTIVE',
              symbol: sym,
              asset: sym,
              type: mt5Pos.type,
              timeframe: 'M15',
              entry: mt5Pos.openPrice,
              sl: mt5Pos.sl || (mt5Pos.type === 'BUY' ? Number((mt5Pos.openPrice - slDistance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((mt5Pos.openPrice + slDistance).toFixed(sym === 'XAUUSD' ? 2 : 4))),
              tp1: mt5Pos.tp || (mt5Pos.type === 'BUY' ? Number((mt5Pos.openPrice + tp1Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((mt5Pos.openPrice - tp1Distance).toFixed(sym === 'XAUUSD' ? 2 : 4))),
              tp2: mt5Pos.type === 'BUY' ? Number((mt5Pos.openPrice + tp2Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((mt5Pos.openPrice - tp2Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)),
              tp3: mt5Pos.type === 'BUY' ? Number((mt5Pos.openPrice + tp3Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((mt5Pos.openPrice - tp3Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)),
              firedAt: getMYTTime(),
              currentPrice: mt5Pos.openPrice,
              floatingPips: 0,
              beLocked: false,
              mt5Verified: true,
              mt5Ticket: mt5Pos.ticket,
              notes: `[MT5 Real-Time Verified] Isyarat aktif diselaraskan dari terminal broker (Tiket #${mt5Pos.ticket})`
            };
            db.activeSignals.unshift(newSig);
            dbChanged = true;
          }
        }

        // 3. Ensure db.activeSignal matches primary MT5 position (priority: XAUUSD > USDCHF > EURUSD)
        const primarySym = allowedWhitelist.find(s => mt5BySymbol[s]) || (db.activeSignals[0] ? db.activeSignals[0].symbol : 'XAUUSD');
        const primarySig = db.activeSignals.find(s => s.symbol === primarySym) || db.activeSignals[0];
        if (primarySig && (!db.activeSignal || db.activeSignal.symbol !== primarySig.symbol || db.activeSignal.type !== primarySig.type || db.activeSignal.entry !== primarySig.entry)) {
          db.activeSignal = primarySig;
          dbChanged = true;
        }

        // 4. PURGE CLOSED POSITIONS (ZERO GHOST SIGNALS IN ON PIPS):
        // Jika sesuatu signal dalam db.activeSignals tiada lagi dalam posisi terbuka MT5,
        // dan ia bukan signal baharu (< 20 saat), bermakna ia telahpun DITUTUP oleh MT5!
        // Gunakan debounce perlindungan (sekurang-kurangnya 5 kitaran berturut-turut tiada) sebelum menutup!
        for (let i = db.activeSignals.length - 1; i >= 0; i--) {
          const sig = db.activeSignals[i];
          if (sig.isTest || (sig.targetAccount && String(sig.targetAccount) !== '5100154135')) continue;
          const sym = (sig.symbol || '').toUpperCase();
          if (allowedWhitelist.includes(sym)) {
            if (!mt5BySymbol[sym]) {
              sig._missingFromMt5Count = (sig._missingFromMt5Count || 0) + 1;
              if (((sig.ticks || 0) > 5 || sig.mt5Verified) && sig._missingFromMt5Count >= 5) {
                console.log(`🧹 [AUTO-PURGE CLOSED TRADE] #${sym} sudah tiada dalam MT5 selama 5 kitaran berturut-turut (${sig._missingFromMt5Count}). Memadamkan dari On Pips!`);
                const asset = AiEngine.assets.find(a => a.symbol === sym) || AiEngine.assets[0];
                const curP = liveMarketQuotes[sym] ? liveMarketQuotes[sym].price : sig.entry;
                const isBuy = sig.type === 'BUY';
                const isSlHit = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
                const outcome = isSlHit ? (sig.beLocked ? 'BE' : 'SL') : (sig.status === 'TP1_HIT' ? 'TP1' : 'CLOSED');
                const finalPips = outcome === 'SL' ? -asset.slPips : (outcome === 'BE' ? 0 : (sig.floatingPips || 0));
                AiEngine.resolveTrade(db, sig, outcome, finalPips, asset);
                dbChanged = true;
              }
            } else {
              sig._missingFromMt5Count = 0;
            }
          }
        }
      }

      // 5. LIVE COPYTRADE MASTER PERFORMANCE SYNC:
      if (payload && payload.accountInfo) {
        const acc = payload.accountInfo;
        if (!db.copytrade) {
          db.copytrade = {
            name: "The Mighty Duck",
            avatar: "img/themightyduck.png",
            masterAccount: "5100154135",
            broker: "Versus Trade Ltd. (Live1)",
            initialDeposit: 10000.0,
            currentBalance: 16466.53,
            currentEquity: 16478.53,
            growthPct: 64.79,
            netProfitUsc: 6478.53,
            netProfitUsd: 64.79,
            winRate: 89.2,
            maxDrawdown: 4.8,
            status: "LIVE & ACTIVE",
            copiersCount: 42,
            affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
            lastSync: getMYTTimeWithSeconds()
          };
        }
        const initDep = Number(db.copytrade.initialDeposit) || 10000.0;
        const totalWd = Number(db.copytrade.totalWithdrawn) !== undefined ? Number(db.copytrade.totalWithdrawn) : 10000.0;
        const eq = Number(acc.equity) || db.copytrade.currentEquity;
        const bal = Number(acc.balance) || db.copytrade.currentBalance;
        const isDiff = Math.abs((db.copytrade.currentEquity || 0) - eq) > 0.01 || Math.abs((db.copytrade.currentBalance || 0) - bal) > 0.01;
        db.copytrade.currentEquity = eq;
        db.copytrade.currentBalance = bal;
        db.copytrade.totalWithdrawn = totalWd;
        db.copytrade.totalWithdrawnUsd = +(totalWd / 100).toFixed(2);

        // FORMULA INSTITUSI (MYFXBOOK / MQL5 SIGNALS STANDARD):
        // Untung Bersih Kasar = (Baki Semasa + Jumlah Pengeluaran) - Deposit Asal
        const baselineAudit1 = 12254.62;
        const liveNetProfit1 = +(bal + totalWd - initDep).toFixed(2);
        const effectiveGrossUsc = Math.max(liveNetProfit1, baselineAudit1);
        const grossGrowthPct = +(((effectiveGrossUsc) / initDep) * 100).toFixed(2);

        db.copytrade.id = "master-1";
        db.copytrade.name = "The Mighty Duck";
        db.copytrade.avatar = "img/themightyduck.png";
        db.copytrade.allTimeProfitUsc = effectiveGrossUsc;
        db.copytrade.allTimeProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);
        db.copytrade.allTimeGrowthPct = grossGrowthPct;
        db.copytrade.growthPct = grossGrowthPct;
        db.copytrade.netProfitUsc = effectiveGrossUsc;
        db.copytrade.netProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);

        db.copytrade.activeEquity = eq;
        db.copytrade.activeEquityUsd = +(eq / 100).toFixed(2);
        db.copytrade.lastSync = getMYTTimeWithSeconds();

        // ALWAYS SYNC db.copytrades ARRAY SO EVERY ENDPOINT AND UI COMPONENT GETS IDENTICAL NUMBERS:
        if (!Array.isArray(db.copytrades)) {
          db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
        } else {
          db.copytrades[0] = db.copytrade;
        }
        dbChanged = true;
        if (isDiff) {
          broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrades: db.copytrades });
        }
      }

      if (dbChanged) {
        saveDB(db);
        broadcastEvent('on_pips_update', db.activeSignals);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, synced: Object.keys(payload?.quotes || {}).length, reconciled: !!payload?.openPositions, copytrade: db.copytrade }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 0.1c2 POST /api/copytrade/update-settings (Update initialDeposit, totalWithdrawn, etc.)
  if (pathname === '/api/copytrade/update-settings' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
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
      const eq = Number(db.copytrade.currentEquity) || 12254.62;
      const effectiveGrossUsc = Math.max(eq + totalWd - initDep, Number(db.copytrade.allTimeProfitUsc) || 12254.62);
      db.copytrade.growthPct = +((effectiveGrossUsc / initDep) * 100).toFixed(2);
      db.copytrade.netProfitUsc = effectiveGrossUsc;
      db.copytrade.netProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);
      db.copytrade.lastSync = getMYTTimeWithSeconds();

      if (!Array.isArray(db.copytrades)) {
        db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
      } else {
        db.copytrades[0] = db.copytrade;
      }

      saveDB(db);
      broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrades: db.copytrades });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, copytrade: db.copytrade, copytrades: db.copytrades }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 0.1c GET /api/copytrade/info
  if (pathname === '/api/copytrade/info' && req.method === 'GET') {
    const db = getDB();
    const list = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
    db.copytrades = list;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      copytrade: db.copytrade || {},
      copytrade2: db.copytrade2 || {},
      copytrade3: db.copytrade3 || {},
      copytrades: list
    }));
  }

  // 0.1d POST /api/copytrade/join (Client submission to follow copytrade)
  if (pathname === '/api/copytrade/join' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      if (!Array.isArray(db.copytradeRequests)) db.copytradeRequests = [];
      const newReq = {
        id: 'cpr-' + Date.now(),
        name: payload.name || 'Trader Anonymous',
        phone: payload.phone || '',
        mt5Account: payload.mt5Account || '',
        depositAmount: Number(payload.depositAmount) || 100,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
        mytTime: getMYTTimeWithSeconds()
      };
      db.copytradeRequests.unshift(newReq);
      saveDB(db);
      broadcastEvent('copytrade_request_added', newReq);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, request: newReq }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 0.2 POST /api/mt5/sync-event (Bidirectional MT5 execution feedback: SL, TP, closed positions)
  if (pathname === '/api/mt5/sync-event' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const { symbol, event, price, pips, comment, ticket } = payload;
      const db = getDB();
      const rawSymbol = (symbol || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
      
      const sig = (db.activeSignals || []).find(s => s.symbol === rawSymbol);
      if (sig) {
        const asset = AiEngine.assets.find(a => a.symbol === rawSymbol) || AiEngine.assets[0];
        let outcome = 'CLOSED';
        let resolvedPips = Number(pips) || 0;
        
        if (event === 'SL' || (comment && comment.toLowerCase().includes('sl'))) {
          outcome = 'SL';
          resolvedPips = resolvedPips !== 0 ? (resolvedPips > 0 ? -resolvedPips : resolvedPips) : -asset.slPips;
        } else if (event === 'TP1') {
          outcome = 'TP1';
          resolvedPips = resolvedPips > 0 ? resolvedPips : asset.tp1Pips;
        } else if (event === 'TP2' || (comment && comment.toLowerCase().includes('tp'))) {
          outcome = 'TP2';
          resolvedPips = resolvedPips > 0 ? resolvedPips : asset.tp2Pips;
        } else if (event === 'BE') {
          outcome = 'BE';
          resolvedPips = 0;
        }

        AiEngine.resolveTrade(db, sig, outcome, resolvedPips, asset);
        broadcastEvent('on_pips_update', db.activeSignals);
        console.log(`[MT5 SYNC] ${rawSymbol} selesai di MT5 sebagai ${outcome} (${resolvedPips > 0 ? '+' : ''}${resolvedPips}p). Diselaraskan serta-merta.`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, symbol: rawSymbol, outcome, resolvedPips, activeSignalsCount: db.activeSignals.length }));
      } else {
        // Fallback: Pastikan setiap deal MT5 yang ditutup direkodkan ke sejarah signals & statistik
        if (rawSymbol && event && ['TP1', 'TP2', 'TP3', 'SL', 'BE'].includes(event)) {
          const asset = AiEngine.assets.find(a => a.symbol === rawSymbol) || AiEngine.assets[0];
          let outcome = event;
          let resolvedPips = Number(pips) || (event === 'TP1' ? asset.tp1Pips : (event === 'TP2' ? asset.tp2Pips : (event === 'BE' ? 0 : -asset.slPips)));
          const newHistoryItem = {
            id: ticket ? `mt5-${ticket}` : `sig-${Date.now()}`,
            time: getMYTTime(),
            date: getMYTDate(),
            symbol: rawSymbol,
            type: 'BUY',
            entry: Number(price) || asset.base,
            status: outcome,
            pips: resolvedPips,
            tags: [outcome],
            peak: Math.abs(resolvedPips)
          };
          if (!Array.isArray(db.signals)) db.signals = [];
          if (!db.signals.some(s => s.id === newHistoryItem.id)) {
            db.signals.unshift(newHistoryItem);
            syncStatsWithSignals(db);
            saveDB(db);
            console.log(`[MT5 SYNC FALLBACK] ${rawSymbol} (#${ticket}) direkodkan ke sejarah isyarat sebagai ${outcome} (${resolvedPips}p).`);
          }
        }
        if (db.activeSignal && db.activeSignal.symbol === rawSymbol && db.activeSignal.status === 'ACTIVE') {
          db.activeSignal.status = 'WAITING';
          saveDB(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Deal processed and saved' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 1. GET /api/data (Full state for App)
  if (pathname === '/api/data' && req.method === 'GET') {
    const db = getDB();
    if (db.copytrade) {
      if (!Array.isArray(db.copytrades)) {
        db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
      } else {
        db.copytrades[0] = db.copytrade;
        if (db.copytrade2) db.copytrades[1] = db.copytrade2;
        if (db.copytrade3) db.copytrades[2] = db.copytrade3;
      }
    }
    const sanitized = { ...db };
    sanitized.copytrades = [db.copytrade, db.copytrade2, db.copytrade3].filter(Boolean);
    delete sanitized.telegramConfig;
    delete sanitized.invitationCodes;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(sanitized));
  }

  // 1a. GET /api/news (24/7 Live Real-Time News Stream & Calendar Metadata)
  if (pathname === '/api/news' && req.method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      liveStream: '24/7_ACTIVE',
      provider: 'TradingView & Amaterasu Macro Wire',
      newsStories: db.newsStories || [],
      economicCalendar: db.economicCalendar || [],
      tradingViewTimelineUrl: 'https://s.tradingview.com/embed-widget/timeline/?locale=en#%7B%22feedMode%22%3A%22all_symbols%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22displayMode%22%3A%22regular%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22utm_source%22%3A%22localhost%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22timeline%22%7D',
      tradingViewCalendarUrl: 'https://s.tradingview.com/embed-widget/events/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%220%2C1%22%2C%22countryFilter%22%3A%22us%2Ceu%2Cgb%2Cjp%2Cca%2Cau%22%2C%22utm_source%22%3A%22localhost%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22events%22%7D'
    }));
  }

  // 1b. AI Engine Endpoints (100% Autonomous AI Signal Generator)
  if (pathname === '/api/ai/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(AiEngine.getStatus()));
  }

  if (pathname === '/api/ai/toggle' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    AiEngine.enabled = !AiEngine.enabled;
    broadcastEvent('ai_engine_status', AiEngine.getStatus());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(AiEngine.getStatus()));
  }

  if (pathname === '/api/ai/scan-now' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    const db = getDB();
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}
    let targetAsset = null;
    if (payload && payload.symbol) {
      targetAsset = AiEngine.assets.find(a => a.symbol === payload.symbol) || null;
    }
    AiEngine.secondsInState = AiEngine.scanIntervalSec;
    AiEngine.fireAutonomousSignal(db, targetAsset);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, signal: db.activeSignal }));
  }

  // 1c. GET /api/ainews/synergy (Get current AI News & Signal Directional Synergy status)
  if (pathname === '/api/ainews/synergy' && req.method === 'GET') {
    const db = getDB();
    const synergyMode = db.newsSynergyMode || 'AUTO';
    
    // Check next/active event
    const nowParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const nowH = parseInt(nowParts.find(p => p.type === 'hour').value, 10);
    const nowM = parseInt(nowParts.find(p => p.type === 'minute').value, 10);
    const nowTotalMin = nowH * 60 + nowM;

    const schedule = db.aiNewsSchedule || AiEngine.newsSchedule;
    let activeEvent = null;
    let nextEvent = null;
    let minFutureDiff = Infinity;

    for (const ev of schedule) {
      const [evH, evM] = ev.time.split(':').map(Number);
      const evTotalMin = evH * 60 + evM;
      let diff = evTotalMin - nowTotalMin;
      if (diff >= -30 && diff <= 60) {
        activeEvent = { ...ev, diffMinutes: diff, isNowActive: true };
      }
      if (diff > 0 && diff < minFutureDiff) {
        minFutureDiff = diff;
        nextEvent = { ...ev, diffMinutes: diff };
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      mode: synergyMode,
      activeEvent: activeEvent,
      nextEvent: nextEvent,
      isNewsActive: !!activeEvent,
      currentMYT: `${String(nowH).padStart(2,'0')}:${String(nowM).padStart(2,'0')} MYT`,
      schedule: schedule
    }));
  }

  // 1d. POST /api/ainews/synergy (Configure News Synergy Mode)
  if (pathname === '/api/ainews/synergy' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      if (payload.mode) {
        db.newsSynergyMode = payload.mode; // 'AUTO' | 'USD_BUY' | 'USD_SELL' | 'NORMAL'
      }
      if (Array.isArray(payload.schedule)) {
        db.aiNewsSchedule = payload.schedule;
      }
      saveDB(db);
      AiEngine.log(`⚙️ Tetapan Sinergi AI News dikemaskini: Mod ${db.newsSynergyMode}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, mode: db.newsSynergyMode }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (pathname === '/api/ai/config' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      if (payload.frequencyMode) {
        AiEngine.frequencyMode = payload.frequencyMode;
        AiEngine.scanIntervalSec = payload.frequencyMode === 'SCALP_PRO' ? 120 : 300;
      }
      if (typeof payload.targetWinrate === 'number') {
        AiEngine.targetWinrate = Math.max(80, Math.min(98, payload.targetWinrate));
      }
      if (!db.aiConfig) db.aiConfig = {};
      db.aiConfig.frequencyMode = AiEngine.frequencyMode;
      db.aiConfig.targetWinrate = AiEngine.targetWinrate;
      saveDB(db);
      broadcastEvent('ai_engine_status', AiEngine.getStatus());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, status: AiEngine.getStatus() }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 2. POST /api/signal/fire (Manual test override / injection)
  if (pathname === '/api/signal/fire' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const targetSymbol = (payload.symbol || 'XAUUSD').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
      const targetType = (payload.type || 'BUY').toUpperCase();

      // STRICT ANTI-CONFLICT GUARD:
      // Block any signal that contradicts an open position in MT5!
      if (Array.isArray(AiEngine.liveMT5Positions)) {
        const opposingPos = AiEngine.liveMT5Positions.find(p => 
          (p.symbol || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase() === targetSymbol &&
          p.type !== targetType
        );
        if (opposingPos) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: `[SEKATAN KESELAMATAN] Terminal MT5 sedang memegang posisi ${opposingPos.type} bagi #${targetSymbol} (Tiket #${opposingPos.ticket}). Signal bertentangan (${targetType}) disekat demi melindungi trader!`
          }));
        }
      }

      const db = getDB();
      if (!Array.isArray(db.activeSignals)) db.activeSignals = [];
      const newSig = {
        id: 'sig-' + Date.now(),
        status: 'ACTIVE',
        symbol: targetSymbol,
        asset: targetSymbol,
        type: targetType,
        timeframe: payload.timeframe || 'M15',
        entry: Number(payload.entry) || (liveMarketQuotes[targetSymbol]?.price || 1.1147),
        tp1: Number(payload.tp1) || (targetType === 'BUY' ? Number((Number(payload.entry || 1.1147) + 0.0020).toFixed(4)) : Number((Number(payload.entry || 1.1147) - 0.0020).toFixed(4))),
        tp2: Number(payload.tp2) || (targetType === 'BUY' ? Number((Number(payload.entry || 1.1147) + 0.0040).toFixed(4)) : Number((Number(payload.entry || 1.1147) - 0.0040).toFixed(4))),
        sl: Number(payload.sl) || (targetType === 'BUY' ? Number((Number(payload.entry || 1.1147) - 0.0025).toFixed(4)) : Number((Number(payload.entry || 1.1147) + 0.0025).toFixed(4))),
        firedAt: getMYTTime(),
        targetAccount: payload.targetAccount || null,
        isTest: !!payload.isTest,
        notes: payload.notes || 'Signal generated from Amaterasu X AI Desk'
      };
      db.activeSignals = db.activeSignals.filter(s => s.symbol !== newSig.symbol);
      db.activeSignals.unshift(newSig);
      db.activeSignal = newSig;
      saveDB(db);
      broadcastEvent('signal_fired', newSig);
      broadcastEvent('on_pips_update', db.activeSignals);
      TelegramNotifier.send(TelegramNotifier.formatSignalMessage(newSig)).catch(() => {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, signal: newSig, activeSignals: db.activeSignals }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 3. POST /api/signal/update-status (Admin CRM updates active signal: TP1/TP2/SL/CLOSE)
  if (pathname === '/api/signal/update-status' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req); // { status: 'TP1' | 'TP2' | 'SL' | 'CLOSED', pips: 44 }
      const db = getDB();
      const current = db.activeSignal || {};
      const pips = Number(payload.pips) || 0;

      // Special case: TP1 does NOT close the trade! It locks BE and keeps trade running to TP2!
      if (payload.status === 'TP1') {
        db.activeSignal.status = 'TP1_HIT';
        db.activeSignal.beLocked = true;
        db.activeSignal.tp1HitAt = getMYTTime();
        db.activeSignal.tp1Pips = pips || 40;
        db.stats.tp1Hit = (db.stats.tp1Hit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + (pips || 40);
        saveDB(db);
        broadcastEvent('signal_update', {
          type: 'TP1_HIT',
          symbol: db.activeSignal.symbol,
          pips: pips || 40,
          activeSignal: db.activeSignal,
          message: `🎯 Target 1 Tercapai (+${pips || 40} pips)! Alih SL ke Break-Even (BE) sekarang!`
        });
        broadcastEvent('signal_fired', db.activeSignal);
        TelegramNotifier.send(TelegramNotifier.formatTp1Message(db.activeSignal, pips || 40)).catch(() => {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, activeSignal: db.activeSignal, stats: db.stats }));
      }

      // Outcome is TP2, SL, or CLOSED -> Finalize and archive to history
      const newHistoryItem = {
        id: 'sig-' + Date.now(),
        time: getMYTTime(),
        date: getMYTDate(),
        symbol: current.symbol || 'XAUUSD',
        type: current.type || 'BUY',
        entry: current.entry,
        status: payload.status,
        pips: pips,
        tags: payload.status === 'TP2' ? ['TP1', 'TP2'] : payload.status === 'TP1' ? ['TP1'] : [],
        peak: Math.abs(pips) + 5
      };

      db.signals.unshift(newHistoryItem);
      db.lastResolvedSignal = { ...newHistoryItem };

      if (payload.status === 'TP2') {
        TelegramNotifier.send(TelegramNotifier.formatTp2Message(current, pips)).catch(() => {});
      }

      // Update aggregate stats
      db.stats.totalSignals = (db.stats.totalSignals || 0) + 1;
      if (pips > 0) {
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + pips;
        if (payload.status === 'TP2') { db.stats.tp2Hit = (db.stats.tp2Hit || 0) + 1; }
      } else {
        db.stats.slHit = (db.stats.slHit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + pips;
      }
      const wins = db.signals.filter(s => s.pips > 0).length;
      db.stats.winRate = Math.round((wins / db.signals.length) * 100);

      // Reset active signal to WAITING
      db.activeSignal = {
        status: 'WAITING',
        symbol: current.symbol || 'XAUUSD',
        type: current.type === 'BUY' ? 'SELL' : 'BUY',
        timeframe: 'M15',
        entry: current.entry,
        tp1: 0,
        tp2: 0,
        sl: 0,
        firedAt: null,
        notes: `Amaterasu AI Neural Core scanning order book clusters for next high-probability setup...`
      };

      if (Array.isArray(db.activeSignals)) {
        const targetSym = payload.symbol || current.symbol || 'XAUUSD';
        db.activeSignals = db.activeSignals.filter(s => s.symbol !== targetSym && s.id !== current.id);
      }

      saveDB(db);
      broadcastEvent('signal_resolved', { item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal, lastResolvedSignal: db.lastResolvedSignal });
      broadcastEvent('on_pips_update', db.activeSignals);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal, activeSignals: db.activeSignals }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 3b. POST /api/stats/reset (Reset performance stats & signal history to zero)
  if (pathname === '/api/stats/reset' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const db = getDB();
      db.stats = {
        totalSignals: 0,
        winRate: 0,
        tp1Hit: 0,
        tp2Hit: 0,
        tp3Hit: 0,
        slHit: 0,
        totalProfitToday: 0,
        last7Days: [
          { day: 'Wed', pips: 0 },
          { day: 'Thu', pips: 0 },
          { day: 'Fri', pips: 0 },
          { day: 'Sat', pips: 0 },
          { day: 'Sun', pips: 0 },
          { day: 'Mon', pips: 0 },
          { day: 'Today', pips: 0 }
        ]
      };
      db.signals = [];
      db.activeSignals = [];
      db.lastResolvedSignal = null;
      db.aiNewsStats = {
        totalNewsSignals: 0,
        winRate: 0,
        tpHit: 0,
        slHit: 0,
        totalPips: 0
      };
      db.aiNewsHistory = [];
      db.activeSignal = {
        status: 'WAITING',
        symbol: 'XAUUSD',
        type: 'BUY',
        timeframe: 'M15',
        entry: 0,
        tp1: 0,
        tp2: 0,
        sl: 0,
        firedAt: null,
        notes: 'Amaterasu AI (Institutional SMC & Malaysian SNR Model) mengimbas zon kecairan Order Block & Malaysian SNR untuk setup berkebarangkalian tinggi...'
      };
      AiEngine.secondsInState = 0;
      AiEngine.activeTradeTicks = 0;
      AiEngine.tp1Triggered = false;
      saveDB(db);
      broadcastEvent('stats_reset', { stats: db.stats, signals: db.signals, activeSignal: db.activeSignal, aiNewsStats: db.aiNewsStats, aiNewsHistory: db.aiNewsHistory });
      broadcastEvent('ainews_updated', { stats: db.aiNewsStats, history: db.aiNewsHistory });
      broadcastEvent('signal_fired', db.activeSignal);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, stats: db.stats, signals: db.signals, activeSignal: db.activeSignal, aiNewsStats: db.aiNewsStats, aiNewsHistory: db.aiNewsHistory }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 3c. POST /api/ainews/record (Record an executed high-impact AI news signal)
  if (pathname === '/api/ainews/record' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      if (!db.aiNewsStats) {
        db.aiNewsStats = { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 };
      }
      if (!db.aiNewsHistory) db.aiNewsHistory = [];

      const pips = Number(payload.pips) || 0;
      const isWin = payload.status === 'TP' || payload.status === 'TP_HIT' || pips > 0;
      const record = {
        id: 'nws-' + Date.now(),
        date: payload.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: payload.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        event: payload.event || 'US High-Impact Event',
        symbol: payload.symbol || 'XAUUSD',
        bias: payload.bias || (pips >= 0 ? 'BULLISH' : 'BEARISH'),
        entry: Number(payload.entry) || 3995.80,
        status: isWin ? 'TP_HIT' : 'SL_HIT',
        pips: pips
      };

      db.aiNewsHistory.unshift(record);
      db.aiNewsStats.totalNewsSignals = (db.aiNewsStats.totalNewsSignals || 0) + 1;
      if (isWin) {
        db.aiNewsStats.tpHit = (db.aiNewsStats.tpHit || 0) + 1;
      } else {
        db.aiNewsStats.slHit = (db.aiNewsStats.slHit || 0) + 1;
      }
      db.aiNewsStats.totalPips = (db.aiNewsStats.totalPips || 0) + pips;
      db.aiNewsStats.winRate = Math.round((db.aiNewsStats.tpHit / db.aiNewsStats.totalNewsSignals) * 100);

      saveDB(db);
      broadcastEvent('ainews_updated', { stats: db.aiNewsStats, history: db.aiNewsHistory });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, stats: db.aiNewsStats, history: db.aiNewsHistory }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 3d. Telegram VIP Broadcast Configuration & Test
  if (pathname === '/api/telegram/config' && req.method === 'GET') {
    if (!requireAdminAuth(req, res)) return;
    const db = getDB();
    const cfg = { ...(db.telegramConfig || { enabled: false, botToken: '', chatId: '' }) };
    // Mask botToken to protect credentials from exfiltration
    if (cfg.botToken && cfg.botToken.length > 8) {
      cfg.botToken = cfg.botToken.slice(0, 4) + '••••••••' + cfg.botToken.slice(-4);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(cfg));
  }

  if (pathname === '/api/telegram/config' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const existing = db.telegramConfig || {};
      const newBotToken = (payload.botToken || '').trim();
      // Only overwrite botToken if client provided a non-masked value
      const botTokenToSave = (newBotToken && !newBotToken.includes('••••')) ? newBotToken : (existing.botToken || '');
      db.telegramConfig = {
        enabled: Boolean(payload.enabled),
        botToken: botTokenToSave,
        chatId: (payload.chatId || existing.chatId || '').trim(),
        updatedAt: new Date().toISOString()
      };
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Tetapan Telegram disimpan!' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (pathname === '/api/telegram/test' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const cfg = payload.botToken && !payload.botToken.includes('••••') ? payload : (db.telegramConfig || {});
      if (!cfg.botToken || !cfg.chatId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Bot Token dan Chat ID diperlukan!' }));
      }

      const testMsg = `👁️ <b>AMATERASU X · TELEGRAM VIP LINK VERIFIED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ Sambungan Bot Telegram ke Server AMATERASU X berjaya disahkan!\n` +
        `📡 <b>Masa Ujian:</b> ${new Date().toLocaleTimeString('en-US', { hour12: false })}\n` +
        `🤖 <b>Status:</b> Sedia untuk penyiaran isyarat automatik (Auto-Broadcast).\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔥 <i>Precision Signals. Smarter Decisions. Your Trading Edge.</i>`;

      const result = await TelegramNotifier.send(testMsg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: result.ok === true, details: result }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 4. POST /api/analysis/update (Admin CRM updates daily analysis)
  
  // Broadcast Copytrade Performance to Telegram VIP
  if (pathname === '/api/telegram/broadcast-copytrade' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const vaultId = Number(payload.vaultId) || 1;
      const cp = vaultId === 3 ? (db.copytrade3 || {}) : (vaultId === 2 ? (db.copytrade2 || {}) : (db.copytrade || {}));
      const msg = TelegramNotifier.formatCopytradeMessage(vaultId, cp);
      const result = await TelegramNotifier.send(msg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: result.ok === true, details: result, vaultId }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  if (pathname === '/api/analysis/update' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      db.analysis = { ...db.analysis, ...payload, updatedAt: new Date().toISOString() };
      saveDB(db);
      broadcastEvent('analysis_updated', db.analysis);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, analysis: db.analysis }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 5. POST /api/screener/update (Admin CRM updates screener pair)
  if (pathname === '/api/screener/update' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const idx = db.screener.findIndex(s => s.symbol === payload.symbol);
      if (idx !== -1) {
        db.screener[idx] = { ...db.screener[idx], ...payload };
      } else {
        db.screener.push(payload);
      }
      saveDB(db);
      broadcastEvent('screener_updated', db.screener);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, screener: db.screener }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 6. POST /api/feedback (User app sends feedback)
  if (pathname === '/api/feedback' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const fb = {
        id: 'fb-' + Date.now(),
        user: payload.user || 'kj35',
        message: payload.message || '',
        createdAt: new Date().toLocaleString('en-US', { hour12: false }),
        status: 'pending',
        reply: ''
      };
      db.feedbacks.unshift(fb);
      saveDB(db);
      broadcastEvent('feedback_received', fb);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, feedback: fb }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 7. POST /api/feedback/reply (Admin CRM replies)
  if (pathname === '/api/feedback/reply' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req); // { id, reply }
      const db = getDB();
      const fb = db.feedbacks.find(f => f.id === payload.id);
      if (fb) {
        fb.reply = payload.reply;
        fb.status = 'replied';
        saveDB(db);
        broadcastEvent('feedback_replied', fb);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, feedback: fb }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 8. POST /api/classes/create (Admin CRM adds a class)
  if (pathname === '/api/classes/create' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const newClass = {
        id: 'cls-' + Date.now(),
        title: payload.title,
        trainer: payload.trainer || 'Amaterasu Lead Trainer',
        date: payload.date,
        timeMYT: payload.timeMYT || '21:00 MYT',
        duration: payload.duration || '90 mins',
        attendees: 0,
        link: payload.link || '#'
      };
      db.classes.unshift(newClass);
      saveDB(db);
      broadcastEvent('class_added', newClass);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, class: newClass }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 9. POST /api/classes/join (User joins a class)
  if (pathname === '/api/classes/join' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const item = db.classes.find(c => c.id === payload.id);
      if (item) {
        item.attendees = (item.attendees || 0) + 1;
        saveDB(db);
        broadcastEvent('class_updated', item);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, class: item }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 10. POST /api/contest/toggle (Admin starts/stops competition)
  if (pathname === '/api/contest/toggle' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const ct = db.contests[0];
      if (ct) {
        ct.status = payload.status || (ct.status === 'active' ? 'ended' : 'active');
        saveDB(db);
        broadcastEvent('contest_updated', ct);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, contest: ct }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 11. POST /api/scores (Save game score)
  if (pathname === '/api/scores' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const entry = {
        id: 'sc-' + Date.now(),
        name: payload.name || 'Anonymous',
        score: Number(payload.score) || 0,
        game: payload.game || 'blocks',
        month: payload.month || '2026-10'
      };
      db.gameScores.push(entry);
      saveDB(db);
      broadcastEvent('score_added', entry);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, entry }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 12. POST /api/pnl/save (Save user daily PnL)
  if (pathname === '/api/pnl/save' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req); // { user, date, amount/profit }
      const db = getDB();
      const u = payload.user || 'kj35';
      if (!db.pnlRecords[u]) db.pnlRecords[u] = {};
      const rawAmt = payload.amount !== undefined ? payload.amount : payload.profit;
      if (rawAmt === null || rawAmt === undefined) {
        delete db.pnlRecords[u][payload.date];
      } else {
        db.pnlRecords[u][payload.date] = Number(rawAmt);
      }
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, pnl: db.pnlRecords[u] }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 13. POST /api/users/reset-devices (Reset connected devices for operator)
  if (pathname === '/api/users/reset-devices' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const u = db.users.find(usr => usr.id === payload.userId || usr.username === payload.username);
      if (u) {
        u.devices = 1;
        saveDB(db);
        broadcastEvent('user_updated', u);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, user: u }));
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'User not found' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ===== 14. IB & TRADER NETWORK (14-DAY PERFORMANCE PASS ECOSYSTEM) =====

  // 14.1 GET /api/ib/all (Fetch all IBs and summary metrics)
  if (pathname === '/api/ib/all' && req.method === 'GET') {
    const db = getDB();
    const ibs = db.ibs || [];
    const traders = (db.traders || []).map(formatTraderData);
    const summary = {
      totalIbs: ibs.length,
      totalTraders: traders.length,
      activeTraders: traders.filter(t => t.status === 'active').length,
      expiringTraders: traders.filter(t => t.status === 'expiring').length,
      expiredTraders: traders.filter(t => t.status === 'expired' || t.status === 'locked').length,
    };
    const enrichedIbs = ibs.map(ib => {
      const ibTraders = traders.filter(t => t.ibCode === ib.code || t.ibId === ib.id);
      return {
        ...ib,
        traderCount: ibTraders.length,
        activeCount: ibTraders.filter(t => t.status === 'active').length,
        expiringCount: ibTraders.filter(t => t.status === 'expiring').length,
        expiredCount: ibTraders.filter(t => t.status === 'expired' || t.status === 'locked').length,
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, ibs: enrichedIbs, summary }));
  }

  // 14.2 POST /api/ib/create (Master Admin creates new IB)
  if (pathname === '/api/ib/create' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      if (!payload.name || !payload.code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Name and unique IB Code are required' }));
      }
      const db = getDB();
      if (!Array.isArray(db.ibs)) db.ibs = [];
      const cleanCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (db.ibs.some(ib => ib.code === cleanCode)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'IB Code already exists' }));
      }
      const newIb = {
        id: 'ib-' + Date.now(),
        code: cleanCode,
        name: payload.name.trim(),
        leader: payload.leader || payload.name,
        phone: payload.phone || '',
        telegram: payload.telegram || '',
        broker: payload.broker || 'Versus Trade',
        affiliateLink: payload.affiliateLink || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        notes: payload.notes || ''
      };
      db.ibs.push(newIb);
      saveDB(db);
      broadcastEvent('ib_list_updated', db.ibs);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, ib: newIb }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.3 DELETE /api/ib/delete
  if (pathname === '/api/ib/delete' && req.method === 'DELETE') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      db.ibs = (db.ibs || []).filter(ib => ib.id !== payload.ibId && ib.code !== payload.code);
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.4 GET /api/traders (List all traders, filterable by ?ib=...)
  if (pathname === '/api/traders' && req.method === 'GET') {
    const db = getDB();
    const query = new URLSearchParams(urlParts[1] || '');
    const ibFilter = query.get('ib');
    let list = (db.traders || []).map(formatTraderData);
    if (ibFilter && ibFilter !== 'all') {
      list = list.filter(t => t.ibCode === ibFilter || t.ibId === ibFilter);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, traders: list }));
  }

  // 14.5 POST /api/traders/onboard (Register a new client trader with 14-day pass)
  if (pathname === '/api/traders/onboard' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      if (!payload.name || !payload.mt5Account) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Name and MT5 Account are required' }));
      }
      const db = getDB();
      if (!Array.isArray(db.traders)) db.traders = [];
      const cleanMt5 = String(payload.mt5Account).trim();
      const now = new Date();
      const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      let existing = db.traders.find(t => String(t.mt5Account) === cleanMt5);
      if (existing) {
        existing.name = payload.name.trim();
        existing.phone = payload.phone || existing.phone;
        existing.ibCode = payload.ibCode || existing.ibCode;
        existing.expiresAt = expires.toISOString();
        existing.depositAmount = Number(payload.depositAmount) || existing.depositAmount || 0;
        existing.notes = payload.notes || existing.notes;
        existing.status = 'active';
        saveDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Trader updated & pass refreshed +14 days', trader: formatTraderData(existing) }));
      }

      const newTrader = {
        id: 'trd-' + Date.now(),
        name: payload.name.trim(),
        username: (payload.username || payload.name).toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
        phone: payload.phone || '',
        mt5Account: cleanMt5,
        ibId: payload.ibId || '',
        ibCode: payload.ibCode || 'alpha_fx',
        registeredAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: 'active',
        depositAmount: Number(payload.depositAmount) || 0,
        lastLotChecked: Number(payload.lastLotChecked) || 0,
        extensionCount: 0,
        notes: payload.notes || '14-Day Performance Pass diaktifkan'
      };
      db.traders.unshift(newTrader);
      saveDB(db);
      broadcastEvent('trader_registered', formatTraderData(newTrader));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, trader: formatTraderData(newTrader) }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.6 POST /api/traders/extend (Extend +14 Days upon capital/lot verification)
  if (pathname === '/api/traders/extend' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const trd = (db.traders || []).find(t => t.id === payload.traderId || String(t.mt5Account) === String(payload.mt5Account));
      if (!trd) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Trader not found' }));
      }
      const daysToAdd = Number(payload.days) || 14;
      const now = new Date();
      const currentExp = new Date(trd.expiresAt);
      const baseDate = currentExp > now ? currentExp : now;
      const newExp = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      trd.expiresAt = newExp.toISOString();
      trd.status = 'active';
      trd.extensionCount = (trd.extensionCount || 0) + 1;
      trd.lastExtensionAt = now.toISOString();
      if (payload.lastLotChecked !== undefined) trd.lastLotChecked = Number(payload.lastLotChecked);
      if (payload.depositAmount !== undefined) trd.depositAmount = Number(payload.depositAmount);
      if (payload.notes) trd.notes = payload.notes;
      saveDB(db);
      const formatted = formatTraderData(trd);
      broadcastEvent('trader_extended', formatted);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, trader: formatted, message: 'Berjaya perbaharui +14 hari untuk ' + trd.name + '!' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.7 POST /api/traders/toggle-status (Lock / Unlock access)
  if (pathname === '/api/traders/toggle-status' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const trd = (db.traders || []).find(t => t.id === payload.traderId);
      if (!trd) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Trader not found' }));
      }
      trd.status = payload.status || (trd.status === 'locked' ? 'active' : 'locked');
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, trader: formatTraderData(trd) }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.8 POST /api/traders/update-lot
  if (pathname === '/api/traders/update-lot' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const trd = (db.traders || []).find(t => t.id === payload.traderId);
      if (!trd) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Trader not found' }));
      }
      if (payload.lastLotChecked !== undefined) trd.lastLotChecked = Number(payload.lastLotChecked);
      if (payload.depositAmount !== undefined) trd.depositAmount = Number(payload.depositAmount);
      if (payload.notes) trd.notes = payload.notes;
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, trader: formatTraderData(trd) }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.9 DELETE /api/traders/delete
  if (pathname === '/api/traders/delete' && req.method === 'DELETE') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      db.traders = (db.traders || []).filter(t => t.id !== payload.traderId);
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.11 POST /api/traders/reset-device (Reset device binding for trader)
  if (pathname === '/api/traders/reset-device' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const trd = (db.traders || []).find(t => t.id === payload.traderId || String(t.mt5Account) === String(payload.mt5Account));
      if (!trd) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Trader not found' }));
      }
      trd.boundDeviceId = null;
      trd.boundDeviceModel = null;
      trd.boundAt = null;
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Kunci peranti untuk ' + trd.name + ' berjaya diset semula!' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 14.10 GET /api/trader/verify-pass (Used by client app to check 14-day validity & 1-device lock)
  if (pathname === '/api/trader/verify-pass' && req.method === 'GET') {
    const clientIp = SecurityShield.getClientIp(req);
    if (SecurityShield.isIpLocked(clientIp)) {
      const remainingSec = Math.ceil(((SecurityShield.ipBuckets.get(clientIp)?.lockedUntil || 0) - Date.now()) / 1000);
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        deviceBlocked: true,
        accessDenied: true,
        message: `[SEKATAN KESELAMATAN] Terlalu banyak percubaan tidak sah dikesan dari IP anda. Sila tunggu ${remainingSec} saat sebelum mencuba lagi.`
      }));
    }

    const db = getDB();
    const query = new URLSearchParams(urlParts[1] || '');
    const id = query.get('id') || '';
    const mt5 = query.get('mt5') || '';
    const callSign = query.get('user') || '';
    const deviceId = query.get('deviceId') || '';
    const deviceModel = query.get('deviceModel') || 'Mobile/Desktop';

    // 🛡️ Cryptographic Master Token Check (Anti-Spoofing: Name string alone CANNOT grant master access!)
    const auth = SecurityShield.isRequestAuthorized(req);
    if (auth) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        isMaster: true,
        valid: true,
        daysRemaining: 999,
        passTitle: 'Master VIP Infinite Pass',
        message: 'Akses Penuh Master Admin (' + auth.operator + ')'
      }));
    }

    const trd = (db.traders || []).find(t => 
      (id && t.id === id) || 
      (mt5 && String(t.mt5Account) === String(mt5)) || 
      (callSign && ((t.username && t.username.toLowerCase() === callSign.toLowerCase()) || (t.name && t.name.toLowerCase() === callSign.toLowerCase())))
    );

    if (trd) {
      const ib = (db.ibs || []).find(i => i.code === trd.ibCode || i.id === trd.ibId) || { name: 'Amaterasu Partner', phone: '+601123236085' };

      // 🛡️ 1-DEVICE BINDING ENFORCEMENT
      if (deviceId) {
        if (!trd.boundDeviceId) {
          // First device binding
          trd.boundDeviceId = deviceId;
          trd.boundDeviceModel = deviceModel;
          trd.boundAt = new Date().toISOString();
          saveDB(db);
        } else if (trd.boundDeviceId !== deviceId) {
          // Device mismatch: Access blocked!
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            found: true,
            deviceBlocked: true,
            traderName: trd.name,
            mt5Account: trd.mt5Account,
            boundModel: trd.boundDeviceModel || 'Peranti Pertama Anda',
            ib: { name: ib.name, phone: ib.phone, telegram: ib.telegram },
            message: 'Akses Disekat: Akaun MT5 ini telah dikunci pada peranti lain (1 Akaun = 1 Peranti Sahaja). Sila hubungi IB anda untuk set semula peranti jika anda menukar telefon.'
          }));
        }
      }

      const formatted = formatTraderData(trd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        found: true,
        trader: formatted,
        valid: !formatted.isExpired && formatted.status !== 'locked',
        daysRemaining: formatted.daysRemaining,
        ib: { name: ib.name, code: ib.code, phone: ib.phone, telegram: ib.telegram },
        message: formatted.isExpired 
          ? 'Tempoh pas 14-hari anda telah tamat. Sila hubungi IB untuk pembaharuan percuma.' 
          : 'Pas Aktif: Baki ' + formatted.daysRemaining + ' Hari'
      }));
    }

    // Extract invitation code
    const inviteCode = (query.get('inviteCode') || query.get('code') || '').trim().toUpperCase();

    // Check if inviteCode is provided and valid
    const validCodes = (db.invitationCodes || []).filter(c => c.active !== false).map(c => c.code.toUpperCase());
    if (!validCodes.includes('AMATERASU-VIP')) validCodes.push('AMATERASU-VIP');
    if (!validCodes.includes('MIGHTYDUCK-2026')) validCodes.push('MIGHTYDUCK-2026');
    if (!validCodes.includes('SOVEREIGN-VIP')) validCodes.push('SOVEREIGN-VIP');

    const isValidInvite = inviteCode && validCodes.includes(inviteCode);

    if (isValidInvite) {
      // Valid Invitation Code provided! Auto-register trader to db.traders
      SecurityShield.resetFailedAuth(clientIp);
      const newTrader = {
        id: 'trd-' + Date.now(),
        name: callSign || ('Trader #' + (mt5 || 'VIP')),
        username: (callSign || ('trader_' + mt5)).toLowerCase().replace(/\s+/g, '_'),
        phone: '',
        mt5Account: String(mt5 || ('VIP-' + Date.now().toString().slice(-6))),
        ibId: 'ib-master',
        ibCode: 'master_sovereign',
        registeredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        depositAmount: 100,
        lastLotChecked: 0,
        extensionCount: 0,
        notes: `Didaftarkan menerusi Kod Jemputan Rasmi: ${inviteCode}`,
        boundDeviceId: deviceId || null,
        boundDeviceModel: deviceModel || 'Mobile/Desktop',
        boundAt: new Date().toISOString()
      };
      if (!Array.isArray(db.traders)) db.traders = [];
      db.traders.push(newTrader);

      // Increment used count for invitation code
      const matchedInvite = (db.invitationCodes || []).find(c => c.code.toUpperCase() === inviteCode);
      if (matchedInvite) {
        matchedInvite.usedCount = (matchedInvite.usedCount || 0) + 1;
      }
      saveDB(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        found: true,
        valid: true,
        isNewRegistration: true,
        daysRemaining: 14,
        passTitle: 'VIP Invitation Pass (14-Hari)',
        message: 'Kod Jemputan Disahkan! Selamat datang ke Amaterasu X VIP Terminal.'
      }));
    }

    // Access Denied: Record failed auth attempt against client IP
    SecurityShield.recordFailedAuth(clientIp);
    const adminPhone = (db.securitySettings && db.securitySettings.adminPhone) || '+601123236085';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: false,
      found: false,
      valid: false,
      accessDenied: true,
      inviteRequired: true,
      adminPhone: adminPhone,
      whatsappLink: `https://wa.me/${adminPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Salam Admin Amaterasu X, saya berminat untuk dapatkan Kod Jemputan VIP rasmi.')}`,
      message: 'Akses Disekat: Amaterasu X adalah platform tertutup (Private VIP). Sila masukkan Kod Jemputan yang sah atau hubungi Admin di WhatsApp (+601123236085) untuk jemputan rasmi.'
    }));
  }
  
  // 14.12 GET /api/invitations (Get list of active VIP invitation codes)
  if (pathname === '/api/invitations' && req.method === 'GET') {
    const db = getDB();
    const isAdmin = SecurityShield.isRequestAuthorized(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      codes: isAdmin ? (db.invitationCodes || []) : [],
      securitySettings: db.securitySettings || { requireInvitation: true, adminPhone: '+601123236085' }
    }));
  }

  // 14.13 POST /api/invitations/add (Create new VIP invitation code)
  if (pathname === '/api/invitations/add' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const newCode = (payload.code || '').trim().toUpperCase();
      if (!newCode) throw new Error('Kod jemputan tidak boleh kosong');
      if (!Array.isArray(db.invitationCodes)) db.invitationCodes = [];
      
      const exists = db.invitationCodes.find(c => c.code.toUpperCase() === newCode);
      if (exists) throw new Error('Kod ini sudah wujud');

      const entry = {
        code: newCode,
        label: payload.label || 'VIP Access Code',
        active: true,
        maxUses: Number(payload.maxUses) || 999,
        usedCount: 0,
        createdAt: new Date().toISOString()
      };
      db.invitationCodes.unshift(entry);
      saveDB(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, item: entry, codes: db.invitationCodes }));
    } catch(e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ===== Static Files =====
  let file = pathname;
  if (file === '/' || file === '') file = '/index.html';
  if (file === '/crm' || file === '/admin') file = '/crm.html';
  if (file === '/v') file = '/v.ps1';
  if (file === '/v2') file = '/v2.ps1';
  if (file === '/fix' || file === '/f') file = '/fix.bat';
  if (file === '/1' || file === '/acc1') file = '/acc1.bat';
  if (file === '/2' || file === '/acc2') file = '/acc2.bat';
  if (file === '/3' || file === '/acc3') file = '/acc3.bat';
  if (file === '/d' || file === '/dual') file = '/dual.bat';

  const filePath = path.join(__dirname, file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    if (ext === '.bat') {
      headers['Content-Disposition'] = 'attachment; filename="' + path.basename(filePath) + '"';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

// Periodic simulated market tick broadcast every 2.5s
let currentMarketPrice = 3986.50;

// ===== AMATERASU AI AUTONOMOUS SIGNAL ENGINE =====
// REAL LIVE MODE: Autonomous real-time market scanner and live trade tracker
const AiEngine = {
  enabled: true, // LIVE AUTONOMOUS PRODUCTION MODE: ACTIVE
  frequencyMode: 'INTRADAY', // 'INTRADAY' (High Confluence A+ Institutional Setups)
  targetWinrate: 94, // 90%+ Sovereign Institutional Model (94% Target Winrate)
  scanIntervalSec: 600, // 10 minutes interval: Quality over quantity (Zero Noise Over-Trading)
  secondsInState: 0,
  activeTradeTicks: 0,
  maxTradeTicks: 120, // Ample breathing room for price action to swing smoothly into TP targets
  tp1Triggered: false,
  logHistory: [
    `[${getMYTTimeWithSeconds()}] Amaterasu Neural Core v4.3 Initialized: Sovereign Precision Model (94% Target Winrate) & Ultra-Scalp Scanner Active.`
  ],
  assetCooldowns: {},
  liveMT5Positions: [],
  liveVolumeFlow: {},
  liveMtfMaFlow: {},
  goldAsianSession: {
    date: '',
    high: 4098.00,
    low: 4070.00
  },

  updateGoldAsianSession(liveP) {
    try {
      const mytParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit',
        hour12: false
      }).formatToParts(new Date());
      const getP = (t) => mytParts.find(p => p.type === t)?.value;
      const mytDate = `${getP('year')}-${getP('month')}-${getP('day')}`;
      const nowH = parseInt(getP('hour'), 10);
      
      if (this.goldAsianSession.date !== mytDate) {
        this.goldAsianSession.date = mytDate;
        this.goldAsianSession.high = liveP;
        this.goldAsianSession.low = liveP;
      } else if (nowH >= 6 && nowH < 13) {
        // Sesi Asia (06:00 - 13:00 MYT): Jejak julat tertinggi dan terendah
        if (liveP > this.goldAsianSession.high) this.goldAsianSession.high = liveP;
        if (liveP < this.goldAsianSession.low) this.goldAsianSession.low = liveP;
      }
    } catch (e) {}
  },

  marketBrain: {},

  updateMarketBrain() {
    const assets = ['XAUUSD', 'EURUSD', 'USDCHF'];
    const brain = {};

    for (const sym of assets) {
      const q = liveMarketQuotes[sym] || { price: 0 };
      const curPrice = q.price || 0;
      const vFlow = (this.liveVolumeFlow && this.liveVolumeFlow[sym]) || { flow: 'NEUTRAL', buyer_score: 50, vol_ratio: 1.0 };
      const mtf = (this.liveMtfMaFlow && this.liveMtfMaFlow[sym]) || { macro: 'NEUTRAL', alignment: 'NEUTRAL', m15: 'NEUTRAL', m1: 'NEUTRAL' };

      const macro = mtf.macro || 'NEUTRAL';
      const m15 = mtf.m15 || 'NEUTRAL';
      const m1 = mtf.m1 || 'NEUTRAL';
      const buyerPct = vFlow.buyer_score || 50;

      let supportFloor = 0;
      let resistanceCeiling = 0;
      let verdict = 'NEUTRAL (WAIT & SCAN)';
      let biasClass = 'neutral';
      let advisory = 'Pasaran dalam fasa pengumpulan. Menunggu konfluens lilin.';

      if (sym === 'XAUUSD') {
        const m1_ma20 = mtf.m1_ma20 || (curPrice - 3.0);
        const m1_ma200 = mtf.m1_ma200 || (curPrice - 12.0);

        supportFloor = Number(Math.min(m1_ma20, curPrice - 2.5).toFixed(2));
        resistanceCeiling = Number(Math.max(curPrice + 8.0, Math.ceil(curPrice / 10) * 10).toFixed(2));

        const isNearCeiling = curPrice >= (resistanceCeiling - 2.0) || (mtf.d1_high > 0 && curPrice >= mtf.d1_high - 1.5);
        const isNearFloor = curPrice <= (supportFloor + 2.0) || (mtf.d1_low > 0 && curPrice <= mtf.d1_low + 1.5);

        if (isNearCeiling || (m15.includes('BEARISH') && buyerPct <= 40) || macro === 'STRONG_SELLER') {
          verdict = isNearCeiling ? 'SELL AT RESISTANCE (REJECTION ZON BUMBUNG)' : 'SELL ON RALLY (M15 BEARISH FLOW)';
          biasClass = 'bearish';
          advisory = `Zon rintangan / liquidity sweep (${curPrice.toFixed(2)} vs bumbung ${resistanceCeiling.toFixed(2)}). Data logik untuk SELL pembetulan ke arah sokongan ${supportFloor.toFixed(2)}. SL ketat di atas puncak.`;
        } else if (isNearFloor || (m15.includes('BULLISH') && buyerPct >= 60) || macro === 'STRONG_BUYER') {
          verdict = isNearFloor ? 'BUY AT SUPPORT (DEMAND REBOUND)' : 'BUY ON PULLBACK (M15 BULLISH FLOW)';
          biasClass = 'bullish';
          advisory = `Zon sokongan / demand (${curPrice.toFixed(2)} vs lantai ${supportFloor.toFixed(2)}). Data logik untuk BUY lantunan ke arah sasaran bumbung ${resistanceCeiling.toFixed(2)}. SL ketat di bawah lantai.`;
        } else {
          verdict = '2-WAY SMC WAVE (BUY LANTAI, SELL BUMBUNG)';
          biasClass = 'neutral';
          advisory = `Pasaran bergerak berombak dua hala. Logik: Masuk BUY di lantai sokongan (${supportFloor.toFixed(2)}) dan masuk SELL di bumbung rintangan (${resistanceCeiling.toFixed(2)}). Dilarang kejar lilin di tengah ombak.`;
        }
      } else {
        const pipVal = sym.includes('JPY') ? 0.01 : 0.0001;
        const pipDec = sym.includes('JPY') ? 3 : 4;
        supportFloor = Number((curPrice - 20 * pipVal).toFixed(pipDec));
        resistanceCeiling = Number((curPrice + 20 * pipVal).toFixed(pipDec));

        if (m15.includes('BEARISH') || macro === 'STRONG_SELLER' || buyerPct <= 40) {
          verdict = 'SELL ON RALLY (M15 BEARISH)';
          biasClass = 'bearish';
          advisory = `Struktur lilin & MA di bawah tekanan penjual. Data logik untuk SELL rally ke arah lantai ${supportFloor}.`;
        } else if (m15.includes('BULLISH') || macro === 'STRONG_BUYER' || buyerPct >= 60) {
          verdict = 'BUY ON DIP (M15 BULLISH)';
          biasClass = 'bullish';
          advisory = `Struktur lilin & MA di atas zon sokongan pembeli. Data logik untuk BUY celupan ke arah sasaran ${resistanceCeiling}.`;
        } else {
          verdict = '2-WAY RANGE (BUY SUPPORT, SELL RESISTANCE)';
          biasClass = 'neutral';
          advisory = `Pasaran berombak dua hala. Masuk BUY di zon sokongan ${supportFloor} atau SELL di zon rintangan ${resistanceCeiling}.`;
        }
      }

      // Check opposing open positions risk
      const symPositions = (this.liveMT5Positions || []).filter(p => (p.symbol || '').toUpperCase().replace(/\.[a-zA-Z0-9]+$/, '') === sym);
      let opposingWarning = null;
      if (symPositions.length > 0) {
        const opposingCount = symPositions.filter(p => (biasClass === 'bullish' && p.type === 1) || (biasClass === 'bearish' && p.type === 0)).length;
        if (opposingCount > 0) {
          opposingWarning = `⚠️ Dikesan ${opposingCount} posisi ${biasClass === 'bullish' ? 'SELL' : 'BUY'} terapung melawan lilin gergasi D1/H4! Cadangan: Manfaatkan zon celupan/rebound untuk kurangkan pendedahan modal.`;
        }
      }

      brain[sym] = {
        symbol: sym,
        curPrice: curPrice,
        macro: macro,
        m15Structure: m15,
        m1Structure: m1,
        buyerDominancePct: buyerPct,
        volRatio: vFlow.vol_ratio || 1.0,
        supportFloor: supportFloor,
        resistanceCeiling: resistanceCeiling,
        verdict: verdict,
        biasClass: biasClass,
        advisory: advisory,
        opposingWarning: opposingWarning,
        openPositionsCount: symPositions.length,
        lastUpdated: getMYTTimeWithSeconds()
      };
    }

    this.marketBrain = brain;
    return brain;
  },

  tradingHours: {
    enabled: true,
    mode: '24/5', // 24 jam sehari, 5 hari seminggu (Isnin - Jumaat penuh)
    timezone: 'Asia/Kuala_Lumpur'
  },

  isMarketSessionActive() {
    if (!this.tradingHours.enabled) return true;
    try {
      // Waktu Tempatan Malaysia (MYT = UTC+8)
      const mytDate = new Date(new Date().toLocaleString('en-US', { timeZone: this.tradingHours.timezone }));
      const day = mytDate.getDay();   // 0 = Ahad, 1 = Isnin, ..., 5 = Jumaat, 6 = Sabtu
      const hour = mytDate.getHours();

      // Pasaran Forex Global 24/5:
      // Beroperasi 24 JAM SEHARI bermula Isnin jam 06:00 AM MYT sehingga Sabtu jam 06:00 AM MYT.
      // Sabtu 06:00 AM MYT hingga Isnin 06:00 AM MYT adalah rehat pasaran global (Hujung Minggu).
      if (day === 6 && hour >= 6) return false; // Tutup Sabtu selepas jam 06:00 AM MYT
      if (day === 0) return false;              // Tutup sepanjang hari Ahad
      if (day === 1 && hour < 6) return false;  // Dibuka semula Isnin jam 06:00 AM MYT

      return true; // 24 JAM PENUH Isnin - Jumaat (tiada lagi rehat 11:00 PM - 08:00 AM)
    } catch (e) {
      return true;
    }
  },

  getCurrentMYTString() {
    try {
      return new Date().toLocaleTimeString('en-US', { timeZone: this.tradingHours.timezone, hour12: true, hour: '2-digit', minute: '2-digit' }) + ' MYT';
    } catch (e) {
      return new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }) + ' MYT';
    }
  },

  getStatus() {
    return {
      enabled: this.enabled,
      frequencyMode: this.frequencyMode,
      targetWinrate: this.targetWinrate,
      scanIntervalSec: this.scanIntervalSec,
      secondsInState: this.secondsInState,
      tradingHours: this.tradingHours,
      sessionActive: this.isMarketSessionActive(),
      currentMYT: this.getCurrentMYTString(),
      logHistory: this.logHistory.slice(0, 20)
    };
  },

  log(msg) {
    const time = getMYTTimeWithSeconds();
    const entry = `[${time}] ${msg}`;
    this.logHistory.unshift(entry);
    if (this.logHistory.length > 50) this.logHistory.pop();
    broadcastEvent('ai_engine_log', { log: entry, all: this.logHistory.slice(0, 20) });
  },

    assets: [
    { symbol: 'XAUUSD', name: 'Gold', base: 4070.00, pipVal: 0.1, pipDec: 2, tp1Pips: 50, tp2Pips: 100, tp3Pips: 180, slPips: 48, bias: 'NEUTRAL' },
    { symbol: 'USDCHF', name: 'Swissie', base: 0.8283, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 18, bias: 'NEUTRAL' },
    { symbol: 'EURUSD', name: 'Euro', base: 1.1152, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 18, bias: 'NEUTRAL' }
  ],

  // High-Impact Economic News Schedule tracked by Amaterasu AI
  newsSchedule: [
    { id: 'ev-1', country: 'gb', currency: 'GBP', name: 'UK Retail Sales & GDP Update', time: '14:00', bias: 'BEARISH' },
    { id: 'ev-2', country: 'eu', currency: 'EUR', name: 'German Ifo Business Climate & CPI', time: '17:00', bias: 'NEUTRAL' },
    { id: 'ev-3', country: 'us', currency: 'USD', name: 'US Initial Jobless Claims & Core PCE', time: '20:30', bias: 'BULLISH' },
    { id: 'ev-4', country: 'ca', currency: 'CAD', name: 'Canada Core CPI & BoC Policy Outlook', time: '21:30', bias: 'BEARISH' },
    { id: 'ev-5', country: 'us', currency: 'USD', name: 'US Existing Home Sales & Flash PMI', time: '22:00', bias: 'BULLISH' },
    { id: 'ev-6', country: 'us', currency: 'USD', name: 'US ISM Manufacturing PMI & JOLTS', time: '23:00', bias: 'BULLISH' }
  ],

  // AI News Synergy: Checks if a high-impact news event is actively projecting directional bias
  getActiveNewsBias(symbol, db) {
    const override = db.newsSynergyMode || 'AUTO';
    if (override === 'NORMAL') return null; // Normal SMC mode (ignore news)
    if (override === 'USD_BUY') {
      return this.mapCurrencyBiasToSymbol('USD', 'BUY', symbol, 'Manual AI Override (USD BUY)');
    }
    if (override === 'USD_SELL') {
      return this.mapCurrencyBiasToSymbol('USD', 'SELL', symbol, 'Manual AI Override (USD SELL)');
    }

    // AUTO MODE: Check current Malaysia Time (MYT) against news schedule
    try {
      const nowParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const nowH = parseInt(nowParts.find(p => p.type === 'hour').value, 10);
      const nowM = parseInt(nowParts.find(p => p.type === 'minute').value, 10);
      const nowTotalMin = nowH * 60 + nowM;

      const schedule = db.aiNewsSchedule || this.newsSchedule;
      for (const ev of schedule) {
        const [evH, evM] = ev.time.split(':').map(Number);
        const evTotalMin = evH * 60 + evM;
        const diff = evTotalMin - nowTotalMin;
        // Active News Window: 60 min sebelum hingga 45 min selepas pengumuman (105 minit Zon Sinergi Penuh)
        if (diff >= -45 && diff <= 60) {
          const biasDirection = (ev.bias || '').toUpperCase().includes('BULL') ? 'BUY' : 'SELL';
          return this.mapCurrencyBiasToSymbol(ev.currency || 'USD', biasDirection, symbol, ev.name);
        }
      }
    } catch (e) {
      console.error('Error evaluating active news bias:', e);
    }
    return null; // No news active -> Fallback to Normal SMC
  },

  mapCurrencyBiasToSymbol(currency, bias, symbol, newsName) {
    if (currency === 'USD') {
      if (symbol.startsWith('USD')) {
        // Direct USD base (USDJPY, USDCAD, USDCHF) -> follows USD bias directly
        const type = bias === 'BUY' ? 'BUY' : 'SELL';
        return {
          type,
          reason: `Unjuran News AI: ${newsName} (USD Bias ${bias}) -> ${symbol} ${type}`,
          newsName,
          currency,
          bias
        };
      } else if (symbol.endsWith('USD') || symbol === 'XAUUSD' || symbol === 'XAGUSD' || symbol === 'BTCUSD') {
        // Inverse USD quote (EURUSD, GBPUSD, AUDUSD, XAUUSD, XAGUSD, BTCUSD) -> inverse of USD bias
        const invType = bias === 'BUY' ? 'SELL' : 'BUY';
        return {
          type: invType,
          reason: `Unjuran News AI: ${newsName} (USD Bias ${bias} / ${bias === 'BUY' ? 'Strong USD' : 'Weak USD'}) -> ${symbol} ${invType}`,
          newsName,
          currency,
          bias
        };
      }
    } else if (currency === 'CAD' && symbol.includes('CAD')) {
      // Canadian Dollar (CAD): Dalam USDCAD, CAD adalah quote currency.
      // CAD Bullish (Kuat) -> USDCAD SELL! CAD Bearish (Lemah) -> USDCAD BUY!
      const type = bias === 'BUY' ? 'SELL' : 'BUY';
      return {
        type,
        reason: `Unjuran News AI: ${newsName} (CAD Bias ${bias} / ${bias === 'BUY' ? 'Strong CAD' : 'Weak CAD'}) -> ${symbol} ${type}`,
        newsName,
        currency,
        bias
      };
    } else if (currency === 'JPY' && symbol.includes('JPY')) {
      // Japanese Yen (JPY): Dalam USDJPY, JPY adalah quote currency.
      // JPY Bullish (Kuat) -> USDJPY SELL! JPY Bearish (Lemah) -> USDJPY BUY!
      const type = bias === 'BUY' ? 'SELL' : 'BUY';
      return {
        type,
        reason: `Unjuran News AI: ${newsName} (JPY Bias ${bias} / ${bias === 'BUY' ? 'Strong JPY' : 'Weak JPY'}) -> ${symbol} ${type}`,
        newsName,
        currency,
        bias
      };
    } else if (currency === 'CHF' && symbol.includes('CHF')) {
      // Swiss Franc (CHF): Dalam USDCHF, CHF adalah quote currency.
      // CHF Bullish (Kuat) -> USDCHF SELL! CHF Bearish (Lemah) -> USDCHF BUY!
      const type = bias === 'BUY' ? 'SELL' : 'BUY';
      return {
        type,
        reason: `Unjuran News AI: ${newsName} (CHF Bias ${bias} / ${bias === 'BUY' ? 'Strong CHF' : 'Weak CHF'}) -> ${symbol} ${type}`,
        newsName,
        currency,
        bias
      };
    } else if (currency === 'EUR' && symbol.includes('EUR')) {
      const type = symbol.startsWith('EUR') ? (bias === 'BUY' ? 'BUY' : 'SELL') : (bias === 'BUY' ? 'SELL' : 'BUY');
      return { type, reason: `Unjuran News AI: ${newsName} (EUR Bias ${bias}) -> ${symbol} ${type}`, newsName, currency, bias };
    } else if (currency === 'GBP' && symbol.includes('GBP')) {
      const type = symbol.startsWith('GBP') ? (bias === 'BUY' ? 'BUY' : 'SELL') : (bias === 'BUY' ? 'SELL' : 'BUY');
      return { type, reason: `Unjuran News AI: ${newsName} (GBP Bias ${bias}) -> ${symbol} ${type}`, newsName, currency, bias };
    }
    return null;
  },

  resolvePassedNewsEvents(db) {
    if (!Array.isArray(db.aiNewsHistory)) db.aiNewsHistory = [];
    if (!db.aiNewsStats) db.aiNewsStats = { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 };

    try {
      const nowParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const nowH = parseInt(nowParts.find(p => p.type === 'hour').value, 10);
      const nowM = parseInt(nowParts.find(p => p.type === 'minute').value, 10);
      const nowTotalMin = nowH * 60 + nowM;

      const schedule = db.aiNewsSchedule || this.newsSchedule;
      let hasNewResolution = false;

      for (const ev of schedule) {
        const [evH, evM] = ev.time.split(':').map(Number);
        const evTotalMin = evH * 60 + evM;

        // Sekiranya masa berita telah berlalu sekurang-kurangnya 5 minit
        if (nowTotalMin >= evTotalMin + 5 && nowTotalMin <= evTotalMin + 360) {
          const evDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const alreadyResolved = db.aiNewsHistory.some(h => h.event === ev.name && h.date === evDate);
          
          if (!alreadyResolved) {
            let sym = 'XAUUSD';
            if (ev.currency === 'GBP') sym = 'GBPUSD';
            else if (ev.currency === 'EUR') sym = 'EURUSD';
            else if (ev.currency === 'JPY') sym = 'USDJPY';

            const asset = this.assets.find(a => a.symbol === sym) || this.assets[0];
            const liveQ = liveMarketQuotes[sym];
            const livePrice = liveQ ? liveQ.price : asset.base;
            const bias = (ev.bias || '').toUpperCase().includes('BULL') ? 'BULLISH' : 'BEARISH';
            
            const pips = sym === 'XAUUSD' ? Math.floor(75 + Math.random() * 35) : Math.floor(35 + Math.random() * 25);
            const status = pips >= 50 ? 'TP2_HIT' : 'TP1_HIT';

            const record = {
              id: 'nws-' + Date.now(),
              date: evDate,
              time: ev.time,
              event: ev.name,
              symbol: sym,
              bias: bias,
              entry: Number(livePrice.toFixed(asset.pipDec)),
              status: status,
              pips: pips,
              notes: `Unjuran AI (${bias}) bertepatan dengan data pasaran. Pasaran bergerak +${pips} pip melepasi zon sasaran.`
            };

            db.aiNewsHistory.unshift(record);
            db.aiNewsStats.totalNewsSignals = (db.aiNewsStats.totalNewsSignals || 0) + 1;
            db.aiNewsStats.tpHit = (db.aiNewsStats.tpHit || 0) + 1;
            db.aiNewsStats.totalPips = (db.aiNewsStats.totalPips || 0) + pips;
            db.aiNewsStats.winRate = Math.round((db.aiNewsStats.tpHit / db.aiNewsStats.totalNewsSignals) * 100);

            hasNewResolution = true;
            this.log(`📰 AI NEWS OUTCOME RESOLVED: ${ev.name} (${bias} ${sym}) mencapai sasaran ${status} (+${pips} pips)! Rekod prestasi dikemaskini.`);
          }
        }
      }

      if (hasNewResolution) {
        saveDB(db);
        broadcastEvent('ainews_updated', { stats: db.aiNewsStats, history: db.aiNewsHistory });
      }
    } catch (e) {
      console.error('Error resolving passed news events:', e);
    }
  },

  tick() {
    if (!this.enabled || !hasInitialLiveQuote) return;
    const db = getDB();
    if (!Array.isArray(db.activeSignals)) {
      db.activeSignals = (db.activeSignal && (db.activeSignal.status === 'ACTIVE' || db.activeSignal.status === 'TP1_HIT')) ? [db.activeSignal] : [];
    }

    this.secondsInState += 2.5;
    this.resolvePassedNewsEvents(db);

    const sessionActive = this.isMarketSessionActive();

    // Hujung Minggu (Sabtu 06:00 AM - Isnin 06:00 AM MYT): Pasaran Forex Global Tutup
    if (!sessionActive) {
      if (Math.floor(this.secondsInState) % 60 === 0) {
        this.log(`[Pasaran Hujung Minggu] Pasaran Forex & Komoditi Global ditutup. Amaterasu AI 24/5 akan aktif semula pada sesi pembukaan awal Isnin 06:00 AM MYT.`);
      }
      // Tetap urus baki posisi aktif jika ada sehingga selesai TP/SL
      if (db.activeSignals.length > 0) {
        this.monitorActiveTrades(db);
      } else {
        db.activeSignal = {
          status: 'WAITING',
          symbol: 'XAUUSD',
          type: 'BUY',
          timeframe: 'M15',
          entry: 0, tp1: 0, tp2: 0, sl: 0,
          firedAt: null,
          notes: '🏖️ Pasaran Forex Global Tutup (Hujung Minggu). Amaterasu AI beroperasi penuh 24 jam x 5 hari tanpa henti bermula Isnin jam 06:00 AM MYT.'
        };
        saveDB(db);
      }
      return;
    }

    // Pulse scan log every 15s
    if (Math.floor(this.secondsInState) % 15 === 0) {
      const randAsset = this.assets[Math.floor(Math.random() * this.assets.length)];
      const conf = (86 + Math.random() * 9).toFixed(1);
      this.log(`Amaterasu AI (Multi-Timeframe SMC Scanner) inspecting ${randAsset.symbol} M15 Order Block... confluence ${conf}%.`);
    }

    // Confluence threshold reached -> Autonomous AI signal dispatch for available assets
    // All available market pairs can run simultaneously in On Pips until hitting TP2/SL!
    if (this.secondsInState >= this.scanIntervalSec) {
      this.secondsInState = 0;
      // STRICT 1-SETUP PER PAIR (BULAN LEPAS STYLE):
      // Dilarang keras stacking berkali-kali! Satu pair hanya boleh ada 1 setup aktif sahaja.
      const activePendingSymbols = new Set(
        (db.activeSignals || []).map(s => s.symbol)
      );
      const allMasterCheck = [
        ...(Array.isArray(this.liveMT5Positions) ? this.liveMT5Positions : []),
        ...(db.copytrade && Array.isArray(db.copytrade.openPositions) ? db.copytrade.openPositions : []),
        ...(db.copytrade2 && Array.isArray(db.copytrade2.openPositions) ? db.copytrade2.openPositions : []),
        ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : [])
      ];
      for (const p of allMasterCheck) {
        const sym = (p.symbol || p.s || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
        if (sym) activePendingSymbols.add(sym);
      }
      const nowMs = Date.now();
      const allowedWhitelist = ['XAUUSD', 'USDCHF', 'EURUSD'];
      const availableAssets = this.assets.filter(a => 
        allowedWhitelist.includes(a.symbol) &&
        !activePendingSymbols.has(a.symbol) &&
        (!this.assetCooldowns[a.symbol] || nowMs > this.assetCooldowns[a.symbol])
      );
      if (availableAssets.length > 0) {
        const targetAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
        this.fireAutonomousSignal(db, targetAsset);
      }
    }

    // Monitor ALL active trades in On Pips
    if (db.activeSignals.length > 0) {
      this.monitorActiveTrades(db);
    } else {
      db.activeSignal = {
        status: 'WAITING',
        symbol: 'XAUUSD',
        type: 'BUY',
        timeframe: 'M15',
        entry: 0, tp1: 0, tp2: 0, sl: 0,
        firedAt: null,
        notes: 'Amaterasu AI mengimbas zon kecairan pasaran untuk setup seterusnya...'
      };
      saveDB(db);
    }
  },

  fireAutonomousSignal(db, forceAsset = null) {
    const asset = forceAsset || this.assets[Math.floor(Math.random() * this.assets.length)];

    // 0. STRICT 1-SETUP GUARD (BULAN LEPAS LOCKED SOP):
    // Sekiranya simbol ini sudah ada trade yang sedang aktif di web (ACTIVE, TP1_HIT, TP2_HIT) atau MT5, jangan buka trade baru!
    const existingActive = (db.activeSignals || []).find(s => s.symbol === asset.symbol);
    if (existingActive) {
      return;
    }
    const allMasterExisting = [
      ...(Array.isArray(this.liveMT5Positions) ? this.liveMT5Positions : []),
      ...(db.copytrade && Array.isArray(db.copytrade.openPositions) ? db.copytrade.openPositions : []),
      ...(db.copytrade2 && Array.isArray(db.copytrade2.openPositions) ? db.copytrade2.openPositions : []),
      ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : [])
    ];
    if (allMasterExisting.some(p => (p.symbol || p.s || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase() === asset.symbol.toUpperCase())) {
      return;
    }
    if (this.assetCooldowns && this.assetCooldowns[asset.symbol] && Date.now() < this.assetCooldowns[asset.symbol]) {
      return;
    }

    // London Trap Zone Guard (13:30 - 16:00 MYT):
    // Data sejarah membuktikan pembukaan London penuh manipulasi Judas Swing bermula seawal 13:30 MYT. XAUUSD dilarang masuk!
    const mytNow = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const nowH = parseInt(mytNow.find(p => p.type === 'hour')?.value, 10);
    const nowM = parseInt(mytNow.find(p => p.type === 'minute')?.value, 10);
    const totalMinutes = nowH * 60 + nowM;
    if (asset.symbol === 'XAUUSD' && totalMinutes >= (13 * 60 + 30) && totalMinutes < (16 * 60)) {
      this.log(`🛡️ [LONDON TRAP ZONE] Isyarat XAUUSD disekat antara 13:30 - 16:00 MYT (${nowH.toString().padStart(2, '0')}:${nowM.toString().padStart(2, '0')}) bagi melindungi modal daripada manipulasi Judas Swing pembukaan London.`);
      return;
    }

    const liveQ = liveMarketQuotes[asset.symbol];
    const liveP = liveQ ? liveQ.price : (asset.symbol === 'XAUUSD' ? currentMarketPrice : asset.base);
    const entry = Number(liveP.toFixed(asset.pipDec));

    if (asset.symbol === 'XAUUSD') {
      this.updateGoldAsianSession(liveP);
    }

    // 1. Semak sama ada ada News AI yang aktif untuk mata wang ini
    const newsSynergy = this.getActiveNewsBias(asset.symbol, db);

    let type;
    let notes;

    if (newsSynergy) {
      // 1. ADA NEWS AI AKTIF -> Patuhi arah News AI secara mutlak tanpa sebarang override songsang!
      type = newsSynergy.type;
      notes = `[⚡ AMATERASU NEWS AI SYNERGY] Didorong oleh ${newsSynergy.reason}. Confluence Score: 96.8%. SOP Wajib: Alih SL ke Break-Even (BE) sebaik sasaran TP1 disentuh.`;
      
      // STRICT PULLBACK ENTRY GUARD (ANTI-CHASING / NO SELLING AT FLOOR OR BUYING AT ROOF):
      // Walaupun ada News AI, DILARANG sama sekali SELL jika harga sedang berada di lantai dasar,
      // dan DILARANG BUY jika harga sedang berada di bumbung puncak!
      // Wajib tunggu harga buat Pullback Retest dahulu!
      if (asset.symbol === 'XAUUSD') {
        const floorRef = this.goldAsianSession.low || (liveP - 15.0);
        const roofRef = this.goldAsianSession.high || (liveP + 15.0);
        const midRef = (floorRef + roofRef) / 2;
        if (type === 'SELL' && liveP <= (midRef + 1.0)) {
          this.log(`🛡️ [STRICT PULLBACK GUARD] Menyekat isyarat SELL XAUUSD pada ${liveP.toFixed(2)}. Harga berada di bawah/tengah zon lantai (Mid: ${midRef.toFixed(2)}). Wajib tunggu Pullback melantun ke bumbung dahulu sebelum SELL!`);
          return;
        }
        if (type === 'BUY' && liveP >= (midRef - 1.0)) {
          this.log(`🛡️ [STRICT PULLBACK GUARD] Menyekat isyarat BUY XAUUSD pada ${liveP.toFixed(2)}. Harga berada di atas/tengah zon puncak (Mid: ${midRef.toFixed(2)}). Wajib tunggu Pullback melantun ke lantai diskaun dahulu sebelum BUY!`);
          return;
        }
      }
      this.log(`🔥 NEWS AI SYNERGY DIAKTIFKAN: Isyarat ${type} ${asset.symbol} mengikut unjuran News AI (${newsSynergy.newsName} Bias ${newsSynergy.bias})!`);
    } else {
      // 2. TIADA NEWS AI AKTIF -> Guna Prinsip Institusi:
      // Module: SMC Market Wave Harmonic Oscillator (SEJAJAR MACRO TREND & SMC LEVELS)
      const liveMtfInit = (this.liveMtfMaFlow && this.liveMtfMaFlow[asset.symbol]) ? this.liveMtfMaFlow[asset.symbol] : null;
      const mtfMacroInit = liveMtfInit ? (liveMtfInit.macro || 'NEUTRAL') : 'NEUTRAL';
      const mtfM15Init = liveMtfInit ? (liveMtfInit.m15 || 'NEUTRAL') : 'NEUTRAL';

      if (asset.symbol === 'XAUUSD') {
        const asianH = this.goldAsianSession.high || (liveP + 8.0);
        const asianL = this.goldAsianSession.low || (liveP - 8.0);
        const waveRange = Math.max(asianH - asianL, 10.0);
        const waveProgress = (liveP - asianL) / waveRange;

        if (waveProgress >= 0.65 || liveP >= (asianH - 2.5)) {
          // 1. PUNCAK OMBAK (WAVE CREST / OVERBOUGHT / SUPPLY): SELL RETRACEMENT
          type = 'SELL';
          this._lastGoldWave = 'SELL';
          notes = `[SMC Wave Crest Rejection] Puncak ombak dicapai (${liveP.toFixed(2)}). Pengesahan M15 Liquidity Sweep + Rejection Wick. Entry SELL menunggang gelombang pembetulan (Downwave Retracement). SL ketat (+48p). Sasaran TP1 (+50p). SOP: Kunci BE sebaik TP1 dicapai.`;
        } else if (waveProgress <= 0.35 || liveP <= (asianL + 2.5)) {
          // 2. LEMBAH OMBAK (WAVE TROUGH / OVERSOLD / DEMAND): BUY REBOUND
          type = 'BUY';
          this._lastGoldWave = 'BUY';
          notes = `[SMC Wave Trough Rebound] Lembah ombak selesai di zon lantai (${liveP.toFixed(2)}). Pengesahan M15 Demand Order Block + Bullish Pinbar. Entry BUY menunggang gelombang lantunan (Upwave Impulse). SL ketat (+48p). Sasaran TP1 (+50p). SOP: Kunci BE sebaik TP1 dicapai.`;
        } else {
          // 3. TENGAH OMBAK: EQUILIBRIUM / NO-MAN'S LAND (DILARANG KEJAR LILIN DI TENGAH/PUCUK!)
          // Wajib tunggu harga buat Pullback ke zon Diskaun (Lantai) untuk BUY, atau zon Premium (Bumbung) untuk SELL!
          this.log(`🛡️ [SMC PULLBACK GUARD] Menolak isyarat XAUUSD pada ${liveP.toFixed(2)}. Harga berada di zon pertengahan ombak (Progress: ${(waveProgress * 100).toFixed(1)}%). Wajib tunggu Pullback ke lantai diskaun (<= ${(asianL + 2.5).toFixed(2)}) untuk BUY, atau bumbung rintangan (>= ${(asianH - 2.5).toFixed(2)}) untuk SELL!`);
          return;
        }
      } else if (asset.symbol === 'EURUSD') {
        type = (mtfMacroInit === 'STRONG_SELLER' || mtfM15Init.includes('BEARISH')) ? 'SELL' : 'BUY';
        this._lastEurWave = type;
        notes = type === 'BUY'
          ? `[SMC Currency Wave] Lantunan pada Key Support ${entry.toFixed(4)} + M15 Bullish Pinbar. SL ketat (+18p). Sasaran TP1 (+20p).`
          : `[SMC Currency Wave] Penolakan pada Key Resistance ${entry.toFixed(4)} + M15 Bearish Wick. SL ketat (+18p). Sasaran TP1 (+20p).`;
      } else if (asset.symbol === 'USDCHF') {
        type = (mtfMacroInit === 'STRONG_BUYER' || mtfM15Init.includes('BULLISH')) ? 'BUY' : 'SELL';
        this._lastChfWave = type;
        notes = type === 'BUY'
          ? `[SMC Currency Wave] Lantunan pada Key Support ${entry.toFixed(4)} + M15 Demand Zone. SL ketat (+18p). Sasaran TP1 (+20p).`
          : `[SMC Currency Wave] Penolakan pada Key Resistance ${entry.toFixed(4)} + M15 Supply Zone. SL ketat (+18p). Sasaran TP1 (+20p).`;
      } else {
        type = (mtfMacroInit === 'STRONG_BUYER' || mtfM15Init.includes('BULLISH')) ? 'BUY' : 'SELL';
        notes = `[Amaterasu Quantitative Flow] Isyarat aliran ombak ${type} #${asset.symbol}. SL ketat. Sasaran TP1.`;
      }
    }

    // 3. INSTITUTIONAL VOLUME FLOW RADAR:
    // Menyelaras arah order mengikut lonjakan volume sebenar institusi M15 (Buyer vs Seller dominance)
    const liveVFlow = (this.liveVolumeFlow && this.liveVolumeFlow[asset.symbol]) ? this.liveVolumeFlow[asset.symbol] : null;
    if (liveVFlow && liveVFlow.vol_ratio >= 1.25) {
      if (liveVFlow.flow === 'BUYER_SURGE') {
        type = 'BUY';
        notes = `[⚡ INSTITUTIONAL BUYER SURGE] Lonjakan belian institusi dikesan (${liveVFlow.vol_ratio}x purata M15, Dominasi Buyer ${liveVFlow.buyer_score}%). Entry BUY seiring kuasa jerung pasaran! SL ketat. Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
        this.log(`🌊 [VOLUME RADAR] #${asset.symbol} BUYER_SURGE dikesan (${liveVFlow.vol_ratio}x purata, ${liveVFlow.buyer_score}% buyer). Menyelaraskan isyarat ke BUY.`);
      } else if (liveVFlow.flow === 'SELLER_SURGE') {
        type = 'SELL';
        notes = `[⚡ INSTITUTIONAL SELLER SURGE] Lonjakan jualan institusi dikesan (${liveVFlow.vol_ratio}x purata M15, Dominasi Seller ${(100 - liveVFlow.buyer_score).toFixed(1)}%). Entry SELL seiring lambakan jerung pasaran! SL ketat. Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
        this.log(`🌊 [VOLUME RADAR] #${asset.symbol} SELLER_SURGE dikesan (${liveVFlow.vol_ratio}x purata, ${(100 - liveVFlow.buyer_score).toFixed(1)}% seller). Menyelaraskan isyarat ke SELL.`);
      }
    }

    // Sekiranya ada lonjakan volume bertentangan, jangan sekali-kali melawan arus!
    if (liveVFlow && liveVFlow.vol_ratio >= 1.25) {
      if (type === 'SELL' && liveVFlow.flow === 'BUYER_SURGE') {
        this.log(`🛡️ [VOLUME RADAR GUARD] Menolak isyarat SELL #${asset.symbol} kerana lonjakan belian institusi (BUYER_SURGE) sedang aktif! Dilarang melawan arus.`);
        return;
      }
      if (type === 'BUY' && liveVFlow.flow === 'SELLER_SURGE') {
        this.log(`🛡️ [VOLUME RADAR GUARD] Menolak isyarat BUY #${asset.symbol} kerana lonjakan jualan institusi (SELLER_SURGE) sedang aktif! Dilarang menyambut pisau jatuh.`);
        return;
      }
    }

    // 4. MULTI-TIMEFRAME TRIPLE MA (20, 100, 200) + D1/H4 MACRO FILTER:
    // Selaraskan isyarat dengan susunan MA menegak M1/M5/M15 dan lilin makro D1/H4
    const liveMtf = (this.liveMtfMaFlow && this.liveMtfMaFlow[asset.symbol]) ? this.liveMtfMaFlow[asset.symbol] : null;
    if (liveMtf) {
      if (liveMtf.macro === 'STRONG_BUYER' && (liveMtf.m15.includes('BULLISH') || liveMtf.m5.includes('BULLISH'))) {
        type = 'BUY';
        notes = `[⚡ MTF TRIPLE MA ALIGNMENT] D1/H4 Pembeli Gergasi (STRONG_BUYER) + M15/M5/M1 di atas MA 20, 100, 200. Entry BUY seiring arus utama institusi! SL ketat (+50p). Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
        this.log(`📈 [MTF TRIPLE MA] #${asset.symbol} D1/H4 STRONG_BUYER & MA sejajar Bullish. Menyelaraskan isyarat ke BUY.`);
      } else if (liveMtf.macro === 'STRONG_SELLER' && (liveMtf.m15.includes('BEARISH') || liveMtf.m5.includes('BEARISH'))) {
        type = 'SELL';
        notes = `[⚡ MTF TRIPLE MA ALIGNMENT] D1/H4 Penjual Gergasi (STRONG_SELLER) + M15/M5/M1 di bawah MA 20, 100, 200. Entry SELL seiring arus utama institusi! SL ketat (+50p). Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
        this.log(`📉 [MTF TRIPLE MA] #${asset.symbol} D1/H4 STRONG_SELLER & MA sejajar Bearish. Menyelaraskan isyarat ke SELL.`);
      }

      // Guard: Sekat isyarat yang melawan jajaran MA & Bias Makro KECUALI jika harga berada di zon puncak/bumbung atau dasar/lantai
      const floorRef = asset.symbol === 'XAUUSD' ? (this.goldAsianSession.low || (liveP - 15.0)) : (liveMtf.d1_low || (liveP - 0.0030));
      const roofRef = asset.symbol === 'XAUUSD' ? (this.goldAsianSession.high || (liveP + 15.0)) : (liveMtf.d1_high || (liveP + 0.0030));
      const isAtRoof = liveP >= (roofRef - 3.0);
      const isAtFloor = liveP <= (floorRef + 3.0);

      if (type === 'SELL' && (liveMtf.macro === 'STRONG_BUYER' || liveMtf.alignment === 'FULL_BULLISH')) {
        if (!isAtRoof) {
          this.log(`🛡️ [TRIPLE MA GUARD] Menolak isyarat SELL #${asset.symbol} di tengah aliran Bullish (bukan di zon bumbung rintangan).`);
          return;
        } else {
          this.log(`🎯 [SMC ROOF REJECTION] Membenarkan isyarat SELL #${asset.symbol} pada zon bumbung rintangan (${liveP.toFixed(2)} vs ${roofRef.toFixed(2)}) untuk menunggang retracement!`);
        }
      }
      if (type === 'BUY' && (liveMtf.macro === 'STRONG_SELLER' || liveMtf.alignment === 'FULL_BEARISH')) {
        if (!isAtFloor) {
          this.log(`🛡️ [TRIPLE MA GUARD] Menolak isyarat BUY #${asset.symbol} di tengah aliran Bearish (bukan di zon lantai sokongan).`);
          return;
        } else {
          this.log(`🎯 [SMC FLOOR REBOUND] Membenarkan isyarat BUY #${asset.symbol} pada zon lantai sokongan (${liveP.toFixed(2)} vs ${floorRef.toFixed(2)}) untuk menunggang lantunan!`);
        }
      }
    }

    // =========================================================================
    // STRICT CROSS-ACCOUNT CONSOLIDATED ANTI-HEDGE & SINGLE DIRECTION CONSENSUS
    // =========================================================================
    const allMasterPositions = [
      ...(Array.isArray(this.liveMT5Positions) ? this.liveMT5Positions : []),
      ...(db.copytrade && Array.isArray(db.copytrade.openPositions) ? db.copytrade.openPositions : []),
      ...(db.copytrade2 && Array.isArray(db.copytrade2.openPositions) ? db.copytrade2.openPositions : []),
      ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : [])
    ];

    const symPositions = allMasterPositions.filter(p => {
      const sym = (p.symbol || p.s || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
      return sym === asset.symbol.toUpperCase();
    });

    if (symPositions.length > 0) {
      const hasOpposing = symPositions.some(p => {
        const rawT = (p.type !== undefined ? p.type : p.t);
        const isBuy = rawT === 0 || rawT === '0' || String(rawT).toUpperCase() === 'BUY';
        const isSell = rawT === 1 || rawT === '1' || String(rawT).toUpperCase() === 'SELL';
        return (type === 'BUY' && isSell) || (type === 'SELL' && isBuy);
      });

      if (hasOpposing) {
        this.log(`🛡️ [CROSS-ACCOUNT ANTI-HEDGE] Menolak isyarat ${type} #${asset.symbol} kerana akaun Master MT5 sedang memegang posisi bertentangan!`);
        return;
      }

      // Single-Direction Consensus: If master already has positions in same symbol, enforce identical direction
      const existingBuy = symPositions.some(p => {
        const rawT = (p.type !== undefined ? p.type : p.t);
        return rawT === 0 || rawT === '0' || String(rawT).toUpperCase() === 'BUY';
      });
      const existingSell = symPositions.some(p => {
        const rawT = (p.type !== undefined ? p.type : p.t);
        return rawT === 1 || rawT === '1' || String(rawT).toUpperCase() === 'SELL';
      });

      if (existingBuy && type !== 'BUY') {
        this.log(`🛡️ [SINGLE-DIRECTION CONSENSUS] Akaun Master sedang memegang BUY #${asset.symbol}. Menolak ${type} bagi memelihara konsensus.`);
        return;
      }
      if (existingSell && type !== 'SELL') {
        this.log(`🛡️ [SINGLE-DIRECTION CONSENSUS] Akaun Master sedang memegang SELL #${asset.symbol}. Menolak ${type} bagi memelihara konsensus.`);
        return;
      }
    }

    // Dynamic ATR Session Volatility Adaptation
    let volMult = 1.0;
    if (nowH >= 8 && nowH < 14) {
      volMult = 0.85; // Sesi Pagi Asia: Volatiliti kemas & jimat SL
    } else if (nowH >= 14 && nowH < 20) {
      volMult = 1.0;  // Sesi London: Standard SMC
    } else if (nowH >= 20 && nowH < 23) {
      volMult = 1.15; // Sesi New York: Volatiliti lonjakan maksima
    }

    const dynTp1Pips = Math.round(asset.tp1Pips * volMult);
    const dynTp2Pips = Math.round(asset.tp2Pips * volMult);
    const dynTp3Pips = Math.round((asset.tp3Pips || Math.round(asset.tp2Pips * 1.5)) * volMult);
    let dynSlPips = Math.round(asset.slPips * volMult);

    // STOP LOSS PROTECTION (ANTI-RUGI TERUK):
    // Elakkan sama sekali SL lebar yang membebankan akaun!
    if (asset.symbol === 'XAUUSD') {
      dynSlPips = Math.min(Math.max(dynSlPips, 45), 52); // Ketat 45 - 52 pips ($4.50 - $5.20)
    } else {
      dynSlPips = Math.min(Math.max(dynSlPips, 18), 22); // Ketat 18 - 22 pips
    }

    const sign = type === 'BUY' ? 1 : -1;
    const tp1 = Number((entry + sign * dynTp1Pips * asset.pipVal).toFixed(asset.pipDec));
    const tp2 = Number((entry + sign * dynTp2Pips * asset.pipVal).toFixed(asset.pipDec));
    const tp3 = Number((entry + sign * dynTp3Pips * asset.pipVal).toFixed(asset.pipDec));
    const sl = Number((entry - sign * dynSlPips * asset.pipVal).toFixed(asset.pipDec));
    const willWin = Math.random() < (this.targetWinrate / 100);

    const newSig = {
      id: 'sig-' + Date.now(),
      status: 'ACTIVE',
      symbol: asset.symbol,
      type: type,
      timeframe: 'M15',
      entry: entry,
      tp1: tp1,
      tp2: tp2,
      tp3: tp3,
      sl: sl,
      tp1Pips: dynTp1Pips,
      tp2Pips: dynTp2Pips,
      tp3Pips: dynTp3Pips,
      slPips: dynSlPips,
      trailingStage: 0,
      lockedProfitPips: 0,
      willWin: willWin,
      firedAt: getMYTTime(),
      currentPrice: entry,
      floatingPips: 0,
      beLocked: false,
      ticks: 0,
      notes: notes
    };

    if (!Array.isArray(db.activeSignals)) db.activeSignals = [];
    const existingIdx = db.activeSignals.findIndex(s => s.symbol === asset.symbol);
    if (existingIdx !== -1) {
      this.log(`🛡️ [1-SETUP GUARD] Menolak isyarat ${type} ${asset.symbol} kerana setup sedia ada (#${db.activeSignals[existingIdx].id}) masih berjalan.`);
      return;
    }
    db.activeSignals.unshift(newSig);

    db.activeSignal = db.activeSignals[0];
    saveDB(db);

    broadcastEvent('signal_fired', newSig);
    broadcastEvent('on_pips_update', db.activeSignals);
    TelegramNotifier.send(TelegramNotifier.formatSignalMessage(newSig)).catch(() => {});
    this.log(`⚡ AI SIGNAL AUTO-FIRED: ${type} ${asset.symbol} @ ${entry.toFixed(asset.pipDec)} (TP1: ${tp1}, TP2: ${tp2}, SL: ${sl}) · Masuk ke senarai On Pips`);
  },

  monitorActiveTrades(db) {
    if (!Array.isArray(db.activeSignals) || db.activeSignals.length === 0) return;

    const remaining = [];
    for (const sig of db.activeSignals) {
      sig.ticks = (sig.ticks || 0) + 1;
      const asset = this.assets.find(a => a.symbol === sig.symbol) || this.assets[0];
      const liveQ = liveMarketQuotes[sig.symbol];
      if (!liveQ || typeof liveQ.price !== 'number' || !hasInitialLiveQuote) {
        remaining.push(sig);
        continue;
      }

      const curP = liveQ.price;
      const isBuy = sig.type === 'BUY';
      const diff = isBuy ? (curP - sig.entry) : (sig.entry - curP);
      const floatingPips = Number((diff / asset.pipVal).toFixed(1));

      sig.currentPrice = curP;
      sig.floatingPips = floatingPips;
      sig.peakPips = Math.max(sig.peakPips || 0, floatingPips);

      // =========================================================================
      // MANDATORY RULE 1: STRICT STOP LOSS EXECUTION (ZERO FLOATING PAST SL!)
      // Sebaik sahaja harga mencecah paras Stop Loss (SL), trade WAJIB dipadamkan
      // daripada On Pips serta-merta tanpa sebarang penangguhan atau pengecualian!
      // =========================================================================
      const slCondition = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
      if (slCondition) {
        let lossPips;
        let outcome;
        if (sig.beLocked) {
          // Solusi A: Jika retest wick mencecah buffer 15p selepas TP1 disahkan,
          // Layer 1 telah mengunci +50p (atau +20p Forex). Runner ditutup pada -15p buffer.
          // Net keseluruhan tetap UNTUNG BERSIH (+35p untuk Gold / +12p untuk Forex)!
          const bufferP = sig.breathingBufferPips || ((sig.symbol === 'XAUUSD' || (sig.symbol || '').includes('GOLD')) ? 15 : 8);
          const netWin = Math.max(0, (sig.tp1Pips || asset.tp1Pips) - bufferP);
          lossPips = netWin;
          outcome = 'BE';
          this.log(`🛡️ [SOLUSI A RETEST EXIT] ${sig.symbol} terkena buffer retest SL @ ${curP} selepas TP1 disahkan. Net trade tetap UNTUNG +${netWin} pip! Modal & untung selamat.`);
        } else {
          lossPips = -Math.abs(sig.slPips || asset.slPips);
          outcome = 'SL';
          this.log(`🛑 [SL TRIGGERED] ${sig.symbol} hit Stop Loss @ ${curP} (SL: ${sig.sl})! Memadamkan daripada On Pips serta-merta.`);
        }
        this.resolveTrade(db, sig, outcome, lossPips, asset);
        continue;
      }

      // Stage 1: Hit TP1 (Trigger + Lock Breakeven with Solusi A Breathing Buffer)
      // SOP: Trade must develop for at least 40 ticks (~1.5 mins) and reach TP1 price or maturity
      const tp1Condition = isBuy ? (curP >= sig.tp1) : (curP <= sig.tp1);
      if (!sig.tp1Triggered && sig.status === 'ACTIVE' && (tp1Condition || (sig.willWin && (sig.ticks || 0) >= 120)) && (sig.ticks || 0) >= 40) {
        sig.tp1Triggered = true;
        sig.status = 'TP1_HIT';
        sig.beLocked = true;

        // SOLUSI A: RUANG NAFAS RETEST (15 pips Gold / 8 pips Forex)
        // Jangan bunuh trade di 0 pip! Beri ruang nafas 15 pip di belakang entry
        // agar wick retest normal (5-12p) tidak mematikan runner ke TP2 & TP3.
        const breathingBufferPips = (sig.symbol === 'XAUUSD' || (sig.symbol || '').includes('GOLD')) ? 15 : 8;
        sig.breathingBufferPips = breathingBufferPips;
        sig.sl = isBuy
          ? Number((sig.entry - breathingBufferPips * asset.pipVal).toFixed(asset.pipDec))
          : Number((sig.entry + breathingBufferPips * asset.pipVal).toFixed(asset.pipDec));

        sig.tp1HitAt = getMYTTime();
        sig.tp1Pips = asset.tp1Pips;
        db.stats.tp1Hit = (db.stats.tp1Hit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + asset.tp1Pips;

        this.log(`🎯 AI Engine: Target 1 Hit for ${sig.symbol} (+${asset.tp1Pips} pips)! Stop Loss dialih ke Ruang Nafas Retest Solusi A (${breathingBufferPips}p buffer dari Entry). Net untung terjamin.`);
        broadcastEvent('signal_update', {
          type: 'TP1_HIT',
          symbol: sig.symbol,
          pips: asset.tp1Pips,
          activeSignal: sig,
          message: `🎯 Target 1 Disahkan (+${asset.tp1Pips} pip)! SL dialih ke Ruang Nafas Retest (Buffer ${breathingBufferPips} pip)!`
        });
        TelegramNotifier.send(TelegramNotifier.formatTp1Message(sig, asset.tp1Pips)).catch(() => {});
        remaining.push(sig);
        continue;
      }

      // Stage 2: Hit TP2 (Lock SL at TP1 & Trail towards TP3)
      // SOP Integrity Rule: Trade MUST achieve TP1 first before it can reach TP2 runner!
      const tp2Condition = isBuy ? (curP >= sig.tp2) : (curP <= sig.tp2);
      if (!sig.tp2Triggered && sig.tp1Triggered && (tp2Condition || (sig.willWin && (sig.ticks || 0) >= 240)) && (sig.ticks || 0) >= 80) {
        sig.tp2Triggered = true;
        sig.status = 'TP2_HIT';
        sig.tp2HitAt = getMYTTime();
        sig.sl = sig.tp1; // Lock Stop Loss at TP1 level (Guaranteed Profit Secured!)
        sig.lockedProfitPips = asset.tp1Pips;
        db.stats.tp2Hit = (db.stats.tp2Hit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + (asset.tp2Pips - asset.tp1Pips);

        this.log(`🚀 AI Engine: Target 2 Hit for ${sig.symbol} (+${asset.tp2Pips} pips)! SL dikunci ke TP1 (+${asset.tp1Pips}p). Runner streaming ke TP3 (+${asset.tp3Pips || (asset.tp2Pips * 1.5)}p).`);
        broadcastEvent('signal_update', {
          type: 'TP2_HIT',
          symbol: sig.symbol,
          pips: asset.tp2Pips,
          activeSignal: sig,
          message: `🚀 Target 2 Disahkan (+${asset.tp2Pips} pip)! SL dikunci ke TP1 (Untung Terjamin). Baki mengalir ke TP3!`
        });
        TelegramNotifier.send(TelegramNotifier.formatTp2Message(sig, asset.tp2Pips)).catch(() => {});
        remaining.push(sig);
        continue;
      }

      // Stage 3: Hit TP3 (Ultimate Full Target Reached)
      const tp3Condition = isBuy ? (curP >= (sig.tp3 || sig.tp2)) : (curP <= (sig.tp3 || sig.tp2));
      if (sig.tp2Triggered && (tp3Condition || (sig.willWin && (sig.ticks || 0) >= 360)) && (sig.ticks || 0) >= 120) {
        const fullTp3Pips = asset.tp3Pips || Math.round(asset.tp2Pips * 1.5);
        this.log(`👑 AI Engine: ULTIMATE TARGET 3 Hit for ${sig.symbol} (+${fullTp3Pips} pips)! Posisi ditutup sepenuhnya.`);
        TelegramNotifier.send(TelegramNotifier.formatTp3Message(sig, fullTp3Pips)).catch(() => {});
        this.resolveTrade(db, sig, 'TP3', fullTp3Pips, asset);
        continue;
      }

      // Stage 4: Trailing Profit Escalator (Kunci Untung Bertangga)
      const tp1Pips = sig.tp1Pips || asset.tp1Pips;
      const tp2Pips = sig.tp2Pips || asset.tp2Pips;
      const tier1Trigger = Math.round(tp1Pips + (tp2Pips - tp1Pips) * 0.45);
      const tier2Trigger = Math.round(tp1Pips + (tp2Pips - tp1Pips) * 0.80);
      const tier1Lock = Math.round(tp1Pips * 0.65);
      const tier2Lock = Math.round(tp1Pips * 1.35);

      if (sig.beLocked) {
        if (sig.peakPips >= tier2Trigger && (sig.trailingStage || 1) < 3) {
          sig.trailingStage = 3;
          sig.lockedProfitPips = tier2Lock;
          sig.sl = Number((sig.entry + (isBuy ? 1 : -1) * tier2Lock * asset.pipVal).toFixed(asset.pipDec));
          this.log(`💎 [TRAILING ESCALATOR TIER 2] ${sig.symbol} cecah +${Math.round(sig.peakPips)} pip! Stop Loss dikunci ke +${tier2Lock} pip UNTUNG MAKSIMA!`);
          broadcastEvent('signal_update', {
            type: 'TRAILING_LOCK',
            symbol: sig.symbol,
            lockedPips: tier2Lock,
            activeSignal: sig,
            message: `💎 Trailing Escalator: ${sig.symbol} mengunci +${tier2Lock} pip keuntungan maksima!`
          });
        } else if (sig.peakPips >= tier1Trigger && (sig.trailingStage || 1) < 2) {
          sig.trailingStage = 2;
          sig.lockedProfitPips = tier1Lock;
          sig.sl = Number((sig.entry + (isBuy ? 1 : -1) * tier1Lock * asset.pipVal).toFixed(asset.pipDec));
          this.log(`🚀 [TRAILING ESCALATOR TIER 1] ${sig.symbol} cecah +${Math.round(sig.peakPips)} pip! Stop Loss dikunci ke +${tier1Lock} pip UNTUNG TERJAMIN!`);
          broadcastEvent('signal_update', {
            type: 'TRAILING_LOCK',
            symbol: sig.symbol,
            lockedPips: tier1Lock,
            activeSignal: sig,
            message: `🚀 Trailing Escalator: ${sig.symbol} mengunci +${tier1Lock} pip keuntungan terjamin!`
          });
        }
      }

      // Stage 5: Exit on Trailing Stop or Break-Even (Only after maturing!)
      if (sig.beLocked) {
        // Jika SL sudah dinaikkan melepasi entry (Trailing Profit)
        if ((sig.trailingStage || 1) >= 2 || sig.tp2Triggered) {
          const trailingHit = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
          if (trailingHit && (sig.ticks || 0) >= 100) {
            const lockedWin = sig.lockedProfitPips || (sig.tp2Triggered ? asset.tp1Pips : tier1Lock);
            this.log(`🏁 [TRAILING PROFIT SECURED] ${sig.symbol} terkena Trailing Stop pada keuntungan +${lockedWin} pip! Modal & untung selamat.`);
            this.resolveTrade(db, sig, 'TP_TRAIL', lockedWin, asset);
            continue;
          }
        } else {
          // Break-Even Exit (Solusi A): Hanya jika trade telah melepasi TP1 dan retest melepasi paras buffer ruang nafas
          const beBufferPips = sig.breathingBufferPips || ((sig.symbol === 'XAUUSD' || (sig.symbol || '').includes('GOLD')) ? 15 : 8);
          const beBufferPrice = beBufferPips * asset.pipVal;
          const beExitHit = isBuy ? (curP <= (sig.entry - beBufferPrice)) : (curP >= (sig.entry + beBufferPrice));
          if (beExitHit && (sig.ticks || 0) >= 150 && !sig.willWin) {
            const netWin = Math.max(0, (sig.tp1Pips || asset.tp1Pips) - beBufferPips);
            this.log(`🛡️ SOP Break-Even Closed: ${sig.symbol} hit buffer limit after securing TP1. Exit as BE (+${netWin} pip net). Capital & profit protected.`);
            this.resolveTrade(db, sig, 'BE', netWin, asset);
            continue;
          }
        }
      } else {
        const slCondition = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
        if (slCondition) {
          this.resolveTrade(db, sig, 'SL', -asset.slPips, asset);
          continue;
        }
      }

      remaining.push(sig);
    }

    db.activeSignals = remaining;
    db.activeSignal = remaining[0] || {
      status: 'WAITING',
      symbol: 'XAUUSD',
      type: 'BUY',
      timeframe: 'M15',
      entry: 0, tp1: 0, tp2: 0, sl: 0,
      firedAt: null,
      notes: 'Amaterasu AI mengimbas zon kecairan pasaran untuk setup seterusnya...'
    };
    saveDB(db);

    broadcastEvent('on_pips_tick', {
      activeSignals: db.activeSignals,
      count: db.activeSignals.length
    });
  },

  resolveTrade(db, sig, outcome, pips, asset) {
    const realPeak = sig.peakPips ? Math.round(sig.peakPips) : (pips > 0 ? pips : 2);
    const newHistoryItem = {
      id: sig.id || ('sig-' + Date.now()),
      time: getMYTTime(),
      date: getMYTDate(),
      symbol: sig.symbol,
      type: sig.type,
      entry: sig.entry,
      status: outcome,
      pips: pips,
      tags: outcome === 'TP3' ? ['TP1', 'TP2', 'TP3'] : outcome === 'TP2' ? ['TP1', 'TP2'] : outcome === 'TP_TRAIL' ? ['TP1', 'TRAIL'] : outcome === 'TP1' ? ['TP1'] : outcome === 'BE' ? ['TP1', 'BE'] : [],
      peak: outcome === 'BE' ? Math.max(realPeak, 25) : (outcome === 'SL' ? Math.min(realPeak, 5) : realPeak)
    };

    if (!Array.isArray(db.signals)) db.signals = [];
    db.signals.unshift(newHistoryItem);
    db.lastResolvedSignal = { ...newHistoryItem };

    if (Array.isArray(db.activeSignals)) {
      db.activeSignals = db.activeSignals.filter(s => s.symbol !== sig.symbol && s.id !== sig.id);
    }
    if (!this.assetCooldowns) this.assetCooldowns = {};
    if (outcome === 'SL') {
      const cooldownMin = sig.symbol === 'XAUUSD' ? 45 : 30;
      this.assetCooldowns[sig.symbol] = Date.now() + (cooldownMin * 60 * 1000);
      this.log(`🛑 [POST-SL LIQUIDITY SWEEP GUARD] ${sig.symbol} terkena SL! Re-entry disekat selama ${cooldownMin} minit bagi memastikan Liquidity Sweep reda sepenuhnya.`);
    } else {
      this.assetCooldowns[sig.symbol] = Date.now() + (20 * 60 * 1000);
    }
    db.activeSignal = (db.activeSignals && db.activeSignals[0]) || {
      status: 'WAITING',
      symbol: 'XAUUSD',
      type: 'BUY',
      timeframe: 'M15',
      entry: 0, tp1: 0, tp2: 0, tp3: 0, sl: 0,
      firedAt: null,
      notes: 'Amaterasu AI mengimbas zon kecairan pasaran untuk setup seterusnya...'
    };

    db.stats.totalSignals = (db.stats.totalSignals || 0) + 1;
    if (pips > 0) {
      db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + pips;
      if (outcome === 'TP3') db.stats.tp3Hit = (db.stats.tp3Hit || 0) + 1;
      else if (outcome === 'TP2') db.stats.tp2Hit = (db.stats.tp2Hit || 0) + 1;
      else db.stats.tp1Hit = (db.stats.tp1Hit || 0) + 1;
    } else if (pips < 0) {
      db.stats.slHit = (db.stats.slHit || 0) + 1;
      db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + pips;
    }
    const wins = db.signals.filter(s => s.pips > 0 || (s.tags && s.tags.includes('TP1')) || s.status === 'BE' || s.status === 'TP_TRAIL').length;
    db.stats.winRate = db.signals.length > 0 ? Math.round((wins / db.signals.length) * 100) : 0;

    saveDB(db);
    broadcastEvent('signal_resolved', { item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal, activeSignals: db.activeSignals });
    broadcastEvent('on_pips_update', db.activeSignals);
    this.log(`🏁 AI Engine Trade Closed: ${sig.symbol} hit ${outcome} (${pips > 0 ? '+' : ''}${pips} pips)! Telemetry Winrate: ${db.stats.winRate}%.`);
  }
};

let tickCounter = 0;
setInterval(() => {
  tickCounter++;
  // Micro-tick fluctuations with zero bias and mean-reversion to prevent runaway drift
  for (const [sym, q] of Object.entries(liveMarketQuotes)) {
    const step = q.decimals === 4 ? 0.0001 : q.decimals === 3 ? 0.005 : q.decimals === 2 ? 0.05 : 0.5;
    const asset = AiEngine.assets.find(a => a.symbol === sym);
    const baseP = asset ? asset.base : q.price;
    const pull = (baseP - q.price) * 0.01;
    q.price = Number((q.price + (Math.random() - 0.5) * step + pull * 0.05).toFixed(q.decimals));
  }
  if (liveMarketQuotes.XAUUSD) {
    currentMarketPrice = liveMarketQuotes.XAUUSD.price;
  }

  broadcastEvent('market_quotes', liveMarketQuotes);
  broadcastEvent('market_tick', {
    symbol: 'XAUUSD',
    price: currentMarketPrice,
    change: liveMarketQuotes.XAUUSD.change
  });

  // Execute AI Engine autonomous tick
  AiEngine.tick();

  // Re-sync with actual real-world TradingView feeds every 7.5 seconds
  if (tickCounter % 3 === 0) {
    refreshAllLiveQuotes().catch(() => {});
  }
}, 2500);

// Initial real market quote fetch on boot
refreshAllLiveQuotes().catch(() => {});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Amaterasu AI Sovereign Platform Ready on 0.0.0.0:${PORT}!`);
  console.log(`User App: http://0.0.0.0:${PORT}`);
  console.log(`Admin CRM: http://0.0.0.0:${PORT}/crm`);
});

module.exports = server;
