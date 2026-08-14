// CLAWBYTE — input, camera, particles, helpers
const KEYB = {
  LEFT: ['ArrowLeft', 'KeyA', 'VL', 'GP_L'], RIGHT: ['ArrowRight', 'KeyD', 'VR', 'GP_R'],
  UP: ['ArrowUp', 'KeyW', 'VU', 'GP_U'], DOWN: ['ArrowDown', 'KeyS', 'VD', 'GP_D'],
  JUMP: ['KeyZ', 'Space', 'VJUMP', 'GP_JUMP'], ATK: ['KeyX', 'KeyJ', 'VATK', 'GP_ATK'],
  DASH: ['KeyC', 'ShiftLeft', 'ShiftRight', 'VDASH', 'GP_DASH'], CAST: ['KeyV', 'KeyK', 'VCAST', 'GP_CAST'],
  HEAL: ['KeyF', 'KeyH', 'VHEAL', 'GP_HEAL'], INT: ['KeyE', 'VINT', 'GP_INT'],
  CLAW: ['KeyQ', 'VCLAW', 'GP_CLAW'],
  ARM: ['KeyG', 'Digit1', 'VARM', 'GP_ARM'], SONG: ['KeyB', 'KeyN', 'VSONG', 'GP_SONG'],
  STAR: ['KeyR', 'Digit2', 'VSTAR', 'GP_STAR'],
  MAP: ['Tab', 'KeyM', 'VMAP', 'GP_MAP'], BRAID: ['KeyY', 'VBRAID', 'GP_BRAID'], CREST: ['KeyI', 'VCREST', 'GP_CREST'], SKILL: ['KeyT', 'VSKILL', 'GP_SKILL'],
  PAUSE: ['Escape', 'KeyP', 'VPAUSE', 'GP_PAUSE'],
  OK: ['Enter', 'KeyZ', 'Space', 'VOK', 'GP_OK'], BACK: ['Escape', 'VBACK', 'GP_BACK'],
};
const keys = {}, keysP = {};
// ---------------------------------------------------------------------------
// Gamepad. A Bluetooth pad on a phone should turn the game into a console: the
// touch gutters disappear, the picture grows to fill the screen, and every
// action moves onto a real button. Detection is automatic on first input.
// ---------------------------------------------------------------------------
const GP_CODES = ['GP_L', 'GP_R', 'GP_U', 'GP_D', 'GP_JUMP', 'GP_ATK', 'GP_DASH', 'GP_CAST', 'GP_HEAL', 'GP_INT', 'GP_MAP', 'GP_PAUSE', 'GP_OK', 'GP_BACK', 'GP_CLAW', 'GP_ARM', 'GP_SONG', 'GP_SKILL', 'GP_CREST', 'GP_STAR',
  // the d-pad alone, edge-detected like everything else — see pollGamepad
  'GP_PL', 'GP_PR', 'GP_PU', 'GP_PD'];
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
const PAD_ACTIONS = ['JUMP', 'ATK', 'STAR', 'DASH', 'CAST', 'ARM', 'SONG', 'CLAW', 'HEAL', 'INT', 'MAP', 'SKILL', 'CREST', 'PAUSE'];
const PAD_DEFAULT = {
  JUMP: 0, ATK: 2, INT: 1, HEAL: 3,
  DASH: 5,        // R1
  CAST: 7,        // R2 — fire the suit
  ARM: 4,         // L1 — change suit
  SONG: 6,        // L2 — the Song
  STAR: 11,       // R3 — throw a shuriken
  CLAW: 10,       // L3
  MAP: 8,         // Share
  // THE NEURAL TREE WAS ON THE GUIDE BUTTON, WHICH IS NOT OURS TO USE.
  //
  // Button 16 is the PS / Xbox Guide button. Windows, Steam and the Game Bar
  // all grab it before a page ever sees it, and the Gamepad spec does not even
  // require a pad to report it — so on a controller the skill tree was not
  // "hard to find", it was UNREACHABLE, and the game still cheerfully told the
  // player to go and open it.
  //
  // Every real button is spoken for (four faces, four shoulders, two sticks,
  // View, Options), so rather than steal one from combat this is honestly
  // unbound and the route is Options ▸ Skills — which has always worked. It
  // stays remappable for anyone who would rather give up a button for it, and
  // padHowTo() below makes sure the game says the right thing either way.
  SKILL: -1,
  CREST: -1,      // unbound by default; remap it if you want it on the pad
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
// HOW DO I OPEN THIS? — answered for whatever the player is actually holding.
//
// The game knew four different ways to reach a screen and told the player none
// of them. Worse, it told everyone the KEYBOARD way: "open SKILLS" is useless
// advice on a controller, and the controller had no button for it at all.
//
// One function, asked wherever the game gives directions, so a prompt can never
// again describe a control the player does not have. Screens that no longer sit
// on a button of their own name their route through the pause menu instead,
// which is a real answer rather than a shrug.
function howToOpen(action, viaPause) {
  if (typeof PAD !== 'undefined' && PAD && PAD.on) {
    const b = PAD.map[action];
    if (b != null && b >= 0) return padLabel(b);
    return padLabel(PAD.map.PAUSE) + ' ▸ ' + (viaPause || action);
  }
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled)
    return '☰ ▸ ' + (viaPause || action);
  const codes = KEYB[action] || [];
  const k = codes.find(c => /^Key|^Tab$|^Escape$|^Enter$/.test(c));
  return k ? k.replace(/^Key/, '') : (viaPause || action);
}
// The same answer, phrased as an instruction rather than as a key. howToOpen
// returns the bare button — "T" — which is what the HUD was printing, and a
// letter on its own is a puzzle, not a prompt: the player who reported this had
// been carrying IQ for an hour without ever finding the Neural Tree. Say the
// button AND the door it opens. When the action has no button of its own the
// answer is already a route ("Start ▸ Skills") and naming it twice is worse.
function howToOpenNamed(action, name) {
  const how = howToOpen(action, name);
  return how.indexOf(name) >= 0 ? how : how + ' — ' + name;
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
  try { purifyGesture(); } catch (er) {}
  padConnected(true, e.gamepad);
});
addEventListener('gamepaddisconnected', () => padConnected(false, null));

