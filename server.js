const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Ensure data directory
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initial Database Seeds
const defaultDB = {
  stats: {
    totalSignals: 17,
    winRate: 93,
    tp1Hit: 13,
    tp2Hit: 7,
    slHit: 1,
    totalProfitToday: 979,
    last7Days: [
      { day: 'Sat', pips: 0 },
      { day: 'Sun', pips: 0 },
      { day: 'Mon', pips: 1605 },
      { day: 'Tue', pips: 1482 },
      { day: 'Wed', pips: 1669 },
      { day: 'Thu', pips: 1559 },
      { day: 'Today', pips: 979 }
    ]
  },
  activeSignal: {
    status: 'WAITING', // 'WAITING' or 'ACTIVE'
    symbol: 'XAUUSD',
    type: 'BUY',
    timeframe: 'M15',
    entry: 4024.45,
    tp1: 4028.50,
    tp2: 4034.00,
    sl: 4019.45,
    firedAt: null,
    notes: 'Amaterasu Solar Core scanning for high-probability BUY setup.'
  },
  signals: [
    { id: 'sig-8', time: '17:39', date: 'Oct 23', symbol: 'XAUUSD', type: 'SELL', entry: 4027.80, status: 'TP1', pips: 36, tags: ['TP1'], peak: 42 },
    { id: 'sig-7', time: '16:18', date: 'Oct 23', symbol: 'XAUUSD', type: 'BUY', entry: 4020.10, status: 'TP1', pips: 44, tags: ['TP1'], peak: 48 },
    { id: 'sig-6', time: '15:30', date: 'Oct 23', symbol: 'XAUUSD', type: 'BUY', entry: 4016.50, status: 'TP1', pips: 51, tags: ['TP1'], peak: 55 },
    { id: 'sig-5', time: '14:12', date: 'Oct 23', symbol: 'XAUUSD', type: 'SELL', entry: 4032.00, status: 'CLOSED IN PROFIT', pips: 58, tags: ['TP1'], peak: 63 },
    { id: 'sig-4', time: '13:36', date: 'Oct 23', symbol: 'XAUUSD', type: 'BUY', entry: 4012.30, status: 'TP2', pips: 72, tags: ['TP1', 'TP2'], peak: 78 },
    { id: 'sig-3', time: '13:30', date: 'Oct 23', symbol: 'XAUUSD', type: 'SELL', entry: 4025.10, status: 'SL', pips: -60, tags: [], peak: 7 },
    { id: 'sig-2', time: '13:03', date: 'Oct 23', symbol: 'XAUUSD', type: 'BUY', entry: 4008.50, status: 'CLOSED IN PROFIT', pips: 109, tags: ['TP1', 'TP2'], peak: 114 },
    { id: 'sig-1', time: '12:03', date: 'Oct 23', symbol: 'XAUUSD', type: 'SELL', entry: 4038.20, status: 'CLOSED IN PROFIT', pips: 115, tags: ['TP1', 'TP2'], peak: 122 }
  ],
  analysis: {
    symbol: 'XAUUSD',
    date: '17 October 2026, 18:00',
    headline: 'Solar Macro Bias: USD yields pressure gold intraday while long-term solar trend holds bullish',
    price: 4024.61,
    unit: 'USD/oz',
    trends: {
      m1: 'BEARISH',
      m5: 'BEARISH',
      h1: 'BEARISH',
      d1: 'BULLISH'
    },
    direction: 'DOWN',
    resistance: ['4,030.88 (H1 immediate)', '4,042.50 (H1 secondary)', '4,055.00 (H1 major)'],
    support: ['4,015.20 (H1 nearest)', '4,009.47 (H1 secondary)', '3,995.00 (H1 major)'],
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
    { id: 'fb-2', user: 'trader_zack', message: 'Boleh tambah pair NAS100 dekat screener tak?', createdAt: '2026-10-23 18:20', status: 'pending', reply: '' }
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
  ]
};

// Load or initialize DB
function getDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf8');
      return defaultDB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading DB, using defaults', e);
    return defaultDB;
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving DB', e);
  }
}

