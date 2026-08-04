// Omni Signal App Backend
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Setup SQLite Database
const db = new sqlite3.Database('./signals.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to the SQLite database.');
});

// Initialize Table
db.run(`CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT,
  type TEXT,
  price TEXT,
  tp TEXT,
  sl TEXT,
  time TEXT,
  status TEXT
)`);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected to WebSockets');
});

// Webhook Endpoint for TradingView
app.post('/api/webhook', (req, res) => {
  const { pair, type, price, tp, sl } = req.body;
  
  if (!pair || !type) {
    return res.status(400).json({ error: 'Invalid signal format' });
  }

  // Format time (e.g. 'Just now', '10:45 AM')
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const status = type.toLowerCase().includes('standby') ? 'standby' : 'live';

  const sql = `INSERT INTO signals (pair, type, price, tp, sl, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [pair, type, price || '-', tp || '-', sl || '-', timeString, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const newSignal = {
      id: this.lastID,
      pair,
      type,
      price: price || '-',
      tp: tp || '-',
      sl: sl || '-',
      time: timeString,
      status
    };

    // Broadcast to all connected React clients in real-time!
    io.emit('new_signal', newSignal);
    
    res.status(200).json({ message: 'Signal processed successfully', data: newSignal });
  });
});

// API to get all historical signals
app.get('/api/signals', (req, res) => {
  db.all('SELECT * FROM signals ORDER BY id DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// --- NEW API ENDPOINTS FOR OMNI APP ---

// 1. Auth Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: email=${email}, password=${password}`);
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPassword = password ? password.trim() : '';

  if (cleanEmail === 'admin@omniai.com' && cleanPassword === 'admin123') {
    console.log("Login success");
    res.json({ success: true, token: 'mock-jwt-token-123' });
  } else {
    console.log("Login failed");
    res.status(401).json({ success: false, message: 'Invalid credentials (Gunakan admin@omniai.com dan admin123)' });
  }
});

// 2. Chatbot Endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();
  let reply = "I am Omni AI. How can I assist you with your trading today?";

  if (lowerMsg.includes('xauusd') || lowerMsg.includes('gold')) {
    reply = "Gold (XAUUSD) is showing strong institutional buying volume. Look for retracements to 2340 before entering longs.";
  } else if (lowerMsg.includes('btc') || lowerMsg.includes('crypto')) {
    reply = "Bitcoin is consolidating. Wait for a breakout above 65k before entering long positions.";
  } else if (lowerMsg.includes('help') || lowerMsg.includes('tolong')) {
    reply = "I can analyze assets, review your risk management, or explain trading concepts. What do you need?";
  }

  // Simulate network delay
  setTimeout(() => res.json({ reply }), 1500);
});

// 3. Leaderboard Endpoint
app.get('/api/leaderboard', (req, res) => {
  // Mock data for now, but served from backend to prepare for DB integration
  const leaderboardData = [
    { rank: 1, name: "AlphaWolf", winRate: "92%", trades: 145, profit: "+$45,200", isPro: true, status: "Active" },
    { rank: 2, name: "Sarah FX", winRate: "88%", trades: 98, profit: "+$32,100", isPro: true, status: "Active" },
    { rank: 3, name: "CryptoKing", winRate: "85%", trades: 210, profit: "+$28,500", isPro: false, status: "Offline" },
    { rank: 4, name: "SniperJoe", winRate: "81%", trades: 65, profit: "+$18,200", isPro: true, status: "Active" },
    { rank: 5, name: "Elena Trade", winRate: "79%", trades: 112, profit: "+$15,400", isPro: false, status: "Offline" }
  ];
  res.json(leaderboardData);
});

// Deployment Readiness
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Omni AI Backend Server running on port ${PORT}`);
});