// WHY A CONTROLLER CAN BE PLUGGED IN AND STILL NOT EXIST.
//
// Chromium does not hand a page its gamepads until the page has been
// interacted with — the same user-activation gate that keeps audio silent. On
// the web that gate is always satisfied early, because the "tap for sound"
// badge makes the player click before they get anywhere. In the desktop shell
// we deliberately removed the need to click (the score starts with the
// picture), and the unintended consequence was that a player who only ever
// touches a controller never grants activation, so navigator.getGamepads()
// keeps returning an empty rack and the game truthfully reports no pad. The
// shell now grants that activation itself on load; this records what was
// actually seen so the failure is never invisible again.
const PAD_DIAG = { api: !!navigator.getGamepads, slots: 0, live: 0, seen: '' };
function padDiag() {
  if (!PAD_DIAG.api) return 'no gamepad API in this browser';
  if (PAD_DIAG.live) return '';
  return PAD_DIAG.seen
    ? 'last seen: ' + PAD_DIAG.seen + ' — press a button on it'
    : 'no controller detected (' + PAD_DIAG.slots + ' slots) — press a button on it';
}
// IS THIS PAD ALIVE, OR IS IT A CORPSE THE BROWSER HAS NOT BURIED?
//
// After a disconnect Chromium can leave a dead object in the rack: `connected`
// is false, `buttons` is still a full array of seventeen entries, and nothing
// in it will ever move again. This test used to be "has buttons" — written to
// survive Bluetooth stacks that flap `connected` on a pad that is plainly
// working — and the cost of that was a disconnect/reconnect leaving PAD.on
// stuck TRUE against the corpse. Which meant, all at once: the touch controls
// hidden (they are hidden BECAUSE a pad is attached), no pad input arriving,
// and the Mind Nodes reading pad-only codes that could never fire. The game was
// unplayable and there was no way out of it from inside the game.
//
// So `connected` is believed when it is true, and when it is false the pad has
// to PROVE it is alive: a pressed button, a deflected stick, or a timestamp
// that is still advancing. A corpse proves none of those and is dropped.
const PAD_STAMP = {};
function padAlive(pd) {
  if (!pd) return false;
  const k = pd.index == null ? 'x' : pd.index;
  const ts = pd.timestamp || 0;
  const moved = PAD_STAMP[k] != null && ts > PAD_STAMP[k];
  PAD_STAMP[k] = ts;
  if (pd.connected) return true;
  if (pd.buttons && pd.buttons.some(bt => bt && (bt.pressed || bt.value > 0.4))) return true;
  if (pd.axes && pd.axes.some(a => Math.abs(a) > 0.4)) return true;
  return moved;
}
// THE WAY BACK, which has to exist whatever else is wrong. If the game ever
// believes in a controller that is not there, the player's own hand on the
// screen is the correction — and it must work even though the touch layer is
// deliberately pointer-transparent in pad mode, which is why this listens on
// the window and captures. A pad genuinely in use keeps its mode: only silence
// for three seconds lets a touch take it back.
addEventListener('touchstart', () => {
  if (typeof PAD === 'undefined' || !PAD.on) return;
  if (performance.now() - (PAD.lastInput || 0) < 3000) return;
  padConnected(false, null);
}, { passive: true, capture: true });
function pollGamepad() {
  if (!navigator.getGamepads) return;
  let gp = null;
  const rack = navigator.getGamepads();
  PAD_DIAG.slots = rack.length; PAD_DIAG.live = 0;
  for (const pd of rack) if (pd) PAD_DIAG.live++;
  for (const pd of rack) if (padAlive(pd)) { gp = pd; break; }
  if (gp && gp.id) PAD_DIAG.seen = gp.id.length > 40 ? gp.id.slice(0, 40) + '…' : gp.id;
  if (gp && !PAD.on) padConnected(true, gp);
  else if (!gp && PAD.on) padConnected(false, null);
  // the connect event does not always carry the pad (and some browsers fire a
  // bare event), so learn the identity from the poll the moment it is available
  if (gp && gp.id && PAD.id !== gp.id) { PAD.id = gp.id; PAD.kind = padKindOf(gp.id); }
  PAD.gp = gp;                       // live handle for rumble
  const st = {};
  if (gp) {
    const b = gp.buttons, ax = gp.axes || [];
    const P = i => i >= 0 && b[i] && (b[i].pressed || b[i].value > 0.4);
    const A0 = ax[0] || 0, A1 = ax[1] || 0;
    // movement: left stick and d-pad both, always
    st.GP_L = P(14) || A0 < -0.4; st.GP_R = P(15) || A0 > 0.4;
    st.GP_U = P(12) || A1 < -0.4; st.GP_D = P(13) || A1 > 0.4;
    // ...and the D-PAD ON ITS OWN, because a stick is not a d-pad.
    //
    // For running around, merging them is right: nobody cares which they used.
    // For picking one of four answers it is wrong, and the Mind Nodes are where
    // it showed. A stick pushed up-left crosses the 0.4 threshold on BOTH axes,
    // so the puzzle sees LEFT and UP together and answers with whichever the
    // if-chain tests first; rolling from one direction to the next passes
    // through the diagonal and fires an answer nobody chose. In a memory
    // sequence a wrong answer costs the attempt, so the fight the player was
    // having was with the hardware.
    st.GP_PL = P(14); st.GP_PR = P(15); st.GP_PU = P(12); st.GP_PD = P(13);
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
  let fresh = false;
  for (const code of GP_CODES) {
    const on = !!st[code];
    if (on) { keys[code] = 1; if (!GP_PREV[code]) { keysP[code] = 1; fresh = true; } }
    else keys[code] = 0;
    GP_PREV[code] = on;
  }
  // A PAD PRESS IS NOT A USER GESTURE, and that is a browser rule we cannot
  // argue with: audio stays locked until a click, tap or keypress. Somebody
  // playing entirely on a controller therefore got a silent game and no way to
  // fix it, because the "tap for sound" badge was only ever drawn over the
  // opening film — by the time they were playing there was nothing on screen
  // saying what was wrong. Two halves to the answer: try anyway (it costs
  // nothing, and it DOES work once the page has any activation at all, which is
  // common — clicking the window to focus it is enough), and keep the badge up
  // during play so the one tap that is needed is asked for. See drawSoundChip.
  // when the pad last did anything at all — the touch escape hatch above needs
  // to tell "in use" from "listed but gone"
  if (fresh) PAD.lastInput = performance.now();
  if (fresh && typeof audioOn === 'function') audioOn();
}
addEventListener('keydown', e => {
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys[e.code] = 1; keysP[e.code] = 1; }
  audioOn();
  try { purifyGesture(); } catch (er) {}
});
addEventListener('keyup', e => { keys[e.code] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
// THE ANDROID BACK BUTTON. In an app it is a real button on the device, and
// its default behaviour is to close the app — which, mid-boss, is not a back
// button, it is a quit button. It now means what BACK means everywhere else in
// this game: leave the screen you are on, and pause the game if you are in it.
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins
    && window.Capacitor.Plugins.App) {
  try {
    window.Capacitor.Plugins.App.addListener('backButton', () => {
      if (typeof G === 'undefined') return;
      if (G.state === 'PLAY') { G.state = 'PAUSE'; G.pauseIdx = 0; if (typeof sfx === 'function') sfx('ui'); }
      else if (G.state === 'MENU') { /* the title screen is the floor: stay */ }
      else { keys.VBACK = 1; keysP.VBACK = 1; setTimeout(() => { keys.VBACK = 0; }, 60); }
    });
  } catch (e) {}
}
function inD(n) { return KEYB[n].some(c => keys[c]); }
function inP(n) { return KEYB[n].some(c => keysP[c]); }
function clearP() {
  for (const k in keysP) keysP[k] = 0;
  // ...and release the touch taps queued this frame — a tap is not a hold
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.tapRel && TOUCH.tapRel.length) {
    for (const c2 of TOUCH.tapRel) keys[c2] = 0;
    TOUCH.tapRel.length = 0;
  }
}

