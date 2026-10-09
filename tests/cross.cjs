// A ROOM CROSSING IS A MOVE, NOT A CUT.
//
// The owner, 2026-08-23: "How can I make the screen less confined to the
// screen frame? ... giving the effect of the map to not become cubicles of
// rooms connected... instead, it's actual world connected."
//
// Every screen edge used to fade the picture to solid black over 0.28s, swap
// the room at the halfway point, and fade back — with the world frozen for the
// whole of it. Two rooms joined by a blackout are two rooms. They are joined
// by the camera carrying through now: the room swaps on the first frame, the
// picture she left is held and PUSHED off the side she left by, and she keeps
// walking underneath it.
//
// Three things have to be true and none can be read off the source:
//   1. THE CROSSING LANDS. Every side, every time, in the right room.
//   2. SHE DOES NOT STOP. The world runs during it — that is the whole point.
//   3. THE INTERFACE DOES NOT SLIDE. The held frame is the WORLD, taken before
//      the HUD goes on. Held the finished screen instead and the crossing
//      showed two map buttons and two rows of hearts, which reads as a glitch
//      rather than as travel. Measured on the map button's own rectangle.
//   4. UP AND DOWN THERE IS NO PICTURE TO SLIDE AT ALL (plan §2 fix 3,
//      game.js VERTICAL LINKS). A vertical pair is one shaft: the room above
//      or below is drawn where it really is, and the room changes when her
//      centre crosses the line with the camera translated by exactly the
//      offset between them. So a vertical trip is measured the other way
//      round: nothing is held, nothing slides, and where she is on the screen
//      moves only by what her own body moved that frame.
//
//   node tests/cross.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cross — a room crossing is a move, not a cut\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = { runs: [] };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    // THE MANHWA REWARDS ARE A MODAL (js/comics.js): 'awakened' is earned, so
    // the first chapter opens the moment she stands still — mid-harness, under
    // the G.state = 'PLAY' each trip forces. A save that has already been
    // offered them is the save this test is about: crossings, not memories.
    sv.comics = {};
    for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
    startGame(sv);
    // one of each direction the world actually offers
    const TRIPS = [['A1', 'R'], ['A2', 'L'], ['A2', 'B'], ['A5', 'T']];
    for (const [room, side] of TRIPS) {
      loadRoom(room);
      G.wake = null; G.state = 'PLAY'; G.bossEntry = null;
      for (let i = 0; i < 40; i++) await new Promise(k => requestAnimationFrame(k));
      G.enemies = []; G.boss = null;
      const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
      const want = (G.roomDef.exits || {})[side];
      if (!want) { out.runs.push({ room, side, err: 'no ' + side + ' exit' }); continue; }
      // put her at the edge and press into it
      if (side === 'R') { player.x = W - 30; player.y = (G.roomDef.h - 4) * TILE; keys['ArrowRight'] = 1; }
      if (side === 'L') { player.x = 12; player.y = (G.roomDef.h - 4) * TILE; keys['ArrowLeft'] = 1; }
      // THE CELLAR HATCH IS THE SHAFT between A2 and A5: the way down is the
      // floor she cuts, and the way back up is the same hole. Both vertical
      // trips are made through it, cut, the way the route is played.
      const hatch = () => {
        const U = buildRoom('A2');
        for (let ty = U.length - 3; ty < U.length; ty++) for (let tx = 0; tx < U[0].length; tx++)
          if (U[ty][tx] === 'B') G.save.broken['A2:' + tx + ',' + ty] = 1;
        tileDirty = true;
      };
      if (side === 'B') {
        hatch();
        const L = G.vlink && G.vlink.B, lg = buildRoom(want);
        let hx = 0; for (let x = 1; x < lg[0].length - 1; x++) if (lg[0][x] === '.') { hx = x; break; }
        player.x = (hx + 1) * TILE + (L ? L.ox : 0); player.y = H - 3 * TILE; player.vy = 300; player.on = false;
      }
      // THE UPWARD TRIP IS ENTERED DIRECTLY, and it is the one direction that
      // has to be. Teleported above the room she landed on A2's bottom lip
      // with the exit she came from under her feet and fell straight back, so
      // the run measured the RETURN; jumped through A5's real ceiling opening
      // she does not clear it from a standing start. The render path is what
      // matters here — the held frame, the push's SIGN on the vertical axis,
      // and the landing — so she is stood under the opening (which is what
      // arms the frame hold) and the crossing is started the way the edge
      // check starts it.
      // ...and the way up is now JUMPED, not started by hand: the old forced
      // start existed to arm a held picture, and a vertical crossing has none.
      // She rises through A5's opening with the jump held, and the shaft does
      // the rest (it carries her onto the ledge beside A2's hatch).
      if (side === 'T') {
        hatch();
        let hx = 0; for (let x = 1; x < G.roomDef.w - 1; x++) if (G.grid[0][x] === '.') { hx = x; break; }
        player.x = (hx + 1) * TILE + 4; player.y = TILE + 2; player.vy = -760; player.on = false;
        keys[KEYB.JUMP[0]] = 1;
      }
      let sawTrans = 0, moved = 0, held = 0, hudLeak = -1, landed = null;
      const seenRooms = [];
      let px0 = null;
      const vert = side === 'T' || side === 'B';
      let prevS = player.y - cam.y, prevRoom = G.roomId, tPrev = performance.now(), jump = null, everHeld = 0;
      for (let i = 0; i < 200; i++) {
        await new Promise(k => requestAnimationFrame(k));
        if (vert) {
          // one shaft: count anything held or slid, and measure the screen at
          // the frame the room changes against what her body moved that frame
          const now = performance.now(), dtf = (now - tPrev) / 1000; tPrev = now;
          if (G.trans) sawTrans++;
          if (typeof transSnap !== 'undefined' && transSnap) everHeld++;
          const sNow = player.y - cam.y;
          if (G.roomId !== prevRoom && jump == null) {
            jump = { px: Math.round(Math.abs(sNow - prevS)), allow: Math.round(1100 * Math.min(dtf, 0.1) + 30) };
            landed = G.roomId;
          }
          prevS = sNow; prevRoom = G.roomId;
          if (G.roomId !== room && seenRooms.indexOf(G.roomId) < 0) seenRooms.push(G.roomId);
          if (jump && !G.climb && player.on) break;
          continue;
        }
        if (G.trans) {
          sawTrans++;
          // WHERE THE FIRST CROSSING PUT HER. The world keeps running now, so
          // a forced upward trip can start its next crossing on the very frame
          // the last one ends — G.trans never reads false between them, and
          // waiting for it to means reading the SECOND answer.
          // EVERY room the crossing put her in. With the world running the
          // next crossing can start on the very frame the last one ends, and
          // a forced upward trip that arrives on the destination's bottom lip
          // can bounce back inside a SINGLE frame — so the question is not
          // "where is she now" but "did the crossing reach where it said".
          if (G.roomId !== room && seenRooms.indexOf(G.roomId) < 0) seenRooms.push(G.roomId);
          if (!landed && G.roomId !== room) landed = G.roomId;
          if (typeof transSnap !== 'undefined' && transSnap) held++;
          if (px0 == null) px0 = player.x; else if (Math.abs(player.x - px0) > 0.5) moved = 1;
          if (hudLeak < 0 && transSnap) {
            // THE MAP BUTTON'S OWN RECTANGLE, in the held frame. The live HUD
            // draws it every frame; the held WORLD frame must not have it.
            const tc = transSnap.getContext('2d');
            const sc = cv.width / 960, sy = cv.height / 540;
            // mapBtnRect() is the button; its label is near-white (#bcd6e6 /
            // #eaffff). Count only BRIGHT AND PALE pixels: the room's own lit
            // grass scrolls through this corner and is bright but saturated
            // green, which read as 48 "HUD" pixels on some camera offsets.
            const mb = mapBtnRect();
            const x = Math.round(mb.x * sc), y = Math.round(mb.y * sy);
            const w = Math.max(4, Math.round(mb.w * sc)), h = Math.max(4, Math.round(mb.h * sy));
            const d = tc.getImageData(x, y, w, h).data;
            let bright = 0;
            for (let q = 0; q < w * h; q++) {
              const hi = Math.max(d[q * 4], d[q * 4 + 1], d[q * 4 + 2]);
              const lo = Math.min(d[q * 4], d[q * 4 + 1], d[q * 4 + 2]);
              if (hi > 150 && hi - lo < 70) bright++;
            }
            hudLeak = bright;
          }
        } else if (sawTrans) { landed = G.roomId; break; }
      }
      for (const k in keys) keys[k] = 0;
      // LANDED IS WHERE THE FIRST CROSSING PUT HER, read the frame it ended.
      // Reading it after the loop said A5 for the upward trip: she arrives in
      // A2 at its bottom edge and falls straight back through the exit she
      // came from, so the answer was the SECOND crossing's.
      out.runs.push({ room, side, want, landed: landed || G.roomId, seenRooms, frames: sawTrans, held, moved, hudLeak,
        vert, jump, everHeld, stand: vert ? (player.on && G.roomId === want) : null });
    }
    out.dur = typeof TRANS_DUR !== 'undefined' ? TRANS_DUR : null;
    return out;
  });

  check('the crossing is a slide, not a blink', r.dur >= 0.25, 'TRANS_DUR ' + r.dur + 's');
  for (const run of r.runs) {
    const tag = run.room + ' ' + run.side + ' -> ' + (run.want || '?');
    if (run.err) { check(tag, false, run.err); continue; }
    const reached = run.landed === run.want || (run.seenRooms || []).indexOf(run.want) >= 0;
    check(tag + ': it lands', reached,
          'landed in ' + run.landed + (run.seenRooms && run.seenRooms.length > 1
            ? ' (visited ' + run.seenRooms.join(' -> ') + ')' : ''));
    if (run.vert) {
      check(tag + ': one shaft — nothing held, nothing slid', run.frames === 0 && run.everHeld === 0,
            run.frames + ' frames of cut crossing, ' + run.everHeld + ' frames of held picture');
      check(tag + ': ...and the camera carries her across the line', !!run.jump && run.jump.px <= run.jump.allow,
            run.jump ? 'screen moved ' + run.jump.px + ' px on the crossing frame (her own travel allows ' + run.jump.allow + ')' : 'no crossing frame');
      check(tag + ': ...and she ends on her feet there', run.stand === true, run.stand ? 'standing in ' + run.want : 'not standing in ' + run.want);
      continue;
    }
    check(tag + ': the picture she left is held and pushed', run.held > 0,
          run.held + ' of ' + run.frames + ' crossing frames');
    check(tag + ': ...and the interface does not slide with it', run.hudLeak === 0,
          run.hudLeak + ' lit pixels of HUD in the held world frame');
  }
  const walked = r.runs.filter(q => q.side === 'R' || q.side === 'L');
  check('she keeps walking through it', walked.every(q => q.moved === 1),
        walked.map(q => q.side + (q.moved ? ' moves' : ' FROZEN')).join('  '));

  // ---- THE CLIMB CANNOT STALL -------------------------------------------
  // The owner, 2026-08-24: jumping up into the room above, "loading" ate the
  // jump and she fell back down the shaft. The carry is state-based now
  // (applyTransition sets tCarry; Player.update re-asserts the rise until
  // her feet clear the destination floor) — so this run simulates the WORST
  // frames a first-visit art decode produces: the whole climb stepped at a
  // janky 1/12s, straight through A1's ceiling opening into the gantries.
  const climb = await page.evaluate(() => {
    loadRoom('A1'); G.state = 'PLAY'; G.enemies = []; G.boss = null; G.dialog = null;
    // near-apex crossing: barely through the opening, almost no speed left —
    // exactly the jump the old time-based -620 lost to a hitch
    player.x = 20.5 * TILE; player.y = -70; player.vy = -80; player.vx = 160; player.on = false;
    // ...holding a direction, the way any player finishing this jump does —
    // the carry owes her the height and the hang time; the landing beside
    // the hole is still hers to steer
    keys['ArrowRight'] = 1;
    const seen = [];
    for (let i = 0; i < 60; i++) {
      update(1 / 12);
      if (seen.indexOf(G.roomId) < 0) seen.push(G.roomId);
      G.enemies = [];                    // the gantries' machines are not the question
      if (G.roomId === 'A6' && player.on
          && player.y + player.h <= (G.roomDef.h - 2) * TILE + 2 && !G.trans) {
        return { ok: true, seen, feet: player.y + player.h, floor: (G.roomDef.h - 2) * TILE };
      }
    }
    keys['ArrowRight'] = 0;
    return { ok: false, seen, room: G.roomId, y: player.y, vy: player.vy, carry: player.tCarry };
  });
  check('an upward jump under load-jank still lands the floor above', climb.ok,
        climb.ok ? 'rooms ' + climb.seen.join(' -> ') + ', standing at its floor'
                 : JSON.stringify(climb));

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
