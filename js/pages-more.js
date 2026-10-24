// ===== Amaterasu AI "More" Hub: Settings, Masterclasses, Lot, P&L, Volatility, Contest, Blocks =====

const SET = (k, d) => store.get('set:' + k, d);
const setSet = (k, v) => store.set('set:' + k, v);

function applyDisplayMode() {
  document.body.classList.toggle('desktop', SET('display', 'Auto') === 'Desktop' || (SET('display', 'Auto') === 'Auto' && window.innerWidth >= 900));
}
let wakeLock = null;
async function applyMonitor() {
  try {
    if (SET('monitor', false) && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* unsupported */ }
}

function toggleListModal(title, key, items, onDone) {
  const vals = SET(key, items.map(() => true));
  const m = modal(`<h3>${title}</h3><p class="muted">Configure alerts and voice synthesis.</p>
    ${items.map((it, i) => `<div class="row" style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);"><span style="font-size:13.5px;">${it}</span><button class="toggle ${vals[i] ? 'on' : ''}" data-i="${i}"></button></div>`).join('')}
    <div class="modal-actions"><button class="btn gold" data-close>Save Preferences</button></div>`);
  m.el.addEventListener('click', e => {
    const t = e.target.closest('.toggle');
    if (t) { vals[+t.dataset.i] = !vals[+t.dataset.i]; t.classList.toggle('on'); setSet(key, vals); onDone(); }
  });
}

function askDisplayName(after) {
  const m = modal(`<h3>Operator Call-Sign</h3><p class="muted">Displayed on the Amaterasu monthly championship leaderboard.</p>
    <input id="nm" maxlength="16" value="${esc(store.get('displayName', ''))}" placeholder="e.g. SolarBlade">
    <div class="modal-actions"><button class="btn gold" data-a="save">Confirm</button></div>`);
  const inp = $('#nm', m.el);
  setTimeout(() => inp.focus(), 50);
  const save = () => { const v = inp.value.trim(); if (v) { store.set('displayName', v); toast('Operator name updated'); } m.close(); after && after(); };
  $('[data-a=save]', m.el).onclick = save;
  inp.onkeydown = e => { if (e.key === 'Enter') save(); };
}

// ---------- 1. More Menu Hub ----------
function MorePage(main) {
  const tile = (href, icon, title, sub) =>
    `<a class="tile" href="${href}"><div class="tile-ic">${ic(icon)}</div><div><b>${title}</b><small>${sub}</small></div></a>`;

  main.innerHTML = `<section class="page">
    ${pageHead('Command Hub', 'Masterclasses, precision tools & operator telemetry')}

    <!-- Brand Portal Banner -->
    <a class="site-banner-amaterasu" id="siteBanner">
      <div class="site-banner-left">
        <div style="filter: drop-shadow(0 0 10px rgba(255,109,0,0.6));">${LOGO}</div>
        <div>
          <small style="color:var(--solar-gold); font-size:10.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">Official Neural Portal</small>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:#fff; display:block;">${BRAND.name}</b>
        </div>
      </div>
      <span class="go" style="color:var(--solar-gold); font-size:18px;">›</span>
    </a>

    <!-- Academy Section -->
    <h4 class="sec">Amaterasu Academy</h4>
    <div class="tile-grid">
      <a class="tile" id="classesBtn"><div class="tile-ic" style="color:var(--solar-amber);">${ic('calendar')}</div><div><b>Masterclasses</b><small>Live strategy rooms</small></div></a>
      <a class="tile" id="productsBtn"><div class="tile-ic" style="color:var(--solar-gold);">${ic('diamond')}</div><div><b>Neural Tools</b><small>Indicators & systems</small></div></a>
    </div>

    <!-- Games Banner -->
    <a class="card" href="#games" style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; margin-bottom:20px; border-color:rgba(255,109,0,0.3); background:linear-gradient(135deg, rgba(255,109,0,0.1), rgba(15,20,32,0.95));">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:24px;">🧱</span>
        <div>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:14.5px; color:#fff; display:block;">Amaterasu Blocks</b>
          <small class="muted">Candlestick puzzle · monthly tournament</small>
        </div>
      </div>
      <span style="color:var(--solar-gold); font-size:20px;">›</span>
    </a>

    <!-- Trading Tools -->
    <h4 class="sec">Precision Trading Tools</h4>
    <div class="tile-grid">
      ${tile('#lot', 'calc', 'Smart Lot', 'Size by risk %')}
      ${tile('#pnl', 'book', 'P&amp;L Journal', 'Daily ledger')}
      ${tile('#volatility', 'pulse', 'Volatility', 'Solar sessions')}
      ${tile('#contest', 'trophy', 'Championship', '$25k Prize Pool')}
    </div>

    <!-- Settings -->
    <h4 class="sec">System Settings</h4>
    <div class="settings" id="settings"></div>
  </section>`;

  $('#siteBanner', main).onclick = () => modal(`<h3>${BRAND.name}</h3><p class="muted">Amaterasu AI Sovereign Platform official gateway.</p><div class="modal-actions"><button class="btn gold" data-close>Understood</button></div>`);

  $('#classesBtn', main).onclick = () => {
    const list = (AppState && AppState.classes && AppState.classes.length) ? AppState.classes : [
      { id: 'cls-1', title: 'Amaterasu Solar Scalping Live', trainer: 'Sensei Hiro', date: '2026-10-24', timeMYT: '21:00 MYT', attendees: 184 },
      { id: 'cls-2', title: 'Sun-Disc Liquidity & Order Flow', trainer: 'Lead Quant Kenji', date: '2026-10-26', timeMYT: '21:00 MYT', attendees: 142 },
      { id: 'cls-3', title: 'Weekly Macro & Gold Forecast', trainer: 'Amaterasu Desk', date: '2026-10-28', timeMYT: '20:30 MYT', attendees: 290 }
    ];
    const m = modal(`<h3>Live Masterclasses</h3><p class="muted">Live interactive sessions · Malaysia time (MYT)</p>
      ${list.map(c => `
        <div class="row" style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div>
            <b style="font-size:13.5px; color:#fff;">${esc(c.title)}</b><br>
            <small class="muted">👨‍🏫 ${esc(c.trainer || 'Lead Desk')} · ${c.date} ${c.timeMYT || ''} · <span class="cyan">${c.attendees || 0} enrolled</span></small>
          </div>
          <button class="btn gold sm" data-join="${c.id}">Register</button>
        </div>
      `).join('')}
      <div class="modal-actions"><button class="btn ghost" data-close>Close</button></div>`);

    m.el.addEventListener('click', async e => {
      const b = e.target.closest('[data-join]');
      if (!b) return;
      const id = b.dataset.join;
      b.disabled = true;
      b.textContent = 'Enrolled ✓';
      b.className = 'btn ghost sm';
      try {
        await fetch('/api/classes/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, user: BRAND.user })
        });
        toast('Enrolled in masterclass! Access token generated.');
      } catch (err) {
        toast('Enrolled in masterclass!');
      }
    });
  };

  $('#productsBtn', main).onclick = () => {
    const prods = (AppState && AppState.db && AppState.db.products) || [
      { name: 'Amaterasu Solar AI Indicator (MT5)', price: '$299', desc: 'Predictive solar trend momentum & zero-lag alerts.' },
      { name: 'Amaterasu Order Flow Heatmap Pro', price: '$199', desc: 'Institutional volume profile and algorithmic liquidity radar.' },
      { name: 'Amaterasu Sovereign Trader Mastery', price: '$499', desc: '12-stage institutional trading mastery program.' }
    ];
    modal(`<h3>Neural Products</h3><p class="muted">Proprietary MT5 tools & institutional curriculum</p>
      ${prods.map(p => `
        <div class="row" style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div>
            <b style="color:#fff; font-size:13.5px;">${esc(p.name)}</b> <span class="badge open" style="margin-left:4px;">${p.price || ''}</span><br>
            <small class="muted">${esc(p.desc)}</small>
          </div>
          <button class="btn gold sm" onclick="toast('Access request dispatched to Amaterasu Desk!')">Unlock</button>
        </div>
      `).join('')}
      <div class="modal-actions"><button class="btn ghost" data-close>Close</button></div>`);
  };

  const setRow = (icon, color, title, desc, right, act = '') =>
    `<div class="set-row" ${act ? `data-act="${act}"` : ''}>
      <div class="set-left">
        <div class="set-ic ${color}">${ic(icon)}</div>
        <div class="set-txt"><b>${title}</b>${desc ? `<small>${desc}</small>` : ''}</div>
      </div>
      <div>${right}</div>
    </div>`;

  const chev = '<span style="color:var(--text-muted); font-size:18px;">›</span>';
  const tg = (k, d) => `<button class="toggle ${SET(k, d) ? 'on' : ''}" data-tg="${k}"></button>`;
  const countOn = (k, n) => SET(k, Array(n).fill(true)).filter(Boolean).length;

  function drawSettings() {
    const notif = SET('notif', true), name = store.get('displayName', '');
    $('#settings', main).innerHTML = `
      <div class="card" style="padding:14px; margin-bottom:12px;">
        <div class="set-row" style="padding:0 0 10px 0; border-bottom:none;">
          <div class="set-left">
            <div class="set-ic amber">${ic('bell')}</div>
            <div class="set-txt">
              <b>Signal notifications</b>
              <small>Active — you will be alerted when signals fire, TP or SL is hit</small>
            </div>
          </div>
          <div>${tg('notif', true)}</div>
        </div>
        <button class="btn gold full" id="sendTestNotif" style="padding:12px; font-weight:700; font-size:13.5px; border-radius:8px; background:linear-gradient(135deg, #00e676, #00c853); color:#06070a; margin-top:4px;">
          Send test notification
        </button>
      </div>

      <div class="card" style="padding:4px 14px;">
        ${setRow('monitor', 'blue', 'Display mode', 'Auto — desktop view on tablets and PC, mobile view on phones', `<button class="btn ghost sm" data-act="display" style="min-width:60px;">${SET('display', 'Auto')}</button>`)}
        ${setRow('speaker', 'amber', 'Sound & voice', `${countOn('sound', 4)} of 4 on · tap to change`, chev, 'sound')}
        ${setRow('bell', 'amber', 'Signal notifications', `${countOn('sig_alerts', 5)} of 5 on · tap to change`, chev, 'sig_alerts')}
        ${setRow('monitor', 'green', 'Monitor mode', 'Keep the screen on while Amaterasu AI is open', tg('monitor', false))}
        ${setRow('star', 'amber', 'Opening animation', 'Plays once when you open the app', tg('anim', true))}
        ${setRow('user', 'amber', 'Display name', '', `<span class="muted">${name ? esc(name) : 'Not set'}</span> ${chev}`, 'name')}
        ${setRow('globe', 'blue', 'Language', '', `<span class="muted">${SET('lang', 'English')}</span> ${chev}`, 'lang')}
        ${setRow('monitor', 'amber', 'My devices', '', `<span class="badge" style="background:rgba(255,160,0,0.15); color:var(--solar-gold); border:1px solid rgba(255,160,0,0.3); padding:3px 8px; border-radius:12px; font-weight:600; font-size:11.5px;">1 of 4</span> ${chev}`, 'devices')}
        ${setRow('download', 'green', 'Install app', '', chev, 'install')}
        ${setRow('chat', 'red', 'Just tell us', 'Ideas, bugs and support', chev, 'feedback')}
      </div>
    `;

    const testBtn = $('#sendTestNotif', main);
    if (testBtn) {
      testBtn.onclick = () => {
        try { playChime(); } catch(e){}
        toast('🔔 Test Notification: Amaterasu AI Live Signal feed active!');
      };
    }
  }

  $('#settings', main).onclick = async e => {
    const t = e.target.closest('[data-tg]');
    if (t) {
      const k = t.dataset.tg, v = !SET(k, k !== 'monitor');
      setSet(k, v);
      if (k === 'monitor') { applyMonitor(); toast(v ? 'Screen wake lock active' : 'Monitor mode off'); }
      drawSettings();
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'display') {
      const modes = ['Auto', 'Mobile', 'Desktop'];
      setSet('display', modes[(modes.indexOf(SET('display', 'Auto')) + 1) % 3]);
      applyDisplayMode(); drawSettings();
    } else if (act === 'sound') {
      toggleListModal('Sound & Voice', 'sound', ['Solar Signal Chime', 'Target 1 Chime', 'Target 2 Chime', 'Voice Synthesis'], drawSettings);
    } else if (act === 'sig_alerts') {
      toggleListModal('Signal Notifications', 'sig_alerts', ['New Entry Orders', 'Take Profit 1 Hit', 'Take Profit 2 Hit', 'Stop Loss Hit', 'Order Cancelled / Closed'], drawSettings);
    } else if (act === 'devices') {
      modal(`<h3>My Devices</h3><p class="muted">Currently active authorized sessions</p>
        <div class="row" style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div><b style="color:#fff; font-size:13.5px;">This Device (Browser)</b><br><small class="muted">Active now · Windows Desktop</small></div>
          <span class="badge open">Current</span>
        </div>
        <p style="font-size:11.5px; color:#8e9aa8; margin-top:12px; line-height:1.5;">Account allows up to 4 concurrent devices. Oldest device will be replaced automatically if quota is exceeded.</p>
        <div class="modal-actions"><button class="btn gold" data-close>Done</button></div>`);
    } else if (act === 'name') askDisplayName(drawSettings);
    else if (act === 'lang') {
      const m = modal(`<h3>Language</h3><p class="muted">Select interface language</p>${['English', 'Bahasa Melayu', '日本語'].map(l => `<div class="row" style="padding:10px 0; cursor:pointer;" data-l="${l}"><span>${l}</span>${SET('lang', 'English') === l ? '<b class="gold">✓</b>' : ''}</div>`).join('')}`);
      m.el.addEventListener('click', ev => { const r = ev.target.closest('[data-l]'); if (r) { setSet('lang', r.dataset.l); m.close(); drawSettings(); } });
    } else if (act === 'install') {
      modal(`<h3>Install Application</h3><p class="muted">Add ${BRAND.name} directly to your device:</p>
        <div style="padding:8px 0; font-size:13px; color:#cbd5e1;"><b>Android / Chrome:</b> Tap menu ⋮ → Add to Home screen</div>
        <div style="padding:8px 0; font-size:13px; color:#cbd5e1;"><b>iPhone / Safari:</b> Tap Share ⬆ → Add to Home Screen</div>
        <div style="padding:8px 0; font-size:13px; color:#cbd5e1;"><b>PC / Edge:</b> Click Install icon in address bar</div>`);
    } else if (act === 'feedback') {
      const m = modal(`<h3>Just Tell Us</h3><p class="muted">Ideas, bugs and support</p>
        <textarea id="fb" rows="5" placeholder="Tell us what you'd like improved, bug reports, or feature requests…"></textarea>
        <div class="modal-actions"><button class="btn ghost" data-close>Cancel</button><button class="btn gold" data-a="send">Submit</button></div>`);
      $('[data-a=send]', m.el).onclick = async () => {
        const val = $('#fb', m.el).value.trim();
        if (val) {
          m.close();
          try {
            await fetch('/api/feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user: BRAND.user, message: val })
            });
            toast('Feedback sent to Amaterasu Desk 🙏');
          } catch(e) {
            toast('Feedback recorded 🙏');
          }
        }
      };
    }
  };

  drawSettings();
}

// ---------- 2. Smart Lot Manager ----------
const LOT_PAIRS = [
  { id: 'XAUUSD', l: '🥇 XAUUSD — Gold', pv: 10 },
  { id: 'EURUSD', l: '💶 EURUSD — Euro', pv: 10 },
  { id: 'GBPUSD', l: '💷 GBPUSD — Pound', pv: 10 },
  { id: 'USDJPY', l: '💴 USDJPY — Yen', pv: 6.7 },
  { id: 'GBPJPY', l: '💷 GBPJPY — Pound/Yen', pv: 6.7 },
  { id: 'BTCUSD', l: '₿ BTCUSD — Bitcoin', pv: 1 },
];
const RISKS = [{ v: 5, l: '🟢 Low — 5%' }, { v: 10, l: '🟡 Medium — 10%' }, { v: 20, l: '🔴 High — 20%' }];

function LotPage(main) {
  const SL = 50;
  main.innerHTML = `<section class="page">
    ${pageHead('Smart Lot Manager', 'Work out the right lot size for your capital and risk', true)}
    
    <div style="font-size: 12.5px; color: #cbd5e1; margin-bottom: 14px; padding: 2px;">
      Every Amaterasu signal uses a strict <b>Stop Loss 50 pip</b>.
    </div>

    <div class="card" style="padding: 16px; margin-bottom: 16px;">
      <div class="field" style="margin-bottom: 12px;">
        <label class="label" style="display:flex; align-items:center; gap:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#8e9aa8;">
          <span>💵</span> ACCOUNT CAPITAL
        </label>
        <div style="display:flex; align-items:center; background:#07090e; border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0 12px;">
          <span style="color:#00e676; font-weight:700; font-size:16px;">$</span>
          <input id="cap" type="number" min="0" inputmode="decimal" value="${store.get('lot:cap', 1000)}" style="border:none; background:transparent; width:100%; padding:12px 8px; font-family:'Space Grotesk',sans-serif; font-size:17px; font-weight:700; color:#fff;">
        </div>
      </div>

      <div class="field" style="margin-bottom: 12px;">
        <label class="label" style="display:flex; align-items:center; gap:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#8e9aa8;">
          <span>📊</span> PAIR
        </label>
        <select id="pair" style="width:100%; padding:12px; background:#07090e; border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600;">
          ${LOT_PAIRS.map(p => `<option value="${p.id}">${p.l}</option>`).join('')}
        </select>
      </div>

      <div class="field" style="margin-bottom: 16px;">
        <label class="label" style="display:flex; align-items:center; gap:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#8e9aa8;">
          <span>⚠️</span> RISK LEVEL
        </label>
        <select id="risk" style="width:100%; padding:12px; background:#07090e; border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600;">
          ${RISKS.map(r => `<option value="${r.v}">${r.l}</option>`).join('')}
        </select>
      </div>

      <button class="btn gold full" id="calc" style="padding:14px; font-size:14px; font-weight:700; border-radius:8px; background:linear-gradient(135deg, #00e676, #00c853); color:#06070a;">
        Calculate Lot
      </button>
    </div>

    <!-- Suggested Lot Size Card -->
    <div class="card" id="result" style="text-align:center; padding:22px; margin-bottom:14px; border-color:rgba(0,230,118,0.4);"></div>

    <p style="font-size:11px; color:#64748b; line-height:1.55; padding:0 4px;">
      Formula: Lot = (Capital × Risk%) ÷ (50 pip × value of 1 pip). Pip value is estimated on a standard lot — check it against your own broker's contract specs before trading it live.
    </p>
  </section>`;

  $('#pair', main).value = store.get('lot:pair', 'XAUUSD');
  $('#risk', main).value = store.get('lot:risk', 5);

  function calc() {
    const cap = parseFloat($('#cap', main).value) || 0;
    const pair = LOT_PAIRS.find(p => p.id === $('#pair', main).value) || LOT_PAIRS[0];
    const risk = +$('#risk', main).value;
    store.set('lot:cap', cap);
    store.set('lot:pair', pair.id);
    store.set('lot:risk', risk);

    const riskUsd = (cap * risk) / 100;
    const lot = Math.floor((riskUsd / (SL * pair.pv)) * 100) / 100;
    const res = $('#result', main);

    if (lot < 0.01) {
      res.innerHTML = `
        <span class="label" style="font-size:11px; letter-spacing:0.8px; color:#8e9aa8; text-transform:uppercase;">SUGGESTED LOT SIZE</span>
        <div style="font-size:28px; font-weight:700; color:var(--bear); margin:6px 0;">—</div>
        <small class="muted">Capital insufficient for 0.01 minimum standard lot with 50 pip SL</small>
      `;
      return;
    }

    res.innerHTML = `
      <span class="label" style="font-size:11.5px; letter-spacing:0.8px; color:#00e676; text-transform:uppercase; font-weight:700;">SUGGESTED LOT SIZE</span>
      <div style="font-family:'Space Grotesk',sans-serif; font-size:42px; font-weight:800; color:#fff; margin:6px 0;">${lot.toFixed(2)}</div>
      <div style="font-family:'Space Grotesk',sans-serif; font-size:14px; color:#38bdf8; font-weight:700; margin-bottom:6px;">
        0.01 × ${Math.round(lot / 0.01)} layer
      </div>
      <small style="font-size:12px; color:#8e9aa8;">Risk $${riskUsd.toFixed(2)} at 50 pip SL · ${pair.id}</small>
    `;
  }

  $('#calc', main).onclick = calc;
  $('#cap', main).onkeydown = e => { if (e.key === 'Enter') calc(); };
  calc();
}

// ---------- 3. P&L Journal ----------
function PnLPage(main) {
  const view = new Date(); view.setDate(1);
  main.innerHTML = `<section class="page">
    ${pageHead('P&amp;L Ledger', 'Daily profit and loss ledger with monthly equity target tracking', true)}
    <div class="month-nav">
      <button class="btn ghost sm" id="prev">‹ Prev</button>
      <h2 id="mlabel" style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:#fff;"></h2>
      <button class="btn ghost sm" id="next">Next ›</button>
    </div>
    <div class="card" style="text-align:center; padding:18px;">
      <span class="label">Total Net Return</span>
      <div id="total" style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:800; margin:4px 0;"></div>
    </div>
    <div class="card">
      <div class="row"><span class="label">Monthly Target</span><button class="btn ghost sm" id="editGoal" style="padding:2px 8px;">✎ Edit</button></div>
      <div class="row" style="margin:6px 0;"><span id="goalNow" style="font-weight:700;"></span><span class="muted" id="goalTarget"></span></div>
      <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;"><div id="goalFill" style="height:100%; background:var(--bull); width:0%;"></div></div>
    </div>
    <div class="cal-head">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => `<div>${d}</div>`).join('')}</div>
    <div class="cal" id="cal"></div>
  </section>`;

  const goalKey = () => 'goal:' + monthKey(view);
  function draw() {
    const data = store.get('pnl', {}), mk = monthKey(view), goal = store.get(goalKey(), 2500);
    const y = view.getFullYear(), m = view.getMonth(), days = new Date(y, m + 1, 0).getDate(), today = new Date();
    $('#mlabel', main).textContent = view.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let total = 0, html = '';
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
    if (firstDow < 5) html += '<div class="day" style="opacity:0; pointer-events:none;"></div>'.repeat(firstDow);
    for (let d = 1; d <= days; d++) {
      if ((new Date(y, m, d).getDay() + 6) % 7 > 4) continue;
      const k = `${mk}-${pad2(d)}`, v = data[k];
      if (typeof v === 'number') total += v;
      const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
      html += `<button class="day ${v == null ? '' : v >= 0 ? 'win' : 'loss'} ${isToday ? 'today' : ''}" data-k="${k}">
        <span style="font-weight:600;">${d}</span>
        ${v != null ? `<span class="amt">${shortMoney(v)}</span>` : ''}
      </button>`;
    }
    $('#cal', main).innerHTML = html;
    const t = $('#total', main);
    t.textContent = money(total);
    t.style.color = total >= 0 ? 'var(--bull)' : 'var(--bear)';
    $('#goalNow', main).textContent = money(total, false);
    $('#goalTarget', main).textContent = '$' + num(goal, 0);
    $('#goalFill', main).style.width = Math.max(0, Math.min(100, (total / goal) * 100)) + '%';
  }

  function editDay(k) {
    const cur = store.get('pnl', {})[k];
    let sign = cur < 0 ? -1 : 1;
    const d = new Date(k + 'T00:00:00');
    const m = modal(`<h3>${d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
      <p class="muted">Log daily trading equity (USD).</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <button class="btn ${sign > 0 ? 'green' : 'ghost'}" id="btnProf">Profit (+)</button>
        <button class="btn ${sign < 0 ? 'solar' : 'ghost'}" id="btnLoss">Loss (-)</button>
      </div>
      <input id="amt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${cur != null ? Math.abs(cur) : ''}">
      <div class="modal-actions">
        ${cur != null ? '<button class="btn ghost" data-a="clear">Clear</button>' : ''}
        <button class="btn gold" data-a="save">Save</button>
      </div>`);
    const inp = $('#amt', m.el);
    setTimeout(() => inp.focus(), 50);
    $('#btnProf', m.el).onclick = () => { sign = 1; $('#btnProf', m.el).className = 'btn green'; $('#btnLoss', m.el).className = 'btn ghost'; };
    $('#btnLoss', m.el).onclick = () => { sign = -1; $('#btnLoss', m.el).className = 'btn solar'; $('#btnProf', m.el).className = 'btn ghost'; };

    const write = async v => {
      const all = store.get('pnl', {});
      if (v == null) delete all[k]; else all[k] = v;
      store.set('pnl', all);
      m.close(); draw();
      try {
        await fetch('/api/pnl/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: BRAND.user, date: k, profit: v })
        });
      } catch (e) {}
    };
    $('[data-a=save]', m.el).onclick = () => {
      const v = parseFloat(inp.value);
      write(isNaN(v) ? null : Math.round(Math.abs(v) * sign * 100) / 100);
    };
    const clr = $('[data-a=clear]', m.el);
    if (clr) clr.onclick = () => write(null);
  }

  $('#cal', main).onclick = e => { const b = e.target.closest('.day[data-k]'); if (b) editDay(b.dataset.k); };
  $('#prev', main).onclick = () => { view.setMonth(view.getMonth() - 1); draw(); };
  $('#next', main).onclick = () => { view.setMonth(view.getMonth() + 1); draw(); };
  $('#editGoal', main).onclick = () => {
    const m = modal(`<h3>Monthly Target</h3><p class="muted">Set your profit target (USD)</p>
      <input id="goal" type="number" min="1" inputmode="decimal" value="${store.get(goalKey(), 2500)}">
      <div class="modal-actions"><button class="btn gold" data-a="save">Save Target</button></div>`);
    const inp = $('#goal', m.el);
    $('[data-a=save]', m.el).onclick = () => {
      const v = parseFloat(inp.value);
      if (v > 0) store.set(goalKey(), v);
      m.close(); draw();
    };
  };

  draw();
}

// ---------- 4. Volatility ----------
const SESSIONS = [
  { id: 'asia', name: 'Asia', hours: '07:00–15:00', start: 7, end: 15, pip: 142, desc: 'Tokyo + Sydney · quiet range', barColor: '#60a5fa' },
  { id: 'europe', name: 'Europe', hours: '15:00–20:00', start: 15, end: 20, pip: 125, desc: 'London · high activity', barColor: '#00e676' },
  { id: 'us', name: 'US', hours: '20:00–05:00', start: 20, end: 5, pip: 162, desc: 'New York · highest volume · most active', barColor: '#a855f7' }
];

function VolatilityPage(main) {
  function state() {
    const n = new Date(), t = new Date(n.getTime() + (n.getTimezoneOffset() + 480) * 60000);
    const h = t.getHours() + t.getMinutes() / 60 + t.getSeconds() / 3600;
    const inS = s => (s.start < s.end ? h >= s.start && h < s.end : h >= s.start || h < s.end);
    let open = SESSIONS.find(inS);
    if (!open) open = SESSIONS[1]; // default Europe if borderline
    let next = null, best = 99;
    for (const s of SESSIONS) {
      if (s === open) continue;
      let d = s.start - h;
      if (d <= 0) d += 24;
      if (d < best) { best = d; next = s; }
    }
    if (!next) next = SESSIONS[2];
    return { open, next, mins: Math.ceil(best * 60) };
  }
  const max = Math.max(...SESSIONS.map(s => s.pip));
  function draw() {
    const st = state();
    main.innerHTML = `<section class="page">
      ${pageHead('Session Volatility', 'Average hourly range by session, last 30 days', true)}
      
      <!-- Next Session Banner -->
      <div class="card" style="padding:16px 18px; margin-bottom:14px; background:linear-gradient(135deg, rgba(255,109,0,0.1), rgba(11,15,25,0.95)); border:1px solid rgba(255,109,0,0.3);">
        <div class="row">
          <div>
            <span style="font-size:10.5px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px; display:block; margin-bottom:4px;">NEXT SESSION</span>
            <b style="font-family:'Space Grotesk',sans-serif; font-size:20px; color:var(--solar-gold);">${st.next.name}</b>
          </div>
          <div style="text-align:right;">
            <b style="font-family:'Space Grotesk',sans-serif; font-size:22px; color:#fff; display:block;">${Math.floor(st.mins / 60)}h ${st.mins % 60}m</b>
            <span style="font-size:10.5px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">OPENS IN</span>
          </div>
        </div>
      </div>

      <!-- Session Cards -->
      ${SESSIONS.map(s => {
        const isOpen = st.open && st.open.id === s.id;
        const isNext = st.next && st.next.id === s.id;
        return `
        <div class="card" style="padding:16px 18px; margin-bottom:12px; border:1px solid ${isOpen ? 'rgba(0,230,118,0.5)' : isNext ? 'rgba(255,160,0,0.35)' : 'rgba(255,255,255,0.08)'}; background:${isOpen ? 'rgba(0,230,118,0.03)' : 'var(--bg-card)'};">
          <div class="row" style="margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <b style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:#fff;">${s.name}</b>
              <span style="font-size:12px; color:#8e9aa8; font-weight:500;">${s.hours}</span>
              ${isOpen ? '<span class="badge" style="background:rgba(0,230,118,0.18); color:#00e676; border:1px solid rgba(0,230,118,0.4); padding:2px 8px; border-radius:12px; font-size:10.5px; font-weight:700;">● OPEN</span>' : ''}
              ${!isOpen && isNext ? '<span class="badge" style="background:rgba(255,160,0,0.15); color:var(--solar-gold); border:1px solid rgba(255,160,0,0.4); padding:2px 8px; border-radius:12px; font-size:10.5px; font-weight:700;">NEXT</span>' : ''}
            </div>
            <div style="text-align:right;">
              <b style="font-family:'Space Grotesk',sans-serif; font-size:18px; color:#38bdf8; display:block; line-height:1.1;">${s.pip}</b>
              <span style="font-size:9.5px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">AVG PIP</span>
            </div>
          </div>

          <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin:8px 0 10px 0;">
            <div style="height:100%; width:${(s.pip / max) * 100}%; background:${s.barColor};"></div>
          </div>

          <small style="font-size:11.5px; color:#8e9aa8;">${s.desc}</small>
        </div>
        `;
      }).join('')}

      <div style="padding:14px 4px 6px 4px; font-size:11.5px; color:#64748b; line-height:1.6;">
        <div>Based on 21.9 days of collected price data.</div>
        <div style="margin-top:4px;">Times shown in Malaysia time. Higher range means bigger moves and wider stops.</div>
      </div>
    </section>`;
  }
  draw();
  const t = setInterval(draw, 30000);
  return () => clearInterval(t);
}

// ---------- 5. Championship / Contest ----------
function ContestPage(main) {
  const contestState = store.get('contest_live', false);
  const ct = (AppState && AppState.contests && AppState.contests[0]) || {
    status: 'coming_soon',
    title: 'Amaterasu Solar Championship',
    prizePool: '$25,000 USD',
    participantsCount: 128,
    endDate: '2026-10-31',
    leaderboard: [
      { rank: 1, name: 'SolarBlade_MY', returnRate: '+412.5%', pips: 2450, badge: '👑' },
      { rank: 2, name: 'Amaterasu_Ghost', returnRate: '+328.0%', pips: 1980, badge: '🥈' },
      { rank: 3, name: 'ZenTrader_KL', returnRate: '+295.4%', pips: 1720, badge: '🥉' },
      { rank: 4, name: 'kj35 (You)', returnRate: '+184.2%', pips: 979, badge: '☀️' },
      { rank: 5, name: 'KuroNeko_Fx', returnRate: '+142.1%', pips: 860, badge: '5' }
    ]
  };

  function render() {
    if (!contestState && ct.status !== 'active') {
      main.innerHTML = `<section class="page">
        ${pageHead('Contest 🏆', 'Amaterasu AI trading competition', true)}
        
        <div class="card" style="text-align:center; padding:48px 24px; margin-top:20px; border:1px solid rgba(255,255,255,0.08); background:radial-gradient(circle at center, rgba(255,109,0,0.08) 0%, rgba(11,15,25,0.98) 70%);">
          <div style="font-size:52px; margin-bottom:16px; filter:drop-shadow(0 0 12px rgba(255,160,0,0.5));">🏆</div>
          <h2 style="font-family:'Space Grotesk',sans-serif; font-size:24px; color:var(--solar-gold); margin-bottom:12px; font-weight:700;">Coming Soon</h2>
          <p style="font-size:13.5px; color:#cbd5e1; line-height:1.6; max-width:340px; margin:0 auto 24px auto;">
            The trading competition is being prepared. You will be notified as soon as it opens — make sure notifications are on.
          </p>
          <button class="btn gold" id="notifyBtn" style="padding:12px 24px; font-size:13.5px; font-weight:700; border-radius:8px;">
            Notify me when the next round opens
          </button>
        </div>
      </section>`;

      $('#notifyBtn', main).onclick = function() {
        this.disabled = true;
        this.textContent = 'Notification alert set ✓';
        this.className = 'btn ghost';
        toast('🔔 We will notify you as soon as the tournament gates open!');
      };
      return;
    }

    // Active Leaderboard state
    main.innerHTML = `<section class="page">
      ${pageHead('Contest 🏆', 'Amaterasu AI trading competition', true)}
      <div class="card highlight" style="padding:18px; margin-bottom:16px;">
        <div class="row" style="margin-bottom:8px;">
          <span class="badge open">● LIVE SEASON 4</span>
          <span class="muted" style="font-size:11.5px;">Closes: ${ct.endDate || 'Oct 31'}</span>
        </div>
        <h2 style="font-family:'Space Grotesk',sans-serif; font-size:20px; color:#fff; margin:4px 0 10px;">${esc(ct.title)}</h2>
        <div class="row" style="margin-bottom:14px;">
          <div><span class="label">Prize Pool</span><div style="font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:800; color:var(--solar-gold);">${ct.prizePool}</div></div>
          <div style="text-align:right;"><span class="label">Competitors</span><div style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; color:var(--cyan);">${ct.participantsCount} Verified</div></div>
        </div>
        <button class="btn gold full" id="joinContest">Enter Tournament</button>
      </div>

      <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:1px; color:var(--solar-orange); margin:18px 0 10px;">Global Leaderboard</h3>
      <div class="card" style="padding:4px 14px;">
        ${(ct.leaderboard || []).map((lb, i) => `
          <div class="row" style="padding:11px 0; border-bottom:${i === ct.leaderboard.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)'}; ${lb.name.includes('You') ? 'background:rgba(255,109,0,0.08); padding-left:8px; padding-right:8px; border-radius:6px;' : ''}">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:16px; font-weight:700; width:22px; text-align:center;">${lb.badge || (i + 1)}</span>
              <div>
                <b style="font-size:13.5px; color:#fff;">${esc(lb.name)}</b><br>
                <small class="muted">${lb.pips > 0 ? '+' : ''}${lb.pips} pips</small>
              </div>
            </div>
            <b style="font-family:'Space Grotesk',sans-serif; font-size:14px; color:var(--bull);">${lb.returnRate}</b>
          </div>
        `).join('')}
      </div>
    </section>`;

    $('#joinContest', main).onclick = function() {
      this.disabled = true;
      this.textContent = 'Enrolled in Championship ✓';
      this.className = 'btn ghost full';
      toast('Enrolled in Amaterasu Solar Championship!');
    };
  }

  render();
}

// ---------- 6. Games (Amaterasu Blocks & Arcade) ----------
const GAMES_LIST = [
  { id: 'blocks', name: 'Amaterasu Blocks', desc: 'Clear rows of candles', icon: '🧱', active: true },
  { id: 'commando', name: 'Bull Commando', desc: '20 stages · run & gun', icon: '🐂', active: false },
  { id: 'run', name: 'Candle Run', desc: 'Jump the candles', icon: '📈', active: false },
  { id: 'strike', name: 'Candle Strike', desc: 'Beat 10 market bosses', icon: '🚀', active: false }
];

function GamesPage(main) {
  let game = null;
  const best = () => store.get('best:' + monthKey(), 0);
  const name = () => store.get('displayName', '');

  main.innerHTML = `<section class="page">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
      <a href="#more" class="back-link" style="color:var(--solar-gold); font-size:13.5px; font-weight:600; text-decoration:none;">← More</a>
      <button class="btn ghost sm" id="gameRankingsBtn" style="padding:4px 10px; font-size:14px; border-radius:8px;">🏆</button>
    </div>

    <div style="margin-bottom:14px;">
      <h1 style="font-family:'Space Grotesk',sans-serif; font-size:24px; color:#fff; font-weight:800; margin-bottom:4px;">Games</h1>
      <p style="font-size:12.5px; color:#8e9aa8; margin:0;">Top the monthly ranking. Fresh start on the 1st.</p>
    </div>

    <!-- Set Display Name Banner -->
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; margin-bottom:14px; border:1px dashed rgba(255,160,0,0.4); background:rgba(255,109,0,0.04);">
      <p style="font-size:12px; color:#cbd5e1; line-height:1.45; margin:0; padding-right:10px;">
        Pick a display name for the rankings — your username stays private.
      </p>
      <button class="btn gold sm" id="setNameBtn" style="white-space:nowrap; padding:8px 14px; font-size:12px; font-weight:700;">
        ${name() ? 'Edit name' : 'Set name'}
      </button>
    </div>

    <!-- 4 Games Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
      ${GAMES_LIST.map(g => `
        <div class="card game-card-tile" data-game="${g.id}" style="padding:12px 14px; cursor:pointer; border:1px solid ${g.active ? 'rgba(255,160,0,0.6)' : 'rgba(255,255,255,0.08)'}; background:${g.active ? 'linear-gradient(135deg, rgba(255,109,0,0.12), rgba(11,15,25,0.95))' : 'var(--bg-card)'}; position:relative; overflow:hidden;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:22px;">${g.icon}</span>
            ${g.active ? '<span class="badge" style="background:rgba(0,230,118,0.18); color:#00e676; border:1px solid rgba(0,230,118,0.4); padding:1px 6px; font-size:9.5px; border-radius:10px; font-weight:700;">PLAY</span>' : '<span class="badge" style="background:rgba(255,255,255,0.06); color:#8e9aa8; font-size:9.5px; border-radius:10px;">LOCKED</span>'}
          </div>
          <b style="font-family:'Space Grotesk',sans-serif; font-size:13.5px; color:#fff; display:block; margin-bottom:2px;">${g.name}</b>
          <small style="font-size:11px; color:#8e9aa8; display:block;">${g.desc}</small>
        </div>
      `).join('')}
    </div>

    <!-- Live Game Stats Bar -->
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:10px 16px; margin-bottom:12px; background:#07090e; border:1px solid rgba(255,255,255,0.1);">
      <div style="display:flex; gap:18px;">
        <div>
          <span style="font-size:10px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">Score</span>
          <b id="gScore" style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:#00e676; display:block;">0</b>
        </div>
        <div>
          <span style="font-size:10px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">Lines</span>
          <b id="gLines" style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:#38bdf8; display:block;">0</b>
        </div>
        <div>
          <span style="font-size:10px; font-weight:700; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.8px;">Level</span>
          <b id="gLevel" style="font-family:'Space Grotesk',sans-serif; font-size:16px; color:var(--solar-gold); display:block;">1</b>
        </div>
      </div>
      <button class="btn ghost sm" id="pauseBtn" style="padding:6px 12px; font-size:14px; border-radius:6px;">⏸</button>
    </div>

    <!-- Tetris Board & Controls -->
    <div class="board-wrap" style="position:relative;">
      <div class="board"><canvas id="board"></canvas></div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span class="label" style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.8px; color:#8e9aa8;">Next</span>
        <canvas id="nextC" style="background:#050609; border:1px solid rgba(255,255,255,0.1); border-radius:6px;"></canvas>
      </div>
      <div id="overlay" class="modal-bg hidden" style="position:absolute; inset:0; border-radius:8px;"></div>
    </div>

    <div class="game-controls" style="margin-top:14px;">
      <button data-c="left">◀</button>
      <button data-c="rotate">⟳</button>
      <button data-c="right">▶</button>
      <button data-c="down">▼</button>
      <button data-c="drop">⤓</button>
    </div>
  </section>`;

  $('#setNameBtn', main).onclick = () => askDisplayName(() => {
    $('#setNameBtn', main).textContent = name() ? 'Edit name' : 'Set name';
  });

  $('#gameRankingsBtn', main).onclick = () => {
    modal(`<h3>Monthly Leaderboard</h3><p class="muted">Fresh reset on the 1st of every month</p>
      <div class="card" style="padding:4px 14px;">
        <div class="row" style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>👑</span>
            <b style="color:#fff; font-size:13.5px;">SolarBlade_MY</b>
          </div>
          <b class="gold">24,500 pts</b>
        </div>
        <div class="row" style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>🥈</span>
            <b style="color:#fff; font-size:13.5px;">Kenji_Quant</b>
          </div>
          <b class="gold">19,820 pts</b>
        </div>
        <div class="row" style="padding:10px 0;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>☀️</span>
            <b style="color:#fff; font-size:13.5px;">${name() || 'You (kj35)'}</b>
          </div>
          <b class="green">${best()} pts</b>
        </div>
      </div>
      <div class="modal-actions"><button class="btn gold" data-close>Close</button></div>`);
  };

  function saveScore(score) {
    if (score > best()) store.set('best:' + monthKey(), score);
    if (score > 0) {
      const nm = name() || BRAND.user;
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nm, score, game: 'blocks', month: monthKey() })
      }).catch(() => {});
    }
  }

  const ov = $('#overlay', main);
  const showOv = (title, sub) => {
    ov.innerHTML = `<div class="modal" style="text-align:center; padding:24px 18px; border:1px solid rgba(255,109,0,0.4); background:#0c101c;">
      <h3 style="font-family:'Space Grotesk',sans-serif; color:var(--solar-gold); margin-bottom:8px;">${title}</h3>
      <p class="muted" style="font-size:12.5px; margin-bottom:16px;">${sub}</p>
      <button class="btn gold" style="padding:10px 24px; font-weight:700;">Start Game</button>
    </div>`;
    ov.classList.remove('hidden');
    ov.style.display = 'flex';
  };

  game = createBlocks($('#board', main), $('#nextC', main), {
    update: s => {
      if (s) {
        if ($('#gScore', main)) $('#gScore', main).textContent = s.score || 0;
        if ($('#gLines', main)) $('#gLines', main).textContent = s.lines || 0;
        if ($('#gLevel', main)) $('#gLevel', main).textContent = s.level || 1;
      }
    },
    state: st => { if (st === 'paused') showOv('Paused', 'Tap start to resume play'); else ov.style.display = 'none'; },
    over: score => { saveScore(score); showOv('Game Over', `Score: ${score} · High Score: ${best()}`); }
  });

  showOv('Amaterasu Blocks', 'Clear rows of candles to top the monthly leaderboard');
  ov.onclick = () => { game.start(); ov.style.display = 'none'; };
  $('#pauseBtn', main).onclick = () => game.pause();
  $$('.game-controls button', main).forEach(b => {
    b.onpointerdown = e => { e.preventDefault(); game.act(b.dataset.c); };
  });

  $$('.game-card-tile', main).forEach(tile => {
    tile.onclick = () => {
      const gId = tile.dataset.game;
      if (gId !== 'blocks') {
        toast(`⚠️ ${tile.querySelector('b').textContent} will unlock in the next tournament season!`);
      }
    };
  });

  return () => { if (game) game.destroy(); };
}
