// THEY SEE HER, AND THE SHIELD-WALKER IS BIG (owner, 2026-11-25, of the
// meadow's shielded machine: "I don't want this small hero. This should be a
// big one. It looks like an armored one that walks. Seeing me should activate
// it, make it come to me. Give the enemies self awareness, not just roaming
// around... once they see me, they come to me. All of them, not just one,
// this one. But this one needs to be bigger.")
//
// Measured on the real build (js/sight.js, js/entities.js GUARD):
//   THE WALKER IS BIG   its hurt box is at least twice her height and it is
//                       drawn at least 1.6 of her drawn height; in every room
//                       it is put in, of every kingdom, it stands ON the ground
//                       under it and is not set inside rock
//   IT ROAMS UNSEEN     with her behind it, out of its sight, each walker walks
//                       its beat and stays unaware
//   IT SEES AND COMES   in front of it, inside its sight, it turns, takes its
//                       beat (and says so), and closes on her along the ground
//   NOT THROUGH WALLS   a wall between them and it never notices — walkers, a
//                       flier, a turret, and the pack's wolf
//   IT GIVES UP         out of sight it forgets her inside a few seconds and
//                       walks its beat again
//   NEVER OFF A LEDGE   on a raised floor it comes to the edge and holds there
//   A FLIER HOMES IN, A TURRET ONLY AIMS
//   no page errors
//
//   node tests/enemy-sight.cjs      (needs the repo served on :8220, or TEST_PORT)
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
// the shelf is two tiles up; the surface curve softens its lip into a short
// grade, which a body may stand partway down — falling off it drops 64 px
const TILE_HALF = 32;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
  await p.goto('http://127.0.0.1:' + PORT + '/index.html');
  await p.waitForFunction(() => typeof startGame === 'function');
  console.log('── enemy-sight — they roam until they see her, then come; the shield-walker is big');

  // ---- 1. the walker's size, drawn and in its boxes ----
  const S = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1'); G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 240 && !heroArtReady(); i++) await new Promise(k => requestAnimationFrame(k));
    for (const k of Object.keys(MEDIA_SRC.images)) if (/^npcs$|guardWalk/.test(k)) mediaFetch(k, true);
    for (let i = 0; i < 200 && !(MEDIA_IMG.npcs && MEDIA_IMG.npcs.naturalWidth); i++) await new Promise(k => setTimeout(k, 50));
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const c = cv.getContext('2d');
    // the figure only: down to its feet (y 250), not its contact shadow
    const height = () => { const d = c.getImageData(0, 0, 400, 251).data; let y0 = 1e9, y1 = -1;
      for (let y = 0; y < 251; y++) for (let x = 0; x < 400; x++) if (d[(y * 400 + x) * 4 + 3] > 24) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return y1 < 0 ? 0 : y1 - y0 + 1; };
    cam.x = 0; cam.y = 0; cam.shakeX = 0; cam.shakeY = 0;
    const px0 = player.x, py0 = player.y;
    player.x = 180; player.y = 250 - player.h; player.vx = player.vy = 0; player.anim = 1.2; player.swing = null; player.swingVis = null;
    player.hurtT = 0; player.dashT = 0; player.guardT = 0; player.idleT = 0; player._motionPose = null; player._motionBlend = null;
    c.clearRect(0, 0, 400, 300); player.draw(c); const hero = height();
    const g = new Enemy('guard', 0, 0); g.x = 200 - g.w / 2; g.y = 250 - g.h; g.anim = 1.2; g.hurtT = 0; g.traits = []; g.guard = true;
    player.x = 20;
    c.clearRect(0, 0, 400, 300); g.draw(c); const stand = height();
    g.vx = -40; g.dir = -1; g.faceVis = -1; g.walkD = 30;
    c.clearRect(0, 0, 400, 300); g.draw(c); const walk = height();
    player.x = px0; player.y = py0;
    const hb = hurtBoxOf(g);
    return { hero, stand, walk, hbH: hb.h, herH: player.h, body: [g.w, g.h], sk: g.sizeK };
  });
  check('the shield-walker\'s hurt box is at least twice her height', S.hbH >= 2 * S.herH, 'hurt box ' + S.hbH.toFixed(0) + ' px against her ' + S.herH + ' (body ' + S.body.join('x') + ', size ' + S.sk + ')');
  check('...and it is DRAWN big: at least 1.6 of her drawn height, standing and walking', S.hero > 40 && S.stand >= 1.6 * S.hero && S.walk >= 1.55 * S.hero,
    'her ' + S.hero + ' px; it ' + S.stand + ' standing (' + (S.stand / S.hero).toFixed(2) + 'x), ' + S.walk + ' walking (' + (S.walk / S.hero).toFixed(2) + 'x)');

  // ---- 2. every room a walker is put in: on the ground, out of the rock ----
  const R = await p.evaluate(() => {
    const out = [];
    const ids = Object.keys(ROOMS).filter(k => (ROOMS[k].ents || []).some(e => e[0] === 'guard'));
    for (const id of ids) {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 });
      startGame(sv); loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.boss = null;
      // she is kept far away and out of the fight; the walker walks its beat
      player.x = 40; player.iT = 99;
      const gs = G.enemies.filter(e => e.kind === 'guard');
      let worst = 0, inRock = 0, n = 0, moved = 0, x0 = gs.map(g => g.x), lo = gs.map(g => g.x), hi = gs.map(g => g.x), dead = 0;
      for (let i = 0; i < 240; i++) {
        player.x = 40; player.vx = 0; player.iT = 99; update(1 / 60);
        if (i < 30) continue;
        gs.forEach((g, k) => { lo[k] = Math.min(lo[k], g.x); hi[k] = Math.max(hi[k], g.x); });
        for (const g of gs) {
          if (g.dead) continue;
          const t0x = Math.floor((g.x + 2) / TILE), t1x = Math.floor((g.x + g.w - 2) / TILE);
          const t0y = Math.floor((g.y + 2) / TILE), t1y = Math.floor((g.y + g.h - TILE * 0.5) / TILE);
          for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) if (solidAt(tx, ty)) { inRock++; ty = t1y + 1; break; }
          if (g.on) { const gc = groundColumnAt(g.x + g.w / 2); if (gc) { n++; worst = Math.max(worst, Math.abs(Math.min(gc[0], gc[1]) - (g.y + g.h))); } }
        }
      }
      gs.forEach((g, i) => { moved = Math.max(moved, hi[i] - lo[i]); if (g.dead) dead++; });
      out.push({ id, n: gs.length, worst: Math.round(worst), inRock, samples: n, moved: Math.round(moved), dead, sz: gs.map(g => g.w + 'x' + g.h).join(',') });
    }
    return out;
  });
  for (const r of R) check(r.id + ': the walker (' + r.sz + ') stands on the ground and out of the rock, walks its beat and does not walk into a spike bed',
    r.n > 0 && r.samples > 0 && r.worst <= 8 && r.inRock === 0 && r.moved >= 10 && r.dead === 0,
    'feet within ' + r.worst + ' px of the ground over ' + r.samples + ' samples; ' + r.inRock + ' frames in rock; its beat ' + r.moved + ' px; ' + r.dead + ' dead');

  // ---- 3. awareness, in rooms built for the question ----
  const A = await p.evaluate(() => {
    const out = {};
    const W = 64;
    const layouts = {
      flat: g => { frame(g); },
      wall: g => { frame(g); rect(g, 30, 1, 31, 14, '#'); },
      // a raised floor two tiles up, ending at x = 27 tiles
      shelf: g => { frame(g); rect(g, 1, 13, 26, 14, '#'); },
    };
    let n = 0;
    const stage = (layout, zone) => {
      const id = 'ZSIGHT' + (n++);
      ROOMS[id] = { zone: zone || 'C', w: W, h: 17, exits: {}, ents: [], build: layouts[layout] };
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 });
      startGame(sv); loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.boss = null;
      G.enemies = []; return id;
    };
    const floorY = x => { const gc = groundColumnAt(x); return gc ? Math.min(gc[0], gc[1]) : 15 * TILE; };
    const put = (kind, cx, dir, air) => {
      const e = new Enemy(kind, 0, 0);
      e.x = cx - e.w / 2; e.y = air != null ? air : floorY(cx) - e.h; e.sx = e.x; e.sy = e.y;
      e.dir = dir; e.faceVis = dir; e.vx = 0; e.atkCD = 99; e.traits = []; e.moves = [];
      G.enemies.push(e); return e;
    };
    const her = (x) => { player.x = x - player.w / 2; player.y = floorY(x) - player.h; player.vx = player.vy = 0; player.on = true; };
    const run = (sec, x, fn) => { for (let i = 0; i < sec * 60; i++) { her(x); player.iT = 99; player.cores = 5; update(1 / 60); G.hitStop = 0; if (fn) fn(i); } };
    const cxOf = e => e.x + e.w / 2;
    for (const kind of ['guard', 'blob']) {
      const o = out[kind] = {};
      // (a) she is behind it, out of its sight: it walks its beat, unaware
      stage('flat');
      let e = put(kind, 30 * TILE, 1); const back = cxOf(e) - 260;
      const x0 = cxOf(e); let aw = 0;
      run(2, back, () => { aw = Math.max(aw, e.aware || 0); });
      o.roam = { moved: Math.round(Math.abs(cxOf(e) - x0)), aware: aw };
      // (b) in front of it, inside its sight: alert, then it comes
      stage('flat');
      e = put(kind, 20 * TILE, 1); const at = cxOf(e) + 250; e.atkCD = 99;
      let alertAt = -1, d0 = at - cxOf(e), dmin = d0, passed = false;
      run(4, at, (i) => { if (alertAt < 0 && e.aware) alertAt = i; dmin = Math.min(dmin, at - cxOf(e)); if (cxOf(e) > at) passed = true; e.atkCD = 99; });
      o.come = { alertAt, alerts: e.alertN | 0, d0: Math.round(d0), dmin: Math.round(dmin), passed, aware: e.aware | 0, faces: faceSide(e) };
      // (c) a wall between them: it never notices
      stage('wall');
      e = put(kind, 26 * TILE, 1); aw = 0;
      const beyond = 33 * TILE + 16; const xw = cxOf(e);
      run(3, beyond, () => { aw = Math.max(aw, e.aware || 0); e.atkCD = 99; });
      o.wall = { aware: aw, dist: Math.round(beyond - cxOf(e)) };
      // (d) it gives up: seen, then she is gone behind the wall
      stage('wall');
      e = put(kind, 22 * TILE, 1);
      run(1.5, 22 * TILE + 230, () => { e.atkCD = 99; });
      const was = e.aware | 0; let lostAt = -1;
      run(5, 40 * TILE, (i) => { e.atkCD = 99; if (lostAt < 0 && !e.aware) lostAt = i; });
      const xl = cxOf(e);
      run(2, 40 * TILE, () => { e.atkCD = 99; });
      o.lose = { was, lostAt, roamAfter: Math.round(Math.abs(cxOf(e) - xl)) };
      // (e) on a raised floor it comes to the edge and holds there
      stage('shelf');
      e = put(kind, 27 * TILE - e.w / 2 - 20, 1);
      const feet0 = e.y + e.h; let low = feet0;
      run(4, 33 * TILE, () => { low = Math.max(low, e.y + e.h); e.atkCD = 99; });
      o.ledge = { drop: Math.round(low - feet0), aware: e.aware | 0, edgeGap: Math.round(27 * TILE - (e.x + e.w)) };
    }
    // a FLIER homes in once it has seen her, and not through a wall
    {
      const o = out.flier = {};
      stage('flat');
      let e = put('flier', 20 * TILE, 1, 8 * TILE); const at = 20 * TILE + 230;
      const d0 = Math.hypot(at - cxOf(e), floorY(at) - 18 - (e.y + e.h / 2)); let dmin = d0;
      run(3, at, () => { dmin = Math.min(dmin, Math.abs(at - cxOf(e))); e.atkCD = 99; });
      o.come = { aware: e.aware | 0, dx0: 230, dxMin: Math.round(dmin) };
      stage('wall');
      e = put('flier', 26 * TILE, 1, 8 * TILE); let aw = 0; const x0 = cxOf(e);
      run(3, 34 * TILE, () => { aw = Math.max(aw, e.aware || 0); e.atkCD = 99; });
      o.wall = { aware: aw, drift: Math.round(cxOf(e) - x0) };
    }
    // a TURRET only aims: it turns onto her and locks once it has seen her, and never moves
    {
      const o = out.turret = {};
      stage('flat');
      let e = put('turret', 20 * TILE, 1); e.t = 0; const x0 = e.x; let lock = 0;
      run(3, 20 * TILE + 250, () => { lock = Math.max(lock, e.lockT || 0); });
      o.see = { aware: e.aware | 0, locked: lock > 0, moved: Math.round(Math.abs(e.x - x0)) };
      stage('wall');
      e = put('turret', 26 * TILE, 1); e.t = 0; lock = 0; let aw = 0;
      run(3, 34 * TILE, () => { lock = Math.max(lock, e.lockT || 0); aw = Math.max(aw, e.aware || 0); });
      o.wall = { aware: aw, locked: lock > 0 };
    }
    // THE PACK'S WOLF keeps its own hunt and loses the wall
    {
      const o = out.wolf = {};
      stage('wall', 'A');
      const e = put('crawler', 26 * TILE, 1); let hunt = 0;
      run(3, 33 * TILE, () => { hunt = Math.max(hunt, e.hunt || 0); e.atkCD = 99; });
      o.wall = { wolf: typeof isWolf === 'function' && isWolf(e), hunt };
      stage('flat', 'A');
      const e2 = put('crawler', 20 * TILE, 1); hunt = 0;
      run(2, 20 * TILE + 220, () => { hunt = Math.max(hunt, e2.hunt || 0); e2.atkCD = 99; });
      o.open = { hunt };
    }
    return out;
  });
  for (const kind of ['guard', 'blob']) {
    const o = A[kind];
    check(kind + ': with her behind it, out of sight, it walks its beat and does not know she is there',
      o.roam.moved >= 20 && o.roam.aware === 0, 'walked ' + o.roam.moved + ' px; aware ' + o.roam.aware);
    check(kind + ': in front of it and in sight, it takes its beat (said once), then closes on her along the ground',
      o.come.alertAt >= 0 && o.come.alertAt < 30 && o.come.alerts === 1 && o.come.dmin <= o.come.d0 - 80 && !o.come.passed && o.come.faces === 1,
      'alert at frame ' + o.come.alertAt + ', ' + o.come.alerts + ' alert(s); ' + o.come.d0 + ' px -> ' + o.come.dmin + ' px; faces ' + o.come.faces);
    check(kind + ': it does not see her through a wall', o.wall.aware === 0, 'aware ' + o.wall.aware + ' at ' + o.wall.dist + ' px');
    check(kind + ': once she is gone it gives up inside a few seconds, and walks its beat again',
      o.lose.was === 2 && o.lose.lostAt > 0 && o.lose.lostAt <= 60 * 4 && o.lose.roamAfter >= 10,
      'was ' + o.lose.was + ', forgot her after ' + (o.lose.lostAt / 60).toFixed(2) + ' s, then walked ' + o.lose.roamAfter + ' px');
    check(kind + ': on a raised floor it comes to the edge and holds there — never off it',
      o.ledge.drop < TILE_HALF && o.ledge.aware === 2 && o.ledge.edgeGap <= 24,
      'feet dropped ' + o.ledge.drop + ' px; aware ' + o.ledge.aware + '; ' + o.ledge.edgeGap + ' px short of the edge');
  }
  check('a flier that has seen her homes in on her', A.flier.come.aware === 2 && A.flier.come.dxMin < 120, 'aware ' + A.flier.come.aware + '; ' + A.flier.come.dx0 + ' px -> ' + A.flier.come.dxMin + ' px across');
  check('...and a flier does not see through a wall', A.flier.wall.aware === 0, 'aware ' + A.flier.wall.aware + ', drifted ' + A.flier.wall.drift + ' px');
  check('a turret that has seen her locks on, and never moves', A.turret.see.aware === 2 && A.turret.see.locked && A.turret.see.moved === 0, JSON.stringify(A.turret.see));
  check('...and a turret does not lock through a wall', A.turret.wall.aware === 0 && !A.turret.wall.locked, JSON.stringify(A.turret.wall));
  check('the pack\'s wolf hunts her in the open but not through a wall', A.wolf.wall.wolf && A.wolf.wall.hunt === 0 && A.wolf.open.hunt === 1, JSON.stringify(A.wolf));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nOK — they roam until they see her, then come, and the shield-walker is big');
  process.exit(fails.length ? 1 : 0);
})();
