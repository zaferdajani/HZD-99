// EVERY BUTTON ON SCREEN CAN BE TOUCHED, AND THE ONE YOU TOUCH IS THE ONE THAT
// FIRES.
//
// Two separate reports came from the same root: a screen's tap targets were
// written out by hand, separately from its drawing, and had drifted.
//
//   The pause menu drew ten rows at a measured pitch and tested for seven at a
//   fixed 40 px — so a tap selected the wrong line, or nothing.
//
//   The trials have THREE answer layouts (four Echo Glyph nodes in a diamond,
//   a three-wide choice row, and the Balances bench, which packs however many
//   objects the question has around the centre). Touch knew about one of them
//   and applied its maths to all three, so on the Balances a tap on the first
//   object answered with the SECOND. Every time. The puzzle could not be solved
//   by hand at all.
//
// Both now derive their hit-boxes from the same function the drawing uses. This
// checks the property that matters: tap where a thing is drawn, and that thing
// happens.
//
//   node tests/tap.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await page.waitForTimeout(600);

  const fails = [];
  const check = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + '  ' + JSON.stringify(got));
    if (!ok) fails.push(name + ' expected ' + JSON.stringify(want));
  };

  console.log('── tap  — tap where a thing is drawn and that thing happens');

  // ---- the pause menu: tapping row i selects row i, for every row ----------
  const pause = await page.evaluate(() => {
    G.state = 'PAUSE';
    const PL = pauseLayout();
    const out = [];
    for (let i = 0; i < PL.items.length; i++) {
      G.pauseIdx = -1;
      tapMenu(480, PL.y0 + i * PL.step);
      out.push(G.pauseIdx === i ? i : G.pauseIdx);
    }
    G.pauseConfirm = null; G.state = 'PLAY';
    return { picked: out, n: PL.items.length };
  });
  check('pause: every row selects itself',
    pause.picked, Array.from({ length: pause.n }, (_, i) => i));

  // ---- the trials: every answer tile, in every layout ---------------------
  for (const game of ['mem', 'log', 'vis', 'calc']) {
    const r = await page.evaluate((game) => {
      G.state = 'TRIAL';
      triStart('practice', game);
      TRI.st = 'play';
      if (game === 'mem') { TRI.memPhase = 'input'; TRI.memIn = 0; }
      const tiles = triTiles() || [];
      const out = [];
      for (const tl of tiles) {
        for (const k in keysP) keysP[k] = 0;
        for (const k in keys) keys[k] = 0;
        tapMenu(tl[0], tl[1]);
        // which code did the tap actually press?
        const fired = ['VL', 'VU', 'VR', 'VD'].filter(cd => keysP[cd]);
        out.push({ want: tl[4], got: fired.length === 1 ? fired[0] : fired });
      }
      for (const k in keysP) keysP[k] = 0;
      for (const k in keys) keys[k] = 0;
      G.state = 'PLAY';
      return { n: tiles.length, out: out };
    }, game);
    if (!r.n) { console.log('  ..   ' + game + ' has no answer tiles in this state'); continue; }
    const wrong = r.out.filter(o => o.want !== o.got);
    check('trial ' + game + ': ' + r.n + ' tiles fire their own key',
      wrong.length ? wrong : [], []);
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the hit-boxes are the drawing');
})().catch(e => { console.error(e); process.exit(1); });
