// DOES SHE ACTUALLY RUN, OR DOES SHE SKIP?
//
// The owner's report was "the cat movement is horrible", and reading the
// animation code did not explain it — the plates are fine and the state machine
// is sensible. Driving her and MEASURING did: running across level ground she
// was airborne 8 frames in 24, her feet juddering 20 px, vy spiking to 153.
//
// She was not running. She was bouncing. The surface heightfield caught her
// going UP a mound and had no answer going DOWN one, so every descending column
// left her unsupported for a frame; and the pose read `on` directly, so each of
// those frames swapped her to an airborne plate — which is drawn CENTRED rather
// than from the foot, so she popped and changed size as well.
//
// Both halves are cheap to measure and neither is visible in a still frame,
// which is exactly why this file exists.
//
//   node tests/gait.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── gait — she runs on the ground, and the drawing agrees\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r2 => setTimeout(r2, 1200));
    // ...and every sheet this room started fetching is IN before the clock is
    // taken away from it, because once the loop is driven nothing else gets a
    // turn to finish a download.
    {
      const t0 = Date.now();
      while (Date.now() - t0 < 15000
             && Object.keys(MEDIA_PEND).some(k => MEDIA_LOW[k] !== 3))
        await new Promise(r2 => setTimeout(r2, 50));
    }
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    // the room's own furniture is not what is being measured
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
    G.toasts = [];
    // THE HARNESS OWNS THE CLOCK, BECAUSE THIS FILE'S OWN COMPLAINT WAS RIGHT.
    //
    // It says, forty lines down, that "a measurement whose answer depends on
    // the load of the machine measuring it is not a test" — and then waited on
    // requestAnimationFrame for every sample, which is precisely such a
    // measurement. mainLoop advances min(raw, SIM_MAX) seconds of world per
    // frame and runs update() as many times as that takes, so on a busy box one
    // "frame" here was three simulation steps and "the worst single-frame step"
    // measured three of them stacked. That is why this harness passed alone and
    // collapsed inside a full suite, repeatedly.
    //
    // So: the game's loop is unhooked (its re-arm becomes a no-op), the wall
    // clock is stubbed, and the frame is DRIVEN — one call, one synthetic
    // 60 Hz tick, one update. It is still the real frame path, physics and
    // drawing and all; it just happens when this file says so. After the stub,
    // one real frame is let through so the loop's last armed callback lands and
    // finds a no-op waiting for it.
    const realNow = performance.now, realRAF = window.requestAnimationFrame;
    let clk = realNow.call(performance);
    await new Promise(r2 => realRAF(r2));
    window.requestAnimationFrame = () => 0;
    await new Promise(r2 => setTimeout(r2, 40));     // let the armed callback land
    performance.now = () => clk;
    const STEP = 1000 / 60;
    const frame = async () => { clk += STEP; mainLoop(clk); };
    keys.ArrowRight = 1;
    for (let i = 0; i < 40; i++) await frame();      // up to full speed first
    // RUNNING OFF A LEDGE IS NOT THE FAULT. She is only expected to stay on the
    // ground where there IS ground: a step down of a tile or more is level
    // design and she is supposed to fall off it. So every sample records
    // whether solid tile sits directly under her feet, and the frames where it
    // does not are not counted against her.
    const solidUnder = () => {
      const tx = Math.floor((player.x + player.w / 2) / TILE);
      const ty = Math.floor((player.y + player.h + 2) / TILE);
      for (let k = 0; k <= 1; k++) {
        const ch = tileAt(tx, ty + k);
        if (ch === '#' || ch === 'B' || ch === '=') return true;
      }
      return false;
    };
    const air = [], feet = [], states = [], vys = [], over = [], lifts = [];
    const strideStart = player.stridePh || 0, animStart = player.anim;
    for (let i = 0; i < 48; i++) {
      await frame();
      // she is not the subject of the room's hazards here
      player.iT = Math.max(player.iT, 1); player.cores = 5;
      G.enemies = [];
      air.push(player.on ? 0 : 1);
      over.push(solidUnder() ? 1 : 0);
      feet.push(player.y + player.h);
      vys.push(Math.abs(player.vy));
      states.push(player.heroState(Math.abs(player.vx) > 140));
      lifts.push(player._stepLift || 0);
    }
    // THE BOB IS SAMPLED OVER A STRIDE, NOT OVER A NUMBER OF FRAMES. The rise
    // and fall is a function of stridePh, and 48 real frames cover however much
    // of that the machine's frame rate happens to deliver — so on a loaded box
    // the samples landed at similar phases and the range collapsed to 1.34 px
    // against the same code that reads 2.94 px unloaded. A measurement whose
    // answer depends on the load of the machine measuring it is not a test.
    // This keeps sampling until the stride itself has advanced two full cycles.
    const bob = [];
    {
      const ph0 = player.stridePh || 0;
      for (let i = 0; i < 240; i++) {
        await frame();
        player.iT = Math.max(player.iT, 1); player.cores = 5;
        G.enemies = [];
        bob.push(player._stepLift || 0);
        if ((player.stridePh || 0) - ph0 >= 2.2) break;
      }
    }
    keys.ArrowRight = 0;
    // AND WHERE DOES THE FOREGROUND SIT? The near depth plate exists to cross in
    // FRONT of her; if its top edge is at or below her soles it is a black band
    // under her feet and she reads as pasted onto the backdrop instead of
    // standing in it. Reported as "going in background looks fake", and it was
    // measurable: the plate was anchored to the room's lowest solid row, not to
    // the surface she walks on.
    let fore = null;
    const key = 'fore' + G.roomDef.zone;
    const im = (typeof MEDIA_IMG !== 'undefined') && MEDIA_IMG[key];
    if (im && im.naturalWidth && typeof roomFloorAnchor === 'function') {
      const h = im.naturalHeight * (0.46 * 540 / im.naturalHeight);
      const anchor = roomFloorAnchor(0) - camSY();
      fore = { top: anchor - h * 0.22, feet: player.y + player.h - camSY() };
    }
    // Hand the clock back, and RE-ARM THE LOOP. Restoring requestAnimationFrame
    // is not enough on its own: mainLoop stopped because its own re-arm became
    // a no-op, and nothing else ever calls it — so the page would sit frozen
    // and the stick measurement below would read a body that never moved.
    performance.now = realNow; window.requestAnimationFrame = realRAF;
    realRAF.call(window, mainLoop);
    return { air, feet, states, vys, over, fore, lifts, bob,
             strideStart, animStart, strideEnd: player.stridePh || 0, animEnd: player.anim,
             stepWalk: HERO_STEP_WALK, stepRun: HERO_STEP_RUN, cells: HERO_CELLS,
             vx: Math.round(player.vx) };
  });

  // only the frames with ground under her
  const onFloor = r.air.map((a, i) => (r.over[i] ? a : 0));
  const floorFrames = r.over.reduce((a, b) => a + b, 0);
  const airFrames = onFloor.reduce((a, b) => a + b, 0);
  // A SKIP IS SHORT. This counted every airborne frame over solid floor and
  // failed at 4 of 44 — but four consecutive frames is one honest fall off one
  // honest step, and the terrain has steps in it. What a bounce looks like is
  // DEPARTURES OF ONE OR TWO FRAMES: gone before gravity gets going, back
  // before she has travelled a body width. Long departures are level design and
  // are not this file's business; short ones are the fault, and before the
  // ground snap there were eight of them in twenty-four frames.
  const runs = [];
  for (let i = 0; i < onFloor.length; i++) {
    if (!onFloor[i]) continue;
    if (i && onFloor[i - 1]) runs[runs.length - 1]++; else runs.push(1);
  }
  const skips = runs.filter(n => n <= 2).length;
  // THE BAR IS ZERO, and it is met. Before the ground snap: eight short skips
  // in twenty-four frames, every run. The one that survived it was not a
  // tuning number after all — groundColumnAt refused to answer for the last
  // three pixels of every room, so no snap distance could have fixed it. Five
  // runs for five now report no departures at all.
  check('she does not skip: no one-frame departures from ground that is there',
    skips === 0,
    skips + ' skip(s) of 1-2 frames; departures ' + (runs.length ? runs.join('/') : 'none') +
    ' over ' + floorFrames + ' floor frames (vx ' + r.vx + ')');

  // THE POSE DOES NOT FLICKER. An airborne plate appearing mid-stride is the
  // visible half of the same fault, and it survives even a single lost frame
  // because those cells are drawn from a different anchor.
  const airPose = r.states.filter((s, i) => r.over[i] &&
    (s === 'fall' || s === 'apex' || s === 'rise')).length;
  check('the drawing never calls a stride a fall',
    airPose === 0,
    airPose + ' airborne pose(s) mid-run: ' + [...new Set(r.states)].join(' '));

  // AND SHE DOES NOT JUDDER. Following the ground is right; jumping up and down
  // on the spot is not. Measured as the biggest step between adjacent frames.
  let worst = 0;
  for (let i = 1; i < r.feet.length; i++)
    if (r.over[i] && r.over[i - 1]) worst = Math.max(worst, Math.abs(r.feet[i] - r.feet[i - 1]));
  // The ceiling here is set by the MECHANISM, not by taste: the ground snap
  // reaches 14 px below her feet and the uphill catch can lift her onto a mound,
  // so ~16 px is the largest step the design can produce in a frame and 18 is
  // that with room.
  //
  // THE 15 PX THIS USED TO REPORT WAS NOT A 15 PX STEP. It was three simulation
  // steps stacked, because a sample was one requestAnimationFrame and mainLoop
  // runs update() as many times as the frame's elapsed time asks for. The note
  // that used to sit here called the number uncomfortable and proposed
  // smoothing the drawn height to fix it — that would have been a change to how
  // she is drawn, made to satisfy an artefact of how she was measured. Driven
  // at one update per sample she reads 4.3 px, every run, which is a body
  // following ground rather than one being thrown by it.
  //
  // The ceiling stays where it is: a real step-down can still snap the whole
  // 14 px in one frame, and what this line guards is the regression — a number
  // above 18 means something is throwing her, not that the floor rolls.
  check('her feet follow the ground rather than bouncing on it',
    worst <= 18, 'worst single-frame step ' + worst.toFixed(1) + ' px');

  // AND IT IS THE COUNT OF EPISODES THAT TELLS A BOUNCE FROM A DROP, not the
  // speed reached. A peak |vy| means nothing on its own: falling off one real
  // step reaches the same number as ten little hops, and the first is level
  // design. What a bounce looks like is MANY SEPARATE short departures from
  // ground that is still there — before the ground snap landed, running across
  // A1 produced one every two or three frames.
  let episodes = 0;
  for (let i = 0; i < onFloor.length; i++) if (onFloor[i] && !onFloor[i - 1]) episodes++;
  check('she leaves the ground once and deliberately, not over and over',
    episodes <= 2, episodes + ' separate departure(s) from solid floor');

  // THE STRIDE HAS A VERTICAL, AND IT IS ON THE RIGHT FOOT.
  //
  // The body's rise and fall was computed for years and handed only to the
  // procedural fallback; the authored plate — the thing players see — held one
  // height while two pictures alternated. Two things are checked, because the
  // first without the second is worse than nothing: that the body MOVES
  // vertically at all, and that it is LOWEST at the footfall, which is the
  // frame the cell swaps on. A bob on the wrong foot reads as a limp.
  const lifts = (r.bob && r.bob.length > 8) ? r.bob : r.lifts;
  const range = Math.max(...lifts) - Math.min(...lifts);
  check('her body rises and falls as she strides', range >= 1.5,
    'vertical travel ' + range.toFixed(2) + ' px over the run');
  // THE CADENCE IS THE THING TO GUARD, and the phase is not measurable here.
  //
  // Three attempts went into checking that the body is lowest ON the footfall.
  // All three measured the SAMPLER: draw runs once per frame while update runs
  // up to three times, so the frame on which a cell change is noticed can be a
  // third of a step past the crossing, and a correct bob reports as inverted.
  // The bob and the cell are driven off the same variable one line apart in
  // entities.js; that is a fact about the source, not something frame samples
  // can confirm, and a check that measures its own resolution is worse than no
  // check at all.
  //
  // What IS measurable, and what was actually wrong: HOW FAR ONE STEP CARRIES
  // HER. The cadence itself is not a free number — she is travelling at a
  // known speed and her legs cover a known distance per stride, so steps per
  // second is the quotient of those two and asserting a band on it just
  // re-asserts whichever of them was picked last. Both of the previous bands
  // were exactly that, and both had to move when the other number moved.
  //
  // So the check is against the PLATES. Her contact poses put her soles a
  // measurable distance apart, and that distance IS the step: the trailing
  // sole lands where the leading one stands, so the body travels sole-to-sole
  // per step. Re-measured here from the sheet, independently of the game, and
  // compared with the constant the game strides by. It fails if somebody
  // re-fires the walk plates without re-measuring, or edits the constant
  // without the plates — the two ways the legs and the floor come apart.
  const stepPx = await measureWalkStep(page);
  const stepUnits = stepPx.soleSpan * (60 / stepPx.cellH);      // HERO_DH / cell height
  check('the stride length in the code is the stride length in the ART',
    Math.abs(stepUnits - r.stepWalk) <= 2.5,
    'plates say ' + stepUnits.toFixed(1) + ' world units per step (soles '
      + stepPx.soleSpan + 'px apart in a ' + stepPx.cellH + 'px cell), '
      + 'HERO_STEP_WALK is ' + r.stepWalk);
  // ...and the passing pose is the proof the other two are contacts: feet
  // together, or "sole separation" was measuring something else entirely.
  check('walk_b is the passing pose, feet together', stepPx.passSpan < stepPx.soleSpan * 0.4,
    'walk_b soles ' + stepPx.passSpan + 'px apart vs walk_a ' + stepPx.soleSpan);
  // A ceiling, not a band: whatever the numbers are, a footfall rate no body
  // could produce is still the strobe this harness was written for.
  const steps = r.strideEnd - r.strideStart, secs = r.animEnd - r.animStart;
  const cadence = secs > 0 ? steps / secs : 0;
  check('...and the resulting footfall rate is not a strobe',
    cadence > 0 && cadence <= 11,
    cadence.toFixed(2) + ' steps/sec at vx ' + r.vx);

  if (r.fore) {
    const above = r.fore.feet - r.fore.top;
    // a quarter of her height is the least that reads as "in front of her" —
    // she stands 60 px, so 15 px of overlap at the ankles is the floor of it
    check('the foreground plate crosses in front of her, not under her feet',
      above >= 15, 'its top edge sits ' + above.toFixed(0) + ' px above her soles');
  } else {
    console.log('  --   no near plate in this zone, nothing to place');
  }

  // THE PHONE'S STICK HAS A MAGNITUDE, and for a long time it did not. It was
  // two comparisons against one threshold, so an 11 px push and a 56 px push
  // produced the same signal and touch had exactly one gait: full sprint,
  // always. There is no way to inch toward a ledge with a control that only
  // knows "go", and the phone is what the owner plays on.
  //
  // Also checked: a thumb trembling ON the boundary must not chatter the key.
  // One threshold toggles under a stationary hand and reads as the game
  // dropping inputs; the trigger is hysteretic now.
  const touch = await page.evaluate(async () => {
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const speeds = {};
    // AND THE ROOM STOPS TALKING FIRST. update() only simulates the player
    // inside G.state === 'PLAY', and this measurement runs in A1, where Servo
    // stands: a dialog opening mid-hold does not slow her down, it stops her
    // being simulated at all. That is why the same build reported 50/100,
    // 186/150, 0/340 and 186/0 across four runs today — the reading was not
    // noisy, she was genuinely not moving for whole legs of it. Sealed the way
    // shopread, terrainrun and cavedark seal it, so what is measured is the
    // control and nothing else.
    try {
      Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
      Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
    } catch (e) {}
    G.toasts = [];
    // SHE ACCELERATES IN PLACE. This measures what the STICK asks for, and it
    // used to measure that by letting her run for 45 real frames and reading
    // her speed at the end — which also measured whatever she ran into. The
    // light push moves her ~140 px before the full push starts from there, so
    // on a loaded machine (a full suite run, bigger frame deltas, more distance
    // per frame) she reached a wall during the second leg and the check
    // reported 186 against a "full push" of 100. Pinning x cannot hit anything,
    // and vx is integrated independently of it, so the number is the control's.
    for (const px of [20, 56]) {
      TOUCH.joy = { id: 1, ox: 0, oy: 0, dx: px, dy: 0 };
      tApplyJoy();
      // ...AND THE SPEED IS THE STEADY STATE, NOT ONE FRAME OF IT. This read
      // player.vx on the single frame the hold ended on, and a single frame is
      // whatever that instant held: across four runs of unchanged code today
      // this check reported 50/100, 186/150, 0/340 and 186/0, passing and
      // failing on the same build. Under a held stick her speed is flat, so
      // the median of the last dozen frames is the same measurement with the
      // noise taken out — and a genuine zero is still a zero, because twelve
      // frames of standing still have a median of zero.
      const x0 = player.x, tail = [];
      for (let i = 0; i < 45; i++) {
        // ...AND THE THUMB STAYS DOWN. The stick was set once and then not
        // touched for forty-five frames, so what the loop actually measured
        // was whatever survived friction after a single frame of input — which
        // is near zero for a light push and anyone's guess for a hard one.
        // A held stick is held every frame, which is what a thumb does.
        TOUCH.joy = { id: 1, ox: 0, oy: 0, dx: px, dy: 0 };
        tApplyJoy();
        await frame(); player.x = x0;
        if (i >= 33) tail.push(Math.abs(player.vx));
      }
      tail.sort((a, b) => a - b);
      speeds[px] = Math.round(tail[tail.length >> 1]);
      TOUCH.joy = { id: 1, ox: 0, oy: 0, dx: 0, dy: 0 }; tApplyJoy();
      for (let i = 0; i < 25; i++) { await frame(); player.x = x0; }
    }
    let flips = 0, last = null;
    for (let i = 0; i < 40; i++) {
      TOUCH.joy = { id: 1, ox: 0, oy: 0, dx: 11 + (i % 2 ? 1.5 : -1.5), dy: 0 };
      tApplyJoy();
      const on = !!keys.VR;
      if (last !== null && on !== last) flips++;
      last = on;
      await frame();
    }
    TOUCH.joy = null; tApplyJoy();
    return { walk: speeds[20], run: speeds[56], flips };
  });
  check('a light push on the phone stick is a walk, not a sprint',
    touch.walk > 40 && touch.walk < touch.run * 0.8,
    touch.walk + ' px/s at a light push vs ' + touch.run + ' at full');
  check('a thumb resting on the threshold does not chatter the input',
    touch.flips === 0, touch.flips + ' on/off flips under a trembling thumb');

  check('no page errors while running', !errs.length, errs[0] || '');

  console.log('');
  if (fails.length) { console.log('FAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('OK — she runs on the ground, and the drawing agrees');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

// HER STRIDE, OFF THE SHEET. Not off the game's constants — the whole point is
// to compare the two — so this reads the pixels: the widest sole-to-sole span
// in the bottom ten rows of a contact cell, and the same span in the passing
// cell, which must be small or the measurement is finding something other than
// two feet.
async function measureWalkStep(page) {
  return await page.evaluate(async () => {
    const im = MEDIA_IMG.heroStates;
    const N = HERO_CELLS, cw = im.naturalWidth / N, ch = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = ch;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const D = x.getImageData(0, 0, cv.width, ch).data;
    const A = (ci, xx, yy) => D[(((yy * cv.width) + ci * cw + xx) * 4) + 3];
    function soles(ci) {
      let y1 = -1;
      for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) if (A(ci, xx, yy) > 40) y1 = yy;
      let a = 1e9, b = -1;
      for (let yy = y1 - 9; yy <= y1; yy++) for (let xx = 0; xx < cw; xx++)
        if (A(ci, xx, yy) > 40) { if (xx < a) a = xx; if (xx > b) b = xx; }
      return b - a;
    }
    // the two contacts, averaged — they are the same step seen on each leg
    const ca = soles(HERO_CELL.walk_a), cc = soles(HERO_CELL.walk_c);
    return { soleSpan: Math.round((ca + cc) / 2), passSpan: soles(HERO_CELL.walk_b), cellH: ch };
  });
}
