// THE BRACE IS REAL, AND IT SURVIVED A MERGE.
//
// The guard arrived on the integration branch while this branch was replacing
// most of the hero's art, and the two lines of work collided in exactly the
// table the guard lives in (HERO_TRANS). Resolving that by hand is how a
// feature quietly disappears: keep the wrong side of one conflict hunk and the
// mechanic is still in the input map, still in the media manifest, still has
// its plate on disk — and never draws, because the one line that indexes it is
// gone. Nothing in the suite would have said so.
//
// So this measures the whole chain rather than the pose: the input raises the
// timer, the timer names the state, the state draws the guard plate, and a hit
// taken while braced shoves her far less than the same hit taken open.
//
//   node tests/guard.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── guard — she braces, and bracing costs the hit its push\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    mediaFetch('hzdGuard', 1);
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    const out = { declared: (HERO_TRANS.guard && HERO_TRANS.guard.key) || null };

    for (let i = 0; i < 10; i++) { keys['KeyL'] = 1; await new Promise(k => requestAnimationFrame(k)); }
    out.guardT = player.guardT;
    out.state = player.heroState(false);
    draw(performance.now());
    out.drawn = G.heroDrawn || G.lastStrip || null;

    // the same hit, braced and open, with iT cleared so neither is ignored
    player.iT = 0; player.vx = 0;
    player.hurt(1, player.x - 40, player.y);
    out.kbGuarded = Math.abs(player.vx);

    delete keys['KeyL'];
    for (let i = 0; i < 8; i++) await new Promise(k => requestAnimationFrame(k));
    out.released = player.guardT;
    player.iT = 0; player.vx = 0;
    player.hurt(1, player.x - 40, player.y);
    out.kbOpen = Math.abs(player.vx);
    return out;
  });

  check('the guard is still wired into the transition table', r.declared === 'hzdGuard', String(r.declared));
  check('holding GUARD raises the timer', r.guardT > 0, 'guardT ' + r.guardT);
  check('...and the timer names the state', r.state === 'guard', r.state);
  check('...and the state draws the guard plate', r.drawn === 'hzdGuard:0', String(r.drawn));
  check('letting go drops it', r.released === 0, 'guardT ' + r.released);
  check('a braced hit shoves her far less than an open one',
    r.kbOpen > 0 && r.kbGuarded < r.kbOpen * 0.6,
    'guarded ' + Math.round(r.kbGuarded) + ' vs open ' + Math.round(r.kbOpen));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
