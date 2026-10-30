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
    'tutorial ' + (G.tutorialLock ? ('LOCK ' + G.tutorialLock.id + ' → ' + G.tutorialLock.action) : 'free'),
  ];
  c.save(); c.setTransform(1,0,0,1,0,0); c.font = '600 11px monospace';
  c.fillStyle = 'rgba(4,8,14,.86)'; c.fillRect(6,6,370,rows.length*15+12);
  c.fillStyle = '#cfe3ef'; c.textAlign='left'; c.textBaseline='top';
  rows.forEach((r,i)=>c.fillText(r,14,12+i*15)); c.restore();
}

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
      try { const u = new URL(location.href); u.searchParams.delete('_v'); location.replace(u.toString()); }
      catch (e) { location.reload(); }
    };
  }
} catch (e) {}


function drawMechanicalTutorialArrow(target) {
  if (!target || typeof c === 'undefined' || typeof cam === 'undefined') return;
  const bob = Math.sin(performance.now() / 260) * 4;
  const sx = typeof worldScreenX === 'function' ? worldScreenX(target.x) : target.x - cam.x;
  const sy = typeof worldScreenY === 'function' ? worldScreenY(target.y) : target.y - cam.y;
  // The glyph is drawn pointing DOWN and turned to the step's direction:
  // 'up' floats above her head pointing up (a door entered with UP), 'right'
  // and 'left' stand short of the target pointing the way to walk.
  const dir = target.dir || 'down';
  let x = sx, y = sy - 82 + bob, rot = 0;
  if (dir === 'up') { y = sy - 136 - bob; rot = Math.PI; }
  else if (dir === 'right') { x = sx - 64 + bob; y = sy - 44; rot = -Math.PI / 2; }
  else if (dir === 'left') { x = sx + 64 - bob; y = sy - 44; rot = Math.PI / 2; }
  const col='#37ffd0', dark='#14242b', steel='#35505a', hi='#9fffea';
  // THE KEY, BESIDE THE ARROW. A door asks for UP; the arrow says up, and the
  // cap next to it says which control is up on this player's hands.
  if (dir === 'up' && target.key) {
    const pu = 0.6 + Math.sin(performance.now() / 220) * 0.4;
    c.save();
    c.font = '800 22px "Segoe UI", Tahoma, sans-serif';
    const kw = Math.max(40, c.measureText(target.key).width + 22);
    c.globalAlpha = 0.95; c.shadowColor = col; c.shadowBlur = 8 + pu * 10;
    c.fillStyle = '#e7edef';
    c.beginPath();
    if (c.roundRect) c.roundRect(x + 30, y - 44, kw, 36, 7); else c.rect(x + 30, y - 44, kw, 36);
    c.fill();
    c.shadowBlur = 0; c.fillStyle = '#17262d'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(target.key, x + 30 + kw / 2, y - 25);
    c.restore();
  }
  c.save(); c.translate(x,y); if (rot) c.rotate(rot); c.shadowColor=col; c.shadowBlur=13; c.globalAlpha=.96;
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
