// The pace dial has to slow the SIMULATION and nothing else: the same room, the
// same distance, more seconds to cross it — and the telegraphs stretch with it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('A2'); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = {};
    for (const step of [0,1,2,3]) {
      G.save.pace = step;
      player.x = 60; player.vx = 0; player.vy = 0; player.on = true;
      keys.ArrowRight = 1; keys.KeyD = 1;
      const x0 = player.x, secs = 1.0, fps = 60;
      let t = performance.now(); lastT = t;
      for (let i = 0; i < secs * fps; i++) {
        t += 1000 / fps;
        let acc = Math.min((t - lastT) / 1000, SIM_MAX) * paceK();
        while (acc > 1e-4) { const st = Math.min(acc, SIM_STEP); update(st); acc -= st; }
        lastT = t; clearP();
      }
      keys.ArrowRight = 0; keys.KeyD = 0;
      out[paceLabel()] = { pxPerRealSecond: Math.round(player.x - x0), vxEnd: Math.round(player.vx), k: paceK() };
    }
    // and the telegraph the whole exercise is about
    out.swipeTellSeconds = TELL_SWIPE;
    out.swipeTellAt70pct = +(TELL_SWIPE / 0.7).toFixed(2);
    return out;
  });
  for (const k in r) console.log(String(k).padStart(18), JSON.stringify(r[k]));
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
