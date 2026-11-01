const fs = require('fs');
const path = require('path');

const crmJsFile = path.join(__dirname, '..', 'crm.js');
let code = fs.readFileSync(crmJsFile, 'utf8');

// 1. Add ibs and traders to initial state
if (!code.includes('ibs: [],')) {
  code = code.replace('feedbacks: []', 'feedbacks: [],\n  ibs: [],\n  traders: []');
}

// 2. Add renderIbNetwork to renderAll
if (!code.includes('renderIbNetwork();')) {
  code = code.replace('renderUsers();', 'renderUsers();\n  renderIbNetwork();');
}

// 3. Add IB SSE listener if not present
if (!code.includes('ib_list_updated')) {
  const sseTarget = "es.addEventListener('stats_reset', e => {";
  const ibSse = `    es.addEventListener('ib_list_updated', e => {
      state.ibs = JSON.parse(e.data);
      renderIbNetwork();
    });
    es.addEventListener('trader_registered', e => {
      loadData();
      toast('Trader baru berjaya didaftarkan dengan 14-Hari Pass!');
    });
    es.addEventListener('trader_extended', e => {
      loadData();
      toast('Pas 14-Hari trader telah diperbaharui!');
    });
`;
  code = code.replace(sseTarget, ibSse + '    ' + sseTarget);
}

