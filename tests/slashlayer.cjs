// THE SLASH LAYER (handoff Part 2 D1, drawSlashLayer in js/entities.js).
//
// Her cut (the authored scratch, single_fx.webp — and the procedural rake when
// that body is drawn) used to be painted from inside Player.draw, with no glow
// of its own. This drives a real swing through the real draw and measures: the
// cut is not drawn inside her body pass but after it, a glow copy rides on top
// when the quality dial spends glow and not when it does not, and the copy
// actually adds light round the stroke.
//
//   node tests/slashlayer.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── slashlayer — her cuts on their own layer, drawn after her, with a glow copy on the dial\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof drawSlashLayer === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null;
    mediaFetch('swingSingleFx', 1);
    const ready = () => MEDIA_RAW.swingSingleFx && MEDIA_RAW.swingSingleFx.naturalWidth;
    for (let i = 0; i < 200 && !ready(); i++) await frames(1);
    await frames(20);
    const out = { sheet: !!ready() };
    // spy: which passes ran, and were any of them inside her body draw?
    let inBody = false, bodyRakes = 0;
    const oDraw = Player.prototype.draw, oRake = drawRake, oScr = Player.prototype.drawScratchWake;
    Player.prototype.draw = function (c) { inBody = true; try { return oDraw.call(this, c); } finally { inBody = false; } };
    window.drawRake = function (...a) { if (inBody) bodyRakes++; return oRake.apply(this, a); };
    Player.prototype.drawScratchWake = function (...a) { if (inBody) bodyRakes++; return oScr.apply(this, a); };
    // swing, and sample the passes across the swing's frames
    const swingAndWatch = async () => {
      const seen = [];
      player.atkCD = 0; player.comboT = 0;
      dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })); await frames(1);
      dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyX' }));
      for (let i = 0; i < 16; i++) { G.slashPasses = null; await frames(1); if (G.slashPasses && G.slashPasses.length) seen.push(G.slashPasses.slice()); }
      await frames(20);
      return seen;
    };
    QUAL.glow = true;
    const a = await swingAndWatch();
    out.glowOn = { frames: a.length, base: a.some(f => f.some(p => p.pass === 'base')), glow: a.some(f => f.some(p => p.pass === 'glow')) };
    QUAL.glow = false;
    const b = await swingAndWatch();
    out.glowOff = { frames: b.length, glow: b.some(f => f.some(p => p.pass === 'glow')) };
    QUAL.glow = true;
    out.bodyRakes = bodyRakes;
    Player.prototype.draw = oDraw; window.drawRake = oRake; Player.prototype.drawScratchWake = oScr;
    // the copy adds light: one mark drawn base-only and base+glow on a clean canvas
    {
      const keep = player.scratchWake;
      player.scratchWake = { t: 0.12, t0: 0.28, attackT: 0.1, combo: 1, charged: false, ang: 0, reach: 70, x: 200, y: 200 };
      const lit = (glow) => {
        const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
        const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 400, 400);
        player.scratchWake.x = 200; player.scratchWake.y = 200;
        player.drawScratchWake(c, 'base'); if (glow) player.drawScratchWake(c, 'glow');
        const d = c.getImageData(0, 0, 400, 400).data; let n = 0, sum = 0;
        for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; if (v > 30) n++; sum += v; }
        return { n, sum };
      };
      out.light = { base: lit(false), both: lit(true) };
      player.scratchWake = keep;
    }
    return out;
  });

  check('the authored scratch strip is loaded', r.sheet);
  check('a swing draws its cut on the slash layer', r.glowOn.frames > 0 && r.glowOn.base, JSON.stringify(r.glowOn));
  check('...never inside her body pass', r.bodyRakes === 0, 'rakes drawn inside Player.draw: ' + r.bodyRakes);
  check('the glow copy rides on top when the dial spends glow', r.glowOn.glow, JSON.stringify(r.glowOn));
  check('...and is skipped when it does not', r.glowOff.frames > 0 && !r.glowOff.glow, JSON.stringify(r.glowOff));
  check('the copy adds light round the stroke (a wider lit area, more light in total)',
    r.light.both.n > r.light.base.n * 1.1 && r.light.both.sum > r.light.base.sum, JSON.stringify(r.light));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
