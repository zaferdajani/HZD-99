// ===========================================================================
// THE CHARACTER MENU (owner, 2026-11-28: "create graphically amazing interface for my equipments
// and skills instead of these silly tags on the top, which I can use by clicking on the
// controller's option or start ... Check out ... Silksong ... character menu. When they go into the
// character information and they choose the crests ... it has its own interface. I want something
// like it, but for the game.")
//
// ONE MENU, ITS PAGES ON THE BUMPERS. Options / Start (Esc or P on a keyboard, ☰ on a phone) opens
// it on the page she last had open — her EQUIPMENT the first time — and LB / RB (Q / E, or a tap
// on the medallions along the top) turn its pages:
//
//   EQUIPMENT  her crest: the Conduit ring with the blade she holds in its heart, every socket
//              round it showing what is seated there, her figure beside it, the parts list and what
//              the selected part does and the key that uses it
//   INVENTORY  what she carries, in sockets, with her scrap and her IQ counted above
//   NEURAL TREE the moves she can buy with IQ, each shown played out of her own sheet
//   SKILL TREES her pack's ladder (js/packtree.js), framed under the medallions
//   RELICS     the relics she has torn from guardians and found, in their seals
//   MAP        the map in a frame; OK opens it whole
//   SYSTEM     resume, the dials, films, restart, quit (the old pause list, restyled)
//
// Every page keeps the state it always had (CREST, BAG, SKILLS, TREE, RELICS, PAUSE; CMAP is the
// map's framed page), so every rule written against those states — what installs, what costs, the
// two-press restart — still holds; this file is the frame round them, the turning of pages, and the
// new pictures of the pages whose old pictures were lists of text.
//
// THE ART is the game's own and a CC0 kit, nothing drawn freehand to stand in for a picture:
//   - the Conduit ring gate (Higgsfield, the doors the owner chose), her 8-way turnaround, the
//     jets, the boots, the spare cell, the raw marble — all fired art already in the game;
//   - the crystal sword, cut from its own canon plates (assets/source/crystal);
//   - "Assets: UI Minimalism SciFi" by Wenrexa (CC0) for the cards, rows, slots, title bar and grid;
//   - Cinzel (SIL OFL 1.1) for the page names — the carved Roman capitals of a world called NOSTOS.
// No light, rim or halo round any body (ledger): her figure stands on a shadow, not in a glow.
// ===========================================================================
const CM_TABS = [
  { st: 'CREST', key: 'crest_title', icon: 'gear' },
  { st: 'BAG', key: 'pm_bag', icon: 'bag' },
  { st: 'SKILLS', key: 'pm_skills', icon: 'mind' },
  { st: 'TREE', key: 'pk_menu', icon: 'pack' },
  { st: 'RELICS', key: 'pm_relics', icon: 'relic' },
  { st: 'CMAP', key: 'pm_map', icon: 'map', when: () => typeof mapUnlocked !== 'function' || mapUnlocked() },
  { st: 'PAUSE', key: 'cm_system', icon: 'sys' },
];
const CM = { last: 'CREST', lastDraw: 0, openT: 0, tabT: 1, dir: 0, snap: null, prevSt: null, bagIdx: 0, relIdx: 0 };
const CM_TEAL = '#5ff2d6', CM_IVORY = '#e9e2d0', CM_DIM = '#7d93a8', CM_GOLD = '#ffd76a', CM_INK = '#04070c';
const CM_BAR = { y: 34, r: 17, rOn: 23, gap: 70, nameY: 76 };

// ---------- the font ---------------------------------------------------------------------------
// Cinzel carries Latin (and Turkish); Arabic, Chinese and Cyrillic fall through to the game's own
// face glyph by glyph, which is what a canvas font list does.
(function cmLoadFont() {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return;
  try {
    const add = (file, range) => {
      const f = new FontFace('Cinzel', 'url(assets/fonts/' + file + ') format("woff2")', { weight: '400 900', unicodeRange: range });
      f.load().then(ff => document.fonts.add(ff)).catch(() => {});
    };
    add('cinzel-latin.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215');
    add('cinzel-latin-ext.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F');
  } catch (e) {}
})();
function cmFont(size, w) { return (w || '700') + ' ' + size + 'px Cinzel, "Segoe UI", Tahoma, serif'; }
// a carved title: Cinzel, tracked out, no glow (the colour is the emphasis)
function cmTitle(str, x, y, size, col, align, track) {
  c.save();
  c.font = cmFont(size, '700'); c.textAlign = align || 'center'; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = (track == null ? Math.round(size * 0.16) : track) + 'px';
  const rtl = typeof isRTL === 'function' && isRTL(); if (rtl) c.direction = 'rtl';
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillText(String(str).toUpperCase(), x + 1, y + 2);
  c.fillStyle = col || CM_IVORY; c.fillText(String(str).toUpperCase(), x, y);
  c.restore();
}

