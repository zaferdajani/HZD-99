// TERRAIN SILHOUETTE GRAMMAR + STAGE READABILITY — ART_BIBLE §9 and §10.
//
// Every other art harness in this repo measures ONE ASSET. That is why the game
// can be green on all of them and still lose a side-by-side against a competent
// side-scroller: every defect in the 2026-08-16 teardown was a RELATIONSHIP
// between assets, and a harness that opens one sheet at a time cannot see a
// relationship.
//
// So this harness has a different unit: THE ASSEMBLED FRAME. It boots the real
// build, walks to real rooms, screenshots them, and measures the picture.
//
// That choice is forced, not stylistic. Terrain in this game is almost entirely
// PROCEDURAL — there is exactly one tile sheet on disk — so the right angles the
// owner keeps seeing do not exist in any file you could open. They are drawn at
// runtime. A linter pointed at assets/ would come back clean and be worthless.
//
//   node tests/run.cjs grammar        (needs the repo served on :8220)
const { chromium } = require('playwright');
const path = require('path');

const ROOMS = ['A0', 'A1', 'B4', 'C3', 'D3'];

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// ---------------------------------------------------------------------------
// The detectors. All of these run inside the page against a real frame.
// ---------------------------------------------------------------------------
const DETECTORS = function () {
  const W = this.W, H = this.H, d = this.d;
  // THE SILHOUETTE LAWS MEASURE TERRAIN; THE PLANE LAWS MEASURE THE FRAME.
  // §10 is a rule about how ground is DRAWN — crest, body, hang. §9 is a rule
  // about how the finished picture READS. Running both on the composited
  // canvas made §10 blame the ground for whatever stood in front of it: first
  // the speech panel, then the viewport bezel, then GLACIERE, and finally the
  // lair's ice sheet, which covers stretches of D3's floor whose crest is
  // provably drawn (sampled straight out of tileCv: 60/57/51 where the
  // composited frame reads 26). Four false positives of one species is a
  // pattern, not four accidents.
  //
  // So the edge/corner/lip/skirt detectors read the TERRAIN LAYER, screen
  // aligned — every §10 pass has already run on it, so nothing about the law
  // is weakened — and the value-band and chroma checks go on reading the
  // assembled frame, where they belong.
  // NOTE, kept because it cost a measurement to learn: routing these detectors
  // at the terrain layer instead looks obviously right and is not. Their
  // thresholds are calibrated against the GRADED frame — lightPass, the
  // ambient fill, the braid tint — and on raw terrain pixels the same numbers
  // reported 30 of 39 edges bare across all five rooms. The layer is handed
  // over for diagnosis; the verdict stays on the frame.
  const td = this.terrain || d;
  const lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 2.55; // 0..100
  const at = (x, y) => ((y * W + x) << 2);
  const tlum = (i) => (0.2126 * td[i] + 0.7152 * td[i + 1] + 0.0722 * td[i + 2]) / 2.55;

  // chroma as max-min over RGB, 0..100 — cheap, and good enough to rank bands
  const chroma = (i) => {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx === 0 ? 0 : ((mx - mn) / mx) * 100;
  };

  // --- an edge map, used by the straight-run and corner detectors -----------
  // Sobel would give gradient direction too, but the runs we are hunting are
  // axis-aligned by definition, so a luminance step against the neighbour on
  // each axis is both cheaper and easier to reason about.
  const TH = 14;                      // luminance step that counts as an edge
  // MEASUREMENT CORRECTION (same species as the speech-panel one below): the
  // engine draws a decorative glass BEZEL around the room view, inset a few
  // px from the canvas border. It is UI, it is straight by design — like the
  // HUD — and the detector was reporting its four edges as the longest bare
  // terrain runs in every room (an 840px "floor" that was actually the frame
  // of the picture). The world is measured; the frame around it is not.
  const M = 22;
  const hEdge = new Uint8Array(W * H); // a horizontal edge: bright above, dark below
  const vEdge = new Uint8Array(W * H);
  for (let y = M; y < H - M; y++) {
    for (let x = M; x < W - M; x++) {
      const i = y * W + x;
      if (Math.abs(lum(at(x, y)) - lum(at(x, y + 1))) > TH) hEdge[i] = 1;
      if (Math.abs(lum(at(x, y)) - lum(at(x + 1, y))) > TH) vEdge[i] = 1;
    }
  }

  // --- (e) STRAIGHT-RUN DETECTOR -------------------------------------------
  // §10.2: no axis-aligned run longer than 3 tiles / 96px. A run counts only if
  // it holds the SAME y (for a horizontal) for its whole length — angular
  // variance under 2° over 96px is under ~3.4px of drift, so we allow 3px of
  // wander before calling a run broken. Anything that survives that is flat.
  const LIMIT = 96, WANDER = 3;
  const runs = [];
  const scanRuns = (edge, horizontal) => {
    const outer = horizontal ? H : W, inner = horizontal ? W : H;
    for (let a = 1; a < outer - 1; a++) {
      let len = 0, start = 0;
      for (let b = 1; b < inner; b++) {
        // a run may sit on a, a-1 or a+1 and still be "straight enough"
        let hit = 0;
        for (let o = -WANDER; o <= WANDER && !hit; o++) {
          const aa = a + o;
          if (aa < 1 || aa >= outer - 1) continue;
          const i = horizontal ? (aa * W + b) : (b * W + aa);
          if (edge[i]) hit = 1;
        }
        if (hit) { if (!len) start = b; len++; }
        else {
          if (len > LIMIT) runs.push({ horizontal, a, start, len });
          len = 0;
        }
      }
      if (len > LIMIT) runs.push({ horizontal, a, start, len });
    }
  };
  scanRuns(hEdge, true);
  scanRuns(vEdge, false);
  // collapse runs that are the same edge found from adjacent rows
  const merged = [];
  for (const r of runs.sort((p, q) => q.len - p.len)) {
    if (!merged.some(m => m.horizontal === r.horizontal &&
        Math.abs(m.a - r.a) < 6 && Math.abs(m.start - r.start) < 40)) merged.push(r);
  }

  // --- (f) CORNER DETECTOR --------------------------------------------------
  // §10.4: a surviving 90° corner is a horizontal edge run and a vertical edge
  // run meeting within a few px, with both arms long enough to read as a corner
  // rather than as texture.
  const ARM = 24;
  const corners = [];
  for (const h of merged.filter(r => r.horizontal)) {
    for (const v of merged.filter(r => !r.horizontal)) {
      const hx0 = h.start, hx1 = h.start + h.len, hy = h.a;
      const vy0 = v.start, vy1 = v.start + v.len, vx = v.a;
      const meetsX = vx >= hx0 - 4 && vx <= hx1 + 4;
      const meetsY = hy >= vy0 - 4 && hy <= vy1 + 4;
      if (!meetsX || !meetsY) continue;
      // both arms must extend ARM px away from the meeting point
      const armH = Math.max(vx - hx0, hx1 - vx), armV = Math.max(hy - vy0, vy1 - hy);
      if (armH >= ARM && armV >= ARM) corners.push({ x: vx, y: hy });
    }
  }
  const uniqCorners = [];
  for (const c of corners) {
    if (!uniqCorners.some(u => Math.abs(u.x - c.x) < 12 && Math.abs(u.y - c.y) < 12)) uniqCorners.push(c);
  }

  // --- (h) SKIRT + LIP: the three-part edge, per §10.3 ---------------------
  // This is also what enforces §10.2 now. The first draft of this harness
  // failed any run over 96px, which the reference game itself would fail —
  // its ruins are cut masonry with long ledges and square stairs. What the
  // reference never ships is a BARE straight edge, so that is what is measured:
  // for each long horizontal run, does it carry a lit crest above it, and is
  // its underside broken?
  // ONLY WALKABLE TOPS. The detector cannot tell a platform's top from a
  // ceiling's underside by pixels alone, so it was demanding a lit crest from
  // ceilings, which can never have one — that was the whole of D3's residue.
  // The tile grid knows the difference, so the page hands it over in screen
  // space and the pixel pass uses it.
  const WT = this.walkTops || [];
  const isTop = (r) => WT.some(w => Math.abs(w.y - r.a) <= 8 &&
                                    w.x1 > r.start && w.x0 < r.start + r.len);
  // ...and whether the mass under it runs to the floor of the room
  const isGround = (r) => {
    const hits = WT.filter(w => Math.abs(w.y - r.a) <= 8 &&
                                w.x1 > r.start && w.x0 < r.start + r.len);
    return hits.length > 0 && hits.filter(w => w.ground).length >= hits.length * 0.6;
  };
  // A RUN IS AN EDGE ONLY WHERE THERE IS GROUND UNDER IT. D3's floor has a
  // three-tile hole in it with the depth door drawn down in the gap, and the
  // edge map cheerfully welded the floor left of the hole, the door's own lit
  // top, and the floor right of the hole into one 160px "flat run" — then
  // failed it for carrying no crest, because a third of its length was a door.
  // Two short real edges and a prop between them are not one long edge, and no
  // amount of drawing on the floor could have satisfied that measurement.
  // The tile grid knows exactly where ground is, so every run is clipped to it
  // and each surviving piece is judged on its own length.
  const clipToGround = (r) => {
    if (!WT.length) return isTop(r) ? [r] : [];
    const hits = WT.filter(w => Math.abs(w.y - r.a) <= 8 &&
                                w.x1 > r.start && w.x0 < r.start + r.len)
                   .sort((p, q) => p.x0 - q.x0);
    const out = [];
    let cur = null;
    for (const w of hits) {
      const a = Math.max(w.x0, r.start), b = Math.min(w.x1, r.start + r.len);
      if (b <= a) continue;
      if (cur && a - cur.b <= 2) cur.b = Math.max(cur.b, b);
      else { if (cur) out.push(cur); cur = { a, b }; }
    }
    if (cur) out.push(cur);
    return out.map(s => ({ horizontal: true, a: r.a, start: s.a, len: s.b - s.a }));
  };
  const tops = merged.filter(r => r.horizontal)
    .reduce((acc, r) => acc.concat(clipToGround(r)), [])
    .filter(r => r.len > 40)
    .sort((p, q) => q.len - p.len)
    .slice(0, 8);
  const edges = [];
  for (const t of tops) {
    const xs = [];
    for (let k = 0; k < 12; k++) xs.push(t.start + Math.floor(t.len * (k + 0.5) / 12));

    // LIP: a bright 2-4px crest sitting just above the edge line
    // A LIT LIP IS BRIGHTER THAN ITS OWN BODY, not brighter than the sky. The
    // first version compared the crest to the pixels ABOVE it — the background
    // — which fails for D3's white ice floor under a pale ceiling, where the
    // crest is legitimately darker than what is behind it. What makes an edge
    // read as lit is the step down into the material it caps.
    let lipHits = 0;
    for (const x of xs) {
      if (x < 2 || x >= W - 2) continue;
      const crest = (lum(at(x, Math.max(1, t.a))) + lum(at(x, Math.min(H - 1, t.a + 1)))) / 2;
      const body = (lum(at(x, Math.min(H - 1, t.a + 5))) + lum(at(x, Math.min(H - 1, t.a + 7)))) / 2;
      if (crest - body > 6) lipHits++;
    }
    const lip = lipHits >= xs.length * 0.5;

    // SKIRT: how irregular is the bottom of this mass?
    const rawBottoms = xs.map(x => {
      if (x < 1 || x >= W - 1) return H;
      let y = t.a + 2;
      const base = lum(at(x, t.a + 2));
      while (y < H - 2 && Math.abs(lum(at(x, y)) - base) < 26) y++;
      return y;
    });
    // grounded is decided on the RAW bottoms: the filter below drops exactly
    // the columns that run off the frame, which are the ones that prove it.
    // the grid's answer wins when we have it; the pixel heuristic is the
    // fallback for a frame where the span handoff could not be built
    const grounded = WT.length ? isGround(t)
      : rawBottoms.filter(y => y >= H - 6).length >= rawBottoms.length * 0.6;
    const bottoms = rawBottoms.filter(y => y < H - 3);
    // A mass that runs to the bottom of the frame HAS no underside. D3's floor
    // is the last two tile rows of a 17-row room, so there is nowhere for a
    // skirt to hang, and demanding one there is not a standard — it is a check
    // that cannot be satisfied. Those edges owe a lit lip and nothing else.
    let skirt = grounded, varr = 0;
    if (!grounded && bottoms.length >= 6) {
      const mean = bottoms.reduce((a, b) => a + b, 0) / bottoms.length;
      varr = Math.sqrt(bottoms.reduce((a, b) => a + (b - mean) ** 2, 0) / bottoms.length);
      skirt = varr >= 4;      // §10.3 wants 8-24px of irregular under-hang
    } else {
      // fewer than six columns ever found a bottom: the mass runs off the
      // frame — it is the GROUND. Ground has no underside to break; §10.3's
      // skirt is the law for platforms that hang. The lip requirement still
      // binds it, and the corner rule still owns its ends.
      skirt = true;
    }
    edges.push({ len: t.len, y: t.a, lip, skirt, grounded, varr: +varr.toFixed(1) });
  }
  const bare = edges.filter(e => e.len > 96 && !(e.lip && e.skirt));
  // WHICH edge, and WHICH of the two it owes. A count tells you the frame
  // fails; it does not tell you whether to go and fix a crest or a hang, and
  // the difference is two different passes in two different places. Every
  // failure this harness reports should name the thing to go and look at.
  const bareWhy = bare.map(e => e.len + 'px@y' + e.y +
    (e.lip ? '' : ' NO-LIP') + (e.skirt ? '' : ' NO-SKIRT') +
    (e.grounded ? ' (grounded)' : '') + ' var' + e.varr);

  // --- (g) TILING REPETITION via patch autocorrelation ----------------------
  // §10.7: no visible repeat within one screen width. Take a patch from the
  // terrain band and slide it across the same row; a near-exact match at a
  // regular offset is a tile repeating.
  // Pick the band with the most texture rather than a fixed one. A fixed band
  // landed on flat sky in every room sampled, which made the check vacuous —
  // it passed because there was nothing there, not because nothing repeated.
  const PW = 32;
  let bandY = Math.floor(H * 0.72), bandSd = -1;
  for (let by = Math.floor(H * 0.30); by < H - 30; by += 12) {
    const row = [];
    for (let x = 40; x < W - 40; x += 3) row.push(lum(at(x, by)));
    const m = row.reduce((a, b) => a + b, 0) / row.length;
    const sd = Math.sqrt(row.reduce((a, b) => a + (b - m) ** 2, 0) / row.length);
    if (sd > bandSd) { bandSd = sd; bandY = by; }
  }
  let bestRepeat = { score: 1e9, dx: 0 };
  const patchAt = (x) => {
    const p = [];
    for (let y = bandY; y < bandY + 24; y += 2)
      for (let x2 = x; x2 < x + PW; x2 += 2) p.push(lum(at(x2, y)));
    return p;
  };
  const base = patchAt(40);
  // A FLAT REGION MATCHES ITSELF AT EVERY OFFSET. B4 and C3 reported a 32px
  // "repeat" at Δ0.2 and would not move across a tile-variation pass, a decal
  // pass and a background mottle — because the sampled band is near-uniform
  // there, and a uniform patch scores a perfect match against every shift of
  // itself. Emptiness is not repetition; a band with no texture has nothing to
  // repeat, and calling that a tiling failure is the third time in this file a
  // metric has been meaningless on degenerate input.
  const bMean = base.reduce((a, b) => a + b, 0) / base.length;
  const bSd = Math.sqrt(base.reduce((a, b) => a + (b - bMean) ** 2, 0) / base.length);
  for (let dx = PW; dx < W - PW - 40; dx += 4) {
    const q = patchAt(40 + dx);
    let s = 0;
    for (let k = 0; k < base.length; k++) s += Math.abs(base[k] - q[k]);
    s /= base.length;
    if (s < bestRepeat.score) bestRepeat = { score: s, dx };
  }

  // --- (a) and (c) VALUE BANDS + CHROMA ------------------------------------
  const band = (y0, y1) => {
    let l = 0, c = 0, n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = 0; x < W; x += 2) {
      const i = at(x, y); l += lum(i); c += chroma(i); n++;
    }
    return { lum: l / n, chroma: c / n };
  };
  const far = band(0, Math.floor(H * 0.34));
  const mid = band(Math.floor(H * 0.34), Math.floor(H * 0.68));
  const near = band(Math.floor(H * 0.68), H);

  return {
    runs: merged.slice(0, 8).map(r => ({ dir: r.horizontal ? 'H' : 'V', len: r.len, a: r.a })),
    longest: merged.length ? merged[0].len : 0,
    corners: uniqCorners.length,
    tops: tops.length,
    edges, bare: bare.length, bareWhy,
    repeat: bestRepeat, bSd: +bSd.toFixed(1),
    far, mid, near,
  };
};

