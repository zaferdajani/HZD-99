// What track is actually playing in each place the player spends time?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));   // as a returning player
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(4000);
  const at = async (label) => console.log(label.padEnd(28), JSON.stringify(await p.evaluate(() => ({
    state: G.state, asked: MUS.name, stream: RECNODE && RECNODE.key, synth: !!MUS.cur }))));
  await at('returning player, boot');
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(900);
  await at('in the first zone');
  for (const z of ['B', 'C', 'D', 'E']) {
    await p.evaluate((z) => setMusic(z), z);
    await p.waitForTimeout(400);
    await at('zone ' + z);
  }
  await p.evaluate(() => setMusic('intro')); await p.waitForTimeout(400);
  await at('the opening score');
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
