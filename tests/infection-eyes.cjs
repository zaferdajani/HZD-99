// THE INFECTION'S EYES — measured, not described (js/infection-eyes.js).
//
// The owner's brief, rule by rule, each one a number here:
//
//   1. Infected ordinary machines burn RED at the eye; guardians (the Alpha
//      too) burn PURPLE.
//   2. A moving eye leaves incense smoke: born at the eye, rising, fading.
//   3. The smoke is born AT THE EYE — the anchor the art reports this frame —
//      not at the body's centre.
//   4. The smoke lives in the WORLD: a camera pan with the body standing still
//      makes no smoke and moves none.
//   5. A body that stops lets its plume dissipate and keeps only the glow.
//   6. Purified / calmed: emission stops at once, the wisps already out fade.
//      A teleport, a removal and a room change clear its trail.
//   7. Paused: nothing advances. The count is bounded by the quality tier.
//      Reduced motion keeps the glow and drops the smoke.
//
//   node tests/infection-eyes.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── infection-eyes — red for the rank and file, purple for guardians, smoke that leaves the eye and ends');
  const open = async (reduced) => {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
    await page.goto('http://127.0.0.1:8220/index.html');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof infEyeStats === 'function', { timeout: 20000 });
    return { page, errs };
  };

  // A STAGE: one body in a real room, its own AI switched off so the harness
  // moves it, the hero parked out of harm's way, the real update() and the
  // real draw() run every frame.
  const STAGE = () => {
    window.__stage = (room, pick, opts) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      Object.assign(sv.flags, (opts && opts.flags) || {});
      startGame(sv); loadRoom(room);
      G.state = 'PLAY';
      let body = pick();
      if (!body) return null;
      body.update = function () {};                // the harness moves it
      if (body !== G.boss) { G.enemies = [body]; G.boss = null; } else G.enemies = [];
      player.x = 40; player.y = 0; player.invT = 1e9; player.dead = false;
      const ensureArt = async () => {
        for (let i = 0; i < 4; i++) { draw(performance.now()); await new Promise(r => setTimeout(r, 120)); }
        const t0 = Date.now();
        while (Date.now() - t0 < 15000 && Object.keys(MEDIA_PEND).length) await new Promise(r => setTimeout(r, 80));
      };
      return { body, ensureArt };
    };
    window.__frame = (body, dx, dy) => {
      if (dx || dy) { body.x += dx || 0; body.y += dy || 0; body.vx = (dx || 0) * 60; body.faceVis = body.dir = (dx || 0) < 0 ? -1 : 1; }
      else body.vx = 0;
      body.anim = (body.anim || 0) + 1 / 60;
      update(1 / 60);
      draw(performance.now());
    };
  };

  // ---------------------------------------------------------------------------
  const { page, errs } = await open(false);
  await page.evaluate(STAGE);
  const R = await page.evaluate(async () => {
    const out = {};
    // ---- 1-3: a wolf trotting through A1 --------------------------------------
    const s = __stage('A1', () => G.enemies.find(e => isWolf(e)));
    await s.ensureArt();
    const w = s.body; w.x = 600; w.y = (G.roomDef.h - 4) * TILE - w.h;
    for (let i = 0; i < 40; i++) __frame(w, -3, 0);
    const st = infEyeStats();
    out.moving = { live: st.live, red: st.red, purple: st.purple };
    // the eye this frame, and the body it belongs to
    out.eye = w._eyeN ? [w._eyeW[0], w._eyeW[1]] : null;
    out.body = { x: w.x, y: w.y, w: w.w, h: w.h, cx: w.x + w.w / 2, cy: w.y + w.h / 2 };
    // the youngest particles sit at the eye, never at the body's centre
    const ps = infEyeParticles(w).sort((a, b) => a.age - b.age).slice(0, 4);
    out.youngest = ps.map(p => Math.hypot(p.x - out.eye[0], p.y - out.eye[1]));
    out.centreDist = Math.hypot(out.eye[0] - out.body.cx, out.eye[1] - out.body.cy);
    // ...and the older ones have RISEN (smoke goes up)
    const old = infEyeParticles(w).sort((a, b) => b.age - a.age)[0];
    out.oldRise = old ? { age: old.age, y: old.y, y0: old.y0 } : null;

    // ---- 4: camera only — body still ------------------------------------------
    for (let i = 0; i < 4; i++) __frame(w, 0, 0);
    const before = infEyeParticles(w).map(p => [p.x, p.y]);
    const nBefore = infEyeStats().live;
    cam.x += 220; cam.y += 40;
    // draw-only frames (update would re-aim the camera): smoke must not be minted by a pan
    for (let i = 0; i < 6; i++) draw(performance.now());
    const after = infEyeParticles(w).map(p => [p.x, p.y]);
    out.pan = { nBefore, nAfter: infEyeStats().live, moved: before.some((p, i) => after[i] && (p[0] !== after[i][0] || p[1] !== after[i][1])) };

    // ---- 5: standing still: the plume dissipates, the glow stays ---------------
    for (let i = 0; i < 60 * 2.2; i++) __frame(w, 0, 0);
    out.still = { live: infEyeStats().live, glow: w._eyeDraw === infEyeStats().frame && w._eyeN > 0 };

    // ---- 7a: paused — nothing advances ---------------------------------------
    for (let i = 0; i < 20; i++) __frame(w, -3, 0);
    const p0 = infEyeParticles(w).map(p => p.age + ',' + p.y);
    G.state = 'PAUSE';
    for (let i = 0; i < 30; i++) { update(1 / 60); draw(performance.now()); }
    const p1 = infEyeParticles(w).map(p => p.age + ',' + p.y);
    out.paused = { same: p0.join('|') === p1.join('|'), n: p0.length };
    G.state = 'PLAY';

    // ---- 6a: purified mid-stride ---------------------------------------------
    for (let i = 0; i < 20; i++) __frame(w, -3, 0);
    const atCure = infEyeParticles(w).length;
    w.calm = true; w.hypnoT = 1e9;
    // every wisp this body ever laid is counted at birth (infEyeSpawn)
    const bornAtCure = w._eyeBorn || 0;
    for (let i = 0; i < 10; i++) __frame(w, -3, 0);
    const newBorn = (w._eyeBorn || 0) - bornAtCure;
    const midFade = infEyeParticles(w).length;
    for (let i = 0; i < 60 * 2.2; i++) __frame(w, -3, 0);
    out.cure = { atCure, newBorn, midFade, end: infEyeParticles(w).length, glowAfter: w._eyeN > 0 && w._eyeDraw === infEyeStats().frame };
    w.calm = false; w.hypnoT = 0;

    // ---- 6b: teleport ----------------------------------------------------------
    for (let i = 0; i < 25; i++) __frame(w, -3, 0);
    const preTp = infEyeParticles(w).length;
    w.x += 400; __frame(w, 0, 0); __frame(w, 0, 0);
    out.tp = { preTp, after: infEyeParticles(w).length };

    // ---- 6c: removal, 6d: room change ------------------------------------------
    for (let i = 0; i < 25; i++) __frame(w, -3, 0);
    const preRm = infEyeParticles(w).length;
    G.enemies = []; update(1 / 60);
    out.rm = { preRm, after: infEyeParticles(w).length };
    G.enemies = [w];
    for (let i = 0; i < 25; i++) __frame(w, -3, 0);
    const preRoom = infEyeStats().live;
    loadRoom('A2');
    out.room = { preRoom, after: infEyeStats().live };

    // ---- 1b: a guardian burns purple: the Alpha, then NULLFANG ------------------
    const a = __stage('A10', () => G.boss);
    await a.ensureArt();
    a.body.st = 'prowl';
    for (let i = 0; i < 40; i++) __frame(a.body, -3, 0);
    out.alpha = { red: infEyeStats().red, purple: infEyeStats().purple, eye: a.body._eyeN };
    const n = __stage('A4', () => G.boss);
    await n.ensureArt();
    n.body.st = 'stalk'; n.body.meet = false;
    for (let i = 0; i < 40; i++) __frame(n.body, -3, 0);
    out.lion = { red: infEyeStats().red, purple: infEyeStats().purple, eye: n.body._eyeN };
    // a purified lion is a friend: no smoke at all
    n.body.purified = true;
    for (let i = 0; i < 60 * 2.2; i++) __frame(n.body, -3, 0);
    out.lionPure = infEyeStats().live;

    // ---- 7b: bounded on a phone ---------------------------------------------------
    qualSet('low');
    const m = __stage('A1', () => G.enemies.find(e => isWolf(e)));
    const herd = [m.body];
    for (let k = 0; k < 24; k++) { const e = new Enemy(m.body.kind, 200 + k * 30, m.body.y); e.update = function () {}; herd.push(e); }
    G.enemies = herd;
    for (let i = 0; i < 90; i++) { for (const e of herd) { e.x -= 3; e.vx = -180; e.anim = (e.anim || 0) + 1 / 60; } update(1 / 60); draw(performance.now()); }
    out.cap = infEyeStats();

    // ---- 7c: a many-eyed guardian stays inside the same budget ------------------
    // MOTHER-V looks out through her eight shell lenses (infEyeSetMax); on the
    // phone tier, moving, her threads share the one pool and never exceed it
    const mv = __stage('E3', () => G.boss);
    await mv.ensureArt();
    mv.body.st = 'idle'; mv.body.t = 99;
    let most = 0;
    for (let i = 0; i < 90; i++) { __frame(mv.body, i % 60 < 30 ? -3 : 3, 0); most = Math.max(most, infEyeStats().live); }
    out.mother = { eyes: mv.body._eyeN, max: mv.body._eyeMax, purple: infEyeStats().purple, red: infEyeStats().red, most, cap: infEyeCap(), bodyMax: INF_EYE_BODY_MAX };
    return out;
  });

  check('a trotting wolf smokes, and only red', R.moving.red > 10 && R.moving.purple === 0, JSON.stringify(R.moving));
  check('...its eye is found in the art, off the body centre', !!R.eye && R.centreDist > R.body.h * 0.2,
    'eye ' + (R.eye || []).map(Math.round) + ' centre ' + [R.body.cx, R.body.cy].map(Math.round) + ' (' + Math.round(R.centreDist) + ' px)');
  check('...and the eye is at the front of the head, not the hips', !!R.eye && R.eye[0] < R.body.cx && R.eye[1] < R.body.cy,
    'facing left: eye must be left of and above the centre');
  check('the youngest smoke is born AT the eye', R.youngest.length && Math.min(...R.youngest) < 6, R.youngest.map(v => v.toFixed(1)).join(', ') + ' px');
  check('...and older smoke has risen from where it was born', !!R.oldRise && R.oldRise.y < R.oldRise.y0 - 5, R.oldRise && ('age ' + R.oldRise.age.toFixed(2) + 's: born y ' + Math.round(R.oldRise.y0) + ', now ' + Math.round(R.oldRise.y)));
  check('a camera pan makes no smoke and moves none', R.pan.nAfter <= R.pan.nBefore && !R.pan.moved, JSON.stringify(R.pan));
  check('standing still, the plume dissipates and the glow stays', R.still.live === 0 && R.still.glow, JSON.stringify(R.still));
  check('paused, nothing advances', R.paused.same && R.paused.n > 0, R.paused.n + ' particles held');
  check('purified: not one new wisp from the moment it is cured', R.cure.newBorn === 0, R.cure.newBorn + ' born after the cure');
  check('...the wisps already out fade rather than vanish', R.cure.midFade > 0 && R.cure.midFade <= R.cure.atCure, R.cure.atCure + ' → ' + R.cure.midFade);
  check('...and are gone within their lifetime', R.cure.end === 0, R.cure.end + ' left');
  check('...and a cured machine shows no infected glow', !R.cure.glowAfter);
  check('a teleport clears the trail', R.tp.preTp > 0 && R.tp.after < 4, JSON.stringify(R.tp));
  check('removal clears the trail', R.rm.preRm > 0 && R.rm.after === 0, JSON.stringify(R.rm));
  check('a room change clears everything', R.room.preRoom > 0 && R.room.after === 0, JSON.stringify(R.room));
  check('the Alpha burns purple', R.alpha.purple > 5 && R.alpha.red === 0 && R.alpha.eye > 0, JSON.stringify(R.alpha));
  check('NULLFANG burns purple', R.lion.purple > 5 && R.lion.red === 0 && R.lion.eye > 0, JSON.stringify(R.lion));
  check('...and once freed, the lion smokes no more', R.lionPure === 0, R.lionPure + ' left');
  check('on a phone the smoke is bounded', R.cap.live <= R.cap.cap && R.cap.cap <= 100, JSON.stringify(R.cap));
  check('MOTHER-V reports her eight lenses, purple, and her smoke stays inside the phone budget',
    R.mother.eyes === 8 && R.mother.max === 8 && R.mother.max <= R.mother.bodyMax && R.mother.purple > 5 && R.mother.red === 0
    && R.mother.most <= R.mother.cap, JSON.stringify(R.mother));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await page.close();

  // ---- reduced motion: the glow, no smoke ---------------------------------------
  const rm = await open(true);
  await rm.page.evaluate(STAGE);
  const RM = await rm.page.evaluate(async () => {
    const s = __stage('A1', () => G.enemies.find(e => isWolf(e)));
    await s.ensureArt();
    const w = s.body; w.x = 600;
    for (let i = 0; i < 40; i++) __frame(w, -3, 0);
    return { live: infEyeStats().live, glow: w._eyeN > 0 };
  });
  check('reduced motion: the eye still glows, no smoke is drawn', RM.live === 0 && RM.glow, JSON.stringify(RM));
  await rm.page.close();

  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the eyes burn the right colour, the smoke leaves the eye, lives in the world and ends');
})();
