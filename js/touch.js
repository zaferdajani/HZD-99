// CLAWBYTE — mobile touch controls in side gutters OUTSIDE the game frame
// (auto-detected; the game canvas shrinks and controls live in the letterbox)
const TOUCH = {
  enabled: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
  joy: null, held: {}, portrait: false, fsTried: false, gut: 130,
  ox: 0, oy: 0, rawW: 0, rawH: 0, vis: null,
  // custom layout: per-button {fx, fy, k} as fractions of the viewport,
  // persisted so the controller is YOURS (PUBG-style edit screen)
  layout: {}, editSel: null, editDrag: null,
};
try { TOUCH.layout = JSON.parse(localStorage.getItem('cb_touch_layout') || '{}') || {}; } catch (e) { TOUCH.layout = {}; }
function tLayoutSave() { try { localStorage.setItem('cb_touch_layout', JSON.stringify(TOUCH.layout)); } catch (e) {} }
function tBuzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }
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
  // no touch layer (desktop): nothing to lay out — without this guard a
  // CONNECTED GAMEPAD crashed every frame on non-touch devices
  if (!tc) return;
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
  // a connected pad means nothing needs finger room: drop the gutters entirely
  // and let the frame take the whole viewport
  const padOn = (typeof PAD !== 'undefined') && PAD.on;
  TOUCH.gut = padOn ? 0 : Math.max(96, Math.min(190, W * 0.15));
  // the game frame always fits fully inside the visible area, no scrolling
  const availW = Math.max(300, W - TOUCH.gut * 2 - (padOn ? 0 : 8));
  const cw = Math.min(availW, H * 16 / 9), ch = cw * 9 / 16;
  cv.style.maxWidth = 'none'; cv.style.maxHeight = 'none';
  cv.style.position = 'fixed';
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = OX + (W - cw) / 2 + 'px';
  cv.style.top = OY + (H - ch) / 2 + 'px';
  try { scrollTo(0, 0); } catch (e) {}
}
// ---------------------------------------------------------------------------
// THE POWER WHEEL.
//
// A phone has one thumb for actions and about four comfortable places to put
// it. This game grew six situational powers, each of which was given its own
// button as it was built, and the result climbed the right edge of the screen
// into territory a thumb cannot reach without letting go of the device.
//
// They now share one ring. Press the wheel button and the ring fans out around
// it; slide onto a wedge and release to fire it — or tap to open, then tap a
// wedge, which is the same gesture split in two for smaller hands.
//
// EACH POWER OWNS A FIXED SEAT. The ring does not close up when something is on
// cooldown or not yet unlocked — an unavailable power is drawn dim in its own
// place and simply cannot be chosen. If the seats reshuffled as things came and
// went, the muscle memory a wheel exists to build would never form.
// ---------------------------------------------------------------------------
// The ring opens INTO the screen, not around the button. The wheel button lives
// on the right gutter, where a full circle puts half its seats past the edge of
// the phone — so the seats fan across the left hemisphere instead, an arc the
// thumb sweeps rather than a circle it has to orbit.
const WHEEL_A = Math.PI, WHEEL_SPREAD = 1.25;
const wa = (slot) => WHEEL_A + (slot - 2.5) / 2.5 * WHEEL_SPREAD;
const WHEEL = [
  { code: 'VCAST', icon: '◎', a: wa(0),
    on: () => !!(G.save && G.save.abil.emp) },
  { code: 'VSTAR', sym: 'shuriken', a: wa(1),
    tint: { fill: 'rgba(190,238,255,0.96)', ring: 'rgba(90,215,255,0.75)' },
    on: () => typeof starCount === 'function' && starCount() > 0 },
  { code: 'VDASH', icon: '≫', a: wa(2),
    on: () => !!(G.save && G.save.abil.dash) },
  { code: 'VCLAW', icon: '⁂', heroIcon: '⚡', a: wa(3),
    on: () => player && player.clawCD <= 0 && player.clawT <= 0 },
  { code: 'VSONG', icon: '♪', a: wa(4),
    on: () => player && player.volts >= (typeof SONG_COST === 'number' ? SONG_COST : 26) },
  { code: 'VARM', icon: '◈', a: wa(5),
    on: () => typeof armSlots === 'function' && armSlots().length > 1 },
];
// which seats exist at all for this save — a power the player has never been
// given does not get a seat, so an early run shows a small clean ring
function wheelItems() {
  return WHEEL.filter(w => {
    if (w.code === 'VDASH') return !!(G.save && G.save.abil.dash);
    if (w.code === 'VCAST') return !!(G.save && G.save.abil.emp);
    if (w.code === 'VSTAR') return !!(G.save && (G.save.stars > 0 || (typeof starCount === 'function' && starCount() > 0)));
    if (w.code === 'VARM') return typeof armSlots === 'function' && armSlots().length > 1;
    return true;                       // the claw and the Song are hers from the start
  });
}
function wheelGeom(L) {
  const btn = L.btns.find(b => b.code === 'VWHEEL');
  const items = wheelItems();
  const rad = Math.max(74, 58 * L.u + items.length * 7);
  return { cx: btn ? btn.x : L.rgx, cy: btn ? btn.y : L.H / 2, rad, items, ir: Math.max(21, 25 * L.u) };
}
// which wedge is under a thumb at (x,y) — null if it is too close to the centre
// to have committed to anything, which is what makes releasing on the button
// itself a cancel rather than a misfire
function wheelPick(L, x, y) {
  const g = wheelGeom(L);
  const dx = x - g.cx, dy = y - g.cy, d = Math.hypot(dx, dy);
  if (d < g.rad * 0.42) return null;
  const a = Math.atan2(dy, dx);
  let best = null, bd = 1e9;
  for (const it of g.items) {
    let da = Math.abs(((a - it.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (da < bd) { bd = da; best = it; }
  }
  return bd < 0.42 ? best : null;
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
  const L0 = {
    r, W, H, rgx, lgx, u,
    btns: [
      { code: 'VJUMP', x: rgx, y: H - 60 * u, r: Math.min(44 * u, TOUCH.gut / 2 - 8), icon: '⤒', show: () => true },
      { code: 'VATK', x: rgx, y: H - 148 * u, r: 33 * u, sym: 'claw',
        tint: { fill: 'rgba(255,150,150,0.95)', ring: 'rgba(255,110,110,0.7)' }, show: () => true },
      { code: 'VHEAL', x: rgx, y: H - 230 * u, r: 27 * u, icon: '✚', show: () => true },
      // THE POWER WHEEL. Everything situational used to be its own button, and
      // they were added one per power as the game grew: six of them stacked up
      // the right edge, the topmost sitting in the upper fifth of a phone
      // screen where a resting thumb cannot reach, each shrunk to twenty pixels
      // to make room, and the last two overlapping. They live in one ring now.
      { code: 'VWHEEL', x: rgx, y: H - 306 * u, r: 27 * u, icon: '✦',
        show: () => wheelItems().length > 0 },
      { code: 'VINT', x: lgx, y: H * 0.28, r: 26 * u, icon: 'E', show: () => !!G.near },
    ],
    // menu buttons live in the LEFT column, actions in the right — no clutter
    corners: [
      { code: 'VPAUSE', x: lgx, y: 26 * u + 4, r: 16 * u + 2, icon: '▐▌' },
      { code: 'VMAP', x: lgx, y: 68 * u + 4, r: 16 * u + 2, icon: '▦' },
      { code: 'VCREST', x: lgx, y: 110 * u + 4, r: 16 * u + 2, icon: '◇' },
      { code: 'VSKILL', x: lgx, y: 152 * u + 4, r: 16 * u + 2, icon: '◈' },
    ],
  };
  // the player's own arrangement wins over every default
  for (const b of L0.btns.concat(L0.corners)) {
    const o = TOUCH.layout[b.code];
    if (o) {
      if (o.fx != null) { b.x = o.fx * W; b.y = o.fy * H; }
      if (o.k) b.r *= o.k;
    }
  }
  return L0;
}
function tPress(code) { keys[code] = 1; keysP[code] = 1; tBuzz(10); }
function tSetK(code, on) {
  if (on && !keys[code]) { keys[code] = 1; keysP[code] = 1; }
  else if (!on) keys[code] = 0;
}
function tStateKind() {
  const s = G.state;
  if (s === 'PLAY') return 'play';
  if (s === 'TCFG') return 'tcfg';
  if (s === 'MAP') return 'map';
  if (s === 'OFFER') return 'offer';
  if (s === 'MENU' || s === 'LANGSEL' || s === 'DIFF' || s === 'WHO' || s === 'PAUSE' || s === 'CREST' || s === 'SHOP' || s === 'SKILLS' || s === 'TRIAL') return 'menu';
  return 'tap';
}
// layout-editor chrome: fixed controls that are not part of the layout
function tEditChrome(L) {
  return [
    { code: 'EDONE', x: L.W - 150, y: 44, r: 26, icon: '✓' },
    { code: 'ERESET', x: L.W - 214, y: 44, r: 22, icon: '⟲' },
    { code: 'EPLUS', x: 150, y: 44, r: 22, icon: '＋' },
    { code: 'EMINUS', x: 214, y: 44, r: 22, icon: '－' },
  ];
}
function tApplyJoy() {
  const j = TOUCH.joy;
  const dx = j ? j.dx : 0, dy = j ? j.dy : 0;
  tSetK('VL', dx < -10); tSetK('VR', dx > 10);
  tSetK('VU', dy < -26); tSetK('VD', dy > 26);
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
    const np = (typeof pauseHasTouch === 'function' && pauseHasTouch()) ? 8 : 7;
    if (i >= 0 && i < np && Math.abs(y - (190 + i * 40)) <= 20) { G.pauseIdx = i; tPress('VOK'); }
  } else if (st === 'CREST') {
    const i = Math.round((y - 170) / 40);
    if (G.save.crests.length && i >= 0 && i < G.save.crests.length && Math.abs(y - (170 + i * 40)) <= 20) { G.crestIdx = i; tPress('VOK'); }
  } else if (st === 'SHOP') {
    const i = Math.round((y - 130) / 46);
    if (i >= 0 && i < SHOP.length && Math.abs(y - (130 + i * 46)) <= 23) { G.shopIdx = i; tPress('VOK'); }
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
  try { purifyGesture(); } catch (e) {}
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
      // an OPEN wheel owns the screen first: a tap on a wedge fires it, a tap
      // anywhere else puts it away
      if (TOUCH.wheel && TOUCH.wheel.open) {
        const pick = wheelPick(L, x, y);
        if (pick) {
          if (pick.on()) { tPress(pick.code); TOUCH.wheelFire = { code: pick.code, t: 0 }; tBuzz(14); }
          else tBuzz(4);
        }
        TOUCH.wheel = null;
        continue;
      }
      let hit = null;
      for (const b of L.corners) if (Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (!hit) for (const b of L.btns) if (b.show() && Math.hypot(x - b.x, y - b.y) < b.r + 9) { hit = b; break; }
      if (hit && hit.code === 'VWHEEL') {
        TOUCH.wheel = { id: t.identifier, sel: null, moved: false, open: false };
        tBuzz(10);
        continue;
      }
      if (hit) { TOUCH.held[t.identifier] = hit.code; tPress(hit.code); }
      else if (x < L.W * 0.46 && y > 130 && !TOUCH.joy) {
        // COD/PUBG-style floating stick: it appears UNDER the thumb, wherever
        // the thumb lands on the left half, and follows on long drags
        TOUCH.joy = { id: t.identifier, ox: x, oy: y, dx: 0, dy: 0 };
        tBuzz(8);
      }
    } else if (kind === 'tcfg') {
      // layout editor: chrome first, then grab any button to drag it
      let hit = null;
      for (const b of tEditChrome(L)) if (Math.hypot(x - b.x, y - b.y) < b.r + 10) { hit = b; break; }
      if (hit) {
        sfx('ui');
        if (hit.code === 'EDONE') { tLayoutSave(); G.state = 'PAUSE'; }
        else if (hit.code === 'ERESET') { TOUCH.layout = {}; tLayoutSave(); }
        else if ((hit.code === 'EPLUS' || hit.code === 'EMINUS') && TOUCH.editSel) {
          const o = TOUCH.layout[TOUCH.editSel] = TOUCH.layout[TOUCH.editSel] || {};
          o.k = clamp((o.k || 1) + (hit.code === 'EPLUS' ? 0.12 : -0.12), 0.6, 1.8);
        }
        continue;
      }
      for (const b of L.corners.concat(L.btns)) {
        if (Math.hypot(x - b.x, y - b.y) < Math.max(26, b.r + 12)) {
          TOUCH.editSel = b.code;
          TOUCH.editDrag = { id: t.identifier, code: b.code };
          tBuzz(12);
          break;
        }
      }
    } else if (kind === 'offer') {
      // The three doors are the only thing on screen; a tap has to be able to
      // open one. Falling through to the generic any-tap-is-OK branch is what
      // left a phone player looking at a choice they could not make.
      if (x >= L.r.left && x <= L.r.right && y >= L.r.top && y <= L.r.bottom
          && typeof offerTap === 'function') {
        const gx = (x - L.r.left) * 960 / L.r.width, gy = (y - L.r.top) * 540 / L.r.height;
        if (offerTap(gx, gy)) { tBuzz(12); continue; }
      }
    } else if (kind === 'map') {
      // the chart is driven directly: tap a control, drag the paper, pinch to
      // zoom. Nothing here presses a game button, so a stray tap can never
      // close the map by accident.
      const inR = x >= L.r.left && x <= L.r.right && y >= L.r.top && y <= L.r.bottom;
      const gx = (x - L.r.left) * 960 / L.r.width, gy = (y - L.r.top) * 540 / L.r.height;
      if (inR && typeof mapTap === 'function' && mapTap(gx, gy)) { tBuzz(8); continue; }
      TOUCH.mapT = TOUCH.mapT || {};
      TOUCH.mapT[t.identifier] = { x, y };
      const ids = Object.keys(TOUCH.mapT);
      if (ids.length === 2) {
        const a = TOUCH.mapT[ids[0]], b = TOUCH.mapT[ids[1]];
        TOUCH.mapPinch = Math.hypot(a.x - b.x, a.y - b.y) || 1;
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
  if (TOUCH.wheel && !TOUCH.wheel.open) {
    const L = tLayout();
    for (const t of e.changedTouches) {
      if (t.identifier !== TOUCH.wheel.id) continue;
      const x = t.clientX - TOUCH.ox, y = t.clientY - TOUCH.oy;
      const prev = TOUCH.wheel.sel;
      TOUCH.wheel.sel = wheelPick(L, x, y);
      if (TOUCH.wheel.sel) TOUCH.wheel.moved = true;
      if (TOUCH.wheel.sel !== prev && TOUCH.wheel.sel) tBuzz(6);
    }
  }
  if (tStateKind() === 'map' && TOUCH.mapT) {
    const L = tLayout();
    const k = 960 / L.r.width;
    for (const t of e.changedTouches) {
      const rec = TOUCH.mapT[t.identifier]; if (!rec) continue;
      const nx = t.clientX - TOUCH.ox, ny = t.clientY - TOUCH.oy;
      const ids = Object.keys(TOUCH.mapT);
      if (ids.length === 1 && typeof mapView !== 'undefined') {
        mapView.x += (nx - rec.x) * k; mapView.y += (ny - rec.y) * k;
      }
      rec.x = nx; rec.y = ny;
      if (ids.length === 2 && typeof mapZoomAt === 'function') {
        const a = TOUCH.mapT[ids[0]], b = TOUCH.mapT[ids[1]];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const prev = TOUCH.mapPinch || d;
        const mx = ((a.x + b.x) / 2 - L.r.left) * k;
        const my = ((a.y + b.y) / 2 - L.r.top) * (540 / L.r.height);
        mapZoomAt(mx, my, d / prev);
        TOUCH.mapPinch = d;
      }
    }
    return;
  }
  for (const t of e.changedTouches) {
    if (TOUCH.joy && t.identifier === TOUCH.joy.id) {
      const j = TOUCH.joy;
      let dx = t.clientX - TOUCH.ox - j.ox, dy = t.clientY - TOUCH.oy - j.oy;
      const len = Math.hypot(dx, dy);
      // long drags pull the base along (nipplejs 'follow'): re-centering the
      // stick under the thumb is what makes big direction flips feel instant
      if (len > 56) {
        const k = (len - 56) / len;
        j.ox += dx * k; j.oy += dy * k;
        dx *= 56 / len; dy *= 56 / len;
      }
      j.dx = dx; j.dy = dy;
      tApplyJoy();
    }
    if (TOUCH.editDrag && t.identifier === TOUCH.editDrag.id) {
      const W = TOUCH.vw || innerWidth, H = TOUCH.vh || innerHeight;
      const x = clamp(t.clientX - TOUCH.ox, 20, W - 20), y = clamp(t.clientY - TOUCH.oy, 20, H - 20);
      const o = TOUCH.layout[TOUCH.editDrag.code] = TOUCH.layout[TOUCH.editDrag.code] || {};
      o.fx = x / W; o.fy = y / H;
    }
  }
}
function tEnd(e) {
  if (TOUCH.mapT) {
    for (const t of e.changedTouches) delete TOUCH.mapT[t.identifier];
    if (!Object.keys(TOUCH.mapT).length) { TOUCH.mapT = null; TOUCH.mapPinch = 0; }
  }
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (TOUCH.wheel && !TOUCH.wheel.open && t.identifier === TOUCH.wheel.id) {
      const sel = TOUCH.wheel.sel;
      if (sel) {
        // slid onto a wedge and let go: that is the choice
        if (sel.on()) { tPress(sel.code); TOUCH.wheelFire = { code: sel.code, t: 0 }; tBuzz(14); }
        else tBuzz(4);
        TOUCH.wheel = null;
      } else if (!TOUCH.wheel.moved) {
        // a plain tap: leave the ring standing so it can be answered with a
        // second tap, which is the same gesture for a hand that cannot slide
        TOUCH.wheel.open = true;
      } else {
        TOUCH.wheel = null;
      }
    }
    if (TOUCH.joy && t.identifier === TOUCH.joy.id) { TOUCH.joy = null; tApplyJoy(); }
    if (TOUCH.editDrag && t.identifier === TOUCH.editDrag.id) TOUCH.editDrag = null;
    const code = TOUCH.held[t.identifier];
    if (code) { keys[code] = 0; delete TOUCH.held[t.identifier]; }
  }
}
// ---------------------------------------------------------------------------
// REAL BUTTON GLYPHS. The two attacks used to be a diamond and a four-pointed
// star — near-identical at thumb size. They are now DRAWN: the melee is her
// claw (three curved talons raking), the shuriken is an actual four-bladed
// ninja star with a centre hole. Each carries its own tint so the eye tells
// them apart before it reads the shape at all.
// ---------------------------------------------------------------------------
const TSYM = {
  // three tapered talons, curving as they rake — a cat's strike
  claw(x, y, s) {
    tcx.save(); tcx.translate(x, y); tcx.rotate(-0.32);
    for (let i = -1; i <= 1; i++) {
      const off = i * s * 0.34;
      tcx.beginPath();
      // outer edge down, inner edge back up: a crescent that tapers to a point
      tcx.moveTo(off - s * 0.1, -s * 0.72);
      tcx.quadraticCurveTo(off + s * 0.34, -s * 0.02, off + s * 0.02, s * 0.76);
      tcx.quadraticCurveTo(off + s * 0.12, -s * 0.02, off - s * 0.24, -s * 0.64);
      tcx.closePath();
      tcx.fill();
    }
    tcx.restore();
  },
  // a four-bladed shuriken: concave edges between the points, hollow centre
  shuriken(x, y, s) {
    tcx.save(); tcx.translate(x, y); tcx.rotate(0.3);
    tcx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const px = Math.cos(a), py = Math.sin(a);
      const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
      if (i === 0) tcx.moveTo(px * s, py * s); else tcx.lineTo(px * s, py * s);
      // the blade's trailing edge scoops back toward the hub before the
      // next point — that concave sweep is what makes it read as a star
      tcx.quadraticCurveTo((px + nx) * s * 0.16, (py + ny) * s * 0.16, nx * s, ny * s);
    }
    tcx.closePath();
    tcx.fill('evenodd');
    // the centre hole, punched clean
    tcx.globalCompositeOperation = 'destination-out';
    tcx.beginPath(); tcx.arc(0, 0, s * 0.2, 0, 7); tcx.fill();
    tcx.restore();
  },
};
function tCircle(x, y, r, pressed, icon, iconSize, sym, tint) {
  tcx.beginPath(); tcx.arc(x, y, r, 0, 7);
  tcx.fillStyle = pressed ? 'rgba(120,230,255,0.45)' : 'rgba(18,36,52,0.75)';
  tcx.fill();
  tcx.lineWidth = 1.8;
  tcx.strokeStyle = pressed ? 'rgba(160,240,255,0.95)'
    : (tint ? tint.ring : 'rgba(120,200,240,0.55)');
  tcx.stroke();
  if (sym && TSYM[sym]) {
    tcx.save();
    tcx.fillStyle = tint ? tint.fill : 'rgba(230,245,255,0.92)';
    tcx.shadowColor = tint ? tint.ring : 'rgba(160,240,255,0.8)';
    tcx.shadowBlur = pressed ? 10 : 5;
    TSYM[sym](x, y + 0.5, r * 0.52);
    tcx.restore();
    return;
  }
  if (icon) {
    tcx.font = '700 ' + (iconSize || Math.round(r * 0.85)) + 'px "Segoe UI", sans-serif';
    tcx.textAlign = 'center'; tcx.textBaseline = 'middle';
    tcx.fillStyle = tint ? tint.fill : 'rgba(230,245,255,0.92)';
    tcx.fillText(icon, x, y + 1);
  }
}
// The ring, drawn where the thumb already is. A dim seat is a power that
// exists but cannot be used right now — it keeps its place so the reach for it
// is always the same reach.
function drawWheel(L) {
  const g = wheelGeom(L);
  const sel = TOUCH.wheel.sel;
  tcx.save();
  // a soft plate under the ring so wedges read against whatever is behind them
  const gr = tcx.createRadialGradient(g.cx, g.cy, g.rad * 0.2, g.cx, g.cy, g.rad + g.ir + 8);
  gr.addColorStop(0, 'rgba(4,10,16,0.72)');
  gr.addColorStop(0.7, 'rgba(4,10,16,0.55)');
  gr.addColorStop(1, 'rgba(4,10,16,0)');
  tcx.fillStyle = gr;
  tcx.beginPath(); tcx.arc(g.cx, g.cy, g.rad + g.ir + 8, 0, 7); tcx.fill();
  tcx.strokeStyle = 'rgba(90,190,225,0.28)'; tcx.lineWidth = 1.5;
  tcx.beginPath();
  tcx.arc(g.cx, g.cy, g.rad, WHEEL_A - WHEEL_SPREAD - 0.25, WHEEL_A + WHEEL_SPREAD + 0.25);
  tcx.stroke();
  for (const it of g.items) {
    const x = g.cx + Math.cos(it.a) * g.rad, y = g.cy + Math.sin(it.a) * g.rad;
    const live = it.on();
    const hot = sel === it;
    if (hot) {
      tcx.save();
      tcx.strokeStyle = live ? 'rgba(120,255,220,0.9)' : 'rgba(255,120,120,0.8)';
      tcx.lineWidth = 3;
      tcx.beginPath(); tcx.arc(x, y, g.ir + 7, 0, 7); tcx.stroke();
      tcx.restore();
    }
    tcx.save();
    if (!live) tcx.globalAlpha = 0.3;
    const ic = (it.code === 'VCLAW' && G.save && G.save.theme === 'hero') ? it.heroIcon : it.icon;
    tCircle(x, y, g.ir, hot && live, ic, null, it.sym, it.tint);
    tcx.restore();
  }
  // the centre reads as "let go here and nothing happens"
  tcx.fillStyle = 'rgba(200,230,245,0.5)';
  tcx.font = '700 10px "Segoe UI", sans-serif';
  tcx.textAlign = 'center'; tcx.textBaseline = 'middle';
  tcx.fillText('✕', g.cx, g.cy);
  tcx.restore();
}
function drawTouchUI() {
  if (!TOUCH.enabled || !tcx) return;
  if (typeof PAD !== 'undefined' && PAD.on) { tcx.clearRect(0, 0, TOUCH.vw || innerWidth, TOUCH.vh || innerHeight); return; }
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
  if (kind === 'tcfg') {
    // LAYOUT EDITOR: every button shown, drag to move, +/- resizes selection
    for (const b of L.corners.concat(L.btns)) {
      if (b.code === TOUCH.editSel) {
        tcx.save(); tcx.globalAlpha = 0.5;
        tcx.strokeStyle = '#37ffd0'; tcx.lineWidth = 3; tcx.setLineDash([7, 6]);
        tcx.beginPath(); tcx.arc(b.x, b.y, b.r + 10, 0, 7); tcx.stroke();
        tcx.setLineDash([]); tcx.restore();
      }
      tCircle(b.x, b.y, b.r, b.code === TOUCH.editSel, b.icon, null, b.sym, b.tint);
    }
    for (const b of tEditChrome(L)) tCircle(b.x, b.y, b.r, false, b.icon, 18);
    return;
  }
  if (kind === 'play') {
    // a wedge fired from the wheel is a press with nothing holding it down —
    // give it a couple of frames so the game's own edge-detect sees it, then let go
    if (TOUCH.wheelFire) {
      TOUCH.wheelFire.t++;
      if (TOUCH.wheelFire.t > 1) { keys[TOUCH.wheelFire.code] = 0; TOUCH.wheelFire = null; }
    }
    for (const b of L.corners) tCircle(b.x, b.y, b.r, !!keys[b.code], b.icon, 12);
    // the map is the one corner control worth naming: an unlabelled glyph in a
    // column of glyphs is not a button anybody finds
    const mb = L.corners.find(b => b.code === 'VMAP');
    if (mb && typeof mapUnlocked === 'function' && mapUnlocked()) {
      const nw = (G.mapBtnNew || 0) > 0;
      if (nw) {
        tcx.save();
        tcx.strokeStyle = 'rgba(120,240,255,' + (0.4 + Math.abs(Math.sin(performance.now() / 200)) * 0.6) + ')';
        tcx.lineWidth = 2.5;
        tcx.beginPath(); tcx.arc(mb.x, mb.y, mb.r + 7, 0, 7); tcx.stroke();
        tcx.restore();
      }
      tcx.save();
      tcx.font = '700 10px "Segoe UI", sans-serif';
      tcx.textAlign = 'center'; tcx.textBaseline = 'middle';
      tcx.fillStyle = nw ? '#eaffff' : 'rgba(190,220,235,0.85)';
      tcx.fillText(t('map_btn'), mb.x, mb.y + mb.r + 9);
      tcx.restore();
    }
    if (TOUCH.wheel) drawWheel(L);
    // floating stick, alive under the thumb
    if (TOUCH.joy) {
      tCircle(TOUCH.joy.ox, TOUCH.joy.oy, 50, false, null);
      tcx.save(); tcx.globalAlpha = 0.35;
      tcx.beginPath(); tcx.arc(TOUCH.joy.ox, TOUCH.joy.oy, 56, 0, 7);
      tcx.strokeStyle = 'rgba(120,220,255,0.8)'; tcx.lineWidth = 1.5; tcx.stroke();
      tcx.restore();
      tCircle(TOUCH.joy.ox + TOUCH.joy.dx, TOUCH.joy.oy + TOUCH.joy.dy, 27, true, null);
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
      tCircle(b.x, b.y, b.r, !!keys[b.code], b.icon, null, b.sym, b.tint);
    }
  } else if (kind === 'menu') {
    tCircle(L.lgx, 28, 18, false, '✕', 14);
  }
}
if (TOUCH.enabled) tcSetup();
