const fs = require('fs');

let content = fs.readFileSync('js/pages-main.js', 'utf8');

// 1. Add getCopytradeCardHTML and switchCopytradeVault helper before showCopytradeModal
const helperFunctions = `// ===== The Mighty Duck Dual Master Copytrade System =====
window.activeCopytradeVault = 1;

function getCopytradeCardHTML(vaultId = (window.activeCopytradeVault || 1)) {
  const cp1 = (AppState && AppState.copytrade) || {
    id: "master-1",
    name: "The Mighty Duck",
    avatar: "img/themightyduck.png",
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    totalWithdrawn: 10000.0,
    totalWithdrawnUsd: 100.0,
    allTimeProfitUsc: 12254.62,
    allTimeProfitUsd: 122.55,
    growthPct: 122.55,
    currentEquity: 2254.62,
    winRate: 90.4
  };
  const cp2 = (AppState && AppState.copytrade2) || {
    id: "master-2",
    name: "The Mighty Duck II",
    avatar: "img/themightyduck.png",
    masterAccount: "5100207348",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    totalWithdrawn: 0.0,
    totalWithdrawnUsd: 0.0,
    allTimeProfitUsc: 0.0,
    allTimeProfitUsd: 0.0,
    growthPct: 0.00,
    currentEquity: 10000.0,
    winRate: 100.0
  };
  const isV2 = Number(vaultId) === 2;
  const cp = isV2 ? cp2 : cp1;

  return \`
    <div class="copytrade-showcase-card" style="background: linear-gradient(135deg, rgba(8, 13, 20, 0.95) 0%, rgba(20, 30, 48, 0.92) 100%); border: 1.5px solid rgba(0, 230, 118, 0.45); border-radius: 14px; padding: 16px; box-shadow: 0 8px 32px rgba(0, 230, 118, 0.15); position: relative; overflow: hidden;">
      <div style="position:absolute; top:-30px; right:-30px; width:120px; height:120px; background:radial-gradient(circle, rgba(0,230,118,0.2) 0%, transparent 70%); border-radius:50%; pointer-events:none;"></div>
      
      <!-- Vault Selector Tabs -->
      <div style="display:flex; gap:6px; margin-bottom:14px; background:rgba(0,0,0,0.5); padding:4px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
        <button type="button" class="btn-vault-tab \${!isV2 ? 'active' : ''}" onclick="window.switchCopytradeVault(1)" style="flex:1; padding:8px 6px; border-radius:7px; border:none; background:\${!isV2 ? 'rgba(0,230,118,0.22)' : 'transparent'}; border:\${!isV2 ? '1px solid #00e676' : '1px solid transparent'}; color:\${!isV2 ? '#00e676' : '#94a3b8'}; font-weight:800; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.2s;">
          <span>🦆</span> Master 1 (#5100154135)
        </button>
        <button type="button" class="btn-vault-tab \${isV2 ? 'active' : ''}" onclick="window.switchCopytradeVault(2)" style="flex:1; padding:8px 6px; border-radius:7px; border:none; background:\${isV2 ? 'rgba(0,230,118,0.22)' : 'transparent'}; border:\${isV2 ? '1px solid #00e676' : '1px solid transparent'}; color:\${isV2 ? '#00e676' : '#94a3b8'}; font-weight:800; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.2s;">
          <span>🦆</span> Master 2 (#5100207348)
        </button>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="img/themightyduck.png" alt="The Mighty Duck" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #00e676; box-shadow:0 0 12px rgba(0,230,118,0.45);" />
          <div>
            <b style="font-size:13.5px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">\${cp.name || (isV2 ? 'THE MIGHTY DUCK II' : 'THE MIGHTY DUCK')}</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">MASTER LIVE #\${cp.masterAccount || (isV2 ? '5100207348' : '5100154135')} · VERSUS TRADE LTD</span>
          </div>
        </div>
        <span style="background:rgba(0,230,118,0.15); border:1px solid #00e676; color:#00e676; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
          <span style="width:6px; height:6px; background:#00e676; border-radius:50%; display:inline-block; animation:pulseDot 1.2s infinite;"></span> \${isV2 ? 'MASTER 2 (LIVE & ACTIVE)' : 'MASTER 1 (VERIFIED)'}
        </span>
      </div>

      <!-- Growth & All-Time Realized Profit -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
        <div>
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">\${isV2 ? 'STATUS PERTUMBUHAN (GROWTH)' : 'ALL-TIME REALIZED GROWTH (SEBELUM TOLAK WD)'}</span>
          <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
            <span class="cp-growth-val" id="cpGrowthVal" style="font-size:26px; font-weight:900; color:#00e676; font-family:'Space Grotesk',sans-serif; text-shadow:0 0 15px rgba(0,230,118,0.4);">+\${(cp.growthPct || 0).toFixed(2)}%</span>
            <span style="font-size:11px; color:#00e676; font-weight:700;">GROW ▲</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; display:block;">UNTUNG KASAR TERKUMPUL</span>
          <b class="cp-net-val" id="cpNetProfitVal" style="font-size:14px; font-weight:800; color:#f5c451;">+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 0)} USC</b>
          <span style="font-size:10px; color:#94a3b8; display:block;">(+$+\${((cp.allTimeProfitUsd || cp.netProfitUsd || 0)).toFixed(2)} USD)</span>
        </div>
      </div>

      <!-- WITHDRAWAL / STATUS STRIP -->
      \${!isV2 ? \`
      <div style="background:linear-gradient(90deg, rgba(245,196,81,0.15) 0%, rgba(0,230,118,0.1) 100%); border:1px solid rgba(245,196,81,0.4); border-radius:8px; padding:9px 12px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:17px;">💰</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:10px; color:#f5c451; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">TELAH DIKELUARKAN (WITHDRAWAL):</span>
              <b style="font-size:11px; color:#00e676; font-weight:800;">\${num(cp.totalWithdrawn || 10000)} USC ($+\${((cp.totalWithdrawn || 10000) / 100).toFixed(2)} USD ✓)</b>
            </div>
            <span style="font-size:9.5px; color:#cbd5e1; display:block; margin-top:1px;">🛡️ 100% modal asal selamat ditarik balik · Trading risiko sifar</span>
          </div>
        </div>
        <span style="background:rgba(0,230,118,0.2); border:1px solid #00e676; color:#00e676; font-size:9px; font-weight:800; padding:2px 7px; border-radius:12px; white-space:nowrap;">PROFIT TAKEN</span>
      </div>\` : \`
      <div style="background:linear-gradient(90deg, rgba(0,230,118,0.15) 0%, rgba(0,188,212,0.1) 100%); border:1px solid rgba(0,230,118,0.4); border-radius:8px; padding:9px 12px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:17px;">💎</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:10px; color:#00e676; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">AKAUN KEDUA RASMI (FRESH POOL):</span>
              <b style="font-size:11px; color:#00e676; font-weight:800;">\${num(cp.initialDeposit || 10000)} USC ($+\${((cp.initialDeposit || 10000) / 100).toFixed(2)} USD ✓)</b>
            </div>
            <span style="font-size:9.5px; color:#cbd5e1; display:block; margin-top:1px;">🛡️ Multi-Terminal VPS Active · Siap sedia untuk pasaran Isnin 06:00 AM</span>
          </div>
        </div>
        <span style="background:rgba(0,230,118,0.2); border:1px solid #00e676; color:#00e676; font-size:9px; font-weight:800; padding:2px 7px; border-radius:12px; white-space:nowrap;">ACTIVE STANDBY</span>
      </div>\`}

      <!-- 3-Box Breakdown: Modal Asal, Baki Aktif Semasa, Winrate -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">DEPOSIT ASAL</span>
          <b style="font-size:11.5px; color:#fff;">\${num(cp.initialDeposit || 10000)} USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($+\${((cp.initialDeposit || 10000) / 100).toFixed(2)} USD)</span>
        </div>
        <div style="background:rgba(0,230,118,0.06); border:1px solid rgba(0,230,118,0.25); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#00e676; font-weight:700; display:block;">\${!isV2 ? 'BAKI AKTIF (POST-WD)' : 'BAKI AKTIF TERKINI'}</span>
          <b class="cp-equity-val" id="cpEquityVal" style="font-size:11.5px; color:#00e676;">\${num(cp.currentEquity || (isV2 ? 10000 : 2254.62))} USC</b>
          <span style="font-size:9px; color:#8e9aa8; display:block;">($+\${((cp.currentEquity || (isV2 ? 10000 : 2254.62)) / 100).toFixed(2)} USD \${!isV2 ? 'Untung Sahaja' : ''})</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">WINRATE & RISK</span>
          <b style="font-size:11.5px; color:#f5c451;">\${cp.winRate || (isV2 ? 100 : 90.4)}%</b>
          <span style="font-size:9px; color:#00e676; display:block;">Max DD &lt; 5%</span>
        </div>
      </div>

      <button type="button" class="btn gold" id="btnJoinCopytradeModal" onclick="showCopytradeModal(\${vaultId})" style="width:100%; padding:11px; font-weight:800; font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 18px rgba(245,196,81,0.3); text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;">
        <span>🚀 SERTAI COPYTRADE RASMI / BUKA AKAUN</span> ➔
      </button>
    </div>
  \`;
}

window.switchCopytradeVault = function(vaultId) {
  window.activeCopytradeVault = Number(vaultId) || 1;
  document.querySelectorAll('.copytrade-showcase-container').forEach(el => {
    el.innerHTML = getCopytradeCardHTML(window.activeCopytradeVault);
  });
};

window.refreshCopytradeUI = function() {
  document.querySelectorAll('.copytrade-showcase-container').forEach(el => {
    el.innerHTML = getCopytradeCardHTML(window.activeCopytradeVault || 1);
  });
};
`;

