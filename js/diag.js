// CLAWBYTE — diagnostics + live repair hooks
let DIAG = 0;
try { DIAG = +(new URLSearchParams(location.search).get('diag') || 0) | 0; } catch (e) { DIAG = 0; }
function diagTier(k) {
  const low = (typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW[k]) | 0;
  if (low === 3) return 'full';
  if (low === 2) return 'LOW';
  if (typeof MEDIA_PEND !== 'undefined' && MEDIA_PEND[k]) return 'wait';
  if (typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[k]) return 'full';
  return 'none';
}
function drawDiag() {
  if (!DIAG || typeof c === 'undefined' || typeof G === 'undefined') return;
  const rows = [
    'BUILD ' + ((typeof window !== 'undefined' && window.BUILD_ID) || '?') + '   ' + (G.roomId || '?'),
    'body ' + (G.heroDrawn || '?') + '   vx ' + ((typeof player !== 'undefined' && player) ? Math.round(player.vx) : '?'),
    'run ' + diagTier('gaitRun') + '  walk ' + diagTier('gaitWalk') + '  idle ' + diagTier('hzdIdle'),
    'tutorial ' + (G.tutHardLock && G.tutHardLock.active ? ('LOCK ' + G.tutHardLock.id + ' → ' + G.tutHardLock.action) : 'free'),
  ];
  c.save(); c.setTransform(1,0,0,1,0,0); c.font = '600 11px monospace';
  c.fillStyle = 'rgba(4,8,14,.86)'; c.fillRect(6,6,370,rows.length*15+12);
  c.fillStyle = '#cfe3ef'; c.textAlign='left'; c.textBaseline='top';
  rows.forEach((r,i)=>c.fillText(r,14,12+i*15)); c.restore();
}

// Authoritative locomotion. Start fetching the authored gait immediately so
// the first controllable room never begins on the retired dash/pose fallback.
try {
  if (typeof HERO_GAIT !== 'undefined' && HERO_GAIT) {
    if (HERO_GAIT.run) { HERO_GAIT.run.from = 0; HERO_GAIT.run.to = HERO_GAIT.run.cells - 1; }
    if (HERO_GAIT.walk) { HERO_GAIT.walk.from = 0; HERO_GAIT.walk.to = HERO_GAIT.walk.cells - 1; }
  }
  if (typeof mediaFetch === 'function') {
    mediaFetch('gaitWalk', 1);
    mediaFetch('gaitRun', 1);
    mediaFetch('hzdIdle', 1);
  }
} catch (e) {}

