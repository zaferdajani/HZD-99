// WHICH LEGS ACTUALLY MOVE WHEN SHE RUNS?
//
// The owner's report: "you are only moving the back leg, the one that is
// grayed out — the other one seems as if it is just sliding forward without
// actually running, as if we're standing on a scooter and pushing with the
// other leg."
//
// Reading the rig does not settle it: leg(-7, ph+PI, false) and leg(6, ph,
// true) look symmetric on the page. So this samples the two springs the
// renderer actually draws each foot from, over several stride cycles, and
// prints their amplitudes side by side. A near leg that slides is a near leg
// whose amplitude is a fraction of the far one's.
//
//   node tools/legprobe.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r2 => setTimeout(r2, 1200));
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
    G.toasts = [];
    const frame = () => new Promise(r2 => requestAnimationFrame(r2));
    keys.ArrowRight = 1;
    for (let i = 0; i < 45; i++) await frame();      // reach full speed first
    const rows = [];
    for (let i = 0; i < 120; i++) {
      await frame();
      rows.push({
        i, vx: +player.vx.toFixed(0), on: !!player.on,
        Fx: player._legFx, Bx: player._legBx,
        Fy: player._legFy, By: player._legBy,
      });
    }
    return { rows, sprintK: player.sprintK, anim: player.anim };
  });

  const live = r.rows.filter(x => x.on && x.Fx !== undefined && x.Bx !== undefined);
  const amp = (k) => {
    const v = live.map(x => x[k]).filter(n => typeof n === 'number');
    if (!v.length) return null;
    return { amp: Math.max(...v) - Math.min(...v), min: Math.min(...v), max: Math.max(...v) };
  };
  console.log('── legprobe — do both legs stride, or does one slide?\n');
  console.log('grounded frames sampled: ' + live.length + '   vx ' + (live[0] ? live[0].vx : '?'));
  const rows = [['Fx', 'near / light leg  (drawn #aab6c6)'], ['Bx', 'far  / dark  leg  (drawn #7f8b9c)'],
                ['Fy', 'near lift'], ['By', 'far  lift']];
  const out = {};
  for (const [k, label] of rows) {
    const a = amp(k);
    out[k] = a ? a.amp : 0;
    console.log('  ' + label.padEnd(36) + ' amplitude ' + (a ? a.amp.toFixed(2).padStart(7) : '   n/a')
      + (a ? '   range ' + a.min.toFixed(2) + ' .. ' + a.max.toFixed(2) : ''));
  }
  const ratio = out.Fx > 0 ? out.Bx / out.Fx : Infinity;
  console.log('\n  far/near stride ratio: ' + ratio.toFixed(2) + '   (1.00 = both legs stride equally)');
  console.log('  ' + (ratio > 1.6 || ratio < 0.62
    ? 'ONE LEG IS SLIDING — this is the scooter the owner described'
    : 'both legs stride'));
  if (errs.length) console.log('\npage errors: ' + errs[0]);
  await browser.close();
})();
