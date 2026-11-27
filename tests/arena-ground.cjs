// A BOSS ARENA DRAWN SMALL STILL STANDS ON GROUND — owner, 2026-11-27, on an iPad in the Alpha's fight:
// "the platform, because of the zoom out, it's missing the bottom segment. It's showing the background
// instead of completing the platform downward." · "when the player is zoomed out in the boss fight,
// it's showing an empty space underneath the platform terrain".
// Every arena is wider than the screen's shape, so the fight's whole-arena picture (js/engine.js
// bossFit) leaves world below the room; js/game.js drawGroundBelow carries the room's ground body on
// down in its own rock. Read off the finished canvas, for every boss arena with its guardian fighting:
// the frame drawn with the real backdrop and again with the backdrop painted magenta — a pixel that
// changes between the two is backdrop showing.
//   A  every arena is drawn below a zoom of 1 (so the frame does run past the room's floor)
//   B  under the room's last row, down to the frame's foot, no backdrop shows (< 1% of the band)
//   C  ...and what is there is ground, not a flat fill: it has the rock's grain (luminance spread)
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── arena-ground — every boss arena, zoomed out, has ground to the frame\'s foot');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const rooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'boss'));
    const now0 = performance.now.bind(performance), rnd0 = Math.random;
    const frame = (Tf) => {
      let s = 12345; performance.now = () => Tf; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      try { draw(); } finally { performance.now = now0; Math.random = rnd0; }
      return c.getImageData(0, 0, cv.width, cv.height).data;
    };
    const out = {};
    for (const id of rooms) {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, crystal: 1, bossChime: 0 });
      if (id === 'CV3') sv.flags.crystal = 0;
      if (id === 'B4') Object.assign(sv.flags, { crystal2: 1, connector: 1 });
      startGame(sv);
      try { loadRoom(id); } catch (e) { out[id] = { err: String(e).slice(0, 80) }; continue; }
      G.state = 'PLAY'; G.dialog = G.cut = G.meet = G.wake = G.tut = null; G.enemies = [];
      const b = G.boss; if (!b) { out[id] = { noBoss: 1 }; continue; }
      b.st = 'idle'; b.t = 99; b.vx = 0; b.meet = false;
      let T = performance.now();
      const hold = () => { player.iT = 99; player.hp = 999; player.dead = false; player.cores = player.maxCores(); b.st = b.st === 'dorm' || b.st === 'intro' ? 'idle' : b.st; b.t = Math.max(b.t || 0, 1); b.vx = 0; G.dialog = G.cut = G.meet = null; G.state = 'PLAY'; };
      const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
      const gc = groundColumnAt(W * 0.5); player.x = W * 0.5 - player.w / 2; player.y = (gc ? Math.min.apply(null, gc) : H - 2 * TILE) - player.h - 1;
      for (let i = 0; i < 240; i++) { T += 1000 / 60; hold(); mainLoop(T); }
      for (let i = 0; i < 25; i++) { await new Promise(r => setTimeout(r, 100)); for (let j = 0; j < 2; j++) { T += 1000 / 60; hold(); mainLoop(T); } }
      const Tf = now0();
      const plain = frame(Tf);
      const bg0 = window.drawBG, pp0 = window.bgPlanePass, vl0 = window.drawVLinkBG;
      window.drawBG = function () { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#ff00ff'; c.fillRect(0, 0, cv.width, cv.height); c.restore(); };
      window.bgPlanePass = function () {}; window.drawVLinkBG = function () {};
      let magenta; try { magenta = frame(Tf); } finally { window.drawBG = bg0; window.bgPlanePass = pp0; window.drawVLinkBG = vl0; }
      const CW = cv.width, CH = cv.height, ky = CH / 540;
      const y0 = Math.ceil(worldScreenY(H) * ky) + 2;
      let n = 0, show = 0, sum = 0, sum2 = 0;
      for (let y = Math.max(0, y0); y < CH; y += 2) for (let x = 0; x < CW; x += 2) {
        const i = (y * CW + x) * 4; n++;
        if (Math.abs(plain[i] - magenta[i]) + Math.abs(plain[i + 1] - magenta[i + 1]) + Math.abs(plain[i + 2] - magenta[i + 2]) > 60) show++;
        const L = 0.3 * plain[i] + 0.59 * plain[i + 1] + 0.11 * plain[i + 2]; sum += L; sum2 += L * L;
      }
      const mean = n ? sum / n : 0, sd = n ? Math.sqrt(Math.max(0, sum2 / n - mean * mean)) : 0;
      out[id] = { zoom: +cam.zoom.toFixed(3), bandTop: Math.round(y0 / ky), band: n, backdrop: n ? +(show / n).toFixed(4) : null, lum: +mean.toFixed(1), grain: +sd.toFixed(1) };
    }
    return out;
  });
  const ids = Object.keys(R), ok = r => r && !r.err && !r.noBoss;
  const by = f => Object.fromEntries(ids.map(id => [id, ok(R[id]) ? f(R[id]) : R[id]]));
  check('A  every arena (' + ids.length + ') is drawn below a zoom of 1, so the frame runs past its floor', ids.length >= 10 && ids.every(id => ok(R[id]) && R[id].zoom < 0.999), by(r => r.zoom));
  const banded = ids.filter(id => ok(R[id]) && R[id].band > 0);
  check('B  under the room\'s last row, to the frame\'s foot, no backdrop shows (< 1%)', banded.length >= 10 && banded.every(id => R[id].backdrop < 0.01), by(r => r.band ? r.backdrop : 'no band'));
  check('C  ...and it is ground with grain, not a flat fill', banded.every(id => R[id].grain >= 3), by(r => r.band ? r.lum + '±' + r.grain : '-'));
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every arena stands on ground all the way down');
})().catch(e => { console.error(e); process.exit(1); });
