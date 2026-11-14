// A JUMP DOES NOT MOVE THE FRAME (owner, 2026-11-14).
//
// "Jumping with the cat is moving the camera with it upward, which is preventing
// me from seeing the ground when I try to hit it when I go down... the camera
// should not follow the cat. The cat should float into the space freely until it
// reaches the upper limit of the screen, and then you follow it with the camera.
// Otherwise, the camera stays still."
//
// The frame aims at the ground she last stood on (cam.gy in updateCam). Four
// claims, each driven through the real update in a real room:
//   1. a jump from the floor leaves the frame where it was;
//   2. so the floor she jumped from is still on screen at the top of the jump;
//   3. landing higher brings the frame up to the new ground;
//   4. falling below the line is followed — a drop has to show where it goes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const step = n => { for (let i = 0; i < n; i++) { update(1 / 60); keysP.Space = 0; } };
    const fresh = (room, tx, ty) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.abil = { djump: 1 };
      startGame(sv); loadRoom(room); G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = []; G.projs = [];
      player.x = tx * TILE; if (ty != null) { player.y = ty * TILE - player.h; player.vy = 0; }
      step(120);
    };
    const jump = (hold) => { keys.Space = 1; keysP.Space = 1; step(1); step(hold); keys.Space = 0; };
    const out = {};
    // ---- 1 + 2: a tall room, so the frame is free to move and is not pinned
    // by the room's own edge. A7 is forty by thirty-two.
    fresh('A7', 8, null);
    const c0 = cam.y, y0 = player.y, feet0 = player.y + player.h, z = cam.zoom || 1;
    let drift = 0, top = y0, air = 0, floorSeen = true;
    jump(16);
    for (let i = 0; i < 80 && !(player.on && i > 6); i++) {
      step(1);
      if (!player.on) { air++; drift = Math.max(drift, Math.abs(cam.y - c0)); top = Math.min(top, player.y);
        // the floor line in screen space: inside the visible frame?
        const visBot = cam.y + 540 - 270 * (1 - 1 / z);
        if (feet0 > visBot - 4) floorSeen = false; }
    }
    out.jump = { drift: +drift.toFixed(2), rise: Math.round(y0 - top), air, floorSeen, on: player.on, zoom: +z.toFixed(2), pinned: c0 };
    // ---- 3: land on something higher. Lift her onto a ledge by hand: the
    // claim is about what the frame does when the ground under her changes.
    const cBefore = cam.y;
    player.y -= 5 * TILE; player.vy = 0; player.on = true;
    const gy1 = player.y;
    // hold her there as ground for a second
    for (let i = 0; i < 70; i++) { player.y = gy1; player.vy = 0; player.on = true; updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60); }
    out.land = { moved: +(cBefore - cam.y).toFixed(1) };
    // ---- 4: step off into a fall
    const cTop = cam.y;
    player.on = false; player.vy = 0;
    let maxDown = 0;
    for (let i = 0; i < 40; i++) { player.vy += 1400 / 60; player.y += player.vy / 60; player.on = false;
      updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60); maxDown = Math.max(maxDown, cam.y - cTop); }
    out.fall = { followed: +maxDown.toFixed(1) };
    // ---- the upper limit: carried far above her ground, she never leaves the top of the frame
    fresh('A7', 8, null);
    const g0 = player.y; let minScreenTop = 1e9;
    // ...as far as the room goes: past its own roof the frame cannot follow, by design
    const carry = Math.min(90, Math.floor((g0 - 5 * TILE) / 6));
    for (let i = 0; i < carry; i++) { player.y = g0 - i * 6; player.vy = -360; player.on = false;
      updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60);
      const zz = cam.zoom || 1, visTop = cam.y + 270 * (1 - 1 / zz);
      if (i > 20) minScreenTop = Math.min(minScreenTop, (player.y - visTop) * zz); }
    out.top = { margin: Math.round(minScreenTop), g0: Math.round(g0), carry };
    return out;
  });

  check('a full jump leaves the frame exactly where it was', r.jump.air > 10 && r.jump.rise > 120 && r.jump.drift < 1.5, JSON.stringify(r.jump));
  check('...so the floor she jumped from is on screen for the whole of it', r.jump.floorSeen);
  check('landing on higher ground brings the frame up to it', r.land.moved > 60, r.land.moved + 'px');
  check('falling below her ground is followed down', r.fall.followed > 40, r.fall.followed + 'px');
  check('carried to the top of the frame, the frame goes with her and she stays in it', r.top.carry > 30 && r.top.margin >= 20 && r.top.margin < 140, r.top.margin + 'px from the top edge ' + JSON.stringify(r.top));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — she jumps in the frame, not with it');
})().catch(e => { console.error(e); process.exit(1); });
