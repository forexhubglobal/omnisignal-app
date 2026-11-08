const fs = require('fs');

let lines = fs.readFileSync('js/core.js', 'utf8').split(/\r?\n/);

const newBlock = [
  "      s.addEventListener('copytrade_update', e => {",
  "        try {",
  "          const raw = JSON.parse(e.data);",
  "          if (raw.copytrade) this.copytrade = raw.copytrade;",
  "          if (raw.copytrade2) this.copytrade2 = raw.copytrade2;",
  "          if (raw.copytrades) this.copytrades = raw.copytrades;",
  "          if (raw.masterAccount === '5100154135') this.copytrade = raw;",
  "          if (raw.masterAccount === '5100207348') this.copytrade2 = raw;",
  "          if (typeof window.refreshCopytradeUI === 'function') {",
  "            window.refreshCopytradeUI();",
  "          }",
  "        } catch (err) {} ",
  "      });"
];

lines.splice(352, 15, ...newBlock);
fs.writeFileSync('js/core.js', lines.join('\r\n'), 'utf8');
console.log('[SUCCESS] Successfully spliced core.js!');
