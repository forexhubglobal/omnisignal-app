// ===== Amaterasu X Core Engine =====
const BRAND = {
  name: 'AMATERASU X',
  short: 'AMATERASU X',
  tagline: 'AI POWERED FOREX & CFD SIGNALS',
  motto: 'Precision Signals. Smarter Decisions. Your Trading Edge.',
  user: 'Tengku Khairi'
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n, sign = true) => (n < 0 ? '-' : sign ? '+' : '') + '$' + num(Math.abs(n));
const shortMoney = n => {
  const a = Math.abs(n);
  const s = a >= 1000 ? (a / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k' : a % 1 === 0 ? a.toFixed(0) : a.toFixed(2);
  return (n < 0 ? '-' : '+') + '$' + s;
};
const pad2 = n => String(n).padStart(2, '0');
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const dateKey = d => `${monthKey(d)}-${pad2(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const flag = c => `<img class="flag" src="https://flagcdn.com/w40/${c}.png" alt="${c}" style="width:18px; height:13px; border-radius:2px; vertical-align:middle;">`;

// Deterministic random generator
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----- Icons -----
const ICON = {
  signal: '<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6a6 6 0 1 0 6 6"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>',
  stat: '<path d="M3 20h18"/><path d="M7 16V10M12 16V6M17 16v-4"/>',
  analysis: '<circle cx="12" cy="12" r="3.2"/><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/>',
  screener: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  news: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/>',
  ainews: '<rect x="3" y="4" width="18" height="17" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>',
  more: '<circle cx="5" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="2" fill="currentColor" stroke="none"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  trophy: '<path d="M6 9H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M18 9h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M12 16v3"/><path d="M8 21h8"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  diamond: '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M10 3l2 19M14 3l-2 19"/>',
  arrow: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
};
const ic = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;

// AMATERASU X: Authentic Itachi Mangekyo Sharingan Logo
const LOGO = `<div class="sharingan-eye-container">
  <div class="sharingan-outer-pulse"></div>
  <div class="sharingan-ripple"></div>
  <svg class="sharingan-eye-svg" viewBox="0 0 100 100" width="84" height="84" aria-hidden="true">
    <defs>
      <radialGradient id="irisRedGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FF3848"/>
        <stop offset="45%" stop-color="#EF2D3D"/>
        <stop offset="85%" stop-color="#A80D1A"/>
        <stop offset="100%" stop-color="#3D0308"/>
      </radialGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="50%" stop-color="#FF2638" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FF2638" stop-opacity="0"/>
      </radialGradient>
      <filter id="sharinganBloom" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Outer Neon Glow Halo -->
    <circle cx="50" cy="50" r="48" fill="url(#eyeGlow)" />

    <!-- Sclera / Outer Eye Ring -->
    <circle cx="50" cy="50" r="42" fill="#06080D" stroke="#EF2D3D" stroke-width="1.8" />

    <!-- Crimson Iris -->
    <circle cx="50" cy="50" r="38" fill="url(#irisRedGrad)" />

    <!-- Inner Iris Ring Guide -->
    <circle cx="50" cy="50" r="28" fill="none" stroke="#2B0408" stroke-width="1.2" opacity="0.6"/>

    <!-- Rotating Mangekyo Pinwheel Group -->
    <g class="sharingan-pinwheel" filter="url(#sharinganBloom)">
      <!-- Central Core Pupil -->
      <circle cx="50" cy="50" r="8" fill="#080D14" stroke="#000000" stroke-width="1"/>
      
      <!-- Blade 1 (Top) -->
      <path d="M50 50 Q43 25 50 14 Q57 25 53 44 Z" fill="#080D14"/>
      <!-- Blade 2 (Bottom-Right) -->
      <path d="M50 50 Q71 58 81 68 Q64 73 53 54 Z" fill="#080D14"/>
      <!-- Blade 3 (Bottom-Left) -->
      <path d="M50 50 Q29 58 19 68 Q36 73 47 54 Z" fill="#080D14"/>

      <!-- Inner accent points -->
      <circle cx="50" cy="20" r="2.2" fill="#080D14"/>
      <circle cx="75" cy="64" r="2.2" fill="#080D14"/>
      <circle cx="25" cy="64" r="2.2" fill="#080D14"/>
    </g>

    <!-- Pupil Core Red Dot & Glint -->
    <circle cx="50" cy="50" r="3.2" fill="#EF2D3D"/>
    <circle cx="48" cy="48" r="1.5" fill="#FFFFFF" opacity="0.9"/>
  </svg>
</div>`;

// Solar background glow
function solarGlow() {
  return `<div class="solar-bg-glow"></div>`;
}

const pageHead = (title, sub, back = false) =>
  `${solarGlow()}${back ? '<a class="back" href="#more">← Back to Command</a>' : ''}<h1 class="title">${title}</h1><p class="sub">${sub}</p><div class="rule"></div>`;

// Pixel art helper for game icons
const PAL = { g: '#00e676', r: '#ff1744', y: '#ffb300', b: '#8b5a2b', w: '#f8fafc', k: '#06070a', p: '#d500f9', c: '#00e5ff' };
function pixel(rows, size = 6) {
  const h = rows.length, w = rows[0].length;
  let r = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${PAL[ch]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * size}" height="${h * size}" shape-rendering="crispEdges">${r}</svg>`;
}

// ----- Modal & toast -----
function modal(html) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  return { el: bg, close };
}
// ===== Amaterasu X Futuristic Web Audio FX Suite =====
const AmaterasuSound = {
  enabled: store.get('ama_sound_enabled', true),

  toggle() {
    this.enabled = !this.enabled;
    store.set('ama_sound_enabled', this.enabled);
    if (this.enabled) this.alert();
    return this.enabled;
  },

  getContext() {
    if (!this.enabled) return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this._ctx) this._ctx = new AudioCtx();
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return this._ctx;
    } catch(e) { return null; }
  },

  // 1. Sharingan Resonance Sweep (Signal Fired / Scanner Lock)
  sharingan() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.5);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch(e) {}
  },

  // 2. Crystal Victory Chime (Target 1 & 2 Achieved)
  tpWin() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch(e) {}
  },

  // 3. Crisp Alert Chime
  alert() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch(e) {}
  }
};

function playChime(type = 'bell') {
  if (type === 'tp' || type === 'win') AmaterasuSound.tpWin();
  else if (type === 'sharingan' || type === 'signal') AmaterasuSound.sharingan();
  else AmaterasuSound.alert();
}

function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span style="color:var(--solar-gold)">☀️</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

