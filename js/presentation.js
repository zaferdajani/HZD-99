// Shared world framing and startup readiness. UI remains in 960x540 logical
// pixels; camera zoom scales the WORLD, including effects and interactions.
// It does not silently enlarge only the artwork around a smaller hit shape.
// The actor started at 1.78, read oversized twice over (owner, 2026-09-11)
// and is back to her original 1.0; the world zoom sat at 1.90 until the owner
// asked for 15% more screen (2026-09-18) and is now 1.615. World zoom changes
// the view; actor scale changes the hero/NPC proportion. They are deliberately
// separate, applied once each, and tested as a pair.
// heroVisualScale here is a startup default only — js/entities.js overwrites
// it with the live HERO_SCREEN_SCALE constant once that file loads (this
// file loads first; see source-files.json), so THAT constant is the one
// value to change. Keeping this literal in sync anyway is what
// tests/reconciliation.cjs checks for.
// 1.90 -> 1.615 -> 1.52: the owner asked for 15% more room on screen
// (2026-09-18, "you need to zoom out 15% in game to show more of the screen")
// and then for 20% ("zoom out 20%"). Both are measured from the ORIGINAL 1.90,
// so this is 1.90 * 0.80 = 1.52, not a further 20% off the 15%.
//
// It is the ZOOM that moves, not the actor: heroVisualScale stays 1.0, so she
// is the same size relative to the world she stands in and every enemy, NPC and
// structure pulls back with her. At 1.52 the visible world is 632x355 against
// the original 505x284 — 25% wider, 56% more area.
const PRESENTATION = { heroVisualScale:1.0, explorationZoom:1.52, minEncounterZoom:1.05, buffer:null };
const HERO_CORE_KEYS = ['heroStates', 'gaitWalk', 'gaitRun', 'hzdIdle'];
let heroArtAttempt = 0;
function requestHeroArt() {
  if (typeof isHero === 'function' && isHero()) return;
  if (typeof mediaFetch !== 'function') return;
  for (const k of HERO_CORE_KEYS) mediaFetch(k, 1);
}
function heroArtReady() {
  if (typeof isHero === 'function' && isHero()) return true;
  if (typeof MEDIA_RAW === 'undefined') return false;
  return HERO_CORE_KEYS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].width > 0);
}
function heroArtBootTick() {
  const now = performance.now();
  if (now - heroArtAttempt > 1000 || !heroArtAttempt) { requestHeroArt(); heroArtAttempt = now; }
  const ready = heroArtReady();
  const root = document.getElementById('cbload');
  if (root) {
    const n = document.getElementById('cbloadn'), bar = document.getElementById('cbloadbar');
    const count = typeof MEDIA_RAW === 'undefined' ? 0 : HERO_CORE_KEYS.filter(k => MEDIA_RAW[k]).length;
    if (n) n.textContent = ready ? 'Ready' : 'Preparing character animation ' + count + '/' + HERO_CORE_KEYS.length;
    if (bar) bar.style.width = (100 * count / HERO_CORE_KEYS.length) + '%';
    if (!ready && now > 12000) {
      if (n) n.textContent = 'Animation could not load. Retrying safely…';
      const retry = document.getElementById('cbloadretry'); if (retry) retry.hidden = false;
    }
  }
  return ready;
}
function worldZoom() {
  if ((typeof isHero === 'function' && isHero()) || (typeof window !== 'undefined' && window.EDITOR)) return 1;
  return Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : PRESENTATION.explorationZoom;
}
function worldScreenX(x) { return 480 + (x - cam.x - 480) * worldZoom(); }
function worldScreenY(y) { return 270 + (y - cam.y - 270) * worldZoom(); }
function withWorldProjection(ctx, fn) {
  const z = worldZoom();
  ctx.save(); ctx.translate(480,270); ctx.scale(z,z); ctx.translate(-480,-270);
  try { return fn(); } finally { ctx.restore(); }
}
function presentWorld() {
  // ...magnified only by what the render scale did not already do: at z < 1 the
  // world was drawn small (worldViewBegin) and there is nothing left to enlarge
  const z = worldZoom() / worldRenderScale();
  if (z <= 1.001) return;
  const b = PRESENTATION.buffer || (PRESENTATION.buffer = document.createElement('canvas'));
  if (b.width !== cv.width || b.height !== cv.height) { b.width = cv.width; b.height = cv.height; }
  const x = b.getContext('2d', {alpha:false});
  x.setTransform(1,0,0,1,0,0); x.drawImage(cv,0,0);
  c.save(); c.setTransform(1,0,0,1,0,0); c.imageSmoothingEnabled = true;
  c.drawImage(b, (b.width-b.width/z)/2, (b.height-b.height/z)/2, b.width/z,b.height/z, 0,0,cv.width,cv.height);
  c.restore();
}
// ZOOMED OUT IS DRAWN, NOT ONLY COUNTED (owner, 2026-11-25: "the screen should just zoom out to
// fill out all the screen with all the data needed without moving the camera with me"). The world
// is drawn 1:1 into the 960x540 frame and presentWorld enlarges its middle when z > 1; a z below 1
// used to do nothing at all, so a boss fit that asked for 0.68 still showed 960 px of the arena.
// Now a z below 1 draws the world SMALLER, about the frame's centre: WORLD_VIEW is the part of the
// logical 960x540 space that lands on the canvas (wider and taller than it, x/y negative), and
// every full-frame pass in the world draws over WORLD_VIEW instead of 0,0,960,540. The canvas, and
// so the pixel count a phone pays for, is the same; worldScreenX/Y hold for every z.
// The backdrop and the screen-wide grades (bloom, wash, vignette, lift, light) are drawn on the
// canvas itself (worldOnScreen): they belong to the picture, not to a place in the room.
const WORLD_VIEW = { k: 1, x: 0, y: 0, w: 960, h: 540, m0: null };
function worldRenderScale() { const z = worldZoom(); return z > 0.05 && z < 0.999 ? z : 1; }
function worldViewBegin(ctx) {
  const V = WORLD_VIEW, k = worldRenderScale();
  V.k = k; V.w = 960 / k; V.h = 540 / k; V.x = 480 - V.w / 2; V.y = 270 - V.h / 2;
  V.m0 = ctx.getTransform();
  if (k < 1) { ctx.translate(480, 270); ctx.scale(k, k); ctx.translate(-480, -270); }
}
function worldViewEnd(ctx) {
  const V = WORLD_VIEW;
  if (V.m0) ctx.setTransform(V.m0);
  V.k = 1; V.x = 0; V.y = 0; V.w = 960; V.h = 540; V.m0 = null;
}
function worldOnScreen(ctx, fn) {
  const V = WORLD_VIEW;
  if (V.k >= 1 || !V.m0) return fn();
  ctx.save(); ctx.setTransform(V.m0);
  try { return fn(); } finally { ctx.restore(); }
}
function drawSaveFeedback() {
  const f = G.saveFeedback;
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (!f || nowMs > f.until || G.state !== 'PLAY' || G.dialog || G.tut || G.gateWalk) return;
  const text = f.ok ? t('save_ok') : t('save_failed');
  c.save(); c.font='600 12px system-ui'; c.textAlign='right';
  const w=Math.min(600,c.measureText(text).width+28);
  c.fillStyle='rgba(5,12,18,.85)'; rr(c,944-w,507,w,25,7); c.fill();
  c.fillStyle=f.ok?'#aef7d8':'#ffd76a'; c.fillText(text,930,524); c.restore();
}
