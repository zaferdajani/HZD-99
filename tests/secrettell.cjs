// ONE TELL FOR EVERY SECRET, AND ONE PLACE EACH KIND IS TAUGHT.
//
// The plan's §5: the way to the first cave depends on a down-attack through a
// brittle floor that nothing ever teaches, and a secret wall's only tell was a
// hairline crack — one hit and it was gone, so it never got to SOUND hollow.
// This drives the real claw at the real rock and measures:
//
//   1. THE WALL KNOCKS BEFORE IT BREAKS. A0's teaching pocket: the first blow
//      leaves the plug standing, plays the hollow note, puffs grit and says
//      the hint_secret line; the second opens it — and the scrap behind it
//      stayed behind it until then.
//   2. THE FLOOR RINGS FROM THE SIDE AND GIVES FROM ABOVE. A0's crust: struck
//      sideways it only rings (the floor's own line, once); a down-strike
//      cuts it in ONE, and she drops onto what was under it.
//   3. THE DOWN-STRIKE DIGS. A2's hulk: a crust two courses deep. One strike
//      from above cuts both, the same blow rebounds her (the pogo), and she
//      comes down into the hold it opened, which pays.
//   4. THE HINTS HAVE THEIR OWN 'SEEN'. Opening a wall first (A6's, off the
//      critical path, used to do this) no longer retires the floor's prompt;
//      cutting a floor retires the floor's prompt and not the wall's.
//   5. A FRACTURE WORLD'S LOOSE ROCK WEARS THE SAME FACE AND REALLY BREAKS.
//      It was authored '#', so it was drawn as plain wall, and a broken one
//      stayed standing (tileAt only honoured cuts in 'B').
//
//   node tests/secrettell.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail == null ? '' : '  ' + detail));
  if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
};

