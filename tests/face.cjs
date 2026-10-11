// FACE ACTING (handoff Part 2 D4) — HZD-99's visor for the moments it sat out.
//
// heroMood() decides what she is feeling; HERO_MOOD turns it into the eye
// lights drawHeroEyes paints. This measures the three new faces end to end:
// each is reached by its real trigger (the reel, the soar, the counter; the
// repair landing through the real update; a guardian's entrance and roar),
// hurt still outranks them, and each is a visibly different pair of lights —
// counted in pixels off the real renderer, not read from the table.
//
//   node tests/face.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── face — effort on the reel, relief after a repair, fear at a roar, a sputter on the last core\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof HERO_MOOD !== 'undefined', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    // flags.heal: the Volt Pack is wired (the first cell bought), so HEAL repairs
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null; G.bossEntry = null;
    await frames(20);
    const p = player, out = {};
    const clear = () => { p.grap = null; p.soar = null; p.counterAct = null; p.reliefT = 0; p.healT = 0; p.hurtPoseT = 0; p.moodT = 0; G.boss = null; G.bossEntry = null; p.cores = p.maxCores(); };
    const mood = (setup) => { clear(); setup(); const m = p.heroMood('idle'); clear(); return m; };
    out.calm = mood(() => {});
    out.reel = mood(() => { p.grap = { st: 'pull' }; });
    out.throwOnly = mood(() => { p.grap = { st: 'throw' }; });
    out.soar = mood(() => { p.soar = { t: 0 }; });
    out.counter = mood(() => { p.counterAct = { t: 0.2 }; });
    out.entry = mood(() => { G.bossEntry = { t: 1 }; });
    out.roar = mood(() => { G.boss = { dead: false, st: 'roar' }; });
    out.hurtOverFear = mood(() => { G.boss = { dead: false, st: 'roar' }; p.hurtPoseT = 0.2; });
    // the repair, through the real update: volts and a missing core, HEAL held
    clear(); p.cores = p.maxCores() - 1; p.volts = 99; p.on = true;
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }));
    let during = null, after = null, healed = false;
    for (let i = 0; i < 120; i++) {
      await frames(1);
      if (p.healT > 0 && !during) during = p.heroMood('idle');
      if (p.cores === p.maxCores() && !healed) { healed = true; after = p.heroMood('idle'); }
      if (healed) break;
    }
    dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' }));
    out.heal = { during, after, healed, keyb: KEYB.HEAL };
    await frames(70);
    out.relaxed = p.heroMood('idle');
    // THE LOW-CORE IDLE (D5): standing still on one core sputters; on full
    // cores it does not
    const sputterOver = async (cores) => {
      clear(); p.cores = cores; p.sputters = 0; p.sputterIn = null; p.vx = 0; p.on = true; G.artProbe = false;
      await frames(150);
      return p.sputters || 0;
    };
    out.sputter = { low: await sputterOver(1), full: await sputterOver(p.maxCores()) };
    clear();
    // each face, drawn: the eye lights off the real renderer, counted
    const drawn = (m) => {
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
      const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 240, 240);
      p.mood = m; p.moodT = 5; p.anim = 0.5;
      c.translate(120, 0);
      p.drawHeroEyes(c, 'idle', 200, 200, 20, { lx: 0.38, ly: 0.5, rx: 0.62, ry: 0.5, ew: 0.08, eh: 0.09 });
      p.moodT = 0;
      const d = c.getImageData(0, 0, 240, 240).data; let lit = 0, rows = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 1] > 120) { lit++; rows.add(Math.floor(i / 4 / 240)); }
      return { lit, tall: rows.size };
    };
    out.px = {};
    for (const m of ['calm', 'effort', 'relief', 'afraid', 'hurt']) out.px[m] = drawn(m);
    return out;
  });

  check('calm when nothing is happening', r.calm === 'calm', r.calm);
  check('EFFORT on the claw\'s reel, the soar and the counter (not on the throw)',
    r.reel === 'effort' && r.soar === 'effort' && r.counter === 'effort' && r.throwOnly !== 'effort', JSON.stringify([r.reel, r.soar, r.counter, r.throwOnly]));
  check('FEAR at a guardian\'s entrance and at any state it names roar', r.entry === 'afraid' && r.roar === 'afraid', JSON.stringify([r.entry, r.roar]));
  check('...and a blow still outranks it (hurt over fear)', r.hurtOverFear === 'hurt', r.hurtOverFear);
  check('a real repair: eyes shut happy while it runs, then RELIEF when the core lands',
    r.heal.healed && r.heal.during === 'happy' && r.heal.after === 'relief', JSON.stringify(r.heal));
  check('...and the relief passes', r.relaxed === 'calm', r.relaxed);
  const px = r.px, diff = (a, b) => Math.abs(a.lit - b.lit) > a.lit * 0.15 || Math.abs(a.tall - b.tall) >= 2;
  check('each new face is a visibly different pair of lights from calm (pixels off the renderer)',
    diff(px.calm, px.effort) && diff(px.calm, px.relief) && diff(px.calm, px.afraid), JSON.stringify(px));
  check('...fear opens the eyes wider than calm, effort squeezes them', px.afraid.tall > px.calm.tall && px.effort.tall < px.calm.tall, JSON.stringify(px));
  check('LOW-CORE IDLE: standing on her last core the pack sputters; on full cores it does not', r.sputter.low >= 1 && r.sputter.full === 0, JSON.stringify(r.sputter));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
