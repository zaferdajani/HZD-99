// THE GLIDE (js/glide.js, handoff Part 2 B3), against the real build.
//
// With the double jump spent, holding JUMP while falling caps her fall; let go
// and she drops; never before the double jump is spent, never without the
// jetpack. Measured through keydown events and the game's own clock.
//
//   node tests/glide.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── glide — the jets hold her after the double jump, for as long as JUMP is held\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof glideStep === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const down = code => dispatchEvent(new KeyboardEvent('keydown', { code }));
    const up = code => dispatchEvent(new KeyboardEvent('keyup', { code }));
    const boot = async (abil) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      Object.assign(sv.abil, abil);
      startGame(sv); loadRoom('A1');
      G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null; G.bossEntry = null;
      await frames(30);
    };
    // the open column the soar harness uses: A1, ten clear tiles over the floor
    const colClear = (tx, ty, n) => { for (let k = 1; k <= n; k++) if (solidAt(tx, ty - k) || solidAt(tx + 1, ty - k)) return false; return true; };
    let spot = null;
    const findSpot = () => {
      for (let ty = 3; ty < G.roomDef.h - 1 && !spot; ty++) for (let tx = 2; tx < G.roomDef.w - 3; tx++)
        if (solidAt(tx, ty) && solidAt(tx + 1, ty) && colClear(tx, ty, 10)) { spot = { tx, ty }; break; }
    };
    // drop her from eight tiles up, double jump already spent or not, JUMP held
    // or not; report the fastest fall and how long the drop took
    const drop = async ({ spent, hold, releaseAfter }) => {
      player.x = spot.tx * TILE + 4; player.y = (spot.ty - 8) * TILE; player.vx = 0; player.vy = 0;
      player.on = false; player.airJumps = spent ? 0 : (hasMod('djump') ? 1 : 0); player.dashT = 0; player.grap = null; player.soar = null;
      // HELD, not pressed: a fresh press would fire the jump itself; this is
      // a JUMP still held from before the drop
      player.coyote = 0; player.jbuf = 0;
      if (hold) keys['Space'] = 1;
      let maxVy = 0, t = 0, glided = false, jetsDrawn = 0, n = 0;
      const t0 = performance.now();
      while (!player.on && n < 400) {
        await frames(1); n++;
        // her own jump presses nothing more: airJumps stays as set
        if (spent) player.airJumps = 0;
        if (player.glideT > 0) glided = true;
        if (releaseAfter && n === releaseAfter) delete keys['Space'];
        maxVy = Math.max(maxVy, player.vy);
      }
      delete keys['Space'];
      return { maxVy: Math.round(maxVy), glided, frames: n, landed: player.on };
    };
    await boot({});
    findSpot();
    const out = { spot };
    if (!spot) return out;
    out.noPack = await drop({ spent: true, hold: true });
    await boot({ djump: 1 });
    out.unspent = await drop({ spent: false, hold: true });
    out.plain = await drop({ spent: true, hold: false });
    out.glide = await drop({ spent: true, hold: true });
    out.letGo = await drop({ spent: true, hold: true, releaseAfter: 12 });
    // the jets: drawn while gliding, not otherwise
    const cv = document.createElement('canvas'); cv.width = G.roomDef.w * TILE; cv.height = G.grid.length * TILE;
    const jets = (g) => { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); player.glideT = g; drawGlideJets(c, player);
      const d = c.getImageData(Math.max(0, player.x - 20), player.y, 64, 64).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; };
    player.on = false; out.jetsOn = jets(0.3); out.jetsOff = jets(0);
    // the hint, at the first double jump
    await boot({ djump: 1 });
    player.on = false; player.vy = 100; player.airJumps = 1; player.jbuf = 0; player.coyote = 0;
    down('Space'); await frames(2); up('Space'); await frames(2);
    out.hint = { said: G.toasts.some(q => q.text === t('glide_hint')), flag: !!G.save.flags.glideHint };
    return out;
  });

  check('an open column to drop through', !!r.spot, JSON.stringify(r.spot));
  if (r.spot) {
    check('without the jetpack, holding JUMP does nothing: she falls', !r.noPack.glided && r.noPack.maxVy > 600, JSON.stringify(r.noPack));
    check('with the double jump not yet spent, holding JUMP does not glide', !r.unspent.glided, JSON.stringify(r.unspent));
    check('double jump spent, JUMP held: the fall is capped at 170 px/s', r.glide.glided && r.glide.maxVy <= 171, JSON.stringify(r.glide));
    check('...and the drop takes much longer than a plain fall (at least twice)', r.glide.frames >= r.plain.frames * 2, 'glide ' + r.glide.frames + ' frames vs plain ' + r.plain.frames);
    check('let go of JUMP and she drops again', r.letGo.glided && r.letGo.maxVy > 400, JSON.stringify(r.letGo));
    check('the hover jets are drawn while she glides, and not otherwise', r.jetsOn > 20 && r.jetsOff === 0, 'on ' + r.jetsOn + ', off ' + r.jetsOff);
    check('the first double jump says the jets can hold her, once', r.hint.said && r.hint.flag, JSON.stringify(r.hint));
  }
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