const insertTarget = '// ===== Amaterasu Sovereign Copytrade Onboarding Modal =====';
content = content.replace(insertTarget, helperFunctions + '\n' + insertTarget);

// 2. In showCopytradeModal(initialVault = 1):
// update function signature
content = content.replace(
  'function showCopytradeModal() {',
  `function showCopytradeModal(initialVault = (window.activeCopytradeVault || 1)) {`
);

// update form in showCopytradeModal to add Master selection
const oldFormFields = `<form id="formCopytradeJoin" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="cpClientName" placeholder="Nama Penuh Anda" required style="width:100%; padding:9px 12px; background:#0b1118; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px;" />`;

const newFormFields = `<form id="formCopytradeJoin" style="display:flex; flex-direction:column; gap:8px;">
          <div>
            <label style="font-size:10.5px; color:#8e9aa8; display:block; margin-bottom:4px; font-weight:700;">PILIH MASTER COPYTRADE PILIHAN ANDA:</label>
            <select id="cpTargetMaster" style="width:100%; padding:9px 12px; background:#0b1118; border:1px solid rgba(0,230,118,0.4); border-radius:6px; color:#fff; font-size:12px; font-weight:700;">
              <option value="5100154135" \${Number(initialVault) === 1 ? 'selected' : ''}>🦆 The Mighty Duck - Master 1 (#5100154135 · +122.55% All-Time)</option>
              <option value="5100207348" \${Number(initialVault) === 2 ? 'selected' : ''}>🦆 The Mighty Duck II - Master 2 (#5100207348 · Fresh 10,000 USC Pool)</option>
            </select>
          </div>
          <input type="text" id="cpClientName" placeholder="Nama Penuh Anda" required style="width:100%; padding:9px 12px; background:#0b1118; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px;" />`;

