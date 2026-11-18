// TURNING THE PHONE BRINGS THE GAME UP (owner, 2026-11-18: "User stuck on rotate with nothing").
// Opened upright, the page was 100% visible at 412x839; turned, it was still 100% visible, so the
// visibility observer never called back and the upright rect stayed "the visible area" for good:
// the rotate screen never went away. js/touch.js keeps a measurement with the viewport it was
// taken in. Both builds, on a phone:
//   A  opened upright: the rotate screen, and only it
//   B  turned to landscape: the rotate screen is gone and the game frame is wider than tall
//   C  a tap then reaches the game (the menu answers)
//   D  turned back upright and round again, twice: it follows every time
//   E  opened already in landscape: never shows the rotate screen
const { chromium, devices } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  console.log('── rotate — turning the phone always brings the game up');
  const UP = { width: 412, height: 839 }, SIDE = { width: 915, height: 412 };
  for (const pg of ['index.html', 'odyssey.html']) {
    const tag = pg === 'index.html' ? 'CLAWBYTE' : 'NOSTOS';
    for (const start of ['upright', 'landscape']) {
      const ctx = await b.newContext(Object.assign({}, devices['Pixel 7'], { serviceWorkers: 'block', viewport: start === 'upright' ? UP : SIDE }));
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.addInitScript(() => { try { localStorage.setItem('cb_intro_seen', '1'); } catch (e) {} });
      await p.goto('http://127.0.0.1:' + PORT + '/' + pg, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 }); await p.waitForTimeout(1500);
      const st = () => p.evaluate(() => { const r = cv.getBoundingClientRect(); return { portrait: TOUCH.portrait, area: [TOUCH.vw, TOUCH.vh], frame: [Math.round(r.width), Math.round(r.height)], state: G.state }; });
      if (start === 'upright') {
        const a = await st(); check(tag + '  A  opened upright: the rotate screen', a.portrait === true, a);
        await p.setViewportSize(SIDE); await p.waitForTimeout(900); const s = await st();
        check(tag + '  B  turned to landscape: the rotate screen is gone, the frame is wider than tall', s.portrait === false && s.area[0] === SIDE.width && s.frame[0] > s.frame[1] * 1.5, s);
        const s0 = s.state; await p.touchscreen.tap(458, 206); await p.waitForTimeout(700); const c = await st();
        check(tag + '  C  a tap then reaches the game', c.state !== s0 || c.state === 'CUT' || c.state === 'PLAY', { before: s0, after: c.state });
        const seq = [];
        for (let i = 0; i < 2; i++) { await p.setViewportSize(UP); await p.waitForTimeout(500); seq.push((await st()).portrait); await p.setViewportSize(SIDE); await p.waitForTimeout(700); seq.push((await st()).portrait); }
        check(tag + '  D  upright and round again, twice: it follows every time', JSON.stringify(seq) === JSON.stringify([true, false, true, false]), seq);
      } else {
        const a = await st(); check(tag + '  E  opened in landscape: never the rotate screen', a.portrait === false && a.frame[0] > a.frame[1] * 1.5, a);
      }
      check(tag + '  no page errors (' + start + ')', errs.length === 0, errs.slice(0, 2));
      await ctx.close(); } }
  await b.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — turn the phone and the game is there');
})().catch(e => { console.error(e); process.exit(1); });
