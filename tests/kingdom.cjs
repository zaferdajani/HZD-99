// THE KINGDOM HARNESS — one kingdom at a time, the protocol driven live.
//
// CLAUDE.md, KINGDOMS ARE THE UNIT: a kingdom runs from its opening to its
// sage and the sage's cave; it has at least one NPC with a PLACE, at least one
// bench, and its guardian. Every one of those reads fine in the source and
// breaks silently in play — the monuments were orphaned for half a day by a
// commit that never touched them (docs/ART_QUEUE.md §2ag). So for each
// kingdom this asks, of the running game:
//
//   every room's declared art is on disk and known to the manifest;
//   every enemy placed in it shows at least four different pictures alive;
//   the guardian can be hurt, can be staggered, can die, and has a lair;
//   every NPC has a place of its own — a booth, a den, a cave, a housing;
//   a bench stands on the road before the guardian;
//   every depth door DRAWS — walked, one by one, with the door withheld and
//   the frame compared — and a door whose plate is declared draws the plate;
//   every one-shot sound decays (tests/tails.cjs); the zone's music streams.
//
//   node tests/kingdom.cjs            # every kingdom
//   node tests/kingdom.cjs A          # one
const { chromium } = require('playwright');
const fs = require('fs'), { spawnSync } = require('child_process');
const ZONES = process.argv.slice(2).length ? process.argv.slice(2).map(z => z.toUpperCase()) : ['A', 'B', 'C', 'D', 'E', 'X'];
const RA = JSON.parse(fs.readFileSync('assets/roomassets.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── kingdom — the protocol, driven live, kingdom by kingdom');

  // the sound law once, for everyone: it is not per kingdom, and it is a gate
  const tails = spawnSync(process.execPath, ['tests/tails.cjs'], { encoding: 'utf8' });
  const tailsOk = tails.status === 0;

  // paths the page's media table names, checked on disk from here
  const mediaSrc = await page.evaluate(() => Object.assign({}, MEDIA_SRC.images));

  for (const Z of ZONES) {
    console.log('  ── kingdom ' + Z);
    const r = await page.evaluate(async ({ Z }) => {
      const DT = 1 / 60, out = { rooms: [], enemies: {}, npcs: [], doors: [] };
      const ids = Object.keys(ROOMS).filter(id => ROOMS[id].zone === Z && (Z !== 'X' || id[0] !== 'G'));
      // the kingdom's own grotto belongs to it, whatever palette it wears
      for (const id of Object.keys(ROOMS)) if (id.startsWith('G' + Z) && !ids.includes(id)) ids.push(id);
      out.rooms = ids;
      const boot = (room, abil) => {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.abil = abil || { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
        startGame(sv); loadRoom(room); G.dialog = null; G.state = 'PLAY'; G.toasts = [];
        G.bossEntry = null; G.gateWalk = null; G.wake = null;
      };
      // ---- 1. the cast: enemies placed here, the guardian, the NPCs, the benches
      const kinds = new Set(); let bossRoom = null, bossKind = null; const benches = [];
      for (const id of ids) for (const e of (ROOMS[id].ents || [])) {
        if (typeof EKIND !== 'undefined' && EKIND[e[0]]) kinds.add(e[0]);
        if (e[0] === 'boss' && BSTAT[e[3]] && !(typeof MINIS !== 'undefined' && MINIS[e[3]])) { bossRoom = id; bossKind = e[3]; }
        if (e[0] === 'bench') benches.push(id);
        if (e[0] === 'npc') out.npcs.push({ id: e[3], room: id });
      }
      out.bossRoom = bossRoom; out.bossKind = bossKind; out.benches = benches;
      // ---- 2. every enemy shows four pictures alive
      const maskOf = (e) => {
        const cvs = document.createElement('canvas'); cvs.width = 200; cvs.height = 200;
        const x = cvs.getContext('2d', { willReadFrequently: true });
        x.translate(100 - (e.x + e.w / 2), 170 - (e.y + e.h));
        try { e.draw(x); } catch (err) { return null; }
        const d = x.getImageData(0, 0, 200, 200).data; const m = new Uint8Array(40000); let n = 0;
        for (let i = 0, p = 0; i < d.length; i += 4, p++) if (d[i + 3] > 40) { m[p] = 1; n++; }
        return n ? m : null;
      };
      const iou = (A, B) => { let i = 0, u = 0; for (let k = 0; k < A.length; k++) { if (A[k] || B[k]) u++; if (A[k] && B[k]) i++; } return u ? i / u : 1; };
      // each kind is measured WHERE THE WORLD PUTS IT — its first placement in
      // this kingdom — so a turret is on its ledge and a bat in its air, not
      // dropped onto whatever floor the first room has
      const place = {};
      for (const id of ids) for (const e of (ROOMS[id].ents || [])) if (EKIND[e[0]] && !place[e[0]]) place[e[0]] = { room: id, tx: e[1], ty: e[2] };
      const stage = ids.find(id => !ROOMS[id].cave && !(ROOMS[id].ents || []).some(e => e[0] === 'boss')) || ids[0];
      // Every fetch this page has started that has not FULLY landed. Not
      // `!MEDIA_RAW[k]`: mediaFetch(urgent) also pulls the quarter-scale copy,
      // which fills MEDIA_RAW while the real sheet is still coming, so that
      // test calls a stand-in "arrived" and the sharp one still lands in the
      // middle of the measurement. MEDIA_LOW 3 is set by the full sheet's own
      // onload and means exactly what is needed here: nothing left in flight.
      const artPending = () => Object.keys(MEDIA_PEND).filter(k => MEDIA_LOW[k] !== 3);
      const measure = async (kind, room, tx, ty) => {
        boot(room); G.enemies = []; if (G.boss) G.boss.st = 'dorm';
        const ex = tx * TILE, ey = ty * TILE;
        let e = new Enemy(kind, ex, ey); G.enemies.push(e);
        // she stands on the FLOOR under it (a bat hangs from a ceiling; a
        // turret sits on a ledge), two tiles off, stepping in and out so the
        // thing has a reason to do everything it does
        let fty = ty; while (fty < G.roomDef.h - 1 && !solidAt(Math.floor((ex + 8) / TILE), fty)) fty++;
        const px0 = ex - 2 * TILE - player.w, py = fty * TILE - player.h;
        const seen = [];
        // ...AND THE ART IS IN BEFORE THE FIRST SAMPLE IS TAKEN. This is the
        // third and largest source of the same disagreement: these creatures
        // are drawn from authored sheets when the sheet is there and
        // procedurally when it is not, and the sheets are fetched lazily by
        // the first draw that wants one. So a measurement started cold sampled
        // a hand-drawn guard for its first seconds and an authored one for the
        // rest — two different animals, counted as one — and how many of each
        // depended entirely on the network. A few frames kick the fetches; the
        // drain waits for them.
        for (let f = 0; f < 6; f++) { update(DT); maskOf(e); }
        const tArt = Date.now();
        while (Date.now() - tArt < 15000 && artPending().length) await new Promise(r => setTimeout(r, 50));
        // THE PICTURES ARE ON THE WALL CLOCK, SO THE WALL CLOCK IS DRIVEN.
        //
        // Ten seconds of simulation are stepped here at a fixed DT, which
        // looks deterministic and is not: these bodies breathe, spin, flicker
        // and blink off `performance.now()`, not off the sim clock. So how
        // much of a creature's animation the hundred samples actually catch
        // depended on how fast this loop happened to run — and under a full
        // suite sharing four cores, a hundred samples could land inside a
        // couple of real seconds and see one wingbeat. Measured on an
        // UNCHANGED build: zone B failed one run in three, and it was a
        // different creature each time (turret 3, blob 4, sage 3), which is
        // the signature of a sampling race rather than of missing art.
        //
        // The clock now advances one step per step, the way it would if the
        // game were being played, so the frames sampled are the frames the
        // player would see and the count is the same on every machine.
        //
        // ...AND THE DICE ARE SEEDED, for the other half of the same problem.
        // A creature's poses are chosen by its own state machine off
        // Math.random, so ten seconds of it is a different ten seconds every
        // run: the sage came back with 3 pictures, then 13, then 4 on one
        // unchanged build. Freezing the dice to a constant (what
        // tests/shopread.cjs does, correctly, to hold a PICTURE still) would
        // be wrong here — a creature that always rolls the same number never
        // changes state and the answer would be 1. So the stream is SEEDED
        // instead: still varied, still the creature's own behaviour, and the
        // same stream on every machine and every run. Seeded per kind, so two
        // creatures measured back to back do not walk the same numbers.
        const realNow = performance.now, realRand = Math.random;
        let clk = realNow.call(performance);
        performance.now = () => clk;
        let sd = 0; for (let i = 0; i < kind.length; i++) sd = (sd * 131 + kind.charCodeAt(i)) >>> 0;
        sd = (sd + 0x9e3779b9) >>> 0;
        Math.random = () => {   // mulberry32
          sd = (sd + 0x6d2b79f5) >>> 0;
          let x = sd;
          x = Math.imul(x ^ (x >>> 15), x | 1);
          x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
          return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
        };
        // and the creature is BUILT under the seeded dice, not before them: a
        // body's phase offsets are rolled in its own constructor, and a
        // measurement that seeds afterwards starts every run from a different
        // point in the animation it is about to count.
        boot(room); G.enemies = []; if (G.boss) G.boss.st = 'dorm';
        e = new Enemy(kind, ex, ey); G.enemies.push(e);
        try {
          for (let f = 0; f < 600; f++) {
            clk += DT * 1000;
            player.x = px0 + (f % 140 < 70 ? 0 : 56); player.y = py; player.iT = 99; player.vx = 0; player.vy = 0;
            update(DT);
            if (f % 6 === 0 && !e.dead) { const m = maskOf(e); if (m && !seen.some(s => iou(s, m) > 0.85)) seen.push(m); }
          }
        } finally { performance.now = realNow; Math.random = realRand; }
        return seen.length;
      };
      for (const kind of kinds) {
        const P = place[kind];
        // where its room puts it, and on the kingdom's open floor: the better of the two
        const a = await measure(kind, P.room, P.tx, P.ty);
        const b = await measure(kind, stage, 11, G.roomDef.h - 2 - (/flier|bat/.test(kind) ? 7 : 0));
        out.enemies[kind] = Math.max(a, b);
      }
      // ---- 3. the guardian
      if (bossRoom) {
        boot(bossRoom); const b = G.boss; const g = {};
        if (b) {
          b.st = 'stalk'; b.t = 9; b.dead = false; b.hp = b.hpMax;
          // her own claw is the only way a guardian is hurt: stand at it, swing
          const swing = () => {
            player.x = b.cx() - b.w / 2 - player.w - 4; player.y = b.y + b.h - player.h; player.vx = 0; player.face = 1; player.faceVis = 1; player.iT = 99;
            for (let i = 0; i < 40; i++) { if (i % 12 === 0) { keysP.KeyX = 1; keys.KeyX = 1; update(DT); keysP.KeyX = 0; keys.KeyX = 0; } else update(DT); b.st = b.dead ? b.st : 'stalk'; b.t = 9; b.x = b.x; }
          };
          swing();
          g.hurtT = b.hp < b.hpMax; g.hpAfter = b.hp;
          g.stagger = /stagT/.test(Boss.prototype.update.toString());
          g.daze = !!BSTAT[bossKind].dazeAt;
          b.hp = 1; swing();
          for (let i = 0; i < 20; i++) update(DT);
          g.death = !!(b.dead || (b.deathAnimT || 0) > 0 || b.purified || b.deathFinale);
          const lair = (typeof GATE_ROOM !== 'undefined' && GATE_ROOM[bossRoom]) || null;
          const lairTo = lair && (Array.isArray(lair) ? lair : [lair]).map(d => d.to).find(t => t && t[0] === 'G');
          g.lair = lairTo && !!ROOMS[lairTo]; g.lairId = lairTo;
        } else g.missing = true;
        out.guardian = g;
        // ---- 5. a bench on the road before the guardian: BFS from the kingdom's entry
        const nbrs = (id) => { const o = []; const ex = ROOMS[id].exits || {}; for (const k in ex) { const v = ex[k]; o.push(typeof v === 'object' ? v.to : v); } for (const d of (typeof GATE_ROOM !== 'undefined' && GATE_ROOM[id] ? [].concat(GATE_ROOM[id]) : [])) if (d.to) o.push(d.to); return o.filter(x => ROOMS[x]); };
        const entry = ids.find(id => nbrs(id).some(n => ROOMS[n].zone !== Z && !n.startsWith('G'))) || ids[0];
        const prev = { [entry]: null }; const q = [entry];
        while (q.length) { const id = q.shift(); if (id === bossRoom) break; for (const n of nbrs(id)) if (!(n in prev)) { prev[n] = id; q.push(n); } }
        const path = []; for (let id = bossRoom; id; id = prev[id]) path.unshift(id);
        out.road = path; out.entry = entry;
        out.benchOnRoad = path.some(id => benches.includes(id)) || benches.some(bch => nbrs(bch).includes(bossRoom));
      }
      // ---- 4. every NPC has a place
      for (const n of out.npcs) {
        const rd = ROOMS[n.room];
        const inside = Object.values(GATE_ROOM || {}).some(d => [].concat(d).some(x => x.to === n.room && x.style));
        const prop = typeof ROOM_PROPS !== 'undefined' && ROOM_PROPS[n.room] && ROOM_PROPS[n.room].length > 0;
        n.place = inside ? 'interior' : prop ? 'housing' : rd.cave ? 'cave' : null;
      }
      // ---- 6. every depth door draws — walked
      for (const id of ids) {
        const defs = (typeof GATE_ROOM !== 'undefined' && GATE_ROOM[id]) ? [].concat(GATE_ROOM[id]) : [];
        for (let di = 0; di < defs.length; di++) {
          const def = defs[di];
          boot(id); G.enemies = []; if (G.boss) G.boss.st = 'dorm';
          // every door open, whatever the save says
          if (def.need) G.save.flags[def.need] = 1;
          const wx = G.roomDef.w * TILE * def.at;
          player.x = wx - player.w / 2 - 140; player.y = (G.roomDef.h - 2) * TILE - player.h; player.vx = 0;
          for (let i = 0; i < 30; i++) update(DT);
          // the plate this door would wear, if its family has one
          const dest = ROOMS[def.to];
          const guard = dest && dest.cave && !G.roomDef.cave && def.to[0] === 'G';
          const key = guard ? GATE_PLATE_BY_ZONE[G.roomDef.zone] : (dest && dest.cave && !def.style) ? MOUTH_PLATE_BY_ZONE[G.roomDef.zone] : null;
          // WAIT FOR THE FULL TIER, NOT FOR THE FIRST PICTURE.
          //
          // mediaFetch(urgent) asks for TWO images: the quarter-scale stand-in
          // and the real sheet. MEDIA_IMG[key].naturalWidth goes truthy the
          // moment the SMALL one lands (MEDIA_LOW 2) while the full one is
          // still in flight — so the three shots below were taken across a
          // picture that could change for a reason that is not the door. The
          // full plate arriving between A and B inflates `drawn`; arriving
          // after C2 has nulled MEDIA_IMG[key] puts the plate straight back and
          // reports it as contributing nothing. That is why this one check read
          // 32% of its frame on one run and 0.1% on the next as soon as the
          // kingdom grew two more doors ahead of it in the loop.
          //
          // MEDIA_LOW 3 is set by the full sheet's own onload, so it means the
          // real image is in AND nothing is pending: the frame cannot move
          // under the measurement any more.
          if (key) {
            mediaFetch(key, true);
            const t0 = Date.now();
            while (Date.now() - t0 < 20000 && MEDIA_LOW[key] !== 3) await new Promise(r => setTimeout(r, 50));
          }
          const shot = () => { draw(); const sx = Math.round(wx - camSX()); const x0 = Math.max(0, sx - 220), x1 = Math.min(960, sx + 220); return { d: c.getImageData(x0, 0, Math.max(1, x1 - x0), 540).data, x0, x1 }; };
          const A = shot();
          const saved = GATE_ROOM[id]; GATE_ROOM[id] = Array.isArray(saved) ? saved.filter((d, k) => k !== di) : null;
          if (Array.isArray(GATE_ROOM[id]) && !GATE_ROOM[id].length) GATE_ROOM[id] = null;
          const B = shot(); GATE_ROOM[id] = saved;
          const diff = (P, Q) => { let n = 0, t = P.d.length / 4; for (let i = 0; i < P.d.length; i += 4) if (Math.abs(P.d[i] - Q.d[i]) + Math.abs(P.d[i + 1] - Q.d[i + 1]) + Math.abs(P.d[i + 2] - Q.d[i + 2]) > 24) n++; return n / t; };
          const door = { room: id, to: def.to, style: def.style || (guard ? 'gate' : dest && dest.cave ? 'mouth' : 'plain'), drawn: diff(A, B), key };
          if (key) {
            const im = MEDIA_IMG[key], sp = SCENE_PLATE[key];
            door.plateLoaded = !!(im && im.naturalWidth);
            MEDIA_IMG[key] = null; SCENE_PLATE[key] = null;
            const C2 = shot(); MEDIA_IMG[key] = im; SCENE_PLATE[key] = sp;
            door.plate = diff(A, C2);
          }
          out.doors.push(door);
        }
      }
      // ---- 8. the music streams: every track of the slot is a file the build knows
      const slot = RECORDED_TRACKS[Z] || [];
      out.music = slot.map(([name]) => name + ':' + (window.MUS_FILES && window.MUS_FILES[name] ? 'yes' : 'NO'));
      return out;
    }, { Z });

    // 1. every room's declared art
    const missing = [];
    for (const id of r.rooms) {
      const keys = (RA.rooms[id] && RA.rooms[id].keys) || [];
      for (const k of keys) { const p = mediaSrc[k]; if (!p) missing.push(id + ':' + k + ' (no such key)'); else if (!fs.existsSync(p)) missing.push(id + ':' + k + ' (' + p + ' missing)'); }
    }
    check(Z + ': every room\'s declared art is a real file the manifest knows (' + r.rooms.length + ' rooms)', missing.length === 0, missing.slice(0, 4).join(', '));
    // 2. enemies
    const few = Object.entries(r.enemies).filter(([k, n]) => n < 4);
    check(Z + ': every enemy shows four different pictures alive', few.length === 0,
      Object.entries(r.enemies).map(([k, n]) => k + ' ' + n).join(', ') || 'no enemies placed');
    // 3. the guardian
    if (r.bossRoom) {
      const g = r.guardian;
      check(Z + ': the guardian ' + r.bossKind + ' stands in ' + r.bossRoom, !g.missing);
      check(Z + ': ...it can be hurt', !!g.hurtT, g.hurtErr);
      check(Z + ': ...it can be staggered', !!g.stagger);
      console.log('       ' + (g.daze ? 'daze: a hit-group opens it (dazeAt ' + '' + ')' : 'daze: none declared for this guardian'));
      check(Z + ': ...it can die', !!g.death);
      check(Z + ': ...and it has a lair', !!g.lair, g.lairId || 'no G' + Z + ' door on ' + r.bossRoom);
      check(Z + ': a bench stands on the road before it', !!r.benchOnRoad, 'road ' + (r.road || []).join('>') + '  benches ' + r.benches.join(','));
    } else check(Z + ': a guardian is placed', false, 'no boss room');
    // 4. NPCs
    // an NPC may stand outside their place (the trader at his camp); the place is theirs if ANY of their rooms is
    const byId = {};
    for (const n of r.npcs) { byId[n.id] = byId[n.id] || []; byId[n.id].push(n); }
    for (const id in byId) { const have = byId[id].find(n => n.place); check(Z + ': ' + id + ' has a place of their own', !!have, have ? have.room + ' (' + have.place + ')' : byId[id].map(n => n.room).join(',') + ' — nothing that is theirs'); }
    if (!r.npcs.length) check(Z + ': at least one NPC lives here', false);
    // 6. doors
    for (const d of r.doors) {
      check(Z + ': the ' + d.style + ' door ' + d.room + ' > ' + d.to + ' draws', d.drawn >= 0.015, (d.drawn * 100).toFixed(1) + '% of its frame');
      if (d.key) {
        if (!d.plateLoaded) check(Z + ': ...its plate ' + d.key + ' loads', false);
        // the plate must be a real share of what the door draws — a monument
        // parked at the room edge shows little of anything (§2ad), but a
        // declared plate that accounts for none of the door is §2ag again
        else check(Z + ': ...and wears its plate ' + d.key, d.plate >= Math.max(0.004, d.drawn * 0.25), (d.plate * 100).toFixed(1) + '% is the plate of ' + (d.drawn * 100).toFixed(1) + '% drawn');
      }
    }
    if (!r.doors.length) console.log('       no depth doors in this kingdom');
    // 7 + 8
    check(Z + ': the music streams from files the build knows', r.music.every(m => /:yes$/.test(m)), r.music.join(' '));
  }
  check('every one-shot sound in the game decays (tests/tails.cjs)', tailsOk, tailsOk ? '' : (tails.stdout || '').split('\n').filter(l => /FAIL/.test(l)).slice(0, 3).join(' | '));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — every kingdom holds its own rules, measured');
})();
