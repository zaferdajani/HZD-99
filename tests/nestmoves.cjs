// KINGDOM 5'S THREE MOVES, MEASURED — thornbed, shed, infest.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." The framework (foeLevel /
// foeSkillPts / FOE_MOVES, measured by tests/foelevel.cjs) says what a machine
// can afford. This says what the VIRUS NEST actually built with it, and it
// measures the three things a claim about a move can be wrong about:
//
//   1. IT FIRES. Not "the code exists" — the timer runs, the hazard appears,
//      and the thing it threatens takes the hit. Every one of these is driven
//      through its own state chain and watched.
//   2. IT WARNS FIRST, AND THE WARNING NEVER SHORTENS. The house law
//      ("an enemy is never harder because it warned you less") is the one
//      that cannot be checked by reading, because the tell length is a
//      number multiplied by nothing: the only way to know it does not shrink
//      with cunning is to roll the same machine at iq 0 and at iq 1 and
//      compare. This kingdom is where it matters most — a player down here is
//      already handling the hardest machines in the game.
//   3. IT IS KINGDOM E'S AND NOBODY ELSE'S. Four other sessions are writing
//      moves into the same registry for the same shared enemy kinds, so the
//      test that matters for all five of us is that a blob in the MEADOW is
//      byte-for-byte the blob it always was. A machine without the move must
//      behave exactly as it does today, and "exactly" is measurable.
//
//   node tests/nestmoves.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── nestmoves — the Virus Nest\'s own three, and the warning in front of each\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof FOE_MOVES === 'object' && typeof Enemy === 'function', { timeout: 25000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    G.wake = null; G.state = 'PLAY';
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    const out = {}, DT = 1 / 60;

    // The room's own loop is PARKED for the whole harness. Every machine below
    // is stepped by hand, one dt at a time, so a measured tell is the tell and
    // not the tell plus however many frames the live loop also spent on it.
    G.state = 'PAUSE';
    const floorY = 15 * TILE;
    const hurt0 = player.hurt;
    let hits = [];
    player.hurt = function (d, x, src) { hits.push(src || '?'); };

    const FRESH = { abil: {}, skills: [], flags: { tut: 1, woke: 1 } };
    const LATE = {
      abil: { dash: 1, wall: 1, glide: 1, pulse: 1 }, skills: ['a', 'b', 'c', 'd', 'e'],
      flags: { tut: 1, woke: 1, bossGlitch: 1, bossBrood: 1, bossAtlas: 1, bossZero: 1, bossPrism: 1 },
    };
    const setRun = s => { G.save.abil = Object.assign({}, s.abil); G.save.skills = s.skills.slice(); G.save.flags = Object.assign({}, s.flags); };
    // a machine of a kind, spawned as the given kingdom builds it
    const spawn = (kind, zone, x) => {
      G.roomDef.zone = zone;
      const e = new Enemy(kind, x, floorY - 60);
      e.iq = foeIQ();
      G.enemies.length = 0; G.enemies.push(e);
      for (let i = 0; i < 40; i++) { e.update(DT); }      // let it find the floor
      return e;
    };
    const park = (x, y) => {
      player.x = x; player.y = y; player.vx = 0; player.vy = 0;
      player.on = true; player.dead = false; player.iT = 0;
    };

    // ======================================================================
    // 1. THE REGISTRY — three rows, all under @E, and nothing else touched
    // ======================================================================
    setRun(FRESH);
    out.rows = ['blob@E', 'guard@E', 'snare@E'].filter(k => Array.isArray(FOE_MOVES[k]));
    out.sharedUntouched = !FOE_MOVES.blob && !FOE_MOVES.guard && !FOE_MOVES.snare;
    const floorLv = foeLevel('E');
    out.nestFloorLv = floorLv;
    out.buysInE = {
      blob: foeMovesFor('blob', floorLv, 'E'),
      guard: foeMovesFor('guard', floorLv, 'E'),
      snare: foeMovesFor('snare', floorLv, 'E'),
    };
    // NOT "the other kingdoms have nothing" — they do, and they will have more:
    // four sessions are writing their own rows into this registry right now, so
    // an emptiness check here would go red on THEIR work rather than on any
    // fault of ours. The invariant that actually belongs to kingdom E is that
    // none of E's three move ids is ever handed to a machine standing anywhere
    // else, at any level, for any kind.
    const MINE = ['thornbed', 'shed', 'infest'];
    const leaks = [];
    for (const z of ['A', 'B', 'C', 'D', 'X'])
      for (const k of ['crawler', 'guard', 'flier', 'turret', 'hopper', 'blob', 'bat', 'snare', 'surge', 'kiln', 'rime'])
        for (const id of foeMovesFor(k, 7, z))
          if (MINE.indexOf(id) >= 0) leaks.push(k + '@' + z + ':' + id);
    out.leaks = leaks;
    // the cost-3 is the point of the kingdom: four points, which is level 5,
    // which is the Nest's own floor and nobody else's
    out.cost3NeedsLv4 = foeMovesFor('snare', 3, 'E').length === 0
      && foeMovesFor('snare', 4, 'E').join() === 'infest';

    // ======================================================================
    // 2. THORNBED (blob@E, cost 1) — the drip takes root
    // ======================================================================
    const thorn = (stage) => {
      setRun(stage);
      const e = spawn('blob', 'E', 240);
      let rise = 0, live = 0, sawRise = false, riseHits = 0, liveHits = 0, thornAt = null;
      let firstRise = 0, firstDone = false;     // ONE stalk's rise, not the sum
      for (let i = 0; i < 900; i++) {
        // stand exactly where the stalk will be: inside the told column, on
        // the floor it grows out of
        if (e.thornX != null) park(e.thornX - player.w / 2, e.thornY - player.h);
        else park(e.x + 70, floorY - player.h);
        hits = [];
        e.update(DT);
        if ((e.thornRise || 0) > 0) {
          rise++; sawRise = true;
          if (thornAt == null) thornAt = i;
          if (!firstDone) firstRise++;
          riseHits += hits.filter(h => h === 'blob.thornbed').length;
        } else if ((e.thornT || 0) > 0) {
          if (firstRise) firstDone = true;
          live++; liveHits += hits.filter(h => h === 'blob.thornbed').length;
        }
      }
      return { riseS: +(firstRise / 60).toFixed(2), risesS: +(rise / 60).toFixed(2),
        liveS: +(live / 60).toFixed(2), sawRise, riseHits, liveHits, firstAt: thornAt };
    };
    out.thornFresh = thorn(FRESH);
    out.thornLate = thorn(LATE);
    // ...and a MEADOW blob never grows one, ever
    setRun(LATE);
    {
      const e = spawn('blob', 'A', 240);
      let any = false;
      for (let i = 0; i < 900; i++) {
        park(e.x + 6, floorY - player.h);
        hits = [];
        e.update(DT);
        if ((e.thornRise || 0) > 0 || (e.thornT || 0) > 0 || hits.some(h => h === 'blob.thornbed')) any = true;
      }
      out.thornNotInMeadow = !any;
      out.meadowBlobStillDrips = e.hasMove('thornbed') === false;
    }

    // ======================================================================
    // 3. SHED (guard@E, cost 2) — the plate is grown tissue, and it tears
    // ======================================================================
    const shed = (stage, zone) => {
      setRun(stage);
      const e = spawn('guard', zone, 240);
      let tellFrames = 0, plateUpAt = [], denied = 0, creepHits = 0;
      let shedAt = null, creepSeen = false, guardWhileTell = null;
      for (let i = 0; i < 900; i++) {
        park(e.x + 420, floorY - player.h);      // far away: it never lunges
        e.atkCD = 9;                             // ...and never decides to
        hits = [];
        e.update(DT);
        // swing at the plate on a slow cadence while it is up
        if (e.guard && i % 24 === 0 && denied < 9) { dealDmg(e, 8, null, e.x + e.w / 2, e.y + e.h / 2); denied++; }
        if ((e.crouchT || 0) > 0) { tellFrames++; if (guardWhileTell == null) guardWhileTell = !!e.guard; }
        if (e.plateShed && shedAt == null) shedAt = i;
        if (e.creep) creepSeen = true;
        creepHits += hits.filter(h => h === 'guard.shed').length;
        plateUpAt.push(!!e.guard);
      }
      // ...then stand on whatever tore loose
      let creepHit2 = 0;
      const e2 = e;
      if (e2.plateShed) {
        // a fresh tear, so the creep is measured at full life
        e2.shedN = 0; e2.plateShed = 0; e2.creep = null; e2.crouchT = 0;
        for (let i = 0; i < 400 && !e2.creep; i++) {
          park(e2.x + 420, floorY - player.h);
          e2.atkCD = 9; e2.update(DT);
          if (e2.guard && i % 20 === 0) dealDmg(e2, 8, null, e2.x + e2.w / 2, e2.y + e2.h / 2);
        }
        for (let i = 0; i < 200 && e2.creep; i++) {
          park(e2.creep.x - player.w / 2, e2.creep.y - player.h);
          hits = [];
          e2.update(DT);
          creepHit2 += hits.filter(h => h === 'guard.shed').length;
        }
      }
      return {
        tellS: +(tellFrames / 60).toFixed(2), shedAt, creepSeen, guardWhileTell,
        creepHits: creepHits + creepHit2,
        plateUpBefore: shedAt != null ? plateUpAt.slice(0, Math.max(1, shedAt - 40)).some(v => v) : plateUpAt.some(v => v),
        plateDownAfter: shedAt != null ? !plateUpAt.slice(shedAt + 2).some(v => v) : null,
      };
    };
    out.shedFresh = shed(FRESH, 'E');
    out.shedLate = shed(LATE, 'E');
    out.shedNotInMeadow = shed(LATE, 'A');

    // ======================================================================
    // 4. INFEST (snare@E, cost 3) — the Nest recruits the machine
    // ======================================================================
    // the snare whiffs on purpose: she stands inside its NOTICE band (250) and
    // outside its told REACH, which is the failure it pays the limp window for
    const infest = (stage, hitTheSac) => {
      setRun(stage);
      G.roomDef.zone = 'E';
      const s = new Enemy('snare', 240, floorY - 60);
      const host = new Enemy('crawler', 340, floorY - 40);
      s.iq = foeIQ(); host.iq = foeIQ();
      G.enemies.length = 0; G.enemies.push(s, host);
      for (let i = 0; i < 40; i++) s.update(DT);
      let sacFrames = 0, limpFrames = 0, sawHost = false, popped = false, hitAt = null;
      for (let i = 0; i < 1400; i++) {
        park(s.x + 200, floorY - player.h);
        host.atkCD = 9;                          // the host is scenery here
        s.update(DT);
        if ((s.sacT || 0) > 0) {
          sacFrames++;
          if (s.host) sawHost = true;
          if (hitTheSac && hitAt == null && sacFrames > 12) {
            // ONE hit on the polyp while the sac is swelling
            dealDmg(s, 6, null, s.x + s.w / 2, s.y + s.h / 2);
            hitAt = i;
          }
        }
        if ((s.windedT || 0) > 0) limpFrames++;
        if (hitAt != null && (s.sacT || 0) <= 0 && !popped) {
          // the beat she interrupted is OVER: whether the host was seeded is
          // the whole question, so the measurement stops here rather than
          // rolling on into the polyp's next call
          popped = true;
          break;
        }
        if (host.infested) break;
      }
      return {
        sacS: +(sacFrames / 60).toFixed(2), limpS: +(limpFrames / 60).toFixed(2),
        sawHost, infested: !!host.infested, popped, snare: s, host,
      };
    };
    const iF = infest(FRESH, false);
    out.infestFresh = { sacS: iF.sacS, sawHost: iF.sawHost, infested: iF.infested };
    const iL = infest(LATE, false);
    out.infestLate = { sacS: iL.sacS, sawHost: iL.sawHost, infested: iL.infested };
    const iP = infest(FRESH, true);
    out.infestPopped = { infested: iP.infested, popped: iP.popped, sacS: iP.sacS };

    // a carrier bursts into a spore bed where it dies — and the bed opens from
    // a radius of ZERO, which is the whole telegraph
    {
      setRun(FRESH);
      G.roomDef.zone = 'E';
      G.pools = [];
      const carrier = new Enemy('crawler', 300, floorY - 40);
      carrier.infested = 1;
      const before = G.pools.length;
      carrier.die(1, -0.4);
      out.bedOnDeath = G.pools.length > before;
      out.bedStartsHarmless = G.pools.length ? G.pools[G.pools.length - 1].r === 0 : false;
      // ...and an UNINFESTED machine of the same kind leaves nothing
      G.pools = [];
      const clean = new Enemy('crawler', 300, floorY - 40);
      clean.die(1, -0.4);
      out.cleanLeavesNothing = G.pools.length === 0;
    }
    // the cap: a snare never turns the whole room into one event
    {
      setRun(LATE);
      G.roomDef.zone = 'E';
      const s = new Enemy('snare', 240, floorY - 60);
      s.iq = foeIQ();
      const mob = [];
      for (let i = 0; i < 6; i++) mob.push(new Enemy('crawler', 300 + i * 18, floorY - 40));
      G.enemies.length = 0; G.enemies.push(s, ...mob);
      for (let i = 0; i < 4000; i++) {
        park(s.x + 200, floorY - player.h);
        for (const m of mob) m.atkCD = 9;
        s.update(DT);
      }
      out.carriersMade = mob.filter(m => m.infested).length;
      out.infestCap = INFEST_MAX;
    }
    // ...and a MEADOW snare never calls at all
    {
      setRun(LATE);
      G.roomDef.zone = 'A';
      const s = new Enemy('snare', 240, floorY - 60);
      s.iq = foeIQ();
      const host = new Enemy('crawler', 340, floorY - 40);
      G.enemies.length = 0; G.enemies.push(s, host);
      let any = false;
      for (let i = 0; i < 1400; i++) {
        park(s.x + 200, floorY - player.h);
        host.atkCD = 9; s.update(DT);
        if ((s.sacT || 0) > 0 || host.infested) any = true;
      }
      out.infestNotInMeadow = !any;
    }

    // ======================================================================
    // 5. ALL FOUR NEW READS ACTUALLY DRAW — the telegraph is half a picture,
    //    and a picture that throws is no warning at all
    // ======================================================================
    {
      const cv = document.querySelector('canvas');
      const ctx = cv.getContext('2d');
      G.roomDef.zone = 'E';
      const b = new Enemy('blob', 240, floorY - 40);
      b.thornX = 250; b.thornY = floorY; b.thornRise = THORN_RISE * 0.5; b.thornT = 0;
      const g = new Enemy('guard', 300, floorY - 40);
      g.crouchT = TELL_SWIPE * 0.5;
      const g2 = new Enemy('guard', 360, floorY - 40);
      g2.plateShed = 1; g2.creep = { x: 370, y: floorY, dir: 1, spd: 90, life: 1.5, ph: 0 };
      const s = new Enemy('snare', 420, floorY - 40);
      const h = new Enemy('crawler', 500, floorY - 40);
      s.sacT = 0.4; s.sac0 = 1; s.host = h; h.infested = 1;
      let drawn = 0;
      for (const e of [b, g, g2, s, h]) { e.draw(ctx); drawn++; }
      b.thornRise = 0; b.thornT = THORN_LIVE * 0.5; b.draw(ctx); drawn++;
      out.drawn = drawn;
    }

    player.hurt = hurt0;
    G.state = 'PLAY';
    return out;
  });

  // ---- 1. the registry ----------------------------------------------------
  check('kingdom E wrote three rows, all of them kingdom-scoped',
    r.rows.length === 3, r.rows.join(' '));
  check('...and not one unscoped row — the integrator\'s layer is untouched', r.sharedUntouched);
  check('a Nest machine can afford all three at the kingdom floor',
    r.buysInE.blob.join() === 'thornbed' && r.buysInE.guard.join() === 'shed'
    && r.buysInE.snare.join() === 'infest',
    'lv ' + r.nestFloorLv + ' → ' + JSON.stringify(r.buysInE));
  check('...and not one of them leaks into another kingdom, at any level, on any kind',
    r.leaks.length === 0, r.leaks.join(' ') || 'no leaks');
  check('the cost-3 lands where only the Nest can pay for it', r.cost3NeedsLv4);

  // ---- 2. thornbed --------------------------------------------------------
  check('thornbed: the drip takes root and the stalk goes live',
    r.thornFresh.sawRise && r.thornFresh.liveS > 0,
    'rise ' + r.thornFresh.riseS + 's, live ' + r.thornFresh.liveS + 's');
  check('...and it cannot touch her while it is still growing',
    r.thornFresh.riseHits === 0, r.thornFresh.riseHits + ' hits during the rise');
  check('...but it owns the column once it is live',
    r.thornFresh.liveHits > 0, r.thornFresh.liveHits + ' hits');
  check('...and the rise is the full told length at every level of cunning',
    Math.abs(r.thornFresh.riseS - r.thornLate.riseS) < 0.12
    && r.thornFresh.riseS >= 0.45,
    'fresh ' + r.thornFresh.riseS + 's vs finished-run ' + r.thornLate.riseS + 's');
  check('...and a meadow blob never grows one',
    r.thornNotInMeadow && r.meadowBlobStillDrips);

  // ---- 3. shed ------------------------------------------------------------
  check('shed: denied hits tear the plate loose',
    r.shedFresh.shedAt != null && r.shedFresh.creepSeen,
    'shed at frame ' + r.shedFresh.shedAt);
  check('...after a wind-up, with the plate still up through all of it',
    r.shedFresh.guardWhileTell === true && r.shedFresh.tellS >= 0.45,
    'tell ' + r.shedFresh.tellS + 's');
  check('...and the tell is the same length at full cunning',
    Math.abs(r.shedFresh.tellS - r.shedLate.tellS) < 0.12,
    'fresh ' + r.shedFresh.tellS + 's vs finished-run ' + r.shedLate.tellS + 's');
  check('...the plate was real before, and is gone for good after',
    r.shedFresh.plateUpBefore === true && r.shedFresh.plateDownAfter === true);
  check('...and what tore loose is a hazard she has to answer',
    r.shedFresh.creepHits > 0, r.shedFresh.creepHits + ' hits');
  check('...and a meadow guard never sheds — it is the guard it always was',
    r.shedNotInMeadow.shedAt === null && !r.shedNotInMeadow.creepSeen
    && r.shedNotInMeadow.creepHits === 0 && r.shedNotInMeadow.plateUpBefore === true);

  // ---- 4. infest ----------------------------------------------------------
  check('infest: the polyp spends its own punish window calling a host',
    r.infestFresh.sawHost && r.infestFresh.infested,
    'sac ' + r.infestFresh.sacS + 's');
  check('...and the sac swells across the whole window — the longest minion '
    + 'tell in the game', r.infestFresh.sacS >= 0.9, r.infestFresh.sacS + 's');
  check('...at exactly the same length once the run is finished',
    Math.abs(r.infestFresh.sacS - r.infestLate.sacS) < 0.14,
    'fresh ' + r.infestFresh.sacS + 's vs finished-run ' + r.infestLate.sacS + 's');
  check('...and one hit on the polyp pops it: the window still pays',
    r.infestPopped.popped && !r.infestPopped.infested,
    JSON.stringify(r.infestPopped));
  check('a carrier bursts into a spore bed where it falls',
    r.bedOnDeath && r.cleanLeavesNothing);
  check('...and the bed opens from nothing, so the burst is the warning',
    r.bedStartsHarmless);
  check('...and one polyp never converts the whole room',
    r.carriersMade > 0 && r.carriersMade <= r.infestCap,
    r.carriersMade + ' of a cap of ' + r.infestCap);
  check('...and a meadow snare never calls', r.infestNotInMeadow);

  // ---- 5. the pictures ----------------------------------------------------
  check('every new read draws without throwing', r.drawn === 6, r.drawn + ' drawn');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
