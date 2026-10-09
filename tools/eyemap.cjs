// THE EYE MAP: where every hostile body's eyes are, in every cell of its art.
//
// The infection's eye smoke (js/infection-eyes.js) must leave the EYE — not
// the body's centre, not a guessed forehead — in every frame of every pose.
// For procedural bodies the renderer knows where it drew the eye. For authored
// art the eye is a few lit pixels somewhere in a plate, a strip cell or an
// atlas cell, and the only honest way to know where is to look. So this tool
// looks: for each image named in EYE_SPECS it keys the cell, finds the small
// compact blobs that glow in the eye's colour, and keeps the one or two that
// sit where an eye can sit (nearest the snout of a body in profile, highest on
// a body seen front-on). The answer is written to assets/eyes.json as
// normalised cell coordinates, and build.cjs compiles it into the pages.
//
// What it cannot find it says so, and an explicit `at` in the spec wins over
// detection — a guessed point is never written silently.
//
// It runs INSIDE the game page (serve the repo on :8220 first, as the harnesses
// do), so keys, cell counts and figure rectangles come from the game's own
// tables — MEDIA_SRC, EAGLE_P, GLC_P, DRG_P, ATLAS — and cannot drift from them.
//
//   node tools/eyemap.cjs            regenerate assets/eyes.json
//   node tools/eyemap.cjs --sheet o.png   also write a contact sheet with every
//                                    detected eye marked, to look at
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// the specs: which art, which colour of eye, and where an eye can be
const ROOT = path.join(__dirname, '..');
const SPECS = require('./eyespecs.cjs');

