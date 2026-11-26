// THE GROUND IS ONE BODY UNDER ONE SURFACE, AND THE GRASS GROWS OUT OF IT.
//
// The owner, 2026-11-26, playing W2 and the meadow on an iPhone: "the grass needs adjustment to
// cover the terrain without showing edges like you do right now. It still looks like patches of
// square-shaped grasses stuck together instead of blending it with the surrounding and the next
// patch, especially when it's up and down." (2026-11-25: "It shouldn't look like squares stuck
// together. It should be continuous without edges".)
//
// What he saw had two causes, and each is measured here ON THE FINISHED CANVAS, at a phone's size
// (844 x 390, two device pixels a point), not on the code's own numbers:
//
//   THE GROUND BODY. Under the rolling surface the baked tile layer was still the tile grid: the
//   square tile tops (a lit band at every tile line), the faces of every step, notches where the
//   corner pass bit them, and a fill that ran from the curve down to a STAIRCASE (the tile top +16)
//   in a tone of its own. So the hills read as stacked squares, and in a dip the backdrop showed
//   through a hole under the surface.
//   THE GRASS. Each tile grew its own grass, rooted on the curve only when the curve was within a
//   tile and a half of that tile's top — on a two-tile step it fell back to the tile line, a block of
//   grass sunk into the hill. And the card ended in a hard dense mat right on the lit crest.
//
// How it is measured. The frame is drawn five ways with everything else the same (she is out of it,
// nothing walks in the grass): the tile layer removed, the tile layer as a flat magenta silhouette
// (so its coverage of the screen is exact whatever the backdrop is), the surface curve alone as a
// magenta line (so the curve's screen position is read off the screen, not computed), and the
// silhouette again with the grass over it (so what the grass covers is exact too). Then, along the
// surface in W2 and the meadow (A1, A2, A3), in every column where the curve itself is smooth and no
// object stands on the ground (a palm's deck and trunk, a floor of teeth):
//
//   A  the STAIRCASE: the top of the drawn ground body never jumps between neighbouring columns by
//      more than 3 px, and never stands more than 4 px off the curve (a block above, a notch below)
//   B  the FLOATING BAND: no backdrop shows in the body for the first 24 px under the surface
//   C  the grass's lower boundary is not a hard edge: from the lowest row it covers at 80% it takes
//      5+ px (median) to thin to 20% — the old mat stopped in about 3
//   D  the grass sits on the drawn surface: the centre of what it covers stays within 14 px of the
//      curve and does not jump against it between neighbouring columns
//   D2 and in EVERY room that grows grass, no column of it on the curve's own tile is rooted more than
//      16 px under the surface (the old rule sank tiles of it beside a big step: A2, A6)
//   E  no page errors
//
// Measured on the code before the fix (2026-11-26): A failed (steps of up to 18 px, 432 columns off the
// curve), B failed (271 columns with backdrop in the body), C failed (3.2/2.7), D2 failed (A2, A6).
//
//   node tests/ground-seamless.cjs      (needs the repo served on :8220, or TEST_PORT)
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
// the views: a room and the tile column the camera is centred on
const FALL_MED = 5, FALL_P10 = 4, MID_DOWN = 14, MID_JUMP = 4;
const VIEWS = process.env.GS_VIEWS ? process.env.GS_VIEWS.split(',').map(v => { const [r, t] = v.split(':'); return [r, +t]; })
  : [['W2', 10], ['W2', 22], ['W2', 33], ['W2', 46], ['A1', 12], ['A2', 14], ['A2', 76], ['A3', 22], ['A3', 38]];