content = content.replace(oldFormFields.replace(/\r\n/g, '\n'), () => newFormFields);
content = content.replace(oldFormFields.replace(/\n/g, '\r\n'), () => newFormFields);

// In SignalPage, replace the copytrade card with <div class="copytrade-showcase-container" ...>
const oldSignalCardPattern = /<!-- 🦆 THE MIGHTY DUCK COPYTRADE SHOWCASE CARD -->[\s\S]*?<\/div>\s*<\/div>\s*<button class="btn gold" id="btnJoinCopytradeModal"[\s\S]*?<\/button>\s*<\/div>/;

content = content.replace(oldSignalCardPattern, () => {
  return `<div class="copytrade-showcase-container" id="copytradeShowcaseSignal" style="margin-bottom:14px;">\${getCopytradeCardHTML(window.activeCopytradeVault || 1)}</div>`;
});

// In StatPage, replace the copytrade card with <div class="copytrade-showcase-container" ...>
const oldStatCardPattern = /<!-- 🦆 THE MIGHTY DUCK COPYTRADE SHOWCASE CARD -->[\s\S]*?<\/div>\s*<\/div>\s*<button class="btn gold" id="btnJoinCopytradeModal"[\s\S]*?<\/button>\s*<\/div>/;

content = content.replace(oldStatCardPattern, () => {
  return `<div class="copytrade-showcase-container" id="copytradeShowcaseStat" style="margin-bottom:16px;">\${getCopytradeCardHTML(window.activeCopytradeVault || 1)}</div>`;
});

fs.writeFileSync('js/pages-main.js', content, 'utf8');
console.log('[OK] js/pages-main.js updated with dual master copytrade UI & switching!');
