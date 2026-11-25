// THE MEADOW'S LEDGES ARE SMALL PALMS — owner, 2026-11-25: "for hanging platforms, change its shape.
// It's just a straight line instead of an actual standing place. It can be like a small palm that we
// can jump on, or a small tree that we can jump on, something like that. Because it's these old
// platforms in this situation is out of character."
// Measured on the baked terrain layer itself (pixels, not tables), in NULLFANG's arena A4 and in
// A1, A2 and A3:
//   A  every one-way run ('=') in the room is drawn as palms (js/game.js drawPlatPalm), none as the
//      old wreck-deck slab (platObjA is never drawn)
//   B  the crown's top is where her feet stand: the first solid row over the middle of the run is
//      within 4 px of the standing line
//   C  the crown spans the run: solid across >= 90% of it just under the top
//   D  every trunk reaches the ground: solid pixels down the trunk's column from under the crown to
//      the ground (>= 95% of the rows), its foot within 8 px of the ground — no tree in the air
//   E  no lawn painted along a crown (the fringe grows nothing on a palm ledge)
//   F  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── palm-ledges — the meadow\'s ledges are small palms she stands on, rooted in the ground');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1 }); startGame(sv);
    mediaFetch('platPalmA', 1);
    for (let i = 0; i < 100 && !(MEDIA_IMG.platPalmA && MEDIA_IMG.platPalmA.naturalWidth); i++) await new Promise(r => setTimeout(r, 100));
    const D0 = CanvasRenderingContext2D.prototype.drawImage; let slab = 0;
    CanvasRenderingContext2D.prototype.drawImage = function (im) { if (im && MEDIA_IMG.platObjA && im === MEDIA_IMG.platObjA) slab++; return D0.apply(this, arguments); };
    const out = {};
    for (const room of ['A4', 'A1', 'A2', 'A3']) {
      G.palmProbe = {};
      loadRoom(room); G.state = 'PLAY'; G.dialog = null;
      let T = performance.now();
      for (let i = 0; i < 400 && !(G.palmProbe[room] && G.palmProbe[room].length && !tileDirty); i++) { T += 16.7; player.iT = 99; G.dialog = null; G.state = 'PLAY'; mainLoop(T); if (i % 20 === 19) await new Promise(r => setTimeout(r, 0)); }
      const runs = G.palmProbe[room] || [];
      // the runs the room has, read off its grid
      const g = G.grid; let want = 0;
      for (let ty = 0; ty < g.length; ty++) { let on = false; for (let tx = 0; tx < g[0].length; tx++) { const e = g[ty][tx] === '='; if (e && !on) want++; on = e; } }
      const cv = tileCv, W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data;
      const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[((y | 0) * W + (x | 0)) * 4 + 3];
      const r = { want, got: runs.length, topOff: 0, span: 1, trunk: 1, foot: 0, lawn: 0 };
      for (const q of runs) {
        // B: the first solid row over the middle third
        // (the typical column, not the worst: an upper palm's trunk may stand behind this crown, above
        // its standing line, and that is a trunk, not the crown's top)
        const offs = [];
        for (let x = q.X + q.RW * 0.2; x <= q.X + q.RW * 0.8; x += 4) {
          let y = q.Y - 30; while (y < q.Y + 30 && A(x, y) < 200) y++;
          offs.push(Math.abs(y - q.Y));
        }
        offs.sort((a, b) => a - b);
        r.topOff = Math.max(r.topOff, offs[offs.length >> 1] || 0);
        // C: solid across the run just under the top
        let n = 0, s = 0; for (let x = q.X + 2; x < q.X + q.RW - 2; x += 2) { n++; if (A(x, q.Y + 10) > 200 || A(x, q.Y + 16) > 200) s++; }
        r.span = Math.min(r.span, +(s / Math.max(1, n)).toFixed(2));
        // E: nothing green standing along the top (a lawn would be opaque above the standing line)
        // (green, not merely solid: an upper palm's trunk may stand behind a crown)
        const green = (x, y) => { const i = ((y | 0) * W + (x | 0)) * 4; return d[i + 3] > 200 && d[i + 1] > d[i] + 18 && d[i + 1] > d[i + 2] + 8; };
        let above = 0; for (let x = q.X + 4; x < q.X + q.RW - 4; x += 3) if (green(x, q.Y - 8) || green(x, q.Y - 14)) above++;
        r.lawn = Math.max(r.lawn, above);
        // D: each trunk down to the ground
        for (const t of q.palms) {
          if (t.gy == null) continue;
          let rows = 0, solid = 0;
          for (let y = Math.ceil(t.cb + 2); y < t.gy - 2; y++) { rows++; let hit = false; for (let dx = -6; dx <= 6; dx += 3) if (A(t.tx + dx, y) > 200) { hit = true; break; } if (hit) solid++; }
          if (rows > 0) r.trunk = Math.min(r.trunk, +(solid / rows).toFixed(3));
          r.foot = Math.max(r.foot, Math.abs(t.trunkBot - t.gy));
        }
      }
      out[room] = r;
    }
    CanvasRenderingContext2D.prototype.drawImage = D0;
    return { rooms: out, slab };
  });
  const rooms = Object.entries(R.rooms);
  check('A  every ledge run in A4, A1, A2, A3 is drawn as palms, and the old slab never', rooms.every(([, r]) => r.got === r.want && r.want > 0) && R.slab === 0, { rooms: Object.fromEntries(rooms.map(([k, r]) => [k, r.got + '/' + r.want])), slab: R.slab });
  check('B  the crown\'s top is where her feet stand (within 4 px)', rooms.every(([, r]) => r.topOff <= 4), Object.fromEntries(rooms.map(([k, r]) => [k, r.topOff])));
  check('C  the crown spans the run (solid across >= 90%)', rooms.every(([, r]) => r.span >= 0.9), Object.fromEntries(rooms.map(([k, r]) => [k, r.span])));
  check('D  every trunk reaches the ground (>= 95% solid down it, foot within 8 px of the ground)', rooms.every(([, r]) => r.trunk >= 0.95 && r.foot <= 8), Object.fromEntries(rooms.map(([k, r]) => [k, { trunk: r.trunk, foot: r.foot }])));
  check('E  no lawn along a crown', rooms.every(([, r]) => r.lawn <= 2), Object.fromEntries(rooms.map(([k, r]) => [k, r.lawn])));
  check('F  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the ledges are palms, rooted');
})().catch(e => { console.error(e); process.exit(1); });
