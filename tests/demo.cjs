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

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one door closes, the chapter ends, and she can walk back in');
})().catch(e => { console.error(e); process.exit(1); });
