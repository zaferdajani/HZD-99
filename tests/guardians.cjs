// THE GUARDIAN TEMPLATE, MEASURED (2026-10-08, the Hollow Knight study, plan §3).
//
// Three promises every guardian now makes, and each one is a number here
// rather than a sentence in docs/combat/BOSS_*.md:
//
//   1. EVERY ATTACK HAS A PUNISH WINDOW AFTER IT. After each move releases,
//      count the frames in which the guardian is not winding up or striking
//      AND its hurtbox sits in the band a grounded strike reaches (her forward
//      swing: 54 px above her feet down to her feet). A window that needs a
//      jump is not counted — that is exactly the complaint about GLACIERE
//      that started this pass. >= 250 ms is one hit (boss-openings §1).
//   2. A GROUP OF HITS BREAKS IT. dazeAt hits inside the guardian's own span
//      put it in `daze`: on the floor, for 1.2-2.0 s, taking more damage; the
//      same hits spaced wider than the span do not; and it cannot be broken
//      again the moment it gets up.
//   3. WHERE YOU STAND CHANGES WHAT IT DOES. The moves it draws with the
//      player beside it and the moves it draws with her across the room are
//      different decks — measured as distributions, not read off the weights.
//
// The dice are seeded per scenario and update() is stepped at a fixed 1/60,
// the same discipline as tests/openings.cjs, so a run is the same run on every
// machine. The scripted player cannot be hurt (iT), so the measurement is of
// the guardian's choices and not of a player knocked across the room.
//
//   node tests/guardians.cjs
const { chromium } = require('playwright');

// release: the state whose EXIT lets the move go — the window is counted from
//          there. tell: wind-ups (a window ends when one begins). hit: states
//          that strike with the body. pick: wind-ups the deck draws from idle,
//          and the move each one names.
const FIGHTS_ALL = [
  // TALONHOST hangs off the player's shoulder wherever she goes, so its range
  // is how far she is from the middle of the arena — where its fan falls
  { name: 'TALONHOST', kind: 'brood', room: 'B4', metric: 'mid',
    release: { volley: 'volley', swoop: 'swoop', broodcall: 'broodcall' },
    tell: ['volley', 'swoopwarn', 'broodcall'], hit: ['swoop', 'cfcrash'],
    pick: { volley: 'volley', swoopwarn: 'swoop', rest: 'rest' }, decide: ['idle'] },
  { name: 'FURNACE CHOIR', kind: 'atlas', room: 'C3',
    release: { slamwarn: 'slam', lobwarn: 'lob', forgebell: 'forgebell', hymn: 'hymn' },
    tell: ['slamwarn', 'lobwarn', 'forgebell', 'hymn', 'meltwarn'], hit: [],
    pick: { slamwarn: 'slam', lobwarn: 'lob', hymn: 'hymn' }, decide: ['idle'] },
  { name: 'GLACIERE', kind: 'zero', room: 'D3', minHold: 600,
    release: { lancewarn: 'lance', shardwarn: 'shard', dash: 'dash', prisonwarn: 'prison',
               orbs: 'orbs', novawarn: 'nova', azhush: 'hush', dccast: 'corrupt' },
    tell: ['lancewarn', 'shardwarn', 'dashwarn', 'prisonwarn', 'orbs', 'novawarn', 'azhush', 'dccast'],
    hit: ['dash'],
    pick: { lancewarn: 'lance', shardwarn: 'shard', dashwarn: 'dash', orbs: 'orbs', prisonwarn: 'prison' },
    decide: ['idle'] },
  { name: 'PRISM PROWLER', kind: 'prism', room: 'X1',
    release: { dashslash: 'dash', pounce: 'pounce', spreadwarn: 'spread' },
    tell: ['dashwarn', 'pouncewarn', 'spreadwarn', 'lsvanish', 'arcspin'], hit: ['dashslash', 'pounce', 'arcstorm'],
    pick: { dashwarn: 'dash', pouncewarn: 'pounce', spreadwarn: 'spread' }, decide: ['idle'] },
  { name: 'MOTHER-V', kind: 'mother', room: 'E3',
    release: { ringcharge: 'ring', beamwarn: 'beam', grab: 'grab', nwcharge: 'wave' },
    tell: ['nwcharge', 'ringcharge', 'grabwarn', 'beamwarn', 'msong'], hit: ['grab'],
    pick: { nwcharge: 'wave', ringcharge: 'ring', grabwarn: 'grab', beamwarn: 'beam' }, decide: ['idle'] },
];

