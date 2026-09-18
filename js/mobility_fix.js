// CLAWBYTE hero motion services. State selection lives in entities.js.
// No timer impersonation, prototype wrappers, legacy gait fallback or voice swap.
const HERO_MOTION_REVISION = 'hero-motion-2026-09-18-sprites';
const HERO_MOTION_KEYS = Object.freeze([
  'heroStates', 'hzdIdle', 'gaitWalk', 'gaitRun', 'transAir', 'transLand',
  'transDash', 'transSkid', 'transWall', 'heroFidget', 'hzdHurt'
]);
// `done` is SAMPLED IN UPDATE, never recomputed in draw — see the loading screen
// below for why that distinction is load-bearing.
const heroMotionLoad = { active: false, started: 0, retryAt: 0, failures: 0, done: 0, t: 0 };
function heroMotionMissing() {
  return HERO_MOTION_KEYS.filter(k => {
    const im = MEDIA_RAW[k];
    return !im || !im.complete || !im.naturalWidth || MEDIA_LOW[k] === 2;
  });
}
function heroMotionWarm(bust) {
  for (const k of HERO_MOTION_KEYS) mediaFetch(k, true, bust);
}
let heroWeaponWarmMode = null;
function heroMotionGate(dt) {
  if (!G || !player || G.state !== 'PLAY' || (typeof isHero === 'function' && isHero())) {
    heroMotionLoad.active = false;
    return false;
  }
  const equipped=weaponMode(G.save);
  if(equipped!==heroWeaponWarmMode){warmHeroWeaponArt(equipped);heroWeaponWarmMode=equipped;}
  const missing = heroMotionMissing();
  heroMotionLoad.done = HERO_MOTION_KEYS.length - missing.length;
  if (!missing.length) { heroMotionLoad.active = false; heroMotionLoad.started = 0; return false; }
  const now = performance.now();
  heroMotionLoad.active = true;
  // the loading screen's own clock, advanced HERE because draw may not keep
  // state — see the note on the draw function below
  heroMotionLoad.t += dt;
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
    heroMotionLoad.started = now; heroMotionLoad.failures++;
    // bust: a stuck retry must reach the network, not the same cached miss
    // sw.js will hand back forever — see mediaFetch's `bust` param.
    heroMotionWarm(true);
  }
  return true;
}
// DRAW MUST NOT POLL THE DECODER. This read its own progress by calling
// heroMotionMissing() — which asks every image whether it is `.complete` — from
// inside draw(). Decoding finishes on another thread, so that answer can change
// between two draws of the SAME frame, and the progress bar then renders two
// different widths from one game state.
//
// tests/meadow.cjs is the harness that caught it: it draws one frame twice with
// performance.now and Math.random frozen and requires the two to be identical,
// and it went from four clean runs to failing two in three the moment six hero
// strips were replaced at once — five of them in HERO_MOTION_KEYS, so the
// loading gate was open during the measurement where it had previously closed
// before the test looked. The bug was always here; more art to decode only
// widened the window onto it.
//
// So the count comes from heroMotionGate, which runs in UPDATE where sampling
// mutable state is what you are supposed to do.
// SHE IS ALREADY IN THE PAGE, SO SHE MAY AS WELL RUN.
//
// This screen used to be a title, a bar and a fraction, and the owner asked the
// obvious question: why is the loading screen not showing anything? The answer
// was that nothing had loaded yet — which is false, and provably so. build.cjs
// embeds heroStates, hzdIdle, gaitWalk and gaitRun into the page as data URIs,
// so they cost no request and are decoded before this screen can appear. They
// are also four of the eleven keys in HERO_MOTION_KEYS, which is why the count
// starts at 4 and not 0: this screen waits on the SEVEN it does not have while
// sitting on a sixteen-frame run cycle it never drew.
//
// So the bar becomes ground and she runs along it, at the real stride, from the
// real sheet. No new asset, no extra byte, nothing to download.
function drawHeroMotionLoading(ctx) {
  if (!heroMotionLoad.active || G.state !== 'PLAY') return false;
  const done = heroMotionLoad.done;
  const frac = done / HERO_MOTION_KEYS.length;
  ctx.save();
  ctx.fillStyle = '#070f19'; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e4fff8'; ctx.font = 'bold 25px sans-serif';
  ctx.fillText('Loading character animations', 480, 196);
  ctx.fillStyle = '#18483f'; ctx.fillRect(280, 312, 400, 8);
  ctx.fillStyle = '#37ffd0'; ctx.fillRect(280, 312, 400 * frac, 8);
  // ...and the runner on top of it. Degrades to the bar alone if the sheet is
  // somehow absent: a loading screen is the last place to risk throwing.
  {
    const G2 = typeof HERO_GAIT !== 'undefined' && HERO_GAIT && HERO_GAIT.run;
    const im = G2 && typeof MEDIA_RAW !== 'undefined' ? MEDIA_RAW[G2.key] : null;
    if (im && im.complete && im.naturalWidth) {
      const cells = G2.cells || 16;
      const cw = im.naturalWidth / cells, ch = im.naturalHeight;
      // 84 tall, standing ON the bar: her head then clears the title by a
      // comfortable margin. The first cut drew her 96 tall on a bar at 282 and
      // she ran straight through the words, which a screenshot showed at once
      // and no measurement would have.
      const h = 84, w = h * cw / ch;
      // 13 cells/s is the run's own pace; she rides the filled end of the bar
      const f = Math.floor(heroMotionLoad.t * 13) % cells;
      const x = 280 + 400 * frac, y = 312;
      ctx.save();
      // a soft contact shadow so she is standing on the bar, not floating over it
      ctx.globalAlpha = 0.33; ctx.fillStyle = '#04121a';
      ctx.beginPath(); ctx.ellipse(x, y + 1, 16, 4, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.drawImage(im, f * cw, 0, cw, ch, x - w / 2, y - h + 2, w, h);
      ctx.restore();
    }
  }
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#a6c9c2';
  ctx.fillText(done + ' / ' + HERO_MOTION_KEYS.length + '   ·   ' + howToOpen('BACK') + ' — Pause', 480, 348);
  if (performance.now() - heroMotionLoad.started >= 12000)
    ctx.fillText((typeof TOUCH !== 'undefined' && TOUCH.enabled) ? 'Reconnecting automatically. Use Pause to leave.' : 'Animation download stalled. ' + howToOpen('OK') + ' — Retry', 480, 382);
  ctx.restore();
  return true;
}
// Authored sprite frames are complete drawings. Cross-fading their silhouettes
// creates doubled heads and paws; select one frame and preserve its alpha.
function drawHeroMotionCell(p, ctx, key, frame, cells, cx, base, height, flip) {
  const im = MEDIA_RAW[key];
  if (!im || !im.complete || !im.naturalWidth) { mediaFetch(key, true); return false; }
  const cyclic = (HERO_GAIT && (key === HERO_GAIT.walk.key || key === HERO_GAIT.run.key))
              || (HERO_IDLE && key === HERO_IDLE.key);
  const f = Math.floor(cyclic ? ((frame % cells) + cells) % cells : clamp(frame, 0, cells - 1));
  const drew = drawStripCell(ctx, key, f, cells, cx, base, height, flip);
  if (!drew) return false;
  p._motionPose = { key, f, cells, cx, base, height, flip: !!flip, cyclic };
  p._motionBlend = null;
  G.heroMotion = { revision: HERO_MOTION_REVISION, key, frame: f, blend: 1, scale: HERO_SCREEN_SCALE };
  return true;
}

heroMotionWarm();
