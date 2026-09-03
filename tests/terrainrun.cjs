// IRREGULARITY IS NOT ELEVATION.
//
// The owner, 2026-08-24, watching the game after the surface curve became a
// heightfield: "Since we already created irregular surfaces, these irregular
// surfaces should not be considered as all to be elevations. There should be
// room for running on irregular surfaces without jumping. So a minimum
// irregularity in the surface should not require a jump and certainly should
// not stop enemies from moving, because most of the enemies now, they cannot
// move on an irregular surface and it's trapped in creases created by the
// terrain surface."
//
// Both halves were true and the second was much worse than it looked.
//
// THE ENEMIES were not trapped in creases. They were vibrating. groundAhead()
// — the ledge probe every patrol turns on — sampled ONE POINT four pixels
// below the feet, which was right until a body started standing on the curve
// ABOVE the tile that holds it up. Measured over ten seconds on the FLAT floor
// of A1: the crawler covered 44 px and reversed 566 times, the guard 17 px and
// 569, the C2 blob 9 px and 592. Six hundred frames, five hundred and ninety
// two turns. Every walking enemy in the game, in every room.
//
// THE PLAYER was stopped by pixels. In CV2 she was held for 473 frames out of
// 480 by TWO POINT NINE PIXELS of tile: the curve had carried her to within
// 3 px of the step ahead and the square collider still called it a wall.
//
// So this measures the sentence, in both halves:
//
//   1. WHAT STOPS HER IS ELEVATION. Walk her right across a room holding
//      nothing but the direction — never a jump — and every place she comes to
//      a halt must be a rise a player would READ as a step. Under that, the
//      terrain is merely breathing and she runs over it.
//   2. THE WALKERS WALK. A patrol must cover real ground and must not reverse
//      on every frame. Both numbers, because either one alone can be faked:
//      an enemy pinned in a corner has few turns, and one vibrating has many.
//
//   node tests/terrainrun.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── terrainrun — irregularity is not elevation\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv);
    const rest = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    await rest(40);
    const out = { stalls: [], walkers: [] };
    const enter = async (id) => {
      loadRoom(id); G.dialog = null; G.trans = null; G.state = 'PLAY';
      await rest(24);
    };
    // The rise the column ahead presents to a body standing where she is: the
    // top of the solid run it puts in her way, measured from her feet. This is
    // the same question stepUpTop asks, asked out loud.
    // WHAT IS IN FRONT OF HER — and "in front" is a span, not a sample.
    //
    // This read ONE column, two pixels past her front edge, and reported 0 —
    // "open ground ahead" — whenever she came to rest with that edge a few
    // pixels short of a tile boundary and the thing stopping her was the NEXT
    // column. That is how a genuine two-tile cave wall in CV1 was reported as a
    // halt in front of nothing, failing the room for a bump it does not have.
    // She is flush against whatever holds her, so the blocker is inside the
    // first few pixels of her nose; scan those columns and answer with the
    // tallest thing in them.
    const riseAhead = () => {
      const solid = (tx, ty) => { const c = tileAt(tx, ty); return c === '#' || c === 'B'; };
      const feet = player.y + player.h;
      const base = Math.floor((feet - 1) / TILE);
      const nose = player.x + player.w;
      let worst = 0;
      for (let tx = Math.floor(nose / TILE); tx <= Math.floor((nose + 6) / TILE); tx++) {
        let rise = 0;
        for (let k = 0; k <= 4; k++) {
          if (!solid(tx, base - k)) { rise = k === 0 ? 0 : feet - (base - k + 1) * TILE; break; }
          if (k === 4) rise = 999;                  // five tiles: a wall
        }
        worst = Math.max(worst, rise);
      }
      return worst;
    };

    // ---- 1: what stops her is elevation -------------------------------------
    // THE ROOM IS EMPTIED FIRST, and that is not cheating — it is the only way
    // to ask a terrain question. The first run of this harness left the cast in
    // and measured 0 px of travel in seven rooms out of eight, which looked
    // exactly like the terrain still holding her and was the enemies doing
    // their job: they patrol again now, so they reach her, and a hurt player is
    // knocked backwards. What is being measured here is the FLOOR.
    for (const id of ['A1', 'A2', 'CV1', 'CV2', 'C2']) {
      if (!ROOMS[id]) continue;
      await enter(id);
      G.enemies = []; G.boss = null; G.projs = [];
      // SHE IS PUT ON THE FLOOR THIS ROOM ACTUALLY HAS, not on a fixed row.
      //
      // `h - 4` is the floor in the meadow and it is not the floor everywhere.
      // In C2 it drops her inside the geometry: she spends the first three
      // seconds being ejected — the trace reads -19, -27, -31 px before she
      // ever moves forward — and then has to make the 100 px back before the
      // measurement counts anything. She came in at 104 px stepped by hand and
      // at 0 under the frame clock, which is a harness reporting where it threw
      // her rather than what the terrain does.
      // ...AND ON A STRETCH SHE CAN ACTUALLY WALK. Column 4 is not sacred: in A2
      // and C2 the floor there puts her nose against a 32 px step — a full tile,
      // above the 24 px a body may step — so she stands pressing right, entirely
      // correctly, and travels nothing. That is a legitimate stop and a useless
      // measurement: this harness is asking what the floor does to a walk, and a
      // walk needs somewhere to start. She is put at the first column from 4
      // onward that has four tiles of level ground in front of it.
      const floorAt = (cx) => {
        for (let ty = ROOMS[id].h - 1; ty >= 0; ty--) if (solidAt(cx, ty)) return ty;
        return null;
      };
      let startCol = 4, floorTy = floorAt(4);
      for (let cx = 4; cx <= 4 + 14; cx++) {
        const f = floorAt(cx);
        if (f == null) continue;
        let level = true;
        for (let d = 1; d <= 4; d++) {
          const g = floorAt(cx + d);
          if (g == null || Math.abs(g - f) > 0) { level = false; break; }
        }
        if (level) { startCol = cx; floorTy = f; break; }
      }
      player.x = startCol * TILE;
      player.y = (floorTy == null ? ROOMS[id].h - 4 : floorTy) * TILE - player.h - 1;
      player.vx = 0; player.vy = 0;
      await rest(30);
      // ...and she has to be STANDING before the run means anything. A body
      // still settling is a body whose first frames of travel are the fall.
      for (let g = 0; g < 90 && !player.on; g++) await new Promise(k => requestAnimationFrame(k));
      // THE RUN IS FIVE SECONDS OF THE GAME'S CLOCK, NOT 300 OF THE MACHINE'S.
      //
      // Counting frames measures the machine. Under the full suite the frames
      // are fewer and longer, so 300 of them can cover a fraction of the walk —
      // and this harness duly reported 0 px in a room that walks fine on its
      // own, naming a different room each run. What the terrain does is a fact
      // about SIM time; the frame rate is a fact about the laptop.
      // ...AND THE GAME HAS TO BE PLAYING. update() simulates the player only
      // inside `if (G.state === 'PLAY')`, while the sim CLOCK advances
      // regardless — so a room that enters holding a toast or a line of
      // dialogue reads as five full seconds in which she did not take a step,
      // which is indistinguishable from a floor that stopped her. A1 is the
      // tutorial floor, with a trader and toasts in it, and A1 is where this
      // kept landing. Pinned the way tests/grammar.cjs pins it, for the same
      // reason: the state is not what this harness is asking about.
      const stDesc = Object.getOwnPropertyDescriptor(G, 'state');
      Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
      G.dialog = null; G.toasts = [];
      let last = player.x, run = 0, travelled = 0;
      const hits = [];
      const t0 = G.simClock || 0;
      // THE BACKSTOP IS FOR A STALLED PAGE, NOT FOR A HEAVY ROOM. At 20 s it
      // had become the thing that ended the run: this harness instruments every
      // frame, and in the busiest rooms that costs enough that five seconds of
      // sim no longer fit — C2 came out at 3.25 s and reported as unmeasured
      // while covering 676 px, which is a working room failing a stopwatch.
      // Measured in isolation, C2 runs 33 fps with its clock tracking wall time
      // exactly, so the room was never the problem. Budget widened so every
      // room reaches the same five seconds and the travel numbers stay
      // comparable; a page that is genuinely dead still ends here rather than
      // hanging the suite.
      const wallStop = performance.now() + 40000;
      let frames = 0, mid = null, lastClock = t0;
      while ((G.simClock || 0) - t0 < 5 && performance.now() < wallStop) {
        keys.ArrowRight = 1;                        // direction only. Never jump.
        await new Promise(k => requestAnimationFrame(k));
        if (G.roomId !== id || player.dead) break;  // she walked out; not a stall
        // A SAMPLE IS A SIMULATED FRAME, NOT A CALLBACK.
        //
        // rAF callbacks are not evenly spaced under load: after a stall the
        // browser delivers several back to back, and between two of those the
        // simulation has advanced by nothing at all. Twelve such samples in a
        // row read as a body that has stopped dead — which is how this reported
        // "CV1 @0px", a halt in front of no step, on a machine running the rest
        // of the suite, and passed the same room standing alone. The clock says
        // whether anything happened; a callback does not.
        if ((G.simClock || 0) <= lastClock) continue;
        lastClock = G.simClock || 0;
        frames++;
        const dx = player.x - last;
        travelled += Math.max(0, dx);
        if (dx < 0.4) run++; else run = 0;
        last = player.x;
        // a real halt, not one slow frame: a fifth of a second of no progress
        if (run === 12) hits.push(Math.round(riseAhead()));
        // ...and one snapshot taken WHILE THE KEY IS HELD. Sampling after the
        // loop reports vx 0 for every room, including the ones that walked the
        // whole way, because the input was released a line earlier — a
        // diagnostic that answers the same for a pass and a failure.
        if (!mid && frames === 40) mid = {
          on: !!player.on, vx: Math.round(player.vx), stun: +(player.stunT || 0).toFixed(2),
          hurt: +(player.hurtT || 0).toFixed(2), swing: !!player.swing,
          gate: !!G.gateWalk, recharge: !!G.recharge, dialog: !!G.dialog,
          keyRead: (typeof inD === 'function' ? !!inD('RIGHT') : null),
          rawKey: !!keys.ArrowRight, room: G.roomId, state: G.state,
          feet: Math.round(player.y + player.h), riseAhead: Math.round(riseAhead()),
        };
      }
      keys.ArrowRight = 0;
      if (stDesc) Object.defineProperty(G, 'state', stDesc);
      else { delete G.state; G.state = 'PLAY'; }
      // ...and if the clock never moved, say THAT rather than blaming the floor.
      const simRan = +(((G.simClock || 0) - t0)).toFixed(2);
      // WHEN A ROOM READS DEAD, SAY WHY. "0 px" is the same string whether the
      // floor stopped her, the body was stunned, a gate walk took the controls,
      // or she never landed — and telling those apart by re-running the harness
      // and squinting is how an evening disappears.
      const why = mid || { note: 'never sampled' };
      out.stalls.push({ room: id, travelled: Math.round(travelled), rises: hits, simRan, frames, why });
    }

    // ---- 2: the walkers walk -------------------------------------------------
    // ...and only the kinds that PATROL. The first run counted turrets and
    // hoppers as stuck walkers: a turret is bolted down and a hopper crouches
    // where it stands until she is close enough to leap at, so both measure
    // zero range by design and neither has anything to do with the floor.
    const PATROLS = ['crawler', 'guard', 'blob'];
    for (const id of ['A1', 'A2', 'C2', 'CV2']) {
      if (!ROOMS[id]) continue;
      await enter(id);
      const ws = G.enemies.filter(e => !e.dead && PATROLS.indexOf(e.kind) >= 0);
      const rec = ws.map(e => ({ kind: e.kind, min: e.x, max: e.x, flips: 0, last: e.dir,
                                 starved: 0, frames: 0 }));
      for (let f = 0; f < 360; f++) {
        await new Promise(k => requestAnimationFrame(k));
        if (G.roomId !== id) break;
        ws.forEach((e, i) => {
          if (e.dead) return;
          const R = rec[i];
          R.min = Math.min(R.min, e.x); R.max = Math.max(R.max, e.x);
          if (e.dir !== R.last) { R.flips++; R.last = e.dir; }
          // THE FAILURE MODE, MEASURED DIRECTLY. Distance is a bad proxy: it
          // moves with the difficulty spawn cull, with the kind's speed, and
          // with where in the room the thing happened to start. What actually
          // broke was the LEDGE PROBE — a walker standing on solid ground being
          // told there is none ahead — so that is what is counted.
          R.frames++;
          if (!groundAhead(e, e.dir) && !groundAhead(e, -e.dir)) R.starved++;
        });
      }
      for (const R of rec)
        out.walkers.push({ room: id, kind: R.kind, range: Math.round(R.max - R.min), flips: R.flips,
                           starved: R.frames ? +(R.starved / R.frames).toFixed(2) : 0 });
    }
    return out;
  });

  // 1. every halt is a real step. 24 px is the line and it is drawn from the
  //    census of what the terrain actually presents: rises cluster under 16,
  //    which is the ground breathing, and the allowance in entities.js is 20.
  //    Anything that still stops her is meant to.
  const small = r.stalls.flatMap(s => s.rises.filter(v => v < 24).map(v => s.room + ' @' + v + 'px'));
  check('nothing under a step stops her', small.length === 0,
        small.length ? small.slice(0, 6).join(', ') : 'every halt was a rise of 24 px or more');
  // ...and she gets off the mark in every room. The floor is deliberately low:
  // how FAR she gets before a real step stops her is a fact about where that
  // room put its first step, not about the collider, and the check above
  // already proves every stop is a real one. CV2's is a 58 px cliff four tiles
  // in — she is meant to jump it, and this harness never presses jump. What
  // this catches is the failure that actually happened: 40 px in 480 frames.
  // a room whose clock never advanced was never measured — that is a stalled
  // page, and reporting it as terrain would be a lie about the game
  // The bar is what the check is FOR — proving the room was simulated at all.
  // A stalled page reads at or near zero; below about three seconds the travel
  // number stops meaning anything either way. Every room's actual figure is
  // printed on the pass line, so a room that starts creeping toward the floor
  // is visible before it becomes a failure.
  const unrun = r.stalls.filter(s => s.simRan < 3);
  check('the clock ran in every room', unrun.length === 0,
        unrun.length ? unrun.map(s => s.room + ' only ' + s.simRan + 's of sim in ' + s.frames + ' frames').join(', ')
                     : r.stalls.map(s => s.room + ' ' + s.simRan + 's/' + s.frames + 'f').join('  '));
  // A ROOM WHOSE FIRST OBSTACLE IS A REAL STEP IS NOT A DEAD ROOM.
  //
  // This is the fault that made the whole check flicker, and it was mine: once
  // she is placed on the floor the room actually has, column 4 of A2 and C2 puts
  // her against a 32 px rise — a full tile, above the 24 px the body may step —
  // and she stands there pressing right, exactly as she should. The snapshot
  // says so in as many words: keyRead true, rawKey true, on true, state PLAY, no
  // stun, no gate, and riseAhead 32. Nothing is broken; she is meant to jump it,
  // and this harness never presses jump.
  //
  // The check above already proves every halt is a legitimate step, and the
  // comment there already said how far she gets is "a fact about where that room
  // put its first step, not about the collider". So a room that is blocked by a
  // real step passes, and what remains caught is the failure this was written
  // for: she is free to walk and does not.
  const STEP = 24;
  const dead = r.stalls.filter(s => s.travelled < 100 && !(s.why && s.why.riseAhead >= STEP));
  const parked = r.stalls.filter(s => s.travelled < 100 && s.why && s.why.riseAhead >= STEP);
  for (const d of dead) console.log('       ' + d.room + ' dead: ' + JSON.stringify(d.why));
  for (const q of parked)
    console.log('       ' + q.room + ': stopped at a real ' + q.why.riseAhead +
                'px step ' + q.travelled + 'px in — a jump, not a fault');
  check('...and she gets moving in every room she was put in', dead.length === 0,
        dead.length ? dead.map(s => s.room + ' ' + s.travelled + 'px').join(', ')
                    : r.stalls.map(s => s.room + ' ' + s.travelled).join(', '));

  // 2. the walkers walk. Both numbers: 90 px is under three tiles, which is
  //    not a patrol, and a walker that reverses more than once a second is not
  //    turning round, it is shaking.
  // 2. the walkers walk. The ledge probe must not tell a walker standing on
  //    solid ground that the world has run out on both sides of it — that is
  //    what made 592 turns in 480 frames, and it is speed-independent and
  //    spawn-independent in a way that raw distance is not.
  const starved = r.walkers.filter(w => w.starved > 0.15);
  check('no walker is told the ground has run out under its own feet',
        starved.length === 0,
        starved.length ? starved.map(w => w.room + ' ' + w.kind + ' ' + Math.round(w.starved * 100) + '%').join(', ')
                       : r.walkers.length + ' walkers, worst ' +
                         Math.round(Math.max(...r.walkers.map(w => w.starved)) * 100) + '% of frames');
  const shaking = r.walkers.filter(w => w.flips > 6);
  check('...and none of them is vibrating in place', shaking.length === 0,
        shaking.length ? shaking.map(w => w.room + ' ' + w.kind + ' ' + w.flips + ' turns').join(', ')
                       : 'worst is ' + Math.max(...r.walkers.map(w => w.flips)) +
                         ' turns in 360 frames (it was 592 in 480)');
  // ...and as a population they cover ground. Per-enemy distance is noisy, so
  // this is the median: one parked blob is not a terrain failure, a roster
  // that has stopped walking is.
  const ranges = r.walkers.map(w => w.range).sort((a, b) => a - b);
  const median = ranges.length ? ranges[ranges.length >> 1] : 0;
  check('...and the roster covers real ground', median >= 120,
        'median patrol ' + median + 'px across ' + ranges.length +
        ' walkers (range ' + ranges[0] + '-' + ranges[ranges.length - 1] + ')');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
