// The waking floor, all the way through.
//
// The opening used to teach three verbs and stop, which taught how to press
// buttons and nothing about how the game is played. It now teaches the LOOP —
// break a machine, take its scrap, spend it, repair with what you bought, earn
// insight, spend that too — and a chain that long is exactly the kind of thing
// that silently breaks at link four and is never noticed, because nobody
// replays a tutorial. So it is walked here, step by step, every run.
//
// Each step is driven the way a player would drive it, and the harness asserts
// the step ADVANCED rather than that the input was accepted.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
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
  now = await drive('jump', () => { player.on = false; player.vy = -300; });
  await record(now);
  now = await drive('gate', () => { loadRoom('A0'); });
  await record(now);
  now = await drive('atk', () => { keysP['KeyX'] = 1; keys['KeyX'] = 1; });
  await record(now);

  // the kill: hit the dummy until it breaks
  now = await drive('kill', () => {
    const e = G.enemies.find(x => x && !x.dead);
    // the same two lines the claw runs: damage, then the caller kills it
    if (e) { dealDmg(e, 999, 'claw', e.x, e.y, true); if (e.hp <= 0) e.die(1, -0.3); }
  });
  await record(now);

  const scrapBefore = await p.evaluate(() => G.save.scrap);
  now = await drive('coin', () => {
    // ...and the card that explains what scrap IS lands the moment the errand
    // is satisfied (js/game.js bankScrap), so page it through the way a player
    // would. Without this the step reads as hung when the game is in fact
    // waiting to be read.
    if (G.state === 'DIALOG') {
      for (let i = 0; i < 60 && G.state === 'DIALOG'; i++) {
        keysP['Enter'] = 1; keys['Enter'] = 1; update(1 / 30); keys['Enter'] = 0;
      }
      return;
    }
    // A DEAD MACHINE IS NOT SCRAP YET. It leaves a WRECK, and the scrap comes
    // out when the wreck is broken — which is the lesson. This used to rely on
    // a stray swing from the previous step happening to smash it, so the step
    // passed or hung depending on timing; it breaks the wreck explicitly now.
    // A WRECK HAS NO die(). It has explode(), and explode() is what drops the
    // scrap — so `w.die ? w.die() : w.dead = true` fell through to the else and
    // marked the wreck dead WITHOUT its payout. The step passed anyway for as
    // long as the wreck happened to blow itself up first (it explodes on its
    // own bounce count or after ~1s), which is exactly the timing dependence
    // the comment below was already complaining about. Call the real method.
    const w = G.wrecks && G.wrecks.find(x => x && !x.dead);
    if (w) {
      w.hp = 0;
      if (typeof w.explode === 'function') w.explode();
      else if (typeof w.die === 'function') w.die();
      else w.dead = true;
    }
    const q = G.pickups.find(x => x && !x.dead);
    // ...and DRIVE the pickup rather than waiting for the loop to do it. Every
    // action that only sets up a condition and then hopes the game's own rAF
    // runs is a step that passes on an idle machine and hangs on a busy one:
    // under the full suite this one stalled as "coin, coin, coin, coin".
    if (q) {
      player.x = q.x - 4; player.y = q.y - 8; player.vy = 0;
      for (let i = 0; i < 12 && !q.dead; i++) update(1 / 60);
    }
  });
  await record(now);
  const scrapAfter = await p.evaluate(() => G.save.scrap);

  // THROUGH THE TRADER, not around him. This step used to call updateShop()
  // directly, which is why it stayed green while the errand system quietly
  // replaced the trader's shop with an errand and made the lesson impossible:
  // the harness was testing the till, not the shopkeeper.
  now = await drive('buy', () => {
    const npc = G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
    if (!npc) {
      // the trader lives in his BOOTH now — walk in through the depth door
      // read through gateDoors: a room's row may be an ARRAY of doors now
      const gr = (typeof gateDoors === 'function' ? gateDoors() : []).find(d => d.style === 'booth');
      if (gr && G.state === 'PLAY') {
        if (!G.gateWalk) {
          player.x = gateWorldX(gr) - player.w / 2; player.vx = 0; player.on = true;
          gateEnter();
        }
        // THE WHOLE WALK IN ONE TRY. It used to advance a tenth of a second per
        // try, and the walk is 3.4 seconds — thirty-four of `drive`'s sixty
        // tries spent on one doorway, leaving too few for the dialog and the
        // shop behind it. Under the full suite that ran out and the harness
        // reported "buy, buy, buy, buy, buy": not a broken lesson, a budget.
        for (let i = 0; i < 80 && G.gateWalk; i++) update(1 / 10);
      }
      return;
    }
    if (G.state === 'PLAY') { doInteract(npc); return; }
    if (G.state === 'DIALOG') {
      // PAGE IT THROUGH IN ONE TRY, for the same reason the walk is done in
      // one: Ratchet's first talk is a long story, one page per try spent the
      // budget on reading, and the step ran out as "buy, buy, buy, buy".
      for (let i = 0; i < 200 && G.state === 'DIALOG'; i++) {
        keysP['Enter'] = 1; keys['Enter'] = 1;
        update(1 / 30);
        keys['Enter'] = 0;
      }
      return;
    }
    if (G.state === 'SHOP') {
      G.shopIdx = 0;                               // the volt cell
      keysP['Enter'] = 1; keys['Enter'] = 1;
      updateShop();
      G.state = 'PLAY';
    }
  });
  const shopReached = await p.evaluate(() => !!(G.save.flags && G.save.flags.tutBuy));
  await record(now);
  const bought = await p.evaluate(() => ({ volts: player.volts, scrap: G.save.scrap, flag: !!G.save.flags.tutBuy }));

  // the scripted hit should already have landed when the step opened
  const hurtTo = await p.evaluate(() => ({ cores: player.cores, max: player.maxCores() }));
  now = await drive('heal', () => {
    // a player leaves the shop before doing anything else, and the tutorial
    // only advances while the game is actually being played
    if (G.state !== 'PLAY') G.state = 'PLAY';
    player.cores = player.maxCores();
  });
  await record(now);

  // SHE HAS TO COME BACK OUT OF THE BOOTH FOR THIS ONE, and that is the point
  // of it: the node stands in A0, thirteen tiles behind where the buy step
  // left her, and the lesson no longer completes from inside the shop (the
  // step carries `room` now). Walking out is what a player does — the game
  // rings the way out while the step is active — so the harness does it too.
  now = await drive('node', () => {
    if (G.roomId !== 'A0') { loadRoom('A0'); G.state = 'PLAY'; G.dialog = null; return; }
    G.save.iq = 10;
  });
  await record(now);
  now = await drive('skill', () => { G.save.skills = ['mind']; });
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
    const at = (id) => TUT_STEPS.findIndex(q => q.id === id);
    G.tut.i = at('kill'); G.tut.t = 1; G.tut.hold = 0;
    const boothEarly = gateDoors('A0').length;          // must be 0: not built yet
    // ...and if she gets in anyway, the lessons must not complete in there
    loadRoom('A0B'); G.state = 'PLAY'; G.dialog = null;
    const iKill = G.tut.i;
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const killHeld = G.tut.i === iKill && !G.tut.hold;
    G.tut.i = at('atk'); G.tut.t = 1; G.tut.hold = 0;
    player.swing = { t: 0.2, t0: 0.2, combo: 1 };        // a real swing, in the shop
    const iAtk = G.tut.i;
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const atkHeld = G.tut.i === iAtk && !G.tut.hold;
    player.swing = null;
    // ...and the same swing in the room that teaches it DOES count
    loadRoom('A0'); G.state = 'PLAY'; G.dialog = null;
    G.tut.i = at('atk'); G.tut.t = 1; G.tut.hold = 0;
    player.swing = { t: 0.2, t0: 0.2, combo: 1 };
    for (let k = 0; k < 60; k++) updateTutor(1 / 60);
    const atkCounts = G.tut.i > at('atk') || G.tut.hold > 0;
    player.swing = null;
    // ...and the booth opens once the lesson that sends her in begins
    G.tut.i = at('buy'); G.tut.t = 1; G.tut.hold = 0;
    const boothLater = gateDoors('A0').length;
    return { boothEarly, killHeld, atkHeld, atkCounts, boothLater };
  });
  // and the door: held shut until the last lesson, open after it
  const door = await p.evaluate(() => {
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
    G.tut.i = at('heal'); G.tut.t = 1; G.tut.hold = 0;
    tutSave(G.save, G.tut);
    let stored = -1;
    try { stored = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).flags.tutI; } catch (e) {}
    // a reload: the in-memory walk is gone, the save is what is left
    G.tut = null; updateTutor(1 / 60);
    const resumed = TUT_STEPS[G.tut.i].id;
    // ...and a save can never be written backwards
    G.tut.i = at('atk'); tutSave(G.save, G.tut);
    const back = G.save.flags.tutI;
    return { stored, resumed, back, heal: at('heal') };
  });

  await b.close();

  console.log('reload mid-walk: ' + JSON.stringify(resume));
  console.log('steps reached: ' + seen.join(' -> '));
  console.log('scrap from the waking floor\'s machine: ' + scrapBefore + ' -> ' + scrapAfter);
  console.log('after buying the cell: ' + JSON.stringify(bought));
  console.log('the scripted first hit left: ' + hurtTo.cores + ' / ' + hurtTo.max + ' cores');
  console.log('door: ' + JSON.stringify(door));
  console.log('skipping the walk: ' + JSON.stringify(skip));

  const want = ['move', 'jump', 'atk', 'kill', 'coin', 'buy', 'heal', 'node', 'skill', 'go'];
  const fails = [];
  for (const w of want) if (!seen.includes(w)) fails.push('never reached the "' + w + '" step (got ' + seen.join(',') + ')');
  if (scrapAfter < 12) fails.push('the first kill cannot pay for the cheapest thing in the shop (' + scrapAfter + ')');
  if (!bought.flag) fails.push('buying the volt cell did not register');
  if (bought.scrap !== scrapAfter - 12) fails.push('the cell did not cost 12 scrap');
  if (hurtTo.cores >= hurtTo.max) fails.push('the repair lesson opened at full health, so it teaches nothing');
  if (!door.opened) fails.push('the way out never opened');
  // the escape the owner actually found — see the block that measures it
  if (skip.boothEarly !== 0) fails.push('the booth is open ' + skip.boothEarly + ' door(s) before the lesson that sends her in');
  if (!skip.killHeld) fails.push('the kill lesson completed inside the shop');
  if (!skip.atkHeld) fails.push('a swing inside the shop finished the attack lesson');
  if (!skip.atkCounts) fails.push('a swing on the waking floor did NOT finish the attack lesson');
  if (!(skip.boothLater > 0)) fails.push('the booth never opens for the lesson that sends her in');
  if (resume.stored !== resume.heal) fails.push('the step index is not in the save (' + resume.stored + ')');
  if (resume.resumed !== 'heal') fails.push('a reload restarted the lesson at "' + resume.resumed + '"');
  if (resume.back !== resume.heal) fails.push('the saved step moved backwards (' + resume.back + ')');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK');
})();
