// TALLYMAN, HARDER, AND STRUCK LIKE A BODY (owner, 2026-11-20).
//
//   "while fighting the agent, the one with the staff, okay, he was super easy
//    to beat ... Hitting him did not feel smooth or realistic as hitting a
//    human ... instead of hitting a metallic statue that gets pushed backward"
//
// This holds the duel's numbers (js/sage-motion.js SAGE_DUEL_PROFILE):
//   - harder to break than an agent off the duel by SAGE_DUEL_PROFILE.hpK (1.5 on 2026-11-20, 1.75 since 11-24);
//   - a decision every 0.7 s, and 0.8 s of breather after three denied lunges;
//   - below half health a coil opens a chain of THREE lunges, above it two;
//   - a blow stops him where he stands: the knock it gives moves him a short
//     step, not a slide across the floor.
//   - and the blow is DRAWN on a body: two fired plates (Higgsfield, 2026-11-20) —
//     struck (head back, arm flung) and, on the third blow of a quick chain,
//     doubled over round the abacus with a knee gone.
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
  const R = await p.evaluate(async () => {
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
      window.sageDuelInit = function (q) { pre = q.hpMax0 / (q.traits || []).reduce((m, k) => m * ((TRAITS[k] && TRAITS[k].hp) || 1), 1); orig(q); post = q.hpMax0; };   // (base: its own strength, the rolled trait taken off — one fight has one strength)
      new Enemy('sage', 0, 0); window.sageDuelInit = orig; out.base = pre; out.hp = post; }
    out.hpK = SAGE_DUEL_PROFILE.hpK; out.prof = { step: SAGE_DUEL_PROFILE.step, denied: SAGE_DUEL_PROFILE.deniedRecovery };
    // the chain: above half, two lunges; below, three
    const chain = (k) => { e = stage(); e.hp = e.hpMax0 * k; e.coilT = 0.01; sageDuelEnter(e, 'coil', 0.01, 1); player.x = e.x + 140;
      let n = 0, was = false; for (let f = 0; f < 200; f++) { e.update(1 / 60); const l = e.lungeT > 0; if (l && !was) n++; was = l; if (e.windedT > 0 && !l) break; } return n; };
    out.full = chain(1); out.half = chain(0.4);
    // a blow: the knock a claw gives (kbT 0.22, 260 px/s)
    e = stage(); const x0 = e.x; e.kbT = 0.22; e.vx = 260;
    for (let f = 0; f < 40; f++) e.update(1 / 60);
    out.slide = Math.round(e.x - x0);
    // THE BLOW, DRAWN: what the body is on each frame after a claw lands, through the real
    // draw (rig and plates mixed, as the game draws him)
    e = stage();
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => k.startsWith('agTally') || k.startsWith('agRig_tally_'))) mediaFetch(k, true);
    for (let i = 0; i < 200 && !['agTallyHitHigh', 'agTallyHitLow', 'agTallyStand'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const ctx = document.querySelector('canvas').getContext('2d');
    const frame = () => { e.update(1 / 60); e.anim = (e.anim || 0); G.sageMotion = null; e.draw(ctx); return G.sageMotion ? G.sageMotion.art : (G.rigMix && G.rigMix.mix < 1 ? 'rig:' + G.rigMix.move : '-'); };
    for (let f = 0; f < 30; f++) frame();
    const blow = () => { e.kbT = 0.22; e.vx = 260; e.hp -= 1; };
    blow(); const one = []; for (let f = 0; f < 40; f++) { player.x = e.x + 100; one.push(frame()); }
    out.first = one[0]; out.highFrames = one.filter(a => a === 'agTallyHitHigh').length; out.after = one[one.length - 1];
    // three quick blows: the third doubles him over
    for (let f = 0; f < 60; f++) { player.x = e.x + 100; frame(); }   // a second's rest: a new chain
    const seq = [];
    // (five frames apart: each lands while he still reels from the one before, as a claw combo does)
    for (let k = 0; k < 3; k++) { blow(); for (let f = 0; f < (k < 2 ? 5 : 12); f++) { player.x = e.x + 100; seq.push(frame()); } }
    out.third = seq.slice(10, 16); out.lowAny = seq.slice(10).includes('agTallyHitLow'); out.lowEarly = seq.slice(0, 10).includes('agTallyHitLow');
    return out;
  });
  check('TALLYMAN duels, and is hpK times as hard to break', R.duel && R.hpK >= 1.5 && Math.abs(R.hp / (R.base * R.hpK) - 1) < 0.05, JSON.stringify({ hp: R.hp, base: R.base }));
  check('...a quicker mind and a shorter breather', R.prof.step <= 0.7 && R.prof.denied <= 0.8, JSON.stringify(R.prof));
  check('...above half health a coil opens two lunges, below it three', R.full === 2 && R.half === 3, R.full + ' / ' + R.half);
  check('a blow stops him where he stands: a short step, not a slide', R.slide >= 0 && R.slide <= 16, R.slide + ' px');
  check('a blow snaps him into his struck picture on the frame it lands', R.first === 'agTallyHitHigh', R.first);
  check('...held long enough to read (a quarter second), then he comes back', R.highFrames >= 12 && R.highFrames <= 22 && R.after !== 'agTallyHitHigh', R.highFrames + ' frames, then ' + R.after);
  check('the third blow of a quick chain doubles him over, not the first two', R.lowAny && !R.lowEarly, JSON.stringify(R.third));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — TALLYMAN is a fight, and a blow lands on a body');
})().catch(e => { console.error(e); process.exit(1); });
