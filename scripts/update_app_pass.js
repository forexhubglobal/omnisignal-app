const fs = require('fs');
const path = require('path');

// 1. Update index.html
const indexHtmlFile = path.join(__dirname, '..', 'index.html');
let indexHtml = fs.readFileSync(indexHtmlFile, 'utf8');

if (!indexHtml.includes('id="passPillBadge"')) {
  const targetUserbar = '<div style="display:flex; align-items:center; gap:12px;">';
  const passBadgeHtml = `<div style="display:flex; align-items:center; gap:10px;">
        <!-- 14-Day Performance Pass Pill -->
        <div id="passPillBadge" style="cursor:pointer;" title="Klik untuk maklumat Pas 14-Hari">
          <span style="background:rgba(0,214,143,0.15); border:1px solid #00D68F; color:#00D68F; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">
            <span>🟢</span> 14-Day Pass
          </span>
        </div>`;
  indexHtml = indexHtml.replace(targetUserbar, passBadgeHtml);
  fs.writeFileSync(indexHtmlFile, indexHtml, 'utf8');
  console.log('Successfully added passPillBadge to index.html');
}

// 2. Update js/app.js
const appJsFile = path.join(__dirname, '..', 'js', 'app.js');
let appJs = fs.readFileSync(appJsFile, 'utf8');

if (!appJs.includes('function checkTraderPass()')) {
  const passCheckCode = `
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
      const res = await fetch(\`/api/trader/verify-pass?user=\${encodeURIComponent(currentUser)}\`);
      const data = await res.json();
      
      if (badge) {
        if (data.isMaster) {
          badge.innerHTML = \`<span style="background:rgba(212,175,55,0.15); border:1px solid #E5C158; color:#E5C158; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">👑 Master VIP</span>\`;
        } else if (data.valid) {
          const color = data.daysRemaining <= 3 ? '#E5C158' : '#00D68F';
          const dot = data.daysRemaining <= 3 ? '🟡' : '🟢';
          const label = data.daysRemaining <= 3 ? \`\${dot} \${data.daysRemaining} Hari (Tamat Segera)\` : \`\${dot} \${data.daysRemaining} Hari Baki\`;
          badge.innerHTML = \`<span style="background:\${color}22; border:1px solid \${color}; color:\${color}; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">\${label}</span>\`;
        } else {
          badge.innerHTML = \`<span style="background:rgba(239,45,61,0.2); border:1px solid #EF2D3D; color:#EF2D3D; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">🔴 Pas Tamat</span>\`;
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

    modal(\`
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:32px; margin-bottom:6px;">\${isMaster ? '👑' : (days > 3 ? '🟢' : (days > 0 ? '🟡' : '🔴'))}</div>
        <h3 style="font-size:17px; color:#FFF; margin-bottom:4px;">\${isMaster ? 'Master VIP Infinite Pass' : 'Amaterasu 14-Day Performance Pass'}</h3>
        <p style="font-size:12px; color:#A0A6B4;">\${isMaster ? 'Akses tanpa had ke semua kluster isyarat & telemetri AI' : 'Kitaran akses 14 hari bersyarat baki modal & lot dagangan MT5'}</p>
      </div>

      \${!isMaster ? \`
        <div style="background:#0F1722; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <span style="color:#A0A6B4;">Rangkaian IB:</span>
            <b style="color:#E5C158;">\${esc(ibName)}</b>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <span style="color:#A0A6B4;">Baki Tempoh Pas:</span>
            <b style="color:\${days > 3 ? '#00D68F' : (days > 0 ? '#E5C158' : '#EF2D3D')};">\${days} Hari Lagi</b>
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

        <a href="https://wa.me/\${ibPhone.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent('Salam sejahtera IB ' + ibName + ', saya ingin memohon pembaharuan Pas 14-Hari Amaterasu X untuk akaun MT5 saya.')}" target="_blank" class="btn btn-primary full" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; font-weight:700; background:linear-gradient(135deg, #00D68F, #00A36C); color:#080D14; border:none; text-decoration:none;">
          📲 Hubungi IB di WhatsApp
        </a>
      \` : \`
        <div style="background:#0F1722; border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:14px; text-align:center; color:#E5C158; font-size:13px; font-weight:700;">
          Akaun Operator Utama Disahkan · Semua Mod Auto &amp; CRM Aktif
        </div>
      \`}
    \`);
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

    overlay.innerHTML = \`
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

        <a href="https://wa.me/\${ibPhone.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent('Salam IB ' + ibName + ', pas 14-hari Amaterasu X saya telah tamat. Saya telah aktif trade di MT5, mohon perbaharui pas saya.')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:linear-gradient(135deg, #EF2D3D, #FF6D00); color:#FFF; font-weight:800; border-radius:10px; font-size:13px; text-decoration:none; margin-bottom:12px; box-shadow:0 4px 15px rgba(239,45,61,0.4);">
          📲 Hubungi IB (\${esc(ibName)}) di WhatsApp
        </a>

        <button type="button" onclick="location.reload()" style="background:transparent; border:1px solid rgba(255,255,255,0.12); color:#A0A6B4; font-size:11px; padding:8px 16px; border-radius:8px; cursor:pointer;">
          🔄 Saya Dah Renew, Semak Semula
        </button>
      </div>
    \`;

    document.body.appendChild(overlay);
  }
`;

  appJs = appJs.replace('function init() {', passCheckCode + '\nfunction init() {');
  appJs = appJs.replace('route();\n      AppState.initSSE();', 'route();\n      AppState.initSSE();\n      checkTraderPass();');
  appJs = appJs.replace('if (onSuccess) onSuccess();', 'if (onSuccess) onSuccess();\n      checkTraderPass();');

  fs.writeFileSync(appJsFile, appJs, 'utf8');
  console.log('Successfully added checkTraderPass and modals to js/app.js');
}
