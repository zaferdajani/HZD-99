// CLAWBYTE — lightweight diagnostics + live repair hooks
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

// Full authored running stride: never wrap at the opposite-foot contact.
try {
  if (typeof HERO_GAIT !== 'undefined' && HERO_GAIT.run) {
    HERO_GAIT.run.from = 0;
    HERO_GAIT.run.to = HERO_GAIT.run.cells - 1;
  }
} catch (e) {}

// Opening-film resilience for dev/source pages and browsers choosing either codec.
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

// ---------------------------------------------------------------------------
// WEB UPDATE LOOP GUARD — 2026-09-10
// GitHub Pages/CDN can serve an older cached index for a few seconds while a
// deployment propagates. The old checker interpreted any different BUILD_ID as
// "newer", so a v4.5 client could be offered v4.3 and repeatedly reload itself.
// On github.io there is nothing to install: a normal navigation already loads
// the deployed site. Disable the in-game updater there and clear stale banners.
// Desktop/offline builds keep their existing update behavior.
// ---------------------------------------------------------------------------
try {
  if (typeof location !== 'undefined' && /(^|\.)github\.io$/i.test(location.hostname)) {
    if (typeof G !== 'undefined') G.updateReady = null;
    if (typeof checkForUpdate === 'function') checkForUpdate = function() {
      if (typeof G !== 'undefined') G.updateReady = null;
    };
    if (typeof applyUpdate === 'function') applyUpdate = function() {
      if (typeof G !== 'undefined') G.updateReady = null;
      // Remove every legacy cache-buster instead of adding another one.
      try {
        const u = new URL(location.href);
        u.searchParams.delete('_v');
        location.replace(u.toString());
      } catch (e) { location.reload(); }
    };
  }
} catch (e) {}

// ---------------------------------------------------------------------------
// CONTEXTUAL TUTORIAL ACTION LOCKS — owner ruling 2026-09-10
// A new verb is announced only at the exact place it is usable. At that moment
// the scene pauses around the player, every unrelated gameplay input is rejected,
// and the requested verb is the only action that advances the lesson.
// ---------------------------------------------------------------------------
const TUT_LOCK_ACTION = { jump:'JUMP', gate:'UP', atk:'ATK', heal:'HEAL', skill:'SKILL' };
let _tutOldAllows = null, _tutOldDraw = null;

function tutLockStep() {
  try {
    if (!G || !G.tut || !TUT_STEPS || !TUT_STEPS[G.tut.i]) return null;
    return TUT_STEPS[G.tut.i];
  } catch (e) { return null; }
}
function tutLiveEnemy() {
  return (G.enemies || []).find(e => e && !e.dead && e.hp > 0) || null;
}
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
    // The original trigger only looked for blocks one or TWO tiles above the
    // player's feet. W2's first teaching obstacle is a one-tile terrain rise,
    // so the hero could simply walk/step across it and the detector never saw
    // anything. Detect the actual floor rise at FEET height too.
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
function tutGateReady() {
  if (!player || !player.on) return false;
  try { return typeof gateHere === 'function' && !!gateHere(); } catch(e) { return false; }
}
function tutHealReady() {
  if (!player || typeof player.maxCores !== 'function') return false;
  return player.cores < player.maxCores();
}
function tutSkillReady() {
  return !!(G.save && G.save.iq > 0 && G.state === 'PLAY');
}
function tutShouldLock(id) {
  if (G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk) return false;
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
      if (!e.__tutFrozen) {
        e.__tutFrozen = { update: e.update, vx:e.vx, vy:e.vy };
        if (typeof e.update === 'function') e.update = function(){};
      }
      e.vx = 0; e.vy = 0;
    } else if (e.__tutFrozen) {
      if (e.__tutFrozen.update) e.update = e.__tutFrozen.update;
      e.vx = e.__tutFrozen.vx || 0; e.vy = e.__tutFrozen.vy || 0;
      delete e.__tutFrozen;
    }
  }
}
function tutReleaseLock() {
  if (!G || !G.tutHardLock) return;
  tutFreezeEnemies(false);
  G.tutHardLock = null;
}
function tutLockTick() {
  if (!G || !player) return;
  const s = tutLockStep();
  if (!s || G.save.flags.tut) { tutReleaseLock(); return; }
  const action = TUT_LOCK_ACTION[s.id];
  if (!action) { tutReleaseLock(); return; }
  if (G.tutHardLock && G.tutHardLock.id !== s.id) tutReleaseLock();
  if (!G.tutHardLock && tutShouldLock(s.id)) {
    G.tutHardLock = { active:true, id:s.id, action:action, x:player.x };
    player.vx = 0;
    if (player.on) player.vy = 0;
    tutFreezeEnemies(true);
    for (const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','VL','VR','VU','VD','GP_L','GP_R','GP_U','GP_D']) {
      if (typeof keys !== 'undefined') keys[k]=0;
      if (typeof keysP !== 'undefined') keysP[k]=0;
    }
  }
  if (G.tutHardLock && G.tutHardLock.active) {
    // A hard lock means hard: no residual velocity, step-up or held-stick frame
    // is allowed to carry the hero past the teaching marker while the card is up.
    if (Number.isFinite(G.tutHardLock.x)) player.x = G.tutHardLock.x;
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

try {
  if (typeof drawTutor === 'function') {
    _tutOldDraw = drawTutor;
    drawTutor = function() {
      tutLockTick();
      const s = tutLockStep();
      if (s && TUT_LOCK_ACTION[s.id] && !(G.tutHardLock && G.tutHardLock.id === s.id)) return;
      return _tutOldDraw();
    };
  }
} catch (e) {}

try {
  if (typeof clearP === 'function') {
    const _clearP = clearP;
    clearP = function() { tutLockTick(); return _clearP(); };
  }
} catch (e) {}
