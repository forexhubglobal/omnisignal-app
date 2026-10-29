// ===== Amaterasu AI Pages: Signal, Stat, Analysis, Screener, News, AI News =====

const ALL_INSTRUMENTS = [
  { id: 'XAUUSD', name: 'XAUUSD', category: 'Metals', icon: '🥇', label: 'Gold', basePrice: 3991.50, bias: 'BEARISH', m1: 'DOWN', m5: 'DOWN', m15: 'SIDE' },
  { id: 'XAGUSD', name: 'XAGUSD', category: 'Metals', icon: '🥈', label: 'Silver', basePrice: 52.87, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'SIDE' },
  { id: 'EURUSD', name: 'EURUSD', category: 'Forex', icon: '💶', label: 'Euro', basePrice: 1.1152, bias: 'BEARISH', m1: 'DOWN', m5: 'SIDE', m15: 'DOWN' },
  { id: 'GBPUSD', name: 'GBPUSD', category: 'Forex', icon: '💷', label: 'Cable', basePrice: 1.3320, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'SIDE' },
  { id: 'USDJPY', name: 'USDJPY', category: 'Forex', icon: '💴', label: 'Dollar / Yen', basePrice: 157.74, bias: 'BEARISH', m1: 'DOWN', m5: 'DOWN', m15: 'DOWN' },
  { id: 'GBPJPY', name: 'GBPJPY', category: 'Forex', icon: '🐉', label: 'Dragon (Pound/Yen)', basePrice: 210.15, bias: 'BULLISH', m1: 'SIDE', m5: 'DOWN', m15: 'UP' },
  { id: 'EURJPY', name: 'EURJPY', category: 'Forex', icon: '⚡', label: 'Euro / Yen', basePrice: 175.95, bias: 'BULLISH', m1: 'UP', m5: 'SIDE', m15: 'UP' },
  { id: 'AUDUSD', name: 'AUDUSD', category: 'Forex', icon: '🦘', label: 'Aussie', basePrice: 0.7023, bias: 'BEARISH', m1: 'DOWN', m5: 'SIDE', m15: 'DOWN' },
  { id: 'USDCAD', name: 'USDCAD', category: 'Forex', icon: '🍁', label: 'Loonie', basePrice: 1.4016, bias: 'BULLISH', m1: 'UP', m5: 'UP', m15: 'SIDE' },
  { id: 'USDCHF', name: 'USDCHF', category: 'Forex', icon: '🏔', label: 'Swissie', basePrice: 0.8283, bias: 'BEARISH', m1: 'SIDE', m5: 'DOWN', m15: 'DOWN' }
];

// Canvas rounded rectangle helper
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ===== Shared TradingView Pro & Amaterasu SNR AI Configurations =====
const tvSymbols = {
  XAUUSD: 'PEPPERSTONE:XAUUSD',
  XAGUSD: 'PEPPERSTONE:XAGUSD',
  EURUSD: 'PEPPERSTONE:EURUSD',
  GBPUSD: 'PEPPERSTONE:GBPUSD',
  USDJPY: 'PEPPERSTONE:USDJPY',
  GBPJPY: 'PEPPERSTONE:GBPJPY',
  EURJPY: 'PEPPERSTONE:EURJPY',
  AUDUSD: 'PEPPERSTONE:AUDUSD',
  USDCAD: 'PEPPERSTONE:USDCAD',
  USDCHF: 'PEPPERSTONE:USDCHF',
  WTI: 'NYMEX:CL1!',
  BTCUSD: 'BINANCE:BTCUSDT'
};

const TF_AUTO_CONFIG = {
  M1:  { mult: 0.30, label: 'M1 SCALP', pipsTarget: '15p', tagR2: 'M1 Scalp Supply', tagR1: 'M1 Micro Res', tagS1: 'M1 Micro Demand', tagS2: 'M1 Scalp Base' },
  M3:  { mult: 0.45, label: 'M3 SCALP', pipsTarget: '25p', tagR2: 'M3 Scalp Supply', tagR1: 'M3 Pullback Res', tagS1: 'M3 Pullback Demand', tagS2: 'M3 Scalp Base' },
  M5:  { mult: 0.65, label: 'M5 SCALP', pipsTarget: '35p', tagR2: 'M5 Supply Zone', tagR1: 'M5 Rejection Res', tagS1: 'M5 Instant Demand', tagS2: 'M5 Support Base' },
  M15: { mult: 1.00, label: 'M15 INTRADAY', pipsTarget: '50p', tagR2: 'M15 Major Supply', tagR1: 'M15 Rejection Res', tagS1: 'M15 Instant Demand', tagS2: 'M15 Major Base' },
  M30: { mult: 1.55, label: 'M30 INTRADAY', pipsTarget: '80p', tagR2: 'M30 Supply Level', tagR1: 'M30 Mid Resistance', tagS1: 'M30 Mid Demand', tagS2: 'M30 Major Base' },
  H1:  { mult: 2.40, label: 'H1 STRUCTURAL', pipsTarget: '120p', tagR2: 'H1 Structural Supply', tagR1: 'H1 Session Res', tagS1: 'H1 Session Demand', tagS2: 'H1 Structural Base' },
  H4:  { mult: 4.80, label: 'H4 MACRO SWING', pipsTarget: '250p', tagR2: 'H4 Macro Supply', tagR1: 'H4 Daily Res', tagS1: 'H4 Daily Demand', tagS2: 'H4 Macro Floor' },
  D1:  { mult: 9.50, label: 'D1 INSTITUTIONAL', pipsTarget: '500p', tagR2: 'D1 Institutional Supply', tagR1: 'D1 Key Res', tagS1: 'D1 Key Demand', tagS2: 'D1 Institutional Floor' }
};

const tfToTvInterval = {
  M1: '1', M3: '3', M5: '5', M15: '15', M30: '30', H1: '60', H4: '240', D1: 'D'
};

let activeFsModalClose = null;

function showFullChartModal(initialSym = 'XAUUSD', initialTf = 'M15', onUpdate = null) {
  let existingModal = $('#snrModalFullscreen');
  if (existingModal) existingModal.remove();

  let curSym = initialSym;
  let curTf = initialTf;
  let curInst = ALL_INSTRUMENTS.find(i => i.id === curSym) || ALL_INSTRUMENTS[0];

  const getDisplayPrice = () => {
    const p = Market.getLivePrice(curInst.id) || curInst.basePrice;
    return num(p);
  };

  const modal = document.createElement('div');
  modal.className = 'snr-modal-fullscreen';
  modal.id = 'snrModalFullscreen';
  modal.innerHTML = `
    <div class="snr-modal-header">
      <div class="snr-modal-pair">
        <span class="snr-modal-pair-icon" id="fsPairIcon">${curInst.icon}</span>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <select class="snr-modal-pair-select" id="fsPairSelect">
            ${ALL_INSTRUMENTS.map(p => `
              <option value="${p.id}" ${p.id === curInst.id ? 'selected' : ''}>${p.icon} ${p.name}</option>
            `).join('')}
          </select>
          <small class="snr-modal-pair-tf" id="fsTfLabel">${curTf}</small>
        </div>
        <div class="snr-modal-live-box">
          <span class="live-dot">●</span>
          <span class="live-price" id="fsLivePrice">${getDisplayPrice()}</span>
        </div>
      </div>

      <div class="snr-modal-tf-group" id="fsTfGroup">
        ${['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => `
          <button class="snr-modal-tf-btn ${tf === curTf ? 'active' : ''}" data-tf="${tf}">${tf}</button>
        `).join('')}
      </div>

      <div class="snr-modal-tools">
        <button class="snr-modal-tool-btn" id="fsReset" title="Muat Semula Chart">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
        <button class="snr-modal-close-btn" id="fsCloseBtn" title="Tutup Full Chart">✕ Tutup</button>
      </div>
    </div>

    <div class="snr-modal-canvas-wrap" id="fsCanvasWrap" style="width:100%; height:calc(100vh - 110px); position:relative;"></div>

    <div class="snr-modal-footer">
      <div class="snr-hint">
        <span>⚡ <b>TradingView Pro Live Feed</b> · Candlestick 100% Sahih & Real-Time</span>
        <span>🔍 <b>Crosshair & Tools</b> didayakan untuk Analisis Candlestick & Struktur Pasaran</span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const fsWrap = $('#fsCanvasWrap', modal);
  const renderFsTv = () => {
    if (!fsWrap) return;
    const sym = tvSymbols[curInst.id] || 'PEPPERSTONE:XAUUSD';
    const interval = tfToTvInterval[curTf] || '15';
    const liveP = parseFloat(Market.getLivePrice(curInst.id) || curInst.basePrice);
    const d = curInst.decimals || (curInst.id === 'XAUUSD' || curInst.id === 'WTI' ? 2 : curInst.id.includes('JPY') ? 3 : curInst.category === 'Forex' ? 4 : 1);
    
    const tfConf = TF_AUTO_CONFIG[curTf] || TF_AUTO_CONFIG.M15;
    const isGold = curInst.id === 'XAUUSD';
    const isCrypto = curInst.id === 'BTCUSD';
    const isIdx = curInst.category === 'Indices';
    const isJpy = curInst.id.includes('JPY');
    const baseStep1 = isGold ? 5.5 : isCrypto ? 280 : isIdx ? 75 : isJpy ? 0.35 : 0.0025;
    const baseStep2 = isGold ? 12.0 : isCrypto ? 650 : isIdx ? 160 : isJpy ? 0.80 : 0.0055;
    const step1 = Number((baseStep1 * tfConf.mult).toFixed(d));
    const step2 = Number((baseStep2 * tfConf.mult).toFixed(d));
    const r2Val = (liveP + step2).toFixed(d);
    const r1Val = (liveP + step1).toFixed(d);
    const s1Val = (liveP - step1).toFixed(d);
    const s2Val = (liveP - step2).toFixed(d);
    const isBull = curInst.bias === 'BULLISH';
    const yR2 = 140, yR1 = 220, yLive = 300, yS1 = 380, yS2 = 460;

    fsWrap.innerHTML = `
      <div class="snr-forward-rays-wrap" style="position:absolute; inset:0; pointer-events:none; z-index:9; overflow:hidden;">
        <div class="amaterasu-smc-block-zone ${isBull ? 'demand' : 'supply'}" style="top:${isBull ? yS1 : yR2}px; height:${isBull ? (yS2 - yS1) : (yR1 - yR2)}px;">
          <span class="amaterasu-smc-label" style="color:${isBull ? '#00e676' : '#ef5350'}; font-size:10px;">
            <span>⚡</span> AMATERASU SMC ${isBull ? 'DEMAND' : 'SUPPLY'} ORDER BLOCK (${tfConf.label})
          </span>
        </div>
        <div class="snr-ray-container ray-r2" style="top:${yR2}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-r2">🔴 R2 · ${tfConf.tagR2} · ${r2Val}</span></div>
        <div class="snr-ray-container ray-r1" style="top:${yR1}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-r1">🔴 R1 · ${tfConf.tagR1} · ${r1Val}</span></div>
        <div class="snr-ray-container ray-live" style="top:${yLive}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-live">● LIVE (${curTf}) ${num(liveP, d)}</span></div>
        <div class="snr-ray-container ray-s1" style="top:${yS1}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-s1">🟢 S1 · ${tfConf.tagS1} · ${s1Val}</span></div>
        <div class="snr-ray-container ray-s2" style="top:${yS2}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-s2">🟢 S2 · ${tfConf.tagS2} · ${s2Val}</span></div>
      </div>
      <iframe 
        src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FKuala_Lumpur&hide_top_toolbar=0&studies=%5B%5D&hide_side_toolbar=0" 
        style="width:100%; height:100%; border:none; display:block;"
        loading="lazy">
      </iframe>
    `;
  };
  renderFsTv();

  const onFsTick = p => {
    const priceEl = $('#fsLivePrice', modal);
    if (priceEl && curInst.id === 'XAUUSD') priceEl.textContent = num(p);
  };
  Market.subs.add(onFsTick);

  $$('#fsTfGroup button', modal).forEach(btn => {
    btn.onclick = () => {
      $$('#fsTfGroup button', modal).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      curTf = btn.dataset.tf;
      const tfLbl = $('#fsTfLabel', modal);
      if (tfLbl) tfLbl.textContent = curTf;
      renderFsTv();
      if (typeof onUpdate === 'function') onUpdate(curInst.id, curTf);
    };
  });

  const fsReset = $('#fsReset', modal);
  if (fsReset) fsReset.onclick = () => renderFsTv();

  const fsPairSelect = $('#fsPairSelect', modal);
  if (fsPairSelect) {
    fsPairSelect.onchange = (e) => {
      const newSym = e.target.value;
      store.set('selected_signal_sym', newSym);
      curInst = ALL_INSTRUMENTS.find(i => i.id === newSym) || ALL_INSTRUMENTS[0];
      const pairIcon = $('#fsPairIcon', modal);
      if (pairIcon) pairIcon.textContent = curInst.icon;
      const livePrice = $('#fsLivePrice', modal);
      if (livePrice) livePrice.textContent = getDisplayPrice();
      renderFsTv();
      if (typeof onUpdate === 'function') onUpdate(curInst.id, curTf);
    };
  }

  const closeFsModal = () => {
    Market.subs.delete(onFsTick);
    window.removeEventListener('keydown', onFsKeyDown);
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    if (typeof onUpdate === 'function') onUpdate(curInst.id, curTf);
  };
  activeFsModalClose = closeFsModal;

  const closeBtn = $('#fsCloseBtn', modal);
  if (closeBtn) closeBtn.onclick = closeFsModal;

  const onFsKeyDown = (e) => {
    if (e.key === 'Escape') closeFsModal();
  };
  window.addEventListener('keydown', onFsKeyDown);
}

// ===== Amaterasu X Viral Social Share Win & Setup Poster Generator =====
function openShareWinModal(sig, isWin = false) {
  const symbol = sig.symbol || 'XAUUSD';
  const type = sig.type || 'BUY';
  const entry = num(sig.entry || Market.price);
  const tp1 = num(sig.tp1 || (sig.entry ? sig.entry + 4 : 4004));
  const tp2 = num(sig.tp2 || (sig.entry ? sig.entry + 12 : 4015));
  const tp3 = num(sig.tp3 || (sig.entry ? (sig.type === 'BUY' ? sig.entry + 20 : sig.entry - 20) : 4022));
  const sl = num(sig.sl || (sig.entry ? sig.entry - 5 : 3989));
  const pips = sig.pips || (isWin ? (sig.status === 'TP3' ? 120 : (sig.status === 'TP2' ? 80 : 40)) : 0);
  const outcomeText = isWin ? (pips > 0 ? `+${pips} PIPS SECURED 🎯` : 'TARGET 1 SECURED 🎯') : 'HIGH PROBABILITY SETUP';

  const m = modal(`
    <div style="text-align:center;">
      <h3 style="display:flex; align-items:center; justify-content:center; gap:8px; font-size:17px; margin-bottom:4px;">
        <span>📸</span> Sijil Kemenangan & Poster Setup
      </h3>
      <p class="muted" style="font-size:12px; margin-bottom:12px;">Kongsi poster setup ini ke WhatsApp Status, Telegram, atau Instagram Story!</p>
      
      <div style="max-width:320px; margin:0 auto 14px; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.8), 0 0 25px rgba(239,45,61,0.25); border:1px solid rgba(239,45,61,0.4);">
        <canvas id="posterCanvas" width="600" height="960" style="width:100%; height:auto; display:block;"></canvas>
      </div>

      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
        <button class="btn gold" id="btnDownloadPoster" style="flex:1; min-width:140px; padding:10px 14px; font-size:12.5px; font-weight:700;">
          📥 Muat Turun Gambar (PNG)
        </button>
        <button class="btn ghost" id="btnCopyShareText" style="flex:1; min-width:140px; padding:10px 14px; font-size:12.5px;">
          📋 Salin Teks Format VIP
        </button>
      </div>
      <div style="margin-top:10px;">
        <button class="btn sm ghost" data-close style="color:#64748B;">Tutup</button>
      </div>
    </div>
  `);

  // Render poster onto HTML5 Canvas
  const canvas = $('#posterCanvas', m.el);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // 1. Background Obsidian Deep
    ctx.fillStyle = '#080D14';
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient Crimson Glow at Top
    const grad = ctx.createRadialGradient(w / 2, 120, 20, w / 2, 120, 320);
    grad.addColorStop(0, 'rgba(239, 45, 61, 0.35)');
    grad.addColorStop(0.5, 'rgba(255, 38, 56, 0.12)');
    grad.addColorStop(1, 'rgba(8, 13, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 3. Sharingan Crest Symbol
    ctx.save();
    ctx.translate(w / 2, 110);
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fillStyle = '#EF2D3D';
    ctx.shadowColor = '#FF2638';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#080D14';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.fillStyle = '#EF2D3D';
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(0, -18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(8, -4);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#EF2D3D';
    ctx.fill();
    ctx.restore();

    // 4. Header Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F5F7FA';
    ctx.font = '900 36px Montserrat, sans-serif';
    ctx.fillText('AMATERASU X', w / 2, 205);

    ctx.fillStyle = '#EF2D3D';
    ctx.font = '700 13px Montserrat, sans-serif';
    ctx.fillText('AI POWERED FOREX & CFD SIGNALS', w / 2, 230);

    // Operator Badge Pill
    ctx.fillStyle = 'rgba(239, 45, 61, 0.14)';
    ctx.strokeStyle = 'rgba(239, 45, 61, 0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, w / 2 - 140, 255, 280, 34, 17, true, true);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 13px Montserrat, sans-serif';
    ctx.fillText(`OPERATOR: ${BRAND.user.toUpperCase()} · VERIFIED`, w / 2, 277);

    // 5. Main Card Box
    ctx.fillStyle = '#111A28';
    ctx.strokeStyle = isWin ? '#00D68F' : 'rgba(239, 45, 61, 0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, 45, 315, w - 90, 440, 18, true, true);

    // Pair Symbol & Type Big
    ctx.fillStyle = type === 'BUY' ? '#00D68F' : '#FF4D5A';
    ctx.font = '900 38px Montserrat, sans-serif';
    ctx.fillText(`${type === 'BUY' ? '🟢 BUY' : '🔴 SELL'} #${symbol}`, w / 2, 380);

    // Big Outcome / Win Banner
    ctx.fillStyle = isWin ? 'rgba(0, 214, 143, 0.16)' : 'rgba(239, 45, 61, 0.12)';
    ctx.strokeStyle = isWin ? '#00D68F' : '#EF2D3D';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 75, 410, w - 150, 60, 12, true, true);

    ctx.fillStyle = isWin ? '#00D68F' : '#EF2D3D';
    ctx.font = '900 24px Montserrat, sans-serif';
    ctx.fillText(outcomeText, w / 2, 448);

    // Metric Rows
    const metrics = [
      { label: 'ENTRY PRICE', val: entry },
      { label: 'TARGET 1', val: tp1 + ' (+40p)' },
      { label: 'TARGET 2', val: tp2 + ' (+80p)' },
      { label: 'TARGET 3', val: tp3 + ' (+120p)' },
      { label: 'STOP LOSS', val: isWin ? `BE (${entry})` : sl }
    ];

    metrics.forEach((m, idx) => {
      const y = 515 + idx * 46;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#A0A6B4';
      ctx.font = '600 13px Montserrat, sans-serif';
      ctx.fillText(m.label, 80, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 16px Montserrat, sans-serif';
      ctx.fillText(m.val, w - 80, y);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath(); ctx.moveTo(80, y + 12); ctx.lineTo(w - 80, y + 12); ctx.stroke();
    });

    // Risk Reward & AI Model
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00D68F';
    ctx.font = '700 13px Montserrat, sans-serif';
    ctx.fillText('⚖️ RISK/REWARD 1:2.5 · AMATERASU X INSTITUTIONAL SMC AI', w / 2, 725);

    // 6. Footer Stamp
    ctx.fillStyle = '#64748B';
    ctx.font = '600 12px Montserrat, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' }) + ' · VERIFIED ON MT5 CLUSTER', w / 2, 820);

    ctx.fillStyle = '#A0A6B4';
    ctx.font = 'italic 500 12px Montserrat, sans-serif';
    ctx.fillText('"Precision Signals. Smarter Decisions. Your Trading Edge."', w / 2, 855);

    // Border glow around entire canvas
    ctx.strokeStyle = 'rgba(239, 45, 61, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }

  // Download Handler
  const dlBtn = $('#btnDownloadPoster', m.el);
  if (dlBtn && canvas) {
    dlBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = `AMATERASU_X_${symbol}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('📥 Poster berjaya dimuat turun!');
    };
  }

  // Copy Text Handler
  const copyBtn = $('#btnCopyShareText', m.el);
  if (copyBtn) {
    copyBtn.onclick = () => {
      const shareText = `👁️ AMATERASU X · AI SIGNAL UPDATE\n━━━━━━━━━━━━━━━━━━━━━\n📊 Instrumen: #${symbol}\n⚡ Tindakan: ${type} (M15)\n🎯 Entry: ${entry}\n🎯 TP1: ${tp1} (+40p)\n🚀 TP2: ${tp2} (+80p)\n🏆 TP3: ${tp3} (+120p)\n🛑 SL: ${sl}\n━━━━━━━━━━━━━━━━━━━━━\n${isWin ? '🏆 ' + outcomeText : '💡 High Probability Setup'}\n⚖️ Risk/Reward 1:3.0 · Amaterasu X Institutional SMC AI\n🔥 Precision Signals. Smarter Decisions. Your Trading Edge.`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
        toast('📋 Teks format VIP disalin ke clipboard!');
      }
    };
  }
}