// GUARDIANS=zero,brood narrows the run while a fight is being tuned
const FIGHTS = process.env.GUARDIANS
  ? FIGHTS_ALL.filter(F => process.env.GUARDIANS.split(',').includes(F.kind)) : FIGHTS_ALL;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── guardians — every attack opens, a group of hits breaks it, and range changes the deck');

  // one driven fight: the player is pinned `dist` px from the guardian (on the
  // side with room), re-pinned every `every` s; returns the per-move windows
  // and the deck draws, each tagged with the band it was drawn in
  const fight = (F, dist, phase, secs, every, seedTag) => page.evaluate(async ({ F, dist, phase, secs, every, seedTag }) => {
    const realRand = Math.random, realNow = performance.now;
    let clk = realNow.call(performance);
    performance.now = () => clk;
    let sd = 0; const tag = F.kind + '|' + dist + '|' + phase + '|' + seedTag;
    for (let q = 0; q < tag.length; q++) sd = (sd * 131 + tag.charCodeAt(q)) >>> 0;
    sd = (sd + 0x9e3779b9) >>> 0;
    Math.random = () => {
      sd = (sd + 0x6d2b79f5) >>> 0;
      let x = sd;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    try {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
      startGame(sv); loadRoom(F.room);
      G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.cut = null;
      const b = G.boss;
      if (!b) return { err: 'no boss in ' + F.room };
      b.dead = false; b.hp = b.hpMax; b.dazeAt = 0;          // the break is measured on its own below
      if (phase === 2) { b.phase = 2; b.hp = Math.floor(b.hpMax * 0.45); }
      // the way the fight really starts: the wake hands over (FURNACE CHOIR
      // glides down off his roost in it — skipping it measured him perched)
      b.st = 'intro'; b.t = 2.0; b.stagT = 0;
      for (let i = 0; i < 200 && b.st === 'intro'; i++) { clk += 1000 / 60; update(1 / 60); }
      const DT = 1 / 60, N = Math.round(secs / DT), REP = Math.round(every / DT);
      const W = G.roomDef.w * TILE, floor = (G.roomDef.h - 2) * TILE;
      const TELL = new Set(F.tell), HIT = new Set(F.hit);
      const frames = [];
      for (let i = 0; i < N; i++) {
        if (i % REP === 0) {
          let side = b.cx() < W / 2 ? 1 : -1;
          if (b.cx() + side * dist < 40 || b.cx() + side * dist > W - 40) side = -side;
          if (F.metric === 'mid') side = (Math.floor(i / REP) % 2) ? 1 : -1;
          const anchor = F.metric === 'mid' ? W / 2 : b.cx();
          let gx = Math.max(24, Math.min(W - 24 - player.w, anchor + side * dist - player.w / 2));
          // she stands on the arena FLOOR: a spot on a mound or a ramp (C3's
          // terrain curve climbs 120 px toward the roost) slides back toward
          // the guardian until the ground under her is the floor — otherwise
          // the measurement is of a player standing on a hill
          for (let k = 0; k < 60; k++) {
            const gc = groundColumnAt(gx + player.w / 2);
            // (only material ON the floor counts: under a ledge the curve
            // reports the ledge, and she stands on the floor beneath it)
            if (!gc || gc[1] < floor - 1 || gc[0] >= floor - 12) break;
            gx += (b.cx() > gx ? 1 : -1) * 16;
          }
          window.__gx = gx;
        }
        player.x = window.__gx; player.y = floor - player.h; player.on = true;
        player.vx = 0; player.vy = 0; player.iT = 9; player.dead = false; player.hp = player.hpMax || 7;
        player.stagT = 0; player.slowT = 0;
        if (b.hp < b.hpMax * 0.15) b.hp = Math.floor(b.hpMax * 0.45);
        G.dialog = null; G.state = 'PLAY';
        clk += DT * 1000;
        update(DT);
        const hb = hurtBoxOf(b), feet = player.y + player.h;
        // the band a grounded strike reaches: her forward swing tops out 54 px
        // above her feet; anything that dips into [feet-54, feet] is in reach.
        // Measured from where she stands AND from the ground under the
        // guardian — a walker that has climbed C3's ramp toward the roost is
        // 70 px over her spot, and she reaches it by walking up the same ramp
        // (horizontal distance is her choice; height is not)
        let g2 = floor; const gc = groundColumnAt(b.cx());
        if (gc && gc[1] >= floor - 1 && gc[0] < floor && gc[0] > floor - 140) g2 = gc[0];
        const inBand = f => hb.y + hb.h >= f - 54 && hb.y <= f;
        const reach = inBand(feet) || inBand(g2);
        const pcx = player.x + player.w / 2;
        frames.push({ st: b.st, reach, adx: Math.abs((F.metric === 'mid' ? W / 2 : b.cx()) - pcx) });
      }
      // windows: from each release, until the next tell or strike begins
      const out = {}, picks = [];
      for (let j = 1; j < frames.length; j++) {
        const a = frames[j - 1], c = frames[j];
        if (a.st === c.st) continue;
        if (F.decide.includes(a.st) && F.pick[c.st]) picks.push({ mv: F.pick[c.st], adx: c.adx });
        const mv = F.release[a.st];
        if (!mv || c.st === 'daze') continue;
        if (TELL.has(c.st) || HIT.has(c.st)) {       // a chain: this link opens nothing by design
          (out[mv] = out[mv] || { win: [], chain: 0 }).chain++;
          continue;
        }
        let k = j, open = 0;
        while (k < frames.length && !TELL.has(frames[k].st) && !HIT.has(frames[k].st)) {
          if (frames[k].reach) open++;
          k++;
        }
        if (k >= frames.length) continue;              // the run ended mid-window: not a measurement
        (out[mv] = out[mv] || { win: [], chain: 0 }).win.push(Math.round(open * DT * 1000));
      }
      return { out, picks };
    } finally { Math.random = realRand; performance.now = realNow; }
  }, { F, dist, phase, secs, every, seedTag });

  for (const F of FIGHTS) {
    console.log('  ── ' + F.name);
    // ---- 1. every attack opens ------------------------------------------
    const all = {}, near = {}, far = {};
    let nNear = 0, nFar = 0;
    for (const phase of [1, 2]) for (const [dist, every, bucket] of [[110, 0.4, near], [300, 2.5, null], [520, 0.4, far]]) {
      const got = await fight(F, dist, phase, 75, every, 'w');
      if (got.err) { check(F.name + ' boots', false, got.err); continue; }
      for (const k in got.out) {
        const o = all[k] || (all[k] = { win: [], chain: 0 });
        o.win.push(...got.out[k].win); o.chain += got.out[k].chain;
      }
      for (const p of got.picks) {
        const band = p.adx < 200 ? near : p.adx > 380 ? far : null;
        if (!band) continue;
        band[p.mv] = (band[p.mv] || 0) + 1;
        if (band === near) nNear++; else nFar++;
      }
    }
    const floorMs = F.minHold || 250;
    for (const k of Object.keys(all).sort()) {
      const v = all[k].win.slice().sort((a, b) => a - b);
      if (!v.length) { console.log('       ' + k.padEnd(10) + ' chained every time (' + all[k].chain + ')'); continue; }
      const med = v[Math.floor(v.length / 2)];
      console.log('       ' + k.padEnd(10) + ' n=' + String(v.length).padStart(3) + '  min ' + String(v[0]).padStart(5)
        + '  med ' + String(med).padStart(5) + '  max ' + String(v[v.length - 1]).padStart(5)
        + (all[k].chain ? '   (+' + all[k].chain + ' chained on)' : ''));
      check(F.name + ': ' + k + ' opens a reachable window (>= ' + floorMs + ' ms)', v[0] >= floorMs,
        'worst ' + v[0] + ' ms (med ' + med + ')');
    }
    // ---- 3. range changes the deck ---------------------------------------
    const moves = Array.from(new Set(Object.keys(near).concat(Object.keys(far)))).sort();
    const pn = m => (near[m] || 0) / Math.max(1, nNear), pf = m => (far[m] || 0) / Math.max(1, nFar);
    const tv = moves.reduce((a, m) => a + Math.abs(pn(m) - pf(m)), 0) / 2;
    console.log('       near (n=' + nNear + '): ' + moves.map(m => m + ' ' + Math.round(pn(m) * 100) + '%').join('  '));
    console.log('       far  (n=' + nFar + '): ' + moves.map(m => m + ' ' + Math.round(pf(m) * 100) + '%').join('  '));
    check(F.name + ': the deck it draws close is not the deck it draws far (total variation >= 0.25)',
      nNear >= 6 && nFar >= 6 && tv >= 0.25, 'TV ' + tv.toFixed(2) + ' over ' + nNear + '/' + nFar + ' draws');
    check(F.name + ': and neither band is one move on repeat', moves.filter(m => pn(m) > 0).length >= 2
      && moves.filter(m => pf(m) > 0).length >= 2, 'near ' + moves.filter(m => pn(m) > 0).join(',') + ' / far ' + moves.filter(m => pf(m) > 0).join(','));

    // ---- 2. a group of hits breaks it ------------------------------------
    const br = await page.evaluate(({ F }) => {
      const boot = () => {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
        sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
        startGame(sv); loadRoom(F.room);
        G.dialog = null; G.state = 'PLAY'; G.cut = null;
        const b = G.boss; b.dead = false; b.hp = b.hpMax; b.stagT = 0;
        player.iT = 99; player.x = 40; player.y = (G.roomDef.h - 2) * TILE - player.h;
        b.st = 'intro'; b.t = 2.0;
        for (let i = 0; i < 200 && b.st === 'intro'; i++) { player.iT = 99; b.update(1 / 60); }
        b.st = 'idle'; b.t = 5;
        return b;
      };
      const DT = 1 / 60, floorY = (G.roomDef.h - 2) * TILE;
      const step = (b, s) => { for (let i = 0; i < Math.round(s / DT); i++) { player.iT = 99; b.t = Math.max(b.t, b.st === 'idle' ? 1 : -1); if (b.st !== 'daze') b.hp = b.hpMax; b.update(DT); } };
      // grouped: dazeAt hits, a third of a second apart (a combo's pace)
      let b = boot();
      const at = b.dazeAt, span = b.dazeSpan || DAZE_WINDOW;
      for (let i = 0; i < at; i++) { dealDmg(b, 1, null, b.cx(), b.cy(), true); step(b, 0.3); if (b.st === 'daze') break; }
      let waited = 0;
      while (b.st !== 'daze' && waited < 3) { step(b, 0.1); waited += 0.1; }
      const grouped = b.st === 'daze';
      // how long, where its feet are, what a hit is worth while it lasts
      let dur = 0, minFeetGap = 1e9, tookMore = false;
      if (grouped) {
        const before = (() => { const st = b.st; b.st = 'idle'; const d = dealDmg(b, 20, null, b.cx(), b.cy(), true); b.st = st; return d; })();
        b.dazeHits = 0;
        while (b.st === 'daze' && dur < 4) {
          step(b, DT); dur += DT;
          if (dur > 0.6) {
            // the ground under it: the tile floor, or the terrain curve where
            // it carries real material above it (the same rule bodies stand on)
            let gy = floorY; const gc = groundColumnAt(b.cx());
            if (gc && gc[1] >= gy - 1 && gc[0] < gy && gc[0] > gy - 60) gy = gc[0];
            minFeetGap = Math.min(minFeetGap, Math.abs(gy - (b.y + b.h)));
          }
          if (Math.abs(dur - 0.8) < DT / 2) tookMore = dealDmg(b, 20, null, b.cx(), b.cy(), true) > before;
        }
      }
      const after = b.st;
      // ...and it cannot be broken again the moment it gets up
      for (let i = 0; i < at; i++) { dealDmg(b, 1, null, b.cx(), b.cy(), true); step(b, 0.2); }
      const relock = b.st === 'daze';
      // spaced: the same number of hits, each further apart than the span
      b = boot();
      let spacedBroke = false;
      for (let i = 0; i < at; i++) {
        dealDmg(b, 1, null, b.cx(), b.cy(), true);
        step(b, span + 0.4);
        if (b.st === 'daze') { spacedBroke = true; break; }
        b.st = 'idle'; b.t = 5;
      }
      return { at, span, grouped, dur: +dur.toFixed(2), feet: Math.round(minFeetGap), tookMore, after, relock, spacedBroke };
    }, { F });
    check(F.name + ': ' + br.at + ' grouped hits break it', br.grouped, 'span ' + br.span + ' s');
    if (br.grouped) {
      check(F.name + ': the break is a real window (1.2-2.0 s)', br.dur >= 1.2 && br.dur <= 2.05, br.dur + ' s');
      check(F.name + ': grounded while broken (feet within 6 px of the floor)', br.feet <= 6, br.feet + ' px');
      check(F.name + ': the open window pays more damage', br.tookMore);
      check(F.name + ': it gets up rather than sticking', br.after !== 'daze', 'st=' + br.after);
      check(F.name + ': and cannot be broken again at once', !br.relock);
    }
    check(F.name + ': the same hits spaced wider than the span do not break it', !br.spacedBroke);
  }

  // ---- GLACIERE, every power by hand ------------------------------------
  // The driven fight above only meets the powers the dice choose; the plan's
  // promise is "a recovery after EVERY attack", so each one is forced here and
  // followed until she is back on her station.
  console.log('  ── GLACIERE, power by power');
  const glc = !FIGHTS.some(F => F.kind === 'zero') ? [] : await page.evaluate(() => {
    const res = [];
    const DT = 1 / 60;
    for (const phase of [1, 2]) for (const [st, t] of [['lancewarn', 0.7], ['shardwarn', 0.5], ['dashwarn', 0.55],
      ['prisonwarn', 0.5], ['orbs', 1.0], ['novawarn', 0.6], ['azhush', 1.1], ['dccast', 0.9]]) {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom('D3');
      G.dialog = null; G.state = 'PLAY';
      const b = G.boss; b.dead = false; b.hp = b.hpMax; b.dazeAt = 0; b.stagT = 0;
      if (phase === 2) { b.phase = 2; b.hp = Math.floor(b.hpMax * 0.45); b.dcUsed = true; }
      const floor = (G.roomDef.h - 2) * TILE;
      // a player across the room, so the far chain shows up in phase two
      player.x = 60; player.y = floor - player.h; player.on = true;
      b.x = 700; b.y = 200; b.st = st; b.t = t; b.vx = 0; b.vy = 0;
      if (st === 'prisonwarn') b.prisonAim = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
      const path = [st]; let held = 0, best = 0, f = 0;
      while (f++ < 60 * 8) {
        player.x = 60; player.y = floor - player.h; player.on = true; player.iT = 9; player.vx = 0; player.vy = 0;
        b.update(DT);
        if (path[path.length - 1] !== b.st) { path.push(b.st); held = 0; }
        if (b.st === 'recover') {
          const hb = hurtBoxOf(b), feet = player.y + player.h;
          if (hb.y + hb.h >= feet - 54 && hb.y <= feet && Math.abs(b.vx) + Math.abs(b.vy) < 120) { held++; best = Math.max(best, held); }
          else held = 0;
        }
        if (b.st === 'idle') break;
      }
      res.push({ phase, st, path: path.join('>'), held: Math.round(best * DT * 1000) });
    }
    return res;
  });
  for (const r of glc) {
    console.log('       p' + r.phase + ' ' + r.st.padEnd(11) + r.path + '   held ' + r.held + ' ms');
    check('GLACIERE p' + r.phase + ': ' + r.st + ' ends in a recovery she holds at hitting height (>= 600 ms)',
      /recover>idle$/.test(r.path) && r.held >= 600, r.held + ' ms');
  }

  // ---- NULLFANG's landing --------------------------------------------------
  // The openings harness caught a pounce>recover of 0 ms: the leap led to a
  // player standing at the foot of A4's hulk, and the body came down ON the
  // hulk, 70 px over her, for the whole settle. Then, with the landing slid
  // clear, a second seed caught 67 ms: a leap that went straight up and came
  // down where it left read as 2.6 s of "no movement" to the anti-wedge
  // watchdog, which wrenched a pounce out of the window. Both, by hand:
  console.log('  ── NULLFANG, the landing');
  const nf = await page.evaluate(() => {
    const run = (bx, pxv) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom('A4');
      G.dialog = null; G.state = 'PLAY';
      const b = G.boss, floor = (G.roomDef.h - 2) * TILE;
      b.dead = false; b.hp = b.hpMax; b.dazeAt = 0; b.stagT = 0;
      b.x = bx - b.w / 2; b.y = floor - b.h; b.vx = 0; b.vy = 0;
      // a full coil, after a second of prowling into a wall: 0.9 + 1.0 + the
      // leap is the 2.6 s the watchdog used to read as a wedge
      b.st = 'crouch'; b.t = 1.0; b.wdX = b.x; b.wdY = b.y; b.wdT = 0.9;
      const path = ['crouch']; let rec = 0, feet = null;
      for (let f = 0; f < 60 * 5; f++) {
        player.x = pxv - player.w / 2; player.y = floor - player.h; player.on = true;
        player.vx = 0; player.vy = 0; player.iT = 9;
        b.update(1 / 60);
        if (path[path.length - 1] !== b.st) path.push(b.st);
        if (b.st === 'recover') { rec++; feet = b.y + b.h; }
        if (path.length > 1 && b.st !== 'pounce' && b.st !== 'recover') break;
      }
      return { path: path.join('>'), recMs: Math.round(rec / 60 * 1000), lift: feet == null ? null : Math.round(floor - feet) };
    };
    // the hulk spans tiles 36-42 (x 1152-1376); she "stands" at its foot
    return { hulk: run(900, 1200), straight: run(600, 600) };
  });
  console.log('       at the hulk: ' + nf.hulk.path + '  lands ' + nf.hulk.lift + ' px over her floor, settle ' + nf.hulk.recMs + ' ms');
  console.log('       straight up: ' + nf.straight.path + '  settle ' + nf.straight.recMs + ' ms');
  check('NULLFANG: a leap at a player beside the hulk lands on her floor, not on the hulk (<= 20 px)',
    nf.hulk.lift != null && nf.hulk.lift <= 20, nf.hulk.lift + ' px');
  check('NULLFANG: a leap straight up settles in full — the watchdog does not take it (>= 250 ms, then idle)',
    nf.straight.recMs >= 250 && nf.straight.path === 'crouch>pounce>recover>idle', nf.straight.path + ' ' + nf.straight.recMs + ' ms');

  // ---- 4. the reward chain ----------------------------------------------
  // Each guardian pays the key to the NEXT one's plating (the Mega Man X loop
  // in docs/combat), and GLACIERE's Kernel Key is the seal over the Nest.
  const chain = await page.evaluate(() => ({
    arms: ARM_BY_BOSS, gate: BOSS_GATE,
    zeroSeal: (() => { const e = ROOMS.D3.exits.B; return e && e.flag; })(),
  }));
  for (const [from, to] of [['glitch', 'brood'], ['brood', 'atlas'], ['atlas', 'zero'], ['zero', 'prism'], ['prism', 'mother']])
    check('reward: ' + from + "'s arm shorts " + to + "'s plating", chain.arms[from] && chain.arms[from] === chain.gate[to],
      chain.arms[from] + ' vs ' + chain.gate[to]);
  check("reward: GLACIERE's fall opens the way down into the Nest", chain.zeroSeal === 'bossZero', String(chain.zeroSeal));

  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — every guardian opens after every move, breaks on a group, and reads the room');
})().catch(e => { console.error(e); process.exit(1); });
