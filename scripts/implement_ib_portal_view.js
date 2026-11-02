const fs = require('fs');
const path = require('path');

const crmJsFile = path.join(__dirname, '..', 'crm.js');
let code = fs.readFileSync(crmJsFile, 'utf8');

if (!code.includes('const isIbPortalMode =')) {
  const portalModeLogic = `
// 🏢 Detect IB Partner Portal Mode via URL query: ?ib=CODE
const urlQuery = new URLSearchParams(window.location.search);
const lockedIbCode = urlQuery.get('ib') || '';
const isIbPortalMode = !!lockedIbCode;
if (isIbPortalMode) {
  currentSelectedIb = lockedIbCode;
}
`;
  code = code.replace("let currentSelectedIb = 'all';", "let currentSelectedIb = 'all';\n" + portalModeLogic);

  // In renderIbNetwork, enforce IB Portal Mode
  const targetSummary = '  // Summary counts\n  const totalIbs = ibs.length;';
  const customSummary = `  // Summary counts
  let relevantTraders = traders;
  if (isIbPortalMode) {
    relevantTraders = traders.filter(t => t.ibCode === lockedIbCode || t.ibId === lockedIbCode);
  }
  const totalIbs = isIbPortalMode ? 1 : ibs.length;
  const totalTraders = relevantTraders.length;
  const activeTraders = relevantTraders.filter(t => t.status === 'active').length;
  const expiringTraders = relevantTraders.filter(t => t.status === 'expiring' || t.status === 'expired' || t.status === 'locked').length;`;

  code = code.replace(targetSummary, customSummary);

  // If in IB portal mode, customize title and hide Add IB button
  const targetIbSelect = '  // Populate IB select dropdowns\n  const ibFilterSelect = $(\'#ibFilterSelect\');';
  const customIbSelect = `  // If in IB Portal Mode, update UI headers and restrictions
  if (isIbPortalMode) {
    const currentIbObj = ibs.find(i => i.code === lockedIbCode || i.id === lockedIbCode);
    const ibTitleName = currentIbObj ? currentIbObj.name : lockedIbCode;
    if ($('#pageTitle')) $('#pageTitle').textContent = '🏢 Portal Rakan Kongsi IB: ' + ibTitleName;
    if ($('#pageSub')) $('#pageSub').textContent = 'Pantau client trader anda, semak baki pas 14-hari, perbaharui lesen, dan reset peranti.';
    if ($('#btnOpenAddIbModal')) $('#btnOpenAddIbModal').style.display = 'none';
    
    // Hide master admin specific nav items if in IB Portal Mode
    $$('.nav-item').forEach(nav => {
      const tab = nav.dataset.tab;
      if (['signals', 'analysis', 'screener', 'classes', 'feedback', 'contest', 'users', 'telegram'].includes(tab)) {
        nav.style.display = 'none';
      }
    });
  }

  // Populate IB select dropdowns
  const ibFilterSelect = $('#ibFilterSelect');`;

  code = code.replace(targetIbSelect, customIbSelect);

  // Also auto-switch to ib-network tab on startup if in IB portal mode
  const bootTarget = 'loadData();';
  const bootIbSwitch = `loadData();
if (isIbPortalMode) {
  setTimeout(() => {
    const ibNav = $('[data-tab="ib-network"]');
    if (ibNav) ibNav.click();
  }, 300);
}`;
  code = code.replace(bootTarget, bootIbSwitch);

  fs.writeFileSync(crmJsFile, code, 'utf8');
  console.log('Successfully added IB Partner Portal Mode to crm.js!');
}
