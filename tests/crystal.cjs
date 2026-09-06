// THE PURIFIER, MEASURED. The crystal arc is a chain of promises — the first
// NPC hands it over, the tree grows a branch, the up-slash launches, the
// joined blade flies and COMES BACK — and every link is the kind of thing
// that reads fine in code and fails on screen. So each one is driven live:
//
//   - the gift: the first NPC's gift closure grants the flag and the card
//   - the tree: nodes EXIST only when their weapon does (7 -> 10 -> 11)
//   - the reach: a crystal swing's hitbox is measurably longer than a claw's
//   - the grammar: the grounded finisher rises (diagonal), up/down aim works
//   - the launcher: risecut throws an enemy upward off an up-slash
//   - the throw: with both ends and the skill, the finisher releases the
//     blade, it goes OUT, turns, returns, and is CAUGHT — and while it is
//     out the audio router says 'claw', because her paw is empty
//
//   node tests/crystal.cjs
const { chromium } = require('playwright');

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
  console.log('── crystal — the purifier: gift, tree, reach, grammar, launcher, throw');

  const m = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0B');   // the trader lives in his booth den now
    await new Promise(r => setTimeout(r, 600));
    G.wake = null; G.state = 'PLAY';

    // ---- the tree grows with the weapon --------------------------------
    out.pool0 = skillPool().length;
    // ---- the gift is a KIT, the crystal is EARNED ----------------------
    // the first NPC's gift closure, exactly as doInteract would fire it:
    // it must NOT hand over the crystal any more (the owner's rewrite — the
    // sword is forged from a shard she quarries, never given)
    NPC_GIFT['A0B|ratchet']();
    out.giftIsKit = invCount('kit') > 0 && !G.save.flags.crystal;
    G.dialog = null; G.state = 'PLAY';
    // ---- the quest exists and the FORGE pays it ------------------------
    const fq = questById('ratchet_forge');
    out.questExists = !!fq && fq.kind === 'fetch' && fq.item === 'cshard';
    out.deepWaits = (questById('ratchet_deep') || {}).after === 'ratchet_forge';
    qSet('ratchet_forge', 'active');
    G.save.bag = { cshard: 1 };
    questPay(fq);
    out.crystalAfterForge = !!G.save.flags.crystal;
    out.bagCleared = !(G.save.bag && G.save.bag.cshard);
    // the moment is either the FORGING CINEMATIC (the fired §1d film opens a
    // CUT) or, when the clip cannot run, the item card — both count
    out.cardShown = G.state === 'CUT' || !!G.cut || G.state === 'DIALOG' || !!(G.dialog);
    if (G.cut) { try { G.cut.v.pause(); } catch (e) {} G.cut = null; }
    G.dialog = null; G.state = 'PLAY';
    out.pool1 = skillPool().length;
    G.save.flags.crystal2 = 1;
    out.pool2 = skillPool().length;
    G.save.flags.crystal2 = 0;

    // ---- the quarry: the pillar ignores claws, shatters for the burst --
    G.save.flags.crystal = 0; delete G.save.bag;   // back to a pre-forge save
    loadRoom('CV3');
    await new Promise(r => setTimeout(r, 400));
    G.wake = null; G.state = 'PLAY'; G.hitStop = 0;
    const pil = G.statics.find(s => s.type === 'pillar');
    out.pillarExists = !!pil;
    if (pil) {
      player.x = pil.x - 30; player.y = pil.y + pil.h - player.h;
      player.on = true; player.vy = 0; player.face = 1;
      player.swing = null; player.atkCD = 0; player.combo = 0; player.comboT = 0;
      keys.KeyJ = true; keysP.KeyJ = true;
      update(1 / 30); update(1 / 30); update(1 / 30);
      for (const k in keys) keys[k] = false;
      out.pillarSurvivesClaw = G.statics.indexOf(pil) >= 0;
      player.swing = null; player.swingVis = null; G.hitStop = 0;
      player.volts = 99; player.chargeOk = true;
      player.releaseCharged();
      out.pillarShattered = G.statics.indexOf(pil) < 0;
      out.shardInBag = !!(G.save.bag && G.save.bag.cshard);
      out.pillarFlagSet = !!G.save.flags.pl_cshard;
      // ...and it does not grow back
      loadRoom('CV3');
      await new Promise(r => setTimeout(r, 200));
      out.pillarStaysDown = !G.statics.find(s => s.type === 'pillar');
      G.state = 'PLAY';
    }

    // ---- the depth door, round trip (the owner: it must be SOLID) ------
    delete G.save.flags.crystal2;
    loadRoom('A5');
    await new Promise(r => setTimeout(r, 300));
    G.wake = null; G.state = 'PLAY'; G.hitStop = 0;
    // GATE_ROOM rows may be ARRAYS now — a room can hold more than one depth
    // door (CV1 is the first: the way back to the meadow, and the buried side
    // passage into the Seam) — so the pair is read through gateDoors rather
    // than off the row. Reading .to off an array is how this test found the
    // change: it produced undefined, and player.x went NaN behind it.
    const dA5 = gateDoors('A5')[0], dCV = gateDoors('CV1').find(d => d.to === 'A5');
    out.doorPair = !!dA5 && dA5.to === 'CV1' && !!dCV && dCV.to === 'A5';
    player.x = G.roomDef.w * TILE * dA5.at - player.w / 2;
    player.on = true; player.vy = 0;
    // THE MOUTH IS BURIED (owner, 2026-08-23). It refuses UP until the pile is
    // down — that is the point of it — so the round trip starts with the blade.
    out.mouthRefusesBuried = !gateEnter() && !G.gateWalk;
    let nb = 0;
    while (G.rubble && G.rubble.hp > 0 && nb++ < 30) rubbleHit(rubbleBox(G.rubble), false);
    out.bladeOpensMouth = !!G.save.flags.rubbleA5;
    out.doorOpens = gateEnter();
    out.doorRefusesTwice = !gateEnter();          // no double-trigger mid-walk
    let n2 = 0;
    while (G.gateWalk && n2++ < 200) update(1 / 30);
    out.walkArrives = G.roomId === 'CV1';
    out.arriveInside = player.x > TILE && player.x < G.roomDef.w * TILE - TILE;
    // and straight back out
    player.x = G.roomDef.w * TILE * dCV.at - player.w / 2;
    player.on = true; player.vy = 0;
    out.doorBack = gateEnter();
    n2 = 0;
    while (G.gateWalk && n2++ < 200) update(1 / 30);
    out.walkReturns = G.roomId === 'A5';
    out.returnsAtMouth = Math.abs(player.x + player.w / 2 - G.roomDef.w * TILE * dA5.at) < 130;

    // ---- the rule: a guardian resolved reveals a cave ------------------
    // A4 is NULLFANG's lair. Before the flag: no door at the mouth. After:
    // the door exists, the walk enters the grotto and returns, and the map
    // sign logic (revealed door into a cave room) turns true.
    delete G.save.flags.bossGlitch;
    loadRoom('A4');
    await new Promise(r => setTimeout(r, 300));
    G.wake = null; G.state = 'PLAY'; G.hitStop = 0; G.bossEntry = null;
    const dA4 = GATE_ROOM.A4;
    player.x = G.roomDef.w * TILE * dA4.at - player.w / 2; player.on = true; player.vy = 0;
    out.lairClosed = !gateHere();
    G.save.flags.bossGlitch = 1;
    out.lairOpen = !!gateHere();
    // THE EVOLUTION CARD IS SPENT BEFORE SHE WALKS, THE WAY PLAY SPENDS IT.
    // Setting bossGlitch by hand is a shortcut past a whole guardian fight,
    // and it raises the evolution tier 0 -> 1 as a side effect. In play that
    // rise is consumed at the kill: onBossDead calls checkEvo with the card
    // held, the cut plays, the card is shown, and only later does she walk to
    // the grotto with the tier already banked. Here the rise was still pending
    // when the walk began, so checkEvo opened the card on the first update,
    // DIALOG replaced PLAY, and the walk stopped being simulated - 201 frames
    // and still in A4. Consume it here so the shortcut leaves the same state
    // the long way round would have.
    if (typeof checkEvo === 'function') checkEvo();
    G.item = null; G.dialog = null; G.state = 'PLAY';
    out.caveMarked = !!(ROOMS[dA4.to] && ROOMS[dA4.to].cave);
    out.enterGrotto = gateEnter();
    let n3 = 0;
    while (G.gateWalk && n3++ < 200) update(1 / 30);
    out.inGrotto = G.roomId === 'GA1';
    out.grottoPays = G.roomDef.ents.some(e => e[0] === 'scrap') && G.roomDef.ents.some(e => e[0] === 'bench');
    // every grotto pair is complete: lair door needs its boss, grotto door back
    out.allGrottoes = [['A4','GA1','bossGlitch'],['A10','GA2','alpha'],['B4','GB1','bossBrood'],
      ['C3','GC1','bossAtlas'],['D3','GD1','bossZero'],['X1','GX1','bossPrism'],['E3','GE1','bossMother']]
      .every(([a, g2, f]) => GATE_ROOM[a] && GATE_ROOM[a].to === g2 && GATE_ROOM[a].need === f
        && GATE_ROOM[g2] && GATE_ROOM[g2].to === a && ROOMS[g2] && ROOMS[g2].cave && MAPPOS[g2]);

    // ---- the aura sense ------------------------------------------------
    // crystal light in her possession = she glows white and the world shows
    // its allegiances (quiet halos). Counted from the light pass itself, on
    // real rendered frames: her + the room's machines while the sense is on,
    // and NOTHING once she carries no crystal light at all.
    G.save.flags.crystal = 1;
    loadRoom('A1');                              // a crawler, a guard, a dark NPC
    await new Promise(r => setTimeout(r, 500));
    G.wake = null; G.state = 'PLAY';
    await new Promise(r => setTimeout(r, 350));
    out.auraOn = (G._auraCount || 0) >= 3;
    out.auraOnCount = G._auraCount || 0;
    G.save.flags.crystal = 0; delete G.save.bag;
    await new Promise(r => setTimeout(r, 350));
    out.auraOff = (G._auraCount || 0) === 0;

    // ---- reach: same swing, longer box ---------------------------------
    const box = (wield, combo) => {
      player.swing = { ax: 1, ay: 0, ang: 0, combo, set: new Set(), wield, t: 0.1 };
      const b = player.hitbox(); player.swing = null;
      return b.w;
    };
    out.clawW = box(0, 0); out.cry1W = box(1, 0); out.cry2W = box(2, 0);

    // ---- grammar: press the button, read the swing ---------------------
    const K = (typeof KEYB !== 'undefined' && KEYB) || null;
    const press = (code) => { keys[code] = true; keysP[code] = true; };
    const step = () => update(1 / 30);
    const swingOf = async (setup) => {
      player.swing = null; player.swingVis = null;
      player.atkCD = 0; player.atkBuf = 0; player.combo = 0; player.comboT = 0;
      player.on = true; player.vy = 0; player.face = 1;
      G.hitStop = 0;   // a hit two lines ago must not freeze THIS press's frame
      if (setup) setup();
      press('KeyJ');                       // ATK default binding
      step();
      const s = player.swing ? { ax: player.swing.ax, ay: player.swing.ay, combo: player.swing.combo, wield: player.swing.wield } : null;
      player.swing = null; player.swingVis = null;
      for (const k in keys) keys[k] = false;
      return s;
    };
    // claw: flat finisher stays flat
    G.save.flags.crystal = 0;
    let s1 = await swingOf(() => { player.combo = 1; player.comboT = 0.5; });
    out.clawFin = s1 && { ay: s1.ay, wield: s1.wield };
    // crystal: the grounded finisher RISES
    G.save.flags.crystal = 1;
    s1 = await swingOf(() => { player.combo = 1; player.comboT = 0.5; });
    out.cryFin = s1 && { ay: s1.ay, combo: s1.combo, wield: s1.wield };
    // up-aim still aims up, first hit unchanged and flat
    s1 = await swingOf(() => { keys.ArrowUp = true; });
    out.cryUp = s1 && { ay: s1.ay, combo: s1.combo };
    s1 = await swingOf(() => {});
    out.cryOpen = s1 && { ay: s1.ay, combo: s1.combo };

    // ---- risecut: the up-slash launches --------------------------------
    G.save.skills.push('risecut');
    const foe = G.enemies.length ? G.enemies[0] : null;
    let launch = null;
    // a synthetic target right on top of her, so the up box catches it
    const dummy = { x: player.x, y: player.y - 40, w: 24, h: 24, vx: 0, vy: 0,
      hp: 999, dead: false, kind: 'crawler', kbT: 0, hurtT: 0,
      update() {}, draw() {}, die() { this.dead = true; } };
    G.enemies.push(dummy);
    player.swing = null; player.atkCD = 0; player.combo = 0; player.comboT = 0;
    keys.ArrowUp = true; press('KeyJ'); step(); step();
    launch = dummy.vy;
    out.launchVy = launch;
    G.enemies.pop(); keys.ArrowUp = false; for (const k in keys) keys[k] = false;
    player.swing = null; player.swingVis = null;

    // ---- the throw, out and back --------------------------------------
    G.save.flags.crystal2 = 1;
    G.save.skills.push('boomer');
    G.boomer = null;
    player.x = 300; player.y = 300; player.combo = 1; player.comboT = 0.5;
    player.atkCD = 0; player.atkBuf = 0; player.on = true; player.vy = 0; player.face = 1;
    // the risecut hit above raised G.hitStop — the world is frozen for a few
    // frames, and a press stepped into a frozen frame reaches nobody. This is
    // the game working as designed; the harness clears it because it is
    // testing the throw, not the freeze.
    G.hitStop = 0;
    press('KeyJ'); step();
    out.threwOnFinisher = !!G.boomer;
    out.audioWhileOut = (typeof wielded === 'function') ? wielded() : null;
    let maxDx = 0, returned = false, frames = 0;
    while (G.boomer && frames < 90) {                 // 3 seconds of sim
      step(); frames++;
      if (G.boomer) maxDx = Math.max(maxDx, Math.abs(G.boomer.x - (player.x + player.w / 2)));
    }
    returned = !G.boomer;
    out.flightRange = Math.round(maxDx);
    out.caught = returned;
    out.audioAfterCatch = (typeof wielded === 'function') ? wielded() : null;
    // no throw off the first beat of a chain
    G.boomer = null; player.combo = 0; player.comboT = 0; player.atkCD = 0;
    press('KeyJ'); step();
    out.noThrowOnOpener = !G.boomer && !!player.swing;
    player.swing = null; player.swingVis = null;
    return out;
  });

  // the tree, and the quest that grows it
  check('the bare tree has no crystal nodes', m.pool0 === 7, m.pool0 + ' nodes');
  check('the waking gift is a KIT — the crystal is never handed over', m.giftIsKit);
  check('the forge quest exists and gates ratchet\'s second errand',
    m.questExists && m.deepWaits);
  check('handing Ratchet the shard FORGES the crystal',
    m.crystalAfterForge && m.bagCleared && m.cardShown,
    'flag ' + m.crystalAfterForge + ', bag cleared ' + m.bagCleared + ', card ' + m.cardShown);
  check('the crystal grows the branch (+3)', m.pool1 === 10, m.pool1 + ' nodes');
  check('the joined blade opens the throw node (+1)', m.pool2 === 11, m.pool2 + ' nodes');
  // the quarry
  check('the pillar stands in the cave\'s last room', m.pillarExists);
  check('claws glance off it', m.pillarSurvivesClaw);
  check('the supercharged claw shatters it, into the bag',
    m.pillarShattered && m.shardInBag && m.pillarFlagSet,
    'down ' + m.pillarShattered + ', bag ' + m.shardInBag + ', flag ' + m.pillarFlagSet);
  check('...and it does not grow back', m.pillarStaysDown);
  // the depth door
  check('A5 and CV1 are a two-way door pair', m.doorPair);
  check('the first mouth is buried and refuses the walk', m.mouthRefusesBuried);
  check('...and the blade is what opens it', m.bladeOpensMouth);
  check('UP at the mouth opens the walk, and only once', m.doorOpens && m.doorRefusesTwice);
  check('the walk arrives inside the cave', m.walkArrives && m.arriveInside);
  check('and walks back out to the mouth', m.doorBack && m.walkReturns && m.returnsAtMouth,
    'back ' + m.doorBack + ', room ' + m.walkReturns + ', at mouth ' + m.returnsAtMouth);
  // the reveal rule
  check('a lair holds NO cave door before its guardian falls', m.lairClosed);
  check('...and grows one the moment it does', m.lairOpen && m.caveMarked);
  check('the revealed door walks into the grotto', m.enterGrotto && m.inGrotto);
  check('...which pays something (scrap and a rest)', m.grottoPays);
  check('every guardian has its grotto pair, cave-marked and on the map', m.allGrottoes);
  // the aura sense
  check('crystal light turns the aura sense ON (her + the machines)',
    m.auraOn, m.auraOnCount + ' halos');
  check('no crystal light, no halos', m.auraOff);
  // the reach
  check('the crystal out-reaches the claw, the joined blade more',
    m.cry1W > m.clawW && m.cry2W > m.cry1W,
    'claw ' + m.clawW + ' < crystal ' + m.cry1W + ' < joined ' + m.cry2W);
  // the grammar
  check('the claw finisher stays flat', m.clawFin && m.clawFin.ay === 0 && !m.clawFin.wield,
    JSON.stringify(m.clawFin));
  check('the crystal finisher RISES (diagonal cut)', m.cryFin && m.cryFin.combo === 2 && m.cryFin.ay < 0,
    JSON.stringify(m.cryFin));
  check('up-aim and the opener are untouched',
    m.cryUp && m.cryUp.ay === -1 && m.cryOpen && m.cryOpen.ay === 0 && m.cryOpen.combo === 0,
    'up ' + JSON.stringify(m.cryUp) + ', open ' + JSON.stringify(m.cryOpen));
  // the launcher
  check('risecut launches the target upward', m.launchVy < -300, 'vy ' + m.launchVy);
  // the throw
  check('the joined finisher releases the blade', m.threwOnFinisher);
  check('...and her paw sounds EMPTY while it flies', m.audioWhileOut === 'claw', m.audioWhileOut);
  check('it flies out a real distance', m.flightRange > 120, m.flightRange + 'px');
  check('and she catches it', m.caught && m.audioAfterCatch === 'crystal2',
    'caught ' + m.caught + ', audio ' + m.audioAfterCatch);
  check('the opener never throws', m.noThrowOnOpener);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — given, grown, longer, rising, launching, flying, and coming back');
})().catch(e => { console.error(e); process.exit(1); });
