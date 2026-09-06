// RATCHET'S PLATE SET IS A MOVEMENT, NOT SEVEN COPIES OF ONE PICTURE.
//
// THE FAILURE THIS CAUGHT, on the first firing of the set (2026-08-21). Seven
// poses were fired, keyed, matted and wired, and every one of them looked
// right on the contact sheet. Measured, `notice` and `work_1` had a silhouette
// IoU of 0.992: they were the SAME DRAWING with the hands moved. So were four
// others. The cause is worth writing down because it will happen again — the
// generator was handed the anchor plate plus "same camera, same framing,
// CHANGE ONLY THE POSE", and it obeyed the wrong half: an editing model told
// to preserve a composition preserves it, and moves as little as it can get
// away with. The fix was to re-fire from the SEATED reference with the pose
// stated first and the framing lock removed.
//
// None of that is visible by reading source, and it is barely visible by
// looking — a loop of near-identical frames reads as "he isn't animating"
// rather than as anything specific. It is trivially visible as arithmetic,
// which is the whole argument for this directory.
//
// Four measurements, all on what the GAME draws, not on the files:
//   1. every pose puts pixels on the canvas          (wired, not just keyed)
//   2. no two poses share a silhouette               (ART_BIBLE §3.3, IoU)
//   3. his feet stay on the floor                    (§3.4 — the set anchor)
//   4. he does not change size between poses         (art-prompts §3, popping)
//
//   node tests/tinker.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// The bible's number for two states of one character. A pose that scores above
// this against another pose is not a second pose.
const IOU_MAX = 0.86;

