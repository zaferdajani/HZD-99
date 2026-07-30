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

function atlasReady() {
  return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[ATLAS.key];
}

// eased facing -> authored angle. +1 right, 0 toward camera, -1 left.
function yawCol(faceVis) {
  const f = faceVis == null ? 1 : faceVis;
  return Math.round(clamp((1 - f) / 2, 0, 1) * 4);
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
  const im = MEDIA_IMG[ATLAS.key];
  const cw = im.naturalWidth / ATLAS.cols, ch = im.naturalHeight / ATLAS.rows;
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
  const sx = yawCol(faceVis) * cw + cw * IN.side;
  const sy = S.row * ch + ch * IN.top;
  const sw2 = cw * (1 - IN.side * 2);
  const sh2 = ch * (1 - IN.top - IN.bottom);
  c.drawImage(im, sx, sy, sw2, sh2, cx - dw / 2, dy, dw, dh);

  // damage flash and the Song's charm are tinted ON TOP, so the rendered
  // lighting underneath is never destroyed by a flat colour fill
  if (o.flash > 0 || o.charm > 0) {
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = o.charm > 0 ? 'rgba(63,216,238,0.42)' : 'rgba(255,235,235,0.55)';
    c.fillRect(cx - dw / 2, dy, dw, dh);
  }
  c.restore();
  return true;
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
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[DRILLER.key];
  if (!im) return false;
  const CW = im.naturalWidth / DRILLER.cols, CH = im.naturalHeight / DRILLER.rows;
  const t = b.anim, fv = b.faceVis == null ? -1 : b.faceVis;
  let row, col, mirror = false;

  const facingRight = fv > 0;
  if (b.dead || b.deathAnimT > 0) {
    row = 5;
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
  const dy = footY - dh + b.h * DRILLER.yOff;
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
