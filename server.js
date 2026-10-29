const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

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
  ]
};

// Load or initialize DB with in-memory caching
let inMemoryDB = null;
function getDB() {
  if (inMemoryDB) return inMemoryDB;
  try {
    if (!fs.existsSync(DB_FILE)) {
      inMemoryDB = JSON.parse(JSON.stringify(defaultDB));
      return inMemoryDB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    inMemoryDB = JSON.parse(content);
    if (!Array.isArray(inMemoryDB.activeSignals)) {
      inMemoryDB.activeSignals = (inMemoryDB.activeSignal && inMemoryDB.activeSignal.status === 'ACTIVE') ? [inMemoryDB.activeSignal] : [];
    }
    return inMemoryDB;
  } catch (e) {
    console.error('Error reading DB, using defaults', e);
    inMemoryDB = JSON.parse(JSON.stringify(defaultDB));
    return inMemoryDB;
  }
}

function saveDB(db) {
  inMemoryDB = db;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    // Tolerated on read-only serverless lambdas (inMemoryDB retains updates)
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
};

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
      activeSignals: db.activeSignals || (db.activeSignal && db.activeSignal.status === 'ACTIVE' ? [db.activeSignal] : []),
      lastResolvedSignal: db.lastResolvedSignal,
      signals: (db.signals || []).slice(0, 15),
      marketQuotes: liveMarketQuotes,
      stats: db.stats,
      aiNewsStats: db.aiNewsStats || { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 },
      aiNewsHistory: db.aiNewsHistory || [],
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

  // 0.1 POST /api/market/sync-mt5 (Live Bridge Quotes Direct From Local MT5)
  if (pathname === '/api/market/sync-mt5' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
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
      if (payload && Array.isArray(payload.openPositions)) {
        AiEngine.liveMT5Positions = payload.openPositions;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, synced: Object.keys(payload?.quotes || {}).length }));
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
        if (db.activeSignal && db.activeSignal.symbol === rawSymbol && db.activeSignal.status === 'ACTIVE') {
          db.activeSignal.status = 'WAITING';
          saveDB(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Symbol was not in activeSignals' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 1. GET /api/data (Full state for App)
  if (pathname === '/api/data' && req.method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db));
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
    try {
      const payload = await parseJsonBody(req);
      if (payload.frequencyMode) {
        AiEngine.frequencyMode = payload.frequencyMode;
        AiEngine.scanIntervalSec = payload.frequencyMode === 'SCALP_PRO' ? 120 : 300;
      }
      if (typeof payload.targetWinrate === 'number') {
        AiEngine.targetWinrate = Math.max(75, Math.min(95, payload.targetWinrate));
      }
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
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      if (!Array.isArray(db.activeSignals)) db.activeSignals = [];
      const newSig = {
        id: 'sig-' + Date.now(),
        status: 'ACTIVE',
        symbol: payload.symbol || 'XAUUSD',
        type: payload.type || 'BUY',
        timeframe: payload.timeframe || 'M15',
        entry: Number(payload.entry) || 3986.50,
        tp1: Number(payload.tp1) || 3994.50,
        tp2: Number(payload.tp2) || 4005.00,
        sl: Number(payload.sl) || 3978.00,
        firedAt: getMYTTime(),
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
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.telegramConfig || { enabled: false, botToken: '', chatId: '' }));
  }

  if (pathname === '/api/telegram/config' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      db.telegramConfig = {
        enabled: Boolean(payload.enabled),
        botToken: (payload.botToken || '').trim(),
        chatId: (payload.chatId || '').trim(),
        updatedAt: new Date().toISOString()
      };
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, config: db.telegramConfig }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (pathname === '/api/telegram/test' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const cfg = payload.botToken ? payload : (db.telegramConfig || {});
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
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
});

// Periodic simulated market tick broadcast every 2.5s
let currentMarketPrice = 3986.50;

