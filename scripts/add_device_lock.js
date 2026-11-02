const fs = require('fs');
const path = require('path');

// 1. Update server.js
const serverFile = path.join(__dirname, '..', 'server.js');
let serverCode = fs.readFileSync(serverFile, 'utf8');

// Add reset-device endpoint and update verify-pass
if (!serverCode.includes('/api/traders/reset-device')) {
  const targetRoute = '  // 14.10 GET /api/trader/verify-pass';
  const resetDeviceRoute = `  // 14.11 POST /api/traders/reset-device (Reset device binding for trader)
  if (pathname === '/api/traders/reset-device' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = getDB();
      const trd = (db.traders || []).find(t => t.id === payload.traderId || String(t.mt5Account) === String(payload.mt5Account));
      if (!trd) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Trader not found' }));
      }
      trd.boundDeviceId = null;
      trd.boundDeviceModel = null;
      trd.boundAt = null;
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Kunci peranti untuk ' + trd.name + ' berjaya diset semula!' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

`;
  serverCode = serverCode.replace(targetRoute, resetDeviceRoute + targetRoute);
}

// Update /api/trader/verify-pass logic in server.js
const oldVerifyPassRegex = /\/\/ 14\.10 GET \/api\/trader\/verify-pass[\s\S]*?if \(pathname === '\/api\/trader\/verify-pass' && req\.method === 'GET'\) \{([\s\S]*?)(?=\n  \/\/ ===== Static Files =====)/;

const newVerifyPassLogic = `// 14.10 GET /api/trader/verify-pass (Used by client app to check 14-day validity & 1-device lock)
  if (pathname === '/api/trader/verify-pass' && req.method === 'GET') {
    const db = getDB();
    const query = new URLSearchParams(urlParts[1] || '');
    const id = query.get('id') || '';
    const mt5 = query.get('mt5') || '';
    const callSign = query.get('user') || '';
    const deviceId = query.get('deviceId') || '';
    const deviceModel = query.get('deviceModel') || 'Mobile/Desktop';

    const isMasterOperator = ['tengku khairi', 'kj35', 'kj35 (master trader)', 'admin', 'sensei hiro'].includes(callSign.toLowerCase().trim());
    if (isMasterOperator) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        isMaster: true,
        valid: true,
        daysRemaining: 999,
        passTitle: 'Master VIP Infinite Pass',
        message: 'Akses Penuh Master Admin'
      }));
    }

    const trd = (db.traders || []).find(t => 
      (id && t.id === id) || 
      (mt5 && String(t.mt5Account) === String(mt5)) || 
      (callSign && ((t.username && t.username.toLowerCase() === callSign.toLowerCase()) || (t.name && t.name.toLowerCase() === callSign.toLowerCase())))
    );

    if (trd) {
      const ib = (db.ibs || []).find(i => i.code === trd.ibCode || i.id === trd.ibId) || { name: 'Amaterasu Partner', phone: '+60123456789' };

      // 🛡️ 1-DEVICE BINDING ENFORCEMENT
      if (deviceId) {
        if (!trd.boundDeviceId) {
          // First device binding
          trd.boundDeviceId = deviceId;
          trd.boundDeviceModel = deviceModel;
          trd.boundAt = new Date().toISOString();
          saveDB(db);
        } else if (trd.boundDeviceId !== deviceId) {
          // Device mismatch: Access blocked!
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            found: true,
            deviceBlocked: true,
            traderName: trd.name,
            mt5Account: trd.mt5Account,
            boundModel: trd.boundDeviceModel || 'Peranti Pertama Anda',
            ib: { name: ib.name, phone: ib.phone, telegram: ib.telegram },
            message: 'Akses Disekat: Akaun MT5 ini telah dikunci pada peranti lain (1 Akaun = 1 Peranti Sahaja). Sila hubungi IB anda untuk set semula peranti jika anda menukar telefon.'
          }));
        }
      }

      const formatted = formatTraderData(trd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        found: true,
        trader: formatted,
        valid: !formatted.isExpired && formatted.status !== 'locked',
        daysRemaining: formatted.daysRemaining,
        ib: { name: ib.name, code: ib.code, phone: ib.phone, telegram: ib.telegram },
        message: formatted.isExpired 
          ? 'Tempoh pas 14-hari anda telah tamat. Sila hubungi IB untuk pembaharuan percuma.' 
          : 'Pas Aktif: Baki ' + formatted.daysRemaining + ' Hari'
      }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      found: false,
      valid: true,
      isTrial: true,
      daysRemaining: 14,
      passTitle: '14-Day Performance Trial',
      message: 'Mod Percubaan 14-Hari'
    }));
  }`;

serverCode = serverCode.replace(oldVerifyPassRegex, newVerifyPassLogic);
fs.writeFileSync(serverFile, serverCode, 'utf8');
console.log('1. server.js updated with 1-Device Lock enforcement & reset endpoint!');

// 2. Update crm.js to show device status and add Reset Device button
const crmJsFile = path.join(__dirname, '..', 'crm.js');
let crmJs = fs.readFileSync(crmJsFile, 'utf8');

if (!crmJs.includes('window.resetTraderDevice')) {
  const resetDeviceJs = `
window.resetTraderDevice = async function(traderId, name) {
  if (!confirm('Set semula kunci peranti untuk ' + name + '?\\n\\nTindakan ini membolehkan trader mendaftarkan telefon/laptop baru.')) return;
  toast('Menetapkan semula peranti...');
  try {
    const res = await fetch('/api/traders/reset-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traderId })
    });
    const d = await res.json();
    if (d.success) {
      toast('✅ ' + d.message);
      loadData();
    } else {
      toast(d.error || 'Gagal set semula peranti');
    }
  } catch(err) {
    toast('Ralat: ' + err.message);
  }
};
`;
  crmJs = crmJs.replace('window.openEditLotModal =', resetDeviceJs + '\nwindow.openEditLotModal =');

  // Add Reset Device button in action row inside renderIbNetwork
  crmJs = crmJs.replace(
    'title="Kemas kini Lot & Modal"',
    'title="Kemas kini Lot & Modal"'
  );
  crmJs = crmJs.replace(
    '<button type="button" class="btn btn-outline" onclick="window.openEditLotModal',
    '<button type="button" class="btn btn-outline" onclick="window.resetTraderDevice(\'${t.id}\', \'${esc(t.name)}\')" title="Set Semula Kunci Peranti" style="padding:4px 6px; font-size:11px; color:#E5C158;">📱 Reset</button>\n            <button type="button" class="btn btn-outline" onclick="window.openEditLotModal'
  );

  fs.writeFileSync(crmJsFile, crmJs, 'utf8');
  console.log('2. crm.js updated with resetTraderDevice button and handler!');
}

// 3. Update js/app.js to send deviceId and handle deviceBlocked error
const appJsFile = path.join(__dirname, '..', 'js', 'app.js');
let appJs = fs.readFileSync(appJsFile, 'utf8');

// Ensure device ID generation helper
if (!appJs.includes('function getOrCreateDeviceId()')) {
  const deviceHelper = `
  // 🛡️ Client Device Fingerprint Helper (1-Device Lock)
  function getOrCreateDeviceId() {
    let devId = localStorage.getItem('ama_device_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('ama_device_id', devId);
    }
    return devId;
  }
`;
  appJs = appJs.replace('// ===== 14-DAY PERFORMANCE PASS & IB ECOSYSTEM =====', '// ===== 14-DAY PERFORMANCE PASS & IB ECOSYSTEM =====' + deviceHelper);
}

// Update checkTraderPass in js/app.js to pass deviceId and catch deviceBlocked
appJs = appJs.replace(
  'const res = await fetch(`/api/trader/verify-pass?user=${encodeURIComponent(currentUser)}`);',
  'const devId = getOrCreateDeviceId();\n      const devModel = navigator.userAgentData?.platform || navigator.platform || "Web Browser";\n      const storedMt5 = localStorage.getItem("ama_mt5") || "";\n      const res = await fetch(`/api/trader/verify-pass?user=${encodeURIComponent(currentUser)}&mt5=${encodeURIComponent(storedMt5)}&deviceId=${encodeURIComponent(devId)}&deviceModel=${encodeURIComponent(devModel)}`);'
);

// Add deviceBlocked handler in checkTraderPass
if (!appJs.includes('showDeviceBlockedModal(data);')) {
  const blockCheckTarget = 'if (!data.isMaster && !data.valid && data.found) {';
  const blockHandler = `if (data.deviceBlocked) {
        showDeviceBlockedModal(data);
        return;
      }
      ` + blockCheckTarget;
  appJs = appJs.replace(blockCheckTarget, blockHandler);
}

// Add showDeviceBlockedModal definition
if (!appJs.includes('function showDeviceBlockedModal(')) {
  const modalDef = `
  function showDeviceBlockedModal(data) {
    const existing = document.getElementById('deviceBlockedOverlay');
    if (existing) existing.remove();

    const ibName = (data.ib && data.ib.name) ? data.ib.name : 'IB Rakan Niaga Anda';
    const ibPhone = (data.ib && data.ib.phone) ? data.ib.phone : '+60123456789';

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

    overlay.innerHTML = \`
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
          Akaun MT5 <b style="color:#00D68F;">#\${esc(data.mt5Account || '')}</b> telah didaftarkan pada peranti lain. Perkongsian akses kepada orang lain adalah <b style="color:#FFF;">dilarang sama sekali</b>.
        </p>

        <div style="background:#07090E; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px; font-size:11.5px; color:#CBD5E1; text-align:left; margin-bottom:20px;">
          💡 <b>Anda baru menukar telefon atau peranti baru?</b><br>
          Sila hubungi IB anda untuk set semula kunci peranti (*Reset Device Binding*).
        </div>

        <a href="https://wa.me/\${ibPhone.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent('Salam IB ' + ibName + ', akaun MT5 #' + (data.mt5Account || '') + ' saya disekat kerana tukar peranti baru. Mohon reset device binding saya di CRM.')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:linear-gradient(135deg, #EF2D3D, #FF6D00); color:#FFF; font-weight:800; border-radius:10px; font-size:13px; text-decoration:none; margin-bottom:12px; box-shadow:0 4px 15px rgba(239,45,61,0.4);">
          📲 WhatsApp IB (\${esc(ibName)}) untuk Reset
        </a>

        <button type="button" onclick="localStorage.removeItem('ama_operator'); localStorage.removeItem('ama_mt5'); location.reload();" style="background:transparent; border:1px solid rgba(255,255,255,0.15); color:#A0A6B4; font-size:11px; padding:8px 16px; border-radius:8px; cursor:pointer;">
          🚪 Log Masuk Guna Akaun Lain
        </button>
      </div>
    \`;

    document.body.appendChild(overlay);
  }
`;
  appJs = appJs.replace('function showExpiredLockModal(data) {', modalDef + '\n  function showExpiredLockModal(data) {');
}

fs.writeFileSync(appJsFile, appJs, 'utf8');
console.log('3. js/app.js updated with getOrCreateDeviceId, deviceBlocked handler, and showDeviceBlockedModal!');
