const fs = require('fs');
const path = require('path');

const crmJsFile = path.join(__dirname, '..', 'crm.js');
let code = fs.readFileSync(crmJsFile, 'utf8');

const dupBlock = `  const totalTraders = traders.length;
  const activeTraders = traders.filter(t => t.status === 'active').length;
  const expiringTraders = traders.filter(t => t.status === 'expiring' || t.status === 'expired' || t.status === 'locked').length;`;

if (code.includes(dupBlock)) {
  code = code.replace(dupBlock, '');
  fs.writeFileSync(crmJsFile, code, 'utf8');
  console.log('Successfully removed duplicate declarations from crm.js');
} else {
  console.log('Duplicate block not found directly');
}