// ---------- gamepad rumble -------------------------------------------------
// Dual-rumble haptics (Chrome/Edge vibrationActuator; hapticActuators pulse
// as the fallback). Newer effects simply replace older ones.
// ---------------------------------------------------------------------------
// ROAR SHOCKWAVES: the sound of a roar made visible — expanding rings of
// pressure with sound-ticks riding them and a core flash at the throat.
// The caller sustains the tremble (cam.shake + rumble) while these fly.
// ---------------------------------------------------------------------------
const ROARFX = [];
function roarWave(x, y, col) {
  for (let i = 0; i < 3; i++) ROARFX.push({ x, y, t: -i * 0.12, col });
  ROARFX.push({ x, y, t: 0, col, flash: true });
}
function updateRoarFX(dt) {
  for (let i = ROARFX.length - 1; i >= 0; i--) {
    ROARFX[i].t += dt;
    if (ROARFX[i].t > (ROARFX[i].flash ? 0.24 : 0.9)) ROARFX.splice(i, 1);
  }
}
function drawRoarFX(c) {
  for (const r of ROARFX) {
    if (r.t < 0) continue;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (r.flash) {
      // the throat flash: one hard pulse of the roar's own color
      const k = r.t / 0.24;
      c.globalAlpha = (1 - k) * 0.5;
      const g = c.createRadialGradient(r.x, r.y, 2, r.x, r.y, 26 + k * 110);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, r.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(r.x, r.y, 26 + k * 110, 0, 7); c.fill();
    } else {
      // a pressure ring: grounded ellipse, thick when young, with short
      // sound-ticks riding its rim
      const k = r.t / 0.9, rad = 26 + k * 640;
      c.globalAlpha = (1 - k) * 0.65;
      c.strokeStyle = r.col; c.lineWidth = 2 + (1 - k) * 8;
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * 0.8, 0, 0, 7); c.stroke();
      c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + k * 1.6;
        const cx2 = r.x + Math.cos(a) * rad, cy2 = r.y + Math.sin(a) * rad * 0.8;
        c.beginPath();
        c.moveTo(cx2, cy2);
        c.lineTo(cx2 + Math.cos(a) * 11, cy2 + Math.sin(a) * 9);
        c.stroke();
      }
    }
    c.restore();
  }
}

