// THE CACHE HAS MACHINES TO BEND IT — the roster behind kingdom X's moves.
//
// tests/cachemoves.cjs proves that glint / facet / refract FIRE, on machines
// it builds by hand. That is necessary and it is not sufficient: the moves
// were filed against a roster the Crystal Cache did not have. Measured two
// ways before this harness existed — statically off ROOMS[id].ents and live
// in the running build — the four X rooms (V1, V1B, V2, X1) declared no
// machines at all, so every load spawned an empty G.enemies and nobody could
// ever meet a move the registry said the kingdom owned. A move nobody can
// meet is not shipped, and a hand-built subject cannot tell you that.
//
// So this measures the WIRING and only the wiring, on machines the ROOM
// spawns — never `new Enemy()` here — on the finished-run save
// tests/foelevel.cjs defines (dash/wall/glide/pulse, five skills, every boss
// flag), because that is the save that reaches the bottom of the world:
//
//   1. V1 and V2 spawn what they declare, and every spawned machine carries
//      its kingdom's move (e.hasMove) — the real spawn path, Braid and all.
//   2. The same on a FRESH save: the Cache's floor is level 5, four points,
//      so a kingdom's own question is asked at its own door, not only after
//      the run has raised it.
//   3. V1B — the Kerf, the kingdom's NPC home — spawns NOTHING, and X1 is
//      the guardian's arena and spawns no machine of the roster either.
//   4. The bat has rock to hang from at dive height (the spar), and the spar
//      is an object grown from the roof, not a lintel: the surface curve
//      under it still finds the ledge and the floor.
//   5. The room's OWN loop fires the moves: she stands in range, update()
//      runs, and the spawned bat sheds splinters, the spawned hoppers paint
//      their landing, the spawned crawler throws its lance. Walkers are
//      pinned in x for that — `dir` is a coin flip in the Enemy constructor
//      and a patrol can leave a 32-tile room inside a measurement. The move
//      is the subject, not the walk.
//
//   node tests/cacheroster.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cacheroster — the Cache has machines to bend it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof FOE_MOVES === 'object' && typeof loadRoom === 'function', { timeout: 25000 });

  const r = await page.evaluate(async () => {
    const out = {}, DT = 1 / 60;
    const raf = () => new Promise(k => requestAnimationFrame(k));
    // the save shapes tests/foelevel.cjs measures the level framework on
    const LATE = {
      abil: { dash: 1, wall: 1, glide: 1, pulse: 1 }, skills: ['a', 'b', 'c', 'd', 'e'],
      flags: { tut: 1, woke: 1, bossGlitch: 1, bossBrood: 1, bossAtlas: 1, bossZero: 1, bossPrism: 1 },
    };
    const FRESH = { abil: {}, skills: [], flags: { tut: 1, woke: 1 } };
    const boot = (stage) => {
      const sv = newSave(1); sv.time = 99;
      sv.abil = Object.assign({}, stage.abil); sv.skills = stage.skills.slice();
      Object.assign(sv.flags, stage.flags);
      startGame(sv);
    };
    // load a room THE WAY THE GAME DOES and read back what it spawned
    const load = async (id) => {
      loadRoom(id); G.wake = null; G.dialog = null; G.state = 'PLAY'; G.toasts = [];
      G.bossEntry = null; G.gateWalk = null;
      // A FINISHED SAVE IS OWED AN EVOLUTION. The first tick on a save with
      // every boss flag awards the APEX chassis and opens its ACQUIRED card,
      // which parks the state in DIALOG and freezes every machine in the
      // room. That is the game working; it is not the subject. The card is
      // read and closed, the flag it sets keeps it closed.
      for (let i = 0; i < 8; i++) {
        await raf();
        if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
      }
      return {
        lv: foeLevel(), pts: foeSkillPts(foeLevel()),
        boss: G.boss ? G.boss.kind : null,
        ents: G.enemies.map(e => ({ kind: e.kind, x: Math.round(e.x), y: Math.round(e.y), level: e.level,
          moves: (e.moves || []).slice(), glint: e.hasMove('glint'), facet: e.hasMove('facet'), refract: e.hasMove('refract') })),
        declared: (ROOMS[id].ents || []).filter(d => EKIND[d[0]]).map(d => d[0]),
      };
    };

    // ---- 1. the finished run --------------------------------------------
    boot(LATE);
    out.late = {};
    for (const id of ['V1', 'V1B', 'V2', 'X1']) out.late[id] = await load(id);

    // ---- 2. the fresh save: the kingdom's floor alone buys the moves ----
    boot(FRESH);
    out.fresh = {};
    for (const id of ['V1', 'V2']) out.fresh[id] = await load(id);

    // ---- 3. the bat's perch, and the ground under it --------------------
    boot(LATE); await load('V1');
    const bat = G.enemies.find(e => e.kind === 'bat');
    if (bat) {
      const cx = Math.floor((bat.x + bat.w / 2) / TILE), top = Math.floor(bat.y / TILE);
      // rock within one row above its head, and rock all the way up to the
      // roof from there — a spar, not a floating slab
      let rockAbove = null, contiguous = true;
      for (let ty = top; ty >= 0; ty--) if (solidAt(cx, ty)) { rockAbove = ty; break; }
      if (rockAbove != null) for (let ty = rockAbove; ty >= 0; ty--) if (!solidAt(cx, ty)) contiguous = false;
      const gc = typeof groundColumnAt === 'function' ? groundColumnAt(bat.x + bat.w / 2) : null;
      // the tile the surface curve calls ground under the bat's column
      out.perch = { col: cx, top, rockAbove, gapRows: rockAbove == null ? null : top - rockAbove,
        contiguous, groundY: gc ? Math.round(gc[0]) : null, spawnBottom: Math.round(bat.y + bat.h) };
      // NO RIGHT ANGLES: the spar's underside is a profile, not a line — count
      // distinct depths across its columns
      const depths = new Set();
      for (let tx = 1; tx < G.roomDef.w - 1; tx++) {
        let d = 0; while (d + 1 < G.roomDef.h && solidAt(tx, d + 1)) d++;
        if (d > 0) depths.add(d);
      }
      out.perch.depths = Array.from(depths).sort();
    }

    // ---- 4. the room's own loop fires them ------------------------------
    // She stands in range and invulnerable; the loop is the game's update().
    // Each machine is measured in its own load so nothing else is in range.
    const hits = [];
    const hurt0 = player.hurt;
    player.hurt = function (d, x, src) { hits.push(src || '?'); };
    const stand = (tx) => {
      player.x = tx * TILE; player.y = 15 * TILE - player.h; player.vx = 0; player.vy = 0;
      player.on = true; player.dead = false; player.iT = 99;
      if (G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; }
    };
    const live = async (room, kind, standTx, pin, frames, probe) => {
      boot(LATE); await load(room);
      const e = G.enemies.find(m => m.kind === kind);
      if (!e) return { found: false };
      // everything else in the room is parked out of the world for the run
      for (const m of G.enemies) if (m !== e) { m.x = -9000; m.y = -9000; }
      const x0 = e.x;
      const res = { found: true, frames: 0 };
      for (let f = 0; f < frames; f++) {
        stand(standTx);
        if (pin) { e.x = x0; }
        update(DT);
        probe(e, res);
        res.frames = f + 1;
        if (res.done) break;
      }
      return res;
    };
    // the bat: a dive that leaves splinters hanging
    out.liveBat = await live('V1', 'bat', 8, false, 600, (e, res) => {
      const n = e.motes ? e.motes.length : 0;
      res.maxMotes = Math.max(res.maxMotes || 0, n);
      if (e.holdT > 0) res.shivered = true;
      if (e.diveT > 0) res.dove = true;
      if (n > 0 && res.dove) res.done = true;
    });
    // the V1 hopper: a crouch that paints the landing before the leap
    out.liveHopV1 = await live('V1', 'hopper', 15, true, 600, (e, res) => {
      if (e.crouchT > 0) res.crouched = true;
      if (e.markX != null) { res.painted = true; res.markX = Math.round(e.markX); res.done = true; }
    });
    // the V2 hopper, the same read one room deeper
    out.liveHopV2 = await live('V2', 'hopper', 20, true, 600, (e, res) => {
      if (e.markX != null) { res.painted = true; res.done = true; }
    });
    // the V2 crawler: a lunge that throws the lance behind it. Pinned — the
    // Nest's guard walked out of its room mid-measurement under the same
    // coin-flip `dir`, and this crawler patrols the same way.
    out.liveCrawler = await live('V2', 'crawler', 19, true, 900, (e, res) => {
      if (e.coilT > 0) res.coiled = true;
      if (e.lungeT > 0) res.lunged = true;
      if ((e.lanceT || 0) > 0) { res.lanced = true; res.done = true; }
    });
    player.hurt = hurt0;
    out.hitsAttributed = hits.every(h => /^(bat|hopper|crawler)\./.test(h) || /^(bat|hopper|crawler)$/.test(h));
    out.hits = hits.slice(0, 6);
    return out;
  });

  const L = r.late, F = r.fresh;
  const kinds = o => o.ents.map(e => e.kind).sort().join('+');

  // ---- 1. the finished run spawns the roster with its moves --------------
  check('V1 spawns what it declares on a finished run',
    L.V1.ents.length === L.V1.declared.length && L.V1.ents.length === 2 && kinds(L.V1) === 'bat+hopper',
    kinds(L.V1) + ' (declared ' + L.V1.declared.join('+') + ') at level ' + L.V1.lv);
  check('...and the spawned bat carries glint',
    L.V1.ents.some(e => e.kind === 'bat' && e.glint));
  check('...and the spawned hopper carries refract',
    L.V1.ents.some(e => e.kind === 'hopper' && e.refract));
  check('V2 spawns what it declares on a finished run',
    L.V2.ents.length === L.V2.declared.length && L.V2.ents.length === 2 && kinds(L.V2) === 'crawler+hopper',
    kinds(L.V2) + ' (declared ' + L.V2.declared.join('+') + ') at level ' + L.V2.lv);
  check('...and the spawned crawler carries facet',
    L.V2.ents.some(e => e.kind === 'crawler' && e.facet));
  check('...and the spawned hopper carries refract',
    L.V2.ents.some(e => e.kind === 'hopper' && e.refract));
  check('every spawned Cache machine holds only its own kingdom\'s moves',
    [].concat(L.V1.ents, L.V2.ents).every(e => e.moves.every(m => ['glint', 'facet', 'refract'].indexOf(m) >= 0)),
    [].concat(L.V1.ents, L.V2.ents).map(e => e.kind + ':' + e.moves.join('/')).join(' '));

  // ---- 2. ...and on a fresh save, at the kingdom's own door --------------
  check('a fresh save\'s Cache floor already buys every move (level 5, four points)',
    F.V1.pts >= 4 && F.V1.ents.length === 2 && F.V2.ents.length === 2
    && F.V1.ents.some(e => e.kind === 'bat' && e.glint) && F.V1.ents.some(e => e.kind === 'hopper' && e.refract)
    && F.V2.ents.some(e => e.kind === 'crawler' && e.facet) && F.V2.ents.some(e => e.kind === 'hopper' && e.refract),
    'level ' + F.V1.lv + ', ' + F.V1.pts + ' pts');

  // ---- 3. the Kerf stays empty; the arena is the guardian's --------------
  check('V1B — the Kerf, the kingdom\'s NPC home — spawns nothing',
    L.V1B.ents.length === 0 && L.V1B.declared.length === 0, L.V1B.ents.length + ' spawned');
  check('X1 spawns no roster machine — the arena is PRISM\'s',
    L.X1.ents.length === 0 && L.X1.boss === 'prism', L.X1.ents.length + ' spawned, boss ' + L.X1.boss);

  // ---- 4. the perch ------------------------------------------------------
  const P = r.perch || {};
  check('the bat hangs under rock at dive height, not from a roof nine rows up',
    P.rockAbove != null && P.gapRows <= 1 && P.top <= 7 && P.top >= 4,
    'bat top row ' + P.top + ', rock at row ' + P.rockAbove);
  check('...and the rock is a spar grown from the roof, one object',
    P.contiguous === true && P.depths && P.depths.length >= 3,
    'depths across the roof: ' + (P.depths || []).join(','));
  // the surface curve walks past a deck with air under it, so under the spar
  // the ground it reports is the floor (row 15) — what matters is that it is
  // never the spar's own underside (row 4, y=160): the roof-hung object is
  // read as ceiling and she stands on what she always stood on
  check('...and the ground under the spar is the floor, never the spar\'s underside',
    P.groundY != null && P.groundY >= 11 * 32 - 12, 'ground at ' + P.groundY + ' (spar bottom 160, ledge 352, floor 480)');

  // ---- 5. the room's own loop fires them ----------------------------------
  const B = r.liveBat, H1 = r.liveHopV1, H2 = r.liveHopV2, C = r.liveCrawler;
  check('V1\'s spawned bat shivers, dives and leaves splinters in the air',
    B.found && B.shivered && B.dove && B.maxMotes > 0,
    'shiver ' + !!B.shivered + ', dive ' + !!B.dove + ', ' + (B.maxMotes || 0) + ' splinters in ' + B.frames + ' frames');
  check('V1\'s spawned hopper crouches and paints its landing',
    H1.found && H1.crouched && H1.painted, 'painted at ' + H1.markX + ' in ' + H1.frames + ' frames');
  check('V2\'s spawned hopper paints its landing',
    H2.found && H2.painted, 'in ' + H2.frames + ' frames');
  check('V2\'s spawned crawler coils, lunges and throws the lance behind it',
    C.found && C.coiled && C.lunged && C.lanced,
    'coil ' + !!C.coiled + ', lunge ' + !!C.lunged + ', lance ' + !!C.lanced + ' in ' + C.frames + ' frames');
  check('every hit she took was attributable to a Cache machine', r.hitsAttributed, r.hits.join(','));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
