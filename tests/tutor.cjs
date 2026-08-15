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
  async function drive(id, action) {
    for (let tries = 0; tries < 60; tries++) {
      const s = await step();
      if (!s) break;
      if (s.id !== id) return s.id;            // already past it
      await p.evaluate(action);
      await p.waitForTimeout(120);
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
    // A DEAD MACHINE IS NOT SCRAP YET. It leaves a WRECK, and the scrap comes
    // out when the wreck is broken — which is the lesson. This used to rely on
    // a stray swing from the previous step happening to smash it, so the step
    // passed or hung depending on timing; it breaks the wreck explicitly now.
    const w = G.wrecks && G.wrecks.find(x => x && !x.dead);
    if (w) { w.hp = 0; if (typeof w.die === 'function') w.die(); else w.dead = true; }
    const q = G.pickups.find(x => x && !x.dead);
    if (q) { player.x = q.x - 4; player.y = q.y - 8; }
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
      const gr = typeof GATE_ROOM !== 'undefined' && GATE_ROOM[G.roomId];
      if (gr && gr.style === 'booth' && G.state === 'PLAY') {
        if (!G.gateWalk) {
          player.x = gateWorldX(gr) - player.w / 2; player.vx = 0; player.on = true;
          gateEnter();
        }
        update(1 / 10);                            // the careful walk, at speed
      }
      return;
    }
    if (G.state === 'PLAY') { doInteract(npc); return; }
    if (G.state === 'DIALOG') {                    // page through what he says
      keysP['Enter'] = 1; keys['Enter'] = 1; update(1 / 30); return;
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

  now = await drive('node', () => { G.save.iq = 10; });
  await record(now);
  now = await drive('skill', () => { G.save.skills = ['mind']; });
  await record(now);

  // and the door: held shut until the last lesson, open after it
  const door = await p.evaluate(() => {
    const before = G.tut.opened;
    player.x = (G.roomDef.w - 1) * 32;
    updateTutor(0.016);
    return { opened: !!G.tut.opened, before: !!before, i: G.tut.i, last: TUT_LAST };
  });

  await b.close();

  console.log('steps reached: ' + seen.join(' -> '));
  console.log('scrap from the waking floor\'s machine: ' + scrapBefore + ' -> ' + scrapAfter);
  console.log('after buying the cell: ' + JSON.stringify(bought));
  console.log('the scripted first hit left: ' + hurtTo.cores + ' / ' + hurtTo.max + ' cores');
  console.log('door: ' + JSON.stringify(door));

  const want = ['move', 'jump', 'atk', 'kill', 'coin', 'buy', 'heal', 'node', 'skill', 'go'];
  const fails = [];
  for (const w of want) if (!seen.includes(w)) fails.push('never reached the "' + w + '" step (got ' + seen.join(',') + ')');
  if (scrapAfter < 12) fails.push('the first kill cannot pay for the cheapest thing in the shop (' + scrapAfter + ')');
  if (!bought.flag) fails.push('buying the volt cell did not register');
  if (bought.scrap !== scrapAfter - 12) fails.push('the cell did not cost 12 scrap');
  if (hurtTo.cores >= hurtTo.max) fails.push('the repair lesson opened at full health, so it teaches nothing');
  if (!door.opened) fails.push('the way out never opened');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK');
})();
