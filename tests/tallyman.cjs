// TALLYMAN, HARDER, AND STRUCK LIKE A BODY (owner, 2026-11-20).
//
//   "while fighting the agent, the one with the staff, okay, he was super easy
//    to beat ... Hitting him did not feel smooth or realistic as hitting a
//    human ... instead of hitting a metallic statue that gets pushed backward"
//
// This holds the duel's numbers (js/sage-motion.js SAGE_DUEL_PROFILE):
//   - half as much again to break as an agent off the duel (hpK 1.5);
//   - a decision every 0.7 s, and 0.8 s of breather after three denied lunges;
//   - below half health a coil opens a chain of THREE lunges, above it two;
//   - a blow stops him where he stands: the knock it gives moves him a short
//     step, not a slide across the floor.
// (The hit-reaction PLATES — a body that folds round the blow — are art, and
//  wait on Higgsfield: docs/ART_QUEUE.md.)
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
    const stage = () => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv); loadRoom('GA1D');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.boss = null; G.projs = [];
      const e = G.enemies.find(q => q.kind === 'sage'); G.enemies = [e];
      Object.assign(e, { x: 420, y: (G.roomDef.h - 2) * TILE - e.h, vx: 0, vy: 0, dir: 1, faceVis: 1, coilT: 0, gatherT: 0, lungeT: 0, windedT: 0, ringR: null, kbT: 0, stagT: 0, hypnoT: 0, locked: false, tame: 0, calm: false, stepT: 99, denied: 0 });
      Object.assign(player, { x: e.x + 100, y: e.y + e.h - player.h, vx: 0, on: true, iT: 999, cores: 5 });
      if (e.sageDuel) { e.sageDuel.face = 1; e.sageDuel.phase = 'idle'; }
      return e;
    };
    const out = {};
    let e = stage();
    out.duel = !!e.sageDuel; out.hp = e.hpMax0;
    // the same agent built off the duel, in the same moment: what he would be without it
    { const orig = window.sageDuelInit; let pre = 0, post = 0;
      window.sageDuelInit = function (q) { pre = q.hpMax0; orig(q); post = q.hpMax0; };
      new Enemy('sage', 0, 0); window.sageDuelInit = orig; out.base = pre; out.hp = post; }
    out.prof = { step: SAGE_DUEL_PROFILE.step, denied: SAGE_DUEL_PROFILE.deniedRecovery };
    // the chain: above half, two lunges; below, three
    const chain = (k) => { e = stage(); e.hp = e.hpMax0 * k; e.coilT = 0.01; sageDuelEnter(e, 'coil', 0.01, 1); player.x = e.x + 140;
      let n = 0, was = false; for (let f = 0; f < 200; f++) { e.update(1 / 60); const l = e.lungeT > 0; if (l && !was) n++; was = l; if (e.windedT > 0 && !l) break; } return n; };
    out.full = chain(1); out.half = chain(0.4);
    // a blow: the knock a claw gives (kbT 0.22, 260 px/s)
    e = stage(); const x0 = e.x; e.kbT = 0.22; e.vx = 260;
    for (let f = 0; f < 40; f++) e.update(1 / 60);
    out.slide = Math.round(e.x - x0);
    return out;
  });
  check('TALLYMAN duels, and is half as much again to break', R.duel && Math.abs(R.hp / (R.base * 1.5) - 1) < 0.05, JSON.stringify({ hp: R.hp, base: R.base }));
  check('...a quicker mind and a shorter breather', R.prof.step <= 0.7 && R.prof.denied <= 0.8, JSON.stringify(R.prof));
  check('...above half health a coil opens two lunges, below it three', R.full === 2 && R.half === 3, R.full + ' / ' + R.half);
  check('a blow stops him where he stands: a short step, not a slide', R.slide >= 0 && R.slide <= 16, R.slide + ' px');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — TALLYMAN is a fight, and a blow lands on a body');
})().catch(e => { console.error(e); process.exit(1); });
