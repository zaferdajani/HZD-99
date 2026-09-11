// Shared world framing and startup readiness. UI remains in 960x540 logical
// pixels; camera zoom scales the WORLD, including effects and interactions.
// It does not silently enlarge only the artwork around a smaller hit shape.
// The latest accepted sizing is 25% smaller than the 1.78 actor at 1.90 zoom.
// World zoom changes the view; actor scale changes the hero/NPC proportion.
// They are deliberately separate, applied once each, and tested as a pair.
const PRESENTATION = { heroVisualScale:1.335, explorationZoom:1.90, minEncounterZoom:1.05, buffer:null };
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
  const z = worldZoom();
  if (z <= 1.001) return;
  const b = PRESENTATION.buffer || (PRESENTATION.buffer = document.createElement('canvas'));
  if (b.width !== cv.width || b.height !== cv.height) { b.width = cv.width; b.height = cv.height; }
  const x = b.getContext('2d', {alpha:false});
  x.setTransform(1,0,0,1,0,0); x.drawImage(cv,0,0);
  c.save(); c.setTransform(1,0,0,1,0,0); c.imageSmoothingEnabled = true;
  c.drawImage(b, (b.width-b.width/z)/2, (b.height-b.height/z)/2, b.width/z,b.height/z, 0,0,cv.width,cv.height);
  c.restore();
}
function drawSaveFeedback() {
  const f = G.saveFeedback;
  if (!f || Date.now() > f.until || G.state !== 'PLAY' || G.dialog || G.tut || G.gateWalk) return;
  const text = f.ok ? t('save_ok') : t('save_failed');
  c.save(); c.font='600 12px system-ui'; c.textAlign='right';
  const w=Math.min(600,c.measureText(text).width+28);
  c.fillStyle='rgba(5,12,18,.85)'; rr(c,944-w,507,w,25,7); c.fill();
  c.fillStyle=f.ok?'#aef7d8':'#ffd76a'; c.fillText(text,930,524); c.restore();
}
