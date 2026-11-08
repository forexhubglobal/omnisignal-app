const fs = require('fs');

let c = fs.readFileSync('js/pages-main.js', 'utf8');

const regex = /<!-- 🦆 THE MIGHTY DUCK COPYTRADE SHOWCASE CARD -->[\s\S]*?(?=<!-- 1\. Total Profit Dynamic Card -->)/;

if (regex.test(c)) {
  c = c.replace(
    regex,
    '<div class="copytrade-showcase-container" id="copytradeShowcaseStat" style="margin-bottom:16px;">${getCopytradeCardHTML(window.activeCopytradeVault || 1)}</div>\n\n    '
  );
  fs.writeFileSync('js/pages-main.js', c, 'utf8');
  console.log('[SUCCESS] Successfully replaced copytrade card in StatPage!');
} else {
  console.log('[ERROR] Regex did not match');
}
