const fs = require('fs');
const path = require('path');

const appJsFile = path.join(__dirname, '..', 'js', 'app.js');
let appJs = fs.readFileSync(appJsFile, 'utf8');

const oldModalHtmlRegex = /<div class="login-body">[\s\S]*?<\/div>\s*<\/div>\s*`;\s*document\.body\.appendChild\(overlay\);/;

const newModalHtml = `<div class="login-body">
          <div style="display:flex; background:rgba(255,255,255,0.04); border-radius:10px; padding:3px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.08);">
            <button type="button" id="tabModeTrader" style="flex:1; padding:8px; font-size:11.5px; font-weight:700; border-radius:8px; background:#EF2D3D; color:#FFF; border:none; cursor:pointer;">
              👤 Trader MT5
            </button>
            <button type="button" id="tabModeMaster" style="flex:1; padding:8px; font-size:11.5px; font-weight:700; border-radius:8px; background:transparent; color:#A0A6B4; border:none; cursor:pointer;">
              👑 Master Admin
            </button>
          </div>

          <!-- Section A: Client Trader MT5 Login -->
          <div id="sectionTraderLogin">
            <div style="font-size:11px; color:#00D68F; margin-bottom:12px; background:rgba(0,214,143,0.06); border:1px solid rgba(0,214,143,0.25); border-radius:8px; padding:8px 10px; line-height:1.4;">
              🛡️ <b>SISTEM 1-DEVICE LOCK:</b><br>
              Akaun MT5 anda dikunci pada peranti ini secara automatik. Perkongsian akaun adalah dilarang.
            </div>

            <form id="traderMt5LoginForm">
              <div class="login-field" style="margin-bottom:10px;">
                <label>No Akaun MT5 Anda</label>
                <div class="login-input-wrap">
                  <input type="text" id="loginTraderMt5" required placeholder="cth: 5100159981" style="font-family:monospace; font-weight:700; color:#00D68F;" />
                </div>
              </div>

              <div class="login-field" style="margin-bottom:14px;">
                <label>Nama / Call-Sign Trader</label>
                <div class="login-input-wrap">
                  <input type="text" id="loginTraderName" required placeholder="cth: Ahmad Fikri" />
                </div>
              </div>

              <button type="submit" class="btn-login-fire" style="width:100%;">
                <span>⚡</span> Sahkan Peranti & Masuk Terminal
              </button>
            </form>
          </div>

          <!-- Section B: Master Operator Login -->
          <div id="sectionMasterLogin" style="display:none;">
            <div class="login-field">
              <label>Pilih Profil Master</label>
              <div class="login-operator-pills">
                <button type="button" class="operator-chip active" data-call="Tengku Khairi">👑 Tengku Khairi</button>
                <button type="button" class="operator-chip" data-call="kj35 (Master Trader)">⚡ kj35</button>
                <button type="button" class="operator-chip" data-call="Admin">👁️ Admin</button>
              </div>
            </div>

            <form id="amaterasuLoginForm">
              <div class="login-field">
                <label>Operator Call-Sign</label>
                <div class="login-input-wrap">
                  <input type="text" id="loginCallSign" value="\${esc(currentOp)}" required placeholder="cth: Tengku Khairi" autocomplete="username" />
                </div>
              </div>

              <div class="login-field">
                <label>Kunci Keselamatan MT5</label>
                <div class="login-input-wrap">
                  <input type="password" id="loginPasscode" value="AMATERASU-2026" required placeholder="Kunci Keselamatan" autocomplete="current-password" />
                </div>
              </div>

              <button type="submit" class="btn-login-fire" id="btnSubmitLogin" style="margin-top:14px;">
                <span>⚡</span> Masuk Terminal Master
              </button>
            </form>
          </div>

          <button type="button" class="btn btn-outline" id="btnGuestLogin" style="width:100%; margin-top:10px; padding:9px; font-size:11px; font-weight:700; border-color:rgba(255,255,255,0.12); color:#A0A6B4;">
            <span>👁️</span> Masuk Sebagai Tetamu (Demo 14-Hari)
          </button>

          <div style="text-align:center; margin-top:14px; font-size:10.5px; color:#64748B;">
            Sambungan Disulitkan SSL · Polisi 1 Akaun = 1 Peranti
          </div>
        </div>
      </div>
    \`;

    document.body.appendChild(overlay);`;

appJs = appJs.replace(oldModalHtmlRegex, newModalHtml);

// Add tab switching and trader login form submission handling
const oldFormHandlerRegex = /const form = \$\('#amaterasuLoginForm', overlay\);[\s\S]*?if \(guestBtn\) \{[\s\S]*?\}/;

const newFormHandler = `// Switch between Trader MT5 and Master Admin tab
    const tabTrader = $('#tabModeTrader', overlay);
    const tabMaster = $('#tabModeMaster', overlay);
    const secTrader = $('#sectionTraderLogin', overlay);
    const secMaster = $('#sectionMasterLogin', overlay);

    if (tabTrader && tabMaster) {
      tabTrader.onclick = () => {
        tabTrader.style.background = '#EF2D3D';
        tabTrader.style.color = '#FFF';
        tabMaster.style.background = 'transparent';
        tabMaster.style.color = '#A0A6B4';
        secTrader.style.display = 'block';
        secMaster.style.display = 'none';
      };
      tabMaster.onclick = () => {
        tabMaster.style.background = '#EF2D3D';
        tabMaster.style.color = '#FFF';
        tabTrader.style.background = 'transparent';
        tabTrader.style.color = '#A0A6B4';
        secMaster.style.display = 'block';
        secTrader.style.display = 'none';
      };
    }

    // Trader MT5 Form Submit
    const traderForm = $('#traderMt5LoginForm', overlay);
    if (traderForm) {
      traderForm.onsubmit = async (e) => {
        e.preventDefault();
        const mt5Acc = ($('#loginTraderMt5', overlay).value || '').trim();
        const traderName = ($('#loginTraderName', overlay).value || '').trim();
        const devId = getOrCreateDeviceId();
        const devModel = navigator.userAgentData?.platform || navigator.platform || "Web Browser";

        toast('Mengesahkan peranti dan akaun MT5...');
        try {
          const res = await fetch(\`/api/trader/verify-pass?mt5=\${encodeURIComponent(mt5Acc)}&user=\${encodeURIComponent(traderName)}&deviceId=\${encodeURIComponent(devId)}&deviceModel=\${encodeURIComponent(devModel)}\`);
          const data = await res.json();

          if (data.deviceBlocked) {
            overlay.remove();
            showDeviceBlockedModal(data);
            return;
          }

          if (data.found && !data.valid) {
            overlay.remove();
            showExpiredLockModal(data);
            return;
          }

          // Login success!
          localStorage.setItem('ama_mt5', mt5Acc);
          doLogin(traderName);
        } catch(err) {
          toast('Ralat sambungan: ' + err.message);
        }
      };
    }

    // Master Form Submit
    const form = $('#amaterasuLoginForm', overlay);
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const opName = ($('#loginCallSign', overlay).value || 'Tengku Khairi').trim();
        doLogin(opName);
      };
    }

    const guestBtn = $('#btnGuestLogin', overlay);
    if (guestBtn) {
      guestBtn.onclick = () => {
        doLogin('Guest Trader');
      };
    }`;

appJs = appJs.replace(oldFormHandlerRegex, newFormHandler);

fs.writeFileSync(appJsFile, appJs, 'utf8');
console.log('Successfully updated login screen with Trader MT5 tab and 1-Device Lock verification!');