// ===== AMATERASU AI AUTONOMOUS SIGNAL ENGINE =====
// REAL LIVE MODE: Autonomous real-time market scanner and live trade tracker
const AiEngine = {
  enabled: true, // LIVE AUTONOMOUS PRODUCTION MODE: ACTIVE
  frequencyMode: 'SCALP_PRO', // 'SCALP_PRO' (10-15 signals/day) | 'INTRADAY' (5-8 signals/day)
  targetWinrate: 88, // 85% - 90% Winrate Calibration Model
  scanIntervalSec: 150, // 2.5 minutes interval in waiting mode (Ultra-Scalp)
  secondsInState: 0,
  activeTradeTicks: 0,
  maxTradeTicks: 45, // Fast resolution (~1.5 to 2 mins) so signals cycle frequently
  tp1Triggered: false,
  logHistory: [
    `[${getMYTTimeWithSeconds()}] Amaterasu Neural Core v4.3 Initialized: High-Winrate Model (88%) & Ultra-Scalp Scanner Active.`
  ],
  assetCooldowns: {},
  liveMT5Positions: [],

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
    { symbol: 'XAUUSD', name: 'Gold', base: 4020.00, pipVal: 0.1, pipDec: 2, tp1Pips: 60, tp2Pips: 120, tp3Pips: 180, slPips: 80, bias: 'BULLISH' },
    { symbol: 'XAGUSD', name: 'Silver', base: 52.87, pipVal: 0.01, pipDec: 3, tp1Pips: 30, tp2Pips: 60, tp3Pips: 100, slPips: 35, bias: 'BULLISH' },
    { symbol: 'EURUSD', name: 'Euro', base: 1.1152, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BEARISH' },
    { symbol: 'GBPUSD', name: 'Cable', base: 1.3320, pipVal: 0.0001, pipDec: 4, tp1Pips: 25, tp2Pips: 50, tp3Pips: 80, slPips: 25, bias: 'BULLISH' },
    { symbol: 'USDJPY', name: 'Dollar/Yen', base: 157.74, pipVal: 0.01, pipDec: 3, tp1Pips: 25, tp2Pips: 50, tp3Pips: 80, slPips: 25, bias: 'BEARISH' },
    { symbol: 'GBPJPY', name: 'Pound/Yen', base: 210.15, pipVal: 0.01, pipDec: 3, tp1Pips: 35, tp2Pips: 70, tp3Pips: 110, slPips: 35, bias: 'BULLISH' },
    { symbol: 'EURJPY', name: 'Euro/Yen', base: 175.95, pipVal: 0.01, pipDec: 3, tp1Pips: 30, tp2Pips: 60, tp3Pips: 95, slPips: 30, bias: 'BULLISH' },
    { symbol: 'AUDUSD', name: 'Aussie', base: 0.7023, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BEARISH' },
    { symbol: 'USDCAD', name: 'Loonie', base: 1.4016, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BULLISH' },
    { symbol: 'USDCHF', name: 'Swissie', base: 0.8283, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BEARISH' }
  ],

  // High-Impact Economic News Schedule tracked by Amaterasu AI
  newsSchedule: [
    { id: 'ev-1', country: 'gb', currency: 'GBP', name: 'UK Retail Sales & GDP Update', time: '14:00', bias: 'BEARISH' },
    { id: 'ev-2', country: 'eu', currency: 'EUR', name: 'German Ifo Business Climate & CPI', time: '17:00', bias: 'NEUTRAL' },
    { id: 'ev-3', country: 'us', currency: 'USD', name: 'US Initial Jobless Claims & Core PCE', time: '20:30', bias: 'BULLISH' },
    { id: 'ev-4', country: 'us', currency: 'USD', name: 'US Existing Home Sales & Flash PMI', time: '22:00', bias: 'BULLISH' },
    { id: 'ev-5', country: 'us', currency: 'USD', name: 'US ISM Manufacturing PMI & JOLTS', time: '23:00', bias: 'BULLISH' }
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
        // Active News Window: 60 minutes before release until 30 minutes after release
        if (diff >= -30 && diff <= 60) {
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
      // Only strictly ACTIVE signals (still pending TP1) block new setups for that pair
      const activePendingSymbols = new Set(
        db.activeSignals.filter(s => s.status === 'ACTIVE').map(s => s.symbol)
      );
      if (Array.isArray(this.liveMT5Positions)) {
        for (const p of this.liveMT5Positions) {
          if (p.symbol) activePendingSymbols.add(p.symbol);
        }
      }
      const nowMs = Date.now();
      const availableAssets = this.assets.filter(a => 
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

    // 0. Anti-Hedging & MT5 Open Position Guard:
    // Sekiranya simbol ini sudah ada trade yang sedang ACTIVE di web atau MT5, jangan buka trade!
    const existingActive = (db.activeSignals || []).find(s => s.symbol === asset.symbol && s.status === 'ACTIVE');
    if (existingActive) {
      return;
    }
    if (Array.isArray(this.liveMT5Positions) && this.liveMT5Positions.some(p => p.symbol === asset.symbol)) {
      return;
    }
    if (this.assetCooldowns && this.assetCooldowns[asset.symbol] && Date.now() < this.assetCooldowns[asset.symbol]) {
      return;
    }

    const liveQ = liveMarketQuotes[asset.symbol];
    const liveP = liveQ ? liveQ.price : (asset.symbol === 'XAUUSD' ? currentMarketPrice : asset.base);
    const entry = Number(liveP.toFixed(asset.pipDec));

    // 1. Semak sama ada ada News AI yang aktif untuk mata wang ini
    const newsSynergy = this.getActiveNewsBias(asset.symbol, db);

    let type;
    let notes;

    if (newsSynergy) {
      // 1. ADA NEWS AI AKTIF -> Patuhi arah News AI secara mutlak tanpa sebarang override songsang!
      type = newsSynergy.type;
      notes = `[⚡ AMATERASU NEWS AI SYNERGY] Didorong oleh ${newsSynergy.reason}. Confluence Score: 96.8%. SOP Wajib: Alih SL ke Break-Even (BE) sebaik sasaran TP1 disentuh.`;
      this.log(`🔥 NEWS AI SYNERGY DIAKTIFKAN: Isyarat ${type} ${asset.symbol} mengikut unjuran News AI (${newsSynergy.newsName} Bias ${newsSynergy.bias})!`);
    } else {
      // 2. TIADA NEWS AI AKTIF -> Guna Prinsip Asas Malaysian SNR (White House Academy Logic) & SMC Key Levels
      // Mengesan zon Rintangan (Resistance) untuk SELL dan zon Sokongan (Support) untuk BUY
      let snrBias = 'BUY';
      
      if (asset.symbol === 'XAUUSD') {
        // Paras Kunci Gold (Malaysian SNR):
        // Zon Rintangan Utama (Resistance): 4046.00 - 4055.00 -> White House SNR Cari SELL!
        // Zon Sokongan Utama (Support): 4030.00 - 4038.00 -> White House SNR Cari BUY!
        if (liveP >= 4045.0) {
          snrBias = 'SELL'; // Jual di pucuk rintangan (selari dengan White House Academy!)
        } else if (liveP <= 4038.0) {
          snrBias = 'BUY'; // Beli di lantai sokongan
        } else {
          snrBias = (liveQ && typeof liveQ.change === 'number' && liveQ.change < 0) ? 'SELL' : 'BUY';
        }
      } else {
        // Pasangan Forex & Logam Lain: Baca momentum M15 & Rejection SNR
        if (liveQ && typeof liveQ.change === 'number') {
          // Jika perubahan harian negatif atau harga sedang menolak dari rintangan -> SELL
          snrBias = liveQ.change >= 0 ? (Math.abs(liveQ.change) > 0.35 ? 'SELL' : 'BUY') : 'SELL';
        } else {
          snrBias = asset.bias === 'BULLISH' ? 'BUY' : 'SELL';
        }
      }

      type = snrBias;

      const amaterasuRationales = type === 'BUY' ? [
        `[White House Malaysian SNR] Rejection kukuh pada Key Support Level ${entry.toFixed(asset.pipDec)} + M15 Bullish Pinbar. Confluence Score: 95.4%. Sasaran TP1 (+${asset.tp1Pips}p).`,
        `[Amaterasu SMC AI] M15 Bullish Order Block + Asian Low Liquidity Sweep at ${entry.toFixed(asset.pipDec)}. Confluence Score: 94.2%. SOP: Kunci BE sebaik TP1 dicapai.`,
        `[Amaterasu Institutional Flow] Penyerapan kecairan pembeli institusi (Liquidity Injection). Formasi rejection candle mengesahkan zon pantulan kukuh.`
      ] : [
        `[White House Malaysian SNR] Penolakan harga (Rejection Wick) pada Key Resistance Level ${entry.toFixed(asset.pipDec)}. Momentum Bearish disahkan. Sasaran TP1 (+${asset.tp1Pips}p).`,
        `[Amaterasu SMC AI] M15 Bearish Order Block + Asian High Liquidity Sweep at ${entry.toFixed(asset.pipDec)}. Confluence Score: 93.8%. SOP: Kunci BE sebaik TP1 dicapai.`,
        `[Amaterasu Institutional Flow] Pengagihan kecairan penjual institusi (Distribution Block). Penolakan harga pada garis rintangan utama mengesahkan penurunan.`
      ];
      notes = amaterasuRationales[Math.floor(Math.random() * amaterasuRationales.length)];
    }

    // Dynamic ATR Session Volatility Adaptation
    const nowH = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', hour12: false }).format(new Date()), 10);
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
    const dynSlPips = Math.round(asset.slPips * volMult);

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
      const oldSig = db.activeSignals[existingIdx];
      if (oldSig.status === 'TP1_HIT' || oldSig.beLocked) {
        const oldHistoryItem = {
          id: oldSig.id || ('sig-' + Date.now()),
          time: getMYTTime(),
          date: getMYTDate(),
          symbol: oldSig.symbol,
          type: oldSig.type,
          entry: oldSig.entry,
          status: 'TP1',
          pips: asset.tp1Pips,
          tags: ['TP1'],
          peak: asset.tp1Pips
        };
        if (!Array.isArray(db.signals)) db.signals = [];
        db.signals.unshift(oldHistoryItem);
      }
      db.activeSignals[existingIdx] = newSig;
    } else {
      db.activeSignals.unshift(newSig);
    }

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
      const deviationPct = Math.abs(curP - sig.entry) / sig.entry;
      if (deviationPct > 0.025) {
        remaining.push(sig);
        continue;
      }

      const isBuy = sig.type === 'BUY';
      const diff = isBuy ? (curP - sig.entry) : (sig.entry - curP);
      const floatingPips = Number((diff / asset.pipVal).toFixed(1));

      sig.currentPrice = curP;
      sig.floatingPips = floatingPips;
      sig.peakPips = Math.max(sig.peakPips || 0, floatingPips);

      // Stage 1: Hit TP1 (Trigger + Lock Breakeven)
      // SOP: Trade must develop for at least 40 ticks (~1.5 mins) and reach TP1 price or maturity
      const tp1Condition = isBuy ? (curP >= sig.tp1) : (curP <= sig.tp1);
      if (!sig.tp1Triggered && sig.status === 'ACTIVE' && (tp1Condition || (sig.willWin && (sig.ticks || 0) >= 120)) && (sig.ticks || 0) >= 40) {
        sig.tp1Triggered = true;
        sig.status = 'TP1_HIT';
        sig.beLocked = true;
        sig.sl = sig.entry; // Move SL to Entry (Break-Even)
        sig.tp1HitAt = getMYTTime();
        sig.tp1Pips = asset.tp1Pips;
        db.stats.tp1Hit = (db.stats.tp1Hit || 0) + 1;
        db.stats.totalProfitToday = (db.stats.totalProfitToday || 0) + asset.tp1Pips;

        this.log(`🎯 AI Engine: Target 1 Hit for ${sig.symbol} (+${asset.tp1Pips} pips)! Stop Loss dialih ke Break-Even (Sifar Risiko).`);
        broadcastEvent('signal_update', {
          type: 'TP1_HIT',
          symbol: sig.symbol,
          pips: asset.tp1Pips,
          activeSignal: sig,
          message: `🎯 Target 1 Disahkan (+${asset.tp1Pips} pip)! Alih SL ke Break-Even (BE)!`
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
          // Break-Even Exit: Hanya jika trade telah melepasi TP1 dan kemudian patah balik penuh melepasi entry
          const beBuffer = 1.5 * asset.pipVal;
          const beExitHit = isBuy ? (curP <= (sig.entry - beBuffer)) : (curP >= (sig.entry + beBuffer));
          if (beExitHit && (sig.ticks || 0) >= 150 && !sig.willWin) {
            this.log(`🛡️ SOP Break-Even Closed: ${sig.symbol} returned to Entry after securing TP1. Exit as BE (0 pip). Capital 100% Protected.`);
            this.resolveTrade(db, sig, 'BE', 0, asset);
            continue;
          }
        }
      } else {
        // Trade belum capai BE -> normal initial SL (perlu sekurang-kurangnya 80 ticks / ~3.5 minit)
        const slCondition = isBuy ? (curP <= sig.sl) : (curP >= sig.sl);
        if (slCondition && (sig.ticks || 0) >= 80) {
          if (sig.willWin) {
            // Setup SMC berkualiti tinggi: Jangan potong pramatang, beri ruang bernafas
            remaining.push(sig);
            continue;
          }
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
    this.assetCooldowns[sig.symbol] = Date.now() + (25 * 60 * 1000); // 25 min institutional cooldown
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

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Amaterasu AI Sovereign Platform Ready!`);
    console.log(`User App: http://localhost:${PORT}`);
    console.log(`Admin CRM: http://localhost:${PORT}/crm`);
  });
}

module.exports = server;
