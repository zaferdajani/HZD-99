// AN ATTACK IN THE AIR IS A DIFFERENT MOVE, AND THE DRAWING HAS TO AGREE.
//
// The mechanics have always known: swing.ay > 0 while airborne IS the pogo, and
// the `plunge` skill hangs a floor shockwave off exactly that. The RENDERER did
// not know, because swingVis carried the swing's angle and never whether her
// feet were on the ground — so a plunge onto an enemy's head drew the standing
// jab, and had done since the strips were first wired.
//
// The air and down sheets have not been delivered. That makes the interesting
// case the FALLBACK, and it is the one a careless fix gets wrong: routing an
// airborne swing to a strip that does not exist makes drawRoboSwing return
// false, and an animated combo swing is replaced by one held pose. Worse than
// the wrong animation, and invisible in a screenshot.
//
// So both directions are measured here. Today, airborne attacks must still play
// the grounded combo strips. With a sheet present — faked by pointing an `air`
// entry at an existing strip — the same input must select it instead. The day
// the real sheets land, that second half stops being a simulation.
//
//   node tests/airattack.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── airattack — a strike in the air is its own move, once it has one\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    const out = {};

    // the renderer can SEE the difference now — this is the field that was missing
    const vis = (air, ay, combo) => ({ air, ay, combo, charged: false });
    out.groundJab   = heroSwingState(vis(false, 0, 0));
    out.groundCross = heroSwingState(vis(false, 0, 1));
    out.groundFin   = heroSwingState(vis(false, 0, 2));
    out.charged     = heroSwingState({ air: true, ay: 1, combo: 0, charged: true });

    // unfired: airborne must still play the grounded combo, never fall to a pose
    out.airNoArt  = heroSwingState(vis(true, 0, 0));
    out.downNoArt = heroSwingState(vis(true, 1, 0));

    // ...and with a sheet present the same inputs route to it. Borrow claw_2's
    // real strip so the entry is indistinguishable from a fired one.
    const borrowed = { key: SWING_STRIP.claw_2.key, cells: SWING_STRIP.claw_2.cells, k: SWING_STRIP.claw_2.k };
    SWING_STRIP.air = borrowed; SWING_STRIP.down = borrowed;
    out.airArt  = heroSwingState(vis(true, 0, 0));
    out.downArt = heroSwingState(vis(true, 1, 0));
    out.airStillGround = heroSwingState(vis(false, 0, 1));   // grounded unaffected
    delete SWING_STRIP.air; delete SWING_STRIP.down;

    // AND THE REAL THING: jump for real, then strike inside the air window.
    // Her hop lasts about five frames at harness frame rates, so the press has
    // to go in WHILE she is off the ground — attacking after a fixed wait lands
    // after she does, records air:false, and looks exactly like a broken flag.
    player.swingVis = null; player.swing = null;
    player.atkCD = 0; player.combo = 0; player.comboT = 0; player.volts = 99;
    player.jbuf = 0.12;
    out.airFrames = 0;
    for (let i = 0; i < 14 && !player.swingVis; i++) {
      await new Promise(k => requestAnimationFrame(k));
      if (!player.on) {
        out.airFrames++;
        keys['KeyX'] = 1; keysP['KeyX'] = 1;
      }
    }
    delete keys['KeyX']; delete keysP['KeyX'];
    out.liveAir = player.swingVis ? !!player.swingVis.air : null;
    out.liveHasAy = player.swingVis ? typeof player.swingVis.ay : null;
    return out;
  });

  check('a grounded combo is untouched', r.groundJab === 'claw_1' && r.groundCross === 'claw_2'
    && r.groundFin === 'finisher', [r.groundJab, r.groundCross, r.groundFin].join(','));
  check('the charged burst still wins over everything', r.charged === 'burst', r.charged);
  check('with no air sheet, an airborne strike keeps the animated combo',
    r.airNoArt === 'claw_1', r.airNoArt);
  check('...and so does a downward one, rather than dropping to a held pose',
    r.downNoArt === 'claw_1', r.downNoArt);
  check('once an air sheet exists the airborne strike selects it', r.airArt === 'air', r.airArt);
  check('...and a downward one selects the down sheet', r.downArt === 'down', r.downArt);
  check('...without disturbing the grounded combo', r.airStillGround === 'claw_2', r.airStillGround);
  check('she really does leave the ground in this test', r.airFrames > 0, r.airFrames + ' airborne frames');
  check('a real airborne attack records that it was airborne', r.liveAir === true, String(r.liveAir));
  check('...and carries its aim to the renderer', r.liveHasAy === 'number', String(r.liveHasAy));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
