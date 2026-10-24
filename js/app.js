// ===== Amaterasu AI Router, Tab Dock, Global Shell =====

const TABS = [
  ['signal', 'Signal'], ['stat', 'Stat'], ['analysis', 'Analysis'], ['screener', 'Screener'],
  ['news', 'News'], ['ainews', 'AI News'], ['more', 'More'],
];

const ROUTES = {
  signal: SignalPage, stat: StatPage, analysis: AnalysisPage, screener: ScreenerPage, news: NewsPage, ainews: AiNewsPage,
  more: MorePage, lot: LotPage, pnl: PnLPage, games: GamesPage, volatility: VolatilityPage, contest: ContestPage,
};

let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  $$('.modal-bg').forEach(m => m.remove());
  let r = location.hash.slice(1);
  if (!ROUTES[r]) r = 'signal';
  const main = $('#main');
  main.innerHTML = '';
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  cleanup = ROUTES[r](main) || null;
  const tab = TABS.some(t => t[0] === r) ? r : 'more';
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.r === tab));
}

function init() {
  $('#brandName').textContent = BRAND.name.toUpperCase();
  $('#brandTag').textContent = BRAND.tagline;
  $('#user').textContent = BRAND.user;
  document.title = `${BRAND.name} · ${BRAND.tagline}`;

  $('#tabbar').innerHTML = TABS.map(([r, l]) => `<a class="tab" href="#${r}" data-r="${r}"><span class="tab-ic">${ic(r)}</span>${l}</a>`).join('');

  $('#logout').onclick = e => {
    e.preventDefault();
    const m = modal(`<h3>Disconnect Node?</h3><p class="muted">Operator session will be detached from Amaterasu MT5 feeds.</p><div class="modal-actions"><button class="btn ghost" data-close>Cancel</button><button class="btn gold" data-a="out">Disconnect</button></div>`);
    $('[data-a=out]', m.el).onclick = () => { m.close(); toast('Operator node disconnected'); };
  };

  $('#bot').onclick = () => {
    const m = modal(`<h3>Amaterasu Solar Core</h3><p class="muted">Real-time solar oracle and risk advisor.</p>
      <div class="chat" id="chat">
        <div class="msg ai">Greetings Operator. XAUUSD is hovering at <b>${num(Market.price)}</b>. Intraday momentum is consolidating beneath 4,028 resistance. How may I assist your execution?</div>
      </div>
      <div class="chat-in"><input id="q" placeholder="Inquire about gold levels, risk or setups…"><button class="btn gold" id="send">Transmit</button></div>`);
    const chat = $('#chat', m.el), q = $('#q', m.el);
    const reply = t => {
      const s = t.toLowerCase();
      if (/lot|risk|saiz/.test(s)) return 'Access the Smart Risk Manager via Command Hub → Smart Lot. For $1,000 capital at 5% risk with 50 pip SL, recommended lot is 0.10.';
      if (/session|volatil|bila|masa/.test(s)) return 'New York session (20:00–05:00 MYT) exhibits peak expansion, averaging 195 pips. London session is opening next with 168 pips.';
      if (/price|harga|gold|emas/.test(s)) return `Current spot liquidity is pricing gold at ${num(Market.price)} USD/oz.`;
      if (/signal|setup/.test(s)) return 'Amaterasu Solar Core is tracking an order block sweep. A high-probability BUY vector is anticipated.';
      return 'Command received. Amaterasu telemetry algorithms are continuously parsing multi-timeframe order flow.';
    };
    const send = () => {
      const t = q.value.trim();
      if (!t) return;
      chat.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(t)}</div>`);
      q.value = '';
      setTimeout(() => { chat.insertAdjacentHTML('beforeend', `<div class="msg ai">${reply(t)}</div>`); chat.scrollTop = chat.scrollHeight; }, 350);
      chat.scrollTop = chat.scrollHeight;
    };
    $('#send', m.el).onclick = send;
    q.onkeydown = e => { if (e.key === 'Enter') send(); };
  };

  if (SET('anim', true)) {
    const s = document.createElement('div');
    s.className = 'splash';
    s.innerHTML = `<div class="splash-in"><div class="splash-logo">${LOGO}</div><b>${BRAND.name}</b><small>${BRAND.tagline}</small></div>`;
    document.body.appendChild(s);
    setTimeout(() => s.classList.add('out'), 1200);
    setTimeout(() => s.remove(), 1600);
  }

  applyDisplayMode();
  applyMonitor();
  window.addEventListener('resize', applyDisplayMode);
  window.addEventListener('hashchange', route);
  setInterval(() => Market.tick(), 2000);
  Market.tick();

  // Connect to backend CRM and Server-Sent Events stream
  if (typeof AppState !== 'undefined') {
    AppState.sync().then(() => {
      route();
      AppState.initSSE();
    }).catch(() => {
      route();
    });
  } else {
    route();
  }
}

init();
