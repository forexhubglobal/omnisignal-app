// ===== Amaterasu AI Command Center (CRM) Engine =====

let state = {
  stats: {},
  activeSignal: {},
  signals: [],
  analysis: {},
  screener: [],
  classes: [],
  contests: [],
  users: [],
  feedbacks: []
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function toast(msg) {
  const el = $('#crmToast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

const num = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// Live Clock
function startClock() {
  const el = $('#liveClock');
  if (!el) return;
  setInterval(() => {
    const d = new Date();
    el.textContent = d.toLocaleTimeString('en-US', { hour12: false }) + ' MYT';
  }, 1000);
}

// Tab Switching
$$('.nav-item').forEach(btn => {
  btn.onclick = () => {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    $$('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    const pane = $(`#tab-${tabId}`);
    if (pane) pane.classList.add('active');
    $('#pageTitle').textContent = btn.textContent.trim().replace(/LIVE|\d+/g, '');
  };
});

$('#quickSignalBtn').onclick = () => {
  const btn = $('[data-tab="signals"]');
  if (btn) btn.click();
};

// Activity Feed Logger
function logActivity(text) {
  const feed = $('#activityFeed');
  if (!feed) return;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `<span class="time">${time}</span><span class="txt">${text}</span>`;
  feed.prepend(item);
}

// Fetch Full Initial State
async function loadData() {
  try {
    const res = await fetch('/api/data');
    state = await res.json();
    renderAll();
    logActivity('Amaterasu Command Center synchronized with MT5 database.');
  } catch (e) {
    console.error('Failed to load data', e);
  }
}

// SSE Live Sync
function initSSE() {
  if (typeof EventSource === 'undefined') return;
  try {
    const es = new EventSource('/api/events');
    es.addEventListener('initial_sync', e => {
      state = JSON.parse(e.data);
      renderAll();
    });
    es.addEventListener('signal_fired', e => {
      state.activeSignal = JSON.parse(e.data);
      renderDashboard();
      renderSignals();
      logActivity(`⚡ Signal Broadcast: ${state.activeSignal.type} ${state.activeSignal.symbol} @ ${state.activeSignal.entry}`);
      toast('Signal broadcasted live to all nodes!');
    });
    es.addEventListener('signal_resolved', e => {
      const d = JSON.parse(e.data);
      state.activeSignal = d.activeSignal;
      state.stats = d.stats;
      state.signals.unshift(d.item);
      renderDashboard();
      renderSignals();
      logActivity(`🎯 Signal Trigger: ${d.item.status} (${d.item.pips > 0 ? '+' : ''}${d.item.pips} pips)`);
      toast(`Signal Resolved: ${d.item.status}`);
    });
    es.addEventListener('feedback_received', e => {
      const fb = JSON.parse(e.data);
      state.feedbacks.unshift(fb);
      renderFeedbacks();
      logActivity(`💬 New Transmission from Operator ${fb.user}`);
      toast(`New incoming transmission from ${fb.user}!`);
    });
    es.addEventListener('class_updated', e => {
      const item = JSON.parse(e.data);
      const idx = state.classes.findIndex(c => c.id === item.id);
      if (idx !== -1) state.classes[idx] = item;
      renderClasses();
      logActivity(`🎓 Class updated: ${item.title} (${item.attendees} registered)`);
    });
    es.addEventListener('ai_engine_log', e => {
      const d = JSON.parse(e.data);
      const logBox = $('#aiTerminalLog');
      if (logBox) {
        logBox.insertAdjacentHTML('afterbegin', `<div style="padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.03);">${esc(d.log)}</div>`);
      }
    });
    es.addEventListener('ai_engine_status', e => {
      const d = JSON.parse(e.data);
      const badge = $('#aiEngineBadge');
      const btn = $('#btnToggleAi');
      if (badge) {
        badge.textContent = d.enabled ? '● AUTONOMOUS AI ACTIVE' : '⏸ AI ENGINE PAUSED';
        badge.className = d.enabled ? 'badge-live' : 'badge next';
      }
      if (btn) btn.textContent = d.enabled ? '⏸ Pause AI Engine' : '▶ Resume AI Engine';
    });
  } catch (err) {
    console.warn('SSE failed in CRM', err);
  }
}

function renderAll() {
  renderDashboard();
  renderSignals();
  renderAnalysis();
  renderScreener();
  renderClasses();
  renderFeedbacks();
  renderContest();
  renderUsers();
}

// 1. Dashboard
function renderDashboard() {
  $('#mWinRate').textContent = (state.stats.winRate || 93) + '%';
  $('#mPips').textContent = (state.stats.totalProfitToday > 0 ? '+' : '') + (state.stats.totalProfitToday || 979);
  $('#mTotalSignals').textContent = state.stats.totalSignals || 17;
  $('#mHits').textContent = `${state.stats.tp1Hit || 13} TP1 · ${state.stats.tp2Hit || 7} TP2 · ${state.stats.slHit || 1} SL`;
  $('#mOnlineUsers').textContent = (state.users || []).filter(u => u.status === 'online').length || 24;

  const sig = state.activeSignal || {};
  const isWait = sig.status === 'WAITING';
  $('#activeStatusPill').textContent = sig.status || 'WAITING';

  const details = $('#activeSignalDetails');
  if (isWait) {
    details.innerHTML = `
      <div style="text-align:center; padding:24px 0;">
        <div style="font-size:32px; margin-bottom:8px;">📡</div>
        <b style="color:var(--solar-gold); font-size:16px;">Solar Corona Scanner Active</b>
        <p class="muted" style="margin-top:6px; font-size:13px;">${sig.notes || 'Scanning order book clusters for next setup.'}</p>
      </div>
    `;
  } else {
    details.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div>
          <span style="font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800; color:${sig.type === 'BUY' ? 'var(--bull)' : 'var(--bear)'};">
            ● ${sig.type} ${sig.symbol}
          </span>
          <span class="muted" style="font-size:12px; margin-left:8px;">Fired: ${sig.firedAt || 'Just now'}</span>
        </div>
        <span class="badge-live">LIVE ON APP</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; text-align:center;">
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">ENTRY</span>
          <b style="font-size:15px; color:var(--solar-gold);">${num(sig.entry)}</b>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">TARGET 1</span>
          <b style="font-size:15px; color:var(--bull);">${num(sig.tp1)}</b>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">TARGET 2</span>
          <b style="font-size:15px; color:var(--bull);">${num(sig.tp2)}</b>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">STOP LOSS</span>
          <b style="font-size:15px; color:var(--bear);">${num(sig.sl)}</b>
        </div>
      </div>
    `;
  }
}

// 2. Signals
const DEFAULT_PRICES = {
  XAUUSD: { entry: 4024.50, tp1: 4028.50, tp2: 4034.00, sl: 4019.50, step: '0.01' },
  EURUSD: { entry: 1.08500, tp1: 1.08900, tp2: 1.09350, sl: 1.08100, step: '0.00001' },
  GBPJPY: { entry: 209.65, tp1: 210.25, tp2: 210.95, sl: 209.15, step: '0.01' },
  GBPUSD: { entry: 1.29800, tp1: 1.30300, tp2: 1.30850, sl: 1.29300, step: '0.00001' },
  USDJPY: { entry: 156.10, tp1: 155.45, tp2: 154.80, sl: 156.70, step: '0.01' },
  WTI: { entry: 71.50, tp1: 72.40, tp2: 73.20, sl: 70.60, step: '0.01' },
  US30: { entry: 42850, tp1: 43050, tp2: 43280, sl: 42650, step: '1' },
  NAS100: { entry: 20380, tp1: 20520, tp2: 20680, sl: 20240, step: '1' },
  BTCUSD: { entry: 81700, tp1: 82500, tp2: 83400, sl: 80900, step: '1' }
};

const sigSymbolSelect = $('#sigSymbol');
if (sigSymbolSelect) {
  sigSymbolSelect.onchange = () => {
    const p = DEFAULT_PRICES[sigSymbolSelect.value];
    if (p) {
      $('#sigEntry').value = p.entry;
      $('#sigEntry').step = p.step;
      $('#sigTP1').value = p.tp1;
      $('#sigTP1').step = p.step;
      $('#sigTP2').value = p.tp2;
      $('#sigTP2').step = p.step;
      $('#sigSL').value = p.sl;
      $('#sigSL').step = p.step;
    }
  };
}

const btnForce = $('#btnForceAiScan');
if (btnForce) {
  btnForce.onclick = async () => {
    btnForce.disabled = true;
    btnForce.textContent = '⚡ AI Confluence Scan in Progress...';
    try {
      const res = await fetch('/api/ai/scan-now', { method: 'POST' });
      const d = await res.json();
      if (d.success) toast(`⚡ AI Engine executed autonomous ${d.signal.type} ${d.signal.symbol} setup!`);
    } catch(err) {
      toast('AI Scan command dispatched');
    }
    setTimeout(() => {
      btnForce.disabled = false;
      btnForce.textContent = '⚡ Trigger Immediate AI Scan';
    }, 2500);
  };
}

const btnToggle = $('#btnToggleAi');
if (btnToggle) {
  btnToggle.onclick = async () => {
    try {
      const res = await fetch('/api/ai/toggle', { method: 'POST' });
      const d = await res.json();
      toast(d.enabled ? 'Amaterasu AI Autonomous Engine Resumed' : 'Amaterasu AI Engine Paused');
    } catch(err) {}
  };
}

function renderSignals() {
  const box = $('#resolutionBox');
  const sig = state.activeSignal || {};
  const isWait = sig.status === 'WAITING';

  if (isWait) {
    box.innerHTML = `
      <div style="text-align:center; padding:16px 0; color:var(--text-muted);">
        No active signal currently live. Use the Dispatcher on the left to fire a setup.
      </div>
    `;
  } else {
    const isTp1 = sig.status === 'TP1_HIT';
    box.innerHTML = `
      <div style="background:${isTp1 ? 'rgba(0,230,118,0.09)' : 'rgba(255,109,0,0.08)'}; border:1px solid ${isTp1 ? '#00e676' : 'rgba(255,109,0,0.3)'}; padding:14px; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <b style="font-size:15px; color:#fff;">Active: ${sig.type} ${sig.symbol} @ ${num(sig.entry)} ${isTp1 ? '<span style="color:#00e676; margin-left:6px;">(🎯 TP1 HIT · BE LOCKED)</span>' : ''}</b>
          <span class="badge-live">${isTp1 ? 'TP1 SECURED' : 'BROADCASTED'}</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); margin-bottom:14px;">
          ${isTp1 ? 'Trade kini dalam status Sifar Risiko (BE). Klik bila sasaran TP2 tercapai atau trade ditutup:' : 'Trigger instant outcome notification across all devices:'}
        </p>
        <div class="resolution-actions">
          ${!isTp1 ? '<button class="btn btn-success" data-act="TP1">🎯 Hit TP1 (+40p)</button>' : ''}
          <button class="btn btn-success" data-act="TP2">🎯 Hit TP2 (+95p)</button>
          <button class="btn btn-danger" data-act="SL">🛑 Hit SL (-50p)</button>
          <button class="btn btn-ghost" data-act="CLOSED">Manual Close</button>
        </div>
      </div>
    `;

    $$('.resolution-actions button', box).forEach(b => {
      b.onclick = async () => {
        const act = b.dataset.act;
        let pips = 0;
        if (act === 'TP1') pips = 40;
        else if (act === 'TP2') pips = 95;
        else if (act === 'SL') pips = -50;
        else pips = prompt('Enter realized pips:', '35') || 35;

        try {
          const res = await fetch('/api/signal/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: act, pips: Number(pips) })
          });
          const d = await res.json();
          if (d.success) {
            if (act === 'TP1') {
              state.activeSignal = d.activeSignal || { ...sig, status: 'TP1_HIT', beLocked: true };
              toast(`🎯 Target 1 Disahkan (+${pips}p)! SL dikunci ke Breakeven pada semua peranti client!`);
            } else {
              state.activeSignal = { status: 'WAITING' };
              toast(`Signal selesai sebagai ${act}!`);
            }
            loadData();
          }
        } catch (err) {
          alert('Failed to resolve signal');
        }
      };
    });
  }

  // History table
  const tbody = $('#signalsHistoryTable tbody');
  tbody.innerHTML = (state.signals || []).slice(0, 8).map(s => `
    <tr>
      <td>${s.time}</td>
      <td><span style="color:${s.type === 'BUY' ? 'var(--bull)' : 'var(--bear)'}; font-weight:700;">${s.type}</span></td>
      <td>${num(s.entry)}</td>
      <td><span class="badge-live">${s.status}</span></td>
      <td style="color:${s.pips > 0 ? 'var(--bull)' : 'var(--bear)'}; font-weight:700;">${s.pips > 0 ? '+' : ''}${s.pips}</td>
    </tr>
  `).join('');
}

// 3. Analysis CMS
function renderAnalysis() {
  const ana = state.analysis || {};
  $('#anaHeadline').value = ana.headline || '';
  if (ana.trends) {
    $('#anaM1').value = ana.trends.m1 || 'BEARISH';
    $('#anaM5').value = ana.trends.m5 || 'BEARISH';
    $('#anaH1').value = ana.trends.h1 || 'BEARISH';
    $('#anaD1').value = ana.trends.d1 || 'BULLISH';
  }
  $('#anaRes').value = (ana.resistance || []).join(', ');
  $('#anaSup').value = (ana.support || []).join(', ');
  $('#anaDriving').value = (ana.driving || []).join('\n');
  $('#anaRisk').value = ana.risk || '';
  $('#anaTakeaway').value = ana.takeaway || '';
}

$('#analysisForm').onsubmit = async e => {
  e.preventDefault();
  const payload = {
    headline: $('#anaHeadline').value.trim(),
    trends: {
      m1: $('#anaM1').value,
      m5: $('#anaM5').value,
      h1: $('#anaH1').value,
      d1: $('#anaD1').value
    },
    resistance: $('#anaRes').value.split(',').map(s => s.trim()).filter(Boolean),
    support: $('#anaSup').value.split(',').map(s => s.trim()).filter(Boolean),
    driving: $('#anaDriving').value.split('\n').map(s => s.trim()).filter(Boolean),
    risk: $('#anaRisk').value.trim(),
    takeaway: $('#anaTakeaway').value.trim()
  };

  try {
    const res = await fetch('/api/analysis/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) toast('Analysis report published to trader app!');
  } catch (err) {
    alert('Failed to publish analysis');
  }
};

// 4. Screener
function renderScreener() {
  const tbody = $('#screenerTable tbody');
  tbody.innerHTML = (state.screener || []).map(p => `
    <tr>
      <td><b style="color:#fff;">${p.symbol}</b></td>
      <td><input type="text" value="${p.price}" style="width:110px;" data-sym="${p.symbol}" data-field="price"></td>
      <td>
        <select style="width:120px;" data-sym="${p.symbol}" data-field="trend">
          <option value="BULLISH" ${p.trend === 'BULLISH' ? 'selected' : ''}>BULLISH</option>
          <option value="BEARISH" ${p.trend === 'BEARISH' ? 'selected' : ''}>BEARISH</option>
          <option value="NEUTRAL" ${p.trend === 'NEUTRAL' ? 'selected' : ''}>NEUTRAL</option>
        </select>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="range" min="-100" max="100" value="${p.strengthVal}" data-sym="${p.symbol}" data-field="strengthVal" style="width:140px;">
          <b style="width:40px; text-align:right;">${p.strengthVal}</b>
        </div>
      </td>
      <td><button class="btn btn-primary" data-save-scr="${p.symbol}" style="padding:4px 10px; font-size:11px;">Update</button></td>
    </tr>
  `).join('');

  $$('[data-save-scr]', tbody).forEach(btn => {
    btn.onclick = async () => {
      const sym = btn.dataset.saveScr;
      const row = btn.closest('tr');
      const price = row.querySelector('[data-field="price"]').value;
      const trend = row.querySelector('[data-field="trend"]').value;
      const strengthVal = Number(row.querySelector('[data-field="strengthVal"]').value);

      try {
        await fetch('/api/screener/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: sym, price, trend, strengthVal })
        });
        toast(`${sym} updated on Heat Matrix!`);
      } catch (err) {
        alert('Update failed');
      }
    };
  });
}

// 5. Classes
function renderClasses() {
  const tbody = $('#classesTable tbody');
  tbody.innerHTML = (state.classes || []).map(c => `
    <tr>
      <td><b style="color:#fff;">${c.title}</b></td>
      <td>${c.date} ${c.timeMYT || ''}</td>
      <td>${c.trainer}</td>
      <td><span class="badge-live">${c.attendees || 0} registered</span></td>
    </tr>
  `).join('');
}

$('#createClassForm').onsubmit = async e => {
  e.preventDefault();
  const payload = {
    title: $('#clsTitle').value.trim(),
    trainer: $('#clsTrainer').value.trim(),
    date: $('#clsDate').value,
    timeMYT: $('#clsTime').value.trim(),
    duration: $('#clsDuration').value.trim()
  };

  try {
    const res = await fetch('/api/classes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
      state.classes.unshift(d.class);
      renderClasses();
      toast('Masterclass scheduled and broadcasted!');
      $('#createClassForm').reset();
    }
  } catch (err) {
    alert('Failed to schedule class');
  }
};

// 6. Direct Transmissions (Feedback)
function renderFeedbacks() {
  const list = state.feedbacks || [];
  $('#fbCount').textContent = list.filter(f => f.status === 'pending').length;
  const container = $('#feedbacksList');

  if (!list.length) {
    container.innerHTML = '<p class="muted">No incoming transmissions yet.</p>';
    return;
  }

  container.innerHTML = list.map(f => `
    <div class="fb-card ${f.status}">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <b style="color:var(--solar-gold); font-size:13.5px;">Operator: ${esc(f.user)}</b>
        <span class="muted" style="font-size:11px;">${f.createdAt}</span>
      </div>
      <p style="font-size:13px; color:#fff; line-height:1.45; margin-bottom:8px;">"${esc(f.message)}"</p>
      ${f.reply ? `
        <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; font-size:12px; color:var(--bull);">
          <b>Amaterasu Response:</b> ${esc(f.reply)}
        </div>
      ` : `
        <div class="fb-reply-box">
          <input type="text" placeholder="Type transmission to operator…" id="rep-${f.id}">
          <button class="btn btn-primary" data-rep="${f.id}" style="white-space:nowrap;">Send Reply</button>
        </div>
      `}
    </div>
  `).join('');

  $$('[data-rep]', container).forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.rep;
      const inp = $(`#rep-${id}`);
      const reply = inp.value.trim();
      if (!reply) return;

      try {
        await fetch('/api/feedback/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, reply })
        });
        toast('Reply sent directly to trader screen!');
        loadData();
      } catch (err) {
        alert('Failed to send reply');
      }
    };
  });
}

