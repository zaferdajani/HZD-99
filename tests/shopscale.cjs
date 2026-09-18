// A SHOP HAS NO DEPTH. The owner, 2026-09-18: "big gates and caves are deep
// so he can become smaller... but small shops are not." gateWalkScale is the
// one function that decides how much of herself the recede cutscene gives up
// per step of the walk, by what kind of doorway it is — a booth/oracle/forge/
// carrel/hollow/kerf row (`style` set), a cave, or an actual gate. Measured
// directly: three plain inputs, no image decode, no cutscene clock.
//
//   node tests/shopscale.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── shopscale — a shop door has no depth, a gate and a cave do\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof gateWalkScale === 'function', { timeout: 20000 });

  const r = await page.evaluate(() => {
    // real GATE_ROOM rows, so this is measuring the actual table, not a stand-in
    const booth = GATE_ROOM.A0, oracle = GATE_ROOM.B3, gate = GATE_ROOM.W2;
    const out = {};
    // at the very end of the walk (e=1): a real gate gives up 84%, landing at 16%
    out.gateEnd   = gateWalkScale(gate, false, 1);
    // a cave is swallowed, not receded: it keeps 84% of itself
    out.caveEnd   = gateWalkScale(gate, true, 1);
    // a shop door: this is the one the owner reported. It must stay close to
    // her own size the whole way, nowhere near the gate's 16%.
    out.boothEnd  = gateWalkScale(booth, false, 1);
    out.oracleEnd = gateWalkScale(oracle, false, 1);
    // a style-tagged row that HAPPENS to lead into a room flagged cave (none do
    // today, but the law should hold): cave wins, because the mouth is real
    // regardless of which NPC's door sits over it
    out.caveWinsOverStyle = gateWalkScale(booth, true, 1);
    // partway through (e=0.5) she should already read as barely smaller for a
    // shop, and visibly smaller for a gate
    out.gateHalf  = gateWalkScale(gate, false, 0.5);
    out.boothHalf = gateWalkScale(booth, false, 0.5);
    return out;
  });

  check('a real gate recedes to 16% of her size', Math.abs(r.gateEnd - 0.16) < 0.001, r.gateEnd);
  check('a cave mouth keeps 84% — swallowed, not shrunk away', Math.abs(r.caveEnd - 0.84) < 0.001, r.caveEnd);
  check('the trader\'s booth stays close to full size', r.boothEnd >= 0.85, r.boothEnd);
  check('...and so does the Oracle\'s parlor — every style row, not just one', r.oracleEnd >= 0.85, r.oracleEnd);
  check('a cave flag wins over a style tag, if they ever coincide', Math.abs(r.caveWinsOverStyle - 0.84) < 0.001, r.caveWinsOverStyle);
  check('halfway in, the shop has barely receded', r.boothHalf >= 0.9, r.boothHalf);
  check('...while the gate is already visibly smaller', r.gateHalf < 0.7, r.gateHalf);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