(async () => {
  const sheetOut = process.argv.indexOf('--sheet') > 0 ? process.argv[process.argv.indexOf('--sheet') + 1] : null;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto((process.env.GAME_ORIGIN || 'http://127.0.0.1:8220') + '/index.html');
  await p.waitForFunction(() => typeof MEDIA_SRC !== 'undefined' && typeof EAGLE_P !== 'undefined', null, { timeout: 30000 });
  const out = {}, report = [], shots = [];
  // a `rects` spec names a frame table (e.g. PRZ_FR): one entry per distinct
  // rectangle, keyed '<img>@<sx>,<sy>' — the form the renderer looks up
  const specs = [];
  // EYEMAP_ONLY=<regex> limits the run (and then nothing is written), for
  // looking at one set again without regenerating the whole map
  const ONLY = process.env.EYEMAP_ONLY ? new RegExp(process.env.EYEMAP_ONLY) : null;
  for (const S of SPECS) {
    if (ONLY && !ONLY.test(S.key)) continue;
    if (!S.rects) { specs.push(S); continue; }
    const rects = await p.evaluate((t) => {
      const T = Function('return ' + t)(), seen = {}, out = [];
      for (const k in T) for (const r of T[k]) { const id = r[0] + ',' + r[1]; if (!seen[id]) { seen[id] = 1; out.push(r.slice(0, 4)); } }
      return out;
    }, S.rects);
    for (const r of rects) {
      const id = r[0] + ',' + r[1];
      const at = S.atRect ? { 0: S.atRect[id] || [] } : S.at;
      specs.push(Object.assign({}, S, { rects: null, key: S.key + '@' + id, img: S.key, table: 'rect', rect: r, at }));
    }
  }
  for (const S of specs) {
    const r = await p.evaluate(async ({ S, wantSheet }) => {
      const url = MEDIA_SRC.images[S.img || S.key];
      if (!url) return { err: 'no media key ' + (S.img || S.key) };
      const im = new Image(); im.src = url;
      try { await im.decode(); } catch (e) { return { err: 'cannot load ' + url }; }
      // a figure inside a parts atlas: crop to its rectangle first
      let src = im, W0 = im.width, H0 = im.height;
      if (S.table) {
        // top-level consts are not window properties; Function reaches them
        const R = S.rect || Function('return ' + S.table)()[S.fig];
        if (!R) return { err: 'no rect ' + S.table + '.' + S.fig };
        const cv0 = document.createElement('canvas'); cv0.width = R[2]; cv0.height = R[3];
        cv0.getContext('2d').drawImage(im, R[0], R[1], R[2], R[3], 0, 0, R[2], R[3]);
        src = cv0; W0 = R[2]; H0 = R[3];
      }
      // a strip says its cell count in its name (wolfWalk8); anything else is one picture
      const named = /(\d+)$/.exec(S.key);
      const cols = S.cols || S.cells || (!S.table && named ? +named[1] : 1), rows = S.rows || 1;
      const cw = W0 / cols, ch = H0 / rows;
      const c = document.createElement('canvas'); c.width = W0; c.height = H0;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0);
      const cells = S.only || (S.onlyRows ? S.onlyRows.flatMap(r0 => Array.from({ length: cols }, (_, k) => r0 * cols + k)) : Array.from({ length: cols * rows }, (_, i) => i));
      const res = [], miss = [];
      // what counts as an eye's glow, by colour family
      const tests = {
        red:    (r, g, b) => r >= 170 && r - g >= 85 && r - b >= 70,
        orange: (r, g, b) => r >= 200 && g >= 70 && g <= 200 && b <= 120 && r - b >= 110,
        amber:  (r, g, b) => r >= 200 && g >= 120 && b <= 120 && r - b >= 100,
        purple: (r, g, b) => b >= 170 && r >= 120 && g <= 120,
        cyan:   (r, g, b) => b >= 170 && g >= 170 && r <= 150,
        white:  (r, g, b) => r >= 235 && g >= 235 && b >= 235,
      };
      const col = (S.col || 'red').split('|').map(n => tests[n]);
      for (const ci of cells) {
        const cx0 = Math.floor((ci % cols) * cw), cy0 = Math.floor(Math.floor(ci / cols) * ch);
        const W = Math.floor(cw), H = Math.floor(ch);
        if (S.at && S.at[ci]) { res[ci] = S.at[ci]; continue; }
        const d = x.getImageData(cx0, cy0, W, H).data;
        // silhouette extents (for "front" = the snout end)
        let minX = W, maxX = -1, minY = H, maxY = -1;
        const solid = new Uint8Array(W * H), glow = new Uint8Array(W * H);
        for (let i = 0, q = 0; q < W * H; i += 4, q++) {
          if (d[i + 3] < 100) continue;
          solid[q] = 1;
          const px = q % W, py = (q / W) | 0;
          if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py;
          if (col.some(t => t(d[i], d[i + 1], d[i + 2]))) glow[q] = 1;
        }
        if (maxX < 0) { res[ci] = []; miss.push(ci); continue; }
        // connected glowing blobs
        const lab = new Int32Array(W * H), blobs = [];
        const st = new Int32Array(W * H);
        for (let q0 = 0; q0 < W * H; q0++) {
          if (!glow[q0] || lab[q0]) continue;
          let sp = 0, n = 0, sx = 0, sy = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0;
          st[sp++] = q0; lab[q0] = blobs.length + 1;
          while (sp) {
            const q = st[--sp], px = q % W, py = (q / W) | 0;
            n++; sx += px; sy += py;
            if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py;
            for (const nq of [px > 0 ? q - 1 : -1, px < W - 1 ? q + 1 : -1, py > 0 ? q - W : -1, py < H - 1 ? q + W : -1, (px > 0 && py > 0) ? q - W - 1 : -1, (px < W - 1 && py > 0) ? q - W + 1 : -1])
              if (nq >= 0 && glow[nq] && !lab[nq]) { lab[nq] = blobs.length + 1; st[sp++] = nq; }
          }
          const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
          blobs.push({ n, x: sx / n, y: sy / n, bw, bh });
        }
        const bodyW = maxX - minX + 1, bodyH = maxY - minY + 1;
        // how LIGHT the surround of a blob is: an eye set in a pale mask (the
        // prism cat, TALONHOST's skull, the new wolf) glows inside white, where
        // a crystal or a seam glows inside dark armour
        const ringL = (o) => {
          const R = Math.max(3, Math.sqrt(o.n) * 1.6), cx = o.x, cy = o.y;
          let s = 0, n = 0;
          for (let a = 0; a < 16; a++) {
            const px = Math.round(cx + Math.cos(a / 16 * 6.283) * R), py = Math.round(cy + Math.sin(a / 16 * 6.283) * R);
            if (px < 0 || py < 0 || px >= W || py >= H) continue;
            const i = (py * W + px) * 4; if (d[i + 3] < 100) continue;
            s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++;
          }
          return n ? s / n : 0;
        };
        // the hood: an eye that does not glow (the sage's walk), placed by the
        // head — the silhouette's top centre, dropped by a measured fraction
        if (S.rule === 'hood') {
          let sx = 0, sn = 0;
          const band = minY + Math.max(2, Math.round(bodyH * 0.06));
          for (let py = minY; py <= band; py++) for (let px = minX; px <= maxX; px++) if (solid[py * W + px]) { sx += px; sn++; }
          const hx = sn ? sx / sn : (minX + maxX) / 2, hy = minY + bodyH * (S.hoodY || 0.08);
          res[ci] = [+(hx / W).toFixed(4), +(hy / H).toFixed(4)];
          continue;
        }
        const minA = S.minA != null ? S.minA : 2, maxA = (S.maxFrac || 0.012) * bodyW * bodyH;
        let cand = blobs.filter(o => o.n >= minA && o.n <= maxA && Math.max(o.bw, o.bh) / Math.min(o.bw, o.bh) <= (S.aspect || 3.2));
        // restrict to the region an eye can be in (fractions of the silhouette box)
        const R = (S.colRegion && S.colRegion[ci % cols]) || S.region || null;
        if (R) cand = cand.filter(o => {
          const fx = (o.x - minX) / bodyW, fy = (o.y - minY) / bodyH;
          return fx >= R[0] && fx <= R[2] && fy >= R[1] && fy <= R[3];
        });
        if (S.mask === 'light') {
          const lit = cand.filter(o => ringL(o) >= (S.maskL || 150));
          if (lit.length) cand = lit;
        }
        let pick = [];
        if (cand.length) {
          const rule = (S.colRule && S.colRule[ci % cols]) || S.rule || 'front';
          if (rule === 'none') { pick = []; }
          else if (rule === 'front' || rule === 'frontR') {
            // profile facing LEFT: the eye is the compact glow nearest the snout
            // tip — the leftmost silhouette pixel, at its own height
            const tipX = rule === 'frontR' ? maxX : minX;
            let tipY = 0, tc = 0;
            for (let py = minY; py <= maxY; py++) if (solid[py * W + tipX]) { tipY += py; tc++; }
            tipY = tc ? tipY / tc : minY;
            cand.sort((a, b) => Math.hypot(a.x - tipX, (a.y - tipY) * 0.7) - Math.hypot(b.x - tipX, (b.y - tipY) * 0.7));
            pick = [cand[0]];
            const n2 = S.eyes || 1;
            if (n2 > 1) for (const o of cand.slice(1)) if (pick.length < n2 && Math.hypot(o.x - cand[0].x, o.y - cand[0].y) < bodyW * 0.12) pick.push(o);
          } else if (rule === 'core') {
            cand.sort((a, b) => b.n - a.n);
            pick = [cand[0]];
          } else {
            // front-on: the highest compact glow (and its partner at its height)
            cand.sort((a, b) => a.y - b.y);
            pick = [cand[0]];
            const n2 = S.eyes || 2;
            for (const o of cand.slice(1)) if (pick.length < n2 && Math.abs(o.y - cand[0].y) < bodyH * 0.06 && Math.abs(o.x - cand[0].x) < bodyW * 0.35) pick.push(o);
          }
        }
        if (!pick.length) { res[ci] = []; if (((S.colRule && S.colRule[ci % cols]) || S.rule) !== 'none') miss.push(ci); continue; }
        const pts = [];
        for (const o of pick) pts.push(+(o.x / W).toFixed(4), +(o.y / H).toFixed(4));
        res[ci] = pts;
      }
      let sheet = null;
      if (wantSheet) {
        const sc = Math.min(1, 140 / ch);
        const n = cells.length, per = Math.min(n, 8);
        const sw = Math.ceil(cw * sc), sh = Math.ceil(ch * sc);
        const cv = document.createElement('canvas'); cv.width = sw * per; cv.height = sh * Math.ceil(n / per) + 14;
        const y = cv.getContext('2d'); y.fillStyle = '#39424d'; y.fillRect(0, 0, cv.width, cv.height);
        y.fillStyle = '#fff'; y.font = '11px sans-serif'; y.fillText(S.key + (miss.length ? '  MISSING ' + miss.join(',') : ''), 3, 11);
        cells.forEach((ci, k) => {
          const ox = (k % per) * sw, oy = 14 + Math.floor(k / per) * sh;
          y.drawImage(src, (ci % cols) * cw, Math.floor(ci / cols) * ch, cw, ch, ox, oy, sw, sh);
          const pts = res[ci] || [];
          for (let i = 0; i + 1 < pts.length; i += 2) {
            y.strokeStyle = '#00ffd0'; y.lineWidth = 1.5;
            y.beginPath(); y.arc(ox + pts[i] * sw, oy + pts[i + 1] * sh, 5, 0, 7); y.stroke();
          }
        });
        sheet = cv.toDataURL('image/png');
      }
      return { cols, rows, res, miss, sheet };
    }, { S, wantSheet: !!sheetOut });
    if (r.err) { report.push('ERROR   ' + S.key + '  ' + r.err); continue; }
    const e = [];
    for (let i = 0; i < r.cols * r.rows; i++) e.push(r.res[i] || []);
    // FILL: a continuous strip's unplaced cells take the nearest placed cell's
    // point. Said in the report — never silent.
    if (S.fill) {
      const filled = [];
      for (let i = 0; i < e.length; i++) if (!e[i].length) {
        let best = null;
        for (let d = 1; d < e.length && !best; d++) for (const j of [i - d, i + d]) if (j >= 0 && j < e.length && (r.res[j] || []).length) { best = r.res[j]; break; }
        if (best) { e[i] = best.slice(); filled.push(i); }
      }
      if (filled.length) { r.miss = r.miss.filter(i => filled.indexOf(i) < 0); report.push('filled  ' + S.key + '  cells ' + filled.join(',') + ' from their neighbours'); }
    }
    out[S.key] = { c: r.cols, r: r.rows, e };
    report.push((r.miss.length ? 'PARTIAL ' : 'ok      ') + S.key + '  ' + r.cols + 'x' + r.rows
      + (r.miss.length ? '  no eye in cells ' + r.miss.join(',') : ''));
    if (r.sheet) shots.push(r.sheet);
  }
  if (!ONLY) fs.writeFileSync(path.join(ROOT, 'assets/eyes.json'), JSON.stringify(out) + '\n');
  console.log(report.join('\n'));
  if (sheetOut && shots.length) {
    const url = await p.evaluate(async (shots) => {
      const ims = [];
      for (const s of shots) { const i = new Image(); i.src = s; await i.decode(); ims.push(i); }
      const W = Math.max(...ims.map(i => i.width)), H = ims.reduce((a, i) => a + i.height + 4, 0);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.fillStyle = '#20262d'; x.fillRect(0, 0, W, H);
      let y = 0; for (const i of ims) { x.drawImage(i, 0, y); y += i.height + 4; }
      return c.toDataURL('image/png');
    }, shots);
    fs.writeFileSync(sheetOut, Buffer.from(url.split(',')[1], 'base64'));
    console.log('sheet -> ' + sheetOut);
  }
  await b.close();
})();
