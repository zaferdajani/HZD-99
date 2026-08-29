// ===========================================================================
// WHAT MACHINE IS THIS, AND WHAT CAN IT AFFORD
//
// The same file is now expected to run on a phone, a tablet and a laptop. Those
// are not one platform with a different screen size — they differ by roughly an
// order of magnitude in fill rate, and the thing that kills a phone is not the
// simulation (which is fixed-step and cheap) but PIXELS: a full-screen bloom
// pass, a parallaxed ceiling, and every `shadowBlur` in the draw path.
//
// So there are two mechanisms here and they do different jobs:
//
//   DETECT  a first guess, made before a single frame has been drawn, from
//           what the browser will tell us about the device. It only has to be
//           roughly right — its real job is to stop a phone from spending its
//           first four seconds at 20 fps while the adaptor works it out.
//
//   ADAPT   the correction, made from measured frame time. This is the one that
//           is actually trusted, because the guess cannot know about a cheap
//           tablet with eight cores or a laptop rendering to a 4K panel.
//
// Both feed one number per knob, and every expensive thing in the renderer asks
// for its knob rather than deciding for itself. The player can override the
// whole thing from the pause menu, and the override is what persists — a device
// guess should never outrank someone who has looked at their own screen.
//
// The knobs, and why each one is a knob:
//
//   rs       backbuffer scale. The game draws in a fixed 960x540 space and
//            always has; this multiplies the PIXELS behind that space without
//            moving anything in it. It is by far the largest single lever —
//            0.75 is 44% fewer pixels for a picture nobody notices on a 6"
//            screen, and 1.25 is a visibly sharper one on a retina laptop.
//   bloom    the full-frame two-pass glow. Costs a downscale, two composites
//            and a blur filter every frame. First thing to go.
//   ceil     0 none / 1 the near plate only / 2 both parallax layers.
//   weather  how many things may fall off the roof at once.
//   parts    particle ceiling.
//   glow     whether shadowBlur is spent on small sprites. Canvas2D blur is
//            per-draw and does not batch; on a weak GPU it is the difference
//            between 60 and 34.
//   step     lowest simulation rate. Halved on a phone that is struggling, so
//            a bad frame costs one update instead of three.
// ===========================================================================
const QTIER = {
  low:  { rs: 0.70, bloom: false, ceil: 1, weather: 26, parts: 220, glow: false, name: 'low' },
  mid:  { rs: 0.88, bloom: true,  ceil: 2, weather: 55, parts: 380, glow: true,  name: 'mid' },
  high: { rs: 1.00, bloom: true,  ceil: 2, weather: 90, parts: 600, glow: true,  name: 'high' },
  ultra:{ rs: 1.30, bloom: true,  ceil: 2, weather: 120, parts: 800, glow: true, name: 'ultra' },
};
const QORDER = ['low', 'mid', 'high', 'ultra'];

// ---------------------------------------------------------------------------
// THE GUESS. Deliberately conservative about touch devices and deliberately
// generous about anything with a mouse: a laptop that is briefly over-served
// drops a tier within four seconds and nobody sees it, while a phone that is
// over-served spends the opening film stuttering, which is the one moment the
// game cannot afford to look cheap.
// ---------------------------------------------------------------------------
function detectDevice() {
  const nav = navigator, ua = (nav.userAgent || '');
  const touch = (nav.maxTouchPoints || 0) > 0;
  const coarse = matchMedia && matchMedia('(pointer: coarse)').matches;
  const dpr = window.devicePixelRatio || 1;
  // CSS pixels of the LARGEST side, which is the one that survives rotation.
  // Physical pixels lie: a phone reports 1170 wide and a laptop 1512, and the
  // phone is the smaller screen by a factor of six in area.
  const big = Math.max(screen.width || innerWidth, screen.height || innerHeight);
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || 0;             // Chrome only; 0 means unknown
  // iPadOS 13+ reports itself as a Mac, and is a tablet: a Mac with a
  // touchscreen does not exist, so touch + Macintosh is decisive.
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch);
  let form;
  if (iPad) form = 'tablet';
  else if (!touch && !coarse) form = 'laptop';
  else if (big < 900) form = 'phone';
  else if (big < 1200 && coarse) form = 'tablet';
  else form = coarse ? 'tablet' : 'laptop';
  return { form, touch, coarse, dpr, big, cores, mem };
}
function guessTier(d) {
  if (d.form === 'phone') return (d.cores >= 8 && (d.mem === 0 || d.mem >= 6)) ? 'mid' : 'low';
  if (d.form === 'tablet') return d.cores >= 8 ? 'high' : 'mid';
  // laptop/desktop: the risk is a big panel, not a weak chip. A 4K screen at
  // rs 1.3 is 10 megapixels a frame, so height gates the top tier.
  if (d.cores >= 8 && d.dpr <= 2 && d.big <= 2200) return 'ultra';
  return 'high';
}
const DEVICE = detectDevice();
let QAUTO = true;                                // is the tier still ours to move?
let QNAME = guessTier(DEVICE);
let QUAL = QTIER[QNAME];
let qHold = 3;                                   // seconds before the first correction

