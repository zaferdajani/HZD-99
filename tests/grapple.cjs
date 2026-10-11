// THE GRAPPLING CLAW (js/grapple.js) — every promise it makes, against the real build.
//
// The claw is three states (throw, reel, retract) laid over Player.update, so
// most of what can go wrong is an edge between it and the rest of her kit: a
// claw that fires during a boss entrance, a reel that survives a hit, a dash
// that cannot cancel it, a controller screen that pushes its new row into the
// footer. Each is asserted here with the game's own clock and input path —
// keydown events, requestAnimationFrame — never a copy of the logic.
//
//   node tests/grapple.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── grapple — the claw bites walls and enemies, and gives way to everything that outranks it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof grapUpdate === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const press = async (code, holdFrames = 1) => {
      dispatchEvent(new KeyboardEvent('keydown', { code })); await frames(holdFrames);
      dispatchEvent(new KeyboardEvent('keyup', { code }));
    };
    const hold = code => dispatchEvent(new KeyboardEvent('keydown', { code }));
    const release = code => dispatchEvent(new KeyboardEvent('keyup', { code }));
    const out = {};
    const boot = async (abil) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      Object.assign(sv.abil, abil);
      startGame(sv); loadRoom('A1');
      G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.bossEntry = null; G.meet = null; G.gateWalk = null;
      await frames(40);
    };
    // A STANDING SPOT WITH A WALL IN REACH: scan the room for floor that has
    // solid rock at chest height within the claw's range on one side and a
    // clear run of at least ten tiles on the other (for the miss).
    const chestY = y => y + player.h * 0.42;
    const solidRun = (x, y, dir, max) => { for (let d = 8; d < max; d += 4) if (solidAt(Math.floor((x + dir * d) / TILE), Math.floor(y / TILE))) return d; return null; };
    // Rooms change as the world is built, so the search walks every room until
    // one has both: a wall 90-340 px away on one side and, on the other, open
    // air past the claw's full reach. The room is reported with the result.
    const spotIn = () => {
      for (let ty = 2; ty < G.roomDef.h - 1; ty++) for (let tx = 2; tx < G.roomDef.w - 2; tx++) {
        if (!solidAt(tx, ty) || solidAt(tx, ty - 1) || solidAt(tx, ty - 2) || tileAt(tx, ty - 1) === '^') continue;
        const x = tx * TILE + 4, y = ty * TILE - player.h - 0.01, cy = chestY(y);
        const L = solidRun(x + player.w / 2, cy, -1, GRAP.range + 80), R = solidRun(x + player.w / 2, cy, 1, GRAP.range + 80);
        if (L && L > 90 && L < GRAP.range - 20 && !R) return { x, y, wallDir: -1, wallD: L };
        if (R && R > 90 && R < GRAP.range - 20 && !L) return { x, y, wallDir: 1, wallD: R };
      }
      return null;
    };
    const findSpot = async () => {
      const ids = ['A1'].concat(Object.keys(ROOMS).filter(k => k !== 'A1'));
      for (const id of ids) {
        try { loadRoom(id); } catch (e) { continue; }
        G.enemies = []; G.boss = null; G.bossEntry = null;
        const s = spotIn();
        if (s) { s.room = id; return s; }
      }
      return null;
    };
    const place = async (s, face) => {
      player.x = s.x; player.y = s.y; player.vx = player.vy = 0; player.face = face; player.grap = null;
      player.grapCD = 0; player.grapAir = 0; player.iT = 0; player.dashT = 0; player.dashCD = 0;
      await frames(6);
    };

    // ---- 1. locked without the dash, open with it, announced once
    await boot({});
    out.unlockedBare = grapUnlocked();
    await press('KeyU'); await frames(2);
    out.firedLocked = !!player.grap;
    await boot({ dash: 1 });
    out.unlockedDash = grapUnlocked();
    out.toastOnce = !!(G.save.flags.grapSeen);

    // the controller screen and the keys do not depend on a room
    {
      const n = PAD_ACTIONS.length, colH = Math.ceil(n / 2);
      out.pad = { listed: PAD_ACTIONS.indexOf('GRAPPLE') >= 0, unbound: PAD_DEFAULT.GRAPPLE === -1,
        lastRowY: 142 + (colH - 1) * (colH > 8 ? 31 : 34), label: t('pa_GRAPPLE') };
      out.keyb = KEYB.GRAPPLE;
    }
    const spot = await findSpot();
    out.spot = spot && { room: spot.room, x: Math.round(spot.x), y: Math.round(spot.y), wallDir: spot.wallDir, wallD: Math.round(spot.wallD) };
    if (!spot) return out;
    G.enemies = []; G.boss = null; await frames(10);

    // ---- 2. the miss: the open side, out to full reach and back, she stays free
    await place(spot, -spot.wallDir);
    // The peak is read per SIMULATION STEP, not per rendered frame: under load
    // one frame runs several steps, and the turn from full reach to 'back'
    // happens inside one of them, so a frame sample can miss the top by 40 px.
    const grapStepOrig = grapUpdate;
    let maxLen = 0, sawBack = false, heldAfterBack = false;
    window.grapUpdate = function (p, dt) {
      const r = grapStepOrig(p, dt);
      if (p === player && p.grap) maxLen = Math.max(maxLen, p.grap.len);
      return r;
    };
    await press('KeyU');
    for (let i = 0; i < 40 && player.grap; i++) {
      await frames(1);
      if (player.grap) { maxLen = Math.max(maxLen, player.grap.len); if (player.grap.st === 'back') sawBack = true; }
      if (sawBack && player.grap && player.grap.st === 'throw') heldAfterBack = true;
    }
    out.miss = { maxLen: Math.round(maxLen), sawBack, gone: !player.grap, heldAfterBack };
    window.grapUpdate = grapStepOrig;

    // ---- 3. the wall: reel to it, arrive with a fresh air jump and the dash ready
    await place(spot, spot.wallDir);
    const x0 = player.x;
    await press('KeyU');
    let sawPull = false;
    for (let i = 0; i < 40 && player.grap && player.grap.st !== 'back'; i++) { await frames(1); if (player.grap && player.grap.st === 'pull') sawPull = true; }
    const travelled = Math.abs(player.x - x0);
    out.wall = { sawPull, travelled: Math.round(travelled), wallD: Math.round(spot.wallD), cd: +(player.grapCD || 0).toFixed(2),
      airJumps: player.airJumps, poseWasDash: null };
    await frames(30);

    // ---- 4. the reel draws her dash plate
    await place(spot, spot.wallDir);
    await press('KeyU');
    let pose = null;
    for (let i = 0; i < 20 && player.grap; i++) { await frames(1); if (player.grap && player.grap.st === 'pull') { pose = player.heroState(false); break; } }
    out.wall.poseWasDash = pose;
    await frames(40);

    // ---- 5. dash cancels the reel into the dash
    await place(spot, spot.wallDir);
    await press('KeyU');
    for (let i = 0; i < 20 && player.grap && player.grap.st !== 'pull'; i++) await frames(1);
    const wasPull = !!(player.grap && player.grap.st === 'pull');
    await press('KeyC'); await frames(1);
    out.dashCancel = { wasPull, dashing: player.dashT > 0, clawLetGo: !player.grap || player.grap.st === 'back' };
    await frames(40);

    // ---- 6. a hit knocks the claw loose
    await place(spot, spot.wallDir);
    await press('KeyU');
    for (let i = 0; i < 20 && player.grap && player.grap.st !== 'pull'; i++) await frames(1);
    player.iT = 0; player.hurt(1, player.x + 50, 'test');
    out.hurtCancel = !player.grap;
    await frames(60);

    // ---- 7. enemies: the bite and the arrival strike, both through dealDmg
    const mk = (dx, dyTiles) => {
      const e = new Enemy('crawler', 0, 0);
      e.x = player.x + player.w / 2 + dx - e.w / 2; e.y = player.y + player.h - e.h + dyTiles * TILE;
      e.vx = 0; G.enemies.push(e); return e;
    };
    await place(spot, -spot.wallDir);
    // a crawler on her own floor, in the open side
    let foe = mk(-spot.wallDir * 170, 0);
    foe.hp = foe.hpMax = 400; foe.update = function () {};   // stand still for the measurement
    const hp0 = foe.hp, volts0 = player.volts;
    await press('KeyU');
    let latched = false, bounced = false;
    for (let i = 0; i < 40; i++) {
      await frames(1);
      if (player.grap && player.grap.foe === foe) latched = true;
      if (!player.grap || player.grap.st === 'back') { bounced = player.vy < -200; break; }
    }
    out.enemy = { latched, hpLost: hp0 - foe.hp, bounced, iFrames: +player.iT.toFixed(2), voltsGained: player.volts - volts0 };
    G.enemies = []; await frames(40);

    // ---- 8. aim assist: she is in the air a tile and a half up, the crawler is on
    // the floor ahead — a level throw from her chest passes over its back, so only
    // the assist can land it (the case that missed in play before the assist)
    await place(spot, -spot.wallDir);
    foe = mk(-spot.wallDir * 120, 0); foe.hp = foe.hpMax = 400; foe.update = function () {};
    player.y -= 48; player.vy = 0; player.on = false;
    const levelY = player.y + player.h * 0.42, hbA = hurtBoxOf(foe);
    out.assistGeometry = { chestY: Math.round(levelY), foeTop: Math.round(hbA.y), passesOver: levelY < hbA.y - 6 };
    const hpA = foe.hp;
    await press('KeyU');
    let assisted = false;
    for (let i = 0; i < 30; i++) { await frames(1); if (player.grap && player.grap.foe === foe) assisted = true; if (!player.grap) break; }
    out.assist = { latched: assisted, hpLost: hpA - foe.hp, geometry: out.assistGeometry };
    G.enemies = []; await frames(40);

    // ---- 9. holds outrank the claw: the stun and the brace through the real frame;
    // the staged holds (boss entrance, gate walk, scripted meeting) the game clears
    // on its own outside their scenes, so those are asked of grapUpdate directly in
    // the same instant they are set — the rule under test, not the scene around it
    const blocked = {};
    for (const [name, set, clear] of [
      ['stun', () => { player.stunT = 1; }, () => { player.stunT = 0; }],
      ['guard', () => { player.guardT = 1; }, () => { player.guardT = 0; }],
    ]) {
      await place(spot, -spot.wallDir);
      set(); await press('KeyU'); await frames(2);
      blocked[name] = !player.grap; clear(); player.grap = null; await frames(4);
    }
    for (const [name, set, clear] of [
      ['bossEntry', () => { G.bossEntry = { t: 0, dur: 9 }; }, () => { G.bossEntry = null; }],
      ['gateWalk', () => { G.gateWalk = { t: 0 }; }, () => { G.gateWalk = null; }],
      ['meet', () => { G.meet = { interactive: false }; }, () => { G.meet = null; }],
    ]) {
      await place(spot, -spot.wallDir);
      set(); keysP.KeyU = 1;
      const owned = grapUpdate(player, 1 / 60);
      blocked[name] = !owned && !player.grap;
      keysP.KeyU = 0; clear(); player.grap = null;
    }
    out.blocked = blocked;

    // ---- 10. leaving the room lets go
    await place(spot, spot.wallDir);
    await press('KeyU'); await frames(2);
    if (player.grap) player.grap.room = '__elsewhere__';
    await frames(2);
    out.roomCancel = !player.grap;

    // ---- 11. two grapples in the air, then she must land
    await place(spot, -spot.wallDir);
    player.y -= 3 * TILE; player.on = false; player.grapAir = 0;
    const uses = [];
    for (let k = 0; k < 3; k++) { player.grapCD = 0; await press('KeyU'); await frames(1); uses.push(!!player.grap); player.grap = null; player.on = false; player.wallSlide = 0; }
    out.airUses = uses;

    return out;
  });

  check('locked before the dash', r.unlockedBare === false && r.firedLocked === false, JSON.stringify({ unlocked: r.unlockedBare, fired: r.firedLocked }));
  check('unlocked with the dash, announced once', r.unlockedDash === true && r.toastOnce === true);
  check('a room has a wall in reach on one side and open air on the other', !!r.spot, JSON.stringify(r.spot));
  if (r.spot) {
    check('miss: flies to full reach, retracts, lets her go', r.miss.maxLen >= 340 && r.miss.sawBack && r.miss.gone && !r.miss.heldAfterBack, JSON.stringify(r.miss));
    check('wall: hooks and reels her most of the way', r.wall.sawPull && r.wall.travelled > r.wall.wallD * 0.6, JSON.stringify(r.wall));
    check('wall: cooldown set and air jumps refreshed', r.wall.cd > 0 && r.wall.airJumps >= 0, JSON.stringify(r.wall));
    check('the reel draws her dash plate', r.wall.poseWasDash === 'dash', String(r.wall.poseWasDash));
    check('dash cancels the reel into the dash', r.dashCancel.wasPull && r.dashCancel.dashing && r.dashCancel.clawLetGo, JSON.stringify(r.dashCancel));
    check('a hit knocks the claw loose', r.hurtCancel === true);
    check('enemy: latched, bitten and struck on arrival', r.enemy.latched && r.enemy.hpLost > 0 && r.enemy.bounced, JSON.stringify(r.enemy));
    check('enemy: arrival grants i-frames and volts', r.enemy.iFrames > 0 && r.enemy.voltsGained > 0, JSON.stringify(r.enemy));
    check('aim assist: from the air, a level throw would pass over the crawler', r.assist.geometry.passesOver, JSON.stringify(r.assist.geometry));
    check('aim assist takes it anyway', r.assist.latched && r.assist.hpLost > 0, JSON.stringify(r.assist));
    check('stun, brace, boss entrance, gate walk and scripted meeting all outrank the claw',
      r.blocked.stun && r.blocked.guard && r.blocked.bossEntry && r.blocked.gateWalk && r.blocked.meet, JSON.stringify(r.blocked));
    check('leaving the room lets go', r.roomCancel === true);
    check('two grapples in the air, the third waits for ground', JSON.stringify(r.airUses) === '[true,true,false]', JSON.stringify(r.airUses));
  }
  check('controller screen lists GRAPPLE, unbound, clear of the footer (row < 397)', r.pad.listed && r.pad.unbound && r.pad.lastRowY < 397, JSON.stringify(r.pad));
  check('keyboard: U and 3', JSON.stringify(r.keyb) === JSON.stringify(['KeyU', 'Digit3', 'VGRAPPLE', 'GP_GRAPPLE']), JSON.stringify(r.keyb));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all grapple checks passed'));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
