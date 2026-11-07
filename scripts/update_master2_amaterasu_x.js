const fs = require('fs');

// 1. UPDATE data/db.json
let db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

if (db.copytrade2) {
  db.copytrade2.name = "Amaterasu X";
  db.copytrade2.avatar = "img/amaterasux.png";
}
if (Array.isArray(db.copytrades) && db.copytrades[1]) {
  db.copytrades[1].name = "Amaterasu X";
  db.copytrades[1].avatar = "img/amaterasux.png";
}

fs.writeFileSync('data/db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('[OK] data/db.json updated for Amaterasu X Master 2');

// 2. UPDATE server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/name:\s*"The Mighty Duck II"/g, 'name: "Amaterasu X"');
serverJs = serverJs.replace(
  /copytrade2:\s*\{[\s\S]*?name:\s*"Amaterasu X"[\s\S]*?avatar:\s*"img\/themightyduck\.png"/g,
  (m) => m.replace('"img/themightyduck.png"', '"img/amaterasux.png"')
);
// In sync-mt5 handler for 5100207348
serverJs = serverJs.replace(
  /if\s*\(!db\.copytrade2\)\s*\{[\s\S]*?avatar:\s*"img\/themightyduck\.png"/g,
  (m) => m.replace('"img/themightyduck.png"', '"img/amaterasux.png"')
);

fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('[OK] server.js updated for Amaterasu X Master 2');

// 3. UPDATE js/pages-main.js
let pagesMain = fs.readFileSync('js/pages-main.js', 'utf8');

// Update cp2 in getCopytradeCardHTML
pagesMain = pagesMain.replace(
  /name:\s*"The Mighty Duck II",\s*avatar:\s*"img\/themightyduck\.png"/g,
  `name: "Amaterasu X",\n    avatar: "img/amaterasux.png"`
);

// Update button tabs: Master 1 (🦆 The Mighty Duck) & Master 2 (🔥 Amaterasu X)
pagesMain = pagesMain.replace(
  /<span>🦆<\/span>\s*Master 2\s*\(#5100207348\)/g,
  '<span>🔥</span> Amaterasu X (#5100207348)'
);
pagesMain = pagesMain.replace(
  /<span>🦆<\/span>\s*Master 1\s*\(#5100154135\)/g,
  '<span>🦆</span> The Mighty Duck (#5100154135)'
);

// Update avatar & styling in card header for Master 2
const oldCardHeader = `<div style="display:flex; align-items:center; gap:10px;">
          <img src="img/themightyduck.png" alt="The Mighty Duck" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #00e676; box-shadow:0 0 12px rgba(0,230,118,0.45);" />
          <div>
            <b style="font-size:13.5px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">\${cp.name || (isV2 ? 'THE MIGHTY DUCK II' : 'THE MIGHTY DUCK')}</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">MASTER LIVE #\${cp.masterAccount || (isV2 ? '5100207348' : '5100154135')} · VERSUS TRADE LTD</span>
          </div>
        </div>
        <span style="background:rgba(0,230,118,0.15); border:1px solid #00e676; color:#00e676; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
          <span style="width:6px; height:6px; background:#00e676; border-radius:50%; display:inline-block; animation:pulseDot 1.2s infinite;"></span> \${isV2 ? 'MASTER 2 (LIVE & ACTIVE)' : 'MASTER 1 (VERIFIED)'}
        </span>`;

const newCardHeader = `<div style="display:flex; align-items:center; gap:10px;">
          <img src="\${cp.avatar || (isV2 ? 'img/amaterasux.png' : 'img/themightyduck.png')}" alt="\${cp.name || 'Master'}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid \${isV2 ? '#ff3d00' : '#00e676'}; box-shadow:0 0 14px \${isV2 ? 'rgba(255,61,0,0.5)' : 'rgba(0,230,118,0.45)'};" />
          <div>
            <b style="font-size:13.5px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">\${cp.name || (isV2 ? 'AMATERASU X' : 'THE MIGHTY DUCK')}</b>
            <span style="font-size:10px; color:#94a3b8; display:block;">MASTER LIVE #\${cp.masterAccount || (isV2 ? '5100207348' : '5100154135')} · VERSUS TRADE LTD</span>
          </div>
        </div>
        <span style="background:\${isV2 ? 'rgba(255,61,0,0.15)' : 'rgba(0,230,118,0.15)'}; border:1px solid \${isV2 ? '#ff3d00' : '#00e676'}; color:\${isV2 ? '#ff6e40' : '#00e676'}; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
          <span style="width:6px; height:6px; background:\${isV2 ? '#ff3d00' : '#00e676'}; border-radius:50%; display:inline-block; animation:pulseDot 1.2s infinite;"></span> \${isV2 ? 'MASTER 2 (AMATERASU X)' : 'MASTER 1 (THE MIGHTY DUCK)'}
        </span>`;

pagesMain = pagesMain.replace(oldCardHeader.replace(/\r\n/g, '\n'), () => newCardHeader);
pagesMain = pagesMain.replace(oldCardHeader.replace(/\n/g, '\r\n'), () => newCardHeader);

// Update dropdown in showCopytradeModal
pagesMain = pagesMain.replace(
  '🦆 The Mighty Duck II - Master 2 (#5100207348 · Fresh 10,000 USC Pool)',
  '🔥 Amaterasu X - Master 2 (#5100207348 · Fresh 10,000 USC Pool)'
);

fs.writeFileSync('js/pages-main.js', pagesMain, 'utf8');
console.log('[OK] js/pages-main.js updated for Amaterasu X Master 2');
