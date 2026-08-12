// The opening must start BY ITSELF — no card, no tap — and the score must be
// asked for at boot, so it starts the instant the platform allows it.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(4500);
  console.log('boot, nothing touched  :', JSON.stringify(await p.evaluate(() => ({
    st: G.state, cut: !!G.cut, ph: G.cut && G.cut.ph, patient: G.cut && G.cut.patient,
    musAsked: MUS.name, musEl: !!RECNODE, musPaused: RECNODE && RECNODE.el.paused,
    locked: soundLocked(),
  }))));
  await p.screenshot({ path: OUT + 'open_boot.png' });
  await p.waitForTimeout(3000);
  console.log('sound badge showing    :', await p.evaluate(() => soundLocked()));
  await p.keyboard.press('Enter');    // the gesture
  await p.waitForTimeout(1200);
  console.log('after one keypress     :', JSON.stringify(await p.evaluate(() => ({
    musPaused: RECNODE && RECNODE.el.paused, locked: soundLocked(),
    vol: RECNODE && +RECNODE.el.volume.toFixed(2), src: RECNODE && RECNODE.key,
  }))));
  await p.waitForTimeout(9000);
  const st = await p.evaluate(() => ({ st: G.state, shot: G.cine && G.cine.i, cut: G.cut && G.cut.ph }));
  console.log('ten seconds on         :', JSON.stringify(st));
  await p.screenshot({ path: OUT + 'open_run.png' });
  console.log('pageerrors             :', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