// ---------- art -------------------------------------------------------------------------------
function cmArt(key) {
  if (typeof mediaFetch === 'function') mediaFetch(key, 1);
  const im = typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[key];
  return im && im.naturalWidth ? im : null;
}
// nine-slice: the kit's frames keep their corners whatever size they are drawn at
function cmNine(im, x, y, w, h, ins, alpha) {
  if (!im) return false;
  const W = im.naturalWidth, H = im.naturalHeight, i = Math.min(ins, W / 2 - 1, H / 2 - 1), o = Math.min(ins, w / 2, h / 2);
  c.save(); if (alpha != null) c.globalAlpha *= alpha;
  const sx = [0, i, W - i, W], sy = [0, i, H - i, H], dx = [x, x + o, x + w - o, x + w], dy = [y, y + o, y + h - o, y + h];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const sw = sx[a + 1] - sx[a], sh = sy[b + 1] - sy[b], dw = dx[a + 1] - dx[a], dh = dy[b + 1] - dy[b];
    if (sw > 0 && sh > 0 && dw > 0 && dh > 0) c.drawImage(im, sx[a], sy[b], sw, sh, dx[a], dy[b], dw, dh);
  }
  c.restore(); return true;
}
// an engraved rule: a hairline with a diamond at its heart and fading ends
function cmRule(x0, x1, y, col, diamond) {
  c.save();
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(233,226,208,0)'); g.addColorStop(0.5, col || 'rgba(233,226,208,0.55)'); g.addColorStop(1, 'rgba(233,226,208,0)');
  c.strokeStyle = g; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x0, y + 0.5); c.lineTo(x1, y + 0.5); c.stroke();
  if (diamond !== false) {
    const m = (x0 + x1) / 2;
    c.fillStyle = col || 'rgba(233,226,208,0.8)';
    c.beginPath(); c.moveTo(m, y - 4); c.lineTo(m + 4, y + 0.5); c.lineTo(m, y + 5); c.lineTo(m - 4, y + 0.5); c.closePath(); c.fill();
  }
  c.restore();
}
// a dark card in the kit's frosted frame
function cmCard(x, y, w, h, dim) {
  c.save();
  c.fillStyle = 'rgba(6,11,17,0.78)'; rr(c, x + 6, y + 6, w - 12, h - 12, 10); c.fill();
  c.restore();
  if (!cmNine(cmArt(dim ? 'cmCardDim' : 'cmCard'), x, y, w, h, 26, dim ? 0.9 : 1)) {
    c.save(); c.strokeStyle = 'rgba(95,242,214,0.35)'; c.lineWidth = 1.5; rr(c, x, y, w, h, 10); c.stroke(); c.restore();
  }
}
// an image contained in a box (never stretched), optional composite
function cmFit(im, x, y, w, h, op, alpha, flip, sx, sy, sw, sh) {
  if (!im) return;
  sx = sx || 0; sy = sy || 0; sw = sw || im.naturalWidth; sh = sh || im.naturalHeight;
  const k = Math.min(w / sw, h / sh), dw = sw * k, dh = sh * k;
  c.save(); if (op) c.globalCompositeOperation = op; if (alpha != null) c.globalAlpha *= alpha;
  c.translate(x + w / 2, y + h / 2); if (flip) c.scale(-1, 1);
  c.drawImage(im, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  c.restore();
}

// ---------- the backdrop: the world she paused in, out of focus, under ink ----------------------
function cmSnapshot() {
  try {
    const W = 320, H = 180, o = document.createElement('canvas'); o.width = W; o.height = H;
    const q = o.getContext('2d'); q.imageSmoothingQuality = 'high';
    // twice down, so the world is a soft field of its own colours rather than a pixel mosaic
    const m = document.createElement('canvas'); m.width = 120; m.height = 68;
    m.getContext('2d').drawImage(cv, 0, 0, 120, 68);
    q.drawImage(m, 0, 0, W, H);
    return o;
  } catch (e) { return null; }
}
const CM_MOTES = Array.from({ length: 54 }, (_, i) => {
  const r = (k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  return { x: r(1) * 960, y: r(2) * 540, v: 6 + r(3) * 14, s: 0.6 + r(4) * 1.6, ph: r(5) * 6.28, a: 0.10 + r(6) * 0.32, warm: r(7) < 0.22 };
});
function cmBackdrop(now) {
  c.save(); c.setTransform(c.getTransform());
  if (CM.snap) { c.imageSmoothingEnabled = true; c.drawImage(CM.snap, 0, 0, 960, 540); }
  // the ink: deeper at the edges and the foot, so the pages float on it
  c.fillStyle = 'rgba(3,6,10,0.80)'; c.fillRect(0, 0, 960, 540);
  const v = c.createRadialGradient(480, 250, 120, 480, 280, 640);
  v.addColorStop(0, 'rgba(10,30,36,0.10)'); v.addColorStop(1, 'rgba(0,0,0,0.70)');
  c.fillStyle = v; c.fillRect(0, 0, 960, 540);
  // the kit's grid, faint, behind everything: the menu is drawn on a machine's own schematic
  const gr = cmArt('cmGrid');
  if (gr) { c.globalAlpha = 0.07; for (let gx = 0; gx < 960; gx += 454) for (let gy = 0; gy < 540; gy += 337) c.drawImage(gr, gx, gy); c.globalAlpha = 1; }
  // dust in the air, drifting up (the motes the meadow's light leaves; never round a body)
  const lite = typeof QUAL !== 'undefined' && QUAL && QUAL.name === 'low';
  c.globalCompositeOperation = 'lighter';
  const t = now / 1000;
  for (let i = 0; i < CM_MOTES.length; i += lite ? 2 : 1) {
    const m = CM_MOTES[i];
    const y = ((m.y - t * m.v) % 560 + 560) % 560 - 10, x = m.x + Math.sin(t * 0.4 + m.ph) * 14;
    const a = m.a * (0.6 + 0.4 * Math.sin(t * 1.3 + m.ph));
    c.fillStyle = m.warm ? 'rgba(255,215,140,' + a.toFixed(3) + ')' : 'rgba(170,240,230,' + a.toFixed(3) + ')';
    c.beginPath(); c.arc(x, y, m.s, 0, 6.283); c.fill();
  }
  c.restore();
}

// ---------- which page, and turning them ------------------------------------------------------
function cmTabs() { return CM_TABS.filter(tb => !tb.when || tb.when()); }
function cmOn() {
  if (typeof isHero === 'function' && isHero()) return false;
  if (typeof G === 'undefined' || !G) return false;
  return CM_TABS.some(tb => tb.st === G.state);
}
function cmEnter(st) {
  // each page as its own key always opened it
  if (st === 'TREE' && typeof ptOpen === 'function') { ptOpen('PLAY'); return; }
  G.state = st;
  if (st === 'CREST') G.crestIdx = 0;
  else if (st === 'BAG') G.bagIdx = 0;
  else if (st === 'SKILLS') G.skillIdx = 0;
  else if (st === 'PAUSE') { G.pauseIdx = 0; G.pauseConfirm = null; }
  else if (st === 'RELICS') CM.relIdx = 0;
}
function cmOpen() {
  const tabs = cmTabs();
  const st = tabs.some(tb => tb.st === CM.last) ? CM.last : 'CREST';
  CM.dir = 0; CM.tabT = 1; CM.openT = 0; CM.snap = null;
  cmEnter(st);
  if (typeof sfx === 'function') sfx('ui');
}
function cmClose() { G.pauseConfirm = null; G.state = 'PLAY'; if (typeof mapView !== 'undefined') mapView.ready = false; if (typeof sfx === 'function') sfx('ui'); }
function cmSwitch(d) {
  const tabs = cmTabs(), i = tabs.findIndex(tb => tb.st === G.state);
  const n = tabs.length, j = ((i < 0 ? 0 : i) + d + n) % n;
  CM.dir = d; CM.tabT = 0;
  cmEnter(tabs[j].st);
  CM.last = tabs[j].st;
  if (typeof sfx === 'function') sfx('ui');
}
function cmGo(st) {
  const tabs = cmTabs(), i = tabs.findIndex(tb => tb.st === G.state), j = tabs.findIndex(tb => tb.st === st);
  if (j < 0 || i === j) return;
  CM.dir = j > i ? 1 : -1; CM.tabT = 0; cmEnter(st); CM.last = st;
  if (typeof sfx === 'function') sfx('ui');
}
// the bumpers: LB / RB on a pad (the suit wheel and the dash out in the world), Q / E or
// Page Up / Down on a keyboard
function cmTabPress() {
  const kp = typeof keysP !== 'undefined' ? keysP : {};
  const L = inP('ARM') || kp.KeyQ || kp.PageUp, R = inP('DASH') || kp.KeyE || kp.PageDown;
  return L ? -1 : R ? 1 : 0;
}
// called by the update before a page's own: true when it took the frame
function cmUpdate(dt) {
  if (!cmOn()) return false;
  CM.last = G.state;
  CM.tabT = Math.min(1, CM.tabT + (dt || 1 / 60) / 0.22);
  CM.openT = Math.min(1, CM.openT + (dt || 1 / 60) / 0.26);
  const d = cmTabPress();
  if (d) { cmSwitch(d); return true; }
  // Options / Start (Esc, P) closes from any page — the System page's own rule as well
  if (inP('PAUSE')) {
    // (a page opened from a System row goes back to that page: the pack tree's own rule, ptClose)
    if (G.state === 'TREE' && G.treeBack === 'PAUSE') return false;
    cmClose(); return true;
  }
  // a page's own key from another page turns to it
  if (G.state !== 'CREST' && inP('CREST')) { cmGo('CREST'); return true; }
  if (G.state !== 'SKILLS' && inP('SKILL')) { cmGo('SKILLS'); return true; }
  if (G.state !== 'TREE' && inP('TREE')) { cmGo('TREE'); return true; }
  if (G.state === 'BAG') { cmUpdateBag(); return true; }
  if (G.state === 'RELICS') { cmUpdateRelics(); return true; }
  if (G.state === 'CMAP') { cmUpdateMap(); return true; }
  return false;
}

// ---------- the frame: the medallions along the top, the hints along the foot ------------------
function cmTabGeom() {
  const tabs = cmTabs(), n = tabs.length, w = (n - 1) * CM_BAR.gap;
  return tabs.map((tb, i) => ({ tb, x: 480 - w / 2 + i * CM_BAR.gap, y: CM_BAR.y }));
}
function cmBumperLabel(side) {
  if (typeof PAD !== 'undefined' && PAD && PAD.on) return padLabel(side < 0 ? (PAD.map.ARM != null && PAD.map.ARM >= 0 ? PAD.map.ARM : 4) : (PAD.map.DASH != null && PAD.map.DASH >= 0 ? PAD.map.DASH : 5));
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled) return side < 0 ? '◂' : '▸';
  return side < 0 ? 'Q' : 'E';
}
function cmIcon(kind, x, y, r, on, now) {
  c.save();
  if (kind === 'gear') {
    const m = typeof weaponMode === 'function' ? weaponMode() : 'claws';
    if (m === 'claws') cmClawGlyph(x, y, r * 0.8, on ? '#f2fbff' : '#b9c9d4');
    else cmFit(cmArt(m === 'joined' ? 'swordJoined' : 'swordSingle'), x - r, y - r, r * 2, r * 2, 'screen', on ? 1 : 0.8);
  } else if (kind === 'bag') cmFit(cmArt('spareCell'), x - r * 0.82, y - r * 0.82, r * 1.64, r * 1.64, null, on ? 1 : 0.8);
  else if (kind === 'mind') cmFit(cmArt('rawMarble'), x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, null, on ? 1 : 0.8);
  else if (kind === 'pack') cmWolfFace(x, y, r * 1.6, on ? 1 : 0.8);
  else if (kind === 'relic') { if (typeof drawLoadoutFrame === 'function') drawLoadoutFrame(c, 'relic', x, y, r * 0.66, on ? 'filled' : 'empty', '✦', '#eef3fa'); }
  else if (kind === 'map') cmCompass(x, y, r * 0.72, on, now);
  else if (kind === 'sys') cmCog(x, y, r * 0.7, on, now);
  c.restore();
}
function cmClawGlyph(x, y, s, col) {
  c.save(); c.strokeStyle = col; c.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    c.lineWidth = 2.4 - Math.abs(k) * 0.5;
    c.beginPath(); c.moveTo(x - s * 0.55 + k * s * 0.32, y + s * 0.62); c.quadraticCurveTo(x + k * s * 0.32, y, x + s * 0.5 + k * s * 0.32, y - s * 0.7); c.stroke();
  }
  c.restore();
}
function cmWolfFace(x, y, s, a) {
  const im = cmArt('wolfIdle6'); if (!im) return;
  const cw = im.naturalWidth / 6, ch = im.naturalHeight;
  // the head of the first cell of her small wolf's filmed idle, looking out of the medallion
  c.save(); c.beginPath(); c.arc(x, y, s * 0.52, 0, 6.283); c.clip(); c.globalAlpha *= a;
  cmFit(im, x - s * 0.9, y - s * 0.62, s * 1.8, s * 1.4, null, 1, true, 0, 0, cw, ch);
  c.restore();
}
function cmCompass(x, y, r, on, now) {
  c.save(); c.strokeStyle = on ? '#f2fbff' : '#b9c9d4'; c.fillStyle = c.strokeStyle; c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke();
  c.translate(x, y); c.rotate(Math.sin(now / 1400) * 0.18);
  c.beginPath(); c.moveTo(0, -r * 0.92); c.lineTo(r * 0.24, 0); c.lineTo(0, r * 0.92); c.lineTo(-r * 0.24, 0); c.closePath();
  c.globalAlpha = 0.9; c.fill();
  c.fillStyle = '#e45a4f'; c.beginPath(); c.moveTo(0, -r * 0.92); c.lineTo(r * 0.24, 0); c.lineTo(-r * 0.24, 0); c.closePath(); c.fill();
  c.restore();
}
function cmCog(x, y, r, on) {
  c.save(); c.translate(x, y); c.fillStyle = on ? '#f2fbff' : '#b9c9d4';
  c.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr2 = i % 2 ? r * 0.78 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  c.closePath(); c.fill();
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, r * 0.38, 0, 6.283); c.fill();
  c.restore();
}
function cmMedallion(x, y, r, on, now) {
  c.save();
  // the socket: a dark well with a steel lip, the chosen one ringed in the Conduit's teal
  const g = c.createRadialGradient(x, y - r * 0.4, r * 0.2, x, y, r);
  g.addColorStop(0, '#1a2731'); g.addColorStop(1, '#070c12');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
  const lip = c.createLinearGradient(x, y - r, x, y + r);
  lip.addColorStop(0, on ? '#d9fff6' : '#8fa3ae'); lip.addColorStop(0.5, on ? '#5ff2d6' : '#43525c'); lip.addColorStop(1, on ? '#1d7f72' : '#222b31');
  c.strokeStyle = lip; c.lineWidth = on ? 2.4 : 1.6; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke();
  c.strokeStyle = on ? 'rgba(95,242,214,0.35)' : 'rgba(233,226,208,0.12)'; c.lineWidth = 1;
  c.beginPath(); c.arc(x, y, r + 4.5, 0, 6.283); c.stroke();
  if (on) {
    // four ticks at the compass points, turning slowly: the selected page's dial
    c.translate(x, y); c.rotate(now / 2600);
    c.strokeStyle = 'rgba(217,255,246,0.7)'; c.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(r + 7, 0); c.lineTo(r + 12, 0); c.stroke(); }
  }
  c.restore();
}
function cmBumper(x, y, side, now) {
  const lab = cmBumperLabel(side);
  c.save();
  c.fillStyle = 'rgba(10,17,24,0.92)'; c.strokeStyle = 'rgba(233,226,208,0.45)'; c.lineWidth = 1.2;
  const w = Math.max(34, 14 + lab.length * 9), h = 22;
  rr(c, x - w / 2, y - h / 2, w, h, 6); c.fill(); c.stroke();
  c.font = '800 12px "Segoe UI", Tahoma, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = CM_IVORY;
  c.fillText(lab, x, y + 0.5);
  // the arrow it turns the page by
  const ax = x + side * (w / 2 + 10), pul = 0.5 + 0.5 * Math.sin(now / 300);
  c.fillStyle = 'rgba(95,242,214,' + (0.45 + 0.4 * pul).toFixed(2) + ')';
  c.beginPath(); c.moveTo(ax + side * 6, y); c.lineTo(ax - side * 2, y - 6); c.lineTo(ax - side * 2, y + 6); c.closePath(); c.fill();
  c.restore();
}
function cmDrawBar(now) {
  const T = cmTabGeom(), cur = T.find(q => q.tb.st === G.state) || T[0];
  // the band the medallions hang on
  c.save();
  const band = c.createLinearGradient(0, 0, 0, 96);
  band.addColorStop(0, 'rgba(2,4,7,0.92)'); band.addColorStop(1, 'rgba(2,4,7,0)');
  c.fillStyle = band; c.fillRect(0, 0, 960, 96);
  c.restore();
  const x0 = T[0].x, x1 = T[T.length - 1].x;
  cmRule(x0 - 120, x1 + 120, CM_BAR.y, 'rgba(233,226,208,0.32)', false);
  for (const q of T) {
    const on = q === cur, r = on ? CM_BAR.rOn : CM_BAR.r;
    cmMedallion(q.x, q.y, r, on, now);
    c.save(); c.beginPath(); c.arc(q.x, q.y, r - 2, 0, 6.283); c.clip();
    cmIcon(q.tb.icon, q.x, q.y, r - 4, on, now);
    c.restore();
  }
  cmBumper(x0 - 62, CM_BAR.y, -1, now);
  cmBumper(x1 + 62, CM_BAR.y, 1, now);
  // the page's name, carved, between two rules
  const name = t(cur.tb.key);
  cmTitle(name, 480, CM_BAR.nameY, 19, CM_IVORY);
  c.font = cmFont(19); if ('letterSpacing' in c) c.letterSpacing = '3px';
  const hw = c.measureText(String(name).toUpperCase()).width / 2 + 22;
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  cmRule(480 - hw - 150, 480 - hw, CM_BAR.nameY, 'rgba(233,226,208,0.5)', false);
  cmRule(480 + hw, 480 + hw + 150, CM_BAR.nameY, 'rgba(233,226,208,0.5)', false);
}
// the foot: what the buttons do here, as key caps
function cmHints(list) {
  const items = list.filter(Boolean);
  c.save(); c.font = '700 12px "Segoe UI", Tahoma, sans-serif';
  const parts = items.map(([cap, txt]) => ({ cap, txt, w: Math.max(24, c.measureText(cap).width + 14) + 6 + c.measureText(txt).width }));
  const total = parts.reduce((s, p) => s + p.w, 0) + (parts.length - 1) * 26;
  let x = 480 - total / 2; const y = 522;
  const rtl = typeof isRTL === 'function' && isRTL();
  for (const p of (rtl ? parts.slice().reverse() : parts)) {
    const cw = Math.max(24, c.measureText(p.cap).width + 14);
    c.fillStyle = 'rgba(14,22,30,0.95)'; c.strokeStyle = 'rgba(233,226,208,0.4)'; c.lineWidth = 1;
    rr(c, x, y - 10, cw, 20, 5); c.fill(); c.stroke();
    c.fillStyle = CM_IVORY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.cap, x + cw / 2, y + 0.5);
    c.fillStyle = '#9fb3c2'; c.textAlign = 'left'; c.fillText(p.txt, x + cw + 6, y + 0.5);
    x += p.w + 26;
  }
  c.restore();
}
function cmCap(action) {
  if (typeof howToOpen !== 'function') return action;
  const h = howToOpen(action); return String(h).split(' ▸ ')[0];
}
function cmOkCap() { return typeof PAD !== 'undefined' && PAD && PAD.on ? padLabel(0) : typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled ? '☝' : 'Enter'; }
function cmBackCap() { return typeof PAD !== 'undefined' && PAD && PAD.on ? padLabel(PAD.map.PAUSE != null ? PAD.map.PAUSE : 9) : typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled ? '✕' : 'Esc'; }