(async () => {
  console.log('── ground-seamless — one ground body under one surface, and grass that grows out of it');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const all = [];
  for (const [room, tx] of VIEWS) {
    const R = await page.evaluate(async ({ room, tx }) => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1 });
      startGame(sv); loadRoom(room); G.state = 'PLAY';
      const quiet = () => { G.enemies = []; G.boss = null; G.dialog = null; G.state = 'PLAY'; G.wake = G.cut = G.tut = G.trans = G.meet = null; G.panels = null; G.toasts = []; G.zoneToast = null; };
      quiet();
      const X = (tx + 0.5) * TILE, gc0 = groundColumnAt(X);
      const stand = () => { player.x = X - player.w / 2; player.y = (gc0 ? Math.min(gc0[0], gc0[1]) : 12 * TILE) - player.h; player.vx = player.vy = 0; };
      stand();
      for (let i = 0; i < 400; i++) { update(1 / 60); quiet(); stand(); draw(performance.now()); if (i % 10 === 0) await new Promise(r => setTimeout(r, 30)); if (i > 60 && !tileDirty && GRASS.ready && GRASS.room === room && rockBakeReady(G.roomDef.zone)) break; }
      await new Promise(r => setTimeout(r, 600));
      for (let i = 0; i < 20; i++) { update(1 / 60); quiet(); stand(); draw(performance.now()); }
      // she leaves the picture (the camera stays where it is: draw() does not move it)
      player.x = -99999; player.y = -99999;
      for (const q of GRASS.cols) { q.a = q.v = q.sq = 0; }      // ...and the grass she stood in stands up again (the frames below do not step its springs)
      const cv = document.querySelector('canvas'), x = cv.getContext('2d'), CW = cv.width, CH = cv.height;
      const grab = () => x.getImageData(0, 0, CW, CH).data;
      const real = tileCv, cur = surfaceCurve();
      const mk = () => { const q = document.createElement('canvas'); q.width = real.width; q.height = real.height; return q; };
      const empty = mk();
      const mag = mk(); { const m = mag.getContext('2d'); m.drawImage(real, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = '#ff00ff'; m.fillRect(0, 0, mag.width, mag.height); }
      const line = mk(); { const m = line.getContext('2d'); m.strokeStyle = '#ff00ff'; m.lineWidth = 2; m.beginPath(); let on = false;
        for (let i = 0; i < cur.N; i++) { const y = cur.y[i]; if (isNaN(y) || (on && Math.abs(y - cur.y[i - 1]) > TILE)) { on = false; if (isNaN(y)) continue; } if (!on) { m.moveTo(i * SURF_STEP, y); on = true; } else m.lineTo(i * SURF_STEP, y); } m.stroke(); }
      const frame = (cvT, probe) => { tileCv = cvT; G.fringeProbe = probe; GRASS.last = performance.now() / 1000; draw(performance.now()); const d = grab(); tileCv = real; G.fringeProbe = 0; return d; };
      // the grass holds still for the measurement: the same wind in both grass frames
      const t0 = GRASS.t;
      const B = frame(empty, 1), C = frame(mag, 1), L = frame(line, 1);
      GRASS.t = t0; const Gm = frame(mag, 0);
      tileCv = real; draw(performance.now());
      const s = (CW / 960) * (cam.zoom || 1);           // device px per world px
      const dif = (P, Q, i) => Math.abs(P[i] - Q[i]) + Math.abs(P[i + 1] - Q[i + 1]) + Math.abs(P[i + 2] - Q[i + 2]);
      const cov = (xx, yy) => yy >= 0 && yy < CH && dif(C, B, (yy * CW + xx) * 4) > 90;
      // the curve's screen y per column: the middle of the magenta line
      const cy = new Float32Array(CW).fill(NaN);
      for (let xx = 0; xx < CW; xx++) { let a = -1, b = -1; for (let yy = Math.round(CH * 0.25); yy < CH; yy++) { if (dif(L, B, (yy * CW + xx) * 4) > 120) { if (a < 0) a = yy; b = yy; } else if (a >= 0 && yy - b > 3) break; } if (a >= 0 && b - a < 8 * s) cy[xx] = (a + b) / 2; }
      // columns that count: the curve smooth across them (no cliff), clear of the screen's edges
      // (and not where the tile layer carries an OBJECT standing on the ground — a deck is a palm with
      // its trunk down to the floor, a floor of teeth is the teeth — nor under the HUD's edge marks)
      const wxOf = (xx) => camSX() + 480 * (1 - 1 / (cam.zoom || 1)) + xx / s;
      const obj = (xx) => { const t0 = Math.floor(wxOf(xx) / TILE); for (let t = t0 - 1; t <= t0 + 1; t++) { if (t < 0 || t >= G.grid[0].length) continue; for (let r = 0; r < G.grid.length; r++) { const ch = G.grid[r][t]; if (ch === '=' || ch === '^') return true; } } return false; };
      const smooth = new Uint8Array(CW);
      const M = Math.round(40 * s);
      for (let xx = M; xx < CW - M; xx++) { if (obj(xx)) continue; let ok = true; for (let k = -M; k <= M && ok; k += 1) { const a = cy[xx + k], b = cy[xx + k + 1]; if (isNaN(a) || isNaN(b) || Math.abs(a - b) > 1.6 * s) ok = false; } smooth[xx] = ok ? 1 : 0; }
      // A: the top of the drawn body, from well above the curve down
      const top = new Float32Array(CW).fill(NaN);
      for (let xx = 0; xx < CW; xx++) { if (!smooth[xx]) continue; const y0 = Math.max(0, Math.round(cy[xx] - 40 * s)), y1 = Math.min(CH - 1, Math.round(cy[xx] + 40 * s));
        for (let yy = y0; yy < y1; yy++) if (cov(xx, yy) && cov(xx, yy + 1) && cov(xx, yy + 2)) { top[xx] = yy; break; } }
      let jump = 0, jumpAt = -1, nJ = 0, off = 0, offAt = -1, nOff = 0, n = 0;
      for (let xx = 0; xx < CW - 1; xx++) {
        if (!smooth[xx] || !smooth[xx + 1] || isNaN(top[xx]) || isNaN(top[xx + 1])) continue; n++;
        const j = Math.abs(top[xx + 1] - top[xx]) / s; if (j > jump) { jump = j; jumpAt = xx; } if (j > 3) nJ++;
        const o = Math.abs(top[xx] - cy[xx]) / s; if (o > off) { off = o; offAt = xx; } if (o > 4) nOff++;
      }
      // B: backdrop inside the body, the first 24 px under the surface
      let holeCols = 0, holeMax = 0, holeAt = -1;
      for (let xx = 0; xx < CW; xx++) { if (!smooth[xx]) continue; let h = 0; for (let yy = Math.round(cy[xx] + 3 * s); yy < Math.min(CH, cy[xx] + 24 * s); yy++) if (!cov(xx, yy)) h++; h /= s; if (h >= 2) holeCols++; if (h > holeMax) { holeMax = h; holeAt = xx; } }
      // C, D: the grass, seen against the magenta silhouette (with it, against without it): what it
      // adds there is its coverage, whatever the crest or the backdrop under it would have done to
      // the comparison. Its lower boundary: from the lowest row it still covers at 80% of its fullest,
      // how many px it takes to thin to 20% — a mat that stops on a line does it in one or two.
      const fall = [], tipL = new Float32Array(CW).fill(NaN);   // (tipL: the grass's centre row)
      for (let xx = 0; xx < CW; xx++) {
        if (!smooth[xx]) continue;
        const y0 = Math.max(0, Math.round(cy[xx] - 40 * s)), y1 = Math.min(CH - 3, Math.round(cy[xx] + 40 * s));
        const prof = []; let pk = 0;
        for (let yy = y0; yy < y1; yy++) { let v = 0; for (let k = 0; k < 3; k++) v += dif(Gm, C, ((yy + k) * CW + xx) * 4); v /= 3; prof.push(v); if (v > pk) pk = v; }
        if (pk < 60) continue;
        let sw = 0, sm = 0; for (let k = 0; k < prof.length; k++) { sw += prof[k]; sm += prof[k] * k; }
        tipL[xx] = y0 + sm / sw;
        let lo = -1; for (let k = prof.length - 1; k >= 0; k--) if (prof[k] >= 0.8 * pk) { lo = k; break; }
        let hi = lo; while (hi < prof.length - 1 && prof[hi] > 0.2 * pk) hi++;
        fall.push((hi - lo) / s);
      }
      fall.sort((a, b) => a - b);
      const med = fall.length ? fall[fall.length >> 1] : 0, p10 = fall.length ? fall[Math.floor(fall.length * 0.1)] : 0;
      // where the grass sits against the curve: the centre of what it covers, as a median over 24
      // world px (a blade and the gap beside it are not a step; a block of grass rooted a tile lower
      // is a tile wide and survives it)
      const R3 = Math.round(12 * s), tipM = new Float32Array(CW).fill(NaN);
      for (let xx = R3; xx < CW - R3; xx++) { const v = []; for (let k = -R3; k <= R3; k++) if (!isNaN(tipL[xx + k])) v.push(tipL[xx + k]); if (v.length > R3) { v.sort((p, q) => p - q); tipM[xx] = v[v.length >> 1]; } }
      let gJump = 0, gJumpAt = -1, under = 99, underAt = -1;
      for (let xx = 0; xx < CW - 1; xx++) {
        if (isNaN(tipM[xx]) || !smooth[xx]) continue;
        const up = (tipM[xx] - cy[xx]) / s; if (up > under || under === 99) { under = up; underAt = xx; }
        if (isNaN(tipM[xx + 1]) || !smooth[xx + 1]) continue;
        const j = Math.abs((tipM[xx + 1] - cy[xx + 1]) - (tipM[xx] - cy[xx])) / s; if (j > gJump) { gJump = j; gJumpAt = xx; }
      }
      const wx = (xx) => Math.round(camSX() + 480 * (1 - 1 / (cam.zoom || 1)) + xx / s);
      return { room, tx, s: +s.toFixed(2), cols: n, jump: +jump.toFixed(1), jumpAtX: wx(jumpAt), stairCols: nJ, off: +off.toFixed(1), offAtX: wx(offAt), offCols: nOff,
        holeCols, holeMax: +holeMax.toFixed(1), holeAtX: wx(holeAt), grassCols: fall.length, fallMed: +med.toFixed(1), fallP10: +p10.toFixed(1), midJump: +gJump.toFixed(1), midJumpAtX: wx(gJumpAt), midDown: +under.toFixed(1), midDownAtX: wx(underAt) };
    }, { room, tx });
    all.push(R);
    console.log('     ' + JSON.stringify(R));
  }
  // D2: every room that grows grass, not only the views — no column of it rooted in the body under
  // the surface (the old "within a tile and a half" rule sank whole tiles of it beside a big step)
  const D2 = await page.evaluate(() => {
    const out = { rooms: 0, cols: 0, sunk: [] };
    for (const id of Object.keys(ROOMS)) {
      const def = ROOMS[id], kind = FRINGE_KIND[def.zone] || 'grass';
      if ((kind !== 'grass' && kind !== 'frond') || def.indoor) continue;
      try { loadRoom(id); buildFringe(); } catch (e) { continue; }
      const cur = surfaceCurve(); if (!cur || GRASS.room !== id) continue;
      out.rooms++;
      for (const q of GRASS.cols) {
        out.cols++;
        // only grass growing on the tile the curve itself stands on (a floor under an overhang, or a
        // deck in the air, is another surface with its own line)
        const im = Math.min(cur.N - 1, Math.round((Math.floor((q.x + 1) / TILE) + 0.5) * TILE / SURF_STEP)), Yc = cur.top[im];
        if (isNaN(Yc) || q.y < Yc - 16 || q.y > Yc + 24) continue;
        // (y is the card's foot, 9 px under the curve it grows on)
        let best = 1e9;
        for (let k = -1; k <= 2; k++) { const i = Math.round(q.x / SURF_STEP) + k; if (i < 0 || i >= cur.N || isNaN(cur.y[i])) continue; best = Math.min(best, q.y - (cur.y[i] + 9)); }
        if (best > 16 && best < 1e9) out.sunk.push(id + '@' + Math.round(q.x) + ':' + Math.round(best));
      }
    }
    return out;
  });
  console.log('     D2 ' + JSON.stringify({ rooms: D2.rooms, cols: D2.cols, sunk: D2.sunk.length }));
  const worst = (k) => Math.max(...all.map(r => r[k]));
  const sum = (k) => all.reduce((a, r) => a + r[k], 0);
  check('A  the ground body\'s top follows the curve: no step over 3 px between neighbouring columns, nowhere more than 4 px off the surface', all.every(r => r.cols > 200) && worst('jump') <= 3 && sum('offCols') === 0, { worstJump: worst('jump'), stairCols: sum('stairCols'), worstOff: worst('off'), offCols: sum('offCols') });
  check('B  no backdrop in the body under the surface (no floating band)', sum('holeCols') === 0, { holeCols: sum('holeCols'), worst: worst('holeMax') });
  check('C  the grass\'s lower boundary is not a hard edge: it thins from 80% to 20% over ' + FALL_MED + '+ px (median), ' + FALL_P10 + '+ px (worst tenth)', all.every(r => r.grassCols > 200 && r.fallMed >= FALL_MED && r.fallP10 >= FALL_P10), all.map(r => r.room + ':' + r.fallMed + '/' + r.fallP10));
  check('D  the grass grows on the drawn surface: its centre never more than ' + MID_DOWN + ' px into the body, and never jumping over ' + MID_JUMP + ' px against the curve', worst('midDown') <= MID_DOWN && worst('midJump') <= MID_JUMP, { midDown: worst('midDown'), midJump: worst('midJump') });
  check('D2 ...and in every room that grows it, no column of grass is rooted more than 16 px under the surface', D2.rooms > 10 && D2.cols > 1000 && D2.sunk.length === 0, { rooms: D2.rooms, sunk: D2.sunk.slice(0, 8) });
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — one ground under one surface, and the grass grows out of it');
})().catch(e => { console.error(e); process.exit(1); });
