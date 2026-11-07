const fs = require('fs');

// 1. Update js/core.js
let coreJs = fs.readFileSync('js/core.js', 'utf8');
const oldCoreSSE = `          document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
            el.textContent = \`+\${cp.growthPct || 83.03}%\`;
          });
          document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
            el.textContent = \`\${num(cp.currentEquity || 18302.79)} USC\`;
          });
          document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
            el.textContent = \`+\${num(cp.netProfitUsc || 8302.79)} USC\`;
          });`;

const newCoreSSE = `          document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
            el.textContent = \`+\${cp.growthPct || 122.55}%\`;
          });
          document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
            el.textContent = \`\${num(cp.currentEquity || 2254.62)} USC\`;
          });
          document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
            el.textContent = \`+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 12254.62)} USC\`;
          });`;

coreJs = coreJs.replace(oldCoreSSE.replace(/\r\n/g, '\n'), () => newCoreSSE);
coreJs = coreJs.replace(oldCoreSSE.replace(/\n/g, '\r\n'), () => newCoreSSE);
fs.writeFileSync('js/core.js', coreJs, 'utf8');
console.log('js/core.js updated!');

// 2. Update js/pages-more.js
let pagesMoreJs = fs.readFileSync('js/pages-more.js', 'utf8');
pagesMoreJs = pagesMoreJs.replace(/83\.03/g, '122.55');
fs.writeFileSync('js/pages-more.js', pagesMoreJs, 'utf8');
console.log('js/pages-more.js updated!');

// 3. Update js/pages-main.js
let pagesMainJs = fs.readFileSync('js/pages-main.js', 'utf8');

// Replace copytrade defaults in showCopytradeModal (line 439)
const oldModalDefault = `  const cp = (AppState && AppState.copytrade) || {
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    growthPct: 64.79,
    currentEquity: 16478.53,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
  };`;

const newModalDefault = `  const cp = (AppState && AppState.copytrade) || {
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    growthPct: 122.55,
    allTimeGrowthPct: 122.55,
    allTimeProfitUsc: 12254.62,
    allTimeProfitUsd: 122.55,
    totalWithdrawn: 10000.0,
    totalWithdrawnUsd: 100.0,
    initialDeposit: 10000.0,
    currentBalance: 2254.62,
    currentEquity: 2254.62,
    activeEquity: 2254.62,
    winRate: 90.4,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
  };`;

pagesMainJs = pagesMainJs.replace(oldModalDefault.replace(/\r\n/g, '\n'), () => newModalDefault);
pagesMainJs = pagesMainJs.replace(oldModalDefault.replace(/\n/g, '\r\n'), () => newModalDefault);

// Replace Quick Master Proof Banner in showCopytradeModal
const oldModalBanner = `      <!-- Quick Master Proof Banner -->
      <div style="background:linear-gradient(135deg, rgba(0,230,118,0.14) 0%, rgba(11,17,24,0.95) 100%); border:1px solid rgba(0,230,118,0.35); border-radius:10px; padding:12px 14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase;">REKOD AKAUN MASTER</span>
            <b style="font-size:13px; color:#fff; display:block;">#\${cp.masterAccount || '5100154135'} (Versus Trade Live)</b>
          </div>
          <div style="text-align:right;">
            <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase;">TOTAL GROW</span>
            <b style="font-size:16px; color:#00e676; font-weight:900;">+\${cp.growthPct || 64.79}% 📈</b>
          </div>
        </div>
      </div>`;

const newModalBanner = `      <!-- Quick Master Proof Banner -->
      <div style="background:linear-gradient(135deg, rgba(0,230,118,0.14) 0%, rgba(11,17,24,0.95) 100%); border:1px solid rgba(0,230,118,0.35); border-radius:10px; padding:12px 14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase;">REKOD AKAUN MASTER</span>
            <b style="font-size:13px; color:#fff; display:block;">#\${cp.masterAccount || '5100154135'} (Versus Trade Live)</b>
            <span style="font-size:10px; color:#f5c451; font-weight:700;">💰 Telah Withdraw: 10,000 USC ($100 USD)</span>
          </div>
          <div style="text-align:right;">
            <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase;">TOTAL GROW</span>
            <b style="font-size:18px; color:#00e676; font-weight:900;">+\${cp.growthPct || 122.55}% 📈</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 12254.62)} USC</span>
          </div>
        </div>
      </div>`;

pagesMainJs = pagesMainJs.replace(oldModalBanner.replace(/\r\n/g, '\n'), () => newModalBanner);
pagesMainJs = pagesMainJs.replace(oldModalBanner.replace(/\n/g, '\r\n'), () => newModalBanner);

