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
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
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
    // DEMO_OFFER is a const, so the switch is simulated by replacing the
    // predicate — which also proves demoWall() asks it rather than re-deciding
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
      if (typeof GATE_ROOM !== 'undefined' && GATE_ROOM[id]) out.push(GATE_ROOM[id].to);
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

  // ---- 3. A BOUGHT COPY IS NEVER THE DEMO ---------------------------------
  const flagWorks = await page.evaluate(() => {
    // demoOn() reads DEMO_OFFER, which is a const — so the purchase flag is
    // checked directly rather than by flipping the switch
    const src = String(demoOn);
    return /G\.save\.full/.test(src) && /Capacitor/.test(src);
  });
  check('a bought copy and a packaged app are never the demo', flagWorks,
        'demoOn() checks both the purchase flag and the package');

  // ---- 4. IT DOES NOT TRAP HER --------------------------------------------
  const trap = await page.evaluate(async () => {
    loadRoom('A3');
    const H = G.roomDef.h * TILE;
    player.x = 300; player.y = -30; player.vy = -400;   // through the top door
    demoStop('T');
    const inRoom = player.y > 0 && player.y < H;
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

  // ---- 7. THE FRONTIER ----------------------------------------------------
  // The ending screen asks the player to want five more kingdoms. The light
  // falling through A3's ceiling is the only evidence it offers that there ARE
  // any, so it has to be (a) pointing at a door that exists, (b) coming out of
  // a hole that exists, and (c) actually visible — the first version of this
  // was drawn correctly at alphas so low that probing the live frame found it
  // adding about 14 to a channel. Present, and invisible. Hence a MEASUREMENT
  // rather than "the code runs".
  const front = await page.evaluate(() => {
    const out = { table: [] };
    for (const id in FRONTIER) {
      const F = FRONTIER[id], R = ROOMS[id];
      const exits = Object.values((R && R.exits) || {}).map(d => (typeof d === 'object' ? d.to : d));
      const leadsThere = exits.some(to => ROOMS[to] && ROOMS[to].zone === F.zone);
      // ...and the opening it shines through is a real gap in the room's roof
      const was = G.roomId;
      loadRoom(id);
      let open = 0;
      for (let tx = F.tx0; tx < F.tx1; tx++) if (G.grid[0][tx] === '.') open++;
      out.table.push({ id, zone: F.zone, leadsThere, open, want: F.tx1 - F.tx0 });
      loadRoom(was);
    }
    return out;
  });
  check('every frontier points at a kingdom the room really connects to',
        front.table.every(r => r.leadsThere),
        front.table.map(r => r.id + '->' + r.zone).join(', '));
  check('...and shines through a real hole in that room\'s roof',
        front.table.every(r => r.open === r.want),
        front.table.map(r => r.id + ' ' + r.open + '/' + r.want + ' tiles open').join(', '));

  const lit = await page.evaluate(() => {
    loadRoom('A3'); G.state = 'PLAY'; G.toasts = []; G.card = null; G.zoneToast = null;
    const F = FRONTIER.A3;
    player.x = 26 * TILE; player.y = 14 * TILE; player.vx = 0; player.vy = 0;
    updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
    const x = cv.getContext('2d');
    const rd = (sx, sy) => {
      const d = x.getImageData(Math.round(sx * cv.width / 960), Math.round(sy * cv.height / 540), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    // the middle of the shaft, and the same height well outside it
    const cxr = (F.tx0 + F.tx1) / 2 * TILE - camSX();
    // where the beam actually lands, read from the same expression that draws
    // it rather than eyeballed off a screenshot — the first version of this
    // sampled 46 px above the pool and reported it missing
    const landY = G.roomDef.h * TILE * 0.86 - camSY();
    const shot = () => {
      draw(performance.now());
      return { in: rd(cxr, 150), out: rd(cxr - 300, 150), land: rd(cxr, landY) };
    };
    const on = shot();
    const keep = FRONTIER.A3; delete FRONTIER.A3;
    const off = shot();
    FRONTIER.A3 = keep;
    G.artProbe = 1;
    const probed = shot();
    G.artProbe = 0;
    return { on, off, probed, cxr: Math.round(cxr) };
  });
  const lum = (p) => (p[0] + p[1] + p[2]) / 3;
  const gain = lum(lit.on.in) - lum(lit.off.in);
  const blueGain = (lit.on.in[2] - lit.off.in[2]) - (lit.on.in[0] - lit.off.in[0]);
  check('the light is actually visible in the frame', gain > 30,
        'shaft adds ' + Math.round(gain) + ' brightness (' + lit.off.in.join(',')
        + ' -> ' + lit.on.in.join(',') + ')');
  check('...and it is the NEXT kingdom\'s colour, not this one\'s', blueGain > 12,
        'blue gains ' + Math.round(blueGain) + ' more than red');
  // A SHAFT IS A LOCAL THING. Comparing absolute brightness inside the beam
  // against a point beside it does not test that — the backdrop is painted, and
  // the spot 300 px to the left is a lit building. What has to be true is that
  // the LIGHT WE ADDED is local: switching the frontier off must change the
  // pixel inside the beam and leave the one outside it alone.
  const gainOut = lum(lit.on.out) - lum(lit.off.out);
  check('...and it is the shaft, not the whole room getting brighter',
        gain > gainOut * 3 + 10,
        'adds ' + Math.round(gain) + ' inside the beam, ' + Math.round(gainOut) + ' beside it');
  check('the pool on the floor obeys the art probe',
        lum(lit.probed.land) < lum(lit.on.land),
        'probe ' + Math.round(lum(lit.probed.land)) + ' vs normal ' + Math.round(lum(lit.on.land)));

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one door closes, the chapter ends, and she can walk back in');
})().catch(e => { console.error(e); process.exit(1); });
