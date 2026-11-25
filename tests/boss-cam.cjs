// A BOSS FIGHT IS ONE STILL PICTURE OF ITS WHOLE ARENA — owner, 2026-11-25: "make sure that when I
// stand on the palm, I'm still zoomed out enough to see the whole screen instead of the issue with
// the camera coming up with me, so I wouldn't be able to see Nilfang anymore. Camera should not
// move with me in the boss fight, as the screen should just zoom out to fill out all the screen
// with all the data needed without moving the camera with me, to avoid distraction. And focus on
// the fight." (js/engine.js updateCam, bossFit)
// For every boss arena in the game, with its guardian fighting:
//   A  the frame is the whole arena: zoomed until the room fits the screen
//   B  it does not move when she does: from one end of the floor to the other, up high, in the air
//   C  the guardian and she are both on screen wherever she is
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── boss-cam — every boss fight is one still picture of its whole arena');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(() => {
    const rooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'boss'));
    const out = {};
    for (const id of rooms) {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, crystal: 1, bossChime: 0 });
      // each guardian as she meets it: GRAVEHORN guards the marble (before she has it), TALONHOST waits for the joined blade
      if (id === 'CV3') sv.flags.crystal = 0;
      if (id === 'B4') Object.assign(sv.flags, { crystal2: 1, connector: 1 });
      startGame(sv);
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
      const xs = [], ys = [], seen = [];
      const inView = (e) => { const ex = worldScreenX(e.x + e.w / 2), ey = worldScreenY(e.y + e.h / 2); return ex > -4 && ex < 964 && ey > -4 && ey < 544; };
      const probe = () => { xs.push(cam.x); ys.push(cam.y); seen.push(inView(b) && inView(player)); };
      stand(3 * TILE); loop(40); probe();
      stand(W - 3 * TILE); loop(40); probe();
      player.y = 4 * TILE; player.vy = 0; loop(8); probe();             // high in the air
      stand(W * 0.5); player.vy = -760; player.on = false; loop(18); probe();   // a jump
      const fit = Math.min(960 / W, 540 / H, typeof PRESENTATION !== 'undefined' ? PRESENTATION.explorationZoom : 9);
      out[id] = { kind: b.kind, zoom: +cam.zoom.toFixed(3), fit: +fit.toFixed(3), dx: Math.round(Math.max(...xs) - Math.min(...xs)), dy: Math.round(Math.max(...ys) - Math.min(...ys)), seen: seen.every(Boolean) };
    }
    return out;
  });
  const ids = Object.keys(R);
  const ok = (r) => r && !r.err && !r.noBoss;
  check('A  every boss fight is framed as its whole arena (zoomed to fit the room)', ids.length >= 10 && ids.every(id => ok(R[id]) && Math.abs(R[id].zoom - R[id].fit) < 0.01), R);
  check('B  ...and the frame does not move when she does (floor end to end, high up, in a jump)', ids.every(id => ok(R[id]) && R[id].dx <= 2 && R[id].dy <= 2), Object.fromEntries(ids.map(id => [id, ok(R[id]) ? [R[id].dx, R[id].dy] : R[id]])));
  check('C  the guardian and she are both on screen wherever she is', ids.every(id => ok(R[id]) && R[id].seen), Object.fromEntries(ids.map(id => [id, ok(R[id]) ? R[id].seen : R[id]])));
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every boss fight is one still picture of its whole arena');
})().catch(e => { console.error(e); process.exit(1); });
