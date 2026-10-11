// THE WINCH IS HIT FOR A REASON (owner, 2026-10-11: "There was no enemy
// outside. I had to hit a winch. I don't know why. It does not make any sense.
// Either I hit the winch to get something out of it, or I hit an enemy, but
// not just hitting for the sake of hitting.")
//
// Played through the real build with real inputs (keys + update()):
//   * the jammed arm is DOWN across the road and stops her walking east,
//     and a body already past the base is never pulled back through it;
//   * every strike knocks a scrap pickup out of the housing onto her side of
//     the road, capped per save, and she collects them as ordinary scrap;
//   * a Volt Burst let go far from the winch does not pass the lesson, and
//     says why; one let go beside it stops the winch, the arm lifts clear and
//     the road is open;
//   * a reload after the burst has no barrier and the arm stays up; a save
//     whose burst is behind her is never blocked; NOSTOS has no winch at all.
// Two screenshots at phone size: docs/studio/runs/2026-10-11/images/.
//
//   node tests/winch-purpose.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SHOTS = path.join(__dirname, '..', 'docs', 'studio', 'runs', '2026-10-11', 'images');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail == null ? '' : '  ' + JSON.stringify(detail)));
  if (!ok) fails.push(name);
};

async function boot(browser, page0) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/' + page0);
  await page.waitForFunction(() => typeof startGame === 'function' && typeof loadRoom === 'function', null, { timeout: 30000 });
  return { ctx, page, errs };
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const { ctx, page, errs } = await boot(browser, 'index.html');
    // ---- stage: the opening, at the strike lesson, on the waking floor ----
    await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;      // this harness owns the clock
      const sv = newSave(1); sv.time = 99;
      Object.assign(sv.flags, { woke: 1, opNote: 1, ratchetRepaired: 1, opTold: 1, ratchetSpareGiven: 1,
        opPod: 1, heal: 1, opScrap: 1, sawScrap: 1, tutId: 'atk', tutI: 11 });
      startGame(sv); loadRoom('A0');
      G.state = 'PLAY'; G.wake = G.cut = G.trans = G.dialog = null; G.toasts = [];
      window.__toasts = [];
      const toast0 = G.toast.bind(G);
      G.toast = (text) => { window.__toasts.push(text); toast0(text); };
      player.cores = player.maxCores(); player.volts = 0;
      for (const k of ['yardWinchBase', 'yardWinchArm']) mediaFetch(k);
      for (let i = 0; i < 300; i++) {
        const a = MEDIA_IMG.yardWinchBase, b = MEDIA_IMG.yardWinchArm;
        if (a && a.complete && a.naturalWidth && b && b.complete && b.naturalWidth) break;
        await new Promise(r => setTimeout(r, 20));
      }
    });
    // helpers live in the page
    await page.evaluate(() => {
      window.W = () => G.enemies.find(e => e && e.mechanism === 'winch');
      window.clearKeys = () => { for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0; };
      window.walk = (dir, frames) => {
        const k = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
        for (let i = 0; i < frames; i++) { keys[k] = 1; update(1 / 60); }
        keys[k] = 0; update(1 / 60);
      };
      window.strike = () => {
        keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keys.KeyX = 0; keysP.KeyX = 0;
        for (let i = 0; i < 26; i++) update(1 / 60);
      };
      window.release = () => {
        keys.KeyX = 1; keysP.KeyX = 1; update(1 / 60); keysP.KeyX = 0;
        for (let i = 0; i < 50; i++) update(1 / 60);
        keys.KeyX = 0; for (let i = 0; i < 4; i++) update(1 / 60);
        // (the burst's hit-stop holds the world a few frames; let it run out)
        for (let i = 0; i < 16; i++) update(1 / 60);
      };
      window.scraps = () => G.pickups.filter(p => p instanceof Scrap && !p.dead && !p.flagKey);
      window.frameOn = (e) => {
        // centred between her and the winch (worldScreenX: 480 + (x - cam.x - 480) * zoom)
        cam.x = e.x + e.w / 2 - 45 - 480; cam.y = e.y + e.h - 45 - 270;
        G.roomTitle = null; draw();
      };
    });

    // ---- 1. the arm is down across the road, and it stops her ----
    const walkIn = await page.evaluate(() => {
      const e = W();
      e.update(1 / 60);
      const floor = e.y + e.h, cx = e.x + e.w / 2, tip = e.armPoint();
      // from the booth's side of the road, walking east
      player.x = 12 * TILE; player.y = floor - player.h; player.vx = 0; player.on = true;
      walk(1, 240);
      return { step: opStepId(), calm: e.calm, angle: e.armAngle, tipX: tip.x, tipUp: floor - tip.y, cx,
        right: player.x + player.w, pc: player.x + player.w / 2, ready: tutorialReady(tutPrompt(TUT_STEPS[G.tut.i])) };
    });
    check('the strike lesson is running at the jammed winch', walkIn.step === 'atk' && walkIn.calm, walkIn);
    check('the jammed arm is down across the road (its end low, west of the base)',
      walkIn.tipUp > 0 && walkIn.tipUp < 30 && walkIn.tipX < walkIn.cx - 60, walkIn);
    check('walking east she is stopped at the arm, on the booth side', walkIn.right <= walkIn.tipX + 0.5 && walkIn.pc < walkIn.cx, walkIn);
    check('...and where it stops her the strike is ready (the chip names ATTACK)', walkIn.ready, walkIn);
    const jump = await page.evaluate(() => {
      const e = W();
      keysP.KeyZ = 1; keys.KeyZ = 1; keys.ArrowRight = 1;
      for (let i = 0; i < 70; i++) { update(1 / 60); keysP.KeyZ = 0; }
      clearKeys(); for (let i = 0; i < 60; i++) update(1 / 60);
      return { pc: player.x + player.w / 2, cx: e.x + e.w / 2 };
    });
    check('a jump does not carry her over the jam', jump.pc < jump.cx, jump);
    const pushed = await page.evaluate(() => {
      __toasts.length = 0; const e = W(); e.toldT = 0;
      G.tut.i = TUT_STEPS.findIndex(q => q.id === 'node');     // (a lesson whose chip does not say it)
      walk(1, 30);
      const said = __toasts.slice();
      G.tut.i = TUT_STEPS.findIndex(q => q.id === 'atk'); G.tut.hold = 0; G.tut.t = 1;
      return { said, want: t('op_winch_block') };
    });
    check('pushing on the arm says why the road is shut', pushed.said.includes(pushed.want), pushed);
    const noTrap = await page.evaluate(() => {
      const e = W(), cx = e.x + e.w / 2;
      player.x = cx + 30; player.vx = 0; update(1 / 60);
      const stayed = player.x + player.w / 2 > cx;
      walk(1, 30);
      const east = player.x + player.w / 2;
      // and back home, the way she came
      player.x = 12 * TILE; player.vx = 0; walk(1, 240);
      return { stayed, east, cx };
    });
    check('a body already past the base is never pulled back through it', noTrap.stayed && noTrap.east > noTrap.cx, noTrap);

    // ---- 2. every strike knocks scrap out of the housing ----
    const knocks = await page.evaluate(() => {
      const e = W(), scrap0 = G.save.scrap, rows = [];
      for (let k = 0; k < 7; k++) {
        const before = scraps().length, hp = e.hp;
        strike();
        rows.push({ hurt: e.hurtT > 0, hp: e.hp, flag: G.save.flags.winchKnock | 0 });
      }
      const flag = G.save.flags.winchKnock | 0;
      const live = scraps().map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      return { rows, flag, live, scrap0, stillJammed: !e.disabled && !G.save.flags.burstDone, step: opStepId() };
    });
    check('the strike lesson finishes on a real strike at the winch', knocks.step === 'burst', knocks.step);
    check('strikes knock scrap out (one piece per strike, capped at 4 per save)', knocks.flag === 4, knocks);
    check('strikes alone never stop the jammed winch', knocks.stillJammed, knocks);
    // photograph scrap mid-pop: a fresh strike with the cap lifted for the picture only
    await page.evaluate(() => {
      const e = W(); const f = G.save.flags.winchKnock; G.save.flags.winchKnock = 2;
      e.onStruck(); for (let i = 0; i < 4; i++) update(1 / 60); e.onStruck();
      for (let i = 0; i < 7; i++) update(1 / 60);
      frameOn(e);
      window.__photoScrap = scraps().length;
      G.save.flags.winchKnock = f;
    });
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, 'winch-strike-scrap.png') });
    const collect = await page.evaluate(() => {
      const before = G.save.scrap, n = scraps().length;
      const sides = scraps().map(p => p.x + p.w / 2 < W().x + W().w / 2);
      const pw = scraps().reduce((a, p) => a + p.val, 0);
      for (let i = 0; i < 60 * 5 && scraps().length; i++) update(1 / 60);
      return { n, worth: pw, gained: G.save.scrap - before, left: scraps().length, sides };
    });
    check('the knocked scrap lands on her side of the arm', collect.sides.length > 0 && collect.sides.every(Boolean), collect);
    check('she collects every piece as ordinary scrap', collect.left === 0 && collect.gained === collect.worth && collect.gained > 0, collect);

    // ---- 3. the burst: out of reach it does not count; beside it, it stops it ----
    const far = await page.evaluate(() => {
      __toasts.length = 0;
      const e = W(), floor = e.y + e.h;
      // (the chip keeps ATTACK shut this far from the winch — tutorialAllows —
      // so a far release only happens when a charge started beside it is let
      // go somewhere else; the release itself is what is driven here)
      player.x = 6 * TILE; player.y = floor - player.h; player.vx = 0; player.on = true;
      player.volts = Math.max(player.volts, BURST_VOLTS + 10);
      player.releaseCharged();
      for (let i = 0; i < 6; i++) update(1 / 60);
      return { burstDone: !!G.save.flags.burstDone, disabled: !!e.disabled, step: opStepId(), said: __toasts.slice(), want: t('op_burst_far') };
    });
    check('a burst let go far from the winch does not pass the lesson', !far.burstDone && !far.disabled && far.step === 'burst', far);
    check('...and says why', far.said.includes(far.want), far);
    const burst = await page.evaluate(() => {
      __toasts.length = 0;
      const e = W(), scrap0 = G.save.scrap;
      walk(1, 240);
      player.volts = Math.max(player.volts, BURST_VOLTS + 10);
      release();
      const a0 = e.armAngle;
      return { burstDone: !!G.save.flags.burstDone, disabled: !!e.disabled, paid: G.save.scrap - scrap0,
        said: __toasts.slice(), want: t('op_winch_down'), a0 };
    });
    check('a burst beside the winch stops it', burst.burstDone && burst.disabled, burst);
    check('...and says so', burst.said.includes(burst.want), burst);
    check("the burst still pays the winch's salvage once (12)", burst.paid === 12, burst);
    const lift = await page.evaluate(() => {
      // (the burst landed ~20 frames ago and the arm is already rising)
      const e = W(), floor = e.y + e.h, samples = [];
      for (let i = 0; i < 90; i++) { update(1 / 60); if (i % 15 === 0) samples.push(+e.armAngle.toFixed(3)); }
      const tip = e.armPoint();
      return { samples, angle: e.armAngle, tipUp: floor - tip.y, cx: e.x + e.w / 2 };
    });
    const mono = lift.samples.every((v, i) => !i || v <= lift.samples[i - 1]);
    check('the arm visibly lifts (over several frames, never back down)', mono && lift.samples[0] > lift.angle && lift.samples.length > 3, lift);
    check('...and comes to rest clear of the road', lift.tipUp > 120, lift);
    await page.evaluate(() => { const e = W(); player.x = e.x - 70; player.vx = 0; update(1 / 60); frameOn(e); });
    await page.screenshot({ path: path.join(SHOTS, 'winch-after-burst.png') });
    const open = await page.evaluate(() => {
      const e = W(); clearKeys();
      // the monument lesson is on the far side now; walk there
      walk(1, 120);
      return { pc: player.x + player.w / 2, cx: e.x + e.w / 2, step: opStepId() };
    });
    check('after the burst the road is open: she walks past the winch', open.pc > open.cx + 60, open);

    // ---- 4. a reload after the burst: no barrier, the arm stays up ----
    const reload = await page.evaluate(() => {
      persist();
      startGame(JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))));
      loadRoom('A0'); G.state = 'PLAY'; G.wake = G.cut = G.trans = G.dialog = null;
      const e = W(); update(1 / 60);
      const floor = e.y + e.h;
      player.x = 12 * TILE; player.y = floor - player.h; player.vx = 0; player.on = true;
      walk(1, 200);
      return { disabled: !!e.disabled, angle: e.armAngle, raised: WINCH_RAISED, pc: player.x + player.w / 2, cx: e.x + e.w / 2 };
    });
    check('reloaded after the burst the winch is still stopped and its arm up', reload.disabled && reload.angle === reload.raised, reload);
    check('...and nothing blocks the road', reload.pc > reload.cx + 60, reload);
    // ---- 5. a save whose burst is behind her is never blocked, even with the winch still running ----
    const legacy = await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99;
      Object.assign(sv.flags, { woke: 1, opNote: 1, ratchetRepaired: 1, opTold: 1, ratchetSpareGiven: 1,
        opPod: 1, heal: 1, opScrap: 1, sawScrap: 1, burstDone: 1, tutId: 'node', tutI: 13 });
      startGame(sv); loadRoom('A0'); G.state = 'PLAY'; G.wake = G.cut = G.trans = G.dialog = null;
      const e = W(); update(1 / 60);
      const floor = e.y + e.h;
      player.x = 12 * TILE; player.y = floor - player.h; player.vx = 0; player.on = true;
      walk(1, 200);
      return { jammed: !e.disabled, blocking: winchBlocking(e), pc: player.x + player.w / 2, cx: e.x + e.w / 2 };
    });
    check('a save with the burst behind her is never blocked', !legacy.blocking && legacy.pc > legacy.cx + 60, legacy);
    // ...nor a save whose whole walk is over
    const done = await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99; sv.flags.woke = sv.flags.tut = sv.flags.heal = 1;
      startGame(sv); loadRoom('A0'); G.state = 'PLAY'; G.wake = G.cut = G.trans = G.dialog = null;
      const e = W(); e.calm = true; update(1 / 60);
      const floor = e.y + e.h;
      player.x = 12 * TILE; player.y = floor - player.h; player.vx = 0; player.on = true;
      const before = G.pickups.length; e.onStruck(); const knocked = G.pickups.length - before;
      walk(1, 200);
      return { blocking: winchBlocking(e), knocked, pc: player.x + player.w / 2, cx: e.x + e.w / 2 };
    });
    check('after the tutorial: no barrier, no scrap from the winch', !done.blocking && done.knocked === 0 && done.pc > done.cx + 60, done);
    check('no page errors (CLAWBYTE)', errs.length === 0, errs);
    await ctx.close();

    // ---- 6. NOSTOS: its tutorial differs and it has no winch ----
    const H = await boot(browser, 'odyssey.html');
    const hero = await H.page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; sv.flags.woke = 1;
      startGame(sv); loadRoom('A0'); G.state = 'PLAY'; G.wake = G.cut = G.trans = G.dialog = null;
      const winch = G.enemies.some(e => e && (e.mechanism === 'winch' || (typeof YardWinch === 'function' && e instanceof YardWinch)));
      const knock = G.enemies.some(e => typeof e.onStruck === 'function');
      return { hero: isHero(), winch, knock };
    });
    check('NOSTOS: no yard winch, nothing knocks scrap, nothing blocks', hero.hero && !hero.winch && !hero.knock, hero);
    check('no page errors (NOSTOS)', H.errs.length === 0, H.errs);
    await H.ctx.close();
  } finally { await browser.close(); }
  if (fails.length) { console.log('\nFAIL winch-purpose: ' + fails.length + ' failed\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nPASS winch-purpose: the jammed arm blocks the road, every strike knocks scrap she collects, the burst lifts the arm and opens the way; reloads and NOSTOS unaffected');
})().catch(e => { console.error(e); process.exit(1); });
