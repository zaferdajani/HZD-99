// CLAWBYTE — CAMPAIGN PACKS: the game as a platform.
//
// A pack is a folder under packs/<id>/ with one pack.json in it: rooms as
// DATA (grid rows as strings, entities, exits, map cells) plus a start bench.
// `?pack=<id>` on either page loads it over the built-in world at boot. This
// is the StarCraft-editor seam: the engine never changes per campaign, the
// campaign is a folder, and endless DLCs are endless folders.
//
// Three rules this file lives by:
//
//   1. THE BASE GAME MUST NOT KNOW. Without ?pack= this file does nothing at
//      all — no fetch, no wrapper, no changed behavior. Every harness that
//      walks ROOMS sees exactly the world world.js shipped.
//   2. A PACK'S SAVE IS ITS OWN. saveKeyFor is wrapped so a pack campaign
//      saves under its own key — otherwise finishing a pack would leave the
//      main save benched in a room that stops existing the moment the query
//      string is gone.
//   3. A BROKEN PACK DEGRADES TO THE BASE GAME, LOUDLY. A failed fetch or a
//      malformed room logs what was wrong and boots the world that works,
//      because a black page teaches an author nothing.
//
// This file is LAST in build.cjs's files array on purpose: its top level runs
// after game.js has declared newSave/startGame/saveKeyFor, which is what lets
// it wrap them without game.js knowing packs exist.

const PACK = { id: null, def: null, ready: false, err: null, pending: null };

// Registered separately so an editor/test can validate a pack def without
// fetching. Returns the list of problems it refused (empty = clean load).
function packApply(def) {
  const bad = [];
  const rooms = (def && def.rooms) || {};
  for (const id in rooms) {
    const r = rooms[id], rows = r.grid || [];
    if (!r.w || !r.h || rows.length !== r.h || rows.some((row) => row.length !== r.w)) {
      bad.push(id + ': grid is not ' + r.w + 'x' + r.h);
      continue;
    }
    ROOMS[id] = {
      zone: r.zone || 'A', w: r.w, h: r.h,
      cave: r.cave ? 1 : undefined,
      exits: r.exits || {},
      ents: (r.ents || []).map((e) => e.slice()),
      pack: def.id,
      // the grid is data, but buildRoom wants a builder — stamp the rows
      build(g) { for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) g[y][x] = rows[y][x]; },
    };
    delete gridCache[id];                       // a re-applied pack re-stamps
    MAPPOS[id] = (def.map && def.map[id]) || [0, 0, 1, 1];
  }
  if (def && def.start) {
    // "start": "P1" or {"room":"P1","x":96,"y":412} — same shape as a bench
    const st = typeof def.start === 'string' ? { room: def.start } : def.start;
    if (st.x == null) st.x = 96;
    if (st.y == null) st.y = 412;
    def.start = st;
  }
  PACK.def = def;
  for (const b of bad) console.error('pack: refused room ' + b);
  return bad;
}

(function packBoot() {
  let id = null;
  try { id = new URLSearchParams(location.search).get('pack'); } catch (e) { return; }
  // the id is a path segment; anything outside this alphabet stays out of one
  if (!id || !/^[a-z0-9_-]{1,40}$/.test(id)) return;
  PACK.id = id;

  const _saveKeyFor = saveKeyFor;
  saveKeyFor = (theme) => _saveKeyFor(theme) + '_pk_' + PACK.id;

  const _newSave = newSave;
  newSave = function (diff) {
    const s = _newSave(diff);
    if (PACK.ready && PACK.def.start) s.bench = { room: PACK.def.start.room, x: PACK.def.start.x, y: PACK.def.start.y };
    return s;
  };

  // The menus are human-speed and the fetch is network-speed, so the pack is
  // almost always ready first — but "almost always" is how races ship. A
  // start that arrives early parks here and fires the moment the pack lands.
  const _startGame = startGame;
  startGame = function (save) {
    if (!PACK.ready && !PACK.err) { PACK.pending = save; return; }
    if (PACK.ready && PACK.def.start && !ROOMS[save.bench.room]) {
      // a save benched in a room this pack does not have (a fresh save made
      // before the fetch landed, or a pack whose rooms were renamed) starts
      // the campaign at the pack's own start rather than crashing loadRoom
      save.bench = { room: PACK.def.start.room, x: PACK.def.start.x, y: PACK.def.start.y };
    }
    _startGame(save);
  };

  const release = () => {
    if (!PACK.pending) return;
    const s = PACK.pending; PACK.pending = null; startGame(s);
  };
  fetch('packs/' + id + '/pack.json')
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then((def) => { packApply(def); PACK.ready = true; release(); })
    .catch((e) => { PACK.err = String(e); console.error('pack ' + id + ': ' + PACK.err); release(); });
})();
