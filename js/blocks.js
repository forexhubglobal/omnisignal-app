// Blocks — a Tetris-style game with candle-coloured pieces.
function createBlocks(canvas, nextCanvas, hooks) {
  const COLS = 10, ROWS = 20;
  const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
  };
  const COLORS = { I: '#00e5ff', O: '#ffc107', T: '#d500f9', S: '#00e676', Z: '#ff1744', J: '#38bdf8', L: '#ff6d00' };
  const KEYS = Object.keys(SHAPES);

  const ctx = canvas.getContext('2d');
  const nctx = nextCanvas.getContext('2d');
  let cell = 20, board = null, cur = null, next = null;
  let score = 0, lines = 0, level = 1, acc = 0, last = 0, raf = 0, state = 'idle';

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const rand = () => { const k = KEYS[(Math.random() * KEYS.length) | 0]; return { k, m: SHAPES[k].map(r => r.slice()), x: 0, y: 0 }; };
  const stats = () => ({ score, lines, level });
  const speed = () => Math.max(90, 800 - (level - 1) * 70);

  function size() {
    const w = canvas.parentElement.clientWidth;
    cell = Math.max(10, Math.floor(w / COLS));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cell * COLS * dpr;
    canvas.height = cell * ROWS * dpr;
    canvas.style.width = cell * COLS + 'px';
    canvas.style.height = cell * ROWS + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nd = 64 * dpr;
    nextCanvas.width = nd; nextCanvas.height = nd;
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(); drawNext();
  }

  function collide(m, x, y) {
    for (let r = 0; r < m.length; r++)
      for (let c = 0; c < m[r].length; c++)
        if (m[r][c]) {
          const X = x + c, Y = y + r;
          if (X < 0 || X >= COLS || Y >= ROWS) return true;
          if (Y >= 0 && board[Y][X]) return true;
        }
    return false;
  }

  function spawn() {
    cur = next || rand();
    next = rand();
    cur.x = (COLS - cur.m[0].length) >> 1;
    cur.y = 0;
    drawNext();
    if (collide(cur.m, cur.x, cur.y)) end();
  }

  function merge() {
    cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && cur.y + r >= 0) board[cur.y + r][cur.x + c] = cur.k; }));
  }

  function clearLines() {
    let n = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); n++; r++; }
    }
    if (n) {
      lines += n;
      score += [0, 100, 300, 500, 800][n] * level;
      level = 1 + Math.floor(lines / 10);
    }
  }

  // Moves the piece down one row. Returns false when the piece locked.
  function step() {
    if (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; return true; }
    merge(); clearLines(); hooks.update(stats()); spawn();
    return false;
  }

  function loop(t) {
    if (state !== 'play') return;
    if (!last) last = t;
    acc += t - last; last = t;
    if (acc > speed()) { acc = 0; step(); }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function block(g, x, y, s, color) {
    const p = Math.max(1, s * 0.08);
    g.fillStyle = color;
    g.beginPath();
    if (g.roundRect) g.roundRect(x * s + p, y * s + p, s - 2 * p, s - 2 * p, s * 0.18);
    else g.rect(x * s + p, y * s + p, s - 2 * p, s - 2 * p);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.2)';
    g.fillRect(x * s + p + s * 0.15, y * s + p + s * 0.12, s * 0.28, s * 0.1);
  }

  function draw() {
    const W = cell * COLS, H = cell * ROWS;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) { ctx.moveTo(c * cell + 0.5, 0); ctx.lineTo(c * cell + 0.5, H); }
    for (let r = 1; r < ROWS; r++) { ctx.moveTo(0, r * cell + 0.5); ctx.lineTo(W, r * cell + 0.5); }
    ctx.stroke();
    if (!board) return;
    board.forEach((row, r) => row.forEach((k, c) => { if (k) block(ctx, c, r, cell, COLORS[k]); }));
    if (cur && state !== 'idle') {
      let gy = cur.y;
      while (!collide(cur.m, cur.x, gy + 1)) gy++;
      const paint = (yy) => cur.m.forEach((row, r) => row.forEach((v, c) => { if (v) block(ctx, cur.x + c, yy + r, cell, COLORS[cur.k]); }));
      ctx.globalAlpha = 0.15; paint(gy); ctx.globalAlpha = 1; paint(cur.y);
    }
  }

  function drawNext() {
    nctx.clearRect(0, 0, 64, 64);
    if (!next) return;
    const s = 13, w = next.m[0].length * s, h = next.m.length * s;
    nctx.save();
    nctx.translate((64 - w) / 2, (64 - h) / 2);
    next.m.forEach((row, r) => row.forEach((v, c) => { if (v) block(nctx, c, r, s, COLORS[next.k]); }));
    nctx.restore();
  }

  function start() {
    cancelAnimationFrame(raf);
    board = emptyBoard(); score = 0; lines = 0; level = 1; next = null;
    state = 'play'; spawn(); hooks.update(stats());
    last = 0; acc = 0; raf = requestAnimationFrame(loop);
  }

  function pause() {
    if (state === 'play') { state = 'paused'; cancelAnimationFrame(raf); hooks.state('paused'); }
    else if (state === 'paused') { state = 'play'; last = 0; raf = requestAnimationFrame(loop); hooks.state('play'); }
  }

  function end() { state = 'over'; cancelAnimationFrame(raf); draw(); hooks.over(score); }

  function act(a) {
    if (state !== 'play') return;
    if (a === 'left' && !collide(cur.m, cur.x - 1, cur.y)) cur.x--;
    else if (a === 'right' && !collide(cur.m, cur.x + 1, cur.y)) cur.x++;
    else if (a === 'down') { if (step()) { score += 1; hooks.update(stats()); } acc = 0; }
    else if (a === 'drop') { let d = 0; while (state === 'play' && step()) d++; score += d * 2; hooks.update(stats()); acc = 0; }
    else if (a === 'rotate') {
      const m = cur.m[0].map((_, i) => cur.m.map(r => r[i]).reverse());
      for (const o of [0, -1, 1, -2, 2]) if (!collide(m, cur.x + o, cur.y)) { cur.m = m; cur.x += o; break; }
    }
    draw();
  }

  function destroy() { cancelAnimationFrame(raf); state = 'dead'; }

  size();
  return { start, pause, act, destroy, resize: size, state: () => state };
}
