// THE DEMO BOUNDARY — the free chapter ends where it says it does, and nowhere
// else.
//
// This is a switch that changes what a player is allowed to reach, so the ways
// it can be wrong are all expensive:
//
//   - ON WHEN IT SHOULD BE OFF. The live game is not a demo today. A default
//     that truncated it would be the worst possible bug to ship quietly.
//   - ON IN THE BOUGHT COPY. Somebody who paid, stopped at a wall.
//   - IN THE WRONG PLACE. The boundary is DERIVED from zones rather than
//     listed, so this checks the derivation lands on exactly the doors it
//     should — every route inside the free chapter still open, the one route
//     out of it closed.
//   - A DEAD END. She stands in the doorway when it fires, which is outside the
//     room. If she is not put back inside, closing the screen re-opens it
//     forever and the demo ends by trapping the player in its own ending.
//   - UNREACHABLE BY TOUCH. It is a phone screen before it is anything else.
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── demo — the free chapter ends where it says, and only there');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide']; startGame(sv);
  });

  // ---- 1. OFF BY DEFAULT ---------------------------------------------------
  const def = await page.evaluate(() => ({ offer: DEMO_OFFER, on: demoOn() }));
  check('the boundary is OFF until somebody turns it on', def.offer === false && def.on === false,
        'DEMO_OFFER ' + def.offer);

  // ---- 2. WHERE IT LANDS ---------------------------------------------------
  // Walk every door in the game and ask the boundary about it. Exactly the
  // doors that leave the free zone may be closed; every other door in the whole
  // world must stay open, including all the ones inside it.
  const doors = await page.evaluate(() => {
    // the switch is simulated by replacing the predicate (as if this were a store build without
    // the game, the only place it can close) — which also proves demoWall() asks it
    const real = demoOn;
    demoOn = () => true;
    const inside = [], closed = [], leaked = [];
    for (const id in ROOMS) {
      const ex = ROOMS[id].exits || {};
      for (const k in ex) {
        const d = ex[k], to = (typeof d === 'object') ? d.to : d;
        if (!ROOMS[to]) continue;
        const was = G.roomId, wasDef = G.roomDef;
        G.roomId = id; G.roomDef = ROOMS[id];
        const wall = demoWall(to);
        G.roomId = was; G.roomDef = wasDef;
        const a = ROOMS[id].zone, b = ROOMS[to].zone;
        if (wall) closed.push(id + ' ' + k + ' -> ' + to + ' (' + a + '->' + b + ')');
        else if (a === DEMO_ZONE && b !== DEMO_ZONE) leaked.push(id + ' -> ' + to);
        else if (a === DEMO_ZONE && b === DEMO_ZONE) inside.push(id + '->' + to);
      }
    }
    demoOn = real;
    return { inside: inside.length, closed, leaked };
  });
  check('every door out of the free chapter is closed', doors.leaked.length === 0,
        doors.closed.join(', ') || 'none found');
  check('...and it is the ONE door, not a wall around the zone',
        doors.closed.length === 1, doors.closed.length + ' closed');
  check('...while every door inside the chapter stays open',
        doors.inside >= 18, doors.inside + ' interior routes untouched');

  // ---- 2b. ONE KINGDOM, AND NO OTHER WAY IN -------------------------------
  // "The free version is one stage" is a claim about the whole map, not about
  // one door. Closing A3's ceiling only means something if there is no second
  // route — and a door is not the only way into a kingdom in a game like this.
  // So this walks the world the way a player does, from the room a new game
  // starts in, through every exit the boundary allows, and insists the set of
  // rooms it can reach is exactly the free kingdom.
  //
  // The other ways in, checked here or ruled out by construction:
  //   fast travel  — does not exist. The bench is a save point, not a warp.
  //   respawn      — goes to the bench, which is only ever a room she reached.
  //   the map      — draws G.save.visited only, so it cannot show or route to
  //                  a kingdom she has not been in.
  //   the GATE     — W2 reaches A0 by the gate walk, not by an exit. The first
  //                  version of this walk did not know that, stopped dead at
  //                  W2, and reported the free chapter as two rooms while
  //                  passing every assertion in the block. Gate edges are read
  //                  from GATE_ROOM here for the same reason tests/deadend.cjs
  //                  injects them: a route the player can take is a route.
  const reach = await page.evaluate(() => {
    const real = demoOn;
    demoOn = () => true;
    const edges = (id) => {
      const out = [];
      const ex = ROOMS[id].exits || {};
      for (const k in ex) out.push((typeof ex[k] === 'object') ? ex[k].to : ex[k]);
      if (typeof gateDoorsAll === 'function') for (const d of gateDoorsAll(id)) out.push(d.to);
      return out;
    };
    const seen = { W1: 1 }, q = ['W1'], zones = {};
    while (q.length) {
      const id = q.shift();
      zones[ROOMS[id].zone] = (zones[ROOMS[id].zone] || 0) + 1;
      for (const to of edges(id)) {
        if (!ROOMS[to] || seen[to]) continue;
        const was = G.roomId, wasDef = G.roomDef;
        G.roomId = id; G.roomDef = ROOMS[id];
        const blocked = demoWall(to);
        G.roomId = was; G.roomDef = wasDef;
        if (blocked) continue;
        seen[to] = 1; q.push(to);
      }
    }
    demoOn = real;
    const all = Object.keys(ROOMS).length;
    return { zones, rooms: Object.keys(seen).length, all,
             strays: Object.keys(seen).filter(id => ROOMS[id].zone !== DEMO_ZONE) };
  });
  check('the free version really is ONE kingdom, by every route there is',
        reach.strays.length === 0,
        Object.entries(reach.zones).map(([z, n]) => z + ':' + n).join(' ')
        + (reach.strays.length ? ' — escaped into ' + reach.strays.join(',') : ''));
  check('...and the paid kingdoms are the rest of the game, not a scrap of it',
        reach.rooms < reach.all * 0.4,
        reach.rooms + ' of ' + reach.all + ' rooms free ('
        + Math.round(reach.rooms / reach.all * 100) + '%)');

  // ---- 3. THE WEB IS NEVER STOPPED; A STORE BUILD ONLY WITHOUT THE GAME ---
  // The owner, 2026-11-25: "as long as we're on the web app, all people who access the web are
  // actually testers ... still users on the link can access the second kingdom and all other
  // kingdoms freely." So this throws the real switch both ways (DEMO_OFFER is a `let` for this),
  // walks her through the real threshold edge (A14 -> B1, through checkTransitions) and asks
  // where she ends up: on this page (the web), with the offer OFF and ON, she walks into the
  // Conduits; on a simulated store build (window.Capacitor present) with the offer on and no
  // entitlement she is stopped; with G.save.full she is not. (Until 2026-11-25 this section only
  // read demoOn()'s source for two words; it was the web that was the demo then.)
  const store = await page.evaluate(() => {
    const keepOffer = DEMO_OFFER, keepCap = window.Capacitor, keepFull = G.save.full;
    // the first crossing of a save: the end-of-kingdom card comes first (owner, 2026-11-25), closes
    // itself, and THEN the gate decides; `again` is a later crossing, after the card was seen
    const cross = (again) => {
      if (!again) { delete G.save.flags.k1End; if (G.save.visited) delete G.save.visited.B1; }
      loadRoom('A14'); G.state = 'PLAY'; G.dialog = null; G.trans = null;
      player.x = G.roomDef.w * TILE + 4; player.y = 13 * TILE; player.vx = 200;
      checkTransitions();
      const seq = [];
      if (G.state === 'KEND') {
        seq.push(G.k1End.tester ? 'card+note' : 'card');
        G.k1End.t = K1_END.T + 0.1; updateK1End(0);
        if (G.state === 'PLAY') checkTransitions();
      }
      const st = G.state, to = (G.trans && G.trans.to) || (G.roomId !== 'A14' ? G.roomId : null);
      G.state = 'PLAY'; G.trans = null;
      seq.push(st === 'MORE' ? 'stopped' : (to || 'nowhere'));
      return seq.join('>');
    };
    const out = {};
    G.save.full = false;
    DEMO_OFFER = false; out.webOff = cross();
    DEMO_OFFER = true;  out.webOn = cross(); out.webOnAgain = cross(true);
    window.Capacitor = {};
    DEMO_OFFER = false; out.storeOff = cross();
    DEMO_OFFER = true;  out.storeOn = cross(); out.storeOnAgain = cross(true);
    G.save.full = true; out.storeFull = cross();
    DEMO_OFFER = keepOffer; G.save.full = keepFull;
    if (keepCap === undefined) delete window.Capacitor; else window.Capacitor = keepCap;
    return out;
  });
  check('the web is never stopped at the threshold: offer off (the end-of-kingdom card, then on)', store.webOff === 'card>B1', store.webOff);
  check('...and offer ON: the card with its one tester note, then on (everyone on the link is a tester)', store.webOn === 'card+note>B1', store.webOn);
  check('...and the next time, straight on', store.webOnAgain === 'B1', store.webOnAgain);
  check('a store build without the game, offer off: the card, then on', store.storeOff === 'card>B1', store.storeOff);
  check('a store build without the game, offer ON: the card FIRST, then stopped at the threshold', store.storeOn === 'card>stopped', store.storeOn);
  check('...and the next time, the gate alone (the card is once per save)', store.storeOnAgain === 'stopped', store.storeOnAgain);
  check('...and a store build with the game (G.save.full): the card, then on', store.storeFull === 'card>B1', store.storeFull);

  // ---- 4. IT DOES NOT TRAP HER --------------------------------------------
  // (the threshold is the frontier road's east edge since 2026-11-25: NULLFANG's door -> A14 -> B1)
  const trap = await page.evaluate(async () => {
    loadRoom('A14');
    const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
    player.x = W + 6; player.y = 13 * TILE; player.vx = 300;   // through the east edge
    demoStop('R');
    const inRoom = player.x > 0 && player.x + player.w < W && player.y > 0 && player.y < H;
    const st = G.state;
    // close the screen the way a player would, then run a moment of real game
    G.state = 'PLAY';
    for (let i = 0; i < 20; i++) { player.update(1 / 30); checkTransitions(); }
    return { st, inRoom, after: G.state, y: Math.round(player.y) };
  });
  check('it opens the screen rather than the next room', trap.st === 'MORE', trap.st);
  check('...and puts her back INSIDE the room first', trap.inRoom, 'y ' + trap.y);
  check('...so closing it does not immediately re-open it', trap.after === 'PLAY', trap.after);

  // ---- 5. IT IS A PHONE SCREEN --------------------------------------------
  const tap = await page.evaluate(() => {
    G.state = 'MORE';
    const L = moreLayout(), out = [];
    for (let i = 0; i < L.rows.length; i++) {
      G.moreIdx = -1;
      tapMenu(480, L.y0 + i * L.step);
      out.push(G.moreIdx);
    }
    G.moreIdx = -1; tapMenu(60, L.y0);            // well outside the button
    const missed = G.moreIdx === -1;
    G.state = 'PLAY';
    return { out, missed, rows: L.rows };
  });
  check('tapping a row selects that row', JSON.stringify(tap.out) === JSON.stringify([0, 1]),
        JSON.stringify(tap.out));
  check('...and a tap beside the buttons selects nothing', tap.missed);

  // ---- 6. IT SPEAKS EVERY LANGUAGE ----------------------------------------
  const lang = await page.evaluate(() => {
    const was = LANG, missing = [];
    for (const l of Object.keys(I18N)) {
      LANG = l;
      for (const k of ['demo_end1', 'demo_end2', 'demo_end3', 'demo_get', 'demo_soon',
                       'demo_stay', 'demo_guardians']) {
        if (!t(k) || t(k) === k) missing.push(l + '.' + k);
        // an untranslated string falling back to English is fine; a MISSING one
        // that renders as its own key is not
      }
    }
    LANG = was;
    return { langs: Object.keys(I18N), missing };
  });
  check('the ending screen has words in every language', !lang.missing.length,
        lang.langs.join(', ') + (lang.missing.length ? ' — missing ' + lang.missing.slice(0, 4) : ''));

  // ---- 7. NO LIGHT OVER THE CAMP ------------------------------------------
  // There used to be a shaft of the Conduits' cyan falling through a hole in A3's sky, over the
  // climb out of the Meadows. The owner, 2026-11-25: the robot story reaches the second kingdom
  // through the door NULLFANG opens in his arena, "instead of going up into the sky, into the
  // light, which means you will remove the light from the screen before it". So this measures
  // the opposite of what it measured before, the same way: the frame over the old climb, drawn
  // with the frontier code and with it switched off, must be the SAME frame — no light is added.
  // And the climb itself is gone from the robot story: no way up, no ledges up to it.
  const dark = await page.evaluate(() => {
    loadRoom('A3'); G.state = 'PLAY'; G.toasts = []; G.card = null; G.zoneToast = null;
    player.x = 26 * TILE; player.y = 14 * TILE; player.vx = 0; player.vy = 0;
    updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
    player.x = 18 * TILE; G.enemies = []; G.statics = []; G.parts = []; G.projs = [];
    const x = cv.getContext('2d');
    const box = () => { const d = x.getImageData(0, 0, cv.width, Math.round(cv.height * 0.8)).data; let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i] + d[i + 1] + d[i + 2]; return s; };
    const realNow = performance.now, realRand = Math.random;
    performance.now = () => 0; Math.random = () => 0.5;
    draw(0); const on = box();
    const keep = window.drawFrontier; window.drawFrontier = function () {};
    draw(0); const off = box();
    window.drawFrontier = keep;
    performance.now = realNow; Math.random = realRand;
    const ex = ROOMS.A3.exits || {};
    let ledges = 0;
    for (const y of [3, 6, 9]) for (let tx = 18; tx <= 28; tx++) if (G.grid[y][tx] === '=') ledges++;
    return { frontier: Object.keys(FRONTIER), diff: Math.abs(on - off), up: !!ex.T, ledges };
  });
  check('no light is drawn over the camp: the frame is the same with the frontier code and without it',
        dark.diff === 0 && dark.frontier.indexOf('A3') < 0, 'difference ' + dark.diff + ', frontier rooms [' + dark.frontier.join(',') + ']');
  check('...and the climb over the camp is gone from the robot story: no way up, no ledges up to it',
        !dark.up && dark.ledges === 0, 'way up ' + dark.up + ', ledges ' + dark.ledges);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one door closes, the chapter ends, and she can walk back in');
})().catch(e => { console.error(e); process.exit(1); });
