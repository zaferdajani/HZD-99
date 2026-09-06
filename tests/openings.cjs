// THE OPENING, MEASURED — for the two zone-A fights against the ladder in
// .claude/skills/boss-openings/SKILL.md.
//
// An opening is a span in which the boss cannot hurt her AND she can reach it.
// The doctrine's numbers: under 250 ms fits nothing, 250-500 is the minimal
// default, 500-900 is generous, over 900 is a gift the fight may hand out once,
// tied to its hardest bait. Reading those off the timers in the source is how
// the swipe was believed to be "minimal" while its cooldown handed out two
// seconds; so this drives the real state machine against a scripted player and
// counts frames.
//
// Frames are sorted into three kinds by the boss's state: HURT (it can land a
// blow this frame), TELL (a wind-up: it is announcing), OPEN (everything else).
// Every run of OPEN frames that follows a HURT state, up to the next TELL, is
// one opening, attributed to the move that just ended — and only the frames in
// which she could actually reach the body are counted, so a recovery spent on a
// perch she cannot climb to is not an opening.
//
//   node tests/openings.cjs
const { chromium } = require('playwright');

const FIGHTS = [
  { name: 'NULLFANG', room: 'A4', boss: () => G.boss,
    hurt: ['swipe', 'pounce', 'dive'],
    // the roar cannot hurt her (it shoves and summons), so it is OPEN time
    tell: ['swipewarn', 'crouch', 'springwarn', 'nullcharge', 'perch', 'nullhop'],
    // a move whose opening is allowed past 900: the once-per-fight set piece
    gift: ['pounce>nullend'],
    // what she stands at, per scenario, and the phase
    // stand: she holds one spot in its face. move: she relocates 320 px away
    // every 3.5 s, which is what gives the prowl the time its ambush needs
    runs: [{ dist: 70, phase: 1, secs: 70 }, { dist: 320, phase: 1, secs: 90, move: 3.5 },
           { dist: 70, phase: 2, secs: 70 }, { dist: 320, phase: 2, secs: 90, move: 3.5 }] },
  { name: 'THE ALPHA', room: 'A10', boss: () => G.boss,
    hurt: ['claw', 'bite', 'leap', 'roar'],   // shake only follows a landed bite
    tell: ['clawwarn', 'bitewarn', 'coil', 'broodcall', 'roarwarn', 'howl', 'clinch'],
    gift: ['leap>turn'],
    runs: [{ dist: 60, phase: 1, secs: 70 }, { dist: 200, phase: 1, secs: 70 },
           { dist: 420, phase: 1, secs: 70 }] },
];

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
  console.log('── openings — every move opens for at least one hit, and only the bait pays out three');

  for (const F of FIGHTS) {
    console.log('  ── ' + F.name);
    const all = {};                                   // move -> [ms...]
    for (const R of F.runs) {
      const got = await page.evaluate(async ({ F, R }) => {
        // THE DICE ARE SEEDED AND THE CLOCK IS DRIVEN, so a run is the same run
        // on every machine.
        //
        // This loop steps a fixed DT and therefore LOOKS deterministic, and it
        // is not: a guardian picks its next move off Math.random, so seventy
        // seconds of it is a different seventy seconds every time — which is
        // why pounce>recover came back n=27 med 800 on one run and carried a
        // single 0 ms sample on the next, on an unchanged build, and failed the
        // fight on it. A 0 was read as a dropped frame and answered with a
        // percentile; the real cause was the fight taking a different path.
        //
        // Seeded, not frozen: a constant makes a state machine that never
        // advances, and the answer becomes one move. The seed is per SCENARIO
        // (fight, distance, phase) so the four runs still walk four different
        // streams and coverage is unchanged — it is only repeatable now.
        //
        // performance.now is driven alongside it because these bodies breathe
        // and blink on the wall clock, and under a loaded machine seventy
        // simulated seconds can pass inside two real ones.
        const realRand = Math.random, realNow = performance.now;
        let clk = realNow.call(performance);
        performance.now = () => clk;
        let sd = 0; const tag = F.name + '|' + R.dist + '|' + R.phase + '|' + R.secs;
        for (let q = 0; q < tag.length; q++) sd = (sd * 131 + tag.charCodeAt(q)) >>> 0;
        sd = (sd + 0x9e3779b9) >>> 0;
        Math.random = () => {                       // mulberry32
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
        const b = (new Function('return ' + F.boss))()();
        if (!b) return { err: 'no boss in ' + F.room };
        b.dead = false; b.hp = b.hpMax;
        if (R.phase === 2) { b.phase = 2; b.hp = Math.floor(b.hpMax * 0.4); b.nullUsed = true; }
        b.st = 'idle'; b.t = 0.3;                    // the way the intro hands over
        if (b.kind === 'alpha') { b.st = 'rest'; b.t = 0.3; }
        const DT = 1 / 60, N = Math.round(R.secs / DT);
        const HURT = new Set(F.hurt), TELL = new Set(F.tell);
        const REACH = 150;
        const frames = [];
        for (let i = 0; i < N; i++) {
          // THE SCRIPTED PLAYER: she stands at the asked distance, on the floor,
          // and cannot be hurt — the miss branches are the ones with openings
          // in them, and a knocked-down player measures the knockdown instead.
          // SHE STANDS HER GROUND at a fixed spot: a player who keeps a fixed
          // distance from a stalker is kiting it round the room, and that
          // measured as a boss that never reached its own moves. The spot is
          // chosen once, on the side of the boss with the room for it.
          const W = G.roomDef.w * TILE;
          let moved = false;
          if (i === 0 || (R.move && i % Math.round(R.move / DT) === 0)) {
            moved = i > 0;
            let side = b.face > 0 ? 1 : -1;
            if (b.cx() + side * R.dist < 40 || b.cx() + side * R.dist > W - 40) side = -side;
            window.__gx = Math.max(24, Math.min(W - 24 - player.w, b.cx() + side * R.dist - player.w / 2));
          }
          player.x = window.__gx;
          player.y = G.roomDef.h * TILE - 2 * TILE - player.h;
          player.vx = 0; player.vy = 0; player.iT = 9; player.dead = false; player.hp = player.hpMax || 7;
          player.stunT = 0;
          G.dialog = null; G.state = 'PLAY';
          clk += DT * 1000;                          // one step of wall clock per step of sim
          update(DT);
          // REACHABLE means the body is on her floor: a perch or the air is
          // not. Horizontal distance is HER choice (a claw thrown at a player
          // standing 400 px away is a whiff she chose), so it is not counted
          // against the boss
          const dy = Math.abs((b.y + b.h) - (player.y + player.h));
          const dx = Math.abs(b.cx() - (player.x + player.w / 2));
          const AIR = b.st === 'pounce' || b.st === 'spring' || b.st === 'dive' || b.st === 'perch' || b.st === 'leap' || b.st === 'recoil';
          frames.push({ st: b.st, reach: !AIR && dy <= 60, dx: Math.round(dx), moved });
        }
        // sort the frames and cut the openings
        const kind = s => HURT.has(s) ? 'H' : TELL.has(s) ? 'T' : 'O';
        const out = {}, trace = {}, tellDx = {};
        for (let j = 1; j < frames.length; j++)
          if (kind(frames[j].st) === 'T' && frames[j].st !== frames[j - 1].st)
            (tellDx[frames[j].st] = tellDx[frames[j].st] || []).push(frames[j].dx);
        let i = 0;
        while (i < frames.length) {
          if (kind(frames[i].st) !== 'H') { i++; continue; }
          const move = frames[i].st;
          while (i < frames.length && kind(frames[i].st) === 'H' && frames[i].st === move) i++;
          // the state it went to next names the branch (pounce>recover vs pounce>nullend)
          const next = i < frames.length ? frames[i].st : '?';
          let open = 0, total = 0, voided = false; const runs = [];
          while (i < frames.length && kind(frames[i].st) === 'O') {
            total++; if (frames[i].reach) open++;
            if (frames[i].moved) voided = true;          // she left mid-opening: her choice, not a measurement
            const last = runs[runs.length - 1];
            if (last && last[0] === frames[i].st) last[1]++; else runs.push([frames[i].st, 1]);
            i++;
          }
          if (i >= frames.length) break;                       // the run ended mid-opening: not a measurement
          if (voided) continue;
          const label = move + '>' + next;
          (out[label] = out[label] || []).push(Math.round(open * DT * 1000));
          if ((trace[label] = trace[label] || []).length < 2)
            trace[label].push(runs.map(r => r[0] + ' ' + Math.round(r[1] * DT * 1000)).join(', ') + ' -> ' + frames[i].st + '  (reach ' + open + '/' + total + ')');
        }
        const share = {};
        for (const f of frames) share[f.st] = (share[f.st] || 0) + 1;
        for (const k in share) share[k] = +(share[k] / frames.length * 100).toFixed(0);
        return { out, share, trace, tellDx: Object.fromEntries(Object.entries(tellDx).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)])) };
        } finally { Math.random = realRand; performance.now = realNow; }
      }, { F: { ...F, boss: F.boss.toString() }, R });
      if (got.err) { check(F.name + ' boots', false, got.err); continue; }
      console.log('       @' + R.dist + 'px p' + R.phase + '  ' + Object.entries(got.share).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v + '%').join('  '));
      console.log('         tells began at (px): ' + Object.entries(got.tellDx).map(([k, v]) => k + ' ' + v).join('  '));
      for (const k in got.trace) for (const t of got.trace[k]) console.log('         ' + k + ': ' + t);
      for (const k in got.out) (all[k] = all[k] || []).push(...got.out[k]);
    }
    const rows = Object.keys(all).sort();
    for (const k of rows) {
      const v = all[k].slice().sort((a, b) => a - b);
      const med = v[Math.floor(v.length / 2)], p75 = v[Math.floor(v.length * 0.75)];
      // THE FLOOR IS THE WORST SINGLE SAMPLE AGAIN.
      //
      // It was a tenth percentile for a while, to survive a pounce>recover that
      // came back n=27 med 800 with one 0 in it on an unchanged build. That
      // reading was blamed on a frame the browser never delivered, and the
      // percentile was a way of discarding it. The diagnosis was wrong: this
      // loop drops no frames, it steps them. The 0 was the fight taking a
      // DIFFERENT PATH, because the dice were not seeded — see the block at the
      // top of the run. They are now, and three consecutive runs under a full
      // suite return byte-identical tables with a worst sample of 350 ms.
      //
      // So the floor can be honest again, which matters: a percentile forgives
      // one move in ten being unpunishable, and one move in ten is exactly the
      // move a player will meet.
      const p10 = v[0];
      const move = k.split('>')[0];
      const isGift = F.gift.includes(k);
      // a chain's middle (swipe>swipewarn) opens nothing by design; the chain's
      // END must open, and that end is a different row of this table
      const chain = k.endsWith('warn') && k.startsWith(move) && v.every(x => x < 100);
      console.log('       ' + k.padEnd(20) + ' n=' + String(v.length).padStart(2)
        + '  min ' + String(v[0]).padStart(5) + '  med ' + String(med).padStart(5) + '  max ' + String(v[v.length - 1]).padStart(5)
        + (isGift ? '   (the gift)' : chain ? '   (chain middle)' : ''));
      if (chain) continue;
      check(F.name + ': ' + k + ' opens for at least one hit (>= 250 ms)', p10 >= 250,
            'worst ' + p10 + ' ms (med ' + med + ')');
      if (!isGift) check(F.name + ': ' + k + ' is not a gift (3 in 4 openings <= 900 ms)', p75 <= 900, 'p75 ' + p75 + ' ms');
      else check(F.name + ': ' + k + ' is the one gift, and pays out (> 900 ms)', med > 900, med + ' ms');
    }
    check(F.name + ': every damaging move was seen', F.hurt.every(h => rows.some(r => r.startsWith(h + '>'))),
      F.hurt.filter(h => !rows.some(r => r.startsWith(h + '>'))).join(',') || 'all');
  }
  check('no page errors', errs.length === 0, errs.join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — every move opens, and the fight hands out its gift exactly where it means to');
})();
