// AUTHORED HIT SHAPES (js/hitshape.js, handoff Part 2 D2), against the real build.
//
// The promise is narrow and measurable: every swing's shape lies inside the
// square it replaces (no move reaches further than it did), the square's empty
// far corners no longer land, the body of the cut still does, a real swing at
// a real machine agrees with the geometry, and the Forge overlay draws it.
//
//   node tests/hitshape.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── hitshape — every swing has an authored shape inside its old square, and the Forge can show it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof swingShape === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null;
    await frames(30);
    const out = {};
    // 1. every kind of swing: shape inside the square
    const kinds = [];
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, -1], [1, -1], [0, 1]]) for (const combo of [0, 2]) for (const wield of [0, 1, 2]) {
      player.on = ay <= 0; player.swing = { ax, ay, combo, wield, t: 0.1, set: new Set() };
      const b = player.hitbox(), poly = swingShape(player.swing, b);
      const inside = poly.every(([x, y]) => x >= b.x - 0.01 && x <= b.x + b.w + 0.01 && y >= b.y - 0.01 && y <= b.y + b.h + 0.01);
      const area = Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
      kinds.push({ ax, ay, combo, wield, inside, fill: +(area / (b.w * b.h)).toFixed(2), id: swingShapeId(player.swing) });
    }
    out.kinds = kinds;
    // 2. the geometry: a right jab's far-top corner, its front middle, her paw
    player.face = 1; player.swing = { ax: 1, ay: 0, combo: 0, wield: 0, t: 0.1, set: new Set() };
    const b = player.hitbox(), sq = 6;
    const corner = { x: b.x + b.w - sq, y: b.y, w: sq, h: sq };
    const front = { x: b.x + b.w - sq, y: b.y + b.h / 2 - sq / 2, w: sq, h: sq };
    const paw = { x: b.x, y: b.y + b.h / 2 - sq / 2, w: sq, h: sq };
    out.geo = { cornerBox: aabb(b, corner), cornerShape: swingTouches(player, corner, b), front: swingTouches(player, front, b), paw: swingTouches(player, paw, b) };
    player.swing = null;
    // 3. a real swing at a real machine: one whose body sits only in the far
    // corner of the old square is not hit; one in front of her is
    const swingAt = async (place) => {
      G.enemies = []; player.swing = null; player.atkCD = 0; player.comboT = 0; player.combo = 0;
      player.vx = 0; player.face = 1; player.faceVis = 1; await frames(10);
      const e = new Enemy('crawler', 0, 0); e.iq = 0; e.iqT = 99; e.atkCD = 99; e.coilT = 0; e.hp = 200;
      player.swing = { ax: 1, ay: 0, combo: 0, wield: 0, t: 0.1, set: new Set() };
      const sb = player.hitbox(); player.swing = null;
      const hb0 = hurtBoxOf(e), ox = hb0.x - e.x, oy = hb0.y - e.y;
      const at = place(sb, hb0);
      e.x = at.x - ox; e.y = at.y - oy;
      const fx = e.x, fy = e.y;
      G.enemies = [e];
      const pin = setInterval(() => { e.x = fx; e.y = fy; e.vx = 0; e.vy = 0; }, 0);
      const hp0 = e.hp, geomBox = aabb(sb, hurtBoxOf(e));
      dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })); await frames(2);
      dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyX' })); await frames(14);
      clearInterval(pin);
      return { hit: e.hp < hp0, geomBox };
    };
    // corner: the machine's bottom-left touches only the square's far top corner
    out.realCorner = await swingAt((sb, hb) => ({ x: sb.x + sb.w - 4, y: sb.y - hb.h + 4 }));
    out.realFront = await swingAt((sb, hb) => ({ x: sb.x + sb.w * 0.5, y: sb.y + sb.h / 2 - hb.h / 2 }));
    // 4. the overlay: an off-screen canvas in world space, with and without
    {
      const e = new Enemy('crawler', player.x + 60, player.y); G.enemies = [e];
      player.swing = { ax: 1, ay: 0, combo: 0, wield: 0, t: 0.1, set: new Set() };
      const cv = document.createElement('canvas'); cv.width = G.roomDef.w * TILE; cv.height = G.grid.length * TILE;
      const count = (on) => {
        const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
        G.showShapes = on; drawHitShapes(c);
        const d = c.getImageData(0, 0, cv.width, cv.height).data;
        let orange = 0, green = 0, blue = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          if (d[i] > 200 && d[i + 1] > 90 && d[i + 1] < 190 && d[i + 2] < 120) orange++;
          else if (d[i + 1] > 200 && d[i] < 160 && d[i + 2] < 170) green++;
          else if (d[i + 2] > 200 && d[i] < 140) blue++;
        }
        return { orange, green, blue };
      };
      out.overlayOn = count(true); out.overlayOff = count(false);
      player.swing = null; G.enemies = [];
    }
    return out;
  });

  const bad = r.kinds.filter(k => !k.inside);
  check('every swing (5 aims x 2 beats x 3 weapons) has its shape inside its old square', bad.length === 0, bad.length ? JSON.stringify(bad[0]) : r.kinds.length + ' swings');
  const thin = r.kinds.filter(k => k.fill < 0.8 || k.fill >= 1);
  check('...and each shape trims the square, keeping at least 80% of it', thin.length === 0, JSON.stringify(r.kinds.map(k => k.id + ':' + k.fill).filter((v, i, a) => a.indexOf(v) === i)));
  check('the square\'s far corner no longer lands', r.geo.cornerBox && !r.geo.cornerShape, JSON.stringify(r.geo));
  check('...the front of the cut and her paw still do', r.geo.front && r.geo.paw, JSON.stringify(r.geo));
  check('a real jab at a machine sitting only in that corner misses it', r.realCorner.geomBox && !r.realCorner.hit, JSON.stringify(r.realCorner));
  check('...and a real jab at one in front of her lands', r.realFront.hit, JSON.stringify(r.realFront));
  check('the overlay draws her claws, what can be hit and her body', r.overlayOn.orange > 50 && r.overlayOn.green > 20 && r.overlayOn.blue > 20, JSON.stringify(r.overlayOn));
  check('...and nothing when it is off', r.overlayOff.orange + r.overlayOff.green + r.overlayOff.blue === 0, JSON.stringify(r.overlayOff));
  const forge = fs.readFileSync(path.join(__dirname, '..', 'forge.html'), 'utf8');
  const game = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  check('the Forge has the SHAPES toggle (button and F3); the game pages do not', /forgeShapes/.test(forge) && /'F3'/.test(forge) && !/forgeShapes/.test(game));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
