// CLAWBYTE — mobile touch controls in side gutters OUTSIDE the game frame
// (auto-detected; the game canvas shrinks and controls live in the letterbox)
const TOUCH = {
  enabled: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
  joy: null, held: {}, portrait: false, fsTried: false, gut: 130,
  ox: 0, oy: 0, rawW: 0, rawH: 0, vis: null,
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
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', tcResize);
    visualViewport.addEventListener('scroll', tcResize);
  }
  // embedded viewers (e.g. the artifact pane) can cover part of the page with
  // bars that can't be scrolled away — track the sub-rect actually on screen
  if (window.IntersectionObserver) {
    const th = []; for (let i = 0; i <= 50; i++) th.push(i / 50);
    new IntersectionObserver(es => {
      const e = es[es.length - 1];
      TOUCH.vis = e && e.intersectionRect && e.intersectionRect.height > 60 ? e.intersectionRect : null;
      tcResize();
    }, { threshold: th }).observe(document.documentElement);
  }
  tc.addEventListener('touchstart', tStart, { passive: false });
  tc.addEventListener('touchmove', tMove, { passive: false });
  tc.addEventListener('touchend', tEnd, { passive: false });
  tc.addEventListener('touchcancel', tEnd, { passive: false });
}
function tcResize() {
  // size everything from the ACTUAL visible viewport (browser bars change it)
  const vv = window.visualViewport;
  const rawW = Math.round(vv ? vv.width : innerWidth);
  const rawH = Math.round(vv ? vv.height : innerHeight);
  TOUCH.rawW = rawW; TOUCH.rawH = rawH;
  // if a host viewer's chrome covers part of the page, fit into the sub-rect
  // that is really visible (measured by the IntersectionObserver above)
  let OX = 0, OY = 0, W = rawW, H = rawH;
  const vis = TOUCH.vis;
  if (vis && (vis.height < rawH - 24 || vis.width < rawW - 24) && vis.height > 120 && vis.width > 200) {
    OX = Math.max(0, Math.round(vis.left)); OY = Math.max(0, Math.round(vis.top));
    W = Math.round(vis.width); H = Math.round(vis.height);
  }
  TOUCH.ox = OX; TOUCH.oy = OY; TOUCH.vw = W; TOUCH.vh = H;
  const dpr = devicePixelRatio || 1;
  tc.width = W * dpr; tc.height = H * dpr;
  tc.style.right = 'auto'; tc.style.bottom = 'auto';
  tc.style.left = OX + 'px'; tc.style.top = OY + 'px';
  tc.style.width = W + 'px'; tc.style.height = H + 'px';
  tcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  TOUCH.gut = Math.max(96, Math.min(190, W * 0.15));
  // the game frame always fits fully inside the visible area, no scrolling
  const availW = Math.max(300, W - TOUCH.gut * 2 - 8);
  const cw = Math.min(availW, H * 16 / 9), ch = cw * 9 / 16;
  cv.style.maxWidth = 'none'; cv.style.maxHeight = 'none';
  cv.style.position = 'fixed';
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = OX + (W - cw) / 2 + 'px';
  cv.style.top = OY + (H - ch) / 2 + 'px';
  try { scrollTo(0, 0); } catch (e) {}
}
function tLayout() {
  const W = TOUCH.vw || innerWidth, H = TOUCH.vh || innerHeight;
  const rb = cv.getBoundingClientRect();
  // overlay-local coordinates (the overlay may be offset inside a host viewer)
  const r = {
    left: rb.left - TOUCH.ox, right: rb.right - TOUCH.ox,
    top: rb.top - TOUCH.oy, bottom: rb.bottom - TOUCH.oy,
    width: rb.width, height: rb.height,
  };
  const rgx = (r.right + W) / 2, lgx = Math.max(28, r.left / 2);
  // compress spacing on short screens so buttons can never overlap
  const u = clamp(H / 460, 0.6, 1);
  const half = TOUCH.gut / 4 + 2;
  return {
    r, W, H, rgx, lgx, u,
    btns: [
      { code: 'VJUMP', x: rgx, y: H - 60 * u, r: Math.min(44 * u, TOUCH.gut / 2 - 8), icon: '⤒', show: () => true },
      { code: 'VATK', x: rgx, y: H - 148 * u, r: 33 * u, icon: '⟡', show: () => true },
      { code: 'VHEAL', x: rgx, y: H - 230 * u, r: 27 * u, icon: '✚', show: () => true },
      { code: 'VDASH', x: rgx - half, y: H - 304 * u, r: 23 * u, icon: '≫', show: () => G.save && G.save.abil.dash },
      { code: 'VCAST', x: rgx + half, y: H - 304 * u, r: 23 * u, icon: '◎', show: () => G.save && G.save.abil.emp },
      // Feral Claws — the robo-cat's signature power
      { code: 'VCLAW', x: rgx, y: H - 372 * u, r: 24 * u,
        icon: (G.save && G.save.theme === 'hero') ? '⚡' : '⁂',
        show: () => player && player.clawCD <= 0 && player.clawT <= 0 },
      { code: 'VINT', x: lgx, y: H * 0.42, r: 26 * u, icon: 'E', show: () => !!G.near },
    ],
    // menu buttons live in the LEFT column, actions in the right — no clutter
    corners: [
      { code: 'VPAUSE', x: lgx, y: 26 * u + 4, r: 16 * u + 2, icon: '▐▌' },
      { code: 'VMAP', x: lgx, y: 68 * u + 4, r: 16 * u + 2, icon: '▦' },
      { code: 'VCREST', x: lgx, y: 110 * u + 4, r: 16 * u + 2, icon: '◇' },
      { code: 'VSKILL', x: lgx, y: 152 * u + 4, r: 16 * u + 2, icon: '◈' },
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
  if (s === 'MENU' || s === 'LANGSEL' || s === 'DIFF' || s === 'WHO' || s === 'PAUSE' || s === 'CREST' || s === 'SHOP' || s === 'RIDDLE' || s === 'SKILLS' || s === 'TRIAL') return 'menu';
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
    // tap the update banner to take the newer build
    if (G.updateReady && y > 452 && y < 498 && x > 250 && x < 710) {
      if (typeof applyUpdate === 'function') applyUpdate();
      return;
    }
    const opts = menuOptions();
    const i = Math.round((y - 250) / 40);
    if (i >= 0 && i < opts.length && Math.abs(y - (250 + i * 40)) <= 20) { G.menuIdx = i; tPress('VOK'); }
  } else if (st === 'WHO') {
    if (y > 140 && y < 460) { G.whoIdx = x < 480 ? 0 : 1; tPress('VOK'); }
  } else if (st === 'LANGSEL') {
    const i = Math.round((y - 210) / 52);
    if (i >= 0 && i < LANGS.length && Math.abs(y - (210 + i * 52)) <= 24) {
      // tap a row to select it, tap the highlighted row again to confirm & close
      if (i === G.langIdx) tPress('VOK');
      else { G.langIdx = i; LANG = LANGS[i].id; saveMeta(); sfx('ui'); }
    }
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
  } else if (st === 'TRIAL') {
    if (TRI.st === 'menu') {
      for (let i = 0; i < 5; i++) {
        const yy = 175 + i * 52 + (i ? 14 : 0);
        if (Math.abs(y - yy) <= 24) { TRI.sel = i; tPress('VOK'); break; }
      }
    } else if (TRI.st === 'result' || TRI.st === 'pre' || TRI.st === 'between') {
      tPress('VOK');
    } else if (TRI.st === 'play') {
      if (TRI.game === 'mem' && TRI.memPhase === 'input') {
        const pads = [[330, 250, 'VL'], [480, 180, 'VU'], [630, 250, 'VR'], [480, 320, 'VD']];
        for (const [px2, py2, code] of pads)
          if (Math.hypot(x - px2, y - py2) < 46) { tPress(code); break; }
      } else if (TRI.game !== 'mem' && y > 380 && y < 465) {
        const i = Math.round((x - 300) / 180);
        if (i >= 0 && i < 3 && Math.abs(x - (300 + i * 180)) <= 85) tPress(['VL', 'VU', 'VR'][i]);
      }
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
    const x = t.clientX - TOUCH.ox, y = t.clientY - TOUCH.oy;
    if (kind === 'play') {
      let hit = null;
      for (const b of L.corners) if (Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (!hit) for (const b of L.btns) if (b.show() && Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (hit) { TOUCH.held[t.identifier] = hit.code; tPress(hit.code); }
      else if (x < L.r.left + 20 && y > 150 && !TOUCH.joy) {
        TOUCH.joy = { id: t.identifier, ox: Math.min(x, L.r.left - 26), oy: y, dx: 0, dy: 0 };
      }
    } else if (kind === 'menu') {
      if (Math.hypot(x - L.lgx, y - 28) < 28) { tPress('VBACK'); continue; }
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
      TOUCH.joy.dx = clamp(t.clientX - TOUCH.ox - TOUCH.joy.ox, -52, 52);
      TOUCH.joy.dy = clamp(t.clientY - TOUCH.oy - TOUCH.joy.oy, -52, 52);
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
  const vv = window.visualViewport;
  const cw = Math.round(vv ? vv.width : innerWidth), ch = Math.round(vv ? vv.height : innerHeight);
  if (cw !== TOUCH.rawW || ch !== TOUCH.rawH) tcResize();
  const W = TOUCH.vw, H = TOUCH.vh;
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
    tCircle(L.lgx, 28, 18, false, '✕', 14);
  }
}
if (TOUCH.enabled) tcSetup();