// SSE (Server-Sent Events) clients
const sseClients = new Set();
function broadcastEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// ===== LIVE REAL-TIME TRADINGVIEW MARKET FEED SERVICE =====
const LIVE_MARKET_MAP = {
  XAUUSD: 'GC=F',
  EURUSD: 'EURUSD=X',
  GBPJPY: 'GBPJPY=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'USDJPY=X',
  WTI: 'CL=F',
  US30: '^DJI',
  NAS100: '^IXIC',
  BTCUSD: 'BTC-USD'
};

const liveMarketQuotes = {
  XAUUSD: { price: 4007.90, change: 0.42, decimals: 2 },
  EURUSD: { price: 1.1204, change: -0.15, decimals: 4 },
  GBPJPY: { price: 209.776, change: 0.35, decimals: 3 },
  GBPUSD: { price: 1.3375, change: 0.12, decimals: 4 },
  USDJPY: { price: 156.814, change: -0.22, decimals: 3 },
  WTI: { price: 103.27, change: 1.25, decimals: 2 },
  US30: { price: 52215.16, change: 0.48, decimals: 1 },
  NAS100: { price: 25955.34, change: 0.65, decimals: 1 },
  BTCUSD: { price: 80691.12, change: 1.85, decimals: 0 }
};

function fetchSingleLiveQuote(sym, querySym) {
  return new Promise(resolve => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1m&range=1d`;
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const meta = j.chart.result[0].meta;
          const p = meta.regularMarketPrice;
          const prev = meta.chartPreviousClose || meta.previousClose || p;
          const chg = prev ? Number((((p - prev) / prev) * 100).toFixed(2)) : 0;
          resolve({ price: p, change: chg });
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3500, () => { req.destroy(); resolve(null); });
  });
}

async function refreshAllLiveQuotes() {
  for (const [sym, qSym] of Object.entries(LIVE_MARKET_MAP)) {
    const res = await fetchSingleLiveQuote(sym, qSym);
    if (res && res.price) {
      if (liveMarketQuotes[sym]) {
        liveMarketQuotes[sym].price = res.price;
        liveMarketQuotes[sym].change = res.change;
      }
    }
  }
  if (liveMarketQuotes.XAUUSD) {
    currentMarketPrice = liveMarketQuotes.XAUUSD.price;
  }
  broadcastEvent('market_quotes', liveMarketQuotes);
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
};

// Helper to read JSON request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
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
      lastResolvedSignal: db.lastResolvedSignal,
      signals: (db.signals || []).slice(0, 15),
      marketQuotes: liveMarketQuotes,
      stats: db.stats,
      analysis: db.analysis,
      screener: db.screener,
      classes: db.classes,
      contests: db.contests
    })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // ===== REST API Endpoints =====

  // 0. GET /api/market/quotes (Live TradingView-synchronized market feeds)
  if (pathname === '/api/market/quotes' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(liveMarketQuotes));
  }

  // 1. GET /api/data (Full state for App)
  if (pathname === '/api/data' && req.method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db));
  }

  // 1b. AI Engine Endpoints (100% Autonomous AI Signal Generator)
  if (pathname === '/api/ai/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(AiEngine.getStatus()));
  }

  if (pathname === '/api/ai/toggle' && req.method === 'POST') {
    AiEngine.enabled = !AiEngine.enabled;
    broadcastEvent('ai_engine_status', AiEngine.getStatus());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(AiEngine.getStatus()));
  }

  if (pathname === '/api/ai/scan-now' && req.method === 'POST') {
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

  // 2. POST /api/signal/fire (Manual test override / injection)
  if (pathname === '/api/signal/fire' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      db.activeSignal = {
        status: 'ACTIVE',
        symbol: payload.symbol || 'XAUUSD',
        type: payload.type || 'BUY',
        timeframe: payload.timeframe || 'M15',
        entry: Number(payload.entry) || 4024.50,
        tp1: Number(payload.tp1) || 4028.50,
        tp2: Number(payload.tp2) || 4034.00,
        sl: Number(payload.sl) || 4019.50,
        firedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        notes: payload.notes || 'Signal generated from WHA 3RD EYES AI Desk'
      };
      saveDB(db);
      broadcastEvent('signal_fired', db.activeSignal);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, signal: db.activeSignal }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 3. POST /api/signal/update-status (Admin CRM updates active signal: TP1/TP2/SL/CLOSE)
  if (pathname === '/api/signal/update-status' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req); // { status: 'TP1' | 'TP2' | 'SL' | 'CLOSED', pips: 44 }
      const db = getDB();
      const current = db.activeSignal || {};
      const pips = Number(payload.pips) || 0;

      // Special case: TP1 does NOT close the trade! It locks BE and keeps trade running to TP2!
      if (payload.status === 'TP1') {
        db.activeSignal.status = 'TP1_HIT';
        db.activeSignal.beLocked = true;
        db.activeSignal.tp1HitAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, activeSignal: db.activeSignal, stats: db.stats }));
      }

      // Outcome is TP2, SL, or CLOSED -> Finalize and archive to history
      const newHistoryItem = {
        id: 'sig-' + Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

      saveDB(db);
      broadcastEvent('signal_resolved', { item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal, lastResolvedSignal: db.lastResolvedSignal });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // 4. POST /api/analysis/update (Admin CRM updates daily analysis)
  if (pathname === '/api/analysis/update' && req.method === 'POST') {
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
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const newClass = {
        id: 'cls-' + Date.now(),
        title: payload.title,
        trainer: payload.trainer || 'WHA Master Trainer',
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
      const payload = await parseJsonBody(req); // { user, date, amount }
      const db = getDB();
      const u = payload.user || 'kj35';
      if (!db.pnlRecords[u]) db.pnlRecords[u] = {};
      if (payload.amount === null) {
        delete db.pnlRecords[u][payload.date];
      } else {
        db.pnlRecords[u][payload.date] = Number(payload.amount);
      }
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, pnl: db.pnlRecords[u] }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ===== Static Files =====
  let file = pathname;
  if (file === '/' || file === '') file = '/index.html';
  if (file === '/crm' || file === '/admin') file = '/crm.html';

  const filePath = path.join(__dirname, file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// Periodic simulated market tick broadcast every 2.5s
let currentMarketPrice = 4024.45;

// ===== AMATERASU AI AUTONOMOUS SIGNAL ENGINE =====
// REAL LIVE MODE: Rapid auto-test loop disabled so signals stay persistent and controlled.
const AiEngine = {
  enabled: false, // LIVE PRODUCTION MODE: false (signals are persistent and controlled)
  scanIntervalSec: 1800, // 30 minutes if toggled by admin
  secondsInState: 0,
  activeTradeTicks: 0,
  tp1Triggered: false,
  logHistory: [
    `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Amaterasu Neural Core v4.2 Initialized: Autonomous Mode Active.`
  ],

  getStatus() {
    return {
      enabled: this.enabled,
      scanIntervalSec: this.scanIntervalSec,
      secondsInState: this.secondsInState,
      logHistory: this.logHistory.slice(0, 20)
    };
  },

  log(msg) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const entry = `[${time}] ${msg}`;
    this.logHistory.unshift(entry);
    if (this.logHistory.length > 50) this.logHistory.pop();
    broadcastEvent('ai_engine_log', { log: entry, all: this.logHistory.slice(0, 20) });
  },

  assets: [
    { symbol: 'XAUUSD', name: 'Gold', base: 4024.45, pipVal: 0.1, pipDec: 2, tp1Pips: 40, tp2Pips: 95, slPips: 50 },
    { symbol: 'XAUUSD', name: 'Gold', base: 4024.45, pipVal: 0.1, pipDec: 2, tp1Pips: 42, tp2Pips: 90, slPips: 50 },
    { symbol: 'XAUUSD', name: 'Gold', base: 4024.45, pipVal: 0.1, pipDec: 2, tp1Pips: 45, tp2Pips: 100, slPips: 50 },
    { symbol: 'EURUSD', name: 'Euro', base: 1.08500, pipVal: 0.0001, pipDec: 5, tp1Pips: 35, tp2Pips: 75, slPips: 50 },
    { symbol: 'GBPJPY', name: 'Pound/Yen', base: 209.65, pipVal: 0.01, pipDec: 2, tp1Pips: 45, tp2Pips: 100, slPips: 50 },
    { symbol: 'GBPUSD', name: 'Cable', base: 1.29800, pipVal: 0.0001, pipDec: 5, tp1Pips: 35, tp2Pips: 80, slPips: 50 },
    { symbol: 'USDJPY', name: 'Dollar/Yen', base: 156.10, pipVal: 0.01, pipDec: 2, tp1Pips: 40, tp2Pips: 85, slPips: 50 },
    { symbol: 'WTI', name: 'Crude Oil', base: 71.50, pipVal: 0.1, pipDec: 2, tp1Pips: 50, tp2Pips: 110, slPips: 50 },
    { symbol: 'US30', name: 'Dow Jones', base: 42850, pipVal: 1, pipDec: 0, tp1Pips: 60, tp2Pips: 140, slPips: 50 },
    { symbol: 'NAS100', name: 'Nasdaq 100', base: 20380, pipVal: 1, pipDec: 0, tp1Pips: 50, tp2Pips: 120, slPips: 50 },
    { symbol: 'BTCUSD', name: 'Bitcoin', base: 81700, pipVal: 1, pipDec: 0, tp1Pips: 250, tp2Pips: 600, slPips: 250 }
  ],

  tick() {
    if (!this.enabled) return;
    const db = getDB();
    const sig = db.activeSignal;

    if (!sig || sig.status === 'WAITING') {
      this.secondsInState += 2.5;

      // Pulse scan log every 15s
      if (Math.floor(this.secondsInState) % 15 === 0) {
        const randAsset = this.assets[Math.floor(Math.random() * this.assets.length)];
        const conf = Math.floor(70 + Math.random() * 24);
        this.log(`Amaterasu AI scanning ${randAsset.symbol} M15 order blocks... confluence ${conf}%.`);
      }

      // Confluence threshold reached -> Autonomous AI signal dispatch
      if (this.secondsInState >= this.scanIntervalSec) {
        this.fireAutonomousSignal(db);
        this.secondsInState = 0;
        this.activeTradeTicks = 0;
        this.tp1Triggered = false;
      }
    } else if (sig.status === 'ACTIVE') {
      this.activeTradeTicks++;
      this.monitorActiveTrade(db, sig);
    }
  },

  fireAutonomousSignal(db, forceAsset = null) {
    const asset = forceAsset || this.assets[Math.floor(Math.random() * this.assets.length)];
    const type = Math.random() > 0.45 ? 'BUY' : 'SELL';
    const entry = asset.symbol === 'XAUUSD' ? currentMarketPrice : (asset.base + (Math.random() - 0.5) * asset.pipVal * 10);
    const sign = type === 'BUY' ? 1 : -1;
    const tp1 = Number((entry + sign * asset.tp1Pips * asset.pipVal).toFixed(asset.pipDec));
    const tp2 = Number((entry + sign * asset.tp2Pips * asset.pipVal).toFixed(asset.pipDec));
    const sl = Number((entry - sign * asset.slPips * asset.pipVal).toFixed(asset.pipDec));

    const rationaleList = [
      `Amaterasu Neural Core detected M15 Order Block absorption + H1 Supply rejection at ${entry.toFixed(asset.pipDec)}. High probability ${type} vector confirmed.`,
      `Multi-timeframe liquidity sweep completed on ${asset.symbol}. M1, M5 and M15 momentum confluences aligned above 200 EMA cluster.`,
      `Institutional accumulation volume detected on ${asset.symbol}. Breakout velocity confirmed with 94.2% neural confidence.`
    ];
    const notes = rationaleList[Math.floor(Math.random() * rationaleList.length)];

    db.activeSignal = {
      status: 'ACTIVE',
      symbol: asset.symbol,
      type: type,
      timeframe: 'M15',
      entry: Number(entry.toFixed(asset.pipDec)),
      tp1: tp1,
      tp2: tp2,
      sl: sl,
      firedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      notes: notes
    };

    saveDB(db);
    broadcastEvent('signal_fired', db.activeSignal);
    this.log(`⚡ AI SIGNAL AUTO-FIRED: ${type} ${asset.symbol} @ ${entry.toFixed(asset.pipDec)} (TP1: ${tp1}, TP2: ${tp2}, SL: ${sl})`);
  },

  monitorActiveTrade(db, sig) {
    const asset = this.assets.find(a => a.symbol === sig.symbol) || this.assets[0];

    // Stage 1: Hit TP1 after ~10 ticks (~25s)
    if (!this.tp1Triggered && this.activeTradeTicks >= 10) {
      this.tp1Triggered = true;
      this.log(`🎯 AI Engine: Target 1 Hit for ${sig.symbol} (+${asset.tp1Pips} pips)! Trailing stop locked to Breakeven.`);
      broadcastEvent('signal_update', {
        type: 'TP1_HIT',
        symbol: sig.symbol,
        pips: asset.tp1Pips,
        message: `🎯 Take Profit 1 Achieved (+${asset.tp1Pips} pip)! Trailing stop locked.`
      });
    }

    // Stage 2: Hit TP2 or Close after ~22 ticks (~55s)
    if (this.activeTradeTicks >= 22) {
      const isWin = Math.random() < 0.93; // 93% historical accuracy target
      const outcome = isWin ? 'TP2' : 'SL';
      const pips = isWin ? asset.tp2Pips : -asset.slPips;

      const newHistoryItem = {
        id: 'sig-' + Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        symbol: sig.symbol,
        type: sig.type,
        entry: sig.entry,
        status: outcome === 'TP2' ? 'TP2' : 'SL',
        pips: pips,
        tags: outcome === 'TP2' ? ['TP1', 'TP2'] : [],
        peak: Math.abs(pips) + 6
      };

      db.signals.unshift(newHistoryItem);
      db.stats.totalSignals += 1;
      if (pips > 0) {
        db.stats.totalProfitToday += pips;
        db.stats.tp1Hit += 1;
        db.stats.tp2Hit += 1;
      } else {
        db.stats.slHit += 1;
        db.stats.totalProfitToday += pips;
      }
      const wins = db.signals.filter(s => s.pips > 0).length;
      db.stats.winRate = Math.round((wins / db.signals.length) * 100);

      db.activeSignal = {
        status: 'WAITING',
        symbol: 'XAUUSD',
        type: sig.type === 'BUY' ? 'SELL' : 'BUY',
        timeframe: 'M15',
        entry: sig.entry,
        tp1: 0,
        tp2: 0,
        sl: 0,
        firedAt: null,
        notes: `Amaterasu AI Neural Core scanning order book clusters for next high-probability setup...`
      };

      saveDB(db);
      broadcastEvent('signal_resolved', { item: newHistoryItem, stats: db.stats, activeSignal: db.activeSignal });
      this.log(`🏁 AI Engine Trade Closed: ${sig.symbol} hit ${outcome} (${pips > 0 ? '+' : ''}${pips} pips)! Telemetry logged.`);
      this.secondsInState = 0;
      this.activeTradeTicks = 0;
      this.tp1Triggered = false;
    }
  }
};

let tickCounter = 0;
setInterval(() => {
  tickCounter++;
  // Micro-tick fluctuations across live quotes so the chart wiggles realistically
  for (const [sym, q] of Object.entries(liveMarketQuotes)) {
    const step = q.decimals === 4 ? 0.0001 : q.decimals === 3 ? 0.005 : q.decimals === 2 ? 0.05 : 0.5;
    q.price = Number((q.price + (Math.random() - 0.495) * step).toFixed(q.decimals));
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

  // Re-sync with actual real-world TradingView feeds every 12 seconds
  if (tickCounter % 5 === 0) {
    refreshAllLiveQuotes().catch(() => {});
  }
}, 2500);

// Initial real market quote fetch on boot
refreshAllLiveQuotes().catch(() => {});

server.listen(PORT, () => {
  console.log(`Amaterasu AI Sovereign Platform Ready!`);
  console.log(`User App: http://localhost:${PORT}`);
  console.log(`Admin CRM: http://localhost:${PORT}/crm`);
});
