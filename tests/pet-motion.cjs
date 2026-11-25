// A FREED GUARDIAN MOVES LIKE ITSELF (owner, 2026-11-20).
//
//   "So the defeated cheetah now is walking like a ghost on two legs, raising
//    his hand and moving. It looks so weird. He should, after I purify him,
//    he should just walk normally."
//
// A swing at a freed guardian is answered, never landed (js/pets.js). The
// lion's answer was a FLOP: the whole picture turned 86 degrees on its end for
// a second and a half, which stands a lion on its hind legs with its forepaws
// up — the ghost he saw. The bow, the rear and the curl were the same rigid
// tilt, smaller; and the moment came with a bloom of light round the body.
// This holds:
//   - no answer, of any guardian, rotates, squashes or lifts the body as one
//     flat picture (petPose: rot 0, scale 1, never above its feet);
//   - the lion's answers are his own motion: a poke plays his filmed ROAR take;
//   - no bloom round a pet, no rings round a purified body, no halo over a
//     cured machine (NO LIGHT ROUND A BODY);
//   - and a purified cheetah on the ground walks on four legs: its walk strip.
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
    const out = { bad: [], lion: null, bloom: 0, rings: 0, halo: 0 };
    // every guardian's every answer, sampled through the beat
    for (const kind in PET_ACTS) for (const a of PET_ACTS[kind]) for (const face of [-1, 1]) for (let i = 1; i < 10; i++) {
      const fake = { petAct: a, petT: 1.5 * (1 - i / 10), petT0: 1.5, face, petCheerT: 1 };
      const P = petPose(fake);
      if (!P) continue;
      if (Math.abs(P.rot) > 1e-6 || Math.abs(P.sx - 1) > 1e-6 || Math.abs(P.sy - 1) > 1e-6 || P.dy < -0.5)
        out.bad.push(kind + ':' + a + ' rot=' + P.rot.toFixed(2) + ' sx=' + P.sx.toFixed(2) + ' sy=' + P.sy.toFixed(2) + ' dy=' + P.dy.toFixed(1));
    }
    out.lionActs = PET_ACTS.glitch.slice();
    // the lion, freed, poked: which take does he play?
    const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1 });
    startGame(sv); loadRoom('A4'); G.state = 'PLAY';
    const L = G.boss;
    if (L && L.kind === 'glitch') {
      for (const k of BEAST_STRIPS) mediaFetch(k, 1);
      for (let i = 0; i < 160 && !(MEDIA_RAW.beastStudioRoar && MEDIA_RAW.beastStudioRoar.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
      L.dead = true; L.purified = true; L.pureT = 3; L.petAct = 'roar'; L.petT = 0.75; L.petT0 = 1.5;
      const seen = [];
      const D = window.drawStripCell;
      window.drawStripCell = function (c, key, cell) { seen.push(key + '#' + cell); return D.apply(this, arguments); };
      const cv = document.createElement('canvas').getContext('2d');
      beastStrip(cv, L);
      window.drawStripCell = D;
      out.lion = seen;
      // the flourish: no radial bloom round him
      const ctx = document.querySelector('canvas').getContext('2d');
      const RG = ctx.createRadialGradient;
      ctx.createRadialGradient = function () { out.bloom++; return RG.apply(this, arguments); };
      drawPetFx(ctx);
      ctx.createRadialGradient = RG;
    }
    // a purify: no rings round the body
    const ctx = document.querySelector('canvas').getContext('2d');
    G.cleanses = [];
    cleanseBegin(400, 300, 40, 30, 'pg_freed', null, true);
    const EL = ctx.ellipse;
    ctx.ellipse = function () { out.rings++; return EL.apply(this, arguments); };
    for (const tt of [0.3, 0.8, 1.4]) { G.cleanses[0].t = tt; drawCleanses(ctx); }
    ctx.ellipse = EL; G.cleanses = [];
    return out;
  });
  check('no freed guardian answers by tipping, squashing or lifting its whole picture', R.bad.length === 0, R.bad.slice(0, 4).join(' | '));
  check('...the lion no longer flops: his answers are a roar, a lean and a bonk', R.lionActs.indexOf('flop') < 0 && R.lionActs.indexOf('roar') >= 0, JSON.stringify(R.lionActs));
  check('...and his roar is his own filmed roar take', R.lion && R.lion.length && R.lion.every(s => /^beastStudioRoar#/.test(s)), JSON.stringify(R.lion));
  check('no bloom of light round a pet', R.bloom === 0, String(R.bloom));
  check('no rings round a purified body', R.rings === 0, String(R.rings));

  // the purified cheetah: four legs, walking
  const C = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, nfMeet: 1 });
    startGame(sv); loadRoom('CV2'); G.state = 'PLAY';
    const cats = G.enemies.filter(e => isCheetah(e));
    if (!cats.length) return { n: 0 };
    for (const k in CHEETAH_ART) mediaFetch(CHEETAH_ART[k].img, 1);
    for (let i = 0; i < 160 && !(MEDIA_IMG.cheetahWalk8 && MEDIA_IMG.cheetahWalk8.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const e = cats[cats.length - 1];
    e.storyKey = e.storyKey || 't_cat'; e.actorRole = 'infected-person'; e.die(1, -0.3);
    for (let k = 0; k < 120; k++) update(1 / 60);
    if (e.disabled) e.finishCleanse();
    player.x = 40;
    const ctx = document.querySelector('canvas').getContext('2d');
    const poses = {}; let haloArcs = 0, keys = {};
    const W = window.wolfPose;
    window.wolfPose = function (q, A, t) { const r = W(q, A, t); if (q === e) poses[r] = (poses[r] || 0) + 1; return r; };
    const DI = ctx.drawImage, AR = ctx.arc;
    ctx.arc = function (x, y, r) { if (Math.abs(x - (e.x + e.w / 2)) < 2 && Math.abs(y - (e.y - 12)) < 2) haloArcs++; return AR.apply(this, arguments); };
    for (let k = 0; k < 900; k++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; if (k % 3 === 0) { cam.x = e.x - 400; e.draw(ctx); } }
    window.wolfPose = W; ctx.arc = AR;
    return { n: cats.length, rescued: !!e.rescued, poses, haloArcs };
  });
  const walked = (C.poses.walkA || 0) + (C.poses.walkB || 0);
  check('a purified cheetah walks its four-legged walk', C.rescued && walked > 60, JSON.stringify(C));
  check('...and wears no halo over its head', C.haloArcs === 0, String(C.haloArcs));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — a freed guardian moves like itself, and no light rings it');
})().catch(e => { console.error(e); process.exit(1); });
