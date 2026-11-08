const fs = require('fs');

let c = fs.readFileSync('js/core.js', 'utf8');

const oldListener = `      s.addEventListener('copytrade_update', e => {
        try {
          const cp = JSON.parse(e.data);
          this.copytrade = cp;
          document.querySelectorAll('.cp-growth-val, #cpGrowthVal').forEach(el => {
            el.textContent = \`+\${cp.growthPct || 122.55}%\`;
          });
          document.querySelectorAll('.cp-equity-val, #cpEquityVal').forEach(el => {
            el.textContent = \`\${num(cp.currentEquity || 2254.62)} USC\`;
          });
          document.querySelectorAll('.cp-net-val, #cpNetProfitVal').forEach(el => {
            el.textContent = \`+\${num(cp.allTimeProfitUsc || cp.netProfitUsc || 12254.62)} USC\`;
          });
        } catch (err) {}
      });`;

const newListener = `      s.addEventListener('copytrade_update', e => {
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

c = c.replace(oldListener.replace(/\r\n/g, '\n'), () => newListener);
c = c.replace(oldListener.replace(/\n/g, '\r\n'), () => newListener);

fs.writeFileSync('js/core.js', c, 'utf8');
console.log('[OK] js/core.js SSE listener fixed!');
