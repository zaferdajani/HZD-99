// LOOK UP, LOOK DOWN (owner, 2026-09-27): "looking down should move the
// screen down or show me part of the down area. Looking up does the same."
//
// Holding UP or DOWN while standing still pans the frame that way after a
// beat; letting go brings it back. The beat is the contract with every other
// use of the stick, so this checks both halves: the pan happens when it
// should, and a tap, a walk or a jump never moves the frame.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function');
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name);
  };
  console.log('── look — hold up or down and the frame shows what is there');

  const r = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.comics = {};
    for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
    startGame(sv);
    // A LEDGE WITH ROOM ON BOTH SIDES OF THE FRAME: a solid tile with two
    // clear tiles over it, in the middle band of a room tall enough that the
    // camera is not already pinned to its roof or floor.
    let spot = null;
    for (const id of Object.keys(ROOMS)) {
      const R = ROOMS[id];
      if (!R || !R.h || R.h * TILE < 540 * 1.6) continue;
      loadRoom(id);
      for (let ty = Math.floor(R.h * 0.42); ty < R.h * 0.62 && !spot; ty++)
        for (let tx = 4; tx < R.w - 4 && !spot; tx++)
          if (solidAt(tx, ty) && !solidAt(tx, ty - 1) && !solidAt(tx, ty - 2) && !solidAt(tx + 1, ty - 1)
              && solidAt(tx + 1, ty)) spot = { id, tx, ty };
      if (spot) break;
    }
    if (!spot) return { err: 'no mid-height ledge found in any tall room' };
    const DT = 1 / 60;
    const settle = () => {
      loadRoom(spot.id);
      G.state = 'PLAY'; G.wake = null; G.dialog = null; G.cut = null; G.trans = null; G.bossEntry = null;
      G.enemies = []; G.boss = null; G.projs = [];
      for (const k in keys) keys[k] = 0;
      player.x = spot.tx * TILE + 2; player.y = spot.ty * TILE - player.h; player.vx = 0; player.vy = 0;
      for (let i = 0; i < 90; i++) { update(DT); for (const k in keysP) delete keysP[k]; }
      return cam.y;
    };
    const hold = (key, secs, extra) => {
      keys[key] = 1;
      for (let i = 0; i < secs * 60; i++) { if (extra) extra(i); update(DT); for (const k in keysP) delete keysP[k]; }
      const y = cam.y; keys[key] = 0; return y;
    };
    const rest = settle();
    const down = hold('ArrowDown', 1.4);
    for (let i = 0; i < 90; i++) update(DT);
    const back = cam.y;
    settle();
    const up = hold('ArrowUp', 1.4);
    settle();
    const tap = hold('ArrowDown', 0.2);
    // walking with DOWN held: the frame follows her, it does not look
    settle();
    const walkStart = cam.y;
    keys['ArrowRight'] = 1;
    const walk = hold('ArrowDown', 1.0);
    keys['ArrowRight'] = 0;
    const walkLook = cam.look;
    // off the ground: no look, whatever is held
    settle();
    player.vy = -600; player.on = false;
    hold('ArrowUp', 0.4);
    const airLook = cam.look;
    const onFeet = settle() !== undefined;
    return { spot, rest, down, back, up, tap, walkStart, walk, walkLook, airLook, onFeet,
             span: LOOK_SPAN * 540 / cam.zoom, zoom: cam.zoom };
  });

  if (r.err) { check('a ledge to look from', false, r.err); }
  else {
    console.log('  spot ' + r.spot.id + ' (' + r.spot.tx + ',' + r.spot.ty + '), zoom ' + r.zoom.toFixed(2)
      + ', pan ' + Math.round(r.span) + ' px');
    check('holding DOWN pans the frame down', r.down - r.rest > r.span * 0.75,
          Math.round(r.down - r.rest) + ' px of ' + Math.round(r.span));
    check('...and letting go brings it back', Math.abs(r.back - r.rest) < 12,
          Math.round(r.back - r.rest) + ' px from rest');
    check('holding UP pans the frame up', r.rest - r.up > r.span * 0.75,
          Math.round(r.rest - r.up) + ' px of ' + Math.round(r.span));
    check('a quick tap does not move the frame', Math.abs(r.tap - r.rest) < 6,
          Math.round(r.tap - r.rest) + ' px');
    check('walking with the stick tilted does not look', Math.abs(r.walkLook) < 2,
          'look offset ' + Math.round(r.walkLook) + ' px');
    check('in the air nothing looks', Math.abs(r.airLook) < 2, 'look offset ' + Math.round(r.airLook) + ' px');
  }
  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK — she can look before she leaps');
})();
