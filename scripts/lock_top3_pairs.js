const fs = require('fs');
const path = require('path');

// 1. Update server.js
const serverFile = path.join(__dirname, '..', 'server.js');
let serverCode = fs.readFileSync(serverFile, 'utf8');

// Update allowedWhitelist
serverCode = serverCode.replace(
  "const allowedWhitelist = ['USDCAD', 'XAUUSD', 'USDJPY', 'USDCHF'];",
  "const allowedWhitelist = ['XAUUSD', 'USDCHF', 'EURUSD'];"
);

// Update AiEngine.assets
const top3AssetsSnippet = `  assets: [
    { symbol: 'XAUUSD', name: 'Gold', base: 4020.00, pipVal: 0.1, pipDec: 2, tp1Pips: 60, tp2Pips: 120, tp3Pips: 220, slPips: 70, bias: 'BULLISH' },
    { symbol: 'USDCHF', name: 'Swissie', base: 0.8283, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BEARISH' },
    { symbol: 'EURUSD', name: 'Euro', base: 1.1152, pipVal: 0.0001, pipDec: 4, tp1Pips: 20, tp2Pips: 40, tp3Pips: 65, slPips: 20, bias: 'BEARISH' }
  ],`;

const assetsRegex = /assets:\s*\[[\s\S]*?symbol:\s*'USDCHF'[\s\S]*?\],/;
if (assetsRegex.test(serverCode)) {
  serverCode = serverCode.replace(assetsRegex, top3AssetsSnippet);
}

fs.writeFileSync(serverFile, serverCode, 'utf8');
console.log('1. server.js updated with Top 3 Pairs (XAUUSD, USDCHF, EURUSD)!');

// 2. Clean data/db.json activeSignals
const dbFile = path.join(__dirname, '..', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

const top3 = ['XAUUSD', 'USDCHF', 'EURUSD'];
if (Array.isArray(db.activeSignals)) {
  db.activeSignals = db.activeSignals.filter(s => top3.includes(s.symbol));
}
if (db.activeSignal && !top3.includes(db.activeSignal.symbol)) {
  db.activeSignal = db.activeSignals[0] || {
    status: 'WAITING',
    symbol: 'XAUUSD',
    type: 'BUY',
    timeframe: 'M15',
    entry: 0, tp1: 0, tp2: 0, sl: 0,
    firedAt: null,
    notes: 'Amaterasu AI mengimbas zon kecairan pasaran untuk setup seterusnya...'
  };
}
fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
console.log('2. data/db.json activeSignals purged of non-top 3 pairs. Retained:', db.activeSignals.map(s => s.symbol));

// 3. Update bridge_config.json (scratch and desktop)
const configContent = {
  "server_url": "https://amaterasu-x.vercel.app",
  "lot_size": 0.20,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50.0,
  "max_concurrent_pairs": 3,
  "max_slippage_pips": 5,
  "magic_number": 888999,
  "mt5_terminal_path": "",
  "allowed_pairs": [
    "XAUUSD",
    "USDCHF",
    "EURUSD"
  ],
  "custom_lot_map": {
    "XAUUSD": 0.20,
    "USDCHF": 0.20,
    "EURUSD": 0.20
  },
  "custom_symbol_map": {
    "WTI": "USOIL",
    "BTCUSD": "BTCUSD"
  },
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.35,
  "dynamic_floating_atr": true
};

const localConfigPath = path.join(__dirname, '..', 'bridge_config.json');
fs.writeFileSync(localConfigPath, JSON.stringify(configContent, null, 2), 'utf8');

const deskConfigPath = 'C:\\Users\\US\\Desktop\\AMATERASU_MT5_BRIDGE\\bridge_config.json';
if (fs.existsSync('C:\\Users\\US\\Desktop\\AMATERASU_MT5_BRIDGE')) {
  fs.writeFileSync(deskConfigPath, JSON.stringify(configContent, null, 2), 'utf8');
  console.log('3. bridge_config.json updated in scratch & Desktop folder!');
}

// 4. Update amaterasu_mt5_bridge.py
function updateBridgePy(filePath) {
  if (!fs.existsSync(filePath)) return;
  let py = fs.readFileSync(filePath, 'utf8');
  py = py.replace(
    '"allowed_pairs": ["USDCAD", "XAUUSD", "USDJPY", "USDCHF"]',
    '"allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"]'
  );
  py = py.replace(
    'allowed_pairs = self.config.get("allowed_pairs", ["USDCAD", "XAUUSD", "USDJPY", "USDCHF"])',
    'allowed_pairs = self.config.get("allowed_pairs", ["XAUUSD", "USDCHF", "EURUSD"])'
  );
  py = py.replace(
    'USDCAD, XAUUSD, USDJPY, USDCHF (4 Pair Sahaja)',
    'XAUUSD, USDCHF, EURUSD (TOP 3 ELITE SAHAJA)'
  );
  fs.writeFileSync(filePath, py, 'utf8');
  console.log('4. Updated ' + filePath);
}

updateBridgePy(path.join(__dirname, '..', 'amaterasu_mt5_bridge.py'));
updateBridgePy('C:\\Users\\US\\Desktop\\AMATERASU_MT5_BRIDGE\\amaterasu_mt5_bridge.py');
