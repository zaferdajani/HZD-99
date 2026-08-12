// Every power handed over must teach itself, wait for the player to use it,
// tick, and then never appear again.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('A2'); });
  await p.waitForTimeout(600);
  for (const id of ['dash', 'djump', 'wall', 'emp']) {
    const open = await p.evaluate((id) => {
      G.state = 'PLAY'; grantMod(id); G.state = 'PLAY'; G.dialog = null;
      return { lesson: G.lesson && G.lesson.id, key: (() => { const M = MOD_LESSON[id]; return tutHand(M); })() };
    }, id);
    if (id === 'dash') { await p.waitForTimeout(300); await p.screenshot({ path: OUT + 'lesson.png' }); }
    // use it
    // hold the condition true across REAL frames, the way doing it would
    const used = await p.evaluate((id) => new Promise((res) => {
      let n = 0;
      const iv = setInterval(() => {
        player.volts = 99;
        if (id === 'dash') player.dashT = 0.2;
        if (id === 'djump') { player.on = false; player.airJumps = 0; }
        if (id === 'wall') player.wallSlide = 1;
        if (id === 'emp') player.castCD = 0.4;
        if (++n > 30) { clearInterval(iv); res({ hold: G.lesson && +G.lesson.hold.toFixed(2) }); }
      }, 16);
    }), id);
    await p.waitForTimeout(1600);
    const after = await p.evaluate((id) => ({ lesson: G.lesson && G.lesson.id, flag: !!G.save.flags['les_' + id] }), id);
    console.log(id.padEnd(6), 'card:', JSON.stringify(open), '-> used:', JSON.stringify(used), '-> ', JSON.stringify(after));
  }
  // and it must not come back
  const again = await p.evaluate(() => { grantMod('dash'); return G.lesson; });
  console.log('taught twice?      :', again ? 'YES (wrong)' : 'no');
  console.log('pageerrors         :', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
