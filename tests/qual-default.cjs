// THE STANDARD IS LOW — owner, 2026-11-27: "Standard resolution should be low because it's smoother."
// js/perf.js: a new player starts on the low tier, and stays there; only his own pick moves it.
//   A  a new game, on a phone and on a desktop, is on LOW, and the pause menu's Detail row says so
//   B  it stays low: fast frames do not promote it behind his back
//   C  his own pick is remembered: a save in which he picked a tier (or picked auto) comes back with it
//   D  an older save the adaptor wrote 'auto' into, with no pick of his, comes back on low
//   E  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── qual-default — a new player starts on low; his own pick is kept');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const errs = [];
  const devices = {
    phone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  };
  const R = {};
  for (const [name, dev] of Object.entries(devices)) {
    const ctx = await browser.newContext(Object.assign({ serviceWorkers: 'block' }, dev));
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(name + ': ' + String(e)));
    await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
    await page.goto('http://127.0.0.1:' + PORT + '/' + (process.env.PAGE || 'index.html'), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
    R[name] = await page.evaluate(() => {
      const out = {};
      const fresh = () => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 }); return sv; };
      startGame(fresh());
      out.boot = { q: QNAME, auto: QAUTO, label: qualLabel(), guess: guessTier(DEVICE), form: DEVICE.form };
      for (let i = 0; i < 60; i++) qualStep(0.5, 6);              // 30 s of 6 ms frames
      out.after = { q: QNAME };
      // his pick: cycle to high, keep the save, start again from it
      while (QNAME !== 'high' || QAUTO) qualCycle();
      const picked = JSON.parse(JSON.stringify(G.save));
      qualSet('low', true); QAUTO = true;                          // (scramble the live state)
      startGame(JSON.parse(JSON.stringify(picked)));
      out.picked = { q: QNAME, auto: QAUTO, saved: picked.qual };
      // his pick of auto
      while (!QAUTO) qualCycle();
      const pickedAuto = JSON.parse(JSON.stringify(G.save));
      startGame(fresh()); startGame(JSON.parse(JSON.stringify(pickedAuto)));
      out.pickedAuto = { q: QNAME, auto: QAUTO, saved: pickedAuto.qual };
      // an older save the adaptor wrote 'auto' into
      const old = fresh(); old.qual = 'auto'; delete old.qualMine;
      qualSet('ultra', false); startGame(old);
      out.old = { q: QNAME, auto: QAUTO };
      return out;
    });
    await ctx.close();
  }
  check('A  a new game is on LOW on a phone and on a desktop, and the Detail row says low', Object.values(R).every(r => r.boot.q === 'low' && !r.boot.auto && /low/.test(r.boot.label)),
    Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r.boot])));
  check('B  fast frames do not promote it', Object.values(R).every(r => r.after.q === 'low'), Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r.after.q])));
  check('C  his own pick comes back: a picked tier, and a picked auto', Object.values(R).every(r => r.picked.q === 'high' && !r.picked.auto && r.pickedAuto.auto && r.pickedAuto.saved === 'auto'),
    Object.fromEntries(Object.entries(R).map(([k, r]) => [k, { picked: r.picked, auto: r.pickedAuto }])));
  check('D  an older save with an adaptor-written auto comes back on low', Object.values(R).every(r => r.old.q === 'low' && !r.old.auto), Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r.old])));
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — low is the standard, and his pick is his');
})().catch(e => { console.error(e); process.exit(1); });