(async () => {
  console.log('── tinker — Ratchet\'s seven poses are seven poses\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A0B');
    const s = G.statics.find(q => q.type === 'npc' && q.extra === 'ratchet');
    if (!s) return { err: 'no ratchet in A0B' };
    G.save.flags['on_' + npcKey(s)] = 1;                  // charged: he is awake
    const poses = Object.keys(TINKER_PLATE);
    poses.forEach(p2 => mediaFetch(TINKER_PLATE[p2]));
    // 840 KB a plate: wait for the art rather than measure the atlas fallback,
    // which would pass check 1 and mean nothing
    // ...and the WORK STRIP too. It is not in TINKER_PLATE — it is the loop the
    // work beats draw instead of a plate — so waiting only for the plate set
    // measured the still fallback and reported a loop that never moved.
    mediaFetch('ratchetLoop');
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      await new Promise(r2 => requestAnimationFrame(r2));
      if (poses.every(p2 => mediaHas(TINKER_PLATE[p2])) && mediaHas('ratchetLoop')) break;
    }
    const missing = poses.filter(p2 => !mediaHas(TINKER_PLATE[p2]))
      .concat(mediaHas('ratchetLoop') ? [] : ['ratchetLoop']);

    // Drawn LARGE and on a bare field: the den's own backdrop, halo and
    // contact shadow are not the subject and would be counted as one.
    const W = 520, H = 560, BASE = 500, Z = 2;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const q = cv.getContext('2d', { willReadFrequently: true });
    const shot = {};
    for (const pose of poses) {
      q.clearRect(0, 0, W, H);
      const shim = { x: 0, y: 0, w: s.w, h: s.h, extra: 'ratchet', room: 'A0B', t: 0, _tk: null };
      q.save(); q.translate(W / 2, BASE); q.scale(Z, Z); q.translate(-shim.w / 2, -shim.h);
      // BUILD THE STATE WITHOUT DRAWING, then draw once. Calling drawTinker to
      // create the rig and again to draw the forced pose leaves BOTH poses on
      // the canvas, and every measurement below is then taken on the union of
      // two bodies — which is exactly how the size check came back green on a
      // set that was visibly wrong.
      tinkerRig(shim);
      shim._tk.pose = pose; shim._tk.t = 9;
      const drew = drawTinker(q, shim, false);
      q.restore();
      const d = q.getImageData(0, 0, W, H).data;
      let minX = W, maxX = -1, minY = H, maxY = -1, n = 0;
      const mask = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (d[i * 4 + 3] > 60) {
          mask[i] = 1; n++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      shot[pose] = { drew: !!drew, px: n, foot: maxY - BASE, top: minY,
                     h: maxY - minY + 1, w: maxX - minX + 1,
                     mask: Array.from(mask) };
    }
    // THE WORK BEATS ARE A LOOP NOW, so measuring work1 against work2 asks
    // whether two names for the same animation differ — they do not, and cannot.
    // What matters instead is whether the LOOP moves, which is the thing the
    // owner reported it did not do ("a slide show gif instead of a live
    // machine"). Sample its own phase and compare the frames to each other.
    const loop = [];
    {
      // SHE STANDS BACK, because the work only runs when she is not over him —
      // walking up is what makes him look up, and the spawn is inside that
      // radius, so sampling there measures the `notice` plate six times. The
      // PLAYER moves, not the shim: moving the shim moves where he is drawn,
      // and the first attempt at this put him 900px off the right of the cell.
      const pkeep = player.x; player.x = s.x + 4000;
      const shim = { x: 0, y: 0, w: s.w, h: s.h, extra: 'ratchet', room: 'A0B', t: 0, _tk: null };
      tinkerRig(shim);
      // THE CLOCK IS DRIVEN, BECAUSE THE JOB MACHINE OWNS THE PHASE.
      //
      // Setting shim._tk.ph and then calling drawTinker does nothing: drawTinker
      // runs tinkerTask(r, dt) FIRST, which recomputes ph from its own clock and
      // overwrites whatever was assigned. Six draws in a tight loop are six draws
      // at dt≈0, so this was sampling ONE cell six times and then reporting that
      // the loop does not move. Measured straight off the sheet, the twelve cells
      // are strongly distinct — adjacent slices sit at 0.57-0.65 IoU and cell 0
      // against cell 6 at 0.135 — so the art was never the problem.
      //
      // performance.now advances 100 ms a sample, one cell at the strip's own
      // 10 fps, and the loop actually plays under the measurement.
      const realNow2 = performance.now;
      let clk2 = realNow2.call(performance);
      performance.now = () => clk2;
      shim._tk.last = clk2 / 1000;
      // ...and the frames kept are the ones the game says it DREW. drawTinker
      // records what it put on screen in G.tinkerFrame (`job:cell`), which is
      // the only honest way to ask "did the loop move" — hand-setting ph and
      // trusting it is what produced the six identical samples, and hand-
      // setting job left the rig's burst state (play/fps) uninitialised, so
      // ph went NaN and every cell resolved to 0. Drive the clock, let the job
      // machine run itself, and take the first six DISTINCT cells it shows.
      const seenCell = {};
      for (let f = 0; f < 400 && loop.length < 6; f++) {
        q.clearRect(0, 0, W, H);
        clk2 += 33;                                  // a frame of wall clock
        shim._tk.pose = 'work1'; shim._tk.t = 9;
        q.save(); q.translate(W / 2, BASE); q.scale(Z, Z); q.translate(-shim.w / 2, -shim.h);
        drawTinker(q, shim, false);
        q.restore();
        const shown = G.tinkerFrame || '';
        if (!/^\w+:\d+$/.test(shown) || seenCell[shown]) continue;   // a plate beat, or a cell already taken
        seenCell[shown] = 1;
        const d2 = q.getImageData(0, 0, W, H).data;
        const m2 = new Uint8Array(W * H);
        let n2 = 0, low = -1;
        for (let k = 0; k < W * H; k++) {
          if (d2[k * 4 + 3] > 60) { m2[k] = 1; n2++; const y2 = (k / W) | 0; if (y2 > low) low = y2; }
        }
        loop.push({ mask: m2, px: n2, foot: low - BASE });
      }
      performance.now = realNow2;
      player.x = pkeep;
    }
    let loopWorst = 0, loopPairs = 0;
    for (let i = 0; i < loop.length; i++) for (let j = i + 1; j < loop.length; j++) {
      let inter = 0, uni = 0;
      const A2 = loop[i].mask, B2 = loop[j].mask;
      for (let k = 0; k < A2.length; k++) { if (A2[k] || B2[k]) uni++; if (A2[k] && B2[k]) inter++; }
      const v = uni ? inter / uni : 1;
      loopPairs++;
      if (v > loopWorst) loopWorst = v;
    }
    const loopBest = Math.min.apply(null, loop.map((_, i) =>
      Math.min.apply(null, loop.map((__, j) => {
        if (i === j) return 1;
        let inter = 0, uni = 0;
        const A2 = loop[i].mask, B2 = loop[j].mask;
        for (let k = 0; k < A2.length; k++) { if (A2[k] || B2[k]) uni++; if (A2[k] && B2[k]) inter++; }
        return uni ? inter / uni : 1;
      }))));
    const loopFoot = loop.map(f2 => f2.foot);
    const loopPx = loop.map(f2 => f2.px);

    // pairwise silhouette overlap
    const iou = [];
    for (let i = 0; i < poses.length; i++) for (let j = i + 1; j < poses.length; j++) {
      const A = shot[poses[i]].mask, B = shot[poses[j]].mask;
      let inter = 0, uni = 0;
      for (let k = 0; k < A.length; k++) { if (A[k] || B[k]) uni++; if (A[k] && B[k]) inter++; }
      // work1 and work2 are two names for one loop now; the pair is not a
      // measurement, it is a tautology. The loop is measured above instead.
      const pair = poses[i] + '/' + poses[j];
      if (pair !== 'work1/work2' && pair !== 'work2/work1')
        iou.push({ a: poses[i], b: poses[j], v: uni ? inter / uni : 1 });
    }
    for (const p2 of poses) delete shot[p2].mask;         // do not ship 290k ints back

    // THE SMOKE COMES OUT OF HIM. It is the half of the brief that is NOT in
    // the plates — fired out of them on purpose, because a generator hands
    // back additive glow as a lit solid object (art-prompts §0) — so nothing
    // above would notice if the vent stopped emitting. Force the vent beat and
    // count what it puts into the particle system.
    parts.length = 0;
    const vs = { x: 0, y: 0, w: s.w, h: s.h, extra: 'ratchet', room: 'A0B', t: 0, _tk: null };
    tinkerRig(vs);
    vs._tk.pose = 'vent'; vs._tk.t = 9; vs._tk.blew = false;
    drawTinker(q, vs, false);
    const puff = parts.length;
    // ...and it is ONE puff, not a puff every frame it is on screen
    drawTinker(q, vs, false);
    const puff2 = parts.length;
    parts.length = 0;

    // ---- THE JOB DOES NOT REPEAT -------------------------------------------
    // The loop checks above ask whether the strip MOVES. This asks the owner's
    // actual question — whether it repeats — and it is the measurement
    // grammar.cjs runs on tile repeats, pointed at time instead of space.
    //
    // Run him as the game runs him: working, undisturbed, 30 simulated seconds
    // at 60 fps, recording the frame he draws each tick. drawTinker reads its
    // own wall clock, so the clock is driven by hand here — deterministic, and
    // it takes a second rather than half a minute.
    const jkeep = player.x; player.x = s.x + 4000;      // she stands back — see above
    const js = { x: 0, y: 0, w: s.w, h: s.h, extra: 'ratchet', room: 'A0B', t: 0, _tk: null };
    tinkerRig(js);
    const seq = [];
    const realNow = performance.now;
    let clock = 1000;
    js._tk.last = clock;
    performance.now = () => clock * 1000;
    for (let f = 0; f < 1800; f++) {
      clock += 1 / 60;
      q.clearRect(0, 0, W, H);
      G.tinkerFrame = '';
      drawTinker(q, js, false);
      seq.push(G.tinkerFrame || '-');
    }
    performance.now = realNow;
    player.x = jkeep;
    parts.length = 0;
    const distinct = new Set(seq).size;
    // normalised autocorrelation, lags from a fifth of a second to five
    // seconds: what fraction of frames match themselves that far back
    let bestLag = 0, bestScore = 0;
    for (let lag = 12; lag <= 300; lag++) {
      let hit = 0, n = 0;
      for (let i = lag; i < seq.length; i++) { n++; if (seq[i] === seq[i - lag]) hit++; }
      const sc = n ? hit / n : 0;
      if (sc > bestScore) { bestScore = sc; bestLag = lag; }
    }
    return { poses, missing, shot, iou, puff, puff2, loopBest, loopWorst, loopFoot, loopPx,
             seqLen: seq.length, distinct, bestLag, bestScore };
  });

  if (r.err) { console.log('  FAIL ' + r.err); process.exit(1); }
  check('every plate arrived', r.missing.length === 0, r.missing.join(' '));

  const drewAll = r.poses.filter(p => !r.shot[p].drew || r.shot[p].px < 4000);
  check('every pose draws a body', drewAll.length === 0,
        drewAll.map(p => p + ':' + r.shot[p].px + 'px').join(' '));

  // 2 — the silhouette law. Report the worst pair whatever happens: a set that
  // is only just inside the line is a set about to fail after the next re-fire.
  const worst = r.iou.slice().sort((a, b) => b.v - a.v)[0];
  const same = r.iou.filter(p => p.v > IOU_MAX);
  check('no two poses share a silhouette',
        same.length === 0,
        'worst ' + worst.a + '/' + worst.b + ' ' + worst.v.toFixed(3) + ' (max ' + IOU_MAX + ')' +
        (same.length ? ' — ' + same.length + ' pairs over' : ''));

  // 2b — AND THE LOOP MOVES. Twelve frames at 10 fps replaced the two work
  // stills; a strip that came back as twelve copies of one drawing would pass
  // every other check in this file and be exactly the slideshow it replaced.
  check('the work loop actually moves between frames',
        r.loopBest <= IOU_MAX,
        'closest pair of six sampled frames ' + r.loopBest.toFixed(3) +
        ' (max ' + IOU_MAX + '), widest ' + (1 - r.loopWorst).toFixed(3) + ' apart');
  {
    const bad = r.loopFoot.filter(f => Math.abs(f) > 4);
    check('...and it keeps its feet on the floor in every frame', bad.length === 0,
          'foot offsets ' + r.loopFoot.join(',') + 'px');
    const lo2 = Math.min.apply(null, r.loopPx), hi2 = Math.max.apply(null, r.loopPx);
    check('...and does not pump in size while it plays', (hi2 - lo2) / hi2 <= 0.18,
          lo2 + 'px .. ' + hi2 + 'px  spread ' + (((hi2 - lo2) / hi2) * 100).toFixed(1) + '%');
  }

  // 3 — feet on the floor. drawSetPlate anchors the mask bottom to the base, so
  // this is really asking whether the matte left anything hanging below him.
  const float = r.poses.filter(p => Math.abs(r.shot[p].foot) > 4);
  check('feet on the floor in every pose', float.length === 0,
        float.map(p => p + ' ' + r.shot[p].foot + 'px').join(' '));

  // 4 — no popping. AREA, not bounding-box height, and that distinction is the
  // whole check: the first version measured height, every pose came back within
  // 2%, and the photograph showed one plate visibly smaller than the other six.
  // A pose's bounding box is topped by whatever sticks up — here the canister
  // rack — so a small body under a high rack measures the same as a big body
  // under a low one. Silhouette area is what the eye is actually comparing.
  // Folding a body over does cost some area to self-occlusion, hence 18%
  // rather than something tighter.
  const ar = r.poses.map(p => r.shot[p].px);
  const lo = Math.min(...ar), hi = Math.max(...ar);
  const big = r.poses[ar.indexOf(hi)], small = r.poses[ar.indexOf(lo)];
  check('he is the same size in every pose', (hi - lo) / hi <= 0.18,
        small + ' ' + lo + 'px .. ' + big + ' ' + hi + 'px  spread ' +
        (((hi - lo) / hi) * 100).toFixed(1) + '%');

  // the owner's report: "the loop where I see the NPC working is somewhat
  // short... make it not repeat". A fixed-rate cycle of any length shows a
  // sharp peak at its period; a job with stages, bursts and varying tempo has
  // no period to find.
  check('he draws a long, varied sequence', r.seqLen > 900 && r.distinct >= 10,
        r.seqLen + ' frames, ' + r.distinct + ' distinct');
  check('no short period — he is working, not looping', r.bestScore < 0.55,
        'strongest repeat at ' + (r.bestLag / 60).toFixed(2) + 's matches ' +
        (r.bestScore * 100).toFixed(0) + '% (max 55%)');

  check('the vent actually smokes', r.puff >= 8, r.puff + ' particles');
  check('...once, not every frame it holds', r.puff2 === r.puff,
        r.puff + ' -> ' + r.puff2);

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
