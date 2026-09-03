// WHAT IS THE BOSS ACTUALLY DOING WITH ITS TIME?
//
// The complaint was that the guardians stand around. The first measurement of
// that was taken against a player who stood still, which is not the fight — a
// boss with a chase state will pick it, close the distance in a moment, and
// look far busier than it is; a boss whose approach is gated on range will
// never leave idle. Either way the number describes a situation nobody plays.
//
// So the target moves here: runs the arena, jumps, and swings. Every state the
// boss enters is timed, and the states are sorted into what they MEAN —
//
//   idle    standing, waiting, resting, recovering: dead air the player watches
//   move    walking, chasing, repositioning: alive, but not a threat yet
//   wind    telegraphs — the beat the player reads and answers
//   hit     the attack itself
//
// A fight that is more than about a third STANDING STILL is a fight with holes
// in it. The bar is set at 40% rather than 34% because these are twenty-second
// samples of a stochastic fight and they jitter a few points run to run; the
// roster measured 57–73% before this was written, so 40 is a guard with teeth.
// The report names the worst still-state per boss so tuning has somewhere to go.
//
//   node tests/bosspace.cjs [seconds]
const { chromium } = require('playwright');

const BOSSES = [
  { room: 'A4', kind: 'glitch', name: 'NULLFANG' },
  { room: 'B4', kind: 'brood', name: 'TALONHOST' },
  { room: 'C3', kind: 'atlas', name: 'FURNACE CHOIR' },
  { room: 'D3', kind: 'zero', name: 'GLACIERE' },
  { room: 'X1', kind: 'prism', name: 'PRISM PROWLER' },
  { room: 'E3', kind: 'mother', name: 'MOTHER-V' },
];
// every state name in the game, sorted by what it costs the player
const IDLE = /^(idle|rest|restlow|recover|wait|dorm|stun|crouch|nullend|cffloor|hurt)/;
const MOVE = /^(walk|run|chase|stalk|prowl|step|hover|drift|reposition|turn|fly|glide|circle|swim|climb|rise|swoop|dive|dash|pounce|spring|nullhop)/;
// a telegraph is anything whose NAME says "this is coming" — including the
// warn/tell suffixes, which the first cut of this classifier missed and so
// filed NULLFANG's entire wind-up under "attack"
const WIND = /(warn|tell|wind|charge|cast|call|prep|coil|aim|lock|summon)/;

