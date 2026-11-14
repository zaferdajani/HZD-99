// THE DEN STANDS ON ONE FLOOR, AND A DOOR IS A RUN (owner, 2026-11-14).
//
// "The table, the NPC and me, we are all on different levels... At some point,
// it looks like I'm standing on the leg of the table or smaller than a table,
// which is nonsense." The work table was anchored to the frame's buried bottom
// row, 51px below the floor the bodies stand on, and drawn as tall as the tinker.
//
// "The motion of me going inside the portal or the door is very slow... I
// shouldn't be walking slowly. Instead, I should be running inside with a second
// or two." The exit was up to 5.8 seconds of careful walk.
//
// The table is measured off the frame the game draws: its lowest opaque row is
// found by drawing the room with and without it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const den = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.storyVersion = 2;
    Object.assign(sv.flags, { ratchetRepaired: 1, ratchetReleased: 1, 'on_A0B|ratchet': 1, opNote: 1 });
    startGame(sv); loadRoom('A0B'); G.dialog = null; G.state = 'PLAY'; player.x = 22.6 * TILE - player.w / 2 - 40;   // at the table's near leg
    mediaFetch('forgeTable', 1);
    for (let i = 0; i < 400 && !(MEDIA_IMG.forgeTable && MEDIA_IMG.forgeTable.naturalWidth); i++) await new Promise(r => setTimeout(r, 25));
    for (let i = 0; i < 90; i++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; }
    const npc = G.statics.find(s => s.extra === 'ratchet');
    const ftop = (G.roomDef.h - 2) * TILE, half = DEN_TABLE_H * (4 / 3) * 0.4;
    const gl = groundColumnAt(22.6 * TILE - half), gr = groundColumnAt(22.6 * TILE + half);
    const fl = q => !q || q[1] < ftop - 1 ? ftop : Math.min(ftop, q[0]);
    const base = Math.max(fl(gl), fl(gr)) + 1;
    // the loft she can jump onto, over the table: the first '=' row above the floor there
    let loft = null; for (let ty = G.roomDef.h - 3; ty > 0; ty--) if (tileAt(22, ty) === '=') { loft = ty * TILE; break; }
    return { feet: player.y + player.h, npcFeet: npc ? npc.y + npc.h : null, base, tableH: DEN_TABLE_H, surfK: DEN_TABLE_SURF,
      loft, plate: !!(MEDIA_IMG.forgeTable && MEDIA_IMG.forgeTable.naturalWidth), heroDrawn: 92, on: player.on };
  });
  check('the table plate is the fired one', den.plate);
  check('she, the tinker and the table stand on one floor line',
    den.on && Math.abs(den.feet - den.npcFeet) <= 10 && Math.abs(den.base - den.feet) <= 8,
    'her feet ' + den.feet.toFixed(0) + ', his ' + (den.npcFeet || 0).toFixed(0) + ', table legs ' + den.base.toFixed(0));
  check('she is taller than the table', den.tableH < den.heroDrawn && den.tableH >= 60, den.tableH + 'px against her ' + den.heroDrawn);
  // the plate's work surface, measured off the plate: that is the top she lands on
  const surf = den.base - den.tableH * den.surfK;
  check('...and its top is the ledge she can jump onto', den.loft != null && Math.abs(surf - den.loft) <= 8, 'surface ' + surf.toFixed(0) + ', loft ' + den.loft);

  const door = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2;
    Object.assign(sv.flags, { ratchetRepaired: 1, ratchetReleased: 1, 'on_A0B|ratchet': 1, opNote: 1 });
    startGame(sv); loadRoom('A0B'); G.dialog = G.wake = G.cut = G.tut = null; G.state = 'PLAY';
    for (const k of ['heroGateRun', 'heroDeparture', 'heroGateWalk']) mediaFetch(k, 1);
    for (let i = 0; i < 400 && !gateBackReady(); i++) await new Promise(r => setTimeout(r, 25));
    const D = GATE_ROOM.A0B, gx = G.roomDef.w * TILE * D.at;
    // from as far off as the door still answers
    let far = 0; for (let d = 0; d < 200; d += 4) { player.x = gx - player.w / 2 + d; if (gateEnter()) { far = d; G.gateWalk = null; } }
    player.x = gx - player.w / 2 + far; for (let i = 0; i < 20; i++) update(1 / 60);
    const ok = gateEnter(); let t = 0; const keys2 = {};
    while (G.gateWalk && t < 12) { update(1 / 60); t += 1 / 60; if (G.gateWalk && G.gateWalk.align >= 1 && G.gateWalk.t > 0.15) { drawGateWalk(); keys2[G.gateBackKey || 'side'] = 1; } }
    return { ok, far, secs: +t.toFixed(2), room: G.roomId, drew: Object.keys(keys2), walk: GATE_WALK };
  });
  check('the den door answers', door.ok, JSON.stringify(door));
  check('from the edge of its reach to the other side takes two seconds or less', door.room === 'A0' && door.secs <= 2.0, door.secs + 's (was up to 5.8)');
  check('...and the way in is drawn as the run', door.drew.includes('heroGateRun') && !door.drew.includes('side'), door.drew.join(','));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — one floor in the den, and she runs through the door');
})().catch(e => { console.error(e); process.exit(1); });