// Keep requesting the proper gait during the intro/loading phase. This is
// deliberately bounded; it is a preload assist, not a permanent polling loop.
try {
  let _gaitWarmFrames = 0;
  const warmGait = () => {
    try {
      if (typeof mediaFetch === 'function') {
        if (!(typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.gaitWalk)) mediaFetch('gaitWalk', 1);
        if (!(typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.gaitRun)) mediaFetch('gaitRun', 1);
        if (!(typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.hzdIdle)) mediaFetch('hzdIdle', 1);
      }
    } catch (e) {}
    if (++_gaitWarmFrames < 180 && typeof requestAnimationFrame === 'function') requestAnimationFrame(warmGait);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(warmGait);
} catch (e) {}

// Opening-film resilience for browsers choosing either codec.
try {
  if (typeof window !== 'undefined') {
    window.VID_FILES = window.VID_FILES || {};
    window.VID_ALT = window.VID_ALT || {};
    for (let i=1;i<=8;i++) {
      const k='intro'+i;
      if (!window.VID_FILES[k]) window.VID_FILES[k]='assets/video/'+k+'.mp4';
      if (!window.VID_ALT[k]) window.VID_ALT[k]='assets/video/'+k+'.webm';
      if (typeof PURIFY_VID !== 'undefined' && !PURIFY_VID[k]) PURIFY_VID[k]=window.VID_FILES[k];
    }
  }
} catch (e) {}

// GitHub Pages update-loop guard.
try {
  if (typeof location !== 'undefined' && /(^|\.)github\.io$/i.test(location.hostname)) {
    if (typeof G !== 'undefined') G.updateReady = null;
    if (typeof checkForUpdate === 'function') checkForUpdate = function() { if (typeof G !== 'undefined') G.updateReady = null; };
    if (typeof applyUpdate === 'function') applyUpdate = function() {
      if (typeof G !== 'undefined') G.updateReady = null;
      try {
        const u = new URL(location.href); u.searchParams.delete('_v'); location.replace(u.toString());
      } catch (e) { location.reload(); }
    };
  }
} catch (e) {}

// ---------------------------------------------------------------------------
// CONTEXTUAL TUTORIAL ACTION LOCKS
// Movement/guidance steps are NEVER hard-locked. Only discrete one-button
// teaching moments can lock, and even those no longer pin player.x.
// ---------------------------------------------------------------------------
const TUT_LOCK_ACTION = { jump:'JUMP', gate:'UP', atk:'ATK', heal:'HEAL', skill:'SKILL' };
let _tutOldAllows = null, _tutOldDraw = null;
function tutLockStep() {
  try { if (!G || !G.tut || !TUT_STEPS || !TUT_STEPS[G.tut.i]) return null; return TUT_STEPS[G.tut.i]; }
  catch (e) { return null; }
}
function tutLiveEnemy() { return (G.enemies || []).find(e => e && !e.dead && e.hp > 0) || null; }
function tutEnemyInClawRange() {
  if (G.roomId !== 'A0' || !player) return false;
  const e = tutLiveEnemy(); if (!e) return false;
  const pc = player.x + player.w/2, ec = e.x + e.w/2;
  const py = player.y + player.h/2, ey = e.y + e.h/2;
  return Math.abs(ec-pc) <= 68 && Math.abs(ey-py) <= 54;
}
function tutJumpAtObstacle() {
  if (G.roomId !== 'W2' || !player || !player.on) return false;
  try {
    const dir = player.vx < -8 ? -1 : (player.vx > 8 ? 1 : (player.face < 0 ? -1 : 1));
    const feetTy = Math.floor((player.y + player.h - 2) / TILE);
    const edge = dir > 0 ? player.x + player.w : player.x;
    for (let px=8; px<=72; px+=6) {
      const tx = Math.floor((edge + dir*px) / TILE);
      if (solidAt(tx, feetTy) || solidAt(tx, feetTy-1) || solidAt(tx, feetTy-2)) return true;
    }
  } catch (e) {}
  return false;
}
function tutGateReady() { if (!player || !player.on) return false; try { return typeof gateHere === 'function' && !!gateHere(); } catch(e) { return false; } }
function tutHealReady() { return !!(player && typeof player.maxCores === 'function' && player.cores < player.maxCores()); }
function tutSkillReady() { return !!(G.save && G.save.iq > 0 && G.state === 'PLAY'); }
function tutShouldLock(id) {
  if (G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk) return false;
  if (!TUT_LOCK_ACTION[id]) return false;
  if (id === 'atk') return tutEnemyInClawRange();
  if (id === 'jump') return tutJumpAtObstacle();
  if (id === 'gate') return tutGateReady();
  if (id === 'heal') return tutHealReady();
  if (id === 'skill') return tutSkillReady();
  return false;
}
function tutFreezeEnemies(on) {
  for (const e of (G.enemies || [])) {
    if (!e || e.dead) continue;
    if (on) {
      if (!e.__tutFrozen) { e.__tutFrozen = { update:e.update, vx:e.vx, vy:e.vy }; if (typeof e.update === 'function') e.update = function(){}; }
      e.vx = 0; e.vy = 0;
    } else if (e.__tutFrozen) {
      if (e.__tutFrozen.update) e.update = e.__tutFrozen.update;
      e.vx = e.__tutFrozen.vx || 0; e.vy = e.__tutFrozen.vy || 0; delete e.__tutFrozen;
    }
  }
}
function tutReleaseLock() { if (!G || !G.tutHardLock) return; tutFreezeEnemies(false); G.tutHardLock = null; }
function tutLockTick() {
  if (!G || !player) return;
  const s = tutLockStep();
  if (!s || !G.save || !G.save.flags || G.save.flags.tut) { tutReleaseLock(); return; }
  const action = TUT_LOCK_ACTION[s.id];
  if (!action) { tutReleaseLock(); return; }
  if (G.tutHardLock && G.tutHardLock.id !== s.id) tutReleaseLock();
  if (!G.tutHardLock && tutShouldLock(s.id)) {
    G.tutHardLock = { active:true, id:s.id, action:action };
    player.vx = 0;
    if (player.on) player.vy = 0;
    tutFreezeEnemies(true);
    for (const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','VL','VR','VU','VD','GP_L','GP_R','GP_U','GP_D']) {
      if (typeof keys !== 'undefined') keys[k]=0;
      if (typeof keysP !== 'undefined') keysP[k]=0;
    }
  }
  if (G.tutHardLock && G.tutHardLock.active) {
    player.vx = 0;
    tutFreezeEnemies(true);
  }
}
try {
  if (typeof tutAllows === 'function') {
    _tutOldAllows = tutAllows;
    tutAllows = function(a) {
      tutLockTick();
      const L = G && G.tutHardLock;
      if (L && L.active) return a === L.action || a === 'PAUSE' || a === 'BACK';
      return _tutOldAllows(a);
    };
  }
} catch (e) {}

function drawMechanicalTutorialArrow(target) {
  if (!target || typeof c === 'undefined' || typeof cam === 'undefined') return;
  const bob = Math.sin(performance.now() / 260) * 4;
  const x = target.x - cam.x;
  const y = target.y - cam.y - Math.max(112, (target.radius || 30) + 82) + bob;
  const col='#37ffd0', dark='#14242b', steel='#35505a', hi='#9fffea';
  c.save(); c.translate(x,y); c.shadowColor=col; c.shadowBlur=13; c.globalAlpha=.96;
  c.strokeStyle=steel; c.lineWidth=4; c.lineCap='round';
  c.beginPath(); c.moveTo(0,-28); c.lineTo(0,-13); c.moveTo(-14,-20); c.lineTo(-8,-8); c.moveTo(14,-20); c.lineTo(8,-8); c.stroke();
  c.strokeStyle='#0b1419'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,-28); c.lineTo(0,-13); c.stroke();
  c.fillStyle=dark; c.strokeStyle=steel; c.lineWidth=3; c.beginPath(); c.arc(0,0,17,0,Math.PI*2); c.fill(); c.stroke();
  c.fillStyle='#0a1216'; c.strokeStyle=col; c.lineWidth=2; c.beginPath(); c.arc(0,0,8,0,Math.PI*2); c.fill(); c.stroke();
  c.fillStyle=hi; c.beginPath(); c.arc(0,0,3.2,0,Math.PI*2); c.fill();
  c.shadowBlur=0; c.fillStyle='#8aa4ad';
  for (const a of [-2.45,-.7,.7,2.45]) { c.beginPath(); c.arc(Math.cos(a)*13,Math.sin(a)*13,1.7,0,Math.PI*2); c.fill(); }
  c.shadowColor=col; c.shadowBlur=10; c.fillStyle=dark; c.strokeStyle=col; c.lineWidth=2.5;
  c.beginPath(); c.moveTo(-8,15); c.lineTo(8,15); c.lineTo(8,30); c.lineTo(18,30); c.lineTo(0,50); c.lineTo(-18,30); c.lineTo(-8,30); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='rgba(55,255,208,.30)'; c.beginPath(); c.moveTo(-4,19); c.lineTo(4,19); c.lineTo(4,33); c.lineTo(10,33); c.lineTo(0,43); c.lineTo(-10,33); c.lineTo(-4,33); c.closePath(); c.fill();
  c.strokeStyle=hi; c.lineWidth=1; c.globalAlpha=.75; c.beginPath(); c.moveTo(-11,31); c.lineTo(0,44); c.lineTo(11,31); c.stroke(); c.restore();
}
function isFirstShopApproachPrompt(s) {
  if (!s || typeof tutPrompt !== 'function' || !G || G.state !== 'PLAY') return null;
  try { const p=tutPrompt(s); if (!p || !p.target) return null; if (p.label==='tut_approach' && p.hint==='tut_workshop_h') return p; } catch(e) {}
  return null;
}
try {
  if (typeof drawTutor === 'function') {
    _tutOldDraw = drawTutor;
    drawTutor = function() {
      tutLockTick();
      const s=tutLockStep();
      if (s && TUT_LOCK_ACTION[s.id] && !(G.tutHardLock && G.tutHardLock.id===s.id)) return;
      const shopPrompt=isFirstShopApproachPrompt(s);
      if (!shopPrompt) return _tutOldDraw();
      const oldSetDash=c.setLineDash.bind(c), oldStroke=c.stroke.bind(c); let dashed=false;
      c.setLineDash=function(v){ dashed=!!(v&&v.length); return oldSetDash(v); };
      c.stroke=function(){ if(dashed) return; return oldStroke(); };
      try { _tutOldDraw(); }
      finally { c.setLineDash=oldSetDash; c.stroke=oldStroke; try{oldSetDash([]);}catch(e){} }
      drawMechanicalTutorialArrow(shopPrompt.target);
    };
  }
} catch(e) {}
try {
  if (typeof clearP === 'function') {
    const _clearP=clearP;
    clearP=function(){ tutLockTick(); return _clearP(); };
  }
} catch(e) {}