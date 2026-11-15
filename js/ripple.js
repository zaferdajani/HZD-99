// ===========================================================================
// A SHOCK THAT BENDS THE SCREEN (owner, 2026-11-15, of the Alpha's howl: "the
// circles coming from it when it howls ... is looking like lines instead of
// aura, or an actual after effect of a howling of a wolf, which should vibrate
// the screen a little bit, nudge it. Maybe push me backward one step. The
// effect shouldn't be linear, should be blended with the screen in a
// wave-like shock effect visual.")
//
// The howl was drawn as rings: stroked circles laid over the picture. A stroke
// sits ON the scene, and that is why it read as lines. A shock wave does not
// sit on anything — it is the scene itself, displaced, for the instant the
// front passes through it. So this draws no line at all:
//
//   THE WAVE IS THE PICTURE, BENT. Once the world is on the canvas the frame
//   is copied, and for each wavefront the copy is drawn back through a ring-
//   shaped window, enlarged by a hair about the wave's centre. Inside that
//   window every pixel shows what was a few pixels further in — the scene is
//   pushed outward as the front crosses it. The enlargement rises and falls
//   smoothly across the band (a half sine over a handful of thin sub-rings),
//   so it is zero at both edges: nothing has an outline, the rooms's own
//   lines simply bow as the wave goes through them.
//   A TRAIN, NOT A RING. A howl is a held note: each ripple is two or three
//   fronts behind one another, each weaker than the last.
//   LIGHT, AS A WASH. Over the bend lies one wide soft band of the wave's
//   colour — bright on the crest, a shade darker in the trough behind it, a
//   gradient with no edge — and the instant it is born the whole frame takes
//   a breath of that colour.
//   THE AIR SHAKES BEHIND IT. Inside the first front, for as long as the note
//   is strong, the picture shimmers: thin horizontal slices of the frame slip
//   a pixel or two against each other, the way air does over a road.
//   IT ARRIVES. When the first front reaches her the frame is nudged a few
//   pixels the way the wave is travelling, and — for a wave that asks for it —
//   she is pushed back a step. No damage: a howl is not a blow.
//   IT TOUCHES THE GROUND. The front drags a line of dust along the terrain.
//
// Screen space, drawn after the world and the grade and before the HUD (the
// interface does not bend). Reduced motion keeps the light and drops the bend
// and the nudge; the low quality tier bends with fewer sub-rings and one
// front. Nothing is drawn under G.artProbe.
// ===========================================================================
const RIPPLES = [];
const RIPPLE = { cv: null, max: 5, nudgeT: 0, nudgeX: 0, nudgeY: 0, bent: 0 };
// shockRipple(wx, wy, { R, dur, amp, width, col, fronts, gap, push, nudge, dust, delay })
//   R      how far the wave runs, world px        amp    peak displacement, screen px
//   width  half-width of a front's band, world px fronts how many, `gap` s apart
//   push   px/s she is thrown back when it reaches her (0: it only passes)
function shockRipple(wx, wy, o) {
  if (typeof FOE_READ !== 'undefined' && FOE_READ.sil) return null;
  const w = { x: wx, y: wy, t: 0, R: 420, dur: 0.9, amp: 20, width: 56, col: '#b06aff', fronts: 3, gap: 0.13,
    push: 0, nudge: 4, dust: true, delay: 0, hit: false, light: 1, shimmer: 2.4, pulse: 0.16 };
  if (o) for (const k in o) w[k] = o[k];
  w.t = -w.delay;
  if (RIPPLES.length >= RIPPLE.max) RIPPLES.shift();
  RIPPLES.push(w); return w;
}
function rippleEase(k) { k = clamp(k, 0, 1); return 1 - (1 - k) * (1 - k); }
// how far the i-th front has run, world px (NaN before it has left)
function rippleFront(w, i) {
  const t = w.t - i * w.gap; if (t < 0) return NaN;
  const k = t / w.dur; if (k >= 1) return NaN;
  return w.R * rippleEase(k);
}
function rippleCalm() {
  return (typeof reduceMotion === 'function' && reduceMotion())
    || (typeof G !== 'undefined' && G.save && G.save.opts && G.save.opts.reduceMotion);
}
function rippleUpdate(dt) {
  if (RIPPLE.nudgeT > 0) RIPPLE.nudgeT -= dt;
  for (let i = RIPPLES.length - 1; i >= 0; i--) {
    const w = RIPPLES[i]; w.t += dt;
    if (w.t >= w.dur + (w.fronts - 1) * w.gap) { RIPPLES.splice(i, 1); continue; }
    const r = rippleFront(w, 0);
    if (!(r === r)) continue;
    // IT ARRIVES: the first front crossing where she stands
    if (!w.hit && typeof player !== 'undefined' && player && !player.dead) {
      const dx = player.x + player.w / 2 - w.x, dy = player.y + player.h / 2 - w.y, d = Math.hypot(dx, dy);
      if (d <= r && d < w.R) {
        w.hit = true;
        const s = Math.sign(dx) || 1;
        if (w.push > 0 && !player.grap && !(player.dashT > 0)) {
          // one step back, and her feet are hers again at once
          player.vx = s * w.push; player.knockT = Math.max(player.knockT || 0, 0.12);
        }
        if (w.nudge > 0 && !rippleCalm()) {
          RIPPLE.nudgeT = 0.16; const n = d > 1 ? w.nudge / d : 0;
          RIPPLE.nudgeX = dx * n; RIPPLE.nudgeY = dy * n * 0.5;
          cam.shake = Math.max(cam.shake, 2.5);
          if (typeof padRumble === 'function') padRumble(0.35, 0.25, 120);
        }
      }
    }
    // IT TOUCHES THE GROUND: dust where the front meets the floor, both ways
    if (w.dust && !G.artProbe && typeof fxSurfaceY === 'function' && chance(dt * 34)) {
      for (const sgn of [-1, 1]) {
        const gx = w.x + sgn * r, gy = fxSurfaceY(gx, w.gy == null ? w.y : w.gy, 70);
        if (gy === gy) addPart(gx + rnd(-6, 6), gy - 1, sgn * rnd(30, 110), rnd(-90, -20), rnd(0.3, 0.55), chance(0.5) ? '#c8b89a' : w.col, rnd(1.4, 2.6), 380);
      }
    }
  }
}
function rippleDraw(c) {
  RIPPLE.bent = 0;
  if (!RIPPLES.length && !(RIPPLE.nudgeT > 0)) return;
  if (typeof G !== 'undefined' && G.artProbe) return;
  const calm = rippleCalm();
  const z = typeof worldZoom === 'function' ? worldZoom() : 1;
  const sx = (x) => typeof worldScreenX === 'function' ? worldScreenX(x) : x - cam.x;
  const sy = (y) => typeof worldScreenY === 'function' ? worldScreenY(y) : y - cam.y;
  const low = typeof QUAL !== 'undefined' && QUAL && QUAL.name === 'low';
  const src = c.canvas, bend = !calm && src && src.width > 0;
  let snap = null;
  if (bend) {
    // the frame as it stands, copied once for everything below
    const cv = RIPPLE.cv || (RIPPLE.cv = document.createElement('canvas'));
    if (cv.width !== src.width || cv.height !== src.height) { cv.width = src.width; cv.height = src.height; }
    const x = cv.getContext('2d');
    x.globalCompositeOperation = 'copy'; x.drawImage(src, 0, 0);
    snap = cv;
  }
  c.save();
  // THE NUDGE: the whole picture shifts a few pixels the way the wave went,
  // out and back over a sixth of a second
  if (snap && RIPPLE.nudgeT > 0) {
    const k = Math.sin(Math.PI * clamp(1 - RIPPLE.nudgeT / 0.16, 0, 1));
    c.drawImage(snap, 0, 0, snap.width, snap.height, RIPPLE.nudgeX * k, RIPPLE.nudgeY * k, 960, 540);
  }
  const N = low ? 4 : 8;
  const rgbOf = (w) => typeof fxRGB === 'function' ? fxRGB(w.col) : [0.7, 0.42, 1];
  const rgba = (rgb, a2) => 'rgba(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' + Math.round(rgb[2] * 255) + ',' + clamp(a2, 0, 1).toFixed(3) + ')';
  for (const w of RIPPLES) {
    if (w.t < 0) continue;
    const cx = sx(w.x), cy = sy(w.y);
    const fronts = low ? 1 : w.fronts;
    const k0 = clamp(w.t / w.dur, 0, 1), rgb = rgbOf(w);
    // THE BREATH OF COLOUR, on the frame it is born
    if (w.pulse > 0 && w.t < 0.2) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, w.pulse * (1 - w.t / 0.2)); c.fillRect(0, 0, 960, 540); c.restore();
    }
    // THE AIR SHAKES BEHIND THE FRONT: slices of the frame slipping sideways,
    // inside the circle the first front has reached, dying with the note
    const r1st = rippleFront(w, 0);
    if (snap && w.shimmer > 0 && r1st === r1st && !low) {
      const a = w.shimmer * Math.pow(1 - k0, 1.6), R0 = r1st * z;
      if (a > 0.3 && R0 > 12) {
        const H = 5, y0 = Math.max(0, Math.floor((cy - R0) / H) * H), y1 = Math.min(540, cy + R0), kx = snap.width / 960, ky = snap.height / 540;
        c.save(); c.beginPath(); c.arc(cx, cy, R0, 0, 6.2832); c.clip();
        for (let y = y0; y < y1; y += H) {
          const half = Math.sqrt(Math.max(0, R0 * R0 - (y + H / 2 - cy) * (y + H / 2 - cy)));
          if (half < 4) continue;
          const xa = Math.max(0, cx - half), xb = Math.min(960, cx + half); if (xb - xa < 4) continue;
          const off = Math.sin(y * 0.21 + w.t * 46) * a + Math.sin(y * 0.057 - w.t * 19) * a * 0.6;
          c.drawImage(snap, xa * kx, y * ky, (xb - xa) * kx, H * ky, xa + off, y, xb - xa, H);
        }
        c.restore();
      }
    }
    for (let i = 0; i < fronts; i++) {
      const rw = rippleFront(w, i); if (!(rw === rw)) continue;
      const k = (w.t - i * w.gap) / w.dur, fade = Math.pow(1 - k, 1.25) * (1 - i * 0.28);
      const r = rw * z, hw = w.width * z * (0.7 + 0.7 * k);
      const r0 = Math.max(0, r - hw), r1 = r + hw;
      // off the screen entirely: nothing to do
      if (cx + r1 < 0 || cx - r1 > 960 || cy + r1 < 0 || cy - r1 > 540) continue;
      if (snap) {
        // THE BEND: sub-rings across the band, each showing the frame enlarged
        // about the wave's centre by a half-sine of its place in the band
        for (let j = 0; j < N; j++) {
          const u0 = j / N, u1 = (j + 1) / N, um = (u0 + u1) / 2;
          const a = w.amp * fade * Math.sin(Math.PI * um);
          if (a < 0.35) continue;
          const ra = r0 + (r1 - r0) * u0, rb = r0 + (r1 - r0) * u1, rm = (ra + rb) / 2;
          const s = 1 + a / Math.max(24, rm);
          c.save();
          c.beginPath(); c.arc(cx, cy, rb + 0.6, 0, 6.2832); c.arc(cx, cy, Math.max(0, ra - 0.6), 0, 6.2832, true); c.clip();
          c.drawImage(snap, 0, 0, snap.width, snap.height, cx - cx * s, cy - cy * s, 960 * s, 540 * s);
          c.restore();
          RIPPLE.bent++;
        }
      }
      // THE WASH: a trough a shade darker just behind the crest, and one wide
      // soft band of the wave's colour on it — both gradients, no edge to either
      const al = 0.42 * fade * (w.light || 0);
      if (al > 0.01) {
        const ri = Math.max(0, r - hw * 2.2), ro = r + hw * 1.5, span = Math.max(1, ro - ri);
        const at = (rr) => clamp((rr - ri) / span, 0, 1);
        const d = c.createRadialGradient(cx, cy, ri, cx, cy, ro);
        d.addColorStop(0, 'rgba(4,6,14,0)'); d.addColorStop(at(r - hw * 1.0), 'rgba(4,6,14,' + (al * 0.5).toFixed(3) + ')');
        d.addColorStop(at(r - hw * 0.2), 'rgba(4,6,14,0)'); d.addColorStop(1, 'rgba(4,6,14,0)');
        c.save(); c.fillStyle = d; c.beginPath(); c.arc(cx, cy, ro, 0, 6.2832); c.fill(); c.restore();
        const g = c.createRadialGradient(cx, cy, ri, cx, cy, ro);
        const hot = [Math.min(1, rgb[0] * 0.5 + 0.5), Math.min(1, rgb[1] * 0.5 + 0.5), Math.min(1, rgb[2] * 0.5 + 0.5)];
        g.addColorStop(0, rgba(rgb, 0)); g.addColorStop(at(r - hw * 0.5), rgba(rgb, al * 0.25));
        g.addColorStop(at(r + hw * 0.1), rgba(hot, al)); g.addColorStop(at(r + hw * 0.7), rgba(rgb, al * 0.4)); g.addColorStop(1, rgba(rgb, 0));
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, ro, 0, 6.2832); c.fill(); c.restore();
      }
    }
  }
  c.restore();
}