// 4. Append IB & Trader Network Logic before // Boot
if (!code.includes('function renderIbNetwork()')) {
  const ibNetworkCode = `
// ===== 14. IB & TRADER NETWORK CLIENT LOGIC =====
let currentTraderFilter = 'all';
let currentTraderSearch = '';
let currentSelectedIb = 'all';

function renderIbNetwork() {
  const ibs = state.ibs || [];
  const traders = state.traders || [];

  // Summary counts
  const totalIbs = ibs.length;
  const totalTraders = traders.length;
  const activeTraders = traders.filter(t => t.status === 'active').length;
  const expiringTraders = traders.filter(t => t.status === 'expiring' || t.status === 'expired' || t.status === 'locked').length;

  if ($('#mTotalIbs')) $('#mTotalIbs').textContent = totalIbs;
  if ($('#mTotalTraders')) $('#mTotalTraders').textContent = totalTraders;
  if ($('#mActiveTraders')) $('#mActiveTraders').textContent = activeTraders;
  if ($('#mExpiringTraders')) $('#mExpiringTraders').textContent = expiringTraders;

  // Populate IB select dropdowns
  const ibFilterSelect = $('#ibFilterSelect');
  if (ibFilterSelect) {
    const prevVal = ibFilterSelect.value || currentSelectedIb;
    ibFilterSelect.innerHTML = '<option value="all">🌐 Semua Rangkaian IB</option>' + 
      ibs.map(ib => \`<option value="\${esc(ib.code)}">\${esc(ib.name)} (\${esc(ib.code)})</option>\`).join('');
    ibFilterSelect.value = prevVal;
  }

  const onboardIbSelect = $('#onboardTrdIbSelect');
  if (onboardIbSelect) {
    onboardIbSelect.innerHTML = ibs.map(ib => 
      \`<option value="\${esc(ib.code)}">\${esc(ib.name)} (Kod: \${esc(ib.code)})</option>\`
    ).join('');
  }

  // Update Referral Link Input
  updateReferralUrl();

  // Filter traders
  let filtered = traders;
  if (currentSelectedIb && currentSelectedIb !== 'all') {
    filtered = filtered.filter(t => t.ibCode === currentSelectedIb || t.ibId === currentSelectedIb);
  }

  if (currentTraderFilter === 'active') {
    filtered = filtered.filter(t => t.status === 'active');
  } else if (currentTraderFilter === 'expiring') {
    filtered = filtered.filter(t => t.status === 'expiring');
  } else if (currentTraderFilter === 'expired') {
    filtered = filtered.filter(t => t.status === 'expired' || t.status === 'locked');
  }

  if (currentTraderSearch) {
    const q = currentTraderSearch.toLowerCase().trim();
    filtered = filtered.filter(t => 
      (t.name && t.name.toLowerCase().includes(q)) || 
      (t.mt5Account && String(t.mt5Account).includes(q)) || 
      (t.phone && t.phone.toLowerCase().includes(q)) ||
      (t.ibCode && t.ibCode.toLowerCase().includes(q))
    );
  }

  // Render Table
  const tbody = $('#tradersTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="7" style="text-align:center; padding:32px 16px; color:#A0A6B4;">
          <div style="font-size:24px; margin-bottom:8px;">🔍</div>
          <b>Tiada Rekod Trader Dijumpai</b>
          <p style="font-size:12px; margin-top:4px; color:#64748B;">Klik butang "+ Onboard Trader" untuk menambah trader baru di bawah rangkaian IB.</p>
        </td>
      </tr>
    \`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const ibInfo = ibs.find(i => i.code === t.ibCode || i.id === t.ibId);
    const ibDisplayName = ibInfo ? ibInfo.name : (t.ibCode || 'Direct');

    let badgeHtml = '';
    if (t.status === 'locked') {
      badgeHtml = '<span style="background:rgba(239,45,61,0.15); border:1px solid #EF2D3D; color:#EF2D3D; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🔒 Dikunci</span>';
    } else if (t.status === 'expired' || t.daysRemaining <= 0) {
      badgeHtml = '<span style="background:rgba(239,45,61,0.15); border:1px solid #EF2D3D; color:#EF2D3D; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🔴 Tamat Tempoh</span>';
    } else if (t.status === 'expiring' || t.daysRemaining <= 3) {
      badgeHtml = \`<span style="background:rgba(229,193,88,0.15); border:1px solid #E5C158; color:#E5C158; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🟡 \${t.daysRemaining} Hari Baki</span>\`;
    } else {
      badgeHtml = \`<span style="background:rgba(0,214,143,0.15); border:1px solid #00D68F; color:#00D68F; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🟢 \${t.daysRemaining} Hari Baki</span>\`;
    }

    return \`
      <tr>
        <td>
          <div style="font-weight:700; color:#FFF; font-size:13px;">\${esc(t.name)}</div>
          <div style="font-size:11px; color:#A0A6B4;">\${esc(t.phone || '-')}</div>
        </td>
        <td>
          <code style="font-weight:700; color:#00D68F; background:#07090E; padding:3px 6px; border-radius:4px; font-size:12px;">\${esc(t.mt5Account)}</code>
        </td>
        <td>
          <span style="background:rgba(255,255,255,0.06); padding:3px 8px; border-radius:4px; font-size:11px; color:#E5C158; font-weight:600;">
            \${esc(ibDisplayName)}
          </span>
        </td>
        <td>\${badgeHtml}</td>
        <td>
          <div style="font-size:12px; font-weight:700; color:#FFF;">\$\${t.depositAmount || 0}</div>
          <div style="font-size:11px; color:#00D68F;">\${t.lastLotChecked || 0} Lot disemak</div>
        </td>
        <td>
          <span style="font-size:11px; color:\${t.status === 'active' ? '#00D68F' : (t.status === 'expiring' ? '#E5C158' : '#EF2D3D')}; font-weight:700;">
            \${t.status ? t.status.toUpperCase() : 'ACTIVE'}
          </span>
          \${t.extensionCount > 0 ? \`<div style="font-size:10px; color:#A0A6B4;">(Renewed \${t.extensionCount}x)</div>\` : ''}
        </td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" onclick="window.extendTraderPass('\${t.id}', '\${esc(t.name)}')" title="Lanjutkan +14 Hari" style="padding:4px 8px; font-size:11px; background:linear-gradient(135deg, #00D68F, #00A36C); border:none; color:#080D14; font-weight:700;">
              ⚡ +14 Hari
            </button>
            <button type="button" class="btn btn-outline" onclick="window.openEditLotModal('\${t.id}', '\${esc(t.name)}', \${t.lastLotChecked || 0}, \${t.depositAmount || 0}, '\${esc(t.notes || '')}')" title="Kemas kini Lot & Modal" style="padding:4px 8px; font-size:11px;">
              📝 Lot
            </button>
            <button type="button" class="btn btn-ghost" onclick="window.toggleTraderLock('\${t.id}')" title="Kunci / Buka Akses" style="padding:4px 8px; font-size:11px; color:\${t.status === 'locked' ? '#00D68F' : '#EF2D3D'};">
              \${t.status === 'locked' ? '🔓 Buka' : '🔒 Kunci'}
            </button>
            <button type="button" class="btn btn-ghost" onclick="window.deleteTrader('\${t.id}', '\${esc(t.name)}')" title="Padam Trader" style="padding:4px 6px; font-size:11px; color:#64748B;">
              ✕
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}

function updateReferralUrl() {
  const input = $('#ibReferralUrlInput');
  if (!input) return;
  const ibCode = currentSelectedIb !== 'all' ? currentSelectedIb : ((state.ibs && state.ibs[0]) ? state.ibs[0].code : 'alpha_fx');
  const origin = window.location.origin || 'https://amaterasu-x.vercel.app';
  input.value = \`\${origin}/?ib=\${ibCode}\`;
}

// Modal Controllers
window.openIbModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
};

window.closeIbModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

// Operation Actions
window.extendTraderPass = async function(traderId, name) {
  if (!confirm(\`Adakah anda pasti mahu memperbaharui Pas 14-Hari untuk \${name}?\\n\\nPastikan trader ini telah disahkan mengekalkan modal dan aktif trade di akaun MT5.\`)) {
    return;
  }
  toast(\`Memperbaharui pas 14-hari untuk \${name}...\`);
  try {
    const res = await fetch('/api/traders/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traderId, days: 14 })
    });
    const d = await res.json();
    if (d.success) {
      toast(\`✅ \${d.message || 'Pas 14-Hari berjaya diperbaharui!'}\`);
      loadData();
    } else {
      toast(d.error || 'Gagal memperbaharui pas');
    }
  } catch (err) {
    toast('Ralat sambungan: ' + err.message);
  }
};

window.toggleTraderLock = async function(traderId) {
  toast('Mengemaskini status kunci trader...');
  try {
    const res = await fetch('/api/traders/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traderId })
    });
    const d = await res.json();
    if (d.success) {
      toast('✅ Status akses berjaya dikemaskini!');
      loadData();
    } else {
      toast(d.error || 'Gagal mengemaskini status');
    }
  } catch (err) {
    toast('Ralat sambungan: ' + err.message);
  }
};

window.deleteTrader = async function(traderId, name) {
  if (!confirm(\`Padam trader \${name} daripada pangkalan data?\`)) return;
  try {
    const res = await fetch('/api/traders/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traderId })
    });
    const d = await res.json();
    if (d.success) {
      toast(\`Trader \${name} berjaya dipadam\`);
      loadData();
    } else {
      toast(d.error || 'Gagal memadam trader');
    }
  } catch (err) {
    toast('Ralat sambungan: ' + err.message);
  }
};

window.openEditLotModal = function(id, name, lot, dep, notes) {
  $('#editLotTraderId').value = id;
  $('#editLotTraderName').value = name;
  $('#editLotVal').value = lot || 0;
  $('#editDepositVal').value = dep || 0;
  $('#editLotNotes').value = notes || '';
  window.openIbModal('modalUpdateLot');
};

// Event Listeners for IB & Trader Network
document.addEventListener('DOMContentLoaded', () => {
  // IB Filter Dropdown
  const ibSelect = $('#ibFilterSelect');
  if (ibSelect) {
    ibSelect.onchange = () => {
      currentSelectedIb = ibSelect.value;
      updateReferralUrl();
      renderIbNetwork();
    };
  }

  // Copy Referral Link Button
  const btnCopy = $('#btnCopyIbReferralLink');
  if (btnCopy) {
    btnCopy.onclick = () => {
      const input = $('#ibReferralUrlInput');
      if (input) {
        navigator.clipboard.writeText(input.value).then(() => {
          toast('✅ Pautan Onboarding IB berjaya disalin!');
        }).catch(() => {
          input.select();
          document.execCommand('copy');
          toast('✅ Pautan Onboarding IB berjaya disalin!');
        });
      }
    };
  }

  // Open Modals
  if ($('#btnOpenAddIbModal')) {
    $('#btnOpenAddIbModal').onclick = () => window.openIbModal('modalAddIb');
  }
  if ($('#btnOpenOnboardTraderModal')) {
    $('#btnOpenOnboardTraderModal').onclick = () => window.openIbModal('modalOnboardTrader');
  }

  // Search Input
  const searchInput = $('#traderSearchInput');
  if (searchInput) {
    searchInput.oninput = () => {
      currentTraderSearch = searchInput.value;
      renderIbNetwork();
    };
  }

  // Filter Pills
  $$('#traderFilterPills .btn-pill').forEach(btn => {
    btn.onclick = () => {
      $$('#traderFilterPills .btn-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTraderFilter = btn.dataset.filter || 'all';
      renderIbNetwork();
    };
  });

  // Form 1: Add IB
  const formAddIb = $('#formAddIb');
  if (formAddIb) {
    formAddIb.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: $('#addIbName').value.trim(),
        code: $('#addIbCode').value.trim(),
        leader: $('#addIbLeader').value.trim(),
        phone: $('#addIbPhone').value.trim(),
        broker: $('#addIbBroker').value.trim(),
        notes: $('#addIbNotes').value.trim()
      };
      toast('Mendaftarkan IB Partner baru...');
      try {
        const res = await fetch('/api/ib/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (d.success) {
          toast('✅ IB Partner baru berjaya didaftarkan!');
          window.closeIbModal('modalAddIb');
          formAddIb.reset();
          currentSelectedIb = d.ib.code;
          loadData();
        } else {
          toast(d.error || 'Gagal mendaftar IB');
        }
      } catch (err) {
        toast('Ralat: ' + err.message);
      }
    };
  }

  // Form 2: Onboard Trader
  const formOnboard = $('#formOnboardTrader');
  if (formOnboard) {
    formOnboard.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: $('#onboardTrdName').value.trim(),
        mt5Account: $('#onboardTrdMt5').value.trim(),
        phone: $('#onboardTrdPhone').value.trim(),
        ibCode: $('#onboardTrdIbSelect').value,
        depositAmount: Number($('#onboardTrdDeposit').value) || 0,
        notes: $('#onboardTrdNotes').value.trim()
      };
      toast('Mengaktifkan 14-Day Performance Pass...');
      try {
        const res = await fetch('/api/traders/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (d.success) {
          toast('✅ Client Trader berjaya di-onboard dengan Pas 14-Hari!');
          window.closeIbModal('modalOnboardTrader');
          formOnboard.reset();
          loadData();
        } else {
          toast(d.error || 'Gagal onboard trader');
        }
      } catch (err) {
        toast('Ralat: ' + err.message);
      }
    };
  }

  // Form 3: Update Lot
  const formUpdateLot = $('#formUpdateLot');
  if (formUpdateLot) {
    formUpdateLot.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        traderId: $('#editLotTraderId').value,
        lastLotChecked: Number($('#editLotVal').value) || 0,
        depositAmount: Number($('#editDepositVal').value) || 0,
        notes: $('#editLotNotes').value.trim()
      };
      toast('Menyimpan data lot MT5...');
      try {
        const res = await fetch('/api/traders/update-lot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (d.success) {
          toast('✅ Maklumat lot & modal berjaya dikemaskini!');
          window.closeIbModal('modalUpdateLot');
          loadData();
        } else {
          toast(d.error || 'Gagal kemas kini maklumat');
        }
      } catch (err) {
        toast('Ralat: ' + err.message);
      }
    };
  }
});
`;

  code = code.replace('// Boot', ibNetworkCode + '\n// Boot');
}

fs.writeFileSync(crmJsFile, code, 'utf8');
console.log('Successfully updated crm.js with IB & Trader Network frontend logic!');