// Replace SignalPage default object (line 579)
const oldSigCp = `  const cp = (AppState && AppState.copytrade) || {
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    currentBalance: 16466.53,
    currentEquity: 16478.53,
    growthPct: 64.79,
    netProfitUsc: 6478.53,
    netProfitUsd: 64.79,
    winRate: 89.2,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
  };`;

const newSigCp = `  const cp = (AppState && AppState.copytrade) || {
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    totalWithdrawn: 10000.0,
    totalWithdrawnUsd: 100.00,
    allTimeProfitUsc: 12254.62,
    allTimeProfitUsd: 122.55,
    allTimeGrowthPct: 122.55,
    growthPct: 122.55,
    netProfitUsc: 12254.62,
    netProfitUsd: 122.55,
    currentBalance: 2254.62,
    currentEquity: 2254.62,
    activeEquity: 2254.62,
    activeEquityUsd: 22.55,
    winRate: 90.4,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
  };`;

pagesMainJs = pagesMainJs.replace(oldSigCp.replace(/\r\n/g, '\n'), () => newSigCp);
pagesMainJs = pagesMainJs.replace(oldSigCp.replace(/\n/g, '\r\n'), () => newSigCp);

// Replace StatPage default object (line 1983)
const oldStatCp = `  const cp = (AppState && AppState.copytrade) || {
    masterAccount: "5100154135",
    broker: "Versus Trade Ltd. (Live1)",
    initialDeposit: 10000.0,
    currentBalance: 16466.53,
    currentEquity: 16478.53,
    growthPct: 64.79,
    netProfitUsc: 6478.53,
    netProfitUsd: 64.79,
    winRate: 89.2,
    maxDrawdown: 4.8,
    status: "LIVE & ACTIVE",
    copiersCount: 42,
    affiliateLink: "https://one.versustrade.link/links/go/14490?pid=31255"
  };`;

pagesMainJs = pagesMainJs.replace(oldStatCp.replace(/\r\n/g, '\n'), () => newSigCp);
pagesMainJs = pagesMainJs.replace(oldStatCp.replace(/\n/g, '\r\n'), () => newSigCp);

// Target old card layout in both SignalPage and StatPage
const oldCardBlock = `      <div style="display:flex; justify-content:space-between; align-items:flex-end; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:12px;">
        <div>
          <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">JUMLAH PERTUMBUHAN (REAL GROWTH)</span>
          <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
            <span class="cp-growth-val" id="cpGrowthVal" style="font-size:26px; font-weight:900; color:#00e676; font-family:'Space Grotesk',sans-serif; text-shadow:0 0 15px rgba(0,230,118,0.4);">+\${cp.growthPct || 83.03}%</span>
            <span style="font-size:11px; color:#00e676; font-weight:700;">GROW ▲</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; display:block;">UNTUNG BERSIH</span>
          <b class="cp-net-val" id="cpNetProfitVal" style="font-size:14px; font-weight:800; color:#f5c451;">+\${num(cp.netProfitUsc || 8302.79)} USC</b>
          <span style="font-size:10px; color:#94a3b8; display:block;">(+$+\${(cp.netProfitUsd || 83.03).toFixed(2)} USD)</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">DEPOSIT ASAL</span>
          <b style="font-size:11.5px; color:#fff;">10,000 USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($100 USD)</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">EKUITI SEMASA</span>
          <b class="cp-equity-val" id="cpEquityVal" style="font-size:11.5px; color:#00e676;">\${num(cp.currentEquity || 18302.79)} USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($+\${((cp.currentEquity || 18302.79) / 100).toFixed(2)} USD)</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">WINRATE & RISK</span>
          <b style="font-size:11.5px; color:#f5c451;">\${cp.winRate || 90.4}%</b>
          <span style="font-size:9px; color:#00e676; display:block;">Max DD &lt; 5%</span>
        </div>
      </div>`;

