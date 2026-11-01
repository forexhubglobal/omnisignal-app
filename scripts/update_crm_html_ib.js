const fs = require('fs');
const path = require('path');

const crmHtmlFile = path.join(__dirname, '..', 'crm.html');
let html = fs.readFileSync(crmHtmlFile, 'utf8');

// 1. Add Navigation item in sidebar if not present
if (!html.includes('data-tab="ib-network"')) {
  const targetNav = '<button class="nav-item" data-tab="users">';
  const ibNav = `        <button class="nav-item" data-tab="ib-network">
          <span class="icon">🏢</span> Rangkaian IB & Trader <span class="badge-live" style="background:rgba(212,175,55,0.2); color:#E5C158; border-color:#E5C158;">14-DAY</span>
        </button>
`;
  html = html.replace(targetNav, ibNav + '        ' + targetNav);
}

// 2. Add #tab-ib-network section and modals before #tab-telegram
if (!html.includes('id="tab-ib-network"')) {
  const targetSection = '      <!-- 9. TELEGRAM VIP AUTO-BROADCAST TAB -->';
  const ibSection = `      <!-- 8B. RANGKAIAN IB & TRADER (14-DAY PERFORMANCE PASS ECOSYSTEM) -->
      <section class="tab-pane" id="tab-ib-network">
        <!-- Summary Metric Cards -->
        <div class="metric-grid" style="margin-bottom: 20px;">
          <div class="metric-card">
            <span class="m-label">Rangkaian IB Berdaftar</span>
            <div class="m-val" id="mTotalIbs" style="color:var(--solar-gold);">0</div>
            <span class="m-sub">Rakan Kongsi Aktif</span>
          </div>
          <div class="metric-card">
            <span class="m-label">Total Trader Onboard</span>
            <div class="m-val" id="mTotalTraders" style="color:#FFF;">0</div>
            <span class="m-sub">Di Bawah Rangkaian IB</span>
          </div>
          <div class="metric-card">
            <span class="m-label">Trader Aktif (14-Hari)</span>
            <div class="m-val" id="mActiveTraders" style="color:var(--bull);">0</div>
            <span class="m-sub"><span class="dot-online"></span> Pas Sah &amp; Berjalan</span>
          </div>
          <div class="metric-card">
            <span class="m-label">Perlu Semakan / Tamat</span>
            <div class="m-val" id="mExpiringTraders" style="color:#EF2D3D;">0</div>
            <span class="m-sub">Semak Lot &amp; Baki Modal</span>
          </div>
        </div>

        <!-- Action & Referral Link Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
            <div style="flex:1; min-width:280px;">
              <label class="m-label" style="display:block; margin-bottom:6px;">Pilih Rangkaian IB</label>
              <div style="display:flex; gap:10px;">
                <select id="ibFilterSelect" style="flex:1;">
                  <option value="all">🌐 Semua Rangkaian IB</option>
                </select>
                <button type="button" class="btn btn-outline" id="btnOpenAddIbModal" style="white-space:nowrap; padding:8px 12px; font-size:12px;">
                  + Daftar IB
                </button>
              </div>
            </div>

            <div style="flex:1.5; min-width:320px;">
              <label class="m-label" style="display:block; margin-bottom:6px;">Pautan Onboarding Trader (Referral Link)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="ibReferralUrlInput" readonly value="https://amaterasu-x.vercel.app/?ib=alpha_fx" style="font-family:monospace; font-size:12px; background:#07090E; color:#00D68F;" />
                <button type="button" class="btn btn-primary" id="btnCopyIbReferralLink" style="white-space:nowrap; padding:8px 14px; font-size:12px;">
                  📋 Salin Link
                </button>
              </div>
            </div>

            <div>
              <label class="m-label" style="display:block; margin-bottom:6px;">Tindakan</label>
              <button type="button" class="btn btn-primary" id="btnOpenOnboardTraderModal" style="background:linear-gradient(135deg, #EF2D3D, #FF6D00); border:none; padding:10px 18px; font-weight:700;">
                ⚡ + Onboard Trader (14-Hari)
              </button>
            </div>
          </div>
        </div>

        <!-- Trader Roster Table Card -->
        <div class="card">
          <div class="card-head" style="flex-wrap:wrap; gap:12px;">
            <div>
              <h3>📋 Senarai Client Trader (14-Day Performance Pass)</h3>
              <small class="muted">Trader diperbaharui 14 hari percuma selagi mengekalkan modal dan aktif trade di MT5.</small>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <input type="text" id="traderSearchInput" placeholder="Cari nama / MT5 / tel..." style="width:200px; padding:6px 12px; font-size:12px;" />
              <div class="filter-pills" id="traderFilterPills" style="display:flex; gap:6px;">
                <button type="button" class="btn-pill active" data-filter="all">Semua</button>
                <button type="button" class="btn-pill" data-filter="active">🟢 Aktif</button>
                <button type="button" class="btn-pill" data-filter="expiring">🟡 Tamat Segera</button>
                <button type="button" class="btn-pill" data-filter="expired">🔴 Tamat</button>
              </div>
            </div>
          </div>

          <div class="table-wrap">
            <table class="crm-table" id="tradersTable">
              <thead>
                <tr>
                  <th>Trader / Call-Sign</th>
                  <th>Akaun MT5</th>
                  <th>IB Rujukan</th>
                  <th>Baki Tempoh Pas</th>
                  <th>Modal &amp; Lot</th>
                  <th>Status</th>
                  <th>Tindakan Operasi</th>
                </tr>
              </thead>
              <tbody id="tradersTableBody">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- MODALS FOR IB & TRADER -->
      <div id="ibModalsContainer">
        <!-- Modal 1: Add IB -->
        <div id="modalAddIb" class="custom-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:16px;">
          <div style="background:#0F1722; border:1px solid rgba(239,45,61,0.4); border-radius:14px; width:100%; max-width:480px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
              <h3 style="color:#FFF; font-size:16px; display:flex; align-items:center; gap:8px;">
                <span>🏢</span> Daftar IB Partner Baru
              </h3>
              <button type="button" onclick="closeIbModal('modalAddIb')" style="color:#A0A6B4; font-size:20px; line-height:1;">&times;</button>
            </div>
            <form id="formAddIb">
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Nama Kumpulan / IB Partner</label>
                <input type="text" id="addIbName" placeholder="cth: Team King FX" required />
              </div>
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Kod Unik IB (Untuk Referral Link)</label>
                <input type="text" id="addIbCode" placeholder="cth: king_fx" required style="font-family:monospace;" />
                <small class="muted">Link onboarding: amaterasu-x.vercel.app/?ib=king_fx</small>
              </div>
              <div style="display:flex; gap:10px; margin-bottom:12px;">
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">Ketua / Leader</label>
                  <input type="text" id="addIbLeader" placeholder="cth: Cikgu Sham" />
                </div>
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">No Telefon / WhatsApp</label>
                  <input type="text" id="addIbPhone" placeholder="cth: +60123456789" />
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Broker Rakan Niaga</label>
                <input type="text" id="addIbBroker" value="Versus Trade Ltd" />
              </div>
              <div style="margin-bottom:16px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Catatan / Terma</label>
                <input type="text" id="addIbNotes" placeholder="cth: Minima $100 cent, rebat 40%" />
              </div>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-ghost" onclick="closeIbModal('modalAddIb')" style="flex:1;">Batal</button>
                <button type="submit" class="btn btn-primary" style="flex:1;">Simpan &amp; Jana Kod</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal 2: Onboard Trader -->
        <div id="modalOnboardTrader" class="custom-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:16px;">
          <div style="background:#0F1722; border:1px solid rgba(0,214,143,0.4); border-radius:14px; width:100%; max-width:480px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
              <h3 style="color:#FFF; font-size:16px; display:flex; align-items:center; gap:8px;">
                <span>⚡</span> Onboard Client Trader (14-Hari Pass)
              </h3>
              <button type="button" onclick="closeIbModal('modalOnboardTrader')" style="color:#A0A6B4; font-size:20px; line-height:1;">&times;</button>
            </div>
            <form id="formOnboardTrader">
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Nama Penuh Trader</label>
                <input type="text" id="onboardTrdName" placeholder="cth: Khairul Azman" required />
              </div>
              <div style="display:flex; gap:10px; margin-bottom:12px;">
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">No Akaun MT5</label>
                  <input type="text" id="onboardTrdMt5" placeholder="cth: 5100159999" required style="font-family:monospace; font-weight:700; color:#00D68F;" />
                </div>
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">No Telefon / WhatsApp</label>
                  <input type="text" id="onboardTrdPhone" placeholder="cth: +60171234567" />
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Pilih Rangkaian IB</label>
                <select id="onboardTrdIbSelect" required></select>
              </div>
              <div style="display:flex; gap:10px; margin-bottom:12px;">
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">Modal Deposit Awal ($)</label>
                  <input type="number" id="onboardTrdDeposit" placeholder="100" value="100" />
                </div>
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">Tempoh Pas</label>
                  <input type="text" value="14 Hari (Auto-Active)" readonly style="background:#07090E; color:#E5C158;" />
                </div>
              </div>
              <div style="margin-bottom:16px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Catatan (Pilihan)</label>
                <input type="text" id="onboardTrdNotes" placeholder="cth: Akaun cent disahkan, register under link IB" />
              </div>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-ghost" onclick="closeIbModal('modalOnboardTrader')" style="flex:1;">Batal</button>
                <button type="submit" class="btn btn-primary" style="flex:1; background:linear-gradient(135deg, #00D68F, #00A36C); border:none; color:#080D14; font-weight:700;">
                  Aktifkan 14-Hari Pas
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal 3: Update Lot / Notes -->
        <div id="modalUpdateLot" class="custom-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:16px;">
          <div style="background:#0F1722; border:1px solid rgba(255,255,255,0.15); border-radius:14px; width:100%; max-width:440px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
              <h3 style="color:#FFF; font-size:16px; display:flex; align-items:center; gap:8px;">
                <span>📝</span> Kemas Kini Lot &amp; Modal MT5
              </h3>
              <button type="button" onclick="closeIbModal('modalUpdateLot')" style="color:#A0A6B4; font-size:20px; line-height:1;">&times;</button>
            </div>
            <form id="formUpdateLot">
              <input type="hidden" id="editLotTraderId" />
              <div style="margin-bottom:12px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Trader</label>
                <input type="text" id="editLotTraderName" readonly style="background:#07090E; font-weight:700;" />
              </div>
              <div style="display:flex; gap:10px; margin-bottom:12px;">
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">Jumlah Lot Terkini</label>
                  <input type="number" step="0.01" id="editLotVal" placeholder="1.25" required style="font-family:monospace; color:#00D68F; font-weight:700;" />
                </div>
                <div style="flex:1;">
                  <label class="m-label" style="display:block; margin-bottom:4px;">Baki Modal ($)</label>
                  <input type="number" step="1" id="editDepositVal" placeholder="100" />
                </div>
              </div>
              <div style="margin-bottom:16px;">
                <label class="m-label" style="display:block; margin-bottom:4px;">Catatan Pengesahan</label>
                <input type="text" id="editLotNotes" placeholder="cth: Lot disahkan di portal broker" />
              </div>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-ghost" onclick="closeIbModal('modalUpdateLot')" style="flex:1;">Batal</button>
                <button type="submit" class="btn btn-primary" style="flex:1;">Simpan Maklumat</button>
              </div>
            </form>
          </div>
        </div>
      </div>
`;
  html = html.replace(targetSection, ibSection + '\n' + targetSection);
}

fs.writeFileSync(crmHtmlFile, html, 'utf8');
console.log('Successfully updated crm.html with IB & Trader Network tab and modals!');
