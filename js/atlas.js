// CLAWBYTE — pre-rendered 3D turnaround atlas.
//
// Eleven subjects, eight yaw angles each, rendered in 3D from a locked
// orthographic camera with the key light fixed to the WORLD rather than to the
// subject. That last detail is the whole point: it is why a turn reads as a
// volume rotating instead of a picture being flipped.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: never mirror a frame. Mirroring would
// flip the lit side onto the shadow side and instantly re-flatten everything the
// 3D render bought us. When the subject faces the other way we select a
// different authored angle. That is what the eight columns are for.
//
//   column 0 = 0°   facing screen-right
//   column 1 = 45°
//   column 2 = 90°  facing the camera   <- a turn passes through here
//   column 3 = 135°
//   column 4 = 180° facing screen-left
//   columns 5-7 = 225/270/315, the back, kept for scripted moments
// k-values are these subjects' own original Sep-2 tuning. They briefly
// carried a ×1.335 correction while HERO_SCREEN_SCALE sat at 1.335 (owner,
// 2026-09-11), restoring the proportion they were authored at against an
// effectively unscaled hero; a same-day follow-up cut the hero to her
// original 1.0, so that correction factor is back to 1 and these are back
// to their own plain values — no longer scaled BY anything, just what they
// always were.
// blob/flier/turret draw through here every frame; brood/
// atlas/zero/prism/mother/glitch have their own dedicated rigs (beast.js,
// eagle.js, glaciere.js, furnace.js, prism.js, mother.js) and only fall
// back to this table while their real art is still loading.
const ATLAS = {
  key: 'roster', cols: 8, rows: 11,
  // row  = which strip in the sheet
  // k    = how many hitbox-heights the CELL should occupy on screen
  // yOff = nudge in hitbox-heights; hovering things do not stand on the cell floor
  sub: {
    // rows 0-2 (hzd, crawler, hopper) are in the sheet and drawn by nothing:
    // she is live-drawn (ART_BIBLE §2) and the crawler and hopper are always
    // the pack or the cheetah line (js/wolves.js), which wait for their own
    // plates rather than flash the old machine up for a frame
    blob:    { row: 3,  k: 2.85, yOff: 0.06 },
    flier:   { row: 4,  k: 2.60, yOff: -0.10 },
    turret:  { row: 5,  k: 2.20, yOff: 0.04 },
    brood:   { row: 6,  k: 1.55, yOff: -0.06, ins: { top: 0.10, bottom: 0.20 } },
    atlas:   { row: 7,  k: 1.40, yOff: 0.03, ins: { top: 0.10, bottom: 0.19 } },
    zero:    { row: 8,  k: 1.58, yOff: 0.00, ins: { top: 0.09, bottom: 0.20 } },
    prism:   { row: 9,  k: 1.95, yOff: -0.08, ins: { top: 0.10, bottom: 0.26 } },
    mother:  { row: 10, k: 1.05, yOff: 0.02, ins: { top: 0.10, bottom: 0.06 } },
  },
};

