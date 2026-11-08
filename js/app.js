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
let currentActiveRoute = null;

function route(isDataRefresh = false) {
  let r = location.hash.slice(1);
  if (!ROUTES[r]) r = 'signal';
  
  const isNavigating = (currentActiveRoute !== r);
  currentActiveRoute = r;

  // Preserve scroll position if this is an automated background data refresh or same page
  const savedScrollY = (!isNavigating || isDataRefresh) ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;

  if (cleanup) { cleanup(); cleanup = null; }
  $$('.modal-bg').forEach(m => m.remove());
  
  const main = $('#main');
  main.innerHTML = '';
  
  cleanup = ROUTES[r](main) || null;
  const tab = TABS.some(t => t[0] === r) ? r : 'more';
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.r === tab));

  if (savedScrollY > 0) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    });
  } else if (isNavigating) {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }
}


  // ===== 14-DAY PERFORMANCE PASS & IB ECOSYSTEM =====
  // 🛡️ Client Device Fingerprint Helper (1-Device Lock)
  function getOrCreateDeviceId() {
    let devId = localStorage.getItem('ama_device_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('ama_device_id', devId);
    }
    return devId;
  }

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
      const devId = getOrCreateDeviceId();
      const devModel = navigator.userAgentData?.platform || navigator.platform || "Web Browser";
      const storedMt5 = localStorage.getItem("ama_mt5") || "";
      const res = await fetch(`/api/trader/verify-pass?user=${encodeURIComponent(currentUser)}&mt5=${encodeURIComponent(storedMt5)}&deviceId=${encodeURIComponent(devId)}&deviceModel=${encodeURIComponent(devModel)}`);
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
      if (data.deviceBlocked) {
        showDeviceBlockedModal(data);
        return;
      }
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
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+601123236085';

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

  
  function showDeviceBlockedModal(data) {
    const existing = document.getElementById('deviceBlockedOverlay');
    if (existing) existing.remove();

    const ibName = (data.ib && data.ib.name) ? data.ib.name : 'IB Rakan Niaga Anda';
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+601123236085';

    const overlay = document.createElement('div');
    overlay.id = 'deviceBlockedOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(8,13,20,0.96)';
    overlay.style.backdropFilter = 'blur(16px)';
    overlay.style.zIndex = '9999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    overlay.innerHTML = `
      <div style="background:#0F1722; border:2px solid #EF2D3D; border-radius:20px; max-width:440px; width:100%; padding:28px 24px; text-align:center; box-shadow:0 0 60px rgba(239,45,61,0.5);">
        <div style="width:68px; height:68px; margin:0 auto 16px; background:rgba(239,45,61,0.15); border:1.5px solid #EF2D3D; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px;">
          ⛔
        </div>
        <h2 style="font-family:'Space Grotesk',sans-serif; color:#FFF; font-size:20px; font-weight:900; margin-bottom:8px;">
          PERANTI TIDAK DIIKTIRAF
        </h2>
        <div style="background:rgba(239,45,61,0.1); border:1px solid rgba(239,45,61,0.3); border-radius:10px; padding:10px; margin-bottom:16px;">
          <b style="color:#EF2D3D; font-size:12.5px;">1 AKAUN MT5 = 1 PERANTI SAHAJA</b>
        </div>
        <p style="font-size:12px; color:#A0A6B4; line-height:1.5; margin-bottom:18px;">
          Akaun MT5 <b style="color:#00D68F;">#${esc(data.mt5Account || '')}</b> telah didaftarkan pada peranti lain. Perkongsian akses kepada orang lain adalah <b style="color:#FFF;">dilarang sama sekali</b>.
        </p>

        <div style="background:#07090E; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px; font-size:11.5px; color:#CBD5E1; text-align:left; margin-bottom:20px;">
          💡 <b>Anda baru menukar telefon atau peranti baru?</b><br>
          Sila hubungi IB anda untuk set semula kunci peranti (*Reset Device Binding*).
        </div>

        <a href="https://wa.me/${ibPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Salam IB ' + ibName + ', akaun MT5 #' + (data.mt5Account || '') + ' saya disekat kerana tukar peranti baru. Mohon reset device binding saya di CRM.')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:linear-gradient(135deg, #EF2D3D, #FF6D00); color:#FFF; font-weight:800; border-radius:10px; font-size:13px; text-decoration:none; margin-bottom:12px; box-shadow:0 4px 15px rgba(239,45,61,0.4);">
          📲 WhatsApp IB (${esc(ibName)}) untuk Reset
        </a>

        <button type="button" onclick="localStorage.removeItem('ama_operator'); localStorage.removeItem('ama_mt5'); location.reload();" style="background:transparent; border:1px solid rgba(255,255,255,0.15); color:#A0A6B4; font-size:11px; padding:8px 16px; border-radius:8px; cursor:pointer;">
          🚪 Log Masuk Guna Akaun Lain
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  function showExpiredLockModal(data) {
    const existing = document.getElementById('expiredLockOverlay');
    if (existing) existing.remove();

    const ibName = (data.ib && data.ib.name) ? data.ib.name : 'Rakan Niaga IB Anda';
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+601123236085';

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

  
  function showAccessDeniedModal(data) {
    const existing = document.getElementById('accessDeniedOverlay');
    if (existing) existing.remove();

    const adminPhone = '+601123236085';
    const waLink = "https://wa.me/601123236085?text=" + encodeURIComponent("Salam Admin Amaterasu X, saya berminat untuk memohon Kod Jemputan VIP (Invitation Code) bagi mengakses aplikasi.");

    const overlay = document.createElement('div');
    overlay.id = 'accessDeniedOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(8,13,20,0.96)';
    overlay.style.backdropFilter = 'blur(16px)';
    overlay.style.zIndex = '9999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    overlay.innerHTML = `
      <div style="background:#0F1722; border:2px solid #EF2D3D; border-radius:20px; max-width:440px; width:100%; padding:28px 24px; text-align:center; box-shadow:0 0 60px rgba(239,45,61,0.5);">
        <div style="width:68px; height:68px; margin:0 auto 16px; background:rgba(239,45,61,0.15); border:1.5px solid #EF2D3D; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px;">
          🔒
        </div>
        <h2 style="font-family:'Space Grotesk',sans-serif; color:#FFF; font-size:20px; font-weight:900; margin-bottom:8px;">
          AKSES KOD JEMPUTAN VIP SAHAJA
        </h2>
        <div style="background:rgba(239,45,61,0.1); border:1px solid rgba(239,45,61,0.3); border-radius:10px; padding:10px; margin-bottom:16px;">
          <b style="color:#EF2D3D; font-size:12.5px;">PLATFORM TERTUTUP (PRIVATE VIP GATEWAY)</b>
        </div>
        <p style="font-size:12.5px; color:#A0A6B4; line-height:1.5; margin-bottom:18px;">
          ${esc(data.message || 'Amaterasu X adalah sistem perdagangan tertutup. Anda memerlukan Kod Jemputan sah daripada Admin untuk mendaftar.')}
        </p>

        <a href="${waLink}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:linear-gradient(135deg, #25D366, #128C7E); color:#FFF; font-weight:800; border-radius:10px; font-size:13px; text-decoration:none; margin-bottom:12px; box-shadow:0 4px 15px rgba(37,211,102,0.4);">
          💬 WhatsApp Admin (+601123236085) Untuk Dapatkan Kod
        </a>

        <button type="button" onclick="document.getElementById('accessDeniedOverlay')?.remove(); showLoginScreen();" style="background:transparent; border:1px solid rgba(255,255,255,0.15); color:#A0A6B4; font-size:11px; padding:8px 16px; border-radius:8px; cursor:pointer;">
          🔄 Cuba Masukkan Kod Lain
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
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
          <div style="display:flex; background:rgba(255,255,255,0.04); border-radius:10px; padding:3px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.08);">
            <button type="button" id="tabModeTrader" style="flex:1; padding:8px; font-size:11.5px; font-weight:700; border-radius:8px; background:#EF2D3D; color:#FFF; border:none; cursor:pointer;">
              👤 Trader MT5
            </button>
            <button type="button" id="tabModeMaster" style="flex:1; padding:8px; font-size:11.5px; font-weight:700; border-radius:8px; background:transparent; color:#A0A6B4; border:none; cursor:pointer;">
              👑 Master Admin
            </button>
          </div>

          <!-- Section A: Client Trader MT5 Login -->
          <div id="sectionTraderLogin">
            <div style="font-size:11px; color:#00D68F; margin-bottom:12px; background:rgba(0,214,143,0.06); border:1px solid rgba(0,214,143,0.25); border-radius:8px; padding:8px 10px; line-height:1.4;">
              🛡️ <b>SISTEM 1-DEVICE LOCK:</b><br>
              Akaun MT5 anda dikunci pada peranti ini secara automatik. Perkongsian akaun adalah dilarang.
            </div>

            <form id="traderMt5LoginForm">
              <div class="login-field" style="margin-bottom:10px;">
                <label>No Akaun MT5 Anda</label>
                <div class="login-input-wrap">
                  <input type="text" id="loginTraderMt5" required placeholder="cth: 5100159981" style="font-family:monospace; font-weight:700; color:#00D68F;" />
                </div>
              </div>

              <div class="login-field" style="margin-bottom:12px;">
                <label>Nama / Call-Sign Trader</label>
                <div class="login-input-wrap">
                  <input type="text" id="loginTraderName" required placeholder="cth: Ahmad Fikri" />
                </div>
              </div>

              <div class="login-field" style="margin-bottom:14px;">
                <label style="display:flex; justify-content:space-between; align-items:center;">
                  <span>Kod Jemputan VIP (Invitation Code)</span>
                  <span style="font-size:10px; color:#EF2D3D; font-weight:800;">*WAJIB</span>
                </label>
                <div class="login-input-wrap">
                  <input type="text" id="loginInviteCode" placeholder="cth: AMATERASU-VIP" style="font-family:monospace; font-weight:800; text-transform:uppercase; color:#F5C451; letter-spacing:1px;" />
                </div>
                <small style="font-size:10px; color:#8E9AA8; display:block; margin-top:3px;">
                  *Pengguna baru wajib ada kod jemputan rasmi daripada Admin.
                </small>
              </div>

              <button type="submit" class="btn-login-fire" style="width:100%;">
                <span>⚡</span> Sahkan Peranti & Masuk Terminal
              </button>
            </form>
          </div>

          <!-- Section B: Master Operator Login -->
          <div id="sectionMasterLogin" style="display:none;">
            <div class="login-field">
              <label>Pilih Profil Master</label>
              <div class="login-operator-pills">
                <button type="button" class="operator-chip active" data-call="Tengku Khairi">👑 Tengku Khairi</button>
                <button type="button" class="operator-chip" data-call="kj35 (Master Trader)">⚡ kj35</button>
                <button type="button" class="operator-chip" data-call="Admin">👁️ Admin</button>
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
                <label>Kunci Keselamatan MT5</label>
                <div class="login-input-wrap">
                  <input type="password" id="loginPasscode" value="" required placeholder="Kunci Keselamatan" autocomplete="current-password" />
                </div>
              </div>

              <button type="submit" class="btn-login-fire" id="btnSubmitLogin" style="margin-top:14px;">
                <span>⚡</span> Masuk Terminal Master
              </button>
            </form>
          </div>

          <div style="margin-top:14px; text-align:center; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">
            <span style="font-size:11px; color:#A0A6B4; display:block; margin-bottom:6px;">Belum ada Kod Jemputan VIP?</span>
            <a href="https://wa.me/601123236085?text=Salam%20Admin%20Amaterasu%20X,%20saya%20berminat%20untuk%20dapatkan%20Kod%20Jemputan%20VIP%20Amaterasu%20X." target="_blank" class="btn" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px; background:linear-gradient(135deg, #25D366, #128C7E); color:#FFF; font-weight:800; font-size:11.5px; border-radius:8px; text-decoration:none; box-shadow:0 4px 15px rgba(37,211,102,0.3);">
              <span>💬</span> WhatsApp Admin Untuk Minta Kod (+601123236085)
            </a>
          </div>

          <div style="text-align:center; margin-top:14px; font-size:10.5px; color:#64748B;">
            Sambungan Disulitkan SSL · Polisi 1 Akaun = 1 Peranti
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

    // Switch between Trader MT5 and Master Admin tab
    const tabTrader = $('#tabModeTrader', overlay);
    const tabMaster = $('#tabModeMaster', overlay);
    const secTrader = $('#sectionTraderLogin', overlay);
    const secMaster = $('#sectionMasterLogin', overlay);

    if (tabTrader && tabMaster) {
      tabTrader.onclick = () => {
        tabTrader.style.background = '#EF2D3D';
        tabTrader.style.color = '#FFF';
        tabMaster.style.background = 'transparent';
        tabMaster.style.color = '#A0A6B4';
        secTrader.style.display = 'block';
        secMaster.style.display = 'none';
      };
      tabMaster.onclick = () => {
        tabMaster.style.background = '#EF2D3D';
        tabMaster.style.color = '#FFF';
        tabTrader.style.background = 'transparent';
        tabTrader.style.color = '#A0A6B4';
        secMaster.style.display = 'block';
        secTrader.style.display = 'none';
      };
    }

    // Trader MT5 Form Submit
    const traderForm = $('#traderMt5LoginForm', overlay);
    if (traderForm) {
      traderForm.onsubmit = async (e) => {
        e.preventDefault();
        const mt5Acc = ($('#loginTraderMt5', overlay).value || '').trim();
        const traderName = ($('#loginTraderName', overlay).value || '').trim();
        const devId = getOrCreateDeviceId();
        const devModel = navigator.userAgentData?.platform || navigator.platform || "Web Browser";

        toast('Mengesahkan peranti dan Kod Jemputan...');
        try {
          const inviteCode = ($('#loginInviteCode', overlay)?.value || '').trim();
          const res = await fetch(`/api/trader/verify-pass?mt5=${encodeURIComponent(mt5Acc)}&user=${encodeURIComponent(traderName)}&deviceId=${encodeURIComponent(devId)}&deviceModel=${encodeURIComponent(devModel)}&inviteCode=${encodeURIComponent(inviteCode)}`);
          const data = await res.json();

          if (data.deviceBlocked) {
            overlay.remove();
            showDeviceBlockedModal(data);
            return;
          }

          if (data.accessDenied || data.inviteRequired) {
            overlay.remove();
            showAccessDeniedModal(data);
            return;
          }

          if (data.found && !data.valid) {
            overlay.remove();
            showExpiredLockModal(data);
            return;
          }

          // Login success!
          localStorage.setItem('ama_mt5', mt5Acc);
          doLogin(traderName);
        } catch(err) {
          toast('Ralat sambungan: ' + err.message);
        }
      };
    }

    // Master Form Submit
    const form = $('#amaterasuLoginForm', overlay);
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const opName = ($('#loginCallSign', overlay).value || 'Tengku Khairi').trim();
        const pass = ($('#loginPasscode', overlay).value || '').trim();
        if (pass !== 'AMATERASU-2026') {
          toast('Kunci Keselamatan Master tidak sah!');
          return;
        }
        doLogin(opName);
      };
    }

    // Guest login removed for private VIP security
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