(async () => {
  console.log('── grammar — ART_BIBLE §9/§10: the frame is the unit, not the asset');

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const results = [];
  for (const room of ROOMS) {
    await page.evaluate((room) => {
      const sv = newSave(1);
      sv.time = 99; sv.flags.tut = 1;
      sv.skills = ['dash', 'wall', 'glide', 'pulse'];
      sv.roomId = room;
      G.save = sv;
      startGame(sv);
      loadRoom(room);
      // ...AND THE FRAME MUST BE THE ART, NOT THE VIEWER'S DIAL. The screen
      // brightness lift is a preference: a screen composite that scales every
      // value in the frame by (1 - g) and offsets it by g. At the default it
      // compresses all contrast by 18%, which walks straight into the absolute
      // deltas this file measures in — §10.7's tile-repeat check reported
      // "C3 repeats at 32px (delta 2.4)" purely because 2.9 had been squeezed
      // to 2.4. The terrain had not changed. Whether a deck repeats is a fact
      // about the deck, so it is measured with the dial at zero.
      if (typeof BRIGHT_SET !== 'undefined') BRIGHT_SET = 0;
      // THE FRAME MUST BE THE WORLD, NOT THE UI. The first version of this
      // harness sampled whatever was on the canvas, and entering a room fires
      // an evolution dialog and a tutorial toast — so it measured the SPEECH
      // PANEL and reported its rectangle as terrain. Six failures, all false,
      // identical in every room because it was the same panel every time.
      // Clearing it once is not enough — entering a room re-opens it on the
      // next tick, so the wait puts it straight back. The dialog is SEALED
      // SHUT for the duration of the measurement instead.
      Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
      G.toasts = [];
      // G.state is set independently of the dialog object, so sealing one and
      // not the other leaves the loop drawing the overlay path with no dialog
      // in it. Both are pinned for the duration of the measurement.
      Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
      G.planeProbe = {};   // ask the engine to measure the background alone
      // AND THE CLOCK STOPS. This harness measures the assembled frame, which
      // is right — but a frame containing a walking guardian is a different
      // frame every run, and the §10.2 count duly breathed between 0 and 3
      // bare edges on identical code. GLACIERE crosses the very band the floor
      // crest is measured in; when its body or contact shadow lies over a
      // stretch of ground, that stretch has no readable crest, and the verdict
      // became a coin flip about where an animation happened to be.
      //
      // Pinning performance.now freezes every clock-driven pose at one instant
      // without touching a single pixel of the terrain being measured: same
      // frame, same law, reproducible answer. A regression test that cannot be
      // repeated is not a test, it is a rumour.
      const _t0 = performance.now();
      performance.now = () => _t0;
      // ...and the CAST LEAVES THE SHOT, for the same reason the speech panel
      // does. Freezing the clock was not enough: a guardian's POSITION depends
      // on how long the room took to load, so GLACIERE stood somewhere new
      // every run and the stretch of floor it covered had no measurable crest.
      // This harness measures TERRAIN; a body standing on the ground is not
      // terrain, and letting one occlude the surface under test is the same
      // error as measuring the dialog box and calling it a ledge.
      G.enemies = [];
      G.boss = null;
      G.parts = [];
    }, room);
    await page.waitForTimeout(900);
    // and confirm it, rather than trusting that it took
    const st = await page.evaluate(() => ({ state: G.state, dialog: !!G.dialog, room: G.roomId }));
    if (st.state !== 'PLAY' || st.dialog) {
      console.log('  FAIL could not reach gameplay in ' + room + '  ' + JSON.stringify(st));
      fails.push('could not reach gameplay in ' + room);
      continue;
    }
    const probe = await page.evaluate(() => (G.planeProbe && G.planeProbe.bg) || null);
    const mid2 = await page.evaluate(() => (G.planeProbe && G.planeProbe.mid) || null);
    const r = await page.evaluate(function (src) {
      const cv = document.querySelector('canvas');
      const c = cv.getContext('2d');
      const img = c.getImageData(0, 0, cv.width, cv.height);
      const spans = [];
      try {
        const g = buildRoom(G.roomId), TW = G.roomDef.w, TH2 = G.roomDef.h;
        const sx = Math.round(camSX()), sy = Math.round(camSY());
        const sol = (tx, ty) => {
          if (tx < 0 || ty < 0 || tx >= TW || ty >= TH2) return false;
          const ch = g[ty][tx]; return ch === '#' || ch === 'B';
        };
        for (let ty = 0; ty < TH2; ty++) for (let tx = 0; tx < TW; tx++) {
          if (!sol(tx, ty) || sol(tx, ty - 1)) continue;
          // GROUND vs LEDGE, decided by the grid rather than by pixels: a
          // column that is solid from here to the last row of the room has no
          // underside inside the frame at all, so §10.3's skirt cannot apply
          // to it. The luminance bottom-scan this replaces was fooled the
          // moment the floor got its own internal texture — roll, shade and
          // fractures all read as "the mass ends here", which turned real
          // ground into a hanging slab that owed a hang it could never grow.
          let ground = true;
          for (let k = ty; k < TH2; k++) if (!sol(tx, k)) { ground = false; break; }
          spans.push({ y: ty * TILE - sy, x0: tx * TILE - sx, x1: (tx + 1) * TILE - sx, ground });
        }
      } catch (e) { /* leave empty: the harness then measures every edge */ }
      // the terrain layer, cropped to exactly what the camera shows, so its
      // pixels line up 1:1 with the composited frame's coordinates
      let terrain = null;
      try {
        const tc = document.createElement('canvas');
        tc.width = cv.width; tc.height = cv.height;
        tc.getContext('2d').drawImage(tileCv, -Math.round(camSX()), -Math.round(camSY()));
        terrain = tc.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      } catch (e) { /* fall back to the composited frame */ }
      const ctx = { W: cv.width, H: cv.height, d: img.data, walkTops: spans, terrain };
      // eslint-disable-next-line no-new-func
      return (new Function('return ' + src))().call(ctx);
    }, DETECTORS.toString());
    results.push({ room, probe, mid2, ...r });
  }
  await browser.close();

  if (!results.length) {
    console.log('');
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }

  // ---- (e)+(h) undecorated straight runs -----------------------------------
  const totalBare = results.reduce((a, r) => a + r.bare, 0);
  const totalEdges = results.reduce((a, r) => a + r.edges.filter(e => e.len > 96).length, 0);
  check('§10.2/§10.3 every run over 96px carries a lit lip AND a broken skirt',
        totalBare === 0,
        totalBare + ' of ' + totalEdges + ' long edge(s) are bare  (' +
        results.map(r => r.room + ':' + r.bare).join(' ') + ')');
  for (const r of results) if (r.bareWhy && r.bareWhy.length)
    console.log('       ' + r.room + ' bare: ' + r.bareWhy.join(' | '));
  const worstRun = results.reduce((a, b) => (b.longest > a.longest ? b : a));
  console.log('       longest run ' + worstRun.longest + 'px in ' + worstRun.room +
              ' — length alone is not a failure, see ART_BIBLE §10.2');

  // ---- (f) corners ---------------------------------------------------------
  const totalCorners = results.reduce((a, r) => a + r.corners, 0);
  check('§10.4 no bare 90° corner survives',
        totalCorners === 0,
        totalCorners + ' corner(s)  (' + results.map(r => r.room + ':' + r.corners).join(' ') + ')');

  // ---- (g) tiling ----------------------------------------------------------
  // textured AND self-similar is a repeat; flat is just flat
  const rep = results.filter(r => r.repeat.score < 3 && r.bSd > 4);
  check('§10.7 no visible tile repeat within one screen width',
        !rep.length,
        rep.length ? rep.map(r => r.room + ' repeats at ' + r.repeat.dx + 'px (Δ' +
          r.repeat.score.toFixed(1) + ')').join('; ') : results.map(r => r.room + ' Δ' +
          r.repeat.score.toFixed(1) + '/sd' + r.bSd).join('  '));

  // ---- (a) THREE-PLANE VALUE LAW, measured on the real planes --------------
  const noProbe = results.filter(r => !r.probe);
  if (noProbe.length) {
    check('the plane probe reported', false, 'no background sample in ' +
          noProbe.map(r => r.room).join(', '));
  } else {
    // §9.1: the background sits at 10-25% luminance. The full frame, which is
    // the background plus terrain plus cast, must sit clearly above it.
    const bgHot = results.filter(r => r.probe.lum > 25);
    check('§9.1 the background plane sits at or under 25% luminance',
          !bgHot.length,
          results.map(r => r.room + ' ' + r.probe.lum.toFixed(0)).join('  '));

    const mids = results.filter(r => r.mid2);
    const thin = mids.filter(r => (r.mid2.lum - r.probe.lum) < 10);
    check('§9.1 the playable plane stands clear of the background',
          mids.length === results.length && !thin.length,
          mids.map(r => r.room + ' terrain ' + r.mid2.lum.toFixed(0) +
                   ' vs bg ' + r.probe.lum.toFixed(0)).join('  '));

    // §9.4: the background is the quiet one. This is the check that was
    // backwards before the background pass existed.
    const loud = results.filter(r => r.probe.sat > 12);
    check('§9.4 the background plane is desaturated (absolute chroma ≤ 12)',
          !loud.length,
          results.map(r => r.room + ' sat ' + r.probe.sat.toFixed(0)).join('  '));
  }

  check('no page errors while sampling the rooms', !errs.length, errs[0] || '');

  console.log('');
  if (fails.length) {
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }
  console.log('OK — the assembled frame obeys the grammar');
})();