// ---------- the whole menu, drawn ------------------------------------------------------------
function cmDraw() {
  const now = performance.now();
  // a fresh opening: the world she left, out of focus (taken from this frame, which drew it)
  if (now - CM.lastDraw > 300 || !CM.snap) { CM.snap = cmSnapshot(); if (now - CM.lastDraw > 300) { CM.openT = 0; CM.tabT = 1; } }
  if (CM.prevSt !== G.state && CM.prevSt && CM_TABS.some(tb => tb.st === CM.prevSt) && CM.tabT >= 1) { CM.tabT = 0; }
  CM.prevSt = G.state; CM.lastDraw = now;
  cmBackdrop(now);
  const e = 1 - Math.pow(1 - Math.min(CM.tabT, CM.openT < 1 ? CM.openT : 1), 3);
  c.save();
  c.globalAlpha = Math.max(0.05, e);
  c.translate((1 - e) * 26 * (CM.dir || 0), (1 - Math.min(1, CM.openT * 1.2)) * 14);
  const st = G.state;
  if (st === 'CREST') drawGear();
  else if (st === 'BAG') cmDrawBag(now);
  else if (st === 'SKILLS') cmDrawSkills(now);
  else if (st === 'TREE') cmDrawTree(now);
  else if (st === 'RELICS') cmDrawRelics(now);
  else if (st === 'CMAP') cmDrawMapTab(now);
  else if (st === 'PAUSE') cmDrawSystem(now);
  c.restore();
  cmDrawBar(now);
  // (the steps for the frame's own clock: the update advances it; a frame drawn without one —
  // a test, a paused tab — still settles)
  if (!(typeof G !== 'undefined' && G.state)) return;
}

