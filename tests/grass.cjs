// THE GRASS BENDS UNDER WHAT WALKS IN IT, AND COSTS NOTHING — owner, 2026-11-25: "Try to improve
// the grass ... find free library for the grass instead of these green lines" / "if you can find
// grass that can move with the characters to show real life movements whenever I walk on it or an
// enemy walk on it, that would be amazing" / "do not make the game heavy. This is very important."
//   A  the meadow grows the painted card (js/grass.js), archived and credited, not the line blades
//   B  she bends it: the columns under her lean away from her middle, the far ones stand
//   C  ...and it springs back once she has gone
//   D  a walker bends it too (an enemy in the grass, not only her)
//   E  it is cheap: every column on screen stepped and drawn in well under 2 ms a frame here, and
//      the low tier draws fewer, wider columns
//   F  no page errors
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── grass — painted grass that bends under her and under them, for almost nothing');
  const credits = fs.readFileSync(path.join(ROOT, 'assets/CREDITS.md'), 'utf8');
  const onDisk = ['assets/source/grass/vegetation_grass_card_03.png', 'assets/fx/grass/grass_meadow.webp', 'assets/fx/grass/grass_frond.webp'].every(f => fs.existsSync(path.join(ROOT, f)));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1 });
    startGame(sv); loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.tut = null;
    for (let i = 0; i < 100 && !(GRASS.ready && GRASS.room === 'A2'); i++) await new Promise(r => setTimeout(r, 100));
    window.requestAnimationFrame = () => 0;
    const out = { ready: GRASS.ready, cols: GRASS.cols.length, key: GRASS.key };
    const c = document.createElement('canvas').getContext('2d');
    const step = (n) => { for (let i = 0; i < n; i++) { GRASS.last = performance.now() / 1000 - 1 / 60; drawGrass(c); } };
    const cols = GRASS.cols;
    // a stretch of open meadow floor with standing room either side
    let col = null; for (let i = 40; i < cols.length - 40; i++) { const q = cols[i]; if (Math.abs(cols[i + 12].y - q.y) < 6 && Math.abs(cols[i - 12].y - q.y) < 6) { col = q; break; } }
    if (!col) return Object.assign(out, { none: 1 });
    G.enemies = []; G.boss = null;
    const near = (b, f) => cols.filter(q => q.x + q.w / 2 > b.x - 2 && q.x + q.w / 2 < b.x + b.w + 2 && f(q));
    const place = (b, x) => { b.x = x - b.w / 2; b.y = col.y - 5 - b.h; b.vx = 0; };
    cam.x = col.x - 480; cam.y = col.y - 300; cam.zoom = 1; cam.shakeX = 0;
    // B: she stands in it
    place(player, col.x); player.dead = false; step(40);
    const under = near(player, () => true), far = cols.filter(q => Math.abs(q.x - col.x) > 120 && Math.abs(q.x - col.x) < 300);
    const lean = q => Math.sign(q.a) === Math.sign(q.x + q.w / 2 - (player.x + player.w / 2)) ? Math.abs(q.a) : -Math.abs(q.a);
    out.underLean = +(under.reduce((s, q) => s + lean(q), 0) / Math.max(1, under.length)).toFixed(2);
    out.farLean = +(far.reduce((s, q) => s + Math.abs(q.a), 0) / Math.max(1, far.length)).toFixed(2);
    // C: she leaves
    player.x = col.x + 2000; step(90);
    out.backLean = +(under.reduce((s, q) => s + Math.abs(q.a), 0) / Math.max(1, under.length)).toFixed(2);
    // D: a walker in the grass
    const e = new Enemy('crawler', 0, 0); place(e, col.x + 40); G.enemies = [e]; e.vx = 120; step(40);
    const eu = near(e, () => true);
    out.enemyLean = +(eu.reduce((s, q) => s + Math.abs(q.a), 0) / Math.max(1, eu.length)).toFixed(2);
    G.enemies = [];
    // E: the cost of a frame, every column on screen
    const t0 = performance.now(); const N = 120; step(N); out.ms = +((performance.now() - t0) / N).toFixed(3);
    const z = cam.zoom || 1; out.onScreen = cols.filter(q => q.x > camSX() - 40 && q.x < camSX() + 1000).length;
    out.colW = grassColW(); QUAL = QTIER.low; out.colWLow = grassColW(); QUAL = QTIER.high;
    return out;
  });
  check('A  the meadow grows the painted card, archived and credited', R.ready && R.cols > 100 && R.key === 'grassMeadow' && onDisk && /vegetation_grass_card/.test(credits) && /CC0/.test(credits), { cols: R.cols, key: R.key, onDisk });
  check('B  she bends it: the columns under her lean away from her, the far ones stand', R.underLean > 0.3 && R.farLean < 0.15, { under: R.underLean, far: R.farLean });
  check('C  ...and it springs back once she has gone', R.backLean < 0.15, { after: R.backLean });
  check('D  a walker bends it too', R.enemyLean > 0.3, { enemy: R.enemyLean });
  check('E  it is cheap: a frame of it under 2 ms here, and the low tier draws wider columns', R.ms < 2 && R.colWLow > R.colW, { msPerFrame: R.ms, columnsOnScreen: R.onScreen, colW: R.colW, low: R.colWLow });
  check('F  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the grass bends, and it is cheap');
})().catch(e => { console.error(e); process.exit(1); });
