// The waking floor, all the way through.
//
// The opening teaches a CHAIN, in the owner's order (2026-10-09): the booth,
// the letter, his battery, the repair, the explanation, the pod that saves,
// the Volt Pack explained and paid for, the first surge mended, the jammed
// winch struck and burst, the monument, the road. A chain that long is exactly
// the kind of thing that silently breaks at link four and is never noticed,
// because nobody replays a tutorial. So it is walked here, step by step,
// every run (tests/opening-order.cjs plays the same walk with real keys).
//
// Each step is driven the way a player would drive it, and the harness asserts
// the step ADVANCED rather than that the input was accepted.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  // a fresh run, with the tutorial NOT already flagged done
  await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99;
    // starts where the game starts: in the cradle, with the release skipped so
    // the harness is measuring the LESSON and not the two-second hold
    sv.bench = { room: 'W1', x: 3 * 32, y: 13 * 32 };
    sv.flags = sv.flags || {}; sv.flags.woke = 1;
    startGame(sv);
  });
  await p.waitForTimeout(900);

  const step = () => p.evaluate(() => {
    const T = G.tut;
    return T ? { i: T.i, id: (TUT_STEPS[T.i] || {}).id } : null;
  });
  const log = [];
  const first = await step();
  log.push('start: ' + JSON.stringify(first));

  // Drives one step to completion by doing what it asks, then waits for the
  // step index to move. Never more than a couple of seconds per step.
  // 150 tries at 60 ms rather than 60 at 120: the same wall clock on a step
  // that stalls, two and a half times the attempts on a step that is merely
  // slow. Under the full suite a dozen browsers share four cores and the
  // game's own frame rate is what runs short, not the lesson.
  async function drive(id, action) {
    for (let tries = 0; tries < 150; tries++) {
      const s = await step();
      if (!s) break;
      if (s.id !== id) return s.id;            // already past it
      await p.evaluate(action);
      await p.waitForTimeout(60);
    }
    return (await step() || {}).id;
  }

  const seen = [];
  const record = async (id) => { seen.push(id); };

  await record('move');
  let now = await drive('move', () => { player.vx = 200; player.x += 3; });
  await record(now);
  // THE WALK TO THE CITY now sits between the first verb and the second: the
  // lesson runs across three rooms (cradle -> road -> meadow), and the two
  // steps that carry her between them are completed by GOING, not by pressing.
  now = await drive('out', () => { loadRoom('W2'); });
  await record(now);
  // THE JUMP IS TAUGHT AT THE SHELF, NOT IN THE AIR. Since the enforcement
  // layer (js/tutorial_enforce.js, 2026-09-10) the lesson only counts once
  // its prompt has been READY — her on the ground in W2 within reach of the
  // row-11 shelf (tutJumpAtObstacle) — which sets G.tut.jumpShown. Tossing
  // her upward from wherever she stood never got there, and this harness
  // sat at "jump, jump, jump" for nine days while the lessons behind it went
  // unmeasured. Walk her under the shelf, let a frame see it, then jump.
  now = await drive('jump', () => {
    if (G.roomId !== 'W2') { loadRoom('W2'); return; }
    if (!G.tut || !G.tut.jumpShown) {
      let spot = null;
      for (let ty = 2; ty < G.roomDef.h - 2 && !spot; ty++) for (let tx = 2; tx < G.roomDef.w - 2 && !spot; tx++) {
        if (tileAt(tx, ty) !== '=') continue;
        let fy = ty + 1; while (fy < G.roomDef.h - 1 && !solidAt(tx, fy)) fy++;
        const rise = (fy - ty) * TILE;
        if (rise >= 64 && rise <= 180) spot = { tx, feet: fy * TILE };
      }
      if (spot) { player.x = spot.tx * TILE + 16 - player.w / 2; player.y = spot.feet - player.h; }
      player.on = true; player.vx = 0; player.vy = 0;
      return;
    }
    player.on = false; player.vy = -300;
  });
  await record(now);
  now = await drive('gate', () => { loadRoom('A0'); });
  await record(now);
  // ---- THE DEN (owner, 2026-10-09): booth -> letter -> drawer -> repair ->
  // explanation -> pod -> Volt Pack -> heal, then the winch, the monument and
  // the road. Every window is paged the way a player pages it (Enter), every
  // control is the real one; nothing is granted by the harness.
  // a reader's pace (js/overlay.js): a press every frame is a mash and turns
  // no page; one every third of a second reads it through
  const page = () => { for (let i = 0; i < 900 && G.state === 'DIALOG'; i++) { if (i % 10 === 0) { keysP['Enter'] = 1; keys['Enter'] = 1; } update(1 / 30); keys['Enter'] = 0; keysP['Enter'] = 0; } };
  const ratchet = 'G.statics.find(s => s.type === "npc" && s.extra === "ratchet")';
  now = await drive('booth', () => {
    // (inside, the den's own way out is a booth-style door too: stand still)
    if (G.roomId !== 'A0') { update(1 / 60); return; }
    const gr = gateDoors().find(d => d.style === 'booth');
    if (gr && G.state === 'PLAY' && !G.gateWalk) {
      player.x = gateWorldX(gr) - player.w / 2; player.vx = 0; player.on = true;
      keysP.ArrowUp = 1; keys.ArrowUp = 1; update(1 / 60); keys.ArrowUp = 0; keysP.ArrowUp = 0;
    }
    for (let i = 0; i < 80 && G.gateWalk; i++) update(1 / 10);
  });
  await record(now);
  // (never while a door walk is still carrying her: she cannot act in one)
  const near = (sel) => `(() => { if (G.gateWalk) { for (let i = 0; i < 80 && G.gateWalk; i++) update(1 / 10); return; } const s = ${sel}; if (!s) return; player.x = s.x + s.w / 2 - player.w / 2; player.vx = 0; player.on = true; update(1 / 60); return s; })()`;
  now = await drive('note', new Function(`if (G.state === 'DIALOG') { (${page})(); return; } const s = ${near(ratchet)}; if (s && G.state === 'PLAY') doInteract(s);`));
  await record(now);
  const letterRead = await p.evaluate(() => !!G.save.flags.opNote);
  now = await drive('drawer', new Function(`if (G.state === 'DIALOG') { (${page})(); return; } const s = ${near('G.statics.find(s => s.type === "chest" && s.extra === "it:batt")')}; if (s && G.state === 'PLAY') doInteract(s);`));
  await record(now);
  now = await drive('repair', new Function(`
    if (G.state === 'DIALOG') { (${page})(); return; }
    if (G.state === 'REPAIR') {
      for (const [piece, target] of [['cell', 'socket'], ['positive', 'plus'], ['negative', 'minus'], ['bridge', 'relay']]) {
        const a = document.querySelector('[data-piece="' + piece + '"]'), b = document.querySelector('[data-target="' + target + '"]');
        if (a && !a.disabled && !a.hidden) a.click(); if (b) b.click();
      }
      const pw = document.querySelector('.repair-power'); if (pw && !pw.disabled) pw.click();
      for (let i = 0; i < 120 && G.state === 'REPAIR'; i++) update(1 / 60);
      return;
    }
    if (G.state === 'CUT') { for (let i = 0; i < 120 && G.state === 'CUT'; i++) { keys['Enter'] = 1; keysP['Enter'] = i === 0 ? 1 : 0; update(1 / 30); } keys['Enter'] = 0; return; }
    const s = ${near(ratchet)}; if (s && G.state === 'PLAY') doInteract(s);`));
  await record(now);
  const woke = await p.evaluate(() => ({ live: npcLive(G.statics.find(s => s.extra === 'ratchet')), spare: invCount('batt'), kit: invCount('kit'), quest: qState('ratchet_forge') }));
  now = await drive('pod', new Function(`
    if (G.state === 'DIALOG') { (${page})(); return; }
    if (!G.recharge) { const s = ${near('G.statics.find(s => s.type === "bench")')}; if (s && G.state === 'PLAY') doInteract(s); }
    for (let i = 0; i < 400 && (G.recharge || !opPodSettled()); i++) update(1 / 30);`));
  await record(now);
  const saved = await p.evaluate(() => ({ bench: G.save.bench && G.save.bench.room, stored: JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).bench.room }));
  const scrapBefore = await p.evaluate(() => G.save.scrap);
  let scrapAfter = null, pitch = null;
  now = await drive('pack', new Function(`
    if (G.state === 'SHOP') { window.__scrapAtShop = G.save.scrap; window.__row = SHOP[G.shopIdx].type; keysP['Enter'] = 1; keys['Enter'] = 1; update(1 / 60); keys['Enter'] = 0; return; }
    if (G.state === 'DIALOG') { window.__pitch = window.__pitch || G.dialog.lines.join(' '); (${page})(); return; }
    const s = ${near(ratchet)}; if (s && G.state === 'PLAY') doInteract(s);`));
  await record(now);
  scrapAfter = await p.evaluate(() => window.__scrapAtShop); pitch = await p.evaluate(() => ({ text: window.__pitch, row: window.__row }));
  const bought = await p.evaluate(() => ({ volts: player.volts, scrap: G.save.scrap, flag: !!G.save.flags.tutBuy, heal: !!G.save.flags.heal }));
  // the scripted first surge should already have landed when the step opened
  await p.evaluate(() => { for (let i = 0; i < 4 && G.state === 'DIALOG'; i++) { keysP['Enter'] = 1; keys['Enter'] = 1; update(1 / 30); keys['Enter'] = 0; } for (let i = 0; i < 60; i++) update(1 / 60); });
  const hurtTo = await p.evaluate(() => ({ cores: player.cores, max: player.maxCores() }));
  now = await drive('heal', () => {
    if (G.state !== 'PLAY') return;
    keys.KeyF = 1; for (let i = 0; i < 90; i++) update(1 / 60); keys.KeyF = 0; update(1 / 60);
  });
  await record(now);
  // THE OTHER THING THE PACK BOUGHT, and before it: holding the claw is an
  // ordinary attack (measured with the pack switched back off for a moment).
  const burstLock = await p.evaluate(() => {
    const had = G.save.flags.heal; G.save.flags.heal = 0; const tut = G.save.flags.tut; G.save.flags.tut = 0;
    player.volts = 99; player.chargeT = 0;
    keys.KeyX = 1; keysP.KeyX = 1;
    for (let i = 0; i < 30; i++) player.update(1 / 60);
    const locked = player.chargeT;
    keys.KeyX = 0; keysP.KeyX = 0; player.update(1 / 60);
    G.save.flags.heal = had; G.save.flags.tut = tut;
    return { locked, had: !!had };
  });
  // out of the den by its own door, to the jammed winch
  const toWinch = () => {
    if (G.roomId === 'A0B' && G.state === 'PLAY' && !G.gateWalk) {
      const d = gateDoors()[0]; player.x = gateWorldX(d) - player.w / 2; player.vx = 0; player.on = true;
      keysP.ArrowUp = 1; keys.ArrowUp = 1; update(1 / 60); keys.ArrowUp = 0; keysP.ArrowUp = 0;
      for (let i = 0; i < 80 && G.gateWalk; i++) update(1 / 10);
      return null;
    }
    const e = G.enemies.find(x => x && !x.dead && !x.disabled);
    if (e) { player.x = e.x + e.w / 2 - player.w / 2 + 40; player.vx = 0; player.on = true; update(1 / 60); }
    return e;
  };
  now = await drive('atk', new Function(`const e = (${toWinch})(); if (!e) return; keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keys.KeyX = 0; for (let i = 0; i < 20; i++) update(1 / 60);`));
  await record(now);
  const winchCalm = await p.evaluate(() => { const e = G.enemies.find(x => x && x.mechanism === 'winch'); return e ? { calm: !!e.calm, phase: e.phase } : null; });
  now = await drive('burst', new Function(`
    if (G.save.flags.opBurst) { update(1 / 60); return; }
    const e = (${toWinch})(); if (!e) return;
    keys.KeyX = 1; keysP.KeyX = 1; for (let i = 0; i < 45; i++) update(1 / 60);
    keys.KeyX = 0; for (let i = 0; i < 4; i++) update(1 / 60);`));
  await record(now);
  const winchDown = await p.evaluate(() => { const e = G.enemies.find(x => x && x.mechanism === 'winch'); return e ? !!e.disabled : null; });
  now = await drive('node', () => {
    if (G.state === 'TRIAL') { triNodeAnswer(true); return; }
    if (G.state === 'DIALOG') return;
    const n = G.statics.find(s => s.type === 'riddle' && !s.opened);
    if (n) { player.x = n.x + n.w / 2 - player.w / 2; player.vx = 0; player.on = true; update(1 / 60); doInteract(n); }
  });
  await record(now);

  // ---- THE WALK CANNOT BE SKIPPED BY LEAVING THE ROOM --------------------
  //
  // The owner walked past the machine into the shop and the guide let him:
  // "the walk through allows the player to pass the first enemy that needs to
  // be attacked, keep going to the shop, pass the shop without even attacking
  // it... and if I press attack inside the shop, the system considers it as if
  // I attacked the enemy anyway." Two holes, both from a step reading global
  // state: `no live enemies` is true in every room that never had one, and a
  // swing is a swing wherever it happens.
  //
  // So this drives the escape he actually found: stand at the kill step, go
  // into the booth, swing there, and check the ladder has not moved. And it
  // checks the booth is not even reachable that early — a door is a control,
  // and an untaught control does not exist.
  const skip = await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99;
    startGame(sv); loadRoom('A0');
    G.dialog = null; G.state = 'PLAY'; G.toasts = [];
    updateTutor(1 / 60);   // startGame resets G.tut to null; give it its lazy init
    const at = (id) => TUT_STEPS.findIndex(q => q.id === id);
    G.tut.i = at('gate'); G.tut.t = 1; G.tut.hold = 0;
    const boothEarly = gateDoors('A0').length;          // must be 0: not built yet
    // a swing in the den does not finish the strike lesson at the winch
    G.tut.i = at('atk'); G.tut.t = 1; G.tut.hold = 0;
    loadRoom('A0B'); G.state = 'PLAY'; G.dialog = null;
    player.swing = { t: 0.2, t0: 0.2, combo: 1 };
    const iAtk = G.tut.i;
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const atkHeld = G.tut.i === iAtk && !G.tut.hold;
    player.swing = null;
    // ...nor does insight earned anywhere but the monument's floor
    G.tut.i = at('node'); G.tut.t = 1; G.tut.hold = 0; G.save.iq = 10;
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const nodeHeld = G.tut.i === at('node') && !G.tut.hold;
    G.save.iq = 0;
    // ...and the same swing in the room that teaches it DOES count
    loadRoom('A0'); G.state = 'PLAY'; G.dialog = null;
    G.tut.i = at('atk'); G.tut.t = 1; G.tut.hold = 0;
    player.swing = { t: 0.2, t0: 0.2, combo: 1 };
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const atkCounts = G.tut.i > at('atk') || G.tut.hold > 0;
    player.swing = null;
    // ...and the booth exists once the lesson that sends her in begins
    G.tut.i = at('booth'); G.tut.t = 1; G.tut.hold = 0;
    const boothLater = gateDoors('A0').length;
    return { boothEarly, killHeld: nodeHeld, atkHeld, atkCounts, boothLater };
  });
  // and the door: held shut until the last lesson, open after it
  const door = await p.evaluate(() => {
    // The skip-block above leaves G.tut mid-walk on its own errand; drive
    // this check on the last lesson explicitly rather than on whatever step
    // a prior block happened to leave behind.
    G.tut.i = TUT_LAST; G.tut.t = 1; G.tut.hold = 0;
    const before = G.tut.opened;
    player.x = (G.roomDef.w - 1) * 32;
    updateTutor(0.016);
    return { opened: !!G.tut.opened, before: !!before, i: G.tut.i, last: TUT_LAST };
  });

  // THE LESSON SURVIVES A RELOAD, AND ONLY EVER MOVES FORWARD. The owner
  // picked his save up at the booth and was taught MOVE, OUT and JUMP again
  // inside the shop he had just bought from: G.tut lived in memory and a
  // reload started it at zero. The step index is in the save now.
  const resume = await p.evaluate(() => {
    const at = (id) => TUT_STEPS.findIndex(q => q.id === id);
    loadRoom('A0'); G.state = 'PLAY'; G.dialog = null;
    G.tut.i = at('node'); G.tut.t = 1; G.tut.hold = 0;
    tutSave(G.save, G.tut);
    let stored = -1;
    try { stored = TUT_STEPS.findIndex(q => q.id === JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).flags.tutId); } catch (e) {}
    // a reload: the in-memory walk is gone, the save is what is left
    G.tut = null; updateTutor(1 / 60);
    const resumed = TUT_STEPS[G.tut.i].id;
    // ...and a save can never be written backwards
    G.tut.i = at('booth'); tutSave(G.save, G.tut);
    const back = TUT_STEPS.findIndex(q => q.id === G.save.flags.tutId);
    return { stored, resumed, back, heal: at('node') };
  });

  await b.close();

  console.log('reload mid-walk: ' + JSON.stringify(resume));
  console.log('steps reached: ' + seen.join(' -> '));
  console.log('Ratchet woke: ' + JSON.stringify(woke) + '   pod: ' + JSON.stringify(saved));
  console.log('scrap: ' + scrapBefore + ' before the pitch, ' + scrapAfter + ' at the counter (' + pitch.row + ')');
  console.log('after buying the pack: ' + JSON.stringify(bought));
  console.log('the hold before the pack: ' + JSON.stringify(burstLock));
  console.log('the scripted first surge left: ' + hurtTo.cores + ' / ' + hurtTo.max + ' cores');
  console.log('the winch: ' + JSON.stringify(winchCalm) + ', stopped by the burst: ' + winchDown);
  console.log('door: ' + JSON.stringify(door));
  console.log('skipping the walk: ' + JSON.stringify(skip));

  const want = ['move', 'out', 'jump', 'gate', 'booth', 'note', 'drawer', 'repair', 'pod', 'pack', 'heal', 'atk', 'burst', 'node', 'go'];
  const fails = [];
  for (const w of want) if (!seen.includes(w)) fails.push('never reached the "' + w + '" step (got ' + seen.join(',') + ')');
  if (!letterRead) fails.push('the letter was not what the first E read');
  if (!woke.live || woke.spare !== 1 || woke.kit !== 0 || woke.quest !== 'active') fails.push('the repair did not wake him with the spare named and the errand given: ' + JSON.stringify(woke));
  if (saved.bench !== 'A0B' || saved.stored !== 'A0B') fails.push('the pod did not move the save point to the den: ' + JSON.stringify(saved));
  if (scrapBefore !== 0) fails.push('she had scrap before Ratchet paid her (' + scrapBefore + ')');
  if (scrapAfter !== 12) fails.push('the counter did not open with exactly the 12 he paid (' + scrapAfter + ')');
  if (!pitch.text || !/12 scrap/.test(pitch.text)) fails.push('the pack was not pitched with its cost before the counter: ' + pitch.text);
  if (pitch.row !== 'cell') fails.push('the counter did not open on the pack');
  if (!bought.flag || !bought.heal) fails.push('buying the pack did not register / wire it');
  if (!burstLock.had) fails.push('the pack did not wire (flags.heal)');
  if (burstLock.locked > 0) fails.push('the claw charges before the pack is bought (chargeT ' + burstLock.locked + ')');
  if (bought.scrap !== 0) fails.push('the pack did not cost the 12 scrap (' + bought.scrap + ' left)');
  if (hurtTo.cores >= hurtTo.max) fails.push('the repair lesson opened at full health, so it teaches nothing');
  if (!winchCalm || !winchCalm.calm || winchCalm.phase !== 'idle') fails.push('the winch swings while she is being taught: ' + JSON.stringify(winchCalm));
  if (!winchDown) fails.push('the Volt Burst lesson did not stop the winch');
  if (!door.opened) fails.push('the way out never opened');
  if (skip.boothEarly !== 0) fails.push('the booth is open ' + skip.boothEarly + ' door(s) before the lesson that sends her in');
  if (!skip.killHeld) fails.push('the monument lesson completed away from the monument');
  if (!skip.atkHeld) fails.push('a swing inside the den finished the strike lesson');
  if (!skip.atkCounts) fails.push('a swing on the waking floor did NOT finish the strike lesson');
  if (!(skip.boothLater > 0)) fails.push('the booth never opens for the lesson that sends her in');
  if (resume.stored !== resume.heal) fails.push('the step is not in the save (' + resume.stored + ')');
  if (resume.resumed !== 'node') fails.push('a reload restarted the lesson at "' + resume.resumed + '"');
  if (resume.back !== resume.heal) fails.push('the saved step moved backwards (' + resume.back + ')');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK');
})();