// ---------------------------------------------------------------------------
// THE CORRECTION. Same hysteresis discipline as the old rich-background flag,
// for the same reason: a device sitting exactly on a threshold must SETTLE,
// not oscillate. Demotion is fast (one bad stretch is enough — the player is
// already suffering) and promotion is slow and requires real headroom.
// ---------------------------------------------------------------------------
function qualStep(dt, frameMs) {
  if (!QAUTO) return;
  qHold -= dt;
  if (qHold > 0) return;
  const i = QORDER.indexOf(QNAME);
  if (frameMs > 27 && i > 0) qualSet(QORDER[i - 1], true);        // under ~37fps
  else if (frameMs < 13.5 && i < QORDER.length - 1) qualSet(QORDER[i + 1], true);  // over ~74fps
  else { qHold = 2; return; }
  qHold = 6;                                     // and live with it for a while
}
function qualSet(name, keepAuto) {
  if (!QTIER[name]) return;
  QNAME = name; QUAL = QTIER[name];
  if (!keepAuto) QAUTO = false;
  applyScale();
  if (G && G.save) { G.save.qual = QAUTO ? 'auto' : name; if (typeof persist === 'function') persist(); }
}
// what the pause menu cycles through, and what it shows
const QCYCLE = ['auto'].concat(QORDER);
function qualLabel() {
  return QAUTO ? (t('q_auto') + ' — ' + QNAME) : QNAME;
}
function qualCycle() {
  const cur = QAUTO ? 'auto' : QNAME;
  const nx = QCYCLE[(QCYCLE.indexOf(cur) + 1) % QCYCLE.length];
  if (nx === 'auto') { QAUTO = true; qHold = 1; if (G && G.save) { G.save.qual = 'auto'; if (typeof persist === 'function') persist(); } }
  else qualSet(nx, false);
}
function qualRestore() {                          // called once the save exists
  const w = G.save && G.save.qual;
  if (!w || w === 'auto') return;
  if (QTIER[w]) { QAUTO = false; QNAME = w; QUAL = QTIER[w]; applyScale(); }
}

// ---------------------------------------------------------------------------
// RESOLUTION. The whole game is written against a 960x540 page and nothing in
// it knows this exists: the backbuffer changes size and a base transform maps
// the old coordinates onto the new one. That is the entire trick, and it is why
// a resolution dial could be added to a five-thousand-line renderer at all.
// ---------------------------------------------------------------------------
let RS = 1;
// HOW BIG THE PICTURE IS ON THE GLASS — which is NOT how big the backbuffer is,
// and the two must never be allowed to define each other. The page's CSS sizes
// the canvas from its width ATTRIBUTE, so halving the backbuffer for speed also
// halved the visible game; and reading the size back afterwards fed that halved
// number into the next decision, which pinned every tier to the same number and
// made the whole dial do nothing. Both bugs are the same bug. The fix is to pin
// the CSS size to the viewport once and derive resolution only from that.
let cssPinned = false;
function fitCanvas(cv) {
  let touchOwns = false;
  try { touchOwns = typeof TOUCH !== 'undefined' && !!TOUCH.enabled; } catch (e) { touchOwns = false; }
  if (touchOwns) return parseFloat(cv.style.width) || 960;   // the controller lays it out
  const vv = window.visualViewport;
  const vw = Math.max(320, Math.round(vv ? vv.width : innerWidth));
  const vh = Math.max(180, Math.round(vv ? vv.height : innerHeight));
  const W = Math.min(vw, vh * 16 / 9);                       // 16:9, letterboxed
  cv.style.maxWidth = 'none'; cv.style.maxHeight = 'none';
  cv.style.width = Math.round(W) + 'px';
  cv.style.height = Math.round(W * 9 / 16) + 'px';
  cssPinned = true;
  return W;
}
function applyScale() {
  const cv = document.getElementById('cv');
  if (!cv) return;
  // The tier is a fraction of NATIVE, not of the 960 design width. That
  // distinction is the whole feature: 960 is a coordinate system, not a
  // resolution, and a phone showing the canvas in a 700 px box was already
  // rendering 700 px — dropping a tier has to take it to 490, or "low" costs
  // nothing on exactly the devices it exists for. Above 1 it supersamples,
  // which is what makes the picture visibly sharper on a retina laptop.
  const native = fitCanvas(cv) * (window.devicePixelRatio || 1) / 960;
  const rs = Math.max(0.45, Math.min(native * QUAL.rs, 2));   // 1920x1080 is the ceiling
  if (Math.abs(rs - RS) < 0.02 && cv.width === Math.round(960 * rs)) return;
  RS = rs;
  cv.width = Math.round(960 * rs); cv.height = Math.round(540 * rs);
  // every cached gradient/pattern on the context dies with the resize, and the
  // transform has to be re-established — draw() does that per frame via qFrame()
  if (typeof tileDirty !== 'undefined') tileDirty = true;
}
// THE LAYOUT CHANGES WITHOUT A RESIZE, AND THE RESOLUTION HAS TO FOLLOW IT.
//
// applyScale derives the backbuffer from the canvas's CSS box, and on a phone
// that box is not set here — the touch controller lays it out, after boot, once
// it knows the gutters. Nothing told this file. So a phone computed its
// resolution ONCE, against the pre-controller box, and then rendered at that
// number forever: measured on a 3x device, a 960x540 backbuffer stretched
// across 1748x983 device pixels. Every plate in the game upscaled 1.8x, which
// is exactly what "blurry" looks like, and no tier change could move it.
//
// The resize listener could not catch it because enabling the controller is not
// a resize; and a call added to the controller would only fix the one site that
// exists today. So the check lives where it cannot be forgotten: one string
// compare per frame against the box we last derived from. Nothing is recomputed
// while the box holds still, and any future layout — the pad connecting and the
// gutters going away, the visual viewport moving, an orientation change — is
// picked up on the next frame by construction.
let lastBoxW = '';
function scaleCheck() {
  const cv = document.getElementById('cv');
  if (!cv || cv.style.width === lastBoxW) return;
  applyScale();
  lastBoxW = cv.style.width;   // read back AFTER: off touch, fitCanvas writes it
}
// called at the top of every frame, before anything draws
function qFrame(ctx) {
  scaleCheck();
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
}
addEventListener('resize', () => { setTimeout(applyScale, 60); });