const newCardBlock = `      <!-- Growth & All-Time Realized Profit (Sebelum Tolak Withdraw) -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
        <div>
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">ALL-TIME REALIZED GROWTH (SEBELUM TOLAK WD)</span>
          <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
            <span class="cp-growth-val" id="cpGrowthVal" style="font-size:26px; font-weight:900; color:#00e676; font-family:'Space Grotesk',sans-serif; text-shadow:0 0 15px rgba(0,230,118,0.4);">+\${cp.growthPct || 122.55}%</span>
            <span style="font-size:11px; color:#00e676; font-weight:700;">GROW ▲</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:9.5px; color:#8e9aa8; text-transform:uppercase; display:block;">UNTUNG KASAR TERKUMPUL</span>
          <b class="cp-net-val" id="cpNetProfitVal" style="font-size:14px; font-weight:800; color:#f5c451;">+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 12254.62)} USC</b>
          <span style="font-size:10px; color:#94a3b8; display:block;">(+$+\${((cp.allTimeProfitUsd || cp.netProfitUsd || 122.55)).toFixed(2)} USD)</span>
        </div>
      </div>

      <!-- 💰 BUKTI PENGELUARAN KE BANK (WITHDRAWAL STRIP) -->
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
      </div>

      <!-- 3-Box Breakdown: Modal Asal, Baki Aktif Semasa, Winrate -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">DEPOSIT ASAL</span>
          <b style="font-size:11.5px; color:#fff;">\${num(cp.initialDeposit || 10000)} USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($+\${((cp.initialDeposit || 10000) / 100).toFixed(2)} USD)</span>
        </div>
        <div style="background:rgba(0,230,118,0.06); border:1px solid rgba(0,230,118,0.25); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#00e676; font-weight:700; display:block;">BAKI AKTIF (POST-WD)</span>
          <b class="cp-equity-val" id="cpEquityVal" style="font-size:11.5px; color:#00e676;">\${num(cp.currentEquity || 2254.62)} USC</b>
          <span style="font-size:9px; color:#8e9aa8; display:block;">($+\${((cp.currentEquity || 2254.62) / 100).toFixed(2)} USD Untung Sahaja)</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9px; color:#8e9aa8; display:block;">WINRATE & RISK</span>
          <b style="font-size:11.5px; color:#f5c451;">\${cp.winRate || 90.4}%</b>
          <span style="font-size:9px; color:#00e676; display:block;">Max DD &lt; 5%</span>
        </div>
      </div>`;

// Replace in SignalPage
pagesMainJs = pagesMainJs.replace(oldCardBlock.replace(/\r\n/g, '\n'), () => newCardBlock);
pagesMainJs = pagesMainJs.replace(oldCardBlock.replace(/\n/g, '\r\n'), () => newCardBlock);

// In StatPage, the growth val element didn't have id="cpGrowthVal", let's handle StatPage specifically
const oldStatCardBlock = `      <div style="display:flex; justify-content:space-between; align-items:flex-end; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; margin-bottom:12px;">
        <div>
          <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; letter-spacing:0.5px; display:block;">JUMLAH PERTUMBUHAN (REAL GROWTH)</span>
          <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
            <span class="cp-growth-val" style="font-size:26px; font-weight:900; color:#00e676; font-family:'Space Grotesk',sans-serif; text-shadow:0 0 15px rgba(0,230,118,0.4);">+\${cp.growthPct || 83.03}%</span>
            <span style="font-size:11px; color:#00e676; font-weight:700;">GROW ▲</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; color:#8e9aa8; text-transform:uppercase; display:block;">UNTUNG BERSIH</span>
          <b class="cp-net-val" style="font-size:14px; font-weight:800; color:#f5c451;">+\${num(cp.netProfitUsc || 8302.79)} USC</b>
          <span style="font-size:10px; color:#94a3b8; display:block;">(+$+\${(cp.netProfitUsd || 83.03).toFixed(2)} USD)</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">DEPOSIT ASAL</span>
          <b style="font-size:11.5px; color:#fff;">10,000 USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($100 USD)</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">EKUITI SEMASA</span>
          <b class="cp-equity-val" style="font-size:11.5px; color:#00e676;">\${num(cp.currentEquity || 18302.79)} USC</b>
          <span style="font-size:9px; color:#64748b; display:block;">($+\${((cp.currentEquity || 18302.79) / 100).toFixed(2)} USD)</span>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:8px 4px;">
          <span style="font-size:9.5px; color:#8e9aa8; display:block;">WINRATE & RISK</span>
          <b style="font-size:11.5px; color:#f5c451;">\${cp.winRate || 90.4}%</b>
          <span style="font-size:9px; color:#00e676; display:block;">Max DD &lt; 5%</span>
        </div>
      </div>`;

pagesMainJs = pagesMainJs.replace(oldStatCardBlock.replace(/\r\n/g, '\n'), () => newCardBlock);
pagesMainJs = pagesMainJs.replace(oldStatCardBlock.replace(/\n/g, '\r\n'), () => newCardBlock);

fs.writeFileSync('js/pages-main.js', pagesMainJs, 'utf8');
console.log('js/pages-main.js updated!');
