// For the first time this can be tested for real: with a VP9 copy shipped, the
// test browser can decode the opening. Watch it play, shot by shot, and confirm
// it is the FILM the player sees and not the held-frame fallback.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3000);
  await p.mouse.move(480, 300);
  const seen = new Set(); let shots = 0, everFallback = false;
  for (let i = 0; i < 130; i++) {
    const s = await p.evaluate(() => ({
      st: G.state, kind: G.cut && G.cut.kind, ph: G.cut && G.cut.ph,
      ran: G.cut && !!G.cut.ran, ct: G.cut && +G.cut.v.currentTime.toFixed(1),
      err: G.cut && G.cut.v.error && G.cut.v.error.code,
    }));
    if (s.st === 'CINE') everFallback = true;
    if (s.kind && s.ran && !seen.has(s.kind)) { seen.add(s.kind); shots++; console.log('  playing', s.kind, 'at', s.ct + 's'); }
    if (i === 6) await p.screenshot({ path: OUT + 'film_shot.png' });
    if (s.st === 'MENU' && i > 10) break;
    await p.waitForTimeout(500);
  }
  console.log('shots that really played :', shots, '/ 8');
  console.log('fell back to stills      :', everFallback ? 'YES' : 'no');
  console.log('final state              :', await p.evaluate(() => G.state));
  console.log('pageerrors               :', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
