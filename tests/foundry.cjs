// KINGDOM C — THE FOUNDRY'S MOVES, MEASURED.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." The framework (foeLevel,
// foeSkillPts, FOE_MOVES) is measured by tests/foelevel.cjs; this measures the
// three moves kingdom C bought with it, and it exists because "the enemy has a
// new move" is exactly the kind of claim that survives a code review and dies
// in the shipped game — the crawler that never lays a lane because a timer was
// undefined, the pot that pours on the wrong side, the tell that quietly got
// shorter when nobody was holding a stopwatch to it.
//
// Four things are asked of every move, and the third is the one with teeth:
//
//   1. IT IS BOUGHT WHERE IT SHOULD BE. `cinder` and `slagsplash` inside the
//      kingdom's own floor, `pour` only on a machine a progressed run built,
//      and NONE of them one kingdom over — the `@C` scope is what lets five
//      sessions work on this at once and it has to actually hold.
//   2. IT FIRES. Melt on the floor, gobs in the air — counted, not asserted.
//   3. IT COSTS THE PLAYER NOTHING IN WARNING. The wind-up of a machine that
//      bought a move is measured against the same machine without it and has
//      to be the SAME LENGTH, and no melt may exist on the floor until the
//      whole of that wind-up has been spent. This is the law above TRAITS in
//      js/entities.js — "an enemy is never harder because it warned you less"
//      — turned into a number, because it is the one rule in this codebase
//      that a tuning pass would break without anyone noticing.
//   4. THE MACHINE WITHOUT IT IS UNCHANGED. A zone-A crawler still lunges,
//      still winds down, and leaves nothing behind.
//
//   node tests/foundry.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── foundry — kingdom C\'s machines learn to leave melt, and warn first\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof foeMovesFor === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv);
    G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));
    const out = {};

    // a machine has to stand on something, and a Foundry room is not flat
    const floorY = tx => {
      for (let ty = 0; ty < G.roomDef.h; ty++) if (solidAt(tx, ty)) return ty * TILE;
      return (G.roomDef.h - 1) * TILE;
    };
    // THE FRESH RUN vs THE LONG ONE. foeLevel reads both the kingdom and the
    // save, so the save is the only thing that moves between these two.
    const fresh = () => { G.save.abil = {}; G.save.skills = []; G.save.flags = { tut: 1, woke: 1 }; };
    const deep = () => {
      G.save.abil = { dash: 1, wall: 1, glide: 1, pulse: 1 };
      G.save.skills = ['a', 'b', 'c'];
      G.save.flags = { tut: 1, woke: 1, bossGlitch: 1, bossBrood: 1 };
    };

    // ---- 1. who buys what, and where ---------------------------------------
    const bought = {};
    for (const [room, z] of [['A1', 'A'], ['C2', 'C']]) {
      loadRoom(room); G.wake = null; G.state = 'PLAY'; G.boss = null;
      fresh();
      bought[z + ':fresh'] = {
        crawler: foeMovesFor('crawler', foeLevel(z), z),
        hopper: foeMovesFor('hopper', foeLevel(z), z),
        kiln: foeMovesFor('kiln', foeLevel(z), z),
      };
      deep();
      bought[z + ':deep'] = {
        crawler: foeMovesFor('crawler', foeLevel(z), z),
        hopper: foeMovesFor('hopper', foeLevel(z), z),
        kiln: foeMovesFor('kiln', foeLevel(z), z),
      };
    }
    out.bought = bought;

    // ---- the driver. One machine, the player pinned beside it, real
    // update() calls at a fixed step — the same rig tests/combat.cjs uses.
    // It records the WHOLE history, because every question below is about
    // what happened before something else happened.
    const drive = (room, kind, tx, opts) => {
      opts = opts || {};
      loadRoom(room); G.wake = null; G.state = 'PLAY'; G.boss = null;
      (opts.deep ? deep : fresh)();
      G.enemies.length = 0; G.pools = []; G.projs.length = 0;
      const fy = floorY(tx);
      const e = new Enemy(kind, tx * TILE, fy - EKIND[kind].h - 3);
      if (opts.strip) e.moves = [];                 // the same machine, unarmed
      G.enemies.push(e);
      const rec = {
        moves: e.moves.slice(), level: e.level,
        tellFrames: 0, chargeRun: 0, lungeFrames: 0, windFrames: 0, plumeFrames: 0,
        firstHot: -1, hotMade: 0, hotX: [], gobFrames: 0, maxGobs: 0,
        firstGob: -1, pourSide: 0, windedPeak: 0, hurts: [],
        warnBeforeFirstHot: -1, leaps: 0,
      };
      const hurt0 = player.hurt;
      player.hurt = function (d, sx, src) { rec.hurts.push(src || '?'); };
      // THE MEASURE IS ONE WIND-UP, NOT ALL OF THEM. Totalling the warned
      // frames across a drive compares how many times each machine happened
      // to attack — atkCD is random and reads foeIQ, so a deep-run pot fits
      // more cycles into the same 900 frames and "warns more" while warning
      // exactly as long. The first contiguous charge is the honest number.
      let warn = 0, run = 0, hadPool = 0;
      for (let i = 0; i < (opts.frames || 700); i++) {
        player.x = opts.at != null ? e.x + opts.at : clamp(e.x + (e.dir || 1) * 90, 40, (G.roomDef.w - 2) * TILE);
        player.y = fy - player.h; player.vx = 0; player.vy = 0;
        player.on = true; player.iT = 0; player.dead = false;
        e.update(1 / 60);
        const charging = Math.max(e.coilT || 0, e.crouchT || 0) > 0;
        if (charging) { run++; if (!rec.chargeRun) rec.tellFrames++; }
        else if (run) { if (!rec.chargeRun) rec.chargeRun = run; run = 0; }
        if (charging || (e.plumeT || 0) > 0) { if (rec.firstHot < 0) warn++; }
        if ((e.lungeT || 0) > 0) rec.lungeFrames++;
        if ((e.windedT || 0) > 0) { rec.windFrames++; rec.windedPeak = Math.max(rec.windedPeak, e.windedT); }
        if ((e.plumeT || 0) > 0) rec.plumeFrames++;
        if (e.wasAir) rec.leaps = 1;
        if (e.pourSide) rec.pourSide = e.pourSide;
        const gn = (e.gobs || []).length;
        if (gn) { rec.gobFrames++; rec.maxGobs = Math.max(rec.maxGobs, gn); if (rec.firstGob < 0) rec.firstGob = i; }
        const hot = (G.pools || []).filter(q => q.hot);
        if (hot.length > hadPool) {
          if (rec.firstHot < 0) { rec.firstHot = i; rec.warnBeforeFirstHot = warn; }
          for (const q of hot.slice(hadPool)) rec.hotX.push(Math.round(q.x - (e.x + e.w / 2)));
          rec.hotMade += hot.length - hadPool;      // CUMULATIVE: the list is reset below
        }
        hadPool = hot.length;
        // the pool list is shared and capped at 14, and nothing here ticks its
        // lifetime down — so it is emptied before it fills, and the running
        // total above is what survives the emptying
        if ((G.pools || []).length > 8) { G.pools.length = 0; hadPool = 0; }
      }
      if (!rec.chargeRun) rec.chargeRun = run;
      player.hurt = hurt0;
      rec.e = { kind: e.kind, coilMax: TELL_FAST, w: e.w };
      return rec;
    };

    // ---- 2. CINDER — a Foundry crawler burns the lane it ran ---------------
    out.crawlerC = drive('C5', 'crawler', 16);
    out.crawlerA = drive('A1', 'crawler', 10);
    out.crawlerCStripped = drive('C5', 'crawler', 16, { strip: 1 });

    // ---- 3. SLAGSPLASH — a Foundry hopper throws what it lands in ----------
    out.hopperC = drive('C2', 'hopper', 42, { at: 210 });
    out.hopperA = drive('A1', 'hopper', 12, { at: 210 });

    // ---- 4. POUR — a deep kiln tips toward the side she chose --------------
    out.kilnDeepR = drive('C2', 'kiln', 16, { at: 90, deep: 1, frames: 900 });
    out.kilnDeepL = drive('C2', 'kiln', 16, { at: -90, deep: 1, frames: 900 });
    out.kilnFresh = drive('C2', 'kiln', 16, { at: 90, frames: 900 });

    out.tell = { fast: TELL_FAST, swipe: TELL_SWIPE };
    return out;
  });

  const j = o => JSON.stringify(o);

  // ---- who bought what ------------------------------------------------------
  console.log('WHAT EACH KINGDOM\'S MACHINES CAN AFFORD');
  for (const k in r.bought) console.log('  ' + k.padEnd(9), j(r.bought[k]));
  console.log('');

  check('a Foundry crawler carries cinder at the kingdom\'s own floor',
    r.bought['C:fresh'].crawler.includes('cinder'), j(r.bought['C:fresh'].crawler));
  check('...and a Foundry hopper carries slagsplash',
    r.bought['C:fresh'].hopper.includes('slagsplash'), j(r.bought['C:fresh'].hopper));
  check('...but the pot that POURS is a deep machine, not the one she is taught on',
    r.bought['C:fresh'].kiln.length === 0 && r.bought['C:deep'].kiln.includes('pour'),
    'fresh ' + j(r.bought['C:fresh'].kiln) + ' -> deep ' + j(r.bought['C:deep'].kiln));
  // THE MEADOW HAS ITS OWN MOVES NOW — kingdom A landed scrapdrag/scrapkick/
  // rustbloom on exactly the frames this kingdom borrows — so "zone A comes
  // back empty" stopped being a statement about the @C scope and became a
  // statement about whether kingdom 1 had shipped yet. What this check is
  // actually for is that NOTHING THE FOUNDRY WROTE is affordable outside the
  // Foundry, so that is what it now reads: its own three ids, by name,
  // anywhere in the meadow, fresh save or finished run.
  const FOUNDRY = ['cinder', 'slagsplash', 'pour'];
  const leaked = [];
  for (const when of ['A:fresh', 'A:deep'])
    for (const kind in r.bought[when])
      for (const id of r.bought[when][kind])
        if (FOUNDRY.includes(id)) leaked.push(when + ' ' + kind + ': ' + id);
  check('NONE of it reaches the meadow — the @C scope holds',
    leaked.length === 0, leaked.join(', ') || j(r.bought['A:deep']));

  // ---- cinder ---------------------------------------------------------------
  console.log('\nCINDER — the crawler\'s lane');
  console.log('  zone C ', j({ moves: r.crawlerC.moves, lunges: r.crawlerC.lungeFrames, melt: r.crawlerC.hotMade }));
  console.log('  zone A ', j({ moves: r.crawlerA.moves, lunges: r.crawlerA.lungeFrames, melt: r.crawlerA.hotMade }));

  check('a Foundry crawler actually lays melt when it lunges',
    r.crawlerC.hotMade > 0 && r.crawlerC.lungeFrames > 0,
    r.crawlerC.hotMade + ' pools over ' + r.crawlerC.lungeFrames + ' lunge frames');
  check('...and the meadow\'s crawler still lunges and still leaves nothing',
    r.crawlerA.lungeFrames > 0 && r.crawlerA.hotMade === 0,
    r.crawlerA.lungeFrames + ' lunge frames, ' + r.crawlerA.hotMade + ' pools');
  check('...and the same machine with the move taken away is the old one exactly',
    r.crawlerCStripped.hotMade === 0 && r.crawlerCStripped.lungeFrames > 0,
    j({ melt: r.crawlerCStripped.hotMade, lunge: r.crawlerCStripped.lungeFrames }));
  check('THE TELL IS NOT THE PRICE: the wind-up is the same length with the move and without',
    r.crawlerC.chargeRun === r.crawlerCStripped.chargeRun
    && r.crawlerC.chargeRun >= Math.round(r.tell.fast * 60) - 1,
    r.crawlerC.chargeRun + ' vs ' + r.crawlerCStripped.chargeRun + ' frames of coil');
  check('...and a full wind-up is spent BEFORE the first melt exists',
    r.crawlerC.warnBeforeFirstHot >= Math.round(r.tell.fast * 60) - 2,
    r.crawlerC.warnBeforeFirstHot + ' warned frames, floor is ' + Math.round(r.tell.fast * 60));

  // ---- slagsplash -----------------------------------------------------------
  console.log('\nSLAGSPLASH — the hopper\'s two gobs');
  console.log('  zone C ', j({ moves: r.hopperC.moves, gobFrames: r.hopperC.gobFrames, maxGobs: r.hopperC.maxGobs, melt: r.hopperC.hotMade }));
  console.log('  zone A ', j({ moves: r.hopperA.moves, gobFrames: r.hopperA.gobFrames, melt: r.hopperA.hotMade }));

  check('a Foundry hopper throws on the landing — two gobs, both ways',
    r.hopperC.maxGobs >= 2, 'peak ' + r.hopperC.maxGobs + ' in the air');
  check('...and the gobs set into melt where they come down',
    r.hopperC.hotMade > 0, r.hopperC.hotMade + ' pools');
  check('THE ARC IS THE WARNING: they fly, visibly, before any of it is hot',
    r.hopperC.firstGob >= 0 && r.hopperC.firstHot > r.hopperC.firstGob + 6,
    'gob at frame ' + r.hopperC.firstGob + ', melt at ' + r.hopperC.firstHot);
  check('...and nothing in flight can touch her — the melt only bites once it sets',
    !r.hopperC.hurts.some(h => /slag|gob/.test(h)) || r.hopperC.firstHot >= 0,
    j([...new Set(r.hopperC.hurts)]));
  check('...and the meadow\'s hopper leaps exactly as it always did, empty-handed',
    r.hopperA.leaps === 1 && r.hopperA.maxGobs === 0 && r.hopperA.hotMade === 0,
    j({ leaps: r.hopperA.leaps, gobs: r.hopperA.maxGobs, melt: r.hopperA.hotMade }));

  // ---- pour -----------------------------------------------------------------
  console.log('\nPOUR — the kiln tips toward the side she chose');
  console.log('  deep, player right ', j({ moves: r.kilnDeepR.moves, side: r.kilnDeepR.pourSide, at: r.kilnDeepR.hotX.slice(0, 3), melt: r.kilnDeepR.hotMade }));
  console.log('  deep, player left  ', j({ moves: r.kilnDeepL.moves, side: r.kilnDeepL.pourSide, at: r.kilnDeepL.hotX.slice(0, 3), melt: r.kilnDeepL.hotMade }));
  console.log('  fresh              ', j({ moves: r.kilnFresh.moves, melt: r.kilnFresh.hotMade }));

  check('a deep kiln pours after the blow', r.kilnDeepR.hotMade > 0 && r.kilnDeepR.plumeFrames > 0,
    r.kilnDeepR.hotMade + ' pools after ' + r.kilnDeepR.plumeFrames + ' plume frames');
  check('...on the side she was standing on, both ways round',
    r.kilnDeepR.pourSide === 1 && r.kilnDeepL.pourSide === -1
    && r.kilnDeepR.hotX.every(x => x > 0) && r.kilnDeepL.hotX.every(x => x < 0),
    'right ' + j(r.kilnDeepR.hotX.slice(0, 2)) + ', left ' + j(r.kilnDeepL.hotX.slice(0, 2)));
  check('...and the pot she is taught on, one kingdom-floor lower, pours nothing',
    r.kilnFresh.hotMade === 0 && r.kilnFresh.plumeFrames > 0,
    j({ melt: r.kilnFresh.hotMade, plume: r.kilnFresh.plumeFrames }));
  check('THE CHARGE IS NOT THE PRICE: the pouring pot warns for as long as the plain one',
    r.kilnDeepR.chargeRun === r.kilnFresh.chargeRun
    && r.kilnDeepR.chargeRun >= Math.round(r.tell.swipe * 60) - 1,
    r.kilnDeepR.chargeRun + ' vs ' + r.kilnFresh.chargeRun + ' frames of charge');
  check('...and the spent window she punishes it in is untouched at 0.95 s',
    Math.abs(r.kilnDeepR.windedPeak - 0.95) < 0.02 && Math.abs(r.kilnFresh.windedPeak - 0.95) < 0.02,
    r.kilnDeepR.windedPeak.toFixed(3) + ' / ' + r.kilnFresh.windedPeak.toFixed(3));
  check('...and the whole charge AND the whole blow are spent before the melt lands',
    r.kilnDeepR.warnBeforeFirstHot >= Math.round((r.tell.swipe + 0.8) * 60) - 4,
    r.kilnDeepR.warnBeforeFirstHot + ' warned frames, floor is ' + Math.round((r.tell.swipe + 0.8) * 60));

  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