// ----- Global State & Real-Time Sync with Amaterasu CRM -----
const AppState = {
  db: null,
  activeSignal: null,
  activeSignals: [],
  lastResolvedSignal: null,
  signals: [],
  stats: null,
  analysis: null,
  screener: null,
  classes: null,
  contests: null,
  async sync() {
    try {
      const res = await fetch('/api/data');
      this.db = await res.json();
      this.activeSignal = this.db.activeSignal;
      this.activeSignals = Array.isArray(this.db.activeSignals) ? this.db.activeSignals : (this.activeSignal && this.activeSignal.status === 'ACTIVE' ? [this.activeSignal] : []);
      this.lastResolvedSignal = this.db.lastResolvedSignal || null;
      this.signals = this.db.signals || [];
      this.stats = this.db.stats;
      this.analysis = this.db.analysis;
      this.screener = this.db.screener;
      this.classes = this.db.classes;
      this.contests = this.db.contests;

      // Fetch initial live quotes
      try {
        const qRes = await fetch('/api/market/quotes');
        const qData = await qRes.json();
        Market.updateQuotes(qData);
      } catch (err) {}
    } catch (e) {
      console.warn('Running in offline/standalone mode', e);
    }
  },
  initSSE() {
    if (typeof EventSource === 'undefined') return;
    try {
      const s = new EventSource('/api/events');
      s.addEventListener('initial_sync', e => {
        const d = JSON.parse(e.data);
        this.activeSignal = d.activeSignal;
        this.activeSignals = Array.isArray(d.activeSignals) ? d.activeSignals : (d.activeSignal && d.activeSignal.status === 'ACTIVE' ? [d.activeSignal] : []);
        this.lastResolvedSignal = d.lastResolvedSignal || null;
        this.signals = d.signals || [];
        if (d.marketQuotes) {
          Market.updateQuotes(d.marketQuotes);
        }
        this.stats = d.stats;
        this.aiNewsStats = d.aiNewsStats || { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 };
        this.aiNewsHistory = d.aiNewsHistory || [];
        this.analysis = d.analysis;
        this.screener = d.screener;
        this.classes = d.classes;
        this.contests = d.contests;
        if (typeof route === 'function') route();
      });
      s.addEventListener('market_quotes', e => {
        const quotes = JSON.parse(e.data);
        Market.updateQuotes(quotes);
      });
      s.addEventListener('signal_fired', e => {
        const newSig = JSON.parse(e.data);
        this.activeSignal = newSig;
        if (!Array.isArray(this.activeSignals)) this.activeSignals = [];
        this.activeSignals = this.activeSignals.filter(sig => sig.symbol !== newSig.symbol);
        this.activeSignals.unshift(newSig);
        if (newSig && newSig.symbol) {
          store.set('selected_signal_sym', newSig.symbol);
        }
        AmaterasuSound.sharingan();
        toast(`⚡ AMATERASU SIGNAL: ${newSig.type} ${newSig.symbol}!`);
        if (typeof route === 'function') route();
      });
      s.addEventListener('on_pips_update', e => {
        const list = JSON.parse(e.data);
        if (Array.isArray(list)) {
          this.activeSignals = list;
          if (list.length > 0 && (!this.activeSignal || this.activeSignal.status === 'WAITING')) {
            this.activeSignal = list[0];
          }
          const isSigTab = !location.hash || location.hash === '#signal' || location.hash === '#';
          if (typeof route === 'function' && isSigTab) route();
        }
      });
      s.addEventListener('on_pips_tick', e => {
        const d = JSON.parse(e.data);
        if (d && Array.isArray(d.activeSignals)) {
          this.activeSignals = d.activeSignals;
          Market.updateUI();
        }
      });
      s.addEventListener('signal_active_tick', e => {
        const d = JSON.parse(e.data);
        if (this.activeSignal && this.activeSignal.symbol === d.symbol) {
          this.activeSignal.currentPrice = d.currentPrice;
          this.activeSignal.floatingPips = d.floatingPips;
          this.activeSignal.beLocked = d.beLocked;
          if (Market.quotes && Market.quotes[d.symbol]) {
            Market.quotes[d.symbol].price = d.currentPrice;
          }
          Market.updateUI();
        }
      });
      s.addEventListener('signal_update', e => {
        const d = JSON.parse(e.data);
        if (d.activeSignal) this.activeSignal = d.activeSignal;
        if (Array.isArray(this.activeSignals) && d.activeSignal) {
          const idx = this.activeSignals.findIndex(s => s.symbol === d.activeSignal.symbol);
          if (idx !== -1) this.activeSignals[idx] = d.activeSignal;
        }
        AmaterasuSound.tpWin();
        toast(d.message || `🎯 Target 1 Disahkan! Alih SL ke Break-Even (BE)!`);
        if (typeof route === 'function') route();
      });
      s.addEventListener('signal_resolved', e => {
        const d = JSON.parse(e.data);
        this.activeSignal = d.activeSignal;
        if (Array.isArray(d.activeSignals)) {
          this.activeSignals = d.activeSignals;
        } else if (Array.isArray(this.activeSignals) && d.item) {
          this.activeSignals = this.activeSignals.filter(s => s.symbol !== d.item.symbol);
        }
        this.lastResolvedSignal = d.item;
        if (d.item) {
          const itemKey = `${d.item.symbol || ''}_${d.item.id || ''}_${d.item.status || ''}`;
          if (this._lastToastKey === itemKey && Date.now() - (this._lastToastTime || 0) < 60000) {
            return;
          }
          this._lastToastKey = itemKey;
          this._lastToastTime = Date.now();

          this.signals = [d.item, ...(this.signals || [])];
          if (d.item.status === 'TP2' || (d.item.pips && d.item.pips > 0)) {
            AmaterasuSound.tpWin();
          }
          this.stats = d.stats;
          toast(`🎯 Signal ${d.item.status}: ${d.item.pips > 0 ? '+' : ''}${d.item.pips} pip!`);
        }
        if (typeof route === 'function') route();
      });
      s.addEventListener('stats_reset', e => {
        const d = JSON.parse(e.data);
        this.stats = d.stats;
        this.signals = d.signals || [];
        this.aiNewsStats = d.aiNewsStats || { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 };
        this.aiNewsHistory = d.aiNewsHistory || [];
        this.activeSignal = d.activeSignal;
        this.lastResolvedSignal = null;
        toast('🔄 Statistik dan rekod signal telah dimulakan semula');
        if (typeof route === 'function') route();
      });
      s.addEventListener('ainews_updated', e => {
        const d = JSON.parse(e.data);
        this.aiNewsStats = d.stats;
        this.aiNewsHistory = d.history || [];
        toast('📰 Rekod prestasi AI News dikemas kini');
        if (location.hash === '#ainews') route();
      });
      s.addEventListener('analysis_updated', e => {
        this.analysis = JSON.parse(e.data);
        toast('📝 Amaterasu Solar Intelligence Updated');
        if (location.hash === '#analysis') route();
      });
      s.addEventListener('screener_updated', e => {
        this.screener = JSON.parse(e.data);
        if (location.hash === '#screener') route();
      });
      s.addEventListener('class_added', e => {
        const item = JSON.parse(e.data);
        if (this.classes) this.classes.unshift(item);
        toast(`🎓 New Masterclass: ${item.title}`);
      });
      s.addEventListener('class_updated', e => {
        const item = JSON.parse(e.data);
        if (this.classes) {
          const idx = this.classes.findIndex(c => c.id === item.id);
          if (idx !== -1) this.classes[idx] = item;
        }
      });
      s.addEventListener('contest_updated', e => {
        const ct = JSON.parse(e.data);
        if (this.contests) this.contests[0] = ct;
        toast(`🏆 Championship: ${ct.status.toUpperCase()}`);
        if (location.hash === '#contest') route();
      });
      s.addEventListener('feedback_replied', e => {
        const fb = JSON.parse(e.data);
        modal(`<h3>Amaterasu Desk Response</h3><p class="muted">Regarding: "${esc(fb.message)}"</p>
          <div style="background: rgba(255,109,0,.1); border-left: 3px solid var(--solar-orange); padding: 12px; margin: 12px 0; border-radius: 6px; color: #fff;">
            <b>Amaterasu Lead Desk:</b><br>${esc(fb.reply)}
          </div>
          <div class="modal-actions"><button class="btn gold" data-close>Acknowledge</button></div>`);
      });
      s.addEventListener('market_tick', e => {
        const d = JSON.parse(e.data);
        if (d.symbol && Market.quotes[d.symbol]) {
          Market.quotes[d.symbol].price = d.price;
        }
        if (d.symbol === 'XAUUSD' || !d.symbol) {
          Market.price = d.price;
        }
        Market.updateUI();
      });
    } catch (e) {
      console.warn('SSE not connected');
    }
  }
};

// ----- Real-Time TradingView-Synchronized Market Feed -----
const Market = {
  activeSymbol: 'XAUUSD',
  open: 3986.50,
  price: 3986.50,
  quotes: {
    XAUUSD: { price: 3986.50, change: -0.42, decimals: 2 },
    EURUSD: { price: 1.0825, change: -0.11, decimals: 4 },
    GBPJPY: { price: 198.50, change: -0.16, decimals: 3 },
    GBPUSD: { price: 1.2980, change: -0.22, decimals: 4 },
    USDJPY: { price: 152.80, change: 0.03, decimals: 3 },
    WTI: { price: 71.50, change: 0.82, decimals: 2 },
    BTCUSD: { price: 67800.0, change: 1.45, decimals: 0 }
  },
  subs: new Set(),
  getLivePrice(sym) {
    if (this.quotes && this.quotes[sym] && typeof this.quotes[sym].price === 'number') {
      return this.quotes[sym].price;
    }
    return sym === 'XAUUSD' ? this.price : 0;
  },
  updateQuotes(newQuotes) {
    if (!newQuotes) return;
    Object.assign(this.quotes, newQuotes);
    if (this.quotes.XAUUSD) {
      this.price = this.quotes.XAUUSD.price;
    }
    this.updateUI();
  },
  updateUI() {
    const sym = this.activeSymbol || 'XAUUSD';
    const q = this.quotes[sym] || this.quotes.XAUUSD;
    const p = this.getLivePrice(sym) || this.price;
    const dec = q && typeof q.decimals === 'number' ? q.decimals : 2;

    const symEl = $('#tickerSymbol');
    if (symEl) symEl.textContent = sym;
    const pEl = $('#price');
    if (pEl) pEl.textContent = num(p, dec);
    const c = $('#change');
    const chg = q ? q.change : 0;
    if (c) {
      c.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
      c.className = 'change ' + (chg >= 0 ? 'up' : 'down');
    }
    $$('[data-live]').forEach(el => (el.textContent = num(p, dec)));

    // Synchronize ALL_INSTRUMENTS base prices with live TradingView prices
    if (typeof ALL_INSTRUMENTS !== 'undefined' && Array.isArray(ALL_INSTRUMENTS)) {
      ALL_INSTRUMENTS.forEach(inst => {
        if (this.quotes[inst.id]) {
          inst.basePrice = this.quotes[inst.id].price;
        }
      });
    }

    // Real-Time Floating PnL Live Tick Engine (Matches currently viewed asset in ticket)
    if (typeof AppState !== 'undefined') {
      const activeList = Array.isArray(AppState.activeSignals) ? AppState.activeSignals : (AppState.activeSignal ? [AppState.activeSignal] : []);
      const sig = activeList.find(s => s.symbol === this.activeSymbol && (s.status === 'ACTIVE' || s.status === 'TP1_HIT'));
      
      if (sig) {
        const liveP = this.getLivePrice(sig.symbol) || sig.entry;
        const isBuy = sig.type === 'BUY';
        const pipValActual = sig.symbol === 'XAUUSD' ? 0.1 : (sig.symbol === 'WTI' ? 0.01 : (sig.symbol.includes('JPY') ? 0.01 : (sig.symbol.includes('BTC') ? 1 : 0.0001)));
        const diff = isBuy ? (liveP - sig.entry) : (sig.entry - liveP);
        const floatPips = Number((diff / pipValActual).toFixed(1));
        const decActual = (this.quotes[sig.symbol] && this.quotes[sig.symbol].decimals) || (sig.symbol === 'XAUUSD' || sig.symbol === 'WTI' ? 2 : sig.symbol.includes('JPY') ? 3 : sig.symbol.includes('BTC') ? 1 : 4);
        
        const floatPipsEl = document.getElementById('liveFloatingPipsVal');
        if (floatPipsEl) {
          const prevVal = floatPipsEl.dataset.pipVal ? parseFloat(floatPipsEl.dataset.pipVal) : null;
          const newText = (floatPips >= 0 ? '+' : '') + floatPips + ' PIP';
          floatPipsEl.textContent = newText;
          floatPipsEl.style.color = floatPips >= 0 ? '#00e676' : '#ef5350';
          floatPipsEl.style.background = floatPips >= 0 ? 'rgba(0,230,118,0.18)' : 'rgba(239,83,80,0.18)';
          floatPipsEl.dataset.pipVal = floatPips;

          if (prevVal !== null && prevVal !== floatPips) {
            floatPipsEl.style.transition = 'all 0.15s ease';
            floatPipsEl.style.transform = 'scale(1.08)';
            setTimeout(() => { if (floatPipsEl) floatPipsEl.style.transform = 'scale(1)'; }, 150);
          }
        }

        const livePriceEl = document.getElementById('liveSignalCurrentPrice');
        if (livePriceEl) {
          livePriceEl.textContent = num(liveP, decActual);
        }

        const topBarPipsEl = document.getElementById('topBarFloatingPips');
        if (topBarPipsEl) {
          topBarPipsEl.textContent = (floatPips >= 0 ? '+' : '') + floatPips + ' PIP';
          topBarPipsEl.style.color = floatPips >= 0 ? '#00e676' : '#ef5350';
        }
      }
    }

    // Real-Time Update for All Running Trades in "⚡ ON PIPS" Area
    if (typeof AppState !== 'undefined' && Array.isArray(AppState.activeSignals)) {
      AppState.activeSignals.forEach(sig => {
        const liveP = this.getLivePrice(sig.symbol) || sig.entry;
        const isBuy = sig.type === 'BUY';
        const pipValActual = sig.symbol === 'XAUUSD' ? 0.1 : (sig.symbol === 'WTI' ? 0.01 : (sig.symbol.includes('JPY') ? 0.01 : (sig.symbol.includes('BTC') ? 1 : 0.0001)));
        const diff = isBuy ? (liveP - sig.entry) : (sig.entry - liveP);
        const floatPips = Number((diff / pipValActual).toFixed(1));
        const qDec = (this.quotes[sig.symbol] && this.quotes[sig.symbol].decimals) || (sig.symbol === 'XAUUSD' || sig.symbol === 'WTI' ? 2 : sig.symbol.includes('JPY') ? 3 : sig.symbol.includes('BTC') ? 1 : 4);

        const badgeEl = document.querySelector(`.on-pips-badge[data-symbol="${sig.symbol}"]`);
        if (badgeEl) {
          const prevVal = badgeEl.dataset.pipVal ? parseFloat(badgeEl.dataset.pipVal) : null;
          badgeEl.textContent = (floatPips >= 0 ? '+' : '') + floatPips + ' PIP';
          badgeEl.style.color = floatPips >= 0 ? '#00e676' : '#ef5350';
          badgeEl.style.background = floatPips >= 0 ? 'rgba(0,230,118,0.16)' : 'rgba(239,83,80,0.16)';
          badgeEl.style.borderColor = floatPips >= 0 ? 'rgba(0,230,118,0.35)' : 'rgba(239,83,80,0.35)';
          badgeEl.dataset.pipVal = floatPips;

          if (prevVal !== null && prevVal !== floatPips) {
            badgeEl.style.transition = 'all 0.15s ease';
            badgeEl.style.transform = 'scale(1.08)';
            setTimeout(() => { if (badgeEl) badgeEl.style.transform = 'scale(1)'; }, 150);
          }
        }

        const priceEl = document.querySelector(`.on-pips-curprice[data-symbol="${sig.symbol}"]`);
        if (priceEl) {
          priceEl.textContent = num(liveP, qDec);
        }
      });
    }

    // Update active chart redraw if mounted
    if (window._activeSnrChart && typeof window._activeSnrChart.onLiveTick === 'function') {
      window._activeSnrChart.onLiveTick();
    }
    this.subs.forEach(fn => fn(p));
  },
  tick() {
    const sym = this.activeSymbol || 'XAUUSD';
    const q = this.quotes[sym];
    const step = q && q.decimals === 4 ? 0.0001 : q && q.decimals === 3 ? 0.005 : q && q.decimals === 2 ? 0.05 : 0.5;
    if (q) {
      q.price = Number((q.price + (Math.random() - 0.495) * step).toFixed(q.decimals));
    }
    if (sym === 'XAUUSD') {
      this.price = this.quotes.XAUUSD.price;
    }
    this.updateUI();
  }
};

