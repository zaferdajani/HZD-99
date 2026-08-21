const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 800));
    G.wake = null; G.state = 'PLAY';
    const t = [], t0 = performance.now();
    let last = t0;
    return await new Promise(res => {
      const tick = () => {
        const n = performance.now(); t.push(Math.round(n - last)); last = n;
        if (n - t0 < 2600) requestAnimationFrame(tick);
        else {
          t.sort((a,b)=>b-a);
          res({ frames: t.length, worst: t.slice(0, 8), total: Math.round(n - t0) });
        }
      };
      requestAnimationFrame(tick);
    });
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
