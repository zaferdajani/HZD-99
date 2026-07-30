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
