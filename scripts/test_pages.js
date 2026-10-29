const fs = require('fs');
const vm = require('vm');

function createMockElement(tag = 'DIV') {
  const listeners = {};
  const element = {
    tagName: tag.toUpperCase(),
    className: '',
    style: {},
    dataset: {},
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(val) { this._innerHTML = val; },
    textContent: '',
    value: '',
    checked: false,
    width: 300,
    height: 150,
    clientWidth: 300,
    clientHeight: 600,
    scrollWidth: 300,
    scrollHeight: 600,
    parentElement: null,
    appendChild: (child) => child,
    removeChild: (child) => child,
    remove: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    setAttribute: () => {},
    getAttribute: () => '',
    addEventListener: (evt, cb) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(cb);
    },
    removeEventListener: () => {},
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 }),
      setTransform: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {}
    }),
    querySelector: (sel) => createMockElement('DIV'),
    querySelectorAll: (sel) => [createMockElement('DIV'), createMockElement('DIV')],
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 320, height: 480, right: 320, bottom: 480 }),
    focus: () => {},
    blur: () => {},
    click: () => {},
    scrollIntoView: () => {}
  };

  const proxy = new Proxy(element, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && prop.startsWith('on')) return () => {};
      return createMockElement(String(prop));
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
  element.parentElement = proxy;
  return proxy;
}

const docElement = createMockElement('HTML');
const bodyElement = createMockElement('BODY');

const domMocks = {
  console,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  devicePixelRatio: 1,
  window: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  document: {
    title: '',
    createElement: (tag) => createMockElement(tag),
    getElementById: (id) => createMockElement('DIV'),
    querySelector: (sel) => createMockElement('DIV'),
    querySelectorAll: (sel) => [createMockElement('DIV')],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: bodyElement,
    documentElement: docElement
  },
  location: { hash: '#signal', slice: () => 'signal' },
  navigator: { userAgent: 'Mozilla/5.0 Chrome' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};

domMocks.window = domMocks;
domMocks.globalThis = domMocks;

const context = vm.createContext(domMocks);

// Run core scripts in VM
vm.runInContext(fs.readFileSync('js/core.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/blocks.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/pages-main.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/pages-more.js', 'utf8'), context);

const testRunner = () => {
  const main = createMockElement('MAIN');

  const pagesToTest = [
    ['SignalPage (Tab 1/7)', context.SignalPage],
    ['StatPage (Tab 2/7)', context.StatPage],
    ['AnalysisPage (Tab 3/7)', context.AnalysisPage],
    ['ScreenerPage (Tab 4/7)', context.ScreenerPage],
    ['NewsPage (Tab 5/7)', context.NewsPage],
    ['AiNewsPage (Tab 6/7)', context.AiNewsPage],
    ['MorePage (Tab 7/7)', context.MorePage],
    ['LotPage (Sub-page)', context.LotPage],
    ['PnLPage (Sub-page)', context.PnLPage],
    ['GamesPage (Sub-page)', context.GamesPage],
    ['VolatilityPage (Sub-page)', context.VolatilityPage],
    ['ContestPage (Sub-page)', context.ContestPage]
  ];

  let passed = 0;
  let failed = 0;

  console.log('Testing execution of all 7 tabs and sub-pages in DOM context:');
  for (const [name, fn] of pagesToTest) {
    try {
      main.innerHTML = '';
      if (typeof fn !== 'function') throw new Error(`${name} is not a function!`);
      const cleanup = fn(main);
      console.log(`  [PASS] ${name} executed without error. Length: ${main.innerHTML.length} chars`);
      if (typeof cleanup === 'function') cleanup();
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name} error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nAUDIT RESULT: ${passed} PASSED, ${failed} FAILED.`);
  if (failed === 0) {
    console.log('>>> 100% OF ALL 7 TABS AND SUB-PAGES RUN SMOOTHLY WITH ZERO ERRORS! <<<');
  }
};

testRunner();
