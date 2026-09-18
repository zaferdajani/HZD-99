// AN ATTACK IN THE AIR IS A DIFFERENT MOVE, AND THE DRAWING HAS TO AGREE.
//
// The mechanics have always known: swing.ay > 0 while airborne IS the pogo, and
// the `plunge` skill hangs a floor shockwave off exactly that. The RENDERER did
// not know, because swingVis carried the swing's angle and never whether her
// feet were on the ground — so a plunge onto an enemy's head drew the standing
// jab, and had done since the strips were first wired.
//
// The air and down sheets have now been delivered (2026-09-18, swingAir /
// swingDown, six cells each) and SWING_STRIP.air/.down are permanent entries.
// But the FALLBACK this test exists to guard is not retired by that: the next
// strip that has not shipped yet hits the exact same code path, and routing an
// airborne swing to a strip that does not exist makes drawRoboSwing return
// false, replacing an animated combo swing with one held pose — worse than the
// wrong animation, and invisible in a screenshot. So the fallback is still
// measured, by temporarily DELETING the now-real entries rather than assuming
// their absence, and restored before the "sheet present" half runs against the
// genuine shipped strips — no more borrowing claw_2's cells to fake it.
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

    // unfired: simulate the day before delivery by removing the now-real
    // entries, and confirm the fallback still plays the grounded combo rather
    // than falling to a held pose.
    const realAir = SWING_STRIP.air, realDown = SWING_STRIP.down;
    delete SWING_STRIP.air; delete SWING_STRIP.down;
    out.airNoArt  = heroSwingState(vis(true, 0, 0));
    out.downNoArt = heroSwingState(vis(true, 1, 0));

    // ...and restored, the same inputs route to the genuine shipped strips.
    SWING_STRIP.air = realAir; SWING_STRIP.down = realDown;
    out.airArt  = heroSwingState(vis(true, 0, 0));
    out.downArt = heroSwingState(vis(true, 1, 0));
    out.airStillGround = heroSwingState(vis(false, 0, 1));   // grounded unaffected

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