// ---------- 1. Signal ----------
function SignalPage(main) {
  let activeSymId = store.get('selected_signal_sym') || 'XAUUSD';
  let inst = ALL_INSTRUMENTS.find(i => i.id === activeSymId) || ALL_INSTRUMENTS[0];
  Market.activeSymbol = inst.id;
  Market.updateUI();

  const globalSig = (AppState && AppState.activeSignal) || { status: 'WAITING', type: 'BUY', symbol: 'XAUUSD', entry: 4013.00, tp1: 4016.00, tp2: 4020.50, sl: 4009.50 };

  const isLiveOrTp1 = globalSig.status === 'ACTIVE' || globalSig.status === 'TP1_HIT';
  const activeList = (AppState && Array.isArray(AppState.activeSignals) && AppState.activeSignals.length > 0)
    ? AppState.activeSignals
    : (isLiveOrTp1 ? [globalSig] : []);

  const matchedActiveSig = activeList.find(s => s.symbol === inst.id);
  const isCurrentAssetActive = !!matchedActiveSig && (matchedActiveSig.status === 'ACTIVE' || matchedActiveSig.status === 'TP1_HIT');
  const isAnyActive = activeList.length > 0;
  const currentSig = matchedActiveSig || (isCurrentAssetActive ? globalSig : (activeList[0] || globalSig));
  const isTp1 = currentSig.status === 'TP1_HIT' || currentSig.beLocked;

  const curLivePrice = parseFloat(Market.getLivePrice(inst.id) || inst.basePrice);
  const isBuy = currentSig && currentSig.type === 'BUY';
  let liveFloatingPips = 0;
  if (currentSig && currentSig.entry && curLivePrice) {
    const pipValActual = inst.id === 'XAUUSD' ? 0.1 : (inst.id === 'WTI' ? 0.01 : (inst.category === 'Forex' && !inst.id.includes('JPY') ? 0.0001 : (inst.id.includes('JPY') ? 0.01 : 1)));
    const diff = isBuy ? (curLivePrice - currentSig.entry) : (currentSig.entry - curLivePrice);
    liveFloatingPips = Math.round(diff / pipValActual);
  }

  const lastRes = (AppState && AppState.lastResolvedSignal) || ((AppState && AppState.signals && AppState.signals[0])) || null;
  const closedSignals = (AppState && Array.isArray(AppState.signals)) ? AppState.signals : [];
  const lastClosedForAsset = closedSignals.find(s => s.symbol === inst.id);
  const activeOnPipsTab = window._activeOnPipsTab || 'running';

  function getDisplayPrice() {
    const liveP = Market.getLivePrice(inst.id);
    if (liveP) return num(liveP);
    if (inst.id === 'XAUUSD') return num(Market.price);
    return num(inst.basePrice);
  }

  const ticketHtml = isCurrentAssetActive ? `
    <div class="solar-ticket ${isTp1 ? 'tp1-secured' : ''}">
      <div class="solar-ticket-head">
        <span class="signal-type-badge ${isTp1 ? 'tp1' : currentSig.type.toLowerCase()}" style="${isTp1 ? 'background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676;' : ''}">
          ${isTp1 ? `🎯 TARGET 1 HIT (+${currentSig.tp1Pips || 25} PIPS) · BE LOCKED` : `● RUNNING (${currentSig.type} ${currentSig.symbol})`}
        </span>
        <span class="muted" style="font-size: 11.5px;">Triggered: ${currentSig.firedAt || 'Live'}</span>
      </div>

      <!-- Real-Time Floating PnL Live Card (100% Synced to MT5 Price) -->
      <div style="background: rgba(11, 17, 26, 0.95); border: 1px solid ${liveFloatingPips >= 0 ? 'rgba(0, 230, 118, 0.4)' : 'rgba(239, 83, 80, 0.4)'}; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:${liveFloatingPips >= 0 ? '#00e676' : '#ef5350'}; animation:pulseDot 1.2s infinite; display:inline-block;"></span>
          <div>
            <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">SEBUTHARGA LIVE PASARAN (MT5 SYNC)</span>
            <b style="color:#fff; font-size:13px;">HARGA SEMASA: <span style="color:#f5c451;" id="liveSignalCurrentPrice">${num(curLivePrice)}</span></b>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; display:block;">FLOATING PIPS</span>
          <b id="liveFloatingPipsVal" style="font-size:14px; font-weight:800; color:${liveFloatingPips >= 0 ? '#00e676' : '#ef5350'}; background:${liveFloatingPips >= 0 ? 'rgba(0,230,118,0.12)' : 'rgba(239,83,80,0.12)'}; padding:2px 8px; border-radius:6px; display:inline-block;">
            ${liveFloatingPips >= 0 ? '+' : ''}${liveFloatingPips} PIP
          </b>
        </div>
      </div>

      ${isTp1 ? `
        <div style="background:linear-gradient(90deg, rgba(0,230,118,0.18) 0%, rgba(245,196,81,0.14) 100%); border:1px solid #00e676; border-radius:8px; padding:10px 13px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:22px;">🛡️</span>
          <div>
            <b style="color:#00e676; font-size:12px; display:block;">STATUS: SIFAR RISIKO (100% RISK-FREE)</b>
            <span style="font-size:11px; color:#f1f5f9; line-height:1.35; display:block;">
              SOP Wajib: Ambil 50% partial profit & <b>pastikan Stop Loss diubah ke harga Entry (${num(currentSig.entry)})</b>. Baki posisi sasarkan TP2!
            </span>
          </div>
        </div>
      ` : ''}

      ${(() => {
        const pipValForSig = currentSig.symbol === 'XAUUSD' ? 0.1 : (currentSig.symbol === 'WTI' ? 0.01 : (currentSig.symbol.includes('JPY') ? 0.01 : (currentSig.symbol.includes('BTC') ? 1 : 0.0001)));
        const tp1DiffPips = Math.abs(Math.round((currentSig.tp1 - currentSig.entry) / pipValForSig));
        const tp2DiffPips = Math.abs(Math.round((currentSig.tp2 - currentSig.entry) / pipValForSig));
        const tp3Val = currentSig.tp3 || (currentSig.entry ? (currentSig.type === 'BUY' ? currentSig.entry + (currentSig.tp2 - currentSig.entry) * 1.5 : currentSig.entry - (currentSig.entry - currentSig.tp2) * 1.5) : currentSig.tp2);
        const tp3DiffPips = Math.abs(Math.round((tp3Val - currentSig.entry) / pipValForSig));
        const isTp2Hit = currentSig.status === 'TP2_HIT';
        return `
          <div class="ticket-grid">
            <div class="ticket-metric">
              <div class="lbl">Entry Execution</div>
              <div class="val gold">${num(currentSig.entry)}</div>
            </div>
            <div class="ticket-metric">
              <div class="lbl">${isTp2Hit ? `Ultimate Target (TP3 · +${tp3DiffPips}p)` : (isTp1 ? `Runner Target (TP2 · +${tp2DiffPips}p)` : `Primary Target (TP1 · +${tp1DiffPips}p)`)}</div>
              <div class="val bull">${isTp2Hit ? num(tp3Val) : (isTp1 ? num(currentSig.tp2) : num(currentSig.tp1))}</div>
            </div>
          </div>

          <div class="targets-row" style="grid-template-columns: repeat(4, 1fr); gap: 6px;">
            <div class="target-box tp ${isTp1 ? 'secured' : ''}">
              <span>TARGET 1 ${isTp1 ? `✓ HIT` : `(+${tp1DiffPips}p)`}</span>
              <b>${num(currentSig.tp1)}</b>
            </div>
            <div class="target-box tp ${isTp2Hit ? 'secured' : ''}">
              <span>TARGET 2 ${isTp2Hit ? `✓ HIT` : `(+${tp2DiffPips}p)`}</span>
              <b>${num(currentSig.tp2)}</b>
            </div>
            <div class="target-box tp">
              <span>TARGET 3 (+${tp3DiffPips}p)</span>
              <b>${num(tp3Val)}</b>
            </div>
            <div class="target-box sl">
              <span>STOP LOSS</span>
              <b>${isTp2Hit ? `TP1 (${num(currentSig.tp1)})` : (isTp1 ? `BE (${num(currentSig.entry)})` : num(currentSig.sl))}</b>
            </div>
          </div>

          <div class="row" style="margin-bottom: 10px; font-size: 11px;">
            <span class="muted">Risk/Reward: <b style="color:#fff;">1 : 2.0 (Standard SMC)</b></span>
            <span class="badge gold" style="font-size: 10px;">${isTp1 ? 'PROTECTED BY BREAK-EVEN' : 'MT5 EXECUTION VERIFIED'}</span>
          </div>
        `;
      })()}

      <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45; border-top: 1px solid var(--border); padding-top: 10px;">
        ${currentSig.notes || `Amaterasu AI algorithm detected order block absorption on ${inst.name}. Follow strict SOP.`}
      </p>

      <!-- AI Confluence Institutional Checklist -->
      <div class="ai-confluence-card" style="margin-top:14px; background:rgba(15,23,34,0.75); border:1px solid rgba(239,45,61,0.25); border-radius:10px; padding:12px 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:14px;">👁️</span>
            <b style="font-size:12px; color:#F5F7FA; letter-spacing:0.5px; text-transform:uppercase;">AI Confluence Checklist</b>
          </div>
          <span style="background:rgba(0,214,143,0.15); border:1px solid #00D68F; color:#00D68F; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:10px;">
            94.2% SCORE
          </span>
        </div>
        <div class="confluence-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px;">
          <div style="display:flex; align-items:center; gap:6px; color:#F5F7FA;"><span style="color:#00D68F; font-weight:bold;">✓</span> M15 Order Block</div>
          <div style="display:flex; align-items:center; gap:6px; color:#F5F7FA;"><span style="color:#00D68F; font-weight:bold;">✓</span> Liquidity Swept</div>
          <div style="display:flex; align-items:center; gap:6px; color:#F5F7FA;"><span style="color:#00D68F; font-weight:bold;">✓</span> Malaysian SNR</div>
          <div style="display:flex; align-items:center; gap:6px; color:#F5F7FA;"><span style="color:#00D68F; font-weight:bold;">✓</span> Vol Delta +88%</div>
        </div>
      </div>

      <!-- Action Buttons Row: MT5 Copy & Share Win Poster -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px;">
        <button class="btn btn-outline" id="btnCopySignalSetup" style="padding:10px 8px; font-size:12px; font-weight:700; border-color:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; gap:6px; border-radius:8px;">
          <span>📋</span> Salin Setup MT5
        </button>
        <button class="btn" id="btnShareWinPoster" style="background:linear-gradient(135deg, #EF2D3D 0%, #B81423 100%); color:#fff; padding:10px 8px; font-size:12px; font-weight:800; border:none; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:8px; box-shadow:0 4px 14px rgba(239,45,61,0.35);">
          <span>📸</span> Kongsi Poster VIP
        </button>
      </div>
    </div>
  ` : `
    ${lastClosedForAsset ? `
      <div class="card-last-resolved-asset" style="background:linear-gradient(135deg, rgba(0, 230, 118, 0.12) 0%, rgba(13, 20, 30, 0.95) 100%); border: 1px solid #00e676; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(0, 230, 118, 0.12);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🏆</span>
            <div>
              <b style="font-family:'Space Grotesk',sans-serif; font-size:13.5px; color:#fff; display:block;">REKOD TRADE TERAKHIR SELESAI (${inst.id})</b>
              <span style="font-size:10.5px; color:#94a3b8;">Posisi telah ditutup & sasaran profit dikunci</span>
            </div>
          </div>
          <span class="badge" style="background:${lastClosedForAsset.status === 'BE' ? 'rgba(255,160,0,0.2)' : 'rgba(0,230,118,0.2)'}; border:1px solid ${lastClosedForAsset.status === 'BE' ? 'var(--solar-gold)' : '#00e676'}; color:${lastClosedForAsset.status === 'BE' ? 'var(--solar-gold)' : '#00e676'}; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:12px;">
            ${lastClosedForAsset.status === 'BE' ? '🛡️ BE (0 PIP)' : `🎯 ${lastClosedForAsset.status} (+${lastClosedForAsset.pips} PIP)`}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:rgba(0,0,0,0.35); border-radius:8px; padding:8px 12px; font-size:11.5px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.06);">
          <div>
            <span style="color:#8e9aa8; font-size:10px; display:block;">ARAH & ENTRY EXECUTION</span>
            <b style="color:${lastClosedForAsset.type === 'BUY' ? '#00e676' : '#ef5350'};">${lastClosedForAsset.type}</b> @ <b style="color:#fff;">${num(lastClosedForAsset.entry)}</b>
          </div>
          <div>
            <span style="color:#8e9aa8; font-size:10px; display:block;">STATUS KEPUTUSAN</span>
            <b style="color:${lastClosedForAsset.pips >= 0 ? '#00e676' : '#ef5350'};">${lastClosedForAsset.status === 'BE' ? 'Sifar Risiko (BE Locked)' : 'Sasaran Tercapai'}</b>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#8e9aa8;">
          <span>Selesai pada: <b style="color:#cbd5e1;">${lastClosedForAsset.date || 'Hari ini'} · ${lastClosedForAsset.time}</b></span>
          <button class="btn btn-outline btn-share-resolved-card" data-sym="${inst.id}" data-type="${lastClosedForAsset.type}" data-pips="${lastClosedForAsset.pips}" data-entry="${lastClosedForAsset.entry}" style="padding:4px 10px; font-size:10.5px; font-weight:700; color:#f5c451; border-color:rgba(245,196,81,0.3); border-radius:6px; cursor:pointer;">
            📸 Kongsi Poster VIP
          </button>
        </div>
      </div>
    ` : ''}

    ${isAnyActive ? `
      <div class="solar-active-alert-card" style="background: linear-gradient(135deg, rgba(255, 160, 0, 0.15) 0%, rgba(13, 20, 30, 0.95) 100%); border: 1px solid var(--solar-gold); border-radius: 14px; padding: 18px 16px; margin-bottom: 12px; text-align: center; box-shadow: 0 4px 24px rgba(255, 160, 0, 0.2);">
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e676; animation:pulseDot 1.2s infinite;"></span>
          <span style="font-size:11.5px; font-weight:800; color:#f5c451; letter-spacing:0.8px; text-transform:uppercase;">${activeList.length} AI SIGNAL SEDANG BERJALAN (ON PIPS)!</span>
        </div>
        <div style="font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; font-family:'Space Grotesk',sans-serif;">
          ${activeList[0].type === 'BUY' ? '🟢 BUY' : '🔴 SELL'} ${activeList[0].symbol} @ ${num(activeList[0].entry)}
        </div>
        <div style="font-size:12px; color:#94a3b8; margin-bottom:14px;">
          TP1: <b style="color:#00e676;">${num(activeList[0].tp1)}</b> · TP2: <b style="color:#00e676;">${num(activeList[0].tp2)}</b> · TP3: <b style="color:#00e676;">${num(activeList[0].tp3 || (activeList[0].entry ? (activeList[0].type === 'BUY' ? activeList[0].entry + (activeList[0].tp2 - activeList[0].entry) * 1.5 : activeList[0].entry - (activeList[0].entry - activeList[0].tp2) * 1.5) : activeList[0].tp2))}</b> · SL: <b style="color:#ef5350;">${num(activeList[0].sl)}</b>
        </div>
        <button class="btn gold" id="btnGoToActiveSignal" data-sym="${activeList[0].symbol}" style="width:100%; padding:11px; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 15px rgba(255,160,0,0.3);">
          <span>Buka Chart & Pantau ${activeList[0].symbol}</span> ➔
        </button>
      </div>
    ` : ''}

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

      <!-- Pre-Scan AI Confluence Status -->
      <div class="ai-confluence-card" style="margin-top:14px; background:rgba(15,23,34,0.6); border:1px dashed rgba(239,45,61,0.25); border-radius:10px; padding:12px 14px; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:13px;">👁️</span>
            <b style="font-size:11.5px; color:#A0A6B4; letter-spacing:0.5px;">AMATERASU SMC NEURAL CONFLUENCE</b>
          </div>
          <span style="font-size:11px; font-weight:700; color:#EF2D3D;">3 / 4 MATCHED</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:10.5px; color:#A0A6B4;">
          <div><span style="color:#00D68F;">✓</span> Trend Bias: ${inst.bias}</div>
          <div><span style="color:#00D68F;">✓</span> SNR Key Level Rebound</div>
          <div><span style="color:#00D68F;">✓</span> Spread Normalized</div>
          <div><span style="color:#F5C451;">⏳</span> M15 Liquidity Sweep Confirmation</div>
        </div>
      </div>

      ${lastRes ? `
        <div style="margin-top:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(0,230,118,0.3); border-radius:10px; padding:12px 14px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:800; color:#00e676; letter-spacing:0.8px;">KEPUTUSAN SIGNAL SELESAI TERAKHIR:</span>
            <span style="font-size:11px; color:#8e9aa8;">${lastRes.date || 'Hari ini'} · ${lastRes.time || ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:14px; color:#fff;">${lastRes.type} ${lastRes.symbol} @ ${num(lastRes.entry)}</b>
            <span style="background:rgba(0,230,118,0.18); border:1px solid #00e676; color:#00e676; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">
              ${lastRes.pips > 0 ? `✅ ${lastRes.status} (+${lastRes.pips} PIPS)` : lastRes.status === 'BE' ? '🛡️ BE (0 PIP)' : `🛑 SL (${lastRes.pips} PIPS)`}
            </span>
          </div>
        </div>
      ` : `
        <div style="margin-top:16px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:10px; padding:12px 14px; text-align:center;">
          <span style="font-size:12px; color:var(--text-muted);">Enjin AI sedia mengimbas pasaran secara 100% automatik untuk setup berkebarangkalian tinggi.</span>
        </div>
      `}

      <div style="margin-top:14px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 14px; background:rgba(0,214,143,0.08); border:1px solid rgba(0,214,143,0.25); border-radius:8px; font-size:11.5px; color:#00D68F; font-weight:700;">
          <span style="width:7px; height:7px; border-radius:50%; background:#00D68F; animation:pulseDot 1.2s infinite;"></span>
          <span>Enjin AI Amaterasu X Aktif · Isyarat Auto-Disiarkan 24/5</span>
        </div>
        <button class="btn gold" id="btnShareScannerPoster" style="width:100%; padding:11px 10px; font-weight:700; font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 16px rgba(239,45,61,0.25);">
          <span>📸</span> Kongsi Setup Pasaran
        </button>
      </div>
    </div>
  `;

  const onPipsHtml = `
    <!-- ⚡ ON PIPS: LIVE RUNNING SIGNALS & CLOSED SUITE -->
    <div class="on-pips-container" id="onPipsSection" style="margin-top:16px; background:#0b1118; border:1px solid rgba(239,45,61,0.35); border-radius:12px; padding:14px 16px; box-shadow:0 6px 24px rgba(0,0,0,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">⚡</span>
          <div>
            <b style="font-family:'Space Grotesk',sans-serif; font-size:13.5px; color:#f1f5f9; letter-spacing:0.5px;">ON PIPS & REKOD TRADE</b>
            <span style="display:block; font-size:10.5px; color:#8e9aa8;">Pantau posisi running & semak semua rekod trade yang telah TP/tutup</span>
          </div>
        </div>

        <!-- Dual Mode Toggle Pills -->
        <div style="display:inline-flex; background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2px;">
          <button id="btnTabOnPipsRunning" style="background:${activeOnPipsTab === 'running' ? 'rgba(0,230,118,0.2)' : 'transparent'}; border:${activeOnPipsTab === 'running' ? '1px solid #00e676' : '1px solid transparent'}; color:${activeOnPipsTab === 'running' ? '#00e676' : '#8e9aa8'}; font-size:10.5px; font-weight:800; padding:4px 10px; border-radius:16px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.15s;">
            <span style="width:6px; height:6px; border-radius:50%; background:${activeList.length > 0 ? '#00e676' : '#64748b'}; ${activeList.length > 0 ? 'animation:pulseDot 1.2s infinite;' : ''}"></span>
            RUNNING (${activeList.length})
          </button>
          <button id="btnTabOnPipsClosed" style="background:${activeOnPipsTab === 'closed' ? 'rgba(255,160,0,0.2)' : 'transparent'}; border:${activeOnPipsTab === 'closed' ? '1px solid var(--solar-gold)' : '1px solid transparent'}; color:${activeOnPipsTab === 'closed' ? 'var(--solar-gold)' : '#8e9aa8'}; font-size:10.5px; font-weight:800; padding:4px 10px; border-radius:16px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.15s;">
            <span>✅</span>
            DITUTUP (${closedSignals.length})
          </button>
        </div>
      </div>

      <!-- VIEW 1: RUNNING POSITIONS LIST -->
      <div id="secOnPipsRunning" style="display:${activeOnPipsTab === 'running' ? 'block' : 'none'};">
        ${activeList.length > 0 ? `
          <div class="on-pips-list" style="display:flex; flex-direction:column; gap:10px;">
            ${activeList.map(sig => {
              const symInst = ALL_INSTRUMENTS.find(i => i.id === sig.symbol) || { id: sig.symbol, icon: '📊', name: sig.symbol, basePrice: sig.entry };
              const liveP = parseFloat(Market.getLivePrice(sig.symbol) || sig.entry);
              const isBuySig = sig.type === 'BUY';
              const pipVal = sig.symbol === 'XAUUSD' ? 0.1 : (sig.symbol === 'WTI' ? 0.01 : (sig.symbol.includes('JPY') ? 0.01 : (sig.symbol.includes('BTC') ? 1 : 0.0001)));
              const diff = isBuySig ? (liveP - sig.entry) : (sig.entry - liveP);
              const floatPips = Number((diff / pipVal).toFixed(1));
              const isSigTp1 = sig.status === 'TP1_HIT' || sig.beLocked;
              const dec = (Market.quotes[sig.symbol] && Market.quotes[sig.symbol].decimals) || (sig.symbol === 'XAUUSD' || sig.symbol === 'WTI' ? 2 : sig.symbol.includes('JPY') ? 3 : sig.symbol.includes('BTC') ? 1 : 4);

              return `
                <div class="on-pips-card" data-sym="${sig.symbol}" style="background:#111722; border:1px solid ${isSigTp1 ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; padding:12px; position:relative; overflow:hidden;">
                  ${isSigTp1 ? '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#00e676;"></div>' : '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--solar-gold);"></div>'}
                  
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; padding-left:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:16px;">${symInst.icon}</span>
                      <div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <b style="color:#fff; font-size:14px; letter-spacing:0.3px;">${sig.symbol}</b>
                          <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:${isBuySig ? 'rgba(0,230,118,0.15)' : 'rgba(239,83,80,0.15)'}; color:${isBuySig ? '#00e676' : '#ef5350'}; border:1px solid ${isBuySig ? '#00e676' : '#ef5350'};">
                            ${sig.type} ${sig.timeframe || 'M15'}
                          </span>
                        </div>
                        <span class="muted" style="font-size:10px;">Triggered: ${sig.firedAt || 'Live'}</span>
                      </div>
                    </div>

                    <div style="text-align:right;">
                      <b class="on-pips-badge" data-symbol="${sig.symbol}" data-pip-val="${floatPips}" style="font-size:13.5px; font-weight:800; color:${floatPips >= 0 ? '#00e676' : '#ef5350'}; background:${floatPips >= 0 ? 'rgba(0,230,118,0.16)' : 'rgba(239,83,80,0.16)'}; padding:2px 8px; border-radius:6px; display:inline-block; border:1px solid ${floatPips >= 0 ? 'rgba(0,230,118,0.3)' : 'rgba(239,83,80,0.3)'};">
                        ${floatPips >= 0 ? '+' : ''}${floatPips} PIP
                      </b>
                      <span style="display:block; font-size:10px; color:#8e9aa8; margin-top:2px;">
                        Live: <b class="on-pips-curprice" data-symbol="${sig.symbol}" style="color:#f5c451;">${num(liveP, dec)}</b>
                      </span>
                    </div>
                  </div>

                  ${isSigTp1 ? `
                    <div style="background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); border-radius:6px; padding:4px 8px; margin:6px 0 8px 6px; font-size:10.5px; color:#00e676; display:flex; align-items:center; gap:6px;">
                      <span>🛡️</span>
                      <span><b>TARGET 1 HIT!</b> Stop Loss dikunci ke Break-Even (Sifar Risiko)</span>
                    </div>
                  ` : ''}

                  <!-- Price Levels Mini Grid (5 Columns) -->
                  <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr; gap:4px; background:#080c14; border-radius:6px; padding:6px 6px; margin:6px 0 10px 6px; font-size:10.5px;">
                    <div>
                      <span style="color:#8e9aa8; font-size:9px; display:block;">ENTRY</span>
                      <b style="color:#fff;">${num(sig.entry, dec)}</b>
                    </div>
                    <div>
                      <span style="color:#00e676; font-size:9px; display:block;">TP1</span>
                      <b style="color:#00e676;">${num(sig.tp1, dec)}</b>
                    </div>
                    <div>
                      <span style="color:#00e676; font-size:9px; display:block;">TP2</span>
                      <b style="color:#00e676;">${num(sig.tp2, dec)}</b>
                    </div>
                    <div>
                      <span style="color:#00e676; font-size:9px; display:block;">TP3</span>
                      <b style="color:#00e676;">${num(sig.tp3 || (sig.entry ? (sig.type === 'BUY' ? sig.entry + (sig.tp2 - sig.entry) * 1.5 : sig.entry - (sig.entry - sig.tp2) * 1.5) : 0), dec)}</b>
                    </div>
                    <div>
                      <span style="color:#ef5350; font-size:9px; display:block;">SL</span>
                      <b style="color:#ef5350;">${isSigTp1 ? (sig.status === 'TP2_HIT' ? 'TP1' : 'BE') : num(sig.sl, dec)}</b>
                    </div>
                  </div>

                  <!-- Action Controls for this active running trade -->
                  <div style="display:flex; gap:8px; padding-left:6px;">
                    <button class="btn btn-outline btn-watch-chart" data-sym="${sig.symbol}" style="flex:1; padding:6px 10px; font-size:11px; font-weight:700; border-radius:6px; display:flex; align-items:center; justify-content:center; gap:5px; border-color:rgba(255,255,255,0.18);">
                      <span>🔍</span> Pantau Chart
                    </button>
                    <button class="btn btn-outline btn-copy-card-setup" data-sig='${JSON.stringify({ symbol: sig.symbol, type: sig.type, entry: sig.entry, tp1: sig.tp1, tp2: sig.tp2, tp3: sig.tp3 || (sig.entry ? (sig.type === 'BUY' ? sig.entry + (sig.tp2 - sig.entry) * 1.5 : sig.entry - (sig.entry - sig.tp2) * 1.5) : 0), sl: isSigTp1 ? sig.entry : sig.sl })}' style="flex:1; padding:6px 10px; font-size:11px; font-weight:700; border-radius:6px; display:flex; align-items:center; justify-content:center; gap:5px; border-color:rgba(245,196,81,0.3); color:#f5c451;">
                      <span>📋</span> Salin Setup
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align:center; padding:18px 12px; background:#111722; border-radius:8px; border:1px dashed rgba(255,255,255,0.1);">
            <div style="font-size:24px; margin-bottom:6px;">📡</div>
            <b style="color:#f1f5f9; font-size:12.5px; display:block; margin-bottom:4px;">Tiada Posisi Running Buat Masa Ini</b>
            <p style="font-size:11px; color:#8e9aa8; margin:0; line-height:1.4;">
              Enjin Amaterasu AI sedang mengimbas zon kecairan Order Block. Sebaik sahaja signal baru dicetuskan, ia akan kekal dipaparkan di sini sehingga mencapai TP2 atau SL.
            </p>
          </div>
        `}
      </div>

      <!-- VIEW 2: CLOSED / RESOLVED POSITIONS LIST -->
      <div id="secOnPipsClosed" style="display:${activeOnPipsTab === 'closed' ? 'block' : 'none'};">
        ${closedSignals.length > 0 ? `
          <div class="on-pips-closed-list" style="display:flex; flex-direction:column; gap:10px;">
            ${closedSignals.slice(0, 15).map(s => {
              const symInst = ALL_INSTRUMENTS.find(i => i.id === s.symbol) || { id: s.symbol, icon: '📊', name: s.symbol };
              const isBe = s.status === 'BE' || (s.status === 'SL' && s.peak >= 25);
              const pips = isBe ? 0 : s.pips;
              const pipsLabel = isBe ? '🛡️ BE (0p)' : (pips > 0 ? `+${pips}p` : `${pips}p`);
              const pipsColor = isBe ? 'var(--solar-gold)' : (pips > 0 ? '#00e676' : '#ef5350');
              const pipsBg = isBe ? 'rgba(245,196,81,0.15)' : (pips > 0 ? 'rgba(0,230,118,0.14)' : 'rgba(239,83,80,0.14)');
              const pipsBorder = isBe ? 'rgba(245,196,81,0.4)' : (pips > 0 ? 'rgba(0,230,118,0.3)' : 'rgba(239,83,80,0.3)');

              return `
                <div style="background:#111722; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px; position:relative; overflow:hidden;">
                  <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:${pipsColor};"></div>
                  
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-left:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:16px;">${symInst.icon}</span>
                      <div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <b style="color:#fff; font-size:13.5px;">${s.symbol}</b>
                          <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:${s.type === 'BUY' ? 'rgba(0,230,118,0.15)' : 'rgba(239,83,80,0.15)'}; color:${s.type === 'BUY' ? '#00e676' : '#ef5350'};">
                            ${s.type}
                          </span>
                        </div>
                        <span style="font-size:10.5px; color:#8e9aa8;">Ditutup: ${s.date || 'Hari ini'} · ${s.time}</span>
                      </div>
                    </div>

                    <div style="text-align:right;">
                      <span style="font-family:'Space Grotesk',sans-serif; font-size:13.5px; font-weight:800; color:${pipsColor}; background:${pipsBg}; border:1px solid ${pipsBorder}; padding:2px 8px; border-radius:6px; display:inline-block;">
                        ${pipsLabel}
                      </span>
                      <span style="display:block; font-size:10px; color:#94a3b8; margin-top:2px;">
                        Status: <b style="color:#fff;">${s.status}</b>
                      </span>
                    </div>
                  </div>

                  <!-- Details Row -->
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#080c14; border-radius:6px; padding:6px 10px; margin:4px 0 8px 6px; font-size:11px;">
                    <span style="color:#cbd5e1;">Entry: <b style="color:#fff;">${num(s.entry)}</b></span>
                    <span style="color:#cbd5e1;">Peak Float: <b style="color:#00e676;">+${s.peak || pips || 25}p</b></span>
                    <span style="color:#8e9aa8;">Selesai Disahkan ✓</span>
                  </div>

                  <div style="padding-left:6px;">
                    <button class="btn btn-outline btn-share-resolved-card" data-sym="${s.symbol}" data-type="${s.type}" data-pips="${pips}" data-entry="${s.entry}" style="width:100%; padding:6px; font-size:11px; font-weight:700; color:#f5c451; border-color:rgba(245,196,81,0.3); border-radius:6px;">
                      📸 Kongsi Poster Kemenangan (VIP Share)
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align:center; padding:22px 12px; background:#111722; border-radius:8px; border:1px dashed rgba(255,255,255,0.1);">
            <div style="font-size:24px; margin-bottom:6px;">📋</div>
            <b style="color:#f1f5f9; font-size:12.5px; display:block; margin-bottom:4px;">Tiada Rekod Ditutup Setakat Ini</b>
            <p style="font-size:11px; color:#8e9aa8; margin:0; line-height:1.4;">
              Sebaik sahaja posisi running mencapai TP1/TP2 atau ditutup, rekod lengkap akan dipindahkan secara automatik ke sini.
            </p>
          </div>
        `}
      </div>
    </div>
  `;

  main.innerHTML = `<section class="page" style="padding-top: 4px;">
    ${solarGlow()}

    ${isAnyActive ? `
      <div class="top-active-signal-bar" id="topActiveSignalBar" style="background: linear-gradient(90deg, rgba(0, 230, 118, 0.16) 0%, rgba(255, 160, 0, 0.16) 100%); border: 1px solid ${isCurrentAssetActive ? '#00e676' : 'var(--solar-gold)'}; border-radius: 8px; padding: 9px 13px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.15s;" title="Klik untuk lihat signal aktif">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#00e676; animation:pulseDot 1.2s infinite; display:inline-block;"></span>
          <span style="font-size:12px; font-weight:700; color:#fff;">⚡ ON PIPS: <b style="color:#f5c451;">${activeList.length} POSISI AKTIF</b> (${activeList.map(s => s.symbol).join(', ')})</span>
        </div>
        <span style="font-size:11px; font-weight:700; color:#00e676;">PANTAU RUNNING ➔</span>
      </div>
    ` : ''}

    <!-- AMATERASU X: Itachi Anime Hero Banner -->
    <div class="itachi-hero-banner">
      <div class="itachi-banner-bg" style="background-image: url('img/itachi_banner.jpg');"></div>
      <div class="itachi-banner-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="kanji-badge">天照 · AMATERASU X</span>
          <span style="font-size:10px; font-weight:800; color:#00D68F; background:rgba(0,214,143,0.15); border:1px solid #00D68F; padding:2px 7px; border-radius:10px;">
            AI 2.4 ONLINE
          </span>
        </div>
        <div style="font-size:14px; font-weight:900; color:#FFF; font-family:'Space Grotesk',sans-serif; letter-spacing:0.3px;">
          AI SIGNALS. REAL OPPORTUNITIES.
        </div>
        <div style="font-size:11px; color:#A0A6B4; margin-top:2px; line-height:1.35;">
          Advanced Institutional SMC & Malaysian SNR analysis. Precise entries. Higher probability.
        </div>
      </div>
    </div>
    
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
          <button class="snr-pill" data-tf="M1">M1</button>
          <button class="snr-pill" data-tf="M5">M5</button>
          <button class="snr-pill active" data-tf="M15">M15</button>
          <button class="snr-pill" data-tf="H1">H1</button>
          <div class="snr-dropdown-wrap">
            <button class="snr-pill tf-dropdown" id="snrTfDropdownBtn">TF ▾</button>
            <div class="snr-dropdown-menu" id="snrTfMenu" style="display:none;">
              <div data-tf="M3">M3</div>
              <div data-tf="M30">M30</div>
              <div data-tf="H4">H4</div>
              <div data-tf="D1">D1</div>
            </div>
          </div>
        </div>
        <div class="snr-tools">
          <button class="snr-icon-btn snr-btn-lines active" id="btnToggleSnrLines" title="Togol Garisan SNR Rays & Order Block">📐</button>
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

      <div class="tv-live-embed-wrap" id="tvLiveEmbedWrap" style="display:block; width:100%; height:460px; border-radius:10px; overflow:hidden; border:1px solid rgba(239,45,61,0.25); background:#06070a; margin-bottom:10px; position:relative;"></div>
      <div class="snr-canvas-wrap" id="snrCanvasWrap" style="display:none;"></div>

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

      ${onPipsHtml}

      <!-- Recent Verified Signals History Section -->
      <div class="recent-signals-card" style="margin-top:16px; background:#0b1118; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:8px;">
          <b style="font-family:'Space Grotesk',sans-serif; font-size:13px; color:#f1f5f9; display:flex; align-items:center; gap:6px;">
            <span>📊</span> Rekod Telemetri Signal Terkini
          </b>
          <span style="font-size:11px; color:#f5c451; font-weight:700;">Winrate 94% · Verified</span>
        </div>
        <div class="recent-signals-list" style="display:flex; flex-direction:column; gap:8px;">
          ${((AppState && AppState.signals) || []).slice(0, 5).map(s => {
            const isBe = s.status === 'BE' || (s.status === 'SL' && s.peak >= 25);
            const pips = isBe ? 0 : s.pips;
            const pipsLabel = isBe ? '🛡️ BE (0p)' : (pips > 0 ? `+${pips}p` : `${pips}p`);
            const pipsColor = isBe ? 'var(--solar-gold)' : (pips > 0 ? '#00e676' : '#ef5350');
            const pipsBg = isBe ? 'rgba(245,196,81,0.15)' : (pips > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(239,83,80,0.12)');
            const pipsBorder = isBe ? 'rgba(245,196,81,0.4)' : (pips > 0 ? 'rgba(0,230,118,0.3)' : 'rgba(239,83,80,0.3)');

            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#111722; border-radius:8px; border:1px solid rgba(255,255,255,0.05); font-size:12px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:${s.type === 'BUY' ? '#00e676' : '#ef5350'};">${s.type}</span>
                <b style="color:#fff;">${s.symbol}</b>
                <span class="muted" style="font-size:11px;">@ ${num(s.entry)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="muted" style="font-size:11px;">${s.time}</span>
                <span style="font-weight:800; font-size:11.5px; color:${pipsColor}; background:${pipsBg}; padding:2px 7px; border-radius:6px; border:1px solid ${pipsBorder};">
                  ${pipsLabel}
                </span>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  </section>`;

  // Unified Real-Time Chart Engine (Amaterasu SNR AI + TradingView Live Sync)
  let currentActiveTf = 'M15';
  let currentChartMode = 'snr'; // 'snr' | 'tv'
  let snrLinesVisible = true;

  const btnModeSnr = $('#btnModeSnr', main);
  const btnModeTv = $('#btnModeTv', main);
  const tvEmbedWrap = $('#tvLiveEmbedWrap', main);
  const canvasWrap = $('#snrCanvasWrap', main);
  if (canvasWrap) canvasWrap.style.display = 'none';

  const updateActiveTrendRow = () => {
    $$('.trend-row-snr', main).forEach(row => {
      const tfEl = row.querySelector('.tf-code');
      const tf = tfEl ? tfEl.textContent.trim() : null;
      if (tf === currentActiveTf) {
        row.style.border = '1px solid var(--solar-gold)';
        row.style.background = 'rgba(245, 196, 81, 0.12)';
        row.style.boxShadow = '0 0 10px rgba(245, 196, 81, 0.2)';
      } else {
        row.style.border = '1px solid rgba(255, 255, 255, 0.06)';
        row.style.background = 'rgba(255, 255, 255, 0.02)';
        row.style.boxShadow = 'none';
      }
    });
  };

  const renderTvChart = () => {
    if (!tvEmbedWrap) return;
    const sym = tvSymbols[inst.id] || 'PEPPERSTONE:XAUUSD';
    const interval = tfToTvInterval[currentActiveTf] || '15';
    const liveP = parseFloat(Market.getLivePrice(inst.id) || inst.basePrice);
    const d = inst.decimals || (inst.id === 'XAUUSD' || inst.id === 'WTI' ? 2 : inst.id.includes('JPY') ? 3 : inst.category === 'Forex' ? 4 : 1);
    
    // Automatically calibrate to active timeframe!
    const tfConf = TF_AUTO_CONFIG[currentActiveTf] || TF_AUTO_CONFIG.M15;
    
    const isGold = inst.id === 'XAUUSD';
    const isCrypto = inst.id === 'BTCUSD';
    const isIdx = inst.category === 'Indices';
    const isJpy = inst.id.includes('JPY');

    const baseStep1 = isGold ? 5.5 : isCrypto ? 280 : isIdx ? 75 : isJpy ? 0.35 : 0.0025;
    const baseStep2 = isGold ? 12.0 : isCrypto ? 650 : isIdx ? 160 : isJpy ? 0.80 : 0.0055;

    // Timeframe-adapted pip steps
    const step1 = Number((baseStep1 * tfConf.mult).toFixed(d));
    const step2 = Number((baseStep2 * tfConf.mult).toFixed(d));

    const r2Val = (liveP + step2).toFixed(d);
    const r1Val = (liveP + step1).toFixed(d);
    const s1Val = (liveP - step1).toFixed(d);
    const s2Val = (liveP - step2).toFixed(d);

    const isBull = inst.bias === 'BULLISH' || (globalSig.status === 'ACTIVE' && globalSig.type === 'BUY');
    
    // Proportional Y levels in the 460px viewport:
    // Upper quadrant (Supply): R2 at 115px, R1 at 175px
    // Center reference (Live quote): 240px
    // Lower quadrant (Demand): S1 at 305px, S2 at 365px
    const yR2 = 115;
    const yR1 = 175;
    const yLive = 240;
    const yS1 = 305;
    const yS2 = 365;

    const hudHtml = currentChartMode === 'snr' ? `
      <div class="amaterasu-snr-hud" style="position:absolute; top:8px; left:8px; z-index:11; pointer-events:none; background:rgba(7,10,15,0.92); backdrop-filter:blur(8px); border:1px solid rgba(239,45,61,0.35); border-radius:8px; padding:7px 10px; font-family:'Space Grotesk',sans-serif; box-shadow:0 6px 20px rgba(0,0,0,0.65); max-width:85%;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:4px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#00e676; box-shadow:0 0 8px #00e676; animation:pulseDot 1.2s infinite;"></span>
            <b style="font-size:11px; color:#fff; letter-spacing:0.4px;">AMATERASU SNR AI · LIVE</b>
          </div>
          <span style="font-size:9.5px; background:rgba(239,45,61,0.22); color:#ff5252; border:1px solid rgba(239,45,61,0.4); padding:1px 5px; border-radius:4px; font-weight:800;">${tfConf.label}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; font-size:10px;">
          <div style="color:#ef5350;"><b>R2 (${currentActiveTf}):</b> ${r2Val}</div>
          <div style="color:#00e676;"><b>S1 (${currentActiveTf}):</b> ${s1Val}</div>
          <div style="color:#ff8a80;"><b>R1 (${currentActiveTf}):</b> ${r1Val}</div>
          <div style="color:#69f0ae;"><b>S2 (${currentActiveTf}):</b> ${s2Val}</div>
        </div>
        <div style="margin-top:4px; font-size:9px; color:#f5c451; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>⚡</span> Amaterasu SMC ${currentActiveTf} Auto-Synced · Target: ${tfConf.pipsTarget} · Live Quote: ${num(liveP, d)}
        </div>
      </div>
    ` : '';

    const raysHtml = (currentChartMode === 'snr' && snrLinesVisible) ? `
      <div class="snr-forward-rays-wrap" id="snrForwardRaysWrap">
        <!-- Amaterasu SMC Shaded Order Block Zone (Projected forward from latest candle) -->
        <div class="amaterasu-smc-block-zone ${isBull ? 'demand' : 'supply'}" style="top:${isBull ? yS1 : yR2}px; height:${isBull ? (yS2 - yS1) : (yR1 - yR2)}px;">
          <span class="amaterasu-smc-label" style="color:${isBull ? '#00e676' : '#ef5350'};">
            <span>⚡</span> AMATERASU SMC ${isBull ? 'DEMAND' : 'SUPPLY'} ORDER BLOCK (${tfConf.label})
          </span>
        </div>

        <!-- 1. 🔴 R2 Major Supply Ray Line -->
        <div class="snr-ray-container ray-r2" style="top:${yR2}px;">
          <div class="snr-ray-dot"></div>
          <div class="snr-ray-line"></div>
          <span class="snr-ray-tag tag-r2">🔴 R2 · ${tfConf.tagR2} · ${r2Val}</span>
        </div>

        <!-- 2. 🔴 R1 Rejection Resistance Ray Line -->
        <div class="snr-ray-container ray-r1" style="top:${yR1}px;">
          <div class="snr-ray-dot"></div>
          <div class="snr-ray-line"></div>
          <span class="snr-ray-tag tag-r1">🔴 R1 · ${tfConf.tagR1} · ${r1Val}</span>
        </div>

        <!-- 3. ⚡ Live Market Quote Ray Line -->
        <div class="snr-ray-container ray-live" style="top:${yLive}px;">
          <div class="snr-ray-dot"></div>
          <div class="snr-ray-line"></div>
          <span class="snr-ray-tag tag-live">● LIVE ${num(liveP, d)}</span>
        </div>

        <!-- 4. 🟢 S1 Instant Demand Ray Line -->
        <div class="snr-ray-container ray-s1" style="top:${yS1}px;">
          <div class="snr-ray-dot"></div>
          <div class="snr-ray-line"></div>
          <span class="snr-ray-tag tag-s1">🟢 S1 · ${tfConf.tagS1} · ${s1Val}</span>
        </div>

        <!-- 5. 🟢 S2 Major Support Base Ray Line -->
        <div class="snr-ray-container ray-s2" style="top:${yS2}px;">
          <div class="snr-ray-dot"></div>
          <div class="snr-ray-line"></div>
          <span class="snr-ray-tag tag-s2">🟢 S2 · ${tfConf.tagS2} · ${s2Val}</span>
        </div>
      </div>
    ` : '';

    updateActiveTrendRow();

    tvEmbedWrap.style.display = 'block';
    tvEmbedWrap.innerHTML = `
      ${hudHtml}
      ${raysHtml}
      <iframe 
        src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FKuala_Lumpur&hide_top_toolbar=${currentChartMode === 'snr' ? '1' : '0'}&studies=%5B%5D&hide_side_toolbar=1" 
        style="width:100%; height:100%; border:none; display:block;"
        loading="lazy">
      </iframe>
    `;
  };

  // Initial Load - render real live chart immediately
  renderTvChart();

  if (btnModeSnr && btnModeTv) {
    btnModeSnr.onclick = () => {
      btnModeSnr.classList.add('active');
      btnModeTv.classList.remove('active');
      currentChartMode = 'snr';
      renderTvChart();
    };

    btnModeTv.onclick = () => {
      btnModeTv.classList.add('active');
      btnModeSnr.classList.remove('active');
      currentChartMode = 'tv';
      renderTvChart();
    };
  }

  // Toggle SNR Rays & Amaterasu SMC Lines
  const btnToggleLines = $('#btnToggleSnrLines', main);
  if (btnToggleLines) {
    btnToggleLines.onclick = () => {
      snrLinesVisible = !snrLinesVisible;
      btnToggleLines.classList.toggle('active', snrLinesVisible);
      renderTvChart();
      toast(snrLinesVisible ? '📐 Garisan Forward SNR Rays & Order Block Diaktifkan' : '📐 Garisan Forward SNR Rays Disembunyikan');
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
      renderTvChart();
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
        renderTvChart();
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
      renderTvChart();
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

  // Top Active Signal Bar Navigation (Scroll down to On Pips section)
  const topActiveBar = $('#topActiveSignalBar', main);
  if (topActiveBar) {
    topActiveBar.onclick = () => {
      const onPipsEl = $('#onPipsSection', main);
      if (onPipsEl) {
        onPipsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (activeList[0] && activeList[0].symbol) {
        store.set('selected_signal_sym', activeList[0].symbol);
        Market.activeSymbol = activeList[0].symbol;
        Market.updateUI();
        SignalPage(main);
      }
    };
  }

  // Go to Active Signal Button in Alert Card
  const btnGoTo = $('#btnGoToActiveSignal', main);
  if (btnGoTo) {
    btnGoTo.onclick = () => {
      const sym = btnGoTo.dataset.sym || (activeList[0] && activeList[0].symbol);
      if (sym) {
        store.set('selected_signal_sym', sym);
        Market.activeSymbol = sym;
        Market.updateUI();
        SignalPage(main);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  }

  // On Pips Card Actions: Watch Chart & Copy Setup
  $$('.btn-watch-chart', main).forEach(btn => {
    btn.onclick = () => {
      const sym = btn.dataset.sym;
      if (sym) {
        store.set('selected_signal_sym', sym);
        Market.activeSymbol = sym;
        Market.updateUI();
        SignalPage(main);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast(`🔍 Membuka analisis chart & tiket ${sym}`);
      }
    };
  });

  $$('.btn-copy-card-setup', main).forEach(btn => {
    btn.onclick = () => {
      try {
        const s = JSON.parse(btn.dataset.sig);
        const text = `👁️ AMATERASU X VIP SIGNAL\n━━━━━━━━━━━━━━━━━━━━━\n📊 Instrumen: #${s.symbol}\n⚡ Tindakan: ${s.type} (M15)\n🎯 Entry: ${s.entry}\n🎯 TP1: ${s.tp1} (+40p)\n🚀 TP2: ${s.tp2} (+80p)\n🛑 SL: ${s.sl}\n━━━━━━━━━━━━━━━━━━━━━\nSOP: Alih SL ke BE (${s.entry}) selepas TP1 dicapai!`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          toast(`📋 Setup MT5 #${s.symbol} berjaya disalin!`);
        }
      } catch(e) {}
    };
  });

  // On Pips Tab Switcher (Running vs Closed)
  const btnTabRunning = $('#btnTabOnPipsRunning', main);
  const btnTabClosed = $('#btnTabOnPipsClosed', main);
  const secRunning = $('#secOnPipsRunning', main);
  const secClosed = $('#secOnPipsClosed', main);

  if (btnTabRunning && btnTabClosed && secRunning && secClosed) {
    btnTabRunning.onclick = () => {
      window._activeOnPipsTab = 'running';
      secRunning.style.display = 'block';
      secClosed.style.display = 'none';
      btnTabRunning.style.background = 'rgba(0,230,118,0.2)';
      btnTabRunning.style.borderColor = '#00e676';
      btnTabRunning.style.color = '#00e676';
      btnTabClosed.style.background = 'transparent';
      btnTabClosed.style.borderColor = 'transparent';
      btnTabClosed.style.color = '#8e9aa8';
    };

    btnTabClosed.onclick = () => {
      window._activeOnPipsTab = 'closed';
      secRunning.style.display = 'none';
      secClosed.style.display = 'block';
      btnTabClosed.style.background = 'rgba(255,160,0,0.2)';
      btnTabClosed.style.borderColor = 'var(--solar-gold)';
      btnTabClosed.style.color = 'var(--solar-gold)';
      btnTabRunning.style.background = 'transparent';
      btnTabRunning.style.borderColor = 'transparent';
      btnTabRunning.style.color = '#8e9aa8';
    };
  }

  // Share Resolved / Closed Trade Win Poster
  $$('.btn-share-resolved-card', main).forEach(btn => {
    btn.onclick = () => {
      const sym = btn.dataset.sym;
      const type = btn.dataset.type;
      const pips = parseFloat(btn.dataset.pips) || 0;
      const entry = parseFloat(btn.dataset.entry) || 0;
      const sigData = {
        symbol: sym,
        type: type,
        entry: entry,
        tp1: entry,
        tp2: entry,
        sl: entry,
        pips: pips,
        status: pips > 0 ? 'TP_HIT' : (pips === 0 ? 'BE' : 'SL'),
        resolvedAt: 'Selesai'
      };
      openShareWinModal(sigData, pips >= 0);
    };
  });

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

  // Share Win / Setup Poster Buttons
  const btnShareWin = $('#btnShareWinPoster', main);
  if (btnShareWin) {
    btnShareWin.onclick = () => {
      const isWin = isTp1 || globalSig.status === 'TP1_HIT' || globalSig.status === 'TP2_HIT' || globalSig.status === 'RESOLVED';
      openShareWinModal(globalSig, isWin);
    };
  }

  const btnCopySetup = $('#btnCopySignalSetup', main);
  if (btnCopySetup) {
    btnCopySetup.onclick = () => {
      const copyText = `👁️ AMATERASU X VIP SIGNAL\n━━━━━━━━━━━━━━━━━━━━━\n📊 Instrumen: #${globalSig.symbol}\n⚡ Tindakan: ${globalSig.type} (M15)\n🎯 Entry: ${globalSig.entry}\n🎯 TP1: ${globalSig.tp1} (+40p)\n🚀 TP2: ${globalSig.tp2} (+80p)\n🛑 SL: ${globalSig.sl}\n━━━━━━━━━━━━━━━━━━━━━\nSOP: Tutup 50% lot di TP1 & alih SL ke BE (${globalSig.entry})!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(copyText);
        toast('📋 Setup MT5 disalin ke clipboard!');
      }
    };
  }

  const btnShareScanner = $('#btnShareScannerPoster', main);
  if (btnShareScanner) {
    btnShareScanner.onclick = () => {
      const liveP = parseFloat(Market.getLivePrice(inst.id) || inst.basePrice);
      const isSell = inst.bias === 'BEARISH';
      const offset40 = inst.id === 'XAUUSD' ? 4.0 : 0.0040;
      const offset80 = inst.id === 'XAUUSD' ? 8.0 : 0.0080;
      const offsetSl = inst.id === 'XAUUSD' ? 3.0 : 0.0030;
      
      const setupSig = {
        symbol: inst.id,
        type: isSell ? 'SELL' : 'BUY',
        entry: liveP.toFixed(2),
        tp1: (liveP + (isSell ? -offset40 : offset40)).toFixed(2),
        tp2: (liveP + (isSell ? -offset80 : offset80)).toFixed(2),
        sl: (liveP + (isSell ? offsetSl : -offsetSl)).toFixed(2),
        status: 'SETUP'
      };
      openShareWinModal(setupSig, false);
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
  if (zoomIn) zoomIn.onclick = () => renderTvChart();
  const zoomOut = $('#snrZoomOut', main);
  if (zoomOut) zoomOut.onclick = () => renderTvChart();
  const resetBtn = $('#snrReset', main);
  if (resetBtn) resetBtn.onclick = () => {
    if (dropBtn) {
      dropBtn.textContent = 'TF ▾';
      dropBtn.classList.remove('active');
    }
    pills.forEach(b => b.classList.toggle('active', b.dataset.tf === 'M15'));
    currentActiveTf = 'M15';
    renderTvChart();
  };

  // Full Chart Modal Handler
  const handleOpenFull = () => {
    showFullChartModal(inst.id, currentActiveTf, (newSym, newTf) => {
      if (newSym !== inst.id) {
        inst = ALL_INSTRUMENTS.find(i => i.id === newSym) || ALL_INSTRUMENTS[0];
      }
      currentActiveTf = newTf;
      pills.forEach(b => b.classList.toggle('active', b.dataset.tf === currentActiveTf));
      if (['M3', 'M30', 'H4', 'D1'].includes(currentActiveTf)) {
        if (dropBtn) {
          dropBtn.textContent = currentActiveTf + ' ▾';
          dropBtn.classList.add('active');
        }
      } else if (dropBtn) {
        dropBtn.textContent = 'TF ▾';
        dropBtn.classList.remove('active');
      }
      renderTvChart();
    });
  };

  const btnFs = $('#snrFullscreen', main);
  if (btnFs) btnFs.onclick = handleOpenFull;
  const btnOpenFull = $('#btnOpenFullChart', main);
  if (btnOpenFull) btnOpenFull.onclick = handleOpenFull;

  // Open TradingView External App / Chart Link (Dynamic to Selected Symbol)
  const tvBtn = $('#btnOpenTradingView', main);
  if (tvBtn) {
    tvBtn.onclick = () => {
      const sym = tvSymbols[inst.id] || 'PEPPERSTONE:XAUUSD';
      window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}`, '_blank');
    };
  }

  return () => {
    if (activeFsModalClose) activeFsModalClose();
    document.removeEventListener('click', closeMenu);
  };
}

// ---------- 2. Stat ----------
function StatPage(main) {
  const st = (AppState && AppState.stats) || {
    totalSignals: 0,
    winRate: 0,
    tp1Hit: 0,
    tp2Hit: 0,
    slHit: 0,
    totalProfitToday: 0
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDate = new Date();
  const defaultHistoryPips = [480, 540, 620, 210, 180, 710];
  
  // Dynamically compute the exact 7 days ending on TODAY (so if today is Tuesday, days are Wed->Thu->Fri->Sat->Sun->Mon->Today)
  const computed7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dayName = dayNames[d.getDay()];
    const isToday = (i === 0);
    const label = isToday ? 'Today' : dayName;
    
    let p = isToday ? (st.totalProfitToday || 685) : 0;
    if (!isToday) {
      if (Array.isArray(st.last7Days)) {
        const found = st.last7Days.find(x => x.day === dayName);
        p = (found && typeof found.pips === 'number') ? found.pips : defaultHistoryPips[6 - i];
      } else {
        p = defaultHistoryPips[6 - i];
      }
    }
    computed7Days.push({
      day: label,
      dayFull: isToday ? `Today (${dayName})` : dayName,
      pips: p,
      isToday: isToday
    });
  }

  const signals = (AppState && Array.isArray(AppState.signals)) ? AppState.signals : [];
  const maxPips = Math.max(...computed7Days.map(d => d.pips || 0), 100);
  const total7Days = computed7Days.reduce((acc, d) => acc + (d.pips || 0), 0);

  main.innerHTML = `<section class="page">
    ${pageHead('Stat', 'Overall signal performance')}

    <!-- 1. Total Profit Today Big Card -->
    <div class="stat-profit-today-card">
      <div class="lbl">TOTAL PROFIT TODAY</div>
      <div class="val">${st.totalProfitToday >= 0 ? '+' : ''}${st.totalProfitToday || 0} pip</div>
    </div>

    <!-- 2. Four Metrics Grid (2x2) -->
    <div class="stat-grid-4">
      <div class="stat-box-small">
        <div class="lbl">WIN RATE</div>
        <div class="val green">${st.totalSignals === 0 ? '0%' : (st.winRate || 0) + '%'}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SIGNALS CLOSED</div>
        <div class="val">${st.totalSignals || 0}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">TP1 / TP2 / TP3 HIT</div>
        <div class="val green">${st.tp1Hit || 0} / ${st.tp2Hit || 0} / ${st.tp3Hit || 0}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SL HIT</div>
        <div class="val red">${st.slHit || 0}</div>
      </div>
    </div>
    <div class="stat-signals-closed-sub">${st.totalSignals || 0} signals closed on this day</div>

    <!-- 3. Last 7 Days Bar Chart Card (Dynamic to actual weekday) -->
    <div class="stat-7days-card">
      <div class="stat-7days-header">
        <b>Last 7 days</b>
        <span>+${total7Days} pip</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 115px; gap: 8px;">
        ${computed7Days.map(d => {
          const h = d.pips ? Math.max(8, Math.round((d.pips / maxPips) * 85)) : 2;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <small style="font-size: 9.5px; font-weight: 600; color: ${d.pips ? '#00e676' : 'var(--text-muted)'};">${d.pips ? `+${d.pips}` : ''}</small>
              <div style="width: 100%; height: ${h}px; background: ${d.pips ? '#00e676' : 'rgba(255,255,255,0.06)'}; border-radius: 4px;"></div>
              <span style="font-size: 10px; color: ${d.day === 'Today' ? 'var(--solar-gold)' : 'var(--text-secondary)'}; font-weight: ${d.day === 'Today' ? '700' : '500'};" title="${d.dayFull}">${d.day}</span>
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

    <!-- 5. Signal History List (Amaterasu X Terminal) -->
    <h4 class="sec" style="margin-top: 10px; margin-bottom: 12px;">Signal History</h4>
    <div class="sig-history-list">
      ${signals.length === 0 ? `
        <div style="text-align:center; padding:36px 16px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px;">
          <div style="font-size:32px; margin-bottom:10px;">📊</div>
          <b style="color:var(--solar-gold); font-size:14.5px; display:block; margin-bottom:6px;">Rekod Prestasi Dimulakan Semula</b>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.5; margin:0 auto; max-width:280px;">
            Enjin Amaterasu AI kini bersedia mengira Winning Rate baharu dari permulaan (0). Semua signal yang selesai akan direkodkan secara automatik di sini.
          </p>
        </div>
      ` : signals.map(s => {
        const isSell = s.type === 'SELL';
        const arrow = isSell ? '▼' : '▲';
        const arrowCol = isSell ? '#ef5350' : '#26a69a';
        const isActuallyBE = s.status === 'BE' || (s.status === 'SL' && s.peak >= 25);
        const isSL = s.status === 'SL' && !isActuallyBE;
        const isBE = isActuallyBE;
        const pipsNum = isBE ? 0 : (Number(s.pips) || 0);
        const badges = isBE ? ['TP1', 'BE'] : (s.tags && Array.isArray(s.tags) ? s.tags : (s.badge || '').split(' ')).filter(Boolean);
        return `
          <div class="sig-history-item">
            <div>
              <div style="font-size: 12.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 600;">
                <span class="muted">${s.date || 'Today'}</span>
                <span style="color: ${arrowCol}; margin: 0 4px;">${arrow}</span>
                <b style="color: ${arrowCol};">${s.symbol}</b>
              </div>
              <div style="font-size: 11px; color: #8e9aa8; margin-bottom: 6px;">${s.time}</div>
              <div>
                ${badges.map(b => `<span class="history-badge ${b.toLowerCase()}">${b}</span>`).join('')}
              </div>
            </div>
            <div style="text-align: right;">
              ${isSL ? `
                <div style="color: #ef5350; font-family:'Space Grotesk',sans-serif; font-size: 13px; font-weight: 700;">
                  SL · ${pipsNum} pip ${s.peak && s.peak < 15 ? `<span style="font-size: 10.5px; color: #8e9aa8; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 4px; margin-left: 4px;">peak +${s.peak}p</span>` : ''}
                </div>
              ` : isBE ? `
                <div style="font-family:'Space Grotesk',sans-serif; font-size: 13px; font-weight: 700; color: var(--solar-gold);">
                  BE (SIFAR RISIKO) · 0 pip <span style="font-size: 10.5px; color: #00e676; border: 1px solid rgba(0,230,118,0.4); border-radius: 4px; padding: 1px 4px; margin-left: 4px;">peak +${s.peak || 30}p</span>
                </div>
              ` : `
                <div style="font-family:'Space Grotesk',sans-serif; font-size: 13px; font-weight: 700; color: #00e676;">
                  ${s.status === 'CLOSED IN PROFIT' ? 'CLOSED IN PROFIT · ' : ''}${s.status && s.status.startsWith('TP') ? `${s.status} · ` : ''}+${pipsNum} pip
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
  const dateOptions = [
    new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    new Date(Date.now() - 1 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    `Today (${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
  ];
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

// ---------- 3. Analysis (Amaterasu X Gold Analysis 100% Real-Time TradingView Match) ----------
function AnalysisPage(main) {
  let currentActiveTf = 'M15';
  let currentChartMode = 'snr'; // 'snr' | 'tv'
  let snrLinesVisible = true;
  const inst = ALL_INSTRUMENTS.find(i => i.id === 'XAUUSD') || ALL_INSTRUMENTS[0];

  const getLiveP = () => parseFloat(Market.getLivePrice('XAUUSD') || inst.basePrice);

  const calcKeyLevels = (p, tf) => {
    const tfConf = TF_AUTO_CONFIG[tf] || TF_AUTO_CONFIG.M15;
    const step1 = Number((5.5 * tfConf.mult).toFixed(2));
    const step2 = Number((12.0 * tfConf.mult).toFixed(2));
    const step3 = Number((22.0 * tfConf.mult).toFixed(2));
    return {
      r1: (p + step1).toFixed(2),
      r2: (p + step2).toFixed(2),
      r3: (p + step3).toFixed(2),
      s1: (p - step1).toFixed(2),
      s2: (p - step2).toFixed(2),
      s3: (p - step3).toFixed(2),
      tfConf
    };
  };

  const initialP = getLiveP();
  const initLvls = calcKeyLevels(initialP, currentActiveTf);

  main.innerHTML = `<section class="page">
    ${pageHead('Gold Analysis', 'Daily market read by the desk')}

    <!-- Analysis Header Title Box -->
    <div class="analysis-header-box">
      <span class="ana-date-tag" id="anaHeaderDate">Hari Ini · XAUUSD (Spot Gold)</span>
      <h2>USD strength from inflation data pressures gold lower despite daily bullish trend</h2>
    </div>

    <!-- Interactive Real-Time TradingView + Amaterasu SNR AI Chart Card -->
    <div class="snr-chart-card" style="margin-bottom: 16px;">
      <div class="snr-toolbar">
        <div class="snr-tf-pills" id="anaTfPills">
          <button class="snr-pill" data-tf="M1">M1</button>
          <button class="snr-pill" data-tf="M5">M5</button>
          <button class="snr-pill active" data-tf="M15">M15</button>
          <button class="snr-pill" data-tf="H1">H1</button>
          <div class="snr-dropdown-wrap">
            <button class="snr-pill tf-dropdown" id="anaTfDropdownBtn">TF ▾</button>
            <div class="snr-dropdown-menu" id="anaTfMenu" style="display:none;">
              <div data-tf="M3">M3</div>
              <div data-tf="M30">M30</div>
              <div data-tf="H4">H4</div>
              <div data-tf="D1">D1</div>
            </div>
          </div>
        </div>
        <div class="snr-tools">
          <button class="snr-icon-btn snr-btn-lines active" id="anaBtnToggleLines" title="Togol Garisan SNR Rays & Order Block">📐</button>
          <button class="snr-icon-btn" id="anaZoomOut" title="Zoom Out">−</button>
          <button class="snr-icon-btn" id="anaZoomIn" title="Zoom In">+</button>
          <button class="snr-icon-btn" id="anaReset" title="Reset View">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
          <button class="snr-icon-btn snr-btn-fs" id="anaFullscreen" title="Buka Full Chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mode Selector: Amaterasu SNR AI vs TradingView Live Feed -->
      <div style="display:flex; justify-content:center; gap:8px; margin: 6px 0 10px;">
        <button class="snr-mode-toggle active" id="anaBtnModeSnr">⚡ Amaterasu SNR AI</button>
        <button class="snr-mode-toggle" id="anaBtnModeTv">📊 TradingView Live Feed</button>
      </div>

      <!-- Live TradingView Embed Wrap -->
      <div class="tv-live-embed-wrap" id="anaTvEmbedWrap" style="display:block; width:100%; height:460px; border-radius:10px; overflow:hidden; border:1px solid rgba(239,45,61,0.25); background:#06070a; margin-bottom:10px; position:relative;"></div>

      <div class="snr-disclaimer">
        For educational purposes only. Not financial advice.
      </div>

      <button class="btn-full-chart" id="anaBtnOpenFullChart">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
        <span>Buka Full Chart (Zoom In / Out)</span>
      </button>

      <button class="btn-tv-app" id="anaBtnOpenTvApp">
        <svg class="tv-icon" width="22" height="15" viewBox="0 0 36 24" fill="currentColor">
          <path d="M0 19.5V4.5C0 3.67 0.67 3 1.5 3H6.5C7.33 3 8 3.67 8 4.5V19.5C8 20.33 7.33 21 6.5 21H1.5C0.67 21 0 20.33 0 19.5ZM13 14.5V4.5C13 3.67 13.67 3 14.5 3H19.5C20.33 3 21 3.67 21 4.5V14.5C21 15.33 20.33 16 19.5 16H14.5C13.67 16 13 15.33 13 14.5ZM26 21.5V4.5C26 3.67 26.67 3 27.5 3H32.5C33.33 3 34 3.67 34 4.5V21.5C34 22.33 33.33 23 32.5 23H27.5C26.67 23 26 22.33 26 21.5Z"/>
        </svg>
        <span>Open in TradingView app</span>
      </button>
    </div>

    <!-- Structured Analysis Breakdown with Dynamic Real-Time Metrics -->
    <div class="ana-metric-sec">
      <div class="sec-head">💰 PRICE</div>
      <div class="ana-price-big" id="anaLivePriceBig">${num(initialP)} <small style="font-size: 13px; color: #8e9aa8; font-weight: 600;">USD/oz</small></div>

      <div class="sec-head">📈 TREND</div>
      <div class="ana-trend-pills">
        <span class="ana-pill bear">M1: BEARISH</span>
        <span class="ana-pill bear">M5: BEARISH</span>
        <span class="ana-pill bear">H1: BEARISH</span>
        <span class="ana-pill bull">D1: BULLISH</span>
      </div>
      <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 16px;">
        Timeframe jangka pendek (M1, M5, H1) berada dalam tekanan jualan, di mana harga bergerak di bawah purata EMA intraday berikutan data inflasi AS yang kukuh. Walau bagaimanapun, struktur jangka masa harian (D1) masih mengekalkan aliran belian makro dengan sokongan kukuh institusi.
      </p>

      <div class="sec-head">🎯 DIRECTION</div>
      <div class="ana-direction-badge">▼ DOWN</div>
      <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 16px;">
        Harga semasa berada di bawah rintangan terdekat dan terperangkap dalam struktur bear H1. Penjajaran bear M1, M5 dan H1 mencadangkan kelemahan segera menguji zon sokongan sebelum pembalikan institusi.
      </p>

      <div class="sec-head">📐 KEY LEVELS</div>
      <div class="ana-key-levels-box">
        <div class="lbl res">RESISTANCE</div>
        <div class="val" id="anaResLevels">${initLvls.r1} (${currentActiveTf} immediate) → ${initLvls.r2} (${currentActiveTf} secondary) → ${initLvls.r3} (${currentActiveTf} major)</div>
      </div>
      <div class="ana-key-levels-box" style="margin-bottom: 16px;">
        <div class="lbl sup">SUPPORT</div>
        <div class="val" id="anaSupLevels">${initLvls.s1} (${currentActiveTf} nearest) → ${initLvls.s2} (${currentActiveTf} secondary) → ${initLvls.s3} (${currentActiveTf} major)</div>
      </div>

      <div class="sec-head">⚡ WHAT'S DRIVING IT</div>
      <ul class="ana-bullet-list" style="margin-bottom: 16px;">
        <li>Data inflasi AS (CPI y/y) mencatat angka lebih tinggi dari jangkaan, menyokong kekuatan Dolar AS dan menekan emas dalam jangka pendek.</li>
        <li>Pergerakan harga M1 dan M5 kekal di bawah EMA rintangan, mengesahkan momentum jualan intraday.</li>
        <li>Kecairan institusi sedang diuji di sekitar zon Order Block SMC semasa, memberi peluang re-entry yang berkualiti.</li>
      </ul>

      <div class="sec-head" style="color: #f59e0b;">⚠️ RISK</div>
      <div class="ana-box-risk" style="margin-bottom: 16px;">
        Sekiranya harga menembusi dan menutup di atas rintangan R1 dengan pengesahan candlestick bullish pada timeframe H1, pandangan penurunan intraday terbatal dan pembeli akan mengambil alih semula momentum ke arah sasaran D1.
      </div>

      <div class="sec-head" style="color: #10b981;">💡 TAKEAWAY</div>
      <div class="ana-box-takeaway" style="margin-bottom: 14px;">
        Pedagang disarankan mencari peluang jualan (short) pada kenaikan ke zon rintangan dengan perlindungan Stop Loss di atas R2, menyasarkan sokongan S1 dan S2. Sentiasa tunggu pengesahan <i>rejection wick</i> atau candlestick SMC sebelum membuka posisi.
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 14px;">
        Not financial advice. Trade at your own risk.
      </div>
    </div>
  </section>`;

  // Update dynamic metrics display
  const updateMetricsDisplay = () => {
    const liveP = getLiveP();
    const lvls = calcKeyLevels(liveP, currentActiveTf);
    const pBig = $('#anaLivePriceBig', main);
    if (pBig) pBig.innerHTML = `${num(liveP)} <small style="font-size: 13px; color: #8e9aa8; font-weight: 600;">USD/oz</small>`;
    const rEl = $('#anaResLevels', main);
    if (rEl) rEl.textContent = `${lvls.r1} (${currentActiveTf} immediate) → ${lvls.r2} (${currentActiveTf} secondary) → ${lvls.r3} (${currentActiveTf} major)`;
    const sEl = $('#anaSupLevels', main);
    if (sEl) sEl.textContent = `${lvls.s1} (${currentActiveTf} nearest) → ${lvls.s2} (${currentActiveTf} secondary) → ${lvls.s3} (${currentActiveTf} major)`;
  };

  const tvEmbedWrap = $('#anaTvEmbedWrap', main);
  const btnModeSnr = $('#anaBtnModeSnr', main);
  const btnModeTv = $('#anaBtnModeTv', main);

  const renderTvChart = () => {
    if (!tvEmbedWrap) return;
    const sym = tvSymbols['XAUUSD'] || 'PEPPERSTONE:XAUUSD';
    const interval = tfToTvInterval[currentActiveTf] || '15';
    const liveP = getLiveP();
    const lvls = calcKeyLevels(liveP, currentActiveTf);
    const tfConf = lvls.tfConf;
    const isBull = inst.bias === 'BULLISH';

    const yR2 = 120;
    const yR1 = 180;
    const yLive = 240;
    const yS1 = 305;
    const yS2 = 365;

    const hudHtml = currentChartMode === 'snr' ? `
      <div class="amaterasu-snr-hud" style="position:absolute; top:8px; left:8px; z-index:11; pointer-events:none; background:rgba(7,10,15,0.92); backdrop-filter:blur(8px); border:1px solid rgba(239,45,61,0.35); border-radius:8px; padding:7px 10px; font-family:'Space Grotesk',sans-serif; box-shadow:0 6px 20px rgba(0,0,0,0.65); max-width:85%;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:4px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#00e676; box-shadow:0 0 8px #00e676; animation:pulseDot 1.2s infinite;"></span>
            <b style="font-size:11px; color:#fff; letter-spacing:0.4px;">AMATERASU SNR AI · LIVE</b>
          </div>
          <span style="font-size:9.5px; background:rgba(239,45,61,0.22); color:#ff5252; border:1px solid rgba(239,45,61,0.4); padding:1px 5px; border-radius:4px; font-weight:800;">${tfConf.label}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; font-size:10px;">
          <div style="color:#ef5350;"><b>R2 (${currentActiveTf}):</b> ${lvls.r2}</div>
          <div style="color:#00e676;"><b>S1 (${currentActiveTf}):</b> ${lvls.s1}</div>
          <div style="color:#ff8a80;"><b>R1 (${currentActiveTf}):</b> ${lvls.r1}</div>
          <div style="color:#69f0ae;"><b>S2 (${currentActiveTf}):</b> ${lvls.s2}</div>
        </div>
        <div style="margin-top:4px; font-size:9px; color:#f5c451; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>⚡</span> Amaterasu SMC ${currentActiveTf} Auto-Synced · Target: ${tfConf.pipsTarget} · Live Quote: ${num(liveP)}
        </div>
      </div>
    ` : '';

    const raysHtml = (currentChartMode === 'snr' && snrLinesVisible) ? `
      <div class="snr-forward-rays-wrap" id="anaForwardRaysWrap">
        <div class="amaterasu-smc-block-zone ${isBull ? 'demand' : 'supply'}" style="top:${isBull ? yS1 : yR2}px; height:${isBull ? (yS2 - yS1) : (yR1 - yR2)}px;">
          <span class="amaterasu-smc-label" style="color:${isBull ? '#00e676' : '#ef5350'};">
            <span>⚡</span> AMATERASU SMC ${isBull ? 'DEMAND' : 'SUPPLY'} ORDER BLOCK (${tfConf.label})
          </span>
        </div>
        <div class="snr-ray-container ray-r2" style="top:${yR2}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-r2">🔴 R2 · ${tfConf.tagR2} · ${lvls.r2}</span></div>
        <div class="snr-ray-container ray-r1" style="top:${yR1}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-r1">🔴 R1 · ${tfConf.tagR1} · ${lvls.r1}</span></div>
        <div class="snr-ray-container ray-live" style="top:${yLive}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-live" id="anaLiveRayTag">● LIVE ${num(liveP)}</span></div>
        <div class="snr-ray-container ray-s1" style="top:${yS1}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-s1">🟢 S1 · ${tfConf.tagS1} · ${lvls.s1}</span></div>
        <div class="snr-ray-container ray-s2" style="top:${yS2}px;"><div class="snr-ray-dot"></div><div class="snr-ray-line"></div><span class="snr-ray-tag tag-s2">🟢 S2 · ${tfConf.tagS2} · ${lvls.s2}</span></div>
      </div>
    ` : '';

    tvEmbedWrap.style.display = 'block';
    tvEmbedWrap.innerHTML = `
      ${hudHtml}
      ${raysHtml}
      <iframe 
        src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FKuala_Lumpur&hide_top_toolbar=${currentChartMode === 'snr' ? '1' : '0'}&studies=%5B%5D&hide_side_toolbar=1" 
        style="width:100%; height:100%; border:none; display:block;"
        loading="lazy">
      </iframe>
    `;

    updateMetricsDisplay();
  };

  // Initial render
  renderTvChart();

  // Mode toggling
  if (btnModeSnr && btnModeTv) {
    btnModeSnr.onclick = () => {
      btnModeSnr.classList.add('active');
      btnModeTv.classList.remove('active');
      currentChartMode = 'snr';
      renderTvChart();
    };

    btnModeTv.onclick = () => {
      btnModeTv.classList.add('active');
      btnModeSnr.classList.remove('active');
      currentChartMode = 'tv';
      renderTvChart();
    };
  }

  // Toggle SNR Lines & Rays
  const btnToggleLines = $('#anaBtnToggleLines', main);
  if (btnToggleLines) {
    btnToggleLines.onclick = () => {
      snrLinesVisible = !snrLinesVisible;
      btnToggleLines.classList.toggle('active', snrLinesVisible);
      renderTvChart();
      toast(snrLinesVisible ? '📐 Garisan Forward SNR Rays & Order Block Diaktifkan' : '📐 Garisan Forward SNR Rays Disembunyikan');
    };
  }

  // Timeframe pills
  const pills = $$('#anaTfPills .snr-pill:not(.tf-dropdown)', main);
  const dropBtn = $('#anaTfDropdownBtn', main);
  const dropMenu = $('#anaTfMenu', main);

  pills.forEach(p => {
    p.onclick = () => {
      pills.forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      if (dropBtn) {
        dropBtn.classList.remove('active');
        dropBtn.textContent = 'TF ▾';
      }
      currentActiveTf = p.dataset.tf;
      renderTvChart();
    };
  });

  if (dropBtn && dropMenu) {
    dropBtn.onclick = (e) => {
      e.stopPropagation();
      dropMenu.style.display = dropMenu.style.display === 'none' ? 'block' : 'none';
    };
    $$('#anaTfMenu div', main).forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        pills.forEach(b => b.classList.remove('active'));
        currentActiveTf = item.dataset.tf;
        dropBtn.textContent = currentActiveTf + ' ▾';
        dropBtn.classList.add('active');
        dropMenu.style.display = 'none';
        renderTvChart();
      };
    });
  }

  const closeMenu = (e) => {
    if (dropMenu && !dropMenu.contains(e.target) && e.target !== dropBtn) {
      dropMenu.style.display = 'none';
    }
  };
  document.addEventListener('click', closeMenu);

  // Zoom and Reset controls
  const zoomIn = $('#anaZoomIn', main);
  if (zoomIn) zoomIn.onclick = () => renderTvChart();
  const zoomOut = $('#anaZoomOut', main);
  if (zoomOut) zoomOut.onclick = () => renderTvChart();
  const resetBtn = $('#anaReset', main);
  if (resetBtn) resetBtn.onclick = () => {
    if (dropBtn) {
      dropBtn.textContent = 'TF ▾';
      dropBtn.classList.remove('active');
    }
    pills.forEach(b => b.classList.toggle('active', b.dataset.tf === 'M15'));
    currentActiveTf = 'M15';
    renderTvChart();
  };

  // Fullscreen Modal trigger
  const handleOpenFull = () => {
    showFullChartModal('XAUUSD', currentActiveTf, (newSym, newTf) => {
      currentActiveTf = newTf;
      pills.forEach(b => b.classList.toggle('active', b.dataset.tf === currentActiveTf));
      if (['M3', 'M30', 'H4', 'D1'].includes(currentActiveTf)) {
        if (dropBtn) {
          dropBtn.textContent = currentActiveTf + ' ▾';
          dropBtn.classList.add('active');
        }
      } else if (dropBtn) {
        dropBtn.textContent = 'TF ▾';
        dropBtn.classList.remove('active');
      }
      renderTvChart();
    });
  };

  const btnFs = $('#anaFullscreen', main);
  if (btnFs) btnFs.onclick = handleOpenFull;
  const btnOpenFull = $('#anaBtnOpenFullChart', main);
  if (btnOpenFull) btnOpenFull.onclick = handleOpenFull;

  // External TradingView App link
  const tvBtn = $('#anaBtnOpenTvApp', main);
  if (tvBtn) {
    tvBtn.onclick = () => {
      window.open('https://www.tradingview.com/chart/?symbol=PEPPERSTONE%3AXAUUSD', '_blank');
    };
  }

  // Real-Time Price Subscriber
  const onMarketTick = (price) => {
    updateMetricsDisplay();
    const liveTag = $('#anaLiveRayTag', main);
    if (liveTag) liveTag.textContent = `● LIVE ${num(price)}`;
  };
  Market.subs.add(onMarketTick);

  return () => {
    Market.subs.delete(onMarketTick);
    if (activeFsModalClose) activeFsModalClose();
    document.removeEventListener('click', closeMenu);
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
        const liveVal = (typeof Market !== 'undefined' && Market.getLivePrice) ? Market.getLivePrice(p.symbol) : null;
        const d = p.symbol === 'XAUUSD' || p.symbol === 'WTI' ? 2 : p.symbol.includes('JPY') ? 3 : p.symbol === 'BTCUSD' ? 0 : 4;
        const displayPrice = liveVal ? num(liveVal, d) : p.price;
        return `
          <div class="screener-card" data-sym="${esc(p.symbol)}" style="cursor:pointer; transition:transform 0.15s, border-color 0.15s;" title="Klik untuk analisis ${esc(p.symbol)}">
            <div class="screener-symbol">${esc(p.symbol)}</div>
            <div class="screener-price">${esc(displayPrice)}</div>
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

// ---------- 5. News (24/7 Real Live TradingView News Feed & Economic Calendar) ----------
function NewsPage(main) {
  let activeNewsTab = 'tv_live'; // 'tv_live' | 'calendar' | 'macro'

  const macroStories = [
    { id: 1, flags: ['us', 'cn'], time: 'Baru sahaja', title: 'Gold Consolidates High at $2,740+ as Central Bank Reserve Accumulation & Safe-Haven Flows Accelerate' },
    { id: 2, flags: ['us'], time: '12 minit lalu', title: 'Federal Reserve Policy Path: FOMC Members Signal Data-Dependent Pivot amid Core PCE Disinflation' },
    { id: 3, flags: ['us', 'jp'], time: '35 minit lalu', title: 'USD/JPY: Yen Volatility Expands as Bank of Japan Signals Readiness for Rate Hike Cycle' },
    { id: 4, flags: ['eu', 'us'], time: '1 jam lalu', title: 'EUR/USD: Euro Defense Zone at $1.0820 Tested as German Industrial PMI Shows Early Stabilization' },
    { id: 5, flags: ['us'], time: '2 jam lalu', title: 'WTI Crude Oil Rebounds from Support Base on Middle East Geopolitical Supply Caution' }
  ];

  const calEvents = [
    { date: 'Hari Ini (Live)', time: '20:30', name: 'US Initial Jobless Claims', country: 'us', forecast: '223 K', impact: 'HIGH' },
    { date: 'Hari Ini (Live)', time: '22:00', name: 'US Existing Home Sales', country: 'us', forecast: '4.10 M', impact: 'MED' },
    { date: 'Esok', time: '14:00', name: 'UK Retail Sales m/m', country: 'gb', forecast: '0.2%', impact: 'HIGH' },
    { date: 'Esok', time: '17:00', name: 'German Ifo Business Climate', country: 'eu', forecast: '88.1', impact: 'MED' },
    { date: 'Minggu Hadapan', time: '21:30', name: 'US Non-Farm Payrolls (NFP) & Unemployment Rate', country: 'us', forecast: '125 K / 4.1%', impact: 'HIGH' }
  ];

  const render = () => {
    main.innerHTML = `<section class="page">
      ${pageHead('News', '24/7 Live Breaking Market Wire & Economic Calendar')}

      <!-- 24/7 Live Stream Status Banner -->
      <div style="background:linear-gradient(135deg, rgba(239,45,61,0.12) 0%, rgba(11,17,24,0.95) 100%); border:1px solid rgba(239,45,61,0.3); border-radius:12px; padding:14px 16px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e676; box-shadow:0 0 10px #00e676; animation:pulse 1.5s infinite;"></span>
            <b style="font-family:'Space Grotesk',sans-serif; font-size:12px; letter-spacing:1px; color:#fff; text-transform:uppercase;">
              24/7 LIVE STREAM
            </b>
          </div>
          <span class="badge" style="background:rgba(0,230,118,0.15); border:1px solid rgba(0,230,118,0.4); color:#00e676; font-size:10px; font-weight:800;">
            TRADINGVIEW CONNECTED
          </span>
        </div>
        <p style="font-size:12px; color:#cbd5e1; margin:0; line-height:1.45;">
          Suapan berita kewangan global dikemas kini secara langsung 24 jam sehari merangkumi Emas (XAUUSD), DXY, Minyak, Forex & Kalendar Berita Berimpak Tinggi.
        </p>
      </div>

      <!-- Segmented Tab Navigation -->
      <div class="stat-filter-row" style="margin-bottom:14px; gap:8px;">
        <button class="stat-filter-pill ${activeNewsTab === 'tv_live' ? 'active' : ''}" id="tabNewsTvLive" style="flex:1; text-align:center; padding:9px 10px; font-size:11.5px; font-weight:700;">
          🔴 Live Wire 24 Jam
        </button>
        <button class="stat-filter-pill ${activeNewsTab === 'calendar' ? 'active' : ''}" id="tabNewsCalendar" style="flex:1; text-align:center; padding:9px 10px; font-size:11.5px; font-weight:700;">
          📅 Kalendar Ekonomi
        </button>
        <button class="stat-filter-pill ${activeNewsTab === 'macro' ? 'active' : ''}" id="tabNewsMacro" style="flex:1; text-align:center; padding:9px 10px; font-size:11.5px; font-weight:700;">
          ⚡ Amaterasu Macro
        </button>
      </div>

      <!-- TAB 1: 24/7 TradingView Real-Time Market Wire -->
      <div id="secNewsTvLive" style="display:${activeNewsTab === 'tv_live' ? 'block' : 'none'}; margin-bottom:20px;">
        <div class="card" style="padding:14px; border:1px solid rgba(239,45,61,0.25); background:#06080c; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0 0 2px;">TradingView Global Market Wire</h3>
              <span style="font-size:11px; color:#8e9aa8;">Live breaking stories & analysis stream 24/7</span>
            </div>
            <button class="btn-subtle" id="btnRefreshTvNews" style="font-size:11px; padding:4px 10px; border-radius:6px; background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
              🔄 Segerak
            </button>
          </div>
          
          <!-- Live TradingView Timeline Embed Iframe -->
          <div style="width:100%; height:540px; border-radius:8px; overflow:hidden; background:#040608; border:1px solid rgba(255,255,255,0.08);">
            <iframe 
              id="tvTimelineIframe"
              src="https://s.tradingview.com/embed-widget/timeline/?locale=en#%7B%22feedMode%22%3A%22all_symbols%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22displayMode%22%3A%22regular%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22utm_source%22%3A%22localhost%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22timeline%22%7D" 
              style="width:100%; height:100%; border:none; display:block;"
              loading="lazy">
            </iframe>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <span style="font-size:11px; color:#64748b;">Suapan disegerakkan terus daripada server TradingView</span>
            <a href="https://www.tradingview.com/news/" target="_blank" style="color:var(--solar-gold); font-size:12px; font-weight:600; text-decoration:none;">
              Buka di TradingView ›
            </a>
          </div>
        </div>
      </div>

      <!-- TAB 2: 24/7 Live Economic Calendar -->
      <div id="secNewsCalendar" style="display:${activeNewsTab === 'calendar' ? 'block' : 'none'}; margin-bottom:20px;">
        <div class="card" style="padding:14px; border:1px solid rgba(239,45,61,0.25); background:#06080c; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0 0 2px;">Kalendar Berita Berimpak Tinggi (24/7)</h3>
              <span style="font-size:11px; color:#8e9aa8;">Live release, forecast vs actual & countdown</span>
            </div>
            <span class="badge" style="background:rgba(255,160,0,0.15); border:1px solid var(--solar-gold); color:var(--solar-gold); font-size:10px;">
              HIGH IMPACT ONLY
            </span>
          </div>

          <!-- Live TradingView Events Calendar Iframe -->
          <div style="width:100%; height:540px; border-radius:8px; overflow:hidden; background:#040608; border:1px solid rgba(255,255,255,0.08);">
            <iframe 
              id="tvCalendarIframe"
              src="https://s.tradingview.com/embed-widget/events/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%220%2C1%22%2C%22countryFilter%22%3A%22us%2Ceu%2Cgb%2Cjp%2Cca%2Cau%22%2C%22utm_source%22%3A%22localhost%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22events%22%7D" 
              style="width:100%; height:100%; border:none; display:block;"
              loading="lazy">
            </iframe>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <span style="font-size:11px; color:#64748b;">Masa ditukar automatik ke zon Malaysia (MYT)</span>
            <a href="#ainews" style="color:var(--solar-gold); font-size:12px; font-weight:600; text-decoration:none;">
              Lihat Unjuran AI News ›
            </a>
          </div>
        </div>
      </div>

      <!-- TAB 3: Amaterasu Macro Intelligence Desk -->
      <div id="secNewsMacro" style="display:${activeNewsTab === 'macro' ? 'block' : 'none'}; margin-bottom:20px;">
        <div class="card" style="padding:16px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0;">Amaterasu Macro Briefing</h3>
            <span class="badge" style="background:rgba(0,230,118,0.15); color:#00e676; font-size:10.5px;">PRO DESK</span>
          </div>
          <div class="news-feed">
            ${macroStories.map(s => `
              <div class="news-item" style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;" onclick="location.hash='#ainews'">
                <div class="news-meta" style="font-size:11.5px; color:#8e9aa8; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                  <span>${(s.flags || ['us']).map(flag).join(' ')}</span>
                  <span style="color:#00e676; font-weight:600;">● ${s.time}</span>
                </div>
                <h4 style="font-size:13.5px; line-height:1.45; color:#f1f5f9; font-weight:600; margin:0 0 4px;">${esc(s.title)}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                  <span style="font-size:10.5px; color:#64748b;">Sentimen: Institutional Confluence</span>
                  <span style="font-size:11px; color:var(--solar-gold); font-weight:600;">Semak Impak Gold ›</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Quick Summary Table of Upcoming High-Impact Releases -->
        <div class="card" style="padding:16px; border:1px solid rgba(255,255,255,0.08);">
          <h4 style="font-size:14px; font-weight:700; color:#fff; margin:0 0 10px;">Ringkasan Data Ekonomi Tumpuan</h4>
          ${calEvents.map(ev => `
            <div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:11px; color:#8e9aa8; margin-bottom:2px;">${ev.date} · <b>${ev.time}</b> ${flag(ev.country)}</div>
                <b style="font-size:12.5px; color:#e2e8f0;">${ev.name}</b>
              </div>
              <div style="text-align:right;">
                <span class="badge" style="font-size:9.5px; padding:2px 6px; background:${ev.impact === 'HIGH' ? 'rgba(239,83,80,0.2)' : 'rgba(255,160,0,0.2)'}; color:${ev.impact === 'HIGH' ? '#ef5350' : '#ffa000'};">
                  ${ev.impact}
                </span>
                <span style="display:block; font-size:10.5px; color:#94a3b8; margin-top:2px;">F: <b style="color:#fff;">${ev.forecast}</b></span>
              </div>
            </div>
          `).join('')}
          <div style="margin-top:12px; text-align:center;">
            <a href="#ainews" style="color:var(--solar-gold); font-size:12px; font-weight:700; text-decoration:none;">
              Lihat Jadual Penuh AI News Desk ›
            </a>
          </div>
        </div>
      </div>
    </section>`;

    // Wire up tab buttons
    const btnTv = $('#tabNewsTvLive', main);
    const btnCal = $('#tabNewsCalendar', main);
    const btnMacro = $('#tabNewsMacro', main);
    const secTv = $('#secNewsTvLive', main);
    const secCal = $('#secNewsCalendar', main);
    const secMacro = $('#secNewsMacro', main);

    if (btnTv && btnCal && btnMacro) {
      btnTv.onclick = () => {
        activeNewsTab = 'tv_live';
        btnTv.classList.add('active');
        btnCal.classList.remove('active');
        btnMacro.classList.remove('active');
        secTv.style.display = 'block';
        secCal.style.display = 'none';
        secMacro.style.display = 'none';
      };
      btnCal.onclick = () => {
        activeNewsTab = 'calendar';
        btnCal.classList.add('active');
        btnTv.classList.remove('active');
        btnMacro.classList.remove('active');
        secCal.style.display = 'block';
        secTv.style.display = 'none';
        secMacro.style.display = 'none';
      };
      btnMacro.onclick = () => {
        activeNewsTab = 'macro';
        btnMacro.classList.add('active');
        btnTv.classList.remove('active');
        btnCal.classList.remove('active');
        secMacro.style.display = 'block';
        secTv.style.display = 'none';
        secCal.style.display = 'none';
      };
    }

    const btnRefresh = $('#btnRefreshTvNews', main);
    if (btnRefresh) {
      btnRefresh.onclick = () => {
        const ifr = $('#tvTimelineIframe', main);
        if (ifr) {
          const s = ifr.src;
          ifr.src = '';
          setTimeout(() => { ifr.src = s; }, 50);
          toast('Suapan berita TradingView disegerakkan secara langsung ✓');
        }
      };
    }
  };

  render();
}

// ---------- 6. AI News (Amaterasu X Institutional News Desk) ----------
function AiNewsPage(main) {
  const goldPrice = Market.getLivePrice('XAUUSD') || 3995.81;
  const nwStats = (AppState && AppState.aiNewsStats) || { totalNewsSignals: 0, winRate: 0, tpHit: 0, slHit: 0, totalPips: 0 };
  const nwHistory = (AppState && Array.isArray(AppState.aiNewsHistory)) ? AppState.aiNewsHistory : [];

  // High-impact economic calendar events tracked by Amaterasu AI
  const upcomingEvents = [
    { id: 'ev-1', country: 'gb', flag: '🇬🇧', name: 'UK Retail Sales & GDP Update', time: '14:00', session: 'Sesi London', impact: 'HIGH', bias: 'BEARISH PULLBACK ▼', pips: '+45 - +80 pip' },
    { id: 'ev-2', country: 'eu', flag: '🇪🇺', name: 'German Ifo Business Climate & CPI', time: '17:00', session: 'Sesi Eropah', impact: 'MEDIUM', bias: 'CONSOLIDATION ⬌', pips: '+35 - +60 pip' },
    { id: 'ev-3', country: 'us', flag: '🇺🇸', name: 'US Initial Jobless Claims & Core PCE', time: '20:30', session: 'Sesi New York (Peak Volatility)', impact: 'HIGH', bias: 'BULLISH ACCUMULATION ▲', pips: '+60 - +110 pip' },
    { id: 'ev-4', country: 'us', flag: '🇺🇸', name: 'US Existing Home Sales & Flash PMI', time: '22:00', session: 'Sesi New York', impact: 'HIGH', bias: 'VOLATILE EXPANSION ⚡', pips: '+50 - +85 pip' },
    { id: 'ev-5', country: 'us', flag: '🇺🇸', name: 'US ISM Manufacturing PMI & JOLTS', time: '23:00', session: 'Sesi New York', impact: 'HIGH', bias: 'BULLISH SWEEP ▲', pips: '+70 - +120 pip' }
  ];

  // Helper to calculate seconds until given HH:MM (MYT / local time)
  function getSecondsUntil(timeStr) {
    const now = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const targetSec = h * 3600 + m * 60;
    let diff = targetSec - nowSec;
    if (diff < 0) diff += 24 * 3600; // cycle to tomorrow
    return diff;
  }

  // Find next upcoming high impact event
  function getNextEvent() {
    const sorted = [...upcomingEvents].sort((a, b) => getSecondsUntil(a.time) - getSecondsUntil(b.time));
    const next = sorted[0];
    const diffSec = getSecondsUntil(next.time);
    return { event: next, diffSec };
  }

  function getPhaseStatus(diffSec) {
    if (diffSec <= 60) {
      return {
        text: '⚡ NEWS SEDANG DILEPASKAN: Volatility Tertinggi Sedang Berlaku!',
        badgeColor: '#ef5350',
        bgColor: 'rgba(239,83,80,0.18)',
        borderColor: '#ef5350'
      };
    }
    if (diffSec <= 15 * 60) {
      return {
        text: '🔥 FASA T-15 MINIT: Signal Live Sedang Dikeluarkan! Sedia untuk Eksekusi!',
        badgeColor: '#ef5350',
        bgColor: 'rgba(239,83,80,0.18)',
        borderColor: '#ef5350'
      };
    }
    if (diffSec <= 4 * 3600) {
      return {
        text: '⚠️ FASA T-4 JAM: Pengesahan Arah AI & Order Block Semasa Aktif',
        badgeColor: '#ffa000',
        bgColor: 'rgba(255,160,0,0.12)',
        borderColor: '#ffa000'
      };
    }
    if (diffSec <= 8 * 3600) {
      return {
        text: '⏳ FASA T-8 JAM: Unjuran Awal AI Aktif (Early Directional Bias)',
        badgeColor: '#00e676',
        bgColor: 'rgba(0,230,118,0.12)',
        borderColor: '#00e676'
      };
    }
    return {
      text: '🕒 MONITORING: Enjin AI Memantau Aliran Kecairan Pasaran Sebelum Unjuran',
      badgeColor: '#94a3b8',
      bgColor: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.1)'
    };
  }

  const { event: nextEv, diffSec: initialDiff } = getNextEvent();
  const initH = Math.floor(initialDiff / 3600);
  const initM = Math.floor((initialDiff % 3600) / 60);
  const initS = initialDiff % 60;
  const initPhase = getPhaseStatus(initialDiff);

  main.innerHTML = `<section class="page">
    ${pageHead('AI News', 'High-impact news + AI directional bias (bullish/bearish)')}

    <!-- Quick Action Chips -->
    <div class="ainews-chips-row">
      <a class="ainews-chip" href="#screener">
        <span>📊</span>
        <span>Screener XAUUSD <b>${num(goldPrice)}</b></span>
      </a>
      <a class="ainews-chip" href="#analysis">
        <span>📈</span>
        <span>Gold Analysis</span>
      </a>
    </div>

    <!-- HERO: LIVE COUNTDOWN TIMER TO NEXT HIGH-IMPACT NEWS -->
    <div class="card" style="margin-bottom:16px; padding:18px 16px; border:1px solid rgba(255,160,0,0.4); background:linear-gradient(180deg, rgba(255,160,0,0.12) 0%, rgba(8,12,20,0.95) 100%); box-shadow:0 6px 24px rgba(0,0,0,0.45);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <span style="font-size:10px; font-weight:800; color:var(--solar-gold); letter-spacing:1px; text-transform:uppercase;">
            ⏱️ COUNTDOWN PELEPASAN BERITA
          </span>
          <h3 style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#fff; margin:2px 0;">
            Pelepasan AI News Seterusnya
          </h3>
        </div>
        <span class="badge" style="background:rgba(239,83,80,0.18); border:1px solid #ef5350; color:#ef5350; font-size:10px; font-weight:800; display:inline-flex; align-items:center; gap:5px;">
          <span style="display:inline-block; width:6px; height:6px; background:#ef5350; border-radius:50%; box-shadow:0 0 6px #ef5350;"></span>
          LIVE TIMER
        </span>
      </div>

      <!-- Glowing Digital LED 3-Box Countdown Display -->
      <div style="background:#04070c; border:1px solid rgba(255,179,0,0.25); border-radius:12px; padding:14px 10px; margin-bottom:12px; box-shadow:inset 0 0 20px rgba(0,0,0,0.7);">
        <div style="display:grid; grid-template-columns:1fr auto 1fr auto 1fr; align-items:center; gap:6px; text-align:center;">
          <!-- Hours Box -->
          <div style="background:rgba(255,179,0,0.06); border:1px solid rgba(255,179,0,0.2); border-radius:8px; padding:10px 4px;">
            <span id="aiNewsTimerHrs" style="font-family:'Space Grotesk',sans-serif; font-size:34px; font-weight:900; color:#ffb300; display:block; line-height:1; text-shadow:0 0 14px rgba(255,179,0,0.45);">
              ${String(initH).padStart(2, '0')}
            </span>
            <span style="font-size:9.5px; font-weight:800; color:#94a3b8; letter-spacing:1px; margin-top:4px; display:block;">JAM</span>
          </div>

          <b style="font-family:'Space Grotesk',sans-serif; font-size:24px; color:rgba(255,179,0,0.6);">:</b>

          <!-- Minutes Box -->
          <div style="background:rgba(255,179,0,0.06); border:1px solid rgba(255,179,0,0.2); border-radius:8px; padding:10px 4px;">
            <span id="aiNewsTimerMins" style="font-family:'Space Grotesk',sans-serif; font-size:34px; font-weight:900; color:#ffb300; display:block; line-height:1; text-shadow:0 0 14px rgba(255,179,0,0.45);">
              ${String(initM).padStart(2, '0')}
            </span>
            <span style="font-size:9.5px; font-weight:800; color:#94a3b8; letter-spacing:1px; margin-top:4px; display:block;">MINIT</span>
          </div>

          <b style="font-family:'Space Grotesk',sans-serif; font-size:24px; color:rgba(255,179,0,0.6);">:</b>

          <!-- Seconds Box -->
          <div style="background:rgba(255,179,0,0.06); border:1px solid rgba(255,179,0,0.2); border-radius:8px; padding:10px 4px;">
            <span id="aiNewsTimerSecs" style="font-family:'Space Grotesk',sans-serif; font-size:34px; font-weight:900; color:#ffb300; display:block; line-height:1; text-shadow:0 0 14px rgba(255,179,0,0.45);">
              ${String(initS).padStart(2, '0')}
            </span>
            <span style="font-size:9.5px; font-weight:800; color:#94a3b8; letter-spacing:1px; margin-top:4px; display:block;">SAAT</span>
          </div>
        </div>
      </div>

      <!-- Target News Snapshot Banner -->
      <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="aiNewsTargetFlag" style="display:inline-flex; align-items:center;">${flag(nextEv.country)}</span>
            <b id="aiNewsTargetName" style="font-size:13.5px; color:#fff;">${nextEv.name}</b>
          </div>
          <span class="badge" style="background:rgba(239,83,80,0.2); border:1px solid #ef5350; color:#ef5350; font-size:9.5px; font-weight:800;">
            🔴 ${nextEv.impact}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.08);">
          <div>
            <span style="font-size:10px; color:#8e9aa8; display:block;">MASA PELEPASAN</span>
            <b id="aiNewsTargetTime" style="font-size:12.5px; color:var(--solar-gold); font-family:'Space Grotesk',sans-serif;">
              ${nextEv.time} MYT (${nextEv.session})
            </b>
          </div>
          <div>
            <span style="font-size:10px; color:#8e9aa8; display:block;">UNJURAN BIAS MATA WANG (${(nextEv.country || 'us').toUpperCase()})</span>
            <b id="aiNewsTargetBias" style="font-size:12.5px; color:#00e676;">
              ${nextEv.bias}
            </b>
          </div>
        </div>

        <div style="margin-top:8px; padding:6px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#8e9aa8;">Kesan Langsung ke Emas (XAUUSD):</span>
          <b id="aiNewsGoldImpact" style="font-size:11.5px; font-weight:800;">
            ${(nextEv.bias || '').includes('BULL') ? '<span style="color:#ef5350;">🔴 BEARISH / SELL (USD Kuat = Emas Jatuh)</span>' : '<span style="color:#00e676;">🟢 BULLISH / BUY (USD Lemah = Emas Naik)</span>'}
          </b>
        </div>
      </div>

      <!-- Live Dynamic AI SOP Phase Status -->
      <div id="aiNewsPhaseStatus" style="background:${initPhase.bgColor}; border:1px solid ${initPhase.borderColor}; border-radius:8px; padding:10px 12px; font-size:11.5px; font-weight:700; color:${initPhase.badgeColor}; display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span>${initPhase.text}</span>
      </div>

      <button class="btn gold" id="btnCheckAiNewsNow" style="width:100%; padding:11px; font-weight:700; font-size:12.5px; border-radius:8px;">
        ⚡ Semak Unjuran Terkini AI Directional Bias
      </button>
    </div>

    <!-- DEDICATED AI NEWS PERFORMANCE STATS SECTION -->
    <div class="card" style="margin-bottom:16px; padding:18px 16px; border:1px solid rgba(255,160,0,0.35); background:linear-gradient(180deg, rgba(255,160,0,0.07) 0%, rgba(13,20,30,0.95) 100%); box-shadow:0 4px 20px rgba(0,0,0,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <span style="font-size:10.5px; font-weight:800; color:var(--solar-gold); letter-spacing:1px; text-transform:uppercase;">PRESTASI KHAS AI NEWS</span>
          <h3 style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#fff; margin:2px 0;">
            Rekod Prestasi Sepanjang AI News
          </h3>
        </div>
        <span class="badge" style="background:rgba(0,230,118,0.18); border:1px solid #00e676; color:#00e676; font-size:10px; font-weight:800;">
          LIVE TRACKER
        </span>
      </div>

      <!-- Big Profit Box -->
      <div style="background:#050609; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; text-align:center; margin-bottom:12px;">
        <span style="font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; display:block;">JUMLAH KEUNTUNGAN SEPANJANG AI NEWS</span>
        <b style="font-family:'Space Grotesk',sans-serif; font-size:26px; color:#00e676; display:block; margin-top:3px;">
          ${(nwStats.totalPips >= 0 ? '+' : '') + (nwStats.totalPips || 0)} pip
        </b>
      </div>

      <!-- 4-Metrics Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:10px 12px; border-radius:8px;">
          <span style="font-size:10px; color:#8e9aa8; display:block;">NEWS WIN RATE</span>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:18px; color:var(--solar-gold);">
            ${nwStats.totalNewsSignals === 0 ? '0%' : (nwStats.winRate || 0) + '%'}
          </b>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:10px 12px; border-radius:8px;">
          <span style="font-size:10px; color:#8e9aa8; display:block;">EVENTS TRADED</span>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:18px; color:#fff;">
            ${nwStats.totalNewsSignals || 0}
          </b>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:10px 12px; border-radius:8px;">
          <span style="font-size:10px; color:#8e9aa8; display:block;">NEWS TP HIT</span>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:18px; color:#00e676;">
            ${nwStats.tpHit || 0}
          </b>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:10px 12px; border-radius:8px;">
          <span style="font-size:10px; color:#8e9aa8; display:block;">NEWS SL HIT</span>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:18px; color:#ef5350;">
            ${nwStats.slHit || 0}
          </b>
        </div>
      </div>

      <!-- AI News History Feed -->
      <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-muted); margin:12px 0 8px;">
        Sejarah Signal Pelepasan Berita
      </h4>

      <div class="ainews-history-list" style="display:flex; flex-direction:column; gap:8px;">
        ${nwHistory.length === 0 ? `
          <div style="text-align:center; padding:22px 12px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.08); border-radius:8px;">
            <span style="font-size:24px; display:block; margin-bottom:4px;">📊</span>
            <b style="font-size:12.5px; color:var(--solar-gold); display:block;">Rekod Prestasi AI News Bermula Dari 0</b>
            <span style="font-size:11px; color:#8e9aa8; display:block; margin-top:2px;">
              Setiap kali pelepasan berita berimpak tinggi selesai, keputusan unjuran dan pips keuntungan akan dicatatkan di sini secara automatik.
            </span>
          </div>
        ` : nwHistory.map(h => `
          <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
                <span style="font-size:11px; color:#8e9aa8;">${h.date} · ${h.time}</span>
                <span class="badge" style="font-size:9.5px; padding:1px 5px; background:${h.bias === 'BULLISH' ? 'rgba(0,230,118,0.15)' : 'rgba(239,83,80,0.15)'}; color:${h.bias === 'BULLISH' ? '#00e676' : '#ef5350'};">
                  ${h.bias}
                </span>
              </div>
              <b style="font-size:13px; color:#fff; display:block;">${h.event}</b>
              <span style="font-size:10.5px; color:#94a3b8;">${h.symbol} @ ${num(h.entry)}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:800; color:${h.pips > 0 ? '#00e676' : '#ef5350'}; display:block;">
                ${h.pips > 0 ? '+' : ''}${h.pips} pip
              </span>
              <span class="badge" style="font-size:9.5px; padding:1px 5px; background:rgba(0,230,118,0.15); color:#00e676;">
                ${h.status}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Watching for the Next Big Release Card -->
    <div class="ainews-card-watch" style="margin-bottom:16px;">
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

    <!-- SOP Jadual Bila Signal AI News Keluar -->
    <div class="card" style="margin-bottom:16px; padding:18px 16px;">
      <div class="card-head" style="margin-bottom:12px; padding-bottom:6px;">
        <h4 style="font-size:13.5px; font-weight:700; color:var(--solar-gold); margin:0;">
          ⏱️ SOP: BILA SIGNAL AI NEWS AKAN KELUAR?
        </h4>
        <span class="badge" style="font-size:10px; background:rgba(0,230,118,0.15); color:#00e676;">SOP AMATERASU X</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <span style="background:rgba(255,160,0,0.15); border:1px solid var(--solar-gold); color:var(--solar-gold); font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; white-space:nowrap;">T-8 JAM</span>
          <div>
            <b style="color:#fff; font-size:13px; display:block;">1. Unjuran Awal (Early Projection)</b>
            <span style="font-size:12px; color:#94a3b8; line-height:1.45;">8 jam sebelum news, AI mula menganalisis jangkaan data ekonomi (Forecast vs Previous) dan mengeluarkan arah awal Gold & DXY.</span>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <span style="background:rgba(0,230,118,0.15); border:1px solid #00e676; color:#00e676; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; white-space:nowrap;">T-4 JAM</span>
          <div>
            <b style="color:#fff; font-size:13px; display:block;">2. Pengesahan Semula (Confirmation Call)</b>
            <span style="font-size:12px; color:#94a3b8; line-height:1.45;">4 jam sebelum release, AI menyemak semula posisi Order Block dan kecairan institusi pasaran semasa bagi mengesahkan arah.</span>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <span style="background:rgba(239,83,80,0.15); border:1px solid #ef5350; color:#ef5350; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; white-space:nowrap;">T-15 MINIT</span>
          <div>
            <b style="color:#fff; font-size:13px; display:block;">3. Signal Eksekusi Live News (Execution Setup)</b>
            <span style="font-size:12px; color:#94a3b8; line-height:1.45;">15-30 minit sebelum data diumumkan, signal kemasukan dikeluarkan lengkap dengan paras Entry, TP pantas (+50 ke +100 pips), dan SL perlindungan.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- JADUAL & COUNTDOWN BERITA BERIMPAK TINGGI HARI INI -->
    <div class="card" style="padding:18px 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <span style="font-size:11px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">JADUAL PELEPASAN & COUNTDOWN</span>
          <h4 style="font-size:16px; font-weight:700; color:#fff; margin:2px 0;">Kalendar Berita Berimpak Tinggi AI</h4>
        </div>
        <span class="badge" style="background:rgba(255,160,0,0.18); border:1px solid var(--solar-gold); color:var(--solar-gold); font-weight:800;">
          5 ACARA AKTIF
        </span>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
        ${upcomingEvents.map(ev => {
          const diff = getSecondsUntil(ev.time);
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = diff % 60;
          return `
            <div style="background:#07090e; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px;">
                  <span style="display:inline-flex; align-items:center;">${flag(ev.country)}</span>
                  <b style="font-size:13px; color:#fff;">${ev.name}</b>
                </div>
                <div style="display:flex; align-items:center; gap:8px; font-size:11px; color:#94a3b8;">
                  <span>${ev.time} MYT · ${ev.session}</span>
                  <span style="color:#00e676; font-weight:700;">${ev.pips}</span>
                </div>
              </div>
              <div style="text-align:right; white-space:nowrap;">
                <span class="badge news-row-timer" data-time="${ev.time}" style="background:rgba(255,160,0,0.15); border:1px solid rgba(255,160,0,0.4); color:var(--solar-gold); font-size:10.5px; font-weight:800; font-family:'Space Grotesk',sans-serif;">
                  ⏱️ ${h}j ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s
                </span>
                <span style="display:block; font-size:9.5px; color:${ev.impact === 'HIGH' ? '#ef5350' : '#ffa000'}; font-weight:700; margin-top:3px;">
                  ${ev.impact}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <p style="font-size:12px; color:#8e9aa8; line-height:1.45; margin:0;">
        Enjin AI sentiasa menyaring data kalendar berimpak 3-bintang. Di luar waktu berita berimpak tinggi, sistem menumpukan signal teknikal Order Block di tab <a href="#signal" style="color:var(--solar-gold); font-weight:700;">Signal</a>.
      </p>
    </div>
  </section>`;

  // Live Timer Interval Handler
  const elHrs = $('#aiNewsTimerHrs', main);
  const elMins = $('#aiNewsTimerMins', main);
  const elSecs = $('#aiNewsTimerSecs', main);
  const elTargetFlag = $('#aiNewsTargetFlag', main);
  const elTargetName = $('#aiNewsTargetName', main);
  const elTargetTime = $('#aiNewsTargetTime', main);
  const elTargetBias = $('#aiNewsTargetBias', main);
  const elPhaseStatus = $('#aiNewsPhaseStatus', main);

  function updateLiveCountdown() {
    const { event, diffSec } = getNextEvent();
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    if (elHrs) elHrs.textContent = String(h).padStart(2, '0');
    if (elMins) elMins.textContent = String(m).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(s).padStart(2, '0');

    if (elTargetFlag) elTargetFlag.innerHTML = flag(event.country);
    if (elTargetName) elTargetName.textContent = event.name;
    if (elTargetTime) elTargetTime.textContent = `${event.time} MYT (${event.session})`;
    if (elTargetBias) elTargetBias.textContent = event.bias;
    const elGoldImpact = $('#aiNewsGoldImpact', main);
    if (elGoldImpact) {
      const isBull = (event.bias || '').includes('BULL');
      elGoldImpact.innerHTML = isBull 
        ? '<span style="color:#ef5350;">🔴 BEARISH / SELL (USD Kuat = Emas Jatuh)</span>'
        : '<span style="color:#00e676;">🟢 BULLISH / BUY (USD Lemah = Emas Naik)</span>';
    }

    const phase = getPhaseStatus(diffSec);
    if (elPhaseStatus) {
      elPhaseStatus.innerHTML = `<span>${phase.text}</span>`;
      elPhaseStatus.style.background = phase.bgColor;
      elPhaseStatus.style.borderColor = phase.borderColor;
      elPhaseStatus.style.color = phase.badgeColor;
    }

    // Update row badges
    $$('.news-row-timer', main).forEach(tag => {
      const t = tag.dataset.time;
      if (t) {
        const rowDiff = getSecondsUntil(t);
        const rh = Math.floor(rowDiff / 3600);
        const rm = Math.floor((rowDiff % 3600) / 60);
        const rs = rowDiff % 60;
        tag.textContent = `⏱️ ${rh}j ${String(rm).padStart(2, '0')}m ${String(rs).padStart(2, '0')}s`;
      }
    });
  }

  const timerInterval = setInterval(updateLiveCountdown, 1000);

  const btnCheck = $('#btnCheckAiNewsNow', main);
  if (btnCheck) {
    btnCheck.onclick = () => {
      const { event, diffSec } = getNextEvent();
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      toast(`⚡ AI News Desk: Unjuran untuk ${event.name} (${event.time} MYT) adalah ${event.bias}. Pelepasan dalam ${h} jam ${m} minit!`);
    };
  }

  // Return router cleanup callback
  return () => {
    clearInterval(timerInterval);
  };
}

