// THE MARBLE STANDS ON THE GROUND SHE STANDS ON.
//
// The owner, 2026-11-15: "I just found a marble. It's located above the ground.
// The ground is tilted down beneath it, so I can't actually stand on top of it
// or next to it. I'm standing underneath it, which is a glitch."
//
// Measured: the pillar was spawned on tile row 15 and the quarry is carved a
// row deeper there — a bowl whose surface runs 498-503 px — so the stone hung
// 18 to 23 px in the air over the hollow she walks into.
//
//   A  the stone's base is on the ground under it (within 8 px, never above it);
//   B  standing beside it she is at its base, not under it;
//   C  from there the charged claw still takes it;
//   D  the stump it leaves stands on the same ground.
//
//   node tests/marble-seat.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── marble-seat — the raw marble is on the quarry floor, not over it');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, beacon: 1, bossHorn: 1, ghMet: 1, burstDone: 1 }); startGame(sv);
      loadRoom('CV3'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = [];
      const s = G.statics.find(q => q.type === 'pillar'); if (!s) return { none: 1 };
      // (a column of the stone that is set INTO the back wall has no floor under
      // it to compare with — 2026-11-16, the stone stands against the wall)
      const under = [0.15, 0.5, 0.85].map(o => groundColumnAt(s.x + s.w * o)).filter(g => g && g.length).map(g => Math.min.apply(null, g));
      const out = { base: +(s.y + s.h).toFixed(1), under: under.map(v => +v.toFixed(1)), was: s.seat0 };
      // beside it, on the floor
      player.x = s.x - 40; const g = groundColumnAt(player.x + player.w / 2); player.y = Math.min.apply(null, g) - player.h; player.vx = player.vy = 0;
      for (let i = 0; i < 40; i++) { player.iT = 9; update(1 / 60); G.dialog = null; G.state = 'PLAY'; G.panels = null; }
      out.feet = +(player.y + player.h).toFixed(1); out.on = !!player.on;
      // the charged claw, by real input
      player.volts = 100; for (const k in keys) keys[k] = 0; keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keysP.KeyX = 0;
      for (let i = 0; i < 120 && player.chargeT < 0.62; i++) { player.iT = 9; update(1 / 60); G.hitStop = 0; }
      keys.KeyX = 0; for (let i = 0; i < 20; i++) { update(1 / 60); G.hitStop = 0; G.dialog = null; G.state = 'PLAY'; }
      out.taken = !G.statics.some(q => q.type === 'pillar') && !!G.save.flags.pl_cshard;
      out.stump = +(pgFloorY(PG_STONE_X()) + 5).toFixed(1);
      return out;
    });
    if (R.none) check('the pillar is in the quarry', false);
    else {
      const low = Math.max.apply(null, R.under);
      check('A  the stone\'s base is on the ground under it, never above it', R.base >= low - 0.5 && R.base - low <= 8, 'base ' + R.base + ', ground under it ' + R.under.join(' / ') + ' (it was spawned at ' + R.was + ')');
      check('B  standing beside it she is at its base, not underneath it', R.on && Math.abs(R.feet - R.base) <= 26, 'her feet ' + R.feet + ', its base ' + R.base);
      check('C  from there the charged claw takes it', R.taken);
      check('D  the stump stands on the same ground', Math.abs(R.stump - R.base) <= 8, 'stump base ' + R.stump);
    }
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nmarble-seat: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
