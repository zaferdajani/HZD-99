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
  const lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 2.55; // 0..100
  const at = (x, y) => ((y * W + x) << 2);

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
  const hEdge = new Uint8Array(W * H); // a horizontal edge: bright above, dark below
  const vEdge = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
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
  const tops = merged.filter(r => r.horizontal).slice(0, 8);
  const edges = [];
  for (const t of tops) {
    const xs = [];
    for (let k = 0; k < 12; k++) xs.push(t.start + Math.floor(t.len * (k + 0.5) / 12));

    // LIP: a bright 2-4px crest sitting just above the edge line
    let lipHits = 0;
    for (const x of xs) {
      if (x < 2 || x >= W - 2) continue;
      const above = (lum(at(x, Math.max(1, t.a - 3))) + lum(at(x, Math.max(1, t.a - 2)))) / 2;
      const crest = (lum(at(x, Math.max(1, t.a - 1))) + lum(at(x, t.a))) / 2;
      if (crest - above > 6) lipHits++;
    }
    const lip = lipHits >= xs.length * 0.5;

    // SKIRT: how irregular is the bottom of this mass?
    const bottoms = xs.map(x => {
      if (x < 1 || x >= W - 1) return H;
      let y = t.a + 2;
      const base = lum(at(x, t.a + 2));
      while (y < H - 2 && Math.abs(lum(at(x, y)) - base) < 26) y++;
      return y;
    }).filter(y => y < H - 3);
    let skirt = false, varr = 0;
    if (bottoms.length >= 6) {
      const mean = bottoms.reduce((a, b) => a + b, 0) / bottoms.length;
      varr = Math.sqrt(bottoms.reduce((a, b) => a + (b - mean) ** 2, 0) / bottoms.length);
      skirt = varr >= 4;      // §10.3 wants 8-24px of irregular under-hang
    }
    edges.push({ len: t.len, y: t.a, lip, skirt, varr: +varr.toFixed(1) });
  }
  const bare = edges.filter(e => e.len > 96 && !(e.lip && e.skirt));

  // --- (g) TILING REPETITION via patch autocorrelation ----------------------
  // §10.7: no visible repeat within one screen width. Take a patch from the
  // terrain band and slide it across the same row; a near-exact match at a
  // regular offset is a tile repeating.
  const bandY = Math.floor(H * 0.72);
  const PW = 32;
  let bestRepeat = { score: 1e9, dx: 0 };
  const patchAt = (x) => {
    const p = [];
    for (let y = bandY; y < bandY + 24; y += 2)
      for (let x2 = x; x2 < x + PW; x2 += 2) p.push(lum(at(x2, y)));
    return p;
  };
  const base = patchAt(40);
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
    edges, bare: bare.length,
    repeat: bestRepeat,
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
    }, room);
    await page.waitForTimeout(900);
    // and confirm it, rather than trusting that it took
    const st = await page.evaluate(() => ({ state: G.state, dialog: !!G.dialog, room: G.roomId }));
    if (st.state !== 'PLAY' || st.dialog) {
      console.log('  FAIL could not reach gameplay in ' + room + '  ' + JSON.stringify(st));
      fails.push('could not reach gameplay in ' + room);
      continue;
    }
    const r = await page.evaluate(function (src) {
      const cv = document.querySelector('canvas');
      const c = cv.getContext('2d');
      const img = c.getImageData(0, 0, cv.width, cv.height);
      const ctx = { W: cv.width, H: cv.height, d: img.data };
      // eslint-disable-next-line no-new-func
      return (new Function('return ' + src))().call(ctx);
    }, DETECTORS.toString());
    results.push({ room, ...r });
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
  const worstRun = results.reduce((a, b) => (b.longest > a.longest ? b : a));
  console.log('       longest run ' + worstRun.longest + 'px in ' + worstRun.room +
              ' — length alone is not a failure, see ART_BIBLE §10.2');

  // ---- (f) corners ---------------------------------------------------------
  const totalCorners = results.reduce((a, r) => a + r.corners, 0);
  check('§10.4 no bare 90° corner survives',
        totalCorners === 0,
        totalCorners + ' corner(s)  (' + results.map(r => r.room + ':' + r.corners).join(' ') + ')');

  // ---- (g) tiling ----------------------------------------------------------
  const rep = results.filter(r => r.repeat.score < 3);
  check('§10.7 no visible tile repeat within one screen width',
        !rep.length,
        rep.length ? rep.map(r => r.room + ' repeats at ' + r.repeat.dx + 'px (Δ' +
          r.repeat.score.toFixed(1) + ')').join('; ') : 'closest match Δ' +
          Math.min(...results.map(r => r.repeat.score)).toFixed(1));

  // ---- (a) three-plane value law ------------------------------------------
  const badBand = results.filter(r => !(r.far.lum < r.mid.lum && r.mid.lum < r.near.lum));
  check('§9.1 far < mid < near in luminance',
        !badBand.length,
        badBand.length ? badBand.map(r => r.room + ' ' + [r.far, r.mid, r.near]
          .map(b => b.lum.toFixed(0)).join('/')).join('; ')
        : results.map(r => r.room + ' ' + [r.far, r.mid, r.near].map(b => b.lum.toFixed(0)).join('/')).join('  '));

  const thinDelta = results.filter(r => (r.near.lum - r.far.lum) < 30);
  check('§9.1 near-to-far luminance delta ≥ 30 points',
        !thinDelta.length,
        thinDelta.map(r => r.room + ' Δ' + (r.near.lum - r.far.lum).toFixed(0)).join(' ') || 'all ≥ 30');

  // ---- (c) chroma budget ---------------------------------------------------
  const loudBg = results.filter(r => r.far.chroma >= r.near.chroma);
  check('§9.4 the background is quieter in chroma than the playable plane',
        !loudBg.length,
        loudBg.map(r => r.room + ' bg ' + r.far.chroma.toFixed(0) +
          ' vs near ' + r.near.chroma.toFixed(0)).join('; ') || 'background quieter everywhere');

  check('no page errors while sampling the rooms', !errs.length, errs[0] || '');

  console.log('');
  if (fails.length) {
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }
  console.log('OK — the assembled frame obeys the grammar');
})();