// 7. Contest Desk
function renderContest() {
  const ct = (state.contests && state.contests[0]) || {};
  const view = $('#contestAdminView');
  view.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div style="background:rgba(0,0,0,0.3); padding:16px; border-radius:8px;">
        <span class="label">Tournament Status</span>
        <div style="font-size:24px; font-weight:800; color:${ct.status === 'active' ? 'var(--bull)' : 'var(--bear)'};">
          ${(ct.status || 'ACTIVE').toUpperCase()}
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.3); padding:16px; border-radius:8px;">
        <span class="label">Prize Pool</span>
        <div style="font-size:24px; font-weight:800; color:var(--solar-gold);">${ct.prizePool || '$25,000 USD'}</div>
      </div>
    </div>
  `;
}

$('#toggleContestBtn').onclick = async () => {
  try {
    const res = await fetch('/api/contest/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const d = await res.json();
    if (d.success) {
      state.contests[0] = d.contest;
      renderContest();
      toast(`Tournament status updated: ${d.contest.status}`);
    }
  } catch (err) {
    alert('Failed to toggle tournament');
  }
};

// 8. Users Table
function renderUsers() {
  const tbody = $('#usersTable tbody');
  tbody.innerHTML = (state.users || []).map(u => `
    <tr>
      <td><b style="color:#fff;">${u.username}</b> (${u.displayName})</td>
      <td><span class="dot-online"></span> ${u.status}</td>
      <td>${u.devices} / ${u.maxDevices} active</td>
      <td>${u.joined}</td>
      <td style="color:var(--bull); font-weight:700;">+${u.pnlTotal} pips</td>
    </tr>
  `).join('');
}

// Boot
startClock();
loadData();
initSSE();
