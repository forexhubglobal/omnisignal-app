// ===== Amaterasu AI Pages: Signal, Stat, Analysis, Screener, News, AI News =====

const ALL_INSTRUMENTS = [
  { id: 'XAUUSD', name: 'XAUUSD', category: 'Metals', icon: '🥇', label: 'Gold', basePrice: 3995.81, bias: 'BEARISH', m1: 'DOWN', m5: 'DOWN', m15: 'SIDE' },
  { id: 'EURUSD', name: 'EURUSD', category: 'Forex', icon: '💶', label: 'Euro', basePrice: 1.1203, bias: 'BEARISH', m1: 'DOWN', m5: 'SIDE', m15: 'DOWN' },
  { id: 'GBPJPY', name: 'GBPJPY', category: 'Forex', icon: '💷', label: 'Pound / Yen', basePrice: 209.718, bias: 'NEUTRAL', m1: 'SIDE', m5: 'DOWN', m15: 'UP' },
  { id: 'GBPUSD', name: 'GBPUSD', category: 'Forex', icon: '💷', label: 'Cable', basePrice: 1.3371, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'SIDE' },
  { id: 'USDJPY', name: 'USDJPY', category: 'Forex', icon: '💴', label: 'Dollar / Yen', basePrice: 156.831, bias: 'BEARISH', m1: 'DOWN', m5: 'DOWN', m15: 'DOWN' },
  { id: 'WTI', name: 'WTI', category: 'Commodities', icon: '🛢', label: 'Crude Oil', basePrice: 103.27, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'UP' },
  { id: 'US30', name: 'US30', category: 'Indices', icon: '📈', label: 'Dow Jones 30', basePrice: 52394.0, bias: 'BULLISH', m1: 'UP', m5: 'SIDE', m15: 'UP' },
  { id: 'NAS100', name: 'NAS100', category: 'Indices', icon: '💻', label: 'Nasdaq 100', basePrice: 29117.75, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'UP' },
  { id: 'BTCUSD', name: 'BTCUSD', category: 'Crypto', icon: '₿', label: 'Bitcoin', basePrice: 80404.0, bias: 'BULLISH', m1: 'SIDE', m5: 'UP', m15: 'UP' }
];