// ----- EMA calculation -----
function ema(vals, period) {
  const k = 2 / (period + 1);
  let prev = vals[0];
  return vals.map((v, i) => {
    if (i === 0) return v;
    prev = v * k + prev * (1 - k);
    return prev;
  });
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / p;
  if (frac <= 1.5) return p;
  if (frac <= 3.5) return 2 * p;
  if (frac <= 7.5) return 5 * p;
  return 10 * p;
}

// ----- Amaterasu Neo-Solar Canvas Chart -----
function mountChart(el, timeframe = 'M15', tfMult = 1) {
  el.innerHTML = '';
  const cv = document.createElement('canvas');
  el.appendChild(cv);
  const ctx = cv.getContext('2d');

  let data = [];
  const n = 42;

  function regen() {
    const r = rng('amaterasu:' + timeframe + ':' + dateKey());
    let p = Market.price - 8.5;
    data = [];
    const vol = 0.55 * tfMult;
    for (let i = 0; i < 75; i++) {
      const dir = (r() - 0.49) * 2;
      const step = dir * vol * (0.8 + r() * 0.5);
      const o = p;
      p = Math.max(3980, p + step);
      const h = Math.max(o, p) + r() * vol * 0.85;
      const l = Math.min(o, p) - r() * vol * 0.85;
      data.push({ o, h, l, c: p });
    }
    data[data.length - 1].c = Market.price;
    draw();
  }

  function pill(x, y, text, col, pw) {
    ctx.font = '600 10.5px Space Grotesk, sans-serif';
    const m = ctx.measureText(text), w = m.width + 12;
    const px = Math.min(pw - w - 4, Math.max(4, x - w / 2));
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px, y - 9, w, 18, 4) : ctx.rect(px, y - 9, w, 18);
    ctx.fill();
    ctx.fillStyle = '#06070a';
    ctx.fillText(text, px + 6, y + 0.5);
  }

  function draw() {
    const W = el.clientWidth;
    if (!W || !data.length) return;
    const H = Math.round(Math.min(380, W * 0.85));
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const axisW = 68, pw = W - axisW;
    const emaAll = ema(data.map(d => d.c), 12);
    const off = data.length - n, vis = data.slice(off), ev = emaAll.slice(off);
    const rawHi = Math.max(...vis.map(d => d.h)), rawLo = Math.min(...vis.map(d => d.l));
    const hiI = vis.findIndex(d => d.h === rawHi), loI = vis.findIndex(d => d.l === rawLo);
    const range = rawHi - rawLo, hi = rawHi + range * 0.16, lo = rawLo - range * 0.16;
    const Y = v => ((hi - v) / (hi - lo)) * H;
    const cw = pw / n, X = i => i * cw + cw / 2;

    ctx.clearRect(0, 0, W, H);

    // Grid + price axis
    ctx.font = '10.5px Space Grotesk, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    const step = niceStep((hi - lo) / 5);
    for (let v = Math.ceil(lo / step) * step; v < hi; v += step) {
      const y = Math.round(Y(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(pw, y); ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillText(num(v), pw + 8, y);
    }
    for (let i = 0; i < n; i += Math.ceil(n / 5)) {
      const x = Math.round(X(i)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(pw + 0.5, 0); ctx.lineTo(pw + 0.5, H); ctx.stroke();

    // Institutional Liquidity Zones (Solar Supply & Solar Demand)
    const zone = (i, top, bot, rgb, label) => {
      const x0 = Math.max(0, X(i) - cw / 2), y0 = Y(top), y1 = Y(bot);
      ctx.fillStyle = `rgba(${rgb},0.12)`; ctx.fillRect(x0, y0, pw - x0, y1 - y0);
      ctx.strokeStyle = `rgba(${rgb},0.55)`; ctx.strokeRect(x0 + 0.5, y0 + 0.5, pw - x0 - 1, y1 - y0);
      ctx.fillStyle = `rgba(${rgb},0.95)`; ctx.font = '10px Outfit, sans-serif';
      ctx.fillText(label, x0 + 5, y0 + 10);
    };
    zone(hiI, rawHi, rawHi - range * 0.08, '255,35,68', 'Solar Supply · Liquid');
    zone(loI, rawLo + range * 0.07, rawLo, '0,230,118', 'Solar Demand · Absorbed');

    // Candlesticks
    const bw = Math.max(2, cw * 0.65);
    vis.forEach((k, i) => {
      const isUp = k.c >= k.o;
      const col = isUp ? '#00e676' : '#ff1744';
      const x = X(i);
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
      const yt = Y(Math.max(k.o, k.c)), yb = Y(Math.min(k.o, k.c));
      ctx.fillRect(x - bw / 2, yt, bw, Math.max(1.5, yb - yt));
    });

    // EMA Ray (Gold above, Amber below)
    ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = ev[i] > vis[i].c ? '#ff3b30' : '#ffc107';
      ctx.beginPath(); ctx.moveTo(X(i - 1), Y(ev[i - 1])); ctx.lineTo(X(i), Y(ev[i])); ctx.stroke();
    }
    ctx.lineWidth = 1;

    // High / Low Indicators
    pill(X(hiI), Y(rawHi) - 18, `H: ${num(rawHi)}`, '#ff1744', pw);
    pill(X(loI), Y(rawLo) + 18, `L: ${num(rawLo)}`, '#00e676', pw);

    // Current Live Price Tracker
    const last = vis[vis.length - 1], yp = Y(last.c);
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.beginPath(); ctx.moveTo(0, yp); ctx.lineTo(pw, yp); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00e5ff'; ctx.fillRect(pw + 1, yp - 9, axisW - 1, 18);
    ctx.fillStyle = '#06070a'; ctx.font = '700 10.5px Space Grotesk, sans-serif';
    ctx.fillText(num(last.c), pw + 6, yp + 0.5);
  }

  const onTick = p => { const L = data[data.length - 1]; if (!L) return; L.c = p; L.h = Math.max(L.h, p); L.l = Math.min(L.l, p); draw(); };
  const onResize = () => draw();
  Market.subs.add(onTick);
  window.addEventListener('resize', onResize);
  regen();
  return () => { Market.subs.delete(onTick); window.removeEventListener('resize', onResize); };
}

// ----- Amaterasu 100% SNR / Supply & Demand Canvas Chart (Multi-Asset Capable) -----
const INSTRUMENT_SNR_CONFIGS = {
  XAUUSD: {
    symbol: 'XAUUSD', name: 'Gold', base: 3995.81, range: 35.0, decimals: 2, gridInterval: 2.50,
    viewMin: 3980.00, viewMax: 4016.00,
    refPrice: 3996.20, liveStart: 3995.81,
    supplyTop: 4012.50, supplyBot: 4008.00, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 4004.80, supplyMidBot: 4001.00, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 3991.00, demandMidBot: 3988.50, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 3986.50, demand1Bot: 3984.00, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 3981.50, demandBotBot: 3978.80, demandBotLabel: 'Demand · Fresh'
  },
  EURUSD: {
    symbol: 'EURUSD', name: 'Euro', base: 1.1203, range: 0.0080, decimals: 4, gridInterval: 0.0010,
    viewMin: 1.1160, viewMax: 1.1245,
    refPrice: 1.1205, liveStart: 1.1203,
    supplyTop: 1.1238, supplyBot: 1.1225, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 1.1218, supplyMidBot: 1.1210, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 1.1188, demandMidBot: 1.1180, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 1.1175, demand1Bot: 1.1168, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 1.1162, demandBotBot: 1.1155, demandBotLabel: 'Demand · Fresh'
  },
  GBPJPY: {
    symbol: 'GBPJPY', name: 'Pound / Yen', base: 209.718, range: 2.50, decimals: 3, gridInterval: 0.30,
    viewMin: 208.500, viewMax: 211.000,
    refPrice: 209.850, liveStart: 209.718,
    supplyTop: 210.650, supplyBot: 210.200, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 209.950, supplyMidBot: 209.750, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 209.150, demandMidBot: 208.850, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 208.800, demand1Bot: 208.650, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 208.550, demandBotBot: 208.380, demandBotLabel: 'Demand · Fresh'
  },
  GBPUSD: {
    symbol: 'GBPUSD', name: 'Cable', base: 1.3371, range: 0.0100, decimals: 4, gridInterval: 0.0012,
    viewMin: 1.3320, viewMax: 1.3420,
    refPrice: 1.3375, liveStart: 1.3371,
    supplyTop: 1.3415, supplyBot: 1.3400, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 1.3388, supplyMidBot: 1.3380, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 1.3350, demandMidBot: 1.3340, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 1.3335, demand1Bot: 1.3328, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 1.3322, demandBotBot: 1.3315, demandBotLabel: 'Demand · Fresh'
  },
  USDJPY: {
    symbol: 'USDJPY', name: 'Dollar / Yen', base: 156.831, range: 2.20, decimals: 3, gridInterval: 0.25,
    viewMin: 155.600, viewMax: 157.800,
    refPrice: 156.900, liveStart: 156.831,
    supplyTop: 157.600, supplyBot: 157.300, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 157.050, supplyMidBot: 156.900, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 156.400, demandMidBot: 156.200, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 156.050, demand1Bot: 155.850, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 155.700, demandBotBot: 155.500, demandBotLabel: 'Demand · Fresh'
  },
  WTI: {
    symbol: 'WTI', name: 'Crude Oil', base: 103.27, range: 3.80, decimals: 2, gridInterval: 0.50,
    viewMin: 101.40, viewMax: 105.20,
    refPrice: 103.35, liveStart: 103.27,
    supplyTop: 104.80, supplyBot: 104.30, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 103.85, supplyMidBot: 103.55, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 102.60, demandMidBot: 102.25, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 102.10, demand1Bot: 101.80, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 101.60, demandBotBot: 101.30, demandBotLabel: 'Demand · Fresh'
  },
  BTCUSD: {
    symbol: 'BTCUSD', name: 'Bitcoin', base: 80404, range: 2500, decimals: 0, gridInterval: 350,
    viewMin: 79000, viewMax: 82000,
    refPrice: 80500, liveStart: 80404,
    supplyTop: 81850, supplyBot: 81450, supplyLabel: 'Supply · Tested 2×',
    supplyMidTop: 81100, supplyMidBot: 80850, supplyMidLabel: 'Supply · Fresh',
    demandMidTop: 80100, demandMidBot: 79750, demandMidLabel: 'Demand · Tested 2×',
    demand1Top: 79650, demand1Bot: 79350, demand1Label: 'Demand · Tested 1×',
    demandBotTop: 79250, demandBotBot: 78900, demandBotLabel: 'Demand · Fresh'
  }
};

// Multi-Timeframe Patterns for SNR Engine
const TIMEFRAME_PATTERNS = {
  M1: {
    timeCols: [{ xPct: 0.18, label: '09:48' }, { xPct: 0.58, label: '09:58' }, { xPct: 0.96, label: '10:06' }],
    candles: [
      { o: 4022.2, h: 4023.2, l: 4021.8, c: 4022.8 },
      { o: 4022.8, h: 4023.6, l: 4022.4, c: 4023.4 },
      { o: 4023.4, h: 4024.90, l: 4023.1, c: 4024.5, isHigh2: true, dashToIdx: 6 },
      { o: 4024.5, h: 4024.8, l: 4023.0, c: 4023.2 },
      { o: 4023.2, h: 4023.5, l: 4021.5, c: 4021.8 },
      { o: 4021.8, h: 4022.0, l: 4020.2, c: 4020.5 },
      { o: 4020.5, h: 4021.0, l: 4019.45, c: 4019.8, isLow1: true },
      { o: 4019.8, h: 4021.2, l: 4019.5, c: 4020.8 },
      { o: 4020.8, h: 4021.5, l: 4018.80, c: 4019.2, isLow2: true, dashToIdx: 14 },
      { o: 4019.2, h: 4021.5, l: 4019.0, c: 4021.0 },
      { o: 4021.0, h: 4022.8, l: 4020.6, c: 4022.4 },
      { o: 4022.4, h: 4023.8, l: 4022.0, c: 4023.5 },
      { o: 4023.5, h: 4025.2, l: 4023.2, c: 4024.8 },
      { o: 4024.8, h: 4026.85, l: 4024.5, c: 4026.2, isHigh1: true, dashToIdx: 21 },
      { o: 4026.2, h: 4026.5, l: 4024.8, c: 4025.2 },
      { o: 4025.2, h: 4025.5, l: 4023.8, c: 4024.0 },
      { o: 4024.0, h: 4024.4, l: 4022.40, c: 4022.8, isLowLive: true },
      { o: 4022.8, h: 4023.5, l: 4022.5, c: 4023.2 },
      { o: 4023.2, h: 4024.0, l: 4022.8, c: 4023.87, isLive: true }
    ]
  },
  M3: {
    // Exact 28-candlestick trajectory from media_1792799162583.jpg (Gambar Pertama)
    timeCols: [{ xPct: 0.20, label: '07:30' }, { xPct: 0.77, label: '09:00' }, { xPct: 0.96, label: '10:06' }],
    candles: [
      { o: 4016.2, h: 4016.9, l: 4014.2, c: 4014.8 },
      { o: 4014.8, h: 4016.5, l: 4014.5, c: 4016.0 },
      { o: 4016.0, h: 4016.8, l: 4014.6, c: 4015.2 },
      { o: 4015.2, h: 4017.0, l: 4014.8, c: 4016.6 },
      { o: 4016.6, h: 4018.2, l: 4016.0, c: 4017.8 },
      { o: 4017.8, h: 4021.79, l: 4017.2, c: 4020.2, isHigh2: true, dashToIdx: 10 },
      { o: 4020.2, h: 4020.5, l: 4017.5, c: 4018.0 },
      { o: 4018.0, h: 4018.5, l: 4015.2, c: 4015.8 },
      { o: 4015.8, h: 4016.2, l: 4013.6, c: 4014.0 },
      { o: 4014.0, h: 4016.0, l: 4013.8, c: 4015.5 },
      { o: 4015.5, h: 4015.8, l: 4012.8, c: 4013.2 },
      { o: 4013.2, h: 4013.5, l: 4011.48, c: 4011.8, isLow1: true },
      { o: 4011.8, h: 4013.8, l: 4011.5, c: 4013.2 },
      { o: 4013.2, h: 4013.5, l: 4009.47, c: 4010.2, isLow2: true, dashToIdx: 19 },
      { o: 4010.2, h: 4013.8, l: 4010.0, c: 4013.2 },
      { o: 4013.2, h: 4016.8, l: 4012.9, c: 4016.2 },
      { o: 4016.2, h: 4016.8, l: 4014.8, c: 4015.5 },
      { o: 4015.5, h: 4021.2, l: 4015.2, c: 4020.8 },
      { o: 4020.8, h: 4024.5, l: 4020.4, c: 4024.0 },
      { o: 4024.0, h: 4027.5, l: 4023.6, c: 4027.0 },
      { o: 4027.0, h: 4029.8, l: 4026.5, c: 4029.2 },
      { o: 4029.2, h: 4030.88, l: 4027.8, c: 4028.6, isHigh1: true, dashToIdx: 26 },
      { o: 4028.6, h: 4028.9, l: 4025.8, c: 4026.2 },
      { o: 4026.2, h: 4026.6, l: 4024.0, c: 4024.5 },
      { o: 4024.5, h: 4024.8, l: 4022.6, c: 4023.0 },
      { o: 4023.0, h: 4023.4, l: 4020.62, c: 4021.5, isLowLive: true },
      { o: 4021.5, h: 4023.2, l: 4021.2, c: 4022.8 },
      { o: 4022.8, h: 4024.1, l: 4022.4, c: 4023.87, isLive: true }
    ]
  },
  M5: {
    timeCols: [{ xPct: 0.22, label: '08:00' }, { xPct: 0.62, label: '09:00' }, { xPct: 0.96, label: '10:05' }],
    candles: [
      { o: 4018.0, h: 4020.5, l: 4016.8, c: 4019.5 },
      { o: 4019.5, h: 4023.2, l: 4019.0, c: 4022.5 },
      { o: 4022.5, h: 4026.50, l: 4022.0, c: 4025.8, isHigh2: true, dashToIdx: 7 },
      { o: 4025.8, h: 4026.0, l: 4021.2, c: 4021.8 },
      { o: 4021.8, h: 4022.5, l: 4017.5, c: 4018.0 },
      { o: 4018.0, h: 4018.8, l: 4013.80, c: 4014.5, isLow1: true },
      { o: 4014.5, h: 4016.2, l: 4010.20, c: 4011.0, isLow2: true, dashToIdx: 13 },
      { o: 4011.0, h: 4015.5, l: 4010.5, c: 4015.0 },
      { o: 4015.0, h: 4019.8, l: 4014.5, c: 4019.2 },
      { o: 4019.2, h: 4025.0, l: 4018.8, c: 4024.5 },
      { o: 4024.5, h: 4029.5, l: 4024.0, c: 4029.0 },
      { o: 4029.0, h: 4034.20, l: 4028.5, c: 4032.5, isHigh1: true, dashToIdx: 17 },
      { o: 4032.5, h: 4033.0, l: 4026.5, c: 4027.0 },
      { o: 4027.0, h: 4027.8, l: 4022.2, c: 4023.0 },
      { o: 4023.0, h: 4023.5, l: 4018.90, c: 4019.8, isLowLive: true },
      { o: 4019.8, h: 4022.5, l: 4019.5, c: 4022.0 },
      { o: 4022.0, h: 4024.2, l: 4021.6, c: 4023.87, isLive: true }
    ]
  },
  M15: {
    timeCols: [{ xPct: 0.20, label: '04:00' }, { xPct: 0.60, label: '07:00' }, { xPct: 0.96, label: '10:00' }],
    candles: [
      { o: 4012.0, h: 4018.5, l: 4010.0, c: 4017.0 },
      { o: 4017.0, h: 4025.0, l: 4016.2, c: 4024.2 },
      { o: 4024.2, h: 4031.20, l: 4023.5, c: 4029.5, isHigh2: true, dashToIdx: 6 },
      { o: 4029.5, h: 4030.0, l: 4018.5, c: 4019.2 },
      { o: 4019.2, h: 4020.5, l: 4005.50, c: 4006.8, isLow1: true },
      { o: 4006.8, h: 4012.0, l: 3998.20, c: 4002.5, isLow2: true, dashToIdx: 10 },
      { o: 4002.5, h: 4016.5, l: 4001.0, c: 4015.0 },
      { o: 4015.0, h: 4028.0, l: 4014.2, c: 4026.5 },
      { o: 4026.5, h: 4036.0, l: 4025.5, c: 4034.8 },
      { o: 4034.8, h: 4042.50, l: 4033.5, c: 4039.0, isHigh1: true, dashToIdx: 13 },
      { o: 4039.0, h: 4040.0, l: 4025.0, c: 4026.5 },
      { o: 4026.5, h: 4027.5, l: 4016.40, c: 4018.0, isLowLive: true },
      { o: 4018.0, h: 4024.5, l: 4017.5, c: 4023.87, isLive: true }
    ]
  },
  M30: {
    timeCols: [{ xPct: 0.20, label: '20:00' }, { xPct: 0.58, label: '03:00' }, { xPct: 0.96, label: '09:30' }],
    candles: [
      { o: 4005.0, h: 4020.0, l: 4002.0, c: 4018.0 },
      { o: 4018.0, h: 4035.00, l: 4016.0, c: 4032.0, isHigh2: true },
      { o: 4032.0, h: 4033.0, l: 4008.0, c: 4010.0 },
      { o: 4010.0, h: 4012.0, l: 3986.00, c: 3992.0, isLow1: true, dashToIdx: 6 },
      { o: 3992.0, h: 4018.0, l: 3990.0, c: 4015.0 },
      { o: 4015.0, h: 4032.0, l: 4012.0, c: 4030.0 },
      { o: 4030.0, h: 4048.00, l: 4028.0, c: 4044.0, isHigh1: true, dashToIdx: 9 },
      { o: 4044.0, h: 4045.0, l: 4020.0, c: 4022.0 },
      { o: 4022.0, h: 4023.0, l: 4014.50, c: 4016.5, isLowLive: true },
      { o: 4016.5, h: 4025.0, l: 4015.5, c: 4023.87, isLive: true }
    ]
  },
  H1: {
    timeCols: [{ xPct: 0.20, label: '22 Oct' }, { xPct: 0.58, label: '23 Oct' }, { xPct: 0.96, label: '24 Oct' }],
    candles: [
      { o: 3995.0, h: 4025.0, l: 3990.0, c: 4020.0 },
      { o: 4020.0, h: 4046.00, l: 4018.0, c: 4040.0, isHigh2: true },
      { o: 4040.0, h: 4042.0, l: 3998.0, c: 4002.0 },
      { o: 4002.0, h: 4005.0, l: 3960.00, c: 3975.0, isLow1: true, dashToIdx: 6 },
      { o: 3975.0, h: 4015.0, l: 3972.0, c: 4010.0 },
      { o: 4010.0, h: 4038.0, l: 4008.0, c: 4035.0 },
      { o: 4035.0, h: 4062.00, l: 4030.0, c: 4055.0, isHigh1: true, dashToIdx: 9 },
      { o: 4055.0, h: 4056.0, l: 4018.0, c: 4022.0 },
      { o: 4022.0, h: 4024.0, l: 4012.00, c: 4016.0, isLowLive: true },
      { o: 4016.0, h: 4026.0, l: 4015.0, c: 4023.87, isLive: true }
    ]
  },
  H4: {
    timeCols: [{ xPct: 0.20, label: '16 Oct' }, { xPct: 0.58, label: '20 Oct' }, { xPct: 0.96, label: '24 Oct' }],
    candles: [
      { o: 3960.0, h: 4030.0, l: 3950.0, c: 4022.0 },
      { o: 4022.0, h: 4055.00, l: 4015.0, c: 4048.0, isHigh2: true },
      { o: 4048.0, h: 4050.0, l: 3935.0, c: 3945.0 },
      { o: 3945.0, h: 3950.0, l: 3920.00, c: 3930.0, isLow1: true, dashToIdx: 6 },
      { o: 3930.0, h: 4020.0, l: 3925.0, c: 4010.0 },
      { o: 4010.0, h: 4088.00, l: 4005.0, c: 4075.0, isHigh1: true, dashToIdx: 7 },
      { o: 4075.0, h: 4078.0, l: 4015.0, c: 4020.0 },
      { o: 4020.0, h: 4025.0, l: 4005.00, c: 4023.87, isLive: true }
    ]
  },
  D1: {
    timeCols: [{ xPct: 0.20, label: 'Aug' }, { xPct: 0.58, label: 'Sep' }, { xPct: 0.96, label: 'Oct' }],
    candles: [
      { o: 3920.0, h: 4040.0, l: 3900.0, c: 4025.0 },
      { o: 4025.0, h: 4075.00, l: 4010.0, c: 4060.0, isHigh2: true },
      { o: 4060.0, h: 4065.0, l: 3860.0, c: 3875.0 },
      { o: 3875.0, h: 3880.0, l: 3850.00, c: 3865.0, isLow1: true, dashToIdx: 5 },
      { o: 3865.0, h: 4030.0, l: 3860.0, c: 4015.0 },
      { o: 4015.0, h: 4120.00, l: 4010.0, c: 4100.0, isHigh1: true, dashToIdx: 7 },
      { o: 4100.0, h: 4105.0, l: 4010.0, c: 4018.0 },
      { o: 4018.0, h: 4028.0, l: 3995.00, c: 4023.87, isLive: true }
    ]
  }
};

// Authentic Dedicated Candlestick Trajectories for Every Single Pair (No Two Pairs Look Alike)
const INSTRUMENT_BASE_PATTERNS = {
  XAUUSD: TIMEFRAME_PATTERNS.M3.candles,
  EURUSD: [
    { o: 1.08580, h: 1.08630, l: 1.08550, c: 1.08610 },
    { o: 1.08610, h: 1.08650, l: 1.08590, c: 1.08640 },
    { o: 1.08640, h: 1.08710, l: 1.08620, c: 1.08690, isHigh2: true, dashToIdx: 8 },
    { o: 1.08690, h: 1.08700, l: 1.08630, c: 1.08640 },
    { o: 1.08640, h: 1.08660, l: 1.08570, c: 1.08590 },
    { o: 1.08590, h: 1.08610, l: 1.08510, c: 1.08530 },
    { o: 1.08530, h: 1.08560, l: 1.08470, c: 1.08490 },
    { o: 1.08490, h: 1.08520, l: 1.08430, c: 1.08440 },
    { o: 1.08440, h: 1.08480, l: 1.08380, c: 1.08400, isLow1: true, dashToIdx: 14 },
    { o: 1.08400, h: 1.08460, l: 1.08390, c: 1.08450 },
    { o: 1.08450, h: 1.08520, l: 1.08430, c: 1.08500 },
    { o: 1.08500, h: 1.08580, l: 1.08490, c: 1.08560 },
    { o: 1.08560, h: 1.08630, l: 1.08550, c: 1.08610 },
    { o: 1.08610, h: 1.08670, l: 1.08590, c: 1.08650 },
    { o: 1.08650, h: 1.08750, l: 1.08630, c: 1.08720, isHigh1: true, dashToIdx: 19 },
    { o: 1.08720, h: 1.08730, l: 1.08650, c: 1.08660 },
    { o: 1.08660, h: 1.08680, l: 1.08580, c: 1.08600 },
    { o: 1.08600, h: 1.08620, l: 1.08520, c: 1.08540 },
    { o: 1.08540, h: 1.08560, l: 1.08450, c: 1.08470, isLow2: true },
    { o: 1.08470, h: 1.08510, l: 1.08460, c: 1.08490 },
    { o: 1.08490, h: 1.08540, l: 1.08480, c: 1.08520 },
    { o: 1.08520, h: 1.08540, l: 1.08480, c: 1.08500, isLive: true }
  ],
  GBPJPY: [
    { o: 209.100, h: 209.350, l: 208.950, c: 209.250 },
    { o: 209.250, h: 209.600, l: 209.150, c: 209.500 },
    { o: 209.500, h: 209.950, l: 209.400, c: 209.850 },
    { o: 209.850, h: 210.450, l: 209.750, c: 210.350, isHigh1: true, dashToIdx: 10 },
    { o: 210.350, h: 210.400, l: 209.800, c: 209.900 },
    { o: 209.900, h: 210.050, l: 209.450, c: 209.500 },
    { o: 209.500, h: 209.650, l: 209.100, c: 209.200 },
    { o: 209.200, h: 209.300, l: 208.750, c: 208.850, isLow1: true, dashToIdx: 14 },
    { o: 208.850, h: 209.250, l: 208.800, c: 209.150 },
    { o: 209.150, h: 209.550, l: 209.050, c: 209.450 },
    { o: 209.450, h: 209.900, l: 209.350, c: 209.800 },
    { o: 209.800, h: 210.150, l: 209.700, c: 209.950, isHigh2: true },
    { o: 209.950, h: 210.000, l: 209.500, c: 209.550 },
    { o: 209.550, h: 209.750, l: 209.350, c: 209.400 },
    { o: 209.400, h: 209.500, l: 209.150, c: 209.250, isLow2: true },
    { o: 209.250, h: 209.700, l: 209.200, c: 209.600 },
    { o: 209.600, h: 209.850, l: 209.500, c: 209.646, isLive: true }
  ],
  GBPUSD: [
    { o: 1.29350, h: 1.29420, l: 1.29310, c: 1.29390 },
    { o: 1.29390, h: 1.29480, l: 1.29360, c: 1.29450 },
    { o: 1.29450, h: 1.29550, l: 1.29420, c: 1.29520 },
    { o: 1.29520, h: 1.29620, l: 1.29480, c: 1.29580 },
    { o: 1.29580, h: 1.29600, l: 1.29450, c: 1.29490, isLow1: true },
    { o: 1.29490, h: 1.29680, l: 1.29470, c: 1.29650 },
    { o: 1.29650, h: 1.29780, l: 1.29620, c: 1.29750 },
    { o: 1.29750, h: 1.29880, l: 1.29720, c: 1.29840 },
    { o: 1.29840, h: 1.29950, l: 1.29800, c: 1.29910, isHigh2: true },
    { o: 1.29910, h: 1.29930, l: 1.29780, c: 1.29800 },
    { o: 1.29800, h: 1.29850, l: 1.29680, c: 1.29720, isLow2: true, dashToIdx: 14 },
    { o: 1.29720, h: 1.29890, l: 1.29700, c: 1.29860 },
    { o: 1.29860, h: 1.29980, l: 1.29820, c: 1.29950 },
    { o: 1.29950, h: 1.30080, l: 1.29920, c: 1.30050, isHigh1: true, dashToIdx: 17 },
    { o: 1.30050, h: 1.30060, l: 1.29900, c: 1.29920 },
    { o: 1.29920, h: 1.29950, l: 1.29820, c: 1.29850 },
    { o: 1.29850, h: 1.29880, l: 1.29760, c: 1.29800, isLive: true }
  ],
  USDJPY: [
    { o: 156.950, h: 157.180, l: 156.900, c: 157.120, isHigh1: true },
    { o: 157.120, h: 157.150, l: 156.750, c: 156.800 },
    { o: 156.800, h: 156.950, l: 156.550, c: 156.620 },
    { o: 156.620, h: 156.750, l: 156.350, c: 156.400 },
    { o: 156.400, h: 156.580, l: 156.250, c: 156.320 },
    { o: 156.320, h: 156.650, l: 156.300, c: 156.550, isHigh2: true },
    { o: 156.550, h: 156.600, l: 156.100, c: 156.150 },
    { o: 156.150, h: 156.250, l: 155.820, c: 155.880, isLow1: true, dashToIdx: 11 },
    { o: 155.880, h: 156.150, l: 155.850, c: 156.080 },
    { o: 156.080, h: 156.320, l: 156.020, c: 156.250 },
    { o: 156.250, h: 156.350, l: 155.950, c: 156.000 },
    { o: 156.000, h: 156.150, l: 155.880, c: 155.920, isLow2: true },
    { o: 155.920, h: 156.180, l: 155.900, c: 156.120 },
    { o: 156.120, h: 156.220, l: 156.050, c: 156.102, isLive: true }
  ],
  WTI: [
    { o: 71.85, h: 72.10, l: 71.60, c: 71.70 },
    { o: 71.70, h: 71.80, l: 71.10, c: 71.25 },
    { o: 71.25, h: 71.40, l: 70.65, c: 70.80 },
    { o: 70.80, h: 70.95, l: 70.18, c: 70.25, isLow1: true, dashToIdx: 7 },
    { o: 70.25, h: 70.85, l: 70.20, c: 70.75 },
    { o: 70.75, h: 71.15, l: 70.65, c: 71.05 },
    { o: 71.05, h: 71.10, l: 70.50, c: 70.60 },
    { o: 70.60, h: 70.70, l: 70.15, c: 70.22, isLow2: true },
    { o: 70.22, h: 70.90, l: 70.20, c: 70.85 },
    { o: 70.85, h: 71.45, l: 70.75, c: 71.35 },
    { o: 71.35, h: 71.95, l: 71.25, c: 71.80 },
    { o: 71.80, h: 72.55, l: 71.70, c: 72.40, isHigh1: true, dashToIdx: 15 },
    { o: 72.40, h: 72.45, l: 71.85, c: 71.95 },
    { o: 71.95, h: 72.10, l: 71.60, c: 71.70 },
    { o: 71.70, h: 71.85, l: 71.35, c: 71.45 },
    { o: 71.45, h: 71.65, l: 71.40, c: 71.50, isLive: true }
  ],
  BTCUSD: [
    { o: 81150, h: 81400, l: 80900, c: 81250 },
    { o: 81250, h: 81350, l: 80600, c: 80750 },
    { o: 80750, h: 80950, l: 80380, c: 80450, isLow1: true, dashToIdx: 6 },
    { o: 80450, h: 81200, l: 80400, c: 81100 },
    { o: 81100, h: 81850, l: 81000, c: 81750 },
    { o: 81750, h: 82350, l: 81650, c: 82250 },
    { o: 82250, h: 82750, l: 82150, c: 82650, isHigh1: true, dashToIdx: 12 },
    { o: 82650, h: 82700, l: 82100, c: 82200 },
    { o: 82200, h: 82400, l: 81750, c: 81850 },
    { o: 81850, h: 82000, l: 81450, c: 81550, isLow2: true },
    { o: 81550, h: 81950, l: 81500, c: 81850 },
    { o: 81850, h: 81920, l: 81620, c: 81700, isLive: true }
  ]
};

function mountSNRChart(container, defaultTf = 'M3', initSymbol = 'XAUUSD') {
  container.innerHTML = '';
  const cv = document.createElement('canvas');
  cv.style.touchAction = 'none';
  container.appendChild(cv);
  const ctx = cv.getContext('2d');

  let currentSymbol = initSymbol || 'XAUUSD';
  let cfg = INSTRUMENT_SNR_CONFIGS[currentSymbol] || INSTRUMENT_SNR_CONFIGS.XAUUSD;
  let currentTf = defaultTf || 'M3';
  let zoomX = 1.0;
  let panX = 0;
  let zoomY = 1.0;
  let panY = 0;
  let rawCandles = [];

  // Helper for thousands formatting
  function fmtPrice(val, dec) {
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }

  let historyCount = 0;
  let baseCount = 28;

  function generateHistoricalCandles(count, firstCandleOpen, curTf, symbolCfg, symbol) {
    const base = symbolCfg.base || 4020.0;
    const amp = symbolCfg.range * 0.28;
    let curOpen = firstCandleOpen;
    const hist = [];

    // Unique harmonic market characteristics per instrument
    const symSeed = {
      XAUUSD: { f1: 0.14, f2: 0.05, f3: 2.7, w1: 0.65, w2: 0.35, noise: 0.12, wick: 0.10 },
      EURUSD: { f1: 0.28, f2: 0.11, f3: 1.8, w1: 0.50, w2: 0.50, noise: 0.06, wick: 0.05 },
      GBPJPY: { f1: 0.19, f2: 0.07, f3: 3.5, w1: 0.75, w2: 0.25, noise: 0.18, wick: 0.16 },
      GBPUSD: { f1: 0.22, f2: 0.09, f3: 2.1, w1: 0.55, w2: 0.45, noise: 0.07, wick: 0.06 },
      USDJPY: { f1: 0.16, f2: 0.04, f3: 2.4, w1: 0.70, w2: 0.30, noise: 0.09, wick: 0.08 },
      WTI:    { f1: 0.24, f2: 0.08, f3: 2.9, w1: 0.60, w2: 0.40, noise: 0.14, wick: 0.12 },
      BTCUSD: { f1: 0.10, f2: 0.03, f3: 4.2, w1: 0.85, w2: 0.15, noise: 0.25, wick: 0.22 }
    }[symbol] || { f1: 0.14, f2: 0.05, f3: 2.7, w1: 0.65, w2: 0.35, noise: 0.12, wick: 0.10 };

    for (let k = 1; k <= count; k++) {
      const wave = Math.sin(k * symSeed.f1) * (amp * symSeed.w1) + Math.cos(k * symSeed.f2) * (amp * symSeed.w2);
      const microNoise = Math.sin(k * symSeed.f3) * (amp * symSeed.noise);
      const targetO = base + wave + microNoise;

      const c = curOpen;
      const o = targetO;
      const bMax = Math.max(o, c);
      const bMin = Math.min(o, c);
      const wickTop = Math.abs(Math.sin(k * (symSeed.f3 + 0.4))) * (amp * symSeed.wick) + (amp * 0.02);
      const wickBot = Math.abs(Math.cos(k * (symSeed.f3 + 1.2))) * (amp * symSeed.wick) + (amp * 0.02);
      const h = bMax + wickTop;
      const l = bMin - wickBot;

      hist.unshift({
        o: Number(o.toFixed(symbolCfg.decimals)),
        h: Number(h.toFixed(symbolCfg.decimals)),
        l: Number(l.toFixed(symbolCfg.decimals)),
        c: Number(c.toFixed(symbolCfg.decimals))
      });

      curOpen = o;
    }

    return hist;
  }

  function getEffectiveConfig() {
    const rawCfg = INSTRUMENT_SNR_CONFIGS[currentSymbol] || INSTRUMENT_SNR_CONFIGS.XAUUSD;
    const liveP = Market.getLivePrice(currentSymbol) || (currentSymbol === 'XAUUSD' ? Market.price : rawCfg.base);
    const shift = (currentSymbol === 'XAUUSD') ? (liveP - 4023.87) : (liveP - rawCfg.base);
    return {
      ...rawCfg,
      livePrice: liveP,
      shift: shift,
      viewMin: rawCfg.viewMin + shift,
      viewMax: rawCfg.viewMax + shift,
      refPrice: rawCfg.refPrice + shift,
      supplyTop: rawCfg.supplyTop + shift,
      supplyBot: rawCfg.supplyBot + shift,
      supplyMidTop: rawCfg.supplyMidTop !== undefined ? rawCfg.supplyMidTop + shift : undefined,
      supplyMidBot: rawCfg.supplyMidBot !== undefined ? rawCfg.supplyMidBot + shift : undefined,
      demandMidTop: rawCfg.demandMidTop !== undefined ? rawCfg.demandMidTop + shift : undefined,
      demandMidBot: rawCfg.demandMidBot !== undefined ? rawCfg.demandMidBot + shift : undefined,
      demand1Top: rawCfg.demand1Top + shift,
      demand1Bot: rawCfg.demand1Bot + shift,
      demandBotTop: rawCfg.demandBotTop + shift,
      demandBotBot: rawCfg.demandBotBot + shift
    };
  }

  // Generate dynamic candles according to selected timeframe and symbol with deep historical backward data
  function generateBaseCandles() {
    const activeCfg = getEffectiveConfig();
    cfg = activeCfg;
    const shift = activeCfg.shift;

    let basePat;
    if (currentSymbol === 'XAUUSD') {
      const tfData = TIMEFRAME_PATTERNS[currentTf] || TIMEFRAME_PATTERNS.M3;
      basePat = tfData.candles;
    } else {
      basePat = INSTRUMENT_BASE_PATTERNS[currentSymbol] || TIMEFRAME_PATTERNS.M3.candles;
    }
    baseCount = basePat.length;

    const histCountByTf = {
      M1: 120, M3: 120, M5: 120, M15: 100, M30: 80, H1: 60, H4: 45, D1: 35
    };
    const desiredHistCount = histCountByTf[currentTf] || 100;

    const firstOpen = Number((basePat[0].o + shift).toFixed(cfg.decimals));
    const histCandles = generateHistoricalCandles(desiredHistCount, firstOpen, currentTf, { ...cfg, base: cfg.base + shift }, currentSymbol);
    historyCount = histCandles.length;

    const mappedBase = basePat.map(p => {
      let closeVal = p.c + shift;
      if (p.isLive) {
        closeVal = activeCfg.livePrice;
      }
      return {
        o: Number((p.o + shift).toFixed(cfg.decimals)),
        h: Number((p.h + shift).toFixed(cfg.decimals)),
        l: Number((p.l + shift).toFixed(cfg.decimals)),
        c: Number(closeVal.toFixed(cfg.decimals)),
        isHigh1: p.isHigh1,
        isHigh2: p.isHigh2,
        isLow1: p.isLow1,
        isLow2: p.isLow2,
        isLowLive: p.isLowLive,
        isLive: p.isLive,
        dashToIdx: p.dashToIdx
      };
    });

    const all = [...histCandles, ...mappedBase];

    // Compute realistic continuous timestamps for every candle
    const tfMins = {
      M1: 1, M3: 3, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440
    }[currentTf] || 3;

    const baseTimeMs = Date.parse('2026-10-24T10:06:00') || Date.now();
    const total = all.length;

    all.forEach((k, idx) => {
      const diffMins = (total - 1 - idx) * tfMins;
      const d = new Date(baseTimeMs - diffMins * 60 * 1000);
      k.timestamp = d;

      const pad = n => String(n).padStart(2, '0');
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = pad(d.getDate());
      const mon = months[d.getMonth()];

      if (currentTf === 'D1') {
        k.timeStr = `${day} ${mon}`;
      } else if (currentTf === 'H1' || currentTf === 'H4') {
        k.timeStr = `${day} ${mon} ${hh}:${mm}`;
      } else {
        k.timeStr = `${hh}:${mm}`;
      }
    });

    return all;
  }

  rawCandles = generateBaseCandles();

  function draw() {
    const isFs = container.classList.contains('fullscreen') || container.id === 'fsCanvasWrap';
    const W = isFs ? (container.clientWidth || window.innerWidth) : Math.min(440, container.clientWidth || 380);
    const H = isFs ? Math.max(380, (container.clientHeight || (window.innerHeight - 110))) : 460;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    cv.style.display = 'block';
    cv.style.margin = '0 auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cfg = getEffectiveConfig();
    const axisW = cfg.decimals >= 4 ? 76 : 64;
    const pw = W - axisW;
    const axisH = 26;
    const ph = H - axisH;

    // Horizontal candle positioning (Initial view frames the flagship base pattern, drag backward reveals historical candles)
    const baseCw = pw / baseCount;
    const cw = baseCw * zoomX;
    const X = i => (i - historyCount) * cw + cw / 2 + panX;

    // Dynamically calculate view boundaries based on the currently visible candles on screen
    let minCandleL = Infinity, maxCandleH = -Infinity;
    let visibleCount = 0;
    rawCandles.forEach((k, i) => {
      const x = X(i);
      if (x >= -cw && x <= pw + cw) {
        if (k.l < minCandleL) minCandleL = k.l;
        if (k.h > maxCandleH) maxCandleH = k.h;
        visibleCount++;
      }
    });

    if (visibleCount === 0 || minCandleL === Infinity) {
      minCandleL = cfg.viewMin;
      maxCandleH = cfg.viewMax;
    }

    let vMin, vMax;
    if (currentTf === 'M3' && currentSymbol === 'XAUUSD' && panX === 0 && zoomX === 1.0 && zoomY === 1.0) {
      vMin = cfg.viewMin;
      vMax = cfg.viewMax;
    } else {
      const pad = (maxCandleH - minCandleL) * 0.18;
      vMin = minCandleL - pad;
      vMax = maxCandleH + pad;
    }

    const span = (vMax - vMin) * zoomY;
    const mid = (vMax + vMin) / 2 + panY;
    const hi = mid + span / 2;
    const lo = mid - span / 2;
    const Y = v => ph - ((v - lo) / (hi - lo)) * ph;

    // Background matching Gambar Pertama dark slate navy
    ctx.fillStyle = '#0d141e';
    ctx.fillRect(0, 0, W, H);

    // Save and clip plot area [0, 0, pw, ph] so zoomed/panned candles never spill onto price axis
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();

    // Watermark: AMATERASU X · AI
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.font = '700 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AMATERASU X · AI', pw / 2, ph / 2);
    ctx.restore();

    // TradingView Logo Watermark at bottom left
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    const tvX = 14, tvY = ph - 28;
    ctx.fillRect(tvX, tvY, 6, 16);
    ctx.beginPath();
    ctx.moveTo(tvX + 8, tvY);
    ctx.lineTo(tvX + 14, tvY);
    ctx.lineTo(tvX + 19, tvY + 16);
    ctx.lineTo(tvX + 14, tvY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tvX + 20, tvY);
    ctx.lineTo(tvX + 26, tvY);
    ctx.lineTo(tvX + 19, tvY + 16);
    ctx.lineTo(tvX + 14, tvY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Prices for Dual Badges & Tracker Lines
    let pGreen = cfg.refPrice;
    if (!(currentTf === 'M3' && currentSymbol === 'XAUUSD')) {
      if (pGreen < lo || pGreen > hi) {
        pGreen = rawCandles[Math.floor(rawCandles.length * 0.75)].c;
      }
    }
    const pLive = rawCandles[rawCandles.length - 1].c;
    const yG = Y(pGreen);
    const yLive = Y(pLive);

    // ----------------------------------------------------
    // Institutional SNR (5 Supply & Demand Zones)
    // ----------------------------------------------------
    const drawZone = (topP, botP, type, label, alignRight = false, xStart = 0, xEnd = pw) => {
      if (topP === undefined || botP === undefined) return;
      const y0 = Math.max(0, Y(topP)), y1 = Math.min(ph, Y(botP));
      if (y1 <= 0 || y0 >= ph) return;
      const isSupply = type === 'supply';
      const fillCol = isSupply ? 'rgba(239, 83, 80, 0.12)' : 'rgba(38, 166, 154, 0.12)';
      const lineCol = isSupply ? 'rgba(239, 83, 80, 0.55)' : 'rgba(38, 166, 154, 0.55)';
      const textCol = isSupply ? '#ef5350' : '#26a69a';

      ctx.fillStyle = fillCol;
      ctx.fillRect(xStart, y0, xEnd - xStart, y1 - y0);

      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xStart, y0 + 0.5); ctx.lineTo(xEnd, y0 + 0.5);
      ctx.moveTo(xStart, y1 + 0.5); ctx.lineTo(xEnd, y1 + 0.5);
      ctx.stroke();

      ctx.fillStyle = textCol;
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      if (alignRight) {
        ctx.textAlign = 'right';
        ctx.fillText(label, xEnd - 8, y0 + 11);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText(label, xStart + 6, y0 + 11);
      }
    };

    // Render exact 5 zones
    let zSupplyTop = cfg.supplyTop, zSupplyBot = cfg.supplyBot, zSupplyLabel = cfg.supplyLabel;
    let zSupplyMidTop = cfg.supplyMidTop, zSupplyMidBot = cfg.supplyMidBot, zSupplyMidLabel = cfg.supplyMidLabel;
    let zDemandMidTop = cfg.demandMidTop, zDemandMidBot = cfg.demandMidBot, zDemandMidLabel = cfg.demandMidLabel;
    let zDemand1Top = cfg.demand1Top, zDemand1Bot = cfg.demand1Bot, zDemand1Label = cfg.demand1Label;
    let zDemandBotTop = cfg.demandBotTop, zDemandBotBot = cfg.demandBotBot, zDemandBotLabel = cfg.demandBotLabel;

    if (currentTf === 'M3') {
      zSupplyTop = cfg.supplyTop;
      zSupplyBot = cfg.supplyBot;
      zSupplyLabel = cfg.supplyLabel;
      zSupplyMidTop = cfg.supplyMidTop;
      zSupplyMidBot = cfg.supplyMidBot;
      zSupplyMidLabel = cfg.supplyMidLabel;
      zDemandMidTop = cfg.demandMidTop;
      zDemandMidBot = cfg.demandMidBot;
      zDemandMidLabel = cfg.demandMidLabel;
      zDemand1Top = cfg.demand1Top;
      zDemand1Bot = cfg.demand1Bot;
      zDemand1Label = cfg.demand1Label;
      zDemandBotTop = cfg.demandBotTop;
      zDemandBotBot = cfg.demandBotBot;
      zDemandBotLabel = cfg.demandBotLabel;
    } else {
      const rng = maxCandleH - minCandleL;
      zSupplyTop = maxCandleH + rng * 0.05;
      zSupplyBot = maxCandleH - rng * 0.05;
      zSupplyLabel = `Supply (${currentTf}) · Fresh`;

      zSupplyMidTop = maxCandleH - rng * 0.18;
      zSupplyMidBot = maxCandleH - rng * 0.26;
      zSupplyMidLabel = `Supply · Tested 1×`;

      zDemandMidTop = minCandleL + rng * 0.38;
      zDemandMidBot = minCandleL + rng * 0.30;
      zDemandMidLabel = `Demand · Tested 2×`;

      zDemand1Top = minCandleL + rng * 0.16;
      zDemand1Bot = minCandleL + rng * 0.08;
      zDemand1Label = `Demand · Tested 1×`;

      zDemandBotTop = minCandleL + rng * 0.02;
      zDemandBotBot = minCandleL - rng * 0.06;
      zDemandBotLabel = `Demand (${currentTf}) · Major`;
    }

    drawZone(zSupplyTop, zSupplyBot, 'supply', zSupplyLabel, false, 0, pw);
    drawZone(zSupplyMidTop, zSupplyMidBot, 'supply', zSupplyMidLabel, true, X(historyCount + Math.floor(baseCount * 0.7)), pw);
    drawZone(zDemandMidTop, zDemandMidBot, 'demand', zDemandMidLabel, false, 0, pw);
    drawZone(zDemand1Top, zDemand1Bot, 'demand', zDemand1Label, false, 0, pw);
    drawZone(zDemandBotTop, zDemandBotBot, 'demand', zDemandBotLabel, false, 0, pw);

    // ----------------------------------------------------
    // Candlesticks (Crisp 1px wicks & accurate bodies)
    // ----------------------------------------------------
    const bw = Math.max(3.5, cw * 0.65);

    rawCandles.forEach((k, i) => {
      const x = Math.round(X(i)) + 0.5;
      if (x < -bw || x > pw + bw) return;

      const isUp = k.c >= k.o;
      const col = isUp ? '#26a69a' : '#ef5350';

      // Wick
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x, Math.round(Y(k.h)));
      ctx.lineTo(x, Math.round(Y(k.l)));
      ctx.stroke();

      // Body
      const yt = Math.round(Y(Math.max(k.o, k.c)));
      const yb = Math.round(Y(Math.min(k.o, k.c)));
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x - bw / 2), yt, Math.round(bw), Math.max(2, yb - yt));
    });

    // ----------------------------------------------------
    // Dynamic Multi-Color EMA Line across full history
    // ----------------------------------------------------
    const emaVals = ema(rawCandles.map(c => c.c), Math.min(8, Math.floor(rawCandles.length / 5)));
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (let i = 1; i < rawCandles.length; i++) {
      const xPrev = X(i - 1);
      const xCur = X(i);
      if (xCur < -20 || xPrev > pw + 20) continue;

      let strokeCol = '#f5c451';
      if (currentTf === 'M3' && i >= historyCount) {
        const flagIdx = i - historyCount;
        if (flagIdx >= 6 && flagIdx <= 13) strokeCol = '#ef5350';
        else if (flagIdx === 14) strokeCol = '#f5c451';
        else if (flagIdx >= 15 && flagIdx <= 21) strokeCol = '#26a69a';
        else if (flagIdx === 22) strokeCol = '#f5c451';
        else if (flagIdx >= 23 && flagIdx <= 25) strokeCol = '#ef5350';
        else if (flagIdx >= 26) strokeCol = '#26a69a';
      } else {
        if (rawCandles[i].c >= emaVals[i]) strokeCol = '#26a69a';
        else strokeCol = '#ef5350';
      }

      ctx.strokeStyle = strokeCol;
      ctx.beginPath();
      ctx.moveTo(xPrev, Y(emaVals[i - 1]));
      ctx.lineTo(xCur, Y(emaVals[i]));
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // ----------------------------------------------------
    // High / Low Pill Badges, Wick Dots & Extension Dashed Lines
    // ----------------------------------------------------
    const drawHighLowPill = (x, yWick, text, type, dashToIdx, pillAlignLeft = false) => {
      const isHigh = type === 'high';
      const dotCol = isHigh ? '#ef5350' : '#26a69a';
      const pillBg = isHigh ? '#dc3545' : '#22c55e';

      // Wick tip circle dot
      ctx.fillStyle = dotCol;
      ctx.beginPath();
      ctx.arc(x, yWick, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Extension dashed line extending to specified candle
      if (dashToIdx !== undefined && dashToIdx > 0) {
        const xEnd = Math.min(pw - 2, X(dashToIdx));
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = isHigh ? 'rgba(239, 83, 80, 0.8)' : 'rgba(38, 166, 154, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, yWick);
        ctx.lineTo(xEnd, yWick);
        ctx.stroke();
        ctx.restore();
      }

      // Pill label badge
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      const m = ctx.measureText(text);
      const w = m.width + 12;
      const h = 18;
      const pillY = isHigh ? yWick - 19 : yWick + 6;
      let pillX = pillAlignLeft ? (x - w - 6) : (x - w / 2);
      pillX = Math.min(pw - w - 4, Math.max(4, pillX));

      ctx.fillStyle = pillBg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pillX, pillY, w, h, 4);
      else ctx.rect(pillX, pillY, w, h);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pillX + 6, pillY + h / 2 + 0.5);
    };

    rawCandles.forEach((k, i) => {
      const x = X(i);
      if (x < -60 || x > pw + 60) return;

      const isM3Flagship = currentTf === 'M3' && currentSymbol === 'XAUUSD' && i >= historyCount;
      const targetDashIdx = k.dashToIdx !== undefined ? (historyCount + k.dashToIdx) : undefined;

      if (k.isHigh1) {
        drawHighLowPill(x, Y(k.h), `High ${fmtPrice(k.h, cfg.decimals)}`, 'high', targetDashIdx, false);
      }
      if (k.isHigh2) {
        drawHighLowPill(x, Y(k.h), `High ${fmtPrice(k.h, cfg.decimals)}`, 'high', targetDashIdx, true);
      }
      if (k.isLowLive) {
        drawHighLowPill(x, Y(k.l), `Low ${fmtPrice(k.l, cfg.decimals)} · live`, 'low', undefined, false);
      }
      if (k.isLow1) {
        drawHighLowPill(x, Y(k.l), `Low ${fmtPrice(k.l, cfg.decimals)}`, 'low', undefined, false);
      }
      if (k.isLow2) {
        drawHighLowPill(x, Y(k.l), `Low ${fmtPrice(k.l, cfg.decimals)}`, 'low', targetDashIdx, false);
      }
    });

    // ----------------------------------------------------
    // Right Axis Price Badges & Dashed Trackers
    // ----------------------------------------------------
    // 1. Static/Reference Green Dashed Line
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#26a69a';
    ctx.beginPath();
    ctx.moveTo(0, yG);
    ctx.lineTo(pw, yG);
    ctx.stroke();

    // 2. Live Dynamic Yellow Dashed Line
    ctx.strokeStyle = '#f5c451';
    ctx.beginPath();
    ctx.moveTo(Math.max(0, X(rawCandles.length - 1)), yLive);
    ctx.lineTo(pw, yLive);
    ctx.stroke();
    ctx.setLineDash([]);

    // Restore plot clip area
    ctx.restore();

    // Dynamic grid intervals based on range
    let effectiveInterval;
    if (currentTf === 'M3' && currentSymbol === 'XAUUSD' && panX === 0 && zoomY === 1.0) {
      effectiveInterval = cfg.gridInterval;
    } else {
      const rawInt = (hi - lo) / 8;
      if (cfg.decimals >= 4) {
        effectiveInterval = 0.002;
      } else if (rawInt >= 100) {
        effectiveInterval = Math.round(rawInt / 50) * 50 || 50;
      } else if (rawInt >= 20) {
        effectiveInterval = Math.round(rawInt / 10) * 10 || 10;
      } else if (rawInt >= 4) {
        effectiveInterval = Math.round(rawInt / 2) * 2 || 2;
      } else {
        effectiveInterval = 1;
      }
    }

    // Horizontal Price Grid Lines & Axis Labels
    ctx.font = '10.5px "Space Grotesk", sans-serif';
    ctx.textBaseline = 'middle';
    const startP = Math.floor(lo / effectiveInterval) * effectiveInterval;
    for (let p = startP; p <= hi + effectiveInterval; p += effectiveInterval) {
      const y = Math.round(Y(p)) + 0.5;
      if (y > 4 && y < ph) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(pw, y);
        ctx.stroke();

        if (Math.abs(y - yG) > 9 && Math.abs(y - yLive) > 9) {
          ctx.fillStyle = '#607286';
          ctx.fillText(fmtPrice(p, cfg.decimals), pw + 6, y);
        }
      }
    }

    // Vertical Time Grid Lines according to visible candles (seamless forward & backward scrolling)
    let lastLabelX = -250;
    const minTimeSpacing = Math.max(72, 60 * zoomX);

    for (let i = 0; i < rawCandles.length; i++) {
      const x = Math.round(X(i)) + 0.5;
      if (x >= 28 && x <= pw - 28) {
        if (x - lastLabelX >= minTimeSpacing) {
          const k = rawCandles[i];
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, ph);
          ctx.stroke();

          ctx.fillStyle = '#607286';
          ctx.textAlign = 'center';
          ctx.fillText(k.timeStr || '', x, ph + 13);
          lastLabelX = x;
        }
      }
    }
    ctx.textAlign = 'left';

    // Right Axis Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(pw + 0.5, 0);
    ctx.lineTo(pw + 0.5, H);
    ctx.stroke();

    // Stacking of badges
    const badgeH = 17;
    const badgeYG = Math.round(yG - badgeH / 2);
    const badgeYLive = badgeYG + badgeH;

    // Green Reference Badge
    ctx.fillStyle = '#26a69a';
    ctx.fillRect(pw + 1, badgeYG, axisW - 2, badgeH);
    ctx.fillStyle = '#06070a';
    ctx.font = '700 10px "Space Grotesk", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmtPrice(pGreen, cfg.decimals), pw + 5, badgeYG + badgeH / 2 + 0.5);

    // Yellow Live Badge
    ctx.fillStyle = '#f5c451';
    ctx.fillRect(pw + 1, badgeYLive, axisW - 2, badgeH);
    ctx.fillStyle = '#06070a';
    ctx.font = '700 10px "Space Grotesk", sans-serif';
    ctx.fillText(fmtPrice(pLive, cfg.decimals), pw + 5, badgeYLive + badgeH / 2 + 0.5);
  }

  // Drag-to-Pan, Mouse Wheel, Touch Pinch Handlers
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let startPanX = 0, startPanY = 0;
  let initialPinchDist = 0;
  let initialPinchZoomX = 1.0;
  let initialPinchZoomY = 1.0;

  cv.style.cursor = 'grab';

  const onMouseDown = e => {
    isDragging = true;
    cv.style.cursor = 'grabbing';
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startPanX = panX;
    startPanY = panY;
  };

  const onMouseMove = e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const cw = (380 / baseCount) * zoomX;
    const maxPanX = historyCount * cw + 180;
    const minPanX = -180;
    panX = Math.max(minPanX, Math.min(maxPanX, startPanX + dx));
    const vSpan = (cfg.viewMax - cfg.viewMin) * zoomY;
    const pricePerPx = vSpan / 434;
    panY = startPanY + (dy * pricePerPx);
    draw();
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      cv.style.cursor = 'grab';
    }
  };

  const onWheel = e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    zoomX = Math.min(5.0, Math.max(0.45, zoomX * factor));
    zoomY = Math.min(4.0, Math.max(0.35, zoomY / factor));
    draw();
  };

  const onTouchStart = e => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      startPanX = panX;
      startPanY = panY;
      if (e.cancelable) e.preventDefault();
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      initialPinchZoomX = zoomX;
      initialPinchZoomY = zoomY;
      if (e.cancelable) e.preventDefault();
    }
  };

  const onTouchMove = e => {
    if (e.touches.length === 1 && isDragging) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      const cw = (380 / baseCount) * zoomX;
      const maxPanX = historyCount * cw + 180;
      const minPanX = -180;
      panX = Math.max(minPanX, Math.min(maxPanX, startPanX + dx));
      const vSpan = (cfg.viewMax - cfg.viewMin) * zoomY;
      const pricePerPx = vSpan / 434;
      panY = startPanY + (dy * pricePerPx);
      draw();
    } else if (e.touches.length === 2 && initialPinchDist > 0) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / initialPinchDist;
      zoomX = Math.min(5.0, Math.max(0.45, initialPinchZoomX * scale));
      zoomY = Math.min(4.0, Math.max(0.35, initialPinchZoomY / scale));
      draw();
    }
  };

  const onTouchEnd = () => {
    isDragging = false;
    initialPinchDist = 0;
  };

  const onDblClick = () => {
    zoomX = 1.0;
    panX = 0;
    zoomY = 1.0;
    panY = 0;
    draw();
  };

  cv.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  cv.addEventListener('wheel', onWheel, { passive: false });
  cv.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  cv.addEventListener('dblclick', onDblClick);

  // Ticking handler
  const onTick = p => {
    cfg = getEffectiveConfig();
    const liveP = Market.getLivePrice(currentSymbol) || (currentSymbol === 'XAUUSD' ? p : cfg.base);
    const last = rawCandles[rawCandles.length - 1];
    if (last) {
      last.c = Number(liveP.toFixed(cfg.decimals));
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
      draw();
    }
  };

  const onResize = () => draw();
  Market.subs.add(onTick);
  window.addEventListener('resize', onResize);

  // Initial draw
  draw();

  const chartApi = {
    setTf(tf) {
      currentTf = tf || 'M3';
      rawCandles = generateBaseCandles();
      draw();
    },
    setSymbol(newSymbol) {
      currentSymbol = newSymbol || 'XAUUSD';
      cfg = getEffectiveConfig();
      zoomX = 1.0;
      panX = 0;
      zoomY = 1.0;
      panY = 0;
      rawCandles = generateBaseCandles();
      draw();
    },
    zoomIn() {
      zoomX = Math.min(5.0, zoomX * 1.25);
      zoomY = Math.max(0.35, zoomY * 0.85);
      draw();
    },
    zoomOut() {
      zoomX = Math.max(0.45, zoomX * 0.8);
      zoomY = Math.min(4.0, zoomY * 1.18);
      draw();
    },
    reset() {
      zoomX = 1.0;
      panX = 0;
      zoomY = 1.0;
      panY = 0;
      currentTf = defaultTf || 'M3';
      rawCandles = generateBaseCandles();
      draw();
    },
    redraw() {
      rawCandles = generateBaseCandles();
      draw();
    },
    onLiveTick() {
      onTick(Market.getLivePrice(currentSymbol) || Market.price);
    },
    destroy() {
      Market.subs.delete(onTick);
      window.removeEventListener('resize', onResize);
      cv.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cv.removeEventListener('wheel', onWheel);
      cv.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      cv.removeEventListener('dblclick', onDblClick);
    }
  };

  window._activeSnrChart = chartApi;
  return chartApi;
}

