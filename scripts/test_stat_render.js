const fs = require('fs');

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

// Mock DOM
global.window = {};
global.document = {
  createElement: () => ({ style: {}, appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} },
  addEventListener: () => {}
};
global.$ = () => null;
global.$$ = () => [];
global.pageHead = (title, sub) => `<h2>${title}</h2>`;
global.AppState = {
  signals: db.signals,
  stats: db.stats
};

const pagesCode = fs.readFileSync('js/pages-main.js', 'utf8');
try {
  eval(pagesCode);
  const main = { innerHTML: '' };
  StatPage(main);
  console.log('SUCCESS! Rendered length:', main.innerHTML.length);
  // Check if sigHistoryContainer has cards
  console.log('Contains sig-history-item:', main.innerHTML.includes('sig-history-item'));
  console.log('Contains TOTAL PROFIT:', main.innerHTML.includes('TOTAL PROFIT'));
} catch (e) {
  console.error('ERROR during StatPage execution:', e);
}