// ---------------------------------------------------------------------------
// Load-time cell cleanup. The generated sheets carry three defects that no
// crop can fully hide: thin frame lines drawn inside cells, chunks of
// neighbouring subjects poking across cell borders, and white blend fringe
// left by keying. Per cell we keep only the LARGEST connected alpha component
// — the subject itself — which structurally removes lines and intruders, then
// erode boundary pixels that are still near-white. Runs once per sheet.
const ATLAS_PROC = {};
// A sheet being processed AHEAD of need (artWarm, below) is a paused generator;
// asking for it on demand finishes that one rather than starting another.
const ATLAS_RUN = {};
function processSheet(key, cols, rows) {
  if (ATLAS_PROC[key] !== undefined) return ATLAS_PROC[key];
  const run = ATLAS_RUN[key];
  delete ATLAS_RUN[key];
  const out = genRun(run || processSheetSteps(key, cols, rows));
  return ATLAS_PROC[key] !== undefined ? ATLAS_PROC[key] : (out || null);
}
function genRun(it) { let r; do { r = it.next(); } while (!r.done); return r.value; }
// THE SAME PASS, IN STEPS. One sheet is a 2496x2508 picture and the pass walks
// it several times — measured at about a second on a slow machine, on whatever
// frame first draws a creature from it, which was often the frame a door was
// crossed. As a generator the arithmetic is untouched (tests/roomcache.cjs
// compares the result pixel for pixel); it only stops between cells and bands
// so the idle prebake can spread it, and the readback and write-back go in
// bands for the same reason.
function* processSheetSteps(key, cols, rows) {
  if (ATLAS_PROC[key] !== undefined) return ATLAS_PROC[key];
  const im = MEDIA_IMG[key];
  if (!im) return null;
  const W = im.naturalWidth, H = im.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  yield;
  const BAND = 256;
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y0 = 0; y0 < H; y0 += BAND) {
    d.set(x.getImageData(0, y0, W, Math.min(BAND, H - y0)).data, y0 * W * 4);
    yield;
  }
  const img = new ImageData(d, W, H);
  // THE LABELS ARE PER CELL. A component never leaves its cell (the flood
  // stops at the cell's edge), and each cell numbers its own components from
  // one, so a cell-sized label plane and queue give exactly the answer a
  // sheet-sized one did — at ~1% of the memory: three sheet-sized Int32
  // planes were 75 MB of scratch per sheet, the kind of allocation a phone
  // pays for twice (once to make, once to collect).
  let CWm = 0, CHm = 0;
  for (let ci = 0; ci < cols; ci++) CWm = Math.max(CWm, Math.floor((ci + 1) * W / cols) - Math.floor(ci * W / cols));
  for (let r = 0; r < rows; r++) CHm = Math.max(CHm, Math.floor((r + 1) * H / rows) - Math.floor(r * H / rows));
  const lbl = new Int32Array(CWm * CHm);
  const qx = new Int32Array(CWm * CHm), qy = new Int32Array(CWm * CHm);
  yield;
  for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
    yield;
    const x0 = Math.floor(ci * W / cols), x1 = Math.floor((ci + 1) * W / cols);
    const y0 = Math.floor(r * H / rows), y1 = Math.floor((r + 1) * H / rows);
    const cw = x1 - x0;
    lbl.fill(0, 0, cw * (y1 - y0));
    // label components (4-connected) inside this cell
    let next = 0; const sizes = [];
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const n = yy * W + xx, ln = (yy - y0) * cw + (xx - x0);
      if (lbl[ln] !== 0 || d[n * 4 + 3] < 16) continue;
      next++; let head = 0, tail = 0, size = 0;
      qx[tail] = xx; qy[tail] = yy; tail++; lbl[ln] = next;
      while (head < tail) {
        const px2 = qx[head], py2 = qy[head]; head++; size++;
        for (const [ax, ay] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx2 = px2 + ax, ny2 = py2 + ay;
          if (nx2 < x0 || ny2 < y0 || nx2 >= x1 || ny2 >= y1) continue;
          const nn = ny2 * W + nx2, lnn = (ny2 - y0) * cw + (nx2 - x0);
          if (lbl[lnn] === 0 && d[nn * 4 + 3] >= 16) { lbl[lnn] = next; qx[tail] = nx2; qy[tail] = ny2; tail++; }
        }
      }
      sizes.push(size);
    }
    if (!next) continue;
    let best = 1;
    for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best - 1]) best = i + 1;
    const base = next - sizes.length;   // labels used before this cell (always 0 now: numbering is per cell)
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const n = yy * W + xx, ln = (yy - y0) * cw + (xx - x0);
      if (lbl[ln] !== 0 && lbl[ln] !== base + best) { d[n * 4 + 3] = 0; }
    }
    // two erosion passes on white fringe at the silhouette boundary
    for (let pass = 0; pass < 2; pass++) {
      const kill = [];
      for (let yy = Math.max(1, y0); yy < Math.min(H - 1, y1); yy++)
        for (let xx = Math.max(1, x0); xx < Math.min(W - 1, x1); xx++) {
          const n = yy * W + xx, i = n * 4;
          if (d[i + 3] < 16) continue;
          if (d[(n-1)*4+3] >= 16 && d[(n+1)*4+3] >= 16 && d[(n-W)*4+3] >= 16 && d[(n+W)*4+3] >= 16) continue;
          const rr2 = d[i], gg = d[i+1], bb = d[i+2];
          if (rr2 >= 202 && gg >= 202 && bb >= 202 && Math.max(rr2, gg, bb) - Math.min(rr2, gg, bb) <= 18) kill.push(i);
        }
      for (const i of kill) d[i + 3] = 0;
    }
  }
  // frame lines drawn near cell boundaries survive when dust bridges them to
  // the subject. They are neutral mid-grey; the machines are warm ceramic or
  // cool steel, both of which carry more channel spread. Kill neutral grey in
  // narrow bands around every internal cell boundary.
  // The generator draws cell frames at ARBITRARY positions — probing found a
  // full-height grey line 66% into one cell — so position-based bands lose.
  // Detect instead: any column or row of a cell whose pixels are MOSTLY flat
  // neutral grey is a drawn frame line, wherever it sits. Only the grey pixels
  // die, so art crossing the line keeps everything that has colour.
  const isLineGrey = (i) => {
    const rr2 = d[i], gg = d[i+1], bb = d[i+2];
    return rr2 >= 130 && rr2 <= 233 && Math.max(rr2, gg, bb) - Math.min(rr2, gg, bb) <= 14;
  };
  for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
    yield;
    const x0 = Math.floor(ci * W / cols), x1 = Math.floor((ci + 1) * W / cols);
    const y0 = Math.floor(r * H / rows), y1 = Math.floor((r + 1) * H / rows);
    for (let xx = x0; xx < x1; xx++) {          // vertical frame lines
      let n = 0;
      for (let yy = y0; yy < y1; yy++) { const i = (yy * W + xx) * 4; if (d[i+3] >= 16 && isLineGrey(i)) n++; }
      if (n > (y1 - y0) * 0.30) for (let yy = y0; yy < y1; yy++) {
        const i = (yy * W + xx) * 4; if (d[i+3] >= 16 && isLineGrey(i)) d[i+3] = 0;
      }
    }
    for (let yy = y0; yy < y1; yy++) {          // horizontal frame lines
      let n = 0;
      for (let xx = x0; xx < x1; xx++) { const i = (yy * W + xx) * 4; if (d[i+3] >= 16 && isLineGrey(i)) n++; }
      if (n > (x1 - x0) * 0.30) for (let xx = x0; xx < x1; xx++) {
        const i = (yy * W + xx) * 4; if (d[i+3] >= 16 && isLineGrey(i)) d[i+3] = 0;
      }
    }
  }
  // -------------------------------------------------------------------------
  // THE GRADE. The minions are pre-rendered stills, and they looked it: flat,
  // desaturated, no light on them, sliding around in front of rooms that are
  // lit and coloured. The cat looks solid because she is DRAWN — gradients,
  // ambient occlusion, a contour, a lit edge — and none of that can be added
  // to a photograph after the fact by hand, eleven subjects at a time.
  //
  // So it is done to the pixels, once, when the sheet lands, and every draw
  // afterwards is free. Three things, in the order a render would do them:
  //
  //   COLOUR   pushed away from grey, so the palette that survived the render
  //            actually reaches the screen.
  //   FORM     a vertical light ramp per cell — brighter at the crown, falling
  //            into shadow at the feet. This is what a top key light does, and
  //            it is the single cue that turns a silhouette into a body.
  //   RIM      the boundary pixels facing up and left are lifted toward a cool
  //            highlight, matching the key direction this atlas was rendered
  //            with, so every machine carries an edge of light off its shoulder.
  // -------------------------------------------------------------------------
  const a1 = new Uint8ClampedArray(W * H);
  for (let i = 0, p = 3; i < W * H; i++, p += 4) a1[i] = d[p];
  yield;
  const SAT = 1.5, CON = 1.1, RIM = 0.5;
  for (let r = 0; r < rows; r++) {
    const y0 = Math.floor(r * H / rows), y1 = Math.floor((r + 1) * H / rows);
    const span = Math.max(1, y1 - y0 - 1);
    for (let yy = y0; yy < y1; yy++) {
      if ((yy - y0) % 48 === 0) yield;
      const v = (yy - y0) / span;                       // 0 crown .. 1 feet
      const lk = 1.16 - v * 0.34;                       // the key light falling
      for (let xx = 0; xx < W; xx++) {
        const i = yy * W + xx, p = i * 4;
        if (a1[i] < 8) continue;
        let R = d[p], Gc = d[p + 1], B = d[p + 2];
        const L = 0.299 * R + 0.587 * Gc + 0.114 * B;
        R = L + (R - L) * SAT; Gc = L + (Gc - L) * SAT; B = L + (B - L) * SAT;
        R *= lk; Gc *= lk; B *= lk;
        R = 128 + (R - 128) * CON; Gc = 128 + (Gc - 128) * CON; B = 128 + (B - 128) * CON;
        // rim: is this pixel on an edge that faces the light?
        const up = yy > y0 ? a1[i - W] : 0, lf = xx > 0 ? a1[i - 1] : 0;
        if (a1[i] > 200 && (up < 140 || lf < 140)) {
          const k = RIM * (1 - Math.min(up, lf) / 140);
          R += (232 - R) * k; Gc += (244 - Gc) * k; B += (255 - B) * k;
        }
        d[p] = R < 0 ? 0 : R > 255 ? 255 : R;
        d[p + 1] = Gc < 0 ? 0 : Gc > 255 ? 255 : Gc;
        d[p + 2] = B < 0 ? 0 : B > 255 ? 255 : B;
      }
    }
  }
  for (let y0 = 0; y0 < H; y0 += BAND) {
    yield;
    x.putImageData(img, 0, 0, 0, y0, W, Math.min(BAND, H - y0));
  }
  // a sheet replaced while this ran (the quarter-size stand-in giving way to
  // the full one) has already thrown its derivatives away; this result is of
  // the old picture and is not kept
  if (MEDIA_IMG[key] !== im) return null;
  ATLAS_PROC[key] = cv;
  return cv;
}
// The cleanup above exists to repair the ORIGINAL generated sheets, which
// arrived with frame lines, neighbours poking across cell borders and white
// keying fringe. A sheet this repo assembled itself has none of those, and
// running it through anyway would be actively harmful: keeping only the largest
// component deletes the Nymph's drifting spores, and eroding near-white
// boundary pixels eats a porcelain Archivist from the outside in.
function sheetOf(key, cols, rows, clean) {
  const base = clean === false ? MEDIA_IMG[key]
    : (processSheet(key, cols, rows) || MEDIA_IMG[key]);
  // the roster is the ENEMY sheet — it takes the pop grade (see media.js) so
  // the cast reads against the backdrop instead of dissolving into it. The
  // npcs sheet takes it too now (owner, 2026-08-16: "NPC is faded!"): the
  // machine folk stand in the darkest rooms in the game, and a friendly face
  // the eye cannot find is not keeping the room's light, it is missing.
  // ...and 0.68 was not enough of a lift. The owner plays on a phone, and on a
  // phone every one of these rooms reads "all so dark": the sheet arrives at
  // mid 83 / white 145, a 0.68 gamma took it to mid 115 / white 180, and the
  // den's own backdrop is about 17 — so a machine-person stood in it as a shape
  // with no readable surface. 0.45 puts him at mid 150 / white 202, which is
  // where he stops being a silhouette and starts being bronze with a lamp on
  // it. Measured against the alternatives: 0.38 and 0.32 keep going and wash
  // the bronze out entirely, and they close the gap to the powered-down state
  // until "needs a battery" stops reading.
  if ((key === 'roster' || key === 'npcs') && base && typeof popArt === 'function')
    return popArt('sheet:' + key, base, key === 'npcs' ? 0.45 : 0) || base;
  return base;
}
// ---------------------------------------------------------------------------
// MEETING A MACHINE COSTS NOTHING AT THE DOOR (artWarm).
//
// The first creature drawn from a sheet pays for the sheet: the roster's
// cleanup-and-grade pass, the npcs sheet's lift, a beast plate's pop grade.
// Measured headless, the roster alone is ~0.9 s, and the frame that first
// draws a blob or a turret is very often the frame she walks into its room —
// so the doorway hitch the tile cache removed came back the first time each
// kind of machine was met. The same idle prebake that bakes the next room's
// floor (game.js tilePrebakeTick / tileIdle) now also readies the art of the
// creatures one door away, a slice at a time, and the draw finds it done.
//
// It never decides anything about the picture: every unit is the on-demand
// call itself (processSheet / sheetOf / popArt) run as its steps, so the
// result is identical and the caches are the same caches. It waits for the
// FULL sheet (a quarter-size stand-in would be processed and then thrown
// away), and asks the browser to decode it off the main thread first, so the
// first step's drawImage is a copy rather than a decode.
//
// Memory: nothing is held that the on-demand path would not hold. The pass's
// scratch (labels and queues, ~12 bytes a pixel) lives only while one unit is
// in flight, and only one ever is — the peak is the on-demand peak, moved to
// a quiet moment. The phone tier gets the same treatment for that reason.
// ---------------------------------------------------------------------------
let artJob = null;
const ART_DECODE = {};
// What the creatures of a room will draw through, as units of work.
function artWarmUnits(id) {
  const def = ROOMS[id];
  if (!def || (typeof isHero === 'function' && isHero())) return [];
  const out = [], seen = {};
  const add = (u) => { if (!seen[u.k]) { seen[u.k] = 1; out.push(u); } };
  for (const e of def.ents || []) {
    let kind = e[0];
    if (kind === 'npc') kind = e[3];
    if (typeof kind !== 'string') continue;
    // the pack and the cheetahs take their own plates in their kingdoms
    if ((kind === 'crawler' || kind === 'hopper') && typeof WOLF_ZONES !== 'undefined'
        && (WOLF_ZONES[def.zone] || CAT_ZONES[def.zone])) {
      const set = WOLF_ZONES[def.zone] ? WOLF_ART : CHEETAH_ART;
      for (const p in set) add({ k: 'pop:' + set[p].img, img: set[p].img });
      continue;
    }
    const A = atlasOf(kind);
    if (A) add({ k: 'sheet:' + A.key, A });
  }
  return out;
}
function artKeyOf(u) { return u.A ? u.A.key : u.img; }
function artWarmDone(u) {
  if (u.A) {
    const k = u.A.key, popped = (k === 'roster' || k === 'npcs');
    if (u.A.clean !== false && ATLAS_PROC[k] === undefined) return false;
    // popArt grades only a picture with a natural size (an <img>); the processed
    // roster is a canvas and is drawn ungraded, on demand and here alike
    const base = u.A.clean === false ? MEDIA_RAW[k] : ATLAS_PROC[k];
    if (!popped || !base || !base.naturalWidth) return true;
    return typeof POP_ART !== 'undefined' && POP_ART['sheet:' + k] !== undefined;
  }
  return typeof POP_ART !== 'undefined' && POP_ART[u.img] !== undefined;
}
// the full sheet is here and decoded; if not, ask for it and say "not yet"
function artWarmReady(k) {
  const im = typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[k];
  const low = typeof MEDIA_LOW !== 'undefined' ? MEDIA_LOW[k] : 0;
  if (!im || low === 1 || low === 2) {
    if (typeof mediaFetch === 'function' && typeof MEDIA_SRC !== 'undefined' && MEDIA_SRC.images[k]) mediaFetch(k);
    return false;
  }
  if (ART_DECODE[k] === im) return true;
  if (ART_DECODE[k] !== 'pending') {
    ART_DECODE[k] = 'pending';
    const mark = () => { ART_DECODE[k] = im; };
    try { (im.decode ? im.decode() : Promise.resolve()).then(mark, mark); } catch (e) { mark(); }
  }
  return false;
}
function* artWarmSteps(u) {
  if (u.A) {
    const A = u.A;
    if (A.clean !== false && ATLAS_PROC[A.key] === undefined) {
      const inner = processSheetSteps(A.key, A.cols, A.rows);
      ATLAS_RUN[A.key] = inner;
      yield* inner;
      if (ATLAS_RUN[A.key] === inner) delete ATLAS_RUN[A.key];
    }
    const k = A.key;
    if ((k === 'roster' || k === 'npcs') && typeof POP_RUN !== 'undefined' && POP_ART['sheet:' + k] === undefined) {
      const base = A.clean === false ? MEDIA_IMG[k] : (ATLAS_PROC[k] || MEDIA_IMG[k]);
      if (!base || !base.naturalWidth) return;
      const inner = popArtSteps('sheet:' + k, base, k === 'npcs' ? 0.45 : 0);
      POP_RUN['sheet:' + k] = inner;
      yield* inner;
      if (POP_RUN['sheet:' + k] === inner) delete POP_RUN['sheet:' + k];
    }
  } else if (POP_ART[u.img] === undefined) {
    const inner = popArtSteps(u.img);
    POP_RUN[u.img] = inner;
    yield* inner;
    if (POP_RUN[u.img] === inner) delete POP_RUN[u.img];
  }
}
// Pick the next unit for the rooms given, nearest first. Returns true if a
// job is now in flight.
function artWarmPick(ids) {
  if (artJob) return true;
  for (const id of ids) {
    for (const u of artWarmUnits(id)) {
      if (artWarmDone(u)) continue;
      if (!artWarmReady(artKeyOf(u))) continue;
      artJob = { u, it: artWarmSteps(u), room: id };
      return true;
    }
  }
  return false;
}
const ART_STATS = { units: 0, sliceMax: 0, stepMax: 0, stepKey: '' };
function artWarmSlice(ms) {
  const j = artJob;
  if (!j) return;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const t0 = now();
  let done = false;
  try {
    do {
      const ts = now();
      if (j.it.next().done) { done = true; break; }
      const st = now() - ts;
      if (st > ART_STATS.stepMax) { ART_STATS.stepMax = st; ART_STATS.stepKey = j.u.k; }
    } while (now() - t0 < ms);
  } catch (e) { done = true; }
  const spent = now() - t0;
  if (ms !== Infinity && spent > ART_STATS.sliceMax) ART_STATS.sliceMax = spent;
  if (done) { artJob = null; ART_STATS.units++; }
}
// ---------------------------------------------------------------------------
// THE SECOND SHEET — the people, and the machine that blocks your way.
//
// The NPCs were the last characters in the game still drawn entirely by hand,
// which meant they were the last ones that could not turn: a painted three-
// quarter view is a picture, and rotating it is a picture being flipped. They
// are rendered now, on the same terms as the roster — one authored angle per
// column, a key light fixed to the world, and nothing ever mirrored.
//
// Six columns rather than eight, and that is a fact about the renders, not a
// compromise in the code: a generator asked for eight angles returns six, so
// the sheet is assembled out of two half-turns (see tools/turnsheet.cjs) and
// six is what two honest half-turns cover. Columns 0-4 are the facing range
// yawColF() addresses, right profile through to left; column 5 is the back.
const ATLAS2 = {
  key: 'npcs', cols: 6, rows: 8, clean: false,
  // this sheet was keyed and laid out by tools/turnsheet.cjs, so the cells are
  // already isolated and already have a real alpha ramp — no inset needed
  ins: { top: 0.01, bottom: 0.01, side: 0.01 },
  // k-values are back to their original Sep-2 tuning — see ATLAS above for
  // why. Ratchet's "double my size" was always double the hero at her
  // original 1.0; that is what she's back to.
  sub: {
    servo:   { row: 0, k: 1.30, yOff: 0.02 },
    ratchet: { row: 1, k: 2.60, yOff: 0.02 },  // owner: 'the npc is too small, it should be double my size'
    mono:    { row: 2, k: 1.50, yOff: 0.02 },
    patch:   { row: 3, k: 1.40, yOff: 0.02 },
    sage:    { row: 4, k: 1.55, yOff: 0.02 },
    lumen:   { row: 5, k: 1.25, yOff: 0.02 },
    guard:   { row: 6, k: 2.30, yOff: 0.05 },
    // KERF (ART_QUEUE §2aq, fired 2026-09-29). Her row is the eighth, added by
    // tools/npcrow.cjs rather than by rebuilding the sheet — the seven rows
    // above it are approved, shipped art and are not re-fired to make room.
    // k 1.45 against her own read: she is LOW, WIDE and HEAVY, so she wants
    // more width than a standing body at the same height, and her figure fills
    // barely half her cell vertically by design.
    kerf:    { row: 7, k: 1.45, yOff: 0.02 },
  },
};
// which sheet owns a subject. The roster is asked first, so a name that exists
// in both keeps its original art and nothing silently changes underneath it.
function atlasOf(subject) {
  if (ATLAS.sub[subject]) return ATLAS;
  if (ATLAS2.sub[subject]) return ATLAS2;
  return null;
}
function atlasReady(A) {
  const a = A || ATLAS;
  return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[a.key];
}

