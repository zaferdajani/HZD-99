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

// Charged locomotion VFX. State selection and idle timing live in Player,
// not in monkey patches that temporarily rewrite simulation state.
(() => {
  if (typeof Player === 'undefined' || Player.prototype.__chargeEffectsInstalled) return;
  Player.prototype.__chargeEffectsInstalled = true;
  const draw = Player.prototype.draw;
  Player.prototype.draw = function(ctx) {
    const out = draw.call(this, ctx);
        if (this.chargeT > 0.25 && ctx && typeof ctx.save === 'function' && typeof G !== 'undefined' && G.state === 'PLAY') {
          const k = Math.min(1, (this.chargeT - 0.25) / 0.35);
          const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
          const cx = this.x + this.w / 2, cy = this.y + this.h * 0.48;
          const dir = this.face || 1;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineCap = 'round';
          const glow = (G.roomDef && typeof PAL !== 'undefined' && PAL[G.roomDef.zone] && PAL[G.roomDef.zone].glow) || '#37ffd0';
          ctx.shadowColor = glow; ctx.shadowBlur = 10 + 10 * k;
          ctx.strokeStyle = glow; ctx.lineWidth = 1.5 + 1.2 * k;
          ctx.globalAlpha = 0.38 + 0.34 * k;
          for (let i = 0; i < 3; i++) {
            const a = t * (3.2 + i * .55) + i * 2.1;
            const rx = 17 + i * 5 + k * 5, ry = 10 + i * 3 + k * 3;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, a * .18, a, a + 1.65);
            ctx.stroke();
          }
          // The charge is held FORWARD even while the legs run underneath it.
          const hx = cx + dir * (18 + 8 * k), hy = cy - 4 + Math.sin(t * 8) * 1.5;
          const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, 9 + 6 * k);
          g.addColorStop(0, 'rgba(255,255,255,.95)');
          g.addColorStop(.28, glow);
          g.addColorStop(1, 'rgba(55,255,208,0)');
          ctx.fillStyle = g; ctx.globalAlpha = .78;
          ctx.beginPath(); ctx.arc(hx, hy, 9 + 6 * k, 0, Math.PI * 2); ctx.fill();
          // Motion ribbon makes a charged run/jump read as a charged MOVE, not
          // a normal gait with an unrelated circle pasted on top.
          if (Math.abs(this.vx || 0) > 34 || !this.on) {
            ctx.strokeStyle = glow; ctx.lineWidth = 2 + k; ctx.globalAlpha = .28 + .25 * k;
            ctx.beginPath();
            ctx.moveTo(cx - dir * 7, cy + 7);
            ctx.quadraticCurveTo(cx - dir * 23, cy + Math.sin(t * 7) * 5, cx - dir * (35 + Math.min(20, Math.abs(this.vx || 0) * .04)), cy + 2);
            ctx.stroke();
          }
          ctx.restore();
        }
    return out;
  };
})();
