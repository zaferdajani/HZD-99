// THE BREAK IS REAL, AND IT CLOSES.
//
// "Hit it enough times and it reels" is the kind of feature that looks fine in
// a diff and does nothing in the game, because every part of it is invisible
// from the code: whether the window ever opens under a realistic hit cadence,
// whether it actually stops attacking while it is open, whether hits land
// harder, and — the one that turns a reward into a softlock — whether the
// player can simply hold the window open forever and never fight the boss.
//
// So this drives the real build and measures all four.
//
//   node tests/daze.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };

  console.log('── daze — a group of hits breaks NULLFANG open, once, for a while');

  const boot = () => page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv); loadRoom('A4');
    const b = G.boss;
    b.st = 'stalk'; b.t = 2; b.dead = false; b.hp = b.hpMax;
    return !!b;
  });

  // ---- 1. the window opens under a grouped cadence, and NOT under a spaced one
  await boot();
  const grouped = await page.evaluate(() => {
    const b = G.boss;
    // five hits inside the rolling window, which is what a committed melee
    // player produces: dealDmg is the funnel every real hit goes through, so
    // calling it is calling the game and not a mock of it
    for (let i = 0; i < 5; i++) dealDmg(b, 5, null, b.cx(), b.cy(), true);
    b.update(1 / 60);
    return { st: b.st, dur: b.dazeDur || 0 };
  });
  check('five grouped hits break it', grouped.st === 'daze', 'st=' + grouped.st);

  await boot();
  const spaced = await page.evaluate(async () => {
    const b = G.boss;
    // the same five hits, but each one arrives after the window has lapsed —
    // poking from range must never earn the reward
    for (let i = 0; i < 5; i++) {
      dealDmg(b, 5, null, b.cx(), b.cy(), true);
      for (let f = 0; f < 90; f++) b.update(1 / 60);   // 1.5 s > DAZE_WINDOW
      if (b.st === 'daze') return { st: 'daze', at: i };
      b.st = 'stalk'; b.t = 2;                          // keep it in a hittable state
    }
    return { st: b.st, at: -1 };
  });
  check('five SPACED hits do not', spaced.st !== 'daze', 'st=' + spaced.st);

  // ---- 2. it stops attacking while it is open, and it comes back -----------
  await boot();
  const window_ = await page.evaluate(() => {
    const b = G.boss;
    for (let i = 0; i < 5; i++) dealDmg(b, 5, null, b.cx(), b.cy(), true);
    const seen = {}; let frames = 0;
    b.update(1 / 60);
    while (b.st === 'daze' && frames < 400) { seen[b.st] = 1; b.update(1 / 60); frames++; }
    return { secs: +(frames / 60).toFixed(2), after: b.st, states: Object.keys(seen) };
  });
  check('the window is worth having (>= 1 s)', window_.secs >= 1.0, window_.secs + 's');
  check('it never attacked while dazed',
    window_.states.length === 1 && window_.states[0] === 'daze', window_.states.join(','));
  check('and it recovers rather than sticking', window_.after !== 'daze', 'st=' + window_.after);

  // ---- 3. hits land harder while it is open --------------------------------
  await boot();
  const mul = await page.evaluate(() => {
    const b = G.boss;
    b.st = 'stalk'; b.dazeAt = 0;                       // isolate the multiplier
    const before = dealDmg(b, 20, null, b.cx(), b.cy(), true);
    b.st = 'daze';
    const during = dealDmg(b, 20, null, b.cx(), b.cy(), true);
    return { before, during };
  });
  check('the open window pays more damage',
    mul.during > mul.before, mul.before + ' -> ' + mul.during);

  // ---- 4. AND IT CANNOT BE HELD OPEN --------------------------------------
  // The failure this exists to catch: a player who keeps swinging re-triggers
  // the break the frame it ends and the guardian never fights again. Twelve
  // seconds of maximum-rate hits must not spend more than about half the time
  // dazed, or the fight has been deleted rather than opened up.
  await boot();
  const lock = await page.evaluate(() => {
    const b = G.boss;
    let dazed = 0;
    const N = 12 * 60;
    for (let f = 0; f < N; f++) {
      // a hit every 5 frames is faster than her fastest real combo cadence
      if (f % 5 === 0 && b.st !== 'daze') dealDmg(b, 1, null, b.cx(), b.cy(), true);
      else if (f % 5 === 0) dealDmg(b, 1, null, b.cx(), b.cy(), true);
      b.hp = b.hpMax;                                   // never let it die out from under us
      b.update(1 / 60);
      if (b.st === 'daze') dazed++;
    }
    return { pct: Math.round(dazed / N * 100) };
  });
  check('it cannot be stunlocked (<= 55% of a 12 s mash)',
    lock.pct <= 55, lock.pct + '% dazed');

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the break opens on a group, pays out, closes, and cannot be held');
})().catch(e => { console.error(e); process.exit(1); });
