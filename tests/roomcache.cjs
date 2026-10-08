// A DOORWAY COSTS A FRAME, NOT A ROOM.
//
// The lag between rooms (plan §2): every crossing rebuilt the room's whole
// baked floor — erosion, silhouettes, the surface curve, the edge grammar and a
// per-pixel gamma pass, 30-400 ms — into ONE shared canvas, so even walking
// back into the room she had just left paid for it again, and the save was
// written on the same frame. The fix is a per-room cache of the baked layer,
// the neighbours baked ahead of her a few milliseconds at a time, and the save
// moved off the crossing. This drives the real build and measures all of it:
//
//   1. THE WALK. A chain of real crossings — sideways and up and down — with a
//      moment at each exit, the way a player approaches one. Every crossing
//      after the first lands in a room that is already baked (a neighbour
//      baked ahead, or a room she was just in): no bake on the crossing frame,
//      and the frame itself inside a budget.
//   2. NO REBAKE ON A REVISIT, counted, not timed.
//   3. THE SAME PICTURE. A floor baked ahead, in slices, under another room's
//      globals, is pixel-for-pixel the floor the live bake draws.
//   4. STALE IS NOTICED. Break a tile in a cached room and its bake is redone
//      on the way back in; nothing else is.
//   5. THE DEVICE'S BUDGET HOLDS: never more rooms or bytes than the tier
//      allows, the phone tier included.
//   6. THE SAVE IS NOT ON THE CROSSING FRAME, and it is never lost: written in
//      the next quiet moment, and at once when the page is being hidden.
//   7. MEETING A MACHINE COSTS NOTHING AT THE DOOR. The first creature drawn
//      from a sheet used to pay for the sheet's one-off pixel pass (the
//      roster's is ~0.9 s here) on that frame — usually the crossing frame.
//      With the art of the room one door away readied in the idle prebake
//      (js/atlas.js artWarm), crossing into a room whose machines have never
//      been drawn spends no time in that pass on the crossing frame, and the
//      sheet readied in slices is pixel-identical to the on-demand one.
//
//   node tests/roomcache.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── roomcache — a doorway costs a frame, not a room\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const raf = () => new Promise(k => requestAnimationFrame(k));
    const wait = (ms) => new Promise(k => setTimeout(k, ms));
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.comics = {};
    for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
    for (const b of ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother', 'Alpha', 'Chime', 'Carrier', 'Moth', 'Lattice', 'Lens']) sv.flags['boss' + b] = 1;
    startGame(sv);
    // the slabs are art, and art arriving is its own (separately tested)
    // story: have the two kingdoms walked here before the walk starts
    // ...and the other sheets a bake is made of: any of them landing mid-walk
    // rightly repaints the room she is in (media.js), which is the art's
    // story, not the doorway's
    const bakeArt = [ROCK_ART.A, ROCK_ART.B, 'platforms', 'strataRubble', 'strataIceB', 'strataLava']
      .filter(k => MEDIA_SRC.images[k]);
    for (const k of bakeArt) mediaFetch(k, true);
    const landed = (k) => MEDIA_RAW[k] && MEDIA_LOW[k] !== 1 && MEDIA_LOW[k] !== 2;
    for (let i = 0; i < 100 && !bakeArt.every(landed); i++) await wait(100);
    const quiet = () => {
      if (G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; }
      G.impact = null; G.meet = null; G.lesson = null; G.wake = null; G.bossEntry = null;
      G.enemies = []; G.projs = []; G.boss = null;
      if (player) player.iT = 99;
    };
    const out = { walk: [], approachMax: 0, frames: [] };
    // THE TIER IS PINNED. The adaptive dial drops a tier on a slow frame, and
    // the cache's size is a tier decision — a harness machine under load would
    // otherwise measure whichever tier the load happened to choose.
    qualSet('high', false);
    // A KINGDOM'S FIRST ROOM pays for things that are not the floor and not
    // the doorway: its backdrop decoded, its ceiling and creatures processed
    // once per session. Those are walked through first, and the floor cache is
    // emptied after, so what the walk measures is the crossing itself.
    // (its machines are drawn here on purpose: the first sight of a kind of
    // machine processes its sheet once per session — js/atlas.js — and that
    // is a cost of meeting it, not of the door)
    for (const id of ['A1', 'A2', 'A3', 'B2', 'B7', 'A12', 'B3', 'D1', 'D2']) {
      loadRoom(id);
      for (let i = 0; i < 12; i++) {
        if (G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; }
        G.impact = null; G.meet = null; G.lesson = null; player.iT = 99;
        await raf();
      }
    }
    tileJobDrop();
    for (const e of tileStore.values()) { e.cv.width = 0; e.cv.height = 0; }
    tileStore.clear(); tileDirty = true;
    loadRoom('A1'); for (let i = 0; i < 6; i++) { quiet(); await raf(); }
    // ---- 1 + 2. the walk -------------------------------------------------------
    // [room, side] — each trip starts where the last one ended
    const TRIPS = [['A1', 'R'], ['A2', 'L'], ['A1', 'R'], ['A2', 'R'], ['A3', 'L'], ['A2', 'R'],
                   ['B2', 'T'], ['B7', 'B'], ['B2', 'T'], ['B7', 'B']];
    const floorAt = (col) => {
      let fy = G.roomDef.h - 1;
      while (fy > 1 && !(solidAt(col, fy) && !solidAt(col, fy - 1) && !solidAt(col, fy - 2))) fy--;
      return fy * TILE - player.h - 1;
    };
    const visited = {};
    for (const [room, side] of TRIPS) {
      if (G.roomId !== room) { loadRoom(room); }
      visited[room] = 1;
      quiet();
      const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE, g = G.grid;
      for (const k in keys) keys[k] = 0;
      // walk her up to the exit and let her stand there a moment — the
      // window the bake-ahead has to work in, about what a player spends
      // reading a doorway before going through it
      let place;
      if (side === 'R' || side === 'L') {
        const col = side === 'R' ? G.roomDef.w - 3 : 2;
        place = () => { player.x = side === 'R' ? W - 110 : 86; player.y = floorAt(col); player.vx = 0; player.vy = 0; };
      } else {
        const cols = [];
        for (let x = 1; x < G.roomDef.w - 1; x++) if ((side === 'T' ? g[0][x] : g[g.length - 1][x]) === '.') cols.push(x);
        const cx = cols[1] || cols[0];
        place = () => {
          if (side === 'T') { player.x = cx * TILE + 4; player.y = 2 * TILE + 8; }
          else { player.x = cx * TILE + 4; player.y = H - 4 * TILE; }
          player.vx = 0; player.vy = 0; player.on = false;
        };
      }
      const dest = (() => { let d = (G.roomDef.exits || {})[side]; return d && typeof d === 'object' ? d.to : d; })();
      // A player reads a doorway for a second or so; a harness machine under
      // the rest of the suite's load can need longer for the same slices, so
      // the wait is "until it is baked", bounded at four seconds of frames.
      let tPrev = performance.now(), waited = 0;
      for (let i = 0; i < 240; i++) {
        place(); quiet();
        await raf();
        const now = performance.now(); out.approachMax = Math.max(out.approachMax, now - tPrev); out.frames.push(now - tPrev); tPrev = now;
        waited = i + 1;
        if (i >= 30 && tileFresh(dest)) break;
      }
      const freshBefore = tileFresh(dest);
      const revisit = !!visited[dest];
      // and go
      if (side === 'R') keys[KEYB.RIGHT[0]] = 1;
      else if (side === 'L') keys[KEYB.LEFT[0]] = 1;
      else if (side === 'T') { player.vy = -760; keys[KEYB.JUMP[0]] = 1; }
      else { player.vy = 300; }
      let cost = null, liveAt = null;
      tPrev = performance.now();
      for (let i = 0; i < 120; i++) {
        quiet();
        const lf = TILE_STATS.live;
        await raf();
        const now = performance.now(), d = now - tPrev; tPrev = now;
        if (cost == null && G.roomId === dest) {
          // the frame on which the room changed was the one just drawn; the
          // bake, if any, happened inside it
          cost = d; liveAt = TILE_STATS.live - lf;
          break;
        }
      }
      for (const k in keys) keys[k] = 0;
      out.walk.push({ room, side, dest, arrived: G.roomId === dest, freshBefore, revisit, cost, liveBakes: liveAt, waited });
    }
    // ---- 3. the same picture -----------------------------------------------------
    const hashOf = (cvx) => {
      const d = cvx.getContext('2d').getImageData(0, 0, cvx.width, cvx.height).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i += 7) h = Math.imul(h ^ d[i], 16777619) >>> 0;
      return h;
    };
    out.same = [];
    // the next two are about one bake at a time: the background baker is
    // stood down so it cannot evict or redo what they are comparing
    const prebake = window.tilePrebakeTick; window.tilePrebakeTick = () => {};
    for (const id of ['A3', 'B3', 'A12', 'D2']) {
      if (ROCK_ART[ROOMS[id].zone]) { mediaFetch(ROCK_ART[ROOMS[id].zone], true); }
    }
    for (let i = 0; i < 60 && !['D'].every(z => MEDIA_LOW[ROCK_ART[z]] === 3); i++) await wait(100);
    for (const [here, id] of [['A2', 'A3'], ['B2', 'B3'], ['A3', 'A12'], ['D1', 'D2']]) {
      loadRoom(here); quiet();
      await raf(); await raf();
      // ahead, in slices, from the room next door
      tileJobDrop(); tileStore.delete(id);
      const ent = tileEntry(id, ROOMS[id].w * TILE, ROOMS[id].h * TILE);
      tileJob = { id, cv: ent.cv, ctx: ent.cv.getContext('2d'), grid: buildRoom(id), curve: null,
        sig: tileSig(id), it: tileBakeSteps(PAL[ROOMS[id].zone]), born: 0 };
      let slices = 0;
      while (tileJob && slices < 5000) { tileJobSlice(1); slices++; }
      const ahead = hashOf(tileStore.get(id).cv);
      // ...and live, in one go, standing in it
      tileStore.delete(id);
      loadRoom(id); quiet();
      await raf(); await raf();
      const live = hashOf(tileStore.get(id).cv);
      out.same.push({ id, slices, equal: ahead === live });
    }
    // ---- 4. stale is noticed -------------------------------------------------------
    {
      // settle first: the first entry may still be waiting on a slab
      for (let k = 0; k < 2; k++) {
        loadRoom('A2'); quiet(); for (let i = 0; i < 4; i++) await raf();
        loadRoom('A1'); quiet(); for (let i = 0; i < 4; i++) await raf();
      }
      const l0 = TILE_STATS.live;
      loadRoom('A2'); quiet(); await raf(); await raf();
      const clean = TILE_STATS.live - l0;
      // she cuts the cellar hatch, leaves, and comes back
      const U = buildRoom('A2');
      let cut = null;
      for (let ty = 0; ty < U.length && !cut; ty++) for (let tx = 0; tx < U[0].length; tx++) if (U[ty][tx] === 'B') { cut = [tx, ty]; break; }
      const l1 = TILE_STATS.live;
      G.breakTile(cut[0], cut[1]); await raf(); await raf();
      const onCut = TILE_STATS.live - l1;
      loadRoom('A1'); quiet(); await raf(); await raf();
      const l2 = TILE_STATS.live;
      loadRoom('A2'); quiet(); await raf(); await raf();
      // and the bake she comes back to is the one with the hole in it
      out.stale = { clean, onCut, back: TILE_STATS.live - l2, sigHasCut: tileStore.get('A2').sig === tileSig('A2') && tileSig('A2').split('|')[2] !== '0' };
    }
    window.tilePrebakeTick = prebake;
    // ---- 5. the device's budget --------------------------------------------------------
    {
      const tour = ['A1', 'A2', 'A3', 'A4', 'A10', 'A5', 'A8', 'A9', 'B1', 'B2'];
      let worst = 0, worstB = 0;
      for (const id of tour) { loadRoom(id); quiet(); for (let i = 0; i < 20; i++) await raf(); worst = Math.max(worst, tileStore.size); worstB = Math.max(worstB, tileBytes()); }
      const capHi = tileCap();
      qualSet('low', false);
      tileEvict(null);
      let worstLow = 0;
      for (const id of tour) { loadRoom(id); quiet(); for (let i = 0; i < 20; i++) await raf(); worstLow = Math.max(worstLow, tileStore.size); }
      const capLo = tileCap();
      qualSet('high', false);
      out.budget = { worst, worstB, capN: capHi.n, capB: capHi.bytes, worstLow, capLowN: capLo.n };
    }
    // ---- 6. the save ------------------------------------------------------------------------
    {
      const key = saveKeyFor(G.save.theme);
      const ls = window.localStorage, orig = ls.setItem.bind(ls);
      let writes = 0;
      ls.setItem = (k, v) => { if (k === key) writes++; return orig(k, v); };
      try {
        persist();                                  // a clean slate: nothing pending
        writes = 0;
        loadRoom('A1');
        const sync = writes;
        const t0 = performance.now();
        while (writes === 0 && performance.now() - t0 < 2500) await wait(25);
        const later = writes, after = Math.round(performance.now() - t0);
        loadRoom('A2');
        const before = writes;
        window.dispatchEvent(new Event('pagehide'));
        const onHide = writes - before;
        const stored = JSON.parse(ls.getItem(key));
        out.save = { sync, later, after, onHide, room: stored && stored.visited && stored.visited.A2 ? 'A2 recorded' : 'A2 missing' };
      } finally { ls.setItem = orig; }
    }
    // ---- 7. meeting a machine ------------------------------------------------------
    {
      const sheetHash = (cvx) => {
        const w = cvx.width, h = cvx.height, x = cvx.getContext('2d');
        let hh = 2166136261;
        for (let y0 = 0; y0 < h; y0 += 512) {
          const d = x.getImageData(0, y0, w, Math.min(512, h - y0)).data;
          for (let i = 0; i < d.length; i += 13) hh = Math.imul(hh ^ d[i], 16777619) >>> 0;
        }
        return hh;
      };
      const forget = () => {
        delete ATLAS_PROC.roster; delete POP_ART['sheet:roster']; delete POP_ART['sheet:npcs'];
        for (const k in ATLAS_RUN) delete ATLAS_RUN[k];
        for (const k in POP_RUN) delete POP_RUN[k];
        artJob = null;
      };
      for (const k of ['roster', 'npcs']) mediaFetch(k);
      for (let i = 0; i < 80 && !(MEDIA_RAW.roster && MEDIA_LOW.roster !== 2 && MEDIA_RAW.npcs && MEDIA_LOW.npcs !== 2); i++) await wait(100);
      // (a) the same picture, on demand and in slices
      const prebake2 = window.tilePrebakeTick; window.tilePrebakeTick = () => {};
      forget();
      const onDemand = { roster: sheetHash(sheetOf('roster', 8, 11, true)), npcs: sheetHash(sheetOf('npcs', 6, 8, false)),
        proc: sheetHash(ATLAS_PROC.roster) };
      forget();
      let slices = 0;
      for (const u of [{ k: 'sheet:roster', A: ATLAS }, { k: 'sheet:npcs', A: ATLAS2 }]) {
        artJob = { u, it: artWarmSteps(u) };
        while (artJob && slices < 20000) { artWarmSlice(1); slices++; }
      }
      // read back through the same accessor the draw uses — now from the caches
      const ahead = { roster: sheetHash(sheetOf('roster', 8, 11, true)), npcs: sheetHash(sheetOf('npcs', 6, 8, false)),
        proc: sheetHash(ATLAS_PROC.roster) };
      out.meetSame = { slices, same: onDemand.roster === ahead.roster && onDemand.npcs === ahead.npcs && onDemand.proc === ahead.proc };
      window.tilePrebakeTick = prebake2;
      // (b) the crossing: B2's own machines are kept off screen so the roster
      // is NOT drawn there; B7's turret, flier and blob are drawn the frame
      // she arrives — the first roster creatures of the session
      forget();
      loadRoom('B2'); quiet();
      const g = G.grid; let cx = 0;
      for (let x = 1; x < G.roomDef.w - 1; x++) if (g[0][x] === '.') { cx = x + 1; break; }
      const place = () => { player.x = cx * TILE + 4; player.y = 2 * TILE + 8; player.vx = 0; player.vy = 0; player.on = false; };
      let waited = 0;
      for (let i = 0; i < 300; i++) {
        place(); quiet(); await raf(); waited = i + 1;
        if (i > 20 && tileFresh('B7') && artWarmUnits('B7').every(artWarmDone)) break;
      }
      const readyBefore = artWarmUnits('B7').every(artWarmDone);
      const t = { proc: 0, pop: 0 };
      const wrapT = (n, slot) => { const f = window[n]; window[n] = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { t[slot] += performance.now() - t0; } }; return f; };
      const oProc = wrapT('processSheet', 'proc'), oPop = wrapT('popArt', 'pop');
      player.vy = -760; keys[KEYB.JUMP[0]] = 1;
      let cost = null, procT = null, drawn = 0, tPrev = performance.now();
      for (let i = 0; i < 120; i++) {
        if (G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; }
        G.impact = null; G.meet = null; G.lesson = null; player.iT = 99;
        if (G.roomId === 'B2') { G.enemies = []; }
        t.proc = 0; t.pop = 0;
        await raf();
        const now = performance.now(), d = now - tPrev; tPrev = now;
        if (G.roomId === 'B7') { cost = d; procT = t.proc + t.pop; drawn = G.enemies.length; break; }
      }
      keys[KEYB.JUMP[0]] = 0;
      window.processSheet = oProc; window.popArt = oPop;
      out.meet = { waited, readyBefore, cost, procT, drawn, stats: JSON.stringify(ART_STATS) };
    }
    out.stats = JSON.stringify(TILE_STATS);
    out.median = out.frames.slice().sort((a, b) => a - b)[Math.floor(out.frames.length / 2)];
    return out;
  });

  // ---- report ---------------------------------------------------------------------------
  const BUDGET = Math.max(90, r.median * 4);
  for (const [i, w] of r.walk.entries()) {
    const tag = w.room + ' ' + w.side + ' -> ' + w.dest;
    if (!w.arrived) { check(tag + ': arrives', false, 'never reached ' + w.dest); continue; }
    if (i === 0) {
      console.log('  ..   ' + tag + ': first crossing ' + Math.round(w.cost) + ' ms, ' + w.liveBakes + ' bake on the frame (warm-up, not judged)');
      continue;
    }
    check(tag + ': the room is already baked when she gets there', w.freshBefore && w.liveBakes === 0,
      (w.revisit ? 'revisit' : 'one door ahead') + ' (ready after ' + w.waited + ' frames at the door), ' + w.liveBakes + ' bake on the crossing frame' + (w.freshBefore ? '' : ' (NOT baked beforehand)'));
    check(tag + ': ...and the crossing frame is a frame', w.cost != null && w.cost < BUDGET,
      Math.round(w.cost) + ' ms (budget ' + Math.round(BUDGET) + ' ms, a median frame here is ' + Math.round(r.median) + ')');
  }
  check('baking ahead never takes a frame hostage', r.approachMax < Math.max(150, r.median * 6),
    'longest frame while baking ahead ' + Math.round(r.approachMax) + ' ms (median ' + Math.round(r.median) + ')');
  for (const s of r.same) {
    check(s.id + ': baked ahead in slices = baked live', s.equal, s.slices + ' slices, ' + (s.equal ? 'identical' : 'DIFFERENT pixels'));
  }
  check('a cached room is not baked again on the way back', r.stale.clean === 0, r.stale.clean + ' bakes');
  check('...a tile she breaks repaints the floor at once', r.stale.onCut === 1, r.stale.onCut + ' bake when the hatch was cut');
  check('...and the floor she comes back to is the cut one, not rebaked again', r.stale.back === 0 && r.stale.sigHasCut,
    r.stale.back + ' bakes on the way back in, cut ' + (r.stale.sigHasCut ? 'in' : 'NOT in') + ' the cached bake');
  check('the cache stays inside the device budget', r.budget.worst <= r.budget.capN && r.budget.worstB <= r.budget.capB,
    'at most ' + r.budget.worst + ' rooms / ' + (r.budget.worstB / 1e6).toFixed(1) + ' MB (cap ' + r.budget.capN + ' / ' + (r.budget.capB / 1e6) + ' MB)');
  check('...and the phone tier holds fewer', r.budget.worstLow <= r.budget.capLowN && r.budget.capLowN <= r.budget.capN,
    'low tier at most ' + r.budget.worstLow + ' rooms (cap ' + r.budget.capLowN + ')');
  check('the save is not written on the crossing frame', r.save.sync === 0, r.save.sync + ' writes inside loadRoom');
  check('...it is written in the next quiet moment', r.save.later >= 1 && r.save.after < 2500, r.save.later + ' write(s) after ' + r.save.after + ' ms');
  check('...and at once when the page is hidden', r.save.onHide >= 1 && r.save.room === 'A2 recorded', r.save.onHide + ' write on pagehide, ' + r.save.room);
  console.log('  ..   ' + r.stats);
  check('a sheet readied in slices is the sheet drawn on demand', r.meetSame.same,
    r.meetSame.slices + ' slices for the roster and the npcs sheet, ' + (r.meetSame.same ? 'identical' : 'DIFFERENT pixels'));
  check('the creatures one door away are readied before she gets there', r.meet.readyBefore,
    'ready after ' + r.meet.waited + ' frames at the door');
  check('...and meeting them costs the crossing frame no sheet processing', r.meet.procT != null && r.meet.procT < 5 && r.meet.drawn > 0,
    (r.meet.procT == null ? 'never crossed' : r.meet.procT.toFixed(1) + ' ms in the sheet passes on the crossing frame, '
      + r.meet.drawn + ' machines there, frame ' + Math.round(r.meet.cost) + ' ms'));
  console.log('  ..   ' + r.meet.stats);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — the room behind the door is ready before she opens it'));
  process.exit(fails.length ? 1 : 0);
})();
