// Play the opening the way a new player does, waiting for each lesson to
// actually arrive instead of guessing at timings.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); startGame(sv); });
  await p.waitForTimeout(600);
  const now = () => p.evaluate(() => ({ room: G.roomId, id: G.tut && TUT_STEPS[G.tut.i] && TUT_STEPS[G.tut.i].id,
    gap: (() => { const d = G.enemies.find(e => e && !e.dead); return d ? Math.round(d.x - player.x) : null; })(),
    cores: player.cores, learned: !!(G.save.flags && G.save.flags.tut) }));
  const waitFor = async (id, ms) => { const t0 = Date.now();
    while (Date.now() - t0 < ms) { const s = await now(); if (s.id === id) return s; await p.waitForTimeout(150); }
    return await now(); };
  console.log('wakes up          :', JSON.stringify(await now()));
  await p.screenshot({ path: OUT + 'wake1.png' });
  await p.keyboard.down('ArrowRight');
  console.log('walks, then blocked by the step ->', JSON.stringify(await waitFor('jump', 6000)));
  await p.screenshot({ path: OUT + 'wake2.png' });
  await p.keyboard.press('Space');
  console.log('jumps it          :', JSON.stringify(await waitFor('atk', 6000)));
  await p.waitForTimeout(2000);
  await p.keyboard.up('ArrowRight');
  const held = await now();
  console.log('the dummy is held :', JSON.stringify(held));
  await p.screenshot({ path: OUT + 'wake3.png' });
  await p.keyboard.press('KeyX');
  console.log('scratches         :', JSON.stringify(await waitFor('go', 5000)));
  await p.screenshot({ path: OUT + 'wake4.png' });
  await p.keyboard.down('ArrowRight');
  const out = await (async () => { const t0 = Date.now();
    while (Date.now() - t0 < 12000) { const s = await now(); if (s.room !== 'A0') return s; await p.waitForTimeout(200); }
    return await now(); })();
  await p.keyboard.up('ArrowRight');
  console.log('out the door      :', JSON.stringify(out));
  console.log('pageerrors        :', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
