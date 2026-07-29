// CLAWBYTE — input, camera, particles, helpers
const KEYB = {
  LEFT: ['ArrowLeft', 'KeyA', 'VL', 'GP_L'], RIGHT: ['ArrowRight', 'KeyD', 'VR', 'GP_R'],
  UP: ['ArrowUp', 'KeyW', 'VU', 'GP_U'], DOWN: ['ArrowDown', 'KeyS', 'VD', 'GP_D'],
  JUMP: ['KeyZ', 'Space', 'VJUMP', 'GP_JUMP'], ATK: ['KeyX', 'KeyJ', 'VATK', 'GP_ATK'],
  DASH: ['KeyC', 'ShiftLeft', 'ShiftRight', 'VDASH', 'GP_DASH'], CAST: ['KeyV', 'KeyK', 'VCAST', 'GP_CAST'],
  HEAL: ['KeyF', 'KeyH', 'VHEAL', 'GP_HEAL'], INT: ['KeyE', 'VINT', 'GP_INT'],
  CLAW: ['KeyQ', 'KeyR', 'VCLAW', 'GP_CLAW'],
  ARM: ['KeyG', 'Digit1', 'VARM', 'GP_ARM'], SONG: ['KeyB', 'KeyN', 'VSONG', 'GP_SONG'],
  MAP: ['Tab', 'KeyM', 'VMAP', 'GP_MAP'], CREST: ['KeyI', 'VCREST', 'GP_CREST'], SKILL: ['KeyT', 'VSKILL', 'GP_SKILL'],
  PAUSE: ['Escape', 'KeyP', 'VPAUSE', 'GP_PAUSE'],
  OK: ['Enter', 'KeyZ', 'Space', 'VOK', 'GP_OK'], BACK: ['Escape', 'VBACK', 'GP_BACK'],
};
const keys = {}, keysP = {};
// ---------------------------------------------------------------------------
// Gamepad. A Bluetooth pad on a phone should turn the game into a console: the
// touch gutters disappear, the picture grows to fill the screen, and every
// action moves onto a real button. Detection is automatic on first input.
// ---------------------------------------------------------------------------
const GP_CODES = ['GP_L', 'GP_R', 'GP_U', 'GP_D', 'GP_JUMP', 'GP_ATK', 'GP_DASH', 'GP_CAST', 'GP_HEAL', 'GP_INT', 'GP_MAP', 'GP_PAUSE', 'GP_OK', 'GP_BACK', 'GP_CLAW', 'GP_ARM', 'GP_SONG', 'GP_SKILL', 'GP_CREST'];
const GP_PREV = {};

// Standard-mapping button indices, which every DualShock 4 / DualSense reports.
const PAD_BTN = {
  0: 'Cross', 1: 'Circle', 2: 'Square', 3: 'Triangle',
  4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
  8: 'Share', 9: 'Options', 10: 'L3', 11: 'R3',
  12: 'D-Up', 13: 'D-Down', 14: 'D-Left', 15: 'D-Right', 16: 'PS',
};
const PAD_BTN_XB = {
  0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
  8: 'View', 9: 'Menu', 10: 'LS', 11: 'RS',
  12: 'D-Up', 13: 'D-Down', 14: 'D-Left', 15: 'D-Right', 16: 'Guide',
};
// every action that lives on a face/shoulder button, in the order the config
// screen lists them. Movement stays on the stick + d-pad and is not remappable.
const PAD_ACTIONS = ['JUMP', 'ATK', 'DASH', 'CAST', 'ARM', 'SONG', 'CLAW', 'HEAL', 'INT', 'MAP', 'SKILL', 'CREST', 'PAUSE'];
const PAD_DEFAULT = {
  JUMP: 0, ATK: 2, INT: 1, HEAL: 3,
  DASH: 5,        // R1
  CAST: 7,        // R2 — fire the suit
  ARM: 4,         // L1 — change suit
  SONG: 6,        // L2 — the Song
  CLAW: 10,       // L3
  MAP: 11,        // R3
  SKILL: 8,       // Share
  CREST: 16,      // PS
  PAUSE: 9,       // Options
};
const PAD = {
  on: false, id: '', kind: 'generic', idx: -1,
  map: Object.assign({}, PAD_DEFAULT),
  down: {},          // live button state, for the config screen
  lastPress: -1,     // most recent button index, for "press to bind"
  listen: null,      // action currently awaiting a button
  seen: false,
};
function padLabel(i) {
  if (i == null || i < 0) return '—';
  return (PAD.kind === 'xbox' ? PAD_BTN_XB[i] : PAD_BTN[i]) || ('B' + i);
}
function padKindOf(id) {
  const s = (id || '').toLowerCase();
  if (/dualshock|dualsense|playstation|054c|wireless controller/.test(s)) return 'ps';
  if (/xbox|xinput|045e/.test(s)) return 'xbox';
  return 'generic';
}
function padSave() {
  try { localStorage.setItem('cb_padmap', JSON.stringify(PAD.map)); } catch (e) {}
}
function padLoad() {
  try {
    const v = JSON.parse(localStorage.getItem('cb_padmap') || 'null');
    if (v && typeof v === 'object') PAD.map = Object.assign({}, PAD_DEFAULT, v);
  } catch (e) {}
}
padLoad();
function padReset() { PAD.map = Object.assign({}, PAD_DEFAULT); padSave(); }
// bind an action, clearing whatever else held that button so two moves can
// never share one key by accident
function padBind(action, btn) {
  for (const a of PAD_ACTIONS) if (a !== action && PAD.map[a] === btn) PAD.map[a] = -1;
  PAD.map[action] = btn; padSave();
}