(async () => {
  console.log('── secrettell — one tell for every secret, one place each kind is taught\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const r = await page.evaluate(async () => {
    const DT = 1 / 60, out = {};
    const sounds = [];
    const realSfx = window.sfx;
    window.sfx = function (n) { sounds.push(n); return realSfx.apply(this, arguments); };
    const boot = (room, flags) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; Object.assign(sv.flags, flags || {});
      startGame(sv); loadRoom(room); G.dialog = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
      G.bossEntry = null; G.gateWalk = null; G.wake = null; G.toasts = []; G.tut = null;
      for (let i = 0; i < 30; i++) update(DT);
    };
    const settle = (n) => { for (let i = 0; i < (n || 30); i++) update(DT); };
    const swing = () => {
      keysP.KeyX = 1; keys.KeyX = 1; update(DT); keysP.KeyX = 0; keys.KeyX = 0;
      for (let i = 0; i < 40; i++) update(DT);          // let the swing and its recovery finish
    };
    const toasts = () => (G.toasts || []).map(q => q.text);
    const stand = (tx, rowTop, face) => {
      player.x = tx * TILE + (TILE - player.w) / 2; player.y = rowTop * TILE - player.h;
      player.vx = 0; player.vy = 0; player.face = face; player.faceVis = face;
      for (let i = 0; i < 8; i++) update(DT);
    };
    const scrapIn = (x0, y0, x1, y1) => (G.pickups || []).filter(p => p instanceof Scrap && !p.dead
      && p.x + p.w / 2 >= x0 * TILE && p.x + p.w / 2 < (x1 + 1) * TILE && p.y + p.h / 2 >= y0 * TILE && p.y + p.h / 2 < (y1 + 1) * TILE).length;
    // a down-strike: hop, hold DOWN, and strike on the way DOWN a body-length
    // over the surface (at the apex the paws cut air — tests/secrets.cjs)
    const downStrike = (tx, surfRow) => {
      let swung = false, hz = 0, after = 0, minVy = 1e9;
      for (let i = 0; i < 160; i++) {
        player.x = tx * TILE + (TILE - player.w) / 2; player.vx = 0;
        keys.ArrowDown = 1;
        if (player.on && !swung && hz === 0) { keysP.KeyZ = 1; keys.KeyZ = 1; update(DT); keysP.KeyZ = 0; hz = 10; continue; }
        if (hz > 0 && --hz === 0) keys.KeyZ = 0;
        if (!swung && player.vy > 0 && player.y + player.h > surfRow * TILE - 40) { keysP.KeyX = 1; keys.KeyX = 1; update(DT); keysP.KeyX = 0; keys.KeyX = 0; swung = true; continue; }
        update(DT);
        if (swung && after++ < 8) minVy = Math.min(minVy, player.vy);
        if (swung && player.on) break;
      }
      keys.ArrowDown = 0; keys.KeyZ = 0;
      settle(10);
      return minVy;
    };

    // ---- 1. the wall: knock, then break -----------------------------------
    boot('A0');
    out.plugBefore = tileAt(3, 10) + tileAt(3, 11);
    settle(120);                                         // the pocket scrap comes to rest
    out.pocketScrap0 = scrapIn(1, 10, 2, 11);
    stand(5, 12, -1);                                    // on the lit shelf, facing the plug
    settle(150);                                         // well past the drift delay, in drift range
    out.pocketScrapNear = scrapIn(1, 10, 2, 11);
    sounds.length = 0; G.toasts = [];
    stand(4, 12, -1);
    swing();
    out.afterOne = tileAt(3, 10) + tileAt(3, 11);
    out.knockSound = sounds.includes('hollow');
    out.breakSoundOne = sounds.includes('break');
    out.secretLine = toasts().includes(t('hint_secret'));
    out.knocks = G.knocks && G.knocks.A0 ? Object.keys(G.knocks.A0).length : 0;
    sounds.length = 0;
    const s0 = G.save.scrap;
    swing();
    out.afterTwo = tileAt(3, 10) + tileAt(3, 11);
    out.breakSoundTwo = sounds.includes('break');
    out.wallFlag = !!G.save.flags.taughtWall; out.floorFlagAfterWall = !!G.save.flags.taughtFloor;
    // the line opens: the pocket's scrap now comes to her
    for (let i = 0; i < 240; i++) update(DT);
    out.wallPays = G.save.scrap > s0;

    // ---- 4a. a wall opened first does not retire the floor's prompt -------
    // stand on A0's crust with taughtWall set and listen for the floor prompt
    const prompts = [];
    const realFtxt = window.ftxt;
    window.ftxt = function (msg) { prompts.push(msg); return realFtxt.apply(this, arguments); };
    const hintAt = (tx, rowTop) => {
      prompts.length = 0; stand(tx, rowTop, 1);
      c.save(); c.translate(-Math.round(camSX()), -Math.round(camSY())); drawBreakHint(); c.restore();
      return prompts.slice();
    };
    boot('A0', { taughtBreak: 1, taughtWall: 1 });
    out.floorHintAfterWall = hintAt(57, 13).includes(t('break_down'));
    boot('A0', { taughtBreak: 1, taughtFloor: 1 });
    out.wallHintAfterFloor = hintAt(5, 12).includes(t('break_hit'));
    out.floorHintAfterFloor = hintAt(57, 13).includes(t('break_down'));

    // ---- 2. the floor: rings from the side, gives from above --------------
    boot('A0');
    settle(60);
    stand(56, 13, 1);                                    // on the crown, west of the crust
    sounds.length = 0; G.toasts = [];
    swing(); swing(); swing();
    out.crustAfterSide = tileAt(57, 13) + tileAt(58, 13);
    out.floorKnock = sounds.includes('hollow');
    out.floorLine = toasts().includes(t('hint_hollow_floor'));
    const s1 = G.save.scrap;
    downStrike(57, 13);
    out.crustAfterDown = tileAt(57, 13);
    out.fellIn = player.y + player.h > 13 * TILE + 24;     // well below the crown she stood on
    for (let i = 0; i < 200; i++) update(DT);
    out.floorPays = G.save.scrap > s1;
    out.floorFlag = !!G.save.flags.taughtFloor;

    // ---- 3. the dig: one strike, both courses, and the rebound ------------
    boot('A2');
    settle(60);
    stand(79, 12, 1);
    out.digBefore = tileAt(80, 12) + tileAt(80, 13);
    const s2 = G.save.scrap;
    const rebound = downStrike(80, 12);
    out.digAfter = tileAt(80, 12) + tileAt(80, 13);
    for (let i = 0; i < 90; i++) { player.x = 80 * TILE + 8; player.vx = 0; update(DT); }
    out.digRebound = Math.round(rebound);
    out.digFeet = Math.round(player.y + player.h);
    out.digDown = player.y + player.h > 13 * TILE + 16;   // down in what she cut, well under the crust's top
    for (let i = 0; i < 200; i++) update(DT);
    out.digPays = G.save.scrap > s2;

    // ---- 5. the fracture modifier -----------------------------------------
    const realHas = window.brHas;
    window.brHas = (a) => a === 'fracture' || realHas(a);
    boot('A1');
    let loose = null;
    for (let ty = 2; ty < G.grid.length - 1 && !loose; ty++)
      for (let tx = 2; tx < G.grid[0].length - 2 && !loose; tx++)
        if (G.grid[ty][tx] === '#' && brLoose(tx, ty)) loose = { tx, ty };
    out.looseFound = !!loose;
    if (loose) {
      // the tile layer draws it with the loose rock's face: compare the pixels
      // of the same tile with the modifier on and off
      const shot = () => {
        const P = PAL[G.roomDef.zone];
        c.save(); c.setTransform(1, 0, 0, 1, 100 - loose.tx * TILE, 100 - loose.ty * TILE);
        c.clearRect(loose.tx * TILE - 4, loose.ty * TILE - 4, TILE + 8, TILE + 8);
        drawTiles(P); c.restore();
        return Array.from(c.getImageData(100, 100, TILE, TILE).data);
      };
      const on = shot();
      window.brHas = realHas;
      const off = shot();
      window.brHas = (a) => a === 'fracture' || realHas(a);
      let diff = 0;
      for (let i = 0; i < on.length; i += 4) diff += Math.abs(on[i] - off[i]) + Math.abs(on[i + 1] - off[i + 1]) + Math.abs(on[i + 2] - off[i + 2]);
      out.looseDrawnDiff = Math.round(diff / (TILE * TILE));
      G.breakTile(loose.tx, loose.ty);
      out.looseBroken = tileAt(loose.tx, loose.ty) === '.' && !solidAt(loose.tx, loose.ty);
    }
    window.brHas = realHas;
    window.sfx = realSfx; window.ftxt = realFtxt;
    return out;
  });

  check('A0\'s teaching wall is brittle rock', r.plugBefore === 'BB', r.plugBefore);
  check('...its scrap waits behind it, not drifting through the stone', r.pocketScrap0 > 0 && r.pocketScrapNear > 0,
    `${r.pocketScrap0} at rest, ${r.pocketScrapNear} still there with her a tile away`);
  check('...the first blow knocks and leaves it standing', r.afterOne === 'BB' && r.knocks > 0 && !r.breakSoundOne, r.afterOne + ', ' + r.knocks + ' tile(s) cracked');
  check('...with the hollow note', r.knockSound);
  check('...and the hint_secret line', r.secretLine);
  check('...the second blow opens it', r.afterTwo === '..' && r.breakSoundTwo, r.afterTwo);
  check('...and the scrap behind it comes to her', r.wallPays);
  check('...a wall opened sets the wall\'s lesson, not the floor\'s', r.wallFlag && !r.floorFlagAfterWall);
  check('A0\'s crust rings when struck from the side and stays', r.crustAfterSide === 'BB' && r.floorKnock, r.crustAfterSide);
  check('...with the floor\'s own line', r.floorLine);
  check('...a down-strike cuts it in one', r.crustAfterDown === '.', r.crustAfterDown);
  check('...she drops into the hold', r.fellIn);
  check('...which pays', r.floorPays);
  check('...and retires the floor\'s prompt', r.floorFlag);
  check('A2\'s hulk is a crust two courses deep', r.digBefore === 'BB', r.digBefore);
  check('...one strike from above cuts both', r.digAfter === '..', r.digAfter);
  check('...and the blow rebounds her (the pogo)', r.digRebound != null && r.digRebound < 0, 'vy after the cut ' + r.digRebound);
  check('...she comes down into the hold', r.digDown, 'feet at ' + r.digFeet + ' (crust top 384)');
  check('...and the hold pays', r.digPays);
  check('the floor prompt survives a wall opened first', r.floorHintAfterWall);
  check('...the wall prompt survives a floor cut first', r.wallHintAfterFloor);
  check('...and a floor cut retires only the floor prompt', !r.floorHintAfterFloor);
  check('a fracture world has loose rock to find', r.looseFound);
  check('...drawn with the loose rock\'s face', r.looseDrawnDiff > 4, 'mean channel difference ' + r.looseDrawnDiff + ' per pixel');
  check('...and a cut one is really gone', r.looseBroken);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every secret knocks before it gives, and each kind is taught where she first needs it'));
  process.exit(fails.length ? 1 : 0);
})();
