const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, '..', 'crm.css');
let css = fs.readFileSync(cssFile, 'utf8');

const extraCss = `
/* ===== IB & TRADER NETWORK STYLING ===== */
.filter-pills {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.btn-pill {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pill:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.btn-pill.active {
  color: #fff;
  background: var(--solar-orange);
  border-color: var(--solar-orange);
  box-shadow: 0 2px 8px rgba(239, 45, 61, 0.35);
}

.custom-modal-overlay {
  transition: opacity 0.2s ease-in-out;
}
`;

css += '\n' + extraCss;
fs.writeFileSync(cssFile, css, 'utf8');
console.log('Appended IB styling to crm.css');
