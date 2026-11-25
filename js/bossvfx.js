// THE BOSSES' ATTACKS, IN GENERATED LIGHT.
//
// Owner, 2026-11-24, of the agent's fight: "Why is the boss attk graphics so basic? Why not apply
// vfx ... and create a well made fight? Instead of this bad one." He was right: every attack after
// the rhino was drawn in code out of circles and strokes — an ember bead was an orange dot, the
// staff's sweep a stroked arc, the ember ring an ellipse round the agent's feet.
//
// These are generated effect clips (Higgsfield, Seedance 2.0 on black: assets/source/vfx/
// boss-2026-11-24/, with their prompts), cut into strips by tools/vfxstrip.py and drawn here with
// the 'lighter' blend — black adds nothing, so a strip needs no matte and has no edge to show.
//   ember bolt, burst, fire pillar, staff slash, fire wave      the Eye's agent (amber)
//   floor shock, null bolt, claw rake, glitch burst             NULLFANG (virus violet)
//   the bite, the landing                                       the Wolf King (red)
//   ice shard, shatter                                          CHIME (ice)
// Code places them, times them and scales them; it never draws the picture (the art rule).
// Every one is an ATTACK — in the air, on the floor, where it hurts — never light round a body.
//
// Two ways to use one:
//   bossVfx(name, x, y, opts)       a one-shot: played once at (x, y) and gone (bursts, slashes,
//                                    pillars, bites, landings). opts: h (drawn height, px), flip,
//                                    rot, dur (s), a (alpha), seg (frame segments, see below)
//   drawBossVfxCell(c, name, t, x, y, h, flip, rot, a)
//                                    a LOOPING strip drawn by its owner at time t (a bolt in flight,
//                                    a wave running along the floor, a shock crawling on the ground)
// (x, y) is where the strip's HOT POINT lands (the white core, measured by the cutter), except for
// the strips that stand on the floor (`foot`), whose bottom edge sits at y.
const BOSS_VFX = {
  agent_bolt:   { cells: 8,  cw: 323, ch: 96,  hot: [0.879, 0.517], loop: 1, fps: 14 },
  agent_burst:  { cells: 11, cw: 256, ch: 256, hot: [0.469, 0.47],  dur: 0.55 },
  agent_pillar: { cells: 16, cw: 180, ch: 320, hot: [0.522, 0.98],  foot: 1, dur: 0.9 },
  agent_slash:  { cells: 6,  cw: 266, ch: 256, hot: [0.5, 0.5],     dur: 0.3 },
  agent_wave:   { cells: 8,  cw: 442, ch: 128, hot: [0.6, 0.92],    loop: 1, fps: 12, foot: 1 },
  nf_shock:     { cells: 8,  cw: 399, ch: 96,  hot: [0.5, 0.5],     loop: 1, fps: 16 },
  nf_bolt:      { cells: 8,  cw: 222, ch: 96,  hot: [0.703, 0.449], loop: 1, fps: 16 },
  nf_claw:      { cells: 12, cw: 256, ch: 256, hot: [0.533, 0.439], dur: 0.45 },
  nf_burst:     { cells: 6,  cw: 256, ch: 256, hot: [0.489, 0.543], dur: 0.45, fadeTail: 1 },
  alpha_bite:   { cells: 13, cw: 256, ch: 256, hot: [0.493, 0.478], dur: 0.55 },
  alpha_land:   { cells: 10, cw: 338, ch: 160, hot: [0.499, 0.815], foot: 1, dur: 0.6 },
  chime_shard:  { cells: 8,  cw: 299, ch: 128, hot: [0.647, 0.301], loop: 1, fps: 14 },
  chime_burst:  { cells: 10, cw: 256, ch: 256, hot: [0.463, 0.552], dur: 0.5 },
};
const BOSS_VFX_LIVE = [];
const bossVfxKey = n => 'bvfx_' + n;

