const fs = require('fs');

// 1. UPDATE data/db.json
let db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

db.copytrade2 = {
  id: "master-2",
  name: "Amaterasu X",
  avatar: "img/amaterasux.png",
  masterAccount: "5100207348",
  broker: "Versus Trade Ltd. (Live1)",
  initialDeposit: 10000.0,
  totalWithdrawn: 0.0,
  totalWithdrawnUsd: 0.0,
  allTimeProfitUsc: 0.0,
  allTimeProfitUsd: 0.0,
  allTimeGrowthPct: 0.0,
  growthPct: 0.0,
  netProfitUsc: 0.0,
  netProfitUsd: 0.0,
  currentBalance: 10000.0,
  currentEquity: 10000.0,
  activeEquity: 10000.0,
  activeEquityUsd: 100.0,
  winRate: 100.0,
  maxDrawdown: 0.0,
  status: "LIVE & ACTIVE",
  badge: "VAULT 2 (FRESH POOL - BARU START)",
  copiersCount: 18,
  affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255",
  lastSync: "2026-11-08 08:08:00"
};

db.copytrades = [db.copytrade, db.copytrade2];
fs.writeFileSync('data/db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('[OK] data/db.json copytrade2 reset to fresh 0.00% gain & 10,000 USC equity');

// 2. UPDATE js/core.js: Stop blind DOM overwrite of Master 1 into Master 2
let coreJs = fs.readFileSync('js/core.js', 'utf8');

const oldCoreSSE = `      s.addEventListener('copytrade_update', e => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.copytrade) {
            this.copytrade = raw.copytrade;
            if (raw.copytrade2) this.copytrade2 = raw.copytrade2;
            if (raw.copytrades) this.copytrades = raw.copytrades;
          } else {
            this.copytrade = raw;
          }
          if (typeof window.refreshCopytradeUI === 'function') {
            window.refreshCopytradeUI();
          } else {
            document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
              el.textContent = \`+\${this.copytrade.growthPct || 122.55}%\`;
            });
            document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
              el.textContent = \`\${num(this.copytrade.currentEquity || 2254.62)} USC\`;
            });
            document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
              el.textContent = \`+\${num(this.copytrade.allTimeProfitUsc || this.copytrade.netProfitUsc || 12254.62)} USC\`;
            });
          }
        } catch (err) {}
      });`;

const newCoreSSE = `      s.addEventListener('copytrade_update', e => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.copytrade) this.copytrade = raw.copytrade;
          if (raw.copytrade2) this.copytrade2 = raw.copytrade2;
          if (raw.copytrades) this.copytrades = raw.copytrades;
          
          if (raw.masterAccount === '5100154135') {
            this.copytrade = raw;
          } else if (raw.masterAccount === '5100207348') {
            this.copytrade2 = raw;
          } else if (!raw.copytrade && !raw.copytrade2 && !raw.masterAccount) {
            this.copytrade = raw;
          }

          if (typeof window.refreshCopytradeUI === 'function') {
            window.refreshCopytradeUI();
          }
        } catch (err) {}
      });`;

coreJs = coreJs.replace(oldCoreSSE.replace(/\r\n/g, '\n'), () => newCoreSSE);
coreJs = coreJs.replace(oldCoreSSE.replace(/\n/g, '\r\n'), () => newCoreSSE);

fs.writeFileSync('js/core.js', coreJs, 'utf8');
console.log('[OK] js/core.js isolated listener updated!');

// 3. UPDATE js/pages-main.js getCopytradeCardHTML
let pagesMain = fs.readFileSync('js/pages-main.js', 'utf8');

const oldCardFn = `function getCopytradeCardHTML(vaultId = (window.activeCopytradeVault || 1)) {
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
    name: "Amaterasu X",
    avatar: "img/amaterasux.png",
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
          <span>🦆</span> The Mighty Duck (#5100154135)
        </button>
        <button type="button" class="btn-vault-tab \${isV2 ? 'active' : ''}" onclick="window.switchCopytradeVault(2)" style="flex:1; padding:8px 6px; border-radius:7px; border:none; background:\${isV2 ? 'rgba(0,230,118,0.22)' : 'transparent'}; border:\${isV2 ? '1px solid #00e676' : '1px solid transparent'}; color:\${isV2 ? '#00e676' : '#94a3b8'}; font-weight:800; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.2s;">
          <span>🔥</span> Amaterasu X (#5100207348)
        </button>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="\${cp.avatar || (isV2 ? 'img/amaterasux.png' : 'img/themightyduck.png')}" alt="\${cp.name || 'Master'}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid \${isV2 ? '#ff3d00' : '#00e676'}; box-shadow:0 0 14px \${isV2 ? 'rgba(255,61,0,0.5)' : 'rgba(0,230,118,0.45)'};" />
          <div>
            <b style="font-size:13.5px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">\${cp.name || (isV2 ? 'AMATERASU X' : 'THE MIGHTY DUCK')}</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">MASTER LIVE #\${cp.masterAccount || (isV2 ? '5100207348' : '5100154135')} · VERSUS TRADE LTD</span>
          </div>
        </div>
        <span style="background:\${isV2 ? 'rgba(255,61,0,0.15)' : 'rgba(0,230,118,0.15)'}; border:1px solid \${isV2 ? '#ff3d00' : '#00e676'}; color:\${isV2 ? '#ff6e40' : '#00e676'}; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
          <span style="width:6px; height:6px; background:\${isV2 ? '#ff3d00' : '#00e676'}; border-radius:50%; display:inline-block; animation:pulseDot 1.2s infinite;"></span> \${isV2 ? 'MASTER 2 (AMATERASU X)' : 'MASTER 1 (THE MIGHTY DUCK)'}
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
}`;

const newCardFn = `function getCopytradeCardHTML(vaultId = (window.activeCopytradeVault || 1)) {
  const isV2 = Number(vaultId) === 2;

  // STRICT SEPARATION: Master 1 (The Mighty Duck) vs Master 2 (Amaterasu X)
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
    name: "Amaterasu X",
    avatar: "img/amaterasux.png",
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

  // Dedicated data per vault (ZERO cross-contamination)
  const cp = isV2 ? {
    name: "AMATERASU X",
    avatar: "img/amaterasux.png",
    masterAccount: "5100207348",
    growthPct: (cp2 && typeof cp2.growthPct === 'number') ? cp2.growthPct : 0.00,
    netProfitUsc: (cp2 && typeof cp2.netProfitUsc === 'number') ? cp2.netProfitUsc : 0.00,
    netProfitUsd: (cp2 && typeof cp2.netProfitUsd === 'number') ? cp2.netProfitUsd : 0.00,
    allTimeProfitUsc: (cp2 && typeof cp2.allTimeProfitUsc === 'number') ? cp2.allTimeProfitUsc : 0.00,
    allTimeProfitUsd: (cp2 && typeof cp2.allTimeProfitUsd === 'number') ? cp2.allTimeProfitUsd : 0.00,
    initialDeposit: 10000.0,
    currentEquity: (cp2 && typeof cp2.currentEquity === 'number') ? cp2.currentEquity : 10000.0,
    totalWithdrawn: 0.0,
    winRate: 100.0
  } : {
    name: "THE MIGHTY DUCK",
    avatar: "img/themightyduck.png",
    masterAccount: "5100154135",
    growthPct: (cp1 && typeof cp1.growthPct === 'number') ? cp1.growthPct : 122.55,
    netProfitUsc: (cp1 && typeof cp1.netProfitUsc === 'number') ? cp1.netProfitUsc : 12254.62,
    netProfitUsd: (cp1 && typeof cp1.netProfitUsd === 'number') ? cp1.netProfitUsd : 122.55,
    allTimeProfitUsc: (cp1 && typeof cp1.allTimeProfitUsc === 'number') ? cp1.allTimeProfitUsc : 12254.62,
    allTimeProfitUsd: (cp1 && typeof cp1.allTimeProfitUsd === 'number') ? cp1.allTimeProfitUsd : 122.55,
    initialDeposit: 10000.0,
    currentEquity: (cp1 && typeof cp1.currentEquity === 'number') ? cp1.currentEquity : 2254.62,
    totalWithdrawn: 10000.0,
    winRate: 90.4
  };

  return \`
    <div class="copytrade-showcase-card" style="background: linear-gradient(135deg, rgba(8, 13, 20, 0.95) 0%, rgba(20, 30, 48, 0.92) 100%); border: 1.5px solid \${isV2 ? 'rgba(255, 61, 0, 0.5)' : 'rgba(0, 230, 118, 0.45)'}; border-radius: 14px; padding: 16px; box-shadow: 0 8px 32px \${isV2 ? 'rgba(255, 61, 0, 0.2)' : 'rgba(0, 230, 118, 0.15)'}; position: relative; overflow: hidden;">
      <div style="position:absolute; top:-30px; right:-30px; width:120px; height:120px; background:radial-gradient(circle, \${isV2 ? 'rgba(255,61,0,0.25)' : 'rgba(0,230,118,0.2)'} 0%, transparent 70%); border-radius:50%; pointer-events:none;"></div>
      
      <!-- Vault Selector Tabs -->
      <div style="display:flex; gap:6px; margin-bottom:14px; background:rgba(0,0,0,0.5); padding:4px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
        <button type="button" class="btn-vault-tab \${!isV2 ? 'active' : ''}" onclick="window.switchCopytradeVault(1)" style="flex:1; padding:8px 6px; border-radius:7px; border:none; background:\${!isV2 ? 'rgba(0,230,118,0.22)' : 'transparent'}; border:\${!isV2 ? '1px solid #00e676' : '1px solid transparent'}; color:\${!isV2 ? '#00e676' : '#94a3b8'}; font-weight:800; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.2s;">
          <span>🦆</span> The Mighty Duck (#5100154135)
        </button>
        <button type="button" class="btn-vault-tab \${isV2 ? 'active' : ''}" onclick="window.switchCopytradeVault(2)" style="flex:1; padding:8px 6px; border-radius:7px; border:none; background:\${isV2 ? 'rgba(255,61,0,0.25)' : 'transparent'}; border:\${isV2 ? '1px solid #ff3d00' : '1px solid transparent'}; color:\${isV2 ? '#ff6e40' : '#94a3b8'}; font-weight:800; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.2s;">
          <span>🔥</span> Amaterasu X (#5100207348)
        </button>
      </div>

      <!-- Card Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="\${cp.avatar}" alt="\${cp.name}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid \${isV2 ? '#ff3d00' : '#00e676'}; box-shadow:0 0 14px \${isV2 ? 'rgba(255,61,0,0.5)' : 'rgba(0,230,118,0.45)'};" />
          <div>
            <b style="font-size:13.5px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">\${cp.name}</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">MASTER LIVE #\${cp.masterAccount} · VERSUS TRADE LTD</span>
          </div>
        </div>
        <span style="background:\${isV2 ? 'rgba(255,61,0,0.15)' : 'rgba(0,230,118,0.15)'}; border:1px solid \${isV2 ? '#ff3d00' : '#00e676'}; color:\${isV2 ? '#ff6e40' : '#00e676'}; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
          <span style="width:6px; height:6px; background:\${isV2 ? '#ff3d00' : '#00e676'}; border-radius:50%; display:inline-block; animation:pulseDot 1.2s infinite;"></span> \${isV2 ? 'MASTER 2 (BARU START)' : 'MASTER 1 (VERIFIED LIVE)'}
        </span>
      </div>

      <!-- Growth & Realized Profit Box -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
        <div>
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">\${isV2 ? 'PRESTASI PERTUMBUHAN (BARU MULA)' : 'ALL-TIME REALIZED GROWTH (SEBELUM TOLAK WD)'}</span>
          <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
            <span style="font-size:26px; font-weight:900; color:\${isV2 ? '#f5c451' : '#00e676'}; font-family:'Space Grotesk',sans-serif; text-shadow:0 0 15px \${isV2 ? 'rgba(245,196,81,0.4)' : 'rgba(0,230,118,0.4)'};">+\${Number(cp.growthPct).toFixed(2)}%</span>
            <span style="font-size:11px; color:\${isV2 ? '#f5c451' : '#00e676'}; font-weight:700;">\${isV2 ? 'READY ▲' : 'GROW ▲'}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; display:block;">UNTUNG KASAR TERKUMPUL</span>
          <b style="font-size:14px; font-weight:800; color:#f5c451;">+\${num(cp.allTimeProfitUsc)} USC</b>
          <span style="font-size:10px; color:#94a3b8; display:block;">(+$+\${Number(cp.allTimeProfitUsd).toFixed(2)} USD)</span>
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
              <b style="font-size:11px; color:#00e676; font-weight:800;">\${num(cp.totalWithdrawn)} USC ($+\${(cp.totalWithdrawn / 100).toFixed(2)} USD ✓)</b>
            </div>
            <span style="font-size:9.5px; color:#cbd5e1; display:block; margin-top:1px;">🛡️ 100% modal asal selamat ditarik balik · Trading risiko sifar</span>
          </div>
        </div>
        <span style="background:rgba(0,230,118,0.2); border:1px solid #00e676; color:#00e676; font-size:9px; font-weight:800; padding:2px 7px; border-radius:12px; white-space:nowrap;">PROFIT TAKEN</span>
      </div>\` : \`
      <div style="background:linear-gradient(90deg, rgba(255,61,0,0.15) 0%, rgba(245,196,81,0.1) 100%); border:1px solid rgba(255,61,0,0.4); border-radius:8px; padding:9px 12px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:17px;">💎</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:10px; color:#ff6e40; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">AKAUN KEDUA (FRESH POOL - BARU START):</span>
              <b style="font-size:11px; color:#00e676; font-weight:800;">\${num(cp.initialDeposit)} USC ($+\${(cp.initialDeposit / 100).toFixed(2)} USD ✓)</b>
            </div>
            <span style="font-size:9.5px; color:#cbd5e1; display:block; margin-top:1px;">🛡️ Multi-Terminal VPS Active · Siap sedia untuk trade market Isnin 06:00 AM</span>
          </div>
        </div>
        <span style="background:rgba(255,61,0,0.2); border:1px solid #ff3d00; color:#ff6e40; font-size:9px; font-weight:800; padding:2px 7px; border-radius:12px; white-space:nowrap;">FRESH STANDBY</span>
      </div>\`}

      <!-- 3-Box Breakdown: Modal Asal, Baki Aktif Semasa, Winrate -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">DEPOSIT ASAL</span>
          <b style="font-size:11.5px; color:#fff;">\${num(cp.initialDeposit)} USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($+\${(cp.initialDeposit / 100).toFixed(2)} USD)</span>
        </div>
        <div style="background:rgba(0,230,118,0.06); border:1px solid rgba(0,230,118,0.25); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#00e676; font-weight:700; display:block;">\${!isV2 ? 'BAKI AKTIF (POST-WD)' : 'BAKI AKTIF TERKINI'}</span>
          <b style="font-size:11.5px; color:#00e676;">\${num(cp.currentEquity)} USC</b>
          <span style="font-size:9px; color:#8e9aa8; display:block;">($+\${(cp.currentEquity / 100).toFixed(2)} USD \${!isV2 ? 'Untung Sahaja' : 'Modal Penuh'})</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">WINRATE & RISK</span>
          <b style="font-size:11.5px; color:#f5c451;">\${cp.winRate}%</b>
          <span style="font-size:9px; color:#00e676; display:block;">\${isV2 ? 'Fresh Account' : 'Max DD < 5%'}</span>
        </div>
      </div>

      <button type="button" class="btn gold" id="btnJoinCopytradeModal" onclick="showCopytradeModal(\${vaultId})" style="width:100%; padding:11px; font-weight:800; font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px; box-shadow:0 4px 18px rgba(245,196,81,0.3); text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;">
        <span>🚀 SERTAI COPYTRADE RASMI / BUKA AKAUN</span> ➔
      </button>
    </div>
  \`;
}`;

pagesMain = pagesMain.replace(oldCardFn.replace(/\r\n/g, '\n'), () => newCardFn);
pagesMain = pagesMain.replace(oldCardFn.replace(/\n/g, '\r\n'), () => newCardFn);

fs.writeFileSync('js/pages-main.js', pagesMain, 'utf8');
console.log('[OK] js/pages-main.js getCopytradeCardHTML cleanly isolated per vault!');