// eased facing -> authored angle. +1 right, 0 toward camera, -1 left.
function yawCol(faceVis) {
  const f = faceVis == null ? 1 : faceVis;
  return Math.round(clamp((1 - f) / 2, 0, 1) * 4);
}
// fractional yaw for cross-faded rotation: the same mapping, unrounded
function yawColF(faceVis) {
  const f = faceVis == null ? 1 : faceVis;
  return clamp((1 - f) / 2, 0, 1) * 4;
}

// Draws the subject grounded at (cx, footY), scaled from its hitbox height.
// Returns false if the sheet has not loaded, so callers fall back to the
// procedural art rather than drawing nothing.
// The subjects overflow their nominal cells slightly and touch their neighbours,
// so a raw grid slice drags in a piece of the row above and below. Inset the
// source rect a little; losing a few pixels of silhouette beats drawing somebody
// else's feet on top of your boss.
const ATLAS_INSET = { top: 0.115, bottom: 0.055, side: 0.035 };

function drawAtlas(c, subject, faceVis, cx, footY, hitH, opts) {
  const A = atlasOf(subject);
  if (!A || !atlasReady(A)) return false;
  const S = A.sub[subject];
  const im = sheetOf(A.key, A.cols, A.rows, A.clean);
  const cw = im.width / A.cols, ch = im.height / A.rows;
  const o = opts || {};
  const dh = hitH * S.k, dw = dh * (cw / ch);
  const dy = footY - dh + hitH * S.yOff;

  c.save();
  // grounded contact shadow, drawn in-engine because the sheet deliberately has
  // none baked in — a baked shadow cannot respond to the floor it is standing on
  // Contact shadow, drawn in-engine because the sheet has none baked in — a baked
  // shadow cannot react to anything. This one does: it leans and stretches with
  // horizontal speed, and it shrinks and softens as the subject leaves the ground,
  // which is what actually sells weight and contact.
  if (o.grounded !== false) {
    const vx = o.vx || 0, air = clamp(o.air || 0, 0, 1);
    const lean = clamp(vx / 420, -1, 1);
    const spread = 1 + Math.abs(lean) * 0.35;                 // stretches when running
    const lift = 1 - air * 0.55;                              // shrinks in the air
    const sw = dw * 0.30 * spread * lift;
    const sh = Math.max(2, dh * 0.055 * lift);
    const ox = lean * dw * 0.10;                              // trails behind the motion
    const g = c.createRadialGradient(cx + ox, footY, 0, cx + ox, footY, Math.max(1, sw));
    g.addColorStop(0, 'rgba(4,8,12,' + (0.58 * lift).toFixed(3) + ')');
    g.addColorStop(0.6, 'rgba(4,8,12,' + (0.22 * lift).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(4,8,12,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(cx + ox, footY, sw, sh, 0, 0, 7); c.fill();
  }
  if (o.alpha != null) c.globalAlpha = o.alpha;
  // rows whose neighbours crowd them harder get their own crop
  const IN = Object.assign({}, ATLAS_INSET, A.ins || {}, S.ins || {});
  const sy = S.row * ch + ch * IN.top;
  const sw2 = cw * (1 - IN.side * 2);
  const sh2 = ch * (1 - IN.top - IN.bottom);
  const sxOf = (cc) => cc * cw + cw * IN.side;
  // ---- procedural puppetry -----------------------------------------------
  // One authored pose per angle is a statue; motion has to be synthesised.
  // Everything is anchored at the FOOT so squash keeps the feet planted, and
  // scale pairs are volume-preserving (sx = 1/sy) so mass reads as constant.
  const t = o.t || 0, vx = o.vx || 0, vy = o.vy || 0;
  // ---- real rotation in 3D ----------------------------------------------
  // The eight authored angles are a turntable; motion between them is what
  // makes the body read as a volume. Facing gives a fractional yaw and the
  // renderer CROSS-FADES the two nearest authored angles, so a turn sweeps
  // through perspectives instead of popping. Some machines rotate on their
  // own: yawSpin turns the full turntable (prism), yawScan sweeps like a
  // sentry looking along its arc (turret, archivist).
  let fy;
  // `col` names an authored angle directly, bypassing the facing maths. Nothing
  // in the game uses it: it was added for a scripted walk away from camera and
  // that shot draws the REAL character instead, because the sheet it would have
  // come from is a different cat. Kept because a turntable renderer that cannot
  // be asked for a specific angle is a turntable renderer with a hole in it.
  if (o.col != null) fy = o.col;
  else if (o.yawSpin) fy = ((t * o.yawSpin) % 8 + 8) % 8;
  else if (o.yawScan) fy = o.yawScan.c + Math.sin(t * o.yawScan.r) * (o.yawScan.a || 0);
  else fy = yawColF(faceVis);
  fy = ((fy % A.cols) + A.cols) % A.cols;
  // ONE ANGLE AT A TIME where it would otherwise be a double exposure. The
  // cross-fade lays the next authored angle over this one at alpha colF, and
  // a head-scan kept colF wandering forever — two pictures of the same
  // machine, a few degrees apart, both on screen all the time (plan §1: "looks
  // like a double exposure"). Walkers and anything scanning now show the
  // NEAREST authored angle and only that: a turn steps through the five
  // front-hemisphere angles, which is what a turntable of stills honestly is.
  // A body only easing its facing (no scan, not a walker) keeps the fade,
  // because there it is brief and it is a turn.
  const single = !!o.yawScan || o.mode === 'walk';
  if (single) fy = Math.round(fy) % A.cols;
  const col0 = Math.floor(fy) % A.cols, col1 = (col0 + 1) % A.cols;
  const colF = single ? 0 : fy - Math.floor(fy);
  let bob = 0, rot = 0, kx = 1, ky = 1, pivTop = false;
  // the gait's phase. A walker's bob and stride are clocked by FLOOR COVERED
  // (o.dist, px) — never by the wall clock — so the feet cannot run at one
  // rate while the body moves at another, and a machine standing still stands
  // still. Callers that do not pass a distance keep the old clock.
  const gPh = o.dist != null ? o.dist / ATLAS_STRIDE * Math.PI : t * (6 + Math.abs(vx) / 30);
  const mv = o.dist != null ? clamp(Math.abs(vx) / 40, 0, 1) : 1;
  switch (o.mode) {
    case 'walk': {                 // gait: quick bob, lean into the run
      const g = gPh;
      bob = Math.abs(Math.sin(g)) * dh * 0.05 * mv;
      rot = clamp(vx / 420, -1, 1) * 0.075 + Math.sin(g * 2) * 0.022 * mv;
      ky = 1 + Math.sin(g * 2) * 0.02 * mv; kx = 1 / ky;
      break;
    }
    case 'pulse': {                // molten things breathe slowly
      // ...and a molten thing that ONLY breathes is a photograph. 3.5 % of an
      // eighteen-pixel body is half a pixel, which is why the blob showed two
      // silhouettes for a whole fight while walk and spring got the cutout leg
      // rig (tests/kingdom.cjs: four pictures alive). The breath stays as it
      // was — the mother uses this mode too and she is not being restyled here
      // — and the DEFORMATION is what the creature is doing: it draws itself
      // tall and narrow as it gathers a drop, then slumps flat and wide when
      // the drop lets go. Volume-preserving, anchored at the foot, so the
      // weight reads as constant and the feet stay on the floor.
      const sag = clamp(o.sag || 0, 0, 1), reb = clamp(o.reb || 0, 0, 1);
      ky = 1 + Math.sin(t * 3) * 0.035 + sag * 0.16 - reb * 0.28; kx = 1 / ky;
      // a mass with no front rolls where it is going, and the roll is the
      // second silhouette the flat breath never gave it
      rot = Math.sin(t * 0.9) * 0.045 + clamp(vx / 300, -1, 1) * 0.07;
      break;
    }
    case 'hover': {                // fliers ride a slow wave
      bob = Math.sin(t * 2.4) * dh * 0.035;
      rot = Math.sin(t * 1.7) * 0.05 + clamp(vx / 300, -1, 1) * 0.08;
      break;
    }
    case 'sway': {                 // hung from above: pendulum about the TOP
      rot = Math.sin(t * 1.1) * 0.045 + clamp(vx / 300, -1, 1) * 0.05;
      pivTop = true;
      break;
    }
    case 'gimbal': {               // prism: the ring turns, the core pulses
      rot = Math.sin(t * 1.3) * 0.09;
      ky = 1 + Math.sin(t * 2.6) * 0.02; kx = 1 / ky;
      break;
    }
    case 'breathe': default: {     // idle machines still run: faint respiration
      ky = 1 + Math.sin(t * 1.8) * 0.018; kx = 1 / ky;
      rot = Math.sin(t * 0.7) * 0.02;
      break;
    }
  }
  // ---- THE STATE POSE ------------------------------------------------------
  // An atlas creature has one authored picture per angle and no per-state art
  // (ART_BIBLE §4) — so a wind-up and a recovery have to be POSED out of it,
  // or the punish window has no picture at all (plan §1 fix 5). `o.pose`
  // names the state; ATLAS_POSE says what it does to the body: for the cut-
  // out rig below, real articulation (legs fold under a sinking body, splay,
  // or trail behind it; the body pitches about the hips), and for everything
  // else a whole-body lean and squash pivoted on the feet. `fwd` is the side
  // it faces, so "lean forward" is forward whichever way it is looking.
  const PZ = (o.pose && ATLAS_POSE[o.pose]) || null;
  const fwd = (faceVis == null ? 1 : faceVis) >= 0 ? 1 : -1;
  if (PZ && o.mode !== 'walk') {
    rot += PZ.lean * fwd; ky *= PZ.ky; kx *= PZ.kx;
  }
  c.translate(cx, footY);
  const topY = dy - footY;                     // sprite top, relative to the foot
  if (pivTop) { c.translate(0, topY); c.rotate(rot); c.translate(0, -topY); }
  else c.rotate(rot);
  c.scale(kx, ky);
  const ddx = -dw / 2, ddy = topY - bob;
  if (o.flash > 0 || o.charm > 0) {
    // Tint in an offscreen pass. source-atop against the main canvas clips to
    // the opaque BACKGROUND, not the sprite — which painted a glowing rectangle
    // around anything hit. The scratch canvas is transparent, so the tint there
    // clips to the sprite alone.
    const col = o.charm > 0 ? 'rgba(63,216,238,0.42)' : 'rgba(255,235,235,0.55)';
    tintedSprite(im, sxOf(colF > 0.5 ? col1 : col0), sy, sw2, sh2, dw, dh, col, c, ddx, ddy);
  } else if (o.mode === 'walk') {
    // ---- cutout rig: the image is taken apart and mounted on pivots ----------
    // The lower band of the sprite is cut into two leg groups (rear half and
    // front half), each hinged at its own hip and swinging in counterphase; the
    // body is a third part that rides above them and bobs. Three parts of the
    // SAME rendered art, articulated — not one picture sliding.
    const hipF = 0.64;                                  // hips at 64% of the cell
    const g2 = gPh;
    const swing = (o.mode === 'walk' ? 0.20 : 0.08)
      * (o.dist != null ? mv : clamp(Math.abs(vx) / 120 + 0.35, 0.35, 1));
    const legSy = sy + sh2 * hipF, legH = sh2 * (1 - hipF);
    const legDh = dh * (1 - hipF);
    // the pose: how far the hips sink (the legs fold to pay for it, so the
    // feet never leave the floor), how the body pitches about them, and how
    // the two leg groups are set — splayed (front out, rear back) or trailing
    const sink = PZ ? PZ.sink : 0;
    const legDy = topY + dh * hipF + legDh * sink;      // hips, after the sink
    const legDh2 = legDh * (1 - sink);                  // ...and the folded legs
    const front = fwd > 0 ? 1 : 0;                      // which half leads
    // One authored angle, rigged — the NEAREST one (see `single` above). The
    // second pass that faded the next angle in over the first is gone: on a
    // walker it was always on, because the head-scan never let colF settle.
    const limbPass = (cc) => {
      for (const [half, ph] of [[0, 1], [1, -1]]) {     // rear group, front group
        c.save();
        c.translate(ddx + dw * (half ? 0.5 : 0), legDy);
        // shear about the hip line: the top edge never leaves the body, so the
        // stride can never tear a gap open the way rotation did
        const set = PZ ? (PZ.splay * (half === front ? 1 : -1) - PZ.drag) * fwd : 0;
        c.transform(1, 0, Math.sin(g2) * swing * ph + set, 1, 0, 0);
        c.drawImage(im, sxOf(cc) + half * sw2 / 2, legSy, sw2 / 2, legH,
                    half ? -dw * 0.015 : 0, -legDh2 * 0.04, dw / 2 + dw * 0.015, legDh2 * 1.04);
        c.restore();
      }
      // the body overlaps the hip line so the seam never shows; it rides the
      // sink down and pitches about the hip centre
      c.save();
      if (PZ) {
        c.translate(0, legDy); c.rotate(PZ.lean * fwd); c.translate(0, -legDy);
        c.translate(0, legDh * sink);
      }
      c.drawImage(im, sxOf(cc), sy, sw2, sh2 * (hipF + 0.05), ddx, ddy, dw, dh * (hipF + 0.05));
      atlasEyes(c, A, S, IN, cw, ch, cc, ddx, ddy, dw, dh, sw2, sh2);
      c.restore();
    };
    limbPass(col0);
  } else {
    c.drawImage(im, sxOf(col0), sy, sw2, sh2, ddx, ddy, dw, dh);
    atlasEyes(c, A, S, IN, cw, ch, colF > 0.5 ? col1 : col0, ddx, ddy, dw, dh, sw2, sh2);
    if (colF > 0.03) {                       // the next angle fades in over it
      c.save(); c.globalAlpha *= colF;
      c.drawImage(im, sxOf(col1), sy, sw2, sh2, ddx, ddy, dw, dh);
      c.restore();
    }
  }
  c.restore();
  return true;
}

// The eye map is measured over WHOLE cells; the atlas draws an inset of each
// (ATLAS_INSET), so the cell's full rectangle is recovered from the inset one.
function atlasEyes(c, A, S, IN, cw, ch, col, ddx, ddy, dw, dh, sw2, sh2) {
  const kx = dw / sw2, ky = dh / sh2;
  infEyeArt(c, A.key, S.row * A.cols + col, ddx - cw * IN.side * kx, ddy - ch * IN.top * ky, cw * kx, ch * ky);
}
// the walk's stride, in px of floor per half-cycle of the bob: at the crawler's
// patrol speed this is the cadence the old clock gave it (6 + 62/30 rad/s), so
// the same machine walks at the same rhythm — it just cannot slip any more
const ATLAS_STRIDE = 24;
// THE STATE POSES (see drawAtlas). Rig fields — sink: fraction of leg height
// the hips drop; lean: body pitch about the hips (+ is forward, rad); splay:
// leg shear, front group forward and rear group back; drag: both groups
// trailing behind. Whole-body fields for the unrigged modes — lean, kx, ky.
//   coil   — the wind-up: hips down on folded legs, weight rocked BACK
//   lunge  — the commit: body pitched hard forward, legs left behind it
//   winded — the recovery: spent, head and shoulders dropped, legs splayed
//   land   — a landing absorbed: deep fold, body level
//   kick   — a recoil: rocked back off the shot and stretched up
//   perch  — a flier sat down: compact, wings in
// tests/artbible.cjs (the ENEMY cast) measures each against rest and against
// the others; a re-tune that makes two of them one shape fails the build.
const ATLAS_POSE = {
  coil:   { sink: 0.42, lean: -0.16, splay: 0.30, drag: 0, kx: 1.12, ky: 0.82 },
  lunge:  { sink: 0.10, lean: 0.30, splay: 0, drag: 0.55, kx: 1.10, ky: 0.92 },
  winded: { sink: 0.30, lean: 0.34, splay: 0.45, drag: 0, kx: 1.08, ky: 0.86 },
  kick:   { sink: 0, lean: -0.20, splay: 0, drag: 0, kx: 0.92, ky: 1.08 },
  perch:  { sink: 0.30, lean: 0, splay: 0, drag: 0, kx: 1.10, ky: 0.80 },
};
// shared scratch canvas for tinted sprite draws
let _tintCv = null;
function tintedSprite(im, sx, sy, sw2, sh2, dw, dh, col, c, dx, dy) {
  const W = Math.ceil(dw), H = Math.ceil(dh);
  if (!_tintCv) _tintCv = document.createElement('canvas');
  if (_tintCv.width < W) _tintCv.width = W;
  if (_tintCv.height < H) _tintCv.height = H;
  const tx = _tintCv.getContext('2d');
  tx.clearRect(0, 0, W, H);
  tx.drawImage(im, sx, sy, sw2, sh2, 0, 0, dw, dh);
  tx.globalCompositeOperation = 'source-atop';
  tx.fillStyle = col; tx.fillRect(0, 0, W, H);
  tx.globalCompositeOperation = 'source-over';
  c.drawImage(_tintCv, 0, 0, W, H, dx, dy, W, H);
}


