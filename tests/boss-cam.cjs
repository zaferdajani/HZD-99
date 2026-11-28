// A BOSS FIGHT IS ONE STILL PICTURE OF ITS WHOLE ARENA — owner, 2026-11-25: "make sure that when I
// stand on the palm, I'm still zoomed out enough to see the whole screen instead of the issue with
// the camera coming up with me, so I wouldn't be able to see Nilfang anymore. Camera should not
// move with me in the boss fight, as the screen should just zoom out to fill out all the screen
// with all the data needed without moving the camera with me, to avoid distraction. And focus on
// the fight." (js/engine.js updateCam, bossFit; js/presentation.js WORLD_VIEW draws a zoom below 1)
//
// The first version of this harness read cam.zoom and cam.x and passed while the picture did not
// change at all: a zoom below 1 was never drawn. So everything here past A is read off the
// FINISHED CANVAS. Marks are painted at fixed places in the room, late in the world pass, and found
// by differencing the frame with them against the frame without; she and the guardian are found
// by differencing the frame with each of them drawn against the frame without (the clock and the
// dice held still, so nothing else in the frame changes between the two).
//
// 15% IN, SLIDING LEFT AND RIGHT — owner, 2026-11-28: "decrease zoom in with 15%, which means I can
// move left and right a little bit in the map while it's still seeing most of it ... And do the same
// for the rest, while maintaining always solid floor all the way to the bottom of the screen". The
// frame is the arena fitted, then 15% closer (BOSS_FRAME_IN), aimed half-way between her and the
// guardian; it slides left and right only, and never up or down (the palm, the jump).
//
// For every boss arena in the game, with its guardian fighting, she at the middle of the floor, at
// both ends of it, high in the air (on a palm's height) and in a jump:
//   A  the camera is zoomed 15% in from fitting the room
//   B  most of the arena is on screen (at least 1/1.15 of its width), and the frame reaches each end:
//      the west edge drawn in some pose, the east edge in some pose (the aim is half-way to the guardian,
//      so with her at one end and him far off at the other the wall behind her may sit just off it;
//      the two of them in it is D)
//   C  the frame never moves up or down: a mark at the room's middle lands on the same canvas row in
//      every pose (<= 2 px), and it does slide sideways between the two ends
//   D  the guardian and she are both drawn, on the canvas, where worldScreenX/Y put them
//   E  a zoom below 1 is DRAWN: a mark 20 px inside the right edge of the view — more than 960 px
//      of world from its left edge — is on the canvas
//   F  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── boss-cam — every boss fight is its arena 15% in from whole, sliding sideways only, read off the canvas');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const rooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'boss'));
    // marks: world rects painted after the world (and its dark) are drawn, before the light grade
    let MARK = null;
    const dark0 = window.drawCaveDark;
    window.drawCaveDark = function () {
      const r = dark0.apply(this, arguments);
      if (MARK) { c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#ff00ff';
        for (const m of MARK) c.fillRect(m.x - camSX(), m.y - camSY(), m.w, m.h); c.restore(); }
      return r;
    };
    // a frame with the clock and the dice held, so two draws differ only by what the test changes
    const now0 = performance.now.bind(performance), rnd0 = Math.random;
    const frame = (Tf) => {
      let s = 12345; performance.now = () => Tf; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      try { draw(); } finally { performance.now = now0; Math.random = rnd0; }
      return c.getImageData(0, 0, cv.width, cv.height).data;
    };
    // (read again after each startGame: the save's detail tier sizes the canvas — low, the default, is 0.7 of it)
    let kx = cv.width / 960, ky = cv.height / 540, CW = cv.width, CH = cv.height;
    const changed = (A, B, i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60;
    // the canvas rect of a world rect, and how much of it the difference covers
    const devRect = (m) => ({ x0: worldScreenX(m.x) * kx, y0: worldScreenY(m.y) * ky, x1: worldScreenX(m.x + m.w) * kx, y1: worldScreenY(m.y + m.h) * ky });
    const found = (A, B, m) => {
      const r = devRect(m);
      const x0 = Math.ceil(r.x0 + 1), x1 = Math.floor(r.x1 - 1), y0 = Math.ceil(r.y0 + 1), y1 = Math.floor(r.y1 - 1);
      if (x0 < 0 || y0 < 0 || x1 > CW || y1 > CH || x1 <= x0 || y1 <= y0) return { on: 0, at: null, rect: [x0, y0, x1, y1] };
      let n = 0, k = 0, sx = 0, sy = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { n++; const i = (y * CW + x) * 4; if (changed(A, B, i)) { k++; sx += x; sy += y; } }
      return { on: +(k / Math.max(1, n)).toFixed(2), at: k ? [+(sx / k).toFixed(1), +(sy / k).toFixed(1)] : null };
    };
    // where a body is drawn: the centroid and the count of the pixels that change when it is not
    const blob = (A, B) => {
      let k = 0, sx = 0, sy = 0;
      for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) { const i = (y * CW + x) * 4; if (changed(A, B, i)) { k++; sx += x; sy += y; } }
      return k ? { n: k * 4, at: [Math.round(sx / k), Math.round(sy / k)] } : { n: 0, at: null };
    };
    const out = {};
    for (const id of rooms) {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, crystal: 1, bossChime: 0 });
      // each guardian as she meets it: GRAVEHORN guards the marble (before she has it), TALONHOST waits for the joined blade
      if (id === 'CV3') sv.flags.crystal = 0;
      if (id === 'B4') Object.assign(sv.flags, { crystal2: 1, connector: 1 });
      startGame(sv); kx = cv.width / 960; ky = cv.height / 540; CW = cv.width; CH = cv.height;
      try { loadRoom(id); } catch (e) { out[id] = { err: String(e).slice(0, 80) }; continue; }
      G.state = 'PLAY'; G.dialog = G.cut = G.meet = G.wake = G.tut = null; G.enemies = [];
      const b = G.boss; if (!b) { out[id] = { noBoss: 1 }; continue; }
      b.st = 'idle'; b.t = 99; b.vx = 0; b.meet = false;
      let T = performance.now();
      const hold = () => { player.iT = 99; player.hp = 999; player.dead = false; player.cores = player.maxCores(); b.st = b.st === 'dorm' || b.st === 'intro' ? 'idle' : b.st; b.t = Math.max(b.t || 0, 1); b.vx = 0; G.dialog = G.cut = G.meet = null; G.state = 'PLAY'; };
      const loop = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; hold(); try { mainLoop(T); } catch (e) { out[id] = { err: String(e).slice(0, 80) }; return false; } } return true; };
      const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
      const stand = (x) => { player.x = x - player.w / 2; const g = typeof groundColumnAt === 'function' ? groundColumnAt(x) : null; player.y = (g ? Math.min.apply(null, g) : H - 2 * TILE) - player.h - 1; player.vx = player.vy = 0; };
      stand(W * 0.5); if (!loop(240)) continue;
      // the art streams in: give the page real time to decode it (nothing loads inside one long synchronous run)
      for (let i = 0; i < 25; i++) { await new Promise(r => setTimeout(r, 100)); if (!loop(2)) break; }
      if (out[id]) continue;
      const fit = Math.min(960 / W, 540 / H, typeof PRESENTATION !== 'undefined' ? PRESENTATION.explorationZoom : 9);
      const ends = [{ x: 2, y: H / 2 - 10, w: 16, h: 20 }, { x: W - 18, y: H / 2 - 10, w: 16, h: 20 }];
      const mid = { x: W / 2 - 8, y: H / 2 - 10, w: 16, h: 20 };
      const want = Math.min(PRESENTATION.explorationZoom, Math.min(960 / W, 540 / H) * BOSS_FRAME_IN);
      const poses = [];
      const shoot = (name) => {
        player.iT = 0;                     // drawn at full strength (the i-frame blink would halve her)
        const z = worldZoom(), vl = cam.x + 480 - 480 / z;
        const far = { x: vl + 960 / z - 20 - 8, y: cam.y + 270 - 8, w: 16, h: 16 };   // 20 px inside the view's right edge
        const Tf = now0();
        MARK = null; const plain = frame(Tf);
        MARK = ends.concat([mid], z < 0.999 ? [far] : []); const marked = frame(Tf); MARK = null;
        const pd = player.draw; player.draw = () => {}; const noHer = frame(Tf); player.draw = pd;
        const fd = window.foeDraw; window.foeDraw = function (x, e) { if (e !== b) return fd.apply(this, arguments); }; const noHim = frame(Tf); window.foeDraw = fd;
        const her = blob(plain, noHer), him = blob(plain, noHim);
        const at = (e) => [Math.round(worldScreenX(e.x + e.w / 2) * kx), Math.round(worldScreenY(e.y + e.h / 2) * ky)];
        const inCanvas = (e) => { const p = at(e); return p[0] > 0 && p[0] < CW && p[1] > 0 && p[1] < CH; };
        const near = (bl, e, tol) => !!(bl.at && Math.hypot(bl.at[0] - at(e)[0], bl.at[1] - at(e)[1]) <= tol);
        const L = found(marked, plain, ends[0]), Rr = found(marked, plain, ends[1]), M = found(marked, plain, mid);
        poses.push({ name, z: +z.toFixed(3), L: L.on, R: Rr.on, Lat: L.at, Rat: Rr.at, M: M.on, Mat: M.at, seen: Math.min(1, 960 / z / W),
          far: z < 0.999 ? found(marked, plain, far).on : null, farX: z < 0.999 ? Math.round(far.x + 8 - vl) : null,
          her: her.n, herOk: her.n >= 150 && near(her, player, Math.max(48, player.h * z * kx)),
          him: him.n, himOk: him.n < 150 ? inCanvas(b) : near(him, b, Math.max(64, Math.max(b.w, b.h) * z * kx)),
          herAt: her.at, herWant: at(player), himAt: him.at, himWant: at(b) });
        player.iT = 99;
      };
      shoot('mid');
      stand(3 * TILE); loop(40); shoot('west end');
      stand(W - 3 * TILE); loop(40); shoot('east end');
      player.y = 4 * TILE; player.vy = 0; loop(8); shoot('high');
      stand(W * 0.5); player.vy = -760; player.on = false; loop(18); shoot('jump');
      const spread = (k, j) => { const v = poses.map(p => p[k] && p[k][j]).filter(v => v != null); return v.length === poses.length ? +(Math.max(...v) - Math.min(...v)).toFixed(1) : 999; };
      const pw = poses.find(p => p.name === 'west end'), pe = poses.find(p => p.name === 'east end');
      out[id] = { kind: b.kind, zoom: +cam.zoom.toFixed(3), fit: +want.toFixed(3), poses,
        most: Math.min(...poses.map(p => p.seen)) >= 1 / 1.15 - 0.005,
        edges: poses.some(p => p.L >= 0.8) && poses.some(p => p.R >= 0.8),
        still: spread('Mat', 1), slides: pw.Mat && pe.Mat ? Math.abs(pw.Mat[0] - pe.Mat[0]) : null, needSlide: 960 / cam.zoom < W - 4,
        bodies: poses.every(p => p.herOk && p.himOk), himDrawn: poses.some(p => p.him >= 150),
        wide: poses.every(p => p.far == null || p.far >= 0.8), below1: poses.some(p => p.far != null) };
    }
    window.drawCaveDark = dark0;
    return out;
  });
  const ids = Object.keys(R);
  const ok = (r) => r && !r.err && !r.noBoss;
  const by = (f) => Object.fromEntries(ids.map(id => [id, ok(R[id]) ? f(R[id]) : R[id]]));
  check('A  every boss fight is zoomed 15% in from fitting its room', ids.length >= 10 && ids.every(id => ok(R[id]) && Math.abs(R[id].zoom - R[id].fit) < 0.01), by(r => [r.zoom, r.fit]));
  check('B  most of the arena is on screen (>= 1/1.15 of its width), and the frame reaches each end of it', ids.every(id => ok(R[id]) && R[id].most && R[id].edges), by(r => r.most && r.edges ? true : r.poses.map(p => p.name + ' seen' + p.seen.toFixed(2) + ' L' + p.L + ' R' + p.R).join(', ')));
  check('C  the frame never moves up or down (the middle mark on one canvas row in every pose, <= 2 px), and slides sideways between the ends', ids.every(id => ok(R[id]) && R[id].still <= 2 && (!R[id].needSlide || R[id].slides > 8)), by(r => 'dy ' + r.still + ', slide ' + r.slides));
  check('D  the guardian and she are both drawn on the canvas, where worldScreenX/Y put them', ids.every(id => ok(R[id]) && R[id].bodies), by(r => r.bodies ? true : r.poses.filter(p => !p.herOk || !p.himOk).map(p => ({ pose: p.name, her: [p.her, p.herAt, p.herWant], him: [p.him, p.himAt, p.himWant] }))));
  // (in a pose where a guardian draws nothing — MIREJAW under the water — he is held to the projection only)
  check('D2 ...and every guardian is seen drawn by its pixels in at least one pose', ids.every(id => ok(R[id]) && R[id].himDrawn), { notDrawn: ids.filter(id => ok(R[id]) && !R[id].himDrawn) });
  check('E  a zoom below 1 is drawn: a mark 20 px inside the view\'s right edge (more than 960 px of world from its left) is on the canvas', ids.some(id => ok(R[id]) && R[id].below1) && ids.every(id => ok(R[id]) && R[id].wide), by(r => r.below1 ? r.poses.map(p => p.far + '@' + p.farX).join(' ') : 'z>=1'));
  check('F  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every boss fight frames most of its arena, sliding sideways only, on the canvas');
})().catch(e => { console.error(e); process.exit(1); });
