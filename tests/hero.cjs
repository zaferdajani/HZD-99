// HZD-99'S OWN BODY, MEASURED — and one rule with a tripwire under it.
//
// She is the one character in this game drawn procedurally rather than from
// authored plates (ART_BIBLE.md §2): her arms are IK-solved, her scarf is a
// spring chain, her double jump is a real rotation. That freedom is why her
// construction has drifted, and drifted in the same direction twice.
//
// THE RULE: HER ARM IS ONE PIECE. No pucks, no hinges, no rings, nothing on
// the limb that reads as a bead on a string. The owner has ruled this out more
// than once and it kept coming back, because it lived only in prose — and
// prose was argued with. The last round did not even reverse it, it SOFTENED
// it: three beads became two and the code comment congratulated itself.
//
// A rule half-applied is a rule ignored with extra steps. So it is arithmetic
// now: `armJoint` still exists, is never called, and counts every call it ever
// receives. If anything stamps hardware onto her arm again, this fails.
//
//   node tests/hero.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── hero — her arm is one piece, she has two of them, and nothing is bolted on');

  const m = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 900));
    G.wake = null;

    // Every state she has a limb in — standing, running, airborne, mid-swing,
    // dashing, hurt. A rule that only holds in the idle pose is not a rule.
    const POSES = [
      { n: 'idle', f: (p) => { p.vx = 0; p.on = true; } },
      { n: 'run', f: (p) => { p.vx = 300; p.on = true; } },
      { n: 'air', f: (p) => { p.vy = -260; p.on = false; } },
      { n: 'fall', f: (p) => { p.vy = 320; p.on = false; } },
      { n: 'swing', f: (p) => { p.swing = { t: 0.1, t0: 0.24, combo: 0, ang: -0.3 }; p.swingVis = p.swing; } },
      { n: 'combo2', f: (p) => { p.swing = { t: 0.1, t0: 0.24, combo: 2, ang: 0.4 }; p.swingVis = p.swing; } },
      { n: 'dash', f: (p) => { p.dashT = 0.12; p.vx = 620; } },
      { n: 'boost', f: (p) => { p.vy = -300; p.on = false; p.boostT = 0.28; } },
      { n: 'skid', f: (p) => { p.vx = 300; p.skidT = 0.2; } },
      { n: 'wallcling', f: (p) => { p.vy = 60; p.on = false; p.wallSlide = 1; } },
      { n: 'song', f: (p) => { p.songT = 0.5; } },
      { n: 'armfire', f: (p) => { p.armCD = 0.28; } },
      { n: 'lowhp', f: (p) => { p.cores = 1; p.vx = 0; } },
      { n: 'charge', f: (p) => { p.chargeT = 0.45; p.chargeOk = true; p.volts = 99; } },
      // the two that BLINK. She flickers while invulnerable and while repairing,
      // which is correct and which means a single sample can legitimately catch
      // her mid-blink and see nothing. They are swept across the blink phase
      // below rather than excluded — the joint tripwire has to cover them too,
      // and those are exactly the states where a limb gets redrawn specially.
      { n: 'hurt', f: (p) => { p.hurtPoseT = 0.3; p.hurtT = 0.3; p.iT = 0.9; }, blink: 1 },
      { n: 'heal', f: (p) => { p.healT = 0.5; p.vx = 0; }, blink: 1 },
    ];
    const cv2 = document.createElement('canvas');
    cv2.width = 320; cv2.height = 320;
    const x = cv2.getContext('2d');

    G._armJointCalls = 0;
    const shots = [];
    for (const pose of POSES) {
      for (const face of [1, -1]) {
        // a clean slate per pose so one does not leak into the next
        player.vx = 0; player.vy = 0; player.on = true; player.dashT = 0;
        player.swing = null; player.swingVis = null; player.hurtT = 0; player.healT = 0;
        player.skidT = 0; player.wallSlide = 0; player.songT = 0; player.armCD = 0;
        player.hurtPoseT = 0; player.chargeT = 0; player.cores = player.maxCores();
        // ...and the residue of LIVE play. The harness borrows the real player
        // out of a running room, and whatever it was doing a frame earlier —
        // a landing squash, a takeoff coil, leftover invulnerability — is
        // still on it. landT in particular gates the airborne pose, so a
        // stale landing made `air` measure as idle in the full suite and pass
        // alone: a flake that was really an incomplete reset.
        player.landT = 0; player.land0 = 0; player.flipT = 0; player.boostT = 0; player.takeoffT = 0;
        player.pogoT = 0; player.jetT = 0; player.iT = 0; player.idleT = 0;
        // ...and the STRIDE PHASE, for the same reason and one more. It picks
        // which cell of the cycle is drawn, so left unreset this samples a
        // random frame; and it now also drives the foot-plant lock's sideways
        // offset, so a random phase measures her silhouette at a random
        // horizontal displacement — which is a question about the lock, not
        // about whether she has two arms. Mid-stride: the lock contributes
        // exactly zero there, and the pose is the first of the cycle.
        player.stridePh = 0.5;
        player.face = face; player.faceVis = face; player.anim = 1.2;
        pose.f(player);
        // a blinking state is sampled across the blink until she is on screen,
        // so the measurement is of her BODY and not of the flicker's duty cycle
        let d0 = null;
        for (let ph = 0; ph < (pose.blink ? 8 : 1); ph++) {
          if (pose.blink) { player.iT = 0.9 - ph * 0.09; player.anim = 1.2 + ph * 0.07; }
          x.clearRect(0, 0, 320, 320);
          x.save();
          x.translate(160, 250); x.scale(3.4, 3.4);
          x.translate(-(player.x + player.w / 2), -(player.y + player.h));
          player.draw(x);
          x.restore();
          d0 = x.getImageData(0, 0, 320, 320).data;
          let any = 0;
          for (let i = 3; i < d0.length; i += 4 * 37) if (d0[i] > 40) { any = 1; break; }
          if (any) break;
        }
        // count the lit pixels either side of her centre line, so "she has two
        // arms" is measured rather than assumed: a one-armed character is
        // strongly asymmetric about its own spine at the shoulder height.
        const d = d0;
        let left = 0, right = 0;
        // ...and the full silhouette, packed to bits, for the IoU law below
        const mask = [];
        for (let yy = 0; yy < 320; yy += 2) for (let xx = 0; xx < 320; xx += 2) {
          const on2 = d[(yy * 320 + xx) * 4 + 3] > 40 ? 1 : 0;
          mask.push(on2);
          if (on2 && yy >= 150 && yy < 215) { if (xx < 160) left++; else right++; }
        }
        shots.push({ pose: pose.n, face, left, right, mask: face > 0 ? mask : null });
      }
    }
    return { joints: G._armJointCalls, shots };
  });

  // ---- 1. THE TRIPWIRE ----------------------------------------------------
  check('nothing stamps a joint onto her arm, in any state',
    m.joints === 0, m.joints + ' armJoint call(s) across ' + m.shots.length + ' poses');

  // ---- 2. SHE HAS TWO OF THEM ---------------------------------------------
  // Both sides of her spine carry limb material at shoulder height. The ratio
  // is generous on purpose — the far arm is drawn darker and is often partly
  // behind her, and in a swing one arm is thrown out and the other is not —
  // but a character with ONE arm shows a side with almost nothing on it.
  const lopsided = m.shots.filter(s => {
    const lo = Math.min(s.left, s.right), hi = Math.max(s.left, s.right);
    return hi > 0 && lo / hi < 0.16;
  });
  console.log('');
  for (const s of m.shots.slice(0, 6))
    console.log('    ' + (s.pose + '/' + (s.face > 0 ? 'R' : 'L')).padEnd(12)
      + 'left ' + String(s.left).padStart(5) + '   right ' + String(s.right).padStart(5));
  console.log('');
  check('she reads as two-armed in every pose',
    !lopsided.length,
    lopsided.map(s => s.pose + '/' + (s.face > 0 ? 'R' : 'L')).join(', '));

  // ---- 3. THE SILHOUETTE LAW, APPLIED TO HER ------------------------------
  // The guardians have obeyed this since the art bible was written (§3.3): a
  // named state must DIFFER from rest in silhouette, measured as IoU, because
  // "she has the mechanic but not the pose" is invisible in code and glaring
  // on screen. The state sheet caught three states drawn as idle; this is what
  // keeps the count at zero. The line is looser than the guardians' 0.86 —
  // she is a small character whose poses are carriage and lean, not limbs
  // thrown a body-length — but it is a LINE, and it fails the build.
  const IOU_MAX = 0.90;
  const idleMask = m.shots.find(s => s.pose === 'idle' && s.face > 0).mask;
  const iou = (a2, b2) => {
    let inter = 0, uni = 0;
    for (let i = 0; i < a2.length; i++) {
      if (a2[i] & b2[i]) inter++;
      if (a2[i] | b2[i]) uni++;
    }
    return uni ? inter / uni : 1;
  };
  const MUST_DIFFER = ['run', 'air', 'fall', 'swing', 'combo2', 'dash', 'boost', 'skid',
                       'wallcling', 'song', 'armfire', 'lowhp', 'charge', 'hurt', 'heal'];
  console.log('    IoU vs idle (must be <= ' + IOU_MAX + '):');
  const same = [];
  for (const n of MUST_DIFFER) {
    const sh = m.shots.find(s2 => s2.pose === n && s2.face > 0);
    if (!sh || !sh.mask) { same.push(n + ' (no mask)'); continue; }
    const v = iou(idleMask, sh.mask);
    console.log('      ' + n.padEnd(10) + v.toFixed(3) + (v > IOU_MAX ? '   <-- DRAWN AS IDLE' : ''));
    if (v > IOU_MAX) same.push(n + ' ' + v.toFixed(3));
  }
  check('every named state differs from idle in SILHOUETTE',
    !same.length, same.join(', '));

  // ---- 4. AND SHE IS ACTUALLY THERE ---------------------------------------
  const empty = m.shots.filter(s => s.left + s.right < 200);
  check('...and she is drawn at all in every state',
    !empty.length, empty.map(s => s.pose).join(', '));

  // ---- 5. HER AUTHORED BODY: EVERY NAMED CELL EXISTS ----------------------
  // She is drawn from assets/characters/hero/states.png now, and the failure
  // this stops is the one that has already happened twice in this repo from the
  // other direction: art DECLARED and never drawn. This is its mirror — a state
  // NAMED in HERO_CELL that runs off the end of the sheet. It does not throw;
  // drawImage on a source rect past the right edge just draws nothing, so she
  // would silently vanish in exactly one state and only in the build where that
  // state is reachable. Cheap arithmetic, permanent tripwire.
  const cells = await page.evaluate(() => {
    if (typeof HERO_CELL === 'undefined') return { skip: true };
    const im = (typeof MEDIA_IMG !== 'undefined') && MEDIA_IMG.heroStates;
    if (!im) return { skip: true };
    const names = Object.keys(HERO_CELL);
    const max = Math.max(...names.map(n => HERO_CELL[n]));
    return {
      skip: false, names: names.length, max, declared: HERO_CELLS,
      cols: im.width / (im.width / HERO_CELLS),      // sanity: the sheet divides
      w: im.width, h: im.height,
      // every index must be inside the sheet, and distinct
      over: names.filter(n => HERO_CELL[n] >= HERO_CELLS),
      dupe: names.length !== new Set(names.map(n => HERO_CELL[n])).size,
    };
  });
  if (cells.skip) {
    console.log('  ·  her state sheet is not loaded — procedural body in use, cells not checked');
  } else {
    console.log('    state sheet ' + cells.w + 'x' + cells.h + ', ' + cells.declared +
                ' cells, ' + cells.names + ' names, highest index ' + cells.max);
    check('every state she can be in has a cell on the sheet',
      !cells.over.length, cells.over.join(', '));
    check('...and no two states share one cell', !cells.dupe);
    check('...and the sheet divides evenly into its cells',
      cells.w % cells.declared === 0,
      cells.w + ' / ' + cells.declared + ' = ' + (cells.w / cells.declared) + ' px per cell');
  }

  // ---- 6. HER EYES ARE THE ONLY PART OF HER THAT ACTS ---------------------
  // She has no mouth and no brows, so every feeling she has is two lights. The
  // failure this stops is the one that makes an emotion system pointless: moods
  // that are DECLARED but look the same. A table of nine numbers that render as
  // three faces is worse than three moods honestly named.
  //
  // So each mood is rendered on the real body and compared to `calm` as pixels.
  // Nothing here judges whether angry looks angry — that is what
  // tools/moodshot.cjs is for — only that it looks DIFFERENT, which is the part
  // arithmetic can hold.
  const moods = await page.evaluate(() => {
    if (typeof HERO_MOOD === 'undefined') return { skip: true };
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroStates) return { skip: true };
    const names = Object.keys(HERO_MOOD);
    const S = 6, W = 46 * S, H = 46 * S;
    const shot = (m) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      x.setTransform(S, 0, 0, S, 0, 0); x.translate(23, 58);
      player.mood = m; player.moodT = 99; player.anim = 1.0;
      const sx = player.x, sy = player.y;
      player.x = 0; player.y = 0; player.on = true; player.vx = 0;
      x.save(); x.translate(-player.w / 2, -player.h); player.draw(x); x.restore();
      player.x = sx; player.y = sy;
      return x.getImageData(0, 0, W, H).data;
    };
    const base = shot('calm');
    const out = {};
    for (const m of names) {
      if (m === 'calm') continue;
      const d = shot(m);
      let diff = 0, lit = 0;
      // ...AND ONLY THE HEAD. The restyled plates (2026-09-03) carry thin cyan
      // seam lines over her whole body, which put the body back in the
      // denominator by another route — the eyes fell to 6% of the cyan set.
      // The visor lives in the upper half of the figure; the seams mostly do not.
      // the figure is drawn with its feet on row 58 (in units), so its head
      // half runs from (58 - h) down to (58 - h/2), scaled by S
      const visorTop = Math.floor((58 - player.h * 0.88) * S), visorBot = Math.floor((58 - player.h * 0.5) * S);
      for (let i = 0; i < d.length; i += 4) {
        const row = (i >> 2) / W | 0;
        if (row < visorTop) continue;
        if (row > visorBot) break;
        // ONLY THE CYAN. The first version of this counted every bright pixel
        // as "lit", which meant her entire ivory body — identical in every mood
        // — was in the denominator, and a total change of expression scored 5%.
        // Her eye-lights are the only strongly cyan thing on her, so the test
        // is: was this pixel cyan in either shot, and did it change.
        const ac = (base[i + 1] + base[i + 2]) / 2 - base[i];
        const bc = (d[i + 1] + d[i + 2]) / 2 - d[i];
        if (ac > 40 || bc > 40) {
          lit++;
          if (Math.abs(ac - bc) > 40 ||
              Math.abs(base[i + 1] - d[i + 1]) > 60) diff++;
        }
      }
      out[m] = lit ? diff / lit : 0;
    }
    player.mood = null; player.moodT = 0;
    return { skip: false, out };
  });
  if (moods.skip) {
    console.log('  ·  moods not checked — state sheet not loaded');
  } else {
    const MOOD_MIN = 0.12;
    const dull = [];
    console.log('    mood vs calm (must differ over ' + MOOD_MIN + ' of lit pixels):');
    for (const m of Object.keys(moods.out)) {
      const v = moods.out[m];
      console.log('      ' + m.padEnd(11) + v.toFixed(3) + (v < MOOD_MIN ? '   <-- SAME AS CALM' : ''));
      if (v < MOOD_MIN) dull.push(m + ' ' + v.toFixed(3));
    }
    check('every mood puts a different face on her', !dull.length, dull.join(', '));
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one limb, two arms, no hardware bolted to the outside');
})().catch(e => { console.error(e); process.exit(1); });
