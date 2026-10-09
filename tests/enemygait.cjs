// THE ENEMIES MOVE LIKE BODIES — measured, not described.
//
// The owner's study (plan §1) named four things that made the roster read as
// paper being slid around, and each of them is a number here:
//
//   1. GROUNDED. Only the hero ever carried `on`, so the downhill ground snap
//      never ran for a machine (it skipped down every curve) and a hopper-wolf
//      in mid-air could not be told it had left the floor (walk frames through
//      the whole leap). Every machine now carries the flag, updated by every
//      move, and the airborne hopper wears the airborne plate.
//   2. NO MOONWALK. Velocity used to flip on the frame a walker decided to turn
//      while the picture eased round over ~0.18 s, so every turn slid the body
//      backwards under an image facing the old way. Outside a brake, the sign
//      of vx must never disagree with the side the picture shows.
//   3. FRAME-RATE-PROOF FLIERS. Their smoothing was a fraction PER FRAME, so a
//      120 Hz screen flew them four times as stiffly as a 30 Hz phone. One
//      flier, flown through the production mainLoop at 30, 60 and 120 fps,
//      must fly the same path.
//   4. A GAIT CLOCKED BY THE FLOOR. The walk bob ran on the wall clock, so feet
//      kept stepping at their own rate whatever the body did, and a walker
//      standing still kept bobbing. The phase must advance with distance and
//      not with time — and the head-scan's two-angle double exposure is gone.
//
//   node tests/enemygait.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── enemygait — grounded, no moonwalk, the same flight at any frame rate, a gait clocked by the floor');

  // =========================================================================
  // 1 + 2. THE WALKERS, IN THE REAL ROOMS. Each machine is driven by its own
  // update at 60 Hz: first on its rounds with her far away (patrol, ledge and
  // wall turns), then with her pacing back and forth beside it (notice turns,
  // coils, lunges, leaps). Every frame records what the floor and the picture
  // say. Dice are seeded, so a run is the same run every time.
  // =========================================================================
  const walk = await page.evaluate(() => {
    let seed = 1234567;
    const rand0 = Math.random;
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const out = { rooms: [], hop: null, onKinds: {} };
    const DT = 1 / 60;
    const WALK = { crawler: 1, guard: 1, blob: 1, hopper: 1 };
    for (const id of ['A1', 'A2', 'A6', 'B2', 'C2', 'CV2', 'D2', 'E1']) {
      if (!ROOMS[id]) continue;
      loadRoom(id); G.boss = null;
      const ws = G.enemies.filter(e => !e.dead && WALK[e.kind] && !e.calm);
      const R = { room: id, n: ws.length, frames: 0, moon: 0, moonAt: null, turns: 0, brakes: 0,
                  skips: 0, groundFrames: 0, onBool: true };
      const st = ws.map(e => ({ v: e.vx, side: e.faceVis >= 0 ? 1 : -1, onHist: [] }));
      for (let f = 0; f < 1500; f++) {
        // her: far away for the first 10 s, then pacing beside the first walker
        const near = f >= 600;
        const tgt = ws[(Math.floor(f / 300)) % Math.max(1, ws.length)];
        if (near && tgt) {
          player.x = tgt.x + Math.sin(f / 40) * 130; player.y = tgt.y + tgt.h - player.h;
        } else { player.x = -4000; player.y = -4000; }
        player.vx = 0; player.vy = 0; player.dead = false; player.iT = 999; player.on = true;
        ws.forEach((e, i) => {
          if (e.dead) return;
          const S = st[i];
          e.update(DT);
          if (e.dead) return;
          if (typeof e.on !== 'boolean') R.onBool = false;
          const side = e.faceVis >= 0 ? 1 : -1;
          if (side !== S.side) R.turns++;
          const vs = Math.sign(e.vx);
          // the moonwalk: moving one way while the picture shows the other —
          // allowed ONLY while braking (speed strictly falling toward zero),
          // and never through knockback, which is a push and not a walk
          if (vs && vs !== side && !(e.kbT > 0)) {
            if (Math.abs(e.vx) < Math.abs(S.v) - 1e-6 && Math.sign(S.v) === vs) R.brakes++;
            else { R.moon++; if (!R.moonAt) R.moonAt = e.kind + ' f' + f + ' vx ' + e.vx.toFixed(1) + ' face ' + e.faceVis.toFixed(2); }
          }
          // the skip: a walker on its rounds, on the floor, off it for one or
          // two frames and back on — ground that was there, lost. Its own
          // leaps, lunges and knockbacks are not skips.
          const own = (e.lungeT || 0) > 0 || e.wasAir || (e.kbT || 0) > 0 || e.kind === 'hopper';
          S.onHist.push(own ? 2 : (e.on ? 1 : 0));
          if (S.onHist.length > 4) S.onHist.shift();
          const h = S.onHist;
          if (h.length === 4 && h[0] === 1 && h[3] === 1 && (h[1] === 0 || h[2] === 0) && h[1] !== 2 && h[2] !== 2) R.skips++;
          if (e.on && !own) R.groundFrames++;
          R.frames++;
          S.v = e.vx; S.side = side;
        });
      }
      out.rooms.push(R);
    }
    // THE TAMED PACK walks the same way: after the Alpha yields, the wolves
    // escort her and mill about — and the milling used to slide them to and
    // fro under a picture that never turned
    {
      G.save.flags = G.save.flags || {}; G.save.flags.alpha = 1;
      loadRoom('A1'); G.boss = null;
      const ws = G.enemies.filter(e => !e.dead && isWolf(e));
      const T = { n: ws.length, moon: 0, turns: 0, frames: 0 };
      const last = ws.map(e => ({ v: e.vx, side: e.faceVis >= 0 ? 1 : -1 }));
      for (let f = 0; f < 1200; f++) {
        const a = ws[0];
        player.x = a ? a.x + Math.sin(f / 90) * 200 : 0; player.y = a ? a.y + a.h - player.h : 0;
        player.dead = false; player.iT = 999;
        ws.forEach((e, i) => {
          e.update(DT);
          const side = e.faceVis >= 0 ? 1 : -1, vs = Math.sign(e.vx), L = last[i];
          if (side !== L.side) T.turns++;
          if (vs && vs !== side && !(Math.abs(e.vx) < Math.abs(L.v) && Math.sign(L.v) === vs)) T.moon++;
          T.frames++; L.v = e.vx; L.side = side;
        });
      }
      out.tame = T;
      G.save.flags.alpha = 0;
    }
    // every kind, freshly spawned on the floor of a room, says where it is
    loadRoom('A1'); G.boss = null;
    for (const k of Object.keys(EKIND)) {
      const e = new Enemy(k, 10 * TILE, 15 * TILE - EKIND[k].h);
      out.onKinds[k] = typeof e.on;
    }
    // THE HOPPER-WOLF IN THE AIR. A flat strip of zone-A floor, her in reach.
    loadRoom('A2'); G.boss = null; G.enemies = [];
    G.grid = Array.from({ length: 17 }, (_, y) => Array.from({ length: 60 }, () => y >= 15 ? '#' : '.'));
    G.roomDef = Object.assign({}, G.roomDef, { w: 60, h: 17 });
    surfCurve = null;
    const hp = new Enemy('hopper', 20 * TILE, 15 * TILE - 24); hp.noHeightfield = true; G.enemies.push(hp);
    hp.t = 0.05;
    let air = 0, airLunge = 0, airWalk = 0, sawLand = 0, landPose = 0;
    for (let f = 0; f < 600; f++) {
      player.x = 26 * TILE; player.y = 15 * TILE - player.h; player.dead = false; player.iT = 999; player.on = true;
      hp.noHeightfield = true;
      hp.update(DT);
      const pose = isWolf(hp) ? wolfPose(hp) : '?';
      if (hp.on === false && hp.airT > 0.08) {
        air++;
        if (pose === 'lunge') airLunge++;
        if (/walk|run|rest/.test(pose)) airWalk++;
      }
      if (hp.landT > 0) { sawLand++; if (pose === 'land') landPose++; }
    }
    out.hop = { wolf: isWolf(hp), air, airLunge, airWalk, sawLand, landPose };
    Math.random = rand0;
    return out;
  });

  for (const k in walk.onKinds)
    if (walk.onKinds[k] !== 'boolean') check(k + ' is born knowing whether it stands', false, typeof walk.onKinds[k]);
  check('every kind is born with a grounded flag', Object.values(walk.onKinds).every(t => t === 'boolean'),
    Object.keys(walk.onKinds).length + ' kinds');
  const rooms = walk.rooms.filter(r => r.n);
  check('the walkers ran in real rooms', rooms.length >= 5 && rooms.every(r => r.frames > 500),
    rooms.map(r => r.room + ':' + r.n).join(' '));
  check('every walker carries `on`, every frame', rooms.every(r => r.onBool));
  const ground = rooms.reduce((a, r) => a + r.groundFrames, 0);
  check('...and it is true while they walk the floor', ground > 1000, ground + ' grounded frames');
  const skips = rooms.reduce((a, r) => a + r.skips, 0);
  const frames = rooms.reduce((a, r) => a + r.frames, 0);
  check('no walker skips down a curve (one/two-frame losses of ground that is there)', skips <= frames * 0.002,
    skips + ' in ' + frames + ' walker-frames · ' + rooms.map(r => r.room + ' ' + r.skips).join(', '));
  const turns = rooms.reduce((a, r) => a + r.turns, 0), brakes = rooms.reduce((a, r) => a + r.brakes, 0);
  check('they turned round, plenty', turns >= 20, turns + ' picture turns, ' + brakes + ' braking frames against the facing');
  const moon = rooms.reduce((a, r) => a + r.moon, 0);
  check('NO MOONWALK: outside a brake, vx never runs against the facing', moon === 0,
    moon ? moon + ' frames, first ' + rooms.filter(r => r.moonAt).map(r => r.room + ' ' + r.moonAt)[0] : '0 frames');
  check('the TAMED pack mills about without moonwalking', walk.tame.n > 0 && walk.tame.frames > 500 && walk.tame.moon === 0 && walk.tame.turns > 0,
    walk.tame.n + ' wolves, ' + walk.tame.turns + ' turns, ' + walk.tame.moon + ' frames against the facing');
  const H = walk.hop;
  check('the airborne hopper is a wolf in zone A (the case that ran walk frames mid-air)', H.wolf);
  check('...it left the ground', H.air > 10, H.air + ' airborne frames');
  check('...and wears the airborne plate, never a walk frame, in the air', H.airLunge === H.air && H.airWalk === 0,
    H.airLunge + ' lunge / ' + H.airWalk + ' walk of ' + H.air);
  check('...and lands into its own recovery pose', H.sawLand > 0 && H.landPose === H.sawLand,
    H.landPose + ' of ' + H.sawLand + ' landing frames');

  // =========================================================================
  // 3. THE FLIER AT 30, 60 AND 120 FPS — through the PRODUCTION mainLoop, on
  // a flat fixture (the speed2 method: real clock, real update, no drawing).
  // Two flights: its rounds with her away (patrol and perch), and a hunt with
  // her standing under it (station, the held tell, the dive, the climb out).
  // The dice are frozen so every run takes identical decisions.
  // =========================================================================
  const fly = await page.evaluate(async () => {
    const sv = newSave(1); sv.flags.woke = 1; sv.flags.tut = 1; sv.time = 99; startGame(sv); loadRoom('A2');
    window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 80));
    draw = () => {}; drawTouchUI = () => {}; pollGamepad = () => {}; preloadTick = () => {};
    const rand0 = Math.random;
    const run = (fps, hunt) => {
      Math.random = () => 0.37;
      G.roomDef = Object.assign({}, G.roomDef, { w: 80, h: 17, exits: {} });
      G.grid = Array.from({ length: 17 }, (_, y) => Array.from({ length: 80 }, () => y >= 15 ? '#' : '.'));
      surfCurve = null;
      G.enemies = []; G.boss = null; G.statics = []; G.pickups = []; G.plats = []; G.saws = []; G.pools = [];
      G.wake = G.cut = G.gateWalk = G.trans = G.dialog = G.bossEntry = G.tut = G.lesson = null;
      G.hitStop = 0; G.state = 'PLAY'; inputSuspended = false; PAD.on = false;
      player = new Player(hunt ? 30 * TILE : 70 * TILE, 15 * TILE - 36 - 0.01);
      player.on = true; player.noHeightfield = true; player.iT = 1e9;
      for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
      const f = new Enemy('flier', 26 * TILE, 12 * TILE);
      f.noHeightfield = true; f.atkCD = 1.2; f.packetCD = 99; f.hasMove = () => false;
      G.enemies.push(f);
      let now = 1000; lastT = now; G.simClock = 0;
      const path = [], steps = [[0, f.x, f.y, f.faceVis]], states = new Set();
      const total = hunt ? 4 : 8;
      while (G.simClock < total) {
        now += 1000 / fps; mainLoop(now);
        player.iT = 1e9; player.dead = false;
        if (f.holdT > 0) states.add('hold'); if (f.diveT > 0) states.add('dive');
        if (f.riseT > 0) states.add('rise'); if (f.perched) states.add('perch');
        steps.push([G.simClock, f.x, f.y, f.faceVis]);
      }
      // the path at exact quarter-seconds (the step at or before each)
      for (let k = 0, j = 0; k * 0.25 <= total; k++) {
        while (j < steps.length - 1 && steps[j + 1][0] <= k * 0.25 + 1e-9) j++;
        path.push([k * 0.25].concat(steps[j].slice(1)));
      }
      Math.random = rand0;
      return { path, steps, states: [...states] };
    };
    const out = {};
    for (const hunt of [false, true]) for (const fps of [30, 60, 120]) out[(hunt ? 'hunt' : 'rounds') + fps] = run(fps, hunt);
    return out;
  });
  for (const mode of ['rounds', 'hunt']) {
    const ref = fly[mode + '60'];
    for (const fps of [30, 120]) {
      const P = fly[mode + fps];
      // WHERE it flies, against where the 60 fps run flew within two of the
      // coarsest steps (1/30 s) of the same moment. A timer can only end on a
      // step, so two rates may start the same dive a step or two apart — the
      // same path, a frame later — and that is the fixed-step clock, not the
      // flier. What frame-rate dependence looks like is a DIFFERENT path: a
      // per-frame smoothing fraction flown at 120 fps converges in a quarter
      // of the time it takes at 30, and no window hides that.
      const WIN = 2 / 30;
      let worst = 0, at = 0;
      for (const [T, x, y] of ref.path) {
        let best = Infinity;
        // distance to the other run's path as drawn between its steps — a
        // 30 fps body moving 430 px/s is 14 px apart step to step, and the
        // point between two steps is where it was between them
        for (let i = 0; i + 1 < P.steps.length; i++) {
          const a = P.steps[i], b = P.steps[i + 1];
          if (b[0] < T - WIN || a[0] > T + WIN) continue;
          const vx = b[1] - a[1], vy = b[2] - a[2], L = vx * vx + vy * vy;
          const u = L ? Math.max(0, Math.min(1, ((x - a[1]) * vx + (y - a[2]) * vy) / L)) : 0;
          best = Math.min(best, Math.hypot(a[1] + vx * u - x, a[2] + vy * u - y));
        }
        if (best > worst) { worst = best; at = T; }
      }
      const tol = 4;
      check(mode + ': the flier at ' + fps + ' fps flies the 60 fps path (within ' + tol + ' px)', worst <= tol,
        'worst ' + worst.toFixed(1) + ' px at ' + at.toFixed(2) + ' s');
    }
    const travel = Math.max(...ref.path.map(p => Math.hypot(p[1] - ref.path[0][1], p[2] - ref.path[0][2])));
    check(mode + ': ...and it actually went somewhere', travel > 60, travel.toFixed(0) + ' px from where it started');
    console.log('       states ' + mode + ': ' + ['30', '60', '120'].map(f => f + '→' + fly[mode + f].states.join('+')).join('  '));
  }
  check('its rounds include a PERCH, not a sine drift', fly.rounds60.states.includes('perch'), fly.rounds60.states.join('+'));
  check('the hunt runs the whole cycle at every rate: tell, dive, climb out',
    ['30', '60', '120'].every(f => ['hold', 'dive', 'rise'].every(s => fly['hunt' + f].states.includes(s))));
  {
    // it faces the way it travels: between samples where it moved sideways
    // by more than 8 px, the facing's sign must match the travel
    const p = fly.rounds60.path; let n = 0, agree = 0;
    for (let i = 1; i < p.length; i++) {
      const dx = p[i][1] - p[i - 1][1];
      if (Math.abs(dx) > 8) { n++; if (Math.sign(dx) === Math.sign(p[i][3])) agree++; }
    }
    check('it faces where it is going', n >= 4 && agree >= n - 1, agree + ' of ' + n + ' travelling samples');
  }

  // =========================================================================
  // 4. THE GAIT IS CLOCKED BY THE FLOOR, AND ONE ANGLE IS DRAWN AT A TIME.
  // An atlas walker (the guard) is drawn offscreen: the same distance at two
  // different clock times must be the same picture; the same clock at two
  // distances must not be. And a facing that falls BETWEEN two authored
  // angles must draw exactly one of them, never a blend of both.
  // =========================================================================
  const gait = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('A1'); G.boss = null;
    mediaFetch('npcs', true); mediaFetch('roster', true);
    const t0 = Date.now();
    while (Date.now() - t0 < 20000 && !(mediaHas('npcs') && mediaHas('roster'))) await new Promise(r => setTimeout(r, 50));
    const W = 200, H = 160;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    const shot = (e) => {
      c.clearRect(0, 0, W, H); G.artProbe = 1;
      try { e.draw(c); } finally { G.artProbe = 0; }
      return c.getImageData(0, 0, W, H).data;
    };
    const diff = (a, b) => { let n = 0; for (let i = 3; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 8) n++; return n; };
    const mk = (kind) => {
      const e = new Enemy(kind, 0, 0); e.traits = []; e.tr = [];
      e.x = W / 2 - e.w / 2; e.y = 130 - e.h; e.faceVis = -1; e.dir = -1; e.on = true; e.vx = -e.spd;
      return e;
    };
    const out = {};
    for (const kind of ['guard']) {
      const e = mk(kind);
      e.walkD = 37; e.anim = 1.0; const a = shot(e);
      e.anim = 4.3; const b = shot(e);
      e.anim = 1.0; e.walkD = 49; const d = shot(e);
      out[kind] = { sameDistOtherTime: diff(a, b), otherDistSameTime: diff(a, d), lit: a.filter((v, i) => i % 4 === 3 && v > 40).length };
    }
    // standing still stands still: no distance, the clock running
    {
      const e = mk('guard'); e.vx = 0; e.walkD = 20;
      e.anim = 0.5; const a = shot(e); e.anim = 2.9; const b = shot(e);
      out.still = diff(a, b);
    }
    // between two authored angles: faceVis 0.4 and 0.5 sit inside the same
    // nearest angle (yaw 1.2 and 1.0) — a blend would draw them differently
    {
      const e = mk('guard'); e.vx = 0; e.walkD = 0; e.anim = 1;
      e.faceVis = 0.5; const a = shot(e); e.faceVis = 0.4; const b = shot(e);
      e.faceVis = -1; const s = shot(e);
      out.single = { between: diff(a, b), vsProfile: diff(a, s) };
    }
    // ...and walkD is what the floor gave it: a walker stepped along flat
    // ground banks exactly the distance it moved, and nothing in the air
    {
      G.grid = Array.from({ length: 17 }, (_, y) => Array.from({ length: 60 }, () => y >= 15 ? '#' : '.'));
      G.roomDef = Object.assign({}, G.roomDef, { w: 60, h: 17 });
      surfCurve = null;
      const e = new Enemy('guard', 20 * TILE, 15 * TILE - 22); e.noHeightfield = true; e.dir = 1; e.faceVis = 1;
      player.x = -4000; player.y = -4000;
      const x0 = e.x, d0 = e.walkD;
      for (let i = 0; i < 120; i++) e.update(1 / 60);
      out.dist = { moved: Math.abs(e.x - x0), banked: e.walkD - d0 };
    }
    return out;
  });
  {
    const g = gait.guard;
    check('guard: the drawing is there to measure', g.lit > 300, g.lit + ' px');
    check('guard: the same floor covered at a different clock time is the SAME picture',
      g.sameDistOtherTime === 0, g.sameDistOtherTime + ' px differ');
    check('guard: ...and more floor covered at the same clock time is a different picture',
      g.otherDistSameTime > 20, g.otherDistSameTime + ' px differ');
  }
  check('a walker standing still does not bob on the clock', gait.still === 0, gait.still + ' px differ over 2.4 s');
  check('one authored angle at a time: two facings inside the same angle draw identically (no blend)',
    gait.single.between === 0 && gait.single.vsProfile > 50,
    'between ' + gait.single.between + ' px, vs profile ' + gait.single.vsProfile + ' px');
  check('the gait banks the floor it covered, nothing else', gait.dist.moved > 50 && Math.abs(gait.dist.banked - gait.dist.moved) < 0.5,
    'moved ' + gait.dist.moved.toFixed(1) + ' px, banked ' + gait.dist.banked.toFixed(1));

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — they stand on the floor, turn on their feet, fly the same at any rate, and step with the ground');
})().catch(e => { console.error(e); process.exit(1); });
