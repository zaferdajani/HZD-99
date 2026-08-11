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
const ATLAS = {
  key: 'roster', cols: 8, rows: 11,
  // row  = which strip in the sheet
  // k    = how many hitbox-heights the CELL should occupy on screen
  // yOff = nudge in hitbox-heights; hovering things do not stand on the cell floor
  sub: {
    nya:     { row: 0,  k: 1.75, yOff: 0.00 },
    crawler: { row: 1,  k: 3.10, yOff: 0.06 },
    hopper:  { row: 2,  k: 2.70, yOff: 0.04 },
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
function processSheet(key, cols, rows) {
  if (ATLAS_PROC[key] !== undefined) return ATLAS_PROC[key];
  const im = MEDIA_IMG[key];
  if (!im) return null;
  const W = im.naturalWidth, H = im.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  const img = x.getImageData(0, 0, W, H), d = img.data;
  const lbl = new Int32Array(W * H);
  const qx = new Int32Array(W * H), qy = new Int32Array(W * H);
  for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
    const x0 = Math.floor(ci * W / cols), x1 = Math.floor((ci + 1) * W / cols);
    const y0 = Math.floor(r * H / rows), y1 = Math.floor((r + 1) * H / rows);
    // label components (4-connected) inside this cell
    let next = 0; const sizes = [];
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const n = yy * W + xx;
      if (lbl[n] !== 0 || d[n * 4 + 3] < 16) continue;
      next++; let head = 0, tail = 0, size = 0;
      qx[tail] = xx; qy[tail] = yy; tail++; lbl[n] = next;
      while (head < tail) {
        const px2 = qx[head], py2 = qy[head]; head++; size++;
        for (const [ax, ay] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx2 = px2 + ax, ny2 = py2 + ay;
          if (nx2 < x0 || ny2 < y0 || nx2 >= x1 || ny2 >= y1) continue;
          const nn = ny2 * W + nx2;
          if (lbl[nn] === 0 && d[nn * 4 + 3] >= 16) { lbl[nn] = next; qx[tail] = nx2; qy[tail] = ny2; tail++; }
        }
      }
      sizes.push(size);
    }
    if (!next) continue;
    let best = 1;
    for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best - 1]) best = i + 1;
    const base = next - sizes.length;   // labels used before this cell
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const n = yy * W + xx;
      if (lbl[n] !== 0 && lbl[n] !== base + best) { d[n * 4 + 3] = 0; }
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
  x.putImageData(img, 0, 0);
  ATLAS_PROC[key] = cv;
  return cv;
}
function sheetOf(key, cols, rows) {
  const p = processSheet(key, cols, rows);
  return p || MEDIA_IMG[key];
}
function atlasReady() {
  return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[ATLAS.key];
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
  const S = ATLAS.sub[subject];
  if (!S || !atlasReady()) return false;
  const im = sheetOf(ATLAS.key, ATLAS.cols, ATLAS.rows);
  const cw = im.width / ATLAS.cols, ch = im.height / ATLAS.rows;
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
  const IN = Object.assign({}, ATLAS_INSET, S.ins || {});
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
  if (o.yawSpin) fy = ((t * o.yawSpin) % 8 + 8) % 8;
  else if (o.yawScan) fy = o.yawScan.c + Math.sin(t * o.yawScan.r) * o.yawScan.a;
  else fy = yawColF(faceVis);
  fy = ((fy % 8) + 8) % 8;
  const col0 = Math.floor(fy) % ATLAS.cols, col1 = (col0 + 1) % ATLAS.cols;
  const colF = fy - Math.floor(fy);
  let bob = 0, rot = 0, kx = 1, ky = 1, pivTop = false;
  switch (o.mode) {
    case 'walk': {                 // gait: quick bob, lean into the run
      const g = t * (6 + Math.abs(vx) / 30);
      bob = Math.abs(Math.sin(g)) * dh * 0.05;
      rot = clamp(vx / 420, -1, 1) * 0.075 + Math.sin(g * 2) * 0.022;
      ky = 1 + Math.sin(g * 2) * 0.02; kx = 1 / ky;
      break;
    }
    case 'spring': {               // hopper: stretch in flight, squash on landing
      const airK = clamp(Math.abs(vy) / 700, 0, 1);
      ky = 1 + (vy < 0 ? 0.16 : 0.10) * airK;
      if (airK < 0.05) ky = 1 - Math.abs(Math.sin(t * 8)) * 0.05;
      kx = 1 / ky;
      rot = clamp(vx / 380, -1, 1) * 0.06;
      break;
    }
    case 'pulse': {                // molten things breathe slowly
      ky = 1 + Math.sin(t * 3) * 0.035; kx = 1 / ky;
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
  } else if (o.mode === 'walk' || o.mode === 'spring') {
    // ---- cutout rig: the image is taken apart and mounted on pivots ----------
    // The lower band of the sprite is cut into two leg groups (rear half and
    // front half), each hinged at its own hip and swinging in counterphase; the
    // body is a third part that rides above them and bobs. Three parts of the
    // SAME rendered art, articulated — not one picture sliding.
    const hipF = 0.64;                                  // hips at 64% of the cell
    const g2 = t * (6 + Math.abs(vx) / 30);
    const swing = (o.mode === 'walk' ? 0.20 : 0.08) * clamp(Math.abs(vx) / 120 + 0.35, 0.35, 1);
    const legSy = sy + sh2 * hipF, legH = sh2 * (1 - hipF);
    const legDy = topY + dh * hipF;                     // legs stay planted (no bob)
    const legDh = dh * (1 - hipF);
    // One authored angle, rigged. Run it twice and the second angle fades in
    // over the first: this branch used to draw col0 only, so the walkers — the
    // crawler and the hopper, the two machines the player meets most — STEPPED
    // between authored angles while everything else on the turntable swept
    // through them. They turn like the rest of the roster now.
    const limbPass = (cc) => {
      for (const [half, ph] of [[0, 1], [1, -1]]) {     // rear group, front group
        c.save();
        c.translate(ddx + dw * (half ? 0.5 : 0), legDy);
        // shear about the hip line: the top edge never leaves the body, so the
        // stride can never tear a gap open the way rotation did
        c.transform(1, 0, Math.sin(g2) * swing * ph, 1, 0, 0);
        c.drawImage(im, sxOf(cc) + half * sw2 / 2, legSy, sw2 / 2, legH,
                    half ? -dw * 0.015 : 0, -legDh * 0.04, dw / 2 + dw * 0.015, legDh * 1.04);
        c.restore();
      }
      // the body overlaps the hip line so the seam never shows
      c.drawImage(im, sxOf(cc), sy, sw2, sh2 * (hipF + 0.05), ddx, ddy, dw, dh * (hipF + 0.05));
    };
    limbPass(col0);
    if (colF > 0.03) { c.save(); c.globalAlpha *= colF; limbPass(col1); c.restore(); }
  } else {
    c.drawImage(im, sxOf(col0), sy, sw2, sh2, ddx, ddy, dw, dh);
    if (colF > 0.03) {                       // the next angle fades in over it
      c.save(); c.globalAlpha *= colF;
      c.drawImage(im, sxOf(col1), sy, sw2, sh2, ddx, ddy, dw, dh);
      c.restore();
    }
  }
  c.restore();
  return true;
}

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


// ---------------------------------------------------------------------------
// The Driller's own sheet: 12 cols x 6 rows of ANIMATION, not just a turnaround.
//   row 0  turnaround (12 yaws — we use 5 authored buckets, left to right)
//   row 1  walk cycle, authored facing LEFT
//   row 2  rear-up (the bore wind-up telegraph)
//   row 3  drive the bore-head into the floor, dust and all
//   row 4  damaged idle — smoke and burning; phase two lives here
//   row 5  destroyed — collapse into wreckage
// This sheet's light is a soft top key, near-symmetric, so mirroring the
// animation rows for right-facing is visually safe — unlike the roster sheet,
// whose hard upper-left key made mirroring a lie. Row 0 is never mirrored; it
// has real authored angles.
const DRILLER = { key: 'driller', cols: 12, rows: 6, k: 2.55, yOff: 0.10 };
// faceVis buckets -> row-0 columns (left profile ... right profile)
const DRILLER_YAW = [[-0.75, 0], [-0.3, 2], [0.3, 3], [0.75, 8], [9, 10]];

function drawDriller(c, b) {
  if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG[DRILLER.key]) return false;
  const im = sheetOf(DRILLER.key, DRILLER.cols, DRILLER.rows);
  const CW = im.width / DRILLER.cols, CH = im.height / DRILLER.rows;
  const t = b.anim, fv = b.faceVis == null ? -1 : b.faceVis;
  let row, col, mirror = false, extraDy = 0;

  const facingRight = fv > 0;
  if (b.dead || b.deathAnimT > 0) {
    row = 5; extraDy = b.h * 0.10;   // seat the wreck on its shadow
    const k = 1 - clamp((b.deathAnimT || 0) / 1.6, 0, 1);
    col = Math.min(11, Math.floor(k * 12));
    mirror = facingRight;
  } else if (b.st === 'bore') {
    if (!b.bored) { row = 2; col = Math.min(11, Math.floor((1.1 - b.t) / 1.1 * 12)); }
    else { row = 3; col = 3 + Math.floor(t * 14) % 9; }
    // the rear-up and bore rows are authored mostly front-on: no mirror needed
  } else if (b.st === 'charge' || Math.abs(b.vx) > 40) {
    row = 1; col = Math.floor(t * (b.st === 'charge' ? 18 : 11)) % 12;
    mirror = facingRight;
  } else if (b.hurtT > 0 || b.phase >= 2) {
    row = 4; col = Math.floor(t * 9) % 12;
    mirror = facingRight;
  } else {
    // idle: real authored yaw, driven by the eased facing — the turn passes
    // through the front view because the front view actually exists
    row = 0; col = 9;
    for (const [th, cc] of DRILLER_YAW) { if (fv <= th) { col = cc; break; } }
  }

  const cx = b.x + b.w / 2, footY = b.y + b.h;
  const dh = b.h * DRILLER.k, dw = dh * (CW / CH);
  const dy = footY - dh + b.h * DRILLER.yOff + (typeof extraDy === 'number' ? extraDy : 0);
  // reactive shadow (rows 3-5 carry baked dust, so soften it there)
  const dusty = row >= 3;
  const lean = clamp((b.vx || 0) / 420, -1, 1);
  const sw = dw * 0.30 * (1 + Math.abs(lean) * 0.35);
  const g = c.createRadialGradient(cx, footY, 0, cx, footY, Math.max(1, sw));
  g.addColorStop(0, 'rgba(4,8,12,' + (dusty ? 0.3 : 0.55) + ')');
  g.addColorStop(1, 'rgba(4,8,12,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx + lean * dw * 0.1, footY, sw, Math.max(2, dh * 0.05), 0, 0, 7); c.fill();

  c.save();
  c.translate(cx, 0);
  if (mirror) c.scale(-1, 1);
  if (b.hurtT > 0 && row !== 4) c.globalAlpha = 0.72;
  // each cell carries a drawn frame near its edges; crop past it
  const inx = CW * 0.09, iny = CH * 0.05;
  c.drawImage(im, col * CW + inx, row * CH + iny, CW - inx * 2, CH - iny * 2 - CH * 0.02, -dw / 2, dy, dw, dh);
  c.restore();
  return true;
}