function padConnected(on, gp) {
  if (on === PAD.on) return;
  PAD.on = on;
  if (on) { PAD.id = (gp && gp.id) || ''; PAD.kind = padKindOf(PAD.id); }
  // the whole point: with a pad attached the touch gutters go away and the
  // picture takes the space they were using
  if (typeof TOUCH !== 'undefined') {
    if (typeof tcResize === 'function') tcResize();
    if (typeof tc !== 'undefined' && tc) {
      tc.style.display = on ? 'none' : 'block';
      tc.style.pointerEvents = on ? 'none' : 'auto';
    }
  }
  if (typeof G !== 'undefined' && G.toast && typeof t === 'function')
    G.toast(on ? t('pad_on') : t('pad_off'));
}
addEventListener('gamepadconnected', e => {
  try { audioOn(); } catch (er) {}
  padConnected(true, e.gamepad);
});
addEventListener('gamepaddisconnected', () => padConnected(false, null));

function pollGamepad() {
  if (!navigator.getGamepads) return;
  let gp = null;
  for (const pd of navigator.getGamepads()) if (pd && pd.connected) { gp = pd; break; }
  if (gp && !PAD.on) padConnected(true, gp);
  else if (!gp && PAD.on) padConnected(false, null);
  // the connect event does not always carry the pad (and some browsers fire a
  // bare event), so learn the identity from the poll the moment it is available
  if (gp && gp.id && PAD.id !== gp.id) { PAD.id = gp.id; PAD.kind = padKindOf(gp.id); }
  const st = {};
  if (gp) {
    const b = gp.buttons, ax = gp.axes || [];
    const P = i => i >= 0 && b[i] && (b[i].pressed || b[i].value > 0.4);
    const A0 = ax[0] || 0, A1 = ax[1] || 0;
    // movement: left stick and d-pad both, always
    st.GP_L = P(14) || A0 < -0.4; st.GP_R = P(15) || A0 > 0.4;
    st.GP_U = P(12) || A1 < -0.4; st.GP_D = P(13) || A1 > 0.4;
    // live state + edge capture, so the config screen can show presses and bind
    PAD.lastPress = -1;
    for (let i = 0; i < b.length; i++) {
      const on = P(i);
      if (on && !PAD.down[i]) PAD.lastPress = i;
      PAD.down[i] = on;
    }
    // everything else comes from the (remappable) table
    for (const a of PAD_ACTIONS) st['GP_' + a] = P(PAD.map[a]);
    st.GP_OK = st.GP_JUMP; st.GP_BACK = st.GP_INT;
    // while rebinding, swallow the actions so a bind press does not also fire
    if (PAD.listen) for (const c of GP_CODES) st[c] = false;
  }
  for (const code of GP_CODES) {
    const on = !!st[code];
    if (on) { keys[code] = 1; if (!GP_PREV[code]) keysP[code] = 1; }
    else keys[code] = 0;
    GP_PREV[code] = on;
  }
}
addEventListener('keydown', e => {
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys[e.code] = 1; keysP[e.code] = 1; }
  audioOn();
});
addEventListener('keyup', e => { keys[e.code] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
function inD(n) { return KEYB[n].some(c => keys[c]); }
function inP(n) { return KEYB[n].some(c => keysP[c]); }
function clearP() { for (const k in keysP) keysP[k] = 0; }

const cam = { x: 0, y: 0, shake: 0 };
function updateCam(px, py, rw, rh, dt) {
  // look-ahead in the facing direction; snappier horizontally than vertically
  const lead = (typeof player !== 'undefined' && player && !player.dead) ? player.face * 65 : 0;
  const tx = clamp(px - 480 + lead, 0, Math.max(0, rw - 960));
  const ty = clamp(py - 300, 0, Math.max(0, rh - 540));
  cam.x = lerp(cam.x, tx, 1 - Math.pow(0.0002, dt));
  cam.y = lerp(cam.y, ty, 1 - Math.pow(0.0035, dt));
  cam.shake = Math.max(0, cam.shake - dt * 22);
}
function camSX() { return cam.x + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }
function camSY() { return cam.y + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }

let parts = [];
function addPart(x, y, vx, vy, life, color, size, grav, glow) {
  if (parts.length > 600) return;
  parts.push({ x, y, vx, vy, life, life0: life, color, size: size || 3, grav: grav == null ? 600 : grav, glow: !!glow });
}
function burst(x, y, n, color, sp, life, grav, size, glow) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.3, sp);
    addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd((life || 0.6) * 0.5, life || 0.6), color, rnd(1.5, size || 4), grav, glow);
  }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
function drawParts(c) {
  for (const p of parts) {
    c.globalAlpha = Math.max(0, p.life / p.life0);
    if (p.glow) { c.shadowColor = p.color; c.shadowBlur = 10; }
    c.fillStyle = p.color;
    c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, k) { return a + (b - a) * k; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
function chance(p) { return Math.random() < p; }
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
