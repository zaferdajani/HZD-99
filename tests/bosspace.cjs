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
      const seen = {}, moved = {}, order = [];
      let last = performance.now(), attacks = 0, prev = null;
      const end = performance.now() + secs * 1000;
      let dir = 1, tick = 0, lx = b.x, ly = b.y;
      while (performance.now() < end) {
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
        if (tick % 45 === 0) dir = -dir;
        keys.ArrowRight = dir > 0 ? 1 : 0; keys.ArrowLeft = dir < 0 ? 1 : 0;
        keysP.KeyZ = tick % 26 === 0 ? 1 : 0; keys.KeyZ = keysP.KeyZ;
        keysP.KeyX = tick % 14 === 0 ? 1 : 0; keys.KeyX = keysP.KeyX;
        await frame();
        const now = performance.now(), dt = now - last; last = now;
        const st = b.st || 'idle';
        if (st !== prev) { if (order.indexOf(st) < 0) order.push(st); prev = st; }
        seen[st] = (seen[st] || 0) + dt;
        // measured from DISPLACEMENT, not from vx: half the roster hovers by
        // lerping its position straight, so its velocity fields read zero while
        // it crosses the arena. What matters is whether the gap is closing.
        const sp = Math.hypot(b.x - lx, b.y - ly) / Math.max(0.001, dt / 1000);
        lx = b.x; ly = b.y;
        if (sp > 30) moved[st] = (moved[st] || 0) + dt;
      }
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
    if (r.idle > 40) bad.push(r.name + ' stands still ' + Math.round(r.idle) + '%');
    if (r.worstV > 34) bad.push(r.name + ' spends ' + r.worstV + '% still in one state (' + r.worst + ')');
  }
  if (errs.length) console.log('\n  PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  if (bad.length) { console.log('\nFAILED — ' + bad.join('; ')); process.exit(1); }
  console.log('\nOK — every guardian keeps the pressure on');
})().catch(e => { console.error(e); process.exit(1); });
