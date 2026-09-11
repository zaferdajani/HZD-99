// CLAWBYTE hero motion services. State selection lives in entities.js.
// No timer impersonation, prototype wrappers, legacy gait fallback or voice swap.
const HERO_MOTION_REVISION = 'hero-motion-2026-09-11-r1';
const HERO_MOTION_KEYS = Object.freeze([
  'heroStates', 'hzdIdle', 'gaitWalk', 'gaitRun', 'transAir', 'transLand',
  'transDash', 'transSkid', 'transWall', 'heroFidget', 'hzdHurt'
]);
const heroMotionLoad = { active: false, started: 0, retryAt: 0, failures: 0 };
function heroMotionMissing() {
  return HERO_MOTION_KEYS.filter(k => {
    const im = MEDIA_RAW[k];
    return !im || !im.complete || !im.naturalWidth || MEDIA_LOW[k] === 2;
  });
}
function heroMotionWarm() {
  for (const k of HERO_MOTION_KEYS) mediaFetch(k, true);
}
function heroMotionGate(dt) {
  if (!G || !player || G.state !== 'PLAY' || (typeof isHero === 'function' && isHero())) {
    heroMotionLoad.active = false;
    return false;
  }
  const missing = heroMotionMissing();
  if (!missing.length) { heroMotionLoad.active = false; heroMotionLoad.started = 0; return false; }
  const now = performance.now();
  heroMotionLoad.active = true;
  if (!heroMotionLoad.started) heroMotionLoad.started = now;
  if (now >= heroMotionLoad.retryAt) { heroMotionWarm(); heroMotionLoad.retryAt = now + 1000; }
  const raw = action => (KEYB[action] || []).some(k => keysP[k]);
  // Loading is escapable, including on a pad; never borrow tutorial input locks.
  if (raw('BACK') || raw('PAUSE')) {
    G.state = 'PAUSE'; G.pauseIdx = 0; heroMotionLoad.active = false;
    clearP(); return true;
  }
  if (raw('OK') && now - heroMotionLoad.started >= 12000) {
    for (const k of missing) delete MEDIA_PEND[k];
    heroMotionLoad.started = now; heroMotionLoad.failures++; heroMotionWarm();
  }
  return true;
}
function drawHeroMotionLoading(ctx) {
  if (!heroMotionLoad.active || G.state !== 'PLAY') return false;
  const missing = heroMotionMissing(), done = HERO_MOTION_KEYS.length - missing.length;
  ctx.save();
  ctx.fillStyle = '#070f19'; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e4fff8'; ctx.font = 'bold 25px sans-serif';
  ctx.fillText('Loading character animations', 480, 238);
  ctx.fillStyle = '#18483f'; ctx.fillRect(280, 282, 400, 8);
  ctx.fillStyle = '#37ffd0'; ctx.fillRect(280, 282, 400 * done / HERO_MOTION_KEYS.length, 8);
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#a6c9c2';
  ctx.fillText(done + ' / ' + HERO_MOTION_KEYS.length + '   ·   ' + howToOpen('BACK') + ' — Pause', 480, 322);
  if (performance.now() - heroMotionLoad.started >= 12000)
    ctx.fillText((typeof TOUCH !== 'undefined' && TOUCH.enabled) ? 'Reconnecting automatically. Use Pause to leave.' : 'Animation download stalled. ' + howToOpen('OK') + ' — Retry', 480, 358);
  ctx.restore();
  return true;
}
// Interpolate adjoining authored frames and short cross-clip handovers in the
// same local foot coordinates. This adds no invented animation assets.
function drawHeroMotionCell(p, ctx, key, frame, cells, cx, base, height, flip) {
  const im = MEDIA_RAW[key];
  if (!im || !im.complete || !im.naturalWidth) { mediaFetch(key, true); return false; }
  const cyclic = key === HERO_GAIT.walk.key || key === HERO_GAIT.run.key || key === HERO_IDLE.key;
  const f = cyclic ? ((frame % cells) + cells) % cells : clamp(frame, 0, cells - 1);
  const target = { key, f, cells, cx, base, height, flip: !!flip, cyclic };
  const now = p.anim || 0;
  const old = p._motionPose;
  if (old && old.key !== key) {
    p._motionBlend = { from: old, started: now, duration: key === 'transLand' ? 0.055 : 0.09 };
  }
  // Add the premultiplied layers in an offscreen buffer. Drawing two half-
  // alpha sprites directly with source-over made the hero fade at every blend.
  if (!p._motionCanvas) {
    p._motionCanvas = document.createElement('canvas');
    p._motionCanvas.width = 512; p._motionCanvas.height = 512;
  }
  const out = p._motionCanvas.getContext('2d');
  out.setTransform(1,0,0,1,0,0); out.clearRect(0,0,512,512);
  out.setTransform(3,0,0,3,256,384);
  out.globalCompositeOperation = 'lighter'; out.globalAlpha = 1;
  function paint(pose, alpha) {
    const image = MEDIA_RAW[pose.key];
    if (!image || alpha <= 0.001) return;
    const cw = image.naturalWidth / pose.cells, h = pose.height, w = h * cw / image.naturalHeight;
    const first = Math.floor(pose.f), mix = pose.f - first;
    const next = pose.cyclic ? (first + 1) % pose.cells : Math.min(first + 1, pose.cells - 1);
    out.save(); out.translate(pose.cx, pose.base);
    if (pose.flip) out.scale(-1, 1);
    const inherited = out.globalAlpha;
    out.globalAlpha = inherited * alpha * (1 - mix);
    out.drawImage(image, first * cw, 0, cw, image.naturalHeight, -w / 2, -h, w, h);
    if (mix > 0.001) {
      out.globalAlpha = inherited * alpha * mix;
      out.drawImage(image, next * cw, 0, cw, image.naturalHeight, -w / 2, -h, w, h);
    }
    out.restore();
  }
  let mix = 1;
  if (p._motionBlend) {
    const t = clamp((now - p._motionBlend.started) / p._motionBlend.duration, 0, 1);
    mix = t * t * (3 - 2 * t);
    if (t >= 1) p._motionBlend = null;
  }
  if (p._motionBlend) paint(p._motionBlend.from, 1 - mix);
  paint(target, mix);
  ctx.drawImage(p._motionCanvas, -256 / 3, -128, 512 / 3, 512 / 3);
  p._motionPose = target;
  G.lastStrip = key + ':' + Math.floor(f);
  G.heroMotion = { revision: HERO_MOTION_REVISION, key, frame: f, blend: mix, scale: HERO_SCREEN_SCALE };
  return true;
}
heroMotionWarm();
