// THE WAKING, MEASURED.
//
// The game used to begin on the meadow floor with a machine already walking at
// her, which meant the first thing a player did after "she wakes up" was learn
// to punch. The opening is playable now and it is two rooms long — the cradle
// that lets her go, and the road to the city gates — and the whole point of it
// is an ORDER: walk, then jump, then arrive, and only then meet anything.
//
// Order is exactly the sort of thing that rots silently. A step whose `done()`
// can fire in the wrong room, an exit wired the wrong way, a save that still
// starts on the old floor, a hold that never releases and leaves the player
// looking at a game that will not accept input — none of those throw, and all
// of them ship. So:
//
//   the run STARTS in the cradle room, not on the meadow;
//   the chain W1 -> W2 -> A0 is walkable in that direction and back;
//   nothing that can hurt her exists in either room;
//   the cradle holds her controls, and then gives them back;
//   the lesson order is move -> out -> jump -> gate -> and only then a machine;
//   and no verb can be completed in a room that cannot teach it.
//
//   node tests/opening.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── opening — she wakes, she walks, she arrives, and only then does anything move');

  // ---- 1. THE SHAPE OF THE WALK ------------------------------------------
  const shape = await page.evaluate(() => {
    const sv = newSave(1);
    const chain = ['W1', 'W2', 'A0'];
    const missing = chain.filter(id => !ROOMS[id]);
    // W1 <-> W2 is an ordinary walk both ways. W2 -> A0 is NOT: the only way
    // into the city is UP at the gates (gateEnter), and the gates close behind
    // her — a right-hand side exit here is exactly the bug that let a player
    // side-scroll past the gates without ever entering them.
    const fwd = [(ROOMS.W1.exits || {}).R === 'W2', !!GATE_ROOM.W2 && GATE_ROOM.W2.to === 'A0'];
    const back = [(ROOMS.W2.exits || {}).L === 'W1', (ROOMS.W2.exits || {}).R === undefined];
    // nothing in either waking room may be able to touch her
    const HOSTILE = ['crawler', 'guard', 'flier', 'turret', 'hopper', 'blob', 'boss', 'saw'];
    const danger = {};
    for (const id of ['W1', 'W2'])
      danger[id] = (ROOMS[id].ents || []).filter(e => HOSTILE.indexOf(e[0]) >= 0).map(e => e[0]);
    // ...and no spikes underfoot either
    const spikes = {};
    for (const id of ['W1', 'W2']) {
      const g = buildRoom(id);
      spikes[id] = g.some(row => row.indexOf('^') >= 0);
    }
    return { missing, fwd, back, danger, spikes,
             start: sv.bench && sv.bench.room,
             onMap: chain.every(id => !!MAPPOS[id]) };
  });
  check('both waking rooms exist', !shape.missing.length, shape.missing.join(',') || 'W1, W2');
  check('the run STARTS in the cradle, not on the meadow',
    shape.start === 'W1', 'newSave starts at ' + shape.start);
  check('W1 walks to W2, and the GATES are the only way into the city',
    shape.fwd.every(Boolean), JSON.stringify(shape.fwd));
  check('...she can walk back to the cradle, and there is NO side door past the gates',
    shape.back.every(Boolean), JSON.stringify(shape.back));
  check('both rooms are on the map', shape.onMap);
  check('nothing in either room can hurt her',
    !shape.danger.W1.length && !shape.danger.W2.length,
    'W1 [' + shape.danger.W1 + '] W2 [' + shape.danger.W2 + ']');
  check('...and neither floor has spikes in it',
    !shape.spikes.W1 && !shape.spikes.W2);

  // ---- 2. THE HOLD, AND THE RELEASE --------------------------------------
  // A release the player can walk out of halfway through is a loading screen
  // with a picture on it. A release that never ends is a soft lock, and the
  // second is far worse than the first — so both ends are measured.
  const wake = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99;
    startGame(sv); loadRoom('W1');
    await new Promise(r => requestAnimationFrame(r));
    const started = !!G.wake;
    // she is holding right through the whole thing
    keys.ArrowRight = 1;
    const x0 = player.x;
    let moved = 0;
    for (let f = 0; f < 30; f++) { player.update(1 / 60); updateWake(1 / 60); }
    moved = Math.abs(player.x - x0);
    // ...and it ends
    for (let f = 0; f < 60 * 4; f++) { player.update(1 / 60); updateWake(1 / 60); }
    const stillHeld = !!G.wake;
    const x1 = player.x;
    for (let f = 0; f < 30; f++) player.update(1 / 60);
    const movedAfter = Math.abs(player.x - x1);
    keys.ArrowRight = 0;
    return { started, moved, stillHeld, movedAfter, flag: !!(G.save.flags && G.save.flags.woke) };
  });
  check('the cradle takes hold of her when she arrives', wake.started);
  check('...and she cannot walk out of the release',
    wake.moved < 1, wake.moved.toFixed(2) + ' px');
  check('...it ENDS, and gives her back',
    !wake.stillHeld && wake.movedAfter > 20,
    'held ' + wake.stillHeld + ', then moved ' + wake.movedAfter.toFixed(0) + ' px');
  check('...and it happens exactly once per save', wake.flag);

  // ---- 3. THE ORDER ------------------------------------------------------
  const order = await page.evaluate(() => {
    const ids = TUT_STEPS.map(s => s.id);
    return { ids, rooms: TUT_ROOMS, last: TUT_LAST };
  });
  console.log('\n    lesson order: ' + order.ids.join(' -> ') + '\n');
  const want = ['move', 'out', 'jump', 'gate', 'atk'];
  check('the verbs come in the right order, and the machine comes last',
    JSON.stringify(order.ids.slice(0, 5)) === JSON.stringify(want),
    order.ids.slice(0, 5).join(' -> '));
  check('the lesson knows all three of its rooms',
    order.rooms.W1 === 0 && order.rooms.W2 === 1 && order.rooms.A0 === 2,
    JSON.stringify(order.rooms));

  // NO VERB MAY BE COMPLETED IN A ROOM THAT CANNOT TEACH IT. This is the one
  // that would have shipped: `kill` completes when no enemy is alive, and the
  // two waking rooms have no enemies at all — so without the room gates in
  // front of it, walking into W1 would tick the kill lesson off instantly and
  // the player would never be taught to swing.
  const gate = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99;
    startGame(sv); loadRoom('W1');
    await new Promise(r => requestAnimationFrame(r));
    if (G.wake) G.wake = null;                 // past the release
    G.tut = { i: 0, t: 0, hold: 0, doneT: 0 };
    // stand still in W1 for five seconds and see how far the lesson gets on
    // its own. It must stop dead at the step that needs the next room.
    for (let f = 0; f < 60 * 5; f++) { player.vx = 0; updateTutor(1 / 60); }
    return { i: G.tut ? G.tut.i : -1, id: G.tut ? TUT_STEPS[G.tut.i].id : 'gone' };
  });
  check('standing still in the cradle room cannot skip the lesson',
    gate.id === 'move' || gate.id === 'out', 'stalled at ' + gate.id);

  // ---- 4. THE PROPS ------------------------------------------------------
  const props = await page.evaluate(async () => {
    const keys = ['cradle', 'cradleOpen', 'gateCity'];
    const out = [];
    for (const k of keys) {
      const src = MEDIA_SRC.images[k];
      if (!src) { out.push({ k, err: 'not in the manifest' }); continue; }
      const im = new Image();
      const ok = await new Promise(r => { im.onload = () => r(1); im.onerror = () => r(0); im.src = src; });
      out.push({ k, ok: !!ok, w: im.naturalWidth });
    }
    // W1's cradle is a PROP standing in the room; W2's gates are the room's own
    // BACKDROP. Two different jobs, checked as two different things — a
    // full-frame painting drawn as a prop is the rectangle-with-a-seam bug.
    return { out, placed: { W1: !!ROOM_PROP.W1, W2: ROOM_VISTA.W2 === 'gateCity' } };
  });
  const bad = props.out.filter(o => o.err || !o.ok);
  check('the cradle and the gates exist and decode', !bad.length,
    bad.map(o => o.k + ' ' + (o.err || 'failed')).join(', '));
  check('...the cradle stands in its room and the gates ARE their room\'s horizon',
    props.placed.W1 && props.placed.W2, JSON.stringify(props.placed));

  // ---- 5. AND THE WALK ITSELF --------------------------------------------
  // Driven, not asserted from the room table: hold right and see whether the
  // player actually arrives on the meadow. A step she cannot clear or a gap
  // she falls into forever is invisible to every check above.
  const walk = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99;
    startGame(sv); loadRoom('W1');
    await new Promise(r => requestAnimationFrame(r));
    G.wake = null;
    const seen = ['W1'];
    let pressed = false;
    for (let f = 0; f < 60 * 45 && G.roomId !== 'A0'; f++) {
      keys.ArrowRight = 1;
      // at the gates, she does what the chip says: press UP
      if (!pressed && G.roomId === 'W2' && player.on && typeof gateHere === 'function' && gateHere()) {
        keys.ArrowRight = 0; pressed = gateEnter();
      }
      // HOLD the jump, do not tap it. Her jump is variable-height: a one-frame
      // press is a hop of about thirty pixels, which is a hair under the step
      // she is being taught on — so a tapping harness walks into a one-tile
      // block forever and reports the room as broken when it is not. A player
      // presses for a tenth of a second; so does this.
      const phase = f % 26;
      if (phase < 10) { keys.KeyZ = 1; if (phase === 0) keysP.KeyZ = 1; }
      else { keys.KeyZ = 0; keysP.KeyZ = 0; }
      update(1 / 60);
      if (seen[seen.length - 1] !== G.roomId) seen.push(G.roomId);
    }
    keys.ArrowRight = 0; keys.KeyZ = 0; keysP.KeyZ = 0;
    return { seen, end: G.roomId, dead: player.dead };
  });
  check('the walk arrives: right to the gates, UP through them',
    walk.end === 'A0' && !walk.dead, walk.seen.join(' -> ') + (walk.dead ? ' (died)' : ''));

  // ---- 6. THE GATES ARE A DOOR, NOT A PICTURE ----------------------------
  const doorway = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('W2');
    await new Promise(r => requestAnimationFrame(r));
    // the backdrop, not a prop: a full-frame painting drawn in-world is a
    // rectangle with a seam down the room, which is what it was
    const asBackdrop = ROOM_VISTA.W2 === 'gateCity' && !ROOM_PROP.W2;
    // pressing UP anywhere else must NOT open them
    player.x = 200; player.y = 444; player.on = true;
    const farAway = !gateEnter();
    // ...and at the gates it must
    player.x = G.roomDef.w * TILE * 0.90 - 12;
    const opened = gateEnter();
    let drewBack = false;
    for (let f = 0; f < 200 && G.gateWalk; f++) {
      if (G.gateWalk.t > 0.2) drewBack = true;
      update(1 / 60);
    }
    return { asBackdrop, farAway, opened, drewBack, end: G.roomId, x: Math.round(player.x) };
  });
  check('the gates are the room\'s backdrop, not a rectangle pasted into it',
    doorway.asBackdrop);
  check('pressing up away from the gates does nothing', doorway.farAway);
  check('pressing up AT the gates walks her in', doorway.opened && doorway.drewBack);
  check('...and she arrives inside the city, not past the far side of it',
    doorway.end === 'A0' && doorway.x < 200, doorway.end + ' at x=' + doorway.x);

  // ---- 7. NOTHING GLIDES -------------------------------------------------
  // The wolves were one still plate on an entity that slides, so they skated
  // with their legs locked. The cycle is driven by ground travelled, which is
  // the only version that cannot moonwalk: a paw plants once per stride of
  // floor at any speed, on any framerate.
  const gait = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    await new Promise(r => requestAnimationFrame(r));
    const e = G.enemies.find(x => isWolf(x));
    if (!e) return { err: 'no wolf in A1' };
    const walked = [];
    for (let f = 0; f < 120; f++) { e.x += 4; e.vx = 240; walked.push(wolfPose(e)); }
    const still = [];
    e.vx = 0;
    for (let f = 0; f < 10; f++) still.push(wolfPose(e));
    // ...and at HALF the speed it must take twice as long per step, because the
    // cycle answers to the floor and not to a clock
    const slow = [];
    e.vx = 120;
    for (let f = 0; f < 120; f++) { e.x += 2; slow.push(wolfPose(e)); }
    const flips = (a2) => { let n = 0; for (let i = 1; i < a2.length; i++) if (a2[i] !== a2[i - 1]) n++; return n; };
    return { poses: [...new Set(walked)], flipsFast: flips(walked), flipsSlow: flips(slow),
             still: [...new Set(still)] };
  });
  if (gait.err) check('the wolves walk', false, gait.err);
  else {
    check('a moving wolf cycles real walk frames',
      gait.poses.length >= 2 && gait.poses.every(p2 => /^walk/.test(p2)),
      gait.poses.join(','));
    check('a standing wolf stands still',
      gait.still.length === 1 && gait.still[0] === 'rest', gait.still.join(','));
    check('the gait answers to the FLOOR, not to a clock (half speed = half the steps)',
      gait.flipsSlow > 0 && Math.abs(gait.flipsFast / gait.flipsSlow - 2) < 0.45,
      gait.flipsFast + ' steps fast vs ' + gait.flipsSlow + ' slow');
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she wakes, she is let go, she walks, she arrives, and nothing touched her on the way');
})().catch(e => { console.error(e); process.exit(1); });
