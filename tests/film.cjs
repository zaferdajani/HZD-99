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
  // ---- NEW GAME, TWICE ---------------------------------------------------
  // The reported bug: pressing New Game showed a glimpse of the film and then
  // dropped straight to the difficulty screen. Two causes, both invisible from
  // the code — the prime's asynchronous pause() landing on the clip that had
  // just started, and a video element parked at the end of a previous play
  // reading as `ended` on the frame play() was called.
  //
  // Driven twice on purpose: the first New Game of a session and the second
  // exercise different states of the element, and only the second one has a
  // clip that has been played before.
  console.log('');
  const runs = await p.evaluate(async () => {
    const out = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      G.state = 'MENU'; G.cut = null; G.cine = null; G.reel = null;
      G.pendTheme = gameLock(); wipeSave(gameLock()); G.diffIdx = 1;
      try { localStorage.removeItem('cb_intro_seen'); } catch (e) {}
      G.afterCine = 'DIFF';
      startCine();
      let maxT = 0, played = false, bailed = null;
      for (let f = 0; f < 260; f++) {
        await new Promise(r => setTimeout(r, 20));
        const ct = G.cut;
        if (ct && ct.ph === 'play' && ct.v) {
          played = true;
          maxT = Math.max(maxT, ct.v.currentTime);
        }
        if (G.state === 'DIFF') { bailed = 'DIFF'; break; }
        if (maxT > 1.2) break;
      }
      out.push({ played, maxT: +maxT.toFixed(2), bailed, st: G.state });
      // leave the reel alone for the next pass
      G.cut = null; G.reel = null; G.state = 'MENU';
    }
    return out;
  });
  let newGameOk = true;
  runs.forEach((r, i) => {
    const ok = r.played && r.maxT > 1.0 && r.bailed !== 'DIFF';
    if (!ok) newGameOk = false;
    console.log('  New Game #' + (i + 1) + ': reached play=' + r.played
      + '  ran to ' + r.maxT + 's' + (r.bailed ? '  BAILED TO ' + r.bailed : ''));
  });
  console.log('new game plays the film  :', newGameOk ? 'yes, both times' : 'NO — it glimpses and skips');

  console.log('shots that really played :', shots, '/ 8');
  console.log('fell back to stills      :', everFallback ? 'YES' : 'no');
  console.log('final state              :', await p.evaluate(() => G.state));
  console.log('pageerrors               :', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
  if (!newGameOk) {
    console.log('\nFAILED: New Game shows a glimpse of the film and skips to the difficulty screen');
    process.exit(1);
  }
})();
