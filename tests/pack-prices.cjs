// THE PACK LADDER'S PRICES ARE MEASURED, NOT GUESSED (owner, 2026-11-26: "Shard amounts will be
// tested to see if they're appropriate to the effort to get them. It should not be easy, but it
// should not be hard." · "Since this is the last upgrade of the wolf, it's only going to happen in
// the later stages of the game").
// What each kingdom pays is counted from the game (tools/shardincome.cjs: every room, every foe,
// cache, boss, agent and errand — a CLEAN SWEEP), and each rung is held to the share of the
// kingdom it is meant to be the goal of (docs/OWNER_ORDERS.md, THE PACK LADDER):
//   A  A STRONGER WOLF   12-30% of Kingdom 1   (bought around the end of Kingdom 1)
//   B  CALL THE ALPHA    30-65% of Kingdom 2   (around the end of Kingdom 2)
//   C  THE ALPHA'S HOWL  15-45% of Kingdom 3
//   D  RIDE THE ALPHA    40-85% of Kingdom 3, and the howl and the ride together 60-100% of it:
//      the last rung takes most of Kingdom 3 (not easy) and never more than it pays (not hard)
//   E  the ladder climbs: each Alpha rung costs more than the stronger wolf, the call the most
//   F  the shelves charge these prices (Ratchet's row rung by rung, the Tinker's ride)
const { chromium } = require('playwright');
const { PAGE_FN } = require('../tools/shardincome.cjs');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const BAND = { packup: [1, 0.12, 0.30], alcall: [2, 0.30, 0.65], alhowl: [3, 0.15, 0.45], alride: [3, 0.40, 0.85] };
(async () => {
  console.log('── pack-prices — every rung of the pack ladder priced against what its kingdom pays');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const inc = (await page.evaluate('(' + PAGE_FN.toString() + ')()')).kingdoms;
  const R = await page.evaluate(() => {
    const prices = Object.fromEntries(PACK_TREE.map(n => [n.id, n.cost]));
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 0; sv.arms = ['pack']; sv.packLv = 1; startGame(sv);
    const row = SHOP.find(q => q.type === 'packup'), shelf = [];
    for (const lv of [1, 2, 3]) { G.save.packLv = lv; shelf.push([ptNextRatchet().id, row.cost]); }
    return { prices, shelf, tinker: TINKER_SHOP[0].cost };
  });
  const K = (k) => inc[k].total;
  console.log('   clean sweep:  K1 ' + K(1) + '   K2 ' + K(2) + '   K3 ' + K(3));
  const P = R.prices;
  for (const [id, [k, lo, hi]] of Object.entries(BAND)) {
    const f = P[id] / K(k);
    check(id.padEnd(7) + ' ' + P[id] + ' is ' + Math.round(f * 100) + '% of Kingdom ' + k + ' (band ' + lo * 100 + '-' + hi * 100 + '%: ' + Math.round(K(k) * lo) + '-' + Math.round(K(k) * hi) + ')', f >= lo && f <= hi);
  }
  const late = (P.alhowl + P.alride) / K(3);
  check('D  the howl and the ride together are ' + Math.round(late * 100) + '% of Kingdom 3 (60-100%)', late >= 0.6 && late <= 1.0);
  check('E  the ladder climbs: the Alpha\'s rungs cost more than the stronger wolf, the call the most of Ratchet\'s', P.alcall > P.packup && P.alride > P.packup && P.alcall > P.alhowl && P.alcall >= P.alride, P);
  check('F  the shelves charge these prices', R.shelf[0][0] === 'packup' && R.shelf[0][1] === P.packup && R.shelf[1][0] === 'alcall' && R.shelf[1][1] === P.alcall && R.shelf[2][0] === 'alhowl' && R.shelf[2][1] === P.alhowl && R.tinker === P.alride, R);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the pack ladder is priced from what the kingdoms pay');
})().catch(e => { console.error(e); process.exit(1); });
