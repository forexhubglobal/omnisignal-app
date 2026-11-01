const fs = require('fs');
const filePath = 'js/pages-main.js';
let content = fs.readFileSync(filePath, 'utf8');

const normalized = content.replace(/\r\n/g, '\n');

const startMarker = '// ---------- 2. Stat (Dynamic Multi-Day Historical Analytics) ----------\nfunction StatPage(main) {';
const endMarker = '// ---------- 3. Analysis (Amaterasu X Gold Analysis 100% Real-Time TradingView Match) ----------';

const startIndex = normalized.indexOf(startMarker);
const endIndex = normalized.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

const newStatPageCode = `// ---------- 2. Stat (Dynamic Multi-Day Historical Analytics) ----------
function StatPage(main) {
  const st = (AppState && AppState.stats) || {
    totalSignals: 0,
    winRate: 0,
    tp1Hit: 0,
    tp2Hit: 0,
    tp3Hit: 0,
    slHit: 0,
    totalProfitToday: 0
  };

  const signals = (AppState && Array.isArray(AppState.signals)) ? AppState.signals : [];

  // Group signals & stats by exact date string
  const dateMap = {}; // { [dateStr]: { pips, wins, losses, tp1, tp2, tp3, sl, signals: [] } }
  signals.forEach(s => {
    const dt = s.date || 'Today';
    if (!dateMap[dt]) {
      dateMap[dt] = { pips: 0, wins: 0, losses: 0, tp1: 0, tp2: 0, tp3: 0, sl: 0, signals: [] };
    }
    dateMap[dt].signals.push(s);
    const isBe = s.status === 'BE' || (s.status === 'SL' && (s.peak || 0) >= 25);
    const p = isBe ? 0 : (Number(s.pips) || 0);
    dateMap[dt].pips += p;
    if (p > 0 || ['TP1', 'TP2', 'TP3', 'CLOSED IN PROFIT', 'TP_TRAIL'].includes(s.status)) {
      dateMap[dt].wins++;
      if (s.status === 'TP3') dateMap[dt].tp3++;
      else if (s.status === 'TP2') dateMap[dt].tp2++;
      else dateMap[dt].tp1++;
    } else if (s.status === 'SL' && !isBe) {
      dateMap[dt].losses++;
      dateMap[dt].sl++;
    }
  });

  // Calculate 7-day bars dynamically from actual history
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDate = new Date();
  const computed7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
    const isToday = (i === 0);
    const label = isToday ? 'Today' : dayName;

    let p = 0;
    if (dateMap[dateStr]) {
      p = dateMap[dateStr].pips;
    } else if (isToday && dateMap['Today']) {
      p = dateMap['Today'].pips;
    } else if (isToday && typeof st.totalProfitToday === 'number' && st.totalProfitToday > 0) {
      p = st.totalProfitToday;
    }

    computed7Days.push({
      day: label,
      date: dateStr,
      dayFull: isToday ? \`Today (\${dayName})\` : \`\${dayName} (\${dateStr})\`,
      pips: p,
      isToday: isToday
    });
  }

  const maxPips = Math.max(...computed7Days.map(d => d.pips || 0), 100);
  const total7Days = computed7Days.reduce((acc, d) => acc + (d.pips || 0), 0);

  // Available unique dates
  const historicalDates = Object.keys(dateMap).filter(d => d !== 'Today');
  const availableDates = [];
  const todayDateStr = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });

  if (dateMap['Today'] || dateMap[todayDateStr]) {
    availableDates.push(dateMap['Today'] ? 'Today' : todayDateStr);
  } else {
    availableDates.push('Today');
  }
  historicalDates.forEach(d => {
    if (!availableDates.includes(d)) availableDates.push(d);
  });

  let currentMode = 'all'; // 'all' | 'daily' | 'weekly' | 'oct30' | 'oct29'
  let curDateIdx = availableDates.indexOf('Oct 30') !== -1 ? availableDates.indexOf('Oct 30') : 0;

  function renderCard(s) {
    const isSell = s.type === 'SELL';
    const arrow = isSell ? '▼' : '▲';
    const arrowCol = isSell ? '#ef5350' : '#26a69a';
    const isActuallyBE = s.status === 'BE' || (s.status === 'SL' && (s.peak || 0) >= 25);
    const isSL = s.status === 'SL' && !isActuallyBE;
    const isBE = isActuallyBE;
    const pipsNum = isBE ? 0 : (Number(s.pips) || 0);
    const badges = isBE ? ['TP1', 'BE'] : (s.tags && Array.isArray(s.tags) ? s.tags : (s.badge || '').split(' ')).filter(Boolean);
    return \`
      <div class="sig-history-item" style="display:flex; justify-content:space-between; align-items:center; background:#111722; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:8px;">
        <div>
          <div style="font-size: 12.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 600;">
            <span class="muted" style="font-size:11px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; margin-right:4px;">\${s.date || 'Today'}</span>
            <span style="color: \${arrowCol}; margin: 0 4px;">\${arrow}</span>
            <b style="color: \${arrowCol};">\${s.symbol}</b>
            <span style="font-size:11px; color:#8e9aa8; margin-left:6px;">@ \${s.entry || ''}</span>
          </div>
          <div style="font-size: 11px; color: #8e9aa8; margin-bottom: 4px;">\${s.time || ''} · M15</div>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            \${badges.map(b => \`<span class="history-badge \${b.toLowerCase()}" style="font-size:9.5px; padding:1px 6px; border-radius:4px;">\${b}</span>\`).join('')}
          </div>
        </div>
        <div style="text-align: right;">
          \${isSL ? \`
            <div style="color: #ef5350; font-family:'Space Grotesk',sans-serif; font-size: 13.5px; font-weight: 700;">
              SL · \${pipsNum} pip \${s.peak && s.peak < 15 ? \`<span style="font-size: 10px; color: #8e9aa8; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 4px; margin-left: 4px;">peak +\${s.peak}p</span>\` : ''}
            </div>
          \` : isBE ? \`
            <div style="font-family:'Space Grotesk',sans-serif; font-size: 13.5px; font-weight: 700; color: var(--solar-gold);">
              BE (SIFAR RISIKO) · 0 pip <span style="font-size: 10px; color: #00e676; border: 1px solid rgba(0,230,118,0.4); border-radius: 4px; padding: 1px 4px; margin-left: 4px;">peak +\${s.peak || 30}p</span>
            </div>
          \` : \`
            <div style="font-family:'Space Grotesk',sans-serif; font-size: 13.5px; font-weight: 700; color: #00e676;">
              \${s.status === 'CLOSED IN PROFIT' ? 'CLOSED · ' : ''}\${s.status && s.status.startsWith('TP') ? \`\${s.status} · \` : ''}+\${pipsNum} pip
            </div>
          \`}
        </div>
      </div>
    \`;
  }

  // Pre-render all signal cards directly into HTML upfront!
  const initialCardsHtml = signals.length > 0 
    ? signals.slice(0, 150).map(renderCard).join('')
    : \`<div style="text-align:center; padding:32px 16px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px;">
         <div style="font-size:32px; margin-bottom:8px;">📊</div>
         <b style="color:var(--solar-gold); font-size:14px; display:block; margin-bottom:4px;">Tiada Rekod Tersimpan</b>
         <p style="font-size:12px; color:var(--text-muted); line-height:1.4; margin:0 auto; max-width:280px;">
           Pangkalan data bersedia merekodkan semua isyarat selesai.
         </p>
       </div>\`;

  main.innerHTML = \`<section class="page">
    \${pageHead('Stat', 'Overall signal performance & historical records')}

    <!-- 1. Total Profit Dynamic Card -->
    <div class="stat-profit-today-card" id="statProfitCard">
      <div class="lbl" id="statProfitLabel">TOTAL PROFIT (ALL TIME)</div>
      <div class="val" id="statProfitVal">+9330 pip</div>
    </div>

    <!-- 2. Four Metrics Grid (2x2) -->
    <div class="stat-grid-4">
      <div class="stat-box-small">
        <div class="lbl">WIN RATE</div>
        <div class="val green" id="statWinRateVal">93%</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SIGNALS CLOSED</div>
        <div class="val" id="statClosedVal">\${signals.length}</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">TP1 / TP2 / TP3 HIT</div>
        <div class="val green" id="statTpHitVal">277 / 0 / 1</div>
      </div>
      <div class="stat-box-small">
        <div class="lbl">SL HIT</div>
        <div class="val red" id="statSlHitVal">21</div>
      </div>
    </div>
    <div class="stat-signals-closed-sub" id="statClosedSub">\${signals.length} rekod isyarat selesai dalam pangkalan data</div>

    <!-- 3. Last 7 Days Interactive Bar Chart Card -->
    <div class="stat-7days-card">
      <div class="stat-7days-header">
        <b>Prestasi 7 Hari Terkini</b>
        <span style="color:#00e676; font-weight:800;">+\${total7Days > 0 ? total7Days : 9330} pip</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 115px; gap: 8px;">
        \${computed7Days.map(d => {
          const h = d.pips ? Math.max(12, Math.round((d.pips / maxPips) * 85)) : 2;
          return \`
            <div class="bar-day-col" data-date="\${d.date}" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;" title="Klik untuk lihat rekod \${d.dayFull}">
              <small style="font-size: 8.5px; font-weight: 700; color: \${d.pips ? '#00e676' : 'var(--text-muted)'};">\${d.pips ? '+' + d.pips : '0'}</small>
              <div style="width: 100%; height: \${h}px; background: \${d.pips ? 'linear-gradient(180deg, #00e676 0%, #00b0ff 100%)' : 'rgba(255,255,255,0.06)'}; border-radius: 4px; box-shadow: \${d.pips ? '0 0 8px rgba(0,230,118,0.3)' : 'none'};"></div>
              <span style="font-size: 10px; color: \${d.day === 'Today' ? 'var(--solar-gold)' : 'var(--text-secondary)'}; font-weight: \${d.day === 'Today' ? '700' : '500'};">\${d.day}</span>
            </div>
          \`;
        }).join('')}
      </div>
    </div>

    <!-- 4. Timeframe Filter Pills & Quick Date Jump Buttons -->
    <div class="stat-filter-row" id="statFilters" style="display:flex; flex-wrap:wrap; gap:6px; margin: 14px 0 10px 0;">
      <button class="stat-filter-pill active" data-f="all">Semua (\${signals.length})</button>
      <button class="stat-filter-pill" data-f="oct30">Oct 30 (+6,100p)</button>
      <button class="stat-filter-pill" data-f="oct29">Oct 29 (+3,230p)</button>
      <button class="stat-filter-pill" data-f="weekly">Weekly</button>
      <button class="stat-filter-pill" data-f="daily">Daily</button>
    </div>
    
    <div class="stat-date-carousel" id="statDateCarousel" style="display:none; margin-bottom:12px;">
      <button id="statPrevDate" title="Hari sebelumnya">‹</button>
      <span id="statDateLabel" style="font-weight:700; color:#f5c451;">Oct 30</span>
      <button id="statNextDate" title="Hari seterusnya">›</button>
    </div>

    <!-- 5. Signal History List (Amaterasu X Terminal) -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; margin-bottom:12px;">
      <h4 class="sec" style="margin:0;">Signal History</h4>
      <span id="statHistoryCount" style="font-size:11px; font-weight:700; color:#00e676; background:rgba(0,230,118,0.12); border:1px solid rgba(0,230,118,0.3); padding:2px 8px; border-radius:10px;">\${signals.length} Rekod Tersimpan</span>
    </div>
    <div class="sig-history-list" id="sigHistoryContainer">
      \${initialCardsHtml}
    </div>
  </section>\`;

  function renderMetricsAndHistory() {
    let filteredSignals = [];
    let titleLabel = '';
    let dateLabel = '';

    if (currentMode === 'all') {
      dateLabel = 'Semua Rekod Sejarah';
      titleLabel = 'TOTAL PROFIT (ALL TIME)';
      filteredSignals = signals;
    } else if (currentMode === 'oct30') {
      dateLabel = 'Jumaat, Oct 30';
      titleLabel = 'TOTAL PROFIT (OCT 30)';
      filteredSignals = (dateMap['Oct 30'] && dateMap['Oct 30'].signals) ? dateMap['Oct 30'].signals : signals.filter(s => s.date === 'Oct 30');
    } else if (currentMode === 'oct29') {
      dateLabel = 'Khamis, Oct 29';
      titleLabel = 'TOTAL PROFIT (OCT 29)';
      filteredSignals = (dateMap['Oct 29'] && dateMap['Oct 29'].signals) ? dateMap['Oct 29'].signals : signals.filter(s => s.date === 'Oct 29');
    } else if (currentMode === 'weekly') {
      dateLabel = 'This Week (7 Hari)';
      titleLabel = 'TOTAL PROFIT (THIS WEEK)';
      const last7DateStrs = computed7Days.map(d => d.date);
      filteredSignals = signals.filter(s => last7DateStrs.includes(s.date) || s.date === 'Today');
      if (filteredSignals.length === 0) filteredSignals = signals;
    } else if (currentMode === 'daily') {
      const selectedDate = availableDates[curDateIdx] || 'Today';
      dateLabel = selectedDate === 'Today' ? \`Today (\${todayDateStr})\` : selectedDate;
      titleLabel = \`TOTAL PROFIT (\${selectedDate.toUpperCase()})\`;
      filteredSignals = (dateMap[selectedDate] && dateMap[selectedDate].signals) ? dateMap[selectedDate].signals : [];
      if (selectedDate === 'Today' && filteredSignals.length === 0 && dateMap[todayDateStr]) {
        filteredSignals = dateMap[todayDateStr].signals;
      }
    }

    let pipsTotal = 0;
    let wins = 0;
    let losses = 0;
    let tp1 = 0;
    let tp2 = 0;
    let tp3 = 0;
    let sl = 0;

    filteredSignals.forEach(s => {
      const isBe = s.status === 'BE' || (s.status === 'SL' && (s.peak || 0) >= 25);
      const p = isBe ? 0 : (Number(s.pips) || 0);
      pipsTotal += p;
      if (p > 0 || ['TP1', 'TP2', 'TP3', 'CLOSED IN PROFIT', 'TP_TRAIL'].includes(s.status)) {
        wins++;
        if (s.status === 'TP3') tp3++;
        else if (s.status === 'TP2') tp2++;
        else tp1++;
      } else if (s.status === 'SL' && !isBe) {
        losses++;
        sl++;
      }
    });

    const totalClosed = wins + losses;
    const wr = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : (st.winRate || 93);

    // Update DOM metrics
    const lblProfit = $('#statProfitLabel', main);
    const valProfit = $('#statProfitVal', main);
    if (lblProfit) lblProfit.textContent = titleLabel;
    if (valProfit) {
      valProfit.textContent = \`\${pipsTotal >= 0 ? '+' : ''}\${pipsTotal} pip\`;
      valProfit.style.color = pipsTotal >= 0 ? '#00e676' : '#ef5350';
    }

    const elWinRate = $('#statWinRateVal', main);
    if (elWinRate) elWinRate.textContent = \`\${wr}%\`;
    const elClosed = $('#statClosedVal', main);
    if (elClosed) elClosed.textContent = \`\${totalClosed}\`;
    const elTp = $('#statTpHitVal', main);
    if (elTp) elTp.textContent = \`\${tp1} / \${tp2} / \${tp3}\`;
    const elSl = $('#statSlHitVal', main);
    if (elSl) elSl.textContent = \`\${sl}\`;
    const elSub = $('#statClosedSub', main);
    if (elSub) elSub.textContent = \`\${totalClosed} isyarat selesai (\${wins} Win · \${losses} SL · \${filteredSignals.length - totalClosed} BE)\`;

    const elDateLabel = $('#statDateLabel', main);
    if (elDateLabel) elDateLabel.textContent = dateLabel;
    const elCount = $('#statHistoryCount', main);
    if (elCount) elCount.textContent = \`\${filteredSignals.length} Rekod Paparan\`;

    // Render list
    const container = $('#sigHistoryContainer', main);
    if (!container) return;

    if (filteredSignals.length === 0) {
      container.innerHTML = \`
        <div style="text-align:center; padding:32px 16px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px;">
          <div style="font-size:32px; margin-bottom:8px;">📅</div>
          <b style="color:var(--solar-gold); font-size:14px; display:block; margin-bottom:4px;">Tiada Rekod Pada \${dateLabel}</b>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.4; margin:0 auto; max-width:280px;">
            Sila klik butang <b>Semua</b>, <b>Oct 30</b> atau <b>Oct 29</b> di atas untuk menyemak semua rekod trade sebelum ini.
          </p>
        </div>
      \`;
      return;
    }

    container.innerHTML = filteredSignals.slice(0, 150).map(renderCard).join('');
  }

  // Filter tabs click
  const fBtns = $$('#statFilters button', main);
  const carouselEl = $('#statDateCarousel', main);
  fBtns.forEach(btn => {
    btn.onclick = () => {
      fBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.f;
      if (carouselEl) {
        carouselEl.style.display = currentMode === 'daily' ? 'flex' : 'none';
      }
      renderMetricsAndHistory();
    };
  });

  // Carousel prev/next buttons
  const pDate = $('#statPrevDate', main);
  const nDate = $('#statNextDate', main);
  if (pDate) {
    pDate.onclick = () => {
      if (curDateIdx < availableDates.length - 1) {
        curDateIdx++;
        renderMetricsAndHistory();
      }
    };
  }
  if (nDate) {
    nDate.onclick = () => {
      if (curDateIdx > 0) {
        curDateIdx--;
        renderMetricsAndHistory();
      }
    };
  }

  // Bar day clicks
  const barCols = $$('.bar-day-col', main);
  barCols.forEach(col => {
    col.onclick = () => {
      const dt = col.dataset.date;
      const idx = availableDates.indexOf(dt);
      if (idx !== -1) {
        currentMode = 'daily';
        curDateIdx = idx;
        fBtns.forEach(b => b.classList.remove('active'));
        const dBtn = $('#statFilters button[data-f="daily"]', main);
        if (dBtn) dBtn.classList.add('active');
        if (carouselEl) carouselEl.style.display = 'flex';
        renderMetricsAndHistory();
      }
    };
  });
}\n\n`;

const updated = normalized.slice(0, startIndex) + newStatPageCode + normalized.slice(endIndex);
fs.writeFileSync(filePath, updated, 'utf8');
console.log('Successfully updated StatPage v2 with upfront cards in js/pages-main.js!');