// ---------- EQUIPMENT: the crest ----------------------------------------------------------------
// the sockets round the ring, by the slot each part sits in (gearRows' r.slot)
const CM_SOCKETS = [
  { slot: 'gear_handslot', a: -90 },
  { slot: 'gear_jetslot', a: -28 },
  { slot: 'gear_bootslot', a: 28 },
  { slot: 'gear_coreslot', a: 90 },
  { slot: 'sw_backslot', a: 152 },
  { slot: 'cm_armslot', a: 208 },
];
const CM_CREST = { x: 480, y: 292, R: 122, sock: 152 };
function cmSlotOf(r) { return r && r.id && r.id.startsWith('arm:') ? 'cm_armslot' : r ? r.slot : null; }
function cmWeaponArt(mode, x, y, s, a) {
  c.save(); c.globalAlpha *= (a == null ? 1 : a);
  if (mode === 'claws') cmClawGlyph(x, y, s * 0.42, '#f2fbff');
  else if (mode === 'joined') cmFit(cmArt('swordJoined'), x - s * 0.62, y - s * 0.62, s * 1.24, s * 1.24, 'screen');
  else if (mode === 'dual') {
    const im = cmArt('swordSingle');
    cmFit(im, x - s * 0.6 - s * 0.1, y - s * 0.6, s * 1.2, s * 1.2, 'screen');
    cmFit(im, x - s * 0.6 + s * 0.1, y - s * 0.6, s * 1.2, s * 1.2, 'screen', 1, true);
  } else cmFit(cmArt('swordSingle'), x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2, 'screen');
  c.restore();
}
// the part's own picture, where the game has one; its system's frame where it is a system
function cmPartArt(r, x, y, s, a) {
  const id = r.id;
  if (id.startsWith('weapon:')) return cmWeaponArt(id.slice(7), x, y, s, a);
  if (id === 'dash' || id === 'phantom' || id === 'sprint') return cmFit(cmArt('jetpack'), x - s / 2, y - s / 2, s, s, null, a);
  if (id === 'boots' || id === 'djump' || id === 'ground') return cmFit(cmArt('bootsIdle'), x - s / 2, y - s / 2, s, s, null, a);
  const lo = typeof loadoutKindOf === 'function' ? loadoutKindOf('gear', id) : null;
  if (id.startsWith('arm:')) {
    const arm = typeof ARMS !== 'undefined' && ARMS.find(q => q.id === id.slice(4));
    const col = arm && typeof ELEM !== 'undefined' && ELEM[arm.el] ? ELEM[arm.el].glow : LOADOUT_COL.arm;
    if (typeof drawLoadoutFrame === 'function') { c.save(); c.globalAlpha *= (a == null ? 1 : a); drawLoadoutFrame(c, 'arm', x, y, s * 0.36, r.installed ? 'filled' : r.acquired ? 'empty' : 'locked', '✶', col); c.restore(); }
    return;
  }
  if (lo && typeof drawLoadoutFrame === 'function') { c.save(); c.globalAlpha *= (a == null ? 1 : a); drawLoadoutFrame(c, lo, x, y, s * 0.36, r.installed ? 'filled' : r.acquired ? 'empty' : 'locked'); c.restore(); return; }
  // traversal hardware with no picture of its own: the grip, the pulse, the key
  c.save(); c.globalAlpha *= (a == null ? 1 : a);
  c.font = '700 ' + Math.round(s * 0.42) + 'px "Segoe UI", Tahoma, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = r.acquired ? '#dff6f1' : '#5d6e7b';
  c.fillText(id === 'wall' ? '⟟' : id === 'emp' ? '◎' : id === 'key' ? '⚿' : id === 'shell' ? '⛨' : '◆', x, y + 1);
  c.restore();
}
function cmHeroFigure(x, y, h) {
  const m = typeof weaponMode === 'function' ? weaponMode() : 'claws';
  // she wears what she holds: the single blade on her back only when it is the single blade
  const im = cmArt(m === 'single' ? 'heroYaw' : 'heroYawBare');
  // the floor she stands on: a shadow, never a light
  c.save();
  const sg = c.createRadialGradient(x, y + h * 0.5, 4, x, y + h * 0.5, h * 0.34);
  sg.addColorStop(0, 'rgba(0,0,0,0.65)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sg; c.save(); c.translate(x, y + h * 0.5); c.scale(1, 0.22); c.beginPath(); c.arc(0, 0, h * 0.34, 0, 6.283); c.fill(); c.restore();
  if (im) {
    const cw = im.naturalWidth / 8, ch = im.naturalHeight;
    // the three-quarter cell, turned toward the crest
    cmFit(im, x - h * 0.42, y - h * 0.5, h * 0.84, h, null, 1, true, cw * 1, 0, cw, ch);
  } else ftxt(t('gear_loading'), x, y, 14, CM_DIM);
  c.restore();
}
function cmCrestRing(now, sel) {
  const C = CM_CREST, ring = cmArt('ringConduit');
  c.save();
  // the schematic behind it: slow concentric dials (the machine the crest is a face of)
  c.translate(C.x, C.y);
  for (let k = 0; k < 3; k++) {
    c.save(); c.rotate((k % 2 ? -1 : 1) * now / (9000 + k * 4000));
    c.strokeStyle = 'rgba(233,226,208,' + (0.09 - k * 0.02).toFixed(3) + ')'; c.lineWidth = 1;
    c.setLineDash(k === 1 ? [2, 7] : k === 2 ? [18, 10, 2, 10] : []);
    c.beginPath(); c.arc(0, 0, C.R + 22 + k * 26, 0, 6.283); c.stroke();
    c.restore();
  }
  c.setLineDash([]);
  // ticks round the outer dial
  c.strokeStyle = 'rgba(95,242,214,0.18)';
  for (let i = 0; i < 72; i++) { const a = i / 72 * 6.283, l = i % 6 ? 4 : 9; c.beginPath(); c.moveTo(Math.cos(a) * (C.R + 70), Math.sin(a) * (C.R + 70)); c.lineTo(Math.cos(a) * (C.R + 70 - l), Math.sin(a) * (C.R + 70 - l)); c.stroke(); }
  c.restore();
  // the cables from the ring to its sockets, lit to the one selected
  for (const S of CM_SOCKETS) {
    const a = S.a * Math.PI / 180, x1 = C.x + Math.cos(a) * (C.R - 6), y1 = C.y + Math.sin(a) * (C.R - 6), x2 = C.x + Math.cos(a) * (C.sock - 26), y2 = C.y + Math.sin(a) * (C.sock - 26);
    const on = sel === S.slot;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#06090d'; c.lineWidth = 6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = on ? CM_TEAL : 'rgba(120,140,152,0.6)'; c.lineWidth = on ? 2.2 : 1.4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    if (on) {
      // a pulse running out along the cable to the socket
      const k = (now / 700) % 1, px = x1 + (x2 - x1) * k, py = y1 + (y2 - y1) * k;
      c.fillStyle = 'rgba(217,255,246,0.9)'; c.beginPath(); c.arc(px, py, 2.4, 0, 6.283); c.fill();
    }
    c.restore();
  }
  // the ring itself: the Conduit gate, its hole the crest's heart
  if (ring) {
    const RG = typeof RING_GATE !== 'undefined' && RING_GATE.ringConduit ? RING_GATE.ringConduit : { cx: 0.497, mid: 0.469, rx: 0.317 };
    const s = (C.R * 2) / (RG.rx * 2 * ring.naturalWidth) * 0.62, W = ring.naturalWidth * s, H = ring.naturalHeight * s;
    c.drawImage(ring, C.x - RG.cx * W, C.y - RG.mid * H, W, H);
  } else { c.save(); c.strokeStyle = '#596a74'; c.lineWidth = 14; c.beginPath(); c.arc(C.x, C.y, C.R * 0.6, 0, 6.283); c.stroke(); c.restore(); }
  // its heart: dark, and the blade she holds standing in it
  c.save();
  const hg = c.createRadialGradient(C.x, C.y, 4, C.x, C.y, C.R * 0.42);
  hg.addColorStop(0, 'rgba(18,40,46,0.85)'); hg.addColorStop(1, 'rgba(2,5,8,0.95)');
  c.fillStyle = hg; c.beginPath(); c.ellipse(C.x, C.y + 2, C.R * 0.42, C.R * 0.47, 0, 0, 6.283); c.fill();
  c.restore();
  const m = typeof weaponMode === 'function' ? weaponMode() : 'claws';
  cmWeaponArt(m, C.x, C.y + 2, C.R * 0.74);
}
function cmSocket(S, rowsOf, sel, now) {
  const C = CM_CREST, a = S.a * Math.PI / 180, x = C.x + Math.cos(a) * C.sock, y = C.y + Math.sin(a) * C.sock;
  const rows = rowsOf[S.slot] || [], on = sel === S.slot;
  // (the hands show the blade she holds before any part seated with it)
  const seated = rows.filter(r => r.installed).sort((p, q) => (q.id.startsWith('weapon:') ? 1 : 0) - (p.id.startsWith('weapon:') ? 1 : 0));
  const im = cmArt(on ? 'cmSlotOn' : 'cmSlot'), w = on ? 58 : 50, h = w * 58 / 56;
  c.save();
  c.fillStyle = 'rgba(4,8,12,0.9)'; rr(c, x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 8); c.fill();
  if (im) c.drawImage(im, x - w / 2, y - h / 2, w, h);
  if (on) { c.strokeStyle = 'rgba(95,242,214,' + (0.5 + 0.35 * Math.sin(now / 240)).toFixed(2) + ')'; c.lineWidth = 2; rr(c, x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, 10); c.stroke(); }
  c.restore();
  if (seated.length) cmPartArt(seated[0], x, y, w * 0.7, 1);
  else if (rows.length) { c.save(); c.globalAlpha = 0.35; cmPartArt(rows[0], x, y, w * 0.6, 0.6); c.restore(); }
  if (seated.length > 1) {
    c.save(); c.fillStyle = '#0b1218'; c.strokeStyle = CM_TEAL; c.lineWidth = 1.2;
    c.beginPath(); c.arc(x + w / 2 - 4, y - h / 2 + 4, 9, 0, 6.283); c.fill(); c.stroke();
    c.font = '800 11px "Segoe UI", Tahoma, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = CM_IVORY;
    c.fillText(String(seated.length), x + w / 2 - 4, y - h / 2 + 4.5); c.restore();
  }
  // the slot's name under (or over) it, small
  const ly = S.a > 0 && S.a < 180 ? y + h / 2 + 12 : y - h / 2 - 11;
  ftxt(t(S.slot), x, ly, 11, on ? '#d9fff6' : '#8ea3b2', 'center', null, '700');
}
// the power the optional parts share, as cells
function cmPower(x, y) {
  const used = (G.save.equip || []).reduce((n, id) => n + ((typeof CRESTS !== 'undefined' && CRESTS[id]) || 0), 0), cap = typeof effSlots === 'function' ? effSlots() : 0;
  ftxt(t('crest_slots') + '  ' + used + ' / ' + cap, x, y - 14, 11, '#9fe8d8', 'center', null, '700');
  const n = Math.max(cap, used), w = 18, gap = 6, x0 = x - (n * w + (n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * (w + gap) + w / 2, full = i < used, over = i >= cap;
    c.save(); c.translate(cx, y + 4);
    c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } c.closePath();
    c.fillStyle = full ? (over ? 'rgba(255,110,96,0.85)' : 'rgba(95,242,214,0.85)') : 'rgba(10,18,24,0.9)'; c.fill();
    c.strokeStyle = full ? '#d9fff6' : 'rgba(233,226,208,0.45)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
  }
}
// the new picture of the gear screen (js/gear.js drawGear hands over to this; gearLayout is its geometry)
function cmDrawGear() {
  const now = performance.now(), l = gearLayout(), rows = l.rows, cur = rows[l.index];
  const rowsOf = {}; for (const r of rows) { const s = cmSlotOf(r); (rowsOf[s] = rowsOf[s] || []).push(r); }
  const sel = cmSlotOf(cur);
  // LEFT: her, and what she is
  cmCard(26, 96, 262, 404, true);
  cmHeroFigure(157, 234, 232);
  cmTitle('HZD-99', 157, 370, 17, CM_IVORY);
  cmRule(58, 256, 386, 'rgba(233,226,208,0.45)');
  cmPower(157, 414);
  if (typeof combatStats === 'function' && player) {
    const st = combatStats(player);
    const pairs = [[t('cm_cores'), st.hp + ' / ' + st.hpMax], [t('cm_attack'), String(st.attackPower)], [t('cm_rate'), st.attackSpeed + '/s']];
    pairs.forEach(([k, v], i) => {
      const y = 448 + i * 17;
      ftxt(k, 62, y, 12, '#8ea3b2', 'left', null, '700');
      ftxt(v, 252, y, 13, CM_IVORY, 'right', null, '800');
    });
  }
  // CENTRE: the crest
  cmCrestRing(now, sel);
  for (const S of CM_SOCKETS) cmSocket(S, rowsOf, sel, now);
  // RIGHT: the parts, and the one selected
  cmCard(672, 96, 262, 404);
  l.visible.forEach((r, i) => {
    const y = l.y + i * l.step, on = l.start + i === l.index;
    const row = cmArt(on ? 'cmRowOn' : 'cmRow');
    c.save();
    if (on) {
      c.fillStyle = 'rgba(95,242,214,0.10)'; rr(c, l.x - 4, y - l.h / 2, l.w + 8, l.h, 6); c.fill();
      if (row) c.drawImage(row, l.x - 4, y + l.h / 2 - 5, l.w + 8, 6);
      c.fillStyle = CM_TEAL; c.beginPath(); c.moveTo(l.x - 10, y); c.lineTo(l.x - 4, y - 5); c.lineTo(l.x - 4, y + 5); c.closePath(); c.fill();
    } else if (row) { c.globalAlpha = 0.55; c.drawImage(row, l.x, y - l.h / 2 + 2, l.w, l.h - 4); }
    c.restore();
    const tx = l.rtl ? l.x + l.w - 38 : l.x + 38, al = l.rtl ? 'right' : 'left';
    cmPartArt(r, l.frameX, y, 26, r.acquired ? 1 : 0.4);
    ftxt(t(r.name), tx, y - 7, 13, r.acquired ? (on ? '#ffffff' : '#dfe7ee') : '#66788a', al, null, '700');
    ftxt(t(r.installed ? 'gear_installed' : r.acquired ? 'gear_stored' : 'gear_locked'), tx, y + 9, 10, r.installed ? '#7fe9d4' : '#7c90a1', al, null, '700');
  });
  // the scroll: where in the list, as a thin rail
  if (rows.length > l.visible.length) {
    const top = l.y - l.h / 2, hh = l.visible.length * l.step, k = l.start / (rows.length - l.visible.length);
    c.save(); c.fillStyle = 'rgba(233,226,208,0.12)'; c.fillRect(l.x + l.w + 8, top, 2, hh);
    c.fillStyle = CM_TEAL; c.fillRect(l.x + l.w + 7, top + k * (hh - 30), 4, 30); c.restore();
  }
  // the selected part, said
  const dy = l.y + l.visible.length * l.step - 8;
  cmRule(690, 916, dy, 'rgba(233,226,208,0.4)');
  cmTitle(t(cur.name), 803, dy + 20, 13, cur.acquired ? CM_IVORY : '#8a98a4', 'center', 1);
  ftxt(t(cur.slot) + ' · ' + t(cur.installed ? 'gear_installed' : cur.acquired ? 'gear_stored' : 'gear_locked'), 803, dy + 38, 10, cur.installed ? '#7fe9d4' : '#8ea3b2', 'center', null, '700');
  const fight = typeof crestFightText === 'function' && typeof CRESTS !== 'undefined' && Object.prototype.hasOwnProperty.call(CRESTS, cur.id) ? crestFightText(cur.id) : '';
  const lines = wrapText(t(cur.desc), 222, 11).slice(0, fight ? 2 : 3).concat(fight ? wrapText(fight, 222, 11).slice(0, 2) : []);
  lines.forEach((ln, i) => ftxt(ln, 803, dy + 56 + i * 14, 11, i >= (lines.length - (fight ? 2 : 0)) && fight ? '#e2edf5' : '#b2c6d4', 'center', null, '600'));
  const how = gearHow(cur);
  if (how) wrapText(how, 226, 11).slice(0, 2).forEach((ln, i) => ftxt(ln, 803, dy + 60 + lines.length * 14 + i * 14, 11, CM_GOLD, 'center', null, '700'));
  cmHints([[cmOkCap(), t('cm_install')], [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}

// ---------- INVENTORY -------------------------------------------------------------------------
const CM_BAG = { x: 70, y: 150, cols: 6, rows: 4, s: 74, gap: 12 };
const CM_ITEM_ART = { ratchetCell: 'spareCell', batt: 'spareCell', cshard: 'rawMarble' };
function cmBagPos(i) { const B = CM_BAG; return { x: B.x + (i % B.cols) * (B.s + B.gap) + B.s / 2, y: B.y + Math.floor(i / B.cols) * (B.s + B.gap) + B.s / 2 }; }
function cmUpdateBag() {
  const list = typeof bagList === 'function' ? bagList() : [];
  if (inP('BACK')) { cmClose(); return; }
  // (her blades and powers are the equipment page: the key that opens it anywhere, or OK on an
  // empty bag, turns to it — tests/gear-how.cjs)
  if (inP('CREST') || (!list.length && inP('OK'))) { cmGo('CREST'); return; }
  if (!list.length) return;
  const n = list.length, B = CM_BAG; let i = Math.min(G.bagIdx || 0, n - 1);
  if (inP('RIGHT')) i = (i + 1) % n;
  else if (inP('LEFT')) i = (i + n - 1) % n;
  else if (inP('DOWN')) i = Math.min(n - 1, i + B.cols);
  else if (inP('UP')) i = Math.max(0, i - B.cols);
  if (i !== G.bagIdx) { G.bagIdx = i; sfx('ui'); }
  if (inP('OK')) {
    const it = list[G.bagIdx];
    if (it && it.use && player && player.cores < player.maxCores()) {
      invTake(it.id); player.cores = Math.min(player.maxCores(), player.cores + 2);
      sfx('heal'); G.toast(t('i_kit_used')); G.state = 'PLAY';
    } else sfx('no');
  }
}
function cmCounter(x, y, art, glyph, col, label, n) {
  c.save();
  c.fillStyle = 'rgba(8,14,20,0.85)'; c.strokeStyle = 'rgba(233,226,208,0.25)'; c.lineWidth = 1;
  rr(c, x, y - 17, 156, 34, 17); c.fill(); c.stroke();
  c.restore();
  if (art && cmArt(art)) cmFit(cmArt(art), x + 4, y - 14, 28, 28);
  else ftxt(glyph, x + 18, y, 17, col, 'center', null, '800');
  ftxt(label, x + 40, y - 6, 10, '#8ea3b2', 'left', null, '700');
  ftxt(String(n), x + 40, y + 8, 14, col, 'left', null, '800');
}
function cmDrawBag(now) {
  const list = typeof bagList === 'function' ? bagList() : [];
  // what she has to spend, counted
  cmCounter(70, 116, 'scrapPile', '⬢', CM_GOLD, t('cm_scrap'), (G.save && G.save.scrap) | 0);
  cmCounter(240, 116, null, '◆', '#c9b2ff', t('sk_iq'), (G.save && G.save.iq) | 0);
  if (typeof player !== 'undefined' && player && player.maxCores) cmCounter(410, 116, null, '✚', '#7dff9a', t('cm_cores'), player.cores + ' / ' + player.maxCores());
  // the sockets: carried things in them, the rest empty and waiting
  const B = CM_BAG, total = B.cols * B.rows, sel = Math.min(G.bagIdx || 0, Math.max(0, list.length - 1));
  for (let i = 0; i < total; i++) {
    const P = cmBagPos(i), it = list[i], on = it && i === sel, im = cmArt(on ? 'cmSlotOn' : 'cmSlot');
    c.save();
    c.fillStyle = 'rgba(4,8,12,0.9)'; rr(c, P.x - B.s / 2 + 4, P.y - B.s / 2 + 4, B.s - 8, B.s - 8, 8); c.fill();
    if (im) { c.globalAlpha = it ? 1 : 0.45; c.drawImage(im, P.x - B.s / 2, P.y - B.s / 2, B.s, B.s); }
    if (on) { c.globalAlpha = 1; c.strokeStyle = 'rgba(95,242,214,' + (0.5 + 0.35 * Math.sin(now / 240)).toFixed(2) + ')'; c.lineWidth = 2; rr(c, P.x - B.s / 2 - 4, P.y - B.s / 2 - 4, B.s + 8, B.s + 8, 11); c.stroke(); }
    c.restore();
    if (!it) continue;
    const meta = (typeof INV !== 'undefined' && INV[it.id]) || { icon: '◆', col: '#8aa2b5' }, art = CM_ITEM_ART[it.id];
    if (art && cmArt(art)) cmFit(cmArt(art), P.x - 25, P.y - 25, 50, 50);
    else ftxt(meta.icon, P.x, P.y, 30, meta.col, 'center', null, '800');
    if (it.n > 1) ftxt('×' + it.n, P.x + B.s / 2 - 10, P.y + B.s / 2 - 12, 12, CM_IVORY, 'right', null, '800');
    if (it.quest) { c.save(); c.fillStyle = CM_GOLD; c.beginPath(); c.arc(P.x - B.s / 2 + 12, P.y - B.s / 2 + 12, 4, 0, 6.283); c.fill(); c.restore(); }
  }
  // her blades and powers are the next page over, and the key that opens it is said (tests/gear-how.cjs)
  ftxt(t('bag_gear').replace('%k', howToOpen('CREST', t('crest_title'))), 328, 496, 12, CM_GOLD, 'center', null, '700');
  // the card: the selected thing
  cmCard(620, 96, 314, 404);
  const it = list[sel];
  if (!it) {
    cmTitle(t('pm_bag'), 777, 150, 15, CM_IVORY);
    wrapText(t('bag_none'), 250, 13).forEach((ln, i) => ftxt(ln, 777, 200 + i * 19, 13, '#9fb3c2', 'center', null, '600'));
  } else {
    const meta = (typeof INV !== 'undefined' && INV[it.id]) || { icon: '◆', col: '#8aa2b5' }, art = CM_ITEM_ART[it.id];
    c.save(); const g = c.createRadialGradient(777, 196, 6, 777, 196, 70); g.addColorStop(0, 'rgba(30,60,64,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(700, 120, 154, 150); c.restore();
    if (art && cmArt(art)) cmFit(cmArt(art), 727, 146, 100, 100);
    else ftxt(meta.icon, 777, 196, 60, meta.col, 'center', null, '800');
    cmTitle(t('i_' + it.id), 777, 272, 15, CM_IVORY, 'center', 2);
    if (it.n > 1) ftxt('×' + it.n, 777, 294, 13, CM_GOLD, 'center', null, '800');
    cmRule(650, 904, 310, 'rgba(233,226,208,0.4)');
    wrapText(t('i_' + it.id + 'd'), 262, 13).slice(0, 6).forEach((ln, i) => ftxt(ln, 777, 334 + i * 18, 13, '#b8cad8', 'center', null, '600'));
    if (it.use) ftxt(t('i_use'), 777, 470, 13, '#7dff9a', 'center', null, '800');
    if (it.quest) ftxt(t('cm_quest'), 777, 470, 12, CM_GOLD, 'center', null, '700');
  }
  cmHints([list[sel] && list[sel].use ? [cmOkCap(), t('cm_use')] : null, [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}

// ---------- NEURAL TREE -----------------------------------------------------------------------
function cmHexPath(x, y, r) {
  c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9); } c.closePath();
}
function cmDrawSkills(now) {
  const L = skillLayout(), pool = L.pool, cols = L.cols, pos = L.pos;
  ftxt('◆ ' + t('sk_iq') + '  ' + ((G.save && G.save.iq) | 0), 34, 116, 15, '#c9b2ff', 'left', null, '800');
  // the cables between the rungs, lit where she has climbed
  for (let i = cols; i < pool.length; i++) {
    const a = pos(i - cols), b = pos(i), lit = G.save.skills.indexOf(pool[i].id) >= 0;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#06090d'; c.lineWidth = 8; c.beginPath(); c.moveTo(a.x, a.y + 28); c.lineTo(b.x, b.y - 28); c.stroke();
    c.strokeStyle = lit ? '#b48cff' : 'rgba(110,120,150,0.55)'; c.lineWidth = lit ? 3 : 2; if (!lit) c.setLineDash([5, 6]);
    c.beginPath(); c.moveTo(a.x, a.y + 28); c.lineTo(b.x, b.y - 28); c.stroke(); c.restore();
  }
  const sock = cmArt('ptSocket');
  pool.forEach((sk, i) => {
    const p = pos(i), owned = G.save.skills.indexOf(sk.id) >= 0, open = tierOpen(sk.tier, G.save.skills.length);
    const afford = open && !owned && G.save.iq >= sk.cost, sel = i === G.skillIdx, cry = !!sk.need;
    if (sock) c.drawImage(sock, p.x - 36, p.y - 32, 72, 64);
    else { cmHexPath(p.x, p.y, 32); c.fillStyle = '#121c26'; c.fill(); }
    cmHexPath(p.x, p.y, 26);
    c.fillStyle = owned ? 'rgba(125,232,160,0.22)' : afford ? (cry ? 'rgba(235,245,255,' : 'rgba(180,140,255,') + (0.16 + Math.sin(now / 300) * 0.08).toFixed(3) + ')' : 'rgba(20,26,36,0.7)';
    c.fill();
    c.lineWidth = sel ? 2.6 : 1.4; c.strokeStyle = sel ? '#ffffff' : owned ? '#7de8a0' : afford ? (cry ? '#e8f4ff' : '#b48cff') : '#44586b'; c.stroke();
    if (sel) { cmHexPath(p.x, p.y, 38); c.strokeStyle = 'rgba(238,243,250,' + (0.4 + 0.3 * Math.sin(now / 220)).toFixed(2) + ')'; c.lineWidth = 1.4; c.stroke(); }
    ftxt(owned ? '✓' : (open ? String(sk.cost) : '🔒'), p.x, p.y + 1, owned ? 18 : 13, owned ? '#7de8a0' : open ? '#dbe7f2' : '#607386', 'center', null, '800');
    ftxt(t('sk_' + sk.id), p.x, p.y + 44, 12, sel ? '#ffffff' : '#8aa2b5', 'center', null, '700');
  });
  // the window that shows the move, played out of her own sheet (js/riddles.js drawSkillDemo)
  const cur = pool[Math.min(G.skillIdx, pool.length - 1)], d = L.demo;
  cmCard(d.x - 16, d.y - 40, d.w + 32, 352);
  cmTitle(t('sk_' + cur.id), d.x + d.w / 2, d.y - 16, 13, '#d9c8ff', 'center', 2);
  if (typeof drawSkillDemo === 'function') drawSkillDemo(c, d.x, d.y, d.w, d.h, cur.id, now / 1000);
  wrapText(t('sk_' + cur.id + 'd'), d.w - 6, 12).slice(0, 5).forEach((ln, i) => ftxt(ln, d.x + d.w / 2, d.y + d.h + 22 + i * 16, 12, '#b8cad8', 'center', null, '600'));
  const owned = G.save.skills.indexOf(cur.id) >= 0;
  cmHints([owned ? null : [cmOkCap(), t('cm_learn')], [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}

// ---------- SKILL TREES: the pack's ladder, framed ----------------------------------------------
// drawn into its own canvas and laid under the medallions a little smaller; a tap is carried back
// to the tree's own geometry (cmTap)
const CM_TREE = { s: 0.80, cx: 480, cy: 296 };
let CM_TREE_CV = null;
function cmDrawTree() {
  if (typeof drawTree !== 'function') return;
  const W = cv.width, H = cv.height;
  if (!CM_TREE_CV || CM_TREE_CV.width !== W || CM_TREE_CV.height !== H) { CM_TREE_CV = document.createElement('canvas'); CM_TREE_CV.width = W; CM_TREE_CV.height = H; }
  const q = CM_TREE_CV.getContext('2d'), keep = c;
  q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W, H); q.setTransform(keep.getTransform());
  c = q;
  try { drawTree(); } catch (e) {} finally { c = keep; }
  const T = CM_TREE;
  // only the tree's own frame is laid on the page (its full-screen wash stays behind in its canvas)
  const F = typeof ptLayout === 'function' ? ptLayout().frame : { x: 0, y: 0, w: 960, h: 540 };
  const kx = W / 960, ky = H / 540, m = 6;
  c.save();
  c.translate(T.cx, T.cy); c.scale(T.s, T.s); c.translate(-480, -270);
  c.drawImage(CM_TREE_CV, (F.x - m) * kx, (F.y - m) * ky, (F.w + 2 * m) * kx, (F.h + 2 * m) * ky, F.x - m, F.y - m, F.w + 2 * m, F.h + 2 * m);
  c.restore();
  cmHints([[cmOkCap(), t('cm_select')], [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}
function cmTreeTap(x, y) { const T = CM_TREE; return { x: (x - T.cx) / T.s + 480, y: (y - T.cy) / T.s + 270 }; }

// ---------- RELICS ----------------------------------------------------------------------------
function cmRelicPos(i) { return relicsLayout().pos(i); }
function cmUpdateRelics() {
  const owned = (G.save && G.save.relics) || [], n = owned.length;
  if (inP('BACK') || inP('OK') && !n) { cmClose(); return; }
  if (!n) return;
  let i = Math.min(CM.relIdx || 0, n - 1);
  if (inP('RIGHT')) i = (i + 1) % n; else if (inP('LEFT')) i = (i + n - 1) % n;
  else if (inP('DOWN')) i = Math.min(n - 1, i + 5); else if (inP('UP')) i = Math.max(0, i - 5);
  if (i !== CM.relIdx) { CM.relIdx = i; sfx('ui'); }
}
function cmDrawRelics(now) {
  const owned = (G.save && G.save.relics) || [];
  const slots = Math.max(15, Math.ceil(owned.length / 5) * 5), sel = Math.min(CM.relIdx || 0, Math.max(0, owned.length - 1));
  for (let i = 0; i < Math.min(slots, 15); i++) {
    const P = cmRelicPos(i), id = owned[i], on = id && i === sel;
    if (typeof drawLoadoutFrame === 'function') drawLoadoutFrame(c, 'relic', P.x, P.y, on ? 30 : 26, id ? 'filled' : 'locked', id ? (RELIC_ICONS[id] || '◆') : '', '#eef3fa');
    if (on) { c.save(); c.strokeStyle = 'rgba(238,243,250,' + (0.4 + 0.3 * Math.sin(now / 220)).toFixed(2) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(P.x, P.y, 40, 0, 6.283); c.stroke(); c.restore(); }
    if (id) ftxt(t('rl_' + id), P.x, P.y + 44, 11, on ? '#ffffff' : '#8aa2b5', 'center', null, '700');
  }
  cmCard(620, 96, 314, 404);
  const id = owned[sel];
  if (!id) wrapText(t('rl_none'), 250, 13).forEach((ln, i) => ftxt(ln, 777, 220 + i * 20, 13, '#9fb3c2', 'center', null, '600'));
  else {
    if (typeof drawLoadoutFrame === 'function') drawLoadoutFrame(c, 'relic', 777, 196, 50, 'filled', RELIC_ICONS[id] || '◆', '#eef3fa');
    cmTitle(t('rl_' + id), 777, 276, 15, CM_IVORY, 'center', 2);
    cmRule(650, 904, 298, 'rgba(233,226,208,0.4)');
    wrapText(t('rl_' + id + 'd'), 262, 13).slice(0, 7).forEach((ln, i) => ftxt(ln, 777, 322 + i * 18, 13, '#b8cad8', 'center', null, '600'));
  }
  cmHints([[cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}

// ---------- MAP: the map in a frame; OK opens it whole ------------------------------------------
let CM_MAP_CV = null;
function cmUpdateMap() {
  if (inP('BACK')) { cmClose(); return; }
  if (inP('OK') || inP('MAP')) { G.state = 'MAP'; if (typeof mapView !== 'undefined') mapView.ready = false; sfx('ui'); }
}
function cmDrawMapTab(now) {
  const W = cv.width, H = cv.height;
  if (!CM_MAP_CV || CM_MAP_CV.width !== W || CM_MAP_CV.height !== H) { CM_MAP_CV = document.createElement('canvas'); CM_MAP_CV.width = W; CM_MAP_CV.height = H; }
  // the chart laid out whole (its own fit), as the map opens
  if (typeof mapView !== 'undefined' && !mapView.ready && typeof mapOpen === 'function') { try { mapOpen(); if (typeof mapFit === 'function') mapFit(); } catch (e) {} }
  const q = CM_MAP_CV.getContext('2d'), keep = c;
  q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W, H); q.setTransform(keep.getTransform());
  c = q;
  try { if (typeof drawMap === 'function') drawMap(); } catch (e) {} finally { c = keep; }
  // the map's middle, framed (its own title, buttons and legend are the whole map's, not the page's)
  const fx = 60, fy = 104, fw = 840, fh = 372;
  cmCard(fx - 14, fy - 14, fw + 28, fh + 28);
  c.save(); rr(c, fx, fy, fw, fh, 8); c.clip();
  const sx = 80 / 960 * W, sy = 70 / 540 * H, sw = 800 / 960 * W, sh = 380 / 540 * H;
  c.drawImage(CM_MAP_CV, sx, sy, sw, sh, fx, fy, fw, fh);
  c.restore();
  cmHints([[cmOkCap(), t('cm_open_map')], [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('cm_close')]]);
}

// ---------- SYSTEM: the pause list, on its own page ----------------------------------------------
function cmDrawSystem(now) {
  ftxt(pauseWorldLine(), 480, 112, 12, '#7d93a8', 'center', null, '600');
  const PL = pauseLayout(), pm = PL.items, step = PL.step, fs = Math.min(PL.cols === 2 ? 16 : 19, step * 0.5);
  if (PL.cols === 2) { const a = PL.pos(0).x, b = PL.pos(PL.split).x, hw = PL.colW / 2 + 12; cmCard(a - hw, 160, hw * 2, 318, true); cmCard(b - hw, 160, hw * 2, 318, true); }
  else cmCard(280, 128, 400, 390, true);
  pm.forEach((it, i) => {
    const sel = i === G.pauseIdx, P = PL.pos(i), x = P.x, y = P.y, w = PL.colW;
    c.save();
    if (it.warn) { c.fillStyle = it.out ? 'rgba(255,120,110,0.10)' : 'rgba(255,190,110,0.09)'; rr(c, x - w / 2, y - step * 0.46, w, step * 0.86, 6); c.fill(); }
    if (sel) {
      c.fillStyle = 'rgba(95,242,214,0.10)'; rr(c, x - w / 2, y - step * 0.46, w, step * 0.86, 6); c.fill();
      const ro = cmArt('cmRowOn'); if (ro) c.drawImage(ro, x - w / 2, y + step * 0.36, w, 5);
    }
    c.restore();
    const rowTxt = (it.icon ? it.icon + '  ' : '') + it.label;
    ftxt(rowTxt, x, y, fs, sel ? '#ffffff' : (it.out ? '#e88b86' : it.warn ? '#e8bb86' : '#9fb3c2'), 'center', null, '700');
    if (it.lo && typeof drawLoadoutFrame === 'function') {
      c.font = '700 ' + fs + 'px "Segoe UI", Tahoma, sans-serif';
      const hw = c.measureText(rowTxt).width / 2, fr = Math.max(6, Math.min(9, step * 0.26)), rtl = typeof isRTL === 'function' && isRTL();
      drawLoadoutFrame(c, it.lo, rtl ? x + hw + fr + 8 : x - hw - fr - 8, y, fr, sel ? 'filled' : 'empty');
    }
    if (!sel) return;
    const line = G.pauseConfirm === it.id ? t('pm_confirm') : it.hint;
    if (!line) return;
    const col = G.pauseConfirm === it.id ? CM_GOLD : '#9fb8c8';
    if (PL.cols === 2) wrapLines(c, line, 820, '700 13px "Segoe UI", Tahoma, sans-serif').slice(0, 2).forEach((l2, k, a) => ftxt(l2, 480, 498 - (a.length - 1) * 8 + k * 16, 13, col));
    else ftxt(line, 480, y + step * (i >= pm.length - 2 ? -0.5 : 0.52), 11, col);
  });
  drawFooter(532, true);
  cmHints([[cmOkCap(), t('cm_select')], [cmBumperLabel(-1) + ' ' + cmBumperLabel(1), t('cm_tabs')], [cmBackCap(), t('resume')]]);
}

// ---------- touch: the medallions, the pages that are new ------------------------------------
function cmTap(x, y) {
  if (!cmOn()) return false;
  if (y <= 58) {
    for (const q of cmTabGeom()) if (Math.hypot(x - q.x, y - q.y) <= CM_BAR.rOn + 6) { cmGo(q.tb.st); return true; }
    const T = cmTabGeom();
    if (Math.abs(y - CM_BAR.y) < 16 && x < T[0].x - 30) { cmSwitch(-1); return true; }
    if (Math.abs(y - CM_BAR.y) < 16 && x > T[T.length - 1].x + 30) { cmSwitch(1); return true; }
    return false;
  }
  if (G.state === 'BAG') {
    const list = typeof bagList === 'function' ? bagList() : [];
    for (let i = 0; i < list.length; i++) { const P = cmBagPos(i); if (Math.abs(x - P.x) <= CM_BAG.s / 2 && Math.abs(y - P.y) <= CM_BAG.s / 2) { if (G.bagIdx === i) tPress('VOK'); else { G.bagIdx = i; sfx('ui'); } return true; } }
    return true;
  }
  if (G.state === 'RELICS') {
    const owned = (G.save && G.save.relics) || [];
    for (let i = 0; i < owned.length; i++) { const P = cmRelicPos(i); if (Math.hypot(x - P.x, y - P.y) <= 34) { CM.relIdx = i; sfx('ui'); return true; } }
    return true;
  }
  if (G.state === 'CMAP') { if (x > 46 && x < 914 && y > 90 && y < 490) tPress('VOK'); return true; }
  if (G.state === 'TREE') { const p = cmTreeTap(x, y); if (typeof ptTap === 'function') ptTap(p.x, p.y); return true; }
  return false;
}

// ---------- its words, in the five languages ---------------------------------------------------
if (typeof TEXT_LAYERS !== 'undefined') TEXT_LAYERS.push({
  robo: true,
  en: { cm_system: 'System', cm_tabs: 'Pages', cm_close: 'Close', cm_select: 'Select', cm_install: 'Install / remove', cm_learn: 'Learn',
    cm_open_map: 'Open the map', cm_scrap: 'Scrap', cm_cores: 'Cores', cm_attack: 'Attack', cm_rate: 'Swings', cm_quest: 'Someone is waiting for this', cm_use: 'Use',
    cm_armslot: 'Suit' },
  ar: { cm_system: 'النظام', cm_tabs: 'الصفحات', cm_close: 'إغلاق', cm_select: 'اختيار', cm_install: 'تركيب / نزع', cm_learn: 'تعلّم',
    cm_open_map: 'افتح الخريطة', cm_scrap: 'خردة', cm_cores: 'النوى', cm_attack: 'الهجوم', cm_rate: 'الضربات', cm_quest: 'أحدهم ينتظر هذا', cm_use: 'استخدام',
    cm_armslot: 'البدلة' },
  tr: { cm_system: 'Sistem', cm_tabs: 'Sayfalar', cm_close: 'Kapat', cm_select: 'Seç', cm_install: 'Tak / çıkar', cm_learn: 'Öğren',
    cm_open_map: 'Haritayı aç', cm_scrap: 'Hurda', cm_cores: 'Çekirdek', cm_attack: 'Saldırı', cm_rate: 'Vuruş', cm_quest: 'Birisi bunu bekliyor', cm_use: 'Kullan',
    cm_armslot: 'Zırh' },
  zh: { cm_system: '系统', cm_tabs: '翻页', cm_close: '关闭', cm_select: '选择', cm_install: '安装 / 卸下', cm_learn: '学习',
    cm_open_map: '打开地图', cm_scrap: '废料', cm_cores: '核心', cm_attack: '攻击', cm_rate: '挥击', cm_quest: '有人在等它', cm_use: '使用',
    cm_armslot: '战衣' },
  ru: { cm_system: 'Система', cm_tabs: 'Страницы', cm_close: 'Закрыть', cm_select: 'Выбрать', cm_install: 'Установить / снять', cm_learn: 'Изучить',
    cm_open_map: 'Открыть карту', cm_scrap: 'Лом', cm_cores: 'Ядра', cm_attack: 'Атака', cm_rate: 'Удары', cm_quest: 'Кто-то ждёт это', cm_use: 'Использовать',
    cm_armslot: 'Костюм' },
});
