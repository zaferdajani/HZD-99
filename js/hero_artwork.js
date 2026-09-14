// Owner-linked CLAWBYTE artwork; direct render functions, no prototype patches.
// Gait and simulation remain owned by the existing Player implementation.
// Source pixels, registration and excluded FX-only cells are in OWNER_HERO_SHEET.
const OWNER_HERO_ART_REVISION = 'owner-sheet-20260914-r1';
const OWNER_HERO_ATLAS_KEY = 'heroOwnerAtlas';
function ownerHeroImage() {
  if (typeof MEDIA_RAW === 'undefined') return null;
  const im = MEDIA_RAW[OWNER_HERO_ATLAS_KEY];
  return im && im.complete && im.naturalWidth > 0 ? im : null;
}
function ownerHeroFrame(p, ctx, clip, ordinal, options = {}) {
  const im = ownerHeroImage();
  if (!im || typeof OWNER_HERO_SHEET === 'undefined') return false;
  const ids = OWNER_HERO_SHEET.clips[clip];
  if (!ids || !ids.length) return false;
  const n = Math.max(0, Math.min(ids.length - 1, Math.floor(ordinal)));
  // Explosion/dust-only cells never replace the hero's body.
  if ((clip === 'heavy' && n === 13) || (clip === 'death' && n >= 4)
      || (clip === 'plunge' && n === 5)) return false;
  const f = OWNER_HERO_SHEET.frames[ids[n]], a = f.atlas;
  const s = OWNER_HERO_SHEET.scale_world_per_source_pixel;
  const airborne = options.center === true || (options.center !== false && f.anchor === 'center');
  const anchorY = airborne ? f.body_center_y : OWNER_HERO_SHEET.ground_anchor_y;
  const base = airborne ? -18 : HERO_FLOOR;
  const trim = f.trim_offset || [0,0];
  ctx.save();
  try {
    // Front-facing idle does not get mirrored twice. Other clips inherit facing.
    if (options.front && p.faceVis < 0) ctx.scale(-1, 1);
    ctx.drawImage(im, a[0], a[1], a[2], a[3],
      (trim[0]-OWNER_HERO_SHEET.anchor_x) * s, base + (trim[1]-anchorY) * s, a[2] * s, a[3] * s);
  } finally { ctx.restore(); }
  p._motionPose = null; p._motionBlend = null; // do not resume a stale gait blend after another action
  G.lastStrip = 'owner:' + clip + ':' + n;
  G.heroDrawn = G.lastStrip;
  G.ownerHeroArt = { revision:OWNER_HERO_ART_REVISION, clip, frame:n,
    source:OWNER_HERO_SHEET.source_sha256 };
  return true;
}
function ownerHeroPhase(p, ctx, clip, phase, order, options) {
  const seq = order || OWNER_HERO_SHEET.clips[clip].map((_, i) => i);
  const t = Math.max(0, Math.min(.999999, phase));
  return ownerHeroFrame(p, ctx, clip, seq[Math.floor(t * seq.length)], options);
}
function ownerHeroDrawSwing(p, ctx) {
  const sv = p.swingVis;
  if (!sv || sv.swirl || sv.wield || sv.twin || !(sv.t > 0) || !(sv.t0 > 0)
      || !ownerHeroImage()) return false;
  // No sword/dual/joined frames exist here. Never change ownership, purification,
  // range, damage, hitstop, collision or timers to accommodate a picture.
  const mode = sv.weaponMode || (typeof weaponMode === 'function' ? weaponMode() : 'claws');
  if (mode !== 'claws') return false;
  if (!sv.ownerSheetClip) {
    const down = (p.swing && p.swing.ay > 0) || Math.sin(sv.ang || 0) > .65;
    sv.ownerSheetClip = sv.charged ? 'heavy'
      : !p.on ? (down ? 'plunge' : 'air_attack')
      : sv.combo === 2 ? 'upper' : sv.combo === 1 ? 'double' : 'jab';
  }
  const clip = sv.ownerSheetClip;
  const phase = Math.max(0, Math.min(.999999, 1 - sv.t / sv.t0));
  let ord;
  if (clip === 'heavy') {
    // Releasing begins with the striking arc, not another charge over an active hit.
    ord = [8,9,10,11,12,11,9,0][Math.floor(phase * 8)];
  } else if (clip === 'jab') {
    // Existing melee activates on the next tick. Anticipation is below one tick;
    // later contact/recovery follows the existing .24-second visual timer.
    ord = phase < .055 ? 0 : phase < .22 ? 1 : phase < .43 ? 2 : phase < .70 ? 3 : 4;
  } else if (clip === 'double' || clip === 'upper') {
    ord = phase < .045 ? 0 : phase < .2 ? 1 : phase < .38 ? 2
      : phase < .56 ? 3 : phase < .70 ? 4 : phase < .88 ? 5 : 0;
  } else if (clip === 'plunge') {
    ord = Math.min(4, Math.floor(phase * 5));
  } else {
    ord = Math.min(5, Math.floor(phase * 6));
  }
  const ok = ownerHeroFrame(p, ctx, clip, ord, {center:!p.on});
  // The source contains the claw arc; do not overlay the legacy body-following
  // rake a second time. Gameplay impact sparks and audio are still separate.
  p.ownerSheetSwingDrawn = ok;
  return ok;
}
function ownerHeroDrawMovement(p, ctx, st) {
  // Explicit owner constraint: preserve existing gait cells, frame phases,
  // foot plants, acceleration, speed, jump/dash trajectory and collision.
  if (/^(walk_|run_)/.test(st)) return false;
  if (!ownerHeroImage()) return false;
  // A still-named state never extends the physical action's lifetime.
  if ((st === 'land' && !(p.landT > 0)) || (st === 'dash' && !(p.dashT > 0))
      || (st === 'hurt' && !(p.hurtPoseT > 0))) return false;
  if (st === 'idle' && p.on && p.idleT <= FIDGET_AFTER && p.heroMood(st) === 'calm')
    return ownerHeroFrame(p,ctx,'idle',Math.floor((p.anim || 0)*8)%8,{front:true,center:false});
  if (st === 'rise' || st === 'apex' || st === 'fall') {
    const t = Math.max(0,Math.min(.999999,((p.vy || 0)+770)/1470));
    return ownerHeroPhase(p,ctx,'jump',t,[1,2,3,4,5],{center:true});
  }
  if (st === 'land' && p.on && Math.abs(p.vx || 0) <= 34) {
    const t=Math.max(0,Math.min(.999999,1-p.landT/(p.land0 || .12)));
    // Compression -> rise selected by actual poses, not duplicated printed IDs.
    if (t < .24) return ownerHeroFrame(p,ctx,'fall_land',5,{center:false});
    if (t < .55) return ownerHeroFrame(p,ctx,'fall_land',3,{center:false});
    if (t < .8) return ownerHeroFrame(p,ctx,'fall_land',2,{center:false});
    return ownerHeroFrame(p,ctx,'idle',0,{front:true,center:false});
  }
  if (st === 'dash')
    return ownerHeroPhase(p,ctx,'dash',1-p.dashT/(p.dash0 || .16),[0,1,2],{center:!p.on});
  if (st === 'hurt')
    return ownerHeroPhase(p,ctx,'hurt',1-p.hurtPoseT/.3,[0,1,2,1,0],{center:!p.on});
  if (st === 'charge' && p.on && Math.abs(p.vx || 0) <= 34
      && (typeof weaponMode !== 'function' || weaponMode()==='claws')) {
    const elapsed=Math.max(0,p.chargeT || 0);
    const frame=elapsed<.6 ? Math.min(7,Math.floor(elapsed/.6*8))
      : [5,6,7,6][Math.floor((elapsed-.6)*8)%4];
    return ownerHeroFrame(p,ctx,'heavy',frame,{center:false});
  }
  // The source lacks wall-cling, Yalla foot-tap, heal/song and weapon sequences.
  return false;
}
function ownerHeroDrawDeath(p, ctx) {
  if (!p.dead || !G || G.state !== 'DEAD' || !ownerHeroImage()
      || (typeof isHero === 'function' && isHero())) return false;
  const elapsed=Math.max(0,1.8-(G.deadT || 0));
  const frame=Math.min(3,Math.floor(elapsed/.13));
  ctx.save();
  try {
    ctx.translate(p.x+p.w/2,p.y+p.h);
    ctx.scale((p.face || 1)*HERO_SCREEN_SCALE,HERO_SCREEN_SCALE);
    return ownerHeroFrame(p,ctx,'death',frame,{center:false});
  } finally { ctx.restore(); }
}
