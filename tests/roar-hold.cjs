// NULLFANG'S ROAR HOLDS HER STILL — owner, 2026-11-27: "Whenever the nilfang appears to intimidate the
// player, screen should freeze, I should freeze instead of glitching. That might make me fall down."
// His roar used to throw her (300-640 px/s and a hop) with the frame shaking and bent round her (a
// shock ripple that slips slices of the picture): off a palm's crown that was a fall. Now it holds
// her where she stands (js/entities.js playerAwe), and the frame holds still with her.
//   A  the meeting's roar (A2): she is held — not one pixel of travel with the stick pushed away, for
//      about a second, the frame does not shake and is not bent, and then she is hers again
//   B  ...the same roar finding her in the air: held where she hangs, and then she comes down on
//      the floor under her (never through it, never thrown)
//   C  his roar in the fight (A4), standing on a palm's crown: held on the crown, and still on it after
//   D  ...the break's big roar the same, and the wake's roar
//   E  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── roar-hold — NULLFANG\'s roar freezes her where she stands, and the frame stays still');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const out = {};
    const shakeOf = () => Math.max(cam.shake || 0, 0);
    const ripples = () => (typeof RIPPLES !== 'undefined' ? RIPPLES.length : 0);
    // ---- A / B: the meeting ----
    const meet = (air) => {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1 }); startGame(sv);
      loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; G.enemies = [];
      player.x = MEET_X + 10; const g2 = groundColumnAt(player.x + 12); if (g2) player.y = Math.min.apply(null, g2) - player.h - 1;
      const M = { held: 0, moved: 0, shake: 0, ripples: 0, flash: 0, released: false, landedOn: null, standY: null };
      let sx = null, sy = null, wasHeld = false, lifted = false;
      for (let i = 0; i < 900; i++) {
        for (const k in keys) keys[k] = 0;
        const roared = G.boss && G.boss.roared && G.meet && G.meet.ph === 'roar';
        // B: in the air at the moment it roars — she jumped a beat before
        if (air && G.meet && G.meet.ph === 'roar' && !lifted && G.boss && G.boss.t <= 0.8) { lifted = true; M.standY = Math.round(player.y + player.h); player.on = false; player.vy = -420; player.y -= 30; }
        if (roared) keys.ArrowLeft = 1;                     // she tries to run the moment it roars
        update(1 / 60); if (G.dialog) { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); }
        const held = (player.aweT || 0) > 0;
        if (held) { M.held++; if (sx == null) { sx = player.x; sy = player.y; M.at = [Math.round(sx), Math.round(sy)]; } M.moved = Math.max(M.moved, Math.abs(player.x - sx) + Math.abs(player.y - sy));
          M.shake = Math.max(M.shake, shakeOf()); M.ripples = Math.max(M.ripples, ripples()); M.flash = Math.max(M.flash, G.flash || 0); }
        if (wasHeld && !held) M.released = true;
        wasHeld = held;
        if (M.released && player.on && M.landedOn == null) M.landedOn = Math.round(player.y + player.h);
        if (!G.meet && i > 300) break;
      }
      return M;
    };
    out.A = meet(false); out.B = meet(true);
    // ---- C / D: in his arena ----
    const arena = (kind) => {
      const s3 = newSave(1); s3.time = 99; s3.storyVersion = 2; Object.assign(s3.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(s3);
      loadRoom('A4'); G.state = 'PLAY'; G.dialog = G.wake = G.cut = G.bossEntry = null; G.enemies = [];
      const bo = G.boss;
      // a palm's crown: the first run of '=' three tiles long
      let pr = null; for (let ty = 3; ty < G.roomDef.h - 2 && !pr; ty++) { let run = 0; for (let tx = 1; tx < G.roomDef.w; tx++) { if (G.grid[ty][tx] === '=') run++; else { if (run >= 3) { pr = [(tx - run / 2) * TILE, ty * TILE]; break; } run = 0; } } }
      if (!pr) return { err: 'no crown' };
      player.x = pr[0] - player.w / 2; player.y = pr[1] - player.h - 1; player.vx = player.vy = 0;
      for (let i = 0; i < 10; i++) { player.iT = 9; G.state = 'PLAY'; G.dialog = null; bo.st = bo.st === 'dorm' ? 'idle' : bo.st; player.update(1 / 60); }
      const crownY = player.y, onCrown0 = player.on;
      // he stands a little off, on the floor, and roars at her
      const fg = groundColumnAt(pr[0] + 150); bo.x = pr[0] + 150 - bo.w / 2; bo.y = (fg ? Math.min.apply(null, fg) : bo.y + bo.h) - bo.h; bo.vx = bo.vy = 0; bo.on = true; bo.face = -1;
      if (kind === 'intro') { bo.st = 'intro'; bo.t = 0.9; bo.roared = false; }
      else { bo.st = 'roar'; bo.t = 0.8; bo.roared = false; if (kind === 'big') bo.roarBig = 1; }
      const M = { held: 0, moved: 0, shake: 0, ripples: 0, kind, crownY: Math.round(crownY), onCrown0 };
      let sx = null, sy = null;
      for (let i = 0; i < 150; i++) {
        for (const k in keys) keys[k] = 0; keys.ArrowRight = 1;    // pushing toward him the whole time
        player.iT = 9; G.dialog = null; G.state = 'PLAY';
        update(1 / 60);
        if ((player.aweT || 0) > 0) { M.held++; if (sx == null) { sx = player.x; sy = player.y; } M.moved = Math.max(M.moved, Math.abs(player.x - sx) + Math.abs(player.y - sy)); M.shake = Math.max(M.shake, shakeOf()); M.ripples = Math.max(M.ripples, ripples()); }
        else if (M.held > 0) break;
      }
      M.after = { on: !!player.on, dy: Math.round(player.y - crownY) };
      return M;
    };
    out.C = arena('roar'); out.D = arena('big'); out.E = arena('intro');
    return out;
  });
  const A = R.A, B = R.B;
  check('A  the meeting\'s roar holds her: held about a second, not a pixel of travel with the stick pushed away', A.held >= 50 && A.held <= 90 && A.moved < 0.5, { heldFrames: A.held, moved: +A.moved.toFixed(2) });
  check('   ...the frame does not shake, bend or white out while it holds her', A.shake <= 1 && A.ripples === 0 && A.flash <= 0.05, { shake: +A.shake.toFixed(2), ripples: A.ripples, flash: +A.flash.toFixed(2) });
  check('   ...and then she is hers again', A.released, A.released);
  check('B  caught in the air: held where she hangs, then down on the floor under her (the meadow rolls: within 8 px of where she jumped from)', B.held >= 50 && B.moved < 0.5 && B.released && B.landedOn != null && B.at && B.at[1] < B.standY - 20 && Math.abs(B.landedOn - B.standY) <= 8, { held: B.held, moved: +B.moved.toFixed(2), heldAt: B.at, stoodAt: B.standY, landedOn: B.landedOn });
  for (const [tag, M] of [['C  in his fight', R.C], ['D  the break\'s big roar', R.D], ['   the wake\'s roar', R.E]]) {
    check(tag + ': held on the palm\'s crown and still on it after, the frame still', !M.err && M.onCrown0 && M.held >= 20 && M.moved < 0.5 && M.after.on && Math.abs(M.after.dy) <= 2 && M.shake <= 1 && M.ripples === 0, M);
  }
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the roar freezes her where she stands, on the ground, in the air and on a palm');
})().catch(e => { console.error(e); process.exit(1); });
