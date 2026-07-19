// CLAWBYTE — mobile touch controls in side gutters OUTSIDE the game frame
// (auto-detected; the game canvas shrinks and controls live in the letterbox)
const TOUCH = {
  enabled: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
  joy: null, held: {}, portrait: false, fsTried: false, gut: 130,
};
let tc = null, tcx = null;
function tcSetup() {
  tc = document.getElementById('tc');
  if (!tc) {
    tc = document.createElement('canvas'); tc.id = 'tc';
    tc.style.cssText = 'position:fixed;inset:0;z-index:5;';
    document.body.appendChild(tc);
  }
  tcx = tc.getContext('2d');
  tc.style.display = 'block'; tc.style.pointerEvents = 'auto';
  tc.style.touchAction = 'none';
  tcResize();
  addEventListener('resize', tcResize);
  addEventListener('orientationchange', tcResize);
  tc.addEventListener('touchstart', tStart, { passive: false });
  tc.addEventListener('touchmove', tMove, { passive: false });
  tc.addEventListener('touchend', tEnd, { passive: false });
  tc.addEventListener('touchcancel', tEnd, { passive: false });
}
function tcResize() {
  const dpr = devicePixelRatio || 1;
  tc.width = innerWidth * dpr; tc.height = innerHeight * dpr;
  tc.style.width = innerWidth + 'px'; tc.style.height = innerHeight + 'px';
  tcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  TOUCH.gut = Math.max(110, Math.min(190, innerWidth * 0.16));
  // shrink the game frame so the gutters are true dead space for fingers
  cv.style.maxWidth = Math.max(320, innerWidth - TOUCH.gut * 2 - 10) + 'px';
}
function tLayout() {
  const r = cv.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const rgx = (r.right + W) / 2, lgx = Math.max(30, r.left / 2);
  const half = TOUCH.gut / 4 + 2;
  return {
    r, W, H, rgx, lgx,
    btns: [
      { code: 'VJUMP', x: rgx, y: H - 64, r: Math.min(46, TOUCH.gut / 2 - 8), icon: '⤒', show: () => true },
      { code: 'VATK', x: rgx, y: H - 152, r: 34, icon: '⟡', show: () => true },
      { code: 'VDASH', x: rgx - half, y: H - 224, r: 24, icon: '≫', show: () => G.save && G.save.abil.dash },
      { code: 'VCAST', x: rgx + half, y: H - 224, r: 24, icon: '◎', show: () => G.save && G.save.abil.emp },
      { code: 'VHEAL', x: rgx, y: H - 292, r: 28, icon: '✚', show: () => true },
      { code: 'VINT', x: lgx, y: H - 226, r: 27, icon: 'E', show: () => !!G.near },
    ],
    corners: [
      { code: 'VPAUSE', x: rgx, y: 28, r: 17, icon: '▐▌' },
      { code: 'VMAP', x: rgx, y: 70, r: 17, icon: '▦' },
      { code: 'VCREST', x: rgx, y: 112, r: 17, icon: '◇' },
      { code: 'VSKILL', x: rgx, y: 154, r: 17, icon: '◈' },
    ],
  };
}
function tPress(code) { keys[code] = 1; keysP[code] = 1; }
function tSetK(code, on) {
  if (on && !keys[code]) { keys[code] = 1; keysP[code] = 1; }
  else if (!on) keys[code] = 0;
}
function tStateKind() {
  const s = G.state;
  if (s === 'PLAY') return 'play';
  if (s === 'MENU' || s === 'DIFF' || s === 'PAUSE' || s === 'CREST' || s === 'SHOP' || s === 'RIDDLE' || s === 'SKILLS') return 'menu';
  return 'tap';
}
function tApplyJoy() {
  const j = TOUCH.joy;
  const dx = j ? j.dx : 0, dy = j ? j.dy : 0;
  tSetK('VL', dx < -14); tSetK('VR', dx > 14);
  tSetK('VU', dy < -30); tSetK('VD', dy > 30);
}
function tapMenu(x, y) {
  const st = G.state;
  if (st === 'MENU') {
    const opts = menuOptions();
    const i = Math.round((y - 250) / 40);
    if (i >= 0 && i < opts.length && Math.abs(y - (250 + i * 40)) <= 20) { G.menuIdx = i; tPress('VOK'); }
  } else if (st === 'DIFF') {
    const i = Math.floor((y - 150) / 105);
    if (i >= 0 && i < 3 && y >= 150 && y <= 150 + 3 * 105) { G.diffIdx = i; tPress('VOK'); }
  } else if (st === 'PAUSE') {
    const i = Math.round((y - 190) / 40);
    if (i >= 0 && i < 7 && Math.abs(y - (190 + i * 40)) <= 20) { G.pauseIdx = i; tPress('VOK'); }
  } else if (st === 'CREST') {
    const i = Math.round((y - 170) / 40);
    if (G.save.crests.length && i >= 0 && i < G.save.crests.length && Math.abs(y - (170 + i * 40)) <= 20) { G.crestIdx = i; tPress('VOK'); }
  } else if (st === 'SHOP') {
    const i = Math.round((y - 130) / 46);
    if (i >= 0 && i < SHOP.length && Math.abs(y - (130 + i * 46)) <= 23) { G.shopIdx = i; tPress('VOK'); }
  } else if (st === 'RIDDLE') {
    const i = Math.round((y - 300) / 44);
    if (G.riddle && i >= 0 && i < G.riddle.def.choices.length && Math.abs(y - (300 + i * 44)) <= 22) { G.riddle.sel = i; tPress('VOK'); }
  } else if (st === 'SKILLS') {
    for (let i = 0; i < SKILLS.length; i++) {
      const px2 = 330 + (i % 2) * 300, py2 = 150 + Math.floor(i / 2) * 105;
      if (Math.hypot(x - px2, y - py2) < 42) { G.skillIdx = i; tPress('VOK'); break; }
    }
  }
}
function tStart(e) {
  e.preventDefault();
  audioOn();
  if (!TOUCH.fsTried) {
    TOUCH.fsTried = true;
    try {
      const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => {});
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (err) {}
  }
  const L = tLayout(), kind = tStateKind();
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    if (kind === 'play') {
      let hit = null;
      for (const b of L.corners) if (Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (!hit) for (const b of L.btns) if (b.show() && Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (hit) { TOUCH.held[t.identifier] = hit.code; tPress(hit.code); }
      else if (x < L.r.left + 20 && y > 150 && !TOUCH.joy) {
        TOUCH.joy = { id: t.identifier, ox: Math.min(x, L.r.left - 26), oy: y, dx: 0, dy: 0 };
      }
    } else if (kind === 'menu') {
      if (Math.hypot(x - L.rgx, y - 28) < 26) { tPress('VBACK'); continue; }
      if (x >= L.r.left && x <= L.r.right && y >= L.r.top && y <= L.r.bottom) {
        tapMenu((x - L.r.left) * 960 / L.r.width, (y - L.r.top) * 540 / L.r.height);
      }
    } else {
      tPress('VOK');
    }
  }
}
function tMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (TOUCH.joy && t.identifier === TOUCH.joy.id) {
      TOUCH.joy.dx = clamp(t.clientX - TOUCH.joy.ox, -52, 52);
      TOUCH.joy.dy = clamp(t.clientY - TOUCH.joy.oy, -52, 52);
      tApplyJoy();
    }
  }
}
function tEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (TOUCH.joy && t.identifier === TOUCH.joy.id) { TOUCH.joy = null; tApplyJoy(); }
    const code = TOUCH.held[t.identifier];
    if (code) { keys[code] = 0; delete TOUCH.held[t.identifier]; }
  }
}
function tCircle(x, y, r, pressed, icon, iconSize) {
  tcx.beginPath(); tcx.arc(x, y, r, 0, 7);
  tcx.fillStyle = pressed ? 'rgba(120,230,255,0.45)' : 'rgba(18,36,52,0.75)';
  tcx.fill();
  tcx.lineWidth = 1.8; tcx.strokeStyle = pressed ? 'rgba(160,240,255,0.95)' : 'rgba(120,200,240,0.55)';
  tcx.stroke();
  if (icon) {
    tcx.font = '700 ' + (iconSize || Math.round(r * 0.85)) + 'px "Segoe UI", sans-serif';
    tcx.textAlign = 'center'; tcx.textBaseline = 'middle';
    tcx.fillStyle = 'rgba(230,245,255,0.92)';
    tcx.fillText(icon, x, y + 1);
  }
}
function drawTouchUI() {
  if (!TOUCH.enabled || !tcx) return;
  const W = innerWidth, H = innerHeight;
  tcx.clearRect(0, 0, W, H);
  TOUCH.portrait = H > W;
  if (TOUCH.portrait) {
    tcx.fillStyle = 'rgba(3,6,10,0.95)'; tcx.fillRect(0, 0, W, H);
    tcx.font = '700 54px "Segoe UI", sans-serif'; tcx.textAlign = 'center'; tcx.textBaseline = 'middle';
    tcx.fillStyle = '#37ffd0'; tcx.fillText('⟳', W / 2, H * 0.36);
    tcx.font = '700 20px "Segoe UI", sans-serif'; tcx.fillStyle = '#eef3fa';
    tcx.fillText(t('rotate'), W / 2, H * 0.5);
    return;
  }
  const L = tLayout(), kind = tStateKind();
  // gutter panels — the controller frame around the game screen
  tcx.fillStyle = 'rgba(6,11,18,0.92)';
  tcx.fillRect(0, 0, L.r.left, H);
  tcx.fillRect(L.r.right, 0, W - L.r.right, H);
  tcx.strokeStyle = 'rgba(80,160,200,0.25)'; tcx.lineWidth = 1;
  tcx.beginPath(); tcx.moveTo(L.r.left, 0); tcx.lineTo(L.r.left, H);
  tcx.moveTo(L.r.right, 0); tcx.lineTo(L.r.right, H); tcx.stroke();
  if (kind === 'play') {
    for (const b of L.corners) tCircle(b.x, b.y, b.r, !!keys[b.code], b.icon, 12);
    // joystick — left gutter
    if (TOUCH.joy) {
      tCircle(TOUCH.joy.ox, TOUCH.joy.oy, 46, false, null);
      tCircle(TOUCH.joy.ox + TOUCH.joy.dx, TOUCH.joy.oy + TOUCH.joy.dy, 24, true, null);
    } else {
      tcx.globalAlpha = 0.5;
      tCircle(L.lgx, H - 110, Math.min(42, TOUCH.gut / 2 - 10), false, '✥');
      tcx.globalAlpha = 1;
    }
    for (const b of L.btns) if (b.show()) {
      if (b.code === 'VHEAL' && typeof player !== 'undefined' && player && player.volts >= 33 && player.cores < player.maxCores()) {
        const pu = 0.5 + Math.sin(performance.now() / 250) * 0.4;
        const g = tcx.createRadialGradient(b.x, b.y, 3, b.x, b.y, b.r + 10);
        g.addColorStop(0, 'rgba(140,250,200,' + (0.5 * pu + 0.3) + ')');
        g.addColorStop(1, 'rgba(140,250,200,0)');
        tcx.fillStyle = g;
        tcx.beginPath(); tcx.arc(b.x, b.y, b.r + 10, 0, 7); tcx.fill();
      }
      tCircle(b.x, b.y, b.r, !!keys[b.code], b.icon);
    }
  } else if (kind === 'menu') {
    tCircle(L.rgx, 28, 17, false, '✕', 14);
  }
}
if (TOUCH.enabled) tcSetup();
