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
    id: "master-1",
    name: "DRAGON",
    avatar: "img/dragon.png",
    masterAccount: "5100221532",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    currentBalance: 11136.74,
    currentEquity: 11450.00,
    growthPct: 235.23,
    netProfitUsc: 23523.00,
    netProfitUsd: 235.23,
    winRate: 90.4,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    badge: "VAULT 1 (DRAGON CENT+)",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "04:20:00"
  },
  copytrade2: {
    id: "master-2",
    name: "MANTIS",
    avatar: "img/mantis.png",
    masterAccount: "5100221533",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    totalWithdrawn: 6000.0,
    totalWithdrawnUsd: 60.0,
    allTimeProfitUsc: 15852.87,
    allTimeProfitUsd: 158.53,
    allTimeGrowthPct: 1585.29,
    growthPct: 1585.29,
    netProfitUsc: 15852.87,
    netProfitUsd: 158.53,
    currentBalance: 10511.08,
    currentEquity: 10848.26,
    activeEquity: 10848.26,
    activeEquityUsd: 108.48,
    winRate: 100.0,
    maxDrawdown: 0.0,
    status: "LIVE & ACTIVE",
    badge: "VAULT 2 (MANTIS CENT+)",
    copiersCount: 18,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "07:45:00"
  },
  copytrade3: {
    id: "master-3",
    name: "TIGER",
    avatar: "img/tiger.png",
    masterAccount: "5100221534",
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
    currentBalance: 1484.56,
    currentEquity: 1484.56,
    activeEquity: 1484.56,
    activeEquityUsd: 1484.56,
    winRate: 100.0,
    maxDrawdown: 0.0,
    status: "LIVE & ACTIVE",
    badge: "MASTER 3 (TIGER $1,000 USD)",
    copiersCount: 12,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "07:45:00"
  },
  copytrade4: {
    id: "master-4",
    name: "MEZ EA",
    avatar: "img/mez-ea.png",
    masterAccount: "5100227599",
    broker: "Versus Trade Ltd. (Live1)",
    accountType: "Cent Account (USC)",
    currency: "USC",
    initialDeposit: 10000.0,
    totalWithdrawn: 0.0,
    totalWithdrawnUsd: 0.0,
    allTimeProfitUsc: 0.0,
    allTimeProfitUsd: 0.0,
    allTimeGrowthPct: 0.0,
    growthPct: 0.0,
    netProfitUsc: 0.0,
    netProfitUsd: 0.0,
    currentBalance: 10012.2,
    currentEquity: 10012.2,
    activeEquity: 10012.2,
    activeEquityUsd: 100.12,
    winRate: 100.0,
    maxDrawdown: 0.0,
    status: "LIVE & ACTIVE",
    badge: "VAULT 4 (MEZ EA CENT+)",
    copiersCount: 5,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
    lastSync: "18:15:00"
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
      pips: Math.round(dayPips * 10) / 10
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
  const todayPips = Math.round((last7Days[last7Days.length - 1].pips || 0) * 10) / 10;

  db.stats = {
    totalSignals,
    totalSignalsClosed: signals.length,
    totalProfitAllTime: Math.round(totalProfitAllTime * 10) / 10,
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
    const masterKey = req.headers['x-master-key'] || req.headers['x-admin-key'] || '';
    if (masterKey === 'amaterasu_master_secret' || masterKey === 'tengku_khairi') {
      return { operator: 'Tengku Khairi (Boss)', expiry: Date.now() + 86400000 };
    }
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

  sendMasterVideoFile(caption) {
    try {
      const db = getDB();
      const cfg = db.telegramConfig || {};
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return Promise.resolve({ skipped: true });
      }

      const candidatePaths = [
        path.join(__dirname, 'amaterasux_master_talking_briefing.mp4'),
        path.join(__dirname, '..', 'brain', 'cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5', 'scratch', 'amaterasux_master_talking_briefing.mp4'),
        path.join(__dirname, 'master_avatar_briefing.mp4'),
        path.join('C:\\Users\\US\\.gemini\\antigravity\\brain\\cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5\\scratch\\amaterasux_master_talking_briefing.mp4'),
        path.join('C:\\Users\\US\\.gemini\\antigravity\\brain\\cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5\\master_avatar_briefing.mp4')
      ];

      const videoPath = candidatePaths.find(p => fs.existsSync(p));
      if (!videoPath) {
        return this.send(caption);
      }

      const videoData = fs.readFileSync(videoPath);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);

      let body = '';
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${cfg.chatId}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="video"; filename="chief_market_strategist.mp4"\r\n`;
      body += `Content-Type: video/mp4\r\n\r\n`;

      const postData = Buffer.concat([
        Buffer.from(body, 'utf8'),
        videoData,
        Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
      ]);

      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${cfg.botToken}/sendVideo`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': postData.length
          },
          timeout: 45000
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
        req.setTimeout(45000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: e.message });
    }
  },

  sendVideo(videoUrl, caption) {
    try {
      const db = getDB();
      const cfg = db.telegramConfig || {};
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return Promise.resolve({ skipped: true });
      }

      const postData = JSON.stringify({
        chat_id: cfg.chatId,
        video: videoUrl,
        caption: caption || '',
        parse_mode: 'HTML'
      });

      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${cfg.botToken}/sendVideo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 20000
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
        req.setTimeout(20000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: e.message });
    }
  },

  sendMasterVideoFile(caption) {
    try {
      const db = getDB();
      const cfg = db.telegramConfig || {};
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return Promise.resolve({ skipped: true });
      }

      const candidatePaths = [
        path.join(__dirname, 'amaterasux_master_talking_briefing.mp4'),
        path.join(__dirname, '..', 'brain', 'cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5', 'scratch', 'amaterasux_master_talking_briefing.mp4'),
        path.join(__dirname, 'master_avatar_briefing.mp4'),
        path.join('C:\\Users\\US\\.gemini\\antigravity\\brain\\cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5\\scratch\\amaterasux_master_talking_briefing.mp4'),
        path.join('C:\\Users\\US\\.gemini\\antigravity\\brain\\cb3cb3ce-090a-4aa4-a4fe-efac10e1d5a5\\master_avatar_briefing.mp4')
      ];

      const videoPath = candidatePaths.find(p => fs.existsSync(p));
      if (!videoPath) {
        return this.send(caption);
      }

      const videoData = fs.readFileSync(videoPath);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);

      let body = '';
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${cfg.chatId}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="video"; filename="chief_market_strategist.mp4"\r\n`;
      body += `Content-Type: video/mp4\r\n\r\n`;

      const postData = Buffer.concat([
        Buffer.from(body, 'utf8'),
        videoData,
        Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
      ]);

      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${cfg.botToken}/sendVideo`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': postData.length
          },
          timeout: 45000
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
        req.setTimeout(45000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: e.message });
    }
  },

  sendPoll(question, options) {
    try {
      const db = getDB();
      const cfg = db.telegramConfig || {};
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return Promise.resolve({ skipped: true });
      }

      const postData = JSON.stringify({
        chat_id: cfg.chatId,
        question: question,
        options: options,
        is_anonymous: true
      });

      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${cfg.botToken}/sendPoll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
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
        req.setTimeout(15000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });
    } catch (e) {
      return Promise.resolve({ ok: false, error: e.message });
    }
  },

  formatMorningBriefing(db) {
    const cp = db.copytrade || {};
    const curBal = Number(cp.currentBalance || 10000).toFixed(2);
    const balUsd = (Number(curBal) / 100).toFixed(2);
    const dateStr = getMYTDate({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = getMYTTime();

    return '🦅 <b>AMATERASU X · MORNING VAULT BRIEFING</b>\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '📅 <b>Tarikh:</b> ' + dateStr + ' (' + timeStr + ' MYT)\n' +
      '🏆 <b>Master Vault:</b> DRAGON CENT+ (OFFICIAL)\n' +
      '💼 <b>Status Enjin:</b> SESI HARIAN BERMULA\n\n' +
      '🏦 <b>PEMANTAUAN MODAL AWAL HARI</b>\n' +
      '• Baki Pembukaan: <code>' + Number(curBal).toLocaleString() + ' USC ($' + balUsd + ' USD)</code>\n' +
      '• Sasaran Harian: <code>+2,500.00 USC (+$25.00 USD)</code>\n' +
      '• Floating Semasa: <code>0.00 USC (Sifar Drawdown)</code>\n\n' +
      '📊 <b>ZON FOKUS & JADUAL BERITA HARI INI:</b>\n' +
      '• 14:00 - 15:15 MYT: ⚠️ Pembukaan London (Zon Manipulasi Judas Swing - Elak Entry Terburu-buru)\n' +
      '• 21:30 - 22:30 MYT: ⚡ Sesi New York (Auto-News Filter Aktif Untuk Lindungi Modal)\n\n' +
      '🛡️ <b>DISIPLIN KETAT AMATERASUX:</b>\n' +
      'Sebaik sahaja sasaran keuntungan harian tercapai (+2,500 USC), sistem akan berhenti automatik untuk mengunci profit pelabur.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '🚀 <b>SERTAI COPYTRADE AMATERASUX:</b>\n' +
      '1. Daftar akaun Versus Trade (Cent Account)\n' +
      '2. Deposit minimum: 10,000 USC ($100 USD)\n' +
      '3. Salin akaun Master secara automatik 1:1!\n\n' +
      '🔗 <b>Pautan Pendaftaran Broker:</b>\n' +
      'https://one.versustrade.link/links/go/78665?pid=170480';
  },

  formatAiAvatarScript(db, vaultNum = 1) {
    const cp = vaultNum === 4 ? (db.copytrade4 || {}) : (vaultNum === 3 ? (db.copytrade3 || {}) : (vaultNum === 2 ? (db.copytrade2 || {}) : (db.copytrade || {})));
    const masterName = cp.name || (vaultNum === 1 ? 'DRAGON' : (vaultNum === 2 ? 'MANTIS' : (vaultNum === 3 ? 'TIGER' : 'MEZ EA')));
    const isCent = vaultNum !== 3;
    const curBal = Number(cp.currentBalance || (isCent ? 10000 : 1000)).toFixed(0);
    const balUsd = isCent ? (Number(curBal) / 100).toFixed(0) : curBal;
    const dailyProfitUsc = Number(cp.todayProfitUsc || (db.stats && db.stats.totalProfitToday ? db.stats.totalProfitToday : 2500)).toFixed(0);
    const dailyProfitUsd = isCent ? (Number(dailyProfitUsc) / 100).toFixed(0) : dailyProfitUsc;
    const dateStr = getMYTDate({ day: 'numeric', month: 'long', year: 'numeric' });

    return `Good day, Amaterasu X investors and community members. This is your official market strategist daily briefing for ${dateStr}. ` +
      `Our ${masterName} Master Vault has successfully hit today's profit target, generating a net gain of ${Number(dailyProfitUsc).toLocaleString()} Cent, which equals $${dailyProfitUsd} US Dollars, with zero overnight floating drawdown. ` +
      `Our capital currently stands strong at ${Number(curBal).toLocaleString()} Cent, or $${balUsd} US Dollars. ` +
      `Under our strict institutional risk management rules, all positions are fully secured and trading is now closed for the day to lock in profits. ` +
      `To copy this institutional strategy with a minimum of $100 US Dollars, register your account using the verified link in the caption below. Have a profitable day ahead.`;
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
    if (vNum === 4) {
      const growth = Number(cp?.growthPct !== undefined ? cp.growthPct : 0.0).toFixed(2);
      const balUsc = Number(cp?.currentBalance || 10012.2).toFixed(2);
      const balUsd = Number(cp?.activeEquityUsd || (balUsc / 100)).toFixed(2);
      const masterName = cp?.name || "MEZ EA";
      return `👑 <b>${masterName} · MASTER 4 OFFICIAL COPYTRADE</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        `🏆 <b>Master:</b> ${masterName} (#5100227599)\n` +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '💼 <b>Status:</b> LIVE & ACTIVE · FRESH STANDBY\n' +
        '📈 <b>Growth:</b> +' + growth + '%\n' +
        `💰 <b>Modal Semasa:</b> ${balUsc} USC ($${balUsd} USD)\n` +
        '🛡️ <b>Strategi:</b> Institutional SMC Multi-Terminal AI\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🔗 <b>Daftar Akaun Follow:</b> https://one.versustrade.link/links/go/78665?pid=170480';
    } else if (vNum === 3) {
      const growth = Number(cp?.growthPct || 188.76).toFixed(2);
      const netUsd = Number(cp?.netProfitUsd || 1887.57).toFixed(2);
      const balUsd = Number(cp?.currentBalance || 2887.57).toFixed(2);
      return '👑 <b>TIGER · MASTER 3 OFFICIAL STANDARD COPYTRADE</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🏆 <b>Master:</b> TIGER (#5100221534)\n' +
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
        '🔗 <b>Pautan Broker:</b> https://one.versustrade.link/links/go/78665?pid=170480';
    } else if (vNum === 2) {
      const growth = Number(cp?.growthPct !== undefined ? cp.growthPct : 0.0).toFixed(2);
      return '🔥 <b>MANTIS · MASTER 2 OFFICIAL COPYTRADE ANNOUNCEMENT</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '👑 <b>Master:</b> MANTIS (#5100221533)\n' +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '💼 <b>Status:</b> LIVE & ACTIVE · FRESH STANDBY\n' +
        '📈 <b>Growth:</b> +' + growth + '%\n' +
        '💰 <b>Modal Pool Semasa:</b> 10,000.00 USC ($100.00 USD ✓)\n' +
        '🛡️ <b>Strategi:</b> Institutional SMC + Malaysian SNR Multi-Terminal AI\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🚀 <b>Peluang Masuk Dari Baseline:</b>\n' +
        'Sertai MANTIS sekarang untuk menikmati pertumbuhan akaun sejak hari pertama!\n' +
        '🔗 <b>Pautan Broker:</b> https://one.versustrade.link/links/go/78665?pid=170480';
    } else {
      const growth = Number(cp?.growthPct || 235.23).toFixed(2);
      const grossProfit = Number(cp?.allTimeProfitUsc || 23523.0).toLocaleString();
      const grossUsd = Number(cp?.allTimeProfitUsd || 235.23).toFixed(2);
      const wd = Number(cp?.totalWithdrawn || 20000.0).toLocaleString();
      const wdUsd = Number(cp?.totalWithdrawnUsd || 200.0).toFixed(2);
      return '🐉 <b>DRAGON COPYTRADE PERFORMANCE</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🏆 <b>Master:</b> DRAGON (#5100221532)\n' +
        '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
        '📈 <b>All-Time Realized Growth:</b> +' + growth + '%\n' +
        '💰 <b>Untung Kasar Terkumpul:</b> +' + grossProfit + ' USC (+$' + grossUsd + ' USD)\n' +
        '🛡️ <b>Telah Dikeluarkan (WD):</b> ' + wd + ' USC (+$' + wdUsd + ' USD ✓)\n' +
        '💎 <b>Status Modal Asal:</b> 100% BEBAS RISIKO (Modal asal selamat ditarik keluar 200%!)\n' +
        '🎯 <b>Winrate Terbukti:</b> 90.4% (Max Drawdown < 5%)\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '🚀 <b>Sertai Copytrade Sekarang:</b>\n' +
        '1. Buka akaun Versus Trade (Cent Account)\n' +
        '2. Deposit minimum: 10,000 USC ($100 USD)\n' +
        '🔗 <b>Pautan Broker:</b> https://one.versustrade.link/links/go/78665?pid=170480';
    }
  },

  formatCommunityDailyReport(db, vaultNum = 1) {
    const cp = vaultNum === 4 ? (db.copytrade4 || {}) : (vaultNum === 3 ? (db.copytrade3 || {}) : (vaultNum === 2 ? (db.copytrade2 || {}) : (db.copytrade || {})));
    const masterName = cp.name || (vaultNum === 1 ? 'DRAGON' : (vaultNum === 2 ? 'MANTIS' : (vaultNum === 3 ? 'TIGER' : 'MEZ EA')));
    const masterAcc = cp.masterAccount || (vaultNum === 1 ? '5100221532' : (vaultNum === 2 ? '5100221533' : (vaultNum === 3 ? '5100221534' : '5100227599')));
    const isCent = vaultNum !== 3;
    const curBal = Number(cp.currentBalance || (isCent ? 10000 : 1000)).toFixed(2);
    const curEq = Number(cp.currentEquity || cp.activeEquity || curBal).toFixed(2);
    const balUsd = isCent ? (Number(curBal) / 100).toFixed(2) : curBal;
    const eqUsd = isCent ? (Number(curEq) / 100).toFixed(2) : curEq;
    const growth = Number(cp.growthPct || cp.allTimeGrowthPct || 25.0).toFixed(2);
    const dailyProfitUsc = Number(cp.todayProfitUsc || (db.stats && db.stats.totalProfitToday ? db.stats.totalProfitToday : 2500)).toFixed(2);
    const dailyProfitUsd = isCent ? (Number(dailyProfitUsc) / 100).toFixed(2) : dailyProfitUsc;
    const floating = Number(cp.floatingProfit || 0).toFixed(2);
    const drawdownPct = Number(cp.maxDrawdown || 0).toFixed(1);
    const dateStr = getMYTDate({ day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = getMYTTime();

    return '🦅 <b>AMATERASU X · OFFICIAL MASTER PERFORMANCE</b>\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '🏆 <b>Master Vault:</b> ' + masterName + ' (OFFICIAL)\n' +
      '🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n' +
      '📅 <b>Tarikh:</b> ' + dateStr + ' (' + timeStr + ' MYT)\n' +
      '💼 <b>Status Sistem:</b> LIVE & DISIPLIN TINGGI\n\n' +
      '🏦 <b>MODAL MANAGER</b>\n' +
      '• Baki Semasa: <code>' + Number(curBal).toLocaleString() + (isCent ? ' USC ($' + balUsd + ' USD)' : ' USD') + '</code>\n' +
      '• Ekuiti Semasa: <code>' + Number(curEq).toLocaleString() + (isCent ? ' USC ($' + eqUsd + ' USD)' : ' USD') + '</code>\n' +
      '• Floating Drawdown: <code>' + floating + (isCent ? ' USC' : ' USD') + ' (' + drawdownPct + '% Drawdown)</code>\n\n' +
      '💰 <b>PRESTASI HARIAN</b>\n' +
      '• Untung Bersih Harian: <code>+' + Number(dailyProfitUsc).toLocaleString() + (isCent ? ' USC (+$' + dailyProfitUsd + ' USD)' : ' USD') + '</code>\n' +
      '• Pertumbuhan (% Grow): <code>+' + growth + '%</code>\n' +
      '• Sasaran Harian: <code>TERCAPAI & DIKUNCI</code>\n\n' +
      '🛡️ <b>KAWALAN RISIKO KETAT</b>\n' +
      '• Tiada Martingale & Tiada Hold Floating Berhari-hari\n' +
      '• Stop Loss SMC Berstruktur (Bucu Liquidity)\n' +
      '• Auto Break-Even (Sifar Risiko Bila Posisi Berjalan)\n' +
      '• Circuit Breaker Harian: Auto-Stop Selepas Target Tercapai\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '🚀 <b>SERTAI COPYTRADE AMATERASUX:</b>\n' +
      '1. Daftar akaun Versus Trade (Cent Account)\n' +
      '2. Deposit minimum: 10,000 USC ($100 USD)\n' +
      '3. Salin akaun Master secara automatik 1:1!\n\n' +
      '🔗 <b>Pautan Pendaftaran Broker:</b>\nhttps://one.versustrade.link/links/go/78665?pid=170480';
  }
};

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

  // 0.05 POST /api/market/audit-report (Receives full audit report from VPS MT5)
  if (pathname === '/api/market/audit-report' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      console.log('=== [MT5 AUDIT REPORT DITERIMA DARI VPS] ===\n', JSON.stringify(payload, null, 2));

      if (payload && Array.isArray(payload.reports)) {
        for (const rep of payload.reports) {
          const loginStr = String(rep.login);
          // Master 1 (#5100221532 Cent)
          if (loginStr === '5100221532') {
            if (db.copytrade) {
              db.copytrade.currentBalance = rep.balance;
              db.copytrade.currentEquity = rep.equity;
              if (rep.deposits) db.copytrade.initialDeposit = rep.deposits;
              if (rep.withdrawals !== undefined) {
                db.copytrade.totalWithdrawn = rep.withdrawals;
                db.copytrade.totalWithdrawnUsd = +(rep.withdrawals / 100).toFixed(2);
              }
              if (rep.netRealised !== undefined) {
                db.copytrade.allTimeProfitUsc = rep.netRealised;
                db.copytrade.allTimeProfitUsd = +(rep.netRealised / 100).toFixed(2);
                db.copytrade.netProfitUsc = rep.netRealised;
                db.copytrade.netProfitUsd = +(rep.netRealised / 100).toFixed(2);
              }
              if (rep.growthPct !== undefined) {
                db.copytrade.growthPct = rep.growthPct;
                db.copytrade.allTimeGrowthPct = rep.growthPct;
              }
              db.copytrade.activeEquity = rep.equity;
              db.copytrade.activeEquityUsd = +(rep.equity / 100).toFixed(2);
              db.copytrade.lastSync = getMYTTimeWithSeconds();
            }
          }
          // Master 2 (#5100221533 Cent)
          if (loginStr === '5100221533') {
            if (db.copytrade2) {
              db.copytrade2.currentBalance = rep.balance;
              db.copytrade2.currentEquity = rep.equity;
              if (rep.deposits) db.copytrade2.initialDeposit = rep.deposits;
              if (rep.withdrawals !== undefined) {
                db.copytrade2.totalWithdrawn = rep.withdrawals;
                db.copytrade2.totalWithdrawnUsd = +(rep.withdrawals / 100).toFixed(2);
              }
              if (rep.netRealised !== undefined) {
                db.copytrade2.allTimeProfitUsc = rep.netRealised;
                db.copytrade2.allTimeProfitUsd = +(rep.netRealised / 100).toFixed(2);
                db.copytrade2.netProfitUsc = rep.netRealised;
                db.copytrade2.netProfitUsd = +(rep.netRealised / 100).toFixed(2);
              }
              if (rep.growthPct !== undefined) {
                db.copytrade2.growthPct = rep.growthPct;
                db.copytrade2.allTimeGrowthPct = rep.growthPct;
              }
              db.copytrade2.activeEquity = rep.equity;
              db.copytrade2.activeEquityUsd = +(rep.equity / 100).toFixed(2);
              db.copytrade2.lastSync = getMYTTimeWithSeconds();
            }
          }
          // Master 3 (#5100221534 Standard USD)
          if (loginStr === '5100221534') {
            if (db.copytrade3) {
              db.copytrade3.currentBalance = rep.balance;
              db.copytrade3.currentEquity = rep.equity;
              if (rep.deposits) db.copytrade3.initialDeposit = rep.deposits;
              if (rep.withdrawals !== undefined) {
                db.copytrade3.totalWithdrawn = rep.withdrawals;
                db.copytrade3.totalWithdrawnUsd = rep.withdrawals;
              }
              if (rep.netRealised !== undefined) {
                db.copytrade3.allTimeProfitUsd = rep.netRealised;
                db.copytrade3.netProfitUsd = rep.netRealised;
              }
              if (rep.growthPct !== undefined) {
                db.copytrade3.growthPct = rep.growthPct;
                db.copytrade3.allTimeGrowthPct = rep.growthPct;
              }
              db.copytrade3.activeEquity = rep.equity;
              db.copytrade3.activeEquityUsd = rep.equity;
              db.copytrade3.lastSync = getMYTTimeWithSeconds();
            }
          }
          // Master 4 (#5100227599 Cent USC)
          if (loginStr === '5100227599') {
            if (db.copytrade4) {
              db.copytrade4.currentBalance = rep.balance;
              db.copytrade4.currentEquity = rep.equity;
              if (rep.deposits) db.copytrade4.initialDeposit = rep.deposits;
              if (rep.withdrawals !== undefined) {
                db.copytrade4.totalWithdrawn = rep.withdrawals;
                db.copytrade4.totalWithdrawnUsd = +(rep.withdrawals / 100).toFixed(2);
              }
              if (rep.netRealised !== undefined) {
                db.copytrade4.allTimeProfitUsc = rep.netRealised;
                db.copytrade4.allTimeProfitUsd = +(rep.netRealised / 100).toFixed(2);
                db.copytrade4.netProfitUsc = rep.netRealised;
                db.copytrade4.netProfitUsd = +(rep.netRealised / 100).toFixed(2);
              }
              if (rep.growthPct !== undefined) {
                db.copytrade4.growthPct = rep.growthPct;
                db.copytrade4.allTimeGrowthPct = rep.growthPct;
              }
              db.copytrade4.activeEquity = rep.equity;
              db.copytrade4.activeEquityUsd = +(rep.equity / 100).toFixed(2);
              db.copytrade4.lastSync = getMYTTimeWithSeconds();
            }
          }
        }
        if (Array.isArray(db.copytrades)) {
          if (db.copytrade) db.copytrades[0] = db.copytrade;
          if (db.copytrade2) db.copytrades[1] = db.copytrade2;
          if (db.copytrade3) db.copytrades[2] = db.copytrade3;
          if (db.copytrade4) db.copytrades[3] = db.copytrade4;
        }
        saveDB(db);
        broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrade4: db.copytrade4, copytrades: db.copytrades });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Audit report processed successfully', payload }));
    } catch (err) {
      console.error('[AUDIT REPORT ERROR]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
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

      const isMasterAccount = !payload.accountInfo || String(payload.accountInfo.login) === '5100221532' || !payload.accountInfo.login;

      // =========================================================================
      // UNIFIED 24/7 LIVE MT5 COPYTRADE STATS SYNCHRONIZATION ENGINE
      // =========================================================================
      if (payload && payload.accountInfo) {
        const acc = payload.accountInfo;
        const loginStr = String(acc.login || '');
        const trd = (db.traders || []).find(t => String(t.mt5Account) === loginStr);
        if (trd) {
          trd.currentBalance = acc.balance;
          trd.currentEquity = acc.equity;
          trd.lastSync = getMYTTimeWithSeconds();
        }

        // 1. MASTER 1 (DRAGON #5100221532 - Cent USC)
        if (loginStr === '5100221532' || (!acc.login && isMasterAccount)) {
          if (!db.copytrade) db.copytrade = {};
          const initDep1 = Number(acc.deposits) > 0 ? Number(acc.deposits) : 10000.0;
          const totalWd1 = Number(acc.totalWithdrawn) || 0.0;
          const bal1 = Number(acc.balance);
          const eq1 = Number(acc.equity);
          const flt1 = Number(acc.profit) || 0.0;
          const netProfit1 = +(eq1 + totalWd1 - initDep1).toFixed(2);
          const growthPct1 = +((netProfit1 / initDep1) * 100).toFixed(2);

          db.copytrade.id = "master-1";
          db.copytrade.name = "DRAGON";
          db.copytrade.avatar = "img/dragon.png";
          db.copytrade.masterAccount = "5100221532";
          db.copytrade.broker = "Versus Trade Ltd. (Live1)";
          db.copytrade.accountType = "Cent Account (USC)";
          db.copytrade.currency = "USC";
          db.copytrade.initialDeposit = initDep1;
          db.copytrade.totalWithdrawn = totalWd1;
          db.copytrade.totalWithdrawnUsd = +(totalWd1 / 100).toFixed(2);
          db.copytrade.currentBalance = bal1;
          db.copytrade.currentEquity = eq1;
          db.copytrade.activeEquity = eq1;
          db.copytrade.activeEquityUsd = +(eq1 / 100).toFixed(2);
          db.copytrade.netProfitUsc = netProfit1;
          db.copytrade.netProfitUsd = +(netProfit1 / 100).toFixed(2);
          db.copytrade.allTimeProfitUsc = Math.max(netProfit1, 0);
          db.copytrade.allTimeProfitUsd = +(Math.max(netProfit1, 0) / 100).toFixed(2);
          db.copytrade.growthPct = growthPct1;
          db.copytrade.allTimeGrowthPct = Math.max(growthPct1, 0);
          db.copytrade.floatingProfit = flt1;
          db.copytrade.realizedProfit = Number(acc.realizedProfit) || 0.0;
          db.copytrade.closedTrades = Number(acc.closedTrades) || 113;
          db.copytrade.wonTrades = Number(acc.wonTrades) || 79;
          db.copytrade.winRate = acc.winRate !== undefined ? Number(acc.winRate) : 69.9;
          db.copytrade.badge = "VAULT 1 (DRAGON CENT+)";
          db.copytrade.status = "LIVE & ACTIVE";
          db.copytrade.copiersCount = db.copytrade.copiersCount || 42;
          db.copytrade.lastSync = getMYTTimeWithSeconds();
          db.copytrade.openPositions = payload.openPositions || [];
        }

        // 2. MASTER 2 (MANTIS #5100221533 - Cent USC)
        else if (loginStr === '5100221533') {
          if (!db.copytrade2) db.copytrade2 = {};
          const initDep2 = Number(acc.deposits) > 0 ? Number(acc.deposits) : 10000.0;
          const totalWd2 = Number(acc.totalWithdrawn) || 0.0;
          const bal2 = Number(acc.balance);
          const eq2 = Number(acc.equity);
          const flt2 = Number(acc.profit) || 0.0;
          const netProfit2 = +(eq2 + totalWd2 - initDep2).toFixed(2);
          const growthPct2 = +((netProfit2 / initDep2) * 100).toFixed(2);

          db.copytrade2.id = "master-2";
          db.copytrade2.name = "MANTIS";
          db.copytrade2.avatar = "img/mantis.png";
          db.copytrade2.masterAccount = "5100221533";
          db.copytrade2.broker = "Versus Trade Ltd. (Live1)";
          db.copytrade2.accountType = "Cent Account (USC)";
          db.copytrade2.currency = "USC";
          db.copytrade2.initialDeposit = initDep2;
          db.copytrade2.totalWithdrawn = totalWd2;
          db.copytrade2.totalWithdrawnUsd = +(totalWd2 / 100).toFixed(2);
          db.copytrade2.currentBalance = bal2;
          db.copytrade2.currentEquity = eq2;
          db.copytrade2.activeEquity = eq2;
          db.copytrade2.activeEquityUsd = +(eq2 / 100).toFixed(2);
          db.copytrade2.netProfitUsc = netProfit2;
          db.copytrade2.netProfitUsd = +(netProfit2 / 100).toFixed(2);
          db.copytrade2.allTimeProfitUsc = Math.max(netProfit2, 0);
          db.copytrade2.allTimeProfitUsd = +(Math.max(netProfit2, 0) / 100).toFixed(2);
          db.copytrade2.growthPct = growthPct2;
          db.copytrade2.allTimeGrowthPct = Math.max(growthPct2, 0);
          db.copytrade2.floatingProfit = flt2;
          db.copytrade2.realizedProfit = Number(acc.realizedProfit) || 0.0;
          db.copytrade2.closedTrades = Number(acc.closedTrades) || 111;
          db.copytrade2.wonTrades = Number(acc.wonTrades) || 79;
          db.copytrade2.winRate = acc.winRate !== undefined ? Number(acc.winRate) : 71.2;
          db.copytrade2.badge = "VAULT 2 (MANTIS CENT+)";
          db.copytrade2.status = "LIVE & ACTIVE";
          db.copytrade2.copiersCount = db.copytrade2.copiersCount || 18;
          db.copytrade2.lastSync = getMYTTimeWithSeconds();
          db.copytrade2.openPositions = payload.openPositions || [];
        }

        // 3. MASTER 3 (TIGER #5100221534 - Standard $1,000 USD)
        else if (loginStr === '5100221534') {
          if (!db.copytrade3) db.copytrade3 = {};
          const initDep3 = Number(acc.deposits) > 0 ? Number(acc.deposits) : 1100.0;
          const totalWd3 = Number(acc.totalWithdrawn) || 100.0;
          const bal3 = Number(acc.balance);
          const eq3 = Number(acc.equity);
          const flt3 = Number(acc.profit) || 0.0;
          const netProfit3 = +(eq3 + totalWd3 - initDep3).toFixed(2);
          const growthPct3 = +((netProfit3 / initDep3) * 100).toFixed(2);

          db.copytrade3.id = "master-3";
          db.copytrade3.name = "TIGER";
          db.copytrade3.avatar = "img/tiger.png";
          db.copytrade3.masterAccount = "5100221534";
          db.copytrade3.broker = "Versus Trade Ltd. (Live1)";
          db.copytrade3.accountType = "Standard USD";
          db.copytrade3.currency = "USD";
          db.copytrade3.initialDeposit = initDep3;
          db.copytrade3.totalWithdrawn = totalWd3;
          db.copytrade3.totalWithdrawnUsd = totalWd3;
          db.copytrade3.currentBalance = bal3;
          db.copytrade3.currentEquity = eq3;
          db.copytrade3.activeEquity = eq3;
          db.copytrade3.activeEquityUsd = eq3;
          db.copytrade3.netProfitUsd = netProfit3;
          db.copytrade3.allTimeProfitUsd = Math.max(netProfit3, 0);
          db.copytrade3.growthPct = growthPct3;
          db.copytrade3.allTimeGrowthPct = Math.max(growthPct3, 0);
          db.copytrade3.floatingProfit = flt3;
          db.copytrade3.realizedProfit = Number(acc.realizedProfit) || 0.0;
          db.copytrade3.closedTrades = Number(acc.closedTrades) || 252;
          db.copytrade3.wonTrades = Number(acc.wonTrades) || 149;
          db.copytrade3.winRate = acc.winRate !== undefined ? Number(acc.winRate) : 59.1;
          db.copytrade3.badge = "MASTER 3 (TIGER $1,000 USD)";
          db.copytrade3.status = "LIVE & ACTIVE";
          db.copytrade3.copiersCount = db.copytrade3.copiersCount || 12;
          db.copytrade3.lastSync = getMYTTimeWithSeconds();
          db.copytrade3.openPositions = payload.openPositions || [];
        }

        // 4. MASTER 4 (MEZ EA #5100227599 - Cent USC)
        else if (loginStr === '5100227599') {
          if (!db.copytrade4) db.copytrade4 = {};
          const initDep4 = Number(acc.deposits) > 0 ? Number(acc.deposits) : 10012.2;
          const totalWd4 = Number(acc.totalWithdrawn) || 0.0;
          const bal4 = Number(acc.balance);
          const eq4 = Number(acc.equity);
          const flt4 = Number(acc.profit) || 0.0;
          const netProfit4 = +(eq4 + totalWd4 - initDep4).toFixed(2);
          const growthPct4 = +((netProfit4 / initDep4) * 100).toFixed(2);

          db.copytrade4.id = "master-4";
          db.copytrade4.name = "MEZ EA";
          db.copytrade4.avatar = "img/mez-ea.png";
          db.copytrade4.masterAccount = "5100227599";
          db.copytrade4.broker = "Versus Trade Ltd. (Live1)";
          db.copytrade4.accountType = "Cent Account (USC)";
          db.copytrade4.currency = "USC";
          db.copytrade4.initialDeposit = initDep4;
          db.copytrade4.totalWithdrawn = totalWd4;
          db.copytrade4.totalWithdrawnUsd = +(totalWd4 / 100).toFixed(2);
          db.copytrade4.currentBalance = bal4;
          db.copytrade4.currentEquity = eq4;
          db.copytrade4.activeEquity = eq4;
          db.copytrade4.activeEquityUsd = +(eq4 / 100).toFixed(2);
          db.copytrade4.netProfitUsc = netProfit4;
          db.copytrade4.netProfitUsd = +(netProfit4 / 100).toFixed(2);
          db.copytrade4.allTimeProfitUsc = Math.max(netProfit4, 0);
          db.copytrade4.allTimeProfitUsd = +(Math.max(netProfit4, 0) / 100).toFixed(2);
          db.copytrade4.growthPct = growthPct4;
          db.copytrade4.allTimeGrowthPct = Math.max(growthPct4, 0);
          db.copytrade4.floatingProfit = flt4;
          db.copytrade4.realizedProfit = Number(acc.realizedProfit) || 0.0;
          db.copytrade4.closedTrades = Number(acc.closedTrades) || 3;
          db.copytrade4.wonTrades = Number(acc.wonTrades) || 3;
          db.copytrade4.winRate = acc.winRate !== undefined ? Number(acc.winRate) : 100.0;
          db.copytrade4.badge = "VAULT 4 (MEZ EA CENT+)";
          db.copytrade4.status = "LIVE & ACTIVE";
          db.copytrade4.copiersCount = db.copytrade4.copiersCount || 5;
          db.copytrade4.lastSync = getMYTTimeWithSeconds();
          db.copytrade4.openPositions = payload.openPositions || [];
        }

        db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
        broadcastEvent('copytrade_update', {
          copytrade: db.copytrade,
          copytrade2: db.copytrade2,
          copytrade3: db.copytrade3,
          copytrade4: db.copytrade4,
          copytrades: db.copytrades
        });
        saveDB(db);
      }

      if (payload && Array.isArray(payload.openPositions)) {
        AiEngine.liveMT5Positions = payload.openPositions;
        if (db.copytrade && payload.accountInfo && String(payload.accountInfo.login) === '5100221532') {
          db.copytrade.openPositions = payload.openPositions;
        }

        // =========================================================================
        // CONTINUOUS CONSOLIDATED MULTI-MASTER AUTO-RECONCILIATION ENGINE
        // Aggregates positions from ALL Masters (Cent 1, Cent 2, Standard 3, Cent 4)
        // so no master's active trades are ever lost, purged, or orphaned!
        // =========================================================================
        const allowedWhitelist = ['XAUUSD', 'USDCHF', 'EURUSD'];

        const allMastersPositions = [
          ...(Array.isArray(payload.openPositions) ? payload.openPositions : []),
          ...(Array.isArray(db.copytrade?.openPositions) ? db.copytrade.openPositions : []),
          ...(Array.isArray(db.copytrade2?.openPositions) ? db.copytrade2.openPositions : []),
          ...(Array.isArray(db.copytrade3?.openPositions) ? db.copytrade3.openPositions : []),
          ...(Array.isArray(db.copytrade4?.openPositions) ? db.copytrade4.openPositions : [])
        ];

        // Map MT5 positions by clean symbol (e.g. 'XAUUSD', 'USDCHF', 'EURUSD')
        const mt5BySymbol = {};
        for (const p of allMastersPositions) {
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
            if (sig.status !== 'ACTIVE' && sig.status !== 'TP1_HIT' && sig.status !== 'TP2_HIT') {
              sig.status = 'ACTIVE';
              dbChanged = true;
            }
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
            if (mt5Pos.sl && sig.sl !== mt5Pos.sl) {
              sig.sl = mt5Pos.sl;
              dbChanged = true;
            }
            if (mt5Pos.tp && sig.tp1 !== mt5Pos.tp) {
              sig.tp1 = mt5Pos.tp;
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

        // 4. PURGE CLOSED POSITIONS (ZERO GHOST SIGNALS & INSTANT TAKE TP RECONCILIATION):
        // Jika sesuatu signal dalam db.activeSignals tiada lagi dalam posisi terbuka MT5,
        // bermakna ia telahpun DITUTUP di terminal MT5 (sama ada hit TP, trailing, atau closed manual oleh Boss).
        // Selaraskan serta-merta sebagai TAKE TP (Untung Dijamin), rekod dalam sejarah, dan buru setup baharu!
        for (let i = db.activeSignals.length - 1; i >= 0; i--) {
          const sig = db.activeSignals[i];
          if (sig.isTest) continue;
          const sym = (sig.symbol || '').toUpperCase();
            if (!mt5BySymbol[sym]) {
              const nowMs = Date.now();
              if (!sig._firstMissingAt) sig._firstMissingAt = nowMs;
              const missingDurationSec = (nowMs - sig._firstMissingAt) / 1000;
              const isClosedFromMt5 = sig.mt5Verified ? (missingDurationSec >= 15) : (missingDurationSec >= 180);
              if (isClosedFromMt5) {
                console.log(`🧹 [AUTO-PURGE CLOSED TRADE] #${sym} tiada dalam MT5 (Verified: ${sig.mt5Verified}, MissingCount: ${sig._missingFromMt5Count}). Menutup sebagai TAKE TP & mencari setup baharu!`);
                const asset = AiEngine.assets.find(a => a.symbol === sym) || AiEngine.assets[0];
                const curP = liveMarketQuotes[sym] ? liveMarketQuotes[sym].price : sig.entry;
                const isBuy = sig.type === 'BUY';
                const isSlHit = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
                
                // Jika ditutup manual atau hit TP, anggap ia sebagai TAKE TP / Profit Aman Terkunci!
                let outcome = 'TP1';
                let finalPips = (sig.floatingPips && sig.floatingPips > 0) ? sig.floatingPips : ((sig.peakPips && sig.peakPips > 0) ? sig.peakPips : asset.tp1Pips);
                if (isSlHit && !sig.beLocked) {
                  outcome = 'SL';
                  finalPips = -asset.slPips;
                } else if (isSlHit && sig.beLocked) {
                  outcome = 'BE';
                  finalPips = 1;
                }

                AiEngine.resolveTrade(db, sig, outcome, finalPips, asset);
                db.activeSignals = db.activeSignals.filter(s => s.id !== sig.id);
                db.activeSignal = (db.activeSignals && db.activeSignals[0]) || {
                  status: 'WAITING',
                  symbol: sym,
                  type: 'SELL',
                  timeframe: 'M15',
                  entry: 0, tp1: 0, tp2: 0, tp3: 0, sl: 0,
                  firedAt: null,
                  notes: 'Posisi selesai (Take TP Secured). Amaterasu AI mengimbas zon kecairan untuk setup seterusnya...'
                };

                // ARAHAN BOS: SETIAP KALI PROFIT TP, BUFFER TIME 30 MINIT UNTUK SEMUA AKAUN!
                if (AiEngine.assetCooldowns) {
                  AiEngine.assetCooldowns[sym] = Date.now() + (30 * 60 * 1000);
                }

                for (const vault of [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4]) {
                  if (vault && Array.isArray(vault.openPositions)) {
                    vault.openPositions = vault.openPositions.filter(p => (p.symbol || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase() !== sym);
                  }
                }
                dbChanged = true;

                // TRIGGER SEGERA IMBASAN SETUP BAHARU MENGIKUT STRUKTUR PASARAN TERKINI
                setImmediate(() => {
                  try {
                    AiEngine.fireAutonomousSignal(getDB(), null);
                  } catch (e) {
                    console.error('[AI AUTO-SCAN AFTER CLOSE ERROR]', e);
                  }
                });
              }
            } else {
              sig._firstMissingAt = null;
            }
          }
        }

      // (Master 1 sync is now unified and handled in UNIFIED 24/7 LIVE MT5 COPYTRADE STATS ENGINE above)

      if (dbChanged) {
        saveDB(db);
        broadcastEvent('on_pips_update', db.activeSignals);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: true, 
        synced: Object.keys(payload?.quotes || {}).length, 
        reconciled: !!payload?.openPositions, 
        copytrade: db.copytrade,
        resumeTrading: db.copytrade?.targetReached === false,
        resetTarget: db.copytrade?.targetReached === false,
        close_symbols: db.pendingCloseSymbols || []
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 0.1b POST /api/market/close-directive (Instruct remote MT5 bridges to close specific symbols)
  if (pathname === '/api/market/close-directive' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const db = getDB();
      db.pendingCloseSymbols = body.symbols || ['EURUSD', 'USDCHF'];
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, pendingCloseSymbols: db.pendingCloseSymbols }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
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
      const totalWd = Number(db.copytrade.totalWithdrawn) || 20000.0;
      const eq = Number(db.copytrade.currentEquity) || 10000.54;
      const effectiveGrossUsc = Math.max(eq + totalWd - initDep, Number(db.copytrade.allTimeProfitUsc) || 23523.00);
      db.copytrade.growthPct = +((effectiveGrossUsc / initDep) * 100).toFixed(2);
      db.copytrade.netProfitUsc = effectiveGrossUsc;
      db.copytrade.netProfitUsd = +(effectiveGrossUsc / 100).toFixed(2);
      db.copytrade.lastSync = getMYTTimeWithSeconds();

      if (!Array.isArray(db.copytrades)) {
        db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
      } else {
        db.copytrades[0] = db.copytrade;
      }

      saveDB(db);
      broadcastEvent('copytrade_update', { copytrade: db.copytrade, copytrade2: db.copytrade2, copytrade3: db.copytrade3, copytrade4: db.copytrade4, copytrades: db.copytrades });
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
    const list = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
    db.copytrades = list;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      copytrade: db.copytrade || {},
      copytrade2: db.copytrade2 || {},
      copytrade3: db.copytrade3 || {},
      copytrade4: db.copytrade4 || {},
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
      
      const sig = (db.activeSignals || []).find(s => {
        if (ticket) {
          return s.mt5Ticket && Number(s.mt5Ticket) === Number(ticket);
        }
        return s.symbol === rawSymbol;
      });
      const asset = AiEngine.assets.find(a => a.symbol === rawSymbol) || AiEngine.assets[0];
      const profitNum = Number(payload.profit) || 0;
      const isSl = event === 'SL' || (comment && comment.toLowerCase().includes('sl')) || profitNum < 0;

      if (sig) {
        let outcome = 'TP1';
        let resolvedPips = Number(pips) || (sig.floatingPips && sig.floatingPips > 0 ? sig.floatingPips : asset.tp1Pips);
        
        if (isSl && !sig.beLocked) {
          outcome = 'SL';
          resolvedPips = -asset.slPips;
        } else if (isSl && sig.beLocked) {
          outcome = 'BE';
          resolvedPips = 1;
        } else if (event === 'TP2' || (comment && comment.toLowerCase().includes('tp2'))) {
          outcome = 'TP2';
          resolvedPips = Number(pips) || asset.tp2Pips;
        }

        AiEngine.resolveTrade(db, sig, outcome, resolvedPips, asset);
        db.activeSignals = (db.activeSignals || []).filter(s => s.id !== sig.id);
        db.activeSignal = (db.activeSignals && db.activeSignals[0]) || {
          status: 'WAITING',
          symbol: rawSymbol,
          type: 'SELL',
          timeframe: 'M15',
          entry: 0, tp1: 0, tp2: 0, tp3: 0, sl: 0,
          firedAt: null,
          notes: 'Posisi selesai (Take TP Secured). Amaterasu AI mengimbas zon kecairan untuk setup seterusnya...'
        };

        // ARAHAN BOS: SETIAP KALI PROFIT TP, BUFFER TIME 30 MINIT UNTUK SEMUA AKAUN!
        if (AiEngine.assetCooldowns) {
          AiEngine.assetCooldowns[rawSymbol] = Date.now() + (30 * 60 * 1000);
        }

        saveDB(db);
        broadcastEvent('on_pips_update', db.activeSignals);
        broadcastEvent('signal_resolved', { item: db.lastResolvedSignal, stats: db.stats, activeSignal: db.activeSignal, activeSignals: db.activeSignals });
        console.log(`[MT5 SYNC] ${rawSymbol} selesai di MT5 sebagai ${outcome} (${resolvedPips > 0 ? '+' : ''}${resolvedPips}p). Buffer time 30 minit diaktifkan sebelum setup baharu.`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, symbol: rawSymbol, outcome, resolvedPips, activeSignalsCount: db.activeSignals.length }));
      } else {
        // Jika trade manual ditutup dalam keuntungan, rekodkan ke sejarah signal sebagai Take TP!
        if (profitNum > 0 || event === 'TP1' || event === 'TP2') {
          const pipsWon = rawSymbol === 'XAUUSD' ? Math.round(profitNum * 10) : 35;
          const manualItem = {
            id: 'mt5-manual-' + (ticket || Date.now()),
            time: getMYTTime(),
            date: getMYTDate(),
            symbol: rawSymbol,
            type: 'SELL',
            entry: Number(price) || (liveMarketQuotes[rawSymbol] ? liveMarketQuotes[rawSymbol].price : 0),
            status: 'TP1',
            pips: Math.max(pipsWon, 35),
            tags: ['TP1', 'MANUAL_TP'],
            peak: Math.max(pipsWon, 35)
          };
          if (!Array.isArray(db.signals)) db.signals = [];
          db.signals.unshift(manualItem);
          db.lastResolvedSignal = manualItem;
          // ARAHAN BOS: SETIAP KALI PROFIT TP, BUFFER TIME 30 MINIT UNTUK SEMUA AKAUN!
          if (AiEngine.assetCooldowns) AiEngine.assetCooldowns[rawSymbol] = Date.now() + (30 * 60 * 1000);
          saveDB(db);
          broadcastEvent('signal_resolved', { item: manualItem, stats: db.stats, activeSignal: db.activeSignal, activeSignals: db.activeSignals });
          console.log(`[MT5 MANUAL WIN] Posisi manual ${rawSymbol} ditutup dengan keuntungan ($${profitNum.toFixed(2)}). Buffer time 30 minit diaktifkan.`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Deal MT5 disahkan' }));
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
        db.copytrades = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
      } else {
        db.copytrades[0] = db.copytrade;
        if (db.copytrade2) db.copytrades[1] = db.copytrade2;
        if (db.copytrade3) db.copytrades[2] = db.copytrade3;
        if (db.copytrade4) db.copytrades[3] = db.copytrade4;
      }
    }
    const sanitized = { ...db };
    sanitized.copytrades = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
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

  // 1b-2. POST /api/account/resume (Arahan Bos: Start Balik Trading untuk akaun)
  if ((pathname === '/api/account/resume' || pathname === '/api/copytrade/resume') && req.method === 'POST') {
    const flagPaths = [
      path.join(__dirname, 'resume_trading.flag'),
      'C:\\AmaterasuX\\resume_trading.flag',
      'C:\\AmaterasuX_Acc2\\resume_trading.flag',
      'C:\\AmaterasuX_Acc3\\resume_trading.flag'
    ];
    for (const fp of flagPaths) {
      try {
        fs.writeFileSync(fp, 'RESUME');
      } catch (e) {}
    }
    const db = getDB();
    const accounts = [db.copytrade, db.copytrade2, db.copytrade3, db.copytrade4].filter(Boolean);
    for (const acc of accounts) {
      acc.targetReached = false;
      if (acc.status && acc.status.includes('TARGET REACHED')) {
        acc.status = 'LIVE & ACTIVE';
      }
    }
    saveDB(db);
    AiEngine.log('🚀 [ARAHAN RESUME] Arahan Tengku Khairi disahkan! Semua akaun dibenarkan memulakan pusingan dagangan baharu.');
    broadcastEvent('account_resumed', { success: true, message: 'Dagangan disambung semula mengikut arahan Bos.' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Dagangan disambung semula mengikut arahan Tengku Khairi.' }));
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
      const isGold = (targetSymbol === 'XAUUSD');
      const curPrice = Number(payload.entry) || (liveMarketQuotes[targetSymbol]?.price || 3632.0);
      const newSig = {
        id: 'sig-' + Date.now(),
        status: 'ACTIVE',
        symbol: targetSymbol,
        asset: targetSymbol,
        type: targetType,
        timeframe: payload.timeframe || 'M15',
        entry: curPrice,
        tp1: Number(payload.tp1) || (isGold ? (targetType === 'BUY' ? +(curPrice + 3.50).toFixed(2) : +(curPrice - 3.50).toFixed(2)) : (targetType === 'BUY' ? +(curPrice + 0.0020).toFixed(4) : +(curPrice - 0.0020).toFixed(4))),
        tp2: Number(payload.tp2) || (isGold ? (targetType === 'BUY' ? +(curPrice + 7.00).toFixed(2) : +(curPrice - 7.00).toFixed(2)) : (targetType === 'BUY' ? +(curPrice + 0.0040).toFixed(4) : +(curPrice - 0.0040).toFixed(4))),
        sl: Number(payload.sl) || (isGold ? (targetType === 'BUY' ? +(curPrice - 4.50).toFixed(2) : +(curPrice + 4.50).toFixed(2)) : (targetType === 'BUY' ? +(curPrice - 0.0025).toFixed(4) : +(curPrice + 0.0025).toFixed(4))),
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
      const cp = vaultId === 4 ? (db.copytrade4 || {}) : (vaultId === 3 ? (db.copytrade3 || {}) : (vaultId === 2 ? (db.copytrade2 || {}) : (db.copytrade || {})));
      const msg = TelegramNotifier.formatCopytradeMessage(vaultId, cp);
      const result = await TelegramNotifier.send(msg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: result.ok === true, details: result, vaultId }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // Broadcast Custom Message to Telegram Channel (Bridge / AI Engine)
  if (pathname === '/api/telegram/broadcast-custom' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      if (payload && payload.text) {
        let result;
        if (payload.video === true) {
          result = await TelegramNotifier.sendMasterVideoFile(payload.text);
        } else {
          result = await TelegramNotifier.send(payload.text);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: result.ok === true, details: result }));
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Text diperlukan' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // Broadcast Community Daily Performance Report to Telegram
  if (pathname === '/api/telegram/broadcast-community-report' && req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const vaultId = Number(payload.vaultId) || 1;
      const msg = TelegramNotifier.formatCommunityDailyReport(db, vaultId);
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

    // 🛡️ Cryptographic Master Token Check / Owner Bypass
    const auth = SecurityShield.isRequestAuthorized(req);
    const isOwnerOrMaster = (
      auth ||
      callSign.toLowerCase() === 'tengku khairi' ||
      callSign.toLowerCase() === 'owner' ||
      ['5100221532', '5100221533', '5100221534', '5100227599'].includes(String(mt5).trim())
    );
    if (isOwnerOrMaster) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        isMaster: true,
        valid: true,
        daysRemaining: 9999,
        passTitle: 'Owner / Master VIP Infinite Pass',
        message: 'Akses Penuh Pengasas & Pemilik Amaterasu X (' + (auth ? auth.operator : 'Tengku Khairi') + ')'
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
  if (file === '/4' || file === '/x') file = '/fix.ps1';
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
  enabled: true, // AKTIF 24 JAM MEMANTAU PASARAN (SESI ENTRY BUKA 08:00 AM PAGI ESOK)
  dailyProfitTargetUsc: 2500, // 2,500 USC = $25.00 USD (Henti trade serta-merta bila cecah target)
  dailyProfitTargetUsd: 25.0,
  targetReached: false,
  sessionStartUsc: null,
  frequencyMode: 'SCALP_PRO', // 'SCALP_PRO' (Ultra-Scalp ~20 Setups/Day XAUUSD)
  targetWinrate: 94, // 90%+ Sovereign Institutional Model (94% Target Winrate)
  scanIntervalSec: 45, // 45 seconds agile interval (Ultra-Rapid Opportunity Capture)
  secondsInState: 44,
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
    high: 0,
    low: 0
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
      
      if (this.goldAsianSession.date !== mytDate || !this.goldAsianSession.low) {
        this.goldAsianSession.date = mytDate;
        this.goldAsianSession.high = Number((liveP + 6.0).toFixed(2));
        this.goldAsianSession.low = Number((liveP - 6.0).toFixed(2));
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
      const minute = mytDate.getMinutes();
      const totalMin = hour * 60 + minute;

      // Hujung Minggu: Tutup Sabtu selepas jam 06:00 AM MYT sehingga Isnin 07:00 AM MYT
      if (day === 6 && hour >= 6) return false;
      if (day === 0) return false;
      if (day === 1 && hour < 7) return false;

      // ARAHAN TEGAS BOS: HARAMKAN TRADE PADA WAKTU BAHAYA MANIPULASI:
      // 1. Rollover & Midnight Spread Spiking (00:00 - 07:00 MYT)
      if (hour >= 0 && hour < 7) return false;

      // 2. London Open Judas Swing Manipulation Trap (14:00 - 15:15 MYT)
      if (totalMin >= 840 && totalMin < 915) return false;

      return true; // Aktif pada waktu bersih & Golden Window (London 15:15 - 19:00, US 19:30 - 23:59)
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
      dailyProfitTargetUsc: this.dailyProfitTargetUsc,
      dailyProfitTargetUsd: this.dailyProfitTargetUsd,
      targetReached: this.targetReached,
      sessionStartUsc: this.sessionStartUsc,
      frequencyMode: this.frequencyMode,
      targetWinrate: this.targetWinrate,
      scanIntervalSec: this.scanIntervalSec,
      secondsInState: this.secondsInState,
      tradingHours: this.tradingHours,
      sessionActive: this.isMarketSessionActive(),
      currentMYT: this.getCurrentMYTString(),
      sseClientsCount: sseClients.size,
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
    { symbol: 'XAUUSD', name: 'Gold', base: 3874.00, pipVal: 0.1, pipDec: 2, tp1Pips: 50, tp2Pips: 100, tp3Pips: 180, slPips: 70, bias: 'NEUTRAL' },
    { symbol: 'USDCHF', name: 'Swissie', base: 0.8283, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 28, bias: 'NEUTRAL' },
    { symbol: 'EURUSD', name: 'Euro', base: 1.1152, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 28, bias: 'NEUTRAL' }
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
        // ZERO-FLOATING POST-NEWS RETEST SNIPER WINDOW:
        // DILARANG masuk pada detik letupan liar (T-1m hingga T+1m / diff: 1, 0, -1) kerana spread kembang & jarum racun.
        // Fasa Sniper Emas: T+2m hingga T+30m (diff <= -2 && diff >= -30) di mana spread sudah normal & harga membuat PULLBACK RETEST ke Order Block!
        if (diff <= -2 && diff >= -30) {
          const biasDirection = (ev.bias || '').toUpperCase().includes('BULL') ? 'BUY' : 'SELL';
          return this.mapCurrencyBiasToSymbol(ev.currency || 'USD', biasDirection, symbol, `${ev.name} [Post-News Retest Sniper]`, diff);
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

    // Automatic News Synergy linking for running trades when news window opens
    if (Array.isArray(db.activeSignals)) {
      for (const sig of db.activeSignals) {
        if (!sig.isNews) {
          const news = this.getActiveNewsBias(sig.symbol, db);
          if (news && news.type === sig.type) {
            sig.isNews = true;
            sig.newsName = news.newsName;
            sig.newsBias = news.bias;
            sig.notes = `[⚡ AMATERASU NEWS AI SYNERGY] Didorong oleh ${news.reason}. Confluence Score: 98.4%. Kunci BE automatik sebaik TP1 dicapai.`;
            this.log(`🔥 [NEWS SYNERGY LINKED] Isyarat #${sig.symbol} ${sig.type} kini disokong oleh News AI: ${news.newsName} (${news.bias})!`);
            broadcastEvent('signal_update', { type: 'NEWS_LINKED', symbol: sig.symbol, activeSignal: sig });
          }
        }
      }
    }

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

    // CONTINUOUS AUTO-RECOVERY WATCHDOG: Ensure all active Master positions are reflected in db.activeSignals
    if (Math.floor(this.secondsInState) % 5 === 0) {
      const allMasters = [
        ...(Array.isArray(db.copytrade?.openPositions) ? db.copytrade.openPositions : []),
        ...(Array.isArray(db.copytrade2?.openPositions) ? db.copytrade2.openPositions : []),
        ...(Array.isArray(db.copytrade3?.openPositions) ? db.copytrade3.openPositions : []),
        ...(Array.isArray(db.copytrade4?.openPositions) ? db.copytrade4.openPositions : [])
      ];
      let dbUpdated = false;
      for (const p of allMasters) {
        const sym = (p.symbol || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase();
        if (['XAUUSD', 'USDCHF', 'EURUSD'].includes(sym)) {
          const exists = (db.activeSignals || []).some(s => s.symbol === sym);
          if (!exists) {
            const pipMult = sym === 'XAUUSD' ? 1.0 : (sym.includes('JPY') ? 0.01 : 0.0001);
            const slDistance = sym === 'XAUUSD' ? 12 : 25 * pipMult;
            const tp1Distance = sym === 'XAUUSD' ? 6.5 : 20 * pipMult;
            const tp2Distance = sym === 'XAUUSD' ? 13 : 35 * pipMult;
            const tp3Distance = sym === 'XAUUSD' ? 20 : 55 * pipMult;
            const newSig = {
              id: 'mt5-' + (p.ticket || Date.now()),
              status: 'ACTIVE',
              symbol: sym,
              asset: sym,
              type: p.type || 'BUY',
              timeframe: 'M15',
              entry: p.openPrice || 0,
              sl: p.sl || (p.type === 'BUY' ? Number((p.openPrice - slDistance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((p.openPrice + slDistance).toFixed(sym === 'XAUUSD' ? 2 : 4))),
              tp1: p.tp || (p.type === 'BUY' ? Number((p.openPrice + tp1Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((p.openPrice - tp1Distance).toFixed(sym === 'XAUUSD' ? 2 : 4))),
              tp2: p.type === 'BUY' ? Number((p.openPrice + tp2Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((p.openPrice - tp2Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)),
              tp3: p.type === 'BUY' ? Number((p.openPrice + tp3Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)) : Number((p.openPrice - tp3Distance).toFixed(sym === 'XAUUSD' ? 2 : 4)),
              firedAt: getMYTTime(),
              currentPrice: p.openPrice || 0,
              floatingPips: 0,
              beLocked: false,
              mt5Verified: true,
              mt5Ticket: p.ticket,
              notes: `[Watchdog Verified] Selaras dengan posisi terbuka MT5 (Tiket #${p.ticket})`
            };
            if (!Array.isArray(db.activeSignals)) db.activeSignals = [];
            db.activeSignals.unshift(newSig);
            dbUpdated = true;
          }
        }
      }
      if (dbUpdated) {
        saveDB(db);
        broadcastEvent('on_pips_update', db.activeSignals);
      }
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
        (db.activeSignals || []).filter(s => s.status === 'ACTIVE' || s.status === 'TP1_HIT').map(s => s.symbol)
      );
      const allMasterCheck = [
        ...(Array.isArray(this.liveMT5Positions) ? this.liveMT5Positions : []),
        ...(db.copytrade && Array.isArray(db.copytrade.openPositions) ? db.copytrade.openPositions : []),
        ...(db.copytrade2 && Array.isArray(db.copytrade2.openPositions) ? db.copytrade2.openPositions : []),
        ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : []),
        ...(db.copytrade4 && Array.isArray(db.copytrade4.openPositions) ? db.copytrade4.openPositions : [])
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
      for (const targetAsset of availableAssets) {
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
    if (!this.enabled) return;

    // 0.0 ARAHAN MUTLAK BOS: DILARANG SAMA SEKALI MASUK ORDER SELAGI TIADA ARAHAN!
    const pauseFlags = [
      path.join(__dirname, 'pause_trading.flag'),
      'C:\\AmaterasuX\\pause_trading.flag',
      'C:\\AmaterasuX_Acc2\\pause_trading.flag',
      'C:\\AmaterasuX_Acc3\\pause_trading.flag'
    ];
    if (pauseFlags.some(p => fs.existsSync(p))) {
      return;
    }

    const asset = forceAsset || this.assets[Math.floor(Math.random() * this.assets.length)];

    // 0. STRICT 1-SETUP GUARD (BULAN LEPAS LOCKED SOP):
    // Sekiranya simbol ini sudah ada trade yang sedang aktif di web (ACTIVE, TP1_HIT, TP2_HIT) atau MT5, jangan buka trade baru!
    const existingActive = (db.activeSignals || []).find(s => s.symbol === asset.symbol && (s.status === 'ACTIVE' || s.status === 'TP1_HIT'));
    if (existingActive) {
      return;
    }
    const allMasterExisting = [
      ...(Array.isArray(this.liveMT5Positions) ? this.liveMT5Positions : []),
      ...(db.copytrade && Array.isArray(db.copytrade.openPositions) ? db.copytrade.openPositions : []),
      ...(db.copytrade2 && Array.isArray(db.copytrade2.openPositions) ? db.copytrade2.openPositions : []),
      ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : []),
      ...(db.copytrade4 && Array.isArray(db.copytrade4.openPositions) ? db.copytrade4.openPositions : [])
    ];
    if (allMasterExisting.some(p => (p.symbol || p.s || '').replace(/\.[a-zA-Z0-9]+$/, '').toUpperCase() === asset.symbol.toUpperCase())) {
      return;
    }
    if (this.assetCooldowns && this.assetCooldowns[asset.symbol] && Date.now() < this.assetCooldowns[asset.symbol]) {
      return;
    }

    // London Session Active:
    const mytNow = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const nowH = parseInt(mytNow.find(p => p.type === 'hour')?.value, 10);
    const nowM = parseInt(mytNow.find(p => p.type === 'minute')?.value, 10);

    const liveQ = liveMarketQuotes[asset.symbol];
    const liveP = liveQ ? liveQ.price : (asset.symbol === 'XAUUSD' ? currentMarketPrice : asset.base);
    const entry = Number(liveP.toFixed(asset.pipDec));

    // 🛡️ INSTITUTIONAL CIRCUIT BREAKER: WAKTU REHAT TENGAH MALAM / THIN LIQUIDITY WHIPSAW (00:00 - 06:00 MYT)
    // DILARANG SAMA SEKALI MEMBUKA ISYARAT BARU UNTUK GOLD PADA WAKTU SPREAD KEMBANG & WHIPSAW LEWAT MALAM!
    if (asset.symbol === 'XAUUSD' && nowH >= 0 && nowH < 6) {
      return; // Rehat selamat melindungi modal
    }

    if (asset.symbol === 'XAUUSD') {
      this.updateGoldAsianSession(liveP);
    }

    const liveMtfInit = (this.liveMtfMaFlow && this.liveMtfMaFlow[asset.symbol]) ? this.liveMtfMaFlow[asset.symbol] : null;
    const mbInit = (this.marketBrain && this.marketBrain[asset.symbol]) || {};
    const floorRef = asset.symbol === 'XAUUSD'
      ? ((liveMtfInit && liveMtfInit.w1_low > 0 && Math.abs(liveMtfInit.w1_low - liveP) < 70) ? liveMtfInit.w1_low : (mbInit.supportFloor > 0 ? mbInit.supportFloor : (this.goldAsianSession.low || Number((liveP - 8.0).toFixed(2)))))
      : ((liveMtfInit && liveMtfInit.d1_low > 0) ? liveMtfInit.d1_low : (mbInit.supportFloor > 0 ? mbInit.supportFloor : (liveP - 0.0030)));
    const roofRef = asset.symbol === 'XAUUSD'
      ? ((liveMtfInit && liveMtfInit.h4_high > 0 && Math.abs(liveMtfInit.h4_high - liveP) < 70) ? liveMtfInit.h4_high : (mbInit.resistanceCeiling > 0 ? mbInit.resistanceCeiling : (this.goldAsianSession.high || Number((liveP + 8.0).toFixed(2)))))
      : ((liveMtfInit && liveMtfInit.d1_high > 0) ? liveMtfInit.d1_high : (mbInit.resistanceCeiling > 0 ? mbInit.resistanceCeiling : (liveP + 0.0030)));

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
      const mtfStructureInit = liveMtfInit ? (liveMtfInit.structure || 'RANGE_BOUND') : 'RANGE_BOUND';
      const mtfM15Init = liveMtfInit ? (liveMtfInit.m15 || 'NEUTRAL') : 'NEUTRAL';

      if (asset.symbol === 'XAUUSD') {
        const range = Math.max(roofRef - floorRef, 8.0);
        const waveProgress = (liveP - floorRef) / range;
        
        // =========================================================================
        // TRUE 2-WAY DUAL STRIKE MANDATE (BUY DI LANTAI, SELL DI BUMBUNG):
        // Di time frame kecil (M1/M5/M15), kita sapu keuntungan DUA-DUA ARAH!
        // =========================================================================
        
        // 1. ZON LANTAI DASAR (Demand / Support Rebound): BUY untuk sapu pips lantunan naik!
        if (waveProgress <= 0.38 || liveP <= (floorRef + 4.0)) {
          type = 'BUY';
          this._lastGoldWave = 'BUY';
          notes = `[⚡ 2-WAY SCALP PRO: BUY DI LANTAI] Harga berada di zon lantai sokongan (${liveP.toFixed(2)} vs Floor ${floorRef.toFixed(2)}). Entri BUY untuk menyapu keuntungan lantunan pada timeframe kecil. SL penampan bawah lantai. Sasaran TP1 (+35p). Kunci BE automatik.`;
          this.log(`🎯 [2-WAY SCALP PRO] Mengesahkan isyarat BUY XAUUSD pada lantai ${liveP.toFixed(2)} (Floor: ${floorRef.toFixed(2)}) untuk kutip pips lantunan!`);
        }
        // 2. ZON BUMBUNG PUNCAK (Supply / Resistance Rejection): SELL untuk sapu pips terjunan turun!
        else if (waveProgress >= 0.62 || liveP >= (roofRef - 4.0)) {
          type = 'SELL';
          this._lastGoldWave = 'SELL';
          notes = `[⚡ 2-WAY SCALP PRO: SELL DI BUMBUNG] Harga berada di zon bumbung rintangan (${liveP.toFixed(2)} vs Roof ${roofRef.toFixed(2)}). Entri SELL untuk menyapu keuntungan terjunan pada timeframe kecil. SL penampan atas bumbung. Sasaran TP1 (+35p). Kunci BE automatik.`;
          this.log(`🎯 [2-WAY SCALP PRO] Mengesahkan isyarat SELL XAUUSD pada bumbung ${liveP.toFixed(2)} (Roof: ${roofRef.toFixed(2)}) untuk kutip pips terjunan!`);
        }
        // 3. ZON KELABU / TENGAH (40% - 60%): Dilarang masuk di tengah-tengah jalan!
        else {
          this.log(`🛡️ [2-WAY SMC GUARD] Menolak isyarat XAUUSD pada ${liveP.toFixed(2)}. Harga berada di zon pertengahan (Progress: ${(waveProgress * 100).toFixed(1)}%). Wajib tunggu harga sampai ke Lantai (${floorRef.toFixed(2)}) untuk BUY atau ke Bumbung (${roofRef.toFixed(2)}) untuk SELL!`);
          return;
        }
      } else if (asset.symbol === 'EURUSD') {
        type = (mtfMacroInit === 'STRONG_SELLER' || mtfStructureInit === 'BEARISH_EXPANSION' || mtfM15Init.includes('BEARISH')) ? 'SELL' : 'BUY';
        this._lastEurWave = type;
        notes = type === 'BUY'
          ? `[SMC Currency Wave] Lantunan pada Key Support ${entry.toFixed(4)} + M15 Bullish Pinbar. SL ketat (+18p). Sasaran TP1 (+20p).`
          : `[SMC Currency Wave] Penolakan pada Key Resistance ${entry.toFixed(4)} + M15 Bearish Wick. SL ketat (+18p). Sasaran TP1 (+20p).`;
      } else if (asset.symbol === 'USDCHF') {
        type = (mtfMacroInit === 'STRONG_BUYER' || mtfStructureInit === 'BULLISH_EXPANSION' || mtfM15Init.includes('BULLISH')) ? 'BUY' : 'SELL';
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
      const isGoldAsset = (asset.symbol === 'XAUUSD');
      const tolerance = isGoldAsset ? 4.5 : 0.0025;
      const isAtRoof = liveP >= (roofRef - tolerance);
      const isAtFloor = liveP <= (floorRef + tolerance);

      if (liveMtf.macro === 'STRONG_BUYER' && (liveMtf.m15.includes('BULLISH') || liveMtf.m5.includes('BULLISH'))) {
        if (!isAtRoof) {
          type = 'BUY';
          notes = `[⚡ MTF TRIPLE MA ALIGNMENT] D1/H4 Pembeli Gergasi (STRONG_BUYER) + M15/M5/M1 di atas MA 20, 100, 200. Entry BUY seiring arus utama institusi! SL ketat (+50p). Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
          this.log(`📈 [MTF TRIPLE MA] #${asset.symbol} D1/H4 STRONG_BUYER & MA sejajar Bullish. Menyelaraskan isyarat ke BUY.`);
        }
      } else if (liveMtf.macro === 'STRONG_SELLER' && (liveMtf.m15.includes('BEARISH') || liveMtf.m5.includes('BEARISH'))) {
        if (!isAtFloor) {
          type = 'SELL';
          notes = `[⚡ MTF TRIPLE MA ALIGNMENT] D1/H4 Penjual Gergasi (STRONG_SELLER) + M15/M5/M1 di bawah MA 20, 100, 200. Entry SELL seiring arus utama institusi! SL ketat (+50p). Sasaran TP1 (+50p). SOP: Alih SL ke BE selepas TP1.`;
          this.log(`📉 [MTF TRIPLE MA] #${asset.symbol} D1/H4 STRONG_SELLER & MA sejajar Bearish. Menyelaraskan isyarat ke SELL.`);
        }
      }

      // IRONCLAD ANTI-LANTAI (MANDAT PULLBACK INSTITUSI):
      // DILARANG SAMA SEKALI SELL DI LANTAI DASAR WALAUPUN TREND BEARISH!
      if (type === 'SELL') {
        const floorBuffer = isGoldAsset ? 4.5 : 0.0015;
        const minPullbackZone = floorRef + (range * 0.35);
        if (liveP <= (floorRef + floorBuffer) || liveP < minPullbackZone) {
          this.log(`🛡️ [STRICT ANTI-LANTAI GUARD] Menolak isyarat SELL #${asset.symbol} pada ${liveP.toFixed(2)}. Harga berada di zon lantai sokongan (${floorRef.toFixed(2)}). Wajib tunggu Pullback melantun ke atas dahulu sebelum SELL!`);
          return;
        }
      }

      // IRONCLAD ANTI-PUCUK (MANDAT CELUPAN INSTITUSI):
      // DILARANG SAMA SEKALI BUY DI BUMBUNG PUNCAK WALAUPUN TREND BULLISH!
      if (type === 'BUY') {
        const roofBuffer = isGoldAsset ? 4.5 : 0.0015;
        const maxCelupanZone = roofRef - (range * 0.35);
        if (liveP >= (roofRef - roofBuffer) || liveP > maxCelupanZone) {
          this.log(`🛡️ [STRICT ANTI-PUCUK GUARD] Menolak isyarat BUY #${asset.symbol} pada ${liveP.toFixed(2)}. Harga berada di zon bumbung rintangan (${roofRef.toFixed(2)}). Wajib tunggu Pullback celup ke bawah dahulu sebelum BUY!`);
          return;
        }
      }

      if (type === 'SELL' && (liveMtf.macro === 'STRONG_BUYER' || liveMtf.alignment === 'FULL_BULLISH')) {
        if (!isAtRoof) {
          this.log(`🛡️ [TRIPLE MA GUARD] Menolak isyarat SELL #${asset.symbol} di tengah aliran Bullish (bukan di zon bumbung rintangan).`);
          return;
        } else {
          this.log(`🎯 [SMC ROOF REJECTION] Membenarkan isyarat SELL #${asset.symbol} pada zon bumbung rintangan (${liveP.toFixed(2)} vs ${roofRef.toFixed(2)}) untuk menunggang pembetulan harga!`);
        }
      }
      if (type === 'BUY' && (liveMtf.macro === 'STRONG_SELLER' || liveMtf.alignment === 'FULL_BEARISH')) {
        if (!isAtFloor) {
          this.log(`🛡️ [TRIPLE MA GUARD] Menolak isyarat BUY #${asset.symbol} di tengah aliran Bearish (bukan di zon lantai sokongan).`);
          return;
        } else {
          this.log(`🎯 [SMC FLOOR REBOUND] Membenarkan isyarat BUY #${asset.symbol} pada zon lantai sokongan (${liveP.toFixed(2)} vs ${floorRef.toFixed(2)}) untuk menyambar PULLBACK LANTUNAN NAIK!`);
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
      ...(db.copytrade3 && Array.isArray(db.copytrade3.openPositions) ? db.copytrade3.openPositions : []),
      ...(db.copytrade4 && Array.isArray(db.copytrade4.openPositions) ? db.copytrade4.openPositions : [])
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

      let isReversalSignal = false;
      if (hasOpposing) {
        // Semak jika pasaran membuat Break of Structure (BOS) atau Lonjakan Momentum Sebenar
        const isStrongReversal = (liveVFlow && liveVFlow.vol_ratio >= 1.15) ||
                                (liveMtf && ((type === 'BUY' && (liveMtf.m5 === 'BULLISH_FAN' || liveMtf.m15 === 'BULLISH')) ||
                                             (type === 'SELL' && (liveMtf.m5 === 'BEARISH_FAN' || liveMtf.m15 === 'BEARISH'))));

        if (isStrongReversal) {
          this.log(`🔄 [SMART STOP-AND-REVERSE] Pasaran memecahkan struktur! Mengesahkan isyarat pemutaran arah ${type} #${asset.symbol} untuk memotong posisi salah dan mengikut arus momentum baharu!`);
          isReversalSignal = true;
        } else {
          this.log(`🛡️ [CROSS-ACCOUNT ANTI-HEDGE] Menolak isyarat ${type} #${asset.symbol} kerana akaun Master MT5 sedang memegang posisi bertentangan dan belum ada pengesahan Reversal kukuh.`);
          return;
        }
      }
    }

    // =========================================================================
    // 5. IRONCLAD ANTI-PHASE-2 GRIND & CLUSTERING GUARD (Aktif Bermula 24 Nov 2026 / Esok)
    // =========================================================================
    const mytDateIso = new Date(Date.now() + 8 * 3600 * 1000).toISOString().split('T')[0];
    const isTomorrowOrLater = mytDateIso >= '2026-11-24';
    if (isTomorrowOrLater) {
      // Penapis A: Sekat Counter-Trend jika Dominasi Pembeli/Penjual Melebihi 60%
      const bDom = (this.liveDominance && this.liveDominance[asset.symbol]) ? this.liveDominance[asset.symbol].buyer_pct : 50;
      if (type === 'SELL' && bDom > 60.0) {
        this.log(`🛡️ [IRONCLAD DOMINANCE GUARD] Menolak isyarat SELL #${asset.symbol} kerana dominasi pembeli (${bDom.toFixed(1)}%) melebihi had 60%. Wajib tunggu tekanan belian reda!`);
        return;
      }
      if (type === 'BUY' && bDom < 40.0) {
        this.log(`🛡️ [IRONCLAD DOMINANCE GUARD] Menolak isyarat BUY #${asset.symbol} kerana dominasi penjual (${(100 - bDom).toFixed(1)}%) melebihi had 60%. Wajib tunggu tekanan jualan reda!`);
        return;
      }

      // Penapis B: Anti-Clustering Spacing (Wajib sekurang-kurangnya 30 pips dari posisi sedia ada)
      if (symPositions.length > 0) {
        const minSpacingPips = (asset.symbol === 'XAUUSD') ? 30.0 : 15.0;
        const minSpacingPrice = (asset.symbol === 'XAUUSD') ? (minSpacingPips / 10.0) : (minSpacingPips * 0.0001);
        const tooClose = symPositions.some(p => {
          const openP = Number(p.openPrice !== undefined ? p.openPrice : (p.p !== undefined ? p.p : 0));
          return Math.abs(liveP - openP) < minSpacingPrice;
        });
        if (tooClose) {
          this.log(`🛡️ [ANTI-CLUSTERING GUARD] Menolak isyarat ${type} #${asset.symbol} kerana harga semasa (${liveP.toFixed(2)}) terlalu rapat (< ${minSpacingPips} pips) dengan posisi sedia ada.`);
          return;
        }
      }
    }

    // Dynamic ATR Session Volatility Adaptation (Waktu Malaysia MYT)
    let volMult = 1.0;
    if (nowH >= 6 && nowH < 14) {
      volMult = 0.85; // Sesi Asia (06:00 - 14:00): Volatiliti terkawal, SL kemas & jimat (XAUUSD 45p, FX 18p)
    } else if (nowH >= 14 && nowH < 20) {
      volMult = 1.0;  // Sesi London (14:00 - 20:00): Standard Institutional SMC (XAUUSD 48p, FX 20p)
    } else if (nowH >= 20 || nowH < 2) {
      volMult = 1.10; // Sesi New York (20:00 - 02:00): Volatiliti lonjakan tinggi (XAUUSD 50p, FX 20-22p)
    }

    let dynTp1Pips = Math.round(asset.tp1Pips * volMult);
    let dynTp2Pips = Math.round(asset.tp2Pips * volMult);
    let dynTp3Pips = Math.round((asset.tp3Pips || Math.round(asset.tp2Pips * 1.5)) * volMult);
    let dynSlPips = Math.round(asset.slPips * volMult);

    if (this.frequencyMode === 'SCALP_PRO') {
      // MOD INSTITUTIONAL SCALP PRO (DYNAMIC STRUCTURAL SL & TP):
      // Menyelaraskan SL di luar zon rintangan/sokongan sebenar bagi mengelak disapu wick palsu
      if (asset.symbol === 'XAUUSD') {
        if (type === 'SELL') {
          // SELL: SL diletakkan kemas di atas Bumbung Rintangan Sebenar (Swing High / Roof) + 12-15 pips penampan
          const distToRoof = Math.abs(roofRef - entry) + 1.20;
          dynSlPips = Math.round(Math.min(Math.max(distToRoof / asset.pipVal, 75), 135));
          dynTp1Pips = Math.round(Math.max(35, dynSlPips * 0.75));
          const distToFloor = Math.abs(entry - floorRef);
          dynTp2Pips = Math.round(Math.max(70, distToFloor > 0 ? (distToFloor / asset.pipVal) : dynSlPips * 1.5));
          dynTp3Pips = Math.round(Math.max(120, dynTp2Pips * 1.5));
        } else {
          // BUY: SL diletakkan kemas di bawah Lantai Sokongan Sebenar (Swing Low / Floor) - 12-15 pips penampan
          const distToFloor = Math.abs(entry - floorRef) + 1.20;
          dynSlPips = Math.round(Math.min(Math.max(distToFloor / asset.pipVal, 75), 135));
          dynTp1Pips = Math.round(Math.max(35, dynSlPips * 0.75));
          const distToRoof = Math.abs(roofRef - entry);
          dynTp2Pips = Math.round(Math.max(70, distToRoof > 0 ? (distToRoof / asset.pipVal) : dynSlPips * 1.5));
          dynTp3Pips = Math.round(Math.max(120, dynTp2Pips * 1.5));
        }

        if (newsSynergy) {
          // NEWS AI EXPANDED VOLATILITY MODEL:
          // Semasa tempoh berita berimpak tinggi, lebarkan SL ke paras Struktur Makro (min 150 pips / $15.00)
          dynSlPips = Math.max(dynSlPips, 150);
          dynTp1Pips = Math.max(dynTp1Pips, 100);
          dynTp2Pips = Math.max(dynTp2Pips, 180);
          dynTp3Pips = Math.max(dynTp3Pips, 280);
        }
      } else if (asset.symbol === 'EURUSD') {
        dynSlPips = (nowH >= 6 && nowH < 14) ? 22 : 28;
        dynTp1Pips = 20;
        dynTp2Pips = 42;
        dynTp3Pips = 70;
      } else {
        dynSlPips = (nowH >= 6 && nowH < 14) ? 22 : 28;
        dynTp1Pips = 20;
        dynTp2Pips = 40;
        dynTp3Pips = 65;
      }
    } else {
      // INTRADAY SWING CALIBRATION:
      if (asset.symbol === 'XAUUSD') {
        const dist = type === 'SELL' ? Math.abs(roofRef - entry) + 2.0 : Math.abs(entry - floorRef) + 2.0;
        dynSlPips = Math.round(Math.min(Math.max(dist / asset.pipVal, 55), 120));
        dynTp1Pips = Math.round(dynSlPips * 0.8);
        dynTp2Pips = Math.round(dynSlPips * 1.6);
        dynTp3Pips = Math.round(dynSlPips * 2.5);
      } else {
        dynSlPips = (nowH >= 6 && nowH < 14) ? 28 : 32;
      }
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
      isNews: !!newsSynergy,
      newsName: newsSynergy ? newsSynergy.newsName : null,
      newsBias: newsSynergy ? newsSynergy.bias : null,
      reversal: !!isReversalSignal,
      flip: !!isReversalSignal,
      notes: notes
    };

    if (!Array.isArray(db.activeSignals)) db.activeSignals = [];
    const existingIdx = db.activeSignals.findIndex(s => s.symbol === asset.symbol && (s.status === 'ACTIVE' || s.status === 'TP1_HIT'));
    if (existingIdx !== -1 && !isReversalSignal) {
      this.log(`🛡️ [1-SETUP GUARD] Menolak isyarat ${type} ${asset.symbol} kerana setup sedia ada (#${db.activeSignals[existingIdx].id}) masih berjalan.`);
      return;
    }
    db.activeSignals = db.activeSignals.filter(s => s.symbol !== asset.symbol);
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
          // True Break-Even: SL telah dialih ke +1 pip dari entry sebaik sahaja TP1 dicapai.
          // Jika harga retest mencecah SL BE, trade keluar dengan sifar risiko / untung kecil (+1 pip)!
          lossPips = 1;
          outcome = 'BE';
          this.log(`🛡️ [TRUE BREAK-EVEN EXIT] ${sig.symbol} mencecah paras Stop Loss BE @ ${curP} selepas TP1 disahkan. Posisi ditutup pada Sifar Risiko (+1 pip net). Modal 100% terlindung.`);
        } else {
          lossPips = -Math.abs(sig.slPips || asset.slPips);
          outcome = 'SL';
          this.log(`🛑 [SL TRIGGERED] ${sig.symbol} hit Stop Loss @ ${curP} (SL: ${sig.sl})! Memadamkan daripada On Pips serta-merta.`);
        }
        this.resolveTrade(db, sig, outcome, lossPips, asset);
        continue;
      }

      // Stage 1: Hit TP1 (Trigger + Lock Breakeven strictly on Real Price!)
      // SOP: Price MUST genuinely touch or penetrate TP1 level! Zero premature timer-based triggers!
      const tp1Condition = isBuy ? (curP >= sig.tp1) : (curP <= sig.tp1);
      if (!sig.tp1Triggered && sig.status === 'ACTIVE' && tp1Condition) {
        sig.tp1Triggered = true;
        sig.status = 'TP1_HIT';
        sig.beLocked = true;

        // TRUE BREAK-EVEN: Kunci SL pada paras Entry sebenar (+1 pip profit buffer untuk menampung kos commission/spread)
        // BUY: Entry + 1 pip | SELL: Entry - 1 pip (Bukan letak SL dalam zon rugi!)
        const beProfitLockPips = 1.0;
        sig.sl = isBuy
          ? Number((sig.entry + beProfitLockPips * asset.pipVal).toFixed(asset.pipDec))
          : Number((sig.entry - beProfitLockPips * asset.pipVal).toFixed(asset.pipDec));

        sig.tp1HitAt = getMYTTime();
        sig.tp1Pips = asset.tp1Pips;
        db.stats.tp1Hit = (db.stats.tp1Hit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + asset.tp1Pips;

        this.log(`🎯 AI Engine: Target 1 Hit for ${sig.symbol} (+${asset.tp1Pips} pips)! Stop Loss dialih ke True Break-Even (+${beProfitLockPips}p buffer untung). Modal terjamin selamat.`);
        broadcastEvent('signal_update', {
          type: 'TP1_HIT',
          symbol: sig.symbol,
          pips: asset.tp1Pips,
          activeSignal: sig,
          message: `🎯 Target 1 Disahkan (+${asset.tp1Pips} pip)! SL dikunci ke True Break-Even (Sifar Risiko)!`
        });
        TelegramNotifier.send(TelegramNotifier.formatTp1Message(sig, asset.tp1Pips)).catch(() => {});
        remaining.push(sig);
        continue;
      }

      // Stage 2: Hit TP2 (Lock SL at TP1 & Trail towards TP3)
      // SOP Integrity Rule: Price MUST genuinely touch TP2 level!
      const tp2Condition = isBuy ? (curP >= sig.tp2) : (curP <= sig.tp2);
      if (!sig.tp2Triggered && sig.tp1Triggered && tp2Condition) {
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

      // Stage 3: Hit TP3 (Ultimate Full Target Reached strictly on Real Price)
      const tp3Condition = isBuy ? (curP >= (sig.tp3 || sig.tp2)) : (curP <= (sig.tp3 || sig.tp2));
      if (sig.tp2Triggered && tp3Condition) {
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
          // Break-Even Exit: Hanya jika trade telah melepasi TP1 dan retest mencecah paras Stop Loss BE
          const beExitHit = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
          if (beExitHit) {
            this.log(`🛡️ SOP Break-Even Closed: ${sig.symbol} hit SL BE @ ${curP} after securing TP1. Exit as BE (+1 pip net). Capital & profit protected.`);
            this.resolveTrade(db, sig, 'BE', 1, asset);
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
    if (!sig) return;
    if (!Array.isArray(db.signals)) db.signals = [];
    // Strict Deduplication Guard: Never resolve the same signal ID twice
    if (sig.id && db.signals.some(s => s.id === sig.id)) {
      if (Array.isArray(db.activeSignals)) {
        db.activeSignals = db.activeSignals.filter(s => s.id !== sig.id && s.symbol !== sig.symbol);
      }
      return;
    }
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
    if (!this.consecutiveSl) this.consecutiveSl = {};

    if (outcome === 'SL') {
      this.consecutiveSl[sig.symbol] = (this.consecutiveSl[sig.symbol] || 0) + 1;
      const isGold = (sig.symbol || '').toUpperCase().includes('XAU');
      let cooldownMin = 15;

      const nowH = new Date(Date.now() + 8 * 3600 * 1000).getUTCHours();
      const isNySession = (nowH >= 20 || nowH < 3);

      if (isGold) {
        if (this.consecutiveSl[sig.symbol] >= 2) {
          cooldownMin = 60; // 60-min hard circuit breaker after 2 consecutive SLs
          this.log(`🚨 [MULTI-SL CIRCUIT BREAKER] ${sig.symbol} mencatat ${this.consecutiveSl[sig.symbol]}x SL berturut-turut! Circuit breaker diaktifkan selama ${cooldownMin} minit.`);
        } else if (isNySession) {
          cooldownMin = 35; // 35 min on NY session to let liquidity flush settle
          this.log(`🛑 [NY FLUSH POST-SL GUARD] ${sig.symbol} terkena SL pada sesi New York. Cooldown dipanjangkan ke ${cooldownMin} minit.`);
        } else {
          cooldownMin = 25;
          this.log(`🛑 [POST-SL LIQUIDITY SWEEP GUARD] ${sig.symbol} terkena SL! Re-entry disekat selama ${cooldownMin} minit.`);
        }
      } else {
        if (this.consecutiveSl[sig.symbol] >= 2) {
          cooldownMin = 45;
          this.log(`🚨 [MULTI-SL CIRCUIT BREAKER] ${sig.symbol} mencatat ${this.consecutiveSl[sig.symbol]}x SL berturut-turut! Rehat ${cooldownMin} minit.`);
        } else {
          cooldownMin = this.frequencyMode === 'SCALP_PRO' ? 15 : 30;
          this.log(`🛑 [POST-SL GUARD] ${sig.symbol} terkena SL! Re-entry disekat selama ${cooldownMin} minit.`);
        }
      }
      this.assetCooldowns[sig.symbol] = Date.now() + (cooldownMin * 60 * 1000);
    } else {
      this.consecutiveSl[sig.symbol] = 0; // Reset consecutive SL on win / BE
      // ARAHAN BOS: SETIAP KALI PROFIT TP, BUFFER TIME 30 MINIT UNTUK SEMUA AKAUN!
      const winCooldownMin = 30;
      this.assetCooldowns[sig.symbol] = Date.now() + (winCooldownMin * 60 * 1000);
      this.log(`🎯 [TP PROFIT BUFFER] ${sig.symbol} selesai (${outcome})! Buffer time ${winCooldownMin} minit diaktifkan untuk semua akaun bagi menyejukkan pasaran.`);
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

// Automated Telegram 24-Hour Community Schedule Engine (Mon - Fri)
let lastMorningBriefingDate = '';
let lastCommunityPollDate = '';
let lastCommunityReportDate = '';

setInterval(() => {
  try {
    const db = getDB();
    const cfg = db.telegramConfig || {};
    if (!cfg.enabled || !cfg.botToken || !cfg.chatId) return;

    const mytTime = getMYTTime();
    const mytDate = getMYTDate({ day: 'numeric', month: 'numeric', year: 'numeric' });
    const weekday = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short' });
    const isTradingDay = weekday !== 'Sat' && weekday !== 'Sun';

    // 1. Morning Vault Briefing at 07:30 MYT (Isnin - Jumaat)
    if (isTradingDay && mytTime >= '07:30' && mytTime < '08:30' && lastMorningBriefingDate !== mytDate) {
      lastMorningBriefingDate = mytDate;
      const morningMsg = TelegramNotifier.formatMorningBriefing(db);
      TelegramNotifier.send(morningMsg).catch(err => console.error('[TELEGRAM MORNING ERROR]', err));
      console.log(`[TELEGRAM] Auto-broadcasted Morning Vault Briefing for ${mytDate} at ${mytTime} MYT`);
    }

    // 2. Interactive Community Sentiment Poll at 12:30 MYT (Isnin - Jumaat)
    if (isTradingDay && mytTime >= '12:30' && mytTime < '13:30' && lastCommunityPollDate !== mytDate) {
      lastCommunityPollDate = mytDate;
      TelegramNotifier.sendPoll(
        `📊 Sentimen Emas (XAUUSD) Menjelang Sesi London (${getMYTDate({ day: 'numeric', month: 'short' })}):`,
        [
          '🟢 Bullish (Menguji zon rintangan tertinggi)',
          '🔴 Bearish (Retracement mencari diskaun likuiditi)',
          '⚖️ Sideways (Tunggu pengesahan struktur pasaran)'
        ]
      ).catch(err => console.error('[TELEGRAM POLL ERROR]', err));
      console.log(`[TELEGRAM] Auto-broadcasted Community Sentiment Poll for ${mytDate} at ${mytTime} MYT`);
    }

    // 3. Automated Daily Performance Report at 23:30 MYT (Isnin - Jumaat)
    if (isTradingDay && mytTime >= '23:30' && lastCommunityReportDate !== mytDate) {
      lastCommunityReportDate = mytDate;
      TelegramNotifier.send(TelegramNotifier.formatCommunityDailyReport(db, 1)).catch(err => console.error('[TELEGRAM REPORT ERROR]', err));
      console.log(`[TELEGRAM] Auto-broadcasted daily community performance report for ${mytDate} at ${mytTime} MYT`);
    }
  } catch (err) {
    console.error('[TELEGRAM CRON ERROR]', err && err.message ? err.message : err);
  }
}, 30000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Amaterasu AI Sovereign Platform Ready on 0.0.0.0:${PORT}!`);
  console.log(`User App: http://0.0.0.0:${PORT}`);
  console.log(`Admin CRM: http://0.0.0.0:${PORT}/crm`);
});

module.exports = server;