(async () => {
  const secs = parseFloat(process.argv[2] || '20');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const rows = [];
  for (const B of BOSSES) {
    const r = await page.evaluate(async ({ B, secs }) => {
      const sv = newSave(1);
      sv.time = 99; sv.flags.tut = 1;
      sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
      startGame(sv);
      loadRoom(B.room);
      const frame = () => new Promise(r => requestAnimationFrame(r));
      for (let i = 0; i < 30; i++) await frame();
      const b = G.boss;
      if (!b) return { err: 'no boss in ' + B.room };
      // wake it, and keep her alive so the fight is a fight and not a funeral
      b.st = 'idle'; b.t = 0; b.hp = b.hpMax || b.hp;
      // ...and how much of each state it spent MOVING. FURNACE CHOIR's `idle`
      // is her walk — she closes on you the whole time she is in it — and a
      // guardian shortening the distance is applying pressure whatever the
      // state is called. Measure the behaviour, not the label.
      // THE SEED THIS FILE HAS BEEN ASKING FOR SINCE 2026-08-15. The note at
      // the assertion records the measurement — NULLFANG lands at 40-43%
      // against a 40% line roughly two runs in six, at the same rate either
      // side of unrelated changes — and names the two honest fixes: seed the
      // sampled window, or make the lion move more. This is the seed. Every
      // guardian's state choice runs through rnd(), which is Math.random, so
      // pinning it makes the twenty seconds the SAME twenty seconds on every
      // run: the number stops being a sample of a stochastic fight and becomes
      // a fact about this build. Seeded per guardian so they do not all share
      // one stream, and restored the moment the window closes — the rest of
      // the page must keep its real randomness.
      const _mrand = Math.random;
      let _seed = (0x2f6e2b1 ^ (B.kind.length * 2654435761)) | 0;
      Math.random = () => {
        _seed ^= _seed << 13; _seed ^= _seed >>> 17; _seed ^= _seed << 5; _seed |= 0;
        return ((_seed >>> 0) % 1000003) / 1000003;
      };
      const seen = {}, moved = {}, order = [];
      // AND THE WINDOW IS MEASURED ON THE FIGHT'S CLOCK, NOT THE WALL'S. The
      // loop advances min(raw, SIM_MAX) x paceK() seconds of world per frame,
      // so under load the world falls behind real time — and this harness was
      // charging every state the wall-clock ms it sat on screen. That is why
      // the same build read differently inside the full suite than alone: not
      // a different fight, a different ruler. G.simClock is the world's own
      // elapsed seconds; every number below is now denominated in it.
      let last = G.simClock || 0, attacks = 0, prev = null;
      const t0 = last;
      const end = t0 + secs;
      // ...with a wall-clock stop as a backstop only, so a page that stalls
      // ends the harness instead of hanging it.
      const wallStop = performance.now() + (secs * 3 + 10) * 1000;
      // ...AND THE PLAYER SWINGS ON A CLOCK, NOT ON A FRAME COUNTER. The input
      // pattern was 'every 14th frame' and 'every 45th frame', which is a
      // different pattern per second whenever the machine is busy — so the
      // fight this samples was literally a different fight inside the full
      // suite than it was on its own, which is exactly the signature the note
      // describes. The cadences below are the same numbers expressed in ms at
      // 60fps, fired on elapsed time, so a slow frame delays a swing instead of
      // deleting it.
      let nextFlip = 0.75, nextZ = 0.434, nextX = 0.234;
      let dir = 1, tick = 0, lx = b.x, ly = b.y;
      const SAMPLE_MS = 1000 / 60;      // one sample of SIM time, load or no load
      let accD = 0, accT = 0;
      while ((G.simClock || 0) < end && performance.now() < wallStop) {
        // A MOVING TARGET. She runs the width of the arena, jumps at the walls,
        // and swings on the beat — which is what a boss's approach, range and
        // aim logic are all written against.
        tick++;
        player.cores = 5; player.iT = Math.max(player.iT, 0.2);   // never dies, never stalls the fight
        player.volts = 60;
        // AND NEITHER DOES IT. A player swinging every fourteen frames kills a
        // guardian well inside thirty seconds, after which everything measures
        // as standing still — which is how a thirty-second run reported 82%
        // idle for a boss a twenty-second run put at 17%. Held just above the
        // floor so the fight reaches its last phase and stays there.
        if (b.hp < b.hpMax * 0.12) b.hp = b.hpMax * 0.12;
        if (b.dead) break;
        // ...and the stagger is cleared, because a target that swings every
        // fourteen frames keeps a guardian stunned and what that measures is the
        // PLAYER'S stunlock, not the fight's authored pacing. It is also where
        // the run-to-run swing came from: the same boss read 15% on one pass and
        // 48% on the next depending on how the mashing lined up.
        b.stagT = 0; b.hurtT = 0;
        const el = (G.simClock || 0) - t0;
        if (el >= nextFlip) { dir = -dir; nextFlip += 0.75; }
        keys.ArrowRight = dir > 0 ? 1 : 0; keys.ArrowLeft = dir < 0 ? 1 : 0;
        const fireZ = el >= nextZ; if (fireZ) nextZ += 0.434;
        const fireX = el >= nextX; if (fireX) nextX += 0.234;
        keysP.KeyZ = fireZ ? 1 : 0; keys.KeyZ = keysP.KeyZ;
        keysP.KeyX = fireX ? 1 : 0; keys.KeyX = keysP.KeyX;
        await frame();
        const now = G.simClock || 0, dt = (now - last) * 1000; last = now;
        const st = b.st || 'idle';
        if (st !== prev) { if (order.indexOf(st) < 0) order.push(st); prev = st; }
        seen[st] = (seen[st] || 0) + dt;
        // measured from DISPLACEMENT, not from vx: half the roster hovers by
        // lerping its position straight, so its velocity fields read zero while
        // it crosses the arena. What matters is whether the gap is closing.
        //
        // ...AND ON A FIXED SIM-TIME GRID, not per frame. The inputs were moved
        // onto a clock for this reason and the MEASUREMENT was left on the
        // frame, so half the load sensitivity stayed: under the full suite the
        // frames are fewer and longer, a guardian that moves and stops inside
        // one sample averages under the 30px/s bar, and its motion is scored as
        // standing still. NULLFANG read 36% idle alone and 41% under load
        // against a 40% limit — the harness was reporting the machine.
        // Accumulating to a fixed 1/60s of SIM time makes every sample the same
        // size whatever the frame rate, with the remainder carried rather than
        // dropped. Measured against three other harnesses running alongside:
        // 41% before, 38% after, and the solo reading fell to 33% — the sampler
        // was inflating idle in both cases, just further under load.
        //
        // ONE SOURCE OF LOAD SENSITIVITY IS LEFT and it is worth naming rather
        // than implying it is gone: the inputs above are set once per FRAME, so
        // a slow frame holds a press across more sim steps and the fight this
        // samples is still not quite the same fight. Removing that means
        // driving update() directly instead of riding rAF, which is a bigger
        // change to a working harness than the flake justified.
        //
        // ...AND THAT CURE WAS TRIED, 2026-09-03, AND IT IS WORSE. Stepping
        // update(1/60) directly with performance.now and G.simClock driven
        // alongside it — the same treatment that fixed kingdom, openings, twin
        // and tinker — read NULLFANG at 48%, 38%, 40% on three runs against
        // this build, where riding rAF reads 33-37% across four. The reason is
        // paceK(): the loop's real step is min(raw, SIM_MAX) x paceK(), so a
        // fixed 1/60 is not the step the game takes and the fight it samples is
        // a fight the player never has. Do not re-try it without pacing the
        // step the way the main loop does. The remaining flake is real but it
        // is an INFLATION under load — every reading above the line has come
        // from a busy machine — so a failure here is worth re-running solo
        // before it is worth believing.
        accD += Math.hypot(b.x - lx, b.y - ly); accT += dt;
        lx = b.x; ly = b.y;
        while (accT >= SAMPLE_MS) {
          const sp = accD / (accT / 1000);
          if (sp > 30) moved[st] = (moved[st] || 0) + SAMPLE_MS;
          accD *= 1 - SAMPLE_MS / accT; accT -= SAMPLE_MS;
        }
      }
      Math.random = _mrand;
      keys.ArrowRight = keys.ArrowLeft = keys.KeyZ = keys.KeyX = 0;
      const total = Object.keys(seen).reduce((a, k) => a + seen[k], 0) || 1;
      const pct = {}, mpct = {};
      for (const k in seen) {
        pct[k] = Math.round(seen[k] / total * 1000) / 10;
        mpct[k] = Math.round((moved[k] || 0) / total * 1000) / 10;
      }
      return { pct: pct, mpct: mpct, order: order, hp: Math.round(b.hp) };
    }, { B, secs });
    if (r.err) { console.log('  ' + B.name + ': ' + r.err); continue; }

    let idle = 0, move = 0, wind = 0, hit = 0;
    let worst = null, worstV = 0;
    for (const k in r.pct) {
      const v = r.pct[k];
      const mv = r.mpct[k] || 0;
      if (IDLE.test(k)) { idle += v - mv; move += mv; }
      else if (MOVE.test(k)) move += v;
      else if (WIND.test(k)) wind += v; else hit += v;
      // only a STILL state can be "the busiest": a guardian that spends half
      // the fight stalking you is not the problem this measures
      const still = IDLE.test(k) ? v - mv : 0;
      if (still > worstV) { worstV = Math.round(still * 10) / 10; worst = k; }
    }
    rows.push({ name: B.name, idle: idle, move: move, wind: wind, hit: hit,
                worst: worst, worstV: worstV, n: r.order.length, pct: r.pct });
  }

  console.log('── bosspace  — how a guardian spends ' + secs + ' seconds against a player who MOVES\n');
  console.log('  boss             idle   move   wind    hit   states   busiest state');
  const bad = [];
  for (const r of rows) {
    const f = n => String(Math.round(n)).padStart(4) + '%';
    console.log('  ' + r.name.padEnd(15) + f(r.idle) + '  ' + f(r.move) + '  ' + f(r.wind) + '  ' + f(r.hit)
      + '     ' + String(r.n).padStart(2) + '   ' + r.worst + ' ' + r.worstV + '%');
    if (process.env.BOSSPACE_FULL) {
      const ks = Object.keys(r.pct).sort((a, b) => r.pct[b] - r.pct[a]);
      console.log('                   ' + ks.map(k => k + ' ' + r.pct[k] + '%').join('  '));
    }
    // THE FLAKE IS FIXED, AND THIS IS WHAT IT WAS. From 2026-08-15 this file
    // carried a note that NULLFANG failed about two runs in six at 40-43%
    // against a 40% line, at the same rate either side of unrelated changes,
    // and that the honest fixes were a seed or a lion that moves more — never
    // a looser threshold. Both halves of the seed are now in place above, and
    // the second half was the bigger one:
    //
    //   the RNG               every guardian's state choice runs through rnd()
    //   the ruler             the loop advances min(raw, SIM_MAX) x paceK()
    //                         seconds of world per frame, not the wall-clock
    //                         time the frame took, so weighting states by real
    //                         elapsed ms charged the fight for time it never
    //                         got — which is why the same build read one way
    //                         inside the full suite and another way alone
    //
    //   before   NULLFANG idle 31-43%, 2 failures / 6
    //   after    NULLFANG idle 35-36%, 0 failures / 6
    //
    // MOTHER-V is now the widest guardian on the second assertion below (its
    // still-idle read spans roughly 13-30% across six runs and touched 34.9%
    // once immediately after the change). If this file goes red again, that is
    // the one to check first — and the remaining source is the frame-size
    // variation inside update(), not anything the player's body does.
    // Threshold-raising is still not on the table.
    if (r.idle > 40) bad.push(r.name + ' stands still ' + Math.round(r.idle) + '%');
    if (r.worstV > 34) bad.push(r.name + ' spends ' + r.worstV + '% still in one state (' + r.worst + ')');
  }
  if (errs.length) console.log('\n  PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  if (bad.length) { console.log('\nFAILED — ' + bad.join('; ')); process.exit(1); }
  console.log('\nOK — every guardian keeps the pressure on');
})().catch(e => { console.error(e); process.exit(1); });
