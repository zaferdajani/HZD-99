// KINGDOM 1's SECRETS, MEASURED — docs/ART_QUEUE.md §2aj.
//
// Three rooms the road does not show, and each is a promise the tile grid
// can break silently: a hollow wall that is not brittle, a cellar hatch the
// pogo cannot cut, a pit a plain jump clears (so the dash gate is no gate) or
// the dash cannot (so the vault is a wall with a relic drawn behind it). So
// this cuts every wall with the real claw, drops through the real hatch, and
// jumps the real pit both ways.
//
//   node tests/secrets.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── secrets — two hollow walls, a cellar hatch, and a pit only the dash crosses');

  const r = await page.evaluate(async () => {
    const DT = 1 / 60, out = {};
    const boot = (room, abil) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.abil = abil || {};
      startGame(sv); loadRoom(room); G.dialog = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
      G.bossEntry = null; G.gateWalk = null; G.wake = null; G.toasts = [];
      for (let i = 0; i < 30; i++) update(DT);
    };
    const floorY = () => (G.roomDef.h - 2) * TILE - player.h;
    const press = (k) => { keysP[k] = 1; keys[k] = 1; update(DT); keysP[k] = 0; keys[k] = 0; };
    // a jump is HELD — a one-frame tap is a 20 px hop (the jump is variable
    // height), so the button stays down for a quarter second after the press
    let zHold = 0;
    const jump = () => { keysP.KeyZ = 1; keys.KeyZ = 1; update(DT); keysP.KeyZ = 0; zHold = 14; };
    const tick = () => { update(DT); if (zHold > 0 && --zHold === 0) keys.KeyZ = 0; };

    // ---- 1. the hollow walls: brittle, and a claw opens them onto the room behind
    for (const [room, plug, dest] of [['A9', [1, 13, 2, 14], 'A11'], ['A6', [1, 17, 2, 18], 'A13']]) {
      boot(room);
      const [x0, y0, x1, y1] = plug;
      let brittle = true;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) !== 'B') brittle = false;
      out[room + 'Brittle'] = brittle;
      // stand against it and swing, facing the wall
      player.x = (x1 + 1) * TILE + 6; player.y = (y1 + 1) * TILE - player.h; player.vx = 0; player.vy = 0;
      player.face = -1; player.faceVis = -1;
      for (let i = 0; i < 120; i++) { keys.ArrowLeft = 1; if (i % 10 === 0) press('KeyX'); else update(DT); }
      keys.ArrowLeft = 0;
      let open = 0, total = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { total++; if (tileAt(x, y) === '.') open++; }
      out[room + 'Cut'] = open + '/' + total;
      out[room + 'Opened'] = open >= total * 0.5;
      // ...and walking through lands in the room behind
      for (let i = 0; i < 240 && G.roomId === room; i++) { keys.ArrowLeft = 1; update(DT); }
      keys.ArrowLeft = 0;
      out[room + 'Through'] = G.roomId === dest;
      for (let i = 0; i < 10; i++) update(DT);            // let the crossing finish loading the room
      // the room behind pays: a hidden relic and scrap
      const st = G.statics || [];
      // scrap counts whether it is still lying there or she walked onto it on the way in
      const scrapHere = (G.pickups || []).some(p => p.constructor && /Scrap/.test(p.constructor.name))
        || Object.keys(G.save.flags).some(k => k.startsWith('sc_' + dest + '_'));
      out[dest + 'Pays'] = st.some(s => s.type === 'secret') && scrapHere;
    }

    // ---- 2. the cellar hatch under the camp: brittle, cut by the pogo, drops into A12
    boot('A3');
    out.hatchBrittle = tileAt(10, 15) === 'B' && tileAt(11, 15) === 'B' && tileAt(10, 16) === 'B';
    player.x = 10 * TILE + 8; player.y = floorY(); player.vx = 0;
    // the pogo lands where the paws are: a down-swing at the apex cuts air, so
    // she hops and swings on the way DOWN, a body-length above the floor
    let swung = false;
    for (let i = 0; i < 240 && G.roomId === 'A3'; i++) {
      player.x = 10 * TILE + 8; player.vx = 0;           // stay over the hatch
      if (player.on && zHold === 0) { jump(); swung = false; continue; }
      keys.ArrowDown = 1;
      if (!swung && player.vy > 0 && player.y > 15 * TILE - player.h - 40) { press('KeyX'); swung = true; } else tick();
    }
    keys.ArrowDown = 0; keys.KeyZ = 0;
    for (let i = 0; i < 120 && G.roomId === 'A3'; i++) update(DT);
    out.hatchDrops = G.roomId === 'A12';

    // ---- 3. the pit: a full jump from the shelf's lip fails, the dash clears it
    const pitRun = (abil) => {
      boot('A12', abil);
      // the lip: the last floor column before the spikes is 16
      player.x = 3 * TILE; player.y = floorY(); player.vx = 0; player.vy = 0;
      let jumped = false, dashed = false, lowest = 0;
      for (let i = 0; i < 300; i++) {
        keys.ArrowRight = 1;
        const lip = (16 + 1) * TILE - player.w - 2;
        if (!jumped && player.x >= lip) { jump(); jumped = true; continue; }
        if (jumped && abil.dash && !dashed && player.vy > -80) { press('KeyC'); dashed = true; continue; }
        tick();
        lowest = Math.max(lowest, player.y);
        if (jumped && player.on) break;
        if (player.dead || player.hurtPoseT > 0) break;
      }
      keys.ArrowRight = 0; keys.KeyZ = 0;
      // the spikes kill: a death sends her to the bench, which is not this room
      return { col: Math.floor((player.x + player.w / 2) / TILE), hurt: player.cores < player.maxCores() || player.dead || G.roomId !== 'A12', dashed };
    };
    out.plain = pitRun({});
    out.dash = pitRun({ dash: 1 });
    // ...and home again the other way
    boot('A12', { dash: 1 });
    player.x = 36 * TILE; player.y = floorY(); player.face = -1;
    let jumped = false, dashed = false;
    for (let i = 0; i < 300; i++) {
      keys.ArrowLeft = 1;
      if (!jumped && player.x <= 29 * TILE + 2) { jump(); jumped = true; continue; }
      if (jumped && !dashed && player.vy > -80) { press('KeyC'); dashed = true; continue; }
      tick();
      if (jumped && player.on) break;
      if (player.hurtPoseT > 0) break;
    }
    keys.ArrowLeft = 0; keys.KeyZ = 0;
    out.home = { col: Math.floor((player.x + player.w / 2) / TILE), hurt: player.cores < player.maxCores() || G.roomId !== 'A12' };
    out.starThere = (G.statics || []).some(s => s.type === 'secret' && s.extra === 'star');
    return out;
  });

  check('A9\'s west wall is brittle rock', r.A9Brittle);
  check('...a claw opens it', r.A9Opened, r.A9Cut);
  check('...onto A11', r.A9Through);
  check('...which pays: a hidden relic and scrap', r.A11Pays);
  check('A6\'s west wall is brittle rock', r.A6Brittle);
  check('...a claw opens it', r.A6Opened, r.A6Cut);
  check('...onto A13', r.A6Through);
  check('...which pays: a hidden relic and scrap', r.A13Pays);
  check('the camp floor rings hollow between the bench and the trader', r.hatchBrittle);
  check('...and a pogo drops her into the vault', r.hatchDrops);
  check('a full run-up jump does NOT clear the pit', r.plain.col <= 28 && r.plain.hurt, 'landed col ' + r.plain.col + (r.plain.hurt ? ', hurt' : ', unhurt'));
  check('a jump with the dash does', r.dash.col >= 29 && !r.dash.hurt, 'landed col ' + r.dash.col + (r.dash.hurt ? ', hurt' : ''));
  check('...and back again', r.home.col <= 16 && !r.home.hurt, 'landed col ' + r.home.col);
  check('the star is on the far shelf', r.starThere);
  check('no page errors', errs.length === 0, errs.join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — the walls open, the floor gives, and only the dash crosses the pit');
})();
