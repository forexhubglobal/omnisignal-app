// ===== Amaterasu AI Router, Tab Dock, Global Shell =====

const TABS = [
  ['signal', 'Signal'], ['stat', 'Stat'], ['analysis', 'Analysis'], ['screener', 'Screener'],
  ['news', 'News'], ['ainews', 'AI News'], ['more', 'More'],
];

const ROUTES = {
  signal: SignalPage, stat: StatPage, analysis: AnalysisPage, screener: ScreenerPage, news: NewsPage, ainews: AiNewsPage,
  more: MorePage, lot: LotPage, pnl: PnLPage, games: GamesPage, volatility: VolatilityPage, contest: ContestPage,
};

let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  $$('.modal-bg').forEach(m => m.remove());
  let r = location.hash.slice(1);
  if (!ROUTES[r]) r = 'signal';
  const main = $('#main');
  main.innerHTML = '';
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  cleanup = ROUTES[r](main) || null;
  const tab = TABS.some(t => t[0] === r) ? r : 'more';
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.r === tab));
}


  // ===== 14-DAY PERFORMANCE PASS & IB ECOSYSTEM =====
  // Captures ?ib=... referral code
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refIb = urlParams.get('ib');
    if (refIb) {
      store.set('ama_referred_ib', refIb);
      console.log('[AMATERASU X] Onboarding via IB Partner:', refIb);
    }
  } catch(e) {}

  async function checkTraderPass() {
    const currentUser = store.get('ama_operator') || BRAND.user;
    const badge = $('#passPillBadge');
    try {
      const res = await fetch(`/api/trader/verify-pass?user=${encodeURIComponent(currentUser)}`);
      const data = await res.json();
      
      if (badge) {
        if (data.isMaster) {
          badge.innerHTML = `<span style="background:rgba(212,175,55,0.15); border:1px solid #E5C158; color:#E5C158; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">👑 Master VIP</span>`;
        } else if (data.valid) {
          const color = data.daysRemaining <= 3 ? '#E5C158' : '#00D68F';
          const dot = data.daysRemaining <= 3 ? '🟡' : '🟢';
          const label = data.daysRemaining <= 3 ? `${dot} ${data.daysRemaining} Hari (Tamat Segera)` : `${dot} ${data.daysRemaining} Hari Baki`;
          badge.innerHTML = `<span style="background:${color}22; border:1px solid ${color}; color:${color}; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">${label}</span>`;
        } else {
          badge.innerHTML = `<span style="background:rgba(239,45,61,0.2); border:1px solid #EF2D3D; color:#EF2D3D; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">🔴 Pas Tamat</span>`;
        }
        badge.onclick = () => showPassDetailsModal(data);
      }

      // If pass expired and NOT master operator: trigger graceful lock modal
      if (!data.isMaster && !data.valid && data.found) {
        showExpiredLockModal(data);
      }
    } catch(err) {
      console.warn('Trader pass check error', err);
    }
  }

  function showPassDetailsModal(data) {
    const isMaster = data.isMaster;
    const days = data.daysRemaining;
    const ibName = (data.ib && data.ib.name) ? data.ib.name : 'Amaterasu Partner';
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+60123456789';

    modal(`
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:32px; margin-bottom:6px;">${isMaster ? '👑' : (days > 3 ? '🟢' : (days > 0 ? '🟡' : '🔴'))}</div>
        <h3 style="font-size:17px; color:#FFF; margin-bottom:4px;">${isMaster ? 'Master VIP Infinite Pass' : 'Amaterasu 14-Day Performance Pass'}</h3>
        <p style="font-size:12px; color:#A0A6B4;">${isMaster ? 'Akses tanpa had ke semua kluster isyarat & telemetri AI' : 'Kitaran akses 14 hari bersyarat baki modal & lot dagangan MT5'}</p>
      </div>

      ${!isMaster ? `
        <div style="background:#0F1722; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <span style="color:#A0A6B4;">Rangkaian IB:</span>
            <b style="color:#E5C158;">${esc(ibName)}</b>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <span style="color:#A0A6B4;">Baki Tempoh Pas:</span>
            <b style="color:${days > 3 ? '#00D68F' : (days > 0 ? '#E5C158' : '#EF2D3D')};">${days} Hari Lagi</b>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span style="color:#A0A6B4;">Status Akaun MT5:</span>
            <span style="color:#00D68F; font-weight:700;">🟢 Disahkan Aktif</span>
          </div>
        </div>

        <div style="background:rgba(229,193,88,0.08); border-left:3px solid #E5C158; padding:10px 12px; border-radius:0 8px 8px 0; margin-bottom:16px; font-size:11.5px; color:#CBD5E1; line-height:1.5;">
          💡 <b>Syarat Pembaharuan Pas Percuma:</b><br>
          Kekalkan deposit minima dan pastikan ada dagangan lot mingguan pada akaun MT5 anda di bawah broker rakan niaga IB.
        </div>

        <a href="https://wa.me/${ibPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Salam sejahtera IB ' + ibName + ', saya ingin memohon pembaharuan Pas 14-Hari Amaterasu X untuk akaun MT5 saya.')}" target="_blank" class="btn btn-primary full" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; font-weight:700; background:linear-gradient(135deg, #00D68F, #00A36C); color:#080D14; border:none; text-decoration:none;">
          📲 Hubungi IB di WhatsApp
        </a>
      ` : `
        <div style="background:#0F1722; border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:14px; text-align:center; color:#E5C158; font-size:13px; font-weight:700;">
          Akaun Operator Utama Disahkan · Semua Mod Auto &amp; CRM Aktif
        </div>
      `}
    `);
  }

  function showExpiredLockModal(data) {
    const existing = document.getElementById('expiredLockOverlay');
    if (existing) existing.remove();

    const ibName = (data.ib && data.ib.name) ? data.ib.name : 'Rakan Niaga IB Anda';
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+60123456789';

    const overlay = document.createElement('div');
    overlay.id = 'expiredLockOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(8,13,20,0.92)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    overlay.innerHTML = `
      <div style="background:#0F1722; border:1.5px solid #EF2D3D; border-radius:18px; max-width:440px; width:100%; padding:28px 24px; text-align:center; box-shadow:0 0 50px rgba(239,45,61,0.35);">
        <div style="width:60px; height:60px; margin:0 auto 16px; background:rgba(239,45,61,0.15); border:1px solid #EF2D3D; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px;">
          ⏱️
        </div>
        <h2 style="font-family:'Space Grotesk',sans-serif; color:#FFF; font-size:20px; font-weight:900; margin-bottom:8px; letter-spacing:0.5px;">
          TEMPOH 14-HARI TELAH TAMAT
        </h2>
        <p style="font-size:12.5px; color:#A0A6B4; line-height:1.5; margin-bottom:18px;">
          Sistem <b style="color:#FFF;">Amaterasu X</b> menjana <b style="color:#00D68F;">+9,330 pips (93% Win Rate)</b>. Bagi memastikan kecekapan isyarat dan komitmen dagangan, pas diperbaharui setiap 14 hari secara <b style="color:#FFF;">PERCUMA</b>.
        </p>

        <div style="background:#07090E; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px; text-align:left; margin-bottom:20px; font-size:12px; color:#CBD5E1;">
          <b style="color:#E5C158; display:block; margin-bottom:6px;">📋 Syarat Pembaharuan Pas Percuma:</b>
          <div style="margin-bottom:4px;">1. Akaun MT5 masih mengekalkan baki modal aktif.</div>
          <div>2. Ada rekod dagangan lot mingguan di bawah IB anda.</div>
        </div>

        <a href="https://wa.me/${ibPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Salam IB ' + ibName + ', pas 14-hari Amaterasu X saya telah tamat. Saya telah aktif trade di MT5, mohon perbaharui pas saya.')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:linear-gradient(135deg, #EF2D3D, #FF6D00); color:#FFF; font-weight:800; border-radius:10px; font-size:13px; text-decoration:none; margin-bottom:12px; box-shadow:0 4px 15px rgba(239,45,61,0.4);">
          📲 Hubungi IB (${esc(ibName)}) di WhatsApp
        </a>

        <button type="button" onclick="location.reload()" style="background:transparent; border:1px solid rgba(255,255,255,0.12); color:#A0A6B4; font-size:11px; padding:8px 16px; border-radius:8px; cursor:pointer;">
          🔄 Saya Dah Renew, Semak Semula
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

function init() {
  $('#brandName').textContent = BRAND.name.toUpperCase();
  $('#brandTag').textContent = BRAND.tagline;
  $('#user').textContent = BRAND.user;
  document.title = `${BRAND.name} · ${BRAND.tagline}`;

  $('#tabbar').innerHTML = TABS.map(([r, l]) => `<a class="tab" href="#${r}" data-r="${r}"><span class="tab-ic">${ic(r)}</span>${l}</a>`).join('');

  const sndBtn = $('#soundToggleBtn');
  const sndIco = $('#soundIcon');
  if (sndBtn && sndIco) {
    const updateSndIco = () => {
      sndIco.textContent = AmaterasuSound.enabled ? '🔊' : '🔇';
      sndBtn.style.color = AmaterasuSound.enabled ? '#EF2D3D' : '#64748B';
    };
    updateSndIco();
    sndBtn.onclick = () => {
      const on = AmaterasuSound.toggle();
      updateSndIco();
      toast(on ? '🔊 Amaterasu Sound FX Aktif' : '🔇 Sound FX Dimatikan');
    };
  }

  // Itachi Anime Login Screen Modal & Session Handler
  function showLoginScreen(onSuccess) {
    const existing = $('#loginScreenOverlay');
    if (existing) existing.remove();

    const currentOp = store.get('ama_operator') || 'Tengku Khairi';

    const overlay = document.createElement('div');
    overlay.id = 'loginScreenOverlay';
    overlay.className = 'login-screen-overlay';
    overlay.innerHTML = `
      <div class="login-card">
        <div class="login-hero-artwork" style="background-image: url('img/itachi_login.jpg');">
          <div class="login-hero-badges">
            <span class="kanji-badge">天照 AMATERASU</span>
            <span style="font-size:11px; font-weight:700; color:#EF2D3D; background:rgba(8,13,20,0.85); border:1px solid rgba(239,45,61,0.4); padding:3px 8px; border-radius:10px;">
              NODE · 12MS
            </span>
          </div>
          <div style="position:relative; z-index:2;">
            <h2 style="font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:900; color:#FFF; margin:0 0 2px; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
              AMATERASU<span style="color:#EF2D3D;">X</span>
            </h2>
            <p style="font-size:11.5px; color:#A0A6B4; margin:0; letter-spacing:0.8px; text-transform:uppercase;">
              AI Powered Forex & CFD Signals
            </p>
          </div>
        </div>

        <div class="login-body">
          <div style="font-size:11px; color:#8E9AA8; font-style:italic; margin-bottom:14px; line-height:1.45; border-left:2.5px solid #EF2D3D; padding-left:10px; background:rgba(239,45,61,0.05); padding-top:4px; padding-bottom:4px; border-radius:0 6px 6px 0;">
            "Even in the darkest night, the light of Amaterasu will never fade." — Itachi Uchiha
          </div>

          <div class="login-field">
            <label>Pilih Profil Operator</label>
            <div class="login-operator-pills">
              <button type="button" class="operator-chip active" data-call="Tengku Khairi">👑 Tengku Khairi</button>
              <button type="button" class="operator-chip" data-call="kj35 (Master Trader)">⚡ kj35</button>
              <button type="button" class="operator-chip" data-call="Alpha Trader">👁️ Alpha Trader</button>
            </div>
          </div>

          <form id="amaterasuLoginForm">
            <div class="login-field">
              <label>Operator Call-Sign</label>
              <div class="login-input-wrap">
                <input type="text" id="loginCallSign" value="${esc(currentOp)}" required placeholder="cth: Tengku Khairi" autocomplete="username" />
              </div>
            </div>

            <div class="login-field">
              <label>Access Code / Secret Key</label>
              <div class="login-input-wrap">
                <input type="password" id="loginPasscode" value="AMATERASU-2026" required placeholder="Kunci Keselamatan MT5" autocomplete="current-password" />
              </div>
            </div>

            <button type="submit" class="btn-login-fire" id="btnSubmitLogin" style="margin-top:16px;">
              <span>⚡</span> Masuk Terminal Amaterasu X
            </button>

            <button type="button" class="btn btn-outline" id="btnGuestLogin" style="width:100%; margin-top:10px; padding:11px; font-size:12px; font-weight:700; border-color:rgba(255,255,255,0.12); color:#A0A6B4;">
              <span>👁️</span> Masuk Sebagai Tetamu (Demo Guest)
            </button>
          </form>

          <div style="text-align:center; margin-top:16px; font-size:10.5px; color:#64748B;">
            Sambungan Disulitkan SSL · Kluster MT5 Disahkan
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Profile Chips Click
    $$('.operator-chip', overlay).forEach(chip => {
      chip.onclick = () => {
        $$('.operator-chip', overlay).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const callInput = $('#loginCallSign', overlay);
        if (callInput) callInput.value = chip.dataset.call;
      };
    });

    const doLogin = (operatorName) => {
      store.set('ama_logged_in', true);
      store.set('ama_operator', operatorName);
      BRAND.user = operatorName;
      const userEl = $('#user');
      if (userEl) userEl.textContent = operatorName;

      // Trigger Sharingan resonance sound effect
      if (typeof AmaterasuSound !== 'undefined') {
        AmaterasuSound.sharingan();
      }

      toast(`👁️ Selamat kembali, Operator ${operatorName}!`);
      overlay.style.transition = 'opacity 0.25s ease-out';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (onSuccess) onSuccess();
        else route();
        checkTraderPass();
      }, 250);
    };

    const form = $('#amaterasuLoginForm', overlay);
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const opName = ($('#loginCallSign', overlay).value || 'Tengku Khairi').trim();
        doLogin(opName);
      };
    }

    const guestBtn = $('#btnGuestLogin', overlay);
    if (guestBtn) {
      guestBtn.onclick = () => {
        doLogin('Guest Trader');
      };
    }
  }

  $('#logout').onclick = e => {
    e.preventDefault();
    const m = modal(`
      <h3>Log Keluar / Tukar Akaun</h3>
      <p class="muted">Sesi operator akan diputuskan daripada pautan MT5 Amaterasu X.</p>
      <div class="modal-actions">
        <button class="btn ghost" data-close>Batal</button>
        <button class="btn gold" data-a="out" style="background:#EF2D3D; border-color:#EF2D3D; color:#fff;">Log Keluar</button>
      </div>
    `);
    $('[data-a=out]', m.el).onclick = () => {
      m.close();
      store.set('ama_logged_in', false);
      toast('Sesi operator diputuskan');
      showLoginScreen();
    };
  };

  $('#bot').onclick = () => {
    const m = modal(`<h3>Amaterasu Solar Core</h3><p class="muted">Real-time solar oracle and risk advisor.</p>
      <div class="chat" id="chat">
        <div class="msg ai">Greetings Operator. XAUUSD is hovering at <b>${num(Market.price)}</b>. Intraday momentum is consolidating beneath 4,028 resistance. How may I assist your execution?</div>
      </div>
      <div class="chat-in"><input id="q" placeholder="Inquire about gold levels, risk or setups…"><button class="btn gold" id="send">Transmit</button></div>`);
    const chat = $('#chat', m.el), q = $('#q', m.el);
    const reply = t => {
      const s = t.toLowerCase();
      if (/lot|risk|saiz/.test(s)) return 'Access the Smart Risk Manager via Command Hub → Smart Lot. For $1,000 capital at 5% risk with 50 pip SL, recommended lot is 0.10.';
      if (/session|volatil|bila|masa/.test(s)) return 'New York session (20:00–05:00 MYT) exhibits peak expansion, averaging 195 pips. London session is opening next with 168 pips.';
      if (/price|harga|gold|emas/.test(s)) return `Current spot liquidity is pricing gold at ${num(Market.price)} USD/oz.`;
      if (/signal|setup/.test(s)) return 'Amaterasu Solar Core is tracking an order block sweep. A high-probability BUY vector is anticipated.';
      return 'Command received. Amaterasu telemetry algorithms are continuously parsing multi-timeframe order flow.';
    };
    const send = () => {
      const t = q.value.trim();
      if (!t) return;
      chat.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(t)}</div>`);
      q.value = '';
      setTimeout(() => { chat.insertAdjacentHTML('beforeend', `<div class="msg ai">${reply(t)}</div>`); chat.scrollTop = chat.scrollHeight; }, 350);
      chat.scrollTop = chat.scrollHeight;
    };
    $('#send', m.el).onclick = send;
    q.onkeydown = e => { if (e.key === 'Enter') send(); };
  };

  if (SET('anim', true)) {
    const s = document.createElement('div');
    s.className = 'splash';
    s.innerHTML = `
      <div class="splash-in">
        <div class="kanji-splash-tag">天照 · AMATERASU</div>
        <div class="splash-logo">${LOGO}</div>
        <div class="splash-brand-title">AMATERASU<span style="color:#EF2D3D;">X</span></div>
        <div class="splash-tagline">PRECISION SIGNALS · SMARTER DECISIONS</div>
        <div style="font-size:10px; color:#A0A6B4; letter-spacing:1.5px; margin-top:4px; text-transform:uppercase;">AI Powered Forex & CFD Signals</div>
        <div class="splash-loader-bar">
          <div class="splash-loader-fill"></div>
        </div>
      </div>
    `;
    document.body.appendChild(s);
    try {
      if (typeof AmaterasuSound !== 'undefined') {
        setTimeout(() => AmaterasuSound.sharingan(), 150);
      }
    } catch(e) {}
    setTimeout(() => s.classList.add('out'), 2200);
    setTimeout(() => s.remove(), 2600);
  }

  applyDisplayMode();
  applyMonitor();
  window.addEventListener('resize', applyDisplayMode);
  window.addEventListener('hashchange', route);
  setInterval(() => Market.tick(), 1000);
  Market.tick();

  // Connect to backend CRM and Server-Sent Events stream
  if (typeof AppState !== 'undefined') {
    AppState.sync().then(() => {
      route();
      AppState.initSSE();
    }).catch(() => {
      route();
    });
  } else {
    route();
  }

  // Check Login Session & Profile
  const isLoggedIn = store.get('ama_logged_in', false);
  const currentOp = store.get('ama_operator') || BRAND.user;
  BRAND.user = currentOp;
  const userEl = $('#user');
  if (userEl) userEl.textContent = currentOp;

  if (!isLoggedIn) {
    showLoginScreen(() => {
      route();
    });
  }
}

init();