// ---------- 1. Signal ----------
function SignalPage(main) {
  let activeSymId = store.get('selected_signal_sym') || 'XAUUSD';
  let inst = ALL_INSTRUMENTS.find(i => i.id === activeSymId) || ALL_INSTRUMENTS[0];
  Market.activeSymbol = inst.id;
  Market.updateUI();

  const globalSig = (AppState && AppState.activeSignal) || { status: 'WAITING', type: 'BUY', symbol: 'XAUUSD', entry: 3995.81, tp1: 4004.00, tp2: 4015.00, sl: 3989.50 };

  const isLiveOrTp1 = globalSig.status === 'ACTIVE' || globalSig.status === 'TP1_HIT';
  const isCurrentAssetActive = isLiveOrTp1 && globalSig.symbol === inst.id;
  const isAnyActive = isLiveOrTp1;
  const isTp1 = globalSig.status === 'TP1_HIT';

  const lastRes = (AppState && AppState.lastResolvedSignal) || ((AppState && AppState.signals && AppState.signals[0])) || {
    symbol: 'GBPJPY',
    type: 'BUY',
    entry: 209.65,
    status: 'TP2',
    pips: 100,
    time: '06:45',
    date: 'Oct 25'
  };

  function getDisplayPrice() {
    const liveP = Market.getLivePrice(inst.id);
    if (liveP) return num(liveP);
    if (inst.id === 'XAUUSD') return num(Market.price);
    return num(inst.basePrice);
  }

  const ticketHtml = isCurrentAssetActive ? `
    <div class="solar-ticket ${isTp1 ? 'tp1-secured' : ''}">
      <div class="solar-ticket-head">
        <span class="signal-type-badge ${isTp1 ? 'tp1' : globalSig.type.toLowerCase()}" style="${isTp1 ? 'background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676;' : ''}">
          ${isTp1 ? '🎯 TARGET 1 HIT (+40 PIPS) · BE LOCKED' : `● LIVE ${globalSig.type} ${globalSig.symbol} SIGNAL`}
        </span>
        <span class="muted" style="font-size: 11.5px;">Triggered: ${globalSig.firedAt || 'Live'}</span>
      </div>

      ${isTp1 ? `
        <div style="background:linear-gradient(90deg, rgba(0,230,118,0.18) 0%, rgba(245,196,81,0.14) 100%); border:1px solid #00e676; border-radius:8px; padding:10px 13px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:22px;">🛡️</span>
          <div>
            <b style="color:#00e676; font-size:12px; display:block;">STATUS: SIFAR RISIKO (100% RISK-FREE)</b>
            <span style="font-size:11px; color:#f1f5f9; line-height:1.35; display:block;">
              SOP Wajib: Ambil 50% partial profit & <b>pastikan Stop Loss diubah ke harga Entry (${num(globalSig.entry)})</b>. Baki posisi sasarkan TP2!
            </span>
          </div>
        </div>
      ` : ''}

      <div class="ticket-grid">
        <div class="ticket-metric">
          <div class="lbl">Entry Execution</div>
          <div class="val gold">${num(globalSig.entry)}</div>
        </div>
        <div class="ticket-metric">
          <div class="lbl">${isTp1 ? 'Runner Target (TP2)' : 'Primary Target'}</div>
          <div class="val bull">${isTp1 ? num(globalSig.tp2) : num(globalSig.tp1)}</div>
        </div>
      </div>

      <div class="targets-row">
        <div class="target-box tp ${isTp1 ? 'secured' : ''}">
          <span>TARGET 1 ${isTp1 ? '✓ HIT' : ''}</span>
          <b>${num(globalSig.tp1)}</b>
        </div>
        <div class="target-box tp">
          <span>TARGET 2 (RUNNER)</span>
          <b>${num(globalSig.tp2)}</b>
        </div>
        <div class="target-box sl">
          <span>STOP LOSS</span>
          <b>${isTp1 ? `BE (${num(globalSig.entry)})` : num(globalSig.sl)}</b>
        </div>
      </div>

      <div class="row" style="margin-bottom: 10px; font-size: 11px;">
        <span class="muted">Risk/Reward: <b style="color:#fff;">1 : 2.6</b></span>
        <span class="badge gold" style="font-size: 10px;">${isTp1 ? 'PROTECTED BY BREAK-EVEN' : 'MT5 EXECUTION VERIFIED'}</span>
      </div>

      <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45; border-top: 1px solid var(--border); padding-top: 10px;">
        ${globalSig.notes || `Amaterasu AI algorithm detected order block absorption on ${inst.name}. Follow strict SOP.`}
      </p>
    </div>
  ` : isAnyActive ? `
    <div class="solar-active-alert-card" style="background: linear-gradient(135deg, rgba(255, 160, 0, 0.15) 0%, rgba(13, 20, 30, 0.95) 100%); border: 1px solid var(--solar-gold); border-radius: 14px; padding: 18px 16px; margin-bottom: 12px; text-align: center; box-shadow: 0 4px 24px rgba(255, 160, 0, 0.2);">
      <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e676; animation:pulseDot 1.2s infinite;"></span>
        <span style="font-size:11.5px; font-weight:800; color:#f5c451; letter-spacing:0.8px; text-transform:uppercase;">AI SIGNAL SEDANG AKTIF PADA ${globalSig.symbol}!</span>
      </div>
      <div style="font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; font-family:'Space Grotesk',sans-serif;">
        ${globalSig.type === 'BUY' ? '🟢 BUY' : '🔴 SELL'} ${globalSig.symbol} @ ${num(globalSig.entry)}
      </div>
      <div style="font-size:12px; color:#94a3b8; margin-bottom:14px;">
        TP1: <b style="color:#00e676;">${num(globalSig.tp1)}</b> · TP2: <b style="color:#00e676;">${num(globalSig.tp2)}</b> · SL: <b style="color:#ef5350;">${num(globalSig.sl)}</b>
      </div>
      <button class="btn gold" id="btnGoToActiveSignal" style="width:100%; padding:11px; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 15px rgba(255,160,0,0.3);">
        <span>Buka Chart & Live Signal ${globalSig.symbol}</span> ➔
      </button>
    </div>
  ` : `
    <div class="solar-scanner-card">
      <div class="solar-radar-wrap">
        <div class="radar-sweep"></div>
        <div class="radar-ring r1"></div>
        <div class="radar-ring r2"></div>
        <div class="radar-ring r3"></div>
        <div class="radar-core-icon">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
          </svg>
        </div>
      </div>
      <h3>Amaterasu Institutional Scanner · ${inst.name}</h3>
      <div class="next-setup-pill">BIAS: ${inst.bias === 'BULLISH' ? 'BULLISH ACCUMULATION ▲' : inst.bias === 'BEARISH' ? 'BEARISH DISTRIBUTION ▼' : 'CONSOLIDATION'}</div>
      <p style="font-size:12px; color:#8e9aa8; margin-top:6px;">Mengimbas zon kecairan institusi & order blocks ${inst.id}. Signal disahkan oleh Master Trader.</p>

      <div style="margin-top:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(0,230,118,0.3); border-radius:10px; padding:12px 14px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:11px; font-weight:800; color:#00e676; letter-spacing:0.8px;">KEPUTUSAN SIGNAL SELESAI TERAKHIR:</span>
          <span style="font-size:11px; color:#8e9aa8;">${lastRes.date || 'Hari ini'} · ${lastRes.time || ''}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="font-size:14px; color:#fff;">${lastRes.type} ${lastRes.symbol} @ ${num(lastRes.entry)}</b>
          <span style="background:rgba(0,230,118,0.18); border:1px solid #00e676; color:#00e676; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">
            ${lastRes.pips > 0 ? `✅ ${lastRes.status} (+${lastRes.pips} PIPS)` : `🛑 SL (${lastRes.pips} PIPS)`}
          </span>
        </div>
      </div>

      <button class="btn gold" id="btnTriggerScanNow" style="margin-top:14px; width:100%; padding:11px 14px; font-weight:700; font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 16px rgba(255,160,0,0.25);">
        <span>⚡ Hantar Signal Live ${inst.name}</span>
      </button>
    </div>
  `;

  main.innerHTML = `<section class="page" style="padding-top: 4px;">
    ${solarGlow()}

    ${isAnyActive ? `
      <div class="top-active-signal-bar" id="topActiveSignalBar" style="background: linear-gradient(90deg, rgba(0, 230, 118, 0.16) 0%, rgba(255, 160, 0, 0.16) 100%); border: 1px solid ${inst.id === globalSig.symbol ? '#00e676' : 'var(--solar-gold)'}; border-radius: 8px; padding: 9px 13px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.15s;" title="Klik untuk lihat signal ${globalSig.symbol}">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#00e676; animation:pulseDot 1.2s infinite; display:inline-block;"></span>
          <span style="font-size:12px; font-weight:700; color:#fff;">LIVE AI SIGNAL: <b style="color:#f5c451;">${globalSig.type} ${globalSig.symbol}</b> @ ${num(globalSig.entry)}</span>
        </div>
        <span style="font-size:11px; font-weight:700; color:${inst.id === globalSig.symbol ? '#00e676' : '#f5c451'};">${inst.id === globalSig.symbol ? 'LIVE DIPAPARKAN ✓' : 'LIHAT SEKARANG ➔'}</span>
      </div>
    ` : ''}
    
    <!-- 1. 100% Match Interactive SNR Chart Card with Screener Trends (Gambar Pertama Exact) -->
    <div class="snr-chart-card">
      <div class="snr-screener-block">
        <div class="trend-row-snr">
          <span class="tf-code">M1</span>
          <span class="trend-val ${inst.m1 === 'UP' ? 'up' : inst.m1 === 'DOWN' ? 'down' : 'side'}">TREND ${inst.m1 === 'UP' ? 'UP' : inst.m1 === 'DOWN' ? 'DOWN' : 'SIDE'}</span>
          <span class="trend-circle ${inst.m1 === 'UP' ? 'up' : inst.m1 === 'DOWN' ? 'down' : 'side'}"></span>
        </div>
        <div class="trend-row-snr">
          <span class="tf-code">M5</span>
          <span class="trend-val ${inst.m5 === 'UP' ? 'up' : inst.m5 === 'DOWN' ? 'down' : 'side'}">TREND ${inst.m5 === 'UP' ? 'UP' : inst.m5 === 'DOWN' ? 'DOWN' : 'SIDE'}</span>
          <span class="trend-circle ${inst.m5 === 'UP' ? 'up' : inst.m5 === 'DOWN' ? 'down' : 'side'}"></span>
        </div>
        <div class="trend-row-snr">
          <span class="tf-code">M15</span>
          <span class="trend-val ${inst.m15 === 'UP' ? 'up' : inst.m15 === 'DOWN' ? 'down' : 'side'}">TREND ${inst.m15 === 'UP' ? 'UP' : inst.m15 === 'DOWN' ? 'DOWN' : 'SIDE'}</span>
          <span class="trend-circle ${inst.m15 === 'UP' ? 'up' : inst.m15 === 'DOWN' ? 'down' : 'side'}"></span>
        </div>
      </div>

      <div class="snr-toolbar">
        <div class="snr-tf-pills" id="snrTfPills">
          <button class="snr-pill active" data-tf="M3">M3</button>
          <button class="snr-pill" data-tf="M15">M15</button>
          <button class="snr-pill" data-tf="H1">H1</button>
          <div class="snr-dropdown-wrap">
            <button class="snr-pill tf-dropdown" id="snrTfDropdownBtn">TF ▾</button>
            <div class="snr-dropdown-menu" id="snrTfMenu" style="display:none;">
              <div data-tf="M1">M1</div>
              <div data-tf="M5">M5</div>
              <div data-tf="M30">M30</div>
              <div data-tf="H4">H4</div>
              <div data-tf="D1">D1</div>
            </div>
          </div>
        </div>
        <div class="snr-tools">
          <button class="snr-icon-btn" id="snrZoomOut" title="Zoom Out">−</button>
          <button class="snr-icon-btn" id="snrZoomIn" title="Zoom In">+</button>
          <button class="snr-icon-btn" id="snrReset" title="Reset View">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
          <button class="snr-icon-btn snr-btn-fs" id="snrFullscreen" title="Buka Full Chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Chart Engine View Mode Selector (Amaterasu SNR AI vs TradingView Live Real-Time) -->
      <div style="display:flex; justify-content:center; gap:8px; margin: 6px 0 10px;">
        <button class="snr-mode-toggle active" id="btnModeSnr">⚡ Amaterasu SNR AI</button>
        <button class="snr-mode-toggle" id="btnModeTv">📊 TradingView Live Feed</button>
      </div>

      <div class="snr-canvas-wrap" id="snrCanvasWrap"></div>
      <div class="tv-live-embed-wrap" id="tvLiveEmbedWrap" style="display:none; width:100%; height:460px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background:#06070a; margin-bottom:10px;"></div>

      <div class="snr-disclaimer">
        For educational purposes only. Not financial advice.
      </div>

      <button class="btn-full-chart" id="btnOpenFullChart">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
        <span>Buka Full Chart (Zoom In / Out)</span>
      </button>

      <button class="btn-tv-app" id="btnOpenTradingView">
        <svg class="tv-icon" width="22" height="15" viewBox="0 0 36 24" fill="currentColor">
          <path d="M0 19.5V4.5C0 3.67 0.67 3 1.5 3H6.5C7.33 3 8 3.67 8 4.5V19.5C8 20.33 7.33 21 6.5 21H1.5C0.67 21 0 20.33 0 19.5ZM13 14.5V4.5C13 3.67 13.67 3 14.5 3H19.5C20.33 3 21 3.67 21 4.5V14.5C21 15.33 20.33 16 19.5 16H14.5C13.67 16 13 15.33 13 14.5ZM26 21.5V4.5C26 3.67 26.67 3 27.5 3H32.5C33.33 3 34 3.67 34 4.5V21.5C34 22.33 33.33 23 32.5 23H27.5C26.67 23 26 22.33 26 21.5Z"/>
        </svg>
        <span>Open in TradingView app</span>
      </button>
    </div>

    <!-- 2. Interactive Asset Switcher with Drag-to-Scroll & Navigation Arrows -->
    <div class="pair-switcher-container">
      <div class="pair-switcher-head">
        <span class="lbl-assets">MARKET ASSETS (${ALL_INSTRUMENTS.length})</span>
        <button class="btn-all-pairs" id="btnAllPairsDropdown">Semua Pair ▾</button>
      </div>
      <div class="pair-chips-track-wrap">
        <button class="pair-scroll-arrow left" id="pairScrollLeft" title="Scroll Kiri">‹</button>
        <div class="pair-chips-scroll" id="pairChips">
          ${ALL_INSTRUMENTS.map(p => `
            <button class="pair-chip-btn ${p.id === inst.id ? 'active' : ''}" data-sym="${p.id}" style="display:flex; align-items:center; gap:6px; white-space:nowrap; padding:7px 13px; border-radius:20px; font-size:12px; font-weight:700; border:1px solid ${p.id === inst.id ? 'var(--solar-gold)' : (globalSig.status === 'ACTIVE' && globalSig.symbol === p.id ? '#00e676' : 'rgba(255,255,255,0.1)')}; background:${p.id === inst.id ? 'rgba(255,160,0,0.18)' : (globalSig.status === 'ACTIVE' && globalSig.symbol === p.id ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)')}; color:${p.id === inst.id ? '#fff' : (globalSig.status === 'ACTIVE' && globalSig.symbol === p.id ? '#00e676' : '#8e9aa8')}; cursor:pointer; transition:all 0.18s ease; flex-shrink:0;">
              <span>${p.icon}</span>
              <span>${p.id}</span>
              ${globalSig.status === 'ACTIVE' && globalSig.symbol === p.id ? '<span style="background:#00e676; color:#06070a; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:10px; margin-left:2px; animation:pulseDot 1.2s infinite; letter-spacing:0.5px;">LIVE</span>' : ''}
            </button>
          `).join('')}
        </div>
        <button class="pair-scroll-arrow right" id="pairScrollRight" title="Scroll Kanan">›</button>
      </div>
    </div>

    <!-- 3. AI Execution Ticket / Scanner, SOP Guide & Recent Telemetry -->
    <div style="max-width:440px; margin:0 auto;">
      <!-- SOP Guide Button -->
      <button class="btn-sop-guide" id="btnOpenSopGuide">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        <span>Panduan SOP Signal & Kawalan Risiko</span>
        <span class="sop-tag">4 LANGKAH</span>
      </button>

      ${ticketHtml}

      <!-- Recent Verified Signals History Section -->
      <div class="recent-signals-card" style="margin-top:16px; background:#0b1118; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:8px;">
          <b style="font-family:'Space Grotesk',sans-serif; font-size:13px; color:#f1f5f9; display:flex; align-items:center; gap:6px;">
            <span>📊</span> Rekod Telemetri Signal Terkini
          </b>
          <span style="font-size:11px; color:#f5c451; font-weight:700;">Winrate 94% · Verified</span>
        </div>
        <div class="recent-signals-list" style="display:flex; flex-direction:column; gap:8px;">
          ${((AppState && AppState.signals) || []).slice(0, 5).map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#111722; border-radius:8px; border:1px solid rgba(255,255,255,0.05); font-size:12px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:${s.type === 'BUY' ? '#00e676' : '#ef5350'};">${s.type}</span>
                <b style="color:#fff;">${s.symbol}</b>
                <span class="muted" style="font-size:11px;">@ ${num(s.entry)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="muted" style="font-size:11px;">${s.time}</span>
                <span style="font-weight:800; font-size:11.5px; color:${s.pips > 0 ? '#00e676' : '#ef5350'}; background:${s.pips > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(239,83,80,0.12)'}; padding:2px 7px; border-radius:6px; border:1px solid ${s.pips > 0 ? 'rgba(0,230,118,0.3)' : 'rgba(239,83,80,0.3)'};">
                  ${s.pips > 0 ? '+' : ''}${s.pips}p
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>`;

  // Mount SNR Chart (Multi-Asset Aware: Gold, Forex, WTI, Indices, Crypto)
  let currentActiveTf = 'M3';
  const wrap = $('#snrCanvasWrap', main);
  const chartInstance = mountSNRChart(wrap, currentActiveTf, inst.id);

  // Mode Switcher: Amaterasu SNR AI vs TradingView Live Real-Time
  const btnModeSnr = $('#btnModeSnr', main);
  const btnModeTv = $('#btnModeTv', main);
  const canvasWrap = $('#snrCanvasWrap', main);
  const tvEmbedWrap = $('#tvLiveEmbedWrap', main);
  const tvBtnPills = $('#snrTfPills', main);
  const tvTools = $('.snr-tools', main);

  const tvSymbols = {
    XAUUSD: 'OANDA:XAUUSD',
    EURUSD: 'FX:EURUSD',
    GBPJPY: 'FX:GBPJPY',
    GBPUSD: 'FX:GBPUSD',
    USDJPY: 'FX:USDJPY',
    WTI: 'NYMEX:CL1!',
    US30: 'CBOT_MINI:YM1!',
    NAS100: 'CME_MINI:NQ1!',
    BTCUSD: 'BINANCE:BTCUSDT'
  };

  const tfToTvInterval = {
    M1: '1', M3: '3', M5: '5', M15: '15', M30: '30', H1: '60', H4: '240', D1: 'D'
  };

  const renderTvIframe = () => {
    if (!tvEmbedWrap) return;
    const sym = tvSymbols[inst.id] || 'OANDA:XAUUSD';
    const interval = tfToTvInterval[currentActiveTf] || '15';
    tvEmbedWrap.innerHTML = `
      <iframe 
        src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FKuala_Lumpur&hide_top_toolbar=0&studies=[]&hide_side_toolbar=1" 
        style="width:100%; height:100%; border:none; display:block;"
        loading="lazy">
      </iframe>
    `;
  };

  if (btnModeSnr && btnModeTv) {
    btnModeSnr.onclick = () => {
      btnModeSnr.classList.add('active');
      btnModeTv.classList.remove('active');
      if (tvEmbedWrap) { tvEmbedWrap.style.display = 'none'; tvEmbedWrap.innerHTML = ''; }
      if (canvasWrap) canvasWrap.style.display = 'block';
      if (chartInstance && chartInstance.redraw) chartInstance.redraw();
    };

    btnModeTv.onclick = () => {
      btnModeTv.classList.add('active');
      btnModeSnr.classList.remove('active');
      if (canvasWrap) canvasWrap.style.display = 'none';
      if (tvEmbedWrap) {
        tvEmbedWrap.style.display = 'block';
        renderTvIframe();
      }
    };
  }

  // Timeframe Pills Interactions
  const pills = $$('#snrTfPills .snr-pill:not(.tf-dropdown)', main);
  const dropBtn = $('#snrTfDropdownBtn', main);
  const dropMenu = $('#snrTfMenu', main);

  pills.forEach(p => {
    p.onclick = () => {
      pills.forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      if (dropBtn) {
        dropBtn.classList.remove('active');
        dropBtn.textContent = 'TF ▾';
      }
      currentActiveTf = p.dataset.tf;
      chartInstance.setTf(currentActiveTf);
      if (btnModeTv && btnModeTv.classList.contains('active')) {
        renderTvIframe();
      }
    };
  });

  // Timeframe Dropdown
  if (dropBtn && dropMenu) {
    dropBtn.onclick = (e) => {
      e.stopPropagation();
      dropMenu.style.display = dropMenu.style.display === 'none' ? 'block' : 'none';
    };
    $$('#snrTfMenu div', main).forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        pills.forEach(b => b.classList.remove('active'));
        currentActiveTf = item.dataset.tf;
        dropBtn.textContent = currentActiveTf + ' ▾';
        dropBtn.classList.add('active');
        dropMenu.style.display = 'none';
        chartInstance.setTf(currentActiveTf);
        if (btnModeTv && btnModeTv.classList.contains('active')) {
          renderTvIframe();
        }
      };
    });
  }

  const closeMenu = (e) => {
    if (dropMenu && !dropMenu.contains(e.target) && e.target !== dropBtn) {
      dropMenu.style.display = 'none';
    }
  };
  document.addEventListener('click', closeMenu);

  // Screener Rows Click to Switch Timeframe (M1, M5, M15)
  $$('.trend-row-snr', main).forEach(row => {
    row.style.cursor = 'pointer';
    row.onclick = () => {
      const tfEl = row.querySelector('.tf-code');
      const tf = tfEl ? tfEl.textContent.trim() : null;
      if (!tf) return;
      currentActiveTf = tf;
      const matchedPill = Array.from(pills).find(b => b.dataset.tf === tf);
      if (matchedPill) {
        pills.forEach(b => b.classList.remove('active'));
        matchedPill.classList.add('active');
        if (dropBtn) {
          dropBtn.classList.remove('active');
          dropBtn.textContent = 'TF ▾';
        }
      } else if (dropBtn) {
        pills.forEach(b => b.classList.remove('active'));
        dropBtn.textContent = tf + ' ▾';
        dropBtn.classList.add('active');
      }
      chartInstance.setTf(tf);
    };
  });

  // Pair Chips Switcher Interactions (Smooth Drag-to-Scroll + Wheel + Arrows)
  const chips = $('#pairChips', main);
  if (chips) {
    // Auto-scroll active chip into view on load
    const activeChip = chips.querySelector('.pair-chip-btn.active');
    if (activeChip) {
      setTimeout(() => {
        activeChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }, 60);
    }

    // Left and Right Arrow navigation
    const arrowL = $('#pairScrollLeft', main);
    const arrowR = $('#pairScrollRight', main);
    if (arrowL) arrowL.onclick = () => chips.scrollBy({ left: -140, behavior: 'smooth' });
    if (arrowR) arrowR.onclick = () => chips.scrollBy({ left: 140, behavior: 'smooth' });

    // Mouse wheel horizontal scroll
    chips.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        chips.scrollLeft += e.deltaY * 0.9;
      }
    }, { passive: false });

    // Mouse drag-to-scroll
    let isDown = false;
    let startX = 0, scrollStart = 0;
    chips.addEventListener('mousedown', (e) => {
      isDown = true;
      chips.classList.add('dragging');
      startX = e.pageX - chips.offsetLeft;
      scrollStart = chips.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      isDown = false;
      if (chips) chips.classList.remove('dragging');
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - chips.offsetLeft;
      const walk = (x - startX) * 1.5;
      chips.scrollLeft = scrollStart - walk;
    });
  }

  // Handle clicking on pair chips
  $$('.pair-chip-btn', main).forEach(btn => {
    btn.onclick = () => {
      const sym = btn.dataset.sym;
      store.set('selected_signal_sym', sym);
      Market.activeSymbol = sym;
      Market.updateUI();
      SignalPage(main);
    };
  });

  // Top Active Signal Bar Navigation
  const topActiveBar = $('#topActiveSignalBar', main);
  if (topActiveBar) {
    topActiveBar.onclick = () => {
      if (globalSig && globalSig.symbol) {
        store.set('selected_signal_sym', globalSig.symbol);
        SignalPage(main);
      }
    };
  }

  // Go to Active Signal Button in Alert Card
  const btnGoTo = $('#btnGoToActiveSignal', main);
  if (btnGoTo) {
    btnGoTo.onclick = () => {
      if (globalSig && globalSig.symbol) {
        store.set('selected_signal_sym', globalSig.symbol);
        SignalPage(main);
      }
    };
  }

  // SOP Guide Modal Click Handler
  const btnSop = $('#btnOpenSopGuide', main);
  if (btnSop) {
    btnSop.onclick = () => {
      modal(`
        <div class="modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <b style="font-family:'Space Grotesk',sans-serif; font-size:15px; color:#f5c451; display:flex; align-items:center; gap:8px;">
            <span>📖</span> SOP Entry Signal & Pengurusan Risiko
          </b>
          <button class="btn btn-ghost" data-close style="padding:4px 8px; font-size:16px;">✕</button>
        </div>
        <div class="sop-modal-body">
          <div class="sop-step-card active-step">
            <div class="sop-step-head">
              <span class="sop-step-num">1</span>
              <span class="sop-step-title">Zon Entry & Disiplin No-FOMO</span>
            </div>
            <p class="sop-step-desc">
              Hanya masuk entry di MT4/MT5 sekiranya harga pasaran semasa berada dalam zon toleransi <b>±10 hingga 15 pip</b> dari harga Entry yang disarankan. Jangan kejar harga jika candle sudah terlajak jauh melepasi 20 pip.
            </p>
          </div>

          <div class="sop-step-card">
            <div class="sop-step-head">
              <span class="sop-step-num">2</span>
              <span class="sop-step-title">Pengurusan Risiko & Stop Loss (SL) Wajib</span>
            </div>
            <p class="sop-step-desc">
              Wajib tetapkan Stop Loss (SL) di MT4/MT5 mengikut paras harga yang tertera pada tiket. Risiko maksimum bagi setiap posisi adalah <b>1% - 2% daripada modal akaun</b> anda. Dilarang membuka lot melampau (*overlot*).
            </p>
          </div>

          <div class="sop-step-card active-step">
            <div class="sop-step-head">
              <span class="sop-step-num">3</span>
              <span class="sop-step-title">Capai Target 1 (TP1) ➔ Lock BE (Sifar Risiko)</span>
            </div>
            <p class="sop-step-desc">
              Bila harga mencecah TP1 (+35 hingga +50 pip), <b>SOP WAJIB:</b><br/>
              • Tutup 50% lot (Partial Profit) untuk kunci keuntungan.<br/>
              • <b>Alih Stop Loss ke harga Entry asal (Break Even / BE).</b><br/>
              Kini posisi anda berada dalam status <b>100% Risk-Free</b> — jika pasaran berpatah balik secara drastik, akaun anda terlindung dan tidak akan rugi satu sen pun!
            </p>
          </div>

          <div class="sop-step-card">
            <div class="sop-step-head">
              <span class="sop-step-num">4</span>
              <span class="sop-step-title">Capai Target 2 (TP2) ➔ Full Target Captured</span>
            </div>
            <p class="sop-step-desc">
              Baki 50% lot dibiarkan mengalir (*let profit run*) sehingga mencecah sasaran penuh TP2 (+80 hingga +140 pip) untuk memaksimumkan pulangan keuntungan.
            </p>
          </div>

          <button class="btn gold" data-close style="width:100%; margin-top:12px; padding:11px; font-weight:700;">
            Faham & Patuhi SOP Ini ✓
          </button>
        </div>
      `);
    };
  }

  // Instant AI Scan & Trigger Setup Button
  const btnTrigger = $('#btnTriggerScanNow', main);
  if (btnTrigger) {
    btnTrigger.onclick = async () => {
      btnTrigger.disabled = true;
      btnTrigger.innerHTML = '<span>⏳ Memproses AI Neural Scan...</span>';
      try {
        const res = await fetch('/api/ai/scan-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: inst.id })
        });
        const data = await res.json();
        if (data && data.signal) {
          AppState.activeSignal = data.signal;
          store.set('selected_signal_sym', data.signal.symbol);
          toast(`⚡ AI SIGNAL FIRED: ${data.signal.type} ${data.signal.symbol}!`);
          SignalPage(main);
        }
      } catch (err) {
        console.error(err);
        btnTrigger.disabled = false;
        btnTrigger.innerHTML = `<span>⚡ Jana Signal AI ${inst.name} Sekarang</span>`;
      }
    };
  }

  // "Semua Pair ▾" Modal
  const btnAllPairs = $('#btnAllPairsDropdown', main);
  if (btnAllPairs) {
    btnAllPairs.onclick = () => {
      const categories = ['Metals', 'Forex', 'Commodities', 'Indices', 'Crypto'];
      const modal = document.createElement('div');
      modal.className = 'pairs-modal-overlay';
      modal.innerHTML = `
        <div class="pairs-modal-card">
          <div class="pairs-modal-head">
            <b>Pilih Pasaran (${ALL_INSTRUMENTS.length} Assets)</b>
            <button class="pairs-modal-close" id="btnClosePairModal">✕</button>
          </div>
          <div class="pairs-modal-body">
            ${categories.map(cat => {
              const catPairs = ALL_INSTRUMENTS.filter(p => p.category === cat);
              if (!catPairs.length) return '';
              return `
                <div class="pairs-category-group">
                  <div class="pairs-category-title">${cat}</div>
                  <div class="pairs-category-grid">
                    ${catPairs.map(p => `
                      <div class="pair-modal-item ${p.id === inst.id ? 'active' : ''}" data-sym="${p.id}">
                        <div class="pair-modal-item-info">
                          <span style="font-size:16px;">${p.icon}</span>
                          <div>
                            <div class="pair-modal-item-name">${p.name}</div>
                            <div style="font-size:10px; color:#64748b;">${p.label}</div>
                          </div>
                        </div>
                        <div class="pair-modal-item-price">${num(p.basePrice)}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.onclick = (e) => {
        if (e.target === modal || e.target.closest('#btnClosePairModal')) {
          modal.remove();
        }
      };

      $$('.pair-modal-item', modal).forEach(item => {
        item.onclick = () => {
          const sym = item.dataset.sym;
          store.set('selected_signal_sym', sym);
          Market.activeSymbol = sym;
          Market.updateUI();
          modal.remove();
          SignalPage(main);
        };
      });
    };
  }

  // Zoom & Reset Controls
  const zoomIn = $('#snrZoomIn', main);
  if (zoomIn) zoomIn.onclick = () => chartInstance.zoomIn();
  const zoomOut = $('#snrZoomOut', main);
  if (zoomOut) zoomOut.onclick = () => chartInstance.zoomOut();
  const resetBtn = $('#snrReset', main);
  if (resetBtn) resetBtn.onclick = () => {
    if (dropBtn) {
      dropBtn.textContent = 'TF ▾';
      dropBtn.classList.remove('active');
    }
    pills.forEach(b => b.classList.toggle('active', b.dataset.tf === 'M3'));
    currentActiveTf = 'M3';
    chartInstance.reset();
  };

  // Full Chart Modal Handler
  let fsChartInstance = null;
  let closeFsModal = null;

  function openFullChartModal() {
    let existingModal = $('#snrModalFullscreen');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'snr-modal-fullscreen';
    modal.id = 'snrModalFullscreen';
    modal.innerHTML = `
      <div class="snr-modal-header">
        <div class="snr-modal-pair">
          <span class="snr-modal-pair-icon" id="fsPairIcon">${inst.icon}</span>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <select class="snr-modal-pair-select" id="fsPairSelect">
              ${ALL_INSTRUMENTS.map(p => `
                <option value="${p.id}" ${p.id === inst.id ? 'selected' : ''}>${p.icon} ${p.name}</option>
              `).join('')}
            </select>
            <small class="snr-modal-pair-tf" id="fsTfLabel">${currentActiveTf}</small>
          </div>
          <div class="snr-modal-live-box">
            <span class="live-dot">●</span>
            <span class="live-price" id="fsLivePrice">${getDisplayPrice()}</span>
          </div>
        </div>

        <div class="snr-modal-tf-group" id="fsTfGroup">
          ${['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => `
            <button class="snr-modal-tf-btn ${tf === currentActiveTf ? 'active' : ''}" data-tf="${tf}">${tf}</button>
          `).join('')}
        </div>

        <div class="snr-modal-tools">
          <button class="snr-modal-tool-btn" id="fsZoomOut" title="Zoom Out">−</button>
          <button class="snr-modal-tool-btn" id="fsZoomIn" title="Zoom In">+</button>
          <button class="snr-modal-tool-btn" id="fsReset" title="Reset Fit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
          <button class="snr-modal-close-btn" id="fsCloseBtn" title="Tutup Full Chart">✕ Tutup</button>
        </div>
      </div>

      <div class="snr-modal-canvas-wrap" id="fsCanvasWrap"></div>

      <div class="snr-modal-footer">
        <div class="snr-hint">
          <span>✋ <b>Drag / Seret ke kanan</b> untuk tengok <b>Data Backward</b> (sejarah candle)</span>
          <span>🔍 <b>Scroll Wheel / Pinch</b> untuk Zoom In & Zoom Out</span>
          <span>↺ <b>Double Click</b> untuk Reset ke Live</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const fsWrap = $('#fsCanvasWrap', modal);
    fsChartInstance = mountSNRChart(fsWrap, currentActiveTf, inst.id);

    const onFsTick = p => {
      const priceEl = $('#fsLivePrice', modal);
      if (priceEl && inst.id === 'XAUUSD') priceEl.textContent = num(p);
    };
    Market.subs.add(onFsTick);

    $$('#fsTfGroup button', modal).forEach(btn => {
      btn.onclick = () => {
        $$('#fsTfGroup button', modal).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentActiveTf = btn.dataset.tf;
        const tfLbl = $('#fsTfLabel', modal);
        if (tfLbl) tfLbl.textContent = currentActiveTf;
        if (fsChartInstance) fsChartInstance.setTf(currentActiveTf);

        // Sync with background main page chart
        pills.forEach(b => b.classList.toggle('active', b.dataset.tf === currentActiveTf));
        if (['M1', 'M5', 'M30', 'H4', 'D1'].includes(currentActiveTf)) {
          if (dropBtn) {
            dropBtn.textContent = currentActiveTf + ' ▾';
            dropBtn.classList.add('active');
          }
        } else {
          if (dropBtn) {
            dropBtn.textContent = 'TF ▾';
            dropBtn.classList.remove('active');
          }
        }
        chartInstance.setTf(currentActiveTf);
      };
    });

    const fsZoomIn = $('#fsZoomIn', modal);
    if (fsZoomIn) fsZoomIn.onclick = () => fsChartInstance && fsChartInstance.zoomIn();
    const fsZoomOut = $('#fsZoomOut', modal);
    if (fsZoomOut) fsZoomOut.onclick = () => fsChartInstance && fsChartInstance.zoomOut();
    const fsReset = $('#fsReset', modal);
    if (fsReset) fsReset.onclick = () => fsChartInstance && fsChartInstance.reset();

    // Full Chart Pair Switcher
    const fsPairSelect = $('#fsPairSelect', modal);
    if (fsPairSelect) {
      fsPairSelect.onchange = (e) => {
        const newSym = e.target.value;
        store.set('selected_signal_sym', newSym);
        inst = ALL_INSTRUMENTS.find(i => i.id === newSym) || ALL_INSTRUMENTS[0];
        const pairIcon = $('#fsPairIcon', modal);
        if (pairIcon) pairIcon.textContent = inst.icon;
        const livePrice = $('#fsLivePrice', modal);
        if (livePrice) livePrice.textContent = getDisplayPrice();
        if (fsChartInstance) {
          fsChartInstance.destroy();
          fsChartInstance = mountSNRChart(fsWrap, currentActiveTf, inst.id);
        }
      };
    }

    closeFsModal = () => {
      Market.subs.delete(onFsTick);
      window.removeEventListener('keydown', onFsKeyDown);
      if (fsChartInstance && fsChartInstance.destroy) fsChartInstance.destroy();
      fsChartInstance = null;
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      SignalPage(main);
    };

    const closeBtn = $('#fsCloseBtn', modal);
    if (closeBtn) closeBtn.onclick = closeFsModal;

    const onFsKeyDown = (e) => {
      if (e.key === 'Escape') closeFsModal();
    };
    window.addEventListener('keydown', onFsKeyDown);
  }

  const btnFs = $('#snrFullscreen', main);
  if (btnFs) btnFs.onclick = openFullChartModal;
  const btnOpenFull = $('#btnOpenFullChart', main);
  if (btnOpenFull) btnOpenFull.onclick = openFullChartModal;

  // Open TradingView External App / Chart Link (Dynamic to Selected Symbol)
  const tvBtn = $('#btnOpenTradingView', main);
  if (tvBtn) {
    tvBtn.onclick = () => {
      const tvSymbols = {
        XAUUSD: 'OANDA:XAUUSD',
        EURUSD: 'FX:EURUSD',
        GBPJPY: 'FX:GBPJPY',
        GBPUSD: 'FX:GBPUSD',
        USDJPY: 'FX:USDJPY',
        WTI: 'TVC:USOIL',
        US30: 'BLACKBULL:US30',
        NAS100: 'NDAQ:NDX',
        BTCUSD: 'BINANCE:BTCUSDT'
      };
      const sym = tvSymbols[inst.id] || 'OANDA:XAUUSD';
      window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}`, '_blank');
    };
  }

  return () => {
    if (closeFsModal) closeFsModal();
    document.removeEventListener('click', closeMenu);
    if (chartInstance && chartInstance.destroy) chartInstance.destroy();
  };
}

// ---------- 2. Stat ----------
function StatPage(main) {
  const st = (AppState && AppState.stats) || {
    totalSignals: 17,
    winRate: 93,
    tp1Hit: 13,
    tp2Hit: 7,
    slHit: 1,
    totalProfitToday: 979,
    last7Days: [
      { day: 'Sat', pips: 0 }, { day: 'Sun', pips: 0 }, { day: 'Mon', pips: 1605 },
      { day: 'Tue', pips: 1482 }, { day: 'Wed', pips: 1669 }, { day: 'Thu', pips: 1559 }, { day: 'Today', pips: 979 }
    ]
  };

  const signals = [
    { time: '17:39', date: 'Oct 23', type: 'SELL', symbol: 'XAUUSD', status: 'TP1', pips: 36, badge: 'TP1' },
    { time: '16:18', date: 'Oct 23', type: 'BUY', symbol: 'XAUUSD', status: 'TP1', pips: 44, badge: 'TP1' },
    { time: '15:30', date: 'Oct 23', type: 'BUY', symbol: 'XAUUSD', status: 'TP1', pips: 51, badge: 'TP1' },
    { time: '14:12', date: 'Oct 23', type: 'SELL', symbol: 'XAUUSD', status: 'CLOSED IN PROFIT', pips: 58, badge: 'TP1' },
    { time: '13:36', date: 'Oct 23', type: 'BUY', symbol: 'XAUUSD', status: 'TP2', pips: 72, badge: 'TP1 TP2' },
    { time: '13:30', date: 'Oct 23', type: 'SELL', symbol: 'XAUUSD', status: 'SL · -60 pip', sub: 'peak +7', isSL: true },
    { time: '13:03', date: 'Oct 23', type: 'BUY', symbol: 'XAUUSD', status: 'CLOSED IN PROFIT', pips: 109, badge: 'TP1 TP2' },
    { time: '12:03', date: 'Oct 23', type: 'SELL', symbol: 'XAUUSD', status: 'CLOSED IN PROFIT', pips: 112, badge: 'TP1 TP2' }
  ];

  const maxPips = Math.max(...st.last7Days.map(d => d.pips), 100);

  main.innerHTML = `<section class="page">
    ${pageHead('Stat', 'Overall signal performance')}

    <!-- 1. Total Profit Today Big Card -->
    <div class="stat-profit-today-card">
      <div class="lbl">TOTAL PROFIT TODAY</div>
      <div class="val">+${st.totalProfitToday} pip</div>
    </div>

    <!-- 2. Four Metrics Grid (2x2) -->
    <div class="stat-grid-4">
      <div class="stat-box-small">
        <div class="lbl">WIN RATE</div>
        <div class="val green">${st.winRate}%</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SIGNALS CLOSED</div>
        <div class="val">${st.totalSignals}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">TP1 / TP2 HIT</div>
        <div class="val green">${st.tp1Hit} / ${st.tp2Hit}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SL HIT</div>
        <div class="val red">${st.slHit}</div>
      </div>
    </div>
    <div class="stat-signals-closed-sub">17 signals closed on this day</div>

    <!-- 3. Last 7 Days Bar Chart Card -->
    <div class="stat-7days-card">
      <div class="stat-7days-header">
        <b>Last 7 days</b>
        <span>+7294 pip</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 115px; gap: 8px;">
        ${st.last7Days.map(d => {
          const h = d.pips ? Math.max(8, Math.round((d.pips / maxPips) * 85)) : 2;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <small style="font-size: 9.5px; font-weight: 600; color: ${d.pips ? '#00e676' : 'var(--text-muted)'};">${d.pips ? `+${d.pips}` : ''}</small>
              <div style="width: 100%; height: ${h}px; background: ${d.pips ? '#00e676' : 'rgba(255,255,255,0.06)'}; border-radius: 4px;"></div>
              <span style="font-size: 10px; color: ${d.day === 'Today' ? 'var(--solar-gold)' : 'var(--text-secondary)'}; font-weight: ${d.day === 'Today' ? '700' : '500'};">${d.day}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 4. Timeframe Filter Pills & Date Carousel -->
    <div class="stat-filter-row" id="statFilters">
      <button class="stat-filter-pill active" data-f="daily">Daily</button>
      <button class="stat-filter-pill" data-f="weekly">Weekly</button>
      <button class="stat-filter-pill" data-f="monthly">Monthly</button>
    </div>
    <div class="stat-date-carousel">
      <button id="statPrevDate">‹</button>
      <span id="statDateLabel">Today</span>
      <button id="statNextDate">›</button>
    </div>

    <!-- 5. Signal History List (White House Academy 100% Match) -->
    <h4 class="sec" style="margin-top: 10px; margin-bottom: 12px;">Signal History</h4>
    <div class="sig-history-list">
      ${signals.map(s => {
        const isSell = s.type === 'SELL';
        const arrow = isSell ? '▼' : '▲';
        const arrowCol = isSell ? '#ef5350' : '#26a69a';
        return `
          <div class="sig-history-item">
            <div>
              <div style="font-size: 12.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 600;">
                <span class="muted">${s.date}</span>
                <span style="color: ${arrowCol}; margin: 0 4px;">${arrow}</span>
                <b style="color: ${arrowCol};">${s.symbol}</b>
              </div>
              <div style="font-size: 11px; color: #8e9aa8; margin-bottom: 6px;">${s.time}</div>
              <div>
                ${(s.badge || '').split(' ').filter(Boolean).map(b => `<span class="history-badge">${b}</span>`).join('')}
              </div>
            </div>
            <div style="text-align: right;">
              ${s.isSL ? `
                <div style="color: #ef5350; font-family:'Space Grotesk',sans-serif; font-size: 13px; font-weight: 700;">
                  SL · -60 pip <span style="font-size: 10.5px; color: #26a69a; border: 1px solid rgba(38,166,154,0.4); border-radius: 4px; padding: 1px 4px; margin-left: 4px;">peak +7</span>
                </div>
              ` : `
                <div style="font-family:'Space Grotesk',sans-serif; font-size: 13px; font-weight: 700; color: #00e676;">
                  ${s.status === 'CLOSED IN PROFIT' ? 'CLOSED IN PROFIT · ' : ''}${s.status.startsWith('TP') ? `${s.status} · ` : ''}+${s.pips} pip
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </section>`;

  // Filter tabs
  const fBtns = $$('#statFilters button', main);
  fBtns.forEach(btn => {
    btn.onclick = () => {
      fBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#statDateLabel', main).textContent = btn.dataset.f === 'daily' ? 'Today' : btn.dataset.f === 'weekly' ? 'This Week' : 'October 2026';
    };
  });

  const pDate = $('#statPrevDate', main);
  const nDate = $('#statNextDate', main);
  const lDate = $('#statDateLabel', main);
  const dateOptions = ['23 Oct 2026', '24 Oct 2026', 'Today (25 Oct)'];
  let curDateIdx = 2;
  if (pDate && nDate && lDate) {
    pDate.onclick = () => {
      curDateIdx = Math.max(0, curDateIdx - 1);
      lDate.textContent = dateOptions[curDateIdx];
    };
    nDate.onclick = () => {
      curDateIdx = Math.min(dateOptions.length - 1, curDateIdx + 1);
      lDate.textContent = dateOptions[curDateIdx];
    };
  }
}

// ---------- 3. Analysis (White House Academy 100% Match) ----------
function AnalysisPage(main) {
  main.innerHTML = `<section class="page">
    ${pageHead('Gold Analysis', 'Daily market read by the desk')}

    <!-- Analysis Header Title Box -->
    <div class="analysis-header-box">
      <span class="ana-date-tag">17 October 2026, 18:00 · XAUUSD</span>
      <h2>USD strength from inflation data pressures gold lower despite daily bullish trend</h2>
    </div>

    <!-- Interactive SNR Chart Card -->
    <div class="snr-chart-card" style="margin-bottom: 16px;">
      <div class="snr-toolbar">
        <div class="snr-tf-pills" id="anaTfPills">
          <button class="snr-pill" data-tf="M3">M3</button>
          <button class="snr-pill active" data-tf="M15">M15</button>
          <button class="snr-pill" data-tf="H1">H1</button>
          <div class="snr-dropdown-wrap">
            <button class="snr-pill tf-dropdown" id="anaTfDropdownBtn">TF ▾</button>
            <div class="snr-dropdown-menu" id="anaTfMenu" style="display:none;">
              <div data-tf="M1">M1</div>
              <div data-tf="M5">M5</div>
              <div data-tf="M30">M30</div>
              <div data-tf="D1">D1</div>
            </div>
          </div>
        </div>
        <div class="snr-tools">
          <button class="snr-icon-btn" id="anaZoomOut">−</button>
          <button class="snr-icon-btn" id="anaZoomIn">+</button>
          <button class="snr-icon-btn" id="anaReset">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="snr-canvas-wrap" id="anaCanvasWrap"></div>
    </div>

    <!-- Structured Analysis Breakdown (100% Screenshot Match) -->
    <div class="ana-metric-sec">
      <div class="sec-head">💰 PRICE</div>
      <div class="ana-price-big">4,181.10 <small style="font-size: 13px; color: #8e9aa8; font-weight: 600;">USD/oz</small></div>

      <div class="sec-head">📈 TREND</div>
      <div class="ana-trend-pills">
        <span class="ana-pill bear">M1: BEARISH</span>
        <span class="ana-pill bear">M5: BEARISH</span>
        <span class="ana-pill bear">H1: BEARISH</span>
        <span class="ana-pill bull">D1: BULLISH</span>
      </div>
      <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 16px;">
        Short-term timeframes (M1, M5, H1) are all in downtrend, with price trading below their EMAs, indicating near-term selling pressure. However, the daily timeframe remains bullish with price above the D1 EMA10 (4178.51) and well above the D1 EMA21 (4223.91 level target), creating a conflict between intraday weakness and longer-term upside structure.
      </p>

      <div class="sec-head">🎯 DIRECTION</div>
      <div class="ana-direction-badge">▼ DOWN</div>
      <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 16px;">
        Price at 4,181.10 sits below resistance at 4,191.24 and is contained within the H1 bearish structure. The M1, M5, and H1 bearish alignment suggests immediate weakness toward support at 4,178.55, with no bullish confirmation yet on the hourly chart despite daily strength.
      </p>

      <div class="sec-head">📐 KEY LEVELS</div>
      <div class="ana-key-levels-box">
        <div class="lbl res">RESISTANCE</div>
        <div class="val">4,191.24 (H1 immediate) → 4,200.53 (H1 secondary) → 4,213.02 (H1 major)</div>
      </div>
      <div class="ana-key-levels-box" style="margin-bottom: 16px;">
        <div class="lbl sup">SUPPORT</div>
        <div class="val">4,178.55 (H1 nearest) → 4,169.32 (H1 secondary) → 4,152.32 (H1 major)</div>
      </div>

      <div class="sec-head">⚡ WHAT'S DRIVING IT</div>
      <ul class="ana-bullet-list" style="margin-bottom: 16px;">
        <li>US inflation data (CPI y/y 3.6% est., CPI m/m 0.6% est.) printed stronger than prior, favoring USD strength and weighing on gold.</li>
        <li>M1 and M5 price action remains below their respective EMAs (4185.52 and 4186.78), confirming short-term bearish momentum despite daily bullish context.</li>
        <li>Price at 4,181.10 has retreated from recent highs and sits between H1 support at 4,178.55 and resistance at 4,191.24, leaving room for a test of support.</li>
      </ul>

      <div class="sec-head" style="color: #f59e0b;">⚠️ RISK</div>
      <div class="ana-box-risk" style="margin-bottom: 16px;">
        If price closes above 4,191.24 on the H1 with bullish candle confirmation, the bearish intraday view is invalidated and buyers regain control toward the D1 bullish structure.
      </div>

      <div class="sec-head" style="color: #10b981;">💡 TAKEAWAY</div>
      <div class="ana-box-takeaway" style="margin-bottom: 14px;">
        Traders may consider shorting into rallies toward 4,191.24 with stops above 4,200.53, targeting the 4,178.55 support and below. A break below 4,178.55 opens 4,169.32 to 4,152.32 as extended targets. Wait for price to approach 4,191.24 resistance and confirm rejection with a bearish candle or rejection wick before entering a short position.
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 14px;">
        Not financial advice. Trade at your own risk.
      </div>
    </div>
  </section>`;

  // Mount Analysis SNR Chart
  const wrap = $('#anaCanvasWrap', main);
  const chartInstance = mountSNRChart(wrap, 'M15');

  const pills = $$('#anaTfPills .snr-pill:not(.tf-dropdown)', main);
  pills.forEach(p => {
    p.onclick = () => {
      pills.forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      chartInstance.setTf(p.dataset.tf);
    };
  });

  const dropBtn = $('#anaTfDropdownBtn', main);
  const dropMenu = $('#anaTfMenu', main);
  if (dropBtn && dropMenu) {
    dropBtn.onclick = (e) => {
      e.stopPropagation();
      dropMenu.style.display = dropMenu.style.display === 'none' ? 'block' : 'none';
    };
    $$('#anaTfMenu div', main).forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        pills.forEach(b => b.classList.remove('active'));
        dropBtn.textContent = item.dataset.tf + ' ▾';
        dropBtn.classList.add('active');
        dropMenu.style.display = 'none';
        chartInstance.setTf(item.dataset.tf);
      };
    });
    document.addEventListener('click', () => { if (dropMenu) dropMenu.style.display = 'none'; }, { once: true });
  }

  const zoomIn = $('#anaZoomIn', main);
  if (zoomIn) zoomIn.onclick = () => chartInstance.zoomIn();
  const zoomOut = $('#anaZoomOut', main);
  if (zoomOut) zoomOut.onclick = () => chartInstance.zoomOut();
  const resetBtn = $('#anaReset', main);
  if (resetBtn) resetBtn.onclick = () => {
    dropBtn.textContent = 'TF ▾';
    pills.forEach(b => b.classList.toggle('active', b.dataset.tf === 'M15'));
    chartInstance.reset();
  };
}