function bossVfxReady(name) {
  const k = bossVfxKey(name);
  if (typeof mediaFetch === 'function') mediaFetch(k, 1);
  const im = typeof MEDIA_RAW !== 'undefined' ? MEDIA_RAW[k] : null;
  return im && im.naturalWidth ? im : null;
}
// ask for every strip of a fight when the fight begins: an effect that arrives after its blow
// is a blow with no picture
function bossVfxPrefetch(names) { for (const n of names) bossVfxReady(n); }

function drawBossVfxCell(c, name, cell, x, y, h, flip, rot, a, wk) {
  const V = BOSS_VFX[name], im = V && bossVfxReady(name);
  if (!im || !(a > 0.01) || !(h > 1)) return false;
  const n = V.cells, i = V.loop ? ((Math.floor(cell) % n) + n) % n : clamp(Math.floor(cell), 0, n - 1);
  const sw = im.naturalWidth / n, sh = im.naturalHeight, w = h * sw / sh * (wk || 1);
  c.save();
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a);
  c.translate(x, y); if (rot) c.rotate(rot); if (flip) c.scale(-1, 1);
  c.drawImage(im, i * sw, 0, sw, sh, -V.hot[0] * w, -V.hot[1] * h, w, h);
  c.restore();
  return true;
}
// a looping strip by its owner's clock
function drawBossVfxLoop(c, name, t, x, y, h, flip, rot, a, wk) {
  const V = BOSS_VFX[name]; if (!V) return false;
  return drawBossVfxCell(c, name, (t || 0) * (V.fps || 12), x, y, h, flip, rot, a == null ? 1 : a, wk);
}

// seg: [[fromCell, toCell, seconds], ...] — a strip whose beats are not evenly spaced in time
// (the pillar: a fast rise, a held column, a slower collapse)
function bossVfx(name, x, y, o) {
  const V = BOSS_VFX[name]; if (!V) return null;
  o = o || {};
  bossVfxReady(name);
  const f = { name, x, y, t: 0, h: o.h || V.ch * (o.s || 1) * 0.5, wk: o.wk || 1, flip: !!o.flip, rot: o.rot || 0,
    dur: o.dur || V.dur || 0.5, a: o.a == null ? 1 : o.a, seg: o.seg || null, follow: o.follow || null };
  if (f.seg) f.dur = f.seg.reduce((s, q) => s + q[2], 0);
  if (BOSS_VFX_LIVE.length > 48) BOSS_VFX_LIVE.shift();
  BOSS_VFX_LIVE.push(f);
  return f;
}
function bossVfxCellAt(f) {
  const V = BOSS_VFX[f.name];
  if (f.seg) {
    let t = f.t;
    for (const [a, b, d] of f.seg) { if (t <= d) return a + (b - a) * clamp(t / d, 0, 1); t -= d; }
    return f.seg[f.seg.length - 1][1];
  }
  return clamp(f.t / f.dur, 0, 0.999) * V.cells;
}
function updateBossVfx(dt) {
  for (let i = BOSS_VFX_LIVE.length - 1; i >= 0; i--) {
    const f = BOSS_VFX_LIVE[i]; f.t += dt;
    if (f.follow) { const p = f.follow(); if (p) { f.x = p[0]; f.y = p[1]; } }
    if (f.t >= f.dur) BOSS_VFX_LIVE.splice(i, 1);
  }
}
function drawBossVfx(c) {
  if (typeof G !== 'undefined' && G.artProbe) return;     // (the art probe measures bodies, not effects)
  for (const f of BOSS_VFX_LIVE) {
    const V = BOSS_VFX[f.name], k = f.t / f.dur;
    // the last fifth fades (a strip that ends on its own dark cell needs none; one that holds — the
    // glitch burst — is faded by code)
    const a = f.a * (V.fadeTail ? Math.pow(1 - clamp((k - 0.45) / 0.55, 0, 1), 1.4) : (k > 0.8 ? (1 - k) / 0.2 : 1));
    drawBossVfxCell(c, f.name, bossVfxCellAt(f), f.x, f.y, f.h, f.flip, f.rot, a, f.wk);
  }
}
function clearBossVfx() { BOSS_VFX_LIVE.length = 0; }
