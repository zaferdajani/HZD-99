// KINGDOM X'S THREE MOVES, MEASURED — facet, refract, glint.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." The framework (foeLevel /
// foeSkillPts / FOE_MOVES, measured by tests/foelevel.cjs) says what a machine
// can afford. This says what the CRYSTAL CACHE built with it — and the Cache is
// the last kingdom to file, with the smallest roster in the game: crawler,
// hopper and bat are the only enemy kinds standing anywhere in zone X, so
// there is nowhere here to hide a move that does not actually fire.
//
// Three things a claim about a move can be wrong about, and all three are
// measured, the same three the Nest's harness measures:
//
//   1. IT FIRES. Not "the code exists" — the lance is a hitbox on the floor
//      the tell drew, the leap ends on the spot the floor was painted with,
//      and the splinters left in the air take the hit.
//   2. IT WARNS FIRST, AND THE WARNING NEVER SHORTENS. Two of these lengthen
//      a tell (TELL_FAST -> TELL_SWIPE) and the third paints its destination
//      before the machine has left the ground. The only way to know a tell
//      does not shrink with cunning is to roll the same machine at a fresh
//      save and at a finished run and compare — so that is done for each.
//      And the warning half must be HARMLESS: standing in a told strip, or on
//      an arming splinter, costs nothing until it is real.
//   3. IT IS KINGDOM X'S AND NOBODY ELSE'S. Five other sessions write into
//      the same registry for the same shared kinds, so what belongs to this
//      kingdom is that a crawler in the MEADOW is the crawler it always was.
//
//   node tests/cachemoves.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cachemoves — the Crystal Cache bends the answer, and says so first\n');
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

    // The room's own loop is PARKED for the whole harness: every machine below
    // is hand-stepped one dt at a time, so a measured tell is the tell and not
    // the tell plus whatever the live loop also spent on it.
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
    const setRun = s => {
      G.save.abil = Object.assign({}, s.abil);
      G.save.skills = s.skills.slice();
      G.save.flags = Object.assign({}, s.flags);
    };
    const spawn = (kind, zone, x, y) => {
      G.roomDef.zone = zone;
      const e = new Enemy(kind, x, y == null ? floorY - 60 : y);
      e.iq = foeIQ();
      G.enemies.length = 0; G.enemies.push(e);
      // SHE IS NOWHERE NEAR IT WHILE IT FINDS THE FLOOR. Those 40 settle frames
      // are inside every notice band in the game, so a machine left where the
      // last sub-test parked her began coiling during setup and the loop below
      // caught a tell already half spent — which read as a tell that had
      // shortened. Park her out of the world for the settle, then put her back.
      const keepX = player.x, keepY = player.y;
      park(-9000, floorY - player.h);
      for (let i = 0; i < 40; i++) e.update(DT);     // let it find the floor
      park(keepX, keepY);
      return e;
    };
    const park = (x, y) => {
      player.x = x; player.y = y; player.vx = 0; player.vy = 0;
      player.on = true; player.dead = false; player.iT = 0;
    };
    const countHits = id => hits.filter(h => h === id).length;

    // ======================================================================
    // 1. THE REGISTRY — three rows, all under @X, nothing shared touched
    // ======================================================================
    setRun(FRESH);
    out.rows = ['crawler@X', 'hopper@X', 'bat@X'].filter(k => Array.isArray(FOE_MOVES[k]));
    out.sharedUntouched = !FOE_MOVES.crawler && !FOE_MOVES.hopper && !FOE_MOVES.bat;
    const floorLv = foeLevel('X');
    out.cacheFloorLv = floorLv;
    out.buysInX = {
      crawler: foeMovesFor('crawler', floorLv, 'X'),
      hopper: foeMovesFor('hopper', floorLv, 'X'),
      bat: foeMovesFor('bat', floorLv, 'X'),
    };
    // NOT "the other kingdoms have nothing" — they have plenty and this harness
    // must not go red on THEIR work. What belongs to kingdom X is that none of
    // its three ids is ever handed to a machine standing anywhere else, at any
    // level, on any kind.
    const MINE = ['facet', 'refract', 'glint'];
    const leaks = [];
    for (const z of ['A', 'B', 'C', 'D', 'E'])
      for (const k of ['crawler', 'guard', 'flier', 'turret', 'hopper', 'blob', 'bat', 'snare', 'surge', 'kiln', 'rime'])
        for (const id of foeMovesFor(k, 7, z))
          if (MINE.indexOf(id) >= 0) leaks.push(k + '@' + z + ':' + id);
    out.leaks = leaks;
    // the cost-3 needs three points, which is level 4 — and the Cache's own
    // floor is 5, so it arrives with a point still in hand
    out.cost3NeedsLv4 = foeMovesFor('hopper', 3, 'X').length === 0
      && foeMovesFor('hopper', 4, 'X').join() === 'refract';
    out.floorPts = foeSkillPts(floorLv);

    // ======================================================================
    // 2. FACET (crawler@X, cost 2) — the lunge sweeps the floor it left
    // ======================================================================
    // ...AND THE MACHINE STAYS WHERE IT WAS PUT. `dir` is a coin flip in the
    // Enemy constructor and the crawler patrols; across hundreds of hand-
    // stepped frames one that started walking the wrong way simply leaves the
    // room and the lance is thrown at x = -900. The subject here is the split,
    // not the patrol, so x is pinned every frame (the same fix tests/nestmoves
    // needed for the guard).
    const facet = (stage, zone) => {
      setRun(stage);
      const e = spawn('crawler', zone, 240);
      const holdX = e.x;
      let warnFrames = 0, warnHits = 0, liveFrames = 0, liveHits = 0;
      let lanceSeen = false, told = null, fired = null, windedFrames = 0, lungeSeen = false;
      let windedSeen = false;
      for (let i = 0; i < 900; i++) {
        e.x = holdX; e.vx = 0;
        // she stands in front while it decides — that fixes its facing — and
        // steps into the told strip for the frames the strip exists
        if (e.facetT > 0) {
          if (!told) told = facetStrip(e);
          park(told.x + told.w / 2 - player.w / 2, floorY - player.h);
        } else if ((e.lanceT || 0) > 0) {
          park(e.lanceX + FACET_REACH / 2 - player.w / 2, floorY - player.h);
        } else {
          park(holdX + 100, floorY - player.h);
        }
        hits = [];
        e.update(DT);
        if (e.facetT > 0) { warnFrames++; warnHits += countHits('crawler.facet'); }
        if ((e.lanceT || 0) > 0) {
          if (!lanceSeen) fired = { x: e.lanceX, y: e.lanceY, h: e.lanceH };
          lanceSeen = true; liveFrames++; liveHits += countHits('crawler.facet');
        }
        if ((e.lungeT || 0) > 0) lungeSeen = true;
        if ((e.windedT || 0) > 0) { windedFrames++; windedSeen = true; }
        // one clean cycle, and the cycle is not over when the lance is: the
        // winded window it hands back opens AFTER the lunge runs out, and
        // that window is the whole reason the move is allowed to exist
        if (windedSeen && (e.windedT || 0) <= 0) break;
      }
      return {
        warnS: +(warnFrames / 60).toFixed(2), warnHits,
        liveS: +(liveFrames / 60).toFixed(2), liveHits, lanceSeen, lungeSeen,
        windedS: +(windedFrames / 60).toFixed(2),
        // the strip the tell drew and the strip that fired, to the pixel
        drift: told && fired ? +Math.abs(told.x - fired.x).toFixed(2) : null,
      };
    };
    out.facetFresh = facet(FRESH, 'X');
    // the control for the punish window is a crawler with NO row at all at the
    // SAME cunning: winded shrinks with iq by design, so a finished-run meadow
    // crawler would be a different number for a reason that is not this move
    out.facetPlain = facet(FRESH, 'B');
    out.facetMeadow = facet(LATE, 'A');
    // the tell's LENGTH, measured with her parked in front the whole time so
    // cunning never gets to re-aim the strip mid-coil and muddy the count
    const facetTell = (stage, zone) => {
      setRun(stage);
      const e = spawn('crawler', zone, 240);
      const holdX = e.x;
      let coil = 0, facetF = 0, sawCoil = false;
      for (let i = 0; i < 900; i++) {
        e.x = holdX; e.vx = 0;
        park(holdX + 120, floorY - player.h);
        e.update(DT);
        if ((e.coilT || 0) > 0) { coil++; sawCoil = true; }
        if (e.facetT > 0) facetF++;
        if (sawCoil && (e.coilT || 0) <= 0) break;
      }
      return { coilS: +(coil / 60).toFixed(2), facetS: +(facetF / 60).toFixed(2) };
    };
    out.facetTellFresh = facetTell(FRESH, 'X');
    out.facetTellLate = facetTell(LATE, 'X');
    out.plainTell = facetTell(FRESH, 'B');       // a crawler with no row at all

    // ======================================================================
    // 3. REFRACT (hopper@X, cost 3) — the arc turns onto a painted spot
    // ======================================================================
    const refract = (stage, zone) => {
      setRun(stage);
      const e = spawn('hopper', zone, 240);
      let markX = null, markPx = null, markFrames = 0, crouchFrames = 0;
      let landX = null, airborne = false, bent = false, vxAtLeap = null;
      for (let i = 0; i < 900; i++) {
        park(e.x + 150, floorY - player.h);
        const wasMark = e.markX;
        e.update(DT);
        if (e.markX != null) {
          if (markX == null) { markX = e.markX; markPx = e.arcX; }
          markFrames++;
        }
        if ((e.crouchT || 0) > 0) crouchFrames++;
        if (e.wasAir && !airborne) { airborne = true; vxAtLeap = e.vx; }
        if (airborne && (e.bendAt || 0) <= 0 && wasMark != null && e.markX != null && !bent) {
          bent = true;
        }
        if (airborne && !e.wasAir) { landX = e.x + e.w / 2; break; }
      }
      return {
        painted: markX != null, markX, markPx,
        markS: +(markFrames / 60).toFixed(2),
        crouchS: +(crouchFrames / 60).toFixed(2),
        // how far the painted spot sits off the spot the HONEST arc would have
        // reached, and how close the machine actually came down to the paint
        offset: markX != null && markPx != null ? +Math.abs(markX - markPx).toFixed(1) : null,
        miss: markX != null && landX != null ? +Math.abs(landX - markX).toFixed(1) : null,
        landX,
      };
    };
    // ...and a mark is dropped if the leap never comes. She gathers in range,
    // then leaves: the paint must go out with the intention, because a
    // telegraph for an attack that is not happening teaches a player to stop
    // believing the floor.
    {
      setRun(FRESH);
      const e = spawn('hopper', 'X', 240);
      let painted = false, lingered = 0, leapt = false;
      for (let i = 0; i < 600; i++) {
        // in range while it gathers, then a long way off
        park(painted ? e.x + 900 : e.x + 150, floorY - player.h);
        e.update(DT);
        if (e.markX != null) painted = true;
        if (e.wasAir) leapt = true;
        if (painted && (e.crouchT || 0) <= 0 && !e.wasAir) {
          if (e.markX != null) lingered++;
          else break;
        }
      }
      out.markDropped = { painted, lingered, leapt };
    }
    out.refractFresh = refract(FRESH, 'X');
    out.refractLate = refract(LATE, 'X');
    out.refractMeadow = refract(LATE, 'A');
    out.refractOff = REFRACT_OFF;

    // ======================================================================
    // 4. GLINT (bat@X, cost 1) — the dive leaves the air behind it occupied
    // ======================================================================
    const glint = (stage, zone) => {
      setRun(stage);
      const e = spawn('bat', zone, 240, floorY - 190);
      let maxMotes = 0, armFrames = 0, armHits = 0, liveFrames = 0, liveHits = 0;
      let holdFrames = 0, sawLive = false, firstArmS = 0, armDone = false, holdDone = false;
      for (let i = 0; i < 900; i++) {
        const g = e.motes && e.motes.length ? e.motes[0] : null;
        // she stands ON the oldest splinter whenever there is one, so the
        // arming half and the live half are measured in the same place
        if (g) park(g.x - player.w / 2, g.y - player.h / 2);
        else park(e.x + 20, floorY - player.h);
        hits = [];
        e.update(DT);
        // only the FIRST shiver is counted: the bat re-hangs and gathers again
        // while the splinters from the last dive are still live, and summing
        // two wind-ups would make the tell look like it changed when the loop
        // simply ran a beat longer
        if ((e.holdT || 0) > 0) { if (!holdDone) holdFrames++; }
        else if (holdFrames) holdDone = true;
        if (e.motes) maxMotes = Math.max(maxMotes, e.motes.length);
        const g2 = e.motes && e.motes.length ? e.motes[0] : null;
        if (g2 && g2.arm > 0) {
          armFrames++; if (!armDone) firstArmS++;
          armHits += countHits('bat.glint');
        } else if (g2) {
          armDone = true; sawLive = true;
          liveFrames++; liveHits += countHits('bat.glint');
        }
        if (sawLive && liveFrames > 40) break;
      }
      return {
        maxMotes, armHits, liveHits, sawLive,
        armS: +(firstArmS / 60).toFixed(2),
        holdS: +(holdFrames / 60).toFixed(2),
      };
    };
    out.glintFresh = glint(FRESH, 'X');
    out.glintLate = glint(LATE, 'X');
    out.glintMeadow = glint(LATE, 'A');
    out.glintMax = GLINT_MAX;

    // ======================================================================
    // 5. ALL THREE READS ACTUALLY DRAW — a telegraph is half a picture, and
    //    a picture that throws is no warning at all
    // ======================================================================
    {
      const cv = document.querySelector('canvas');
      const ctx = cv.getContext('2d');
      G.roomDef.zone = 'X';
      let drawn = 0;
      const cr = new Enemy('crawler', 240, floorY - 40);
      cr.facetT = TELL_SWIPE; cr.facet0 = 0.6; cr.draw(ctx); drawn++;      // told
      cr.facetT = 0; cr.lanceT = FACET_LIVE * 0.6;
      cr.lanceX = 210; cr.lanceY = floorY - 38; cr.lanceH = 16;
      cr.draw(ctx); drawn++;                                               // live
      const hp = new Enemy('hopper', 300, floorY - 40);
      hp.markX = 380; hp.markY = floorY; hp.bend0 = 0.5; hp.draw(ctx); drawn++;
      hp.bend0 = 1; hp.bendAt = REFRACT_APEX * 0.5; hp.draw(ctx); drawn++;
      const bt = new Enemy('bat', 360, floorY - 120);
      bt.motes = [{ x: 350, y: floorY - 100, arm: GLINT_ARM * 0.5, life: GLINT_LIVE },
                  { x: 380, y: floorY - 80, arm: 0, life: GLINT_LIVE * 0.8 },
                  { x: 400, y: floorY - 60, arm: 0, life: 0.2 }];
      bt.draw(ctx); drawn++;
      out.drawn = drawn;
    }

    player.hurt = hurt0;
    G.state = 'PLAY';
    return out;
  });

  // ---- 1. the registry ----------------------------------------------------
  check('kingdom X wrote three rows, all of them kingdom-scoped',
    r.rows.length === 3, r.rows.join(' '));
  check('...and not one unscoped row — the integrator\'s layer is untouched', r.sharedUntouched);
  check('the Cache\'s whole roster can afford its own move at the kingdom floor',
    r.buysInX.crawler.join() === 'facet' && r.buysInX.hopper.join() === 'refract'
    && r.buysInX.bat.join() === 'glint',
    'lv ' + r.cacheFloorLv + ' (' + r.floorPts + ' pts) → ' + JSON.stringify(r.buysInX));
  check('...and not one of them leaks into another kingdom, at any level, on any kind',
    r.leaks.length === 0, r.leaks.join(' ') || 'no leaks');
  check('the cost-3 is unaffordable below level 4, and the Cache floor clears it',
    r.cost3NeedsLv4 && r.cacheFloorLv >= 5, 'floor lv ' + r.cacheFloorLv);

  // ---- 2. facet -----------------------------------------------------------
  check('facet: the lunge throws a lance across the floor it left',
    r.facetFresh.lanceSeen && r.facetFresh.lungeSeen,
    'live ' + r.facetFresh.liveS + 's');
  check('...and it owns that strip while it is real',
    r.facetFresh.liveHits > 0, r.facetFresh.liveHits + ' hits');
  check('...but standing in the told strip costs nothing until it fires',
    r.facetFresh.warnHits === 0 && r.facetFresh.warnS >= 0.45,
    r.facetFresh.warnHits + ' hits across ' + r.facetFresh.warnS + 's of warning');
  check('...and it fires exactly where the amber drew it',
    r.facetFresh.drift != null && r.facetFresh.drift < 1,
    r.facetFresh.drift + 'px drift');
  check('...the coil is longer than a bare crawler\'s, not shorter',
    r.facetTellFresh.coilS > r.plainTell.coilS + 0.1,
    'cache ' + r.facetTellFresh.coilS + 's vs plain ' + r.plainTell.coilS + 's');
  check('...at the same length once the run is finished',
    Math.abs(r.facetTellFresh.facetS - r.facetTellLate.facetS) < 0.12
    && r.facetTellFresh.facetS >= 0.45,
    'fresh ' + r.facetTellFresh.facetS + 's vs finished-run ' + r.facetTellLate.facetS + 's');
  check('...and the punish window after it is the one a bare crawler hands back',
    r.facetFresh.windedS > 0.4
    && Math.abs(r.facetFresh.windedS - r.facetPlain.windedS) < 0.06,
    'cache ' + r.facetFresh.windedS + 's vs plain ' + r.facetPlain.windedS + 's');
  check('...and a meadow crawler never splits — it is the crawler it always was',
    !r.facetMeadow.lanceSeen && r.facetMeadow.liveHits === 0 && r.facetMeadow.warnS === 0);

  // ---- 3. refract ---------------------------------------------------------
  check('refract: the floor is painted before the machine leaves it',
    r.refractFresh.painted && r.refractFresh.crouchS >= 0.45,
    'crouch ' + r.refractFresh.crouchS + 's');
  check('...and the paint stays lit across the crouch AND the whole flight',
    r.refractFresh.markS >= 0.9, r.refractFresh.markS + 's of notice');
  check('...the spot sits off the honest arc by exactly its offset, both sides',
    r.refractFresh.offset != null && Math.abs(r.refractFresh.offset - r.refractOff) < 6,
    r.refractFresh.offset + 'px off aim (want ' + r.refractOff + ')');
  // 18 px is half a body and well inside the offset the paint sits at (62), so
  // this cannot pass on a hopper that simply flew the honest arc
  check('...and the machine comes down ON it, not on the arc',
    r.refractFresh.miss != null && r.refractFresh.miss < 18
    && r.refractLate.miss != null && r.refractLate.miss < 18,
    'missed by ' + r.refractFresh.miss + 'px fresh, ' + r.refractLate.miss + 'px finished-run');
  check('...at exactly the same warning once the run is finished',
    Math.abs(r.refractFresh.crouchS - r.refractLate.crouchS) < 0.12,
    'fresh ' + r.refractFresh.crouchS + 's vs finished-run ' + r.refractLate.crouchS + 's');
  check('...and the paint goes out with the intention when the leap never comes',
    r.markDropped.painted && r.markDropped.lingered < 4,
    'lit for ' + r.markDropped.lingered + ' frames after the crouch ended');
  check('...and a meadow hopper never paints and never bends',
    !r.refractMeadow.painted && r.refractMeadow.markX == null);

  // ---- 4. glint -----------------------------------------------------------
  check('glint: the dive leaves splinters hanging in the air',
    r.glintFresh.maxMotes > 0 && r.glintFresh.sawLive,
    r.glintFresh.maxMotes + ' at once, cap ' + r.glintMax);
  check('...and they cannot touch her while they are arming',
    r.glintFresh.armHits === 0 && r.glintFresh.armS >= 0.35,
    r.glintFresh.armHits + ' hits across ' + r.glintFresh.armS + 's of arming');
  check('...and they own that air once they are real',
    r.glintFresh.liveHits > 0, r.glintFresh.liveHits + ' hits');
  check('...never more than the cap, so a dive is a dotted line not a wall',
    r.glintFresh.maxMotes <= r.glintMax && r.glintLate.maxMotes <= r.glintMax,
    r.glintFresh.maxMotes + ' / ' + r.glintLate.maxMotes);
  check('...the shiver is the full told length at every level of cunning',
    r.glintFresh.holdS >= 0.45 && Math.abs(r.glintFresh.holdS - r.glintLate.holdS) < 0.14,
    'fresh ' + r.glintFresh.holdS + 's vs finished-run ' + r.glintLate.holdS + 's');
  check('...and a meadow bat sheds nothing, and shivers the shorter tell',
    r.glintMeadow.maxMotes === 0 && r.glintMeadow.liveHits === 0
    && r.glintMeadow.holdS < r.glintFresh.holdS,
    'meadow ' + r.glintMeadow.holdS + 's vs cache ' + r.glintFresh.holdS + 's');

  // ---- 5. the pictures ----------------------------------------------------
  check('every new read draws without throwing', r.drawn === 5, r.drawn + ' drawn');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
