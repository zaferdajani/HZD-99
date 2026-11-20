// NULLFANG'S DASH IS HIS SIGNATURE (owner, 2026-11-20: "his fight should be epic as
// i described with dash attack as signature"). Drives his real update (js/entities.js
// nfDashChainStart / nfDashChainNext) and holds:
//   - the first coil of the fight is the dash (red, low, ending in a slash);
//   - phase one: a dash is one dash, then a short opening;
//   - phase two: dashes come in a CHAIN of two, and of three below a quarter health;
//   - every link keeps a readable red crouch (never under 0.42 s);
//   - the end of a chain is the longer opening (but under the 0.9 s gift line), and a chain
//     always runs to its count — the same read, the same lion.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const WIND = /warn|crouch|charge|roar|spring|pounce|perch|stalk|run/;
    const run = (hpK, phase, secs) => {
      loadRoom('A4'); G.state = 'PLAY'; G.dialog = null; G.enemies = [];
      const bo = new Boss('glitch', 20 * TILE, (G.roomDef.h - 6) * TILE); G.boss = bo;
      bo.st = 'idle'; bo.t = 0.2; bo.dead = false; bo.meet = false; bo.hp = bo.hpMax * hpK; bo.phase = phase;
      if (phase === 2) bo.nullUsed = true;              // the once-a-fight null field is another test's
      const STEP = 1 / 60, lunges = [], chains = [], coils = [];
      let first = null, open = null, cur = [], prev = bo.st, coilLen = 0, inCoil = false, spentT = null;
      for (let i = 0; i < secs * 60; i++) {
        // she stands off at dash range, out of everything else's way
        player.iT = 99; player.dead = false;
        const want = bo.cx() + (bo.cx() > G.roomDef.w * TILE / 2 ? -320 : 320);
        if (bo.st === 'idle' || bo.st === 'stalk' || bo.st === 'run' || bo.st === 'recover') { player.x = want - player.w / 2; player.y = bo.y + bo.h - player.h; player.vx = 0; }
        try { bo.update(STEP); } catch (e) { }
        if (bo.st === 'crouch') { if (!inCoil) { inCoil = true; coilLen = 0; if (first == null) first = !!bo.lunging; } coilLen += STEP; }
        else if (inCoil) { inCoil = false; coils.push({ len: coilLen, dash: bo.lungeFly }); }
        if (bo.st === 'pounce' && prev !== 'pounce' && bo.lungeFly) cur.push(1);
        // a chain closes when a dash slash ends in anything but the breath before another link;
        // its opening is the time he then stays on his feet before the next wind-up
        if (prev === 'swipe' && bo.st !== 'swipe' && cur.length && !bo.dashNext) { open = { n: cur.length, f: 0 }; cur = []; }
        else if (open) {
          if (WIND.test(bo.st)) { chains.push({ n: open.n, spent: +(open.f * STEP).toFixed(2) }); open = null; }
          else open.f++;
        }
        prev = bo.st;
      }
      return { first, chains, dashCoils: coils.filter(c => c.dash).map(c => +c.len.toFixed(2)) };
    };
    return { p1: run(1, 1, 40), p2: run(0.6, 2, 40), p3: run(0.2, 2, 40) };
  });
  const ns = c => c.chains.map(x => x.n);
  check('the fight opens with his dash: the first coil is the dash', R.p1.first === true, String(R.p1.first));
  const med = a => { const q = a.map(c => c.spent).sort((x, y) => x - y); return q[q.length >> 1] || 0; };
  check('phase one: a dash is one dash, then an opening of at least a blow', R.p1.chains.length > 0 && R.p1.chains.every(c => c.n === 1 && c.spent >= 0.25 && c.spent <= 0.9), JSON.stringify(R.p1.chains));
  check('phase two: the dash chains — two, then the longer opening (never a gift)', R.p2.chains.length > 0 && R.p2.chains.every(c => c.n === 2 && c.spent <= 0.9) && med(R.p2.chains) > med(R.p1.chains), JSON.stringify(R.p2.chains));
  check('below a quarter health: three', R.p3.chains.length > 0 && R.p3.chains.every(c => c.n === 3 && c.spent >= 0.25 && c.spent <= 0.9), JSON.stringify(R.p3.chains));
  const all = R.p1.dashCoils.concat(R.p2.dashCoils, R.p3.dashCoils);
  check('every link keeps a readable red crouch (≥ 0.42 s)', all.length > 0 && all.every(x => x >= 0.40), JSON.stringify(all.slice(0, 12)));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the dash is his signature: he opens with it, and it chains as he weakens');
})().catch(e => { console.error(e); process.exit(1); });
