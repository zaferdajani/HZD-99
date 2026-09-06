// Same question, but through the REAL loop this time: feed mainLoop a stream of
// timestamps at a given frame rate and measure how far she travels per second
// of wall clock.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const out = {};
    const run = (fps, seconds) => {
      player.x = 300; player.vx = 0; player.vy = 0; player.dashT = 0; player.healT = 0;
      keys.ArrowRight = 1; keys.KeyD = 1;
      const x0 = player.x, step = 1000 / fps;
      let maxV = 0;
      let t = performance.now();
      lastT = t;
      for (let i = 0; i < Math.round(seconds * fps); i++) {
        t += step;
        let acc = Math.min((t - lastT) / 1000, SIM_MAX);
        while (acc > 1e-4) { const st = Math.min(acc, SIM_STEP); update(st); acc -= st; }
        lastT = t;
        if (Math.abs(player.vx) > maxV) maxV = Math.abs(player.vx);
        clearP();
      }
      keys.ArrowRight = 0; keys.KeyD = 0;
      return { travel: +((player.x - x0) / seconds).toFixed(1), topSpeed: +maxV.toFixed(1) };
    };
    for (const pass of [1,2,3]) for (const fps of [144, 120, 60, 30, 20, 12]) out[fps + ' fps #' + pass] = run(fps, 0.5);
    return out;
  });
  const base = r['60 fps #1'].travel;
  for (const k in r) console.log(k.padStart(7), String(r[k].travel).padStart(7), 'px/s travelled  top speed', String(r[k].topSpeed).padStart(6),
                                 ' ', Math.round(r[k].travel / base * 100) + '% of 60fps');
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