// ---------- 4. Screener ----------
function ScreenerPage(main) {
  const pairs = (AppState && AppState.screener) || [
    { symbol: 'XAUUSD', price: '4,024.87', trend: 'BEARISH', strengthLabel: 'WEAK BEARISH', strengthVal: -26 },
    { symbol: 'EURUSD', price: '1.08500', trend: 'BEARISH', strengthLabel: 'WEAK BEARISH', strengthVal: -18 },
    { symbol: 'GBPJPY', price: '209.646', trend: 'NEUTRAL', strengthLabel: 'NEUTRAL', strengthVal: 4 },
    { symbol: 'GBPUSD', price: '1.29800', trend: 'BULLISH', strengthLabel: 'MODERATE BULLISH', strengthVal: 42 },
    { symbol: 'USDJPY', price: '156.102', trend: 'BEARISH', strengthLabel: 'STRONG BEARISH', strengthVal: -64 },
    { symbol: 'WTI', price: '71.50', trend: 'BULLISH', strengthLabel: 'STRONG BULLISH', strengthVal: 85 },
    { symbol: 'US30', price: '42,850', trend: 'BULLISH', strengthLabel: 'MODERATE BULLISH', strengthVal: 55 },
    { symbol: 'NAS100', price: '20,380', trend: 'BULLISH', strengthLabel: 'STRONG BULLISH', strengthVal: 78 },
    { symbol: 'BTCUSD', price: '81,700', trend: 'BULLISH', strengthLabel: 'NEUTRAL', strengthVal: 14 }
  ];

  main.innerHTML = `<section class="page">
    ${pageHead('Screener', 'Market strength and directional bias')}
    <div style="font-size: 11.5px; color: #8e9aa8; margin-bottom: 12px; padding: 0 4px;">
      💡 Klik mana-mana pair untuk buka Signal & Live Chart
    </div>
    <div class="screener-grid">
      ${pairs.map(p => {
        const isUp = p.strengthVal > 0;
        const color = isUp ? 'var(--bull)' : p.strengthVal < 0 ? 'var(--bear)' : 'var(--solar-amber)';
        const pct = Math.abs(p.strengthVal);
        return `
          <div class="screener-card" data-sym="${esc(p.symbol)}" style="cursor:pointer; transition:transform 0.15s, border-color 0.15s;" title="Klik untuk analisis ${esc(p.symbol)}">
            <div class="screener-symbol">${esc(p.symbol)}</div>
            <div class="screener-price">${esc(p.price)}</div>
            <div class="gauge-visual">
              <svg viewBox="0 0 36 36" width="68" height="68">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${color}" stroke-dasharray="${pct}, 100" stroke-width="3.2" stroke-linecap="round" />
              </svg>
              <div class="gauge-val-center" style="position: absolute; color:${color};">
                ${p.strengthVal > 0 ? '+' : ''}${p.strengthVal}
              </div>
            </div>
            <span class="badge ${p.trend === 'BULLISH' ? 'open' : p.trend === 'BEARISH' ? 'bear' : 'gold'}" style="font-size: 10px;">
              ${p.trend}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  </section>`;

  $$('.screener-card', main).forEach(card => {
    card.onclick = () => {
      const sym = card.dataset.sym;
      if (sym) {
        store.set('selected_signal_sym', sym);
        if (typeof Market !== 'undefined') {
          Market.activeSymbol = sym;
          Market.updateUI();
        }
        location.hash = '#signal';
      }
    };
  });
}

// ---------- 5. News (White House Academy 100% Match: Top Stories + Economic Calendar) ----------
function NewsPage(main) {
  const stories = [
    { id: 1, flags: ['us', 'jp'], time: '4 hours ago', title: 'USD/JPY: Yen Hits 5-Week High at ¥156.10 as US Yields Slide, Japan Inflation Hits 2026 Peak' },
    { id: 2, flags: ['eu', 'us'], time: '4 days ago', title: 'EUR/USD: Euro Steady Near $1.1230 amid French Unrest Clouding Recovery' },
    { id: 3, flags: ['eu', 'us'], time: 'Oct 7', title: 'EUR/USD: Euro Rebounds Above $1.12 but Downtrend Is Still in Play. What’s Next?' },
    { id: 4, flags: ['eu', 'us'], time: 'Oct 5', title: 'EUR/USD Struggles as Traders Lift Rate-Hike Bets to 70%' }
  ];

  const calEvents = [
    { date: 'November 2', time: '23:00', name: 'ISM Manufacturing PMI', country: 'us', forecast: '54.5 Index' },
    { date: 'November 3', time: '23:00', name: 'JOLTS Job Openings', country: 'us', forecast: '7.079 M Pers' },
    { date: 'November 4', time: '21:15', name: 'ADP National Employment', country: 'us', forecast: '90 K Person' },
    { date: 'November 4', time: '22:45', name: 'S&P Global Comp PMI Final', country: 'us', forecast: '58.4 Index' },
    { date: 'November 4', time: '23:00', name: 'ISM N-Mfg PMI', country: 'us', forecast: '54.9 Index' }
  ];

  main.innerHTML = `<section class="page">
    ${pageHead('News', 'Live feed & economic calendar')}

    <!-- Top Stories Section -->
    <div class="card" style="margin-bottom: 20px; padding: 18px 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">Top Stories</h3>
        <svg width="20" height="14" viewBox="0 0 36 24" fill="rgba(255,255,255,0.4)">
          <path d="M0 19.5V4.5C0 3.67 0.67 3 1.5 3H6.5C7.33 3 8 3.67 8 4.5V19.5C8 20.33 7.33 21 6.5 21H1.5C0.67 21 0 20.33 0 19.5ZM13 14.5V4.5C13 3.67 13.67 3 14.5 3H19.5C20.33 3 21 3.67 21 4.5V14.5C21 15.33 20.33 16 19.5 16H14.5C13.67 16 13 15.33 13 14.5ZM26 21.5V4.5C26 3.67 26.67 3 27.5 3H32.5C33.33 3 34 3.67 34 4.5V21.5C34 22.33 33.33 23 32.5 23H27.5C26.67 23 26 22.33 26 21.5Z"/>
        </svg>
      </div>
      <div class="news-feed">
        ${stories.map(s => `
          <div class="news-item" data-id="${s.id}" style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
            <div class="news-meta" style="font-size: 11.5px; color: #8e9aa8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>${(s.flags || ['us']).map(flag).join(' ')}</span>
              <span>${s.time}</span>
            </div>
            <h4 style="font-size: 13.5px; line-height: 1.45; color: #f1f5f9; font-weight: 600;">${esc(s.title)}</h4>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Economic Calendar Section (100% Screenshot Match) -->
    <div style="margin-bottom: 10px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 2px;">Economic Calendar</h3>
      <p class="muted" style="font-size: 12px; margin-bottom: 14px;">High-impact US events today</p>

      <div class="stat-filter-row" style="margin-bottom: 8px;">
        <button class="stat-filter-pill active">Today</button>
        <button class="stat-filter-pill">Tomorrow</button>
        <button class="stat-filter-pill">Next Week</button>
      </div>

      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; margin-bottom:12px;">
        <span class="stat-filter-pill active" style="flex:none; padding:6px 12px;">🇺🇸 US</span>
        <span class="stat-filter-pill" style="flex:none; padding:6px 12px;">🇪🇺 EU</span>
        <span class="stat-filter-pill" style="flex:none; padding:6px 12px;">🇬🇧 UK</span>
        <span class="stat-filter-pill" style="flex:none; padding:6px 12px;">🇯🇵 JP</span>
        <span class="stat-filter-pill" style="flex:none; padding:6px 12px;">🌐 All</span>
      </div>

      <div class="card" style="padding: 16px;">
        ${calEvents.map(ev => `
          <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 11px; color: #8e9aa8; margin-bottom: 4px;">${ev.date}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <b style="font-family:'Space Grotesk',sans-serif; font-size: 13px; color: #fff;">${ev.time}</b>
                <span style="font-size: 12.5px; color: #cbd5e1;">${ev.name}</span>
              </div>
              <div style="font-size: 11.5px; color: #8e9aa8;">
                P: <b style="color: #fff;">${ev.forecast}</b>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
              <span>${flag(ev.country)}</span>
              <span style="display:inline-flex; gap:1.5px; align-items:flex-end; height:10px;">
                <i style="width:2px; height:4px; background:#38bdf8; border-radius:1px;"></i>
                <i style="width:2px; height:7px; background:#38bdf8; border-radius:1px;"></i>
                <i style="width:2px; height:10px; background:#38bdf8; border-radius:1px;"></i>
              </span>
            </div>
          </div>
        `).join('')}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 4px;">
          <a href="#news" onclick="event.preventDefault(); toast('Kalendar ekonomi dikemas kini secara langsung mengikut data White House Academy ✓');" style="color: #38bdf8; font-size: 12.5px; font-weight: 600;">More events ›</a>
          <svg width="20" height="14" viewBox="0 0 36 24" fill="rgba(255,255,255,0.4)">
            <path d="M0 19.5V4.5C0 3.67 0.67 3 1.5 3H6.5C7.33 3 8 3.67 8 4.5V19.5C8 20.33 7.33 21 6.5 21H1.5C0.67 21 0 20.33 0 19.5ZM13 14.5V4.5C13 3.67 13.67 3 14.5 3H19.5C20.33 3 21 3.67 21 4.5V14.5C21 15.33 20.33 16 19.5 16H14.5C13.67 16 13 15.33 13 14.5ZM26 21.5V4.5C26 3.67 26.67 3 27.5 3H32.5C33.33 3 34 3.67 34 4.5V21.5C34 22.33 33.33 23 32.5 23H27.5C26.67 23 26 22.33 26 21.5Z"/>
          </svg>
        </div>
      </div>
    </div>
  </section>`;
}

// ---------- 6. AI News (White House Academy 100% Match) ----------
function AiNewsPage(main) {
  main.innerHTML = `<section class="page">
    ${pageHead('AI News', 'High-impact news + AI directional bias (bullish/bearish)')}

    <!-- Quick Action Chips -->
    <div class="ainews-chips-row">
      <a class="ainews-chip" href="#screener">
        <span>📊</span>
        <span>Screener XAUUSD <b>4,024.90</b></span>
      </a>
      <a class="ainews-chip" href="#analysis">
        <span>📈</span>
        <span>Gold Analysis</span>
      </a>
    </div>

    <!-- Watching for the Next Big Release Card -->
    <div class="ainews-card-watch">
      <div class="ainews-mandala">
        <svg viewBox="0 0 48 48" width="56" height="56">
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,193,7,0.3)" stroke-width="1.2" stroke-dasharray="3 2" />
          <circle cx="24" cy="24" r="16" fill="none" stroke="rgba(255,109,0,0.5)" stroke-width="1.4" />
          <circle cx="24" cy="24" r="10" fill="rgba(255,109,0,0.15)" stroke="#ffc107" stroke-width="1.2" />
          <circle cx="24" cy="24" r="4" fill="#ff9100" />
        </svg>
      </div>

      <h3 style="font-family:'Space Grotesk',sans-serif; font-size: 19px; font-weight: 700; color: #fff; margin-bottom: 12px;">
        Watching for the next big release
      </h3>

      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 12px;">
        Eight hours before each high-impact US release, the AI projects XAUUSD and the US Dollar Index (DXY). Four hours before the release it checks the call again against the market.
      </p>

      <p style="font-size: 12px; color: #8e9aa8; line-height: 1.5; margin-bottom: 16px;">
        Until then, check the live screener or today's gold analysis above.
      </p>

      <div class="ainews-tags-group">
        <span class="ainews-tag">CPI</span>
        <span class="ainews-tag" style="border-color: rgba(255,193,7,0.4); color: #f5c451;">Non-Farm Payrolls</span>
        <span class="ainews-tag">FOMC</span>
        <span class="ainews-tag">GDP</span>
        <span class="ainews-tag">Fed speeches</span>
      </div>
    </div>
  </section>`;
}