function padRumble(strong, weak, ms) {
  if (!PAD.on || !PAD.gp) return;
  try {
    const act = PAD.gp.vibrationActuator || (PAD.gp.hapticActuators && PAD.gp.hapticActuators[0]);
    if (!act) return;
    if (act.playEffect) {
      act.playEffect('dual-rumble', {
        duration: Math.min(1000, ms || 100),
        strongMagnitude: clamp(strong, 0, 1),
        weakMagnitude: clamp(weak, 0, 1),
      });
    } else if (act.pulse) act.pulse(clamp(Math.max(strong, weak), 0, 1), Math.min(1000, ms || 100));
  } catch (e) {}
}
const cam = { x: 0, y: 0, shake: 0 };
let prevShake = 0;
function updateCam(px, py, rw, rh, dt) {
  // look-ahead in the facing direction; snappier horizontally than vertically
  const lead = (typeof player !== 'undefined' && player && !player.dead) ? player.face * 65 : 0;
  const tx = clamp(px - 480 + lead, 0, Math.max(0, rw - 960));
  const ty = clamp(py - 300, 0, Math.max(0, rh - 540));
  cam.x = lerp(cam.x, tx, 1 - Math.pow(0.0002, dt));
  cam.y = lerp(cam.y, ty, 1 - Math.pow(0.0035, dt));
  // every screen shake is also felt in the hands: boss slams, roars,
  // explosions and heavy landings all raise cam.shake, so one hook here
  // turns the whole game's impact language into haptics
  if (cam.shake > prevShake + 2.5)
    padRumble(clamp(cam.shake / 13, 0.15, 1), clamp(cam.shake / 9, 0.2, 1), 60 + cam.shake * 16);
  prevShake = cam.shake;
  cam.shake = Math.max(0, cam.shake - dt * 22);
}
function camSX() { return cam.x + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }
function camSY() { return cam.y + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }

let parts = [];
function addPart(x, y, vx, vy, life, color, size, grav, glow) {
  // the budget is the device's, not the effect's — every burst in the game asks
  // for as many as it wants and gets as many as this machine can draw
  if (parts.length > (typeof QUAL !== 'undefined' ? QUAL.parts : 600)) return;
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
  // Canvas2D shadowBlur is a per-draw blur with no batching. Six hundred glowing
  // particles is six hundred blurs, and on a phone that alone is the frame.
  const glowOK = typeof QUAL === 'undefined' || QUAL.glow;
  for (const p of parts) {
    c.globalAlpha = Math.max(0, p.life / p.life0);
    if (p.glow && glowOK) { c.shadowColor = p.color; c.shadowBlur = 10; }
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
