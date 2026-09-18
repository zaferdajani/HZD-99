// KINGDOM D — THE ARCHIVES' THREE MOVES, MEASURED.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves
// that need to be created for them with every kingdom." This is kingdom D's
// answer, and this harness is the part of it that is not a claim: every one
// of the three moves is driven here in the real build and watched doing the
// thing its comment says it does.
//
// Four questions, and the third is the one that matters most:
//
//   1. Do the rows reach kingdom D and ONLY kingdom D? The registry is scoped
//      `@D` precisely so five sessions could write it at once; a move that
//      leaked into zone A would be another kingdom's bug, filed under mine.
//   2. Does the move actually FIRE — a card filed, a bar laid, a room told?
//      "Anything claimed is measured" is this repo's culture and a move that
//      only exists in a comment is the thing it is aimed at.
//   3. Is every one of them WARNED? This file's law: "an enemy is never
//      harder because it warned you less." So the numbers are taken: the
//      card is on the floor for CARD_TELL + the coil's own tell before it can
//      touch her, the bar is harmless for the whole of BLOT_SETTLE, the sweep
//      lands after CROSSREF_TELL, and no telegraph anywhere gets shorter.
//   4. Does a machine WITHOUT the move behave exactly as it does today? Five
//      kingdoms share this roster; a crawler in the meadow must not change
//      because the Archives learned something.
//
//   node tests/archives.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── archives — kingdom D files, strikes out and cross-references, and warns before each\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof foeMovesFor === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));

    // ---- 1. the rows, and where they reach ---------------------------------
    // zone D's floor is level 4 = 3 points, so this is what an Archives
    // machine lands with on a fresh save; the deep coil is level 6.
    out.rimeD = foeMovesFor('rime', 4, 'D');
    out.rimeDdeep = foeMovesFor('rime', 6, 'D');
    out.turretD = foeMovesFor('turret', 4, 'D');
    out.guardD = foeMovesFor('guard', 4, 'D');
    // ...and nothing of kingdom D's reaches anybody else's kingdom
    out.leak = ['A', 'B', 'C', 'E', 'X'].map(z =>
      foeMovesFor('rime', 7, z).concat(foeMovesFor('turret', 7, z), foeMovesFor('guard', 7, z))
    ).reduce((a, b) => a.concat(b), []);
    // the unscoped rows belong to the integrator and this session wrote none
    out.unscopedUntouched = !FOE_MOVES.rime && !FOE_MOVES.turret
      && !FOE_MOVES.guard && !FOE_MOVES.crawler;
    // the two copied constants, which exist only because a top-level const
    // cannot read one declared below it in the concatenated build
    out.cardTellMatches = CARD_TELL === TELL_HEAVY;
    out.blotSettleMatches = BLOT_SETTLE === TELL_SWIPE;
    out.crossrefTellMatches = CROSSREF_TELL === TELL_SWIPE;

    // a controlled arena: A0's flat floor, flying kingdom D's flag, so the
    // machines spawn Archives-side while the terrain stays something the
    // harness can put a player on (the same trick tests/combat.cjs uses)
    const FLOOR = 15 * TILE;
    const arena = (zone) => {
      G.roomDef.zone = zone; G.enemies.length = 0; G.projs.length = 0;
      G.pools = []; G.dmgLog = {};
      player.x = 300; player.y = FLOOR - player.h; player.vx = 0; player.vy = 0;
      player.dead = false; player.on = true; player.iT = 999;
    };
    const hold = (x) => {
      player.x = x; player.y = FLOOR - player.h; player.vx = 0; player.vy = 0;
      player.on = true; player.dead = false;
    };

    // ---- 2. RECALL: the card is filed where she STOOD, and it is on the
    // floor, visible and harmless, long before it is ever real ---------------
    arena('D');
    const rime = new Enemy('rime', 320, FLOOR - EKIND.rime.h);
    rime.moves = ['recall']; rime.atkCD = 0.02; rime.iq = 0;
    G.enemies.push(rime);
    let filedAt = -1, armedAt = -1, snapAt = -1, cardSnapAt = -1, dormantFrames = 0;
    let filedX = null, standX = 260;
    for (let f = 0; f < 400; f++) {
      hold(standX);
      player.iT = 999;                       // untouchable: this pass measures TIMING only
      rime.update(1 / 60);
      if (rime.card && filedAt < 0) { filedAt = f; filedX = rime.card.x; }
      if (rime.card && !rime.card.armed) dormantFrames++;
      if (rime.card && rime.card.armed && armedAt < 0) armedAt = f;
      if ((rime.windedT || 0) > 0 && snapAt < 0) snapAt = f;
      if ((rime.cardSnapT || 0) > 0 && cardSnapAt < 0) { cardSnapAt = f; break; }
      // she leaves the moment the coil starts charging — the honest answer to
      // the first circle, and the one the card is built to punish later
      if (filedAt >= 0 && f > filedAt + 6) standX = 560;
    }
    out.filed = filedAt >= 0;
    out.filedOnHerGround = filedX != null && Math.abs(filedX - (260 + player.w / 2)) < 30;
    out.armedOnlyAfterSnap = armedAt > 0 && snapAt > 0 && armedAt >= snapAt;
    out.cardWarnedFor = +((cardSnapAt - filedAt) / 60).toFixed(2);
    out.cardDormantFor = +(dormantFrames / 60).toFixed(2);
    out.cardFired = cardSnapAt > 0;

    // ...and it HITS the ground she left, while missing the ground she took
    const recallHit = (stayPut) => {
      arena('D');
      const e = new Enemy('rime', 320, FLOOR - EKIND.rime.h);
      e.moves = ['recall']; e.atkCD = 0.02; e.iq = 0;
      G.enemies.push(e);
      let sx = 250, left = false;
      for (let f = 0; f < 400; f++) {
        hold(sx);
        // outside the coil's own circle from the moment it snaps, so the only
        // thing that can log damage here is the filed card
        player.iT = (e.windedT || 0) > 0 || (e.card && e.card.armed) ? 0 : 999;
        e.update(1 / 60);
        if (e.card) left = true;
        if (left) sx = stayPut ? 600 : 250;  // away for good, or back onto the filed ground
        if ((e.cardSnapT || 0) > 0) break;
      }
      return (G.dmgLog['rime.recall'] | 0);
    };
    out.recallHitsTheGroundSheLeft = recallHit(false) > 0;
    out.recallMissesIfSheStaysAway = recallHit(true) === 0;

    // ---- ERASURE: the deep coil does not only fetch the place she was, it
    // strikes it out — and the floor it leaves takes its own settle first ----
    arena('D');
    const deep = new Enemy('rime', 320, FLOOR - EKIND.rime.h);
    deep.moves = ['recall', 'erasure']; deep.atkCD = 0.02; deep.iq = 0;
    G.enemies.push(deep);
    let erasureSettle = 0, erasureHurtWhileSettling = 0, erasureBit = 0, sawBar = false;
    for (let f = 0; f < 500; f++) {
      hold(250);
      player.iT = 0;
      const b = deep.blot;
      if (b) {
        sawBar = true;
        player.x = b.x - player.w / 2;
        if (b.t > BLOT_SETTLE + 0) { /* fallthrough */ }
      }
      const before = (G.dmgLog['rime.erasure'] | 0);
      deep.update(1 / 60);
      const b2 = deep.blot;
      if (b2 && b2.t > BLOT_LIVE) {
        erasureSettle++;
        if ((G.dmgLog['rime.erasure'] | 0) > before) erasureHurtWhileSettling++;
      } else if (b2 && (G.dmgLog['rime.erasure'] | 0) > before) erasureBit++;
    }
    out.erasureLaid = sawBar;
    out.erasureSettleFor = +(erasureSettle / 60).toFixed(2);
    out.erasureHarmlessWhileSettling = erasureHurtWhileSettling === 0;
    out.erasureBites = erasureBit > 0;

    // ---- ...and a rime WITHOUT the move is the rime that shipped -----------
    arena('D');
    const plain = new Enemy('rime', 320, FLOOR - EKIND.rime.h);
    plain.moves = []; plain.atkCD = 0.02; plain.iq = 0;
    G.enemies.push(plain);
    let plainTell = 0, plainSnap = -1;
    for (let f = 0; f < 300; f++) {
      hold(280); player.iT = 999;
      plain.update(1 / 60);
      if ((plain.crouchT || 0) > 0) plainTell++;
      if ((plain.windedT || 0) > 0 && plainSnap < 0) plainSnap = f;
    }
    out.plainNoCard = !plain.card && !plain.blot && (plain.cardSnapT || 0) === 0;
    out.plainTellIntact = +(plainTell / 60).toFixed(2);
    out.plainStillSnaps = plainSnap > 0;

    // ---- 3. REDACT: one bar a volley, pale and harmless while it settles ---
    arena('D');
    const tur = new Enemy('turret', 700, FLOOR - EKIND.turret.h);
    tur.moves = ['redact']; tur.iq = 0; tur.t = 0.02;
    G.enemies.push(tur);
    let blots = 0, liveSeen = 0, settleFrames = 0, hurtDuringSettle = 0, everBit = 0;
    let lastBlot = null;
    for (let f = 0; f < 700; f++) {
      hold(300);
      player.iT = 0;                          // standable: the bar may bite
      const before = (G.dmgLog['turret.redact'] | 0);
      tur.update(1 / 60);
      const b = tur.blot;
      if (b && b !== lastBlot) { blots++; lastBlot = b; }
      if (b && b.t > BLOT_LIVE) {
        settleFrames++;
        // park her ON it while it is still settling: nothing may happen
        player.x = b.x - player.w / 2;
        if ((G.dmgLog['turret.redact'] | 0) > before) hurtDuringSettle++;
      } else if (b) {
        liveSeen++;
        player.x = b.x - player.w / 2;
        if ((G.dmgLog['turret.redact'] | 0) > before) everBit++;
      }
    }
    out.blotsLaid = blots;
    out.blotSettleSeen = +(settleFrames / Math.max(1, blots) / 60).toFixed(2);
    out.blotHarmlessWhileSettling = hurtDuringSettle === 0;
    out.blotBites = everBit > 0;
    out.onlyOneBarAtATime = !!tur.blot && !Array.isArray(tur.blot);

    // ...and it is grounded-only: being off the floor is the answer
    arena('D');
    const tur2 = new Enemy('turret', 700, FLOOR - EKIND.turret.h);
    tur2.moves = ['redact']; tur2.iq = 0; tur2.t = 0.02;
    G.enemies.push(tur2);
    let airborneOverBar = 0;
    for (let f = 0; f < 700; f++) {
      hold(300); player.iT = 0;
      // OVER it before the machine steps, not after — the whole point is that
      // she is off the floor on the frame the bar is asked whether it bit
      const b = tur2.blot;
      if (b) {
        player.x = b.x - player.w / 2; player.on = false; player.y = b.y - 120;
        if (b.t <= BLOT_LIVE) airborneOverBar++;
      }
      tur2.update(1 / 60);
    }
    out.blotJumpable = (G.dmgLog['turret.redact'] | 0) === 0;
    out.blotJumpableWasTested = airborneOverBar > 30;

    // ---- ...and a turret without the move never lays one -------------------
    arena('D');
    const tur3 = new Enemy('turret', 700, FLOOR - EKIND.turret.h);
    tur3.moves = []; tur3.iq = 0; tur3.t = 0.02;
    G.enemies.push(tur3);
    let plainShots = 0;
    for (let f = 0; f < 700; f++) {
      hold(300); player.iT = 999;
      const n = G.projs.length;
      tur3.update(1 / 60);
      if (G.projs.length > n) plainShots++;
    }
    out.plainTurretNoBlot = !tur3.blot;
    out.plainTurretStillShoots = plainShots > 0;

    // ---- 4. CROSSREF: the sweep lands, the room's REST closes up, and not
    // one telegraph in it gets shorter --------------------------------------
    arena('D');
    const gd = new Enemy('guard', 380, FLOOR - EKIND.guard.h);
    gd.moves = ['crossref']; gd.iq = 0; gd.refCD = 0;
    const idle = new Enemy('crawler', 520, FLOOR - EKIND.crawler.h);
    idle.moves = []; idle.atkCD = 9;
    const winding = new Enemy('crawler', 560, FLOOR - EKIND.crawler.h);
    winding.moves = []; winding.atkCD = 9; winding.coilT = TELL_FAST;
    const faraway = new Enemy('crawler', 380 + CROSSREF_R + 120, FLOOR - EKIND.crawler.h);
    faraway.moves = []; faraway.atkCD = 9;
    G.enemies.push(gd, idle, winding, faraway);
    let sweepFrames = 0, sweptAt = -1, idleAtCall = null;
    for (let f = 0; f < 120; f++) {
      hold(340); player.iT = 999;
      const beforeIdle = idle.atkCD;
      gd.update(1 / 60);
      if ((gd.refT || 0) > 0) sweepFrames++;
      if (idle.atkCD < beforeIdle - 0.1 && sweptAt < 0) { sweptAt = f; idleAtCall = idle.atkCD; }
    }
    out.sweepSeen = sweepFrames > 0;
    out.sweepLength = +(sweepFrames / 60).toFixed(2);
    out.callLanded = sweptAt > 0;
    out.calledRestNeverBelowFloor = idleAtCall == null || idleAtCall >= CROSSREF_FLOOR - 1e-6;
    out.midTellNeverPulled = winding.coilT === TELL_FAST && winding.atkCD > CROSSREF_FLOOR + 1;
    out.outOfEarshotNeverPulled = faraway.atkCD > CROSSREF_FLOOR + 1;
    out.calledMachineIsMarked = (idle.refd || 0) > 0;
    // the law, stated as a number: the call moved REST, never a telegraph
    out.tellsUnchanged = TELL_FAST === 0.35 && TELL_SWIPE === 0.5 && TELL_HEAVY === 0.7;

    // ---- ...and a guard outside the Archives never sweeps ------------------
    arena('A');
    const gdA = new Enemy('guard', 380, FLOOR - EKIND.guard.h);
    const mate = new Enemy('crawler', 520, FLOOR - EKIND.crawler.h);
    mate.atkCD = 9;
    G.enemies.push(gdA, mate);
    for (let f = 0; f < 200; f++) { hold(340); player.iT = 999; gdA.update(1 / 60); }
    out.meadowGuardHasNoMove = !gdA.hasMove('crossref');
    out.meadowGuardNeverSweeps = !(gdA.refT > 0) && mate.atkCD > CROSSREF_FLOOR + 1;

    // ---- and the whole kingdom, spawned as the world spawns it -------------
    loadRoom('D2');
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));
    out.d2Kinds = G.enemies.map(e => e.kind).join(',');
    out.d2Moves = G.enemies.map(e => e.kind + ':' + (e.moves || []).join('+')).join(' ');
    out.d2EveryArchivesMachineArmed = G.enemies
      .filter(e => ['rime', 'turret', 'guard'].indexOf(e.kind) >= 0)
      .every(e => (e.moves || []).length > 0);
    return out;
  });

  check('the Archives coil files a record, and the deep one strikes it out',
    r.rimeD.join() === 'recall' && r.rimeDdeep.join() === 'recall,erasure',
    'lv4 [' + r.rimeD + ']  lv6 [' + r.rimeDdeep + ']');
  check('the Archives turret redacts, the Archives guard cross-references',
    r.turretD.join() === 'redact' && r.guardD.join() === 'crossref',
    '[' + r.turretD + '] [' + r.guardD + ']');
  check('...and none of it reaches another kingdom', r.leak.length === 0, r.leak.join());
  check('...and no unscoped row was touched — the shared layer is the integrator\'s',
    r.unscopedUntouched);
  check('the copied tell constants still equal the originals they copy',
    r.cardTellMatches && r.blotSettleMatches && r.crossrefTellMatches);

  check('RECALL files the ground she was standing on', r.filed && r.filedOnHerGround);
  check('...and the card lies dormant until the coil\'s own circle has snapped',
    r.armedOnlyAfterSnap && r.cardDormantFor >= 0.6,
    'dormant ' + r.cardDormantFor + 's');
  check('...so the second circle is warned for longer than the first, never less',
    r.cardFired && r.cardWarnedFor >= 1.4, r.cardWarnedFor + 's of floor to read');
  check('...and it takes the ground she left', r.recallHitsTheGroundSheLeft);
  check('...and nothing at all if she never goes back', r.recallMissesIfSheStaysAway);
  check('ERASURE strikes out the ground the card fetched', r.erasureLaid);
  check('...and that floor is harmless for the whole of its own settle',
    r.erasureHarmlessWhileSettling && r.erasureSettleFor >= 0.4,
    r.erasureSettleFor + 's settling');
  check('...and then it costs her', r.erasureBites);
  check('a coil without the move is the coil that shipped',
    r.plainNoCard && r.plainStillSnaps && r.plainTellIntact > 0.6,
    'tell ' + r.plainTellIntact + 's');

  check('REDACT lays a bar, one to a volley', r.blotsLaid > 0 && r.onlyOneBarAtATime,
    r.blotsLaid + ' laid');
  check('...and it is pale and harmless for the whole of its settle',
    r.blotHarmlessWhileSettling && r.blotSettleSeen >= 0.4,
    r.blotSettleSeen + 's settling');
  check('...and then the floor really does cost her', r.blotBites);
  check('...and being off the floor is the answer',
    r.blotJumpable && r.blotJumpableWasTested,
    r.blotJumpableWasTested ? '' : 'never actually stood over a live bar');
  check('a turret without the move still shoots and never redacts',
    r.plainTurretNoBlot && r.plainTurretStillShoots);

  check('CROSSREF sweeps before it lands', r.sweepSeen && r.sweepLength >= 0.4,
    r.sweepLength + 's sweep');
  check('...and the call closes the room\'s rest', r.callLanded);
  check('...but never below the floor — a called room still arrives one tell at a time',
    r.calledRestNeverBelowFloor);
  check('...never pulls a machine that is already winding up', r.midTellNeverPulled);
  check('...never reaches past earshot', r.outOfEarshotNeverPulled);
  check('...and shows on whoever it told', r.calledMachineIsMarked);
  check('...and moved no telegraph anywhere', r.tellsUnchanged);
  check('a guard in the meadow has none of this', r.meadowGuardHasNoMove && r.meadowGuardNeverSweeps);

  check('D2 spawns the kingdom armed', r.d2EveryArchivesMachineArmed, r.d2Moves);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
