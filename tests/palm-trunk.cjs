// A PALM'S TRUNK IS ONE BODY — owner, 2026-11-27: "There are a lot of [palms] in several areas that
// have [their] body in segments and fragments. When it's not straight or when it's actually tilted, it
// shows small fragments on top of each other."
// A long trunk used to be its ringed middle stamped again and again above its foot at one x; the art
// leans and flares, so every copy's bottom stood off the next copy's top (js/game.js palmTrunkLong).
// Measured on the baked terrain layer (pixels) in every room of the meadow with palm ledges, on every
// rooted palm: the trunk is followed row by row from its foot up to its crown, and its two edges are
// read off the layer.
//   A  every meadow room with ledges has its palms measured, and the long trunks (the ones the old
//      stamping broke) are among them
//   B  NO STEP: nowhere along any trunk do BOTH edges jump the same way between one row and the next
//      by more than STEP px (a piece set off from the piece under it); rows another palm's crown covers
//      are not trunk and are skipped
//   C  a long trunk runs straight: along its middle (where the old stamping repeated it) its centre stays
//      within 3 px of the line through the rows 12 either side (no zig-zag of offset pieces, however
//      small each step). A short trunk is the art stretched whole and keeps the art's own taper
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
const STEP = 1.6;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── palm-trunk — every palm trunk is one body, no step or offset piece along it');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/' + (process.env.PAGE || 'index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async (STEP) => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1 }); startGame(sv);
    mediaFetch('platPalmA', 1);
    for (let i = 0; i < 100 && !(MEDIA_IMG.platPalmA && MEDIA_IMG.platPalmA.naturalWidth); i++) await new Promise(r => setTimeout(r, 100));
    // every outdoor meadow room with a one-way run: the rooms that grow palms
    const rooms = Object.keys(ROOMS).filter(id => { const d = ROOMS[id]; if (d.zone !== 'A' || d.cave || d.indoor || d.decks) return false;
      try { loadRoom(id); } catch (e) { return false; } return G.grid.some(r => r.indexOf('=') >= 0) && G.roomId === id; });
    const out = { rooms: {}, worst: null, palms: 0, long: 0 };
    const home = { x: player.x, y: player.y };
    for (const room of rooms) {
      G.palmProbe = {}; player.x = home.x; player.y = home.y; player.vx = player.vy = 0;
      loadRoom(room); G.state = 'PLAY'; G.dialog = null; G.enemies = []; G.boss = null;
      let T = performance.now(); const t0 = Date.now();
      for (let i = 0; Date.now() - t0 < 20000 && !(G.palmProbe[room] && G.palmProbe[room].length && !tileDirty); i++) { T += 16.7; player.iT = 99; G.dialog = null; G.state = 'PLAY'; G.enemies = []; mainLoop(T); if (i % 20 === 19) await new Promise(r => setTimeout(r, 15)); }
      const runs = G.palmProbe[room] || [];
      const cv = tileCv, W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data;
      const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[((y | 0) * W + (x | 0)) * 4 + 3];
      // the crowns of the room: rows inside one are not trunk
      const crowns = []; for (const q of runs) for (const t of q.palms) crowns.push([t.x0, t.x1, q.Y - 30, t.cb + 2]);
      const inCrown = (x, y) => crowns.some(c => x >= c[0] - 4 && x <= c[1] + 4 && y >= c[2] && y <= c[3]);
      const r = { palms: 0, step: 0, wig: 0 };
      for (const q of runs) for (const t of q.palms) {
        if (t.gy == null || t.trunkBot - t.trunkTop < 40) continue;
        r.palms++; out.palms++; if (t.trunkBot - t.trunkTop > 150) out.long++;
        // follow it up from just over its foot, row by row
        let cx = t.tx; const rows = [];
        for (let y = Math.floor(t.trunkBot - 6); y > t.cb + 3; y--) {
          if (inCrown(cx, y)) { rows.push(null); continue; }
          let a = Math.round(cx), b;
          if (A(a, y) < 200) { let f = null; for (let o = 1; o < 12 && f == null; o++) { if (A(a - o, y) >= 200) f = a - o; else if (A(a + o, y) >= 200) f = a + o; } if (f == null) { rows.push(null); continue; } a = f; }
          b = a; while (A(a - 1, y) >= 200 && a - b > -90) a--; while (A(b + 1, y) >= 200 && b - a < 90) b++;
          if (b - a > 80) { rows.push(null); continue; }   // (merged into something else drawn there)
          rows.push({ y, l: a, r: b }); cx = (a + b) / 2;
        }
        // B: both edges jumping the same way
        for (let i = 1; i < rows.length; i++) {
          const p = rows[i - 1], c = rows[i]; if (!p || !c) continue;
          const dl = c.l - p.l, dr = c.r - p.r;
          const s = (dl > 0 && dr > 0) ? Math.min(dl, dr) : (dl < 0 && dr < 0) ? Math.min(-dl, -dr) : 0;
          if (s > r.step) { r.step = s; r.at = { x: Math.round(t.tx), y: c.y }; }
        }
        // C: the centre against the line through the rows either side
        // (the middle of the trunk, between its collar's frond tips and its foot's flare: where the old
        // stamping repeated the ringed middle; the collar and the foot are the art's own shape)
        // (a short trunk is the art stretched whole, its own taper and flare: only a long one is read here)
        const long = t.trunkBot - t.trunkTop > 150;
        const lo = Math.max(12, Math.floor(rows.length * 0.3)), hi = long ? Math.min(rows.length - 12, Math.ceil(rows.length * 0.8)) : 0;
        for (let i = lo; i < hi; i++) {
          const a = rows[i - 12], c = rows[i], b = rows[i + 12]; if (!a || !b || !c) continue;
          const mid = ((a.l + a.r) / 2 + (b.l + b.r) / 2) / 2, w = Math.abs((c.l + c.r) / 2 - mid);
          if (w > r.wig) { r.wig = w; r.wat = { x: Math.round(t.tx), y: c.y }; }
        }
      }
      r.end = G.roomId;
      out.rooms[room] = r;
    }
    return out;
  }, STEP);
  const rooms = Object.entries(R.rooms);
  check('A  the meadow rooms with ledges have their palms measured, long trunks among them', rooms.filter(([, r]) => r.palms > 0).length >= 10 && rooms.every(([k, r]) => r.end === k) && R.long > 0,
    { rooms: Object.fromEntries(rooms.map(([k, r]) => [k, r.palms])), long: R.long });
  check('B  no step along any trunk: both edges never jump the same way by more than ' + STEP + ' px', rooms.every(([, r]) => r.step <= STEP),
    Object.fromEntries(rooms.filter(([, r]) => r.step > 0).map(([k, r]) => [k, r.step + (r.at ? ' @' + r.at.x + ',' + r.at.y : '')])));
  check('C  each long trunk runs straight: its centre within 3 px of the line through the rows either side', rooms.every(([, r]) => r.wig <= 3),
    Object.fromEntries(rooms.map(([k, r]) => [k, +r.wig.toFixed(1) + (r.wig > 3 && r.wat ? ' @' + r.wat.x + ',' + r.wat.y : '')])));
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every trunk is one body');
})().catch(e => { console.error(e); process.exit(1); });
